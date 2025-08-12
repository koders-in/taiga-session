import React, { useEffect, useState } from "react";
import api from "../api";
import PomodoroTimer from "../components/PomodoroTimer";
import TaskSelector from "../components/TaskSelector";
import PerDayWork from "../components/PerDayWork";
import SessionLog from "../components/SessionLog";

export default function PomodoroTimerPage({ onLogout }) {
  const [user, setUser] = useState({ email: "emily@example.com" });
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    // load user (optional)
    api
      .get("/api/user")
      .then((data) => setUser(data))
      .catch(() => {});
    // load tasks & categories
    api
      .get("/api/tasks")
      .then((data) => setTasks(data))
      .catch(() => {
        // fallback sample
        setTasks([
          { id: "t1", name: "Write documentation", category: "Documentation" },
          { id: "t2", name: "Fix bug #1250", category: "Development" },
          { id: "t3", name: "Code refactoring", category: "Development" },
          { id: "t4", name: "Update dependencies", category: "Maintenance" },
        ]);
      });
    api
      .get("/api/categories")
      .then((data) => setCategories(data))
      .catch(() => {
        setCategories([
          { id: "c1", name: "Development" },
          { id: "c2", name: "Design" },
          { id: "c3", name: "Documentation" },
        ]);
      });
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
        <div className="text-sm text-gray-300 flex items-center gap-4">
          <span className="truncate">{user.email}</span>
          <button
            onClick={onLogout}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Pomodoro Timer card */}
        <div className="xl:col-span-1">
          <PomodoroTimer
            task={selectedTask}
            category={selectedCategory}
            onSessionComplete={() => {
              // refresh data when session completes
            }}
          />
        </div>

        {/* Right: two columns stacked */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Top bar: project name + dropdowns */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="text-lg font-semibold">Task 2o arch</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <TaskSelector
                  tasks={tasks}
                  categories={categories}
                  selectedTask={selectedTask}
                  onTaskChange={(t) => setSelectedTask(t)}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(c) => setSelectedCategory(c)}
                />
              </div>
            </div>
          </div>

          {/* Middle: Weekly/small stats + Per Day Work */}
          <div className="bg-gray-800 p-4 rounded-lg">
            {/* Header with stats and date selector */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Work</div>
                <div className="text-xs text-gray-400">
                  February: 41h 45m • 14 tasks
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <select className="bg-gray-700/60 p-1 rounded w-full sm:w-auto">
                  <option>2024-02-20</option>
                </select>
              </div>
            </div>

            {/* Weekly bars (Mon..Sun) - Responsive with horizontal scroll on mobile */}
            <div className="flex gap-2 sm:gap-4 items-end mb-6 overflow-x-auto pb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <div
                  key={d}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div
                    className="w-8 sm:w-12 lg:w-16 bg-gray-700 rounded"
                    style={{ height: `${40 + i * 4}px` }}
                  />
                  <div className="text-xs text-gray-400 mt-2">{d}</div>
                </div>
              ))}
            </div>

            {/* Per Day Work table */}
            <div>
              <h4 className="text-md font-semibold mb-3">Per Day Work</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-full">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="pb-2 pr-4">Task</th>
                      <th className="pb-2 pr-4">Duration</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* sample rows matching screenshot */}
                    {[
                      {
                        task: "Write documentation",
                        duration: "1h 0m",
                        status: "Completed",
                      },
                      {
                        task: "Fix bug #1250",
                        duration: "2h 10m",
                        status: "Completed",
                      },
                      {
                        task: "Code refactoring",
                        duration: "45m",
                        status: "Completed",
                      },
                      {
                        task: "Update dependencies",
                        duration: "1h 30m",
                        status: "In Progress",
                      },
                    ].map((r, idx) => (
                      <tr key={idx} className="border-t border-gray-700">
                        <td className="py-3 pr-4">
                          <div className="truncate max-w-xs sm:max-w-none">
                            {r.task}
                          </div>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {r.duration}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 sm:px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                              r.status === "Completed"
                                ? "bg-green-700"
                                : "bg-yellow-600"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom: Session Log */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-3">Session Log</h4>
            <div className="overflow-x-auto">
              <SessionLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
