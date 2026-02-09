// js/data/api.js (V2 - Supabase)

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { getCurrentUser } from "./auth.js";

// ⚠️ Suas credenciais (publishable/anon key é OK no front)
const SUPABASE_URL = "https://ljhgeoetyvhbafewnmgw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85mJLqObjWFtZLFhefNm3w_b7o7sqZX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ajuste o nome da tabela se necessário
const TABLE = "orders"; // ou "pedidos"

// Helpers
function mapRowToPedido(row) {
  return {
    id: row.id,
    cliente: row.cliente,
    contato: row.contato,
    produto: row.produto,
    codInterno: row.cod_interno || "",
    observacao: row.observacao || "",
    status: row.status,
    dataPedido: row.data_pedido,
    dataChegada: row.data_chegada || ""
  };
}

function mapPedidoToRow(p) {
  return {
    cliente: p.cliente,
    contato: p.contato,
    produto: p.produto,
    cod_interno: p.codInterno || null,
    observacao: p.observacao || null,
    status: p.status,
    data_pedido: p.dataPedido,
    data_chegada: p.dataChegada || null
  };
}

export async function apiGetPedidos() {
  const user = await getCurrentUser();

  let query = supabase.from(TABLE).select("*").order("data_pedido", { ascending: false });

  if (user) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapRowToPedido);
}

export async function apiAddPedido(pedido) {
  const user = await getCurrentUser();

  const row = mapPedidoToRow({
    ...pedido,
    status: "Pendente",
    dataPedido: new Date().toISOString().slice(0, 10),
    dataChegada: ""
  });

  if (user) row.user_id = user.id;

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) throw error;

  return mapRowToPedido(data);
}

export async function apiUpdateStatus(id, status) {
  const patch = {
    status,
    data_chegada: status === "Chegou" ? new Date().toISOString().slice(0, 10) : null
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToPedido(data);
}

export async function apiRemovePedido(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}
