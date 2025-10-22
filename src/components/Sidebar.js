// src/components/Sidebar.jsx
import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../context/AdminStore';

const Sidebar = ({
  activeProductionLine,
  activeMachine,
  setActiveProductionLine,
  setActiveMachine,
  isOpen = false,
  onClose = () => {},
}) => {
  const {
    productionLines,
    adminMode,
    addMachine,
    deleteMachine,
    toggleMachineStatus,
    currentUser,
    maintenanceLogs,               
  } = useAdminStore();

  const [newNames, setNewNames] = useState({}); // { [lineIndex]: 'New machine name' }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'warning': return 'fa-exclamation-circle';
      case 'non-operational': return 'fa-power-off';
      case 'normal':
      default: return 'fa-check-circle';
    }
  };

  const getStatusClass = (status) => {
    if (status === 'warning') return 'warning';
    if (status === 'non-operational') return 'down';
    return 'normal';
  };

  // Helper to resolve machine name
  const machineNameById = useMemo(() => {
    const map = new Map();
    productionLines.forEach(l => (l.machines || []).forEach(m => map.set(m.id, m.name)));
    return map;
  }, [productionLines]);

  // Sort logs by date (desc) and show top 6
  const visibleLogs = useMemo(() => {
    const clone = Array.isArray(maintenanceLogs) ? [...maintenanceLogs] : [];
    clone.sort((a, b) => new Date(b.date) - new Date(a.date));
    return clone.slice(0, 6);
  }, [maintenanceLogs]);

  const statusBadgeClass = (s) =>
    s === 'completed' ? 'badge good'
    : s === 'in-progress' ? 'badge warn'
    : 'badge ghost';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="card-header sidebar-header">
        <div className="card-title">Machines</div>
        <button
          type="button"
          className="sidebar-close"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <i className="fas fa-times" />
        </button>
      </div>

      {/* ---- LOOP THROUGH PRODUCTION LINES ---- */}
      {productionLines.map((line, lineIndex) => (
        <div key={line.id} className="production-line-section">
          <div
            className={`production-line-header ${lineIndex === activeProductionLine ? 'active' : ''}`}
            onClick={() => setActiveProductionLine(lineIndex)}
          >
            <i className="fas fa-industry" />
            <span className="line-name">{line.name}</span>
            <i className={`fas ${lineIndex === activeProductionLine ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
          </div>

          {lineIndex === activeProductionLine && (
            <>
              {/* ---- ADMIN: ADD MACHINE ---- */}
              {adminMode && (
                <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                  <input
                    type="text"
                    placeholder="New machine name"
                    value={newNames[lineIndex] || ''}
                    onChange={(e) =>
                      setNewNames({ ...newNames, [lineIndex]: e.target.value })
                    }
                    style={{
                      flex: 1,
                      background: '#1f2a36',
                      color: 'var(--text)',
                      border: '1px solid var(--secondary)',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  />
                  <button
                    className="btn small"
                    onClick={() => {
                      const name = (newNames[lineIndex] || '').trim();
                      if (!name) return;
                      addMachine(lineIndex, { name, status: 'normal' });
                      setNewNames({ ...newNames, [lineIndex]: '' });
                    }}
                  >
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              )}

              {/* ---- MACHINE LIST ---- */}
              <ul className="machine-list">
                {line.machines
                  .filter((machine) => {
                    if (adminMode || currentUser?.role === 'admin') return true;
                    const allowed = currentUser?.accessibleMachines || [];
                    return allowed.includes(machine.id);
                  })
                  .map((machine, machineIndex) => {
                    const isActive = machineIndex === activeMachine;
                    const statusClass = getStatusClass(machine.status);
                    const nextLabel =
                      machine.status === 'non-operational'
                        ? 'Mark Operational'
                        : 'Mark Non-Operational';

                    return (
                      <li
                        key={machine.id}
                        className={`${isActive ? 'active' : ''} ${statusClass}`}
                        onClick={() => {
                          setActiveMachine(machineIndex);
                          onClose();
                        }}
                      >
                        <i className={`fas ${getStatusIcon(machine.status)}`} />
                        <span className="machine-name">{machine.name}</span>

                        {adminMode && (
                          <>
                            <button
                              className="btn small"
                              style={{ marginLeft: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMachineStatus(lineIndex, machine.id);
                              }}
                              aria-label={`${nextLabel} for ${machine.name}`}
                              title={nextLabel}
                            >
                              <i className="fas fa-power-off" />
                            </button>

                            <button
                              className="btn small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMachine(lineIndex, machine.id);
                              }}
                              aria-label={`Delete ${machine.name}`}
                              title="Delete machine"
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </>
                        )}

                        {isActive && <i className="fas fa-chevron-right active-arrow" />}
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>
      ))}

      {/* ===== Maintenance Log (Admin only) ===== */}
      {adminMode && (
        <div className="maintenance-section">
          <h3>Maintenance Log</h3>

          {visibleLogs.length === 0 && (
            <div className="maintenance-empty">No maintenance entries yet.</div>
          )}

          {visibleLogs.map((log) => (
            <div key={log.id} className="maintenance-item">
              <div className="maintenance-date">
                {new Date(log.date).toLocaleDateString()}
              </div>
              <div className="maintenance-desc">
                <div className="maintenance-title">{log.title || '—'}</div>
                <div className="maintenance-meta">
                  {machineNameById.get(log.machineId) || `Machine #${log.machineId}`}
                  {log.technician ? ` • Tech: ${log.technician}` : ''}
                </div>
              </div>
              <span className={statusBadgeClass(log.status || 'planned')}>
                {log.status || 'planned'}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
