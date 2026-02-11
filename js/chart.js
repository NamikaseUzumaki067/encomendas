// js/chart.js
import { getPedidos } from "./data/api.js";
import { notify } from "./core/ui.js";

let lastData = null;
let resizeBound = false;

/**
 * Desenha o gráfico de pedidos de hoje.
 * Se `pedidos` for passado, usa esses dados (evita novo fetch).
 * Caso contrário, busca na API.
 */
export async function desenharGrafico(pedidos = null) {
  const canvas = document.getElementById("grafico");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  try {
    let lista = pedidos;

    if (!Array.isArray(lista)) {
      lista = await getPedidos();
    }

    lastData = Array.isArray(lista) ? lista : [];

    render(ctx, canvas, lastData);

    // Redesenha ao redimensionar a tela (só registra uma vez)
    if (!resizeBound) {
      window.addEventListener("resize", () => {
        if (lastData) render(ctx, canvas, lastData);
      });
      resizeBound = true;
    }
  } catch (e) {
    console.error("Erro ao desenhar gráfico:", e);
    notify.error("Erro ao carregar gráfico.");
    clearCanvas(ctx, canvas);
    drawEmptyState(ctx, canvas, "Erro ao carregar dados");
  }
}

/* =========================
   Render Core
========================= */
function render(ctx, canvas, pedidos) {
  clearCanvas(ctx, canvas);

  const hoje = new Date().toISOString().slice(0, 10);
  const deHoje = pedidos.filter(p => p.dataPedido === hoje);

  const pendentes = deHoje.filter(p => p.status === "Pendente").length;
  const chegaram = deHoje.filter(p => p.status === "Chegou").length;
  const avisados = deHoje.filter(p => p.status === "Cliente avisado").length;

  const valores = [pendentes, chegaram, avisados];
  const labels = ["Pendentes", "Chegaram", "Avisados"];

  const styles = getComputedStyle(document.body);
  const cores = [
    styles.getPropertyValue("--warning").trim() || "#f59e0b",
    styles.getPropertyValue("--success").trim() || "#16a34a",
    styles.getPropertyValue("--info").trim() || "#2563eb",
  ];

  const total = valores.reduce((a, b) => a + b, 0);

  if (total === 0) {
    drawEmptyState(ctx, canvas, "Nenhum pedido hoje");
    return;
  }

  desenharBarras(ctx, canvas, valores, labels, cores);
}

/* =========================
   Drawing Helpers
========================= */
function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawEmptyState(ctx, canvas, text) {
  ctx.fillStyle = "#999";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function desenharBarras(ctx, canvas, valores, labels, cores) {
  const padding = 40;
  const larguraDisponivel = canvas.width - padding * 2;
  const alturaDisponivel = canvas.height - padding * 2;

  const maxValor = Math.max(1, ...valores);
  const gap = 20;
  const larguraBarra = larguraDisponivel / valores.length - gap;

  // Eixos
  ctx.strokeStyle = "#888";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  valores.forEach((valor, i) => {
    const x = padding + i * (larguraBarra + gap) + gap;
    const alturaBarra = (valor / maxValor) * (alturaDisponivel - 20);
    const y = canvas.height - padding - alturaBarra;

    // Barra
    ctx.fillStyle = cores[i];
    ctx.fillRect(x, y, larguraBarra, alturaBarra);

    // Valor em cima da barra
    ctx.fillStyle = "#999";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(valor, x + larguraBarra / 2, y - 6);

    // Label embaixo
    ctx.fillStyle = "#999";
    ctx.font = "12px Arial";
    ctx.fillText(labels[i], x + larguraBarra / 2, canvas.height - padding + 16);
  });

  // Título
  ctx.fillStyle = "#999";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Pedidos de Hoje", canvas.width / 2, 24);
}
