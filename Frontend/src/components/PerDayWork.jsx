import React, { useEffect, useState } from "react";
import {
  getDailyWork,
  getMonthlyStats,
  getWeekWiseWork,
} from "../api/analyst";

export default function PerDayWork({ userId }) {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (!userId) return;

    getDailyWork(userId, selectedDate).then((res) => {
      if (res.success) setDaily(res);
    });

    getMonthlyStats(userId, selectedDate).then((res) => {
      if (res.success) setMonthly(res);
    });

    getWeekWiseWork(userId, selectedDate).then((res) => {
      if (res.data) setWeekly(res.data);
    });
  }, [userId, selectedDate]);

  return (
    <div className="p-6 text-gray-200">
      {/* Header with Date Picker */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Work Overview</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-800 text-gray-200 px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      

      {/* Card Container */}
      <div className="rounded-2xl bg-slate-800 shadow-lg border border-gray-700 overflow-hidden">
        
        {/* Daily Work Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Day Wise Work</h2>
          {daily?.tasks?.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-gray-400 font-medium">Task</th>
                  <th className="pb-3 text-gray-400 font-medium">Duration</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {daily.tasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition"
                  >
                    <td className="py-3">{task.task_name}</td>
                    <td className="py-3 text-gray-300">{task.total_duration}</td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === "Completed"
                            ? "bg-green-500/80 text-white"
                            : "bg-yellow-400/80 text-black"
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
            <p className="text-sm text-gray-400">No tasks for this date.</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700" />

        {/* Weekly Work Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Weekly Work</h2>
          <div className="flex items-end justify-between h-44">
            {weekly.map((day) => (
              <div key={day.date} className="flex flex-col items-center w-12">
                <div
                  className="w-8 bg-blue-500 rounded-md shadow-md transition-all duration-300"
                  style={{
                    height: `${Math.min(150, (day.total_seconds / 3600) * 20)}px`,
                  }}
                ></div>
                <span className="text-xs mt-2 text-gray-400">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700" />

        

        {/* Monthly Stats Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Monthly Work</h2>
          {monthly ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-300">
              <div className="bg-gray-700/60 rounded-xl p-4 text-center shadow">
                <p className="text-sm text-gray-400">Month</p>
                <p className="text-lg font-bold text-white">
                  {monthly.month_name}
                </p>
              </div>
              <div className="bg-gray-700/60 rounded-xl p-4 text-center shadow">
                <p className="text-sm text-gray-400">Total Duration</p>
                <p className="text-lg font-bold text-white">
                  {monthly.formatted_duration}
                </p>
              </div>
              <div className="bg-gray-700/60 rounded-xl p-4 text-center shadow">
                <p className="text-sm text-gray-400">Total Tasks</p>
                <p className="text-lg font-bold text-white">
                  {monthly.total_tasks}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No monthly data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
