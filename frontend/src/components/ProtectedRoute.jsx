import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // User is not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check array of roles or single role
  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);

  if (roles.length > 0 && !roles.includes(user.role)) {
    // If admin, they have access to organizer pages as well
    if (user.role === "admin" && roles.includes("organizer")) {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;