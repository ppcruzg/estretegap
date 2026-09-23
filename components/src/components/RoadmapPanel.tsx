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
import { analyzeRoadmapWithAI } from "../services/aiService";
import { downloadRoadmapPDF } from "../services/pdfExportService";
import EmailRoadmapModal from "./EmailRoadmapModal";
import IconButton from "./ui/IconButton";
import { buttonClasses } from "./ui";
import { useTranslation } from "../hooks/useTranslation";
import { getStatusColorClasses } from "../helpers/statusColors";
import {
    TONE_CLASSES,
    insightTone,
    milestoneStatusColor,
    severityTone,
    workloadTone,
} from "../helpers/semanticColors";
import type { RoadmapAnalysis, CriticalPoint, Insight } from "@/types/roadmapTypes";

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
    const { t } = useTranslation();

    useEffect(() => {
        loadAndAnalyze();
    }, [pageId]);

    useEffect(() => {
        if (showEmailModal) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose, showEmailModal]);

    const loadAndAnalyze = async () => {
        setLoading(true);
        setError(null);

        try {
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

    const getSeverityColor = (severity: string) => TONE_CLASSES[severityTone(severity)].badge;

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

    const getInsightColor = (type: string) => TONE_CLASSES[insightTone(type)].badge;

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
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
            <div role="dialog" aria-modal="true" aria-labelledby="roadmap-panel-title" className="bg-surface-raised text-fg border border-border rounded-card shadow-pop w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="roadmap-panel-title" className="text-xl font-bold text-fg">Roadmap con IA</h2>
                            <p className="text-sm text-fg-muted">{pageTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {analysis && (
                            <>
                                <button
                                    onClick={handleExportPDF}
                                    className={buttonClasses("secondary", "md")}
                                >
                                    <Download size={16} />
                                    Descargar PDF
                                </button>

                                <button
                                    onClick={() => setShowEmailModal(true)}
                                    className={buttonClasses("primary", "md")}
                                >
                                    <Mail size={16} />
                                    Enviar por Email
                                </button>
                            </>
                        )}

                        <button
                            onClick={loadAndAnalyze}
                            disabled={loading || analyzing}
                            className={buttonClasses("ghost", "md")}
                        >
                            <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} />
                            Regenerar
                        </button>

                        <IconButton aria-label={t("close")} onClick={onClose}>
                            <X size={20} />
                        </IconButton>
                    </div>
                </div>

                {/* Tabs */}
                {!loading && !error && analysis && (
                    <div className="flex items-center gap-2 px-6 pt-4 border-b border-border">
                        <button
                            onClick={() => setActiveTab("timeline")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "timeline"
                                ? "text-primary border-b-2 border-primary"
                                : "text-fg-muted hover:text-fg"
                                }`}
                        >
                            <Calendar size={16} className="inline mr-2" />
                            Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab("critical")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "critical"
                                ? "text-primary border-b-2 border-primary"
                                : "text-fg-muted hover:text-fg"
                                }`}
                        >
                            <AlertTriangle size={16} className="inline mr-2" />
                            Puntos Críticos ({analysis.criticalPoints.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("insights")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "insights"
                                ? "text-primary border-b-2 border-primary"
                                : "text-fg-muted hover:text-fg"
                                }`}
                        >
                            <Lightbulb size={16} className="inline mr-2" />
                            Insights ({analysis.insights.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("responsibilities")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "responsibilities"
                                ? "text-primary border-b-2 border-primary"
                                : "text-fg-muted hover:text-fg"
                                }`}
                        >
                            <Users size={16} className="inline mr-2" />
                            Responsables ({analysis.responsibilities.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("gantt")}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === "gantt"
                                ? "text-primary border-b-2 border-primary"
                                : "text-fg-muted hover:text-fg"
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
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="text-fg-muted font-medium">
                                {analyzing ? "Analizando roadmap con IA..." : "Cargando datos..."}
                            </p>
                            <p className="text-sm text-fg-subtle mt-2">Esto puede tomar unos segundos</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mb-4">
                                <XCircle size={32} className="text-danger" />
                            </div>
                            <h3 className="text-lg font-semibold text-fg mb-2">Error</h3>
                            <p className="text-sm text-fg-muted max-w-md">{error}</p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Summary Card */}
                            <div className="bg-primary-soft border border-primary/25 rounded-card p-6 mb-6">
                                <h3 className="text-lg font-bold text-primary-soft-fg mb-3 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Resumen Ejecutivo
                                </h3>
                                <p className="text-fg leading-relaxed whitespace-pre-line">{analysis.summary}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-primary/20">
                                    <div>
                                        <p className="text-xs text-primary-soft-fg font-medium">Total Items</p>
                                        <p className="text-2xl font-bold text-fg">{analysis.timeline.totalItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-primary-soft-fg font-medium">Con Fechas</p>
                                        <p className="text-2xl font-bold text-fg">{analysis.timeline.itemsWithDates}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-danger font-medium">Vencidas</p>
                                        <p className="text-2xl font-bold text-danger">{analysis.timeline.overdueTasks}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-success font-medium">Próximas</p>
                                        <p className="text-2xl font-bold text-success">{analysis.timeline.upcomingTasks}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "timeline" && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-fg mb-4">Milestones</h3>
                                    {analysis.milestones.length === 0 ? (
                                        <p className="text-fg-muted text-center py-8">No hay milestones definidos</p>
                                    ) : (
                                        analysis.milestones.map((milestone, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-surface border border-border rounded-card p-4 hover:border-primary/40 hover:shadow-card transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClasses(milestoneStatusColor(milestone.status)).dot}`} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-fg">{milestone.title}</h4>
                                                                <Sparkles size={12} className="text-primary" />
                                                            </div>
                                                            <p className="text-sm text-fg-muted">
                                                                {format(parseISO(milestone.date), "d 'de' MMMM, yyyy", { locale: es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColorClasses(milestoneStatusColor(milestone.status)).badge}`}>
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
                                                            className="px-2 py-1 bg-surface-muted text-fg rounded-md text-xs"
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
                                            <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                                            <p className="text-fg-muted font-medium">No hay puntos críticos detectados</p>
                                            <p className="text-sm text-fg-subtle mt-2">El proyecto está en buen estado</p>
                                        </div>
                                    ) : (
                                        analysis.criticalPoints.map((point, idx) => (
                                            <div
                                                key={idx}
                                                className={`border rounded-card p-4 ${getSeverityColor(point.severity)}`}
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
                                            className={`border rounded-card p-4 flex items-start gap-3 ${getInsightColor(insight.type)}`}
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
                                    <h3 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                                        <Users size={20} className="text-primary" />
                                        Asignación de Responsabilidades
                                    </h3>
                                    {analysis.responsibilities.length === 0 ? (
                                        <p className="text-fg-muted text-center py-8">No se han identificado responsables específicos</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {analysis.responsibilities.map((resp, idx) => (
                                                <div key={idx} className="bg-surface border border-border rounded-card p-5 hover:border-primary/40 transition-all shadow-card">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary-soft text-primary-soft-fg rounded-full flex items-center justify-center">
                                                                <UserCircle size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-fg">{resp.person}</h4>
                                                                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${TONE_CLASSES[workloadTone(resp.workload)].badge}`}>
                                                                    Carga {resp.workload === "high" ? "Alta" : resp.workload === "medium" ? "Media" : "Baja"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-fg-muted font-bold uppercase">Tareas Críticas</p>
                                                            <p className="text-xl font-black text-danger">{resp.criticalTasks}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {resp.tasks.map((task, tIdx) => {
                                                            const isObject = typeof task === 'object' && task !== null;
                                                            const title = isObject ? (task as any).title : task;
                                                            const isCritical = isObject ? (task as any).isCritical : false;
                                                            const date = isObject ? (task as any).date : null;

                                                            return (
                                                                <div key={tIdx} className={`p-2 rounded-lg text-xs flex items-center justify-between group transition-all hover:translate-x-1 ${isCritical ? "bg-danger-soft text-danger border border-danger/20" : "bg-surface-muted text-fg border border-border hover:bg-surface hover:border-primary/40"}`}>
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        {isCritical && <AlertTriangle size={12} className="flex-shrink-0 animate-pulse text-danger" />}
                                                                        <span className="truncate font-semibold">{title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        {date && (
                                                                            <span className="text-[11px] font-black text-fg-muted bg-surface/60 px-1.5 py-0.5 rounded border border-border">
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
                                    <h3 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                                        <GanttChart size={20} className="text-primary" />
                                        Cronograma de Ejecución (Gantt)
                                    </h3>

                                    <div className="bg-surface-muted border border-border rounded-card p-6 overflow-x-auto min-h-[400px]">
                                        {analysis.milestones.length === 0 ? (
                                            <p className="text-fg-muted text-center py-8">No hay suficientes datos temporales para generar el Gantt</p>
                                        ) : (
                                            <div className="relative pt-10">
                                                {/* Timeline Axis */}
                                                <div className="absolute top-0 left-0 right-0 h-8 border-b border-border flex items-center text-[11px] font-bold text-fg-muted uppercase tracking-widest">
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
                                                                            <h5 className="text-sm font-black text-fg uppercase tracking-tighter">{milestone.title}</h5>
                                                                        </div>
                                                                        <p className="text-[11px] text-fg-muted font-medium">
                                                                            {format(mDate, "d MMM", { locale: es })}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex-1 relative h-10 bg-surface rounded-control border border-border group-hover:bg-primary-soft/40 transition-colors">
                                                                        <div
                                                                            className={`absolute top-1.5 bottom-1.5 rounded-lg shadow-card transition-all duration-1000 flex items-center justify-center text-[11px] font-black text-white hover:scale-105 ${getStatusColorClasses(milestoneStatusColor(milestone.status)).dot} ${milestone.status === "in-progress" ? "animate-pulse" : ""}`}
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
                                                                                <div className="flex items-center gap-3 bg-surface-raised/85 backdrop-blur-md px-3 py-1.5 rounded-control shadow-pop border border-border transition-all group-hover:scale-105">
                                                                                    <span className="text-[11px] text-fg-muted italic font-bold group-hover:text-fg transition-colors">
                                                                                        {milestone.description}
                                                                                    </span>
                                                                                    {milestone.status && (
                                                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-tighter border ${getStatusColorClasses(milestoneStatusColor(milestone.status, milestone.status === 'pending' || milestone.status === 'pendiente' ? 'amber' : 'slate')).badge}`}>
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
                                                <div className="mt-12 pt-6 border-t border-border flex items-center justify-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClasses('emerald').dot}`} />
                                                        <span className="text-[11px] font-bold text-fg-muted uppercase">Completado</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClasses('blue').dot}`} />
                                                        <span className="text-[11px] font-bold text-fg-muted uppercase">En Progreso</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClasses('amber').dot}`} />
                                                        <span className="text-[11px] font-bold text-fg-muted uppercase">Pendiente</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClasses('rose').dot}`} />
                                                        <span className="text-[11px] font-bold text-fg-muted uppercase">Vencido</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-primary-soft border border-primary/20 rounded-card p-4 flex items-start gap-3">
                                        <Sparkles className="text-primary-soft-fg w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-fg leading-relaxed italic">
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
                    <div className="p-4 bg-surface-muted border-t border-border rounded-b-card flex items-center justify-between text-xs text-fg-muted">
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
