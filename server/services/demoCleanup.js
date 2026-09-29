const mongoose = require("mongoose");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Car = require("../models/Car");
const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const Payment = require("../models/Payment");
const DriverLedger = require("../models/DriverLedger");
const ScheduledRide = require("../models/ScheduledRide");
const SeatBooking = require("../models/SeatBooking");
const AuditLog = require("../models/AuditLog");

const ids = (docs) => docs.map((doc) => doc._id);
const strIds = (docs) => new Set(ids(docs).map(String));
const inIds = (values) => values.length ? { $in: values } : { $in: [] };

async function buildDemoCleanupPlan() {
  const [users, cars, bookings, rides, auditLogs, possibleSeedVehicles, possibleSeedUsers, possibleSeedRides] = await Promise.all([
    User.find({ dataOrigin: "demo", role: { $ne: "admin" } }).select("name email role createdAt").lean(),
    Car.find({ dataOrigin: "demo" }).select("name brand model registrationNumber driver available createdAt").lean(),
    Booking.find({ dataOrigin: "demo" }).select("user car driver bookingStatus totalAmount createdAt").lean(),
    ScheduledRide.find({ dataOrigin: "demo" }).select("driver car pickupPoint destination departureAt status").lean(),
    AuditLog.find({ dataOrigin: "demo" }).select("action entityType entityId createdAt").lean(),
    Car.find({ dataOrigin: { $in: ["legacy", null] }, $or: [
      { model: "Ertiga", year: 2023, location: "Chikhli, Maharashtra" },
      { model: "Creta", year: 2024, location: "Aurangabad, Maharashtra" },
      { model: "Innova Crysta", year: 2023, location: "Pune, Maharashtra" },
      { model: "Swift", year: 2024, location: "Mumbai, Maharashtra" },
      { model: "City", year: 2023, location: "Bengaluru, Karnataka" },
      { model: "Scorpio-N", year: 2024, location: "Aurangabad, Maharashtra" },
    ] }).select("name brand model year location registrationNumber").lean(),
    User.find({ email: "driver@rideon.com", role: "driver", dataOrigin: { $in: ["legacy", null] } }).select("name email role").lean(),
    ScheduledRide.find({ dataOrigin: { $in: ["legacy", null] }, $or: [
      { pickupPoint: "Pune, Swargate", destination: "Mumbai, Dadar" },
      { pickupPoint: "Chikhli, Bus Stand", destination: "Aurangabad, CIDCO" },
      { pickupPoint: "Chikhli, Gandhi Chowk", destination: "Pune, Shivajinagar" },
    ] }).select("pickupPoint destination departureAt driver car").lean(),
  ]);
  const demoUserIds = ids(users);
  const demoCarIds = ids(cars);
  const demoBookingIds = ids(bookings);
  const demoRideIds = ids(rides);
  const drivers = await Driver.find({ $or: [{ dataOrigin: "demo" }, { user: inIds(demoUserIds) }] }).select("user mobile status").lean();
  const demoDriverIds = ids(drivers);
  const demoDriverSet = strIds(drivers);
  const demoUserSet = strIds(users);
  const demoCarSet = strIds(cars);
  const demoBookingSet = strIds(bookings);
  const demoRideSet = strIds(rides);

  const [trips, payments, ledgers, seatBookings, allBookings, allRides, allSeats, allTrips, allLedgers, allCars, allDrivers, userAuditLogs] = await Promise.all([
    Trip.find({ booking: inIds(demoBookingIds) }).select("booking driver status").lean(),
    Payment.find({ booking: inIds(demoBookingIds) }).select("booking amount status method").lean(),
    DriverLedger.find({ booking: inIds(demoBookingIds) }).select("booking driver grossAmount settlementStatus").lean(),
    SeatBooking.find({ ride: inIds(demoRideIds), user: inIds(demoUserIds) }).select("ride user fare bookingStatus").lean(),
    Booking.find({ $or: [{ car: inIds(demoCarIds) }, { user: inIds(demoUserIds) }, { driver: inIds(demoDriverIds) }] }).select("_id car user driver dataOrigin").lean(),
    ScheduledRide.find({ $or: [{ car: inIds(demoCarIds) }, { driver: inIds(demoDriverIds) }] }).select("_id car driver dataOrigin").lean(),
    SeatBooking.find({ $or: [{ ride: inIds(demoRideIds) }, { user: inIds(demoUserIds) }] }).select("_id ride user dataOrigin").lean(),
    Trip.find({ driver: inIds(demoDriverIds) }).select("_id booking driver dataOrigin").lean(),
    DriverLedger.find({ driver: inIds(demoDriverIds) }).select("_id booking driver dataOrigin").lean(),
    Car.find({ driver: inIds(demoDriverIds) }).select("_id driver dataOrigin").lean(),
    Driver.find({ user: inIds(demoUserIds) }).select("_id user dataOrigin").lean(),
    AuditLog.find({ actor: inIds(demoUserIds), dataOrigin: { $ne: "demo" } }).select("_id actor action").lean(),
  ]);

  const blockedUsers = new Set();
  const blockedCars = new Set();
  const blockedDrivers = new Set();
  const blockedRides = new Set();
  const conflicts = [];
  const conflict = (type, doc, reason) => conflicts.push({ type, id: String(doc._id), reason });
  const safeRides = rides.filter((ride) => {
    const hasRealPassenger = allSeats.some((seat) => String(seat.ride) === String(ride._id) && !demoUserSet.has(String(seat.user)));
    if (hasRealPassenger) {
      blockedDrivers.add(String(ride.driver));
      blockedCars.add(String(ride.car));
    }
    return !hasRealPassenger;
  });
  const safeRideSet = strIds(safeRides);
  const safeSeats = seatBookings.filter((seat) => safeRideSet.has(String(seat.ride)) && demoUserSet.has(String(seat.user)));
  const demoTripSet = strIds(trips);
  const demoSeatSet = strIds(safeSeats);

  for (const booking of allBookings) {
    if (demoBookingSet.has(String(booking._id))) continue;
    const reason = `Unmarked booking ${booking._id} references a demo record; preserved for review`;
    if (demoCarSet.has(String(booking.car))) { blockedCars.add(String(booking.car)); conflict("vehicle", booking, reason); }
    if (demoUserSet.has(String(booking.user))) { blockedUsers.add(String(booking.user)); conflict("user", booking, reason); }
    if (demoDriverSet.has(String(booking.driver))) { blockedDrivers.add(String(booking.driver)); conflict("driver", booking, reason); }
  }
  for (const ride of allRides) {
    if (demoRideSet.has(String(ride._id))) continue;
    const reason = `Unmarked scheduled ride ${ride._id} references a demo record; preserved for review`;
    if (demoCarSet.has(String(ride.car))) { blockedCars.add(String(ride.car)); conflict("vehicle", ride, reason); }
    if (demoDriverSet.has(String(ride.driver))) { blockedDrivers.add(String(ride.driver)); conflict("driver", ride, reason); }
  }
  for (const seat of allSeats) {
    if (demoSeatSet.has(String(seat._id))) continue;
    const reason = `Unmarked seat booking ${seat._id} references a demo ride/user; preserved for review`;
    if (demoRideSet.has(String(seat.ride))) { blockedRides.add(String(seat.ride)); conflict("ride", seat, reason); }
    if (demoUserSet.has(String(seat.user))) { blockedUsers.add(String(seat.user)); conflict("user", seat, reason); }
  }
  for (const trip of allTrips) {
    if (demoTripSet.has(String(trip._id))) continue;
    if (demoDriverSet.has(String(trip.driver))) { blockedDrivers.add(String(trip.driver)); conflict("driver", trip, `Unmarked trip ${trip._id} references a demo driver; preserved for review`); }
  }
  for (const ledger of allLedgers) {
    if (demoLedgerSet.has(String(ledger._id))) continue;
    if (demoDriverSet.has(String(ledger.driver))) { blockedDrivers.add(String(ledger.driver)); conflict("driver", ledger, `Unmarked ledger ${ledger._id} references a demo driver; preserved for review`); }
  }
  for (const car of allCars) {
    if (!demoCarSet.has(String(car._id))) {
      blockedDrivers.add(String(car.driver));
      conflict("driver", car, `Unmarked vehicle ${car._id} references a demo driver; preserved for review`);
    }
  }

  // A user is removable only when every associated profile/activity is in the explicit demo deletion plan.
  for (const driver of allDrivers) {
    if (!demoDriverSet.has(String(driver._id))) {
      const user = String(driver.user);
      blockedUsers.add(user);
      conflict("user", driver, `Driver profile ${driver._id} is not explicitly demo-tagged; preserved`);
    }
  }
  for (const log of userAuditLogs) {
    blockedUsers.add(String(log.actor));
    conflict("user", log, `Non-demo audit log ${log._id} references this user; preserved`);
  }
  for (const driver of drivers) {
    if (blockedDrivers.has(String(driver._id))) blockedUsers.add(String(driver.user));
  }

  const safeCars = cars.filter((car) => !blockedCars.has(String(car._id)));
  const safeDrivers = drivers.filter((driver) => !blockedDrivers.has(String(driver._id)));
  const safeUsers = users.filter((user) => !blockedUsers.has(String(user._id)) && user.role !== "admin");
  const safeRidesFinal = safeRides.filter((ride) => !blockedRides.has(String(ride._id)));
  const safeRideFinalSet = strIds(safeRidesFinal);
  const safeSeatsFinal = safeSeats.filter((seat) => safeRideFinalSet.has(String(seat.ride)));

  const groups = {
    demoUsers: safeUsers.map((doc) => ({ id: String(doc._id), label: `${doc.name} <${doc.email}>`, role: doc.role })),
    demoDrivers: safeDrivers.map((doc) => ({ id: String(doc._id), label: `${doc.mobile} (${doc.status})`, userId: String(doc.user) })),
    demoVehicles: safeCars.map((doc) => ({ id: String(doc._id), label: `${doc.name} · ${doc.registrationNumber || "no registration"}` })),
    demoBookings: bookings.map((doc) => ({ id: String(doc._id), label: `${doc.bookingStatus} · ${doc.totalAmount}`, userId: String(doc.user), carId: String(doc.car) })),
    demoTrips: trips.map((doc) => ({ id: String(doc._id), label: doc.status, bookingId: String(doc.booking) })),
    demoPayments: payments.map((doc) => ({ id: String(doc._id), label: `${doc.status} · ${doc.amount}`, bookingId: String(doc.booking) })),
    demoLedgerEntries: ledgers.map((doc) => ({ id: String(doc._id), label: `${doc.settlementStatus} · ${doc.grossAmount}`, bookingId: String(doc.booking) })),
    demoRides: safeRidesFinal.map((doc) => ({ id: String(doc._id), label: `${doc.pickupPoint} → ${doc.destination}`, departureAt: doc.departureAt })),
    demoSeatBookings: safeSeatsFinal.map((doc) => ({ id: String(doc._id), label: `${doc.bookingStatus} · ${doc.fare}`, rideId: String(doc.ride), userId: String(doc.user) })),
    demoAuditRecords: auditLogs.map((doc) => ({ id: String(doc._id), label: `${doc.action} · ${doc.entityType}` })),
    manualReview: [
      ...possibleSeedVehicles.map((doc) => ({ id: String(doc._id), type: "vehicle", label: `${doc.brand} ${doc.model} (${doc.year}) · ${doc.location}`, reason: "Matches a development seed fingerprint but has no explicit provenance; not eligible for automatic deletion." })),
      ...possibleSeedUsers.map((doc) => ({ id: String(doc._id), type: "user", label: `${doc.name} <${doc.email}>`, reason: "Matches the seed driver's account identifier but has no explicit provenance; preserve and review manually." })),
      ...possibleSeedRides.map((doc) => ({ id: String(doc._id), type: "scheduled ride", label: `${doc.pickupPoint} → ${doc.destination}`, reason: "Matches a seed route but has no explicit provenance; not eligible for automatic deletion." })),
    ],
  };
  const deletion = {
    payments: payments.map((doc) => doc._id),
    trips: trips.map((doc) => doc._id),
    ledgers: ledgers.map((doc) => doc._id),
    seatBookings: safeSeatsFinal.map((doc) => doc._id),
    bookings: bookings.map((doc) => doc._id),
    rides: safeRidesFinal.map((doc) => doc._id),
    cars: ids(safeCars),
    drivers: ids(safeDrivers),
    users: ids(safeUsers),
    auditLogs: auditLogs.map((doc) => doc._id),
  };
  const counts = Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.length]));
  counts.manualReview = groups.manualReview.length;
  return { generatedAt: new Date().toISOString(), counts, groups, conflicts, deletion };
}

async function deleteDemoRecords(actorId = null) {
  const plan = await buildDemoCleanupPlan();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const removeIds = async (Model, values) => {
        if (values.length) await Model.deleteMany({ _id: { $in: values } }, { session });
      };
      await removeIds(Payment, plan.deletion.payments);
      await removeIds(Trip, plan.deletion.trips);
      await removeIds(DriverLedger, plan.deletion.ledgers);
      await removeIds(SeatBooking, plan.deletion.seatBookings);
      await removeIds(Booking, plan.deletion.bookings);
      await removeIds(ScheduledRide, plan.deletion.rides);
      await removeIds(Car, plan.deletion.cars);
      await removeIds(Driver, plan.deletion.drivers);
      await removeIds(User, plan.deletion.users);
      await removeIds(AuditLog, plan.deletion.auditLogs);
      if (actorId) {
        await AuditLog.create([{
          actor: actorId,
          action: "DEMO_TEST_DATA_CLEANED",
          entityType: "DemoCleanup",
          entityId: actorId,
          dataOrigin: "production",
          newValue: plan.counts,
        }], { session });
      }
    });
  } finally {
    await session.endSession();
  }
  return plan;
}

module.exports = { buildDemoCleanupPlan, deleteDemoRecords };
