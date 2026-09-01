# 🚗 RideOn Platform - Complete Testing Guide

## 📋 Prerequisites

### Backend Running
```bash
cd server
npm run dev
# Server: http://localhost:5000
```

### Frontend Running
```bash
cd client
npm run dev
# Frontend: http://localhost:5173
```

### Database
- MongoDB running on `mongodb://localhost:27017/rideon`

---

## 🧪 Test Flow 1: Customer Booking Workflow

### Step 1: Customer Registration
1. Open `http://localhost:5173`
2. Click "Get Started" → "Register"
3. Fill form:
   - Name: John Doe
   - Email: john@test.com
   - Phone: 9876543210
   - Password: test123456
4. Click Register
5. ✅ Should redirect to Login

### Step 2: Customer Login
1. Go to `/login`
2. Login with:
   - Email: john@test.com
   - Password: test123456
3. ✅ Should redirect to Home

### Step 3: Browse Cars
1. Click "Cars" in navbar
2. ✅ Should see list of cars from API
3. Click on any car card
4. ✅ Should see car details page

### Step 4: Book Car
1. On car details, click "Book Now"
2. Fill booking form:
   - Pickup Date: Select future date
   - Return Date: Select future date (after pickup)
   - Pickup Location: Your Address
   - Payment Method: Cash (or Online)
3. Click "Confirm Booking"
4. ✅ Should redirect to **Payment Gateway**

### Step 5: Payment
**Cash Payment:**
1. Select "Pay with Cash" option
2. Click "Confirm Cash Payment"
3. ✅ Should redirect to "My Bookings"

**Online Payment (Test):**
1. Select "Pay Online" option
2. Click "Pay ₹XXX"
3. ✅ Should show Razorpay modal (or skip in test mode)
4. Click "Skip (Test Only)" button
5. ✅ Should redirect to "My Bookings"

### Step 6: View Booking
1. Go to "My Bookings"
2. ✅ Should see your booking with:
   - Car details
   - Booking dates
   - Total amount
   - Status badge
   - Action buttons: View Car, Pay Now (if pending), Track Trip

---

## 🧪 Test Flow 2: Driver Registration & Verification

### Step 1: Customer to Driver
1. Create a new user or use existing
2. Go to Navbar → "Become Driver"
3. Fill driver registration form:

**Personal Details:**
- Mobile: 9876543210
- Address: Your Address

**Emergency Contact:**
- Name: Family Member
- Mobile: 9999999999

**Driving Licence:**
- Number: DL123456789
- Expiry Date: 2030-12-31
- Document: Upload/Select any image

**Identity Verification:**
- Document Type: Aadhaar
- Document Number: 123456789012
- Document: Upload/Select any image

**Payout Account:**
- Account Holder Name: John Doe
- Bank Name: ICICI Bank
- Account Number: 123456789012
- IFSC: ICIC0000001

4. Click "Submit Application"
5. ✅ Should show success message
6. ✅ Profile page should show driver status as "pending"

### Step 2: Admin Approval
1. Open new browser tab / logout current user
2. Create Admin account:
   - Email: admin@test.com
   - Password: admin123456
   - Role: admin (manually set in MongoDB)

**MongoDB Command:**
```javascript
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)
```

3. Login as admin
4. Click "Admin Panel" in navbar
5. Go to "Drivers" tab
6. ✅ Should see pending driver application
7. Click "Review" button
8. Change status to "under_review"
9. Click "Approve" button
10. ✅ Driver status should change to "approved"

### Step 3: Driver Profile Check
1. Logout admin
2. Login as driver (john@test.com)
3. Go to Profile page
4. ✅ Should show driver status as "approved"
5. Click "Driver Dashboard" in navbar
6. ✅ Should show earnings dashboard

---

## 🧪 Test Flow 3: Trip Management (Driver)

### Step 1: Admin Assigns Driver to Booking

1. Login as admin
2. Need to manually assign driver via MongoDB or API:

**API Call:**
```bash
curl -X PUT http://localhost:5000/api/trips/{bookingId}/assign-driver \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_admin_token" \
  -d '{"driverId":"{driverId}"}'
```

3. OR in MongoDB:
```javascript
// Find booking and update
db.bookings.updateOne(
  { _id: ObjectId("{bookingId}") },
  {
    $set: {
      driver: ObjectId("{driverId}"),
      bookingStatus: "confirmed"
    }
  }
)

// Create trip
db.trips.insertOne({
  booking: ObjectId("{bookingId}"),
  driver: ObjectId("{driverId}"),
  status: "driver_assigned",
  createdAt: new Date()
})
```

### Step 2: Driver Marks Arrival

1. Login as driver
2. Click "My Trips" in navbar
3. ✅ Should see assigned trip with status "Assigned"
4. Click "✓ Mark Arrival" button
5. ✅ Status should change to "Arrived"
6. ✅ Customer gets OTP notification

### Step 3: Customer Gets OTP

1. Logout driver
2. Login as customer (john@test.com)
3. Go to "My Bookings"
4. ✅ Should see "📍 Track Trip" button
5. Click it OR go to `/driver-trips`
6. ✅ Customer sees trip status

### Step 4: Driver Starts Trip

1. Login as driver
2. Go to "My Trips"
3. ✅ Should see "▶ Start Trip" button
4. Click it - Opens modal
5. Fill form:
   - Customer OTP: (manually enter the 6-digit OTP from backend logs or database)
   - Start Odometer: 45000
   - Start Location: Pickup Address
   - Dashboard Photo: Upload any image
6. Click "▶ Start Trip"
7. ✅ Trip status should change to "In Progress"

**To get OTP from Database:**
```javascript
db.trips.findOne({ booking: ObjectId("{bookingId}") })
// Will show otpHash - regenerate OTP via API
```

**Or API to get OTP:**
```bash
curl -X GET http://localhost:5000/api/trips/{bookingId}/start-code \
  -H "Cookie: token=your_customer_token"
```

### Step 5: Driver Completes Trip

1. Login as driver
2. Go to "My Trips"
3. ✅ Should see "⛔ Complete Trip" button
4. Click it - Opens modal
5. Fill form:
   - End Odometer: 45150
   - End Location: Dropoff Address
   - Final Photo: Upload any image
6. Click "✓ Complete Trip"
7. ✅ Trip status should change to "Completed"
8. ✅ Financial ledger created automatically

---

## 🧪 Test Flow 4: Seat Rides (Shared Rides)

### Step 1: Driver Publishes Ride

1. Login as approved driver
2. Click "Shared Rides" in navbar
3. ✅ Should see ride browsing page
4. Click "📍 Publish New Ride" button (or similar)

**Note:** Publish ride UI might need to be added. Use API instead:

```bash
curl -X POST http://localhost:5000/api/seat-rides \
  -H "Content-Type: application/json" \
  -H "Cookie: token=driver_token" \
  -d '{
    "car": "{carId}",
    "pickupPoint": "Central Station",
    "destination": "Airport",
    "departureAt": "2026-09-02T10:00:00Z",
    "totalSeats": 4,
    "pricePerSeat": 500
  }'
```

### Step 2: Customer Books Seat

1. Login as customer (different user)
2. Click "Shared Rides" in navbar
3. ✅ Should see published rides
4. Click "Book Now" on a ride
5. Fill form:
   - Seats: 1
   - Pickup Location: Your Location
   - Destination: Final Destination
   - Payment Method: Cash or Online
6. Click "Confirm Booking"
7. ✅ Should redirect to payment
8. Complete payment
9. ✅ Should show "Check-in OTP" in booking details

### Step 3: Driver Check-in Passenger

1. Login as driver
2. Go to "My Trips" or similar
3. Click manifest/passenger list
4. ✅ Should see passenger with check-in button
5. Click "Check-in" - Opens modal
6. Enter passenger OTP
7. Click "Check-in"
8. ✅ Passenger marked as "checked_in"

---

## 🧪 Test Flow 5: Admin Dashboard

### Step 1: Login as Admin
1. Create admin user with MongoDB
2. Login as admin
3. Click "Admin Panel" in navbar

### Step 2: Overview Tab
✅ Should see 6 stat cards:
- Total Users
- Total Drivers
- Total Vehicles
- Active Trips
- Completed Trips
- Today's Revenue

### Step 3: Drivers Tab
1. Click "Drivers" tab
2. ✅ Should see filter dropdown (all, pending, approved, rejected, suspended)
3. Select "pending"
4. ✅ Should show pending drivers
5. Click driver row - Should show details
6. Approve/Reject buttons should work

### Step 4: Settlements Tab
1. Click "Settlements" tab
2. ✅ Should show ledger entries with:
   - Booking details
   - Driver earnings
   - Commission
   - Settlement status
3. Click settlement row
4. Change status: pending → approved → processing → paid
5. ✅ Status should update

### Step 5: Settings Tab
1. Click "Settings" tab
2. ✅ Should see form with:
   - Commission Percentage: (e.g., 20)
   - Fixed Commission: (e.g., 50)
   - Platform Fee: (e.g., 10)
3. Update values
4. Click "Save Settings"
5. ✅ Settings should save to SystemSetting model

---

## 🧪 Test Flow 6: Settlement & Earnings

### Step 1: View Driver Earnings
1. Login as approved driver
2. Click "Driver Dashboard" in navbar
3. ✅ Should see "Earnings" tab
4. ✅ Should show:
   - Gross Amount (total from trips)
   - Commission Payable (RideOn's cut)
   - Driver Payout (driver's earnings)
5. ✅ Should show ledger history

### Step 2: Admin Processes Settlement
1. Login as admin
2. Go to "Admin Panel" → "Settlements" tab
3. Find driver's ledger entries
4. Click entry and mark "approved"
5. Click again and mark "processing"
6. Click again and mark "paid"
7. ✅ Entry status should be "paid"
8. Settled amount should be removed from driver's pending balance

---

## 🧪 Test Flow 7: Payment Methods

### Test Cash Payment
1. During booking, select "Cash" payment
2. Complete booking
3. In payment gateway, select "Pay with Cash"
4. ✅ Booking marked as payment pending
5. Driver collects cash on trip completion

### Test Online Payment
1. During booking, select "Online" payment
2. Complete booking
3. In payment gateway, select "Pay Online"
4. Click "Pay ₹XXX"
5. Use "Skip (Test Only)" button for testing
6. ✅ Booking marked as paid

---

## 🧪 Test Flow 8: Fraud Detection

### Test Odometer Anomaly
1. Book and start a trip as driver
2. Enter start odometer: 50000
3. Complete trip with end odometer: 49900 (LESS than start)
4. ✅ Trip should be flagged as "ODOMETER_DECREASE"
5. Admin should see fraud flag in trip details

### Test Missing Photos
1. Start trip and skip photo upload
2. Complete trip and skip photo upload
3. ✅ Trip should be flagged as "MISSING_START_PHOTO" or "MISSING_END_PHOTO"

### Test Unusual Distance
1. Start odometer: 50000
2. End odometer: 53000 (3000 km trip - unusual)
3. ✅ Trip should be flagged as "UNUSUAL_DISTANCE"

---

## 📊 Manual API Testing (Using Curl/Postman)

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "phone": "9876543210",
    "password": "test123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test123456"
  }' \
  -c cookies.txt
```

### Get Cars
```bash
curl http://localhost:5000/api/cars
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "car": "{carId}",
    "pickupDate": "2026-09-05",
    "returnDate": "2026-09-10",
    "pickupLocation": "Home",
    "paymentMethod": "cash"
  }'
```

### Apply as Driver
```bash
curl -X POST http://localhost:5000/api/drivers/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "mobile": "9876543210",
    "address": "123 Main St",
    "emergencyContact": {
      "name": "Family",
      "mobile": "9999999999"
    },
    "drivingLicence": {
      "number": "DL123",
      "expiryDate": "2030-12-31",
      "documentUrl": "base64_image_data"
    },
    "identity": {
      "documentType": "Aadhaar",
      "documentNumber": "123456789",
      "documentUrl": "base64_image_data"
    },
    "payoutAccount": {
      "accountHolderName": "Name",
      "bankName": "Bank",
      "accountNumber": "12345",
      "ifsc": "IFSC001"
    }
  }'
```

---

## ✅ Success Criteria

All flows are complete when:

1. ✅ Customer can book car → enter payment gateway → complete payment
2. ✅ Driver can register → get approved by admin → accept trips
3. ✅ Trip lifecycle works: assign → arrive → start (with OTP) → complete
4. ✅ Admin can view dashboard stats, manage drivers, process settlements
5. ✅ Seat rides can be published, booked, and passengers checked in
6. ✅ Financial calculations correct (commission deducted, ledger created)
7. ✅ Fraud flags created for anomalies
8. ✅ Payment status tracked (pending/paid/failed)
9. ✅ All role-based access working (user/driver/admin)
10. ✅ Navigation shows correct links based on user role

---

## 🐛 Common Issues & Fixes

### Issue: "Booking not found" error
**Solution:** Make sure booking was created successfully and you're using the correct bookingId

### Issue: Payment gateway shows error
**Solution:** Use "Skip (Test Only)" button for testing without real payment processor

### Issue: OTP not working
**Solution:** Get OTP from database:
```javascript
db.trips.findOne({booking: ObjectId("id")}).otpHash
```
Or call GET /api/trips/{bookingId}/start-code to regenerate

### Issue: Driver trip not showing
**Solution:** Make sure booking has driver assigned and trip created

### Issue: Admin can't see drivers
**Solution:** Verify admin role is set to "admin" in database:
```javascript
db.users.updateOne({email: "admin@test.com"}, {$set: {role: "admin"}})
```

---

## 📝 Testing Checklist

- [ ] Customer Registration
- [ ] Customer Login
- [ ] Browse Cars
- [ ] Car Details View
- [ ] Create Booking
- [ ] Cash Payment
- [ ] Online Payment (Test Mode)
- [ ] Driver Registration
- [ ] Driver Approval (Admin)
- [ ] Driver Dashboard
- [ ] Trip Assignment (Admin)
- [ ] Mark Arrival (Driver)
- [ ] Start Trip with OTP (Driver)
- [ ] Complete Trip with Evidence (Driver)
- [ ] Fraud Detection
- [ ] Financial Ledger Creation
- [ ] Settlement Processing (Admin)
- [ ] Admin Dashboard Stats
- [ ] Admin Settings
- [ ] Seat Ride Publish
- [ ] Seat Ride Booking
- [ ] Passenger Check-in
- [ ] Role-Based Navigation

---

**Last Updated:** September 1, 2026  
**Version:** 2.0 Complete  
**Status:** Ready for Full Testing
