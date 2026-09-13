import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Save 
} from "lucide-react";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("approved");

  const [schedules, setSchedules] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, venRes, evtRes] = await Promise.all([
          API.get("/categories"),
          API.get("/venues"),
          API.get(`/events/${id}`),
        ]);

        setCategories(catRes.data);
        setVenues(venRes.data);

        const evt = evtRes.data;
        setTitle(evt.title || "");
        setDescription(evt.description || "");

        // Format dates for datetime-local input
        if (evt.event_date) {
          const d = new Date(evt.event_date);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setEventDate(d.toISOString().slice(0, 16));
        }
        if (evt.end_date) {
          const d = new Date(evt.end_date);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setEndDate(d.toISOString().slice(0, 16));
        }

        setVenueId(evt.venue_id || "");
        setCapacity(evt.capacity || "");
        setCategoryId(evt.category_id || "");
        setTags(evt.tags || "");
        setStatus(evt.status || "approved");
        setSchedules(evt.schedules || []);
      } catch (err) {
        console.error("Error loading event for edit:", err);
        addToast("Failed to load event data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const addScheduleRow = () => {
    setSchedules((prev) => [
      ...prev,
      { start_time: "", end_time: "", session_title: "", speaker_name: "", venue_details: "" },
    ]);
  };

  const removeScheduleRow = (idx) => {
    setSchedules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScheduleChange = (idx, field, val) => {
    setSchedules((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const chosenVenue = venues.find((v) => String(v.venue_id) === String(venueId));

      await API.put(
        `/events/${id}`,
        {
          title,
          description,
          event_date: eventDate,
          end_date: endDate || null,
          location: chosenVenue ? chosenVenue.venue_name : "Campus Venue",
          venue_id: venueId ? Number(venueId) : null,
          capacity: Number(capacity),
          category_id: Number(categoryId),
          tags,
          status,
          schedules: schedules.filter((s) => s.session_title && s.start_time),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      addToast("Event updated successfully!", "success");
      navigate("/organizer-dashboard");
    } catch (err) {
      console.error("Update error:", err);
      addToast(err.response?.data?.message || "Failed to update event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
        Loading event details...
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Edit Event Details
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Modify schedule, venue reservation, or capacity.
        </p>
      </div>

      <div style={{ background: "#fff", padding: 36, borderRadius: 20, border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Keywords / Tags</label>
              <input
                type="text"
                className="form-control"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Campus Venue *</label>
              <select
                className="form-control"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                required
              >
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.venue_name} ({v.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Capacity (Seats) *</label>
              <input
                type="number"
                className="form-control"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Agenda Timeline */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Event Agenda Timeline
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addScheduleRow}
              >
                <Plus size={14} />
                <span>Add Session</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {schedules.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 1fr 140px 40px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="09:00 AM"
                    value={row.start_time}
                    onChange={(e) => handleScheduleChange(idx, "start_time", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Session Title"
                    value={row.session_title}
                    onChange={(e) => handleScheduleChange(idx, "session_title", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Speaker"
                    value={row.speaker_name || ""}
                    onChange={(e) => handleScheduleChange(idx, "speaker_name", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeScheduleRow(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/organizer-dashboard")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} />
              <span>{submitting ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;