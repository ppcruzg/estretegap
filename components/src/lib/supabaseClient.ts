// ========================================
// SUPABASE CLIENT — CONFIG + AUTHSERVICE
// ========================================

import { createClient } from "@supabase/supabase-js";

// 🔥 DEBUG opcional (puedes quitarlo si quieres)
if (import.meta.env.DEV) {
  console.log("ENV URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("ENV KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// ----------------------------------------
// ENV VARS
// ----------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("❌ VITE_SUPABASE_URL no está definido");
if (!supabaseKey) throw new Error("❌ VITE_SUPABASE_ANON_KEY no está definido");

// ----------------------------------------
// CLIENT
// ----------------------------------------
export const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// 🔐 AUTH HELPERS
// ========================================

// LOGIN ----------------------------------
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data.user;
}

// SIGNUP ---------------------------------
export async function signup(
  email: string,
  password: string,
  metadata: Record<string, any> = {}
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) throw new Error(error.message);
  return data.user;
}

// LOGOUT ---------------------------------
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// GET SESSION ----------------------------
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

// SESSION LISTENER -----------------------
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// CURRENT USER ---------------------------
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}
