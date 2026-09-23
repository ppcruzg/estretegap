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
import { Company, Profile, CompanyUser } from "@/types";
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
import IconButton from "../ui/IconButton";
import { useAuth } from "../../contexts/AuthContext";
import {
  canRemoveUserFromCompany,
  canDowngradeAdmin
} from "../../domain/securityRules";
import { useTranslation } from "../../hooks/useTranslation";
import { buttonClasses } from "../ui";

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
          <div className="bg-surface rounded-card shadow-card border border-border p-6">
            <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              {t('selectCompanyTitle')}
            </h3>
            <div className="space-y-2">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  aria-pressed={selectedCompanyId === company.id}
                  className={`w-full text-left px-4 py-3 rounded-control transition-all flex items-center justify-between group ${selectedCompanyId === company.id
                    ? "bg-primary text-primary-fg shadow-card"
                    : "bg-surface-muted text-fg-muted hover:text-fg hover:bg-border"
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
            <div className="bg-surface rounded-card shadow-card border border-border p-6">
              <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-primary" />
                {t('assignNewUserTitle')}
              </h3>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                <input
                  type="text"
                  placeholder={t('searchUserPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-surface-muted text-fg border border-border rounded-control hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary text-xs"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-fg-muted">
                    {t('noUsersAvailableMsg')}
                  </div>
                ) : (
                  availableUsers.map(profile => (
                    <div key={profile.id} className="p-3 bg-surface-muted border border-border rounded-control hover:border-border-strong transition-all">
                      <div className="text-xs font-semibold text-fg truncate mb-1">{profile.name || profile.email}</div>
                      <div className="text-[11px] text-fg-muted truncate mb-3">{profile.email}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssign(profile.id, 'company-user')}
                          className="flex-1 py-1.5 bg-surface border border-border rounded-control text-[11px] font-bold text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
                        >
                          {t('standard')}
                        </button>
                        <button
                          onClick={() => handleAssign(profile.id, 'company-admin')}
                          className="flex-1 py-1.5 bg-primary-soft text-primary-soft-fg border border-primary/20 rounded-control text-[11px] font-bold hover:bg-primary/15 transition-colors"
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
          <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                {t('usersInHeader')} <span className="text-primary">{selectedCompany?.name || t('selectCompanyTitle')}</span>
              </h3>
              <p className="text-sm text-fg-muted mt-1">{t('manageAccessRolesDesc')}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-muted/60">
                    <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('userCol')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('roleInCompany')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider text-right">{t('actionsCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-fg-muted">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-primary" />
                          <span>{t('loadingAssignmentsMsg')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : !selectedCompanyId ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-fg-muted">
                        {t('selectCompanyOnLeft')}
                      </td>
                    </tr>
                  ) : currentCompanyRelations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-fg-muted">
                        {t('noUsersAssignedYet')}
                      </td>
                    </tr>
                  ) : (
                    currentCompanyRelations.map((relation) => {
                      const profile = profiles.find(p => p.id === relation.user_id);
                      return (
                        <tr key={relation.id} className="hover:bg-surface-muted/70 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-fg-muted font-bold uppercase text-xs">
                                {(profile?.name || profile?.email || "?").charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-fg">{profile?.name || t('noName')}</div>
                                <div className="text-[11px] text-fg-muted">{profile?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleRole(relation)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${relation.role === 'company-admin'
                                ? "bg-primary-soft text-primary-soft-fg hover:bg-primary/20"
                                : "bg-surface-muted text-fg-muted hover:bg-border"
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
                            <IconButton
                              aria-label={t('removeFromCompanyTip')}
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemove(relation)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
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