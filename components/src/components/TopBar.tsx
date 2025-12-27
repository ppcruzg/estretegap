import React, { useEffect, useState } from "react";
import { PageSummary } from "../types/columns";
import { useCompany } from "../contexts/CompanyContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import {
  Plus,
  Trash2,
  Edit3,
  Building2,
  User,
  ChevronDown,
  Check,
  X,
  Layout,
  FileText,
  Users,
  Clock,
  TrendingUp,
  Settings,
  Languages,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface TopBarProps {
  pages: PageSummary[];
  currentPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (newTitle: string) => void;
  pageDescription: string;
  onUpdatePageDescription: (desc: string) => void;
  canEdit: boolean;
  canCreatePage: boolean;
  companyRole?: "company-admin" | "company-user" | null;
  onManagePermissions?: () => void;
  onShowHistory?: () => void;
  onShowRoadmap?: () => void;
  onShowConfig?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  pageDescription,
  onUpdatePageDescription,
  canEdit,
  canCreatePage,
  companyRole,
  onManagePermissions,
  onShowHistory,
  onShowRoadmap,
  onShowConfig
}) => {
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany();
  const { profile, isSuperAdmin } = useAuth();
  const { t, language, toggleLanguage } = useTranslation();
  const currentPage = pages.find((p) => p.id === currentPageId);

  // Descripción editable
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(pageDescription);

  // Título editable (Renombrar integrado)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    setDescDraft(pageDescription);
    setIsEditingDesc(false);
  }, [pageDescription]);

  useEffect(() => {
    if (currentPage) setTitleDraft(currentPage.title);
  }, [currentPage]);

  const { theme, toggleTheme } = useTheme();
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  const handleRenameSubmit = () => {
    if (titleDraft.trim() && titleDraft !== currentPage?.title) {
      onRenamePage(titleDraft);
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      {/* IZQUIERDA: Marca + Empresa + Selector Página */}
      <div className="flex items-center gap-6 flex-1 min-w-0">

        {/* Selector de Empresa (Premium) */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Building2 size={18} />
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">{t('company')}</span>
              <select
                value={activeCompanyId ?? ""}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-900 dark:text-slate-100 outline-none appearance-none cursor-pointer pr-4"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

        {/* Título y Selector de Página */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layout size={18} />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 group">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 bg-white border border-blue-500 rounded-md px-2 py-0.5 shadow-sm">
                  <input
                    autoFocus
                    className="text-lg font-bold text-slate-900 outline-none w-full"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") {
                        setIsEditingTitle(false);
                        setTitleDraft(currentPage?.title || "");
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentPage?.title || t('selectPage')}
                  </h2>
                  {currentPage && canEdit && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-md transition-all text-slate-400 hover:text-blue-600"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Descripción (Subtítulo) */}
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-slate-400 shrink-0" />
              {isEditingDesc ? (
                <input
                  autoFocus
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => {
                    setIsEditingDesc(false);
                    onUpdatePageDescription(descDraft);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingDesc(false);
                      onUpdatePageDescription(descDraft);
                    }
                    if (e.key === "Escape") {
                      setIsEditingDesc(false);
                      setDescDraft(pageDescription);
                    }
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 bg-transparent border-b border-blue-400 outline-none w-full"
                  placeholder={t('addPageDescription')}
                />
              ) : (
                <span
                  className={`text-xs text-slate-500 dark:text-slate-400 truncate block transition-colors ${canEdit ? "cursor-text hover:text-slate-900 dark:hover:text-slate-200" : ""}`}
                  onClick={() => canEdit && setIsEditingDesc(true)}
                  title={pageDescription || t('addPageDescription')}
                >
                  {pageDescription || (canEdit ? t('addPageDescription') : "")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DERECHA: Acciones de Página + Perfil de Usuario */}
      <div className="flex items-center gap-4 shrink-0">

        {/* Boton de Idioma */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition-all active:scale-95 group"
          title={language === 'es' ? t('switchToEnglish') : t('switchToSpanish')}
        >
          <Languages size={16} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-tight">{language}</span>
        </button>

        {/* Boton de Tema */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
          {canCreatePage && (
            <button
              onClick={onCreatePage}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{t('newPage')}</span>
            </button>
          )}

          {currentPage && onShowRoadmap && (
            <button
              onClick={onShowRoadmap}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all"
              title={t('viewRoadmapAI')}
            >
              <TrendingUp size={16} />
            </button>
          )}

          {currentPage && onShowHistory && (
            <button
              onClick={onShowHistory}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title={t('viewHistory')}
            >
              <Clock size={16} />
            </button>
          )}

          {isSuperAdmin && onShowConfig && (
            <button
              onClick={onShowConfig}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
              title={t('systemConfig')}
            >
              <Settings size={16} />
            </button>
          )}

          {currentPage && canEdit && (
            <button
              onClick={() => {
                if (window.confirm(t('confirmDeletePage', { title: currentPage.title }))) {
                  onDeletePage(currentPage.id);
                }
              }}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
              title={t('deletePage')}
            >
              <Trash2 size={16} />
            </button>
          )}

          {currentPage && (isSuperAdmin || companyRole === 'company-admin') && (
            <button
              onClick={onManagePermissions}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
              title={t('managePermissions')}
            >
              <Users size={16} />
            </button>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Perfil de Usuario (Premium) */}
        <div className="flex items-center gap-3 pl-2 group">
          <div className="flex flex-col items-end hidden md:flex text-right">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {profile?.name || t('user')}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isSuperAdmin
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              : companyRole === "company-admin"
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
              {isSuperAdmin ? t('superadmin') : companyRole === "company-admin" ? t('admin') : t('consultant')}
            </span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm relative group-hover:border-blue-300 transition-all">
            <User size={20} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
