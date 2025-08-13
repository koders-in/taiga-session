import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PomodoroTimerPage from "./pages/PomodoroTimerPage";
import { getToken } from "./api/login";

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Protected Route Example */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PomodoroTimerPage />
            </ProtectedRoute>
          }
        />

        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
