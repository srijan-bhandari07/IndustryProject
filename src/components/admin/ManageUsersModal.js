// src/components/admin/ManageUsersModal.jsx
import React, { useMemo, useState } from "react";
import styles from "./ManageUsersModal.module.css";

/**
 * Props:
 * - users: Array<{ id, name, email, role, active, accessibleMachines: string[] }>
 * - lines: Array<{ name, machines: Array<{ id, name }> }>
 * - onClose: () => void
 * - onCreate: (payload) => void
 * - onUpdate: (id, patch) => void
 * - onDelete: (id) => void
 * - onToggleMachineAccess: (userId, machineId) => void
 */
export default function ManageUsersModal({
  users = [],
  lines = [],
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onToggleMachineAccess,
}) {
  const [tab, setTab] = useState("create"); // "create" | "manage"

  const allMachines = useMemo(
    () => lines.flatMap((l) => l.machines || []),
    [lines]
  );

  // ===== Create form state (now with password fields) =====
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "operator",  // operator | viewer | admin
    active: true,
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);

  // validation
  const passTooShort = (form.password || "").length < 6;
  const passMismatch = form.password !== form.confirm;
  const canSubmit =
    Boolean(form.name.trim() && form.email.trim() && form.role) &&
    !passTooShort &&
    !passMismatch &&
    form.password.length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      active: form.active,
      password: form.password, // <-- use entered password
    };
    onCreate?.(payload);

    // reset & switch to Manage
    setForm({
      name: "",
      email: "",
      role: "operator",
      active: true,
      password: "",
      confirm: "",
    });
    setTab("manage");
  };

  // Calculate slider position based on tab
  const sliderPosition = tab === "create" ? 0 : 52; // Adjusted for proper spacing

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="users-access-title"
      >
        {/* LEFT: Vertical tab rail */}
        <div className={styles.segment}>
          <span
            className={styles.slider}
            style={{ transform: `translateY(${sliderPosition}px)` }}
          />
          <button
            className={`${styles.segBtn} ${tab === "create" ? styles.active : ""}`}
            onClick={() => setTab("create")}
            type="button"
          >
            <i className="fas fa-user-plus" />
            Create Account
          </button>
          <button
            className={`${styles.segBtn} ${tab === "manage" ? styles.active : ""}`}
            onClick={() => setTab("manage")}
            type="button"
          >
            <i className="fas fa-users" />
            Manage Users
          </button>
        </div>

        {/* RIGHT: Content */}
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.title} id="users-access-title">
              <i className="fas fa-users-cog" />
              <span>Users &amp; Access</span>
            </div>
            <button
              className={styles.iconBtn}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {tab === "create" ? (
            <div className={styles.createWrap}>
              <form className={styles.heroForm} onSubmit={submit}>
                {/* Name / Email */}
                <label className={styles.heroLabel}>Name</label>
                <input
                  className={styles.pillInput}
                  placeholder="Staff"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <label className={styles.heroLabel}>Email</label>
                <input
                  className={styles.pillInput}
                  placeholder="staff@abc.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                {/* Type of account (select) */}
                <label className={styles.heroLabel}>Type of account</label>
                <div className={styles.selectWrap}>
                  <select
                    className={`${styles.pillInput} ${styles.pillSelect}`}
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <i className="fas fa-chevron-down" />
                </div>

                {/* Password */}
                <label className={styles.heroLabel}>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPass ? "text" : "password"}
                    className={styles.pillInput}
                    placeholder="Set a password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                  />
                  
                </div>

                {/* Confirm password */}
                <label className={styles.heroLabel}>Confirm password</label>
                <input
                  type={showPass ? "text" : "password"}
                  className={styles.pillInput}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  autoComplete="new-password"
                />

                {/* Validation helper */}
                {(form.password || form.confirm) && (
                  <div
                    className={`${styles.validationMessage} ${
                      passMismatch || passTooShort ? styles.invalid : styles.valid
                    }`}
                  >
                    {passMismatch
                      ? "Passwords do not match."
                      : passTooShort
                      ? "Password must be at least 6 characters."
                      : "Password looks good."}
                  </div>
                )}

                {/* Active toggle */}
                <div className={styles.heroSwitchRow}>
                  <span>Active</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <span />
                  </label>
                </div>

                <button
                  className={styles.pillButton}
                  type="submit"
                  disabled={!canSubmit}
                  title={!canSubmit ? "Fill required fields and set a valid password." : "Create"}
                >
                  <i className="fas fa-user-plus" />
                  Create New Account
                </button>
              </form>
            </div>
          ) : (
            /* =================== MANAGE USERS LIST =================== */
            <div className={styles.list}>
              {users.map((u) => (
                <div key={u.id} className={styles.userCard}>
                  <div className={styles.userHead}>
                    <div className={styles.avatar}>
                      {(u.name || "?")
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className={styles.userMeta}>
                      <div className={styles.userName}>{u.name}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                    </div>
                    <div className={styles.userActions}>
                      <div className={styles.switchRow}>
                        <span>Active</span>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={u.active !== false}
                            onChange={(e) => onUpdate?.(u.id, { active: e.target.checked })}
                          />
                          <span />
                        </label>
                      </div>
                      <button
                        className={styles.iconBtn}
                        onClick={() => onDelete?.(u.id)}
                        title="Delete user"
                        type="button"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.label}>Role</div>
                    <select
                      className={styles.input}
                      value={u.role}
                      onChange={(e) => onUpdate?.(u.id, { role: e.target.value })}
                    >
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.label}>Machine Access</div>
                    <div className={styles.chips}>
                      {allMachines.map((m) => {
                        const has = (u.accessibleMachines || []).includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`${styles.chip} ${has ? styles.chipOn : styles.chipOff}`}
                            onClick={() => onToggleMachineAccess?.(u.id, m.id)}
                            title={m.name}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {!users.length && (
                <div className={styles.empty}>
                  <i className="fas fa-user-friends" />
                  <p>No users found yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}