// === REPOSITORY COMPLETO Y CORREGIDO ===
// Mantiene integridad entre Supabase y el Front.

import { supabase } from "../lib/supabaseClient";
import { PageSummary, PageData, PageConfig, DashboardColumn } from "../../../types";

/* ============================================================
   MAPEO SEGURO DE PAGE CONFIG
   ============================================================ */

function mapPageConfig(raw: any): PageConfig {
  return {
    identifier: raw.identifier,
    title: raw.title,
    description: raw.description,
    footerTitle: raw.footer_title,
    footerDescription: raw.footer_description,
    footerVersion: raw.footer_version,
    footerButtonLabel: raw.footer_button_label,
    footerUrl: raw.footer_url,
  };
}

/* ============================================================
   MAPEO SEGURO DE COLUMNAS
   ============================================================ */

function mapColumns(rawCols: any[]): DashboardColumn[] {
  const mapped = rawCols
    .map((col: any) => ({
      id: col.id,
      title: col.title,
      description: col.description,
      color: col.color,
      position: col.position,
      statusCategories: Array.isArray(col.column_status_categories)
        ? col.column_status_categories
        : [],
      items: (col.items || []).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)),
    }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return mapped;
}

/* ============================================================
   OBTENER UNA PÁGINA COMPLETA
   ============================================================ */

export async function getPage(pageId: string, companyId: string): Promise<PageData | null> {
  if (import.meta.env.DEV) {
    console.log("🔍 CARGANDO PAGE:", pageId, companyId);
  }

  const { data, error } = await supabase
    .from("pages")
    .select(`
      id,
      identifier,
      title,
      description,
      footer_title,
      footer_description,
      footer_version,
      footer_button_label,
      footer_url,
      company_id,
      created_at,
      columns:columns!columns_page_id_fkey(
        id,
        title,
        description,
        color,
        position,
        column_status_categories:column_status_categories!column_status_categories_column_id_fkey (
          id,
          status_id,
          label,
          color,
          icon),
        items (*)
      ),
      documentation_links (*),
      footer_metrics (*)
    `)
    .eq("id", pageId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (import.meta.env.DEV) {
      console.error("❌ ERROR getPage:", error);
    }
    return null;
  }

  if (import.meta.env.DEV) {
    console.log("📄 PAGE BRUTA SUPABASE:", data);
  }

  return {
    id: data.id,
    pageConfig: mapPageConfig(data),
    columns: mapColumns(data.columns || []),
    documentationLinks: data.documentation_links || [],
    footerMetrics: data.footer_metrics || [],
    changeHistory: [],
    connections: [],
    createdAt: new Date(data.created_at).getTime(),
  };
}

/* ============================================================
   LISTAR PÁGINAS
   ============================================================ */

export async function getPagesList(companyId: string): Promise<PageSummary[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, identifier, title")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

/* ============================================================
   CREAR PÁGINA
   ============================================================ */

export async function createPage(config: PageConfig, userId: string, companyId: string) {
  console.log('ENTER createPage', {
    companyId,
    pageIdentifier: config.identifier,
    pageTitle: config.title
  });

  console.log('BEFORE INSERT pages');

  const { data, error } = await supabase
    .from("pages")
    .insert({
      identifier: config.identifier,
      title: config.title,
      description: config.description,
      footer_title: config.footerTitle,
      footer_description: config.footerDescription,
      footer_version: config.footerVersion,
      footer_button_label: config.footerButtonLabel,
      footer_url: config.footerUrl,
      created_by: userId,
      company_id: companyId,
    })
    .select()
    .single();

  console.log('CREATE PAGE RESULT:', { data, error });

  if (error) {
    console.error('CREATE PAGE ERROR:', error);
    throw error;
  }

  return data;
}

/* ============================================================
   COLUMNAS
   ============================================================ */

export async function createColumn(pageId: string, userId: string, title = "Nuevo Grupo") {
  // 1) Obtener posición siguiente
  const { data: max } = await supabase
    .from("columns")
    .select("position")
    .eq("page_id", pageId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (max?.[0]?.position ?? -1) + 1;

  // 2) Crear columna
  const { data: column, error } = await supabase
    .from("columns")
    .insert({
      page_id: pageId,
      title,
      description: "",
      color: "slate",
      position: nextPosition,
    })
    .select()
    .single();

  if (error) throw error;


  // 3) Estados base
  const defaultStatuses = [
    { id: "pendiente", label: "Pendiente", color: "slate", icon: "clock" },
    { id: "en-proceso", label: "En proceso", color: "blue", icon: "activity" },
    { id: "bloqueado", label: "Bloqueado", color: "rose", icon: "alert" },
    { id: "completado", label: "Completado", color: "emerald", icon: "check" },
  ]
    ;

  // 4) Insertar estados base en Supabase
  const rows = defaultStatuses.map((s) => ({
    column_id: column.id,
    status_id: s.id,
    label: s.label,
    color: s.color,
    icon: s.icon,
  }));

  const { error: statusError } = await supabase
    .from("column_status_categories")
    .insert(rows);

  if (statusError) console.error("Error insertando estados base:", statusError);

  return column;
}



export async function updateColumn(columnId: string, fields: any) {
  const { error } = await supabase.from("columns").update(fields).eq("id", columnId);
  if (error) throw error;
}

export async function deleteColumn(columnId: string) {
  await supabase.from("columns").delete().eq("id", columnId);
}

export async function reorderColumns(pageId: string, orderedIds: string[]) {
  const updates = orderedIds.map((columnId, index) =>
    supabase.from("columns").update({ position: index }).eq("id", columnId)
  );

  await Promise.all(updates);
}

// -----------------------------------------
// UPDATE COLUMN STATUSES
// -----------------------------------------
export async function updateColumnStatuses(
  columnId: string,
  statuses: any[]
) {
  return setStatusesForColumn(columnId, statuses);
}



/* ============================================================
   ITEMS
   ============================================================ */

export async function createItem(columnId: string, userId: string) {
  // 1) Buscar status default "pendiente" de la columna
  const { data: statusRow } = await supabase
    .from("column_status_categories")
    .select("status_id")
    .eq("column_id", columnId)
    .eq("status_id", "pendiente")
    .maybeSingle();

  // 2) Calcular posición
  const { data: last } = await supabase
    .from("items")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1);

  const next = (last?.[0]?.position ?? -1) + 1;

  // 3) Insertar item
  const { data, error } = await supabase
    .from("items")
    .insert({
      column_id: columnId,
      label: "Nuevo Item",
      type: "leaf",
      position: next,
      status: statusRow ? "pendiente" : null, // 👈 SOLO si existe
    })
    .select()
    .single();


  if (error) throw error;
  return data;
}

export async function updateItem(itemId: string, fields: any) {
  const { error } = await supabase.from("items").update(fields).eq("id", itemId);
  if (error) throw error;
}

export async function deleteItem(itemId: string) {
  await supabase.from("items").delete().eq("id", itemId);
}

export async function reorderItems(columnId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    supabase.from("items").update({ position: index }).eq("id", id)
  );

  await Promise.all(updates);
}

/* ============================================================
   STATUS CATEGORIES
   ============================================================ */

export async function setStatusesForPage(pageId: string, statuses: any[]) {
  if (import.meta.env.DEV) {
    console.log("🌍 setStatusesForPage:", { pageId, statuses });
  }

  const { data: cols } = await supabase
    .from("columns")
    .select("id")
    .eq("page_id", pageId);

  if (!cols) return;

  const ids = cols.map((c) => c.id);

  await supabase.from("column_status_categories").delete().in("column_id", ids);

  const rows = ids.flatMap((colId) =>
    statuses.map((s) => ({
      column_id: colId,
      status_id: s.id,
      label: s.label,
      color: s.color,
      icon: s.icon,
    }))
  );

  if (import.meta.env.DEV) {
    console.log("📝 Rows Page:", rows);
  }

  if (rows.length > 0) {
    await supabase.from("column_status_categories").insert(rows);
  }
}

export async function setStatusesForColumn(columnId: string, statuses: any[]) {
  if (import.meta.env.DEV) {
    console.log("🟦 setStatusesForColumn CALLED:", { columnId, statuses });
  }

  // 1️⃣ Separar estados nuevos vs existentes
  if (import.meta.env.DEV) {
    console.log("🧪 RAW STATUSES:", statuses);
  }
  // const toInsert = statuses.filter(s => s.id === null);
  // 1️⃣ Obtener status existentes en DB
  const { data: existing } = await supabase
    .from("column_status_categories")
    .select("status_id")
    .eq("column_id", columnId);

  const existingStatusIds = new Set(
    (existing || []).map(s => s.status_id)
  );

  // 2️⃣ Insertar SOLO los que no existen
  const toInsert = statuses.filter(
    s => s.id === null && !existingStatusIds.has(s.status_id)
  );


  const toUpdate = statuses.filter(s => s.id !== null);

  // 2️⃣ INSERT — solo estados nuevos
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("column_status_categories")
      .insert(
        toInsert.map(s => ({
          column_id: columnId,
          status_id: s.status_id,
          label: s.label,
          color: s.color,
          icon: s.icon
        }))
      );

    if (insertError) {
      console.error("❌ INSERT ERROR:", insertError);
      throw insertError;
    }
  }

  // 3️⃣ UPDATE — estados existentes
  for (const s of toUpdate) {
    const { error: updateError } = await supabase
      .from("column_status_categories")
      .update({
        status_id: s.status_id,
        label: s.label,
        color: s.color,
        icon: s.icon
      })
      .eq("id", s.id);

    if (updateError) {
      console.error("❌ UPDATE ERROR:", updateError);
      throw updateError;
    }
  }

  // 4️⃣ DELETE — solo estados quitados del modal
  // DELETE — solo estados quitados del modal (usar status_id)
  const keepStatusIds = statuses.map(s => s.status_id);

  const { error: deleteError } = await supabase
    .from("column_status_categories")
    .delete()
    .eq("column_id", columnId)
    .not(
      "status_id",
      "in",
      `(${keepStatusIds.map(s => `"${s}"`).join(",")})`
    );

  if (deleteError) {
    console.warn("⚠️ DELETE WARNING (posible FK):", deleteError);
  }

}


/* ============================================================
   UPDATE PAGE
   ============================================================ */

export async function updatePage(pageId: string, fields: any, userId: string) {
  // Security handled by RLS (profiles.is_admin = true or company_users.role = 'company-admin')
  const { data, error } = await supabase
    .from("pages")
    .update(fields)
    .eq("id", pageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ============================================================
   ELIMINAR PÁGINA
   ============================================================ */

export async function deletePage(pageId: string, userId: string) {
  // Security handled by RLS (profiles.is_admin = true or company_users.role = 'company-admin')
  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId);

  if (error) throw error;
}


// ======================================================
// DOCUMENTATION LINKS (FOOTER)
// ======================================================

export async function createDocumentationLink(
  pageId: string,
  fields: {
    title?: string;
    description?: string;
    url?: string;
  }
) {
  const { data, error } = await supabase
    .from("documentation_links")
    .insert({
      page_id: pageId,
      title: fields.title,
      description: fields.description,
      url: fields.url,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentationLink(
  id: string,
  fields: {
    title?: string;
    description?: string;
    url?: string;
  }
) {
  const { error } = await supabase
    .from("documentation_links")
    .update(fields)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteDocumentationLink(id: string) {
  const { error } = await supabase
    .from("documentation_links")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ======================================================
// PAGE PERMISSIONS & COMPANY USERS DETAIL
// ======================================================

export async function getPagePermissions(pageId: string) {
  const { data, error } = await supabase
    .from("permissions")
    .select(`
      user_id,
      can_edit,
      profiles:user_id (id, name, email)
    `)
    .eq("page_id", pageId);

  if (error) throw error;
  return data;
}

export async function updatePagePermission(pageId: string, userId: string, canEdit: boolean) {
  // If canEdit is false, we might want to just keep the record or delete it?
  // PRD implies permissions table is for explicit grants.
  // We'll use upsert.
  const { error } = await supabase
    .from("permissions")
    .upsert({
      page_id: pageId,
      user_id: userId,
      can_edit: canEdit
    }, { onConflict: 'page_id,user_id' });

  if (error) throw error;
}

export async function deletePagePermission(pageId: string, userId: string) {
  const { error } = await supabase
    .from("permissions")
    .delete()
    .eq("page_id", pageId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Fetches all profiles of users assigned to a specific company.
 * Useful for populating the permissions management list.
 */
export async function getCompanyUsersWithProfiles(companyId: string) {
  const { data, error } = await supabase
    .from("company_users")
    .select(`
      user_id,
      role,
      profiles:user_id (id, name, email)
    `)
    .eq("company_id", companyId);

  if (error) throw error;

  return data.map((item: any) => ({
    profile: item.profiles,
    role: item.role,
    userId: item.user_id
  }));
}

// ======================================================
// CHANGE HISTORY (HISTORIAL DE CAMBIOS)
// ======================================================

import type {
  ChangeHistoryEntry,
  ChangeHistoryFilters,
  MovementReport,
  ChangeHistoryStats
} from "../../../types/changeHistory";

/**
 * Obtiene el historial de cambios de una página con filtros opcionales
 */
export async function getPageChangeHistory(
  pageId: string,
  filters?: ChangeHistoryFilters
): Promise<ChangeHistoryEntry[]> {
  let query = supabase
    .from("change_history")
    .select(`
      id,
      page_id,
      entity_type,
      entity_id,
      action,
      field_name,
      old_value,
      new_value,
      changed_by,
      changed_at,
      metadata
    `)
    .eq("page_id", pageId)
    .order("changed_at", { ascending: false });

  // Aplicar filtros
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.startDate) {
    query = query.gte("changed_at", filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte("changed_at", filters.endDate.toISOString());
  }

  if (filters?.userId) {
    query = query.eq("changed_by", filters.userId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching change history:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Obtener IDs únicos de usuarios
  const userIds = [...new Set(data.map((entry: any) => entry.changed_by).filter(Boolean))];

  // Fetch user profiles separately
  let userProfiles: Record<string, { name?: string; email?: string }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    if (profiles) {
      profiles.forEach((profile: any) => {
        userProfiles[profile.id] = {
          name: profile.name,
          email: profile.email,
        };
      });
    }
  }

  // Mapear a formato del frontend
  return data.map((entry: any) => {
    const userProfile = entry.changed_by ? userProfiles[entry.changed_by] : null;

    return {
      id: entry.id,
      pageId: entry.page_id,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      action: entry.action,
      fieldName: entry.field_name,
      oldValue: entry.old_value,
      newValue: entry.new_value,
      changedBy: entry.changed_by,
      changedByName: userProfile?.name || userProfile?.email || "Usuario desconocido",
      changedAt: new Date(entry.changed_at).getTime(),
      metadata: entry.metadata,
    };
  });
}

/**
 * Genera un reporte completo de movimientos para un rango de fechas
 */
export async function generateMovementReport(
  pageId: string,
  startDate: Date,
  endDate: Date
): Promise<MovementReport> {
  // Obtener título de la página
  const { data: pageData } = await supabase
    .from("pages")
    .select("title")
    .eq("id", pageId)
    .single();

  // Obtener todos los cambios en el rango de fechas
  const changes = await getPageChangeHistory(pageId, {
    startDate,
    endDate,
  });

  // Calcular estadísticas
  const summary = {
    totalChanges: changes.length,
    columnsCreated: changes.filter(c => c.entityType === "column" && c.action === "created").length,
    columnsUpdated: changes.filter(c => c.entityType === "column" && c.action === "updated").length,
    columnsDeleted: changes.filter(c => c.entityType === "column" && c.action === "deleted").length,
    itemsCreated: changes.filter(c => c.entityType === "item" && c.action === "created").length,
    itemsMoved: changes.filter(c => c.entityType === "item" && c.action === "moved").length,
    itemsUpdated: changes.filter(c => c.entityType === "item" && c.action === "updated").length,
    itemsDeleted: changes.filter(c => c.entityType === "item" && c.action === "deleted").length,
  };

  // Agrupar cambios por usuario
  const userChangesMap = new Map<string, { userName: string; count: number }>();
  changes.forEach(change => {
    if (change.changedBy) {
      const existing = userChangesMap.get(change.changedBy);
      if (existing) {
        existing.count++;
      } else {
        userChangesMap.set(change.changedBy, {
          userName: change.changedByName || "Usuario desconocido",
          count: 1,
        });
      }
    }
  });

  const changesByUser = Array.from(userChangesMap.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      changeCount: data.count,
    }))
    .sort((a, b) => b.changeCount - a.changeCount);

  // Agrupar cambios por día
  const dayChangesMap = new Map<string, number>();
  changes.forEach(change => {
    const date = new Date(change.changedAt).toISOString().split("T")[0];
    dayChangesMap.set(date, (dayChangesMap.get(date) || 0) + 1);
  });

  const changesByDay = Array.from(dayChangesMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    pageTitle: pageData?.title || "Página sin título",
    period: { start: startDate, end: endDate },
    summary,
    changes,
    changesByUser,
    changesByDay,
  };
}

/**
 * Obtiene estadísticas generales del historial de cambios
 */
export async function getChangeHistoryStats(pageId: string): Promise<ChangeHistoryStats> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Obtener todos los cambios
  const allChanges = await getPageChangeHistory(pageId);

  // Cambios recientes (últimas 24 horas)
  const recentChanges = allChanges.filter(c => c.changedAt >= yesterday.getTime());

  // Usuarios más activos
  const userChangesMap = new Map<string, { userName: string; count: number }>();
  allChanges.forEach(change => {
    if (change.changedBy) {
      const existing = userChangesMap.get(change.changedBy);
      if (existing) {
        existing.count++;
      } else {
        userChangesMap.set(change.changedBy, {
          userName: change.changedByName || "Usuario desconocido",
          count: 1,
        });
      }
    }
  });

  const mostActiveUsers = Array.from(userChangesMap.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      changeCount: data.count,
    }))
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, 5);

  // Cambios por tipo
  const changesByType = {
    column: allChanges.filter(c => c.entityType === "column").length,
    item: allChanges.filter(c => c.entityType === "item").length,
    page: allChanges.filter(c => c.entityType === "page").length,
  };

  return {
    totalChanges: allChanges.length,
    recentChanges: recentChanges.length,
    mostActiveUsers,
    changesByType,
  };
}

// ======================================================
// ROADMAP ANALYSIS (ANÁLISIS DE ROADMAP CON IA)
// ======================================================

import type { RoadmapItem, RoadmapAnalysis, SystemConfig } from "../../../types/roadmapTypes";

/**
 * Obtiene todos los items con fechas para análisis de roadmap
 */
export async function getRoadmapData(pageId: string): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      label,
      date,
      status,
      description,
      column_id,
      columns!inner (
        title,
        page_id
      )
    `)
    .eq("columns.page_id", pageId)
    .order("date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching roadmap data:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.label,
    date: item.date,
    status: item.status || "pendiente",
    groupName: item.columns?.title || "Sin grupo",
    description: item.description,
    responsible: extractResponsibleFromDescription(item.description),
  }));
}

/**
 * Extrae el nombre del responsable de la descripción
 * Detecta patrones como "Responsable: Juan", "#Juan", etc.
 */
function extractResponsibleFromDescription(description?: string): string | undefined {
  if (!description) return undefined;

  // 1. Buscar menciones con # (prioridad alta)
  const hashtagMatch = description.match(/#([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/);
  if (hashtagMatch) {
    return hashtagMatch[1];
  }

  // 2. Buscar patrones tradicionales
  const patterns = [
    /responsable:\s*([^\n,]+)/i,
    /asignado\s+a:\s*([^\n,]+)/i,
    /owner:\s*([^\n,]+)/i,
    /assigned\s+to:\s*([^\n,]+)/i,
    /encargado:\s*([^\n,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

// ======================================================
// SYSTEM CONFIGURATION (CONFIGURACIÓN DEL SISTEMA)
// ======================================================

/**
 * Obtiene una configuración del sistema
 */
export async function getSystemConfig(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("system_config")
    .select("config_value")
    .eq("config_key", key)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching config ${key}:`, error);
    return null;
  }

  return data?.config_value || null;
}

/**
 * Obtiene todas las configuraciones del sistema
 */
export async function getAllSystemConfig(): Promise<SystemConfig> {
  const { data, error } = await supabase
    .from("system_config")
    .select("config_key, config_value");

  if (error) {
    console.error("Error fetching system config:", error);
    return {};
  }

  const config: any = {};
  (data || []).forEach((item: any) => {
    config[item.config_key] = item.config_value;
  });

  return config;
}

/**
 * Actualiza una configuración del sistema (usa upsert para permitir nuevas claves)
 */
export async function updateSystemConfig(
  key: string,
  value: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("system_config")
    .upsert({
      config_key: key,
      config_value: value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'config_key' });

  if (error) {
    console.error(`Error updating config ${key}:`, error);
    throw error;
  }
}

/**
 * Obtiene la lista de etiquetas configuradas para el proyecto
 */
export async function getProjectTags(): Promise<string[]> {
  const jsonStr = await getSystemConfig("project_tags");
  if (!jsonStr) return ["#Urgente", "#Importante", "#Review", "#Bloqueado"]; // Default tags if none set

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Error parsing project tags:", e);
    return [];
  }
}

/**
 * Guarda la lista de etiquetas configuradas
 */
export async function saveProjectTags(tags: string[], userId: string): Promise<void> {
  await updateSystemConfig("project_tags", JSON.stringify(tags), userId);
}


