import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { 
  Sparkles, 
  Calendar, 
  Search, 
  Ticket, 
  Award, 
  Users, 
  ChevronRight, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Zap,
  Bell
} from "lucide-react";
import EventDetailsModal from "../components/EventDetailsModal";

function Home() {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, annRes] = await Promise.all([
          API.get("/events?timeframe=upcoming"),
          API.get("/announcements"),
        ]);
        setUpcomingEvents(eventsRes.data.slice(0, 6));
        setAnnouncements(annRes.data.slice(0, 3));
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <div className="page-container">
      {/* Announcements Bar if any */}
      {announcements.length > 0 && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "10px 18px",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Bell size={18} color="#2563eb" />
          <span style={{ fontSize: 13.5, color: "#1e40af", fontWeight: 600 }}>
            <strong>Campus Notice:</strong> {announcements[0].title} — {announcements[0].content}
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-wrapper">
        <div className="hero-pill">
          <Zap size={14} />
          <span>Official Campus Event Operating System</span>
        </div>

        <h1 className="hero-title">
          Where Campus Life, Hackathons & Festivals <span>Come Alive.</span>
        </h1>

        <p className="hero-subtitle">
          Discover university workshops, club hackathons, technical symposiums, and cultural fests. 
          Instant QR ticketing, seamless door check-in, automated waitlists, and verifiable certificates.
        </p>

        {/* Hero Search Box */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: 640, marginBottom: 28, display: "flex", gap: 10 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search hackathons, AI workshops, cultural fests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "14px 18px 14px 44px", fontSize: 15, background: "#ffffff" }}
            />
          </div>
          <button type="submit" className="btn btn-accent" style={{ padding: "0 24px" }}>
            <span>Explore</span>
            <ChevronRight size={16} />
          </button>
        </form>

        <div className="hero-actions">
          <Link to="/events" className="btn btn-primary btn-lg">
            <Calendar size={18} />
            <span>Browse All Events</span>
          </Link>

          {!user && (
            <Link to="/register" className="btn btn-secondary btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <Users size={18} />
              <span>Join as Student</span>
            </Link>
          )}

          {user?.role === "organizer" && (
            <Link to="/create-event" className="btn btn-secondary btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              <span>Host an Event</span>
            </Link>
          )}
        </div>
      </section>

      {/* Feature Highlights Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 48,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: 24,
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ background: "#eef2ff", padding: 12, borderRadius: 12, color: "#4f46e5" }}>
            <Ticket size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Digital QR Passports</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Instant scannable passes with student roll numbers, verifiable at campus gate check-ins.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 24,
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 12, color: "#10b981" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Conflict-Free Venues</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Automated clash detection across Auditoriums, Labs, and Halls to eliminate double-booking.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 24,
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ background: "#fffbeb", padding: 12, borderRadius: 12, color: "#f59e0b" }}>
            <Award size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Verified Certificates</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Tamper-proof participation certificates generated automatically upon physical attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Upcoming Events Section */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 1 }}>
              What's Happening Next
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              Upcoming Campus Highlights
            </h2>
          </div>
          <Link to="/events" style={{ color: "#4f46e5", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
            <span>View All</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Loading university events...
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <p style={{ color: "#64748b" }}>No upcoming events currently scheduled.</p>
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((evt) => {
              const pct = Math.min(100, Math.round(((evt.registered_count || 0) / evt.capacity) * 100));
              return (
                <div className="event-card" key={evt.event_id}>
                  <div className="event-card-banner">
                    <span className="event-card-category-badge">
                      {evt.category_name}
                    </span>
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <Calendar size={36} color="rgba(255,255,255,0.7)" style={{ margin: "0 auto 8px auto" }} />
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
                        {new Date(evt.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div className="event-card-content">
                    <h3 className="event-card-title">{evt.title}</h3>

                    <div className="event-meta-row">
                      <Clock size={14} />
                      <span>{new Date(evt.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div className="event-meta-row">
                      <MapPin size={14} />
                      <span>{evt.venue_name || evt.location}</span>
                    </div>

                    <p className="event-card-desc">{evt.description}</p>

                    <div className="event-capacity-bar-wrapper">
                      <div className="event-capacity-header">
                        <span>Capacity ({evt.registered_count || 0}/{evt.capacity})</span>
                        <span>{pct}% Filled</span>
                      </div>
                      <div className="capacity-progress-track">
                        <div
                          className="capacity-progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                    </div>

                    <div className="event-card-footer">
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: "100%" }}
                        onClick={() => setSelectedEventId(evt.event_id)}
                      >
                        View Details & Pass
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Details */}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onRegisterSuccess={() => {
            navigate("/student-dashboard");
          }}
        />
      )}
    </div>
  );
}

export default Home;
