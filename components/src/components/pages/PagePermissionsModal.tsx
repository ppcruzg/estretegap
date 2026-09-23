import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { buttonClasses } from "../ui";
import {
    getPagePermissions,
    updatePagePermission,
    deletePagePermission,
    getCompanyUsersWithProfiles
} from "../../repository/estrategiaRepository";
import { Loader2, Shield, User, X, Check, Eye } from "lucide-react";

interface PagePermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: string;
    pageTitle: string;
    companyId: string;
}

const PagePermissionsModal: React.FC<PagePermissionsModalProps> = ({
    isOpen,
    onClose,
    pageId,
    pageTitle,
    companyId
}) => {
    const [loading, setLoading] = useState(true);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, pageId, companyId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [users, perms] = await Promise.all([
                getCompanyUsersWithProfiles(companyId),
                getPagePermissions(pageId)
            ]);
            setCompanyUsers(users);
            setPermissions(perms);
        } catch (error) {
            console.error("Error loading permissions data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = async (userId: string, currentCanEdit: boolean | null) => {
        setIsSaving(userId);
        try {
            if (currentCanEdit === null) {
                // Grant viewer access first? Or just go straight to editor? 
                // Our model is: if no record, you are a viewer (unless company-admin/superadmin).
                // Wait, if no record, are they a viewer? PRD v1.1 says: 
                // "company-user role... basically view-only... unless granted"
                // Let's stick to: if in company, they can view. Permissions table grants EDIT.
                await updatePagePermission(pageId, userId, true);
            } else if (currentCanEdit === true) {
                // Downgrade to viewer (delete record or set to false)
                await deletePagePermission(pageId, userId);
            }
            await loadData();
        } catch (error) {
            console.error("Error toggling permission:", error);
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Permisos: ${pageTitle}`}
            maxWidth="md"
        >
            <div className="space-y-4">
                <p className="text-xs text-fg-muted leading-relaxed">
                    Gestiona quién puede editar esta página. Los Administradores y Superadmins siempre tienen acceso total.
                </p>

                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-2 text-fg-muted">
                        <Loader2 className="animate-spin text-primary" />
                        <span className="text-sm">Cargando usuarios...</span>
                    </div>
                ) : (
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto pr-1">
                        {companyUsers.length === 0 ? (
                            <p className="text-center py-8 text-sm text-fg-muted">No hay otros usuarios en esta empresa.</p>
                        ) : (
                            companyUsers
                                .filter(u => u.role !== 'company-admin') // Don't manage admins here, they are always editors
                                .map((user) => {
                                    const perm = permissions.find(p => p.user_id === user.userId);
                                    const canEdit = perm?.can_edit ?? false;
                                    const saving = isSaving === user.userId;

                                    return (
                                        <div key={user.userId} className="py-3 flex items-center justify-between gap-4 group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-fg-muted font-bold uppercase text-xs shrink-0">
                                                    {(user.profile?.name || user.profile?.email || "?").charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-fg truncate">{user.profile?.name || "Sin nombre"}</div>
                                                    <div className="text-[11px] text-fg-muted truncate">{user.profile?.email}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleTogglePermission(user.userId, canEdit)}
                                                disabled={!!isSaving}
                                                aria-pressed={canEdit}
                                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all disabled:opacity-60 ${canEdit
                                                        ? "bg-primary text-primary-fg shadow-card"
                                                        : "bg-surface-muted text-fg-muted hover:text-fg hover:bg-border"
                                                    }`}
                                            >
                                                {saving ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : canEdit ? (
                                                    <Shield size={14} />
                                                ) : (
                                                    <Eye size={14} />
                                                )}
                                                {canEdit ? "Editor" : "Visor"}
                                            </button>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                <div className="pt-4 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className={buttonClasses("secondary", "md")}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PagePermissionsModal;
