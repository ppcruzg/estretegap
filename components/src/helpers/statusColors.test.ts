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
