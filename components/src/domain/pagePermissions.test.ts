import { canDeletePage, canEditPage, canManagePermissions, type PageRole } from "./pagePermissions";

describe("page permissions by role", () => {
  const cases: Array<[PageRole, { edit: boolean; manage: boolean; remove: boolean }]> = [
    ["owner", { edit: true, manage: true, remove: true }],
    ["editor", { edit: true, manage: false, remove: false }],
    ["viewer", { edit: false, manage: false, remove: false }],
  ];

  it.each(cases)("%s has the expected capabilities", (role, expected) => {
    expect(canEditPage(role)).toBe(expected.edit);
    expect(canManagePermissions(role)).toBe(expected.manage);
    expect(canDeletePage(role)).toBe(expected.remove);
  });
});
