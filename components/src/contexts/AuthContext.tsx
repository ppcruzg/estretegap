import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthState = {
  loading: boolean;
  profile: any | null;
  isSuperAdmin: boolean;
  companyId: string | null;
  companyRole: "company-admin" | "company-user" | null;
  isRoleLoading: boolean;
  setCompanyData: (companyId: string | null, role: "company-admin" | "company-user" | null) => void;
};

const AuthContext = createContext<AuthState>({
  loading: true,
  profile: null,
  isSuperAdmin: false,
  companyId: null,
  companyRole: null,
  isRoleLoading: true,
  setCompanyData: () => { },
});

export const AuthSProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    loading: true,
    profile: null,
    isSuperAdmin: false,
    companyId: null,
    companyRole: null,
    isRoleLoading: true,
    setCompanyData: (companyId: string | null, role: "company-admin" | "company-user" | null) => {
      setState(prev => ({ ...prev, companyId, companyRole: role, isRoleLoading: false }));
    },
  });

  useEffect(() => {
    const loadAuth = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      // profile
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Fallback: If profile doesn't exist, create it on first login
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || null,
            is_admin: false
          })
          .select()
          .single();

        if (!insertError) {
          profile = newProfile;
        } else {
          console.error("Error creating profile on login:", insertError);
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        profile,
        isSuperAdmin: profile?.is_admin === true,
        companyId: null,
        companyRole: null,
        isRoleLoading: true, // Still loading because CompanyContext needs to sync
      }));
    };

    loadAuth();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
