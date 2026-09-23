import { getDefaultStatuses } from "./statuses";

describe("getDefaultStatuses", () => {
  it("returns the four default workflow statuses in order", () => {
    expect(getDefaultStatuses().map((s) => s.status_id)).toEqual([
      "pendiente",
      "en-proceso",
      "bloqueado",
      "completado",
    ]);
  });

  it("marks every draft as new with a unique temp id", () => {
    const statuses = getDefaultStatuses();
    expect(statuses.every((s) => s.isNew)).toBe(true);
    expect(new Set(statuses.map((s) => s.tempId)).size).toBe(statuses.length);
  });

  it("returns fresh temp ids on each call so drafts never collide", () => {
    const a = getDefaultStatuses().map((s) => s.tempId);
    const b = getDefaultStatuses().map((s) => s.tempId);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });

  it("uses only colors from the supported palette", () => {
    const palette = ["emerald", "blue", "rose", "amber", "purple", "slate", "indigo", "cyan"];
    for (const s of getDefaultStatuses()) expect(palette).toContain(s.color);
  });
});
