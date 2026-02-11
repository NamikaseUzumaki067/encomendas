// js/data/auth.js
import { supabase } from "./storage.js";

// Domínio corporativo padrão (pode virar config no futuro)
const DOMAIN = "@empresa.local";

/* ===============================
   Helpers
================================ */

function normalizeUsername(username) {
  const u = (username || "").trim().toLowerCase();
  if (!u) throw new Error("Usuário inválido.");
  return u;
}

function toEmail(username) {
  const u = normalizeUsername(username);
  if (u.includes("@")) return u;
  return `${u}${DOMAIN}`;
}

function handleAuthError(error, fallbackMessage) {
  console.error("Auth error:", error);
  throw new Error(error?.message || fallbackMessage || "Erro de autenticação.");
}

/* ===============================
   Auth API
================================ */

/**
 * 🔐 Login usando usuário + senha
 */
export async function loginWithUsername(username, password) {
  if (!username || !password) {
    throw new Error("Informe usuário e senha.");
  }

  const email = toEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) handleAuthError(error, "Falha ao autenticar.");

  return data?.user || null;
}

/**
 * 🆕 Registro de usuário com nome completo
 */
export async function registerWithProfile({ nome, usuario, senha }) {
  if (!nome || !usuario || !senha) {
    throw new Error("Preencha todos os campos para cadastro.");
  }

  const email = toEmail(usuario);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        full_name: nome
      }
    }
  });

  if (error) handleAuthError(error, "Erro ao criar conta.");

  return data?.user || null;
}

/**
 * 🚪 Logout
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) handleAuthError(error, "Erro ao sair da sessão.");
}

/**
 * 👤 Usuário logado (ou null)
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("Erro ao obter usuário atual:", error);
      return null;
    }
    return data?.user || null;
  } catch (e) {
    console.warn("Falha ao obter usuário atual:", e);
    return null;
  }
}

/**
 * 🔒 Garante que há um usuário logado
 * Lança erro se não houver
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }
  return user;
}
