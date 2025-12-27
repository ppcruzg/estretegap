import { supabase } from "../supabaseClient";

export async function getCompaniesForUser() {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser?.user?.id) return [];

  // 1. Obtener el ID interno del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", authUser.user.id)
    .single();

  if (!profile) return [];

  // 2. Obtener empresas del usuario usando el ID interno de perfil
  const { data, error } = await supabase
    .from("company_users")
    .select("companies(id, name, is_enabled)")
    .eq("user_id", profile.id);

  if (error) throw error;

  return data.map((c: any) => c.companies).flat().filter(Boolean);
}