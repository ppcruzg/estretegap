import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  getBrowserStorage,
  persistTheme,
  readStoredTheme,
  systemPrefersDark,
  type PaletteId,
  type ThemeMode,
  type ThemePreferences,
} from "../helpers/theme";

interface ThemeContextType {
  mode: ThemeMode;
  palette: PaletteId;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setPalette: (palette: PaletteId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<ThemePreferences>(() =>
    readStoredTheme(getBrowserStorage(), systemPrefersDark()),
  );

  useEffect(() => {
    applyTheme(document.documentElement, prefs);
    persistTheme(getBrowserStorage(), prefs);
  }, [prefs]);

  const setMode = useCallback((mode: ThemeMode) => setPrefs((p) => ({ ...p, mode })), []);
  const setPalette = useCallback(
    (palette: PaletteId) => setPrefs((p) => ({ ...p, palette })),
    [],
  );
  const toggleMode = useCallback(
    () => setPrefs((p) => ({ ...p, mode: p.mode === "light" ? "dark" : "light" })),
    [],
  );

  const value = useMemo(
    () => ({ mode: prefs.mode, palette: prefs.palette, setMode, toggleMode, setPalette }),
    [prefs, setMode, toggleMode, setPalette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
