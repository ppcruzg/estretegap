import React from "react";
import { PageSummary } from "../types/columns";
import { ChevronLeft, ChevronRight, FileText, Shield, LogOut, Plus, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "../hooks/useTranslation";

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

  return (
    <div
      className={`
        ${isCollapsed ? "w-16" : "w-72"}
        bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950
        border-r
        border-slate-200 dark:border-slate-800
        transition-all
        duration-300
        flex
        flex-col
        shadow-sm
      `}
    >
      {/* HEADER - BRANDING */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Layers size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">ESTRATEGA</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('strategicManagement')}</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('collapse')}
            >
              <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Layers size={20} className="text-white" />
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('expand')}
            >
              <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN DE PÁGINAS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER PÁGINAS + BOTÓN CREAR */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('pages')}</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{pages.length}</span>
            </div>
            {canCreatePage && (
              <button
                onClick={onCreatePage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-semibold"
              >
                <Plus size={16} />
                {t('newPage')}
              </button>
            )}
          </div>
        )}

        {/* LISTA DE PÁGINAS */}
        <div className="flex-1 overflow-auto px-3 py-3 space-y-1.5">
          {pages.map((page) => {
            const isActive = currentPageId === page.id;

            return (
              <div
                key={page.id}
                onClick={() => onPageSelect(page.id)}
                className={`
                  group cursor-pointer rounded-xl transition-all duration-200
                  ${isCollapsed ? "flex justify-center p-3" : "flex items-center justify-between p-3"}
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                  }
                `}
                title={isCollapsed ? page.title : undefined}
              >
                {isCollapsed ? (
                  <FileText
                    size={18}
                    className={`${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      } transition-colors`}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText
                        size={18}
                        className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"
                          }`}
                      />
                      <span className={`text-sm font-medium truncate ${isActive ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"
                        }`}>
                        {page.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(t('confirmDeletePage', { title: page.title }))
                        ) {
                          onDeletePage(page.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                      title={t('deletePage')}
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {pages.length === 0 && !isCollapsed && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('noPages')}</p>
              {canCreatePage && <p className="text-xs mt-1">{t('createFirstPage')}</p>}
            </div>
          )}
        </div>
      </div>

      {/* PANEL ADMIN (Superadmins & Company Admins) */}
      {canAccessAdmin && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            to="/admin/users"
            className={`
              flex items-center gap-3 rounded-xl transition-all duration-200
              ${isCollapsed ? "justify-center p-3" : "px-4 py-3"}
              text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md border-2 border-transparent hover:border-blue-100 dark:hover:border-blue-900 bg-white/50 dark:bg-slate-900/50
            `}
            title={t('adminPanel')}
          >
            <Shield size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">{t('adminPanel')}</span>}
          </Link>
        </div>
      )}

      {/* BOTÓN CERRAR SESIÓN */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className={`
            w-full flex items-center gap-3 rounded-xl transition-all duration-200
            ${isCollapsed ? "justify-center p-3" : "px-4 py-3"}
            text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 border-2 border-transparent hover:border-red-100 dark:hover:border-red-900
          `}
          title={t('signOut')}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{t('signOut')}</span>}
        </button>
      </div>

      {/* VERSIÓN */}
      <div className="py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-none">
          v1.1.0
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
