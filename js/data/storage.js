// js/data/storage.js (V2 - Fachada API + Fallback local)

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
    dataChegada: ""
  };
  pedidos.push(novo);
  saveLocal(pedidos);
  return novo;
}

function localUpdateStatus(id, status) {
  const pedidos = loadLocal();
  const p = pedidos.find(x => x.id === id);
  if (!p) return null;

  p.status = status;
  if (status === "Chegou") {
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

export async function updateStatus(id, status) {
  try {
    return await apiUpdateStatus(id, status);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localUpdateStatus(id, status);
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
