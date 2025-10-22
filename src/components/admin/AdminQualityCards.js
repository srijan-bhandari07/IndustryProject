import React from "react";

/**
 * Dashboard KPI cards:
 * - "Quality Status" (badge + driver summary)
 * - "Defect Rate" (big % + trend + signals summary)
 */
export default function AdminQualityCards({
  qualityStatus = "Normal",
  defectRate = 0,
  trend = 0, // percentage points vs last (e.g. +0.20)
  drivers = {},
  onOpenQuality,
  onOpenDefects,
}) {
  const fmt = {
    pct: (v, d = 2) =>
      (Number.isFinite(+v) ? (+v).toFixed(d) : "—") + " %",
    num: (v, d = 1) => (Number.isFinite(+v) ? (+v).toFixed(d) : "—"),
  };

  // Build the “Drivers:” line (like your screenshot)
  const driversLine = [
    drivers.seamIntegrity != null && `Seam Int: ${fmt.pct(drivers.seamIntegrity, 1)}`,
    drivers.oxygenContent != null && `O₂: ${fmt.pct(drivers.oxygenContent, 2)}`,
    drivers.co2Content != null && `CO₂: ${fmt.pct(drivers.co2Content, 2)}`,
    drivers.seamThickness != null && `Seam Thk: ${fmt.num(drivers.seamThickness, 2)} mm`,
    drivers.sealingForce != null && `Seal F: ${fmt.num(drivers.sealingForce, 0)} N`,
  ].filter(Boolean).join(" • ");

  // Build the “Signals:” line on the Defect card
  const signalsLine = [
    drivers.vibration != null && `Vibration: ${fmt.num(drivers.vibration, 1)} mm/s`,
    drivers.fillLevel != null && `Fill: ${fmt.num(drivers.fillLevel, 0)} ml`,
    drivers.sealingForce != null && `Seal F: ${fmt.num(drivers.sealingForce, 0)} N`,
  ].filter(Boolean).join(" • ");

  const badgeTone = qualityStatus.toLowerCase() === "warning"
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
