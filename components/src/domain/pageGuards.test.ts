import { getPageCapabilities } from "./pageGuards";

describe("getPageCapabilities", () => {
  it("always allows viewing and never grants permission management or deletion", () => {
    for (const canEdit of [true, false, null]) {
      const caps = getPageCapabilities(canEdit);
      expect(caps.canView).toBe(true);
      expect(caps.canManagePermissions).toBe(false);
      expect(caps.canDelete).toBe(false);
    }
  });

  it("passes the edit flag through", () => {
    expect(getPageCapabilities(true).canEdit).toBe(true);
    expect(getPageCapabilities(false).canEdit).toBe(false);
  });

  it("keeps edit as null while permissions are still loading", () => {
    expect(getPageCapabilities(null).canEdit).toBeNull();
  });
});
