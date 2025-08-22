import React, { useEffect, useState } from "react";
import { getUserWork } from "../api/analyst";

export default function SessionLog({ userId }) {
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().slice(0, 10)
    );

    useEffect(() => {
        if (!userId || !selectedDate) return;

        getUserWork(userId, selectedDate)
            .then((res) => {
                if (res.success && Array.isArray(res.sessions)) {
                    setSessions(res.sessions);
                } else {
                    setSessions([]);
                }
            })
            .catch((err) => {
                console.error("Error fetching user work:", err);
                setSessions([]);
            });
    }, [userId, selectedDate]);

    return (
        <div className="p-6 text-gray-800 w-full max-w-5xl">
            {/* Header with Date Picker */}
            <div className="mb-6 flex justify-between items-center px-6">
                <h1 className="text-2xl font-bold text-orange-600">Session Log</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm table-fixed border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-gray-500">
                                <th className="pb-4 px-4 w-[15%] text-left">Task</th>
                                <th className="pb-4 px-4 w-[18%] text-left">Start Time</th>
                                <th className="pb-4 px-4 w-[18%] text-left">End Time</th>
                                <th className="pb-4 px-4 w-[8%] text-left">Duration</th>
                                <th className="pb-4 px-4 w-[10%] text-left">Status</th>
                                <th className="pb-4 px-4 w-[31%] text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => {
                                console.log("Session row:", s.task_name, s);
                                return (
                                    <tr key={s.session_id} className="border-t border-gray-200">
                                        <td className="py-2 px-4">{s.task_name || s.task_id}</td>
                                        <td className="py-2 px-4">
                                            {new Date(s.start_time).toLocaleString()}
                                        </td>
                                        <td className="py-2 px-4">
                                            {s.end_time ? new Date(s.end_time).toLocaleString() : "Ongoing"}
                                        </td>
                                        <td className="py-2 px-4">{s.duration_minutes}</td>
                                        <td className="py-2 px-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === "Completed"
                                                    ? "bg-green-500 text-white"
                                                    : s.status === "Started"
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-red-500 text-white"
                                                    }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4">{s.notes}</td>
                                    </tr>
                                );
                            })}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
}
