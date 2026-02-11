// js/data/api.js
import { supabase } from "./storage.js";
import { getCurrentUser } from "./auth.js";

const TABLE = "orders";

/* ===============================
   Helpers
================================ */

function mapRow(row) {
  return {
    id: row.id,
    cliente: row.cliente,
    contato: row.contato,
    produto: row.produto,
    codInterno: row.cod_interno,
    observacao: row.observacao,
    status: row.status,
    dataPedido: row.data_pedido,
    dataChegada: row.data_chegada,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function handleError(error, context = "Erro na API") {
  console.error(context, error);
  throw new Error(error?.message || context);
}

/* ===============================
   READ
   - Por padrão: retorna TODOS os pedidos visíveis ao usuário (depende da RLS)
   - Já preparado para filtros no futuro
================================ */

export async function getPedidos({ orderBy = "data_pedido", desc = true } = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order(orderBy, { ascending: !desc });

  if (error) handleError(error, "Erro ao buscar pedidos");

  return Array.isArray(data) ? data.map(mapRow) : [];
}

/* ===============================
   CREATE
================================ */

export async function addPedido(pedido) {
  if (!pedido || !pedido.cliente || !pedido.contato || !pedido.produto) {
    throw new Error("Dados inválidos para criar pedido.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const payload = {
    cliente: pedido.cliente,
    contato: pedido.contato,
    produto: pedido.produto,
    cod_interno: pedido.codInterno || null,
    observacao: pedido.observacao || null,
    status: "Pendente",
    data_pedido: new Date().toISOString().slice(0, 10),
    user_id: user.id, // quem criou
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

  const payload = {};

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.dataChegada !== undefined) payload.data_chegada = updates.dataChegada;
  if (updates.cliente !== undefined) payload.cliente = updates.cliente;
  if (updates.contato !== undefined) payload.contato = updates.contato;
  if (updates.produto !== undefined) payload.produto = updates.produto;
  if (updates.codInterno !== undefined) payload.cod_interno = updates.codInterno;
  if (updates.observacao !== undefined) payload.observacao = updates.observacao;

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id);

  if (error) handleError(error, "Erro ao atualizar pedido");
}

/* Atalho compatível com seu código atual */
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
