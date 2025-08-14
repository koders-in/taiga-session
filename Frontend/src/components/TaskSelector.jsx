import React, { useEffect, useState } from "react";
import { fetchProjects, fetchTasksByProject } from "../api/task";

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
    { id: 1, name: "Planning & Requirements" },
    { id: 2, name: "Design & Prototyping" },
    { id: 3, name: "Frontend Development" },
    { id: 4, name: "Backend Development" },
    { id: 5, name: "DevOps & Deployment" },
    { id: 5, name: "Testing & QA" },
    { id: 5, name: "Documentation & Knowledge Baset" },
    { id: 5, name: "Stakeholder/Client/Team Communicationt" },
    { id: 5, name: "HR & Administration" },
    { id: 5, name: "Support & Maintenance" }
  ];

  // Fetch projects
  useEffect(() => {
    fetchProjects().then((data) => {
      if (data.success) setProjects(data.data);
    });
  }, []);

  // Fetch tasks for selected project
  useEffect(() => {
    if (!selectedProject) return;

    fetchTasksByProject(selectedProject).then((data) => {
      if (data.success) setTasks(data.data);
    });
  }, [selectedProject]);

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

