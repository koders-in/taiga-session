import axios from "axios";
import { format, subDays, isSameDay, parseISO } from "date-fns";

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper: Format duration in seconds → HH:MM:SS
function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

// ✅ Normalize sessions
function normalizeSessions(sessions) {
  return (sessions || []).map((s) => ({
    session_id: s.session_id,
    user_id: s.user_id,
    task_id: s.task_id,
    session_type: s.session_type,
    start_time: s.start_time,
    end_time: s.end_time,
    duration_minutes: s.duration_minutes,
    status: s.status,
    created_at: s.CreatedAt,
    updated_at: s.UpdatedAt,
  }));
}

// ✅ Normalize tasks
function normalizeTasks(tasks) {
  return (tasks || []).map((t) => ({
    task_id: t.task_id,
    task_name: t.task_name,
    status: t.status,
    project_id: t.project_id,
    start_time: t.start_time,
    created_at: t.CreatedAt,
    updated_at: t.UpdatedAt,
  }));
}

// ==========================================================
// Fetch and merge sessions + tasks for a given user
// ==========================================================
export const getUserWorkData = async (req, res) => {
  try {
    const { user_id } = req.body;
    const cacheKey = `user_${user_id}_data`;

    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return res.json({
        ...cachedData.data,
        cached: true,
        timestamp: new Date(cachedData.timestamp).toISOString(),
      });
    }

    // API endpoints
    const sessionsUrl = `http://localhost:8080/api/v2/tables/maea6o4q9t7ybeu/records?where=(user_id,eq,${user_id})&limit=1000`;
    const tasksUrl = `http://localhost:8080/api/v2/tables/mf8kw73a809ravm/records?where=(user_id,eq,${user_id})&limit=1000`;

    const headers = {
      "Content-Type": "application/json",
      "xc-token": "QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY",
      "xc-auth": "QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY",
    };

    const [sessionsRes, tasksRes] = await Promise.all([
      axios.get(sessionsUrl, { headers }),
      axios.get(tasksUrl, { headers }),
    ]);

    const sessions = normalizeSessions(sessionsRes.data.list || []);
    const tasks = normalizeTasks(tasksRes.data.list || []);

    // Build task map
    const taskMap = new Map(tasks.map((t) => [t.task_id, t]));

    // Merge sessions with task info
    const mergedData = sessions.map((session) => {
      const taskInfo = taskMap.get(session.task_id) || {};
      return {
        ...session,
        task_name: taskInfo.task_name || "Unknown",
        task_status: taskInfo.status || "Unknown",
        project_id: taskInfo.project_id || null,
      };
    });

    // Sort newest first
    mergedData.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    const result = {
      success: true,
      data: mergedData,
      meta: {
        totalSessions: sessions.length,
        totalTasks: tasks.length,
        mergedCount: mergedData.length,
      },
    };

    // ✅ Store normalized data in cache
    cache.set(cacheKey, {
      data: { ...result, sessions, tasks },
      timestamp: Date.now(),
    });

    res.json({
      ...result,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getUserWorkData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user work data",
      error: error.message,
    });
  }
};

// ==========================================================
// Get daily work statistics for a specific date
// ==========================================================
export const getDailyWork = async (req, res) => {
  try {
    const { user_id, date } = req.body;
    if (!user_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Both user_id and date are required",
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const formattedDate = format(targetDate, "yyyy-MM-dd");
    const cacheKeyUser = `user_${user_id}_data`;

    // Ensure user data is cached
    let userDataCache = cache.get(cacheKeyUser);
    if (!userDataCache || Date.now() - userDataCache.timestamp >= CACHE_TTL) {
      // Trigger getUserWorkData internally to refresh cache
      const fakeReq = { body: { user_id } };
      const fakeRes = {
        json: (data) => data,
        status: (code) => ({ json: (data) => ({ code, ...data }) }),
      };
      await getUserWorkData(fakeReq, fakeRes);
      userDataCache = cache.get(cacheKeyUser);
    }

    const sessions = userDataCache?.data?.sessions || [];
    const tasks = userDataCache?.data?.tasks || [];
    const taskMap = new Map(tasks.map((t) => [t.task_id, t]));

    // Aggregate per task
    const dailyStats = {};
    sessions.forEach((session) => {
      if (!session.created_at) return;

      const sessionDate = new Date(session.created_at);
      const sessionDateStr = format(sessionDate, "yyyy-MM-dd");

      if (sessionDateStr === formattedDate) {
        const task = taskMap.get(session.task_id) || {
          task_name: `Task ${session.task_id}`,
          status: "unknown",
          project_id: null,
        };

        const duration = (session.duration_minutes || 0) * 60;

        if (!dailyStats[session.task_id]) {
          dailyStats[session.task_id] = {
            task_id: session.task_id,
            task_name: task.task_name,
            status: task.status,
            project_id: task.project_id,
            total_duration: 0,
            session_count: 0,
          };
        }

        dailyStats[session.task_id].total_duration += duration;
        dailyStats[session.task_id].session_count += 1;
      }
    });

    // Convert to array + format duration
    const taskList = Object.values(dailyStats).map((task) => ({
      ...task,
      total_duration: formatDuration(task.total_duration),
    }));

    // Sort by duration
    taskList.sort((a, b) => {
      const toSeconds = (t) => {
        const [h, m, s] = t.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      };
      return toSeconds(b.total_duration) - toSeconds(a.total_duration);
    });

    const totalSeconds = Object.values(dailyStats).reduce(
      (sum, task) => sum + task.total_duration,
      0
    );

    res.json({
      success: true,
      date: formattedDate,
      user_id: parseInt(user_id),
      total_tasks: taskList.length,
      total_duration: formatDuration(totalSeconds),
      tasks: taskList,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getDailyWork:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily work data",
      error: error.message,
    });
  }
};

// ==========================================================
// Get week-wise work statistics for a specific date
// ==========================================================

export const getWeekWiseWork = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id || req.body?.user_id;
    const inputDate = req.body?.date; // user-provided date (YYYY-MM-DD)

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // ✅ Parse reference date (either user-provided or today)
    let referenceDate = inputDate ? new Date(inputDate) : new Date();
    if (isNaN(referenceDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const cacheKeyUser = `user_${userId}_data`;
    const cacheKeyWeek = `week_${userId}_${format(
      referenceDate,
      "yyyy-MM-dd"
    )}`;
    const now = Date.now();

    // ✅ Return from week cache if fresh
    if (cache.has(cacheKeyWeek)) {
      const { timestamp, data } = cache.get(cacheKeyWeek);
      if (now - timestamp < CACHE_TTL) {
        return res.json({ source: "cache", data });
      }
    }

    // ✅ Ensure user work data cache is present
    let userDataCache = cache.get(cacheKeyUser);
    if (!userDataCache || now - userDataCache.timestamp >= CACHE_TTL) {
      const fakeReq = { body: { user_id: userId } };
      const fakeRes = {
        json: (data) => data,
        status: (code) => ({ json: (data) => ({ code, ...data }) }),
      };
      await getUserWorkData(fakeReq, fakeRes);
      userDataCache = cache.get(cacheKeyUser);
    }

    const records = userDataCache?.data?.data || [];

    // ✅ Build last 7 days starting from reference date
    const days = [...Array(7)].map((_, i) => {
      const d = subDays(referenceDate, 6 - i); // oldest → newest
      return { date: d, label: format(d, "EEEE"), totalSeconds: 0 };
    });

    // ✅ Sum durations per day
    for (const rec of records) {
      if (!rec.start_time || !rec.end_time) continue;
      const start = parseISO(rec.start_time);
      const end = parseISO(rec.end_time);
      const duration = Math.max(0, (end - start) / 1000);

      for (const day of days) {
        if (isSameDay(start, day.date)) {
          day.totalSeconds += duration;
          break;
        }
      }
    }

    // ✅ Final response
    const result = days.map((d) => ({
      date: format(d.date, "yyyy-MM-dd"),
      day: d.label,
      total_duration: formatDuration(d.totalSeconds),
      total_seconds: d.totalSeconds,
    }));

    // ✅ Save to cache
    cache.set(cacheKeyWeek, { timestamp: now, data: result });

    res.json({
      source: "fresh",
      reference_date: format(referenceDate, "yyyy-MM-dd"),
      data: result,
    });
  } catch (err) {
    console.error("Error in getWeekWiseWork:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==========================================================
// Get Month total duration and total tasks statistics for a specific month
// ==========================================================
export const getMonthlyWork = async (req, res) => {
  try {
    const { user_id, date } = req.body;
    if (!user_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Both user_id and date are required",
      });
    }

    // Parse the input date
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const year = inputDate.getFullYear();
    const month = inputDate.getMonth() + 1; // Months are 0-indexed in JS
    const monthName = inputDate.toLocaleString("default", { month: "long" });

    const cacheKeyUser = `user_${user_id}_data`;
    const cacheKeyMonth = `month_${user_id}_${year}_${month}`;
    const now = Date.now();

    // Check if monthly data is already cached
    if (cache.has(cacheKeyMonth)) {
      const { timestamp, data } = cache.get(cacheKeyMonth);
      if (now - timestamp < CACHE_TTL) {
        return res.json({
          ...data,
          cached: true,
          timestamp: new Date(timestamp).toISOString(),
        });
      }
    }

    // Ensure user data is cached
    let userDataCache = cache.get(cacheKeyUser);
    if (!userDataCache || now - userDataCache.timestamp >= CACHE_TTL) {
      // Trigger getUserWorkData internally to refresh cache
      const fakeReq = { body: { user_id } };
      const fakeRes = {
        json: (data) => data,
        status: (code) => ({ json: (data) => ({ code, ...data }) }),
      };
      await getUserWorkData(fakeReq, fakeRes);
      userDataCache = cache.get(cacheKeyUser);
    }

    const sessions = userDataCache?.data?.sessions || [];
    const tasks = userDataCache?.data?.tasks || [];

    // Define month range (first to last day of month)
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    let totalSeconds = 0;
    let taskIds = new Set();

    sessions.forEach((session) => {
      if (!session.start_time) return;

      const sessionDate = new Date(session.start_time);

      if (sessionDate >= monthStart && sessionDate <= monthEnd) {
        taskIds.add(session.task_id);
        totalSeconds += (session.duration_minutes || 0) * 60;
      }
    });

    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const result = {
      success: true,
      user_id: parseInt(user_id),
      year,
      month,
      month_name: monthName,
      date: format(inputDate, "yyyy-MM-dd"),
      total_duration: formatDuration(totalSeconds),
      total_seconds: totalSeconds,
      formatted_duration: `${hours}h ${minutes}m`,
      total_tasks: taskIds.size,
      unique_tasks: Array.from(taskIds),
    };

    // Cache the monthly data
    cache.set(cacheKeyMonth, {
      data: result,
      timestamp: now,
    });

    res.json({
      ...result,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getMonthlyWork:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly work data",
      error: error.message,
    });
  }
};
