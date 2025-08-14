import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// In-memory storage for active sessions
const activeSessions = new Map();

// NocoDB Configuration
const NOCODB_BASE_URL = process.env.nocodb_url || 'http://localhost:8080';
const TASKS_TABLE_ID = process.env.nocodb_table_tasks || 'mf8kw73a809ravm';
const POMODORO_TABLE_ID = process.env.nocodb_table_pomodoro_sessions || 'maea6o4q9t7ybeu';
const NOCODB_API_KEY = process.env.nocodb_token || 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY';

// NocoDB API configuration
const nocoHeaders = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
  'xc-token': NOCODB_API_KEY
};

// ---- TASK HELPERS ----
const createTaskRecord = async (taskData) => {
  try {
    // Debug: Log all relevant values
    console.log('Debug - Environment Variables:', {
      NOCODB_BASE_URL,
      TASKS_TABLE_ID,
      'NOCODB_BASE_URL from env': process.env.nocodb_url,
      'TASKS_TABLE_ID from env': process.env.nocodb_table_tasks
    });
    
    // Construct the URL for task creation
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records`;
    console.log('NocoDB Request URL:', url);
    console.log('Full request details:', {
      method: 'POST',
      url,
      headers: nocoHeaders,
      data: {
        task_id: taskData.taskId || taskData.task_id,
        user_id: taskData.userId || taskData.user_id,
        task_name: taskData.taskName || taskData.task_name,
        start_time: taskData.startTime || taskData.start_time,
        Status: taskData.status || 'Working'
      }
    });
    
    // Format task data according to the NocoDB schema
    const formattedTask = {
      task_id: taskData.taskId || taskData.task_id,
      user_id: taskData.userId || taskData.user_id,
      task_name: taskData.taskName || taskData.task_name,
      start_time: taskData.startTime || new Date().toISOString(),
      Status: taskData.status || 'Working', // Default status is 'Working
    };
    
    console.log('Creating task in NocoDB:', {
      url,
      data: formattedTask,
      headers: {
        ...nocoHeaders,
        'xc-token': '***' // Don't log the actual token
      }
    });
    
    const res = await axios.post(url, formattedTask, { 
      headers: nocoHeaders,
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('Task creation response:', {
      status: res.status,
      data: res.data
    });
    
    return { 
      success: res.status >= 200 && res.status < 300, 
      data: res.data,
      status: res.status
    };
  } catch (err) {
    console.error('Error creating task in NocoDB:', {
      message: err.message,
      response: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data
      }
    });
    
    return { 
      success: false, 
      error: err.message,
      response: err.response?.data,
      status: err.response?.status
    };
  }
};

const updateTaskStatus = async (taskId, status) => {
  try {
    // First, find the task record by task_id
    const filterUrl = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records?where=(task_id,eq,${taskId})`;
    const filterRes = await axios.get(filterUrl, { headers: nocoHeaders });
    
    if (!filterRes.data.list || filterRes.data.list.length === 0) {
      return { 
        success: false, 
        error: 'Task not found',
        taskId
      };
    }
    
    const recordId = filterRes.data.list[0].Id;
    const updateUrl = `${NOCODB_BASE_URL}/api/v2/tables/${TASKS_TABLE_ID}/records/${recordId}`;
    
    const payload = {
      Status: status,
      // Include the task_id in the update to maintain data consistency
      task_id: taskId
    };
    
    const res = await axios.patch(updateUrl, payload, { 
      headers: nocoHeaders 
    });
    
    return { 
      success: true, 
      data: res.data,
      taskId,
      status
    };
  } catch (err) {
    console.error('Error updating task status in NocoDB:', err.response?.data || err.message);
    return { 
      success: false, 
      error: err.message,
      response: err.response?.data,
      taskId,
      status
    };
  }
};

// ---- SESSION HELPERS ----
const createSessionRecord = async (sessionData) => {
  try {
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
    
    // Prepare session data with all required fields
    const sessionPayload = {
      session_id: sessionData.session_id,
      user_id: sessionData.user_id,
      task_id: sessionData.task_id,
      session_type: sessionData.session_type || 'pomodoro', // Default to 'pomodoro' if not specified
      start_time: sessionData.start_time || new Date().toISOString(),
      end_time: sessionData.end_time || null,
      duration_minutes: sessionData.duration_minutes || 0, // Will be updated when session ends
      interrupted: sessionData.interrupted || false,
      // Note: Status values must match exactly with NocoDB enum: 'Started', 'Paused', 'Completed'
      status: sessionData.status || 'Started'
    };
    
    console.log('Creating session with data:', sessionPayload);
    
    const res = await axios.post(url, sessionPayload, { 
      headers: nocoHeaders,
      validateStatus: (status) => status < 500
    });
    
    console.log('Session creation response:', {
      status: res.status,
      data: res.data
    });
    
    return { 
      success: res.status >= 200 && res.status < 300, 
      data: res.data,
      status: res.status
    };
  } catch (err) {
    console.error('Error creating session in NocoDB:', {
      message: err.message,
      response: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data
      }
    });
    return { 
      success: false, 
      error: err.message,
      response: err.response?.data,
      status: err.response?.status
    };
  }
};

const updateSessionRecord = async (sessionData) => {
  try {
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${POMODORO_TABLE_ID}/records`;
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
    // Get task details from frontend
    const { task_Id, task_Name, category, duration_minutes } = req.body;
    
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // Map frontend field names to backend expected names
    const taskId = task_Id;
    const taskName = task_Name;
    const sessionType = category || 'pomodoro';
    
    // Validate required fields
    if (!taskId || !taskName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: task_Id and task_Name are required' 
      });
    }

    // Check for existing active session for this user
    const existingSession = Array.from(activeSessions.values())
      .find(s => s.userId === userId && s.status === 'active');
      
    if (existingSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active session',
        activeSessionId: existingSession.sessionId
      });
    }
    
    // Generate a unique session ID and timestamp
    const sessionId = uuidv4();
    const startTime = new Date().toISOString();

    console.log(`Creating new task for user ${userId}:`, { 
      task_Id, 
      task_Name, 
      startTime 
    });

    // Create task in NocoDB
    const taskResult = await createTaskRecord({
      task_id: taskId,
      user_id: userId,
      task_name: taskName,
      start_time: startTime,
      Status: 'Working', // Default status as per requirements
      category: sessionType
    });

    if (!taskResult.success) {
      console.error('Failed to create task:', taskResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create task',
        error: taskResult.error
      });
    }

    // Create session in NocoDB
    const sessionResult = await createSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: taskId,
      session_type: sessionType,
      start_time: startTime,
      duration_minutes: duration_minutes || 25, // Default to 25 minutes for pomodoro
      status: 'Started',
      interrupted: false
    });

    if (!sessionResult.success) {
      console.error('Failed to create session:', sessionResult.error);
      // Note: We don't fail here since the task was created successfully
    }

    // Store session in memory
    const newSession = {
      sessionId,
      taskId,
      taskName,
      userId,
      startTime,
      status: 'active',
      pauseStart: null,
      pauseDuration: 0,
      pauses: []
    };
    
    activeSessions.set(sessionId, newSession);

    console.log(`Timer started successfully for user ${userId}, session ${sessionId}`);
    
    return res.status(201).json({ 
      success: true, 
      sessionId, 
      startTime,
      task: {
        id: taskId,
        name: taskName
      }
    });
    
  } catch (err) {
    console.error('Start timer error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to start timer',
      error: err.message 
    });
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

// Reset timer session
export const resetTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Update session status to 'cancelled' in the database
    await updateSessionRecord({
      session_id: sessionId,
      user_id: userId,
      task_id: session.taskId,
      status: 'cancelled',
      end_time: new Date().toISOString()
    });

    // Remove from active sessions
    activeSessions.delete(sessionId);

    return res.json({ 
      success: true, 
      message: 'Session reset successfully',
      resetAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Reset timer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset timer' });
  }
};
