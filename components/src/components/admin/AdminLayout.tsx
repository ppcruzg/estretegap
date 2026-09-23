import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Building2, UserPlus, ArrowLeft, LogOut, Shield, User as UserIcon, Languages } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import ThemePicker from "../ThemePicker";
import { iconButtonClasses } from "../ui";

interface AdminLayoutProps {
    title: string;
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
    const location = useLocation();
    const { profile, isSuperAdmin: isGlobalAdmin } = useAuth();
    const { t, language, toggleLanguage } = useTranslation();

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
        <div className="min-h-screen bg-bg text-fg flex flex-col transition-colors">
            {/* Top Header */}
            <header className="bg-surface/90 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={iconButtonClasses("secondary", "md")}
                        title={t('backToDashboard')}
                        aria-label={t('backToDashboard')}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-fg leading-tight">{title}</h1>
                        <span className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                            <Shield size={10} /> {t('adminPortal')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Perfil de Usuario */}
                    <div className="flex items-center gap-3 pl-2 group">
                        <div className="flex flex-col items-end hidden md:flex text-right">
                            <span className="text-sm font-bold text-fg leading-tight">
                                {profile?.name || t('user')}
                            </span>
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isGlobalAdmin ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary-soft-fg"
                                }`}>
                                {isGlobalAdmin ? t('superadmin') : t('companyAdmin')}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-surface-muted border border-border rounded-full flex items-center justify-center text-fg-muted shadow-card relative group-hover:border-primary/40 transition-all cursor-default">
                            <UserIcon size={20} />
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    {/* Idioma */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 h-9 px-2.5 bg-surface border border-border rounded-control text-fg-muted hover:text-fg hover:border-border-strong transition-colors active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title={language === 'es' ? t('switchToEnglish') : t('switchToSpanish')}
                    >
                        <Languages size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">{language}</span>
                    </button>

                    {/* Tema (paleta + claro/oscuro) */}
                    <ThemePicker />

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.reload();
                        }}
                        className={iconButtonClasses("danger", "md")}
                        title={t('signOut')}
                        aria-label={t('signOut')}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Mini */}
                <aside className="w-64 bg-surface border-r border-border p-4 hidden md:flex flex-col gap-2 transition-colors">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-3 px-4 py-3 rounded-control transition-all group ${isActive
                                    ? "bg-primary text-primary-fg shadow-card translate-x-1"
                                    : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                                    }`}
                            >
                                <div className={isActive ? "text-primary-fg" : "text-fg-subtle group-hover:text-primary transition-colors"}>
                                    {item.icon}
                                </div>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </aside>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6 lg:p-10 bg-bg transition-colors">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
