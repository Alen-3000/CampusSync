import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Tag, 
  Sparkles 
} from "lucide-react";
import EventDetailsModal from "../components/EventDetailsModal";

function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [timeframe, setTimeframe] = useState("upcoming");

  const [selectedEventId, setSelectedEventId] = useState(null);

  // Fetch Categories & Venues for filter dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, venRes] = await Promise.all([
          API.get("/categories"),
          API.get("/venues"),
        ]);
        setCategories(catRes.data);
        setVenues(venRes.data);
      } catch (err) {
        console.error("Filter metadata error:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch filtered events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (selectedCategory !== "all") params.append("category_id", selectedCategory);
        if (selectedVenue !== "all") params.append("venue_id", selectedVenue);
        if (timeframe !== "all") params.append("timeframe", timeframe);

        const res = await API.get(`/events?${params.toString()}`);
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedVenue, timeframe]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
          Campus Event Directory
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
          Browse workshops, hackathons, competitions, and guest seminars happening across departments.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="category-pills-row">
        <button
          className={`category-pill ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            className={`category-pill ${selectedCategory === String(cat.category_id) ? "active" : ""}`}
            onClick={() => setSelectedCategory(String(cat.category_id))}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by event title, speaker, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Venue Filter */}
        <select
          className="filter-select"
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
        >
          <option value="all">All Venues & Halls</option>
          {venues.map((v) => (
            <option key={v.venue_id} value={v.venue_id}>
              {v.venue_name}
            </option>
          ))}
        </select>

        {/* Timeframe Filter */}
        <select
          className="filter-select"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="upcoming">Upcoming Events</option>
          <option value="past">Past Events</option>
          <option value="all">All Dates</option>
        </select>

        {(search || selectedCategory !== "all" || selectedVenue !== "all" || timeframe !== "upcoming") && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedVenue("all");
              setTimeframe("upcoming");
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Events Results Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          Searching campus events...
        </div>
      ) : events.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#ffffff",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
          }}
        >
          <Calendar size={48} color="#cbd5e1" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
            No events match your criteria
          </h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Try adjusting your search terms or clearing the selected filters.
          </p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((evt) => {
            const pct = Math.min(100, Math.round(((evt.registered_count || 0) / evt.capacity) * 100));
            const isFull = evt.registered_count >= evt.capacity;

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

                  {evt.average_rating > 0 && (
                    <div className="event-meta-row">
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontWeight: 600, color: "#d97706" }}>
                        {Number(evt.average_rating).toFixed(1)} / 5 ({evt.total_reviews} reviews)
                      </span>
                    </div>
                  )}

                  <p className="event-card-desc">{evt.description}</p>

                  <div className="event-capacity-bar-wrapper">
                    <div className="event-capacity-header">
                      <span>Capacity ({evt.registered_count || 0}/{evt.capacity})</span>
                      <span>{isFull ? "Waitlist Active" : `${pct}% Filled`}</span>
                    </div>
                    <div className="capacity-progress-track">
                      <div
                        className="capacity-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: isFull ? "#ea580c" : pct > 75 ? "#f59e0b" : "#10b981",
                        }}
                      />
                    </div>
                  </div>

                  <div className="event-card-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => setSelectedEventId(evt.event_id)}
                    >
                      <span>{isFull ? "Join Waitlist" : "View & Register Pass"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Registration Modal */}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onRegisterSuccess={() => {
            // Re-trigger event list update
            setTimeframe(timeframe);
          }}
        />
      )}
    </div>
  );
}

export default Events;