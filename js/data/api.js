// js/data/api.js
import { supabase } from "./storage.js";
import { getCurrentUser } from "./auth.js";

const TABLE = "orders";

/**
 * Converte linha do Supabase para objeto usado no front
 */
function mapRowToPedido(row) {
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
    updatedAt: row.updated_at,
  };
}

/**
 * 🔍 BUSCAR PEDIDOS
 * Opção 01: TODOS os usuários autenticados veem TODOS os pedidos
 */
export async function apiGetPedidos() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("data_pedido", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRowToPedido);
}

/**
 * ➕ CRIAR PEDIDO
 * user_id é salvo para auditoria
 */
export async function apiCreatePedido(pedido) {
  const user = await getCurrentUser();

  const row = {
    cliente: pedido.cliente,
    contato: pedido.contato,
    produto: pedido.produto,
    cod_interno: pedido.codInterno || null,
    observacao: pedido.observacao || null,
    status: pedido.status || "Pendente",
    data_pedido: pedido.dataPedido || new Date().toISOString().slice(0, 10),
    data_chegada: pedido.dataChegada || null,
    user_id: user ? user.id : null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw error;

  return mapRowToPedido(data);
}

/**
 * ✏️ ATUALIZAR PEDIDO
 */
export async function apiUpdatePedido(id, updates) {
  const row = {
    cliente: updates.cliente,
    contato: updates.contato,
    produto: updates.produto,
    cod_interno: updates.codInterno,
    observacao: updates.observacao,
    status: updates.status,
    data_chegada: updates.dataChegada,
  };

  // remove undefined
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapRowToPedido(data);
}

/**
 * ❌ EXCLUIR PEDIDO
 */
export async function apiDeletePedido(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
