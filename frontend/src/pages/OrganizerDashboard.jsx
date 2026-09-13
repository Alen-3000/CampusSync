import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { 
  PlusCircle, 
  Calendar, 
  Users, 
  Scan, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Star, 
  AlertCircle 
} from "lucide-react";
import AttendanceScannerModal from "../components/AttendanceScannerModal";
import StatsCard from "../components/StatsCard";

function OrganizerDashboard() {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active event for Live Scanner & Roster modal
  const [scannerEvent, setScannerEvent] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events/my-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Organizer events error:", err);
      addToast("Failed to load organizer events", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  const handleDelete = async (eventId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete '${title}'? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await API.delete(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast("Event deleted successfully", "info");
      setEvents((prev) => prev.filter((e) => e.event_id !== eventId));
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete event", "error");
    }
  };

  const handleExportCSV = async (eventId, title) => {
    try {
      addToast("Preparing attendee roster download...", "info");
      const res = await API.get(`/registrations/event/${eventId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = (title || `Event_${eventId}`).replace(/[^a-zA-Z0-9]/g, "_");
      link.setAttribute("download", `Attendees_${safeTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast("Attendee roster exported successfully!", "success");
    } catch (err) {
      console.error("Export error:", err);
      addToast("Failed to export attendee roster", "error");
    }
  };

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
  const totalAttended = events.reduce((sum, e) => sum + (e.attended_count || 0), 0);
  const overallTurnout = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

  return (
    <div className="page-container">
      {/* Organizer Studio Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
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
            Event Organizer Studio
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            Manage Your Events, {user?.name || "Organizer"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
            Control venue reservations, live door scanning, attendance records, and attendee rosters.
          </p>
        </div>

        <Link to="/create-event" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>+ Create New Event</span>
        </Link>
      </div>

      {/* KPI Counters */}
      <div className="stats-grid">
        <StatsCard
          icon={Calendar}
          label="Total Hosted Events"
          value={events.length}
          color="#4f46e5"
          bg="#eef2ff"
          subtext="Created under your profile"
        />
        <StatsCard
          icon={Users}
          label="Total Registrations"
          value={totalRegistrations}
          color="#06b6d4"
          bg="#ecfeff"
          subtext="Students registered"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Verified Attendance"
          value={totalAttended}
          color="#10b981"
          bg="#ecfdf5"
          subtext={`${overallTurnout}% Overall Turnout`}
        />
        <StatsCard
          icon={Star}
          label="Average Event Rating"
          value={
            events.filter((e) => e.average_rating > 0).length > 0
              ? (
                  events.reduce((sum, e) => sum + Number(e.average_rating || 0), 0) /
                  (events.filter((e) => e.average_rating > 0).length || 1)
                ).toFixed(1) + " ★"
              : "N/A"
          }
          color="#f59e0b"
          bg="#fffbeb"
          subtext="Student review score"
        />
      </div>

      {/* Event List Section */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
          Events Under Your Management
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#64748b" }}>
            Loading your hosted events...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <Calendar size={48} color="#cbd5e1" style={{ margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
              You haven't created any events yet
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              Launch a workshop, technical hackathon, or cultural fest for your college.
            </p>
            <Link to="/create-event" className="btn btn-primary btn-sm">
              + Create Your First Event
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {events.map((evt) => {
              const regPct = Math.min(100, Math.round(((evt.registered_count || 0) / evt.capacity) * 100));
              const turnoutPct = evt.registered_count > 0 ? Math.round(((evt.attended_count || 0) / evt.registered_count) * 100) : 0;

              return (
                <div
                  key={evt.event_id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  <div style={{ flex: "1 1 360px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span className={`badge badge-${evt.status}`}>
                        {evt.status === "approved" ? "Active / Approved" : evt.status}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                        {evt.category_name}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                      {evt.title}
                    </h3>

                    <div style={{ display: "flex", gap: 16, color: "#475569", fontSize: 13, flexWrap: "wrap" }}>
                      <span>📅 {new Date(evt.event_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>📍 {evt.venue_name || evt.location}</span>
                    </div>

                    <div style={{ display: "flex", gap: 20, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, color: "#1e293b" }}>
                        Seats: <strong>{evt.registered_count || 0}</strong> / {evt.capacity} ({regPct}% filled)
                      </div>
                      <div style={{ fontSize: 13, color: "#16a34a" }}>
                        Attended: <strong>{evt.attended_count || 0}</strong> ({turnoutPct}% turnout)
                      </div>
                      {evt.waitlist_count > 0 && (
                        <div style={{ fontSize: 13, color: "#ea580c" }}>
                          Waitlist: <strong>{evt.waitlist_count}</strong> students
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Organizer Quick Actions */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setScannerEvent(evt)}
                      title="Open door check-in scanner and attendee list"
                    >
                      <Scan size={15} />
                      <span>Live Door Scanner</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExportCSV(evt.event_id, evt.title)}
                      title="Download attendee list (CSV)"
                    >
                      <FileSpreadsheet size={15} color="#16a34a" />
                      <span>Export CSV</span>
                    </button>

                    <Link
                      to={`/edit-event/${evt.event_id}`}
                      className="btn btn-secondary btn-sm"
                      title="Edit event details"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </Link>

                    <button
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleDelete(evt.event_id, evt.title)}
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Scanner & Attendance Modal */}
      {scannerEvent && (
        <AttendanceScannerModal
          event={scannerEvent}
          onClose={() => setScannerEvent(null)}
          onUpdated={fetchOrganizerEvents}
        />
      )}
    </div>
  );
}

export default OrganizerDashboard;