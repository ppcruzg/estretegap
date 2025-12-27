export type PageCapabilities = {
  canView: boolean;
  canEdit: boolean;
  canManagePermissions: boolean;
  canDelete: boolean;
};

export function getPageCapabilities(
  canEdit: boolean | null
): PageCapabilities {
  return {
    canView: true,
    canEdit: canEdit, // Allow null/undefined during loading
    canManagePermissions: false, // Simplified for alignment, can be expanded later
    canDelete: false, // Simplified for alignment, can be expanded later
  };
}
