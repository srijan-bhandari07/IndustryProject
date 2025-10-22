// src/components/admin/QualityDetailModal.jsx
import React, { useEffect } from "react";
import SpeedRateChart from "../SpeedRateChart";
import { getSeverity, describeThreshold } from "../../utils/alertEvaluator";

export default function QualityDetailModal({
  mode = "quality", // "quality" | "defects"
  title = "Quality Details",
  onClose,
  defectRate = 0,
  qualityStatus = "Normal",
  drivers = {},
  history = [],        // defect rate samples
  speedSeries = [],    // speed samples
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const vals = normalizeDrivers(drivers);

  const kpis = [
    { key: "co2", title: "CO₂", value: fmtNum(vals.co2, "%", 2), feature: "co2Content", raw: vals.co2, tip: describeThreshold("co2Content") },
    { key: "o2", title: "O₂", value: fmtNum(vals.o2, "%", 2), feature: "oxygenContent", raw: vals.o2, tip: describeThreshold("oxygenContent") },
    { key: "vib", title: "Vibration", value: fmtNum(vals.vib, " mm/s", 1), feature: "vibration", raw: vals.vib, tip: describeThreshold("vibration") },
    { key: "press", title: "Pressure", value: fmtNum(vals.press, " bar", 1), feature: "tankPressure", raw: vals.press, tip: describeThreshold("tankPressure") },
  ];

  const isDefects = mode === "defects";

  const latest =
    isDefects
      ? history?.length ? history[history.length - 1].toFixed(2) : "0.00"
      : speedSeries?.length ? speedSeries[speedSeries.length - 1].toFixed(1) : "0.0";

  const unit = isDefects ? "%" : "u/min";
  const label = isDefects ? "Defect Rate" : "Speed Rate";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet pretty" onClick={(e) => e.stopPropagation()}>
        {/* HERO */}
        <div className="qd-hero">
          <div className="qd-hero-left">
            <div className="qd-circle">
              <i className={`fas ${isDefects ? "fa-triangle-exclamation" : "fa-gauge-high"}`} />
            </div>
            <div>
              <h3 className="qd-title">{title}</h3>
              <div className="qd-sub">
                {isDefects ? "Live defect trend overview" : "Live quality overview"}
              </div>
            </div>
          </div>
          <div className="qd-hero-right">
            <span className="kpi-pill ghost">{qualityStatus}</span>
            <button className="btn small ghost" onClick={onClose}>
              <i className="fas fa-times" /> Close
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="qd-kpis">
          {kpis.map((k) => {
            const sev = getSeverity(k.feature, k.raw) || "info";
            return (
              <div className={`qd-kpi kpi-${sev}`} key={k.key} title={k.tip}>
                <div className="qd-kpi-title">{k.title}</div>
                <div className="qd-kpi-value">{k.value}</div>
              </div>
            );
          })}
        </div>

        {/* BODY */}
        <div className="qd-grid">
          {/* Signals */}
          <Card title="Signals">
            <Signals vals={vals} />
          </Card>

          {/* Line chart */}
          <Card title={isDefects ? "Defect Rate (%)" : "Speed Rate (Units/min)"}>

            <div style={{ padding: 6 }}>
              <SpeedRateChart
                samples={(isDefects ? history : speedSeries).map((v, i) =>
                  isDefects ? { idx: i, rate: v } : { idx: i, rate: v }
                )}
                height={140}
                stroke={isDefects ? "#f87171" : "#60a5fa"}
              />
              <div className="qd-history-meta" style={{ marginTop: 8 }}>
                <div>
                  Latest:&nbsp;
                  <strong>{latest}</strong>
                  <span className="qd-unit">&nbsp;{unit}</span>
                </div>
                <div>
                  Samples:&nbsp;<strong>{(isDefects ? history : speedSeries)?.length || 0}</strong>
                </div>
              </div>
              <div className="qd-thresh-hint">
              
              </div>
            </div>
          </Card>
        </div>

        <div className="qd-footer" />
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function normalizeDrivers(d) {
  const num = (x) => (Number.isFinite(+x) ? +x : null);
  return {
    co2: num(d.co2Content),
    o2: num(d.oxygenContent),
    vib: num(d.vibration),
    press: num(d.pressure),
    seamInt: num(d.seamIntegrity),
    seamThk: num(d.seamThickness),
    sealF: num(d.sealingForce),
    fill: num(d.fillLevel),
    tankLevel: num(d.tankLevel),
    prodT: num(d.productTemp), // ✅ product temperature pulled from Excel
  };
}

function fmtNum(v, unit = "", places = 1) {
  return v == null ? "—" : `${v.toFixed(places)}${unit}`;
}

function Card({ title, children }) {
  return (
    <div className="qd-card">
      <div className="qd-card-head">{title}</div>
      {children}
    </div>
  );
}

function Signals({ vals }) {
  const rows = [
    { label: "CO₂ Content", feature: "co2Content", val: vals.co2, unit: "%", tip: describeThreshold("co2Content") },
    { label: "O₂ Content", feature: "oxygenContent", val: vals.o2, unit: "%", tip: describeThreshold("oxygenContent") },
    { label: "Seam Integrity", feature: "seamIntegrity", val: vals.seamInt, unit: "%", tip: describeThreshold("seamIntegrity") },
    { label: "Seam Thickness", feature: "seamThickness", val: vals.seamThk, unit: " mm", tip: describeThreshold("seamThickness") },
    { label: "Sealing Force", feature: "sealingForce", val: vals.sealF, unit: " N", tip: describeThreshold("sealingForce") },
    { label: "Vibration", feature: "vibration", val: vals.vib, unit: " mm/s", tip: describeThreshold("vibration") },
    { label: "Fill Level", feature: "fillLevel", val: vals.fill, unit: " ml", tip: describeThreshold("fillLevel") },
    { label: "Product Temp", feature: "productTemp", val: vals.prodT, unit: " °C", tip: describeThreshold("productTemp") }, // ✅ shown in table
  ];

  return (
    <div className="qd-signals">
      {rows.map((r) => {
        const sev = getSeverity(r.feature, r.val);
        const pct = gaugePct(r);
        return (
          <div key={r.label} className={`qd-signal sev-${sev}`} title={r.tip}>
            <div className="qd-signal-label">{r.label}</div>
            <div className="qd-signal-right">
              <div className="qd-gauge">
                <div className={`qd-gauge-fill sev-${sev}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="qd-signal-val">
                {r.val == null ? "—" : r.val.toFixed(2)}
                <span className="qd-unit">{r.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function gaugePct({ val, unit }) {
  if (val == null) return 0;
  const cap = { "%": 100, " mm": 5, " mm/s": 8, " N": 300, " ml": 600, " bar": 6, " °C": 10 };
  const max = cap[unit] || 100;
  return Math.max(6, Math.min(100, (val / max) * 100));
}
