// src/components/Header.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/AdminStore';

const Header = ({ onToggleSidebar }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = pathname === '/admin';

  const {
    adminMode, setAdminMode,
    currentUser,
    users, addUser, updateUser, deleteUser,
    logout,
  } = useAdminStore();
  

  const [showUserMgr, setShowUserMgr] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'operator' });

  const createUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    addUser(newUser);
    setNewUser({ name: '', email: '', password: '', role: 'operator' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header>
      <button className="hamburger" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
        <i className="fas fa-bars" />
      </button>

      <div className="logo">
        <i className="fas fa-industry" />
        <h1>AI Predictive Maintenance</h1>
      </div>

      <div className="user-info" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        
        {/* Admin toggle (not shown if user is not admin) */}
        {isAdmin && (
          <button
            className="btn small"
            style={{ marginRight: 8 }}
            onClick={() => setAdminMode(!adminMode)}
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

        {/* Manage Users (only if admin + adminMode) */}
        {isAdmin && adminMode && (
          <button className="btn small" onClick={() => setShowUserMgr(s => !s)}>
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

        {/* User manager popover */}
        {isAdmin && adminMode && showUserMgr && (
          <div className="admin-popover" style={{ width: 320 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Users & Roles</div>

            <div className="row" style={{ display:'grid', gap:6, marginBottom: 10 }}>
              <input placeholder="Full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}/>
              <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}/>
              <input placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}/>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn primary small" onClick={createUser}>
                <i className="fas fa-user-plus" /> Create
              </button>
            </div>

            <div style={{ maxHeight: 220, overflow: 'auto', display:'grid', gap:8 }}>
              {users.map(u => (
                <div key={u.id} style={{ display:'grid', gap:6, padding:8, background:'rgba(52,152,219,0.08)', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <strong>{u.name}</strong>
                    <button className="btn small" onClick={() => deleteUser(u.id)}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                  <div style={{ fontSize:'.9rem', opacity:.85 }}>{u.email}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <label style={{ fontSize:'.85rem' }}>Role</label>
                    <select
                      value={u.role}
                      onChange={e => updateUser(u.id, { role: e.target.value })}
                      style={{ flex:1 }}
                    >
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.85rem' }}>
                      <input
                        type="checkbox"
                        checked={u.active !== false}
                        onChange={e => updateUser(u.id, { active: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="row gap" style={{ marginTop: 8 }}>
              <button className="btn small" onClick={() => setShowUserMgr(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
