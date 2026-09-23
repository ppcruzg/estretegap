import React, { useId } from "react";
import { Layers } from "lucide-react";
import { useTranslation } from "./src/hooks/useTranslation";
import { Button, Card, Input, cn, focusRing } from "./src/components/ui";

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
  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin({ email, password });
    } else {
      onReset();
    }
  };

  const tabClasses = (active: boolean) =>
    cn(
      "flex-1 h-9 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition-colors",
      focusRing,
      active ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg",
    );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg px-4 overflow-hidden">
      {/* Soft palette-tinted glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-primary-soft blur-3xl opacity-80"
      />

      <Card padded={false} elevation="pop" className="relative w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 mb-4 rounded-card bg-primary text-primary-fg flex items-center justify-center shadow-card">
            <Layers size={22} />
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">Estrategia</h1>
          <p className="text-fg-muted text-sm mt-1">{t('adminPortal')}</p>
        </div>

        <div className="flex gap-1 mb-6 bg-surface-muted p-1 rounded-control border border-border">
          <button type="button" onClick={() => onSwitchMode("login")} className={tabClasses(isLogin)} aria-pressed={isLogin}>
            {t('login')}
          </button>
          <button type="button" onClick={() => onSwitchMode("reset")} className={tabClasses(!isLogin)} aria-pressed={!isLogin}>
            {t('recoverAccess')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={emailId} className="text-sm font-medium text-fg mb-1.5 block">{t('email')}</label>
            <Input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="usuario@dominio.com"
            />
          </div>

          {isLogin && (
            <div>
              <label htmlFor={passwordId} className="text-sm font-medium text-fg mb-1.5 block">{t('password')}</label>
              <Input
                id={passwordId}
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="********"
              />
            </div>
          )}

          {message && (
            <div role="status" className="text-sm text-center px-3 py-2 rounded-control bg-success-soft text-success">{message}</div>
          )}

          {error && (
            <div role="alert" className="text-sm text-center px-3 py-2 rounded-control bg-danger-soft text-danger">{error}</div>
          )}

          <Button type="submit" className="mt-2 w-full">
            {isLogin ? t('login') : t('sendRecoverLink')}
          </Button>
        </form>

        {isLogin && (
          <Button variant="ghost" onClick={() => onSwitchMode("reset")} className="w-full mt-2">
            {t('forgotPassword')}
          </Button>
        )}

        <div className="text-center text-xs text-fg-muted mt-6">
          © {new Date().getFullYear()} Estrategia — {t('adminPanelSub')}
        </div>
      </Card>
    </div>
  );
}
