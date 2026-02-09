// js/pages/register.js
import { registerWithProfile, loginWithUsername } from "../data/auth.js";

function renderRegister() {
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
      <div class="card" style="max-width:460px;width:100%;">
        <h3 style="text-align:center;margin-bottom:16px;">
          <i class="fa-solid fa-user-plus"></i> Criar Conta
        </h3>

        <div class="modal-form">
          <input type="text" id="fullName" placeholder="Nome Completo">
          <input type="text" id="username" placeholder="Usuário">
          <input type="password" id="password" placeholder="Senha">
          <input type="password" id="password2" placeholder="Repita a Senha">
          <button id="btnCreate">Criar Conta</button>
          <button id="btnBack" class="btn-secondary">Voltar ao Login</button>
          <div id="regError" style="color:var(--danger);font-size:12px;display:none;"></div>
        </div>
      </div>
    </div>
  `;

  const errEl = document.getElementById("regError");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function clearError() {
    errEl.textContent = "";
    errEl.style.display = "none";
  }

  document.getElementById("btnBack").addEventListener("click", () => {
    window.location.href = "login.html";
  });

  document.getElementById("btnCreate").addEventListener("click", async () => {
    const nome = document.getElementById("fullName").value.trim();
    const usuario = document.getElementById("username").value.trim();
    const senha = document.getElementById("password").value;
    const senha2 = document.getElementById("password2").value;

    clearError();

    if (!nome || !usuario || !senha || !senha2) {
      showError("Preencha todos os campos.");
      return;
    }

    if (senha !== senha2) {
      showError("As senhas não são iguais.");
      return;
    }

    try {
      await registerWithProfile({ nome, usuario, senha });

      // tenta logar automaticamente
      try {
        await loginWithUsername(usuario, senha);
        window.location.href = "index.html";
      } catch {
        showError("Conta criada! Verifique seu email para confirmar o cadastro.");
      }
    } catch (e) {
      showError(e.message || "Erro ao criar conta.");
    }
  });
}

renderRegister();
