import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  getCompanies,
  getProfiles,
  getCompanyUsers,
  assignUserToCompany,
  removeUserFromCompany,
  updateCompanyUserRole
} from "../../repository/adminRepository";
import { Company, Profile, CompanyUser } from "../../../../types";
import {
  UserPlus,
  Trash2,
  UserCog,
  Search,
  Loader2,
  Building2,
  Mail,
  Shield,
  ArrowRight
} from "lucide-react";
import Modal from "../Modal";
import { useAuth } from "../../contexts/AuthContext";
import {
  canRemoveUserFromCompany,
  canDowngradeAdmin
} from "../../domain/securityRules";
import { useTranslation } from "../../hooks/useTranslation";

const CompanyUsersScreen: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relations, setRelations] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const { profile: currentProfile, isSuperAdmin, profile: authProfile } = useAuth();
  const { t } = useTranslation();
  const currentProfileId = currentProfile?.id;
  const currentUserId = authProfile?.user_id; // Need matching UID if comparing with relations

  useEffect(() => {
    loadData();
  }, [isSuperAdmin, currentUserId]); // Reload if auth changes

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, profs, rels] = await Promise.all([
        getCompanies(),
        getProfiles(),
        getCompanyUsers()
      ]);

      // Filter companies if not superadmin
      let filteredComps = comps;
      // We use currentProfileId because company_users.user_id links to profiles.id
      if (!isSuperAdmin && currentProfileId) {
        const userAssignedIds = rels
          .filter(r => r.user_id === currentProfileId && r.role === 'company-admin')
          .map(r => r.company_id);
        filteredComps = comps.filter(c => userAssignedIds.includes(c.id));
      }

      setCompanies(filteredComps);
      setProfiles(profs);
      setRelations(rels);

      if (filteredComps.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(filteredComps[0].id);
      }
    } catch (error) {
      console.error(t('errorLoadingData'), error);
    } finally {
      setLoading(false);
    }
  };

  // Derivados
  const currentCompanyRelations = relations.filter(r => r.company_id === selectedCompanyId);
  const assignedUserIds = currentCompanyRelations.map(r => r.user_id); // These now store profiles.id
  const adminCount = currentCompanyRelations.filter(r => r.role === 'company-admin').length;

  const availableUsers = profiles.filter(p =>
    !assignedUserIds.includes(p.id) &&
    (p.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (p.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const handleAssign = async (userId: string, role: CompanyUser['role']) => {
    if (!selectedCompanyId) return;
    try {
      const newRel = await assignUserToCompany(userId, selectedCompanyId, role);
      await loadData();
    } catch (error) {
      console.error(t('errorAssigningUserMsg'), error);
      alert(t('errorAssigningUserMsg'));
    }
  };

  const handleRemove = async (relation: CompanyUser) => {
    if (currentProfileId) {
      const result = canRemoveUserFromCompany(relation.user_id, currentProfileId, adminCount);
      if (!result.allowed && result.reasonKey) {
        alert(t(result.reasonKey as any));
        return;
      }
    }

    if (!window.confirm(t('confirmRemoveUserFromCompany'))) return;

    try {
      await removeUserFromCompany(relation.id);
      setRelations(prev => prev.filter(r => r.id !== relation.id));
    } catch (error) {
      console.error(t('errorRemovingUserMsg'), error);
      alert(t('errorRemovingUserMsg'));
    }
  };

  const handleToggleRole = async (relation: CompanyUser) => {
    const newRole = relation.role === 'company-admin' ? 'company-user' : 'company-admin';

    if (relation.role === 'company-admin' && currentProfileId) {
      const result = canDowngradeAdmin(relation.user_id, currentProfileId, adminCount);
      if (!result.allowed && result.reasonKey) {
        alert(t(result.reasonKey as any));
        return;
      }
    }

    try {
      const updated = await updateCompanyUserRole(relation.id, newRole);
      setRelations(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (error) {
      console.error(t('errorUpdatingRoleMsg'), error);
      alert(t('errorUpdatingRoleMsg'));
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <AdminLayout title={t('companyUsers')}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">

        {/* Company Selector */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-blue-500 dark:text-blue-400" />
              {t('selectCompanyTitle')}
            </h3>
            <div className="space-y-2">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedCompanyId === company.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                >
                  <span className="font-medium truncate">{company.name}</span>
                  {selectedCompanyId === company.id && <ArrowRight size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* User Search for Assignment */}
          {selectedCompanyId && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-blue-500 dark:text-blue-400" />
                {t('assignNewUserTitle')}
              </h3>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('searchUserPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-100 text-xs"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    {t('noUsersAvailableMsg')}
                  </div>
                ) : (
                  availableUsers.map(profile => (
                    <div key={profile.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">{profile.name || profile.email}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mb-3">{profile.email}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssign(profile.id, 'company-user')}
                          className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          {t('standard')}
                        </button>
                        <button
                          onClick={() => handleAssign(profile.id, 'company-admin')}
                          className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-lg text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {t('administrador')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assignment List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {t('usersInHeader')} <span className="text-blue-600 dark:text-blue-400">{selectedCompany?.name || t('selectCompanyTitle')}</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('manageAccessRolesDesc')}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('userCol')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roleInCompany')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('actionsCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" />
                          <span>{t('loadingAssignmentsMsg')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : !selectedCompanyId ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        {t('selectCompanyOnLeft')}
                      </td>
                    </tr>
                  ) : currentCompanyRelations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        {t('noUsersAssignedYet')}
                      </td>
                    </tr>
                  ) : (
                    currentCompanyRelations.map((relation) => {
                      const profile = profiles.find(p => p.id === relation.user_id);
                      return (
                        <tr key={relation.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                {(profile?.name || profile?.email || "?").charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile?.name || t('noName')}</div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500">{profile?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleRole(relation)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${relation.role === 'company-admin'
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                              title={relation.role === 'company-admin'
                                ? t('companyAdminRoleTip')
                                : t('standardUserRoleTip')
                              }
                            >
                              <Shield size={12} />
                              {relation.role === 'company-admin' ? t('administrador') : t('standard')}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemove(relation)}
                              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                              title={t('removeFromCompanyTip')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompanyUsersScreen;