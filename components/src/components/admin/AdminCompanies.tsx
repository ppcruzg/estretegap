import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  getCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus
} from "../../repository/adminRepository";
import { Company } from "../../../../types";
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
import { useCompany } from "../../contexts/CompanyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* ToolBar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchCompany')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
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
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('nameCol')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{t('statusCol')}</th>
                {isSuperAdmin && <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('actionsCol')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" />
                      <span>{t('loadingCompanies')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    {t('noCompaniesFound')}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${company.is_enabled ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          <Building2 size={20} />
                        </div>
                        <span className={`font-medium ${company.is_enabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                          {company.name}
                        </span>
                        {activeCompanyId === company.id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-bold uppercase tracking-tight">
                            {t('currentBadge')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${company.is_enabled
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${company.is_enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {company.is_enabled ? t('activeStatus') : t('inactiveStatus')}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(company)}
                            className={`p-2 rounded-lg transition-all ${company.is_enabled
                              ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                            title={company.is_enabled ? t('deactivateCompany') : t('activateCompany')}
                          >
                            {company.is_enabled ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(company)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title={t('editCompanyName')}
                          >
                            <Edit2 size={16} />
                          </button>
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
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !companyName.trim()}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {editingCompany ? t('save') : t('createCompanyButton')}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          {!editingCompany && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              <AlertCircle size={20} className="shrink-0 text-amber-500" />
              <p>{t('newCompanyWarning')}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('companyNameLabel')}</label>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
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
