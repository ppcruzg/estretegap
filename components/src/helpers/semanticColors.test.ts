import {
  TONE_CLASSES,
  changeActionClasses,
  insightTone,
  milestoneStatusColor,
  severityTone,
  workloadTone,
} from "./semanticColors";
import { getStatusColorClasses } from "./statusColors";

describe("tone classes", () => {
  it("token tones use theme tokens only", () => {
    for (const tone of ["danger", "warning", "success", "neutral"] as const) {
      const { badge, text, dot } = TONE_CLASSES[tone];
      expect(`${badge} ${text} ${dot}`).not.toMatch(/-(red|rose|yellow|amber|emerald|green|slate|gray)-\d/);
    }
  });

  it("info keeps the blue data color in every palette", () => {
    expect(TONE_CLASSES.info.badge).toBe(getStatusColorClasses("blue").badge);
    expect(TONE_CLASSES.info.dot).toBe("bg-blue-500");
  });
});

describe("severityTone (was red / yellow / blue / slate)", () => {
  it.each([
    ["high", "danger"],
    ["medium", "warning"],
    ["low", "info"],
    ["unknown", "neutral"],
  ])("%s -> %s", (input, tone) => {
    expect(severityTone(input)).toBe(tone);
  });
});

describe("insightTone (was red / emerald / blue / yellow / slate)", () => {
  it.each([
    ["risk", "danger"],
    ["opportunity", "success"],
    ["suggestion", "info"],
    ["warning", "warning"],
    ["other", "neutral"],
  ])("%s -> %s", (input, tone) => {
    expect(insightTone(input)).toBe(tone);
  });
});

describe("workloadTone (was red / yellow / emerald)", () => {
  it.each([
    ["high", "danger"],
    ["medium", "warning"],
    ["low", "success"],
  ])("%s -> %s", (input, tone) => {
    expect(workloadTone(input)).toBe(tone);
  });
});

describe("changeActionClasses (was emerald / blue / red / purple / slate)", () => {
  it("keeps each action's hue", () => {
    expect(changeActionClasses("created")).toBe(TONE_CLASSES.success.badge);
    expect(changeActionClasses("updated")).toContain("blue-");
    expect(changeActionClasses("deleted")).toBe(TONE_CLASSES.danger.badge);
    expect(changeActionClasses("moved")).toContain("purple-");
    expect(changeActionClasses("whatever")).toBe(TONE_CLASSES.neutral.badge);
  });
});

describe("milestoneStatusColor", () => {
  it.each([
    ["completed", "emerald"],
    ["in-progress", "blue"],
    ["overdue", "rose"],
    ["pending", "slate"],
  ])("%s -> %s", (status, color) => {
    expect(milestoneStatusColor(status)).toBe(color);
  });

  it("supports a custom fallback (pending shown as amber in the Gantt legend)", () => {
    expect(milestoneStatusColor("pending", "amber")).toBe("amber");
    expect(milestoneStatusColor("completed", "amber")).toBe("emerald");
  });
});
