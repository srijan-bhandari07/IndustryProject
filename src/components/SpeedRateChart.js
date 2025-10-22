import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SpeedRateChart({ samples = [] }) {
  const data = samples.map((s, i) => ({
    name: `#${i + 1}`,
    speed: s.rate || 0,
  }));

  return (
    <div style={{ width: "100%", height: 180, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px" }}>
     

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#9db7e3" fontSize={12} />
          <YAxis stroke="#9db7e3" fontSize={12} />
          
          <Line
            type="monotone"
            dataKey="speed"
            stroke="#5ab3ff"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
