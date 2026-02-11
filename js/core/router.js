// js/core/router.js

const routes = new Map();
let notFoundHandler = null;
let beforeEachHook = null;

/**
 * Registra uma rota
 * @param {string} path Ex: "index.html", "historico.html"
 * @param {Function} loader Função que carrega/renderiza a página
 */
export function registerRoute(path, loader) {
  if (typeof path !== "string" || typeof loader !== "function") {
    throw new Error("registerRoute(path, loader) requer string e função.");
  }
  routes.set(normalizePath(path), loader);
}

/**
 * Define handler para rota não encontrada (404)
 */
export function setNotFound(handler) {
  if (typeof handler !== "function") {
    throw new Error("setNotFound(handler) requer uma função.");
  }
  notFoundHandler = handler;
}

/**
 * Hook executado antes de cada navegação.
 * Pode retornar false para bloquear a navegação.
 */
export function setBeforeEach(fn) {
  if (typeof fn !== "function") {
    throw new Error("setBeforeEach(fn) requer uma função.");
  }
  beforeEachHook = fn;
}

/**
 * Navega para um path
 */
export async function navigate(path) {
  const target = normalizePath(path);

  if (beforeEachHook) {
    const ok = await beforeEachHook(target);
    if (ok === false) return;
  }

  history.pushState({}, "", target);
  await resolveRoute();
}

/**
 * Resolve a rota atual
 */
export async function resolveRoute() {
  const current = getCurrentPath();
  const loader = routes.get(current);

  if (beforeEachHook) {
    const ok = await beforeEachHook(current);
    if (ok === false) return;
  }

  if (loader) {
    try {
      await loader();
    } catch (err) {
      console.error("Erro ao carregar rota:", current, err);
      renderError(err);
    }
  } else {
    if (notFoundHandler) {
      notFoundHandler(current);
    } else {
      console.warn("Rota não encontrada:", current);
    }
  }
}

/**
 * Inicializa o router (chame uma vez no boot da app)
 */
export function startRouter() {
  window.addEventListener("popstate", () => {
    resolveRoute();
  });

  // Resolve rota inicial
  resolveRoute();
}

/* =========================
   Helpers
========================= */

function normalizePath(path) {
  if (!path) return "index.html";

  // Remove query e hash
  const clean = path.split("?")[0].split("#")[0];

  // Se vier só "/" ou vazio, assume index.html
  if (clean === "/" || clean === "") return "index.html";

  // Pega só o nome do arquivo
  const parts = clean.split("/");
  return parts[parts.length - 1];
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function renderError(err) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div style="padding:20px;color:var(--danger);">
      <h2>Erro ao carregar a página</h2>
      <pre style="white-space:pre-wrap;">${err?.message || err}</pre>
    </div>
  `;
}
