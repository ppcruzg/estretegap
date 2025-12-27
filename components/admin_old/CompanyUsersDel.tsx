import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";

type Profile = {
  id: string;
  name: string;
  email: string;
};

type CompanyUser = {
  id: string;
  role: "company-admin" | "company-user";
  profiles: Profile;
};

export default function CompanyUsers({ companyId }: { companyId: string }) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");

  // =========================
  // Load users in company
  // =========================
  const loadCompanyUsers = async () => {
    const { data } = await supabase
      .from("company_users")
      .select("id, role, profiles(id, name, email)")
      .eq("company_id", companyId);

    if (data) setUsers(data as any);
  };

  // =========================
  // Load all profiles (for add)
  // =========================
  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email");

    if (data) setAllProfiles(data);
  };

  useEffect(() => {
    loadCompanyUsers();
    loadProfiles();
  }, [companyId]);

  // =========================
  // Add user
  // =========================
  const addUser = async () => {
    if (!selectedProfile) return;

    const { data } = await supabase
      .from("company_users")
      .insert({
        company_id: companyId,
        user_id: selectedProfile,
        role: "company-user",
      })
      .select("id, role, profiles(id, name, email)")
      .single();

    if (data) setUsers((prev) => [...prev, data as any]);
    setSelectedProfile("");
  };

  // =========================
  // Update role
  // =========================
  const updateRole = async (id: string, role: CompanyUser["role"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );

    await supabase.from("company_users").update({ role }).eq("id", id);
  };

  // =========================
  // Remove user
  // =========================
  const removeUser = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await supabase.from("company_users").delete().eq("id", id);
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Usuarios de la empresa</h2>

      <div className="flex gap-2 mb-4">
        <select
          className="border p-2 flex-1"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
        >
          <option value="">Seleccionar usuario</option>
          {allProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.email}
            </option>
          ))}
        </select>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded"
          onClick={addUser}
        >
          Agregar
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Usuario</th>
            <th className="p-2 text-center">Rol</th>
            <th className="p-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">
                {u.profiles.name || "—"} <br />
                <span className="text-xs text-gray-500">
                  {u.profiles.email}
                </span>
              </td>
              <td className="p-2 text-center">
                <select
                  value={u.role}
                  onChange={(e) =>
                    updateRole(u.id, e.target.value as any)
                  }
                  className="border p-1"
                >
                  <option value="company-user">Usuario</option>
                  <option value="company-admin">Admin</option>
                </select>
              </td>
              <td className="p-2 text-center">
                <button
                  className="text-red-600"
                  onClick={() => removeUser(u.id)}
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
