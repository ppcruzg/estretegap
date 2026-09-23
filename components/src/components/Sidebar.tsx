import React from "react";
import { PageSummary } from "@/types";
import { ChevronLeft, ChevronRight, FileText, Shield, LogOut, Plus, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "../hooks/useTranslation";
import { Button, IconButton, cn, focusRing } from "./ui";

interface SidebarProps {
  pages: PageSummary[];
  currentPageId: string | null;
  onPageSelect: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (pageId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canCreatePage?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  isCollapsed,
  onToggleCollapse,
  canCreatePage = false,
}) => {
  const { isSuperAdmin, companyRole } = useAuth();
  const { t } = useTranslation();

  const canAccessAdmin = isSuperAdmin || companyRole === 'company-admin';

  const brandMark = (
    <div className="w-10 h-10 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
      <Layers size={20} />
    </div>
  );

  return (
    <div
      className={cn(
        isCollapsed ? "w-16" : "w-72",
        "bg-surface border-r border-border transition-all duration-300 flex flex-col",
      )}
    >
      {/* HEADER - BRANDING */}
      <div className="p-4 border-b border-border transition-colors">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {brandMark}
              <div>
                <h1 className="text-lg font-bold text-fg tracking-tight">ESTRATEGA</h1>
                <p className="text-xs text-fg-muted">{t('strategicManagement')}</p>
              </div>
            </div>
            <IconButton aria-label={t('collapse')} onClick={onToggleCollapse}>
              <ChevronLeft size={18} />
            </IconButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {brandMark}
            <IconButton aria-label={t('expand')} size="sm" onClick={onToggleCollapse}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
        )}
      </div>

      {/* SECCIÓN DE PÁGINAS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER PÁGINAS + BOTÓN CREAR */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages')}</h2>
              <span className="text-xs font-medium text-fg-muted bg-surface-muted px-1.5 py-0.5 rounded-md">{pages.length}</span>
            </div>
            {canCreatePage && (
              <Button onClick={onCreatePage} className="w-full">
                <Plus size={16} />
                {t('newPage')}
              </Button>
            )}
          </div>
        )}

        {/* LISTA DE PÁGINAS */}
        <div className="flex-1 overflow-auto px-3 py-3 space-y-1">
          {pages.map((page) => {
            const isActive = currentPageId === page.id;

            return (
              <div
                key={page.id}
                onClick={() => onPageSelect(page.id)}
                className={cn(
                  "group cursor-pointer rounded-control border transition-colors duration-150",
                  isCollapsed ? "flex justify-center p-2.5" : "flex items-center justify-between px-3 py-2.5",
                  isActive
                    ? "bg-primary-soft border-transparent"
                    : "border-transparent hover:bg-surface-muted",
                )}
                title={isCollapsed ? page.title : undefined}
              >
                {isCollapsed ? (
                  <FileText
                    size={18}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-primary-soft-fg" : "text-fg-subtle group-hover:text-fg-muted",
                    )}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText
                        size={18}
                        className={cn("flex-shrink-0", isActive ? "text-primary-soft-fg" : "text-fg-subtle")}
                      />
                      <span
                        className={cn(
                          "text-sm truncate",
                          isActive ? "font-semibold text-primary-soft-fg" : "font-medium text-fg",
                        )}
                      >
                        {page.title}
                      </span>
                    </div>

                    <IconButton
                      aria-label={t('deletePage')}
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(t('confirmDeletePage', { title: page.title }))
                        ) {
                          onDeletePage(page.id);
                        }
                      }}
                      className="h-7 w-7 ml-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <span className="text-lg leading-none">×</span>
                    </IconButton>
                  </>
                )}
              </div>
            );
          })}

          {pages.length === 0 && !isCollapsed && (
            <div className="flex flex-col items-center justify-center py-12 text-fg-subtle">
              <FileText size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium text-fg-muted">{t('noPages')}</p>
              {canCreatePage && <p className="text-xs mt-1 text-fg-muted">{t('createFirstPage')}</p>}
            </div>
          )}
        </div>
      </div>

      {/* PANEL ADMIN (Superadmins & Company Admins) */}
      {canAccessAdmin && (
        <div className="p-3 border-t border-border">
          <Link
            to="/admin/users"
            className={cn(
              "flex items-center gap-3 rounded-control transition-colors duration-150 text-fg-muted hover:bg-primary-soft hover:text-primary-soft-fg",
              isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
              focusRing,
            )}
            title={t('adminPanel')}
          >
            <Shield size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">{t('adminPanel')}</span>}
          </Link>
        </div>
      )}

      {/* BOTÓN CERRAR SESIÓN */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className={cn(
            "w-full flex items-center gap-3 rounded-control transition-colors duration-150 text-fg-muted hover:bg-danger-soft hover:text-danger",
            isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
            focusRing,
          )}
          title={t('signOut')}
          aria-label={isCollapsed ? t('signOut') : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{t('signOut')}</span>}
        </button>
      </div>

      {/* VERSIÓN */}
      <div className="py-2 border-t border-border flex items-center justify-center">
        <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-widest leading-none">
          v1.3.0
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
