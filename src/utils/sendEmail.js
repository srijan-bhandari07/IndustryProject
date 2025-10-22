// utils/sendEmail.js
import emailjs from "@emailjs/browser";

const SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

// Fire one email
export async function sendMachineAlert({ to, subject, message, machine, line, time, from = "AI PM Dashboard" }) {
  if (!to) throw new Error("Recipient email is missing");

  const params = {
    to_email: to,       // must match your template's "To Email" variable
    subject,
    message,
    machine,
    line,
    time,
    from,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
}

/**
 * Send a WARNING email to all staff who can see this machine
 * (any user whose accessibleMachines contains machineId OR any admin).
 * Returns a Promise that resolves when all individual sends settle.
 */
export async function sendWarningToMachineStaff({ machineId, machineName, lineName, value, threshold, users }) {
  // pick recipients
  const recipients = Array.from(new Set(
    (users || [])
      .filter(u => u.active !== false && u.email)
      .filter(u => u.role === "admin" || (u.accessibleMachines || []).includes(machineId))
      .map(u => u.email.toLowerCase())
  ));

  if (!recipients.length) return { ok: false, reason: "no-recipients" };

  const subject = `Warning – ${machineName} (${lineName})`;
  const body = `Vibration crossed threshold.\nValue: ${value}  |  Threshold: ${threshold}`;

  const time = new Date().toLocaleString();

  const results = await Promise.allSettled(
    recipients.map(to => sendMachineAlert({
      to,
      subject,
      message: body,
      machine: machineName,
      line: lineName,
      time,
    }))
  );

  const failures = results.filter(r => r.status === "rejected");
  return { ok: failures.length === 0, results };
}

/* Optional tiny cooldown helper to avoid spamming */
export function canSendWarningNow(machineId, minutes = 10) {
  try {
    const key = `warn.last.${machineId}`;
    const last = parseInt(localStorage.getItem(key) || "0", 10);
    const now  = Date.now();
    if (now - last < minutes * 60_000) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}
