import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import BookCar from "./pages/BookCar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import DriverRegister from "./pages/DriverRegister";
import DriverDashboard from "./pages/DriverDashboard";
import SeatBooking from "./pages/SeatBooking";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentGateway from "./pages/PaymentGateway";
import DriverTrips from "./pages/DriverTrips";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          {/* =========================
              NAVBAR
          ========================== */}
          <Navbar />

          {/* =========================
              ROUTES
          ========================== */}
          <Routes>
            {/* =========================
                PUBLIC ROUTES
            ========================== */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/cars"
              element={<Cars />}
            />

            <Route
              path="/cars/:id"
              element={<CarDetails />}
            />

            <Route
              path="/seat-rides"
              element={<SeatBooking />}
            />

            {/* =========================
                AUTH ROUTES
            ========================== */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* =========================
                PROTECTED BOOKING ROUTE
            ========================== */}

            <Route
              path="/book/:id"
              element={
                <ProtectedRoute>
                  <BookCar />
                </ProtectedRoute>
              }
            />

            {/* =========================
                PROTECTED USER ROUTES
            ========================== */}

            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/driver-register"
              element={
                <ProtectedRoute>
                  <DriverRegister />
                </ProtectedRoute>
              }
            />

            <Route
              path="/driver-dashboard"
              element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/driver-trips"
              element={
                <ProtectedRoute>
                  <DriverTrips />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute>
                  <PaymentGateway />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* =========================
                FALLBACK
            ========================== */}

            <Route
              path="*"
              element={<Home />}
            />
          </Routes>

          {/* =========================
              FOOTER
          ========================== */}

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;