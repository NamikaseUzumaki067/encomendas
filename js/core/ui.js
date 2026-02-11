// js/core/ui.js

/* =========================
   DOM Helpers
========================= */
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/* =========================
   Toast System
========================= */

let toastContainer = null;

function ensureToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.style.position = "fixed";
  toastContainer.style.top = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.display = "flex";
  toastContainer.style.flexDirection = "column";
  toastContainer.style.gap = "10px";
  toastContainer.style.zIndex = "2000";

  document.body.appendChild(toastContainer);
  return toastContainer;
}

function createToast(message, type = "info", timeout = 3000) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.textContent = message;

  const bg = {
    info: "#2563eb",
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#dc2626"
  }[type] || "#2563eb";

  toast.style.background = bg;
  toast.style.color = "#fff";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 6px 16px rgba(0,0,0,.25)";
  toast.style.fontSize = "14px";
  toast.style.cursor = "pointer";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-10px)";
  toast.style.transition = "all .2s ease";

  container.appendChild(toast);

  // anima entrada
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  function remove() {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 200);
  }

  toast.addEventListener("click", remove);

  if (timeout > 0) {
    setTimeout(remove, timeout);
  }
}

/* API pública de notificação */
export const notify = {
  info: (msg, t) => createToast(msg, "info", t),
  success: (msg, t) => createToast(msg, "success", t),
  warning: (msg, t) => createToast(msg, "warning", t),
  error: (msg, t) => createToast(msg, "error", t),
};

/* Mantém compatibilidade com código antigo */
export function showToast(msg) {
  notify.info(msg);
}

/* =========================
   Confirm Dialog (Promise)
========================= */

export function confirmBox(message, options = {}) {
  return new Promise((resolve) => {
    const {
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      danger = false,
    } = options;

    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(0,0,0,.5)";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.zIndex = "3000";

    const box = document.createElement("div");
    box.style.background = "var(--card)";
    box.style.color = "var(--text)";
    box.style.borderRadius = "12px";
    box.style.padding = "20px";
    box.style.maxWidth = "420px";
    box.style.width = "100%";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,.3)";
    box.style.border = "1px solid var(--border)";

    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.marginBottom = "16px";
    msg.style.fontSize = "14px";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "10px";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = cancelText;
    btnCancel.className = "btn-secondary";

    const btnOk = document.createElement("button");
    btnOk.textContent = confirmText;
    btnOk.className = danger ? "btn-danger" : "";

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    box.appendChild(msg);
    box.appendChild(actions);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    function close(result) {
      backdrop.remove();
      resolve(result);
    }

    btnCancel.onclick = () => close(false);
    btnOk.onclick = () => close(true);
    backdrop.onclick = (e) => {
      if (e.target === backdrop) close(false);
    };
  });
}

/* =========================
   Loading Overlay
========================= */

let loadingCount = 0;
let loadingEl = null;

export function showLoading(text = "Carregando...") {
  loadingCount++;

  if (loadingEl) return;

  loadingEl = document.createElement("div");
  loadingEl.style.position = "fixed";
  loadingEl.style.inset = "0";
  loadingEl.style.background = "rgba(0,0,0,.4)";
  loadingEl.style.display = "flex";
  loadingEl.style.alignItems = "center";
  loadingEl.style.justifyContent = "center";
  loadingEl.style.zIndex = "4000";

  const box = document.createElement("div");
  box.style.background = "var(--card)";
  box.style.color = "var(--text)";
  box.style.padding = "20px 24px";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,.3)";
  box.style.border = "1px solid var(--border)";
  box.textContent = text;

  loadingEl.appendChild(box);
  document.body.appendChild(loadingEl);
}

export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);

  if (loadingCount === 0 && loadingEl) {
    loadingEl.remove();
    loadingEl = null;
  }
}
