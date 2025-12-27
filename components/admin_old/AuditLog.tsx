import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";

export default function AuditLog() {
  const [tab, setTab] = useState<"activity" | "changes">("activity");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivity = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_feed")
      .select(
        "id, action, created_at, pages(title), profiles(name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setRows(data);
    setLoading(false);
  };

  const loadChanges = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("change_history")
      .select(
        "id, timestamp, type, action, description, item_name, group_name, previous_value, new_value, pages(title)"
      )
      .order("timestamp", { ascending: false })
      .limit(100);

    if (data) setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    tab === "activity" ? loadActivity() : loadChanges();
  }, [tab]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Auditoría</h2>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${
            tab === "activity" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("activity")}
        >
          Actividad
        </button>
        <button
          className={`px-3 py-1 rounded ${
            tab === "changes" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("changes")}
        >
          Cambios
        </button>
      </div>

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Fecha</th>
              <th className="p-2">Usuario</th>
              <th className="p-2">Acción</th>
              <th className="p-2">Página</th>
              <th className="p-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-center">
                  {new Date(
                    r.created_at || r.timestamp
                  ).toLocaleString()}
                </td>
                <td className="p-2 text-center">
                  {r.profiles?.email || "—"}
                </td>
                <td className="p-2 text-center">
                  {r.action || r.type}
                </td>
                <td className="p-2 text-center">
                  {r.pages?.title || "—"}
                </td>
                <td className="p-2">
                  {r.description ||
                    `${r.previous_value || ""} → ${
                      r.new_value || ""
                    }`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
