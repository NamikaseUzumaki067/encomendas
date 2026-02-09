// js/pages/dashboard.js (V2 - compatível com API async + ETA/contagem regressiva)
import { renderLayout } from "../core/layout.js";
import { getPedidos, addPedido, updateStatus, removePedido } from "../data/storage.js";
import { desenharGrafico } from "../chart.js";

let ticker = null;

async function renderDashboard() {
  // Monta o layout base e marca menu ativo
  renderLayout("dashboard");

  // Título da página
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = "📦 Dashboard";

  // Estrutura da página
  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <!-- FAB -->
    <button id="btnAbrirModal" class="fab btn-primary" aria-label="Nova Encomenda">+</button>

    <div class="card">
      <div class="contador">
        <span class="badge b-pendente" id="badgePendentes">
          <i class="fa-solid fa-clock icon-pendente"></i>
          Pendentes: <strong id="countPendentes">0</strong>
        </span>
        <span class="badge b-chegou" id="badgeChegaram">
          <i class="fa-solid fa-box icon-chegou"></i>
          Chegaram: <strong id="countChegaram">0</strong>
        </span>
        <span class="badge b-avisado" id="badgeAvisados">
          <i class="fa-solid fa-phone icon-avisado"></i>
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

    <!-- MODAL: Nova Encomenda -->
    <div class="modal-backdrop" id="modalBackdrop" aria-hidden="true">
      <div class="modal" role="dialog" aria-modal="true">
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

    <!-- MODAL: Detalhes -->
    <div class="modal-backdrop" id="detalhesBackdrop" aria-hidden="true">
      <div class="modal" role="dialog" aria-modal="true">
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

  // Filtros
  document.getElementById("busca").addEventListener("input", renderTabela);
  document.getElementById("filtroStatus").addEventListener("change", renderTabela);

  // Modais
  bindModais();

  // Render inicial
  await refresh();

  // Ticker de atualização da ETA (a cada 60s)
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    // Re-renderiza só a tabela para atualizar ETA
    renderTabela();
  }, 60 * 1000);
}

let lastCounts = { p: 0, c: 0, a: 0 };

async function atualizarContadores() {
  const pedidos = await getPedidos();

  const pendentes = pedidos.filter(p => p.status === "Pendente").length;
  const chegaram = pedidos.filter(p => p.status === "Chegou").length;
  const avisados = pedidos.filter(p => p.status === "Cliente avisado").length;

  const elP = document.getElementById("countPendentes");
  const elC = document.getElementById("countChegaram");
  const elA = document.getElementById("countAvisados");

  if (!elP || !elC || !elA) return;

  elP.textContent = pendentes;
  elC.textContent = chegaram;
  elA.textContent = avisados;

  pulseIfChanged("badgePendentes", pendentes, lastCounts.p);
  pulseIfChanged("badgeChegaram", chegaram, lastCounts.c);
  pulseIfChanged("badgeAvisados", avisados, lastCounts.a);

  lastCounts = { p: pendentes, c: chegaram, a: avisados };
}

function pulseIfChanged(badgeId, novo, antigo) {
  if (novo !== antigo) {
    const el = document.getElementById(badgeId);
    if (el) {
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  }
}

async function renderTabela() {
  const pedidos = await getPedidos();
  const tabela = document.getElementById("tabelaPedidos");
  const busca = document.getElementById("busca").value.toLowerCase();
  const filtroStatus = document.getElementById("filtroStatus").value;

  tabela.innerHTML = "";

  pedidos.forEach(p => {
    if (busca && !p.cliente.toLowerCase().includes(busca) && !p.produto.toLowerCase().includes(busca)) return;
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return;

    let statusClass = "status-pendente";
    if (p.status === "Chegou") statusClass = "status-chegou";
    if (p.status === "Cliente avisado") statusClass = "status-avisado";

    const eta = formatETA(p.dataChegada);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Cliente">${p.cliente}</td>
      <td data-label="Contato">${p.contato || "-"}</td>
      <td data-label="Produto">${p.produto}</td>
      <td data-label="Cód. Interno">${p.codInterno || "-"}</td>
      <td data-label="Pedido">${p.dataPedido || "-"}</td>
      <td data-label="Chegada">${p.dataChegada || "-"}</td>
      <td data-label="ETA">${eta}</td>
      <td data-label="Status" class="${statusClass}">${p.status}</td>
      <td data-label="Ações" class="acoes">
        <button class="btn-secondary" data-detalhes="${p.id}">Detalhes</button>
        <button class="btn-secondary" data-definir="${p.id}">Definir Chegada</button>
        <button data-chegou="${p.id}">Chegou</button>
        <button class="btn-secondary" data-avisado="${p.id}">Avisado</button>
        <button class="btn-danger" data-excluir="${p.id}">Excluir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });

  // Liga ações
  tabela.querySelectorAll("[data-chegou]").forEach(btn =>
    btn.onclick = async () => { await updateStatus(+btn.dataset.chegou, "Chegou"); await refresh(); }
  );
  tabela.querySelectorAll("[data-avisado]").forEach(btn =>
    btn.onclick = async () => { await updateStatus(+btn.dataset.avisado, "Cliente avisado"); await refresh(); }
  );
  tabela.querySelectorAll("[data-excluir]").forEach(btn =>
    btn.onclick = async () => {
      if (confirm("Deseja remover este pedido?")) {
        await removePedido(+btn.dataset.excluir);
        await refresh();
      }
    }
  );
  tabela.querySelectorAll("[data-detalhes]").forEach(btn =>
    btn.onclick = () => abrirDetalhes(+btn.dataset.detalhes)
  );
  tabela.querySelectorAll("[data-definir]").forEach(btn =>
    btn.onclick = () => definirChegada(+btn.dataset.definir)
  );
}

async function refresh() {
  await atualizarContadores();
  await desenharGrafico();
  await renderTabela();
}

/* ===========================
   MODAIS
   =========================== */

function bindModais() {
  const btnAbrir = document.getElementById("btnAbrirModal");
  const backdrop = document.getElementById("modalBackdrop");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const btnSalvar = document.getElementById("btnSalvarModal");

  btnAbrir.addEventListener("click", () => abrirModal(backdrop));
  btnCancelar.addEventListener("click", () => fecharModal(backdrop));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) fecharModal(backdrop);
  });

  btnSalvar.addEventListener("click", salvarNovaEncomenda);

  const btnFecharDetalhes = document.getElementById("btnFecharDetalhes");
  const detalhesBackdrop = document.getElementById("detalhesBackdrop");
  btnFecharDetalhes.addEventListener("click", () => fecharModal(detalhesBackdrop));
  detalhesBackdrop.addEventListener("click", (e) => {
    if (e.target === detalhesBackdrop) fecharModal(detalhesBackdrop);
  });
}

function abrirModal(el) {
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}

function fecharModal(el) {
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

async function salvarNovaEncomenda() {
  const cliente = document.getElementById("modalCliente").value.trim();
  const contato = document.getElementById("modalContato").value.trim();
  const produto = document.getElementById("modalProduto").value.trim();
  const codInterno = document.getElementById("modalCodInterno").value.trim();
  const observacao = document.getElementById("modalObservacao").value.trim();

  if (!cliente || !contato || !produto) {
    alert("Preencha Cliente, Contato e Produto.");
    return;
  }

  // Cria pedido sem data de chegada
  const novo = await addPedido({ cliente, contato, produto, codInterno, observacao });

  // Limpa campos
  document.getElementById("modalCliente").value = "";
  document.getElementById("modalContato").value = "";
  document.getElementById("modalProduto").value = "";
  document.getElementById("modalCodInterno").value = "";
  document.getElementById("modalObservacao").value = "";

  fecharModal(document.getElementById("modalBackdrop"));

  // Pergunta se quer definir a data agora
  const quer = confirm("Deseja definir a data de chegada agora?");
  if (quer) {
    // tenta pegar o id retornado; se não vier, o usuário pode usar o botão na tabela
    if (novo?.id) {
      await definirChegada(novo.id);
    } else {
      alert("Pedido criado. Você pode definir a data de chegada pelo botão 'Definir Chegada' na lista.");
    }
  }

  await refresh();
}

async function abrirDetalhes(id) {
  const pedidos = await getPedidos();
  const p = pedidos.find(x => x.id === id);
  if (!p) return;

  document.getElementById("detCliente").textContent = p.cliente || "-";
  document.getElementById("detContato").textContent = p.contato || "-";
  document.getElementById("detProduto").textContent = p.produto || "-";
  document.getElementById("detCodInterno").textContent = p.codInterno || "-";
  document.getElementById("detObservacao").textContent = p.observacao || "-";
  document.getElementById("detDataPedido").textContent = p.dataPedido || "-";
  document.getElementById("detDataChegada").textContent = p.dataChegada || "-";
  document.getElementById("detStatus").textContent = p.status || "-";

  abrirModal(document.getElementById("detalhesBackdrop"));
}

/* ===========================
   DATA DE CHEGADA + ETA
   =========================== */

async function definirChegada(id) {
  const input = prompt("Informe a data de chegada (YYYY-MM-DD):");
  if (!input) return;

  // Validação simples de data
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    alert("Data inválida. Use o formato YYYY-MM-DD.");
    return;
  }

  // Mantém o status atual, só define/atualiza a data de chegada
  const pedidos = await getPedidos();
  const p = pedidos.find(x => x.id === id);
  const statusAtual = p?.status || "Pendente";

  // Chama updateStatus com a data (3º parâmetro)
  await updateStatus(id, statusAtual, input);
  await refresh();
}

function formatETA(dataChegada) {
  if (!dataChegada) return "-";

  const agora = new Date();
  const alvo = new Date(dataChegada + "T00:00:00");
  const diffMs = alvo - agora;

  const oneDay = 24 * 60 * 60 * 1000;

  if (diffMs < -oneDay) return "Atrasado";
  if (Math.abs(diffMs) < oneDay) return "Hoje";

  const dias = Math.ceil(diffMs / oneDay);
  if (dias > 0) return `Em ${dias} dia(s)`;
  return "Atrasado";
}

// Inicializa a página
renderDashboard();
