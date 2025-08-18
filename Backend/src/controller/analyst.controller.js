import axios from "axios";
import { format, parseISO, isSameDay } from 'date-fns';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes cache TTL

// Helper function to format duration in seconds to HH:MM:SS
function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

// Fetch and merge sessions + tasks for a given user
export const getUserWorkData = async (req, res) => {
  try {
    const { user_id } = req.body;
    // Check cache first
    const cacheKey = `user_${user_id}_data`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      return res.json({
        ...cachedData.data,
        cached: true,
        timestamp: new Date(cachedData.timestamp).toISOString()
      });
    }

    // API endpoints
    const sessionsUrl = `http://localhost:8080/api/v2/tables/maea6o4q9t7ybeu/records?where=(user_id,eq,${user_id})&limit=1000`;
    const tasksUrl = `http://localhost:8080/api/v2/tables/mf8kw73a809ravm/records?where=(user_id,eq,${user_id})&limit=1000`;

    // Common headers with API key authentication
    const headers = {
      'Content-Type': 'application/json',
      'xc-token': 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY',
      'xc-auth': 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY'
    };

    // Fetch both in parallel with headers
    const [sessionsRes, tasksRes] = await Promise.all([
      axios.get(sessionsUrl, { headers }),
      axios.get(tasksUrl, { headers }),
    ]);

    const sessions = sessionsRes.data.list || [];
    const tasks = tasksRes.data.list || [];

    // Create a map of task_id to task details for quick lookup
    const taskMap = new Map();
    tasks.forEach(task => {
      taskMap.set(task.task_id, {
        task_name: task.task_name,
        status: task.status,
        start_time: task.start_time,
        created_at: task.CreatedAt,
        updated_at: task.UpdatedAt
      });
    });

    // Merge sessions with task info
    const mergedData = sessions.map(session => {
      const taskInfo = taskMap.get(session.task_id) || {};
      return {
        session_id: session.session_id,
        user_id: session.user_id,
        task_id: session.task_id,
        task_name: taskInfo.task_name || 'Unknown',
        task_status: taskInfo.status || 'Unknown',
        session_type: session.session_type,
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.duration_minutes,
        status: session.status,
        created_at: session.CreatedAt,
        updated_at: session.UpdatedAt
      };
    });

    // Sort by start_time (newest first)
    mergedData.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    // Store the result (you can save this to a database or file if needed)
    const result = {
      success: true,
      data: mergedData,
      meta: {
        totalSessions: sessions.length,
        totalTasks: tasks.length,
        mergedCount: mergedData.length
      }
    };

    // Store in cache
    cache.set(cacheKey, {
      data: {
        ...result,
        sessions,  // Store raw sessions for getDailyWork
        tasks      // Store raw tasks for getDailyWork
      },
      timestamp: Date.now()
    });

    // Send response with cache info
    res.json({
      ...result,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in getUserWorkData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user work data',
      error: error.message
    });
  }
};


// Get daily work statistics for a specific date
export const getDailyWork = async (req, res) => {
  try {
    const { user_id, date } = req.body;
    
    if (!user_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Both user_id and date are required as query parameters'
      });
    }
    
    // Validate date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }
    
    // Normalize target date to YYYY-MM-DD format for consistency
    const formattedDate = format(targetDate, 'yyyy-MM-dd');
    const cacheKey = `daily_${user_id}_${formattedDate}`;
    const cachedData = cache.get(cacheKey);
    
    let sessions = [];
    let tasks = [];
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      // Use cached data if available and not expired
      sessions = cachedData.sessions || [];
      tasks = cachedData.tasks || [];
    } else {
      // If no cache or expired, fetch fresh data
      const sessionsUrl = `http://localhost:8080/api/v2/tables/maea6o4q9t7ybeu/records?where=(user_id,eq,${user_id})&limit=1000`;
      const tasksUrl = `http://localhost:8080/api/v2/tables/mf8kw73a809ravm/records?where=(user_id,eq,${user_id})&limit=1000`;

      const headers = {
        'Content-Type': 'application/json',
        'xc-token': 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY',
        'xc-auth': 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY'
      };

      const [sessionsResponse, tasksResponse] = await Promise.all([
        axios.get(sessionsUrl, { headers }),
        axios.get(tasksUrl, { headers })
      ]);

      sessions = sessionsResponse.data?.list || [];
      tasks = tasksResponse.data?.list || [];
      
      // Update cache
      cache.set(cacheKey, {
        sessions,
        tasks,
        timestamp: Date.now()
      });
    }

    // Create a map of task_id to task details
    const taskMap = new Map();
    tasks.forEach(task => {
      taskMap.set(task.task_id, {
        name: task.task_name || 'Unnamed Task',
        status: task.status || 'unknown',
        project_id: task.project_id
      });
    });

    // Process sessions for the target date
    const dailyStats = {};
    const wasCached = !!(cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL);
    
    sessions.forEach(session => {
      if (!session.created_at) return;
      
      const sessionDate = new Date(session.created_at);
      if (isNaN(sessionDate.getTime())) return;
      
      // Extract date part in YYYY-MM-DD format for comparison
      const sessionDateStr = format(sessionDate, 'yyyy-MM-dd');
      
      // Only process sessions for the target date
      if (sessionDateStr === formattedDate) {
        const taskId = session.task_id;
        const task = taskMap.get(taskId) || { 
          name: `Task ${taskId}`, 
          status: 'unknown',
          project_id: null
        };
        
        // Convert minutes to seconds for formatDuration function
        const duration = (session.duration_minutes || 0) * 60;
        
        if (!dailyStats[taskId]) {
          dailyStats[taskId] = {
            task_id: taskId,
            task_name: task.name,
            status: task.status,
            project_id: task.project_id,
            total_duration: 0, // in seconds
            session_count: 0
          };
        }
        
        dailyStats[taskId].total_duration += duration;
        dailyStats[taskId].session_count += 1;
      }
    });
    
    // Convert to array and format duration as HH:MM:SS
    const taskList = Object.values(dailyStats).map(task => ({
      ...task,
      total_duration: formatDuration(task.total_duration)
    }));
    
    // Sort tasks by duration (descending)
    taskList.sort((a, b) => {
      // Convert HH:MM:SS to seconds for comparison
      const toSeconds = (timeStr) => {
        const [h, m, s] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
      };
      return toSeconds(b.total_duration) - toSeconds(a.total_duration);
    });
    
    // Calculate total duration in seconds
    const totalSeconds = Object.values(dailyStats).reduce(
      (sum, task) => sum + task.total_duration, 0
    );

    const result = {
      success: true,
      date: formattedDate,
      user_id: parseInt(user_id),
      total_tasks: taskList.length,
      total_duration: formatDuration(totalSeconds),
      tasks: taskList,
      cached: wasCached,
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error('Error in getDailyWork:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily work data',
      error: error.message
    });
  }
};


