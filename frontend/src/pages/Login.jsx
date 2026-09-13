import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { LogIn, Lock, Mail, ShieldCheck, Sparkles, User, UserCheck } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    addToast(`Welcome back, ${userData.name}!`, "success");

    if (userData.role === "admin") {
      navigate("/admin-dashboard");
    } else if (userData.role === "organizer") {
      navigate("/organizer-dashboard");
    } else {
      navigate("/student-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      handleLoginSuccess(response.data.user, response.data.token);
    } catch (error) {
      console.error("Login error:", error);
      addToast(error.response?.data?.message || "Invalid credentials. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for easy evaluation
  const handleQuickDemo = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const response = await API.post("/auth/login", {
        email: demoEmail,
        password: demoPassword,
      });
      handleLoginSuccess(response.data.user, response.data.token);
    } catch (err) {
      addToast("Demo account login failed. Please register a new account.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh" }}>
      <div className="form-card" style={{ width: "100%", maxWidth: 460 }}>
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
            <LogIn size={24} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Sign In to CampusSync
          </h1>
          <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 4 }}>
            Enter your institutional credentials to access your portal.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="email"
                className="form-control"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 0", marginTop: 8 }}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>{loading ? "Signing in..." : "Sign In to Portal"}</span>
          </button>
        </form>

        {/* Quick Demo Credentials Bar for Evaluators */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>
            1-Click Demo Evaluation Logins
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickDemo("arun@example.com", "password123")}
              title="Login as Student"
            >
              <User size={13} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickDemo("priya@example.com", "password123")}
              title="Login as Organizer"
            >
              <UserCheck size={13} />
              <span>Organizer</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickDemo("admin@example.com", "admin123")}
              title="Login as Administrator"
            >
              <ShieldCheck size={13} color="#4f46e5" />
              <span>Admin / Dean</span>
            </button>
          </div>
        </div>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 13.5, color: "#64748b" }}>
          Don't have an account yet?{" "}
          <Link to="/register" style={{ color: "#4f46e5", fontWeight: 700 }}>
            Create Student Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;