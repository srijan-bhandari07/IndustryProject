// src/components/Charts.js
import React, { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { THRESHOLDS, getSeverity } from "../utils/alertEvaluator";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ---------- Simple severity band painter (background rectangles) ---------- */
const SeverityBandsPlugin = {
  id: "severityBands",
  beforeDatasetsDraw(chart, _args, opts) {
    const t = opts?.thresholds;
    if (!t) return;

    const { ctx, chartArea, scales } = chart;
    const y = scales.y;
    if (!y || !chartArea) return;

    const { top, bottom, left, right } = chartArea;

    // helper to map value -> pixel (clamps to axis range)
    const yPix = (v) => {
      const val =
        Number.isFinite(v)
          ? Math.max(y.min, Math.min(y.max, v))
          : y.max; // handle Infinity
      return y.getPixelForValue(val);
    };

    // unpack threshold bands
    const [n0, n1] = t.normal;
    const [w0, w1, w2, w3] = t.warning;
    const cLowEnd = t.critical[1];
    const cHighStart = t.critical[2];
    const yMin = yPix(y.min);
    const yMax = yPix(y.max);

    // colors (light on dark)
    const C = {
      ok: "rgba(16, 185, 129, 0.18)",       // green
      warn: "rgba(245, 158, 11, 0.18)",     // amber
      crit: "rgba(239, 68, 68, 0.18)",      // red
    };

    ctx.save();

    // helper to fill a horizontal band from value a..b
    const band = (a, b, fill) => {
      const y1 = yPix(a);
      const y2 = yPix(b);
      const topY = Math.min(y1, y2);
      const h = Math.abs(y2 - y1);
      ctx.fillStyle = fill;
      ctx.fillRect(left, topY, right - left, h);
    };

    // draw from bottom->top order
    band(y.min, cLowEnd, C.crit);   // Critical (low)
    band(w0, w1, C.warn);           // Warning (low)
    band(n0, n1, C.ok);             // Normal
    band(w2, w3, C.warn);           // Warning (high)
    band(cHighStart, y.max, C.crit);// Critical (high)

    ctx.restore();
  },
};

ChartJS.register(SeverityBandsPlugin);

const Charts = ({ temperatureData = [], vibrationData = [] }) => {
  /* ---------- Labels for temperature line ---------- */
  const tempLabels = useMemo(() => {
    if (!temperatureData?.length) {
      return ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    }
    const n = temperatureData.length;
    const now = Date.now();
    return Array.from({ length: n }, (_, i) =>
      new Date(now - (n - 1 - i) * 5 * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [temperatureData]);

  /* ---------- Temperature dataset ---------- */
  const tempChartData = {
    labels: tempLabels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: temperatureData,
        borderColor: "#fb7185", // coral-ish
        backgroundColor: "rgba(251, 113, 133, 0.20)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  // y-domain using thresholds (fallbacks keep it readable)
  const Tt = THRESHOLDS.productTemp;
  const tempMin =
    Number.isFinite(Tt?.critical?.[0]) ? Tt.critical[0] : Math.min(0, ...temperatureData, 0);
  const tempMax = Number.isFinite(Tt?.critical?.[3])
    ? Tt.critical[3]
    : Math.max(Tt?.warning?.[3] ?? 10, ...(temperatureData || [0])) * 1.1;

  const tempChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      // severity band painter for temperature
      severityBands: { thresholds: THRESHOLDS.productTemp },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            const sev = getSeverity("productTemp", v);
            const tag = sev === "critical" ? "Critical" : sev === "warning" ? "Warning" : "Normal";
            return ` ${v.toFixed(2)} °C  •  ${tag}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: tempMin,
        max: tempMax,
        title: { display: true, text: "Temperature (°C)", color: "#bcd0ff" },
        grid: { color: "rgba(255,255,255,0.08)" },
        ticks: { color: "#bcd0ff" },
      },
      x: {
        title: { display: true, text: "Time", color: "#bcd0ff" },
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#bcd0ff" },
      },
    },
  };

  /* ---------- Vibration bars ---------- */
  const vibLabels = ["X-axis", "Y-axis", "Z-axis"];
  const vibData = Array.isArray(vibrationData) && vibrationData.length === 3
    ? vibrationData
    : [3.2, 1.2, 2.8];

  const vibChartData = {
    labels: vibLabels,
    datasets: [
      {
        label: "Vibration (mm/s)",
        data: vibData,
        backgroundColor: "#60a5fa",
        borderRadius: 8,
      },
    ],
  };

  const Tv = THRESHOLDS.vibration;
  const vibMin = Number.isFinite(Tv?.critical?.[0]) ? Tv.critical[0] : 0;
  const vibMax = Number.isFinite(Tv?.critical?.[3]) ? Tv.critical[3] : 10;

  const vibrationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      // severity band painter for vibration
      severityBands: { thresholds: THRESHOLDS.vibration },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            const sev = getSeverity("vibration", v);
            const tag = sev === "critical" ? "Critical" : sev === "warning" ? "Warning" : "Normal";
            return ` ${v.toFixed(2)} mm/s  •  ${tag}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: vibMin,
        max: vibMax,
        title: { display: true, text: "Vibration (mm/s)", color: "#bcd0ff" },
        grid: { color: "rgba(255,255,255,0.08)" },
        ticks: { color: "#bcd0ff" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#bcd0ff" },
      },
    },
  };

  return (
    <div className="charts">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Temperature Trend</div>
        </div>
        <div className="chart-container" style={{ height: 320 }}>
          <Line data={tempChartData} options={tempChartOptions} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Vibration Analysis</div>
        </div>
        <div className="chart-container" style={{ height: 320 }}>
          <Bar data={vibChartData} options={vibrationChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
