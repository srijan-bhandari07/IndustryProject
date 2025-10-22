// src/components/admin/AdminQualityCharts.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Displays CO₂ levels over time (simple dashboard-style chart)
 */
export default function AdminQualityCharts({ co2History = [] }) {
  // Prepare data
  const data =
    co2History && co2History.length > 0
      ? co2History.map((v, i) => ({
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          co2: parseFloat(v?.toFixed(2)) || 0,
        }))
      : [
          { time: "00:00", co2: 3.2 },
          { time: "00:05", co2: 3.4 },
          { time: "00:10", co2: 3.8 },
          { time: "00:15", co2: 3.6 },
          { time: "00:20", co2: 3.9 },
          { time: "00:25", co2: 3.5 },
        ];

  return (
    <div className="charts">
      <div className="card">
        <div className="card-header">
          <div className="card-title">CO₂ Levels</div>
        </div>
        <div className="chart-container" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#bcd0ff" fontSize={12} tickMargin={8} />
              <YAxis stroke="#bcd0ff" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1e2e",
                  borderRadius: "8px",
                  border: "1px solid #2c3550",
                }}
                labelStyle={{ color: "#bcd0ff" }}
                formatter={(value) => [`${value}%`, "CO₂"]}
              />
              <Line
                type="monotone"
                dataKey="co2"
                stroke="#5ce6a5"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#5ce6a5", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 