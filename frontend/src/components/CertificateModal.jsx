import { useEffect, useState } from "react";
import API from "../services/api";
import QRCode from "qrcode";
import { X, Award, Printer, ShieldCheck } from "lucide-react";

function CertificateModal({ eventId, onClose }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/certificates/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCert(res.data.certificate);

        // Generate verification QR
        if (res.data.certificate?.certificate_number) {
          const verifyUrl = `${window.location.origin}/verify-cert/${res.data.certificate.certificate_number}`;
          const qrcode = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
          setQrUrl(qrcode);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [eventId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={20} color="#eab308" />
            <h3 className="modal-title">Certificate of Participation</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              Generating authenticated participation certificate...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 30, color: "#dc2626" }}>
              <p style={{ fontWeight: 600 }}>{error}</p>
            </div>
          ) : (
            <div className="certificate-frame">
              <div className="cert-header">
                College of Engineering & Technology
              </div>
              <div className="cert-sub">
                Department of Academic & Co-Curricular Affairs
              </div>

              <div style={{ margin: "28px auto 10px auto", width: 60, height: 2, background: "#d4af37" }} />

              <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#64748b" }}>
                This is proudly presented to
              </p>

              <h1 className="cert-recipient">
                {cert.student_name}
              </h1>

              <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
                Roll Number: <strong>{cert.roll_number || "N/A"}</strong> • Department of <strong>{cert.department}</strong>
              </p>

              <p className="cert-text">
                For active participation and successful completion of the university event{" "}
                <strong>"{cert.event_title}"</strong> held on{" "}
                <strong>{new Date(cert.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 36,
                  paddingTop: 20,
                  borderTop: "1px dashed #cbd5e1",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                    Faculty Coordinator
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                    {cert.organizer_name || "Head of Department"}
                  </div>
                </div>

                {qrUrl && (
                  <div style={{ textAlign: "center" }}>
                    <img src={qrUrl} alt="Verify QR" style={{ width: 64, height: 64, display: "block", margin: "0 auto" }} />
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", marginTop: 4 }}>
                      {cert.certificate_number}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                    Dean / Principal
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                    Academic Affairs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          {cert && (
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
