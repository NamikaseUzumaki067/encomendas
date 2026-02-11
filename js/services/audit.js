// js/services/audit.js

const KEY = "audit_logs_v1";
const MAX_LOGS = 500; // limite para não estourar o localStorage

/* =========================
   Storage Helpers
========================= */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json) ?? fallback;
  } catch {
    return fallback;
  }
}

function load() {
  const raw = localStorage.getItem(KEY);
  return Array.isArray(safeParse(raw, [])) ? safeParse(raw, []) : [];
}

function save(logs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn("Falha ao salvar audit log:", e);
  }
}

/* =========================
   Core
========================= */
function normalizeLevel(level) {
  return ["info", "warn", "error"].includes(level) ? level : "info";
}

function pushLog(entry) {
  const logs = load();

  logs.push(entry);

  // Mantém só os últimos MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  save(logs);
}

/**
 * Registra uma ação no audit log
 * @param {string} action
 * @param {object} payload
 * @param {"info"|"warn"|"error"} level
 */
export function logAction(action, payload = {}, level = "info") {
  if (!action) return;

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    action: String(action),
    payload: payload ?? {},
    level: normalizeLevel(level),
    date: new Date().toISOString()
  };

  pushLog(entry);
}

/* =========================
   Leitura
========================= */

/**
 * Retorna todos os logs
 */
export function getLogs() {
  return load();
}

/**
 * Retorna logs filtrados
 * @param {{ level?: string, action?: string, from?: string, to?: string }} filters
 */
export function getLogsFiltered(filters = {}) {
  const { level, action, from, to } = filters;
  const logs = load();

  return logs.filter(l => {
    if (level && l.level !== level) return false;
    if (action && l.action !== action) return false;
    if (from && l.date < from) return false;
    if (to && l.date > to) return false;
    return true;
  });
}

/**
 * Limpa todos os logs
 */
export function clearLogs() {
  save([]);
}
