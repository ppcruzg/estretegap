import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PALETTE_IDS, type PaletteId, type ThemeMode } from "../helpers/theme";

/**
 * Guards the palette definitions in themes.css: every theme x mode combination
 * must define the full token set and meet the WCAG contrast targets.
 */
const css = readFileSync(resolve(process.cwd(), "components/src/styles/themes.css"), "utf8");

const PALETTE_TOKENS = [
  "bg", "surface", "surface-muted", "surface-raised",
  "fg", "fg-muted", "fg-subtle",
  "border", "border-strong",
  "primary", "primary-hover", "primary-fg", "primary-soft", "primary-soft-fg",
  "ring",
] as const;

const MODE_TOKENS = [
  "danger", "danger-fg", "danger-soft",
  "success", "success-soft",
  "warning", "warning-soft",
] as const;

type Vars = Record<string, string>;

const blocks: { selectors: string[]; vars: Vars }[] = [];
for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selectors = match[1]
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const vars: Vars = {};
  for (const decl of match[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    vars[decl[1]] = decl[2].trim();
  }
  blocks.push({ selectors, vars });
}

const blockFor = (selector: string): Vars => {
  const found = blocks.find((b) => b.selectors.includes(selector));
  if (!found) throw new Error(`Missing block for ${selector}`);
  return found.vars;
};

const resolveVars = (palette: PaletteId, mode: ThemeMode): Vars => ({
  ...blockFor(mode === "dark" ? "html.dark" : "html"),
  ...blockFor(`:root[data-theme="${palette}"]${mode === "dark" ? ".dark" : ""}`),
});

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const COMBOS = PALETTE_IDS.flatMap((p) => (["light", "dark"] as const).map((m) => [p, m] as const));

describe.each(COMBOS)("theme %s / %s", (palette, mode) => {
  const v = resolveVars(palette, mode);

  it("defines every token as a hex color", () => {
    for (const token of [...PALETTE_TOKENS, ...MODE_TOKENS]) {
      expect(v[token], token).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each([
    ["fg", "surface", 7],
    ["fg", "bg", 7],
    ["fg-muted", "surface", 4.5],
    ["fg-muted", "bg", 4.5],
    ["fg-muted", "surface-muted", 4.5],
    ["fg-subtle", "surface", 3],
    ["primary-fg", "primary", 4.5],
    ["primary-soft-fg", "primary-soft", 4.5],
    ["primary-soft-fg", "surface", 4.5],
    ["ring", "surface", 3],
    ["danger-fg", "danger", 4.5],
    ["danger", "surface", 4.5],
    ["danger", "danger-soft", 4.5],
    ["success", "surface", 4.5],
    ["success", "success-soft", 4.5],
    ["warning", "surface", 4.5],
    ["warning", "warning-soft", 4.5],
  ] as const)("%s on %s meets %s:1", (fg, bg, min) => {
    expect(contrast(v[fg], v[bg])).toBeGreaterThanOrEqual(min);
  });
});
