// js/pages/register.js
import { registerWithProfile, loginWithUsername } from "../data/auth.js";
import { notify, showLoading, hideLoading } from "../core/ui.js";

function renderRegister() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-brand">
          <span class="login-logo">📦</span>
          <h1>Criar Conta</h1>
        </div>

        <div class="login-form">
          <div class="input-group">
            <i class="fa-solid fa-user"></i>
            <input type="text" id="fullName" placeholder="Nome Completo">
          </div>

          <div class="input-group">
            <i class="fa-solid fa-at"></i>
            <input type="text" id="username" placeholder="Usuário">
          </div>

          <div class="input-group">
            <i class="fa-solid fa-key"></i>
            <input type="password" id="password" placeholder="Senha">
          </div>

          <div class="input-group">
            <i class="fa-solid fa-key"></i>
            <input type="password" id="password2" placeholder="Repita a Senha">
          </div>

          <button id="btnCreate" class="btn-primary btn-block">
            <i class="fa-solid fa-user-plus"></i> Criar Conta
          </button>

          <button id="btnBack" class="btn-secondary btn-block">
            Voltar ao Login
          </button>

          <div id="regError" class="login-error" style="display:none;"></div>
        </div>
      </div>
    </div>
  `;

  const btnCreate = document.getElementById("btnCreate");
  const btnBack = document.getElementById("btnBack");
  const errEl = document.getElementById("regError");

  const inputNome = document.getElementById("fullName");
  const inputUser = document.getElementById("username");
  const inputPass1 = document.getElementById("password");
  const inputPass2 = document.getElementById("password2");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function clearError() {
    errEl.textContent = "";
    errEl.style.display = "none";
  }

  async function doRegister() {
    const nome = inputNome.value.trim();
    const usuario = inputUser.value.trim();
    const senha = inputPass1.value;
    const senha2 = inputPass2.value;

    clearError();

    if (!nome || !usuario || !senha || !senha2) {
      showError("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== senha2) {
      showError("As senhas não são iguais.");
      return;
    }

    btnCreate.disabled = true;

    try {
      showLoading("Criando conta...");
      await registerWithProfile({ nome, usuario, senha });

      notify.success("Conta criada com sucesso!");

      // tenta logar automaticamente
      try {
        await loginWithUsername(usuario, senha);
        window.location.href = "index.html";
      } catch {
        notify.info("Conta criada! Verifique seu email para confirmar o cadastro.");
        window.location.href = "login.html";
      }
    } catch (e) {
      console.error(e);
      showError(e.message || "Erro ao criar conta.");
    } finally {
      hideLoading();
      btnCreate.disabled = false;
    }
  }

  btnCreate.addEventListener("click", doRegister);

  // ENTER para enviar
  [inputNome, inputUser, inputPass1, inputPass2].forEach(inp => {
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") doRegister();
    });
  });

  btnBack.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // Foco inicial
  inputNome.focus();
}

renderRegister();
