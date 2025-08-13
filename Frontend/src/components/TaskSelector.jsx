import React, { useEffect, useState } from "react";
import { getToken } from "../api/login";

export default function TaskSelector({
  selectedTask,
  onTaskChange,
  selectedCategory,
  onCategoryChange,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);

  const categories = [
    { id: 1, name: "Backend" },
    { id: 2, name: "Frontend" },
    { id: 2, name: "Full Stack" },
    { id: 2, name: "Api Development" },
    { id: 2, name: "Data Science" },
  ];

  const token = getToken();

  // Fetch projects
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:4000/api/taiga/projects", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProjects(data.data);
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, [token]);

  // Fetch tasks for selected project
  useEffect(() => {
    if (!token || !selectedProject) return;

    fetch(`http://localhost:4000/api/taiga/projects/${selectedProject}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTasks(data.data);
      })
      .catch((err) => console.error("Error fetching tasks:", err));
  }, [selectedProject, token]);

  return (
    <div className="flex gap-3 items-center">
      {/* Project Dropdown */}
      <select
        value={selectedProject}
        onChange={(e) => {
          setSelectedProject(e.target.value);
          setTasks([]);
          onTaskChange && onTaskChange(null);
        }}
        className="bg-gray-700/60 text-white p-2 rounded border border-white/10 w-[180px]"
      >
        <option value="">Select a project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Task Dropdown */}
      <select
        value={selectedTask?.id || ""}
        onChange={(e) => {
          const t = tasks.find((x) => String(x.id) === e.target.value) || null;
          onTaskChange && onTaskChange(t);
        }}
        className="bg-gray-700/60 text-white p-2 rounded border border-white/10 w-[220px]"
        disabled={!selectedProject}
      >
        <option value="">Select a task</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id} className="truncate">
            {t.subject}
          </option>
        ))}
      </select>

      {/* Category Dropdown */}
      <select
        value={selectedCategory || ""}
        onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
        className="bg-gray-700/60 text-white p-2 rounded border border-white/10 w-[180px]"
      >
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
