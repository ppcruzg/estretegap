// src/lib/db/pageService.ts
import { supabase } from "../supabaseClient";

// -----------------------------------------
// TYPES
// -----------------------------------------
export interface Page {
  id: string;
  identifier: string | null;
  title: string;
  description: string | null;
  footer: string | null;
  created_at: string;
  created_by: string | null;
}

// -----------------------------------------
// GET ALL PAGES FOR THE LOGGED USER
// -----------------------------------------
export async function getPages(userId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error loading pages:", error.message);
    throw error;
  }

  return data as Page[];
}

// -----------------------------------------
// GET A SINGLE PAGE BY ID
// -----------------------------------------
export async function getPageById(pageId: string): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error) {
    console.error("❌ Error loading page:", error.message);
    return null;
  }

  return data as Page;
}

// -----------------------------------------
// CREATE A NEW PAGE
// -----------------------------------------
export async function createPage(
  title: string,
  userId: string,
  description?: string
): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .insert([
      {
        title,
        description: description || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating page:", error.message);
    throw error;
  }

  return data as Page;
}

// -----------------------------------------
// UPDATE A PAGE
// -----------------------------------------
export async function updatePage(
  pageId: string,
  updates: Partial<Page>
): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", pageId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error updating page:", error.message);
    throw error;
  }

  return data as Page;
}

// -----------------------------------------
// DELETE A PAGE (SOFT DELETE IF AVAILABLE)
// -----------------------------------------
export async function deletePage(pageId: string): Promise<boolean> {
  // Soft delete si existe 'deleted_at'
  const { error } = await supabase
    .from("pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pageId);

  if (error) {
    console.error("❌ Error deleting page:", error.message);
    throw error;
  }

  return true;
}
