import { useEffect, useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { 
  ShieldCheck, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Clock, 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Check, 
  X, 
  TrendingUp 
} from "lucide-react";
import StatsCard from "../components/StatsCard";

function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("approvals");

  // Tab 1: Pending & All Events
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("pending_approval");

  // Tab 2: Venues
  const [venues, setVenues] = useState([]);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueBuilding, setNewVenueBuilding] = useState("");
  const [newVenueCapacity, setNewVenueCapacity] = useState("");
  const [newVenueAmenities, setNewVenueAmenities] = useState("");
  const [showAddVenue, setShowAddVenue] = useState(false);

  // Tab 3: Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Tab 4: Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  const token = localStorage.getItem("token");

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Admin stats error:", err);
      addToast("Failed to load admin statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await API.get(`/events?status=${eventFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await API.get("/venues");
      setVenues(res.data);
    } catch (err) {
      console.error("Fetch venues error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userRoleFilter !== "all") params.append("role", userRoleFilter);
      if (userSearch.trim()) params.append("search", userSearch.trim());

      const res = await API.get(`/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await API.get("/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchVenues();
  }, []);

  useEffect(() => {
    if (activeTab === "approvals") fetchEvents();
    if (activeTab === "venues") fetchVenues();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "logs") fetchAuditLogs();
  }, [activeTab, eventFilter, userRoleFilter, userSearch]);

  const handleUpdateEventStatus = async (eventId, newStatus) => {
    const remarks = window.prompt(
      `Enter admin note or remarks for ${newStatus}:`,
      newStatus === "approved" ? "Approved by Dean of Student Affairs" : "Revision requested"
    );
    if (remarks === null) return;

    try {
      await API.patch(
        `/events/${eventId}/status`,
        { status: newStatus, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast(`Event ${newStatus} successfully!`, "success");
      fetchEvents();
      fetchAdminStats();
    } catch (err) {
      addToast(err.response?.data?.message || "Status update failed", "error");
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await API.post(
        "/venues",
        {
          venue_name: newVenueName,
          building: newVenueBuilding,
          capacity: Number(newVenueCapacity),
          amenities: newVenueAmenities,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast("New campus venue registered!", "success");
      setNewVenueName("");
      setNewVenueBuilding("");
      setNewVenueCapacity("");
      setNewVenueAmenities("");
      setShowAddVenue(false);
      fetchVenues();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create venue", "error");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await API.patch(
        `/admin/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast(`User role updated to '${newRole}'`, "success");
      fetchUsers();
      fetchAdminStats();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  return (
    <div className="page-container">
      {/* Executive Command Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: 20,
          padding: "32px 36px",
          color: "#ffffff",
          marginBottom: 32,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            University Administration & Dean Portal
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            Institutional Command Center
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
            System-wide event moderation, venue conflict governance, student credentials, and audit security.
          </p>
        </div>
      </div>

      {/* KPI Stats Counters */}
      {stats && (
        <div className="stats-grid">
          <StatsCard
            icon={Calendar}
            label="Total Campus Events"
            value={stats.events?.total_events || 0}
            color="#4f46e5"
            bg="#eef2ff"
            subtext={`${stats.events?.upcoming_events || 0} Upcoming • ${stats.events?.pending_approvals || 0} Pending`}
          />
          <StatsCard
            icon={Users}
            label="Student Registrations"
            value={stats.registrations?.total_registrations || 0}
            color="#0ea5e9"
            bg="#f0f9ff"
            subtext={`${stats.registrations?.turnout_rate || 0}% Average Attendance`}
          />
          <StatsCard
            icon={Building2}
            label="Campus Venues & Facilities"
            value={venues.length}
            color="#10b981"
            bg="#ecfdf5"
            subtext="Auditoriums, Labs, Halls"
          />
          <StatsCard
            icon={ShieldCheck}
            label="Enrolled Campus Accounts"
            value={stats.users?.total_users || 0}
            color="#f59e0b"
            bg="#fffbeb"
            subtext={`${stats.users?.student_count || 0} Students • ${stats.users?.organizer_count || 0} Clubs`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          <CheckCircle2 size={16} />
          <span>Event Approvals & Moderation</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "venues" ? "active" : ""}`}
          onClick={() => setActiveTab("venues")}
        >
          <Building2 size={16} />
          <span>Campus Venues ({venues.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} />
          <span>User Role Governance</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <ShieldCheck size={16} />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Event Approvals */}
      {activeTab === "approvals" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className={`btn btn-sm ${eventFilter === "pending_approval" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setEventFilter("pending_approval")}
              >
                Pending Approval
              </button>
              <button
                className={`btn btn-sm ${eventFilter === "approved" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setEventFilter("approved")}
              >
                Approved & Active
              </button>
              <button
                className={`btn btn-sm ${eventFilter === "all" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setEventFilter("all")}
              >
                All Events
              </button>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Organizer / Club</th>
                  <th>Date & Time</th>
                  <th>Venue Requested</th>
                  <th>Capacity</th>
                  <th>Current Status</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                      No events in this category.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.event_id}>
                      <td>
                        <strong>{evt.title}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{evt.category_name}</div>
                      </td>
                      <td>
                        <strong>{evt.organizer_name}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{evt.organizer_email}</div>
                      </td>
                      <td>{new Date(evt.event_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                      <td>{evt.venue_name || evt.location}</td>
                      <td>{evt.capacity} students</td>
                      <td>
                        <span className={`badge badge-${evt.status}`}>
                          {evt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          {evt.status !== "approved" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateEventStatus(evt.event_id, "approved")}
                              title="Approve & Publish Live"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                          )}
                          {evt.status !== "rejected" && (
                            <button
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => handleUpdateEventStatus(evt.event_id, "rejected")}
                              title="Reject Event"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Campus Venues */}
      {activeTab === "venues" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              University Facilities & Conflict Prevention
            </h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddVenue(!showAddVenue)}
            >
              <Plus size={16} />
              <span>{showAddVenue ? "Close Form" : "Register New Venue"}</span>
            </button>
          </div>

          {showAddVenue && (
            <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #cbd5e1", marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Register New Campus Facility</h4>
              <form onSubmit={handleCreateVenue}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Venue Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. APJ Abdul Kalam Auditorium"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Building / Block</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Science & Admin Block"
                      value={newVenueBuilding}
                      onChange={(e) => setNewVenueBuilding(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Seating Capacity</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 500"
                      value={newVenueCapacity}
                      onChange={(e) => setNewVenueCapacity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Installed Amenities</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Projector, AC, Wi-Fi, Sound System"
                      value={newVenueAmenities}
                      onChange={(e) => setNewVenueAmenities(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-sm">
                  Save Venue
                </button>
              </form>
            </div>
          )}

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue / Facility Name</th>
                  <th>Campus Location</th>
                  <th>Seating Capacity</th>
                  <th>Amenities</th>
                  <th>Scheduled Events</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.venue_id}>
                    <td>
                      <strong>{v.venue_name}</strong>
                    </td>
                    <td>{v.building} • {v.floor}</td>
                    <td>
                      <strong>{v.capacity}</strong> seats
                    </td>
                    <td style={{ fontSize: 13, color: "#475569" }}>
                      {v.amenities || "Standard facilities"}
                    </td>
                    <td>
                      <span className="badge badge-approved">
                        {v.upcoming_events_count || 0} Bookings
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: User Governance */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ position: "relative", width: 300 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search user name, email, roll no..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ paddingLeft: 36, paddingVertical: 8 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {["all", "student", "organizer", "admin"].map((r) => (
                <button
                  key={r}
                  className={`btn btn-sm ${userRoleFilter === r ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setUserRoleFilter(r)}
                  style={{ textTransform: "capitalize" }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Roll Number</th>
                  <th>Academic Department</th>
                  <th>Role</th>
                  <th>Activity</th>
                  <th>Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {u.roll_number || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.department || "General"}</td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-cancelled" : u.role === "organizer" ? "badge-pending" : "badge-registered"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>
                      {u.registration_count} Registrations • {u.created_events_count} Hosted
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.user_id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 12,
                          background: "#fff",
                        }}
                      >
                        <option value="student">Student</option>
                        <option value="organizer">Club Organizer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "logs" && (
        <div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Triggered By</th>
                  <th>Log Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-registered">
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong>{log.user_name || "System"}</strong>
                        {log.user_role && <span style={{ fontSize: 11, color: "#64748b" }}> ({log.user_role})</span>}
                      </td>
                      <td style={{ fontSize: 13, color: "#334155" }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
