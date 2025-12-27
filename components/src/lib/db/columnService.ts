import { supabase } from "../supabaseClient";

// -----------------------------------------
// TYPES
// -----------------------------------------
export interface Column {
  id: string;
  page_id: string;
  title: string;
  description: string | null;
  color: string | null;
  position: number | null;
  deleted_at?: string | null;
}

export interface ColumnStatus {
  id?: string | null;
  column_id: string;
  status_id: string;
  label: string;
  color: string;
  icon: string;
}

// -----------------------------------------
// GET COLUMNS BY PAGE
// -----------------------------------------
export async function getColumns(pageId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) {
    console.error("❌ Error loading columns:", error.message);
    throw error;
  }

  if (import.meta.env.DEV) {
    console.log(
      "[getColumns] status_categories:",
      data?.map(c => ({
        id: c.id,
        status_categories: c.status_categories,
      }))
    );
  }

  return data as Column[];
}

// -----------------------------------------
// CREATE A NEW COLUMN
// -----------------------------------------
export async function createColumn(
  pageId: string,
  title: string,
  position: number
): Promise<Column | null> {
  const { data, error } = await supabase
    .from("columns")
    .insert([
      {
        page_id: pageId,
        title,
        position,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating column:", error.message);
    throw error;
  }

  return data as Column;
}

// -----------------------------------------
// UPDATE COLUMN (rename, recolor, etc.)
// -----------------------------------------
export async function updateColumn(
  columnId: string,
  updates: Partial<Column>
): Promise<Column | null> {
  const { data, error } = await supabase
    .from("columns")
    .update(updates)
    .eq("id", columnId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error updating column:", error.message);
    throw error;
  }

  return data as Column;
}

// -----------------------------------------
// REORDER COLUMNS (drag & drop)
// -----------------------------------------
export async function reorderColumns(
  pageId: string,
  orderedColumnIds: string[]
): Promise<boolean> {
  try {
    const updates = orderedColumnIds.map((id, index) => ({
      id,
      position: index,
    }));

    const { error } = await supabase.from("columns").upsert(updates);

    if (error) {
      console.error("❌ Error reordering columns:", error.message);
      throw error;
    }

    return true;
  } catch (e) {
    console.error("❌ Unexpected error in reorderColumns:", e);
    return false;
  }
}

// -----------------------------------------
// DELETE COLUMN (SOFT DELETE)
// -----------------------------------------
export async function deleteColumn(columnId: string): Promise<boolean> {
  const { error } = await supabase
    .from("columns")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", columnId);

  if (error) {
    console.error("❌ Error deleting column:", error.message);
    throw error;
  }

  return true;
}

// -----------------------------------------
// UPDATE COLUMN STATUSES (NEW)
// -----------------------------------------
export async function updateColumnStatuses(
  columnId: string,
  statuses: Omit<ColumnStatus, "column_id">[]
): Promise<void> {
  // 1️⃣ UPSERT (insert / update)
  const payload = statuses.map((s) => ({
    id: s.id ?? undefined,
    column_id: columnId,
    status_id: s.status_id,
    label: s.label,
    color: s.color,
    icon: s.icon,
  }));

  const { error: upsertError } = await supabase
    .from("status_categories")
    .upsert(payload, { onConflict: "id" });

  if (upsertError) {
    console.error("❌ Error upserting status categories:", upsertError);
    throw upsertError;
  }

  // 2️⃣ DELETE removed statuses
  const keepIds = statuses
    .filter((s) => s.id)
    .map((s) => s.id);

  const { error: deleteError } = await supabase
    .from("status_categories")
    .delete()
    .eq("column_id", columnId)
    .not(
      "id",
      "in",
      `(${keepIds.length ? keepIds.join(",") : "NULL"})`
    );

  if (deleteError) {
    console.error("❌ Error deleting removed statuses:", deleteError);
    throw deleteError;
  }
}
