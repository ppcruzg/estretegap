export type RuleResult = {
  allowed: boolean;
  reasonKey?: string;
};

export function canDisableCompany(
  companyId: string,
  activeCompanyId: string
): RuleResult {
  if (companyId === activeCompanyId) {
    return {
      allowed: false,
      reasonKey: "security_cantDisableActiveCompany",
    };
  }
  return { allowed: true };
}

export function canRemoveUserFromCompany(
  targetUserId: string,
  currentUserId: string,
  adminCount: number
): RuleResult {
  if (targetUserId === currentUserId) {
    return {
      allowed: false,
      reasonKey: "security_cantRemoveSelf",
    };
  }
  if (adminCount <= 1) {
    return {
      allowed: false,
      reasonKey: "security_minOneAdminRequired",
    };
  }
  return { allowed: true };
}

export function canDowngradeAdmin(
  targetUserId: string,
  currentUserId: string,
  adminCount: number
): RuleResult {
  if (targetUserId === currentUserId) {
    return {
      allowed: false,
      reasonKey: "security_cantChangeSelfRole",
    };
  }
  if (adminCount <= 1) {
    return {
      allowed: false,
      reasonKey: "security_cantLeaveEmptyAdmins",
    };
  }
  return { allowed: true };
}

export function canRemoveSuperAdmin(
  targetUserId: string,
  currentUserId: string
): RuleResult {
  if (targetUserId === currentUserId) {
    return {
      allowed: false,
      reasonKey: "security_cantRemoveSelfSuperAdmin",
    };
  }
  return { allowed: true };
}
