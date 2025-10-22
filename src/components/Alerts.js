// src/components/Alerts.js
import React, { useState } from 'react';
import styles from './Alerts.module.css';
import {
  getSeverity,
  getFeatureMeta,
  describeThreshold,
} from '../utils/alertEvaluator';

function leadingIcon(sev) {
  switch (sev) {
    case 'critical': return 'fa-radiation';
    case 'warning':  return 'fa-exclamation-triangle';
    default:         return 'fa-info-circle';
  }
}

export default function Alerts({ alerts = [] }) {
  const [open, setOpen] = useState(null);

  // Normalize alert: compute severity from feature/value if missing
  const normalize = (a) => {
    if (!a?.feature) return a;
    const sev = a.severity || getSeverity(a.feature, a.value);
    return { ...a, severity: sev };
  };

  return (
    <div className={styles.alerts}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Recent Alerts</div>
        </div>

        <ul className={styles.list}>
          {alerts.map((raw) => {
            const a = normalize(raw);
            const icon = leadingIcon(a.severity);
            const meta = a.feature ? getFeatureMeta(a.feature) : null;

            return (
              <li
                key={a.id}
                className={`${styles.item} ${styles[a.severity || 'info']}`}
                onClick={() => setOpen(a)}
              >
                <i className={`fas ${icon} ${styles.leadIcon}`} />
                <div className={styles.meta}>
                  <div className={styles.message}>
                    {meta ? `${meta.group} – ${meta.label}` : a.message}
                  </div>
                  <div className={styles.time}>
                    {a.timestamp}
                  </div>
                </div>
                <div className={`${styles.badge} ${styles[a.severity || 'info']}`}>
                  {a.severity === 'critical' ? 'Critical'
                    : a.severity === 'warning' ? 'Warning'
                    : 'Info'}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {open && (() => {
        const a = normalize(open);
        const meta = a.feature ? getFeatureMeta(a.feature) : { label: a.message, unit: '', group: 'Process' };
        const ranges = a.feature ? describeThreshold(a.feature) : '';
        const icon = leadingIcon(a.severity);

        return (
          <div className={styles.backdrop} onClick={() => setOpen(null)}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.sheetHeader}>
                <div className={styles.sheetTitle}>
                  <i className={`fas ${icon}`} style={{ marginRight: 8 }} />
                  {a.severity === 'critical' ? 'Critical Alert'
                    : a.severity === 'warning' ? 'Warning Alert'
                    : 'Info Alert'}
                </div>
                <button className={styles.iconBtn} onClick={() => setOpen(null)} aria-label="Close">
                  <i className="fas fa-times" />
                </button>
              </div>

              <div className={styles.detailBox}>
                <div className={styles.detailHeader}>
                  <div className={`${styles.badge} ${styles[a.severity || 'info']}`}>
                    {a.severity}
                  </div>
                  <div className={styles.detailMachine}>
                    {meta.group} • {meta.label}
                  </div>
                </div>

                {/* Measured vs expected */}
                {a.feature && (
                  <section className={styles.sectionGrid}>
                    <div>
                      <h4>Measured</h4>
                      <p className={styles.measured}>
                        {a.value != null ? `${a.value} ${meta.unit}` : '—'}
                      </p>
                    </div>
                    <div className={styles.rightAligned}>
                      <h4>Expected Thresholds</h4>
                      <p className={styles.ranges}>{ranges}</p>
                    </div>
                  </section>
                )}

                {/* Problem / Solution copy (kept from your version) */}
                <section className={styles.section}>
                  <h4>Problem</h4>
                  <p>
                    {a.severity === 'critical'
                      ? <>A <strong>critical</strong> deviation was detected in <em>{meta.label}</em>. Immediate attention is required.</>
                      : a.severity === 'warning'
                      ? <>A <strong>warning</strong> threshold was exceeded for <em>{meta.label}</em>. Please investigate soon.</>
                      : <>Informational event: <em>{meta.label}</em>. No immediate action required.</>}
                  </p>
                </section>

                <section className={styles.section}>
                  <h4>Suggested Action</h4>
                  <p>
                    {a.severity === 'critical'
                      ? <>Stop the machine, notify maintenance, check sensors and mechanical assemblies, and log a diagnostic before restart.</>
                      : a.severity === 'warning'
                      ? <>Review logs and recent changes, verify calibration, and schedule inspection if the condition persists.</>
                      : <>Continue operation and monitor readings during the next production cycles.</>}
                  </p>
                </section>

                <section className={styles.sectionGrid}>
                  <div>
                    <h4>Contact</h4>
                    <p>Maintenance: +61 400 000 000</p>
                  </div>
                  <div className={styles.rightAligned}>
                    <h4>Time</h4>
                    <p>{a.timestamp}</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
