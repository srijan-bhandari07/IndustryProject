import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';

import { AdminProvider, useAdminStore } from './context/AdminStore';

function AdminPage() {
  const { setAdminMode } = useAdminStore();
  React.useEffect(() => { setAdminMode(true); }, [setAdminMode]); // force admin tools on
  return <App />; // same dashboard UI
}

function RequireAdmin({ children }) {
  const { currentUser } = useAdminStore();
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function Main() {
  return (
    <AdminProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route path="/login" element={<Login />} />
      
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminProvider>
  );
}
