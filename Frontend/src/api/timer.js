import { getToken } from "./login";

const API_BASE = "http://localhost:4000/api/timer";

export async function startTimer(taskId, taskName, category, name, project) {
  const token = getToken();

  if (!token || !taskId || !taskName || !category) {
    return { success: false, message: "Missing token, taskId, or taskName" };
  }

  try {
    const res = await fetch(`${API_BASE}/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        task_Id: taskId,
        task_Name: taskName,
        category: category,
        project: project,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error starting timer:", error);
    return { success: false, message: "Request failed" };
  }
}

export async function pauseTimer(sessionId) {
  const token = getToken();
  if (!token || !sessionId) {
    return { success: false, message: "Missing token or sessionId" };
  }

  try {
    const res = await fetch(`${API_BASE}/pause/${sessionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error pausing timer:", error);
    return { success: false, message: "Request failed" };
  }
}

export async function resumeTimer(sessionId) {
  const token = getToken();
  if (!token || !sessionId) {
    return { success: false, message: "Missing token or sessionId" };
  }

  try {
    const res = await fetch(`${API_BASE}/resume/${sessionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error resuming timer:", error);
    return { success: false, message: "Request failed" };
  }
}

export async function completeTimer(sessionId) {
  const token = getToken();
  if (!token || !sessionId) {
    return { success: false, message: "Missing token or sessionId" };
  }

  try {
    const res = await fetch(`${API_BASE}/complete/${sessionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error completing timer:", error);
    return { success: false, message: "Request failed" };
  }
}
