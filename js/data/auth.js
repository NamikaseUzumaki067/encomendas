// js/data/auth.js (V2 - Supabase Auth)

import { supabase } from "./api.js";

// Domínio corporativo
const DOMAIN = "@empresa.local";

function toEmail(username) {
  const u = (username || "").trim().toLowerCase();
  if (!u) throw new Error("Usuário inválido.");
  if (u.includes("@")) return u;
  return `${u}${DOMAIN}`;
}

export async function loginWithUsername(username, password) {
  const email = toEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function registerWithProfile({ nome, usuario, senha }) {
  if (!nome || !usuario || !senha) {
    throw new Error("Dados inválidos para cadastro.");
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

  if (error) throw error;
  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
