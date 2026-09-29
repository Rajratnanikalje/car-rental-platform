const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");
const Car = require("../models/Car");

async function ensureDefaultAdmin() {
  const rawEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!rawEmail?.trim() || !password) throw new Error("Admin bootstrap requires ADMIN_EMAIL and ADMIN_PASSWORD environment variables");
  const email = rawEmail.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error("ADMIN_EMAIL belongs to a non-admin account; refusing automatic role promotion");
    }

    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUser = await User.create({
    name: "RideOn Admin",
    email,
    password: hashedPassword,
    role: "admin",
  });
  console.log("Admin account created from configured environment credentials");

  return adminUser;
}

async function ensurePlatformSettings() {
  const payload = {
    key: "platform",
    commissionPercentage: 10,
    fixedCommission: 200,
    platformFee: 50,
    isActive: true,
  };

  const settings = await SystemSetting.findOneAndUpdate(
    { key: "platform" },
    payload,
    { upsert: true, new: true, runValidators: true }
  );

  console.log("Platform settings ensured ✅");

  return settings;
}

async function ensureDefaultCars() {
  const existingCount = await Car.countDocuments();
  if (existingCount > 0) {
    return;
  }

  const defaultCars = [
    {
      name: "Ertiga ZXi",
      brand: "Maruti Suzuki",
      model: "Ertiga",
      year: 2023,
      category: "MUV",
      transmission: "Manual",
      fuelType: "Petrol",
      seats: 7,
      pricePerDay: 2800,
      pricePerKm: 12,
      includedKm: 300,
      location: "Chikhli, Maharashtra",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=70",
      description: "Spacious 7-seater MUV perfect for family vacations and outstation journeys with excellent mileage.",
      features: ["AC", "7 Seater", "Touchscreen Display", "Power Steering", "Rear Parking Camera", "Bluetooth"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
    {
      name: "Creta SX",
      brand: "Hyundai",
      model: "Creta",
      year: 2024,
      category: "SUV",
      transmission: "Automatic",
      fuelType: "Diesel",
      seats: 5,
      pricePerDay: 3500,
      pricePerKm: 14,
      includedKm: 300,
      location: "Aurangabad, Maharashtra",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=70",
      description: "Premium 5-seater compact SUV offering panoramic sunroof, connected car tech, and supreme road presence.",
      features: ["Sunroof", "Automatic", "Diesel", "Ventilated Seats", "Cruise Control", "Apple CarPlay"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
    {
      name: "Innova Crysta 2.4 VX",
      brand: "Toyota",
      model: "Innova Crysta",
      year: 2023,
      category: "MUV",
      transmission: "Manual",
      fuelType: "Diesel",
      seats: 7,
      pricePerDay: 4200,
      pricePerKm: 16,
      includedKm: 300,
      location: "Pune, Maharashtra",
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=70",
      description: "The gold standard of highway comfort. Unmatched ride quality, spacious captain seats, and bulletproof reliability.",
      features: ["7 Seater Captain Chairs", "Highway Cruiser", "Rear AC Vents", "7 Airbags", "Eco & Power Modes"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
    {
      name: "Swift ZXi+",
      brand: "Maruti Suzuki",
      model: "Swift",
      year: 2024,
      category: "Hatchback",
      transmission: "Manual",
      fuelType: "Petrol",
      seats: 5,
      pricePerDay: 1800,
      pricePerKm: 10,
      includedKm: 250,
      location: "Mumbai, Maharashtra",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=70",
      description: "Agile, peppy, and economical city hatchback with great fuel efficiency and easy parking.",
      features: ["Keyless Entry", "Climate Control", "Cruise Control", "Fuel Efficient", "Fog Lamps"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
    {
      name: "City 1.5 i-VTEC V",
      brand: "Honda",
      model: "City",
      year: 2023,
      category: "Sedan",
      transmission: "Manual",
      fuelType: "Petrol",
      seats: 5,
      pricePerDay: 3000,
      pricePerKm: 13,
      includedKm: 300,
      location: "Bengaluru, Karnataka",
      image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=70",
      description: "Sophisticated executive sedan with plush cabin space, supreme rear seat comfort, and refined i-VTEC engine.",
      features: ["Leather Seats", "Paddle Shifters", "LaneWatch Camera", "Sunroof", "High Mileage"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
    {
      name: "Scorpio-N Z8L 4x4",
      brand: "Mahindra",
      model: "Scorpio-N",
      year: 2024,
      category: "SUV",
      transmission: "Automatic",
      fuelType: "Diesel",
      seats: 7,
      pricePerDay: 4500,
      pricePerKm: 18,
      includedKm: 300,
      location: "Aurangabad, Maharashtra",
      image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=70",
      description: "Commanding 4x4 D-segment SUV engineered for rugged terrains, western ghats road trips, and all-weather touring.",
      features: ["4x4 Terrain Modes", "Sony 12 Speaker Audio", "Dual Zone AC", "7 Seater", "High Ground Clearance"],
      available: true,
      ownershipType: "company",
      dataOrigin: "demo",
    },
  ];

  await Car.insertMany(defaultCars);
  console.log(`Default production cars seeded (${defaultCars.length} vehicles) ✅`);
}

async function ensureDefaultDriverAndRides() {
  const Driver = require("../models/Driver");
  const ScheduledRide = require("../models/ScheduledRide");

  const driverEmail = process.env.SEED_DRIVER_EMAIL?.trim().toLowerCase();
  const driverPassword = process.env.SEED_DRIVER_PASSWORD;
  if (!driverEmail || !driverPassword) {
    console.log("Demo driver and rides skipped; seed driver credentials are not configured");
    return;
  }
  let driverUser = await User.findOne({ email: driverEmail });

  if (!driverUser) {
    const hashedPassword = await bcrypt.hash(driverPassword, 10);
    driverUser = await User.create({
      name: process.env.SEED_DRIVER_NAME || "Demo Driver",
      email: driverEmail,
      password: hashedPassword,
      phone: process.env.SEED_DRIVER_PHONE || "",
      role: "driver",
      dataOrigin: "demo",
    });
  } else if (driverUser.role !== "driver") {
    throw new Error("SEED_DRIVER_EMAIL belongs to a non-driver account; refusing automatic role promotion");
  }

  let driverDoc = await Driver.findOne({ user: driverUser._id });
  if (!driverDoc) {
    driverDoc = await Driver.create({
      user: driverUser._id,
      dataOrigin: "demo",
      mobile: "+919876543210",
      address: "Chikhli, Buldhana, Maharashtra",
      emergencyContact: { name: "Sunil Patil", mobile: "+919876543211" },
      drivingLicence: {
        number: "MH2820210012345",
        expiryDate: new Date("2030-12-31"),
        documentUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
      },
      identity: {
        documentType: "aadhaar",
        documentNumber: "123456789012",
        documentUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
      },
      payoutAccount: {
        accountHolderName: "Sanjay Patil",
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifsc: "SBIN0001234",
        upiId: "sanjay@upi",
        isVerified: true,
      },
      status: "approved",
    });
    console.log("Default approved driver ensured ✅");
  }

  const rideCount = await ScheduledRide.countDocuments();
  if (rideCount === 0) {
    const ertiga = await Car.findOne({ model: "Ertiga" }) || await Car.findOne();
    const innova = await Car.findOne({ model: "Innova Crysta" }) || await Car.findOne();

    if (ertiga && innova) {
      const now = new Date();
      const tomorrow9am = new Date(now);
      tomorrow9am.setDate(tomorrow9am.getDate() + 1);
      tomorrow9am.setHours(9, 0, 0, 0);

      const dayAfter8am = new Date(now);
      dayAfter8am.setDate(dayAfter8am.getDate() + 2);
      dayAfter8am.setHours(8, 0, 0, 0);

      const dayAfter2pm = new Date(now);
      dayAfter2pm.setDate(dayAfter2pm.getDate() + 2);
      dayAfter2pm.setHours(14, 0, 0, 0);

      const defaultRides = [
        {
          driver: driverDoc._id,
          dataOrigin: "demo",
          car: ertiga._id,
          pickupPoint: "Pune, Swargate",
          destination: "Mumbai, Dadar",
          departureAt: tomorrow9am,
          totalSeats: 6,
          availableSeats: 2,
          pricePerSeat: 500,
          status: "published",
        },
        {
          driver: driverDoc._id,
          dataOrigin: "demo",
          car: innova._id,
          pickupPoint: "Chikhli, Bus Stand",
          destination: "Aurangabad, CIDCO",
          departureAt: dayAfter8am,
          totalSeats: 7,
          availableSeats: 4,
          pricePerSeat: 350,
          status: "published",
        },
        {
          driver: driverDoc._id,
          dataOrigin: "demo",
          car: ertiga._id,
          pickupPoint: "Chikhli, Gandhi Chowk",
          destination: "Pune, Shivajinagar",
          departureAt: dayAfter2pm,
          totalSeats: 6,
          availableSeats: 5,
          pricePerSeat: 650,
          status: "published",
        },
      ];

      await ScheduledRide.insertMany(defaultRides);
      console.log(`Default scheduled seat rides seeded (${defaultRides.length} routes) ✅`);
    }
  }
}

async function seedDefaultData() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo seed data is disabled in production");
  await ensureDefaultAdmin();
  await ensurePlatformSettings();
  await ensureDefaultCars();
  await ensureDefaultDriverAndRides();
}

module.exports = {
  ensureDefaultAdmin,
  ensurePlatformSettings,
  ensureDefaultCars,
  ensureDefaultDriverAndRides,
  seedDefaultData,
};
