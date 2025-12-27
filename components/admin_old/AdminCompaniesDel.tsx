import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
  is_enabled: boolean;
  created_at: string;
};

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  // =========================
  // Load companies
  // =========================
  const loadCompanies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, is_enabled, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setCompanies(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // =========================
  // Create company
  // =========================
  const createCompany = async () => {
    if (!newName.trim()) return;

    const { data, error } = await supabase
      .from("companies")
      .insert({ name: newName })
      .select()
      .single();

    if (!error && data) {
      setCompanies((prev) => [data, ...prev]);
      setNewName("");
      setShowCreate(false);
    }
  };

  // =========================
  // Toggle enabled
  // =========================
  const toggleCompany = async (id: string, is_enabled: boolean) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_enabled } : c))
    );

    await supabase.from("companies").update({ is_enabled }).eq("id", id);
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Empresas</h2>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={() => setShowCreate(true)}
        >
          Crear empresa
        </button>
      </div>

      {isLoading ? (
        <div>Cargando…</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Creada</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={c.is_enabled}
                    onChange={(e) =>
                      toggleCompany(c.id, e.target.checked)
                    }
                  />
                </td>
                <td className="p-2 text-center">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-sm">
            <h3 className="font-semibold mb-3">Nueva empresa</h3>
            <input
              className="w-full border p-2 mb-4"
              placeholder="Nombre de la empresa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={createCompany}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
