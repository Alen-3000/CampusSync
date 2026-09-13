import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  X, 
  Scan, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Users, 
  FileSpreadsheet,
  Camera,
  CameraOff
} from "lucide-react";

function AttendanceScannerModal({ event, onClose, onUpdated }) {
  const { addToast } = useToast();
  const [scanInput, setScanInput] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recentResult, setRecentResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef(null);
  const token = localStorage.getItem("token");

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/registrations/event/${event.event_id}/attendees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendees(res.data);
    } catch (err) {
      console.error("Error fetching attendees:", err);
      addToast("Failed to fetch event attendees roster", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, [event.event_id]);

  const handleCheckIn = async (codeOrRoll) => {
    const value = (codeOrRoll || scanInput).trim();
    if (!value) return;

    setProcessing(true);
    setRecentResult(null);

    try {
      const isTicket = value.toUpperCase().startsWith("PASS");
      const payload = isTicket
        ? { ticket_code: value.toUpperCase(), event_id: event.event_id }
        : { roll_number: value, event_id: event.event_id };

      const res = await API.post("/registrations/check-in", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRecentResult({
        success: true,
        message: res.data.message,
        student: res.data.student,
      });

      addToast(res.data.message, "success");
      setScanInput("");

      // Update local attendee roster
      setAttendees((prev) =>
        prev.map((att) =>
          att.registration_id === res.data.student.registration_id
            ? { ...att, status: "attended", attended_at: new Date() }
            : att
        )
      );

      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || "Check-in failed";
      setRecentResult({
        success: false,
        message: msg,
        alreadyCheckedIn: err.response?.data?.already_checked_in,
        student: err.response?.data?.student,
      });
      addToast(msg, "error");
    } finally {
      setProcessing(false);
    }
  };

  // Camera QR Scanner lifecycle
  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], // QR code
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleCheckIn(decodedText);
        },
        (error) => {
          // Continuous frame parsing errors are ignored
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch((err) => console.error("Scanner clear error:", err));
        }
      };
    }
  }, [cameraActive]);

  const handleExportCSV = async () => {
    try {
      addToast("Preparing attendee roster download...", "info");
      const res = await API.get(`/registrations/event/${event.event_id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = (event.title || `Event_${event.event_id}`).replace(/[^a-zA-Z0-9]/g, "_");
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

  const attendedCount = attendees.filter((a) => a.status === "attended").length;
  const registeredCount = attendees.filter((a) => a.status === "registered" || a.status === "attended").length;

  const filteredAttendees = attendees.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.student_name && a.student_name.toLowerCase().includes(q)) ||
      (a.roll_number && a.roll_number.toLowerCase().includes(q)) ||
      (a.ticket_code && a.ticket_code.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Scan size={20} color="#4f46e5" />
              <h3 className="modal-title">Live Gate Scanner & Attendance</h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {event.title} • {attendedCount} of {registeredCount} Attendees Checked In ({registeredCount > 0 ? Math.round((attendedCount/registeredCount)*100) : 0}%)
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Scanner Input & Camera Toggle */}
          <div
            style={{
              background: "#f1f5f9",
              padding: 20,
              borderRadius: 16,
              marginBottom: 24,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                Scan QR Code Pass or Enter Student Roll Number:
              </label>

              <button
                type="button"
                className={`btn btn-sm ${cameraActive ? "btn-secondary" : "btn-primary"}`}
                onClick={() => setCameraActive(!cameraActive)}
                style={{ padding: "6px 14px", fontSize: 12.5 }}
              >
                {cameraActive ? (
                  <>
                    <CameraOff size={14} />
                    <span>Close Camera</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>📷 Scan with Phone Camera</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Camera Feed Container */}
            {cameraActive && (
              <div
                style={{
                  background: "#ffffff",
                  padding: 16,
                  borderRadius: 14,
                  border: "2px dashed #6366f1",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                <div id="qr-reader-container" style={{ width: "100%", maxWidth: 360, margin: "0 auto" }} />
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  Point your phone or webcam at the student's digital pass QR code.
                </p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckIn();
              }}
              style={{ display: "flex", gap: 10 }}
            >
              <input
                type="text"
                className="form-control"
                placeholder="e.g. PASS-2026-1042-8XF9 or CS22B001"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                autoFocus
                disabled={processing}
                style={{ fontSize: 15, fontWeight: 600, background: "#ffffff" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={processing || !scanInput.trim()}
              >
                <UserCheck size={16} />
                <span>{processing ? "Checking..." : "Verify & Check In"}</span>
              </button>
            </form>

            {/* Live Result Feedback Banner */}
            {recentResult && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 16px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: recentResult.success ? "#dcfce7" : recentResult.alreadyCheckedIn ? "#fef3c7" : "#fee2e2",
                  color: recentResult.success ? "#166534" : recentResult.alreadyCheckedIn ? "#92400e" : "#991b1b",
                  border: `1px solid ${recentResult.success ? "#86efac" : recentResult.alreadyCheckedIn ? "#fde68a" : "#fca5a5"}`,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {recentResult.success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{recentResult.message}</span>
              </div>
            )}
          </div>

          {/* Attendee Roster Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                className="form-control"
                placeholder="Filter attendees by name/roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36, paddingVertical: 8, fontSize: 13.5 }}
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              title="Download attendee list for faculty or duty leaves"
            >
              <FileSpreadsheet size={15} color="#16a34a" />
              <span>Export Attendee Roster (CSV)</span>
            </button>
          </div>

          {/* Attendees Table */}
          <div className="data-table-wrapper" style={{ maxHeight: 340, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th>Ticket Pass</th>
                  <th>Status</th>
                  <th>Check-In Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
                      Loading attendee list...
                    </td>
                  </tr>
                ) : filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
                      No matching students found in roster.
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((att) => (
                    <tr key={att.registration_id}>
                      <td>
                        <strong>{att.student_name}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{att.student_email}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {att.roll_number || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{att.department || "General"}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4f46e5" }}>
                          {att.ticket_code || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${att.status}`}>
                          {att.status}
                        </span>
                        {att.attended_at && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {new Date(att.attended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td>
                        {att.status === "attended" ? (
                          <span style={{ color: "#16a34a", fontSize: 13, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                            <CheckCircle2 size={15} /> Attended
                          </span>
                        ) : att.status === "waitlisted" ? (
                          <span style={{ color: "#ea580c", fontSize: 12, fontWeight: 600 }}>
                            Waitlist #{att.waitlist_position}
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCheckIn(att.ticket_code || att.roll_number)}
                            disabled={processing}
                            style={{ padding: "4px 10px", fontSize: 12 }}
                          >
                            1-Click Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceScannerModal;
