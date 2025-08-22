import React, { useEffect, useState } from "react";
import { fetchProjects, fetchTasksByProject } from "../api/task";

export default function TaskSelector({
  selectedProject,
  setSelectedProject,
  selectedTask,
  onTaskChange,
  selectedCategory,
  onCategoryChange,
  isDarkMode = true,
}) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  // const categories = [
  //   { id: 1, name: "Planning & Requirements" },
  //   { id: 2, name: "Design & Prototyping" },
  //   { id: 3, name: "Frontend Development" },
  //   { id: 4, name: "Backend Development" },
  //   { id: 5, name: "DevOps & Deployment" },
  //   { id: 6, name: "Testing & QA" },
  //   { id: 7, name: "Documentation & Knowledge Baset" },
  //   { id: 8, name: "Stakeholder/Client/Team Communicationt" },
  //   { id: 9, name: "HR & Administration" },
  //   { id: 10, name: "Support & Maintenance" },
  // ];
  const categories = [
    { id: 1, name: "Backend Development" },
    { id: 2, name: "Bug Fixing" },
    { id: 3, name: "Code Review" },
    { id: 4, name: "Design & Prototyping" },
    { id: 5, name: "DevOps & Deployment" },
    { id: 6, name: "Documentation & Knowledge Base" },
    { id: 7, name: "Frontend Development" },
    { id: 8, name: "Integration" },
    { id: 9, name: "Performance Optimization" },
    { id: 10, name: "Planning & Requirements" },
    { id: 11, name: "Refactoring" },
    { id: 12, name: "Research (Technical)" },
    { id: 13, name: "Security & Compliance" },
    { id: 14, name: "Stakeholder/Team Communication" },
    { id: 15, name: "Support & Maintenance" },
    { id: 16, name: "Testing & QA" },
    { id: 17, name: "UI/UX Improvements" },
    { id: 18, name: "Other" },
  ];

  // Fetch projects
  useEffect(() => {
    const cachedProjects = localStorage.getItem("projects");
    console.log(cachedProjects);

    if (cachedProjects) {
      setProjects(JSON.parse(cachedProjects));
    } else {
      fetchProjects().then((data) => {
        if (data.success) {
          setProjects(data.data);
          localStorage.setItem("projects", JSON.stringify(data.data));
        }
      });
    }
  }, []);

  // Fetch task
  useEffect(() => {
    if (!selectedProject) return;

    const cachedTasks = localStorage.getItem(`tasks_${selectedProject}`);

    if (cachedTasks) {
      setTasks(JSON.parse(cachedTasks));
    } else {
      fetchTasksByProject(selectedProject).then((data) => {
        if (data.success) {
          setTasks(data.data);
          localStorage.setItem(
            `tasks_${selectedProject}`,
            JSON.stringify(data.data)
          );
        }
      });
    }
  }, [selectedProject]);

  const themeStyles = {
    dropdown: isDarkMode
      ? "bg-gray-800/90 text-white border border-white/10"
      : "bg-white text-gray-900 border border-gray-300 shadow-sm",
    dropdownOption: isDarkMode
      ? "bg-gray-800 text-white"
      : "bg-white text-gray-900",
  };

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
        className="p-2 rounded w-[180px] border border-orange-200 bg-white  text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
      >
        <option value="">Select a project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id} className="bg-white text-gray-800">
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
        className="p-2 rounded w-[180px] border border-orange-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
        disabled={!selectedProject}
      >
        <option value="">Select a task</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id} className="bg-white text-gray-800">
            {t.subject}
          </option>
        ))}
      </select>

      {/* Category Dropdown */}
      <select
        value={selectedCategory || ""}
        onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
        className="p-2 rounded w-[180px] border border-orange-200 bg-white  text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
      >
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name} className="bg-white text-gray-800">
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

}
