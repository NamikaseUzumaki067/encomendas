// js/app.js — Bootstrap da aplicação
import { getCurrentUser } from "./data/auth.js";
import { notify, showLoading, hideLoading } from "./core/ui.js";

/* =========================
   Helpers
========================= */
function getPageName() {
  const path = window.location.pathname;
  const file = path.split("/").pop() || "index.html";
  return file;
}

/* =========================
   Rotas
========================= */
const routes = {
  "index.html": () => import("./pages/dashboard.js"),
  "historico.html": () => import("./pages/historico.js"),
  "login.html": () => import("./pages/login.js"),
  "register.html": () => import("./pages/register.js"),
};

/* Páginas públicas (não exigem login) */
const publicPages = new Set(["login.html", "register.html"]);

/* =========================
   Bootstrap
========================= */
async function startApp() {
  const page = getPageName();

  try {
    showLoading("Carregando aplicação...");

    const user = await getCurrentUser();

    // Proteção de rotas
    if (!user && !publicPages.has(page)) {
      window.location.href = "login.html";
      return;
    }

    // Se usuário logado tentar abrir login/register, manda pro dashboard
    if (user && publicPages.has(page)) {
      window.location.href = "index.html";
      return;
    }

    // Resolve rota
    const loader = routes[page] || routes["index.html"];
    await loader();
  } catch (err) {
    console.error("Erro ao iniciar a aplicação:", err);
    renderFatalError(err);
    notify.error("Erro ao iniciar a aplicação.");
  } finally {
    hideLoading();
  }
}

/* =========================
   Erro fatal
========================= */
function renderFatalError(err) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div style="padding:20px;color:var(--danger);">
      <h2>Erro ao carregar a aplicação</h2>
      <pre style="white-space:pre-wrap;">${err?.message || err}</pre>
      <p>Recarregue a página ou tente novamente mais tarde.</p>
    </div>
  `;
}

/* =========================
   Init
========================= */
startApp();
