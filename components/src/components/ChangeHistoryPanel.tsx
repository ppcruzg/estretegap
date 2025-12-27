import React, { useState, useEffect } from "react";
import {
    X,
    Clock,
    Filter,
    Download,
    TrendingUp,
    Plus,
    Edit3,
    Trash2,
    ArrowRight,
    FileText,
    Folder,
    Calendar,
    User
} from "lucide-react";
import * as Repo from "../repository/estrategiaRepository";
import type { ChangeHistoryEntry, ChangeHistoryFilters } from "../../../types/changeHistory";

interface ChangeHistoryPanelProps {
    pageId: string;
    pageTitle: string;
    onClose: () => void;
}

const ChangeHistoryPanel: React.FC<ChangeHistoryPanelProps> = ({
    pageId,
    pageTitle,
    onClose,
}) => {
    const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ChangeHistoryFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [pageId, filters]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await Repo.getPageChangeHistory(pageId, filters);
            setHistory(data);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "created":
                return <Plus className="w-4 h-4" />;
            case "updated":
                return <Edit3 className="w-4 h-4" />;
            case "deleted":
                return <Trash2 className="w-4 h-4" />;
            case "moved":
                return <ArrowRight className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "created":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "updated":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "deleted":
                return "bg-red-100 text-red-700 border-red-200";
            case "moved":
                return "bg-purple-100 text-purple-700 border-purple-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case "column":
                return <Folder className="w-4 h-4" />;
            case "item":
                return <FileText className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Hace un momento";
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    const getChangeDescription = (entry: ChangeHistoryEntry) => {
        const entityName = entry.entityType === "column" ? "grupo" : "item";

        switch (entry.action) {
            case "created":
                return `Creó ${entityName} "${entry.newValue?.title || entry.newValue?.label || "sin nombre"}"`;

            case "deleted":
                return `Eliminó ${entityName} "${entry.oldValue?.title || entry.oldValue?.label || "sin nombre"}"`;

            case "moved":
                return `Movió "${entry.metadata?.itemLabel}" de "${entry.metadata?.fromColumn}" a "${entry.metadata?.toColumn}"`;

            case "updated":
                if (entry.fieldName === "title" || entry.fieldName === "label") {
                    return `Renombró de "${entry.oldValue}" a "${entry.newValue}"`;
                }
                if (entry.fieldName === "status") {
                    return `Cambió estado de "${entry.oldValue}" a "${entry.newValue}"`;
                }
                if (entry.fieldName === "color") {
                    return `Cambió color a ${entry.newValue}`;
                }
                if (entry.fieldName === "description") {
                    return `Actualizó la descripción`;
                }
                if (entry.fieldName === "date") {
                    return `Cambió la fecha`;
                }
                return `Actualizó ${entry.fieldName}`;

            default:
                return "Realizó un cambio";
        }
    };

    const exportToCSV = () => {
        const headers = ["Fecha", "Usuario", "Acción", "Tipo", "Descripción"];
        const rows = history.map(entry => [
            new Date(entry.changedAt).toLocaleString("es-ES"),
            entry.changedByName || "Desconocido",
            entry.action,
            entry.entityType,
            getChangeDescription(entry),
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `historial_${pageTitle}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Historial de Cambios</h2>
                            <p className="text-sm text-slate-500">{pageTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${showFilters
                                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent"
                                }`}
                        >
                            <Filter size={16} />
                            Filtros
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all duration-200"
                            disabled={history.length === 0}
                        >
                            <Download size={16} />
                            Exportar
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3">
                        <select
                            className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={filters.entityType || ""}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value as any || undefined })}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="column">Grupos</option>
                            <option value="item">Items</option>
                        </select>

                        <select
                            className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={filters.action || ""}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value as any || undefined })}
                        >
                            <option value="">Todas las acciones</option>
                            <option value="created">Creados</option>
                            <option value="updated">Actualizados</option>
                            <option value="deleted">Eliminados</option>
                            <option value="moved">Movidos</option>
                        </select>

                        <button
                            onClick={() => setFilters({})}
                            className="px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500">Cargando historial...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Clock size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Sin cambios registrados</h3>
                            <p className="text-sm text-slate-500">
                                Los cambios aparecerán aquí cuando se realicen modificaciones
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="relative pl-8 pb-4 last:pb-0"
                                >
                                    {/* Timeline line */}
                                    {index < history.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200"></div>
                                    )}

                                    {/* Timeline dot */}
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActionColor(entry.action)}`}>
                                        {getActionIcon(entry.action)}
                                    </div>

                                    {/* Content */}
                                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                    {getEntityIcon(entry.entityType)}
                                                    <span className="capitalize">{entry.entityType === "column" ? "Grupo" : "Item"}</span>
                                                </div>
                                                <span className="text-slate-400">•</span>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getActionColor(entry.action)}`}>
                                                    {entry.action === "created" && "Creado"}
                                                    {entry.action === "updated" && "Actualizado"}
                                                    {entry.action === "deleted" && "Eliminado"}
                                                    {entry.action === "moved" && "Movido"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500">{formatDate(entry.changedAt)}</span>
                                        </div>

                                        <p className="text-sm text-slate-900 mb-2">
                                            {getChangeDescription(entry)}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <User size={12} />
                                            <span>{entry.changedByName}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {!loading && history.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-600" />
                                <span className="font-medium text-slate-700">{history.length} cambios</span>
                            </div>
                            {filters.entityType && (
                                <span className="text-slate-500">
                                    Filtrando por: {filters.entityType === "column" ? "Grupos" : "Items"}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChangeHistoryPanel;
