// utils/alertEvaluator.js
// ----------------------

export const THRESHOLDS = {
  // ===== FILLING =====
  tankPressure:   { normal:[2.0,3.0],  warning:[1.0,2.0,3.0,4.5],  critical:[0,1.0,4.5,6.0] },
  tankLevel:      { normal:[28,32],    warning:[10,28,32,50],     critical:[0,10,50,100] },
  productTemp:    { normal:[0.5,4.0],  warning:[0.5,4.0,4.0,8.0], critical:[0,0.5,8.0,Infinity] },
  fillLevel:      { normal:[328,332],  warning:[320,328,332,340], critical:[0,320,340,400] },
  snift1Throttle: { normal:[40,87],    warning:[30,40,87,90],     critical:[0,30,90,100] },
  snift1Time:     { normal:[1.0,1.5],  warning:[0.5,1.0,1.5,2.0], critical:[0,0.5,2.0,3.0] },
  snift2Throttle: { normal:[5,15],     warning:[3,5,15,18],       critical:[0,3,18,25] },
  snift2Time:     { normal:[0.5,1.5],  warning:[0.3,0.5,1.5,2.0], critical:[0,0.3,2.0,3.0] },
  cycleRate:      { normal:[200,250],  warning:[150,200,250,280], critical:[0,150,280,400] },

  // ===== SEAMING =====
  vibration:      { normal:[0.5,2.5],  warning:[0.5,2.5,2.5,6.0], critical:[0,0.5,6.0,10.0] },
  sealingForce:   { normal:[80,100],   warning:[80,100,100,120],  critical:[0,80,120,200] },
  seamingSpeed:   { normal:[200,250],  warning:[150,200,250,280], critical:[0,150,280,350] },
  seamIntegrity:  { normal:[95,100],   warning:[80,95,100,104],   critical:[0,80,104,120] },

  // ===== QA =====
  oxygenContent:  { normal:[0.1,0.8],  warning:[0.1,0.8,0.8,3.0], critical:[0,0.1,3.0,Infinity] },
  co2Content:     { normal:[4.0,6.0],  warning:[2.0,4.0,6.0,8.0], critical:[0,2.0,8.0,Infinity] },
  seamThickness:  { normal:[1.1,1.3],  warning:[1.1,1.3,1.3,1.6], critical:[0,1.1,1.6,Infinity] },
};

// Pretty names / units / groups shown in the UI modal
const META = {
  tankPressure:   { label: 'Tank Pressure',   unit: 'bar',       group: 'Filling' },
  tankLevel:      { label: 'Tank Level',      unit: '%',         group: 'Filling' },
  productTemp:    { label: 'Product Temp',    unit: '°C',        group: 'Filling' },
  fillLevel:      { label: 'Fill Level',      unit: 'ml',        group: 'Filling' },
  snift1Throttle: { label: 'Snift-1 Throttle',unit: 'psi',       group: 'Filling' },
  snift1Time:     { label: 'Snift-1 Time',    unit: 's',         group: 'Filling' },
  snift2Throttle: { label: 'Snift-2 Throttle',unit: 'psi',       group: 'Filling' },
  snift2Time:     { label: 'Snift-2 Time',    unit: 's',         group: 'Filling' },
  cycleRate:      { label: 'Cycle Rate',      unit: 'cans/min',  group: 'Filling' },

  vibration:      { label: 'Vibration',       unit: 'mm/s',      group: 'Seaming' },
  sealingForce:   { label: 'Sealing Force',   unit: 'N',         group: 'Seaming' },
  seamingSpeed:   { label: 'Seaming Speed',   unit: 'cans/min',  group: 'Seaming' },
  seamIntegrity:  { label: 'Seam Integrity',  unit: '%',         group: 'Seaming' },

  oxygenContent:  { label: 'O₂ Content',      unit: 'ppm',       group: 'QA' },
  co2Content:     { label: 'CO₂ Content',     unit: 'g/L',       group: 'QA' },
  seamThickness:  { label: 'Seam Thickness',  unit: 'mm',        group: 'QA' },
};

export function getFeatureMeta(feature) {
  return META[feature] || { label: feature, unit: '', group: 'Process' };
}

export function getSeverity(feature, value) {
  const t = THRESHOLDS[feature];
  if (!t || value == null) return 'info';
  const v = +value;

  // critical if <crit.low or >crit.high
  if (v < t.critical[1] || v > t.critical[2]) return 'critical';
  // warning if <warn.low or >warn.high
  if (v < t.warning[1] || v > t.warning[2]) return 'warning';
  // normal band
  if (v >= t.normal[0] && v <= t.normal[1]) return 'normal';
  return 'info';
}

// Compact string for ranges, used in the modal
export function describeThreshold(feature) {
  const t = THRESHOLDS[feature];
  if (!t) return '';
  const normal = `${t.normal[0]}–${t.normal[1]}`;
  const warn = `${t.warning[0]}–${t.warning[1]} or ${t.warning[2]}–${t.warning[3]}`;
  const crit = `<${t.critical[1]} or >${t.critical[2]}`;
  return `Normal: ${normal} | Warning: ${warn} | Critical: ${crit}`;
}

// Helper used by cards/badges to pick a color class
export function getColorClass(feature, value) {
  const sev = getSeverity(feature, value);
  return sev === 'critical' ? 'critical' : sev === 'warning' ? 'warning' : 'normal';
}
