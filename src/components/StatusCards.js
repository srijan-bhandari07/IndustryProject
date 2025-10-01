// components/StatusCards.js
import React from 'react';

const StatusCards = ({ data }) => {
  const getStatus = (type, value) => {
    if (type === 'vibration') {
      return value > 4.0 ? 'warning' : 'normal';
    } else if (type === 'temperature') {
      return value > 75.0 ? 'warning' : 'normal';
    } else if (type === 'pressure') {
      return value > 4.0 ? 'warning' : 'normal';
    } else if (type === 'voltage') {
      return value < 400 || value > 430 ? 'warning' : 'normal';
    }
    return 'normal';
  };

  const cards = [
    { title: 'Temperature', value: `${data.temperature}°C`, status: getStatus('temperature', data.temperature) },
    { title: 'Vibration', value: `${data.vibration}mm/s`, status: getStatus('vibration', data.vibration) },
    { title: 'Pressure', value: `${data.pressure} bar`, status: getStatus('pressure', data.pressure) },
    { title: 'Voltage', value: `${data.voltage}V`, status: getStatus('voltage', data.voltage) }
  ];

  return (
    <div className="status-cards">
      {cards.map((card, index) => (
        <div className="card" key={index}>
          <div className="card-header">
            <div className="card-title">{card.title}</div>
            <i className={`fas ${card.icon}`}></i>
          </div>
          <div className="value">{card.value}</div>
          <div className={`status ${card.status}`}>
            {card.status === 'normal' ? 'Normal' : 'Warning'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;