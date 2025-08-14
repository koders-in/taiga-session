import { getToken } from "./login";

const API_BASE = "http://localhost:4000/api/taiga";

// Fetch projects list
export async function fetchProjects() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, data: [] };
  }
}

// Fetch tasks for a given project
export async function fetchTasksByProject(projectId) {
  const token = getToken();
  if (!token || !projectId) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return { success: false, data: [] };
  }
}
