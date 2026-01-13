import React, { useMemo, useState, useRef, useEffect } from "react";
import { X, GanttChart, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Calendar, Flag, Activity, Sparkles } from "lucide-react";
import { PageData, DashboardColumn, DashboardItem } from "../../../types";
import { useTranslation } from "../hooks/useTranslation";
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
            start = startOfDay(addDays(viewDate, -7));
            end = startOfDay(addDays(viewDate, 7));
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

    const getColorClass = (color?: string) => {
        switch (color) {
            case 'blue': return "from-blue-500 to-blue-700 border-blue-400 shadow-blue-500/30";
            case 'orange': return "from-orange-500 to-orange-700 border-orange-400 shadow-orange-500/30";
            case 'purple': return "from-purple-500 to-purple-700 border-purple-400 shadow-purple-500/30";
            case 'green': return "from-emerald-500 to-emerald-700 border-emerald-400 shadow-emerald-500/30";
            case 'rose':
            case 'red': return "from-rose-500 to-rose-700 border-rose-400 shadow-rose-500/30";
            case 'amber': return "from-amber-500 to-amber-700 border-amber-400 shadow-amber-500/30";
            case 'indigo': return "from-indigo-500 to-indigo-700 border-indigo-400 shadow-indigo-500/30";
            default: return "from-slate-500 to-slate-700 border-slate-400 shadow-slate-500/30";
        }
    };

    const handlePrev = () => {
        if (viewMode === 'day') setViewDate(prev => addDays(prev, -14));
        else if (viewMode === 'week') setViewDate(prev => addMonths(prev, -12));
        else setViewDate(prev => addMonths(prev, -1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setViewDate(prev => addDays(prev, 14));
        else if (viewMode === 'week') setViewDate(prev => addMonths(prev, 12));
        else setViewDate(prev => addMonths(prev, 1));
    };

    const handleToday = () => setViewDate(new Date());

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

    const getStatusColorClasses = (color?: string) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-500/20 text-emerald-700 border-emerald-300/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/50';
            case 'blue': return 'bg-blue-500/20 text-blue-700 border-blue-300/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/50';
            case 'rose': return 'bg-rose-500/20 text-rose-700 border-rose-300/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/50';
            case 'amber': return 'bg-amber-500/20 text-amber-700 border-amber-300/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/50';
            case 'purple': return 'bg-purple-500/20 text-purple-700 border-purple-300/50 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-800/50';
            case 'indigo': return 'bg-indigo-500/20 text-indigo-700 border-indigo-300/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800/50';
            case 'cyan': return 'bg-cyan-500/20 text-cyan-700 border-cyan-300/50 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-800/50';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50 dark:border-slate-700/50';
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full h-[95vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-10 transition-colors">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <GanttChart className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('viewGantt')}</h2>
                            <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-1">{pageData.pageConfig.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Selector de Modo Premium */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800">
                            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
                                        ${viewMode === mode
                                            ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-105'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
                                    `}
                                >
                                    {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>

                        {/* Navegación Temporal */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800">
                            <button onClick={handlePrev} className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all active:scale-95"><ChevronLeft size={20} /></button>
                            <div className="px-6 flex flex-col items-center min-w-[200px]">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    {viewMode === 'day' && `${format(timelineData.start, "d MMM")} - ${format(timelineData.end, "d MMM")}`}
                                    {viewMode === 'week' && `Año ${format(viewDate, "yyyy")}`}
                                    {viewMode === 'month' && `${format(timelineData.start, "MMM yyyy", { locale: es })} - ${format(timelineData.end, "MMM yyyy", { locale: es })}`}
                                </span>
                            </div>
                            <button onClick={handleNext} className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all active:scale-95"><ChevronRight size={20} /></button>
                        </div>

                        <button onClick={handleToday} className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                            HOY
                        </button>

                        <button
                            onClick={handleCenterOnTasks}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Sparkles size={14} />
                            IR A TAREAS
                        </button>

                        <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />

                        <button onClick={onClose} className="p-3.5 bg-slate-100 dark:bg-slate-900 hover:bg-rose-500 hover:text-white text-slate-500 rounded-2xl transition-all active:scale-90 group">
                            <X size={20} className="transition-transform group-hover:rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex bg-white dark:bg-slate-950">

                    {/* Sidebar */}
                    <div className="w-[240px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950 z-20 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
                        <div className="h-[72px] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 mr-3">
                                    <Calendar size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estructura</span>
                            </div>

                            {/* Summary count */}
                            {(() => {
                                const total = flatItems.filter(i => i.type === 'item').length;
                                const withDate = flatItems.filter(i => i.type === 'item' && (i.date || (i as any).due_date || (i as any).finish_date)).length;
                                return (
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <Activity size={10} className="text-emerald-500" />
                                        <span className="text-[9px] font-black tabular-nums">{withDate}/{total}</span>
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
                                            ? 'bg-slate-100 dark:bg-slate-800/80 mt-2 first:mt-0 font-black border-y border-slate-200 dark:border-slate-700'
                                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'}
                                    `}
                                >
                                    {item.type === 'column' ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[11px] uppercase tracking-widest text-slate-400 truncate">{item.title}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate leading-tight flex-shrink-0">{item.label}</span>
                                                {item.status && (
                                                    <div
                                                        className={`w-2 h-2 rounded-full shrink-0 ${item.statusColor === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                            item.statusColor === 'rose' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                                item.statusColor === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                                                                    item.statusColor === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
                                                                        item.statusColor === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                                                            item.statusColor === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]' :
                                                                                item.statusColor === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' :
                                                                                    'bg-slate-400'
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                            {item.date && (
                                                <span className="text-[9px] text-slate-400 font-medium tabular-nums mt-0.5">
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
                        <div className="h-[72px] border-b border-slate-100 dark:border-slate-800 flex bg-white dark:bg-slate-950 z-10 overflow-x-auto no-scrollbar scroll-smooth"
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
                                            className={`shrink-0 ${viewMode === 'day' ? 'w-[120px]' : viewMode === 'week' ? 'w-[60px]' : 'w-[180px]'} border-r border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transition-colors
                                                ${unit.isToday ? 'bg-emerald-500/[0.04]' : ''}
                                            `}
                                        >
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${unit.isToday ? 'text-emerald-500' : 'text-slate-400'}`}>{unit.label}</span>
                                            <span className={`text-sm font-black mt-1 ${unit.isToday ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {unit.subLabel}
                                            </span>
                                            {hasItemsHere && (
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grid Rows */}
                        <div
                            className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative"
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
                                        <div key={i} className={`h-full border-r border-slate-50 dark:border-slate-900/40 shrink-0 ${unit.isToday ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-x-2 border-x-emerald-500/20' : ''}`}
                                            style={{ width: `${viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180}px` }} />
                                    ))}
                                </div>

                                {/* Today Line (Global) */}
                                {timelineData.units.some(u => u.isToday) && (
                                    <div
                                        className="absolute top-0 bottom-0 w-[4px] bg-rose-500 z-[30] pointer-events-none shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                                        style={{
                                            left: `${timelineData.units.findIndex(u => u.isToday) * (viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180)}px`,
                                            marginLeft: `${(viewMode === 'day' ? 120 : viewMode === 'week' ? 60 : 180) / 2}px`
                                        }}
                                    />
                                )}

                                {/* Data Rows Container */}
                                <div className="relative pt-4">
                                    {flatItems.map((item, idx) => (
                                        <div key={item.id + idx + '-row'} className={`h-16 flex relative border-b border-slate-50/50 dark:border-slate-900/20 group transition-colors ${item.type === 'column' ? 'bg-slate-100/50 dark:bg-slate-800/40 border-y border-slate-200/50 dark:border-slate-700/50' : ''}`}>
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
                                                            className={`absolute top-[10px] bottom-[10px] rounded-xl border-[3px] z-[100] flex items-center px-4 shadow-2xl transition-all hover:scale-[1.05] hover:z-[200] cursor-pointer
                                                                bg-gradient-to-br ${getColorClass(item.color)} text-white border-white/60 dark:border-white/40
                                                                ${item.status === 'bloqueado' ? 'ring-4 ring-rose-500/30 animate-pulse' : ''}
                                                                ${item.status === 'completado' ? 'ring-4 ring-emerald-500/30' : ''}
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
                                                                    <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                                                                        <AlertTriangle size={14} className="text-white" />
                                                                    </div>
                                                                ) : item.status === 'completado' ? (
                                                                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                                                                        <CheckCircle2 size={14} className="text-white" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0">
                                                                        <Clock size={14} className="text-white" />
                                                                    </div>
                                                                )}

                                                                <div className="flex flex-col min-w-0 leading-none">
                                                                    <span className="text-[11px] font-black truncate uppercase tracking-tight">{item.label}</span>
                                                                    <span className="text-[9px] opacity-70 font-bold mt-1 uppercase tracking-widest tabular-nums flex items-center gap-1">
                                                                        <Calendar size={10} />
                                                                        {format(itemDate, "d MMM", { locale: es })}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Extreme Progress Indicator */}
                                                            {item.progress > 0 && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ease-out ${item.progress === 100 ? 'bg-emerald-400' : 'bg-white/60'}`}
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
                                                                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all group-hover:scale-105">
                                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                                        {item.description}
                                                                    </span>
                                                                    {item.status && (
                                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm border ${getStatusColorClasses(item.statusColor)}`}>
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
                <div className="px-10 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-rose-500 transition-colors">Estado Crítico</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">Terminado</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.3)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Activo</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                            <Activity size={12} className="text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estratega TimeSync™ v1.5</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default GanttPanel;
