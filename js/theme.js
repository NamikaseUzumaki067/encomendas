// js/theme.js (V2)
// Versão independente, sem state.js

const THEME_KEY = "app_theme"; // chave única no localStorage

export function aplicarTemaSalvo() {
  const tema = localStorage.getItem(THEME_KEY);
  if (tema === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

export function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}
