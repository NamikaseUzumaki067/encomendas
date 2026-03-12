// js/data/api.js
import { supabase } from "./storage.js";
import { getCurrentUser, getMyProfile } from "./auth.js";

const TABLE = "orders";
const VALID_STATUS = ["Pendente", "Chegou", "Cliente avisado"];

/* ===============================
   Helpers
================================ */

function handleError(error, context = "Erro na API") {
  console.error(context, error);
  throw new Error(error?.message || context);
}

function mapRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    cliente: row.cliente,
    contato: row.contato,
    produto: row.produto,
    codInterno: row.cod_interno,
    observacao: row.observacao,
    status: row.status,
    dataPedido: row.data_pedido,
    dataChegada: row.data_chegada,
    createdAt: row.created_at,
  };
}

function sanitizeText(value) {
  const v = String(value || "").trim();
  return v || null;
}

function normalizeStatus(status) {
  const value = String(status || "").trim();
  if (!value) return "Pendente";

  if (!VALID_STATUS.includes(value)) {
    throw new Error(`Status inválido. Use: ${VALID_STATUS.join(", ")}`);
  }

  return value;
}

function normalizeDateOnly(value) {
  if (!value) return null;

  const v = String(value).trim();

  if (!v) return null;

  // Aceita apenas YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new Error("Data inválida. Use o formato YYYY-MM-DD.");
  }

  return v;
}

/* ===============================
   READ
================================ */

export async function getPedidos({ orderBy = "data_pedido", desc = true } = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order(orderBy, { ascending: !desc });

  if (error) handleError(error, "Erro ao buscar pedidos");

  return Array.isArray(data) ? data.map(mapRow) : [];
}

export async function getPedidoById(id) {
  if (!id) throw new Error("ID inválido.");

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleError(error, "Erro ao buscar pedido");

  return mapRow(data);
}

/* ===============================
   CREATE
================================ */

export async function addPedido(pedido) {
  if (!pedido) {
    throw new Error("Dados inválidos para criar pedido.");
  }

  const cliente = sanitizeText(pedido.cliente);
  const contato = sanitizeText(pedido.contato);
  const produto = sanitizeText(pedido.produto);
  const codInterno = sanitizeText(pedido.codInterno);
  const observacao = sanitizeText(pedido.observacao);

  if (!cliente || !contato || !produto) {
    throw new Error("Preencha Cliente, Contato e Produto.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const profile = await getMyProfile();
  if (!profile?.companyId) {
    throw new Error("Seu usuário não está vinculado a nenhuma empresa.");
  }

  const payload = {
    company_id: profile.companyId,
    user_id: user.id,
    cliente,
    contato,
    produto,
    cod_interno: codInterno,
    observacao,
    status: "Pendente",
    data_pedido: new Date().toISOString().slice(0, 10),
    data_chegada: normalizeDateOnly(pedido.dataChegada),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) handleError(error, "Erro ao criar pedido");

  return mapRow(data);
}

/* ===============================
   UPDATE
================================ */

export async function updatePedido(id, updates = {}) {
  if (!id) throw new Error("ID inválido para atualização.");
  if (!updates || typeof updates !== "object") {
    throw new Error("Atualizações inválidas.");
  }

  const payload = {};

  if (updates.status !== undefined) {
    payload.status = normalizeStatus(updates.status);
  }

  if (updates.dataChegada !== undefined) {
    payload.data_chegada = normalizeDateOnly(updates.dataChegada);
  }

  if (updates.cliente !== undefined) {
    const cliente = sanitizeText(updates.cliente);
    if (!cliente) throw new Error("Cliente inválido.");
    payload.cliente = cliente;
  }

  if (updates.contato !== undefined) {
    const contato = sanitizeText(updates.contato);
    if (!contato) throw new Error("Contato inválido.");
    payload.contato = contato;
  }

  if (updates.produto !== undefined) {
    const produto = sanitizeText(updates.produto);
    if (!produto) throw new Error("Produto inválido.");
    payload.produto = produto;
  }

  if (updates.codInterno !== undefined) {
    payload.cod_interno = sanitizeText(updates.codInterno);
  }

  if (updates.observacao !== undefined) {
    payload.observacao = sanitizeText(updates.observacao);
  }

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id);

  if (error) handleError(error, "Erro ao atualizar pedido");
}

export async function updateStatus(id, status, dataChegada = null) {
  return updatePedido(id, { status, dataChegada });
}

/* ===============================
   DELETE
================================ */

export async function removePedido(id) {
  if (!id) throw new Error("ID inválido para exclusão.");

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) handleError(error, "Erro ao remover pedido");
}