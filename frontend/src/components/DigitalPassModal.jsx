import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, Calendar, MapPin, User, Hash, CheckCircle2 } from "lucide-react";

function DigitalPassModal({ registration, user, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (registration?.ticket_code) {
      QRCode.toDataURL(registration.ticket_code, {
        width: 220,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [registration]);

  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#e0e7ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <h3 className="modal-title">Official Campus Entry Pass</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          <div className="ticket-pass">
            <div className="ticket-pass-header">
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#38bdf8", fontWeight: 700, letterSpacing: 1 }}>
                  UNIVERSITY CAMPUS EVENT PASS
                </span>
                <h2 style={{ fontSize: 20, color: "#fff", marginTop: 4 }}>
                  {registration.title}
                </h2>
              </div>
              <span className={`badge badge-${registration.status}`}>
                {registration.status}
              </span>
            </div>

            <div className="ticket-pass-body">
              {qrDataUrl && (
                <div className="ticket-qr-container">
                  <img src={qrDataUrl} alt="Event QR Code" style={{ display: "block" }} />
                </div>
              )}

              <div className="ticket-code-badge">
                {registration.ticket_code || "PASS-PENDING"}
              </div>

              <div className="ticket-details-grid">
                <div>
                  <div className="ticket-detail-label">Student Name</div>
                  <div className="ticket-detail-value">{user?.name || "Student"}</div>
                </div>

                <div>
                  <div className="ticket-detail-label">Roll Number</div>
                  <div className="ticket-detail-value">{user?.roll_number || "CS22B001"}</div>
                </div>

                <div>
                  <div className="ticket-detail-label">Department</div>
                  <div className="ticket-detail-value">{user?.department || "Engineering"}</div>
                </div>

                <div>
                  <div className="ticket-detail-label">Event Date</div>
                  <div className="ticket-detail-value">
                    {new Date(registration.event_date).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <div className="ticket-detail-label">Venue / Hall</div>
                  <div className="ticket-detail-value">
                    {registration.venue_name || registration.location}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
                Present this QR code at the entrance scanner for attendance & duty leave verification.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print / Save Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DigitalPassModal;
