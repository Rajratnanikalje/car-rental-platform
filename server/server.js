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
const cmsRoutes = require("./routes/cmsRoutes");
const demoCleanupRoutes = require("./routes/demoCleanupRoutes");
const serviceAreaRoutes = require("./routes/serviceAreaRoutes");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// =========================
// DATABASE
// =========================

connectDB().then(async () => {
  // Never seed demo accounts, vehicles, rides, or pricing on a normal start.
  // Local demos must opt in explicitly; production data is created by admins.
  if (process.env.NODE_ENV !== "production" && process.env.SEED_DEMO_DATA === "true") {
    await seedDefaultData();
  }
});

// =========================
// SECURITY
// =========================

app.use(helmet());

// =========================
// CORS
// =========================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/+$/, "") === normalizedOrigin
      );

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

// =========================
// BODY PARSER
// =========================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// =========================
// COOKIE PARSER
// =========================

app.use(cookieParser());

// =========================
// RATE LIMITING
// =========================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 1000 : 5000,
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

app.use("/api/cms", cmsRoutes);
app.use("/api/service-areas", serviceAreaRoutes);
app.use("/api/admin/demo-cleanup", demoCleanupRoutes);

// Keep unexpected errors consistent with the API contract and do not leak
// implementation details to callers.
app.use((error, req, res, next) => {
  if (error?.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Origin is not allowed" });
  }
  console.error("Unhandled API error:", error);
  return res.status(error.statusCode || 500).json({ success: false, message: "Server error" });
});

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
