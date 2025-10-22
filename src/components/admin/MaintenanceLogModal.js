import React, { useMemo, useState } from "react";
import { useAdminStore } from "../../context/AdminStore";
import styles from "./ManageUsersModal.module.css"; 

export default function MaintenanceLogModal({ open = false, onClose }) {
  const {
    adminMode,
    productionLines,
    maintenanceLogs,
    addMaintenanceLog,
    updateMaintenanceLog,
    deleteMaintenanceLog,
  } = useAdminStore();

  // Move ALL hooks to the top, before any conditional logic
  const allMachines = useMemo(
    () =>
      productionLines.flatMap((l) =>
        (l.machines || []).map((m) => ({ ...m, lineId: l.id, lineName: l.name }))
      ),
    [productionLines]
  );

  const [filterMachine, setFilterMachine] = useState("all");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    lineId: allMachines[0]?.lineId || productionLines[0]?.id || 1,
    machineId: allMachines[0]?.id || 1,
    title: "",
    technician: "",
    status: "planned",
    notes: "",
  });

  const filtered = useMemo(() => {
    if (filterMachine === "all") return maintenanceLogs;
    const mid = Number(filterMachine);
    return maintenanceLogs.filter((l) => l.machineId === mid);
  }, [maintenanceLogs, filterMachine]);

  if (!adminMode || !open) return null;

  const machineName = (machineId) =>
    allMachines.find((m) => m.id === machineId)?.name || `#${machineId}`;

  const lineName = (lineId) =>
    productionLines.find((l) => l.id === lineId)?.name || `Line ${lineId}`;

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addMaintenanceLog(form);
    setForm((f) => ({ ...f, title: "", technician: "", notes: "" }));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>
            <i className="fas fa-tools" />
            <span>Maintenance Log</span>
          </div>
          <button className={styles.iconBtn} onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <div className={styles.split}>
          {/* Left: Add entry */}
          <form className={styles.form} onSubmit={submit}>
            <label className={styles.heroLabel}>Date</label>
            <input
              type="date"
              className={styles.pillInput}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <label className={styles.heroLabel}>Machine</label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.pillInput} ${styles.pillSelect}`}
                value={form.machineId}
                onChange={(e) => {
                  const mid = Number(e.target.value);
                  const m = allMachines.find((x) => x.id === mid);
                  setForm({ ...form, machineId: mid, lineId: m?.lineId || form.lineId });
                }}
              >
                {allMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.lineName}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down" />
            </div>

            <label className={styles.heroLabel}>Title</label>
            <input
              className={styles.pillInput}
              placeholder="Bearing lubrication / Sensor calibration…"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label className={styles.heroLabel}>Technician</label>
            <input
              className={styles.pillInput}
              placeholder="e.g., Alex"
              value={form.technician}
              onChange={(e) => setForm({ ...form, technician: e.target.value })}
            />

            <label className={styles.heroLabel}>Status</label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.pillInput} ${styles.pillSelect}`}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <i className="fas fa-chevron-down" />
            </div>

            <label className={styles.heroLabel}>Notes</label>
            <textarea
              className={styles.pillInput}
              rows={4}
              placeholder="Details, parts replaced, measurements…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button className={styles.pillButton} type="submit">
              <i className="fas fa-plus-circle" />
              Add Entry
            </button>
          </form>

          {/* Right: List */}
          <div className={styles.list}>
            <div className={styles.fieldRow} style={{ marginBottom: 8 }}>
              <div className={styles.label}>Filter</div>
              <div className={styles.selectWrap} style={{ flex: 1 }}>
                <select
                  className={`${styles.input} ${styles.pillSelect}`}
                  value={filterMachine}
                  onChange={(e) => setFilterMachine(e.target.value)}
                >
                  <option value="all">All machines</option>
                  {allMachines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down" />
              </div>
            </div>

            {filtered.map((log) => (
              <div key={log.id} className={styles.userCard}>
                <div className={styles.userHead}>
                  <div className={styles.avatar}><i className="fas fa-wrench" /></div>
                  <div className={styles.userMeta}>
                    <div className={styles.userName}>{log.title}</div>
                    <div className={styles.userEmail}>
                      {log.date} • {machineName(log.machineId)} • {lineName(log.lineId)}
                    </div>
                  </div>
                  <div className={styles.userActions}>
                    <div className={styles.switchRow} style={{ marginRight: 8 }}>
                      <span style={{ textTransform: "capitalize" }}>{log.status}</span>
                    </div>
                    <button
                      className={styles.iconBtn}
                      title="Mark completed"
                      onClick={() => updateMaintenanceLog(log.id, { status: "completed" })}
                    >
                      <i className="fas fa-check-circle" />
                    </button>
                    <button
                      className={styles.iconBtn}
                      title="Delete"
                      onClick={() => deleteMaintenanceLog(log.id)}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>

                {!!log.technician && (
                  <div className={styles.fieldRow}>
                    <div className={styles.label}>Technician</div>
                    <div className={styles.input} style={{ opacity: .9 }}>{log.technician}</div>
                  </div>
                )}
                {!!log.notes && (
                  <div className={styles.fieldRow}>
                    <div className={styles.label}>Notes</div>
                    <div className={styles.input} style={{ opacity: .9, whiteSpace: "pre-wrap" }}>
                      {log.notes}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!filtered.length && (
              <div className={styles.empty}>
                <i className="fas fa-clipboard-list" />
                <p>No log entries yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}