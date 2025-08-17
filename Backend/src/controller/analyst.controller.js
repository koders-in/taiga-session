import axios from 'axios';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, formatISO } from 'date-fns';

const NOCODB_API = process.env.nocodb_url;
const NOCODB_API_KEY = process.env.nocodb_token;

// Table IDs
const SESSIONS_TABLE_ID = process.env.nocodb_table_pomodoro_sessions;
const TASKS_TABLE_ID = process.env.nocodb_table_tasks;

// View IDs
const SESSIONS_VIEW_ID = 'vw0itg2hgqgue3t4';
const TASKS_VIEW_ID = 'vwe25ksw5e0sqwtv';

const axiosInstance = axios.create({
  baseURL: NOCODB_API,
  headers: {
    'xc-token': NOCODB_API_KEY,
    'Content-Type': 'application/json'
  }
});

const getSessions = async (userId, options = {}) => {
  try {
    const { limit = 1000, offset = 0, where = '' } = options;
    let url = `/api/v2/tables/${SESSIONS_TABLE_ID}/records?viewId=${SESSIONS_VIEW_ID}`;
    
    // Add user filter
    const userFilter = `(user_id,eq,${userId})`;
    const whereClause = where ? `${where}~and(${userFilter})` : `where=${userFilter}`;
    
    url += `&${whereClause}&limit=${limit}&offset=${offset}`;
    
    const response = await axiosInstance.get(url);
    return response.data.list || [];
  } catch (error) {
    console.error('Error fetching sessions from NocoDB:', error);
    throw error;
  }
};

// Helper function to fetch tasks for a user
const getTasks = async (userId, options = {}) => {
  try {
    const { limit = 1000, offset = 0, where = '' } = options;
    let url = `/api/v2/tables/${TASKS_TABLE_ID}/records?viewId=${TASKS_VIEW_ID}`;
    
    // Add user filter
    const userFilter = `(user_id,eq,${userId})`;
    const whereClause = where ? `${where}~and(${userFilter})` : `where=${userFilter}`;
    
    url += `&${whereClause}&limit=${limit}&offset=${offset}`;
    
    const response = await axiosInstance.get(url);
    return response.data.list || [];
  } catch (error) {
    console.error('Error fetching tasks from NocoDB:', error);
    throw error;
  }
};

// @desc    Get all tasks for the current user
// @route   GET /api/analyst/tasks
// @access  Private
export const getUserTasks = async (req, res) => {
    try {
        const { page = 1, limit = 25, sort = '-created_at' } = req.query;
        const offset = (page - 1) * limit;
        
        // Get tasks from NocoDB
        const tasks = await getTasks(req.user.id, { 
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get total count for pagination
        const countResponse = await axiosInstance.get(`/api/v2/tables/${TASKS_TABLE_ID}/count?where=(user_id,eq,${req.user.id})`);
        const total = countResponse.data?.count || 0;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            data: tasks
        });
    } catch (error) {
        console.error('Error in getUserTasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// @desc    Get work done for the last 7 days
// @route   GET /api/analyst/week-wise-work
// @access  Private
export const getWeekWiseWork = async (req, res) => {
    try {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        
        // Initialize an array to hold the last 7 days' data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            return {
                date,
                dayName: dayNames[date.getDay()],
                totalMinutes: 0
            };
        }).reverse();

        // Get sessions for the last 7 days
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Get sessions from NocoDB
        const dateFilter = `(start_time,bw,${formatISO(sevenDaysAgo)},${formatISO(today)})`;
        const sessions = await getSessions(req.user.id, { where: `where=${dateFilter}` });

        // Calculate minutes for each day
        sessions.forEach(session => {
            if (!session.start_time) return;
            
            const sessionDate = new Date(session.start_time);
            const dayIndex = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
            
            if (dayIndex >= 0 && dayIndex < 7) {
                last7Days[6 - dayIndex].totalMinutes += session.duration || 0;
            }
        });

        // Format the data
        const formattedData = last7Days.map(day => ({
            [day.dayName]: (day.totalMinutes / 60).toFixed(1) + 'h'
        }));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error in getWeekWiseWork:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// @desc    Get daily work statistics
// @route   GET /api/analyst/daily-work
// @access  Private
export const getDailyWork = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's sessions from NocoDB
        const dateFilter = `(start_time,bw,${formatISO(today)},${formatISO(tomorrow)})`;
        const sessions = await getSessions(req.user.id, { 
            where: `where=${dateFilter}`,
            sort: 'start_time,asc'
        });

        // Calculate total time
        const totalMinutes = sessions.reduce((acc, session) => {
            return acc + (session.duration || 0);
        }, 0);

        // Group by task
        const tasks = {};
        sessions.forEach(session => {
            if (!session.task_id) return;
            if (!tasks[session.task_id]) {
                tasks[session.task_id] = {
                    name: session.task_name || 'Untitled Task',
                    totalMinutes: 0,
                    sessions: []
                };
            }
            tasks[session.task_id].totalMinutes += session.duration || 0;
            tasks[session.task_id].sessions.push({
                startTime: session.start_time,
                duration: session.duration,
                completed: session.status === 'completed'
            });
        });

        res.json({
            date: today,
            totalMinutes,
            totalHours: (totalMinutes / 60).toFixed(2),
            sessionCount: sessions.length,
            tasks: Object.values(tasks).map(task => ({
                ...task,
                totalHours: (task.totalMinutes / 60).toFixed(2)
            }))
        });
    } catch (error) {
        console.error('Error in getDailyWork:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// @desc    Get current month statistics
// @route   GET /api/analyst/monthly-stats
// @access  Private
export const getMonthlyStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonthDate = startOfMonth(now);
        const endOfMonthDate = endOfMonth(now);

        // Get all sessions for the current month from NocoDB
        const dateFilter = `(start_time,bw,${formatISO(startOfMonthDate)},${formatISO(endOfMonthDate)})`;
        const sessions = await getSessions(req.user.id, { 
            where: `where=${dateFilter}`
        });

        // Calculate total time
        const totalMinutes = sessions.reduce((acc, session) => {
            return acc + (session.duration || 0);
        }, 0);

        // Count completed sessions
        const completedSessions = sessions.filter(s => s.status === 'completed').length;

        // Group by day
        const days = {};
        sessions.forEach(session => {
            if (!session.start_time) return;
            const day = new Date(session.start_time).toISOString().split('T')[0];
            if (!days[day]) {
                days[day] = 0;
            }
            days[day] += session.duration || 0;
        });

        // Calculate average per day
        const daysWithData = Object.keys(days).length || 1;
        const avgMinutesPerDay = totalMinutes / daysWithData;

        res.json({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalMinutes,
            totalHours: (totalMinutes / 60).toFixed(2),
            sessionCount: sessions.length,
            completedSessions,
            completionRate: sessions.length > 0 ? (completedSessions / sessions.length * 100).toFixed(1) : 0,
            avgMinutesPerDay: Math.round(avgMinutesPerDay),
            daysWithData
        });
    } catch (error) {
        console.error('Error in getMonthlyStats:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// @desc    Get all sessions with task details
// @route   GET /api/analyst/sessions
// @access  Private
export const getAllSessions = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-start_time' } = req.query;
        const offset = (page - 1) * limit;
        
        // Build sort parameter for NocoDB
        let sortParam = '';
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
            sortParam = `sort=${sortField},${sortOrder}`;
        }

        // Get sessions from NocoDB with pagination and sorting
        let url = `/tables/${SESSIONS_TABLE_ID}/records?viewId=${SESSIONS_VIEW_ID}`;
        url += `&where=(user_id,eq,${req.user.id})`;
        if (sortParam) url += `&${sortParam}`;
        url += `&limit=${limit}&offset=${offset}`;

        const response = await axiosInstance.get(url);
        const sessions = response.data.list || [];
        const total = response.data.pageInfo?.totalRows || 0;
        const totalPages = Math.ceil(total / limit);

        // Format sessions with duration information
        const formattedSessions = sessions.map(session => {
            const duration = session.duration || 0;
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            
            return {
                ...session,
                task: session.task_id ? {
                    title: session.task_name || 'No Task',
                    description: session.task_description || ''
                } : { title: 'No Task', description: '' },
                taskName: session.task_name || 'No Task',
                startTime: session.start_time,
                endTime: session.end_time,
                duration: {
                    formatted: duration >= 60 
                        ? `${hours}h ${minutes.toString().padStart(2, '0')}m` 
                        : `${minutes}m`,
                    minutes: duration
                },
                status: session.status,
                notes: session.notes || ''
            };
        });

        res.json({
            success: true,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            data: formattedSessions
        });
    } catch (error) {
        console.error('Error in getAllSessions:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};
