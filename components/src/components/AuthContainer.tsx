import React, { useState } from "react";
import AuthPanel from "../../AuthPanel";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "../hooks/useTranslation";

const AuthContainer: React.FC = () => {
    const [mode, setMode] = useState<"login" | "reset">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleLogin = async (payload: { email: string; password: string }) => {
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: payload.email,
                password: payload.password,
            });
            if (error) throw error;
            window.location.reload();
        } catch (err: any) {
            setError(err.message || t('loginError'));
        }
    };

    const handleReset = async () => {
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setMessage(t('emailSentMessage'));
        } catch (err: any) {
            setError(err.message || t('emailError'));
        }
    };

    return (
        <AuthPanel
            mode={mode}
            email={email}
            password={password}
            error={error}
            message={message}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
            onReset={handleReset}
            onSwitchMode={setMode}
        />
    );
};

export default AuthContainer;
