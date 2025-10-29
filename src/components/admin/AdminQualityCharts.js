import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, Legend
} from "recharts";
import { THRESHOLDS, getSeverity } from "../../utils/alertEvaluator";

export default function AdminQualityCharts({ co2History = [] }) {
  // Prepare data
  const data = useMemo(() => {
    const arr = co2History?.length
      ? co2History
      : [5.6, 5.6, 4.1, 4.0, 5.3, 5.6, 5.5, 5.2, 5.6, 4.3, 5.8, 5.7, 4.2, 5.3];
    const now = Date.now();
    return arr.map((v, i) => ({
      time: new Date(now + i * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      co2: Number(v),
    }));
  }, [co2History]);

  // CO₂ thresholds
  const t = THRESHOLDS.co2Content; // { normal:[4,6], warning:[2,4,6,8], critical:[0,2,8,Inf] }
  const yMin = 0;
  const yMax = Number.isFinite(t.critical[3]) ? t.critical[3] : Math.max(10, t.warning[3] * 1.15);

  // Convenience
  const N0 = t.normal[0], N1 = t.normal[1];
  const W0 = t.warning[0], W1 = t.warning[1], W2 = t.warning[2], W3 = t.warning[3];
  const C0 = t.critical[0], C1 = t.critical[1], C2 = t.critical[2]; // C3 can be Infinity

  return (
    <div className="charts">
      <div className="card">
        <div className="card-header">
          <div className="card-title">CO₂ Levels</div>
        </div>

        <div className="chart-container" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 18, left: 8, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

              {/* ===== Severity background bands (bottom → top) ===== */}
              {/* Critical (low) */}
              <ReferenceArea y1={yMin} y2={C1} fill="#ef4444" fillOpacity={0.18} ifOverflow="extendDomain" />
              {/* Warning (low) */}
              <ReferenceArea y1={W0} y2={W1} fill="#f59e0b" fillOpacity={0.18} ifOverflow="extendDomain" />
              {/* Normal */}
              <ReferenceArea y1={N0} y2={N1} fill="#10b981" fillOpacity={0.18} ifOverflow="extendDomain" />
              {/* Warning (high) */}
              <ReferenceArea y1={W2} y2={W3} fill="#f59e0b" fillOpacity={0.18} ifOverflow="extendDomain" />
              {/* Critical (high) */}
              <ReferenceArea y1={C2} y2={yMax} fill="#ef4444" fillOpacity={0.18} ifOverflow="extendDomain" />

              <XAxis dataKey="time" stroke="#bcd0ff" fontSize={12} tickMargin={8} />
              <YAxis stroke="#bcd0ff" fontSize={12} domain={[yMin, yMax]} />

              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
                labelStyle={{ color: "#9fb7ff" }}
                formatter={(v) => {
                  const sev = getSeverity("co2Content", v);
                  const tag = sev === "critical" ? "Critical" : sev === "warning" ? "Warning" : "Normal";
                  return [`${Number(v).toFixed(2)} %`, `CO₂ • ${tag}`];
                }}
              />

            

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="co2"
                stroke="#86efac" // light green for visibility on bands
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#86efac", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
