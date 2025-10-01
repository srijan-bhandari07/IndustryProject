// src/context/AdminStore.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AdminCtx = createContext(null);
const load = (k, f) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- Demo data ---------- */
const DEFAULT_LINES = [
  {
    id: 1,
    name: "Production Line A",
    machines: [
      { id: 1, name: "Filling Machine #A1", status: "warning" },
      { id: 2, name: "Capping Machine #A2", status: "normal" },
      { id: 3, name: "Labeling Machine #A3", status: "normal" },
      { id: 4, name: "Packaging Machine #A4", status: "normal" },
    ],
  },
  {
    id: 2,
    name: "Production Line B",
    machines: [
      { id: 5, name: "Filling Machine #B1", status: "normal" },
      { id: 6, name: "Capping Machine #B2", status: "normal" },
      { id: 7, name: "Labeling Machine #B3", status: "warning" },
      { id: 8, name: "Packaging Machine #B4", status: "normal" },
    ],
  },
];

/* Seed admin */
const SEEDED_ADMIN = {
  id: 1,
  name: "Admin",
  email: "admin@gmail.com",
  password: "admin",
  role: "admin",
  active: true,
};

/* ---------- Provider ---------- */
export function AdminProvider({ children }) {
  const [adminMode, setAdminMode] = useState(load("admin.mode", false));
  const [users, setUsers] = useState(load("admin.users", [SEEDED_ADMIN]));
  const [productionLines, setProductionLines] = useState(
    load("admin.lines", DEFAULT_LINES)
  );
  const [currentUser, setCurrentUser] = useState(
    load("auth.currentUser", null)
  ); // {id,name,email,role}

  /* Ensure at least one admin exists */
  useEffect(() => {
    setUsers((prev) => {
      const hasAdmin = prev.some((u) => u.role === "admin" && u.active !== false);
      if (hasAdmin) return prev;

      const exists = prev.some(
        (u) => u.email.toLowerCase() === SEEDED_ADMIN.email.toLowerCase()
      );
      return exists ? prev : [...prev, SEEDED_ADMIN];
    });
  }, []);

  /* Persist */
  useEffect(() => save("admin.mode", adminMode), [adminMode]);
  useEffect(() => save("admin.users", users), [users]);
  useEffect(() => save("admin.lines", productionLines), [productionLines]);
  useEffect(() => save("auth.currentUser", currentUser), [currentUser]);

  /* ---------- Auth ---------- */
  const login = (email, password) => {
    const e = (email || "").trim().toLowerCase();
    const p = (password || "").trim();
    const user = users.find(
      (u) => u.email.toLowerCase() === e && u.password === p
    );
    if (!user) return { ok: false, error: "Invalid email or password." };
    if (user.active === false)
      return { ok: false, error: "Account is deactivated." };

    const authUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setCurrentUser(authUser);
    setAdminMode(user.role === "admin");
    return { ok: true, user: authUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setAdminMode(false);
    localStorage.removeItem("auth.currentUser"); // clear session
  };

  /* ---------- Users ---------- */
  const addUser = (u) => {
    const id = Date.now();
    const email = (u.email || "").trim().toLowerCase();
    const user = { id, active: true, role: u.role || "operator", ...u, email };
    setUsers((prev) => [...prev, user]);
    return user;
  };

  const updateUser = (id, patch) =>
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );

  const deleteUser = (id) =>
    setUsers((prev) => prev.filter((u) => u.id !== id));

  /* ---------- Machines ---------- */
  const addMachine = (lineIndex, machine) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({
        ...l,
        machines: l.machines.map((m) => ({ ...m })),
      }));
      const maxId = Math.max(0, ...copy.flatMap((l) => l.machines.map((m) => m.id)));
      copy[lineIndex].machines.push({
        id: maxId + 1,
        status: machine.status || "normal",
        ...machine,
      });
      return copy;
    });
  };

  const deleteMachine = (lineIndex, machineId) => {
    setProductionLines((prev) => {
      const copy = prev.map((l) => ({
        ...l,
        machines: l.machines.map((m) => ({ ...m })),
      }));
      copy[lineIndex].machines = copy[lineIndex].machines.filter(
        (m) => m.id !== machineId
      );
      return copy;
    });
  };
 // Set an explicit status for a machine
const setMachineStatus = (lineIndex, machineId, status) => {
  setProductionLines(prev => {
    const copy = prev.map(l => ({
      ...l,
      machines: l.machines.map(m => ({ ...m }))
    }));
    copy[lineIndex].machines = copy[lineIndex].machines.map(m =>
      m.id === machineId ? { ...m, status } : m
    );
    return copy;
  });
};

// Toggle between normal <-> non-operational (leave 'warning' as-is unless toggled)
const toggleMachineStatus = (lineIndex, machineId) => {
  setProductionLines(prev => {
    const copy = prev.map(l => ({
      ...l,
      machines: l.machines.map(m => ({ ...m }))
    }));

    copy[lineIndex].machines = copy[lineIndex].machines.map(m => {
      if (m.id !== machineId) return m;
      const next =
        m.status === 'non-operational' ? 'normal'
        : m.status === 'warning'    ? 'non-operational' // optional: warning -> down
        : 'non-operational';
      return { ...m, status: next };
    });

    return copy;
  });
};


  /* Keep adminMode in sync with role — but let real admins toggle freely */
  useEffect(() => {
    if (!currentUser) {
      setAdminMode(false); // logged out → no admin mode
    } else if (currentUser.role !== "admin" && adminMode) {
      setAdminMode(false); // non-admin users cannot force adminMode
    }
    // ✅ If currentUser.role === "admin", allow toggle to control it
  }, [currentUser, adminMode]);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      login,
      logout,
      adminMode,
      setAdminMode,
      users,
      addUser,
      updateUser,
      deleteUser,
      productionLines,
      setProductionLines,
      addMachine,
      deleteMachine,
      setMachineStatus,
      toggleMachineStatus,
    }),
    [currentUser, adminMode, users, productionLines]
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export const useAdminStore = () => useContext(AdminCtx);
