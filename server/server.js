const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const connectDB = require("./config/db");
const { seedDefaultData } = require("./utils/seed");

// Routes
const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const financeRoutes = require("./routes/financeRoutes");
const seatRideRoutes = require("./routes/seatRideRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================
// DATABASE
// =========================

connectDB().then(() => {
  seedDefaultData();
});

// =========================
// SECURITY
// =========================

app.use(helmet());

// =========================
// CORS
// =========================

app.use(
  cors({
    origin: process.env.CLIENT_URL|| "http://localhost:5173",
    credentials: true,
  })
);

// =========================
// BODY PARSER
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// COOKIE PARSER
// =========================

app.use(cookieParser());

// =========================
// RATE LIMITING
// =========================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// =========================
// AUTH ROUTES
// =========================

app.use("/api/auth", authRoutes);

// =========================
// CAR ROUTES
// =========================

app.use("/api/cars", carRoutes);

// =========================
// BOOKING ROUTES
// =========================

app.use("/api/bookings", bookingRoutes);

app.use("/api/drivers", driverRoutes);

app.use("/api/trips", tripRoutes);

app.use("/api/finance", financeRoutes);

app.use("/api/seat-rides", seatRideRoutes);

app.use("/api/payments", paymentRoutes);

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Car Rental API is running 🚗",
  });
});

// =========================
// SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});
