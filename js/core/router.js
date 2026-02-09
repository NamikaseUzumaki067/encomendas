// js/core/router.js
const routes = new Map();

export function registerRoute(path, loader) {
  routes.set(path, loader);
}

export function navigate(path) {
  history.pushState({}, "", path);
  resolveRoute();
}

export function resolveRoute() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const loader = routes.get(path);
  if (loader) loader();
}

// Intercepta botões voltar/avançar
window.addEventListener("popstate", resolveRoute);
