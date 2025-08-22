import React, { useEffect, useState } from "react";
import {
  getUserWork,
  getDailyWork,
  getWeekWiseWork,
  getMonthlyStats,
} from "../api/analyst";

export default function SessionLog({ userId }) {
  const [mode, setMode] = useState("daily"); // daily | weekly | monthly
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Always fetch raw logs
    getUserWork(userId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const normalized = res.data.map((log) => ({
          date: log.date || log.start_time?.slice(0, 10) || "N/A",
          task_name: log.task_name || log.task || "Untitled Task",
          duration:
            log.duration ||
            log.total_duration ||
            (log.total_seconds
              ? `${Math.round(log.total_seconds / 60)} min`
              : "0"),
          status: log.status || log.task_status || "Unknown",
        }));
        setLogs(normalized);
      } else {
        setLogs([]);
      }
    });

    // Mode specific fetches
    if (mode === "daily") {
      getDailyWork(userId, selectedDate).then((res) => {
        if (res.success) setDaily(res);
      });
    }

    if (mode === "weekly") {
      getWeekWiseWork(userId, selectedDate).then((res) => {
        if (res.data) setWeekly(res.data);
      });
    }

    if (mode === "monthly") {
      getMonthlyStats(userId, selectedDate).then((res) => {
        if (res.success) setMonthly(res);
      });
    }
  }, [userId, mode, selectedDate]);

  return (
    <div className="p-6 text-gray-800 w-full max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 px-6">
        <h1 className="text-2xl font-bold text-orange-600">Session Logs</h1>
        <div className="flex gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-orange-50 text-gray-800 px-3 py-2 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-orange-50 text-gray-800 px-3 py-2 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Mode Specific Section */}
      <div className="rounded-2xl bg-white shadow-lg border border-orange-200 overflow-hidden">
        {mode === "daily" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Daily Work
            </h2>
            {daily?.tasks?.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th className="pb-3 text-orange-600 font-medium">Task</th>
                    <th className="pb-3 text-orange-600 font-medium">
                      Duration
                    </th>
                    <th className="pb-3 text-orange-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.tasks.map((task) => (
                    <tr
                      key={task.task_id}
                      className="border-b border-orange-100 hover:bg-orange-100 transition"
                    >
                      <td className="py-3">{task.task_name}</td>
                      <td className="py-3 text-gray-700">
                        {task.total_duration}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.status === "Completed"
                              ? "bg-green-500 text-white"
                              : "bg-yellow-400 text-black"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No tasks for this date.</p>
            )}
          </div>
        )}

        {mode === "weekly" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Weekly Work
            </h2>
            <div className="flex items-end justify-between h-44">
              {weekly.map((day) => (
                <div key={day.date} className="flex flex-col items-center w-12">
                  <div
                    className="w-8 bg-orange-400 rounded-md shadow-md transition-all duration-300"
                    style={{
                      height: `${Math.min(
                        150,
                        (day.total_seconds / 3600) * 20
                      )}px`,
                    }}
                  ></div>
                  <span className="text-xs mt-2 text-gray-600">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "monthly" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Monthly Work
            </h2>
            {monthly ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-700">
                <div className="bg-orange-100 rounded-xl p-4 text-center shadow">
                  <p className="text-sm text-orange-600">Month</p>
                  <p className="text-lg font-bold text-orange-800">
                    {monthly.month_name}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-xl p-4 text-center shadow">
                  <p className="text-sm text-orange-600">Total Duration</p>
                  <p className="text-lg font-bold text-orange-800">
                    {monthly.formatted_duration}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-xl p-4 text-center shadow">
                  <p className="text-sm text-orange-600">Total Tasks</p>
                  <p className="text-lg font-bold text-orange-800">
                    {monthly.total_tasks}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No monthly data.</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-8 border-t border-orange-200" />

      {/* Session Logs Table */}
      <div className="rounded-2xl bg-white shadow-lg border border-orange-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-orange-700">
            Raw Session Logs
          </h2>
          {logs.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-200">
                  <th className="pb-3 text-orange-600 font-medium">Date</th>
                  <th className="pb-3 text-orange-600 font-medium">Task</th>
                  <th className="pb-3 text-orange-600 font-medium">Duration</th>
                  <th className="pb-3 text-orange-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-orange-100 hover:bg-orange-100 transition"
                  >
                    <td className="py-3">{log.date}</td>
                    <td className="py-3">{log.task_name}</td>
                    <td className="py-3 text-gray-700">{log.duration}</td>
                    <td className="py-3">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No session logs available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
