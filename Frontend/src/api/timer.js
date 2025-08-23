import { getToken } from "./login";

const API_BASE = "http://localhost:4000/api/timer";

export async function startTimer(taskId, taskName, category, name, project, note) {
  const token = getToken();

  if (!token || !taskId || !taskName || !category) {
    return { success: false, message: "Missing token, taskId, or taskName" };
  }

  const payload = {
    task_Id: taskId,
    task_Name: taskName,
    category: category,
    name: name,
    project: project,
    note: note || ""
  };

  console.log(" Sending Start Timer Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(" Start Timer API Response:", data);
    return data;
  } catch (error) {
    console.error(" Error starting timer:", error);
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
      method: "PATCH",
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
      method: "PATCH",
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

export async function resetTimer(sessionId, note) {
  const token = getToken();
  if (!token || !sessionId) {
    return { success: false, message: "Missing token or sessionId" };
  }
  const payload = { note: note || "" };

  try {
    const res = await fetch(`${API_BASE}/reset/${sessionId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("Error resetting timer:", error);
    return { success: false, message: "Request failed" };
  }
}


export async function completeTimer(sessionId, note, auto = "False") {
  const token = getToken();
  if (!token || !sessionId) {
    return { success: false, message: "Missing token or sessionId" };
  }

  const payload = {
    auto, 
    note: note || ""
  };

  try {
    const res = await fetch(`${API_BASE}/complete/${sessionId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error completing timer:", error);
    return { success: false, message: "Request failed" };
  }
}


export async function startBreak() {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/break`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error starting break:", error);
    return { success: false, message: "Request failed" };
  }
}

export async function endBreak() {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/endbreak`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error ending break:", error);
    return { success: false, message: "Request failed" };
  }
}