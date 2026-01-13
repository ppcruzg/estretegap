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
    Mail,
    Sparkles,
    UserCircle,
    GanttChart
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
    const [activeTab, setActiveTab] = useState<"timeline" | "insights" | "critical" | "responsibilities" | "gantt">("timeline");
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
                        <button
                            onClick={() => setActiveTab("responsibilities")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "responsibilities"
                                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Users size={16} className="inline mr-2" />
                            Responsables ({analysis.responsibilities.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("gantt")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "gantt"
                                ? "bg-white text-purple-600 border-b-2 border-purple-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <GanttChart size={16} className="inline mr-2" />
                            Vista Gantt
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
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-slate-900">{milestone.title}</h4>
                                                                <Sparkles size={12} className="text-purple-400" />
                                                            </div>
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
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">{point.item}</h4>
                                                        <Sparkles size={14} className="opacity-50" />
                                                    </div>
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

                            {activeTab === "responsibilities" && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Users size={20} className="text-purple-600" />
                                        Asignación de Responsabilidades
                                    </h3>
                                    {analysis.responsibilities.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">No se han identificado responsables específicos</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {analysis.responsibilities.map((resp, idx) => (
                                                <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-purple-200 transition-all shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                                                <UserCircle size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{resp.person}</h4>
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${resp.workload === "high" ? "bg-red-100 text-red-600" :
                                                                    resp.workload === "medium" ? "bg-yellow-100 text-yellow-600" : "bg-emerald-100 text-emerald-600"
                                                                    }`}>
                                                                    Carga {resp.workload === "high" ? "Alta" : resp.workload === "medium" ? "Media" : "Baja"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-400 font-bold uppercase">Tareas Críticas</p>
                                                            <p className="text-xl font-black text-red-500">{resp.criticalTasks}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {resp.tasks.map((task, tIdx) => {
                                                            const isObject = typeof task === 'object' && task !== null;
                                                            const title = isObject ? (task as any).title : task;
                                                            const isCritical = isObject ? (task as any).isCritical : false;
                                                            const date = isObject ? (task as any).date : null;

                                                            return (
                                                                <div key={tIdx} className={`p-2 rounded-lg text-xs flex items-center justify-between group transition-all hover:translate-x-1 ${isCritical ? "bg-red-50 text-red-700 border border-red-100 shadow-sm" : "bg-slate-50 text-slate-700 border border-slate-100 hover:bg-white hover:border-purple-200"}`}>
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        {isCritical && <AlertTriangle size={12} className="flex-shrink-0 animate-pulse text-red-500" />}
                                                                        <span className="truncate font-semibold">{title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        {date && (
                                                                            <span className="text-[10px] font-black opacity-40 bg-white/50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                                {format(parseISO(date), "d/MM")}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "gantt" && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <GanttChart size={20} className="text-purple-600" />
                                        Cronograma de Ejecución (Gantt)
                                    </h3>

                                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 overflow-x-auto min-h-[400px]">
                                        {analysis.milestones.length === 0 ? (
                                            <p className="text-slate-500 text-center py-8">No hay suficientes datos temporales para generar el Gantt</p>
                                        ) : (
                                            <div className="relative pt-10">
                                                {/* Timeline Axis */}
                                                <div className="absolute top-0 left-0 right-0 h-8 border-b border-slate-200 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <div className="w-1/4">Estructura</div>
                                                    <div className="flex-1 flex justify-between px-4">
                                                        <span>Inicio</span>
                                                        <span>Proyección Temporal</span>
                                                        <span>Finalización</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-12 py-6">
                                                    {(() => {
                                                        const start = analysis.timeline.dateRange?.start ? parseISO(analysis.timeline.dateRange.start) : new Date();
                                                        const end = analysis.timeline.dateRange?.end ? parseISO(analysis.timeline.dateRange.end) : addDays(new Date(), 30);
                                                        const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                                                        return analysis.milestones.map((milestone, mIdx) => {
                                                            const mDate = parseISO(milestone.date);
                                                            const relativePos = Math.max(0, Math.min(90, ((mDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100));
                                                            const width = Math.min(100 - relativePos, 20 + (mIdx * 5) % 30);

                                                            return (
                                                                <div key={mIdx} className="flex items-center group">
                                                                    <div className="w-1/5 pr-4">
                                                                        <div className="flex items-center">
                                                                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-tighter">{milestone.title}</h5>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                                            {format(mDate, "d MMM", { locale: es })}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex-1 relative h-10 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 group-hover:bg-emerald-50/30 transition-colors">
                                                                        <div
                                                                            className={`absolute top-1.5 bottom-1.5 rounded-lg shadow-lg transition-all duration-1000 flex items-center justify-center text-[9px] font-black text-white hover:scale-105 ${milestone.status === "completed" ? "bg-emerald-500 shadow-emerald-500/20" :
                                                                                milestone.status === "in-progress" ? "bg-blue-500 animate-pulse shadow-blue-500/20" :
                                                                                    milestone.status === "overdue" ? "bg-red-500 shadow-red-500/20" : "bg-slate-400"
                                                                                }`}
                                                                            style={{
                                                                                left: `${relativePos}%`,
                                                                                width: `${width}%`
                                                                            }}
                                                                        >
                                                                            {milestone.status.toUpperCase()}
                                                                        </div>

                                                                        {/* Description text next to the bar */}
                                                                        {milestone.description && (
                                                                            <div
                                                                                className="absolute top-1/2 -translate-y-1/2 ml-4 pointer-events-none z-[50]"
                                                                                style={{
                                                                                    left: `${relativePos + width}%`
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all group-hover:scale-105">
                                                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                                                        {milestone.description}
                                                                                    </span>
                                                                                    {milestone.status && (
                                                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm border ${milestone.status === 'completed' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-300/50' :
                                                                                                milestone.status === 'overdue' ? 'bg-rose-500/20 text-rose-700 border-rose-300/50' :
                                                                                                    milestone.status === 'in-progress' ? 'bg-blue-500/20 text-blue-700 border-blue-300/50' :
                                                                                                        milestone.status === 'pending' || milestone.status === 'pendiente' ? 'bg-amber-500/20 text-amber-700 border-amber-300/50' :
                                                                                                            'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50'
                                                                                            }`}>
                                                                                            {milestone.status === 'completed' ? 'Completado' :
                                                                                                milestone.status === 'overdue' ? 'Vencido' :
                                                                                                    milestone.status === 'in-progress' ? 'En Progreso' :
                                                                                                        'Pendiente'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>

                                                {/* Legend */}
                                                <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Completado</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">En Progreso</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Pendiente</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Vencido</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                                        <Sparkles className="text-purple-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-purple-900 leading-relaxed italic">
                                            Este cronograma visual ha sido generado analizando las dependencias y fechas extraídas por la IA. Representa la ruta crítica óptima para la consecución de los objetivos del proyecto.
                                        </p>
                                    </div>
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
