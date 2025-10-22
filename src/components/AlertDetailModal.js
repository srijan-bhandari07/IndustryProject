import React from "react";
import { X } from "lucide-react";
import "./AlertDetailModal.css";

const AlertDetailModal = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="machine-name">{alert.machineName || "Machine B"}</h2>

        <div className="alert-section">
          <h3>Problem</h3>
          <p>{alert.problem || alert.message}</p>
        </div>

        <div className="alert-section">
          <h3>Solution</h3>
          <p>
            {alert.solution ||
              "A technician should inspect the affected area and monitor performance over the next 12 hours."}
          </p>
        </div>

        <div className="alert-section">
          <h3>Contact</h3>
          <p>{alert.contact || "John Smith (Maintenance) — +61 400 000 000"}</p>
        </div>

        <div className="alert-footer">
          <span>{alert.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
