/**
 * Theme preferences: color mode (light/dark) x palette.
 *
 * NOTE: index.html contains an inline pre-paint script that mirrors
 * `readStoredTheme` + `applyTheme` to avoid a flash of the wrong theme.
 * Keep both in sync when changing keys or palette ids.
 */

export const PALETTE_IDS = ["ocean", "emerald", "violet", "amber", "graphite"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export type ThemeMode = "light" | "dark";

export interface ThemePreferences {
  mode: ThemeMode;
  palette: PaletteId;
}

export const DEFAULT_PALETTE: PaletteId = "ocean";

export const THEME_STORAGE_KEYS = {
  mode: "theme-mode",
  palette: "theme-palette",
  /** Pre-palette key that only stored the mode. Read-only, for backward compat. */
  legacyMode: "theme",
} as const;

/** Representative swatch per palette (its light-mode primary), used by the picker. */
export const PALETTE_SWATCHES: Record<PaletteId, string> = {
  ocean: "#2563eb",
  emerald: "#047857",
  violet: "#7c3aed",
  amber: "#f59e0b",
  graphite: "#27272a",
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

export const isPaletteId = (value: unknown): value is PaletteId =>
  typeof value === "string" && (PALETTE_IDS as readonly string[]).includes(value);

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark";

const safeGet = (storage: ReadableStorage | null, key: string): string | null => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export function readStoredTheme(
  storage: ReadableStorage | null,
  prefersDark: boolean,
): ThemePreferences {
  const storedMode = safeGet(storage, THEME_STORAGE_KEYS.mode);
  const legacyMode = safeGet(storage, THEME_STORAGE_KEYS.legacyMode);
  const storedPalette = safeGet(storage, THEME_STORAGE_KEYS.palette);

  const mode: ThemeMode = isThemeMode(storedMode)
    ? storedMode
    : isThemeMode(legacyMode)
      ? legacyMode
      : prefersDark
        ? "dark"
        : "light";

  return { mode, palette: isPaletteId(storedPalette) ? storedPalette : DEFAULT_PALETTE };
}

export function persistTheme(storage: WritableStorage | null, prefs: ThemePreferences): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEYS.mode, prefs.mode);
    storage.setItem(THEME_STORAGE_KEYS.palette, prefs.palette);
  } catch {
    // Storage may be full or blocked (private mode); the theme still applies for this session.
  }
}

export function applyTheme(root: HTMLElement, prefs: ThemePreferences): void {
  root.dataset.theme = prefs.palette;
  root.classList.remove("light");
  root.classList.toggle("dark", prefs.mode === "dark");
  root.style.colorScheme = prefs.mode;
}

/** Returns localStorage, or null when access itself throws (sandboxed iframes, blocked cookies). */
export function getBrowserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function systemPrefersDark(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch {
    return false;
  }
}
