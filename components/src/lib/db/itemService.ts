// src/lib/db/itemService.ts
import { supabase } from "../supabaseClient";

// -----------------------------------------
// TYPES
// -----------------------------------------
export interface Item {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  status: string | null;
  date: string | null;
  has_icon?: boolean;
  is_external_link?: boolean;
  position: number | null;
  deleted_at?: string | null;
}

// -----------------------------------------
// GET ITEMS BY COLUMN
// -----------------------------------------
export async function getItems(columnId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("column_id", columnId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) {
    console.error("ƒ?O Error loading items:", error.message);
    throw error;
  }

  return data as Item[];
}

// -----------------------------------------
// CREATE A NEW ITEM
// -----------------------------------------
export async function createItem(
  columnId: string,
  title: string,
  position: number = 0
): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        column_id: columnId,
        title,
        position,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("ƒ?O Error creating item:", error.message);
    throw error;
  }

  return data as Item;
}

// -----------------------------------------
// UPDATE AN ITEM
// -----------------------------------------
export async function updateItem(
  itemId: string,
  updates: Partial<Item>
): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("ƒ?O Error updating item:", error.message);
    throw error;
  }

  return data as Item;
}

// -----------------------------------------
// MOVE ITEM TO ANOTHER COLUMN
// -----------------------------------------
export async function moveItem(
  itemId: string,
  newColumnId: string,
  newPosition: number
): Promise<boolean> {
  const { error } = await supabase
    .from("items")
    .update({
      column_id: newColumnId,
      position: newPosition,
    })
    .eq("id", itemId);

  if (error) {
    console.error("ƒ?O Error moving item:", error.message);
    throw error;
  }

  return true;
}

// -----------------------------------------
// REORDER ITEMS WITHIN A COLUMN
// (drag & drop)
// -----------------------------------------
export async function reorderItems(
  columnId: string,
  orderedItemIds: string[]
): Promise<boolean> {
  try {
    const updates = orderedItemIds.map((id, index) =>
      supabase
        .from("items")
        .update({ column_id: columnId, position: index })
        .eq("id", id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r: any) => r.error);
    if (failed?.error) {
      console.error("ƒ?O Error reordering items:", failed.error.message);
      throw failed.error;
    }

    return true;
  } catch (err) {
    console.error("ƒ?O Unexpected error in reorderItems:", err);
    return false;
  }
}

// -----------------------------------------
// DELETE ITEM (SOFT DELETE)
// -----------------------------------------
export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) {
    console.error("ƒ?O Error deleting item:", error.message);
    throw error;
  }

  return true;
}

