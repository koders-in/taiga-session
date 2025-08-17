import React, { useEffect, useState } from "react";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  completeTimer,
  resetTimer,
} from "../api/timer";

export default function PomodoroTimer({
  taskId,
  taskName,
  category,
  onSessionComplete,
  isDarkMode = true,
  name,
  project,
}) {
  const task = { id: taskId, name: taskName, username: name, project };
  const WORK_DEFAULT = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(WORK_DEFAULT);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (running && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      if (onSessionComplete) onSessionComplete();
    }
    return () => clearInterval(interval);
  }, [running, secondsLeft, onSessionComplete]);

  const start = async () => {
    if (loading) return;
    if (!task?.id || !(task.name || task.subject) || !category || !project) {
      console.warn("Please select both task and category before starting.");
      return;
    }

    try {
      setLoading(true);
      const resOnj = {
        id: task.id,
        taskName: task.name || task.subject,
        c: category,
        username: task.username,
        project: project,
      };
      console.log(resOnj);
      const res = await startTimer(
        task.id,
        task.name || task.subject,
        category,
        task.username,
        project
      );
      console.log("Start API response:", res);
      const sid =
        res?.sessionId ||
        res?.session_id ||
        res?.data?.sessionId ||
        res?.data?.session_id;

      if (res?.success && sid) {
        setSessionId(sid);
        setRunning(true);
        setIsPaused(false);
        setSecondsLeft(WORK_DEFAULT);
      } else {
        console.error("Start timer failed:", res);
      }
    } catch (err) {
      console.error("Error starting timer:", err);
    }
    finally {
      setLoading(false);
    }
  };

  const pause = async () => {
    if (!sessionId) return;
    try {
      const res = await pauseTimer(sessionId);
      if (res?.success) {
        setRunning(false);
        setIsPaused(true);
      } else {
        console.error("Pause timer failed:", res);
      }
    } catch (err) {
      console.error("Error pausing timer:", err);
    }
  };

  const resume = async () => {
    if (!sessionId) return;
    try {
      const res = await resumeTimer(sessionId);
      if (res?.success) {
        setRunning(true);
        setIsPaused(false);
      } else {
        console.error("Resume timer failed:", res);
      }
    } catch (err) {
      console.error("Error resuming timer:", err);
    }
  };

  const reset = async () => {
    if (!sessionId) return;
    try {
      const res = await resetTimer(sessionId);
      if (res?.success) {
        setRunning(false);
        setIsPaused(false);
        setSecondsLeft(WORK_DEFAULT);
        setSessionId(null);
      } else {
        console.error("Reset timer failed:", res);
      }
    } catch (err) {
      console.error("Error resetting timer:", err);
    }
  };

  const handleComplete = async () => {
    try {
      if (sessionId) {
        const res = await completeTimer(sessionId);
        if (!res?.success) {
          console.error("Complete timer failed:", res);
        }
      }
    } catch (err) {
      console.error("Error completing timer:", err);
    } finally {
      setRunning(false);
      setIsPaused(false);
      setSecondsLeft(WORK_DEFAULT);
      setSessionId(null);
      if (onSessionComplete) onSessionComplete();
    }
  };

  const format = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calculate progress percentage for the circular progress
  const progress = ((WORK_DEFAULT - secondsLeft) / WORK_DEFAULT) * 100;

  // Theme-based styles
  const themeStyles = {
    container: isDarkMode
      ? "bg-slate-800 border-slate-700 text-white"
      : "bg-white border-gray-200 text-gray-900 shadow-xl",
    taskDisplay: isDarkMode
      ? "bg-slate-700/50 border-slate-600"
      : "bg-gray-50 border-gray-200",
    taskTitle: isDarkMode ? "text-white" : "text-gray-900",
    taskCategory: isDarkMode ? "text-slate-500" : "text-gray-500",
    taskLabel: isDarkMode ? "text-slate-400" : "text-gray-600",
    timerText: isDarkMode ? "text-white" : "text-gray-900",
    statusText: isDarkMode ? "text-slate-400" : "text-gray-600",
    circleBackground: isDarkMode ? "rgb(71 85 105)" : "rgb(229 231 235)", // slate-600 : gray-200
    resetButton: isDarkMode
      ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 focus:ring-slate-500"
      : "bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-700 focus:ring-gray-400",
    statsContainer: isDarkMode
      ? "bg-slate-700/30 border-slate-600"
      : "bg-gray-50 border-gray-200",
    statsLabel: isDarkMode ? "text-slate-400" : "text-gray-600",
    statsValue: isDarkMode ? "text-white" : "text-gray-900",
    progressBarBg: isDarkMode ? "bg-slate-600" : "bg-gray-200",
    popupContainer: isDarkMode
      ? "bg-slate-800 border border-slate-700 text-gray-200"
      : "bg-white border border-gray-200 text-gray-900 shadow-xl",
    popupTitle: isDarkMode ? "text-gray-100" : "text-gray-900",
    popupMessage: isDarkMode ? "text-gray-400" : "text-gray-600",
    popupDivider: isDarkMode ? "border-gray-700" : "border-gray-300",
    popupButton: isDarkMode
      ? "text-blue-400 py-3 text-base font-medium hover:bg-gray-700 transition w-full"
      : "text-blue-600 py-3 text-base font-medium hover:bg-gray-100 transition w-full",
  };

  return (
    <div
      className={`${themeStyles.container} border p-8 rounded-lg flex flex-col items-center shadow-lg`}
    >
      {/* Header with icon */}

      {/* Current task display */}
      {task && (
        <div
          className={`${themeStyles.taskDisplay} border rounded-lg p-4 mb-6 w-full text-center`}
        >
          <div className={`text-sm ${themeStyles.taskLabel} mb-1`}>
            Current Task
          </div>
          <div className={`${themeStyles.taskTitle} font-medium`}>
            {task.name}
          </div>
          <div className={`text-xs ${themeStyles.taskCategory} mt-1`}>
            {category || task.category}
          </div>
        </div>
      )}

      {/* Circular Timer */}
      <div className="relative w-64 h-64 mb-8">
        {/* Background circle */}
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={themeStyles.circleBackground}
            strokeWidth="4"
            className="opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(239 68 68)" // red-500
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-bold ${themeStyles.timerText} mb-2`}>
            {format(secondsLeft)}
          </div>
          <div className={`text-sm ${themeStyles.statusText}`}>
            {running ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Running
              </span>
            ) : (
              "Ready to start"
            )}
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        className={`w-full py-4 rounded-lg text-white font-semibold text-lg mb-4 transition-all duration-200 ${running
          ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-500/50"
          : "bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/50"
          } focus:outline-none shadow-lg`}
        onClick={() => {
          if (!taskId || !taskName || !category) {
            setShowPopup(true);
            return;
          }

          if (running) pause();
          else if (isPaused) resume();
          else start();
        }}
        disabled={loading}
      >
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            Pause
          </span>
        ) : isPaused ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z" />
            </svg>
            Resume
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z" />
            </svg>
            Start Session
          </span>
        )}
      </button>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div
            className={`rounded-2xl w-80 text-center p-6 ${themeStyles.popupContainer}`}
          >
            {/* Title */}
            <h2
              className={`text-lg font-semibold mb-2 ${themeStyles.popupTitle}`}
            >
              Selection Needed
            </h2>

            {/* Message */}
            <p className={`text-sm mb-6 ${themeStyles.popupMessage}`}>
              You need to pick a task and category before starting your
              session...
            </p>

            {/* Divider */}
            <div className={`border-t ${themeStyles.popupDivider}`}></div>

            {/* Button */}
            <button
              onClick={() => setShowPopup(false)}
              className={themeStyles.popupButton}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Secondary Action Buttons */}
      <div className="flex gap-3 w-full">
        <button
          className={`flex-1 ${themeStyles.resetButton} border py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2`}
          onClick={reset}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            Reset
          </span>
        </button>
        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleComplete}
          disabled={!running && secondsLeft === WORK_DEFAULT}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Complete
          </span>
        </button>
      </div>

      {/* Timer Statistics */}
    </div>
  );
}

