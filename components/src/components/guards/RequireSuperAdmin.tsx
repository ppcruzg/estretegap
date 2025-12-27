import React, { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

export const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const { loading, isRoleLoading, isSuperAdmin, companyRole } = useAuth();

  // We wait if auth is loading OR if the company role is still being determined
  // (Unless the user is already confirmed as Superadmin, who has global access)
  const isStillVerifying = loading || (isRoleLoading && !isSuperAdmin);

  if (isStillVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Verificando permisos...</span>
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso denegado</h2>
          <p className="text-slate-500 mb-6">No tienes permisos para acceder a esta sección de administración.</p>
          <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
