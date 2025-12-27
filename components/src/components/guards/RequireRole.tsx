import { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { loading, isSuperAdmin } = useAuth();

  if (loading) return <div>Cargando…</div>;
  if (!isSuperAdmin) return <div>Acceso denegado</div>;

  return <>{children}</>;
}

export function RequireCompanyAdmin({ children }: { children: ReactNode }) {
  const { loading, companyRole, isSuperAdmin } = useAuth();

  if (loading) return <div>Cargando…</div>;
  if (!isSuperAdmin && companyRole !== "company-admin")
    return <div>Acceso denegado</div>;

  return <>{children}</>;
}
