import { supabase } from "../lib/supabaseClient";
import { PageRole } from "../domain/pagePermissions";

// Obtener permisos de una página
export async function getPagePermissions(pageId: string) {
  const { data, error } = await supabase
    .from("permissions")
    .select("id, page_id, user_id, role")
    .eq("page_id", pageId);

  if (error) throw error;
  return data;
}

// Obtener permiso de un usuario en una página
export async function getUserPagePermission(
  pageId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("permissions")
    .select("role")
    .eq("page_id", pageId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data.role as PageRole;
}

// Asignar / actualizar permiso
export async function upsertPagePermission(
  pageId: string,
  userId: string,
  role: PageRole
) {
  const { error } = await supabase.from("permissions").upsert({
    page_id: pageId,
    user_id: userId,
    role,
  });

  if (error) throw error;
}

// Quitar permiso
export async function removePagePermission(permissionId: string) {
  const { error } = await supabase
    .from("permissions")
    .delete()
    .eq("id", permissionId);

  if (error) throw error;
}
