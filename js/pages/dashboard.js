// js/pages/dashboard.js
import { renderLayout } from "../core/layout.js";
import { getPedidos, addPedido, updateStatus, removePedido } from "../data/api.js";
import { desenharGrafico } from "../chart.js";
import { notify, confirmBox, showLoading, hideLoading } from "../core/ui.js";

let ticker = null;
let pedidosCache = [];

const DELIVERY_ALERTS_KEY = "delivery_alerts_v1";
const ALERTA_PROXIMO_DIAS = 3;

/* =========================
   Boot
========================= */
async function renderDashboard() {
  renderLayout("dashboard");

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = "📦 Dashboard";

  const content = document.getElementById("pageContent");
  content.innerHTML = buildHTML();

  bindFilters();
  bindModais();

  await requestNotificationPermissionIfNeeded();
  await refresh(true);

  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => refresh(false), 60 * 1000);
}

/* =========================
   HTML
========================= */
function buildHTML() {
  return `
    <button id="btnAbrirModal" class="fab btn-primary" aria-label="Nova Encomenda">+</button>

    <div class="card">
      <div class="contador">
        <span class="badge b-pendente">
          <i class="fa-solid fa-clock"></i>
          Pendentes: <strong id="countPendentes">0</strong>
        </span>
        <span class="badge b-chegou">
          <i class="fa-solid fa-box"></i>
          Chegaram: <strong id="countChegaram">0</strong>
        </span>
        <span class="badge b-avisado">
          <i class="fa-solid fa-phone"></i>
          Avisados: <strong id="countAvisados">0</strong>
        </span>
      </div>
    </div>

    <div class="card">
      <h3>📈 Pedidos de Hoje</h3>
      <canvas id="grafico" width="600" height="200"></canvas>
    </div>

    <div class="card">
      <h3>Filtros</h3>
      <div class="row">
        <input type="text" id="busca" placeholder="Buscar por cliente ou produto...">
        <select id="filtroStatus">
          <option value="todos">Todos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Chegou">Chegaram</option>
          <option value="Cliente avisado">Avisados</option>
        </select>
      </div>
    </div>

    <div class="card">
      <h3>Pedidos</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contato</th>
            <th>Produto</th>
            <th>Cód. Interno</th>
            <th>Pedido</th>
            <th>Chegada</th>
            <th>ETA</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="tabelaPedidos"></tbody>
      </table>
    </div>

    ${buildModalsHTML()}
  `;
}

function buildModalsHTML() {
  return `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <h3>Nova Encomenda</h3>
        <div class="modal-form">
          <input type="text" id="modalCliente" placeholder="Cliente *">
          <input type="text" id="modalContato" placeholder="Contato *">
          <input type="text" id="modalProduto" placeholder="Produto *">
          <input type="text" id="modalCodInterno" placeholder="Cód. Interno (opcional)">
          <textarea id="modalObservacao" placeholder="Observação (opcional)" rows="3"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="btnCancelarModal">Cancelar</button>
          <button type="button" class="btn-primary" id="btnSalvarModal">Salvar</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="detalhesBackdrop">
      <div class="modal">
        <h3>Detalhes da Encomenda</h3>
        <div class="field"><label>Cliente</label><div id="detCliente"></div></div>
        <div class="field"><label>Contato</label><div id="detContato"></div></div>
        <div class="field"><label>Produto</label><div id="detProduto"></div></div>
        <div class="field"><label>Cód. Interno</label><div id="detCodInterno"></div></div>
        <div class="field"><label>Observação</label><div id="detObservacao"></div></div>
        <div class="field"><label>Data do Pedido</label><div id="detDataPedido"></div></div>
        <div class="field"><label>Data de Chegada</label><div id="detDataChegada"></div></div>
        <div class="field"><label>Status</label><div id="detStatus"></div></div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="btnFecharDetalhes">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   Data
========================= */
async function fetchPedidos(showLoader = false) {
  try {
    if (showLoader) showLoading("Carregando pedidos...");
    pedidosCache = await getPedidos();
  } catch (e) {
    console.error(e);
    notify.error("Erro ao carregar pedidos.");
  } finally {
    if (showLoader) hideLoading();
  }
}

/* =========================
   Render
========================= */
function atualizarContadores() {
  const pendentes = pedidosCache.filter(p => p.status === "Pendente").length;
  const chegaram = pedidosCache.filter(p => p.status === "Chegou").length;
  const avisados = pedidosCache.filter(p => p.status === "Cliente avisado").length;

  document.getElementById("countPendentes").textContent = pendentes;
  document.getElementById("countChegaram").textContent = chegaram;
  document.getElementById("countAvisados").textContent = avisados;
}

function renderTabela() {
  const tabela = document.getElementById("tabelaPedidos");
  const busca = document.getElementById("busca").value.toLowerCase();
  const filtroStatus = document.getElementById("filtroStatus").value;

  tabela.innerHTML = "";

  pedidosCache.forEach(p => {
    if (busca && !p.cliente.toLowerCase().includes(busca) && !p.produto.toLowerCase().includes(busca)) return;
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return;

    const eta = formatETA(p.dataChegada);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.cliente}</td>
      <td>${p.contato || "-"}</td>
      <td>${p.produto}</td>
      <td>${p.codInterno || "-"}</td>
      <td>${p.dataPedido || "-"}</td>
      <td><input type="date" data-date="${p.id}" value="${p.dataChegada || ""}"></td>
      <td>${eta}</td>
      <td>
        <select data-status="${p.id}">
          <option value="Pendente" ${p.status === "Pendente" ? "selected" : ""}>Pendente</option>
          <option value="Chegou" ${p.status === "Chegou" ? "selected" : ""}>Chegou</option>
          <option value="Cliente avisado" ${p.status === "Cliente avisado" ? "selected" : ""}>Cliente avisado</option>
        </select>
      </td>
      <td>
        <button class="btn-secondary" data-detalhes="${p.id}">Detalhes</button>
        <button class="btn-danger" data-excluir="${p.id}">Excluir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });

  bindTabelaAcoes();
}

/* =========================
   Actions
========================= */
function bindFilters() {
  document.getElementById("busca").addEventListener("input", renderTabela);
  document.getElementById("filtroStatus").addEventListener("change", renderTabela);
}

function bindTabelaAcoes() {
  const tabela = document.getElementById("tabelaPedidos");

  tabela.querySelectorAll("[data-status]").forEach(sel => {
    sel.onchange = async () => {
      const id = +sel.dataset.status;
      const novoStatus = sel.value;
      const dateInput = tabela.querySelector(`[data-date="${id}"]`);
      const novaData = dateInput ? dateInput.value || null : null;
      await updateStatus(id, novoStatus, novaData);
      await refresh(false);
      notify.success("Status atualizado.");
    };
  });

  tabela.querySelectorAll("[data-date]").forEach(inp => {
    inp.onchange = async () => {
      const id = +inp.dataset.date;
      const novaData = inp.value || null;
      const sel = tabela.querySelector(`[data-status="${id}"]`);
      const statusAtual = sel ? sel.value : "Pendente";
      await updateStatus(id, statusAtual, novaData);
      await refresh(false);
      notify.success("Data atualizada.");
    };
  });

  tabela.querySelectorAll("[data-detalhes]").forEach(btn => {
    btn.onclick = () => abrirDetalhes(+btn.dataset.detalhes);
  });

  tabela.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.onclick = async () => {
      const ok = await confirmBox("Deseja remover este pedido?", { danger: true });
      if (!ok) return;
      await removePedido(+btn.dataset.excluir);
      await refresh(false);
      notify.success("Pedido removido.");
    };
  });
}

/* =========================
   Modais
========================= */
function bindModais() {
  const btnAbrir = document.getElementById("btnAbrirModal");
  const backdrop = document.getElementById("modalBackdrop");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const btnSalvar = document.getElementById("btnSalvarModal");

  btnAbrir.onclick = () => abrirModal(backdrop);
  btnCancelar.onclick = () => fecharModal(backdrop);
  backdrop.onclick = e => { if (e.target === backdrop) fecharModal(backdrop); };
  btnSalvar.onclick = salvarNovaEncomenda;

  const btnFecharDetalhes = document.getElementById("btnFecharDetalhes");
  const detalhesBackdrop = document.getElementById("detalhesBackdrop");
  btnFecharDetalhes.onclick = () => fecharModal(detalhesBackdrop);
  detalhesBackdrop.onclick = e => { if (e.target === detalhesBackdrop) fecharModal(detalhesBackdrop); };
}

function abrirModal(el) { el.classList.add("open"); }
function fecharModal(el) { el.classList.remove("open"); }

async function salvarNovaEncomenda() {
  const cliente = modalCliente.value.trim();
  const contato = modalContato.value.trim();
  const produto = modalProduto.value.trim();
  const codInterno = modalCodInterno.value.trim();
  const observacao = modalObservacao.value.trim();

  if (!cliente || !contato || !produto) {
    notify.warning("Preencha Cliente, Contato e Produto.");
    return;
  }

  try {
    await addPedido({ cliente, contato, produto, codInterno, observacao });
    notify.success("Pedido criado com sucesso!");
    modalCliente.value = modalContato.value = modalProduto.value = modalCodInterno.value = modalObservacao.value = "";
    fecharModal(modalBackdrop);
    await refresh(false);
  } catch (e) {
    console.error(e);
    notify.error("Erro ao salvar pedido.");
  }
}

async function abrirDetalhes(id) {
  const p = pedidosCache.find(x => x.id === id);
  if (!p) return;

  detCliente.textContent = p.cliente || "-";
  detContato.textContent = p.contato || "-";
  detProduto.textContent = p.produto || "-";
  detCodInterno.textContent = p.codInterno || "-";
  detObservacao.textContent = p.observacao || "-";
  detDataPedido.textContent = p.dataPedido || "-";
  detDataChegada.textContent = p.dataChegada || "-";
  detStatus.textContent = p.status || "-";

  abrirModal(detalhesBackdrop);
}

/* =========================
   Notificações de entrega
========================= */
async function requestNotificationPermissionIfNeeded() {
  if (!("Notification" in window)) return;

  try {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  } catch (e) {
    console.warn("Não foi possível solicitar permissão de notificação:", e);
  }
}

function avaliarNotificacoesEntrega() {
  if (!Array.isArray(pedidosCache) || !pedidosCache.length) return;

  const state = loadDeliveryAlerts();
  const activeKeys = new Set();
  const hoje = startOfDay(new Date());

  pedidosCache.forEach(pedido => {
    if (!pedido?.id || !pedido?.dataChegada) return;
    if (pedido.status && pedido.status !== "Pendente") return;

    const dataEntrega = parseDateOnly(pedido.dataChegada);
    if (!dataEntrega) return;

    const diffDias = diffInDays(hoje, dataEntrega);
    const alertType = getDeliveryAlertType(diffDias);
    if (!alertType) return;

    const alertKey = buildAlertKey(pedido, alertType);
    activeKeys.add(alertKey);

    if (state[alertKey]) return;

    emitirNotificacaoEntrega(pedido, alertType, diffDias);
    state[alertKey] = new Date().toISOString();
  });

  cleanupDeliveryAlerts(state, activeKeys);
  saveDeliveryAlerts(state);
}

function getDeliveryAlertType(diffDias) {
  if (diffDias === ALERTA_PROXIMO_DIAS) return "proximo";
  if (diffDias === 0) return "hoje";
  return null;
}

function emitirNotificacaoEntrega(pedido, alertType) {
  const dataFormatada = formatDateBR(pedido.dataChegada);

  const title = alertType === "hoje"
    ? `📦 Entrega prevista hoje: ${pedido.cliente}`
    : `📦 Entrega próxima: ${pedido.cliente}`;

  const body = alertType === "hoje"
    ? `${pedido.produto} está previsto para chegar hoje (${dataFormatada}).`
    : `${pedido.produto} está previsto para chegar em ${ALERTA_PROXIMO_DIAS} dias (${dataFormatada}).`;

  if (alertType === "hoje") {
    notify.success(`${pedido.cliente}: ${pedido.produto} está previsto para chegar hoje.`, 6000);
  } else {
    notify.info(`${pedido.cliente}: ${pedido.produto} está próximo de chegar (${dataFormatada}).`, 6000);
  }

  showDesktopNotification(title, body);
}

function showDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      tag: `delivery-${title}`,
      renotify: false,
    });
  } catch (e) {
    console.warn("Falha ao exibir notificação do sistema:", e);
  }
}

function loadDeliveryAlerts() {
  try {
    const raw = localStorage.getItem(DELIVERY_ALERTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDeliveryAlerts(state) {
  try {
    localStorage.setItem(DELIVERY_ALERTS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Falha ao salvar estado das notificações:", e);
  }
}

function cleanupDeliveryAlerts(state, activeKeys) {
  Object.keys(state).forEach(key => {
    if (!activeKeys.has(key)) delete state[key];
  });
}

function buildAlertKey(pedido, alertType) {
  return `${pedido.id}:${pedido.dataChegada}:${alertType}`;
}

/* =========================
   Utils
========================= */
function formatETA(dataChegada) {
  if (!dataChegada) return "-";

  const hoje = startOfDay(new Date());
  const alvo = parseDateOnly(dataChegada);
  if (!alvo) return "-";

  const dias = diffInDays(hoje, alvo);

  if (dias < 0) return "Atrasado";
  if (dias === 0) return "Hoje";
  return `Em ${dias} dia(s)`;
}

function parseDateOnly(dateString) {
  if (!dateString) return null;

  const [year, month, day] = String(dateString).split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(from, to) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to) - startOfDay(from)) / oneDay);
}

function formatDateBR(dateString) {
  const data = parseDateOnly(dateString);
  if (!data) return dateString || "-";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/* =========================
   Refresh
========================= */
async function refresh(showLoader) {
  await fetchPedidos(showLoader);
  atualizarContadores();
  avaliarNotificacoesEntrega();
  await desenharGrafico(pedidosCache);
  renderTabela();
}

/* =========================
   Init
========================= */
renderDashboard();