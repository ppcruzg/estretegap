import React, { useEffect, useState } from "react";
import { PageSummary } from "@/types";
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
  Network,
  GanttChart,
  Map
} from "lucide-react";
import ThemePicker from "./ThemePicker";
import IconButton from "./ui/IconButton";
import { Button } from "./ui";

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
  onShowMindMap?: () => void;
  onShowGantt?: () => void;
  onShowConfig?: () => void;
  onShowExecutiveTimeline?: () => void;
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
  onShowMindMap,
  onShowGantt,
  onShowConfig,
  onShowExecutiveTimeline
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

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  const handleRenameSubmit = () => {
    if (titleDraft.trim() && titleDraft !== currentPage?.title) {
      onRenamePage(titleDraft);
    }
    setIsEditingTitle(false);
  };

  const roleBadge = isSuperAdmin
    ? "bg-warning-soft text-warning"
    : companyRole === "company-admin"
      ? "bg-primary-soft text-primary-soft-fg"
      : "bg-surface-muted text-fg-muted";

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-colors">
      {/* IZQUIERDA: Marca + Empresa + Selector Página */}
      <div className="flex items-center gap-6 flex-1 min-w-0">

        {/* Selector de Empresa */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 bg-surface-muted border border-border rounded-control hover:border-border-strong focus-within:ring-2 focus-within:ring-ring transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
              <Building2 size={18} />
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-[11px] uppercase font-semibold tracking-wide text-fg-muted leading-none">{t('company')}</span>
              <select
                value={activeCompanyId ?? ""}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                aria-label={t('company')}
                className="bg-transparent text-sm font-semibold text-fg outline-none appearance-none cursor-pointer pr-4"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown size={14} className="text-fg-subtle" />
          </div>
        </div>

        <div className="h-8 w-px bg-border hidden md:block" />

        {/* Título y Selector de Página */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-control bg-primary-soft text-primary-soft-fg flex items-center justify-center">
            <Layout size={18} />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 group">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 bg-surface border border-primary rounded-control px-2 py-0.5 ring-2 ring-ring/30">
                  <input
                    autoFocus
                    className="text-lg font-bold text-fg bg-transparent outline-none w-full"
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
                  <h2 className="text-lg font-bold text-fg tracking-tight truncate">
                    {currentPage?.title || t('selectPage')}
                  </h2>
                  {currentPage && canEdit && (
                    <IconButton
                      aria-label={t('renamePage')}
                      size="sm"
                      onClick={() => setIsEditingTitle(true)}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Edit3 size={14} />
                    </IconButton>
                  )}
                </>
              )}
            </div>

            {/* Descripción (Subtítulo) */}
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-fg-subtle shrink-0" />
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
                  className="text-xs text-fg-muted bg-transparent border-b border-primary outline-none w-full"
                  placeholder={t('addPageDescription')}
                />
              ) : (
                <span
                  className={`text-xs text-fg-muted truncate block transition-colors ${canEdit ? "cursor-text hover:text-fg" : ""}`}
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
      <div className="flex items-center gap-3 shrink-0">

        {/* Boton de Idioma */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-muted border border-border rounded-control text-fg-muted hover:text-primary-soft-fg hover:border-border-strong transition-colors active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={language === 'es' ? t('switchToEnglish') : t('switchToSpanish')}
          aria-label={language === 'es' ? t('switchToEnglish') : t('switchToSpanish')}
        >
          <Languages size={16} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-tight">{language}</span>
        </button>

        {/* Selector de Tema (paleta + claro/oscuro) */}
        <ThemePicker />

        {/* Botones de Acción */}
        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-control border border-border transition-colors">
          {canCreatePage && (
            <Button size="sm" onClick={onCreatePage} className="mr-1">
              <Plus size={14} />
              <span className="hidden sm:inline">{t('newPage')}</span>
            </Button>
          )}

          {currentPage && onShowRoadmap && (
            <IconButton size="sm" aria-label={t('viewRoadmapAI')} onClick={onShowRoadmap}>
              <TrendingUp size={16} />
            </IconButton>
          )}

          {currentPage && onShowExecutiveTimeline && (
            <IconButton size="sm" aria-label={t('executiveRoadmap')} onClick={onShowExecutiveTimeline}>
              <Map size={16} />
            </IconButton>
          )}

          {currentPage && onShowMindMap && (
            <IconButton size="sm" aria-label={t('viewMindMap')} onClick={onShowMindMap}>
              <Network size={16} />
            </IconButton>
          )}

          {currentPage && onShowGantt && (
            <IconButton size="sm" aria-label={t('viewGantt')} onClick={onShowGantt}>
              <GanttChart size={16} />
            </IconButton>
          )}

          {currentPage && onShowHistory && (
            <IconButton size="sm" aria-label={t('viewHistory')} onClick={onShowHistory}>
              <Clock size={16} />
            </IconButton>
          )}

          {isSuperAdmin && onShowConfig && (
            <IconButton size="sm" aria-label={t('systemConfig')} onClick={onShowConfig}>
              <Settings size={16} />
            </IconButton>
          )}

          {currentPage && canEdit && (
            <IconButton
              size="sm"
              variant="danger"
              aria-label={t('deletePage')}
              onClick={() => {
                if (window.confirm(t('confirmDeletePage', { title: currentPage.title }))) {
                  onDeletePage(currentPage.id);
                }
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          )}

          {currentPage && (isSuperAdmin || companyRole === 'company-admin') && (
            <IconButton size="sm" aria-label={t('managePermissions')} onClick={onManagePermissions}>
              <Users size={16} />
            </IconButton>
          )}
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-3 pl-1 group">
          <div className="flex-col items-end hidden md:flex text-right">
            <span className="text-sm font-semibold text-fg leading-tight">
              {profile?.name || t('user')}
            </span>
            <span className={`mt-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${roleBadge}`}>
              {isSuperAdmin ? t('superadmin') : companyRole === "company-admin" ? t('admin') : t('consultant')}
            </span>
          </div>
          <div className="w-10 h-10 bg-surface-muted border border-border rounded-full flex items-center justify-center text-fg-muted relative group-hover:border-border-strong transition-colors">
            <User size={20} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-surface rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
