import {
  STATUS_COLOR_NAMES,
  getStatusColorClasses,
  normalizeStatusColor,
} from "./statusColors";

describe("normalizeStatusColor", () => {
  it.each(STATUS_COLOR_NAMES)("keeps the canonical name %s", (name) => {
    expect(normalizeStatusColor(name)).toBe(name);
  });

  it.each([
    ["green", "emerald"],
    ["red", "rose"],
    ["yellow", "amber"],
    ["violet", "purple"],
    ["gray", "slate"],
    ["grey", "slate"],
    ["teal", "cyan"],
  ])("maps alias %s to %s", (alias, canonical) => {
    expect(normalizeStatusColor(alias)).toBe(canonical);
  });

  it("is case and whitespace insensitive", () => {
    expect(normalizeStatusColor("  Emerald ")).toBe("emerald");
    expect(normalizeStatusColor("GREEN")).toBe("emerald");
  });

  it.each([undefined, null, "", "   ", "chartreuse", 42])(
    "falls back to slate for %p",
    (value) => {
      expect(normalizeStatusColor(value as unknown as string)).toBe("slate");
    },
  );
});

describe("getStatusColorClasses", () => {
  it.each(STATUS_COLOR_NAMES)("returns complete static classes for %s", (name) => {
    const classes = getStatusColorClasses(name);
    expect(classes.name).toBe(name);
    expect(classes.bg).toMatch(new RegExp(`^bg-${name}-\\d+`));
    expect(classes.text).toMatch(new RegExp(`^text-${name}-\\d+`));
    expect(classes.border).toMatch(new RegExp(`^border-${name}-\\d+`));
    expect(classes.dot).toMatch(new RegExp(`^bg-${name}-\\d+$`));
    expect(classes.icon).toMatch(new RegExp(`^text-${name}-\\d+`));
    expect(classes.solid).toContain(`from-${name}-`);
    // Every surface-colored class must ship a dark-mode counterpart.
    for (const key of ["bg", "text", "border", "icon"] as const) {
      expect(classes[key]).toMatch(/ dark:/);
    }
    expect(classes.badge).toBe(`${classes.bg} ${classes.text} ${classes.border}`);
  });

  it("resolves aliases to the canonical classes", () => {
    expect(getStatusColorClasses("green")).toEqual(getStatusColorClasses("emerald"));
    expect(getStatusColorClasses("red")).toEqual(getStatusColorClasses("rose"));
  });

  it("falls back to slate for unknown names", () => {
    expect(getStatusColorClasses("not-a-color")).toEqual(getStatusColorClasses("slate"));
    expect(getStatusColorClasses(undefined)).toEqual(getStatusColorClasses("slate"));
  });

  it("covers every color stored in the database (status + column colors)", () => {
    const stored: Record<string, string> = {
      emerald: "emerald", blue: "blue", rose: "rose", amber: "amber",
      purple: "purple", slate: "slate", indigo: "indigo", cyan: "cyan",
      green: "emerald", orange: "orange", pink: "pink",
    };
    for (const [name, expected] of Object.entries(stored)) {
      expect(getStatusColorClasses(name).name).toBe(expected);
    }
  });
});

describe("fallback parameter", () => {
  it("uses the given fallback only for missing/unknown names", () => {
    expect(getStatusColorClasses("chartreuse", "blue").name).toBe("blue");
    expect(getStatusColorClasses(undefined, "blue").name).toBe("blue");
    expect(getStatusColorClasses("rose", "blue").name).toBe("rose");
    expect(getStatusColorClasses("green", "blue").name).toBe("emerald");
  });
});

/*
 * Stage 2 replaced per-component color maps with getStatusColorClasses.
 * These tables are the hues those maps produced; the helper must keep them.
 */
describe("replaced component color maps keep their hue", () => {
  const hueOf = (name: string, fallback?: "blue") =>
    getStatusColorClasses(name, fallback).solid.match(/from-(\w+)-/)?.[1];

  it.each([
    ["blue", "blue"], ["orange", "orange"], ["purple", "purple"], ["green", "emerald"],
    ["rose", "rose"], ["red", "rose"], ["amber", "amber"], ["indigo", "indigo"], ["unknown", "slate"],
  ])("GanttPanel.getColorClass / MindMapPanel.getColorClass: %s -> %s", (input, hue) => {
    expect(hueOf(input)).toBe(hue);
  });

  it.each([
    ["emerald", "emerald"], ["blue", "blue"], ["rose", "rose"], ["amber", "amber"],
    ["purple", "purple"], ["indigo", "indigo"], ["cyan", "cyan"], [undefined, "slate"],
  ])("GanttPanel status badge / dot: %s -> %s", (input, hue) => {
    const c = getStatusColorClasses(input);
    expect(c.badge).toContain(`bg-${hue}-`);
    expect(c.dot).toMatch(new RegExp(`^bg-${hue}-`));
  });

  it.each([
    ["blue", "#3b82f6"], ["emerald", "#10b981"], ["green", "#10b981"], ["rose", "#f43f5e"],
    ["amber", "#f59e0b"], ["purple", "#a855f7"], ["indigo", "#6366f1"], ["cyan", "#06b6d4"],
    ["orange", "#f97316"], ["slate", "#64748b"], ["unknown", "#3b82f6"],
  ])("StrategicRoadmap.getPhaseColor (blue fallback) bar color: %s -> %s", (input, hex) => {
    expect(getStatusColorClasses(input, "blue").hex).toBe(hex);
  });

  it.each(STATUS_COLOR_NAMES)("exposes a 500-tone hex for %s", (name) => {
    expect(getStatusColorClasses(name).hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
