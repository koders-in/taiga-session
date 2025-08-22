import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import PomodoroTimer from "../components/PomodoroTimer";
import TaskSelector from "../components/TaskSelector";
import PerDayWork from "../components/PerDayWork";
import SessionLog from "../components/SessionLog";
import { logout } from "../api/login";
import { Timer, List } from "lucide-react";
import NotesPanel from "../components/NotesPanel";

export default function PomodoroTimerPage({ }) {
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [name, setName] = useState("");
  const [parentSessionId, setParentSessionId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  // Track active tab
  const [userId, setUserId] = useState(null);
  const userID = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState("timer");
  // Create ref for session log section
  const sessionLogRef = useRef(null);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const photo = localStorage.getItem("photo");
    const name = localStorage.getItem("name");
    const id = localStorage.getItem("userId");
    if (email) {
      setUserEmail(email);
    }
    if (photo) {
      setUserPhoto(photo);
    }
    if (name) {
      setName(name);
    }
    if (id) setUserId(id);
  }, []);

  const onLogout = () => {
    logout();
  };

  //  note handler 
  const handleAddNote = (sessionId, text) => {
    if (!sessionId) {
      alert("Start a session first!");
      return;
    }
    const newNote = { sessionId, text, createdAt: new Date() };
    setNotes((prev) => [newNote, ...prev]);

  };

  return (
    <div className="bg-white min-h-screen text-gray-900 flex flex-col">
      {/* ================== HEADER ================== */}
      <header className="flex justify-between items-center px-6 py-4 shadow-md bg-[#FFF4E5]">
        <h1 className="text-2xl font-bold text-orange-500">Taiga Session</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{userEmail}</span>
          {userPhoto && (
            <img
              src={userPhoto}
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
          )}
          <button
            onClick={onLogout}
            className="text-sm px-3 py-1.5 bg-orange-500 text-white rounded transition-colors hover:bg-orange-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================== BODY WITH SIDEBAR ================== */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-16 bg-[#FFF4E5] shadow-md flex flex-col items-center py-6 space-y-6">
          {/* Timer Button */}
          <button
            onClick={() => setActiveTab("timer")}
            className="flex flex-col items-center space-y-1 group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 ${activeTab === "timer"
                ? "text-orange-500 bg-orange-100"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Timer className="w-5 h-5" />
            </div>
            <span
              className={`text-xs font-medium ${activeTab === "timer" ? "text-orange-500" : "text-gray-500"
                }`}
            >

            </span>
          </button>

          {/* Work Sessions Button */}
          <button
            onClick={() => setActiveTab("sessions")}
            className="flex flex-col items-center space-y-1 group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 ${activeTab === "sessions"
                ? "text-orange-500 bg-orange-100"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <List className="w-5 h-5" />
            </div>
            <span
              className={`text-xs font-medium ${activeTab === "sessions" ? "text-orange-500" : "text-gray-500"
                }`}
            >

            </span>
          </button>
        </aside>
        {/* ================== MAIN CONTENT ================== */}
        <div className="flex-1">
          {/* Timer Tab */}
          {activeTab === "timer" && (
            <main className="p-6 flex flex-col items-center space-y-12 bg-gray-50">
              {/* Dropdowns */}
              <div className="w-full max-w-4xl flex justify-center">
                <TaskSelector
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedTask={selectedTask}
                  onTaskChange={setSelectedTask}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>

              {/* Timer + Notes  */}
              <div className="w-full max-w-5xl flex flex-row gap-6 justify-center">
                {/* Timer */}
                <div className="flex-1 max-w-md">
                  <PomodoroTimer
                    project={selectedProject}
                    taskId={selectedTask?.id}
                    taskName={selectedTask?.subject}
                    category={selectedCategory}
                    name={name}
                    onSessionComplete={() => { }}
                    parentSessionId={parentSessionId}
                    setParentSessionId={setParentSessionId}
                    noteText={noteText}
                    setNoteText={setNoteText}
                    onAddNote={handleAddNote}
                  />
                </div>

                {/* Notes */}
                <div className="flex-1 max-w-md">
                  <NotesPanel
                    sessionId={parentSessionId}
                    notes={notes}
                    onAddNote={handleAddNote}
                    noteText={noteText}
                    setNoteText={setNoteText}
                  />
                </div>
              </div>
            </main>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <main className="p-6 flex flex-col items-center space-y-8 bg-white">
              {/* PerDayWork */}
              <>
                <PerDayWork userId={userId} />
              </>

              {/* Session Log */}
              <div className="bg-white shadow-md border border-gray-200 p-6 rounded-lg w-full max-w-5xl">
                <h4 className="text-md font-semibold mb-3 text-gray-900">
                  Session Log
                </h4>
                <SessionLog />
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}