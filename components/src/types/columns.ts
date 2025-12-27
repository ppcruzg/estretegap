// =========================================
// TYPES PARA DASHBOARD / ESTRATEGA
// =========================================

// -----------------------------------------
// COLORES TAILWIND VALIDOS PARA STATUS
// -----------------------------------------
export type TailwindColor =
  | "emerald"
  | "blue"
  | "rose"
  | "amber"
  | "purple"
  | "slate"
  | "indigo"
  | "cyan";

// -----------------------------------------
// STATUS CATEGORY (por columna)
// -----------------------------------------
export interface StatusCategory {
  id: string;          // ej. "prod", "dev"
  label: string;       // ej. "productivo"
  color: TailwindColor;
  icon?: string;       // clave del ícono ("check", "alert"...)
}

// -----------------------------------------
// ITEM / TARJETAS
// -----------------------------------------
export interface DashboardItem {
  id: string;
  label: string;
  type?: "root" | "group" | "leaf" | "external";
  description?: string;
  date?: string | null;        // YYYY-MM-DD
  status?: string | null;      // ID del status
  hasIcon?: boolean;
  isExternalLink?: boolean;
  position?: number;
  responsible?: string;
}

// -----------------------------------------
// COLUMNAS / GRUPOS
// -----------------------------------------
export interface DashboardColumn {
  id: string;
  title: string;
  description?: string;
  color: string;               // slate | blue | green | purple | orange
  position?: number;
  statusCategories: StatusCategory[];
  items: DashboardItem[];
}

// -----------------------------------------
// CONFIGURACIÓN DE LA PÁGINA
// -----------------------------------------
export interface PageConfig {
  identifier: string;          // slug interno
  title: string;
  description?: string;
  footerTitle?: string;
  footerDescription?: string;
  footerVersion?: string;
  footerButtonLabel?: string;
  footerUrl?: string;
}

// -----------------------------------------
// PÁGINA COMPLETA
// -----------------------------------------
export interface PageData {
  id: string;
  pageConfig: PageConfig;
  columns: DashboardColumn[];

  documentationLinks?: any[];
  footerMetrics?: any[];
  changeHistory?: any[];
  connections?: any[];

  createdAt: number;           // timestamp
}

// -----------------------------------------
// LISTADO BÁSICO DE PÁGINAS (SIDEBAR / TOPBAR)
// -----------------------------------------
export interface PageSummary {
  id: string;
  identifier: string;
  title: string;
}
