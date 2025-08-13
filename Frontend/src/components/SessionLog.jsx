import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function SessionLog() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api
      .get("/api/sessions")
      .then((response) => {
        setSessions(response.data || []); // default to empty array
      })
      .catch(() => {
        setSessions([
          {
            id: 1,
            user: "jdoe",
            task: "Pomodoro accumulation",
            category: "Development",
            startTime: "2020-03-02",
            fastTime: "25:00",
            status: "Completed",
          },
          {
            id: 2,
            user: "jdoe",
            task: "Update APT acteaint",
            category: "Development",
            startTime: "2020-03-03",
            fastTime: "35:00",
            status: "Completed",
          },
          {
            id: 3,
            user: "jdoe",
            task: "Update accountingant",
            category: "Development",
            startTime: "2020-03-03",
            fastTime: "29:00",
            status: "Completed",
          },
          {
            id: 4,
            user: "jdoe",
            task: "Pomodoro accumulation",
            category: "Documentation",
            startTime: "2020-03-02",
            fastTime: "10:60",
            status: "Completed",
          },
        ]);
      });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400">
            <th className="pb-2">User</th>
            <th className="pb-2">Task</th>
            <th className="pb-2">Category</th>
            <th className="pb-2">Start Time</th>
            <th className="pb-2">Fast Time</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(sessions) && sessions.length > 0 ? (
            sessions.map((s) => (
              <tr key={s.id} className="border-t border-gray-700">
                <td className="py-2">{s.user}</td>
                <td className="py-2">{s.task}</td>
                <td className="py-2">{s.category}</td>
                <td className="py-2">{s.startTime}</td>
                <td className="py-2">{s.fastTime}</td>
                <td className="py-2">
                  <span className="bg-green-700 text-xs px-3 py-1 rounded-full">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-400">
                No sessions available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
