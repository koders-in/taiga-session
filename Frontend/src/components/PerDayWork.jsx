import { useState, useEffect } from "react";
import axios from "axios";

export default function PerDayWork() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    axios.get("/api/stats/weekly").then((res) => setStats(res.data.dailyStats));
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Per Day Work</h3>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((day, idx) => (
            <tr key={idx}>
              <td>{day.date}</td>
              <td>{day.hours} hrs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
