# RideOn Platform - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB running locally or Atlas connection
- npm or yarn

### Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this
MONGODB_URI=mongodb://localhost:27017/rideon
EOF

# Start server
npm run dev
# Server runs at http://localhost:5000
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🧪 Testing Workflows

### 1. Customer Car Booking Flow

**User A (Customer):**
1. Go to `http://localhost:5173`
2. Click "Get Started" → Register as customer
   - Email: customer@test.com
   - Name: Test Customer
   - Password: test123456
3. Go to `/cars` - Browse available cars
4. Click on a car → View details
5. Click "Book Now" → Select dates
6. Complete booking

**User B (Admin):**
1. Register with admin role (need to modify User model initially)
2. Go to `/admin` dashboard
3. See booking in the system

**User C (Driver):**
1. Register as customer first
2. Go to `/driver-register` - Complete driver application
3. Submit all documents
4. Go to `/admin` and approve the driver
5. Once approved, driver can accept bookings

---

### 2. Driver Registration & Verification Flow

**User (Driver):**
1. Register as regular user
2. Navigate to "Become Driver" in navbar
3. Fill driver registration form:
   - Mobile number
   - Address
   - Emergency contact
   - Driving licence (number + expiry + document)
   - Identity (Aadhaar/Passport)
   - Bank account details (saved securely, masked in frontend)
4. Submit application
5. Status: `pending` → Admin reviews → `approved`

**Admin:**
1. Go to `/admin` → Drivers tab
2. See pending driver applications
3. Click "Review" → Change to "under_review"
4. Click "Approve" or "Reject" with reason
5. Approved drivers get `driver` role

---

### 3. Seat Ride Booking Flow

**Driver:**
1. Must be approved driver
2. Go to `/admin` → Publish seat ride (coming soon)
3. Fill: pickup, destination, departure date/time, seats, price

**Customer:**
1. Go to `/seat-rides`
2. Search by location
3. View available rides
4. Click "Book Now"
5. Enter seats, pickup/drop locations
6. Confirm booking - get OTP

**Driver (At Pickup):**
1. View manifest with passenger list
2. Check-in passenger using OTP
3. Passenger appears as "checked_in"

---

### 4. Admin Configuration

**Setup Commission & Settings:**
1. Go to `/admin` dashboard
2. Click "Settings" tab
3. Configure:
   - Commission Percentage (e.g., 20%)
   - Fixed Commission (e.g., ₹50)
   - Platform Fee (e.g., ₹10)
4. Save settings

**View Settlements:**
1. Admin → Settlements tab
2. Filter by status: `pending`, `approved`, `processing`, `paid`
3. View driver earnings breakdown
4. Process settlements

---

### 5. Trip Lifecycle Flow

**Customer Booking:**
```
Booking Created (pending) → Driver Assigned (confirmed) 
→ Driver Marks Arrival → Customer Gets OTP 
→ Trip Start (with odometer photo) → Trip In Progress 
→ Trip Complete (with end odometer) → Settlement Created
```

**Fraud Detection:**
- If end_km < start_km → Flagged as "ODOMETER_DECREASE"
- If distance > 2000 km → Flagged as "UNUSUAL_DISTANCE"
- Missing photos → Flagged appropriately
- Admin reviews flagged trips

---

## 📝 Test User Credentials

Create test users in MongoDB or via API:

### Customer
```
Email: customer@test.com
Password: test123456
Role: user
```

### Driver (After Approval)
```
Email: driver@test.com
Password: test123456
Role: driver
Mobile: 9876543210
```

### Admin
```
Email: admin@test.com
Password: test123456
Role: admin
```

---

## 🔍 Checking Backend Status

### Test Auth Endpoints
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  -c cookies.txt

# Get Profile (requires cookie)
curl -X GET http://localhost:5000/api/auth/profile \
  -b cookies.txt
```

### Test Cars Endpoint
```bash
# Get all cars
curl http://localhost:5000/api/cars

# Get specific car
curl http://localhost:5000/api/cars/{carId}
```

---

## 🐛 Common Issues & Fixes

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Start MongoDB
```bash
# Linux/Mac
brew services start mongodb-community

# Windows
net start MongoDB
```

### JWT Secret Not Set
```
Error: ENOENT: no such file or directory, open '.env'
```
**Fix:** Create `.env` file in server directory with `JWT_SECRET`

### CORS Error in Frontend
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Fix:** Ensure backend CORS is configured for `http://localhost:5173`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:** Kill process on port 5000 or change PORT in .env

---

## 📊 Database Structure

### Key Collections

**Users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (user/driver/admin),
  timestamps
}
```

**Cars**
```javascript
{
  _id: ObjectId,
  name: String,
  brand: String,
  model: String,
  seats: Number,
  pricePerDay: Number,
  pricePerKm: Number,
  includedKm: Number,
  ownershipType: String (company/partner),
  driver: ObjectId (ref: Driver),
  available: Boolean,
  timestamps
}
```

**Bookings**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  car: ObjectId (ref: Car),
  bookingType: String (PRIVATE_CAR/SEAT_RIDE),
  driver: ObjectId (ref: Driver),
  trip: ObjectId (ref: Trip),
  pickupDate: Date,
  returnDate: Date,
  pickupLocation: String,
  totalDays: Number,
  totalKm: Number,
  extraKm: Number,
  rentalAmount: Number,
  extraKmAmount: Number,
  totalAmount: Number,
  bookingStatus: String (pending/confirmed/cancelled/completed),
  paymentStatus: String (pending/paid/failed/refunded),
  paymentMethod: String (cash/online),
  timestamps
}
```

---

## 🎯 Next Development Steps

### High Priority
1. Create admin statistics endpoint (for dashboard overview)
2. Implement driver trip management interface
3. Add vehicle management for drivers
4. Build payment gateway integration

### Medium Priority
5. Real-time notifications system
6. Document upload functionality
7. GPS tracking for trips
8. Receipt/Invoice generation

### Low Priority
9. Advanced analytics dashboard
10. Refund management system
11. Insurance integration
12. Multi-language support

---

## 📱 API Endpoints Reference

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | /auth/register | No | - | Register user |
| POST | /auth/login | No | - | Login user |
| GET | /auth/profile | Yes | User | Get current profile |
| POST | /auth/logout | Yes | User | Logout |
| GET | /cars | No | - | List cars |
| GET | /cars/:id | No | - | Get car details |
| POST | /cars | Yes | Admin | Create car |
| PUT | /cars/:id | Yes | Admin | Update car |
| POST | /bookings | Yes | User | Create booking |
| GET | /bookings/my | Yes | User | Get my bookings |
| GET | /bookings/:id | Yes | User | Get booking details |
| PUT | /bookings/:id/cancel | Yes | User | Cancel booking |
| POST | /drivers/apply | Yes | User | Apply as driver |
| GET | /drivers/me | Yes | Driver | Get my profile |
| GET | /drivers | Yes | Admin | List drivers |
| PUT | /drivers/:id | Yes | Admin | Update driver status |
| PUT | /trips/:bookingId/assign-driver | Yes | Admin | Assign driver |
| GET | /trips/:bookingId/start-code | Yes | User | Get OTP |
| PUT | /trips/:bookingId/arrive | Yes | Driver | Mark arrival |
| PUT | /trips/:bookingId/start | Yes | Driver | Start trip |
| PUT | /trips/:bookingId/complete | Yes | Driver | Complete trip |
| GET | /finance/settings | Yes | Admin | Get settings |
| PUT | /finance/settings | Yes | Admin | Update settings |
| GET | /finance/ledgers | Yes | Admin | List ledgers |
| GET | /finance/driver-ledger | Yes | Driver | My earnings |
| GET | /seat-rides | No | - | List rides |
| GET | /seat-rides/:id | No | - | Get ride details |
| POST | /seat-rides | Yes | Driver | Publish ride |
| POST | /seat-rides/:rideId/bookings | Yes | User | Book seats |
| GET | /seat-rides/:rideId/manifest | Yes | Driver | View passengers |
| PUT | /seat-rides/:bookingId/check-in | Yes | Driver | Check-in |

---

## ✅ Quality Checklist

Before considering complete:
- [x] All models created with proper validation
- [x] All controllers implemented with error handling
- [x] All routes protected with appropriate middleware
- [x] Frontend pages created for major flows
- [x] Authentication system working
- [x] Authorization checks in place
- [x] Financial calculations on backend
- [x] Fraud detection implemented
- [x] Audit logging structure in place
- [ ] Comprehensive testing done
- [ ] Deployment guide created
- [ ] Performance optimization done
- [ ] Security audit completed

---

## 🎓 Learning Resources

- Express.js Security: https://expressjs.com/en/advanced/best-practice-security.html
- MongoDB Best Practices: https://docs.mongodb.com/manual/core/security/
- JWT Auth: https://tools.ietf.org/html/rfc7519
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

**Last Updated:** September 1, 2026  
**Status:** Ready for Testing & Refinement  
**Version:** 2.0 (Complete Implementation)
