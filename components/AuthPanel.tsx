import React from "react";
import { useTranslation } from "./src/hooks/useTranslation";

interface AuthPanelProps {
  mode: "login" | "reset";
  email: string;
  password: string;
  error?: string | null;
  message?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: (payload: { email: string; password: string }) => void;
  onReset: () => void;
  onSwitchMode: (mode: "login" | "reset") => void;
}

export default function AuthPanel({
  mode,
  email,
  password,
  error,
  message,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onReset,
  onSwitchMode,
}: AuthPanelProps) {
  const { t } = useTranslation();
  const isLogin = mode === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin({ email, password });
    } else {
      onReset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white tracking-wide">
            Estrategia
          </div>
          <div className="text-slate-300 text-sm mt-1">
            {t('adminPortal')}
          </div>
        </div>

        <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => onSwitchMode("login")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${isLogin ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-white/10"
              }`}
          >
            {t('login')}
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode("reset")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${!isLogin ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-white/10"
              }`}
          >
            {t('recoverAccess')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-200 mb-1 block">{t('email')}</label>
            <input
              type="email"
              required
              className="w-full rounded-lg px-3 py-2 bg-slate-800 text-white border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="usuario@dominio.com"
            />
          </div>

          {isLogin && (
            <div>
              <label className="text-sm text-slate-200 mb-1 block">{t('password')}</label>
              <input
                type="password"
                required
                className="w-full rounded-lg px-3 py-2 bg-slate-800 text-white border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="********"
              />
            </div>
          )}

          {message && (
            <div className="text-emerald-300 text-sm text-center mt-1">{message}</div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center mt-1">{error}</div>
          )}

          <button
            type="submit"
            className="mt-2 py-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition"
          >
            {isLogin ? t('login') : t('sendRecoverLink')}
          </button>
        </form>

        {isLogin && (
          <button
            type="button"
            onClick={() => onSwitchMode("reset")}
            className="w-full text-sm text-slate-300 mt-3 hover:text-white transition"
          >
            {t('forgotPassword')}
          </button>
        )}

        <div className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Estrategia — {t('adminPanelSub')}
        </div>
      </div>
    </div>
  );
}
