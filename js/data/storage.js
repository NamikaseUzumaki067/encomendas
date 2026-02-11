// js/data/storage.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===============================
   Configuração
================================ */

// ⚠️ Em produção idealmente isso vem de variáveis de ambiente ou arquivo de config
const SUPABASE_CONFIG = {
  url: "https://ljhgeoetyvhbafewnmgw.supabase.co",
  anonKey: "sb_publishable_85mJLqObjWFtZLFhefNm3w_b7o7sqZX",
};

function validateConfig(config) {
  if (!config?.url || !config?.anonKey) {
    throw new Error("Configuração do Supabase inválida. Verifique URL e ANON KEY.");
  }
}

/* ===============================
   Client Singleton
================================ */

let supabaseClient = null;

function createSupabaseClient() {
  validateConfig(SUPABASE_CONFIG);

  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Retorna a instância única do Supabase para a aplicação inteira
 */
export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Export padrão para manter compatibilidade com o código atual
 */
export const supabase = getSupabase();
