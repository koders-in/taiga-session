import React from "react";

export default function TaskSelector({
  tasks = [],
  categories = [],
  selectedTask,
  onTaskChange,
  selectedCategory,
  onCategoryChange,
}) {
  return (
    <div className="flex gap-3 items-center">
      <select
        value={selectedTask?.id || ""}
        onChange={(e) => {
          const t = Array.isArray(tasks)
            ? tasks.find((x) => String(x.id) === e.target.value)
            : null;
          onTaskChange && onTaskChange(t || null);
        }}
        className="bg-gray-700/60 text-white p-2 rounded min-w-[220px]"
      >
        <option value="">Select a task</option>
        {Array.isArray(tasks) &&
          tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
      </select>

      <select
        value={selectedCategory || ""}
        onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
        className="bg-gray-700/60 text-white p-2 rounded min-w-[200px]"
      >
        <option value="">Select a category</option>
        {Array.isArray(categories) &&
          categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
      </select>
    </div>
  );
}
