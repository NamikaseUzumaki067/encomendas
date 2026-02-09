// js/core/layout.js
import { aplicarTemaSalvo, toggleDarkMode } from "../theme.js";
import { logout, getCurrentUser } from "../data/auth.js";

/**
 * Cria o layout base da aplicação:
 * - Sidebar
 * - Header com relógio
 * - Saudação do usuário
 * - Área principal <main>
 * - Botão Sair (Logout)
 */
export function renderLayout(activePage = "dashboard") {
  const app = document.getElementById("app");
  if (!app) throw new Error("Elemento #app não encontrado");

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">📦 Nova Saúde</div>

        <nav>
          <a href="index.html" class="${activePage === "dashboard" ? "active" : ""}">
            <i class="fa-solid fa-house"></i>
            Dashboard
          </a>
          <a href="historico.html" class="${activePage === "historico" ? "active" : ""}">
            <i class="fa-solid fa-clock-rotate-left"></i>
            Histórico
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="toggle-dark" id="btnTema" title="Alternar tema">
            <i class="fa-solid fa-circle-half-stroke"></i>
            Tema
          </button>

          <button class="btn-logout" id="btnLogout" title="Sair do sistema">
            <i class="fa-solid fa-right-from-bracket"></i>
            Sair
          </button>
        </div>
      </aside>

      <main class="main-content">
        <div class="container">
          <header class="header-top">
            <div>
              <h1 id="pageTitle">Dashboard</h1>
              <div id="userGreeting" style="font-size:14px;color:var(--muted); margin-top:4px;">
                <!-- Saudação do usuário -->
              </div>
            </div>

            <div class="top-clock">
              <div id="clockTime">00:00:00</div>
              <div id="clockDate">--/--/----</div>
            </div>
          </header>

          <div id="pageContent"></div>
        </div>
      </main>
    </div>
  `;

  // Tema
  aplicarTemaSalvo();
  const btnTema = document.getElementById("btnTema");
  if (btnTema) btnTema.addEventListener("click", toggleDarkMode);

  // Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      if (!confirm("Deseja sair do sistema?")) return;
      try {
        await logout();
      } catch (e) {
        console.error("Erro ao sair:", e);
      } finally {
        window.location.href = "login.html";
      }
    });
  }

  // Mostrar saudação do usuário logado
  preencherUsuarioLogado();

  // Relógio
  iniciarRelogio();
}

async function preencherUsuarioLogado() {
  try {
    const user = await getCurrentUser();
    const el = document.getElementById("userGreeting");
    if (!el || !user) return;

    // Tenta pegar nome do metadata, senão usa parte do email
    const nome =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Usuário");

    el.textContent = `👋 Olá, ${nome}`;
  } catch (e) {
    // silencioso
  }
}

function iniciarRelogio() {
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

    if (timeEl && dateEl) {
      timeEl.textContent = `${h}:${m}:${s}`;
      dateEl.textContent = `${d}/${mo}/${y}`;
    }
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
}
