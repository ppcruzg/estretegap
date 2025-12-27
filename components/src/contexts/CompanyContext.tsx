import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getCompaniesForUser } from "../lib/db/companyService";
import { useAuth } from "./AuthContext";

interface Company {
  id: string;
  name: string;
  is_enabled: boolean;
}

interface CompanyContextState {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  loadingCompanies: boolean;
}

const CompanyContext = createContext<CompanyContextState | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      const { data } = await supabase.auth.getSession();
      setSessionUserId(data.session?.user?.id ?? null);
    }

    loadCompanies();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSessionUserId(session?.user?.id ?? null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const { setCompanyData, profile } = useAuth();

  useEffect(() => {
    async function loadCompanies() {
      if (!sessionUserId) {
        setCompanies([]);
        setLoadingCompanies(false);
        setCompanyData(null, null);
        return;
      }

      setLoadingCompanies(true);

      // Cargar empresas del usuario
      const list = await getCompaniesForUser();
      setCompanies(list);

      // Si aún no hay empresa activa, seleccionar la primera
      const initialId = activeCompanyId ?? list[0]?.id ?? null;
      setActiveCompanyId(initialId);

      setLoadingCompanies(false);
    }

    loadCompanies();
  }, [sessionUserId]);

  // Sync role whenever activeCompanyId or profile changes
  useEffect(() => {
    async function syncRole() {
      if (!sessionUserId || !activeCompanyId || !profile?.id) {
        console.log("[CompanyContext] Missing data for sync:", { sessionUserId, activeCompanyId, profileId: profile?.id });
        setCompanyData(activeCompanyId, null);
        return;
      }

      console.log("[CompanyContext] Syncing role for:", { userId: profile.id, companyId: activeCompanyId });

      const { data: companyUsers, error } = await supabase
        .from("company_users")
        .select("role")
        .eq("user_id", profile.id)
        .eq("company_id", activeCompanyId);

      if (error) {
        console.error("[CompanyContext] Error syncing role:", error);
        setCompanyData(activeCompanyId, null);
        return;
      }

      const role = companyUsers && companyUsers.length > 0 ? companyUsers[0].role : null;
      console.log("[CompanyContext] Role found:", role);
      setCompanyData(activeCompanyId, role);
    }

    syncRole();
  }, [activeCompanyId, sessionUserId, profile?.id]);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompanyId,
        setActiveCompanyId,
        loadingCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }
  return ctx;
}
