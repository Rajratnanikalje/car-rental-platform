import { Link } from "react-router-dom";
import { useCms } from "../hooks/useCms";
import "./Footer.css";

function Footer() {
  const { cms } = useCms();
  const contact = cms?.contact || {};
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* 1. Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-logo">
              <span className="footer-pin-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="footer-brand-text">
                Ride<span>On</span>
              </span>
            </Link>
          </div>

          {/* 2. Quick Links */}
          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/cars">Cars</Link></li>
              <li><Link to="/seat-rides">Seat Rides</Link></li>
              <li><Link to="/driver-register">Driver Register</Link></li>
              <li><Link to="/login">Customer Login</Link></li>
            </ul>
          </div>

          {/* 3. Services */}
          <div className="footer-links-col">
            <h4>Our Services</h4>
            <ul>
              <li><Link to="/cars">Car Rental</Link></li>
              <li><Link to="/cars">Intercity Rides</Link></li>
              <li><Link to="/seat-rides">Seat Booking</Link></li>
              <li><Link to="/driver-register">Driver Partner</Link></li>
              <li><Link to="/cars">Airport Transfers</Link></li>
            </ul>
          </div>

          {/* 4. Contact Us */}
          <div className="footer-links-col">
            <h4>Contact Us</h4>
            <div className="footer-contact-items">
              {contact.address && <div className="contact-item"><span>{contact.address}</span></div>}
              {contact.phone && <div className="contact-item"><span>{contact.phone}</span></div>}
              {contact.email && <div className="contact-item"><span>{contact.email}</span></div>}
              {contact.workingHours && <div className="contact-item"><span>{contact.workingHours}</span></div>}
              {!contact.address && !contact.phone && !contact.email && !contact.workingHours && <p>Contact information is not available yet.</p>}
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>© {currentYear} RideOn Technologies. All rights reserved.</p>
          <div className="footer-legal-links">
            <Link to="/terms">Privacy Policy</Link>
            <span className="dot-sep">•</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="dot-sep">•</span>
            <Link to="/admin/login" className="admin-shortcut-link">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
