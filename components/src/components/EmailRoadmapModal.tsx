import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, Send, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { exportRoadmapToPDF } from "../services/pdfExportService";
import type { RoadmapAnalysis } from "../../../types/roadmapTypes";

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

    useEffect(() => {
        loadCompanyUsers();
    }, []);

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Enviar Roadmap por Correo</h2>
                            <p className="text-sm text-slate-500">Compartir con miembros del equipo</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Usuarios de la empresa */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                    Miembros del Equipo
                                </h3>
                                <div className="space-y-2">
                                    {companyUsers.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmails.includes(user.email)}
                                                onChange={() => toggleEmail(user.email)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{user.name || "Sin nombre"}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Agregar email personalizado */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                    Agregar Destinatario
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={customEmail}
                                        onChange={(e) => setCustomEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addCustomEmail()}
                                        placeholder="correo@ejemplo.com"
                                        className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <button
                                        onClick={addCustomEmail}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Emails seleccionados */}
                            {selectedEmails.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                        Destinatarios ({selectedEmails.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEmails.map((email) => (
                                            <span
                                                key={email}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-2"
                                            >
                                                {email}
                                                <button
                                                    onClick={() => toggleEmail(email)}
                                                    className="hover:text-blue-900"
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
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                    Mensaje (Opcional)
                                </h3>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Agrega un mensaje personalizado..."
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Se descargará el PDF y se abrirá tu cliente de correo
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-all font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSendEmail}
                            disabled={sending || selectedEmails.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
