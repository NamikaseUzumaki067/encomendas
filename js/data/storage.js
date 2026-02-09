// js/data/storage.js (V2 - Fachada API + Fallback local com data de chegada)

import { apiGetPedidos, apiAddPedido, apiUpdateStatus, apiRemovePedido } from "./api.js";

const KEY = "pedidos_v2_fallback";

// ===== Fallback local =====
function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal(pedidos) {
  localStorage.setItem(KEY, JSON.stringify(pedidos));
}

function localAddPedido(data) {
  const pedidos = loadLocal();
  const novo = {
    id: Date.now(),
    cliente: data.cliente,
    contato: data.contato,
    produto: data.produto,
    codInterno: data.codInterno || "",
    observacao: data.observacao || "",
    status: "Pendente",
    dataPedido: new Date().toISOString().slice(0, 10),
    dataChegada: data.dataChegada || ""
  };
  pedidos.push(novo);
  saveLocal(pedidos);
  return novo;
}

function localUpdateStatus(id, status, dataChegada = null) {
  const pedidos = loadLocal();
  const p = pedidos.find(x => x.id === id);
  if (!p) return null;

  if (status) {
    p.status = status;
  }

  // Se veio data, atualiza. Se veio null, mantém o que já existe.
  if (typeof dataChegada === "string") {
    p.dataChegada = dataChegada;
  }

  // Se marcou como "Chegou" e não tem data, seta hoje
  if (p.status === "Chegou" && !p.dataChegada) {
    p.dataChegada = new Date().toISOString().slice(0, 10);
  }

  saveLocal(pedidos);
  return p;
}

function localRemovePedido(id) {
  let pedidos = loadLocal();
  pedidos = pedidos.filter(p => p.id !== id);
  saveLocal(pedidos);
}

// ===== API pública =====
export async function getPedidos() {
  try {
    return await apiGetPedidos();
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return loadLocal();
  }
}

export async function addPedido(data) {
  try {
    return await apiAddPedido(data);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localAddPedido(data);
  }
}

/**
 * Atualiza status e/ou data de chegada
 * @param {number} id
 * @param {string} status
 * @param {string|null} dataChegada (YYYY-MM-DD ou null)
 */
export async function updateStatus(id, status, dataChegada = null) {
  try {
    return await apiUpdateStatus(id, status, dataChegada);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localUpdateStatus(id, status, dataChegada);
  }
}

export async function removePedido(id) {
  try {
    return await apiRemovePedido(id);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localRemovePedido(id);
  }
}
