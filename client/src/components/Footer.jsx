import { Link } from "react-router-dom";
import { useCms } from "../hooks/useCms";
import "./Footer.css";

function Footer() {
  const { cms } = useCms();
  const branding = cms?.branding || {};
  const footer = cms?.footer || {};
  const contact = cms?.contact || {};

  return (
    <footer className="site-footer">
      <div className="footer-glow footer-glow-purple" />
      <div className="footer-glow footer-glow-blue" />
      <div className="footer-container">
        <div className="footer-main glass-card">
          {/* 1. Brand Column */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand">
              <span className="footer-brand-mark">
                {branding.brandMark || "R"}
              </span>
              <div>
                <strong>
                  {branding.brandName ? (
                    branding.brandName.toLowerCase() === "rideon" ? (
                      <>
                        Ride<span>On</span>
                      </>
                    ) : (
                      branding.brandName
                    )
                  ) : (
                    <>
                      Ride<span>On</span>
                    </>
                  )}
                </strong>
                <small>{branding.brandTagline || "Premium Car Rental"}</small>
              </div>
            </Link>
            <p>
              {footer.description ||
                "Reliable cars, transparent pricing and a simple rental experience for every journey."}
            </p>
            <Link to="/cars" className="shiny-button footer-cta">
              Explore Cars
            </Link>
          </div>

          {/* 2. Company Links Column */}
          <div className="footer-column">
            <h3>Company</h3>
            <Link to="/">Home</Link>
            <Link to="/cars">Cars</Link>
            <Link to="/seat-rides">Shared Rides</Link>
            <Link to="/dashboard">Customer Dashboard</Link>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/profile">My Profile</Link>
          </div>

          {/* 3. Rental Features Column */}
          <div className="footer-column">
            <h3>Rental Features</h3>
            <span>Vehicle-specific KM plans</span>
            <span>Configured extra-KM pricing</span>
            <span>Flexible Booking & Cancellation</span>
            <span>Transparent Pricing (Zero Hidden Fees)</span>
            <span>Verified Professional Drivers</span>
          </div>

          {/* 4. Contact Column */}
          <div className="footer-column">
            <h3>Contact Us</h3>
            {contact.phone && <span>📞 {contact.phone}</span>}
            {contact.email && <span>✉️ {contact.email}</span>}
            {contact.address && <span>📍 {contact.address}</span>}
            {contact.workingHours && <span>🕒 {contact.workingHours}</span>}
            {contact.emergencyPhone && (
              <span>🚨 Helpline: {contact.emergencyPhone}</span>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()}{" "}
            {footer.copyrightText || "RideOn. All rights reserved."}
          </p>

          <div className="footer-bottom-links">
            {footer.facebookUrl && (
              <a
                href={footer.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            )}
            {footer.twitterUrl && (
              <a
                href={footer.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter/X
              </a>
            )}
            {footer.instagramUrl && (
              <a
                href={footer.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            )}
            {footer.linkedinUrl && (
              <a
                href={footer.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
            <a href={footer.privacyUrl || "#privacy"}>Privacy Policy</a>
            <a href={footer.termsUrl || "#terms"}>Terms &amp; Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
