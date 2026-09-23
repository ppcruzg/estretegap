import {
  DEFAULT_PALETTE,
  PALETTE_IDS,
  THEME_STORAGE_KEYS,
  applyTheme,
  isPaletteId,
  isThemeMode,
  persistTheme,
  readStoredTheme,
} from "./theme";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
};

const throwingStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("theme guards", () => {
  it("exposes exactly the five palettes with ocean as default", () => {
    expect(PALETTE_IDS).toEqual(["ocean", "emerald", "violet", "amber", "graphite"]);
    expect(DEFAULT_PALETTE).toBe("ocean");
  });

  it("validates palette ids and modes", () => {
    expect(isPaletteId("violet")).toBe(true);
    expect(isPaletteId("pink")).toBe(false);
    expect(isPaletteId(null)).toBe(false);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("dim")).toBe(false);
  });
});

describe("readStoredTheme", () => {
  it("returns system mode and default palette when nothing is stored", () => {
    expect(readStoredTheme(memoryStorage(), false)).toEqual({ mode: "light", palette: "ocean" });
    expect(readStoredTheme(memoryStorage(), true)).toEqual({ mode: "dark", palette: "ocean" });
  });

  it("reads the stored mode and palette", () => {
    const storage = memoryStorage({
      [THEME_STORAGE_KEYS.mode]: "dark",
      [THEME_STORAGE_KEYS.palette]: "amber",
    });
    expect(readStoredTheme(storage, false)).toEqual({ mode: "dark", palette: "amber" });
  });

  it("falls back to the legacy 'theme' key for the mode", () => {
    const storage = memoryStorage({ theme: "dark" });
    expect(readStoredTheme(storage, false)).toEqual({ mode: "dark", palette: "ocean" });
  });

  it("prefers the new mode key over the legacy one", () => {
    const storage = memoryStorage({ theme: "dark", [THEME_STORAGE_KEYS.mode]: "light" });
    expect(readStoredTheme(storage, true).mode).toBe("light");
  });

  it("ignores invalid stored values", () => {
    const storage = memoryStorage({
      [THEME_STORAGE_KEYS.mode]: "sepia",
      [THEME_STORAGE_KEYS.palette]: "neon",
      theme: "blue",
    });
    expect(readStoredTheme(storage, false)).toEqual({ mode: "light", palette: "ocean" });
  });

  it("survives storage that throws or is unavailable", () => {
    expect(readStoredTheme(throwingStorage, true)).toEqual({ mode: "dark", palette: "ocean" });
    expect(readStoredTheme(null, false)).toEqual({ mode: "light", palette: "ocean" });
  });
});

describe("persistTheme", () => {
  it("writes both keys", () => {
    const storage = memoryStorage();
    persistTheme(storage, { mode: "dark", palette: "violet" });
    expect(storage.data.get(THEME_STORAGE_KEYS.mode)).toBe("dark");
    expect(storage.data.get(THEME_STORAGE_KEYS.palette)).toBe("violet");
  });

  it("does not throw when storage fails", () => {
    expect(() => persistTheme(throwingStorage, { mode: "dark", palette: "violet" })).not.toThrow();
    expect(() => persistTheme(null, { mode: "dark", palette: "violet" })).not.toThrow();
  });
});

describe("applyTheme", () => {
  it("sets data-theme and toggles the dark class", () => {
    const root = document.createElement("html");
    applyTheme(root, { mode: "dark", palette: "emerald" });
    expect(root.dataset.theme).toBe("emerald");
    expect(root.classList.contains("dark")).toBe(true);

    applyTheme(root, { mode: "light", palette: "graphite" });
    expect(root.dataset.theme).toBe("graphite");
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("sets color-scheme so native controls follow the mode", () => {
    const root = document.createElement("html");
    applyTheme(root, { mode: "dark", palette: "ocean" });
    expect(root.style.colorScheme).toBe("dark");
  });
});
