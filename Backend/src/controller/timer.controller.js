import { v4 as uuidv4 } from 'uuid';

// In-memory storage for active sessions
const activeSessions = new Map();

// Start a new timer session
export const startTimer = async (req, res) => {
  try {
    const { taskId, taskName } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request
    if (!taskId || !taskName || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check for existing active session
    const existingSession = Array.from(activeSessions.values())
      .find(s => s.userId === userId && s.status === 'active');

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Active session exists',
        sessionId: existingSession.sessionId
      });
    }

    const sessionId = uuidv4();
    const newSession = {
      sessionId, taskId, taskName, userId,
      startTime: new Date(),
      status: 'active',
      pauses: []
    };

    activeSessions.set(sessionId, newSession);
    
    return res.status(201).json({
      success: true,
      sessionId,
      startTime: newSession.startTime
    });
  } catch (error) {
    console.error('Start timer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start timer' });
  }
};

// Pause an active timer
export const pauseTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated request
    
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

    return res.json({ success: true, pausedAt: session.pauseStart });
  } catch (error) {
    console.error('Pause timer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to pause timer' });
  }
};

// Resume a paused timer
export const resumeTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated request
    
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
    
    if (session.pauses.length > 0) {
      session.pauses[session.pauses.length - 1].end = now;
      session.pauses[session.pauses.length - 1].duration = pauseDuration;
    }

    return res.json({ success: true, resumedAt: now });
  } catch (error) {
    console.error('Resume timer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resume timer' });
  }
};

// Complete a timer session
export const completeTimer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated request
    
    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const endTime = new Date();
    const totalDuration = endTime - session.startTime - (session.pauseDuration || 0);
    
    // Here you would typically save the completed session to your database
    // await saveCompletedSession({
    //   ...session,
    //   endTime,
    //   totalDuration,
    //   status: 'completed'
    // });

    activeSessions.delete(sessionId);
    
    return res.json({
      success: true,
      endTime,
      totalDuration,
      sessionId: session.sessionId
    });
  } catch (error) {
    console.error('Complete timer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete timer' });
  }
};
