// js/pages/login.js
import { loginWithUsername } from "../data/auth.js";

function renderLogin() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-brand">
          <span class="login-logo">📦</span>
          <h1>Nova Saúde</h1>
        </div>

        <div class="login-form">
          <div class="input-group">
            <i class="fa-solid fa-user"></i>
            <input type="text" id="username" placeholder="Usuário" autocomplete="username">
          </div>

          <div class="input-group">
            <i class="fa-solid fa-key"></i>
            <input type="password" id="password" placeholder="Senha" autocomplete="current-password">
          </div>

          <button id="btnLogin" class="btn-primary btn-block">
            <i class="fa-solid fa-right-to-bracket"></i> Entrar
          </button>

          <button id="btnGoRegister" class="btn-secondary btn-block">
            <i class="fa-solid fa-user-plus"></i> Criar conta
          </button>

          <div id="loginError" class="login-error" style="display:none;"></div>
        </div>
      </div>
    </div>
  `;

  const btnLogin = document.getElementById("btnLogin");
  const btnGoRegister = document.getElementById("btnGoRegister");
  const errEl = document.getElementById("loginError");
  const inputUser = document.getElementById("username");
  const inputPass = document.getElementById("password");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function clearError() {
    errEl.textContent = "";
    errEl.style.display = "none";
  }

  async function doLogin() {
    const username = inputUser.value.trim();
    const password = inputPass.value.trim();

    clearError();

    if (!username || !password) {
      showError("Informe usuário e senha.");
      return;
    }

    try {
      await loginWithUsername(username, password);
      window.location.href = "index.html";
    } catch (e) {
      showError(e.message || "Falha ao autenticar.");
    }
  }

  // Clique no botão
  btnLogin.addEventListener("click", doLogin);

  // ENTER nos campos de input
  inputUser.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  inputPass.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  // Ir para cadastro
  btnGoRegister.addEventListener("click", () => {
    window.location.href = "register.html";
  });
}

renderLogin();
