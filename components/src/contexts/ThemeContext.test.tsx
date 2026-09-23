import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { THEME_STORAGE_KEYS } from "../helpers/theme";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const root = () => document.documentElement;

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    root().className = "";
    root().removeAttribute("data-theme");
    vi.restoreAllMocks();
  });

  it("defaults to light + ocean when nothing is stored and there is no system preference", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("light");
    expect(result.current.palette).toBe("ocean");
    expect(root().dataset.theme).toBe("ocean");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("follows the system dark preference when nothing is stored", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("dark"), media: q }));
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("restores the stored mode and palette", () => {
    localStorage.setItem(THEME_STORAGE_KEYS.mode, "dark");
    localStorage.setItem(THEME_STORAGE_KEYS.palette, "violet");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("dark");
    expect(result.current.palette).toBe("violet");
    expect(root().dataset.theme).toBe("violet");
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("reads the legacy 'theme' key", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(THEME_STORAGE_KEYS.mode, "purple");
    localStorage.setItem(THEME_STORAGE_KEYS.palette, "rainbow");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("light");
    expect(result.current.palette).toBe("ocean");
  });

  it("toggles and persists the mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.mode)).toBe("dark");
    expect(root().classList.contains("dark")).toBe(true);

    act(() => result.current.setMode("light"));
    expect(localStorage.getItem(THEME_STORAGE_KEYS.mode)).toBe("light");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("sets and persists the palette", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setPalette("amber"));
    expect(result.current.palette).toBe("amber");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.palette)).toBe("amber");
    expect(root().dataset.theme).toBe("amber");
  });

  it("keeps working when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.palette).toBe("ocean");
    act(() => result.current.setPalette("graphite"));
    expect(root().dataset.theme).toBe("graphite");
  });

  it("throws a helpful error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = () => {
      useTheme();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });

  it("renders children", () => {
    render(<ThemeProvider><span>child</span></ThemeProvider>);
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
