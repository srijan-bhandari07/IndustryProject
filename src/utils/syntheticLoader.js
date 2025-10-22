// src/utils/syntheticLoader.js
import * as XLSX from "xlsx";

// ----------- Load + normalize Excel sheet -----------
export async function loadSyntheticRows(url = "/data/synthetic_data.xlsx") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();

  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // normalize headers for flexible lookups
  return rows.map((r) => normalizeKeys(r));
}

// ----------- Row → Telemetry Mapping -----------
export function rowToTelemetry(row) {
  const num = (v) => (Number.isFinite(+v) ? +v : null);
  const pick = (obj, keys) => {
    for (const k of keys) {
      const nk = normKey(k);
      if (obj[nk] != null && obj[nk] !== "") return num(obj[nk]);
    }
    return null;
  };

  // --- Sensors ---
  const pressure = pick(row, [
    "tank pressure (bar)",
    "Tank Pressure (bar)",
    "Tank Pressure",
    "Pressure",
  ]);
  const tankLevel = pick(row, [
    "tank level (%)",
    "Tank Level (%)",
    "Tank Level",
  ]);
  const prodTemp = pick(row, [
    "product temp (°c)",
    "product temp (â°c)", // Excel encoding issue
    "Product Temp (°C)",
    "Product Temp",
  ]);
  const fillLevel = pick(row, [
    "fill level (ml)",
    "Fill Level (ml)",
    "Fill Level",
  ]);
  const seamIntegrity = pick(row, [
    "seam integrity (%)",
    "Seam Integrity",
  ]);
  const seamThick = pick(row, [
    "seam thickness (mm)",
    "Seam Thickness",
  ]);
  const sealingForce = pick(row, [
    "sealing force (n)",
    "Sealing Force (N)",
    "Sealing Force",
  ]);
  const vibration = pick(row, [
    "vibration (mm/s)",
    "Vibration (rms)",
    "Vibration",
  ]);
  const oxy = pick(row, [
    "oxygen content (ppm)",
    "Oxygen Content",
    "O2 Content",
    "O₂ Content",
  ]);
  const co2 = pick(row, [
    "co2 content (g/l)",
    "CO2 Content",
    "CO₂ Content",
  ]);

  // --- Speed ---
  const seamSpeed = pick(row, [
    "seaming speed (cans/min)",
    "Seaming Speed",
    "Cycle Rate (Units/min)",
    "Cycle Rate",
    "Speed",
  ]);
  const cycleRate = pick(row, [
    "cycle rate (cans/min)",
    "Cycle Rate",
    "Speed",
  ]);

  // --- Optional defects ---
  const defect = pick(row, ["Defect Rate", "Defects (%)", "Defects"]);

  // --- Combined telemetry return ---
  return {
    machineData: {
      temperature: prodTemp ?? 72.4,
      vibration: vibration ?? 4.2,
      pressure: pressure ?? 3.5,
      voltage: 415,
    },
    drivers: {
      co2Content: co2,
      oxygenContent: oxy,
      seamIntegrity,
      seamThickness: seamThick,
      sealingForce,
      vibration,
      pressure,
      fillLevel,
      tankLevel,
      productTemp: prodTemp, // ✅ now connected to Excel temperature column
    },
    speed: seamSpeed ?? cycleRate,
    defectRate: defect,
  };
}

// ----------- Helpers -----------
function normKey(k) {
  return String(k || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeys(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[normKey(k)] = v;
  }
  return out;
} 