// components/StatusCards.js
import React from 'react';
import {
  getSeverity,
  getColorClass,
  getFeatureMeta,
  THRESHOLDS,            // ⬅️ import thresholds
} from '../utils/alertEvaluator';
import ThresholdBar from './ThresholdBar';

export default function StatusCards({ data }) {
  // Cards use feature keys that exist in alertEvaluator.js
  const cards = [
    { title: 'Temperature', feature: 'productTemp', value: data.temperature },
    { title: 'Vibration',   feature: 'vibration',   value: data.vibration },
    { title: 'Pressure',    feature: 'tankPressure',value: data.pressure },
  ];

  return (
    <div className="status-cards">
      {cards.map((card, i) => {
        const colorClass = getColorClass(card.feature, card.value);
        const severity   = getSeverity(card.feature, card.value);
        const meta       = getFeatureMeta(card.feature);
        const thresholds = THRESHOLDS[card.feature];   // ⬅️ grab the 4-number arrays

        const formattedValue =
          card.value != null ? `${card.value.toFixed(2)} ${meta.unit || ''}` : '--';

        return (
          <div key={i} className={`card ${colorClass}`}>
            <div className="card-header">
              <div className="card-title">{card.title}</div>
            </div>

            <div className="value">{formattedValue}</div>

            {/* Threshold visual bar that understands normal/warn/crit bands */}
            {thresholds && (
              <ThresholdBar
                value={card.value}
                feature={card.feature}
                meta={meta}
                thresholds={thresholds}
              />
            )}

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
