// src/api/analyst.js
import api from "./api"; // <-- axios instance
import { getToken } from "./login"; // for auth token

// Helper to set headers
function authHeaders() {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Fetch merged sessions + tasks (raw session rows)
export async function getUserWork(userId) {
  if (!userId) return { success: false, data: [] };
  try {
    const res = await api.post(
      "/api/analyst/user-work",
      { user_id: userId },
      { headers: authHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching user work:", error);
    return { success: false, data: [] };
  }
}

// Daily work
export async function getDailyWork(userId, date) {
  if (!userId || !date) return { success: false, data: [] };
  try {
    const res = await api.post(
      "/api/analyst/daily-work",
      { user_id: userId, date },
      { headers: authHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching daily work:", error);
    return { success: false, data: [] };
  }
}

// Weekly work
export async function getWeekWiseWork(userId, date) {
  if (!userId || !date) return { success: false, data: [] };
  try {
    const res = await api.post(
      "/api/analyst/week-wise-work",
      { user_id: userId, date },
      { headers: authHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching week-wise work:", error);
    return { success: false, data: [] };
  }
}

// Monthly stats
export async function getMonthlyStats(userId, date) {
  if (!userId || !date) return { success: false, data: [] };
  try {
    const res = await api.post(
      "/api/analyst/monthly-stats",
      { user_id: userId, date },
      { headers: authHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return { success: false, data: [] };
  }
}
