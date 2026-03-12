// js/data/storage.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===============================
   Configuração
================================ */

/**
 * Configure estas variáveis em um arquivo carregado antes do app, por exemplo:
 *
 * <script>
 *   window.__ENV__ = {
 *     SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
 *     SUPABASE_ANON_KEY: "SUA_ANON_KEY"
 *   };
 * </script>
 */

function getEnv() {
  const env = window.__ENV__ || {};

  return {
    url: env.SUPABASE_URL || "",
    anonKey: env.SUPABASE_ANON_KEY || "",
  };
}

function validateConfig(config) {
  if (!config.url || !config.anonKey) {
    throw new Error(
      "Supabase não configurado. Defina window.__ENV__.SUPABASE_URL e window.__ENV__.SUPABASE_ANON_KEY."
    );
  }
}

/* ===============================
   Client Singleton
================================ */

let supabaseClient = null;

function createSupabaseClient() {
  const config = getEnv();
  validateConfig(config);

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

export const supabase = getSupabase();