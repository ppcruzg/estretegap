import React, { useMemo, useState } from 'react';
import { Plus, X, ShieldCheck, Eye, Pencil, Trash2, Lock } from 'lucide-react';
import { PageData, UserAccount, PagePermission } from '../types';

interface UserAdminPanelProps {
  isOpen: boolean;
  pages: PageData[];
  users: UserAccount[];
  currentUserEmail: string | null;
  onClose: () => void;
  onSaveUser: (user: UserAccount) => void;
  onAddUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
}

const emptyPermission: PagePermission = { canView: false, canEdit: false };

const UserAdminPanel: React.FC<UserAdminPanelProps> = ({
  isOpen,
  pages,
  users,
  currentUserEmail,
  onClose,
  onSaveUser,
  onAddUser,
  onDeleteUser
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id || null);
  const [draft, setDraft] = useState<UserAccount | null>(users[0] || null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) || null, [users, selectedUserId]);

  React.useEffect(() => {
    if (selectedUser) {
      setDraft(selectedUser);
    }
  }, [selectedUser]);

  React.useEffect(() => {
    if (selectedUserId && !users.find(u => u.id === selectedUserId)) {
      setSelectedUserId(users[0]?.id || null);
    }
    if (!selectedUserId && users[0]) {
      setSelectedUserId(users[0].id);
      setDraft(users[0]);
    }
  }, [users, selectedUserId]);

  const handleSelect = (id: string) => {
    setSelectedUserId(id);
    setError(null);
  };

  const handleTogglePermission = (pageId: string, field: keyof PagePermission) => {
    if (!draft) return;
    const currentPerm = draft.permissions[pageId] || { ...emptyPermission };
    const updated: UserAccount = {
      ...draft,
      permissions: {
        ...draft.permissions,
        [pageId]: { ...currentPerm, [field]: !currentPerm[field] }
      }
    };
    setDraft(updated);
  };

  const handleToggleAdmin = () => {
    if (!draft) return;
    setDraft({ ...draft, isAdmin: !draft.isAdmin });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.email.trim() || !draft.name.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    onSaveUser(draft);
    setError(null);
  };

  const handleAdd = () => {
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.name.trim()) {
      setError('Completa nombre, correo y contrasena.');
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (emailExists) {
      setError('Ya existe un usuario con ese correo.');
      return;
    }

    const newAccount: UserAccount = {
      id: `user-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      password: newUser.password,
      isAdmin: false,
      permissions: {}
    };

    onAddUser(newAccount);
    setNewUser({ name: '', email: '', password: '' });
    setSelectedUserId(newAccount.id);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Administracion</p>
            <h2 className="text-xl font-bold text-slate-900">Usuarios y permisos</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-4 border-r border-slate-200">
            <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <p className="text-xs text-slate-500">Usuario activo: {currentUserEmail || 'N/D'}</p>
              </div>
              <div className="text-xs uppercase text-slate-500 font-semibold">Usuarios</div>
              <div className="space-y-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      user.id === selectedUserId ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    {user.isAdmin && (
                      <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Nuevo usuario</p>
                <div className="space-y-2">
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nombre"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Correo"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Contrasena"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={handleAdd}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    <Plus size={14} />
                    Crear usuario
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 max-h-[70vh] overflow-y-auto">
            {draft ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <label className="text-xs text-slate-500 font-semibold">Nombre</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <label className="text-xs text-slate-500 font-semibold">Correo</label>
                    <input
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <label className="text-xs text-slate-500 font-semibold">Contrasena (actualizar)</label>
                    <input
                      type="password"
                      placeholder="Dejar en blanco para no cambiar"
                      onChange={(e) => {
                        const newPass = e.target.value;
                        setDraft({ ...draft, password: newPass ? newPass : draft.password });
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAdmin}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      draft.isAdmin
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    {draft.isAdmin ? 'Administrador' : 'Marcar como admin'}
                  </button>

                  {draft.id !== selectedUserId && null}
                  {draft.id !== (users.find(u => u.email === currentUserEmail)?.id || '') && (
                    <button
                      onClick={() => onDeleteUser(draft.id)}
                      className="inline-flex items-center gap-1 text-rose-600 text-sm font-semibold hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                      Eliminar usuario
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Permisos por pagina</p>
                      <p className="text-xs text-slate-500">Controla visualizacion y edicion por pagina.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Eye size={14} /> Ver</span>
                      <span className="inline-flex items-center gap-1"><Pencil size={14} /> Editar</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pages.map(page => {
                      const perm = draft.permissions[page.id] || emptyPermission;
                      return (
                        <div key={page.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{page.pageConfig.title}</p>
                            <p className="text-xs text-slate-500">{page.pageConfig.identifier}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-1 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={perm.canView}
                                onChange={() => handleTogglePermission(page.id, 'canView')}
                              />
                              Ver
                            </label>
                            <label className="inline-flex items-center gap-1 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={perm.canEdit}
                                onChange={() => handleTogglePermission(page.id, 'canEdit')}
                              />
                              Editar
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                  <button
                    onClick={handleSave}
                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    <Lock size={16} />
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">Selecciona un usuario para editar.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAdminPanel;
