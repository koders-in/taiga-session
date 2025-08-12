import React, { useEffect, useState } from "react";

export default function PomodoroTimer({ task, category, onSessionComplete }) {
  const WORK_DEFAULT = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(WORK_DEFAULT);
  const [running, setRunning] = useState(false);

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

  const start = () => {
    console.log("run");
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(WORK_DEFAULT);
  };

  const handleComplete = () => {
    setRunning(false);
    setSecondsLeft(WORK_DEFAULT);
    if (onSessionComplete) onSessionComplete();
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

  return (
    <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg flex flex-col items-center shadow-lg">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h3 className="text-white text-xl font-semibold">Pomodoro Timer</h3>
      </div>

      {/* Current task display */}
      {task && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6 w-full text-center">
          <div className="text-sm text-slate-400 mb-1">Current Task</div>
          <div className="text-white font-medium">{task.name}</div>
          <div className="text-xs text-slate-500 mt-1">
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
            stroke="rgb(71 85 105)" // slate-600
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
          <div className="text-5xl font-bold text-white mb-2">
            {format(secondsLeft)}
          </div>
          <div className="text-sm text-slate-400">
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
        className={`w-full py-4 rounded-lg text-white font-semibold text-lg mb-4 transition-all duration-200 ${
          running
            ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-500/50"
            : "bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/50"
        } focus:outline-none shadow-lg`}
        onClick={() => (running ? pause() : start())}
        // disabled={!task && !running} TODO: Enable when task is selected
      >
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            Pause
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

      {/* Secondary Action Buttons */}
      <div className="flex gap-3 w-full">
        <button
          className="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
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
      <div className="mt-6 w-full bg-slate-700/30 border border-slate-600 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <div className="text-slate-400">Session Progress</div>
          <div className="text-white font-medium">{Math.round(progress)}%</div>
        </div>
        <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
