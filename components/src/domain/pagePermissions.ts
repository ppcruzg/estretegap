export type PageRole = "owner" | "editor" | "viewer";

export type PagePermission = {
  pageId: string;
  userId: string;
  role: PageRole;
};

export function canEditPage(role: PageRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManagePermissions(role: PageRole): boolean {
  return role === "owner";
}

export function canDeletePage(role: PageRole): boolean {
  return role === "owner";
}
