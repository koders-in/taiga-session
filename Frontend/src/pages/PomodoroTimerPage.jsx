import React, { useEffect, useState } from "react";
import api from "../api/api";
import PomodoroTimer from "../components/PomodoroTimer";
import TaskSelector from "../components/TaskSelector";
import PerDayWork from "../components/PerDayWork";
import SessionLog from "../components/SessionLog";
import { logout } from "../api/login";

export default function PomodoroTimerPage({}) {
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const photo = localStorage.getItem("photo");
    if (email) {
      setUserEmail(email);
    }
    if (photo) {
      setUserPhoto(photo);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const onLogout = () => {
    logout();
  };
  const themeClasses = {
    background: isDarkMode
      ? "bg-slate-800 text-white"
      : "bg-white text-gray-900",
    card: isDarkMode ? "bg-slate-700" : "bg-gray-50 border border-gray-200",
    text: {
      primary: isDarkMode ? "text-white" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-300" : "text-gray-700",
      muted: isDarkMode ? "text-gray-400" : "text-gray-500",
    },
    button: {
      logout: isDarkMode
        ? "bg-slate-600 hover:bg-slate-500 text-white"
        : "bg-gray-200 text-gray-800 hover:bg-gray-300",
      primary: "bg-red-500 hover:bg-red-600 text-white",
    },
    input: isDarkMode
      ? "bg-slate-600 border-slate-500"
      : "bg-white border-gray-300",
    chart: isDarkMode ? "bg-slate-600" : "bg-gray-300",
    border: isDarkMode ? "border-slate-600" : "border-gray-200",
  };

  return (
    <div className={`${themeClasses.background} min-h-screen p-4 lg:p-6`}>
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
            Taiga Session
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`text-sm ${themeClasses.text.muted} hidden sm:block`}
          >
            {userEmail && <p>{userEmail}</p>}
          </span>

          {userPhoto && (
            <img
              src={userPhoto}
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
          )}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${themeClasses.button.logout} transition-colors`}
            title="Toggle theme"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
          <button
            onClick={onLogout}
            className={`text-sm px-3 py-1.5 ${themeClasses.button.logout} rounded transition-colors`}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-20">
        {/* Left: Pomodoro Timer card */}
        <div className="xl:col-span-1">
          <PomodoroTimer
            task={selectedTask}
            category={selectedCategory}
            isDarkMode={isDarkMode}
            onSessionComplete={() => {
              // refresh data when session completes
            }}
          />
        </div>

        {/* Right: two columns stacked */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Top bar: project name + dropdowns */}
          <div className={`${themeClasses.card} p-4 rounded-lg`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div
                className={`text-lg font-semibold ${themeClasses.text.primary}`}
              ></div>
              <div className="flex flex-col sm:flex-row gap-3">
                <TaskSelector
                  selectedTask={selectedTask}
                  onTaskChange={(t) => setSelectedTask(t)}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(c) => setSelectedCategory(c)}
                />
              </div>
            </div>
          </div>

          {/* Middle: Weekly/small stats + Per Day Work */}
          <div className={`${themeClasses.card} p-4 rounded-lg`}>
            {/* Header with stats and date selector */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
              <div>
                <div className={`text-sm ${themeClasses.text.secondary}`}>
                  Work
                </div>
                <div className={`text-xs ${themeClasses.text.muted}`}>
                  February: 41h 45m • 14 tasks
                </div>
              </div>
              <div className={`text-sm ${themeClasses.text.muted}`}>
                <select
                  className={`${themeClasses.input} p-1 rounded w-full sm:w-auto ${themeClasses.text.primary}`}
                >
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
                    className={`w-8 sm:w-12 lg:w-16 ${themeClasses.chart} rounded`}
                    style={{ height: `${40 + i * 4}px` }}
                  />
                  <div className={`text-xs ${themeClasses.text.muted} mt-2`}>
                    {d}
                  </div>
                </div>
              ))}
            </div>

            {/* Per Day Work table */}
            <div>
              <h4
                className={`text-md font-semibold mb-3 ${themeClasses.text.primary}`}
              >
                Per Day Work
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-full">
                  <thead>
                    <tr className={themeClasses.text.muted}>
                      <th className="pb-2 pr-4">Task</th>
                      <th className="pb-2 pr-4">Duration</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
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
                      <tr
                        key={idx}
                        className={`border-t ${themeClasses.border}`}
                      >
                        <td className="py-3 pr-4">
                          <div
                            className={`truncate max-w-xs sm:max-w-none ${themeClasses.text.primary}`}
                          >
                            {r.task}
                          </div>
                        </td>
                        <td
                          className={`py-3 pr-4 whitespace-nowrap ${themeClasses.text.secondary}`}
                        >
                          {r.duration}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 sm:px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                              r.status === "Completed"
                                ? "bg-green-700 text-white"
                                : "bg-yellow-600 text-white"
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
          <div className={`${themeClasses.card} p-4 rounded-lg`}>
            <h4
              className={`text-md font-semibold mb-3 ${themeClasses.text.primary}`}
            >
              Session Log
            </h4>
            <div className="overflow-x-auto">
              <div className="text-center py-8">
                <div className={`text-sm ${themeClasses.text.muted}`}>
                  No sessions available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border-t`}
      >
        <div className="flex justify-center items-center py-4 px-6">
          <div className="flex space-x-8">
            {/* Focus Sessions */}
            <button className="flex flex-col items-center space-y-1 group">
              <div
                className={`p-2 rounded-full ${
                  isDarkMode
                    ? "text-red-400 bg-red-900/20"
                    : "text-red-500 bg-red-50"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span
                className={`text-xs font-medium ${
                  isDarkMode ? "text-red-400" : "text-red-500"
                }`}
              >
                Focus Sessions
              </span>
            </button>

            {/* Analytics */}
            <button className="flex flex-col items-center space-y-1 group">
              <div className={`p-2 rounded-full ${themeClasses.text.muted}`}>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
              </div>
              <span
                className={`text-xs ${themeClasses.text.muted} group-hover:${themeClasses.text.secondary}`}
              >
                Analytics
              </span>
            </button>

            {/* Task Tracking */}
            <button className="flex flex-col items-center space-y-1 group">
              <div className={`p-2 rounded-full ${themeClasses.text.muted}`}>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <span
                className={`text-xs ${themeClasses.text.muted} group-hover:${themeClasses.text.secondary}`}
              >
                Task Tracking
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
