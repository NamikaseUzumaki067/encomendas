// js/chart.js (V2 - compatível com API async)
import { getPedidos } from "./data/storage.js";

let chartCtx = null;

/**
 * Desenha um gráfico simples no canvas #grafico
 * Mostra a quantidade de pedidos DE HOJE por status:
 * - Pendente
 * - Chegou
 * - Cliente avisado
 */
export async function desenharGrafico() {
  const canvas = document.getElementById("grafico");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  chartCtx = ctx;

  // Limpa o canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Agora buscamos os pedidos de forma ASSÍNCRONA
  const pedidos = await getPedidos();

  // Garante que sempre trabalhamos com array
  const lista = Array.isArray(pedidos) ? pedidos : [];

  // Data de hoje no formato YYYY-MM-DD
  const hoje = new Date().toISOString().slice(0, 10);

  const deHoje = lista.filter(p => p.dataPedido === hoje);

  const pendentes = deHoje.filter(p => p.status === "Pendente").length;
  const chegaram = deHoje.filter(p => p.status === "Chegou").length;
  const avisados = deHoje.filter(p => p.status === "Cliente avisado").length;

  const valores = [pendentes, chegaram, avisados];
  const labels = ["Pendentes", "Chegaram", "Avisados"];
  const cores = ["#f59e0b", "#16a34a", "#2563eb"];

  desenharBarras(ctx, canvas, valores, labels, cores);
}

function desenharBarras(ctx, canvas, valores, labels, cores) {
  const padding = 40;
  const larguraDisponivel = canvas.width - padding * 2;
  const alturaDisponivel = canvas.height - padding * 2;

  const maxValor = Math.max(1, ...valores);
  const larguraBarra = larguraDisponivel / valores.length - 20;

  // Eixos
  ctx.strokeStyle = "#888";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  valores.forEach((valor, i) => {
    const x = padding + i * (larguraBarra + 20) + 20;
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
