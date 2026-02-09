// js/app.js (V2) - com proteção de rotas

import { getCurrentUser } from "./data/auth.js";

function getPageName() {
  const path = window.location.pathname;
  const file = path.split("/").pop() || "index.html";
  return file;
}

async function startApp() {
  const page = getPageName();

  try {
    const user = await getCurrentUser();

    const publicPages = ["login.html", "register.html"];

    if (!user && !publicPages.includes(page)) {
      window.location.href = "login.html";
      return;
    }

    if (page === "index.html" || page === "") {
      await import("./pages/dashboard.js");
      return;
    }

    if (page === "historico.html") {
      await import("./pages/historico.js");
      return;
    }

    if (page === "login.html") {
      await import("./pages/login.js");
      return;
    }

    if (page === "register.html") {
      await import("./pages/register.js");
      return;
    }

    // Fallback
    await import("./pages/dashboard.js");
  } catch (err) {
    console.error("Erro ao iniciar a aplicação:", err);
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `
        <div style="padding:20px;color:red;">
          <h2>Erro ao carregar a aplicação</h2>
          <pre>${err.message}</pre>
        </div>
      `;
    }
  }
}

startApp();
