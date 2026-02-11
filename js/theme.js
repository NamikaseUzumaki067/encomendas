// js/theme.js

const THEME_KEY = "app_theme"; // chave no localStorage
const THEMES = ["light", "dark"];

/* =========================
   Helpers
========================= */
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignora erro de storage (modo privado, quota, etc)
  }
}

function getSystemPreference() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : "light";
}

function applyTheme(theme) {
  const t = normalizeTheme(theme);
  document.body.classList.toggle("dark", t === "dark");
  document.body.dataset.theme = t; // útil pra CSS/JS no futuro

  // Dispara evento global para quem quiser reagir à troca de tema
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: t } }));
}

/* =========================
   API Pública
========================= */

/**
 * Retorna o tema atual efetivo
 */
export function getTheme() {
  const saved = safeGet(THEME_KEY);
  if (saved) return normalizeTheme(saved);
  return getSystemPreference();
}

/**
 * Define explicitamente o tema
 */
export function setTheme(theme) {
  const t = normalizeTheme(theme);
  safeSet(THEME_KEY, t);
  applyTheme(t);
}

/**
 * Alterna entre light/dark
 */
export function toggleDarkMode() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/**
 * Aplica o tema salvo (ou preferência do sistema se não houver)
 * Chame isso no boot da aplicação / layout
 */
export function aplicarTemaSalvo() {
  const theme = getTheme();
  applyTheme(theme);
}
