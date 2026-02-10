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
  };
}

/* ===============================
   READ
================================ */
export async function getPedidos() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("data_pedido", { ascending: false });

  if (error) throw error;
  return data.map(mapRow);
}

/* ===============================
   CREATE
================================ */
export async function addPedido(pedido) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      cliente: pedido.cliente,
      contato: pedido.contato,
      produto: pedido.produto,
      cod_interno: pedido.codInterno || null,
      observacao: pedido.observacao || null,
      status: "Pendente",
      data_pedido: new Date().toISOString().slice(0, 10),
      user_id: user?.id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

/* ===============================
   UPDATE STATUS / CHEGADA
================================ */
export async function updateStatus(id, status, dataChegada = null) {
  const updates = { status };
  if (dataChegada) updates.data_chegada = dataChegada;

  const { error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

/* ===============================
   DELETE
================================ */
export async function removePedido(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
