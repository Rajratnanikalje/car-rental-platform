import { API_URL } from "../config/api";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DriverRegister.css";


function DriverRegister() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    mobile: "",
    profilePhoto: "",
    address: "",
    emergencyContactName: "",
    emergencyContactMobile: "",
    drivingLicenceNumber: "",
    drivingLicenceExpiry: "",
    drivingLicenceDocument: "",
    identityType: "aadhaar",
    identityNumber: "",
    identityDocument: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      // Handle file upload - convert to base64 or URL
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          [name]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError("");
    setSuccess("");
  };

  // =========================
  // HANDLE SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Validation
      if (
        !formData.mobile ||
        !formData.address ||
        !formData.emergencyContactName ||
        !formData.emergencyContactMobile ||
        !formData.drivingLicenceNumber ||
        !formData.drivingLicenceExpiry ||
        !formData.drivingLicenceDocument ||
        !formData.identityNumber ||
        !formData.identityDocument ||
        !formData.accountHolderName ||
        !formData.bankName ||
        !formData.accountNumber ||
        !formData.ifsc
      ) {
        setError("Please fill all required fields");
        return;
      }

      const payload = {
        mobile: formData.mobile.trim(),
        profilePhoto: formData.profilePhoto || "",
        address: formData.address.trim(),
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          mobile: formData.emergencyContactMobile.trim(),
        },
        drivingLicence: {
          number: formData.drivingLicenceNumber.trim(),
          expiryDate: formData.drivingLicenceExpiry,
          documentUrl: formData.drivingLicenceDocument,
        },
        identity: {
          documentType: formData.identityType,
          documentNumber: formData.identityNumber.trim(),
          documentUrl: formData.identityDocument,
        },
        payoutAccount: {
          accountHolderName: formData.accountHolderName.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifsc: formData.ifsc.trim().toUpperCase(),
          upiId: formData.upiId.trim().toLowerCase() || undefined,
        },
      };

      const response = await fetch(`${API_URL}/drivers/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Driver registration failed");
      }

      setSuccess("Application submitted successfully! Your profile is under review.");

      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      console.error("Driver Registration Error:", err);
      setError(err.message || "Failed to submit driver application");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="driver-register-page">
        <div className="driver-register-container">
          <div className="book-spinner" />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="driver-register-page">
      <div className="driver-register-container">
        <section className="driver-register-form glass-card">
          <div className="form-header">
            <h1>🚗 Become a RideOn Driver</h1>
            <p>Join our driver partner program and earn with your vehicle</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* =========================
                PERSONAL DETAILS
            ========================== */}
            <fieldset>
              <legend>Personal Details</legend>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profilePhoto">Profile Photo</label>
                <input
                  type="file"
                  id="profilePhoto"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {/* =========================
                EMERGENCY CONTACT
            ========================== */}
            <fieldset>
              <legend>Emergency Contact</legend>

              <div className="form-group">
                <label htmlFor="emergencyContactName">Name *</label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  placeholder="Emergency contact name"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContactMobile">Mobile *</label>
                <input
                  type="tel"
                  id="emergencyContactMobile"
                  name="emergencyContactMobile"
                  placeholder="Emergency contact mobile"
                  value={formData.emergencyContactMobile}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* =========================
                DRIVING LICENCE
            ========================== */}
            <fieldset>
              <legend>Driving Licence</legend>

              <div className="form-group">
                <label htmlFor="drivingLicenceNumber">Licence Number *</label>
                <input
                  type="text"
                  id="drivingLicenceNumber"
                  name="drivingLicenceNumber"
                  placeholder="Your driving licence number"
                  value={formData.drivingLicenceNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivingLicenceExpiry">Expiry Date *</label>
                <input
                  type="date"
                  id="drivingLicenceExpiry"
                  name="drivingLicenceExpiry"
                  value={formData.drivingLicenceExpiry}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivingLicenceDocument">Upload Licence Document *</label>
                <input
                  type="file"
                  id="drivingLicenceDocument"
                  name="drivingLicenceDocument"
                  accept="image/*,application/pdf"
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* =========================
                IDENTITY VERIFICATION
            ========================== */}
            <fieldset>
              <legend>Identity Verification</legend>

              <div className="form-group">
                <label htmlFor="identityType">Document Type *</label>
                <select
                  id="identityType"
                  name="identityType"
                  value={formData.identityType}
                  onChange={handleChange}
                  required
                >
                  <option value="aadhaar">Aadhaar</option>
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="identityNumber">Document Number *</label>
                <input
                  type="text"
                  id="identityNumber"
                  name="identityNumber"
                  placeholder="Your identity document number"
                  value={formData.identityNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="identityDocument">Upload Document *</label>
                <input
                  type="file"
                  id="identityDocument"
                  name="identityDocument"
                  accept="image/*,application/pdf"
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* =========================
                PAYOUT ACCOUNT
            ========================== */}
            <fieldset>
              <legend>Payout Account Details</legend>

              <div className="form-group">
                <label htmlFor="accountHolderName">Account Holder Name *</label>
                <input
                  type="text"
                  id="accountHolderName"
                  name="accountHolderName"
                  placeholder="Name as per bank account"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankName">Bank Name *</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  placeholder="Your bank name"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="Your bank account number"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ifsc">IFSC Code *</label>
                <input
                  type="text"
                  id="ifsc"
                  name="ifsc"
                  placeholder="Bank IFSC code (e.g., SBIN0001234)"
                  value={formData.ifsc}
                  onChange={handleChange}
                  required
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="upiId">UPI ID (Optional)</label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  placeholder="Your UPI ID (e.g., username@bank)"
                  value={formData.upiId}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {/* =========================
                SUBMIT
            ========================== */}
            <button
              type="submit"
              className="shiny-button"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <p className="form-footer">
            Already have a driver account? <Link to="/profile">View Profile</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default DriverRegister;
