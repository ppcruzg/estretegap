import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Building2, UserPlus, ArrowLeft, LogOut, Shield, User as UserIcon, Languages } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useTheme } from "../../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface AdminLayoutProps {
    title: string;
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
    const location = useLocation();
    const { profile, isSuperAdmin: isGlobalAdmin } = useAuth();
    const { t, language, toggleLanguage } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        {
            label: t('users'),
            path: "/admin/users",
            icon: <Users size={18} />,
        },
        {
            label: t('companies'),
            path: "/admin/companies",
            icon: <Building2 size={18} />,
            hidden: !isGlobalAdmin
        },
        {
            label: t('companyUsers'),
            path: "/admin/company-users",
            icon: <UserPlus size={18} />,
        },
    ].filter(item => !item.hidden);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
            {/* Top Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        title={t('backToDashboard')}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h1>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                            <Shield size={10} /> {t('adminPortal')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Perfil de Usuario */}
                    <div className="flex items-center gap-3 pl-2 group">
                        <div className="flex flex-col items-end hidden md:flex text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {profile?.name || t('user')}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isGlobalAdmin ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                                }`}>
                                {isGlobalAdmin ? t('superadmin') : t('companyAdmin')}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm relative group-hover:border-blue-300 transition-all cursor-default">
                            <UserIcon size={20} />
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

                    {/* Idioma */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95 group"
                        title={language === 'es' ? t('switchToEnglish') : t('switchToSpanish')}
                    >
                        <Languages size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">{language}</span>
                    </button>

                    {/* Tema */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.reload();
                        }}
                        className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100 flex items-center gap-2"
                        title={t('signOut')}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Mini */}
                <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 hidden md:flex flex-col gap-2 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-x-1"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
                                    }`}
                            >
                                <div className={isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"}>
                                    {item.icon}
                                </div>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </aside>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6 lg:p-10 bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
