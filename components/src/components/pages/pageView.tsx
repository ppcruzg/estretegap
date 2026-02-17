import React, { useEffect, useState } from "react"; // Forced rebuild check
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import ColumnGroup from "../ColumnGroup";
import FooterLinks from "../FooterLinks";
import PagePermissionsModal from "./PagePermissionsModal";
import ChangeHistoryPanel from "../ChangeHistoryPanel";
import RoadmapPanel from "../RoadmapPanel";
import MindMapPanel from "../MindMapPanel";
import GanttPanel from "../GanttPanel";
import SystemConfigPanel from "../SystemConfigPanel";
import ExecutiveTimeline from "../StrategicRoadmap";
import { X } from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";
import { useAppContext } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import { usePagePermission } from "../../hooks/usePagePermission";
import { getPageCapabilities } from "../../domain/pageGuards";
import * as Repo from "../../repository/estrategiaRepository";
import { PageSummary, PageData } from "../../types/columns";
import { PageConfig } from "../../../../types";
import { supabase } from "../../lib/supabaseClient";
import { Building2, LogIn, Loader2, Map } from "lucide-react";
import AuthContainer from "../AuthContainer";
import { getDefaultStatuses } from "../../helpers/statuses";
import { initializeOpenAI, isOpenAIInitialized } from "../../services/aiService";
import { useTranslation } from "../../hooks/useTranslation";


const PageView: React.FC = () => {
  const { activeCompanyId, loadingCompanies } = useCompany();
  const { currentUserId } = useAppContext();
  const { isSuperAdmin, profile, companyRole, loading: loadingAuth, isRoleLoading } = useAuth();
  const { t } = useTranslation();

  const [pages, setPages] = useState<PageSummary[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { canEdit: userCanEdit, loading: loadingPerms } = usePagePermission(
    currentPageId,
    profile?.id || null, // Standardized on Profile ID
    isSuperAdmin,
    companyRole === "company-admin"
  );

  const canEdit = isSuperAdmin || companyRole === "company-admin" || !!userCanEdit;
  const canCreatePage = isSuperAdmin || companyRole === "company-admin";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showExecutiveTimeline, setShowExecutiveTimeline] = useState(false);

  // ======================================================
  // CARGAR LISTA DE PÁGINAS
  // ======================================================
  useEffect(() => {
    if (!activeCompanyId) return;
    loadPages(activeCompanyId, true); // Initial load sets first page

    // Pre-inicializar OpenAI para los asistentes de las tarjetas
    const preInitAI = async () => {
      try {
        if (!isOpenAIInitialized()) {
          const apiKey = await Repo.getSystemConfig("openai_api_key");
          if (apiKey) initializeOpenAI(apiKey);
        }
      } catch (e) {
        console.warn("Soft-error initializing AI:", e);
      }
    };
    preInitAI();
  }, [activeCompanyId]);

  const loadPages = async (companyId: string, shouldSetInitial = false) => {
    const list = await Repo.getPagesList(companyId);
    setPages(list);

    if (shouldSetInitial && list.length > 0 && !currentPageId) {
      setCurrentPageId(list[0].id);
    }

    return list;
  };

  const refreshPages = async () => {
    if (!activeCompanyId) return;
    const list = await Repo.getPagesList(activeCompanyId);
    setPages(list);
    return list;
  };

  // ======================================================
  // CARGAR PÁGINA ACTIVA
  // ======================================================
  useEffect(() => {
    if (!currentPageId || !activeCompanyId) return;
    loadPage(currentPageId, activeCompanyId);
  }, [currentPageId, activeCompanyId]);

  const loadPage = async (pageId: string, companyId: string) => {
    setIsLoading(true);
    const page = await Repo.getPage(pageId, companyId);
    setCurrentPage(page);
    if (page) {
      document.title = `${page.pageConfig.title} | ESTRATEGA`;
    }
    setIsLoading(false);
  };

  // ======================================================
  // HANDLERS
  // ======================================================

  const handlePageSelect = (id: string) => {
    setCurrentPageId(id);
  };

  const handleCreatePage = async () => {
    if (!activeCompanyId || !profile?.id || canCreatePage === false) {
      console.warn("Blocked: user can't create pages", { activeCompanyId, profileId: profile?.id, canCreatePage });
      return;
    }

    const config: PageConfig = {
      identifier: `page-${Date.now()}`,
      title: t('newPageTitle'),
      description: "",
      footerTitle: "",
      footerDescription: "",
      footerVersion: "",
      footerButtonLabel: "",
      footerUrl: "",
    };

    try {
      // Pages table FK expects the internal profile.id
      const newPage = await Repo.createPage(config, profile.id, activeCompanyId);

      // Permissions table expects the internal Profile ID (profiles.id)
      await supabase.from("permissions").insert({
        page_id: newPage.id,
        user_id: profile.id, // Profile ID
        can_edit: true,
      });

      await loadPages(activeCompanyId, false);
      setCurrentPageId(newPage.id);
    } catch (error) {
      console.error("Error creating page:", error);
      alert(t('createPageError'));
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }

    try {
      // Repositories might be checking created_by (profile.id) or permissions (UUID)
      // Given the FK constraint, Repo should probably use profile.id
      await Repo.deletePage(pageId, profile.id);

      if (!activeCompanyId) return;

      const list = await loadPages(activeCompanyId, false);

      // If we deleted the active page, pick another one
      if (pageId === currentPageId) {
        if (list.length > 0) setCurrentPageId(list[0].id);
        else {
          setCurrentPageId(null);
          setCurrentPage(null);
        }
      }
    } catch (error: any) {
      console.error("Error deleting page:", error);
      alert(t('deletePageError') || `Error eliminando la página: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleRenamePage = async (newTitle: string) => {
    if (!currentPageId || canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }

    // 1. Snapshot update local state for immediate feedback
    setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, title: newTitle } : p));
    setCurrentPage((prev: any) => prev ? {
      ...prev,
      pageConfig: { ...prev.pageConfig, title: newTitle }
    } : prev);
    document.title = `${newTitle} | ESTRATEGA`;

    try {
      // Use internal Profile ID
      await Repo.updatePage(currentPageId, { title: newTitle }, profile.id);

      // 3. Final sync from DB to ensure identifier/etc are correct if changed
      await refreshPages();
    } catch (error) {
      console.error("Error renaming page:", error);
      // Revert on error
      if (activeCompanyId && currentPageId) {
        await loadPages(activeCompanyId, false);
        await loadPage(currentPageId, activeCompanyId);
      }
    }
  };

  const handleUpdatePageDescription = async (description: string) => {
    if (!currentPageId || canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }

    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          pageConfig: {
            ...prev.pageConfig,
            description,
          },
        }
        : prev
    );

    await Repo.updatePage(currentPageId, { description }, profile.id);
  };

  // ======================================================
  // COLUMNAS
  // ======================================================
  const handleAddColumn = async () => {
    if (!currentPageId || !profile?.id || canEdit === false) {
      console.warn('Blocked: user has no edit permissions or profile missing');
      return;
    }
    const newColumn = await Repo.createColumn(currentPageId, profile.id);

    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: [
            ...prev.columns,
            {
              ...newColumn,
              items: [],
              statusCategories: getDefaultStatuses().map(s => ({
                status_id: s.status_id,
                label: s.label,
                color: s.color,
                icon: s.icon,
              })),
            },
          ],
        }
        : prev
    );
  };

  const handleUpdateColumn = async (columnId: string, fields: any) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }
    await Repo.updateColumn(columnId, fields);
    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.map((c: any) =>
            c.id === columnId ? { ...c, ...fields } : c
          ),
        }
        : prev
    );
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }
    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.filter((c: any) => c.id !== columnId),
        }
        : prev
    );
    await Repo.deleteColumn(columnId);
  };

  // ======================================================
  // ITEMS
  // ======================================================
  const handleAddItem = async (columnId: string) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempItem = {
      id: tempId,
      label: t('newItem'),
      type: "leaf",
      position: Date.now(),
      status: "pendiente",
    };

    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.map((c: any) =>
            c.id === columnId
              ? { ...c, items: [...c.items, tempItem] }
              : c
          ),
        }
        : prev
    );

    const realItem = await Repo.createItem(columnId, profile.id);

    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.map((c: any) =>
            c.id === columnId
              ? {
                ...c,
                items: c.items.map((i: any) =>
                  i.id === tempId ? realItem : i
                ),
              }
              : c
          ),
        }
        : prev
    );
  };

  const handleUpdateItem = async (
    columnId: string,
    itemId: string,
    fields: any
  ) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }
    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.map((c: any) =>
            c.id === columnId
              ? {
                ...c,
                items: c.items.map((i: any) =>
                  i.id === itemId ? { ...i, ...fields } : i
                ),
              }
              : c
          ),
        }
        : prev
    );
    await Repo.updateItem(itemId, fields);
  };

  const handleDeleteItem = async (columnId: string, itemId: string) => {
    if (canEdit === false) {
      console.warn('Blocked: user has no edit permissions');
      return;
    }
    setCurrentPage((prev: any) =>
      prev
        ? {
          ...prev,
          columns: prev.columns.map((c: any) =>
            c.id === columnId
              ? {
                ...c,
                items: c.items.filter((i: any) => i.id !== itemId),
              }
              : c
          ),
        }
        : prev
    );
    await Repo.deleteItem(itemId);
  };

  const handleUpdateColumnStatuses = async (
    columnId: string,
    statuses: any[]
  ) => {
    // 1. Persistir en BD
    await Repo.updateColumnStatuses(columnId, statuses);

    // 2. Volver a cargar desde BD (source of truth)
    if (!activeCompanyId || !currentPageId) return;

    const freshPage = await Repo.getPage(currentPageId, activeCompanyId);

    setCurrentPage(freshPage);
  };

  const handleReorderColumns = async (newColumns: any[]) => {
    if (!currentPageId || canEdit === false) return;

    // 1. Update state immediately
    setCurrentPage(prev => prev ? { ...prev, columns: newColumns } : null);

    // 2. Persist to DB
    try {
      await Repo.reorderColumns(currentPageId, newColumns.map(c => c.id));
    } catch (error) {
      console.error("Error reordering columns:", error);
      if (activeCompanyId) loadPage(currentPageId, activeCompanyId);
    }
  };

  const handleReorderItems = async (columnId: string, newOrder: any[]) => {
    if (canEdit === false) return;

    // 1. Update state immediately
    setCurrentPage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        columns: prev.columns.map(c =>
          c.id === columnId ? { ...c, items: newOrder } : c
        )
      };
    });

    // 2. Persist to DB
    try {
      await Repo.reorderItems(columnId, newOrder.map(i => i.id));
    } catch (error) {
      console.error("Error reordering items:", error);
      if (activeCompanyId && currentPageId) loadPage(currentPageId, activeCompanyId);
    }
  };



  // ======================================================
  // RENDERIZADO
  // ======================================================
  if (!currentUserId && !loadingAuth) {
    return <AuthContainer />;
  }

  if (loadingAuth || loadingCompanies || isRoleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-sm" />
          <span className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">{t('syncingAccess')}</span>
        </div>
      </div>
    );
  }

  if (!activeCompanyId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('selectCompany')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {t('noCompanyAssigned')}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {t('refreshPage')}
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
        <Sidebar
          pages={pages}
          currentPageId={currentPageId}
          onPageSelect={handlePageSelect}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() =>
            setIsSidebarCollapsed((prev) => !prev)
          }
          canCreatePage={canCreatePage}
        />

        <div className="flex-1 flex flex-col">
          <TopBar
            pages={pages}
            currentPageId={currentPageId}
            onSelectPage={handlePageSelect}
            onCreatePage={handleCreatePage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
            pageDescription={currentPage?.pageConfig.description || ""}
            onUpdatePageDescription={handleUpdatePageDescription}
            canEdit={canEdit ?? false}
            canCreatePage={canCreatePage}
            companyRole={companyRole}
            onManagePermissions={() => setIsPermissionsModalOpen(true)}
            onShowHistory={() => setShowHistory(true)}
            onShowRoadmap={() => setShowRoadmap(true)}
            onShowMindMap={() => setShowMindMap(true)}
            onShowGantt={() => setShowGantt(true)}
            onShowConfig={() => setShowConfig(true)}
            onShowExecutiveTimeline={() => setShowExecutiveTimeline(true)}
          />

          {isLoading || !currentPage ? (
            <div className="p-4 text-slate-500 dark:text-slate-400">{t('loadingPage')}</div>
          ) : (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <ColumnGroup
                  columns={currentPage.columns}
                  onAddColumn={handleAddColumn}
                  onUpdateColumn={handleUpdateColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onMoveItem={handleReorderItems}
                  onReorderItems={handleReorderItems}
                  onReorderColumns={handleReorderColumns}
                  onUpdateStatuses={() => { }}
                  onUpdateColumnStatuses={handleUpdateColumnStatuses}
                  activeColorPicker={null}
                  setActiveColorPicker={() => { }}
                  currentPageTitle={currentPage.pageConfig.title}
                  pageId={currentPage.id}
                  canEdit={canEdit}
                />
              </div>

              <FooterLinks
                links={currentPage.documentationLinks}
                onCreate={async (fields) => {
                  if (canEdit === false) {
                    console.warn('Blocked: user has no edit permissions');
                    return;
                  }

                  const tempId = `temp-${Date.now()}`;
                  const temp = { id: tempId, ...fields };

                  setCurrentPage((prev: any) => ({
                    ...prev,
                    documentationLinks: [
                      ...prev.documentationLinks,
                      temp,
                    ],
                  }));

                  const real = await Repo.createDocumentationLink(
                    currentPage.id,
                    fields
                  );

                  setCurrentPage((prev: any) => ({
                    ...prev,
                    documentationLinks: prev.documentationLinks.map(
                      (l: any) => (l.id === tempId ? real : l)
                    ),
                  }));
                }}
                onUpdate={async (id, fields) => {
                  if (canEdit === false) {
                    console.warn('Blocked: user has no edit permissions');
                    return;
                  }
                  setCurrentPage((prev: any) => ({
                    ...prev,
                    documentationLinks: prev.documentationLinks.map(
                      (l: any) =>
                        l.id === id ? { ...l, ...fields } : l
                    ),
                  }));
                  await Repo.updateDocumentationLink(id, fields);
                }}
                onDelete={async (id) => {
                  if (canEdit === false) {
                    console.warn('Blocked: user has no edit permissions');
                    return;
                  }
                  setCurrentPage((prev: any) => ({
                    ...prev,
                    documentationLinks:
                      prev.documentationLinks.filter(
                        (l: any) => l.id !== id
                      ),
                  }));
                  await Repo.deleteDocumentationLink(id);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {
        currentPage && activeCompanyId && (
          <PagePermissionsModal
            isOpen={isPermissionsModalOpen}
            onClose={() => setIsPermissionsModalOpen(false)}
            pageId={currentPage.id}
            pageTitle={currentPage.pageConfig.title}
            companyId={activeCompanyId}
          />
        )
      }

      {showHistory && currentPage && (
        <ChangeHistoryPanel
          pageId={currentPage.id}
          pageTitle={currentPage.pageConfig.title}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showRoadmap && currentPage && (
        <RoadmapPanel
          pageId={currentPage.id}
          pageTitle={currentPage.pageConfig.title}
          onClose={() => setShowRoadmap(false)}
        />
      )}

      {showMindMap && currentPage && activeCompanyId && (
        <MindMapPanel
          pageId={currentPage.id}
          pageData={currentPage}
          onClose={() => setShowMindMap(false)}
        />
      )}

      {showGantt && currentPage && activeCompanyId && (
        <GanttPanel
          pageData={currentPage}
          onClose={() => setShowGantt(false)}
        />
      )}

      {showConfig && isSuperAdmin && (
        <SystemConfigPanel
          onClose={() => setShowConfig(false)}
        />
      )}

      {showExecutiveTimeline && currentPage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[2000] flex flex-col p-2 md:p-4 animate-in fade-in duration-500">
          {/* Header remains compact to give more room to the roadmap */}
          <div className="w-full max-w-[95%] mx-auto flex justify-between items-center py-4 px-6 mb-2 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Map size={20} />
              </div>
              <div>
                <h2 className="text-white font-black text-xl tracking-tight">Estratega Roadmap</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{currentPage.pageConfig.title}</p>
              </div>
            </div>

            <button
              onClick={() => setShowExecutiveTimeline(false)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-full transition-all duration-300 border border-white/10 hover:border-rose-500 backdrop-blur-md font-bold text-sm shadow-xl"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Cerrar</span>
            </button>
          </div>

          <div className="flex-1 w-full max-w-[98%] mx-auto overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 scrollbar-none border border-white/10 bg-white dark:bg-slate-950">
            <ExecutiveTimeline pageData={currentPage} />

            <div className="px-8 pb-20 pt-10 flex justify-center bg-white dark:bg-slate-950">
              <button
                onClick={() => setShowExecutiveTimeline(false)}
                className="px-12 py-4 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-black rounded-2xl transition-all active:scale-95 border border-slate-700 dark:border-slate-300 shadow-2xl"
              >
                Finalizar Revisión Estratégica
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PageView;
