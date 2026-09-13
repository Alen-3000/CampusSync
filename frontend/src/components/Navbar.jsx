import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Sparkles, 
  Ticket, 
  LayoutDashboard, 
  ShieldCheck, 
  PlusCircle, 
  LogOut, 
  LogIn, 
  UserPlus,
  Bell
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const getRoleDisplayName = (role) => {
    if (role === "admin") return "Campus Admin";
    if (role === "organizer") return "Club Organizer";
    return "Student";
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-brand-icon">
          <Calendar size={20} />
        </div>
        <span>Campus<span style={{ color: "#38bdf8" }}>Sync</span></span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
          <Sparkles size={16} />
          <span>Home</span>
        </Link>

        <Link to="/events" className={`nav-link ${isActive("/events") ? "active" : ""}`}>
          <Calendar size={16} />
          <span>Explore Events</span>
        </Link>

        {/* Student Links */}
        {user?.role === "student" && (
          <Link
            to="/student-dashboard"
            className={`nav-link ${isActive("/student-dashboard") ? "active" : ""}`}
          >
            <Ticket size={16} />
            <span>My Tickets & Passes</span>
          </Link>
        )}

        {/* Organizer Links */}
        {user?.role === "organizer" && (
          <>
            <Link
              to="/organizer-dashboard"
              className={`nav-link ${isActive("/organizer-dashboard") ? "active" : ""}`}
            >
              <LayoutDashboard size={16} />
              <span>Organizer Studio</span>
            </Link>
            <Link
              to="/create-event"
              className={`nav-link ${isActive("/create-event") ? "active" : ""}`}
            >
              <PlusCircle size={16} />
              <span>Create Event</span>
            </Link>
          </>
        )}

        {/* Admin Links */}
        {user?.role === "admin" && (
          <>
            <Link
              to="/admin-dashboard"
              className={`nav-link ${isActive("/admin-dashboard") ? "active" : ""}`}
            >
              <ShieldCheck size={16} />
              <span>Admin Command Center</span>
            </Link>
            <Link
              to="/organizer-dashboard"
              className={`nav-link ${isActive("/organizer-dashboard") ? "active" : ""}`}
            >
              <LayoutDashboard size={16} />
              <span>All Events</span>
            </Link>
          </>
        )}

        {/* Guest Auth */}
        {!user ? (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }}>
              <LogIn size={15} />
              <span>Login</span>
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              <UserPlus size={15} />
              <span>Sign Up</span>
            </Link>
          </>
        ) : (
          <div className="nav-user-chip">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role-badge">{getRoleDisplayName(user.role)}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-nav-logout"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;