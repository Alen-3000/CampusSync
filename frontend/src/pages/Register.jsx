import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { UserPlus, User, Mail, Lock, Phone, Hash, Building2, Sparkles } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password,
        role,
        department,
        roll_number: rollNumber || `CS26B${Math.floor(100 + Math.random() * 900)}`,
        phone,
        year_of_study: yearOfStudy,
      });

      addToast(response.data.message || "Account created successfully! Please sign in.", "success");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);
      addToast(
        error.response?.data?.message || "Registration failed. Please verify your details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="form-card" style={{ width: "100%", maxWidth: 540 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)",
            }}
          >
            <UserPlus size={24} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Create CampusSync Account
          </h1>
          <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 4 }}>
            Register to claim digital event passes, attend workshops, or host campus activities.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Nair"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Register As *</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student Attendee</option>
                <option value="organizer">Club / Faculty Organizer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. rahul@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Academic Department</label>
              <select
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Roll No / Student ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CS22B042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select
                className="form-control"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 0", marginTop: 12 }}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>{loading ? "Registering..." : "Create Account"}</span>
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 13.5, color: "#64748b" }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "#4f46e5", fontWeight: 700 }}>
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;