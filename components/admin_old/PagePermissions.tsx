import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";

type Page = {
  id: string;
  title: string;
};

type Permission = {
  id: string;
  role: "owner" | "editor" | "viewer";
  can_view: boolean;
  can_edit: boolean;
  profiles: {
    id: string;
    name: string;
    email: string;
  };
};

export default function PagePermissions({
  companyId,
}: {
  companyId: string;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // =========================
  // Load pages
  // =========================
  const loadPages = async () => {
    const { data } = await supabase
      .from("pages")
      .select("id, title")
      .eq("company_id", companyId);

    if (data) setPages(data);
  };

  // =========================
  // Load users of company
  // =========================
  const loadUsers = async () => {
    const { data } = await supabase
      .from("company_users")
      .select("profiles(id, name, email)")
      .eq("company_id", companyId);

    if (data)
      setUsers(
        data.map((d: any) => d.profiles).filter(Boolean)
      );
  };

  // =========================
  // Load permissions
  // =========================
  const loadPermissions = async (pageId: string) => {
    const { data } = await supabase
      .from("permissions")
      .select(
        "id, role, can_view, can_edit, profiles(id, name, email)"
      )
      .eq("page_id", pageId);

    if (data) setPermissions(data as any);
  };

  useEffect(() => {
    loadPages();
    loadUsers();
  }, [companyId]);

  useEffect(() => {
    if (selectedPage) loadPermissions(selectedPage);
  }, [selectedPage]);

  // =========================
  // Add / update permission
  // =========================
  const upsertPermission = async (
    userId: string,
    role: Permission["role"]
  ) => {
    const can_view = true;
    const can_edit = role !== "viewer";

    await supabase.from("permissions").upsert({
      user_id: userId,
      page_id: selectedPage,
      role,
      can_view,
      can_edit,
    });

    loadPermissions(selectedPage);
  };

  // =========================
  // Remove permission
  // =========================
  const removePermission = async (id: string) => {
    await supabase.from("permissions").delete().eq("id", id);
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">
        Permisos por página
      </h2>

      {/* Page selector */}
      <select
        className="border p-2 mb-4 w-full"
        value={selectedPage}
        onChange={(e) => setSelectedPage(e.target.value)}
      >
        <option value="">Selecciona una página</option>
        {pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      {selectedPage && (
        <>
          {/* Add permission */}
          <div className="flex gap-2 mb-4">
            <select
              className="border p-2 flex-1"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Seleccionar usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <button
              className="px-3 py-2 bg-blue-600 text-white rounded"
              onClick={() => {
                if (selectedUser)
                  upsertPermission(selectedUser, "viewer");
                setSelectedUser("");
              }}
            >
              Agregar
            </button>
          </div>

          {/* Permissions table */}
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Usuario</th>
                <th className="p-2 text-center">Rol</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    {p.profiles.name || "—"} <br />
                    <span className="text-xs text-gray-500">
                      {p.profiles.email}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <select
                      value={p.role}
                      onChange={(e) =>
                        upsertPermission(
                          p.profiles.id,
                          e.target.value as any
                        )
                      }
                      className="border p-1"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      className="text-red-600"
                      onClick={() => removePermission(p.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
