// src/components/admin/AdminQualityCards.jsx
import React from "react";
import ThresholdBar from "../ThresholdBar"; // ⬅️ add this

/**
 * Dashboard KPI cards:
 * - "Quality Status" (badge + driver summary + mini threshold bars with labels)
 * - "Defect Rate" (big % + trend + signals summary)
 */
export default function AdminQualityCards({
  qualityStatus = "Normal",
  defectRate = 0,
  trend = 0,
  drivers = {},
  onOpenQuality,
  onOpenDefects,
}) {
  const fmt = {
    pct: (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : "—") + " %",
    num: (v, d = 1) => (Number.isFinite(+v) ? (+v).toFixed(d) : "—"),
  };

  const driversLine = [
    drivers.seamIntegrity != null && `Seam Int: ${fmt.pct(drivers.seamIntegrity, 1)}`,
    drivers.oxygenContent != null && `O₂: ${fmt.pct(drivers.oxygenContent, 2)}`,
    drivers.co2Content != null && `CO₂: ${fmt.pct(drivers.co2Content, 2)}`,
    drivers.seamThickness != null && `Seam Thk: ${fmt.num(drivers.seamThickness, 2)} mm`,
    drivers.sealingForce != null && `Seal F: ${fmt.num(drivers.sealingForce, 0)} N`,
  ]
    .filter(Boolean)
    .join(" • ");

  const signalsLine = [
    drivers.vibration != null && `Vibration: ${fmt.num(drivers.vibration, 1)} mm/s`,
    drivers.fillLevel != null && `Fill: ${fmt.num(drivers.fillLevel, 0)} ml`,
    drivers.sealingForce != null && `Seal F: ${fmt.num(drivers.sealingForce, 0)} N`,
  ]
    .filter(Boolean)
    .join(" • ");

  const badgeTone =
    qualityStatus.toLowerCase() === "warning"
      ? "warning"
      : qualityStatus.toLowerCase() === "poor"
      ? "danger"
      : "ok";

  const Trend = () => {
    const color =
      trend > 0 ? "#ff9b8f" : trend < 0 ? "#7ce6b3" : "rgba(255,255,255,.85)";
    const sign = trend > 0 ? "▲" : trend < 0 ? "▼" : "•";
    return (
      <span className="kpi-trend" style={{ color }}>
        {sign} {Math.abs(+trend).toFixed(2)}% vs last
      </span>
    );
  };

  // Small row with a label + a ThresholdBar (with labels turned on)
  const Mini = ({ label, feature, value, unit = "" }) => (
    <div className="mini-th">
      <div className="mini-th-row">
        <span className="mini-th-label">{label}</span>
        <span className="mini-th-val">
          {value == null ? "—" : `${Number(value).toFixed(2)}${unit}`}
        </span>
      </div>
      {/* 🔧 FIXED: Changed featureKey to feature */}
      <ThresholdBar feature={feature} value={value} showLabels />
    </div>
  );

  return (
    <div className="kpi-row">
      {/* QUALITY STATUS */}
      <article
        role="button"
        tabIndex={0}
        className="kpi-card"
        title="Click to view details"
        onClick={onOpenQuality}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenQuality?.()}
      >
        <header className="kpi-head">
          <h3 className="kpi-title">Quality Status</h3>
        </header>

        <div className="kpi-body">
          <div className={`pill ${badgeTone}`}>{qualityStatus}</div>

          {driversLine && (
            <div className="kpi-line">
              <strong>Drivers:</strong>&nbsp;{driversLine}
            </div>
          )}

          {/* 🔧 Compact threshold bars with labels */}
          <div className="mini-th-grid">
            <Mini label="CO₂" feature="co2Content" value={drivers.co2Content} unit="%" />
            <Mini label="O₂" feature="oxygenContent" value={drivers.oxygenContent} unit="%" />
            <Mini label="Vibration" feature="vibration" value={drivers.vibration} unit=" mm/s" />
            <Mini label="Pressure" feature="tankPressure" value={drivers.pressure ?? drivers.tankPressure} unit=" bar" />
          </div>
        </div>
      </article>

      {/* DEFECT RATE */}
      <article
        role="button"
        tabIndex={0}
        className="kpi-card"
        onClick={onOpenDefects}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenDefects?.()}
      >
        <header className="kpi-head">
          <h3 className="kpi-title">Defect Rate</h3>
        </header>

        <div className="kpi-body">
          <div className="big-num">
            {fmt.num(defectRate, 2)}%
            <span className="big-num-gap"> </span>
            <Trend />
          </div>

          {signalsLine && (
            <div className="kpi-line">
              <strong>Signals:</strong>&nbsp;{signalsLine}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}