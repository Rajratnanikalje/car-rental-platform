import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import CustomerLayout from "./components/CustomerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Customer Pages
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import BookCar from "./pages/BookCar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import DriverRegister from "./pages/DriverRegister";
import SeatBooking from "./pages/SeatBooking";
import PaymentGateway from "./pages/PaymentGateway";

// Unified Customer Portal (KPIs, Live Tracking, Trips, Invoices)
import CustomerPortal from "./pages/customer/CustomerPortal";

// Unified Driver Portal (Status, Jobs, OTP, Photo Evidence, Ledger)
import DriverPortal from "./pages/driver/DriverPortal";

// Admin Control Center
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminSeatRides from "./pages/admin/AdminSeatRides";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminFraudDisputes from "./pages/admin/AdminFraudDisputes";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCms from "./pages/admin/AdminCms";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* =========================
              CUSTOMER WEBSITE (WITH NAVBAR & FOOTER)
          ========================== */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/seat-rides" element={<SeatBooking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/book/:id"
              element={
                <ProtectedRoute>
                  <BookCar />
                </ProtectedRoute>
              }
            />

            {/* Unified Customer Portal */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <CustomerPortal />
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

            {/* Unified Driver Portal */}
            <Route
              path="/driver-dashboard"
              element={
                <ProtectedRoute>
                  <DriverPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-trips"
              element={
                <ProtectedRoute>
                  <DriverPortal />
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
          </Route>

          {/* =========================
              ADMIN PORTAL LOGIN
          ========================== */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* =========================
              ADMIN CONTROL CENTER (DEDICATED LAYOUT & SIDEBAR)
          ========================== */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="trips" element={<AdminTrips />} />
            <Route path="seat-rides" element={<AdminSeatRides />} />
            <Route path="settlements" element={<AdminSettlements />} />
            <Route path="fraud" element={<AdminFraudDisputes />} />
            <Route path="cms" element={<AdminCms />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* =========================
              FALLBACK
          ========================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
