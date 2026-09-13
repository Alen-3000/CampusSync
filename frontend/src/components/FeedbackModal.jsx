import { useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { X, Star, MessageSquare } from "lucide-react";

function FeedbackModal({ eventId, eventTitle, initialRating = 5, initialReview = "", onClose, onSubmitted }) {
  const { addToast } = useToast();
  const [rating, setRating] = useState(initialRating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(initialReview || "");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await API.post(
        "/feedback",
        {
          event_id: eventId,
          rating,
          review_text: reviewText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      addToast("Feedback submitted successfully! Thank you for rating.", "success");
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error("Feedback error:", err);
      addToast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MessageSquare size={18} color="#4f46e5" />
            <h3 className="modal-title">Rate & Review Event</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <h4 style={{ fontSize: 16, marginBottom: 12, color: "#1e293b" }}>
              {eventTitle}
            </h4>

            {/* Star Rating Select */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Your Rating (1 to 5 Stars):</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: isFilled ? "#f59e0b" : "#cbd5e1",
                        transition: "color 0.15s ease",
                      }}
                    >
                      <Star size={32} fill={isFilled ? "#f59e0b" : "none"} />
                    </button>
                  );
                })}
                <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: "#475569" }}>
                  {rating} of 5
                </span>
              </div>
            </div>

            {/* Review Comment */}
            <div className="form-group">
              <label className="form-label">Comments & Takeaways (Optional):</label>
              <textarea
                className="form-control"
                placeholder="What did you learn? How was the organization and content?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
