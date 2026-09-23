/**
 * Status / data colors.
 *
 * Status and column colors are stored in the database as plain color names
 * ("emerald", "green", "rose", ...). They are *data* colors: identical across
 * UI palettes, but tuned to read well in both light and dark mode.
 *
 * Every class below is a complete static string so Tailwind can detect it.
 * Never build these class names dynamically.
 */

export const STATUS_COLOR_NAMES = [
  "emerald",
  "blue",
  "rose",
  "amber",
  "purple",
  "slate",
  "indigo",
  "cyan",
  "orange",
  "pink",
] as const;

export type StatusColorName = (typeof STATUS_COLOR_NAMES)[number];

export interface StatusColorClasses {
  name: StatusColorName;
  /** Tinted background (badges, chips). */
  bg: string;
  /** Readable text on `bg` and on app surfaces. */
  text: string;
  /** Subtle border matching `bg`. */
  border: string;
  /** `bg` + `text` + `border`, ready for a badge. */
  badge: string;
  /** Solid indicator dot / swatch. */
  dot: string;
  /** Icon color on app surfaces. */
  icon: string;
  /** Saturated gradient fill (column headers); pair with white text. */
  solid: string;
  /**
   * Mid-tone (500) hex value for inline styles and SVG/charts, e.g. gradients.
   * Readable on both light and dark surfaces.
   */
  hex: string;
}

const ALIASES: Record<string, StatusColorName> = {
  green: "emerald",
  red: "rose",
  yellow: "amber",
  violet: "purple",
  gray: "slate",
  grey: "slate",
  teal: "cyan",
};

const FALLBACK: StatusColorName = "slate";

type BaseClasses = Omit<StatusColorClasses, "name" | "badge">;

const CLASSES: Record<StatusColorName, BaseClasses> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    hex: "#10b981",
    solid: "bg-gradient-to-br from-emerald-500 to-emerald-700",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/30",
    dot: "bg-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    hex: "#3b82f6",
    solid: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-500/30",
    dot: "bg-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
    hex: "#f43f5e",
    solid: "bg-gradient-to-br from-rose-500 to-rose-700",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/15",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    hex: "#f59e0b",
    solid: "bg-gradient-to-br from-amber-500 to-amber-700",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-500/15",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-500/30",
    dot: "bg-purple-500",
    icon: "text-purple-600 dark:text-purple-400",
    hex: "#a855f7",
    solid: "bg-gradient-to-br from-purple-500 to-purple-700",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-500/30",
    dot: "bg-slate-400",
    icon: "text-slate-500 dark:text-slate-400",
    hex: "#64748b",
    solid: "bg-gradient-to-br from-slate-600 to-slate-700",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
    icon: "text-indigo-600 dark:text-indigo-400",
    hex: "#6366f1",
    solid: "bg-gradient-to-br from-indigo-500 to-indigo-700",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-500/15",
    text: "text-cyan-800 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
    icon: "text-cyan-600 dark:text-cyan-400",
    hex: "#06b6d4",
    solid: "bg-gradient-to-br from-cyan-500 to-cyan-700",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-500/15",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-500/30",
    dot: "bg-orange-500",
    icon: "text-orange-600 dark:text-orange-400",
    hex: "#f97316",
    solid: "bg-gradient-to-br from-orange-500 to-orange-700",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-500/15",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-500/30",
    dot: "bg-pink-500",
    icon: "text-pink-600 dark:text-pink-400",
    hex: "#ec4899",
    solid: "bg-gradient-to-br from-pink-500 to-pink-700",
  },
};

const isStatusColorName = (value: string): value is StatusColorName =>
  (STATUS_COLOR_NAMES as readonly string[]).includes(value);

/**
 * Maps any stored color name (including aliases and junk) to a canonical one.
 * `fallback` is used for missing/unknown names (defaults to slate).
 */
export function normalizeStatusColor(
  colorName: string | null | undefined,
  fallback: StatusColorName = FALLBACK,
): StatusColorName {
  if (typeof colorName !== "string") return fallback;
  const key = colorName.trim().toLowerCase();
  if (isStatusColorName(key)) return key;
  return ALIASES[key] ?? fallback;
}

export function getStatusColorClasses(
  colorName: string | null | undefined,
  fallback: StatusColorName = FALLBACK,
): StatusColorClasses {
  const name = normalizeStatusColor(colorName, fallback);
  const c = CLASSES[name];
  return { name, ...c, badge: `${c.bg} ${c.text} ${c.border}` };
}
