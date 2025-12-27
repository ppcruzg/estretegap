import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CompanyProvider from "./contexts/CompanyProvider";
import PageView from "./components/pages/pageView";

// Admin
import AdminCompanies from "./components/admin/AdminCompanies";
import AdminUsers from "./components/admin/AdminUsers";
import CompanyUsers from "./components/admin/CompanyUsers";

// Supabase + Context
import { supabase } from "./lib/supabaseClient";
import { AppProvider } from "./contexts/AppContext";

// Guards
import { RequireSuperAdmin } from "./components/guards/RequireSuperAdmin";

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);
    };

    loadUser();
  }, []);

  return (
    <AppProvider currentUserId={currentUserId}>
      <BrowserRouter>
        <CompanyProvider>
          <Routes>
            {/* APP NORMAL */}
            <Route path="/" element={<PageView />} />

            {/* ADMIN — COMPANIES */}
            <Route
              path="/admin/companies"
              element={
                <RequireSuperAdmin>
                  <AdminCompanies />
                </RequireSuperAdmin>
              }
            />

            {/* ADMIN — USERS (SUPERADMIN GLOBAL) */}
            <Route
              path="/admin/users"
              element={
                <RequireSuperAdmin>
                  <AdminUsers />
                </RequireSuperAdmin>
              }
            />

            {/* ADMIN — USUARIOS POR EMPRESA */}
            <Route
              path="/admin/company-users"
              element={
                <RequireSuperAdmin>
                  <CompanyUsers />
                </RequireSuperAdmin>
              }
            />
          </Routes>
        </CompanyProvider>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
