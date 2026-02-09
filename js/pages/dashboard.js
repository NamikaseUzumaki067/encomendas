// js/pages/dashboard.js (V2 - Status por select + Data por calendário + ETA + Ações alinhadas)
import { renderLayout } from "../core/layout.js";
import { getPedidos, addPedido, updateStatus, removePedido } from "../data/storage.js";
import { desenharGrafico } from "../chart.js";

let ticker = null;

async function renderDashboard() {
  renderLayout("dashboard");

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = "📦 Dashboard";

  const content = document.getElementById("pageContent");
  content.innerHTML = `
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

    <!-- MODAIS (mantidos iguais) -->
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

  document.getElementById("busca").addEventListener("input", renderTabela);
  document.getElementById("filtroStatus").addEventListener("change", renderTabela);

  bindModais();
  await refresh();

  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => renderTabela(), 60 * 1000);
}

let lastCounts = { p: 0, c: 0, a: 0 };

async function atualizarContadores() {
  const pedidos = await getPedidos();
  const pendentes = pedidos.filter(p => p.status === "Pendente").length;
  const chegaram = pedidos.filter(p => p.status === "Chegou").length;
  const avisados = pedidos.filter(p => p.status === "Cliente avisado").length;

  document.getElementById("countPendentes").textContent = pendentes;
  document.getElementById("countChegaram").textContent = chegaram;
  document.getElementById("countAvisados").textContent = avisados;

  lastCounts = { p: pendentes, c: chegaram, a: avisados };
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

    const eta = formatETA(p.dataChegada);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.cliente}</td>
      <td>${p.contato || "-"}</td>
      <td>${p.produto}</td>
      <td>${p.codInterno || "-"}</td>
      <td>${p.dataPedido || "-"}</td>
      <td><input type="date" class="input-date" data-date="${p.id}" value="${p.dataChegada || ""}"></td>
      <td>${eta}</td>
      <td>
        <select class="select-status" data-status="${p.id}">
          <option value="Pendente" ${p.status === "Pendente" ? "selected" : ""}>Pendente</option>
          <option value="Chegou" ${p.status === "Chegou" ? "selected" : ""}>Chegou</option>
          <option value="Cliente avisado" ${p.status === "Cliente avisado" ? "selected" : ""}>Cliente avisado</option>
        </select>
      </td>
      <td>
        <div class="acoes-wrap" style="display:flex; gap:8px; align-items:center; flex-wrap:nowrap;">
          <button class="btn-secondary" data-detalhes="${p.id}">Detalhes</button>
          <button class="btn-danger" data-excluir="${p.id}">Excluir</button>
        </div>
      </td>
    `;
    tabela.appendChild(tr);
  });

  tabela.querySelectorAll("[data-status]").forEach(sel => {
    sel.addEventListener("change", async () => {
      const id = +sel.dataset.status;
      const novoStatus = sel.value;
      const dateInput = tabela.querySelector(`[data-date="${id}"]`);
      const novaData = dateInput ? dateInput.value || null : null;
      await updateStatus(id, novoStatus, novaData);
      await refresh();
    });
  });

  tabela.querySelectorAll("[data-date]").forEach(inp => {
    inp.addEventListener("change", async () => {
      const id = +inp.dataset.date;
      const novaData = inp.value || null;
      const sel = tabela.querySelector(`[data-status="${id}"]`);
      const statusAtual = sel ? sel.value : "Pendente";
      await updateStatus(id, statusAtual, novaData);
      await refresh();
    });
  });

  tabela.querySelectorAll("[data-detalhes]").forEach(btn =>
    btn.onclick = () => abrirDetalhes(+btn.dataset.detalhes)
  );
  tabela.querySelectorAll("[data-excluir]").forEach(btn =>
    btn.onclick = async () => {
      if (confirm("Deseja remover este pedido?")) {
        await removePedido(+btn.dataset.excluir);
        await refresh();
      }
    }
  );
}

async function refresh() {
  await atualizarContadores();
  await desenharGrafico();
  await renderTabela();
}

/* ===== Modais e utilidades (mantidos) ===== */

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
    alert("Preencha Cliente, Contato e Produto.");
    return;
  }

  await addPedido({ cliente, contato, produto, codInterno, observacao });
  modalCliente.value = modalContato.value = modalProduto.value = modalCodInterno.value = modalObservacao.value = "";
  fecharModal(modalBackdrop);
  await refresh();
}

async function abrirDetalhes(id) {
  const pedidos = await getPedidos();
  const p = pedidos.find(x => x.id === id);
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

function formatETA(dataChegada) {
  if (!dataChegada) return "-";
  const agora = new Date();
  const alvo = new Date(dataChegada + "T00:00:00");
  const diffMs = alvo - agora;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diffMs < -oneDay) return "Atrasado";
  if (Math.abs(diffMs) < oneDay) return "Hoje";

  const dias = Math.ceil(diffMs / oneDay);
  return dias > 0 ? `Em ${dias} dia(s)` : "Atrasado";
}

renderDashboard();
