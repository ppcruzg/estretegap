import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, Send, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { exportRoadmapToPDF } from "../services/pdfExportService";
import type { RoadmapAnalysis } from "@/types/roadmapTypes";
import { useTranslation } from "../hooks/useTranslation";
import IconButton from "./ui/IconButton";
import { buttonClasses } from "./ui";

interface EmailRoadmapModalProps {
    analysis: RoadmapAnalysis;
    pageTitle: string;
    pageId: string;
    companyId: string;
    onClose: () => void;
}

const EmailRoadmapModal: React.FC<EmailRoadmapModalProps> = ({
    analysis,
    pageTitle,
    pageId,
    companyId,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [customEmail, setCustomEmail] = useState("");
    const [message, setMessage] = useState("");
    const { t } = useTranslation();

    useEffect(() => {
        loadCompanyUsers();
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const loadCompanyUsers = async () => {
        setLoading(true);
        try {
            // Obtener usuarios de la empresa
            const { data: users } = await supabase
                .from("company_users")
                .select(`
          user_id,
          profiles:user_id (
            id,
            name,
            email
          )
        `)
                .eq("company_id", companyId);

            if (users) {
                const userList = users
                    .map((u: any) => u.profiles)
                    .filter((p: any) => p && p.email);
                setCompanyUsers(userList);
            }
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleEmail = (email: string) => {
        setSelectedEmails((prev) =>
            prev.includes(email)
                ? prev.filter((e) => e !== email)
                : [...prev, email]
        );
    };

    const addCustomEmail = () => {
        if (customEmail && customEmail.includes("@")) {
            setSelectedEmails((prev) => [...prev, customEmail]);
            setCustomEmail("");
        }
    };

    const handleSendEmail = async () => {
        if (selectedEmails.length === 0) {
            alert("Seleccione al menos un destinatario");
            return;
        }

        setSending(true);
        try {
            // Generar PDF
            const pdfBlob = await exportRoadmapToPDF(analysis, pageTitle);

            // Convertir blob a base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                const base64Content = base64data.split(',')[1];

                // Aquí deberías implementar tu servicio de email
                // Por ahora, mostramos instrucciones al usuario
                const emailBody = `
Hola,

Te comparto el roadmap del proyecto "${pageTitle}" generado con SIDON ESTRATEGA.

${message ? `Mensaje: ${message}` : ''}

Saludos,
SIDON ESTRATEGA
        `.trim();

                // Crear mailto link con el PDF adjunto (limitado en navegadores)
                const mailtoLink = `mailto:${selectedEmails.join(',')}?subject=Roadmap: ${pageTitle}&body=${encodeURIComponent(emailBody)}`;

                // Mostrar instrucciones
                alert(`Para enviar el roadmap por correo:

1. Se abrirá tu cliente de correo
2. Los destinatarios ya están agregados
3. Adjunta manualmente el PDF que se descargará
4. Envía el correo

Nota: El PDF se descargará automáticamente.`);

                // Descargar PDF
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `SIDON_Roadmap_${pageTitle.replace(/\s+/g, '_')}.pdf`;
                link.click();
                URL.revokeObjectURL(url);

                // Abrir cliente de correo
                window.location.href = mailtoLink;

                onClose();
            };
        } catch (error) {
            console.error("Error sending email:", error);
            alert("Error al preparar el correo. Por favor intente de nuevo.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="email-roadmap-title" className="bg-surface-raised text-fg border border-border rounded-card shadow-pop w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="email-roadmap-title" className="text-xl font-bold text-fg">Enviar Roadmap por Correo</h2>
                            <p className="text-sm text-fg-muted">Compartir con miembros del equipo</p>
                        </div>
                    </div>
                    <IconButton aria-label={t("close")} onClick={onClose}>
                        <X size={20} />
                    </IconButton>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Usuarios de la empresa */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-fg mb-3">
                                    Miembros del Equipo
                                </h3>
                                <div className="space-y-2">
                                    {companyUsers.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-3 p-3 border border-border bg-surface rounded-control hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary-soft cursor-pointer transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmails.includes(user.email)}
                                                onChange={() => toggleEmail(user.email)}
                                                className="w-4 h-4 accent-primary rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-fg">{user.name || "Sin nombre"}</p>
                                                <p className="text-xs text-fg-muted">{user.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Agregar email personalizado */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-fg mb-3">
                                    Agregar Destinatario
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={customEmail}
                                        onChange={(e) => setCustomEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addCustomEmail()}
                                        placeholder="correo@ejemplo.com"
                                        className="flex-1 px-4 py-2 border border-border bg-surface text-fg rounded-control text-sm hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                                    />
                                    <IconButton
                                        aria-label={t("addRecipient")}
                                        variant="secondary"
                                        onClick={addCustomEmail}
                                        className="h-10 w-10"
                                    >
                                        <UserPlus size={16} />
                                    </IconButton>
                                </div>
                            </div>

                            {/* Emails seleccionados */}
                            {selectedEmails.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-fg mb-3">
                                        Destinatarios ({selectedEmails.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEmails.map((email) => (
                                            <span
                                                key={email}
                                                className="px-3 py-1 bg-primary-soft text-primary-soft-fg rounded-full text-xs font-medium flex items-center gap-2"
                                            >
                                                {email}
                                                <button
                                                    onClick={() => toggleEmail(email)}
                                                    aria-label={t("removeRecipient", { email })}
                                                    title={t("removeRecipient", { email })}
                                                    className="rounded-full hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mensaje opcional */}
                            <div>
                                <h3 className="text-sm font-semibold text-fg mb-3">
                                    Mensaje (Opcional)
                                </h3>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Agrega un mensaje personalizado..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-border bg-surface text-fg rounded-control text-sm hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-surface-muted rounded-b-card flex items-center justify-between">
                    <p className="text-xs text-fg-muted">
                        Se descargará el PDF y se abrirá tu cliente de correo
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={buttonClasses("ghost", "md")}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSendEmail}
                            disabled={sending || selectedEmails.length === 0}
                            className={buttonClasses("primary", "md")}
                        >
                            {sending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailRoadmapModal;
