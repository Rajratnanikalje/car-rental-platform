import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow footer-glow-purple" />
      <div className="footer-glow footer-glow-blue" />
      <div className="footer-container">
        <div className="footer-main glass-card">
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand"><span className="footer-brand-mark">R</span><div><strong>Ride<span>On</span></strong><small>Premium Car Rental</small></div></Link>
            <p>Reliable cars, transparent pricing and a simple rental experience for every journey.</p>
            <Link to="/cars" className="shiny-button footer-cta">Explore Cars</Link>
          </div>
          <div className="footer-column"><h3>Company</h3><Link to="/">Home</Link><Link to="/cars">Cars</Link><Link to="/profile">Profile</Link><Link to="/my-bookings">My Bookings</Link></div>
          <div className="footer-column"><h3>Account</h3><Link to="/login">Login</Link><Link to="/register">Register</Link><Link to="/my-bookings">My Bookings</Link><Link to="/profile">My Profile</Link></div>
          <div className="footer-column"><h3>Rental</h3><span>Vehicle-specific KM plans</span><span>Configured extra-KM pricing</span><span>Flexible Booking</span><span>Transparent Pricing</span></div>
        </div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} RideOn. All rights reserved.</p><div className="footer-bottom-links"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms &amp; Conditions</a></div></div>
      </div>
    </footer>
  );
}

export default Footer;
