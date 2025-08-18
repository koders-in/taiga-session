import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendDiscordMessage } from "../utils/discordWebhook.js";

// In-memory storage for active sessions
const activeSessions = new Map();

// NocoDB Configuration
const NOCODB_BASE_URL = process.env.nocodb_url;
const TASKS_TABLE_ID = process.env.nocodb_table_tasks;
const POMODORO_TABLE_ID = process.env.nocodb_table_pomodoro_sessions;
const NOCODB_API_KEY = process.env.nocodb_token;

const nocoHeaders = {
  accept: "application/json",
  "Content-Type": "application/json",
  "xc-token": NOCODB_API_KEY,
};

// ---- HELPERS ----
const createTaskRecord = async (taskData) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records`;
  return axios.post(url, taskData, { headers: nocoHeaders });
};

const updateTaskStatus = async (taskId, status) => {
  try {
    const filterUrl = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records?where=(task_id,eq,${taskId})`;
    const filterRes = await axios.get(filterUrl, { headers: nocoHeaders });

    if (!filterRes.data.list || filterRes.data.list.length === 0) {
      return { success: false, error: "Task not found", taskId };
    }

    const recordId = filterRes.data.list[0].Id;
    const updateUrl = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records`;

    const updatePayload = [
      {
        Id: recordId,
        status: status,
        task_id: taskId,
      },
    ];

    const res = await axios.patch(updateUrl, updatePayload, {
      headers: nocoHeaders,
    });
    return { success: true, data: res.data, taskId, status };
  } catch (err) {
    console.error(
      "Error updating task status in NocoDB:",
      err.response?.data || err.message
    );
    return {
      success: false,
      error: err.message,
      response: err.response?.data,
      taskId,
      status,
    };
  }
};

const createSessionRecord = async (sessionData) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
  return axios.post(url, sessionData, { headers: nocoHeaders });
};

const updateSessionRecord = async (Id, updateData) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
  return axios.patch(url, [{ Id, ...updateData }], { headers: nocoHeaders });
};

// ---- API ENDPOINTS ----

// Start timer
export const startTimer = async (req, res) => {
  try {
    // Get task details from frontend
    const { task_Id, task_Name, category, duration_minutes, name, project } =
      req.body;

    // Get user ID from the authenticated user

    const userId = req.user.id;

    if (!task_Id || !task_Name || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: task_Id, task_Name, and category are required",
      });
    }

    // Prevent multiple active sessions for same user
    if (
      Array.from(activeSessions.values()).some(
        (s) => s.userId === userId && s.status === "active"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have an active session",
      });
    }

    const sessionId = uuidv4();
    const startTime = new Date().toISOString();

    // --- Check if task already exists ---
    let taskRecordId;
    const filterUrl = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records?where=(task_id,eq,${task_Id})~and(user_id,eq,${userId})`;
    const existingTaskRes = await axios.get(filterUrl, {
      headers: nocoHeaders,
    });

    console.log(`Creating new task for user ${userId}:`, {
      task_Id,
      task_Name,
      startTime,
    });

    if (existingTaskRes.data.list && existingTaskRes.data.list.length > 0) {
      taskRecordId = existingTaskRes.data.list[0].Id;
      await updateTaskStatus(task_Id, "Working");
    } else {
      const taskResult = await createTaskRecord({
        task_id: task_Id,
        user_id: userId,
        task_name: task_Name,
        start_time: startTime,
        Status: "Working",
      });

      if (!taskResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to create task",
        });
      }
      taskRecordId = taskResult.data?.Id;
    }

    // --- Create new session in DB ---
    const sessionRes = await createSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: task_Id,
      session_type: category,
      start_time: startTime,
      duration_minutes: 0,
      status: "Started",
      interrupted: false,
    });

    const sessionRecordId = sessionRes.data?.Id || null;

    // --- Save in memory ---
    activeSessions.set(sessionId, {
      sessionId,
      taskId: task_Id,
      taskName: task_Name,
      userId,
      startTime,
      status: "active",
      pauseStart: null,
      pauseDuration: 0,

      lastResumeTime: new Date(),
      duration_minutes: 0,
      recordId: sessionRecordId, // 🔑 store DB record id
    });

    // webHook send msg on discord'

    await sendDiscordMessage("Session started", {
      name: name,
      Title: task_Name,
      sessionId: sessionId,
      startTime: startTime, // Can be Date or ISO string
      status: "active",
      project: project,
    });

    return res.status(201).json({
      success: true,
      sessionId,
      startTime,
      recordId: sessionRecordId,
      task: {
        id: task_Id,
        name: task_Name,
        recordId: taskRecordId,
      },
    });
  } catch (err) {
    console.error("Start timer error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to start timer" });
  }
};

// Pause timer
export const pauseTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { full_name, id } = req.user;

    const session = activeSessions.get(sessionId);

    if (!session || session.userId !== id || session.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or not active" });
    }

    const now = new Date();
    const workMs =
      now - (session.lastResumeTime || new Date(session.startTime));
    const workedMinutes = workMs / 60000;

    session.duration_minutes += workedMinutes;
    session.status = "Paused";
    session.pauseStart = now;

    await updateSessionRecord(session.recordId, {
      status: "Paused",
      duration_minutes: session.duration_minutes.toFixed(2),
    });

    await sendDiscordMessage("Pause Session", {
      name: full_name,
      Title: session.taskName,
      sessionId: sessionId,
      startTime: session.pauseStart, // Can be Date or ISO string
      status: "pause",
    });
    res.json({
      success: true,
      pausedAt: now,
      duration: session.duration_minutes,
    });
  } catch (err) {
    console.error("Pause timer error:", err);
    res.status(500).json({ success: false, message: "Failed to pause timer" });
  }
};

// Resume timer
export const resumeTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { full_name, id } = req.user;

    const session = activeSessions.get(sessionId);
    console.log(session);

    if (!session || session.userId !== id || session.status !== "Paused") {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or not Paused" });
    }

    session.status = "active";
    session.lastResumeTime = new Date();
    session.pauseStart = null;

    await updateSessionRecord(session.recordId, { status: "Started" });

    await sendDiscordMessage("Resume session", {
      name: full_name,
      Title: session.taskName,
      sessionId: sessionId,
      startTime: Date.now(), // Can be Date or ISO string
      status: "resumed",
    });

    res.json({ success: true, resumedAt: session.lastResumeTime });
  } catch (err) {
    console.error("Resume timer error:", err);
    res.status(500).json({ success: false, message: "Failed to resume timer" });
  }
};

// Complete timer
export const completeTimer = async (req, res) => {
  try {
    // Default auto = false if not provided
    const { auto = false } = req.body || {};

    const { sessionId } = req.params;
    const { full_name, id } = req.user;

    const session = activeSessions.get(sessionId);

    if (!session || session.userId !== id || session.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or not active" });
    }

    const now = new Date();
    let totalMinutes = session.duration_minutes || 0;

    if (session.status === "active") {
      const workMs =
        now - (session.lastResumeTime || new Date(session.startTime));
      totalMinutes += workMs / 60000;
    }

    session.status = "Completed";
    activeSessions.delete(sessionId);

    await updateSessionRecord(session.recordId, {
      status: "Completed",
      end_time: now.toISOString(),
      duration_minutes: totalMinutes.toFixed(2),
    });

    if (!auto) {
      await updateTaskStatus(session.taskId, "Completed");
    }

    await sendDiscordMessage("Complete Session", {
      name: full_name,
      Title: session.taskName,
      sessionId: sessionId,
      startTime: Date.now(),
      status: "completed",
    });

    return res.json({
      success: true,
      endTime: now,
      totalMinutes: parseFloat(totalMinutes.toFixed(2)),
      autoCompleted: !!auto,
      sessionId,
    });
  } catch (err) {
    console.error("Complete timer error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to complete timer" });
  }
};

// Reset timer
export const resetTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { full_name, id } = req.user;

    const session = activeSessions.get(sessionId);

    if (!session || session.userId !== id || session.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or not active" });
    }

    activeSessions.delete(sessionId);

    await updateSessionRecord(session.recordId, {
      status: "Cancelled",
      end_time: new Date().toISOString(),
      duration_minutes: session.duration_minutes.toFixed(2),
      interrupted: "True",
    });
    await sendDiscordMessage("Reset Session", {
      name: full_name,
      Title: session.taskName,
      sessionId: sessionId,
      startTime: Date.now(), // Can be Date or ISO string, desc: Reset time
      status: "reset",
    });

    res.json({ success: true, message: "Session reset successfully" });
  } catch (err) {
    console.error("Reset timer error:", err);
    res.status(500).json({ success: false, message: "Failed to reset timer" });
  }
};
