import { useEffect, useState } from "react";
import API from "../services/api";
import confetti from "canvas-confetti";
import { useToast } from "../context/ToastContext";
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Tag, 
  Building2 
} from "lucide-react";

function EventDetailsModal({ eventId, onClose, onRegisterSuccess }) {
  const { addToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/events/${eventId}`);
        setEvent(res.data);
      } catch (err) {
        console.error("Error fetching event details:", err);
        addToast("Failed to load event details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [eventId]);

  const handleRegister = async () => {
    if (!token) {
      addToast("Please login first to register for events.", "warning");
      return;
    }

    setRegistering(true);
    try {
      const res = await API.post(
        "/registrations",
        { event_id: eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Celebrate with confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      addToast(res.data.message || "Registration confirmed!", "success");
      if (onRegisterSuccess) onRegisterSuccess(res.data);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || "Registration failed", "error");
    } finally {
      setRegistering(false);
    }
  };

  if (!eventId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            Loading event information...
          </div>
        ) : !event ? (
          <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>
            Event could not be found.
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <span className="badge badge-approved" style={{ marginBottom: 6 }}>
                  {event.category_name}
                </span>
                <h2 className="modal-title" style={{ fontSize: 22 }}>
                  {event.title}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "24px 28px" }}>
              {/* Event Metadata Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                  marginBottom: 24,
                  background: "#f8fafc",
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={18} color="#4f46e5" />
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Date & Time
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                      {new Date(event.event_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Building2 size={18} color="#06b6d4" />
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Venue & Location
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                      {event.venue_name || event.location}
                    </div>
                    {event.venue_building && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>{event.venue_building}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Users size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Capacity / Seats
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                      {event.registered_count || 0} / {event.capacity} Registered
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
                  About this Event
                </h4>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-line" }}>
                  {event.description || "No specific description provided."}
                </p>
              </div>

              {/* Agenda / Event Schedule Timeline */}
              {event.schedules && event.schedules.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock size={16} color="#4f46e5" />
                    <span>Event Agenda & Timeline</span>
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {event.schedules.map((item) => (
                      <div
                        key={item.schedule_id}
                        style={{
                          display: "flex",
                          gap: 14,
                          padding: "10px 14px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: "#4f46e5",
                            minWidth: 80,
                            paddingTop: 2,
                          }}
                        >
                          {item.start_time}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                            {item.session_title}
                          </div>
                          {item.speaker_name && (
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Speaker: {item.speaker_name}
                            </div>
                          )}
                          {item.description && (
                            <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Feedback & Rating Showcase */}
              {event.reviews && event.reviews.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                    <span>Student Reviews ({event.reviews.length}) • Average {Number(event.average_rating || 0).toFixed(1)} / 5</span>
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {event.reviews.slice(0, 3).map((rev) => (
                      <div
                        key={rev.feedback_id}
                        style={{
                          padding: 12,
                          background: "#f8fafc",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{rev.student_name}</span>
                          <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>
                            {"★".repeat(rev.rating)}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "#475569" }}>{rev.review_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Close
              </button>

              {(!user || user.role === "student") && (
                <button
                  className="btn btn-primary"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  <Sparkles size={16} />
                  <span>
                    {registering ? "Registering..." : (event.registered_count >= event.capacity) ? "Join Waitlist" : "Reserve Digital Pass"}
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EventDetailsModal;
