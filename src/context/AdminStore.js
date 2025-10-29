// src/context/AdminStore.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AdminCtx = createContext(null);
const load = (k, f) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- Demo data ---------- */
const DEFAULT_LINES = [
  {
    id: 1,
    name: "Filling Machine A",
    machines: [
      { id: 1, name: "Filling Machine #A1", status: "warning" },
      { id: 2, name: "Capping Machine #A2", status: "normal" },
      { id: 3, name: "Labeling Machine #A3", status: "normal" },
      { id: 4, name: "Packaging Machine #A4", status: "normal" },
    ],
  },
  {
    id: 2,
    name: "Filling Machine B",
    machines: [
      { id: 5, name: "Filling Machine #B1", status: "normal" },
      { id: 6, name: "Capping Machine #B2", status: "normal" },
      { id: 7, name: "Labeling Machine #B3", status: "warning" },
      { id: 8, name: "Packaging Machine #B4", status: "normal" },
    ],
  },
];

/* ---------- Seeded Admin ---------- */
const SEEDED_ADMIN = {
  id: 1,
  name: "Admin",
  email: "admin@gmail.com",
  password: "admin",
  role: "admin",
  active: true,
  accessibleMachines: [],
};

/* ---------- Seeded Maintenance Logs (optional demo data) ---------- */
const DEFAULT_MAINT_LOGS = [
  {
    id: 1001,
    date: "2025-09-15",
    lineId: 1,
    machineId: 1,
    title: "Routine maintenance",
    technician: "ABC",
    status: "completed", // planned | in-progress | completed
    notes: "Lubricated bearings. Checked belts."
  },
  {
    id: 1002,
    date: "2025-09-18",
    lineId: 2,
    machineId: 7,
    title: "Calibration",
    technician: "Srijan",
    status: "planned",
    notes: "Schedule vibration sensor calibration."
  }
];

/* ---------- Provider ---------- */
export function AdminProvider({ children }) {
  // Restore current user first so we can derive a safe initial adminMode
  const [currentUser, setCurrentUser] = useState(load("auth.currentUser", null));

  // Safe initial adminMode: only true if a restored admin was logged in previously
  const [adminMode, setAdminMode] = useState(() => {
    const restored = load("admin.mode", false);
    const u = load("auth.currentUser", null);
    return u?.role === "admin" ? !!restored : false;
  });

  const [users, setUsers] = useState(load("admin.users", [SEEDED_ADMIN]));
  const [productionLines, setProductionLines] = useState(load("admin.lines", DEFAULT_LINES));

  // NEW: persisted maintenance logs
  const [maintenanceLogs, setMaintenanceLogs] = useState(
    load("admin.maintLogs", DEFAULT_MAINT_LOGS)
  );

  /* Ensure at least one admin exists */
  useEffect(() => {
    setUsers((prev) => {
      const hasAdmin = prev.some((u) => u.role === "admin" && u.active !== false);
      if (hasAdmin) return prev;
      const exists = prev.some((u) => u.email.toLowerCase() === SEEDED_ADMIN.email.toLowerCase());
      return exists ? prev : [...prev, SEEDED_ADMIN];
    });
  }, []);

  /* Persist state */
  useEffect(() => save("admin.mode", adminMode), [adminMode]);
  useEffect(() => save("admin.users", users), [users]);
  useEffect(() => save("admin.lines", productionLines), [productionLines]);
  useEffect(() => save("auth.currentUser", currentUser), [currentUser]);
  useEffect(() => save("admin.maintLogs", maintenanceLogs), [maintenanceLogs]); // NEW

  /* ---------- Auth ---------- */
  const login = (email, password) => {
    const e = (email || "").trim().toLowerCase();
    const p = (password || "").trim();
    const user = users.find((u) => u.email.toLowerCase() === e && u.password === p);
    if (!user) return { ok: false, error: "Invalid email or password." };
    if (user.active === false) return { ok: false, error: "Account is deactivated." };

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessibleMachines: user.accessibleMachines || [],
    };
    setCurrentUser(authUser);
    setAdminMode(user.role === "admin"); // admin logs in -> admin view on
    return { ok: true, user: authUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setAdminMode(false);
    localStorage.removeItem("auth.currentUser");
  };

  /* ---------- Users ---------- */
  const addUser = (u) => {
    const id = Date.now();
    const email = (u.email || "").trim().toLowerCase();
    const user = {
      id,
      active: true,
      role: u.role || "operator",
      accessibleMachines: [],
      ...u,
      email,
    };
    setUsers((prev) => [...prev, user]);
    return user;
  };

  // Keep currentUser in sync when the same user is edited
  const updateUser = (id, patch) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...patch } : u));
      if (currentUser?.id === id) setCurrentUser((cu) => ({ ...cu, ...patch }));
      return next;
    });
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      // if you delete the logged-in user, log them out
      logout();
    }
  };

  const toggleMachineAccess = (userId, machineId) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id !== userId) return u;
        const list = Array.isArray(u.accessibleMachines) ? [...u.accessibleMachines] : [];
        const updated = list.includes(machineId) ? list.filter((id) => id !== machineId) : [...list, machineId];
        return { ...u, accessibleMachines: updated };
      });
      if (currentUser?.id === userId) {
        const updatedUser = next.find((u) => u.id === userId);
        setCurrentUser((cu) => ({ ...cu, accessibleMachines: updatedUser?.accessibleMachines || [] }));
      }
      return next;
    });
  };

  /* ---------- Machines ---------- */
  const addMachine = (lineIndex, machine) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({ ...l, machines: l.machines.map((m) => ({ ...m })) }));
      const maxId = Math.max(0, ...copy.flatMap((l) => l.machines.map((m) => m.id)));
      copy[lineIndex].machines.push({ id: maxId + 1, status: machine.status || "normal", ...machine });
      // ensure arrays exist
      setUsers((prevUsers) =>
        prevUsers.map((u) => ({ ...u, accessibleMachines: Array.isArray(u.accessibleMachines) ? u.accessibleMachines : [] }))
      );
      return copy;
    });
  };

  const deleteMachine = (lineIndex, machineId) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({ ...l, machines: l.machines.map((m) => ({ ...m })) }));
      copy[lineIndex].machines = copy[lineIndex].machines.filter((m) => m.id !== machineId);
      return copy;
    });
    setUsers((prev) => {
      const next = prev.map((u) => ({ ...u, accessibleMachines: (u.accessibleMachines || []).filter((id) => id !== machineId) }));
      if (currentUser) {
        setCurrentUser((cu) => ({ ...cu, accessibleMachines: (cu.accessibleMachines || []).filter((id) => id !== machineId) }));
      }
      return next;
    });
  };

  const setMachineStatus = (lineIndex, machineId, status) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({ ...l, machines: l.machines.map((m) => ({ ...m })) }));
      copy[lineIndex].machines = copy[lineIndex].machines.map((m) => (m.id === machineId ? { ...m, status } : m));
      return copy;
    });
  };

  const toggleMachineStatus = (lineIndex, machineId) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({ ...l, machines: l.machines.map((m) => ({ ...m })) }));
      copy[lineIndex].machines = copy[lineIndex].machines.map((m) => {
        if (m.id !== machineId) return m;
        const next = m.status === "non-operational" ? "normal" : m.status === "warning" ? "non-operational" : "non-operational";
        return { ...m, status: next };
      });
      return copy;
    });
  };

  /* ---------- Maintenance Logs (CRUD) ---------- */
  const addMaintenanceLog = (log) => {
    const id = Date.now();
    const payload = { id, status: "planned", ...log };
    setMaintenanceLogs((prev) => [payload, ...prev]);
    return payload;
  };

  const updateMaintenanceLog = (id, patch) => {
    setMaintenanceLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const deleteMaintenanceLog = (id) => {
    setMaintenanceLogs((prev) => prev.filter((l) => l.id !== id));
  };

  /* ---------- Keep adminMode in sync with current user ---------- */
  useEffect(() => {
    if (!currentUser) {
      setAdminMode(false);
      return;
    }
    if (currentUser.role !== "admin" && adminMode) setAdminMode(false);
  }, [currentUser, adminMode]);

  /* ---------- Optional helper for the header toggle ---------- */
  const toggleAdminMode = () => {
    if (currentUser?.role !== "admin") return setAdminMode(false);
    setAdminMode((v) => !v);
  };

  /* ---------- Expose store ---------- */
  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      login,
      logout,
      adminMode,
      setAdminMode,
      toggleAdminMode,

      users,
      addUser,
      updateUser,
      deleteUser,
      toggleMachineAccess,

      productionLines,
      setProductionLines,
      addMachine,
      deleteMachine,
      setMachineStatus,
      toggleMachineStatus,

      // NEW: maintenance log API
      maintenanceLogs,
      addMaintenanceLog,
      updateMaintenanceLog,
      deleteMaintenanceLog,
    }),
    [
      currentUser,
      adminMode,
      users,
      productionLines,
      maintenanceLogs, 
    ]
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export const useAdminStore = () => useContext(AdminCtx);
