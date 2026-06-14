import { Link, useLocation } from "react-router-dom";
import { useFlags } from "../hooks/useFlags";

interface NavbarProps {
  onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const location = useLocation();
  const { count } = useFlags();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/events" style={{ textDecoration: "none", color: "inherit" }}>
          PenguWave 🐧
        </Link>
      </div>
      <div className="navbar-links">
        <Link
          to="/events"
          className={location.pathname.startsWith("/events") ? "active" : ""}
        >
          Events
        </Link>
        <Link to="/flagged" className={location.pathname === "/flagged" ? "active" : ""}>
          Flagged
          {count > 0 && <span className="nav-badge">{count}</span>}
        </Link>
        <Link to="/ask" className={location.pathname === "/ask" ? "active" : ""}>
          Ask AI
        </Link>
        <Link
          to="/users"
          className={location.pathname === "/users" ? "active" : ""}
        >
          Users
        </Link>
        <button onClick={onLoginClick} className="navbar-login-btn">
          Login
        </button>
      </div>
    </nav>
  );
}
