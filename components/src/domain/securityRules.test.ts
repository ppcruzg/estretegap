import {
  canDisableCompany,
  canDowngradeAdmin,
  canRemoveSuperAdmin,
  canRemoveUserFromCompany,
} from "./securityRules";
import { translations } from "../helpers/translations";

const ME = "user-me";
const OTHER = "user-other";

describe("canDisableCompany", () => {
  it("blocks disabling the currently active company", () => {
    expect(canDisableCompany("c1", "c1")).toEqual({
      allowed: false,
      reasonKey: "security_cantDisableActiveCompany",
    });
  });

  it("allows disabling any other company", () => {
    expect(canDisableCompany("c2", "c1")).toEqual({ allowed: true });
  });
});

describe("canRemoveUserFromCompany", () => {
  it("blocks removing yourself", () => {
    expect(canRemoveUserFromCompany(ME, ME, 5)).toEqual({
      allowed: false,
      reasonKey: "security_cantRemoveSelf",
    });
  });

  it("blocks removal when only one admin remains", () => {
    expect(canRemoveUserFromCompany(OTHER, ME, 1)).toEqual({
      allowed: false,
      reasonKey: "security_minOneAdminRequired",
    });
  });

  it("allows removing another user when several admins exist", () => {
    expect(canRemoveUserFromCompany(OTHER, ME, 2)).toEqual({ allowed: true });
  });

  // BUG: the rule does not know whether the target is an admin. With a single
  // admin (the caller), removing a regular `company-user` is wrongly blocked
  // with "security_minOneAdminRequired". Needs the target's role as input.
  it.todo("allows removing a non-admin user when the caller is the only admin");
});

describe("canDowngradeAdmin", () => {
  it("blocks changing your own role", () => {
    expect(canDowngradeAdmin(ME, ME, 3)).toEqual({
      allowed: false,
      reasonKey: "security_cantChangeSelfRole",
    });
  });

  it("blocks downgrading the last admin", () => {
    expect(canDowngradeAdmin(OTHER, ME, 1)).toEqual({
      allowed: false,
      reasonKey: "security_cantLeaveEmptyAdmins",
    });
  });

  it("allows downgrading another admin when several exist", () => {
    expect(canDowngradeAdmin(OTHER, ME, 2)).toEqual({ allowed: true });
  });
});

describe("canRemoveSuperAdmin", () => {
  it("blocks removing your own super admin flag", () => {
    expect(canRemoveSuperAdmin(ME, ME)).toEqual({
      allowed: false,
      reasonKey: "security_cantRemoveSelfSuperAdmin",
    });
  });

  it("allows removing another super admin", () => {
    expect(canRemoveSuperAdmin(OTHER, ME)).toEqual({ allowed: true });
  });
});

describe("security reason keys", () => {
  const keys = [
    "security_cantDisableActiveCompany",
    "security_cantRemoveSelf",
    "security_minOneAdminRequired",
    "security_cantChangeSelfRole",
    "security_cantLeaveEmptyAdmins",
    "security_cantRemoveSelfSuperAdmin",
  ];

  it.each(keys)("%s is translated in every language", (key) => {
    for (const lang of Object.keys(translations) as Array<keyof typeof translations>) {
      expect(translations[lang]).toHaveProperty(key);
    }
  });
});
