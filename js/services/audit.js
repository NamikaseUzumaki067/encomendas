// js/services/audit.js

const KEY = "audit_logs_v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(logs) {
  localStorage.setItem(KEY, JSON.stringify(logs));
}

export function logAction(action, payload = {}) {
  const logs = load();
  logs.push({
    id: Date.now(),
    action,
    payload,
    date: new Date().toISOString()
  });
  save(logs);
}

export function getLogs() {
  return load();
}
