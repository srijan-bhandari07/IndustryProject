// components/StatusCards.js
import React from 'react';
import { getSeverity, getColorClass, getFeatureMeta } from '../utils/alertEvaluator';

export default function StatusCards({ data }) {
  // Define cards with correct feature keys matching alertEvaluator.js
  const cards = [
    { title: 'Temperature', feature: 'productTemp', value: data.temperature },
    { title: 'Vibration', feature: 'vibration', value: data.vibration },
    { title: 'Pressure', feature: 'tankPressure', value: data.pressure },
    
  ];

  return (
    <div className="status-cards">
      {cards.map((card, i) => {
        const colorClass = getColorClass(card.feature, card.value);
        const severity = getSeverity(card.feature, card.value);
        const meta = getFeatureMeta(card.feature);
        const formattedValue =
          card.value != null ? `${card.value.toFixed(2)} ${meta.unit || ''}` : '--';

        return (
          <div key={i} className={`card ${colorClass}`}>
            <div className="card-header">
              <div className="card-title">{card.title}</div>
            </div>
            <div className="value">{formattedValue}</div>
            <div className={`status-badge ${colorClass}`}>
              {severity === 'critical'
                ? 'Critical'
                : severity === 'warning'
                ? 'Warning'
                : 'Normal'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
