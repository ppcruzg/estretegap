import React from "react";
import { CompanyProvider } from "./CompanyContext";

/**
 * Wrapper global para proveer el contexto de empresa
 * a toda tu aplicación.
 *
 * Simplemente envuelve el componente raíz (App)
 * con este provider.
 */
export default function CompanyContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
