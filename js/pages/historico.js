// js/pages/historico.js
import { renderLayout } from "../core/layout.js";
import { getPedidos } from "../data/api.js";
import { notify, showLoading, hideLoading } from "../core/ui.js";

let pedidosCache = [];

/* =========================
   Boot
========================= */
async function renderHistorico() {
  renderLayout("historico");

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = "📚 Histórico";

  const content = document.getElementById("pageContent");
  content.innerHTML = buildHTML();

  bindFiltros();
  bindExport();

  await carregarPedidos();
  renderTabela();
}

/* =========================
   HTML
========================= */
function buildHTML() {
  return `
    <div class="card">
      <div class="historico-top">
        <div style="text-align:center; font-size:18px; font-weight:700;">
          📊 Total: <span id="totalHistorico">0</span> pedidos
        </div>
        <div class="export-bar">
          <button id="btnExportCSV" class="btn-secondary">📤 Exportar CSV</button>
          <button id="btnPrintPDF" class="btn-secondary">🖨️ Imprimir / PDF</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Filtros</h3>
      <div class="row">
        <input type="text" id="buscaHistorico" placeholder="Buscar por cliente ou produto...">
        <select id="filtroStatusHistorico">
          <option value="todos">Todos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Chegou">Chegaram</option>
          <option value="Cliente avisado">Avisados</option>
        </select>
        <input type="date" id="dataInicio">
        <input type="date" id="dataFim">
      </div>
    </div>

    <div class="card">
      <h3>Registros</h3>
      <table id="tabelaExport">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contato</th>
            <th>Produto</th>
            <th>Cód. Interno</th>
            <th>Pedido</th>
            <th>Chegada</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="tabelaHistorico"></tbody>
      </table>
    </div>
  `;
}

/* =========================
   Data
========================= */
async function carregarPedidos() {
  try {
    showLoading("Carregando histórico...");
    pedidosCache = await getPedidos();
  } catch (e) {
    console.error(e);
    notify.error("Erro ao carregar histórico.");
    pedidosCache = [];
  } finally {
    hideLoading();
  }
}

function obterFiltrados() {
  const busca = document.getElementById("buscaHistorico").value.toLowerCase();
  const status = document.getElementById("filtroStatusHistorico").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  return pedidosCache.filter(p => {
    const cliente = (p.cliente || "").toLowerCase();
    const produto = (p.produto || "").toLowerCase();

    if (busca && !cliente.includes(busca) && !produto.includes(busca)) return false;
    if (status !== "todos" && p.status !== status) return false;
    if (dataInicio && p.dataPedido < dataInicio) return false;
    if (dataFim && p.dataPedido > dataFim) return false;
    return true;
  });
}

/* =========================
   Render
========================= */
function renderTabela() {
  const tabela = document.getElementById("tabelaHistorico");
  const totalEl = document.getElementById("totalHistorico");

  const filtrados = obterFiltrados();

  tabela.innerHTML = "";
  totalEl.textContent = filtrados.length;

  filtrados.forEach(p => {
    let statusClass = "status-pendente";
    if (p.status === "Chegou") statusClass = "status-chegou";
    if (p.status === "Cliente avisado") statusClass = "status-avisado";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Cliente">${p.cliente || "-"}</td>
      <td data-label="Contato">${p.contato || "-"}</td>
      <td data-label="Produto">${p.produto || "-"}</td>
      <td data-label="Cód. Interno">${p.codInterno || "-"}</td>
      <td data-label="Pedido">${p.dataPedido || "-"}</td>
      <td data-label="Chegada">${p.dataChegada || "-"}</td>
      <td data-label="Status" class="${statusClass}">${p.status || "-"}</td>
    `;
    tabela.appendChild(tr);
  });
}

/* =========================
   Filtros
========================= */
function bindFiltros() {
  ["buscaHistorico", "filtroStatusHistorico", "dataInicio", "dataFim"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderTabela);
    if (el) el.addEventListener("change", renderTabela);
  });
}

/* =========================
   Exportações
========================= */
function bindExport() {
  document.getElementById("btnExportCSV").onclick = exportarCSV;
  document.getElementById("btnPrintPDF").onclick = imprimirTabela;
}

function exportarCSV() {
  const dados = obterFiltrados();
  if (!dados.length) {
    notify.warning("Não há registros para exportar com os filtros atuais.");
    return;
  }

  const headers = ["Cliente","Contato","Produto","CodInterno","DataPedido","DataChegada","Status","Observacao"];
  const linhas = dados.map(p => ([
    p.cliente || "",
    p.contato || "",
    p.produto || "",
    p.codInterno || "",
    p.dataPedido || "",
    p.dataChegada || "",
    p.status || "",
    (p.observacao || "").replace(/\n/g, " ")
  ]));

  const csv = [
    headers.join(";"),
    ...linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `historico_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function imprimirTabela() {
  const tabela = document.getElementById("tabelaExport");
  if (!tabela) return;

  const win = window.open("", "_blank");
  const css = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h2 { margin-top: 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
      th { background: #f2f2f2; }
    </style>
  `;

  win.document.write(`
    <html>
      <head>
        <title>Histórico de Pedidos</title>
        ${css}
      </head>
      <body>
        <h2>Histórico de Pedidos</h2>
        ${tabela.outerHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

/* =========================
   Init
========================= */
renderHistorico();
