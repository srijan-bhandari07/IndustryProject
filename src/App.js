// App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusCards from './components/StatusCards';
import Charts from './components/Charts';
import Alerts from './components/Alerts';
import { useAdminStore } from './context/AdminStore';
import { sendWarningToMachineStaff, canSendWarningNow } from './utils/sendEmail';

// Admin-only components
import AdminQualityCards from './components/admin/AdminQualityCards';
import AdminQualityCharts from './components/admin/AdminQualityCharts';
import QualityDetailModal from './components/admin/QualityDetailModal';
import MaintenanceLogModal from './components/admin/MaintenanceLogModal';

// Excel loader utilities
import { loadSyntheticRows, rowToTelemetry } from './utils/syntheticLoader';

// thresholds util
import { getSeverity, describeThreshold } from './utils/alertEvaluator';

import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMachine, setActiveMachine] = useState(0);
  const [activeProductionLine, setActiveProductionLine] = useState(0);

  // detail modals
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showDefectsModal, setShowDefectsModal] = useState(false);
  const [showMaintLog, setShowMaintLog] = useState(false);

  const { productionLines, currentUser, adminMode } = useAdminStore();
  const isAdmin = currentUser?.role === 'admin';

  const rawLine = productionLines[activeProductionLine] || { name: 'Unknown Line', machines: [] };
  const lineName = rawLine.name;
  const accessList = currentUser?.accessibleMachines || [];

  const visibleMachines = adminMode
    ? rawLine.machines
    : rawLine.machines.filter((m) => accessList.includes(m.id));

  useEffect(() => {
    if (!visibleMachines.length) {
      setActiveMachine(0);
      return;
    }
    if (activeMachine > visibleMachines.length - 1) setActiveMachine(0);
  }, [activeProductionLine, visibleMachines.length, activeMachine]);

  const currentMachine = visibleMachines[activeMachine] || null;
  const machineName = currentMachine?.name || 'No accessible machine';
  const machineStatus = currentMachine?.status || 'normal';
  const statusLabel =
    machineStatus === 'non-operational'
      ? 'Non-operational'
      : machineStatus === 'warning'
      ? 'Warning'
      : 'Operational';

  // ===== USER telemetry (legacy cards/charts) =====
  const [machineData, setMachineData] = useState({
    temperature: 72.4,
    vibration: 4.2,
    pressure: 3.5,
   
  });
  const [alerts, setAlerts] = useState([
    { id: 1, message: 'High vibration detected on Machine #1. Please inspect.', severity: 'warning', timestamp: '2025-09-10 14:32' },

    { id: 3, message: 'Preventive maintenance scheduled for Machine #2 in 3 days.', severity: 'info', timestamp: '2025-09-10 13:45' },
  ]);
  const [temperatureData, setTemperatureData] = useState([71.2, 72.5, 73.1, 72.8, 72.4, 72.9, 73.5]);
  const [vibrationData, setVibrationData] = useState([3.2, 4.2, 2.8]);

  // ===== ADMIN quality data =====
  const [defectHistory, setDefectHistory] = useState([1.2, 1.4, 1.3, 1.6, 1.8, 1.5, 1.7]); // %
  const [co2History, setCo2History] = useState([]); // CO₂ history (%)
  const defectRate = defectHistory[defectHistory.length - 1] || 0;
  const prevDefect = defectHistory[defectHistory.length - 2] ?? defectRate;
  const defectTrend = defectRate - prevDefect;

  const qualityStatus =
    defectRate < 1.5 ? 'Normal'
    : defectRate < 3.0 ? 'Warning'
    : 'Poor';

  // drivers from Excel + live speed chart
  const [drivers, setDrivers] = useState({
    co2Content: null,
    oxygenContent: null,
    seamIntegrity: null,
    seamThickness: null,
    sealingForce: null,
    vibration: null,
    pressure: null,
    fillLevel: null,
    tankLevel: null,
    productTemp: null, // °C
  });
  const [speedSeries, setSpeedSeries] = useState([]); // units/min

  // Keep all Excel rows so we can iterate
  const [excelRows, setExcelRows] = useState([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);

  // Alert cooldown per feature
  const lastAlertAtRef = useRef({});
  const ALERT_COOLDOWN_MS = 60 * 1000;

  // ===== Fallback data =====
  const loadFallbackData = useCallback(() => {
    const fallbackData = {
      machineData: { temperature: 72.4, vibration: 4.2, pressure: 3.5 },
      drivers: {
        co2Content: 3.1,
        oxygenContent: 0.8,
        seamIntegrity: 99.2,
        seamThickness: 1.2,
        sealingForce: 350,
        vibration: 4.2,
        pressure: 3.5,
        fillLevel: 950,
        tankLevel: 85.5,
        productTemp: 3.2,
      },
      speed: 48,
      defectRate: 1.5,
    };
    setMachineData(prev => ({ ...prev, ...fallbackData.machineData }));
    setDrivers(fallbackData.drivers);
    setSpeedSeries(Array(20).fill(fallbackData.speed));
    setDefectHistory([fallbackData.defectRate]);
    setCo2History([fallbackData.drivers.co2Content]);
  }, []);

  // ===== Threshold evaluation -> alerts =====
  const evaluateAndPushAlerts = useCallback((vals) => {
    const now = Date.now();
    const tryAlert = (feature, value, prettyLabel, unit = '') => {
      if (value == null || Number.isNaN(+value)) return;
      const sev = getSeverity(feature, +value);
      if (sev === 'normal' || sev === 'info') return;

      const last = lastAlertAtRef.current[feature] || 0;
      if (now - last < ALERT_COOLDOWN_MS) return;
      lastAlertAtRef.current[feature] = now;

      const ranges = describeThreshold(feature);
      const msg = `${prettyLabel}${unit ? ` (${unit})` : ''} out of range: ${value}${unit ? ` ${unit}` : ''}. ${ranges}`;
      setAlerts((a) => [
        {
          id: a.length ? Math.max(...a.map(x => x.id)) + 1 : 1,
          severity: sev === 'critical' ? 'critical' : 'warning',
          message: msg,
          feature,
          value,
          machineName,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...a,
      ]);
    };

    tryAlert('tankPressure', vals.tankPressure, 'Tank pressure', 'bar');
    // 🔧 label fixed here (was "%" before)
    tryAlert('tankLevel', vals.tankLevel, 'Tank level', '%');
    tryAlert('productTemp', vals.productTemp, 'Product temperature', '°C');
    tryAlert('cycleRate', vals.cycleRate, 'Cycle rate', 'cans/min');
  }, [machineName]);

  // ===== Process a single Excel row =====
  const processRowData = useCallback((row) => {
    const t = rowToTelemetry(row);
    setMachineData((prev) => ({ ...prev, ...t.machineData }));

    setDrivers({
      co2Content: t.drivers.co2Content,
      oxygenContent: t.drivers.oxygenContent,
      seamIntegrity: t.drivers.seamIntegrity,
      seamThickness: t.drivers.seamThickness,
      sealingForce: t.drivers.sealingForce,
      vibration: t.drivers.vibration,
      pressure: t.drivers.pressure ?? t.machineData.pressure ?? null,
      fillLevel: t.drivers.fillLevel,
      tankLevel: t.drivers.tankLevel,
      productTemp: t.drivers.productTemp ?? null,
    });

    if (t.speed != null) {
      const seed = +t.speed.toFixed(1);
      setSpeedSeries(prev => (prev.length ? [...prev.slice(-19), seed] : Array(20).fill(seed)));
    }

    if (t.defectRate != null) setDefectHistory(prev => [...prev.slice(-19), +t.defectRate.toFixed(2)]);
    if (t.drivers?.co2Content != null) setCo2History(prev => [...prev.slice(-19), +t.drivers.co2Content]);

    if (t.machineData?.temperature != null) {
      setTemperatureData(prev => [...prev.slice(-6), t.machineData.temperature]);
    }
    if (t.machineData?.vibration != null) {
      setVibrationData(prev => [prev[0], t.machineData.vibration, prev[2]]);
    }

    evaluateAndPushAlerts({
      tankPressure: t.machineData?.pressure ?? null,
      tankLevel: t.drivers?.tankLevel ?? null,
      productTemp: t.drivers?.productTemp ?? null,
      cycleRate: t.speed ?? null,
    });
  }, [evaluateAndPushAlerts]);

  // Load Excel
  useEffect(() => {
    (async () => {
      try {
        const rows = await loadSyntheticRows('/synthetic_data.xlsx');
        if (!rows?.length) {
          loadFallbackData();
          return;
        }
        setExcelRows(rows);
        processRowData(rows[0]);
      } catch (e) {
        console.error('[App] Failed to load synthetic_data.xlsx', e);
        loadFallbackData();
      }
    })();
  }, [processRowData, loadFallbackData]);

  // Simulate live stream
  useEffect(() => {
    if (!excelRows.length) return;
    const interval = setInterval(() => {
      setCurrentRowIndex((prev) => {
        const next = (prev + 1) % excelRows.length;
        processRowData(excelRows[next]);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [excelRows, processRowData]);

  const machineNameRef = useRef(machineName);
  useEffect(() => { machineNameRef.current = machineName; }, [machineName]);

  const hasMachine = !!currentMachine;

  return (
    <div className="App">
      <Header
        onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
        // ✅ wire header button to open maintenance log
        onOpenMaintLog={() => setShowMaintLog(true)}
      />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="dashboard">
        <Sidebar
          activeMachine={activeMachine}
          setActiveMachine={(i) => { setActiveMachine(i); setIsSidebarOpen(false); }}
          activeProductionLine={activeProductionLine}
          setActiveProductionLine={setActiveProductionLine}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="main-content">
          <div className="machine-header">
            <h2>{machineName}</h2>
            <div className="machine-status">
              <span className={`status-indicator ${machineStatus}`} />
              {statusLabel}
            </div>
          </div>

          {!hasMachine ? (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: '1.05rem', marginBottom: 6 }}>
                You don't have access to any machines in this production line.
              </div>
              <div style={{ opacity: 0.9 }}>
                Ask an admin to grant access in <em>Manage Users → Machine access</em>.
              </div>
            </div>
          ) : (isAdmin && adminMode) ? (
            <>
              {/* ===== ADMIN DASHBOARD ===== */}
              <AdminQualityCards
                qualityStatus={qualityStatus}
                defectRate={defectRate}
                trend={defectTrend}
                onOpenQuality={() => setShowQualityModal(true)}
                onOpenDefects={() => setShowDefectsModal(true)}
                drivers={drivers}
              />
              <AdminQualityCharts co2History={co2History} />
              <Alerts alerts={alerts} />
            </>
          ) : (
            <>
              {/* ===== USER DASHBOARD ===== */}
              <StatusCards data={machineData} />
              <Charts temperatureData={temperatureData} vibrationData={vibrationData} />
              <Alerts alerts={alerts} />
            </>
          )}
        </div>
      </div>

      {/* Detail modals */}
      {isAdmin && adminMode && showQualityModal && (
        <QualityDetailModal
          mode="quality"
          onClose={() => setShowQualityModal(false)}
          defectRate={defectRate}
          qualityStatus={qualityStatus}
          drivers={drivers}
          history={defectHistory}
          speedSeries={speedSeries}
          title="Quality Details"
        />
      )}

      {isAdmin && adminMode && showDefectsModal && (
        <QualityDetailModal
          mode="defects"
          onClose={() => setShowDefectsModal(false)}
          defectRate={defectRate}
          qualityStatus={qualityStatus}
          drivers={drivers}
          history={defectHistory}
          speedSeries={speedSeries}
          title="Defect Details"
        />
      )}

      {/* Maintenance Log Modal */}
      {isAdmin && showMaintLog && (
        <MaintenanceLogModal open={showMaintLog} onClose={() => setShowMaintLog(false)} />
      )}
    </div>
  );
}

export default App;
