// src/api/analyst.js
import { getToken } from "./login";

const API_BASE = "http://localhost:4000/api/analyst";

// Get week-wise work
export async function getWeekWiseWork(userId, date) {
  const token = getToken();
  if (!token || !userId || !date) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/week-wise-work`, {
      method: "POST", 
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, date }), 
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching week-wise work:", error);
    return { success: false, data: [] };
  }
}

// Get monthly stats
export async function getMonthlyStats(userId, date) {
  const token = getToken();
  if (!token || !userId || !date) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/monthly-stats`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, date }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return { success: false, data: [] };
  }
}

//  Get daily work
export async function getDailyWork(userId, date) {
  const token = getToken();
  if (!token || !userId || !date) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/daily-work`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, date }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching daily work:", error);
    return { success: false, data: [] };
  }
}


// Get user work data 
export async function getUserWork(userId, date) {
  const token = getToken();
  if (!token || !userId || !date) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/user-work`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, date }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching user work:", error);
    return { success: false, data: [] };
  }
}
