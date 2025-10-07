// App.js
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusCards from './components/StatusCards';
import Charts from './components/Charts';
import Alerts from './components/Alerts';
import { useAdminStore } from './context/AdminStore';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMachine, setActiveMachine] = useState(0);
  const [activeProductionLine, setActiveProductionLine] = useState(0);

  const { productionLines, currentUser, adminMode } = useAdminStore();

  // Current line
  const rawLine = productionLines[activeProductionLine] || { machines: [] };

  // Access list for the logged-in user
  const accessList = currentUser?.accessibleMachines || [];

  // Machines visible to this user (admins see all)
  const visibleMachines = adminMode
    ? rawLine.machines
    : rawLine.machines.filter(m => accessList.includes(m.id));

  // Keep active machine in range when visibility changes
  useEffect(() => {
    if (!visibleMachines.length) {
      setActiveMachine(0);
      return;
    }
    if (activeMachine > visibleMachines.length - 1) {
      setActiveMachine(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductionLine, visibleMachines.length]);

  const currentMachine = visibleMachines[activeMachine] || null;

  const machineName = currentMachine?.name || 'No accessible machine';
  const machineStatus = currentMachine?.status || 'normal';

  const statusLabel =
    machineStatus === 'non-operational'
      ? 'Non-operational'
      : machineStatus === 'warning'
      ? 'Warning'
      : 'Operational';

  // Live demo telemetry
  const [machineData, setMachineData] = useState({
    temperature: 72.4,
    vibration: 4.2,
    pressure: 3.5,
    voltage: 415,
  });

  const [alerts, setAlerts] = useState([
    { id: 1, message: 'High vibration detected on Machine #1. Please inspect.', severity: 'warning', timestamp: '2025-09-10 14:32' },
    { id: 2, message: 'Voltage fluctuation detected at 14:32. System stabilized.', severity: 'info', timestamp: '2025-09-10 14:30' },
    { id: 3, message: 'Preventive maintenance scheduled for Machine #2 in 3 days.', severity: 'info', timestamp: '2025-09-10 13:45' },
  ]);

  const [temperatureData, setTemperatureData] = useState([71.2, 72.5, 73.1, 72.8, 72.4, 72.9, 73.5]);
  const [vibrationData, setVibrationData] = useState([3.2, 4.2, 2.8]);

  // Keep refs so interval reads the latest values
  const machineNameRef = useRef(machineName);
  useEffect(() => { machineNameRef.current = machineName; }, [machineName]);

  // Demo telemetry tick
  useEffect(() => {
    const interval = setInterval(() => {
      setMachineData(prev => {
        const nextTemp = parseFloat((prev.temperature + (Math.random() * 0.6 - 0.3)).toFixed(1));
        setTemperatureData(t => [...t.slice(1), nextTemp]);

        if (Math.random() > 0.7) {
          const vib = parseFloat((prev.vibration + (Math.random() * 0.6 - 0.3)).toFixed(1));
          setVibrationData(v => [v[0], vib, v[2]]);

          if (vib > 4.5) {
            setAlerts(a => [{
              id: a.length ? Math.max(...a.map(x => x.id)) + 1 : 1,
              message: `High vibration detected on ${machineNameRef.current}. Please inspect.`,
              severity: 'warning',
              timestamp: new Date().toLocaleTimeString(),
            }, ...a]);
          }
          return { ...prev, temperature: nextTemp, vibration: vib };
        }

        return { ...prev, temperature: nextTemp };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hasMachine = !!currentMachine;

  return (
    <div className="App">
      <Header onToggleSidebar={() => setIsSidebarOpen(s => !s)} />

      {/* Mobile overlay for drawer */}
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

          {/* If user has no access to any machine on this line, show a friendly message */}
          {!hasMachine ? (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: '1.05rem', marginBottom: 6 }}>
                You don’t have access to any machines in this production line.
              </div>
              <div style={{ opacity: 0.9 }}>
                Ask an admin to grant access in <em>Manage Users → Machine access</em>.
              </div>
            </div>
          ) : (
            <>
              <StatusCards data={machineData} />
              <Charts temperatureData={temperatureData} vibrationData={vibrationData} />
              <Alerts alerts={alerts} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
