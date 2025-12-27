import React, { useState, useEffect } from "react";
import {
    X,
    TrendingUp,
    Loader2,
    Calendar,
    AlertTriangle,
    Users,
    Lightbulb,
    RefreshCw,
    Download,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle as AlertCircleIcon,
    Mail
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import * as Repo from "../repository/estrategiaRepository";
import { analyzeRoadmapWithAI, initializeOpenAI, isOpenAIInitialized } from "../services/aiService";
import { downloadRoadmapPDF } from "../services/pdfExportService";
import EmailRoadmapModal from "./EmailRoadmapModal";
import type { RoadmapAnalysis, CriticalPoint, Insight } from "../../../types/roadmapTypes";

interface RoadmapPanelProps {
    pageId: string;
    pageTitle: string;
    companyId: string;
    onClose: () => void;
}

const RoadmapPanel: React.FC<RoadmapPanelProps> = ({
    pageId,
    pageTitle,
    companyId,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<RoadmapAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"timeline" | "insights" | "critical">("timeline");
    const [showEmailModal, setShowEmailModal] = useState(false);

    useEffect(() => {
        loadAndAnalyze();
    }, [pageId]);

    const loadAndAnalyze = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Cargar configuración de OpenAI
            const apiKey = await Repo.getSystemConfig("openai_api_key");

            if (!apiKey) {
                setError("API key de OpenAI no configurada. Contacte al administrador.");
                setLoading(false);
                return;
            }

            // 2. Inicializar OpenAI
            if (!isOpenAIInitialized()) {
                initializeOpenAI(apiKey);
            }

            // 3. Obtener datos del roadmap
            const roadmapData = await Repo.getRoadmapData(pageId);

            if (roadmapData.length === 0) {
                setError("No hay items con fechas en esta página.");
                setLoading(false);
                return;
            }

            // 4. Obtener historial de cambios
            const history = await Repo.getPageChangeHistory(pageId, { limit: 50 });

            // 5. Analizar con IA
            setAnalyzing(true);
            const analysisResult = await analyzeRoadmapWithAI(roadmapData, history, pageTitle);
            setAnalysis(analysisResult);

        } catch (err: any) {
            console.error("Error analyzing roadmap:", err);
            setError(err.message || "Error al analizar el roadmap");
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high":
                return "bg-red-100 text-red-700 border-red-200";
            case "medium":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "low":
                return "bg-blue-100 text-blue-700 border-blue-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case "risk":
                return <AlertTriangle className="w-5 h-5" />;
            case "opportunity":
                return <TrendingUp className="w-5 h-5" />;
            case "suggestion":
                return <Lightbulb className="w-5 h-5" />;
            case "warning":
                return <AlertCircleIcon className="w-5 h-5" />;
            default:
                return <Lightbulb className="w-5 h-5" />;
        }
    };

    const getInsightColor = (type: string) => {
        switch (type) {
            case "risk":
                return "bg-red-50 border-red-200 text-red-700";
            case "opportunity":
                return "bg-emerald-50 border-emerald-200 text-emerald-700";
            case "suggestion":
                return "bg-blue-50 border-blue-200 text-blue-700";
            case "warning":
                return "bg-yellow-50 border-yellow-200 text-yellow-700";
            default:
                return "bg-slate-50 border-slate-200 text-slate-700";
        }
    };

    const handleExportPDF = async () => {
        if (!analysis) return;

        try {
            await downloadRoadmapPDF(analysis, pageTitle);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert("Error al exportar PDF. Por favor intente de nuevo.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Roadmap con IA</h2>
                            <p className="text-sm text-slate-500">{pageTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {analysis && (
                            <>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
                                >
                                    <Download size={16} />
                                    Descargar PDF
                                </button>

                                <button
                                    onClick={() => setShowEmailModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                    <Mail size={16} />
                                    Enviar por Email
                                </button>
                            </>
                        )}

                        <button
                            onClick={loadAndAnalyze}
                            disabled={loading || analyzing}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} />
                            Regenerar
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {!loading && !error && analysis && (
                    <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab("timeline")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "timeline"
                                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Calendar size={16} className="inline mr-2" />
                            Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab("critical")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "critical"
                                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <AlertTriangle size={16} className="inline mr-2" />
                            Puntos Críticos ({analysis.criticalPoints.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("insights")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "insights"
                                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Lightbulb size={16} className="inline mr-2" />
                            Insights ({analysis.insights.length})
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">
                                {analyzing ? "Analizando roadmap con IA..." : "Cargando datos..."}
                            </p>
                            <p className="text-sm text-slate-500 mt-2">Esto puede tomar unos segundos</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <XCircle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Error</h3>
                            <p className="text-sm text-slate-600 max-w-md">{error}</p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Resumen Ejecutivo
                                </h3>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{analysis.summary}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-purple-200">
                                    <div>
                                        <p className="text-xs text-purple-600 font-medium">Total Items</p>
                                        <p className="text-2xl font-bold text-purple-900">{analysis.timeline.totalItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 font-medium">Con Fechas</p>
                                        <p className="text-2xl font-bold text-purple-900">{analysis.timeline.itemsWithDates}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-600 font-medium">Vencidas</p>
                                        <p className="text-2xl font-bold text-red-700">{analysis.timeline.overdueTasks}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-600 font-medium">Próximas</p>
                                        <p className="text-2xl font-bold text-emerald-700">{analysis.timeline.upcomingTasks}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "timeline" && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Milestones</h3>
                                    {analysis.milestones.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">No hay milestones definidos</p>
                                    ) : (
                                        analysis.milestones.map((milestone, idx) => (
                                            <div
                                                key={idx}
                                                className="border-2 border-slate-200 rounded-xl p-4 hover:border-purple-200 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${milestone.status === "completed" ? "bg-emerald-500" :
                                                            milestone.status === "in-progress" ? "bg-blue-500" :
                                                                milestone.status === "overdue" ? "bg-red-500" :
                                                                    "bg-slate-300"
                                                            }`} />
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900">{milestone.title}</h4>
                                                            <p className="text-sm text-slate-500">
                                                                {format(parseISO(milestone.date), "d 'de' MMMM, yyyy", { locale: es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${milestone.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                        milestone.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                                                            milestone.status === "overdue" ? "bg-red-100 text-red-700" :
                                                                "bg-slate-100 text-slate-700"
                                                        }`}>
                                                        {milestone.status === "completed" ? "Completado" :
                                                            milestone.status === "in-progress" ? "En Progreso" :
                                                                milestone.status === "overdue" ? "Vencido" :
                                                                    "Pendiente"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {milestone.items.map((item, itemIdx) => (
                                                        <span
                                                            key={itemIdx}
                                                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "critical" && (
                                <div className="space-y-4">
                                    {analysis.criticalPoints.length === 0 ? (
                                        <div className="text-center py-12">
                                            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                                            <p className="text-slate-600 font-medium">No hay puntos críticos detectados</p>
                                            <p className="text-sm text-slate-500 mt-2">El proyecto está en buen estado</p>
                                        </div>
                                    ) : (
                                        analysis.criticalPoints.map((point, idx) => (
                                            <div
                                                key={idx}
                                                className={`border-2 rounded-xl p-4 ${getSeverityColor(point.severity)}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold">{point.item}</h4>
                                                    <span className="px-2 py-1 rounded-md text-xs font-bold uppercase">
                                                        {point.severity === "high" ? "Alta" :
                                                            point.severity === "medium" ? "Media" : "Baja"}
                                                    </span>
                                                </div>
                                                <p className="text-sm mb-2">{point.reason}</p>
                                                {point.recommendation && (
                                                    <p className="text-sm font-medium">
                                                        💡 {point.recommendation}
                                                    </p>
                                                )}
                                                {point.dueDate && (
                                                    <p className="text-xs mt-2 opacity-75">
                                                        Fecha límite: {format(parseISO(point.dueDate), "d 'de' MMMM", { locale: es })}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "insights" && (
                                <div className="space-y-4">
                                    {analysis.insights.map((insight, idx) => (
                                        <div
                                            key={idx}
                                            className={`border-2 rounded-xl p-4 flex items-start gap-3 ${getInsightColor(insight.type)}`}
                                        >
                                            {getInsightIcon(insight.type)}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase">
                                                        {insight.type === "risk" ? "Riesgo" :
                                                            insight.type === "opportunity" ? "Oportunidad" :
                                                                insight.type === "suggestion" ? "Sugerencia" : "Advertencia"}
                                                    </span>
                                                    <span className="text-xs opacity-75">
                                                        Prioridad: {insight.priority === "high" ? "Alta" :
                                                            insight.priority === "medium" ? "Media" : "Baja"}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{insight.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {analysis && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Análisis generado: {format(new Date(analysis.generatedAt), "d/MM/yyyy HH:mm")}
                        </span>
                        <span>
                            Powered by OpenAI GPT-4
                        </span>
                    </div>
                )}
            </div>

            {showEmailModal && analysis && (
                <EmailRoadmapModal
                    analysis={analysis}
                    pageTitle={pageTitle}
                    pageId={pageId}
                    companyId={companyId}
                    onClose={() => setShowEmailModal(false)}
                />
            )}
        </div>
    );
};

export default RoadmapPanel;
