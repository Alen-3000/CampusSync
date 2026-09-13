import { useEffect, useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { 
  Ticket, 
  Award, 
  Clock, 
  Calendar, 
  MapPin, 
  QrCode, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  User, 
  Save 
} from "lucide-react";
import DigitalPassModal from "../components/DigitalPassModal";
import CertificateModal from "../components/CertificateModal";
import FeedbackModal from "../components/FeedbackModal";
import StatsCard from "../components/StatsCard";

function StudentDashboard() {
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("passes");

  // Modals state
  const [passModalReg, setPassModalReg] = useState(null);
  const [certModalEventId, setCertModalEventId] = useState(null);
  const [feedbackModalData, setFeedbackModalData] = useState(null);

  // Profile Form state
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileDept, setProfileDept] = useState(user?.department || "Computer Science & Engineering");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileYear, setProfileYear] = useState(user?.year_of_study || "3rd Year");
  const [profileSaving, setProfileSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/registrations/my-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data);
    } catch (err) {
      console.error("Error fetching my events:", err);
      addToast("Failed to load registered events", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async (eventId, title) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your registration for '${title}'? If you cancel, your seat will be automatically given to the next student on the waitlist.`
    );
    if (!confirmCancel) return;

    try {
      await API.delete(`/registrations/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast("Registration cancelled successfully", "info");
      fetchRegistrations();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to cancel registration", "error");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await API.put(
        "/auth/profile",
        {
          name: profileName,
          department: profileDept,
          phone: profilePhone,
          year_of_study: profileYear,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      addToast("Student profile updated successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const activePasses = registrations.filter((r) => r.status === "registered");
  const attendedEvents = registrations.filter((r) => r.status === "attended");
  const waitlistedEvents = registrations.filter((r) => r.status === "waitlisted");

  return (
    <div className="page-container">
      {/* Student Welcome Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)",
          borderRadius: 20,
          padding: "32px 36px",
          color: "#ffffff",
          marginBottom: 32,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Student Portal
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            Welcome back, {user?.name || "Student"}! 🎓
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
            Roll No: <strong>{user?.roll_number || "CS22B001"}</strong> • {user?.department || "Computer Science"} • {user?.year_of_study || "3rd Year"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setActiveTab("passes")}
            className="btn btn-primary btn-sm"
          >
            <Ticket size={16} />
            <span>My Active Tickets ({activePasses.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="stats-grid">
        <StatsCard
          icon={Ticket}
          label="Active Entry Passes"
          value={activePasses.length}
          color="#4f46e5"
          bg="#eef2ff"
          subtext="Ready for door scanning"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Events Attended"
          value={attendedEvents.length}
          color="#10b981"
          bg="#ecfdf5"
          subtext="Verified attendance credits"
        />
        <StatsCard
          icon={Award}
          label="Certificates Issued"
          value={attendedEvents.length}
          color="#f59e0b"
          bg="#fffbeb"
          subtext="Official participation proof"
        />
        <StatsCard
          icon={Clock}
          label="Waitlisted Applications"
          value={waitlistedEvents.length}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtext="Auto-promoted on vacancy"
        />
      </div>

      {/* Tab Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "passes" ? "active" : ""}`}
          onClick={() => setActiveTab("passes")}
        >
          <Ticket size={16} />
          <span>Active Passes ({activePasses.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "attended" ? "active" : ""}`}
          onClick={() => setActiveTab("attended")}
        >
          <Award size={16} />
          <span>Attended & Certificates ({attendedEvents.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "waitlist" ? "active" : ""}`}
          onClick={() => setActiveTab("waitlist")}
        >
          <Clock size={16} />
          <span>Waitlisted ({waitlistedEvents.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={16} />
          <span>Student Credentials</span>
        </button>
      </div>

      {/* Tab 1: Active Passes */}
      {activeTab === "passes" && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading tickets...</div>
          ) : activePasses.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <Ticket size={42} color="#cbd5e1" style={{ margin: "0 auto 10px auto" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>No active tickets yet</h3>
              <p style={{ color: "#64748b", fontSize: 13.5, margin: "6px 0 16px 0" }}>
                You have not registered for any upcoming events. Explore events to grab a pass!
              </p>
              <a href="/events" className="btn btn-primary btn-sm">Browse Upcoming Events</a>
            </div>
          ) : (
            <div className="events-grid">
              {activePasses.map((reg) => (
                <div className="event-card" key={reg.registration_id}>
                  <div className="event-card-banner" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
                    <span className="event-card-category-badge">{reg.category_name}</span>
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <QrCode size={40} color="#38bdf8" style={{ margin: "0 auto 8px auto" }} />
                      <div style={{ fontSize: 12, fontFamily: "monospace", letterSpacing: 1 }}>
                        {reg.ticket_code}
                      </div>
                    </div>
                  </div>

                  <div className="event-card-content">
                    <h3 className="event-card-title">{reg.title}</h3>

                    <div className="event-meta-row">
                      <Calendar size={14} />
                      <span>{new Date(reg.event_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>

                    <div className="event-meta-row">
                      <MapPin size={14} />
                      <span>{reg.venue_name || reg.location}</span>
                    </div>

                    <div style={{ margin: "16px 0", display: "flex", gap: 10 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setPassModalReg(reg)}
                      >
                        <QrCode size={15} />
                        <span>View Pass & QR</span>
                      </button>

                      <button
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => handleCancelRegistration(reg.event_id, reg.title)}
                        title="Cancel Registration"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Attended & Certificates */}
      {activeTab === "attended" && (
        <div>
          {attendedEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <Award size={42} color="#cbd5e1" style={{ margin: "0 auto 10px auto" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>No verified attendance yet</h3>
              <p style={{ color: "#64748b", fontSize: 13.5 }}>
                When you attend an event and get checked in via QR scanner, your verified certificates and rating options will appear here!
              </p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Date Held</th>
                    <th>Venue</th>
                    <th>Check-in Timestamp</th>
                    <th>Certificate</th>
                    <th>Your Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {attendedEvents.map((ev) => (
                    <tr key={ev.registration_id}>
                      <td>
                        <strong>{ev.title}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{ev.category_name}</div>
                      </td>
                      <td>{new Date(ev.event_date).toLocaleDateString()}</td>
                      <td>{ev.venue_name || ev.location}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                          ✓ {ev.attended_at ? new Date(ev.attended_at).toLocaleTimeString() : "Verified"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCertModalEventId(ev.event_id)}
                        >
                          <Award size={14} color="#f59e0b" />
                          <span>Get Certificate</span>
                        </button>
                      </td>
                      <td>
                        {ev.user_rating ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                              {"★".repeat(ev.user_rating)}
                            </span>
                            <button
                              style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", marginLeft: 4 }}
                              onClick={() => setFeedbackModalData({ eventId: ev.event_id, title: ev.title, rating: ev.user_rating, review: ev.user_review })}
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setFeedbackModalData({ eventId: ev.event_id, title: ev.title })}
                          >
                            <Star size={13} color="#f59e0b" />
                            <span>Rate Event</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Waitlisted */}
      {activeTab === "waitlist" && (
        <div>
          {waitlistedEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <Clock size={42} color="#cbd5e1" style={{ margin: "0 auto 10px auto" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>No waitlisted events</h3>
              <p style={{ color: "#64748b", fontSize: 13.5 }}>
                You do not have any pending waitlist reservations.
              </p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Date</th>
                    <th>Waitlist Queue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistedEvents.map((w) => (
                    <tr key={w.registration_id}>
                      <td>
                        <strong>{w.title}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{w.category_name}</div>
                      </td>
                      <td>{new Date(w.event_date).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-waitlisted">
                          Queue Position #{w.waitlist_position}
                        </span>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          Automatically promoted when a seat opens
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleCancelRegistration(w.event_id, w.title)}
                        >
                          Leave Waitlist
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Student Profile */}
      {activeTab === "profile" && (
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", padding: 32, borderRadius: 18, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>
            College Student Credentials
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Roll Number / Reg No</label>
              <input
                type="text"
                className="form-control"
                value={user?.roll_number || ""}
                disabled
                style={{ background: "#f1f5f9", cursor: "not-allowed" }}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>Roll number is assigned by University Administration</span>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Department</label>
              <select
                className="form-control"
                value={profileDept}
                onChange={(e) => setProfileDept(e.target.value)}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Business Administration">Business Administration</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select
                className="form-control"
                value={profileYear}
                onChange={(e) => setProfileYear(e.target.value)}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 43210"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              <Save size={16} />
              <span>{profileSaving ? "Saving..." : "Save Profile Details"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Digital Pass QR Modal */}
      {passModalReg && (
        <DigitalPassModal
          registration={passModalReg}
          user={user}
          onClose={() => setPassModalReg(null)}
        />
      )}

      {/* Certificate Modal */}
      {certModalEventId && (
        <CertificateModal
          eventId={certModalEventId}
          onClose={() => setCertModalEventId(null)}
        />
      )}

      {/* Feedback Rating Modal */}
      {feedbackModalData && (
        <FeedbackModal
          eventId={feedbackModalData.eventId}
          eventTitle={feedbackModalData.title}
          initialRating={feedbackModalData.rating}
          initialReview={feedbackModalData.review}
          onClose={() => setFeedbackModalData(null)}
          onSubmitted={fetchRegistrations}
        />
      )}
    </div>
  );
}

export default StudentDashboard;