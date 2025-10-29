// src/components/ThresholdBar.jsx
import React from "react";
import { getFeatureMeta, THRESHOLDS } from "../utils/alertEvaluator";

export default function ThresholdBar({ value, feature, showLabels = true }) {
  const meta = getFeatureMeta(feature);
  const thresholds = THRESHOLDS[feature];
  const unit = meta?.unit || "";

  if (value == null || !thresholds) return null;

  const t = thresholds;

  // Safely replace Infinity with reasonable upper cap
  const sanitize = (x, fallback) => (Number.isFinite(x) ? x : fallback);

  const critLow = sanitize(t.critical[1], 0);
  const critHigh = sanitize(t.critical[2], t.critical[1] * 1.5);
  const warnLow = sanitize(t.warning[1], critLow * 0.8);
  const warnHigh = sanitize(t.warning[2], critHigh * 0.9);
  const normalLow = sanitize(t.normal[0], warnLow);
  const normalHigh = sanitize(t.normal[1], warnHigh);

  const min = sanitize(t.critical[0], 0);
  const max = sanitize(t.critical[3], critHigh * 1.25);

  // Normalize 0–1 scale
  const clamp = (x) => Math.max(0, Math.min(1, (x - min) / (max - min)));
  const toPct = (v) => `${clamp(v) * 100}%`;
  const pos = clamp(value);

  // Distance label logic
  let label = "";
  if (value < warnLow) label = `${(warnLow - value).toFixed(2)}${unit} to Warning`;
  else if (value < normalLow) label = `${(normalLow - value).toFixed(2)}${unit} to Normal`;
  else if (value <= normalHigh) label = "Within Normal";
  else if (value < warnHigh) label = `${(warnHigh - value).toFixed(2)}${unit} to Warning`;
  else if (value < critHigh) label = `${(critHigh - value).toFixed(2)}${unit} to Critical`;
  else label = `Over Critical by ${(value - critHigh).toFixed(2)}${unit}`;

  return (
    <div className="thbar">
      <div className="thbar-track">
        {/* Zones */}
        <div className="thbar-zone thbar-crit" style={{ left: 0, width: toPct(critLow) }} />
        <div className="thbar-zone thbar-warn" style={{ left: toPct(critLow), width: `calc(${toPct(warnLow)} - ${toPct(critLow)})` }} />
        <div className="thbar-zone thbar-normal" style={{ left: toPct(normalLow), width: `calc(${toPct(normalHigh)} - ${toPct(normalLow)})` }} />
        <div className="thbar-zone thbar-warn" style={{ left: toPct(warnHigh), width: `calc(${toPct(critHigh)} - ${toPct(warnHigh)})` }} />
        <div className="thbar-zone thbar-crit" style={{ left: toPct(critHigh), width: `calc(100% - ${toPct(critHigh)})` }} />

        {/* Pointer / Fill */}
        <div className="thbar-fill" style={{ width: `${pos * 100}%` }} />
      </div>

      {/* ✅ Labels - Conditionally rendered */}
      {showLabels && (
        <div className="thbar-legend">
          <span>{min}{unit}</span>
          <span>{label}</span>
          <span>{max === Infinity ? `∞${unit}` : `${max}${unit}`}</span>
        </div>
      )}
    </div>
  );
}