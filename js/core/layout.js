// js/core/layout.js
import { aplicarTemaSalvo, toggleDarkMode } from "../theme.js";
import { logout, getCurrentUser } from "../data/auth.js";

let clockInterval = null;

/**
 * Renderiza o layout base da aplicação:
 * - Sidebar
 * - Header com relógio
 * - Saudação do usuário
 * - Área principal <main>
 * - Botão Sair (Logout)
 */
export function renderLayout(activePage = "dashboard") {
  const app = document.getElementById("app");
  if (!app) {
    console.error("Elemento #app não encontrado");
    return;
  }

  app.innerHTML = buildLayoutHTML(activePage);

  // Tema
  aplicarTemaSalvo();
  bindThemeToggle();

  // Logout
  bindLogout();

  // Usuário
  preencherUsuarioLogado();

  // Relógio
  iniciarRelogio();
}

function buildLayoutHTML(activePage) {
  return `
    <div class="layout">
      <aside class="sidebar" role="navigation" aria-label="Menu principal">
        <div class="brand" aria-label="Nome do sistema">📦 Nova Saúde</div>

        <nav>
          <a href="index.html" class="${activePage === "dashboard" ? "active" : ""}">
            <i class="fa-solid fa-house" aria-hidden="true"></i>
            <span>Dashboard</span>
          </a>
          <a href="historico.html" class="${activePage === "historico" ? "active" : ""}">
            <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
            <span>Histórico</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="toggle-dark" id="btnTema" type="button" title="Alternar tema">
            <i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>
            <span>Tema</span>
          </button>

          <button class="btn-logout btn-danger" id="btnLogout" type="button" title="Sair do sistema">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main class="main-content" role="main">
        <div class="container">
          <header class="header-top">
            <div>
              <h1 id="pageTitle">Dashboard</h1>
              <div id="userGreeting" style="font-size:14px;color:var(--muted); margin-top:4px;">
                <!-- Saudação do usuário -->
              </div>
            </div>

            <div class="top-clock" aria-label="Relógio">
              <div id="clockTime">00:00:00</div>
              <div id="clockDate">--/--/----</div>
            </div>
          </header>

          <div id="pageContent"></div>
        </div>
      </main>
    </div>
  `;
}

/* =========================
   Tema
========================= */
function bindThemeToggle() {
  const btnTema = document.getElementById("btnTema");
  if (!btnTema) return;
  btnTema.addEventListener("click", toggleDarkMode);
}

/* =========================
   Logout
========================= */
function bindLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", async () => {
    const ok = window.confirm("Deseja sair do sistema?");
    if (!ok) return;

    try {
      await logout();
    } catch (e) {
      console.error("Erro ao sair:", e);
      alert("Ocorreu um erro ao sair. Tente novamente.");
    } finally {
      window.location.href = "login.html";
    }
  });
}

/* =========================
   Usuário logado
========================= */
async function preencherUsuarioLogado() {
  try {
    const user = await getCurrentUser();
    const el = document.getElementById("userGreeting");
    if (!el) return;

    if (!user) {
      el.textContent = "";
      return;
    }

    const nome =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Usuário");

    el.textContent = `👋 Olá, ${nome}`;
  } catch (e) {
    console.warn("Não foi possível obter o usuário logado:", e);
  }
}

/* =========================
   Relógio
========================= */
function iniciarRelogio() {
  // Evita múltiplos intervalos se o layout for renderizado de novo
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }

  function atualizarRelogio() {
    const agora = new Date();

    const h = String(agora.getHours()).padStart(2, "0");
    const m = String(agora.getMinutes()).padStart(2, "0");
    const s = String(agora.getSeconds()).padStart(2, "0");

    const d = String(agora.getDate()).padStart(2, "0");
    const mo = String(agora.getMonth() + 1).padStart(2, "0");
    const y = agora.getFullYear();

    const timeEl = document.getElementById("clockTime");
    const dateEl = document.getElementById("clockDate");

    if (timeEl) timeEl.textContent = `${h}:${m}:${s}`;
    if (dateEl) dateEl.textContent = `${d}/${mo}/${y}`;
  }

  atualizarRelogio();
  clockInterval = setInterval(atualizarRelogio, 1000);
}
