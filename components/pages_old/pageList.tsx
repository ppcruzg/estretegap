import { useEffect, useState } from "react";
import { getPages } from "../src/lib/db/pageService";
import { supabase } from "../src/lib/supabaseClient";

export default function PageList() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPages() {
      setLoading(true);

      // Obtener usuario autenticado
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        console.error("⚠ No hay usuario logueado");
        setLoading(false);
        return;
      }

      // Cargar páginas desde Supabase
      const pagesData = await getPages(user.id);
      setPages(pagesData);

      setLoading(false);
    }

    loadPages();
  }, []);

  if (loading) return <div>Cargando páginas...</div>;

  return (
    <div>
      <h2>Tus páginas</h2>

      {pages.length === 0 && <p>No tienes páginas creadas todavía.</p>}

      <ul>
        {pages.map((p) => (
          <li key={p.id}>
            {p.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
