import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getProfiles, toggleSuperAdmin, updateProfile, signUpAdminUser, getCompanies, getCompanyUsers, removeUserFromCompany, assignUserToCompany, updateCompanyUserRole } from "../../repository/adminRepository";
import { Profile, Company, CompanyUser } from "../../../../types";
import { Search, UserCog, ShieldCheck, ShieldAlert, Edit2, Loader2, UserPlus, Mail } from "lucide-react";
import Modal from "../Modal";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const { isSuperAdmin, profile: currentProfile } = useAuth();
  const currentProfileId = currentProfile?.id;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFields, setEditFields] = useState({
    name: "",
    companyId: "",
    role: "company-user" as "company-admin" | "company-user"
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    companyId: "",
    role: "company-user" as "company-admin" | "company-user",
    isSuperAdmin: false
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error(t('errorLoadingCompanies'), error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [profilesData, relsData] = await Promise.all([
        getProfiles(),
        getCompanyUsers()
      ]);
      setUsers(profilesData);
      setCompanyUsers(relsData);
    } catch (error) {
      console.error(t('errorLoadingUsers'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (profileId: string, currentStatus: boolean) => {
    if (!isSuperAdmin) {
      alert(t('onlySuperadminsManageGlobal'));
      return;
    }
    try {
      await toggleSuperAdmin(profileId, !currentStatus);
      setUsers(prev =>
        prev.map(u => u.id === profileId ? { ...u, is_admin: !currentStatus } : u)
      );
    } catch (error) {
      console.error(t('errorUpdatingSuperadmin'), error);
      alert(t('errorUpdatingSuperadmin'));
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser({ ...user });

    // Find current company assignment
    const userRel = companyUsers.find(cu => cu.user_id === user.id);
    setEditFields({
      name: user.name || "",
      companyId: userRel?.company_id || "",
      role: (userRel?.role as any) || "company-user"
    });

    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      // 1. Update Profile Name
      await updateProfile(editingUser.id, {
        name: editFields.name,
      });

      // 2. Handle Company Assignment
      const currentRel = companyUsers.find(cu => cu.user_id === editingUser.id);

      if (!editFields.companyId) {
        // If "None" selected, remove from company if they were in one
        if (currentRel) {
          await removeUserFromCompany(currentRel.id);
        }
      } else {
        if (currentRel) {
          // Update existing
          if (currentRel.company_id !== editFields.companyId || currentRel.role !== editFields.role) {
            if (currentRel.company_id === editFields.companyId) {
              await updateCompanyUserRole(currentRel.id, editFields.role);
            } else {
              await removeUserFromCompany(currentRel.id);
              await assignUserToCompany(editingUser.id, editFields.companyId, editFields.role);
            }
          }
        } else {
          // Create new assignment
          await assignUserToCompany(editingUser.id, editFields.companyId, editFields.role);
        }
      }

      await loadUsers(); // Refresh everything
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(t('errorSavingProfile'), error);
      alert(t('errorSavingChanges'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email.trim()) return;
    setIsSaving(true);
    try {
      await signUpAdminUser(
        newUser.email,
        newUser.name,
        newUser.companyId || undefined,
        newUser.companyId ? newUser.role : undefined,
        newUser.isSuperAdmin
      );

      alert(t('userInvitedMessage'));
      setIsCreateModalOpen(false);
      setNewUser({ email: "", name: "", companyId: "", role: "company-user", isSuperAdmin: false });
      // Reload to see if profile was created
      setTimeout(loadUsers, 2000);
    } catch (error: any) {
      console.error(t('errorCreatingUser'), error);
      alert(`Error: ${error.message || t('errorCreatingUser')}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    // 1. If not superadmin, hide other superadmins entirely
    if (!isSuperAdmin && u.is_admin) return false;

    // 2. If not superadmin, only show users belonging to the same companies as the current admin
    if (!isSuperAdmin && currentProfileId) {
      const myManagedCompanyIds = companyUsers
        .filter(cu => cu.user_id === currentProfileId && cu.role === 'company-admin')
        .map(cu => cu.company_id);

      const userCompanyIds = companyUsers
        .filter(cu => cu.user_id === u.id)
        .map(cu => cu.company_id);

      const hasCommonCompany = userCompanyIds.some(cid => myManagedCompanyIds.includes(cid));
      if (!hasCommonCompany && u.id !== currentProfileId) return false;
    }

    return matchesSearch;
  });

  return (
    <AdminLayout title={t('userManagement')}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* ToolBar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchByEmailOrName')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t('showingUsers', { count: filteredUsers.length.toString() })}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            {t('addUser')}
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('userCol')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roleCol')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" />
                      <span>{t('loadingUsers')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    {t('noUsersFound')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold uppercase text-sm">
                          {(user.name || user.email).charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{user.name || t('noName')}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 md:hidden">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={!isSuperAdmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 transition-all ${isSuperAdmin ? "hover:bg-emerald-200 dark:hover:bg-emerald-900/50" : "opacity-75 cursor-default"}`}
                          title={isSuperAdmin ? t('superadminTip') : t('superadminDesc')}
                        >
                          <ShieldCheck size={14} />
                          {t('superadmin')}
                        </button>
                      ) : companyUsers.some(cu => cu.user_id === user.id && cu.role === 'company-admin') ? (
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={!isSuperAdmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-all ${isSuperAdmin ? "hover:bg-blue-200 dark:hover:bg-blue-900/50" : "opacity-75 cursor-default"}`}
                          title={isSuperAdmin ? t('adminTip') : t('adminDesc')}
                        >
                          <UserCog size={14} />
                          {t('administrador')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={!isSuperAdmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all ${isSuperAdmin ? "hover:bg-slate-200 dark:hover:bg-slate-700" : "opacity-75 cursor-default"}`}
                          title={isSuperAdmin ? t('userTip') : t('userDesc')}
                        >
                          <ShieldAlert size={14} />
                          {t('userCol')}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-600 border border-transparent text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        title={t('editUser')}
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('editProfile')}
        footer={(
          <>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveUser}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {t('save')}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input
              type="text"
              disabled
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed"
              value={editingUser?.email || ""}
            />
            <p className="mt-1 text-[11px] text-slate-400">{t('emailCantBeModified')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('fullName')}</label>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
              value={editFields.name}
              onChange={(e) => setEditFields(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('companies')}</label>
              <select
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
                value={editFields.companyId}
                onChange={(e) => setEditFields(prev => ({ ...prev, companyId: e.target.value }))}
              >
                <option value="">{t('none')}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('roleInCompany')}</label>
              <select
                disabled={!editFields.companyId}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm disabled:opacity-50"
                value={editFields.role}
                onChange={(e) => setEditFields(prev => ({ ...prev, role: e.target.value as any }))}
              >
                <option value="company-user">{t('userViewer')}</option>
                <option value="company-admin">{t('administrador')}</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('inviteNewUser')}
        footer={(
          <>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleCreateUser}
              disabled={isSaving || !newUser.email.trim()}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {t('inviteUserButton')}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex gap-3">
            <Mail className="text-blue-500 dark:text-blue-400 shrink-0" size={20} />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              {t('inviteEmailSent')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('userEmail')}</label>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('fullName')}</label>
            <input
              type="text"
              placeholder={t('namePlaceholder')}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('companyOptional')}</label>
              <select
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm"
                value={newUser.companyId}
                onChange={(e) => setNewUser(prev => ({ ...prev, companyId: e.target.value }))}
              >
                <option value="">{t('none')}</option>
                {companies
                  .filter(c => isSuperAdmin || companyUsers.some(cu => cu.company_id === c.id && cu.user_id === currentProfileId && cu.role === 'company-admin'))
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('roleInCompany')}</label>
              <select
                disabled={!newUser.companyId}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all text-sm disabled:opacity-50"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
              >
                <option value="company-user">{t('userViewer')}</option>
                <option value="company-admin">{t('administrador')}</option>
              </select>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl">
              <input
                type="checkbox"
                id="isSuperAdmin"
                className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                checked={newUser.isSuperAdmin}
                onChange={(e) => setNewUser(prev => ({ ...prev, isSuperAdmin: e.target.checked }))}
              />
              <label htmlFor="isSuperAdmin" className="text-sm font-medium text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-amber-600 dark:text-amber-500" />
                {t('isSuperAdminGlobal')}
              </label>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminUsers;
