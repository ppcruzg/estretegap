import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  getCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus
} from "../../repository/adminRepository";
import { Company } from "@/types";
import {
  Building2,
  Plus,
  Edit2,
  Power,
  PowerOff,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react";
import Modal from "../Modal";
import IconButton from "../ui/IconButton";
import { useCompany } from "../../contexts/CompanyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { buttonClasses } from "../ui";
import { canDisableCompany } from "../../domain/securityRules";

const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { activeCompanyId } = useCompany();
  const { isSuperAdmin } = useAuth();
  const { t } = useTranslation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error(t('errorLoadingCompanies'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setCompanyName("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setCompanyName(company.name);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!companyName.trim()) return;
    setIsSaving(true);
    try {
      if (editingCompany) {
        const updated = await updateCompany(editingCompany.id, { name: companyName });
        setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await createCompany(companyName);
        setCompanies(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(t('errorSavingCompany'), error);
      alert(t('errorSavingCompany'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    // Security: do not disable active company
    if (company.is_enabled && activeCompanyId === company.id) {
      const result = canDisableCompany(company.id, activeCompanyId);
      if (!result.allowed && result.reasonKey) {
        alert(t(result.reasonKey as any));
        return;
      }
    }

    const confirmMsg = company.is_enabled
      ? t('confirmDeactivateCompany', { name: company.name })
      : t('confirmActivateCompany', { name: company.name });

    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleCompanyStatus(company.id, !company.is_enabled);
      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, is_enabled: !c.is_enabled } : c
      ));
    } catch (error) {
      console.error(t('errorChangingCompanyStatus'), error);
      alert(t('errorChangingCompanyStatus'));
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title={t('companyManagement')}>
      <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
        {/* ToolBar */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
              type="text"
              placeholder={t('searchCompany')}
              className="w-full h-10 pl-10 pr-4 bg-surface-muted text-fg border border-border rounded-control hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary transition-colors text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenCreate}
              className={buttonClasses("primary", "md")}
            >
              <Plus size={18} />
              {t('newCompany')}
            </button>
          )}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted/60">
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('nameCol')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider text-center">{t('statusCol')}</th>
                {isSuperAdmin && <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider text-right">{t('actionsCol')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-fg-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-primary" />
                      <span>{t('loadingCompanies')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-fg-muted">
                    {t('noCompaniesFound')}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-surface-muted/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-control ${company.is_enabled ? 'bg-primary-soft text-primary-soft-fg' : 'bg-surface-muted text-fg-subtle'}`}>
                          <Building2 size={20} />
                        </div>
                        <span className={`font-medium ${company.is_enabled ? 'text-fg' : 'text-fg-subtle line-through'}`}>
                          {company.name}
                        </span>
                        {activeCompanyId === company.id && (
                          <span className="text-[11px] px-1.5 py-0.5 bg-primary-soft text-primary-soft-fg rounded font-bold uppercase tracking-tight">
                            {t('currentBadge')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${company.is_enabled
                        ? "bg-success-soft text-success"
                        : "bg-surface-muted text-fg-muted"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${company.is_enabled ? 'bg-success' : 'bg-fg-subtle'}`} />
                        {company.is_enabled ? t('activeStatus') : t('inactiveStatus')}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            aria-label={company.is_enabled ? t('deactivateCompany') : t('activateCompany')}
                            size="sm"
                            onClick={() => handleToggleStatus(company)}
                            className={company.is_enabled
                              ? "text-danger/80 hover:text-danger hover:bg-danger-soft"
                              : "text-success/80 hover:text-success hover:bg-success-soft"}
                          >
                            {company.is_enabled ? <PowerOff size={16} /> : <Power size={16} />}
                          </IconButton>
                          <IconButton aria-label={t('editCompanyName')} size="sm" onClick={() => handleOpenEdit(company)}>
                            <Edit2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? t('editCompanyTitle') : t('newCompany')}
        footer={(
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className={buttonClasses("ghost", "md")}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !companyName.trim()}
              className={buttonClasses("primary", "md")}
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {editingCompany ? t('save') : t('createCompanyButton')}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          {!editingCompany && (
            <div className="flex items-start gap-3 p-3 bg-warning-soft border border-warning/25 rounded-control text-fg text-xs leading-relaxed">
              <AlertCircle size={20} className="shrink-0 text-warning" />
              <p>{t('newCompanyWarning')}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">{t('companyNameLabel')}</label>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-2 bg-surface text-fg border border-border rounded-control hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary transition-colors text-sm"
              placeholder={t('companyNamePlaceholder')}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && companyName.trim() && !isSaving) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCompanies;
