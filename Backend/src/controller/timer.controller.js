import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// In-memory storage for active sessions
const activeSessions = new Map();

// NocoDB Configuration
const NOCODB_URL = process.env.nocodb_url || 'http://localhost:8080';
const TASKS_TABLE_ID = process.env.nocodb_table_tasks || 'mf8kw73a809ravm';
const POMODORO_TABLE_ID = process.env.nocodb_table_pomodoro_sessions || 'maea6o4q9t7ybeu';
const NOCODB_API_KEY = process.env.nocodb_token || 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY';

const nocoHeaders = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
  'xc-auth': NOCODB_API_KEY,
  'xc-token': NOCODB_API_KEY
};

// ---- TASK HELPERS ----
const createTaskRecord = async (taskData) => {
  try {
    const url = `${NOCODB_URL}/api/v2/tables/${TASKS_TABLE_ID}/records`;
    const res = await axios.post(url, taskData, { headers: nocoHeaders });
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error creating task in NocoDB:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

const updateTaskStatus = async (task_id, status) => {
  try {
    const url = `${NOCODB_URL}/api/v2/tables/${TASKS_TABLE_ID}/records`;
    const payload = { task_id, Status: status };
    const res = await axios.patch(url, payload, { headers: nocoHeaders });
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error updating task status in NocoDB:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

// ---- SESSION HELPERS ----
const createSessionRecord = async (sessionData) => {
  try {
    const url = `${NOCODB_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
    const res = await axios.post(url, sessionData, { headers: nocoHeaders });
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error creating session in NocoDB:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

const updateSessionRecord = async (sessionData) => {
  try {
    const url = `${NOCODB_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
    const res = await axios.patch(url, sessionData, { headers: nocoHeaders });
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error updating session in NocoDB:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

// ---- API ENDPOINTS ----

// Start a new timer session
export const startTimer = async (req, res) => {
  try {
    const { taskId, taskName, sessionType = 'Pomodoro' } = req.body;
    const userId = req.user.id;

    if (!taskId || !taskName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingSession = Array.from(activeSessions.values())
      .find(s => s.userId === userId && s.status === 'active');
    if (existingSession) {
      return res.status(400).json({ success: false, message: 'Active session exists' });
    }

    const sessionId = uuidv4();
    const startTime = new Date().toISOString();

    // Create task in NocoDB
    await createTaskRecord({
      task_id: taskId,
      user_id: userId,
      task_name: taskName,
      start_time: startTime,
      Status: 'Working'
    });

    // Create session in NocoDB
    await createSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: taskId,
      session_type: sessionType,
      start_time: startTime,
      status: 'active'
    });

    const newSession = {
      sessionId,
      taskId,
      taskName,
      userId,
      startTime,
      status: 'active',
      pauses: []
    };
    activeSessions.set(sessionId, newSession);

    return res.status(201).json({ success: true, sessionId, startTime });
  } catch (err) {
    console.error('Start timer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start timer' });
  }
};

// Pause timer
export const pauseTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session not active' });
    }

    session.status = 'paused';
    session.pauseStart = new Date();
    session.pauses.push({ start: session.pauseStart });

    await updateSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: session.taskId,
      status: 'paused'
    });

    return res.json({ success: true, pausedAt: session.pauseStart });
  } catch (err) {
    console.error('Pause timer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to pause timer' });
  }
};

// Resume timer
export const resumeTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Session not paused' });
    }

    const now = new Date();
    const pauseDuration = now - session.pauseStart;
    session.status = 'active';
    session.pauseDuration = (session.pauseDuration || 0) + pauseDuration;

    await updateSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: session.taskId,
      status: 'active'
    });

    return res.json({ success: true, resumedAt: now });
  } catch (err) {
    console.error('Resume timer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resume timer' });
  }
};

// Complete timer
export const completeTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const endTime = new Date().toISOString();
    const totalMinutes = Math.floor((new Date(endTime) - new Date(session.startTime) - (session.pauseDuration || 0)) / 60000);

    await updateTaskStatus(session.taskId, 'completed');

    await updateSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: session.taskId,
      end_time: endTime,
      duration_minutes: totalMinutes,
      status: 'completed'
    });

    activeSessions.delete(sessionId);

    return res.json({ success: true, endTime, totalMinutes });
  } catch (err) {
    console.error('Complete timer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete timer' });
  }
};
