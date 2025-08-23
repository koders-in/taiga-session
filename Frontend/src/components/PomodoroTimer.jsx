import React, { useEffect, useState } from "react";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  completeTimer,
  resetTimer,
  startBreak,
  endBreak,
} from "../api/timer";

export default function PomodoroTimer({
  taskId,
  taskName,
  category,
  onSessionComplete,
  name,
  project,
  parentSessionId,
  setParentSessionId,
  noteText,
  setNoteText,
  onAddNote,
}) {


  const task = { id: taskId, name: taskName, username: name, project };
  const WORK_DEFAULT = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [secondsLeft, setSecondsLeft] = useState(WORK_DEFAULT);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakCount, setBreakCount] = useState(0);



  useEffect(() => {
    let interval;
    if (running && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);

      if (isBreak) {
        //  Break ended Start new Work session
        try {
          endBreak(sessionId);
        } catch (err) {
          console.error("[Frontend] Break end API failed:", err);
        }
        setIsBreak(false);
        setSecondsLeft(WORK_DEFAULT);
        setRunning(true);
      } else {
        //  Work session ended
        if (onSessionComplete) onSessionComplete();

        if (breakCount === 3) {
          // after 4rd work session → long break
          setSecondsLeft(LONG_BREAK);
          setBreakCount(0);
        } else {
          // short break
          setSecondsLeft(SHORT_BREAK);
          setBreakCount((prev) => prev + 1);
        }

        setIsBreak(true);
        setRunning(true);
        //  Break started send API
        try {
          startBreak(sessionId);
          playDing();
        } catch (err) {
          console.error("[Frontend] Break start API failed:", err);
        }
      }
    }
    return () => clearInterval(interval);
  }, [running, secondsLeft, isBreak, breakCount, onSessionComplete, sessionId]);

  // helper to format time
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // audio
  let audioCtx;
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  };

  const playDing = () => {
    try {
      initAudio();
      const makeTone = (freq, vol, dur) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      };

      makeTone(880, 0.15, 1.5);
      makeTone(1320, 0.07, 1.2);

    } catch (e) {
      console.error("Soft ding failed:", e);
    }
  };

  const start = async () => {
    if (loading) return;
    if (!task?.id || !(task.name || task.subject) || !category || !project) {
      console.warn("Please select both task and category before starting.");
      return;
    }

    try {
      setLoading(true);
      const resOnj = {
        task_Id: task.id,
        task_Name: task.name || task.subject,
        category: category,
        name: task.username,
        project: project,
        note: noteText,
      };
      console.log(" [Frontend] Start Timer Payload:", resOnj);
      console.log(resOnj);
      const res = await startTimer(
        task.id,
        task.name || task.subject,
        category,
        task.username,
        project,
        noteText
      );

      console.log("[Frontend] Raw StartTimer Response:", res);

      const sid =
        res?.sessionId ||
        res?.session_id ||
        res?.data?.sessionId ||
        res?.data?.session_id;


      console.log(" [Frontend] Extracted Session ID:", sid);
      if (res?.success && sid) {
        console.log(" [Frontend] Timer started successfully!");
        setSessionId(sid);
        setParentSessionId(sid);
        setRunning(true);
        setIsPaused(false);
        setSecondsLeft(WORK_DEFAULT);
        playDing();
        //  save note when starting session
        if (noteText.trim()) {
          onAddNote(sid, noteText);
          setNoteText("");
        }

      } else {
        console.error(" [Frontend] Start timer failed:", res);
      }
    } catch (err) {
      console.error("[Frontend] Error starting timer:", err);
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
      const res = await resetTimer(sessionId, noteText);
      if (res?.success) {
        if (noteText.trim()) {
          onAddNote(sessionId, noteText);
          setNoteText("");
        }
        setRunning(false);
        setIsPaused(false);
        setSecondsLeft(WORK_DEFAULT);
        setSessionId(null);
        setParentSessionId(null);
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
        const res = await completeTimer(sessionId, noteText);
        if (res?.success && noteText.trim()) {
          onAddNote(sessionId, noteText);
          setNoteText("");
        }
      }
    } catch (err) {
      console.error("Error completing timer:", err);
    } finally {
      setRunning(false);
      setIsPaused(false);
      setSessionId(null);
      setParentSessionId(null);
      playDing();

      if (isBreak) {
        //  Break ending manually
        try {
          endBreak(sessionId);
        } catch (err) {
          console.error("[Frontend] Break end API failed:", err);
        }
        setIsBreak(false);
        start();
      } else {
        if (onSessionComplete) onSessionComplete();

        if (breakCount === 3) {
          setSecondsLeft(LONG_BREAK);
          setBreakCount(0);
        } else {
          setSecondsLeft(SHORT_BREAK);
          setBreakCount((prev) => prev + 1);
        }

        setIsBreak(true);
        setRunning(true);
        //  Break started send API
        try {
          startBreak(sessionId);
        } catch (err) {
          console.error("[Frontend] Break start API failed:", err);
        }
      }
    }
  };

  const format = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentDuration = isBreak
    ? (breakCount === 0 ? LONG_BREAK : SHORT_BREAK) // if breakCount just reset long break
    : WORK_DEFAULT;

  const progress = ((currentDuration - secondsLeft) / currentDuration) * 100;



  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-auto">
      {/* Header */}
      {task && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {category || task.category}
            </span>
          </div>


        </div>
      )}

      {/* Task Title */}
      {task && (
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-800 mb-1">
            {task.name}
          </h1>
          <div className="text-xs text-gray-500">Current Task</div>
        </div>
      )}

      {/* Timer Circle */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        {/* Tick marks around the circle */}
        <div className="absolute inset-0">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${i % 5 === 0 ? "w-0.5 h-3 bg-gray-300" : "w-px h-1.5 bg-gray-200"
                }`}
              style={{
                top: i % 5 === 0 ? "4px" : "8px",
                left: "50%",
                transformOrigin: "50% 128px",
                transform: `translateX(-50%) rotate(${i * 6}deg)`,
              }}
            />
          ))}
        </div>

        {/* Main progress circle */}
        <svg
          className="absolute inset-4 w-56 h-56 transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgb(254, 237, 216)" // light orange background
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgb(251, 146, 60)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-light text-gray-800 mb-1 tracking-wider">
            {format(secondsLeft)}
          </div>
          <div className="text-xs text-gray-400">
            {running ? (
              isBreak ? (
                breakCount === 0 ? "Long Break" : "Short Break"
              ) : (
                "Working"
              )
            ) : (
              "Ready to start"
            )}
          </div>
        </div>

        {/* Hand */}
        <div
          className="absolute top-1/2 left-1/2 w-0.5 bg-orange-500 origin-bottom transition-transform duration-1000 rounded-full"
          style={{
            height: "105px",
            transform: `translate(-50%, -100%) rotate(${(progress / 100) * 360
              }deg)`,
            transformOrigin: "50% 100%",
          }}
        />

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-orange-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Start-End times */}
      {running && (
        <div className="text-center text-sm text-gray-600 mb-4">
          {formatTime(new Date())} –{" "}
          {formatTime(new Date(Date.now() + secondsLeft * 1000))}
        </div>
      )}

      {/* Main Action Button */}
      {!isBreak && (
        <button
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-base mb-4 transition-all duration-200 shadow-lg"
          onClick={() => {
            if (!taskId || !taskName || !category) {
              setShowPopup(true);
              return;
            }
            if (running) {
              pause();
            } else if (isPaused) {
              resume();
            } else {
              start();
            }
          }}
          disabled={loading}
        >
          {running ? "Pause Session" : isPaused ? "Resume Session" : "Start Session"}
        </button>
      )}

      {/* Secondary Action Buttons */}
      <div className="flex gap-3">
        {!isBreak && (
          <>
            <button
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              onClick={reset}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              Reset
            </button>

            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl font-medium transition-colors"
              onClick={handleComplete}
              disabled={!running && secondsLeft === WORK_DEFAULT}
            >
              Complete
            </button>
          </>
        )}

        {isBreak && (
          <button
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl font-medium transition-colors"
            onClick={() => {
              try {
                endBreak(sessionId);
              } catch (err) {
                console.error("[Frontend] Break end API failed:", err);
              }
              setIsBreak(false);
              setSecondsLeft(WORK_DEFAULT);
              setRunning(true);
              start();
            }}
          >
            Skip Break
          </button>
        )}
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl w-80 text-center p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Selection Needed
            </h2>
            <p className="text-sm mb-6 text-gray-600">
              You need to pick a task and category before starting your session...
            </p>
            <div className="border-t border-gray-200"></div>
            <button
              onClick={() => setShowPopup(false)}
              className="text-blue-600 py-3 text-base font-medium hover:bg-gray-100 transition w-full rounded-b-2xl"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}