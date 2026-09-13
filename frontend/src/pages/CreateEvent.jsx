import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Building2 
} from "lucide-react";

function CreateEvent() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("Technical,Coding");
  const [bannerUrl, setBannerUrl] = useState("");

  // Agenda / Schedules builder
  const [schedules, setSchedules] = useState([
    { start_time: "09:00 AM", end_time: "10:00 AM", session_title: "Registration & Inauguration", speaker_name: "", venue_details: "" },
  ]);

  // Conflict Warning State
  const [conflictWarning, setConflictWarning] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFormMeta = async () => {
      try {
        const [catRes, venRes] = await Promise.all([
          API.get("/categories"),
          API.get("/venues"),
        ]);
        setCategories(catRes.data);
        setVenues(venRes.data);
      } catch (err) {
        console.error("Meta fetch error:", err);
      }
    };
    fetchFormMeta();
  }, []);

  // When venue is selected, pre-fill capacity
  const handleVenueChange = (vId) => {
    setVenueId(vId);
    const chosen = venues.find((v) => String(v.venue_id) === String(vId));
    if (chosen) {
      setCapacity(chosen.capacity);
    }
  };

  // Check venue conflict when venue or date changes
  useEffect(() => {
    const checkConflict = async () => {
      if (!venueId || !eventDate) {
        setConflictWarning(null);
        return;
      }

      setCheckingConflict(true);
      try {
        const params = new URLSearchParams({
          venue_id: venueId,
          event_date: eventDate,
        });
        if (endDate) params.append("end_date", endDate);

        const res = await API.get(`/venues/check-availability?${params.toString()}`);
        if (!res.data.available && res.data.conflicts?.length > 0) {
          setConflictWarning(res.data.conflicts[0]);
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error("Conflict check error:", err);
      } finally {
        setCheckingConflict(false);
      }
    };

    const timer = setTimeout(checkConflict, 400);
    return () => clearTimeout(timer);
  }, [venueId, eventDate, endDate]);

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

    if (conflictWarning) {
      addToast("Please choose another venue or time slot to prevent collision.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const chosenVenue = venues.find((v) => String(v.venue_id) === String(venueId));

      await API.post(
        "/events",
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
          banner_url: bannerUrl || null,
          schedules: schedules.filter((s) => s.session_title && s.start_time),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      addToast("Event created successfully!", "success");
      navigate("/organizer-dashboard");
    } catch (err) {
      console.error("Create event error:", err);
      addToast(err.response?.data?.message || "Failed to create event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Launch New Campus Event
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Reserve campus venues, set attendance capacities, and design session agenda timelines.
        </p>
      </div>

      <div style={{ background: "#fff", padding: 36, borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "var(--shadow-sm)" }}>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. National Inter-College Hackathon 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Tags */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Event Category *</label>
              <select
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
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
                placeholder="e.g. AI, Web3, Hackathon, Dance"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Dates */}
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

          {/* Venue & Capacity with Conflict Detection */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Campus Venue / Hall *</label>
              <select
                className="form-control"
                value={venueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                required
              >
                <option value="">Choose Campus Facility</option>
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.venue_name} ({v.capacity} seats • {v.building})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Capacity (Seats) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Real-time Venue Conflict Warning */}
          {checkingConflict && (
            <div style={{ fontSize: 13, color: "#6366f1", marginBottom: 16 }}>
              Checking campus venue availability...
            </div>
          )}

          {conflictWarning && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#991b1b",
                fontSize: 13.5,
                marginBottom: 20,
              }}
            >
              <AlertTriangle size={20} />
              <div>
                <strong>Venue Collision Detected!</strong> '{conflictWarning.title}' is already booked at this facility during this time. Please select a different venue or adjust your dates.
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Event Description & Rules</label>
            <textarea
              className="form-control"
              placeholder="Provide event overview, prerequisites, eligibility, and prizes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Agenda & Timeline Builder */}
          <div style={{ marginTop: 28, marginBottom: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Event Agenda Timeline (Optional)
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b" }}>
                  Add sessions, keynote speakers, or competition rounds.
                </p>
              </div>
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
                    placeholder="Session Title (e.g. Keynote)"
                    value={row.session_title}
                    onChange={(e) => handleScheduleChange(idx, "session_title", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Speaker / Mentor"
                    value={row.speaker_name}
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || Boolean(conflictWarning)}
            >
              <Sparkles size={16} />
              <span>{submitting ? "Publishing Event..." : "Publish Event"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;