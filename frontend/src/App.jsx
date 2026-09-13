import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./context/ToastContext";

import Home from "./pages/Home";
import Events from "./pages/Events";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Route */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Organizer Protected Routes */}
          <Route
            path="/organizer-dashboard"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-event/:id"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <EditEvent />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Route */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;