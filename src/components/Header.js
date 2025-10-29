// src/components/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/AdminStore';
import ManageUsersModal from './admin/ManageUsersModal';

const Header = ({ onToggleSidebar, onOpenMaintLog }) => {
  const navigate = useNavigate();

  const {
    adminMode,
    toggleAdminMode,          
    currentUser,
    users, addUser, updateUser, deleteUser,
    logout,
    productionLines,
    toggleMachineAccess,
  } = useAdminStore();

  const [showManageUsers, setShowManageUsers] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header>
        <button className="hamburger" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
          <i className="fas fa-bars" />
        </button>

        <div className="logo">
          <h1>PMS</h1>
        </div>

        <div className="user-info" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Admin toggle */}
          {isAdmin && (
            <button
              className="btn small"
              style={{ marginRight: 8 }}
              onClick={toggleAdminMode}
              aria-pressed={adminMode}
              title={adminMode ? 'Switch to user view' : 'Switch to admin view'}
            >
              {adminMode ? (
                <>
                  <i className="fas fa-eye" /> View as User
                </>
              ) : (
                <>
                  <i className="fas fa-user-shield" /> View as Admin
                </>
              )}
            </button>
          )}

          {/* Maintenance Log (admin-only, only in admin mode) */}
          {isAdmin && adminMode && (
            <button
              className="btn small"
              onClick={() => onOpenMaintLog?.()}
              title="Open Maintenance Log"
              aria-label="Open Maintenance Log"
            >
              <i className="fas fa-clipboard-list" /> Maintenance Log
            </button>
          )}

          {/* Manage Users (admin-only, only in admin mode) */}
          {isAdmin && adminMode && (
            <button className="btn small" onClick={() => setShowManageUsers(true)}>
              <i className="fas fa-users-cog" /> Manage Users
            </button>
          )}

          <img src="https://xsgames.co/randomusers/avatar.php?g=male" alt="User" />
          <div>{currentUser?.name || 'Guest'}</div>

          {/* Logout */}
          {currentUser && (
            <button className="btn small" onClick={handleLogout} style={{ marginLeft: 6 }}>
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          )}
        </div>
      </header>

      {/* ===== Manage Users Modal ===== */}
      {isAdmin && adminMode && showManageUsers && (
        <ManageUsersModal
          users={users}
          lines={productionLines}
          onClose={() => setShowManageUsers(false)}
          onCreate={(payload) => addUser(payload)}
          onUpdate={(id, patch) => updateUser(id, patch)}
          onDelete={(id) => deleteUser(id)}
          onToggleMachineAccess={(userId, machineId) => toggleMachineAccess(userId, machineId)}
        />
      )}
    </>
  );
};

export default Header;
