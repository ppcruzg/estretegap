import React, { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { buttonClasses } from "../ui";

export const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const { loading, isRoleLoading, isSuperAdmin, companyRole } = useAuth();

  // We wait if auth is loading OR if the company role is still being determined
  // (Unless the user is already confirmed as Superadmin, who has global access)
  const isStillVerifying = loading || (isRoleLoading && !isSuperAdmin);

  if (isStillVerifying) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-fg-muted font-medium">Verificando permisos...</span>
        </div>
      </div>
    );
  }

  // Debug log to verify role resolution
  console.log('RequireSuperAdmin Check:', { isSuperAdmin, companyRole });

  // Allow access if Superadmin OR Company Admin
  const canAccess = isSuperAdmin || companyRole === 'company-admin';

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-surface p-8 rounded-card shadow-card border border-border max-w-sm">
          <h2 className="text-xl font-bold text-fg mb-2">Acceso denegado</h2>
          <p className="text-fg-muted mb-6">No tienes permisos para acceder a esta sección de administración.</p>
          <a href="/" className={buttonClasses("primary", "md")}>
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
