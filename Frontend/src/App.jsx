import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PomodoroTimerPage from "./pages/PomodoroTimerPage";
import api from "./api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      api.setToken(token);
    } else {
      localStorage.removeItem("token");
      api.setToken(null);
    }
  }, [token]);

  const handleLogin = (token) => setToken(token);
  const handleLogout = () => setToken(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PomodoroTimerPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
