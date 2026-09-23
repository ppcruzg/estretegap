import React, { useMemo, useState, useRef, useEffect } from "react";
import { X, GanttChart, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Calendar, Flag, Activity, Sparkles } from "lucide-react";
import { PageData, DashboardColumn, DashboardItem } from "@/types";
import { useTranslation } from "../hooks/useTranslation";
import { getStatusColorClasses } from "../helpers/statusColors";
import IconButton from "./ui/IconButton";
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    parseISO,
    isWithinInterval,
    differenceInDays,
    differenceInCalendarDays,
    differenceInCalendarWeeks,
    differenceInCalendarMonths,
    startOfDay,
    startOfWeek,
    endOfWeek,
    addMonths,
    eachMonthOfInterval,
    addWeeks,
    eachWeekOfInterval,
    startOfYear,
    endOfYear,
    differenceInWeeks,
    differenceInMonths,
} from "date-fns";
import { es } from "date-fns/locale";

interface GanttPanelProps {
    pageData: PageData;
    onClose: () => void;
}

type ViewMode = 'day' | 'week' | 'month';

const GanttPanel: React.FC<GanttPanelProps> = ({ pageData, onClose }) => {
    const { t } = useTranslation();
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const timelineRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const hasAutoCentered = useRef(false);

    // Sync scroll helper
    const handleScroll = (e: React.UIEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
        if (targetRef.current && targetRef.current.scrollTop !== e.currentTarget.scrollTop) {
            targetRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // Calculate timeline structure based on mode
    const timelineData = useMemo(() => {
        let start, end, units: any[] = [];
        const now = startOfDay(new Date());

        if (viewMode === 'day') {
            start = startOfDay(addDays(viewDate, -3));
            end = startOfDay(addDays(viewDate, 14));
            units = eachDayOfInterval({ start, end }).map(d => ({
                date: d,
                label: format(d, "eee", { locale: es }),
                subLabel: format(d, "d"),
                isToday: isSameDay(d, now)
            }));
        } else if (viewMode === 'week') {
            start = startOfYear(viewDate);
            end = endOfYear(viewDate);
            units = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w, i) => ({
                date: w,
                label: `S${i + 1}`,
                subLabel: format(w, "d MMM", { locale: es }),
                isToday: isWithinInterval(now, { start: w, end: addDays(w, 6) })
            }));
        } else {
            start = startOfMonth(viewDate);
            end = endOfMonth(addMonths(start, 11));
            units = eachMonthOfInterval({ start, end }).map(m => ({
                date: m,
                label: format(m, "MMMM", { locale: es }),
                subLabel: format(m, "yyyy"),
                isToday: isSameDay(startOfMonth(m), startOfMonth(now))
            }));
        }

        return { start, end, units, timeWindow: { start, end } };
    }, [viewDate, viewMode]);

    const handlePrev = () => {
        if (viewMode === 'day') setViewDate(prev => addDays(prev, -7));
        else if (viewMode === 'week') setViewDate(prev => addMonths(prev, -12));
        else setViewDate(prev => addMonths(prev, -1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setViewDate(prev => addDays(prev, 7));
        else if (viewMode === 'week') setViewDate(prev => addMonths(prev, 12));
        else setViewDate(prev => addMonths(prev, 1));
    };

    const handleToday = () => setViewDate(new Date());

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (hasAutoCentered.current) return;

        const itemsWithDates = (pageData.columns || [])
            .flatMap(c => c.items || [])
            .filter(i => {
                const d = safeParseDate(i.date || (i as any).due_date || (i as any).finish_date);
                return d !== null;
            });

        if (itemsWithDates.length > 0) {
            const parsedDates = itemsWithDates.map(i => safeParseDate(i.date || (i as any).due_date || (i as any).finish_date)!);
            const earliest = new Date(Math.min(...parsedDates.map(d => d.getTime())));
            setViewDate(earliest);
            hasAutoCentered.current = true;
        }
    }, [pageData]);

    const handleCenterOnTasks = () => {
        const itemsWithDates = (pageData.columns || [])
            .flatMap(c => c.items || [])
            .filter(i => safeParseDate(i.date || (i as any).due_date || (i as any).finish_date));

        if (itemsWithDates.length > 0) {
            const parsedDates = itemsWithDates.map(i => safeParseDate(i.date || (i as any).due_date || (i as any).finish_date)!);
            const earliest = new Date(Math.min(...parsedDates.map(d => d.getTime())));
            setViewDate(earliest);
            // Reset horizontal scroll
            if (timelineRef.current) timelineRef.current.scrollLeft = 0;
        }
    };

    const safeParseDate = (dateStr: any) => {
        if (!dateStr) return null;
        try {
            let d;
            if (typeof dateStr === 'string') {
                const cleaned = dateStr.trim();
                // Handle YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
                    d = parseISO(cleaned.substring(0, 10));
                } else {
                    d = new Date(cleaned);
                }
            } else {
                d = new Date(dateStr);
            }

            if (!d || isNaN(d.getTime())) return null;
            return startOfDay(d);
        } catch (e) {
            return null;
        }
    };

    const flatItems = useMemo(() => {
        const result: any[] = [];
        (pageData.columns || []).forEach(col => {
            result.push({ ...col, type: 'column' });
            (col.items || []).forEach(item => {
                const completedTasks = (item.checklist || []).filter(c => c.completed).length;
                const totalTasks = (item.checklist || []).length;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                // Find status category
                const statusCat = (col.statusCategories || []).find(s => s.id === item.status);
                const sLabel = statusCat?.label || item.status || '';
                let sColor = statusCat?.color || 'slate';

                // INTELLIGENT COLOR MAPPING BASED ON LABEL
                const lowerLabel = sLabel.toLowerCase();
                if (lowerLabel.includes('completad') || progress === 100) {
                    sColor = 'emerald';
                } else if (lowerLabel.includes('proceso') || lowerLabel.includes('progress') || lowerLabel.includes('ejecucion')) {
                    sColor = 'blue';
                } else if (lowerLabel.includes('pendiente') || lowerLabel.includes('pending')) {
                    sColor = 'amber';
                } else if (lowerLabel.includes('atrasado') || lowerLabel.includes('vencido') || lowerLabel.includes('overdue') || lowerLabel.includes('bloqueado')) {
                    sColor = 'rose';
                }

                result.push({
                    ...item,
                    type: 'item',
                    color: col.color,
                    progress,
                    statusLabel: sLabel,
                    statusColor: sColor
                });
            });
        });
        return result;
    }, [pageData]);

    // Calculate position helper
    const getUnitOffset = (itemDate: Date) => {
        if (viewMode === 'day') {
            return differenceInCalendarDays(itemDate, timelineData.start);
        } else if (viewMode === 'week') {
            return differenceInCalendarWeeks(itemDate, timelineData.start, { weekStartsOn: 1 });
        } else {
            return differenceInCalendarMonths(itemDate, timelineData.start);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-overlay backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div role="dialog" aria-modal="true" aria-label={t('viewGantt')} className="relative w-full h-[95vh] bg-surface text-fg border border-border rounded-[2.5rem] shadow-pop overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-surface z-10 transition-colors">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary text-primary-fg rounded-[1.25rem] flex items-center justify-center shadow-pop">
                            <GanttChart size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-fg uppercase tracking-tighter leading-none">{t('viewGantt')}</h2>
                            <p className="text-[11px] text-fg-muted font-black tracking-[0.2em] uppercase mt-1">{pageData.pageConfig.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Selector de Modo Premium */}
                        <div className="flex items-center bg-surface-muted rounded-2xl p-1.5 border border-border">
                            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    aria-pressed={viewMode === mode}
                                    className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-control transition-all
                                        ${viewMode === mode
                                            ? 'bg-surface text-primary shadow-card scale-105'
                                            : 'text-fg-muted hover:text-fg'}
                                    `}
                                >
                                    {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>

                        {/* Navegación Temporal */}
                        <div className="flex items-center bg-surface-muted rounded-2xl p-1.5 border border-border">
                            <button onClick={handlePrev} aria-label={t('previous')} title={t('previous')} className="p-2.5 hover:bg-surface rounded-control text-fg-muted hover:text-fg transition-all active:scale-95"><ChevronLeft size={20} /></button>
                            <div className="px-6 flex flex-col items-center min-w-[200px]">
                                <span className="text-xs font-black text-fg uppercase tracking-widest">
                                    {viewMode === 'day' && `${format(timelineData.start, "d MMM")} - ${format(timelineData.end, "d MMM")}`}
                                    {viewMode === 'week' && `Año ${format(viewDate, "yyyy")}`}
                                    {viewMode === 'month' && `${format(timelineData.start, "MMM yyyy", { locale: es })} - ${format(timelineData.end, "MMM yyyy", { locale: es })}`}
                                </span>
                            </div>
                            <button onClick={handleNext} aria-label={t('next')} title={t('next')} className="p-2.5 hover:bg-surface rounded-control text-fg-muted hover:text-fg transition-all active:scale-95"><ChevronRight size={20} /></button>
                        </div>

                        <button onClick={handleToday} className="px-6 py-3 bg-surface border border-border text-fg-muted hover:text-fg text-xs font-black uppercase tracking-widest rounded-control hover:bg-surface-muted transition-all shadow-card active:scale-95">
                            HOY
                        </button>

                        <button
                            onClick={handleCenterOnTasks}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-fg text-xs font-black uppercase tracking-widest rounded-control hover:bg-primary-hover transition-all shadow-card active:scale-95"
                        >
                            <Sparkles size={14} />
                            IR A TAREAS
                        </button>

                        <div className="w-px h-10 bg-border" />

                        <IconButton aria-label={t('close')} variant="danger" onClick={onClose} className="h-12 w-12 bg-surface-muted group">
                            <X size={20} className="transition-transform group-hover:rotate-90" />
                        </IconButton>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex bg-surface">

                    {/* Sidebar */}
                    <div className="w-[240px] border-r border-border flex flex-col bg-surface z-20 shadow-card">
                        <div className="h-[72px] border-b border-border flex items-center justify-between px-8">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-control bg-surface-muted flex items-center justify-center text-fg-subtle mr-3">
                                    <Calendar size={16} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-fg-muted">Estructura</span>
                            </div>

                            {/* Summary count */}
                            {(() => {
                                const total = flatItems.filter(i => i.type === 'item').length;
                                const withDate = flatItems.filter(i => i.type === 'item' && (i.date || (i as any).due_date || (i as any).finish_date)).length;
                                return (
                                    <div className="flex items-center gap-1.5 text-fg-muted">
                                        <Activity size={10} className="text-success" />
                                        <span className="text-[11px] font-black tabular-nums">{withDate}/{total}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        <div
                            className="flex-1 overflow-y-auto no-scrollbar py-4"
                            ref={sidebarRef}
                            onScroll={(e) => handleScroll(e, timelineRef)}
                        >
                            {flatItems.map((item, idx) => (
                                <div
                                    key={item.id + idx}
                                    className={`h-16 flex items-center px-8 border-b border-transparent transition-all
                                        ${item.type === 'column'
                                            ? 'bg-surface-muted mt-2 first:mt-0 font-black border-y border-border'
                                            : 'hover:bg-surface-muted/50'}
                                    `}
                                >
                                    {item.type === 'column' ? (
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColorClasses(item.color).dot}`} />
                                            <span className="text-[11px] uppercase tracking-widest text-fg-muted truncate">{item.title}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-sm font-bold text-fg truncate leading-tight flex-shrink-0">{item.label}</span>
                                                {item.status && (
                                                    <div
                                                        className={`w-2 h-2 rounded-full shrink-0 ${getStatusColorClasses(item.statusColor).dot}`}
                                                    />
                                                )}
                                            </div>
                                            {item.date && (
                                                <span className="text-[11px] text-fg-subtle font-medium tabular-nums mt-0.5">
                                                    📅 {String(item.date).substring(0, 10)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">

                        {/* Timeline Header Units */}
                        <div className="h-[72px] border-b border-border flex bg-surface z-10 overflow-x-auto no-scrollbar scroll-smooth"
                            style={{ scrollbarWidth: 'none' }}>
                            <div className="flex h-full" style={{ width: `${timelineData.units.length * (viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180)}px` }}>
                                {timelineData.units.map((unit, idx) => {
                                    const hasItemsHere = flatItems.some(item => {
                                        if (item.type !== 'item') return false;
                                        const date = safeParseDate(item.date || (item as any).due_date || (item as any).finish_date);
                                        if (!date) return false;
                                        if (viewMode === 'day') return isSameDay(date, unit.date);
                                        if (viewMode === 'week') return isWithinInterval(date, {
                                            start: startOfWeek(unit.date, { weekStartsOn: 1 }),
                                            end: endOfWeek(unit.date, { weekStartsOn: 1 })
                                        });
                                        if (viewMode === 'month') return isWithinInterval(date, {
                                            start: startOfMonth(unit.date),
                                            end: endOfMonth(unit.date)
                                        });
                                        return false;
                                    });

                                    return (
                                        <div
                                            key={idx}
                                            className={`shrink-0 ${viewMode === 'day' ? 'w-[120px]' : viewMode === 'week' ? 'w-[60px]' : 'w-[180px]'} border-r border-border flex flex-col items-center justify-center transition-colors
                                                ${unit.isToday ? 'bg-primary-soft' : ''}
                                            `}
                                        >
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${unit.isToday ? 'text-primary-soft-fg' : 'text-fg-muted'}`}>{unit.label}</span>
                                            <span className={`text-sm font-black mt-1 ${unit.isToday ? 'text-primary-soft-fg scale-110' : 'text-fg'}`}>
                                                {unit.subLabel}
                                            </span>
                                            {hasItemsHere && (
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grid Rows */}
                        <div
                            className="flex-1 overflow-auto bg-surface relative"
                            ref={timelineRef}
                            onScroll={(e) => {
                                handleScroll(e, sidebarRef);
                                // Sync header scroll
                                const header = e.currentTarget.parentElement?.querySelector('.overflow-x-auto');
                                if (header) header.scrollLeft = e.currentTarget.scrollLeft;
                            }}
                        >
                            <div className="relative min-h-full" style={{ width: `${timelineData.units.length * (viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180)}px` }}>
                                {/* Vertical Lines & Today Indicator */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {timelineData.units.map((unit, i) => (
                                        <div key={i} className={`h-full border-r border-border/60 shrink-0 ${unit.isToday ? 'bg-primary-soft/60 border-x-2 border-x-primary/20' : ''}`}
                                            style={{ width: `${viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180}px` }} />
                                    ))}
                                </div>

                                {/* Today Line (Global) */}
                                {timelineData.units.some(u => u.isToday) && (
                                    <div
                                        className="absolute top-0 bottom-0 w-[4px] bg-danger z-[30] pointer-events-none shadow-pop"
                                        style={{
                                            left: `${timelineData.units.findIndex(u => u.isToday) * (viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180)}px`,
                                            marginLeft: `${(viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180) / 2}px`
                                        }}
                                    />
                                )}

                                {/* Data Rows Container */}
                                <div className="relative pt-4">
                                    {flatItems.map((item, idx) => (
                                        <div key={item.id + idx + '-row'} className={`h-16 flex relative border-b border-border/40 group transition-colors ${item.type === 'column' ? 'bg-surface-muted/60 border-y border-border' : ''}`}>
                                            {item.type === 'item' && (item.date || (item as any).due_date || (item as any).finish_date) && (() => {
                                                const itemRawDate = item.date || (item as any).due_date || (item as any).finish_date;
                                                const itemDate = safeParseDate(itemRawDate);
                                                if (!itemDate) return null;

                                                // Relaxed check: if it's within the window +/- 30 days to be safe,
                                                // but we still only render if it's physically within the units range.
                                                const offsetIdx = getUnitOffset(itemDate);
                                                if (offsetIdx < 0 || offsetIdx >= timelineData.units.length) return null;

                                                const unitWidth = viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180;
                                                const offsetPx = offsetIdx * unitWidth;

                                                return (
                                                    <>
                                                        <div
                                                            className={`absolute top-[10px] bottom-[10px] rounded-xl border-[3px] z-[100] flex items-center px-4 shadow-pop transition-all hover:scale-[1.05] hover:z-[200] cursor-pointer
                                                                ${getStatusColorClasses(item.color).solid} text-white border-white/60 dark:border-white/40
                                                                ${item.status === 'bloqueado' ? 'ring-4 ring-danger/30 animate-pulse' : ''}
                                                                ${item.status === 'completado' ? 'ring-4 ring-success/30' : ''}
                                                            `}
                                                            style={{
                                                                left: `${offsetPx}px`,
                                                                width: `${viewMode === 'day' ? '110px' : viewMode === 'week' ? '50px' : '160px'}`,
                                                                marginLeft: '4px'
                                                            }}
                                                        >
                                                            {/* Background Glass Effect */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                                                            <div className="relative flex items-center gap-3 w-full min-w-0">
                                                                {item.status === 'bloqueado' ? (
                                                                    <div className="w-6 h-6 bg-danger text-danger-fg rounded-lg flex items-center justify-center shrink-0 shadow-card">
                                                                        <AlertTriangle size={14} />
                                                                    </div>
                                                                ) : item.status === 'completado' ? (
                                                                    <div className={`w-6 h-6 ${getStatusColorClasses('emerald').dot} text-white rounded-lg flex items-center justify-center shrink-0 shadow-card`}>
                                                                        <CheckCircle2 size={14} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0">
                                                                        <Clock size={14} className="text-white" />
                                                                    </div>
                                                                )}

                                                                <div className="flex flex-col min-w-0 leading-none">
                                                                    <span className="text-[11px] font-black truncate uppercase tracking-tight">{item.label}</span>
                                                                    <span className="text-[11px] opacity-80 font-bold mt-1 uppercase tracking-widest tabular-nums flex items-center gap-1">
                                                                        <Calendar size={10} />
                                                                        {format(itemDate, "d MMM", { locale: es })}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Extreme Progress Indicator */}
                                                            {item.progress > 0 && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ease-out ${item.progress === 100 ? getStatusColorClasses('emerald').dot : 'bg-white/60'}`}
                                                                        style={{ width: `${item.progress}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Description text next to the bar */}
                                                        {item.description && (
                                                            <div
                                                                className="absolute top-1/2 -translate-y-1/2 ml-4 pointer-events-none z-[50] group-hover:z-[300]"
                                                                style={{
                                                                    left: `${offsetPx + (viewMode === 'day' ? 110 : viewMode === 'week' ? 50 : 160) + 8}px`,
                                                                    maxWidth: '800px'
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3 bg-surface-raised/85 backdrop-blur-md px-3 py-1.5 rounded-control shadow-pop border border-border transition-all group-hover:scale-105">
                                                                    <span className="text-[11px] text-fg-muted italic font-bold group-hover:text-fg transition-colors">
                                                                        {item.description}
                                                                    </span>
                                                                    {item.status && (
                                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-tighter border ${getStatusColorClasses(item.statusColor).badge}`}>
                                                                            {item.statusLabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Dashboard */}
                <div className="px-10 py-5 bg-surface-muted border-t border-border flex justify-between items-center z-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-fg-muted group-hover:text-danger transition-colors">Estado Crítico</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-success rounded-full" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-fg-muted group-hover:text-success transition-colors">Terminado</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className={`w-3 h-3 ${getStatusColorClasses('blue').dot} rounded-full`} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-fg-muted group-hover:text-fg transition-colors">Activo</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border shadow-card">
                            <Activity size={12} className="text-success animate-pulse" />
                            <span className="text-[11px] font-black text-fg-muted uppercase tracking-widest">Estratega TimeSync™ v1.5</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default GanttPanel;
