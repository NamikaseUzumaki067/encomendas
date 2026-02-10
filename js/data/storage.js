// js/data/storage.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔐 Supabase (centralizado aqui)
const SUPABASE_URL = "https://ljhgeoetyvhbafewnmgw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85mJLqObjWFtZLFhefNm3w_b7o7sqZX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import {
  apiGetPedidos,
  apiCreatePedido,
  apiUpdatePedido,
  apiDeletePedido
} from "./api.js";

const KEY = "pedidos_v2_fallback";

/* ===============================
   Fallback local (offline)
================================ */
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

function localCreatePedido(data) {
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

function localUpdatePedido(id, updates) {
  const pedidos = loadLocal();
  const p = pedidos.find(x => x.id === id);
  if (!p) return null;

  Object.assign(p, updates);
  saveLocal(pedidos);
  return p;
}

function localDeletePedido(id) {
  let pedidos = loadLocal();
  pedidos = pedidos.filter(p => p.id !== id);
  saveLocal(pedidos);
}

/* ===============================
   API pública usada pelo app
================================ */
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
    return await apiCreatePedido(data);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localCreatePedido(data);
  }
}

export async function updatePedido(id, updates) {
  try {
    return await apiUpdatePedido(id, updates);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localUpdatePedido(id, updates);
  }
}

export async function removePedido(id) {
  try {
    return await apiDeletePedido(id);
  } catch (e) {
    console.warn("API indisponível, usando fallback local:", e.message);
    return localDeletePedido(id);
  }
}
