// components/Alerts.js
import React from 'react';

const Alerts = ({ alerts }) => {
  const getIcon = (severity) => {
    switch(severity) {
      case 'warning': return 'fa-exclamation-circle';
      case 'info': return 'fa-info-circle';
      case 'critical': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  };

  return (
    <div className="alerts">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Alerts</div>
        </div>
        <ul className="alert-list">
          {alerts.map(alert => (
            <li key={alert.id} className={alert.severity}>
              <i className={`fas ${getIcon(alert.severity)}`}></i>
              <div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-timestamp">{alert.timestamp}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Alerts;