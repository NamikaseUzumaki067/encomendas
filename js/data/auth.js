// js/data/auth.js
import { supabase } from "./storage.js";

/* ===============================
   Helpers
================================ */

function normalizeEmail(emailOrUsername) {
  const value = (emailOrUsername || "").trim().toLowerCase();

  if (!value) {
    throw new Error("Informe seu e-mail ou usuário.");
  }

  // Mantém compatibilidade com o sistema antigo
  if (value.includes("@")) return value;
  return `${value}@empresa.local`;
}

function handleAuthError(error, fallbackMessage) {
  console.error("Auth error:", error);
  throw new Error(error?.message || fallbackMessage || "Erro de autenticação.");
}

function mapProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    companyId: row.company_id,
    fullName: row.full_name || "",
    email: row.email || "",
    role: row.role || "user",
    createdAt: row.created_at || null,
  };
}

/* ===============================
   Auth API
================================ */

export async function loginWithUsername(username, password) {
  const email = normalizeEmail(username);

  if (!password) {
    throw new Error("Informe sua senha.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) handleAuthError(error, "Falha ao autenticar.");

  return data?.user || null;
}

export async function registerWithProfile({ nome, usuario, senha }) {
  const email = normalizeEmail(usuario);

  if (!nome || !usuario || !senha) {
    throw new Error("Preencha todos os campos para cadastro.");
  }

  if (senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        full_name: nome,
      },
    },
  });

  if (error) handleAuthError(error, "Erro ao criar conta.");

  return data?.user || null;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) handleAuthError(error, "Erro ao sair da sessão.");
}

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

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user;
}

/* ===============================
   Profile API
================================ */

export async function getMyProfile() {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, email, role, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    handleAuthError(error, "Não foi possível carregar o perfil do usuário.");
  }

  return mapProfile(data);
}

export async function getMyCompany() {
  const profile = await getMyProfile();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, created_at")
    .eq("id", profile.companyId)
    .single();

  if (error) {
    handleAuthError(error, "Não foi possível carregar a empresa do usuário.");
  }

  return data || null;
}

export async function isAdminLike() {
  const profile = await getMyProfile();
  return ["admin", "manager"].includes(profile.role);
}