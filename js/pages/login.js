// js/pages/login.js
import { loginWithUsername } from "../data/auth.js";

function renderLogin() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 16px;
    ">
      <div class="card" style="max-width:420px;width:100%;">
        <h3 style="text-align:center;margin-bottom:16px;">
          <i class="fa-solid fa-lock"></i> Acesso
        </h3>

        <div class="modal-form">
          <input type="text" id="username" placeholder="Usuário">
          <input type="password" id="password" placeholder="Senha">
          <button id="btnLogin">Entrar</button>
          <button id="btnGoRegister" class="btn-secondary">Criar conta</button>
          <div id="loginError" style="color:var(--danger);font-size:12px;display:none;"></div>
        </div>
      </div>
    </div>
  `;

  const btnLogin = document.getElementById("btnLogin");
  const btnGoRegister = document.getElementById("btnGoRegister");
  const errEl = document.getElementById("loginError");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function clearError() {
    errEl.textContent = "";
    errEl.style.display = "none";
  }

  btnLogin.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

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
  });

  btnGoRegister.addEventListener("click", () => {
    window.location.href = "register.html";
  });
}

renderLogin();
