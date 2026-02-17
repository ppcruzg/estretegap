import React, { useMemo } from 'react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    ChevronRight,
    Layout,
    AlertTriangle,
    Flag,
    Zap,
    Target,
    ArrowRight,
    Circle,
    TrendingUp
} from 'lucide-react';
import { PageData, DashboardItem } from '../types/columns';
import { parseISO, differenceInDays, format, isValid, isBefore, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExecutiveTimelineProps {
    pageData: PageData;
}

const ExecutiveTimeline: React.FC<ExecutiveTimelineProps> = ({ pageData }) => {
    const { columns, pageConfig } = pageData;
    const today = startOfDay(new Date());

    // Color system
    const getPhaseColor = (colorName: string) => {
        const palette: Record<string, {
            gradient: string; dot: string; badge: string; badgeText: string;
            line: string; cardBorder: string; cardAccent: string; iconBg: string;
            barFrom: string; barTo: string; glow: string;
        }> = {
            blue: { gradient: 'from-blue-500 to-blue-600', dot: 'bg-blue-500', badge: 'bg-blue-500', badgeText: 'text-white', line: 'border-blue-300', cardBorder: 'border-blue-200 dark:border-blue-800', cardAccent: 'bg-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-900/30', barFrom: '#3b82f6', barTo: '#2563eb', glow: 'shadow-blue-500/30' },
            emerald: { gradient: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-500', badgeText: 'text-white', line: 'border-emerald-300', cardBorder: 'border-emerald-200 dark:border-emerald-800', cardAccent: 'bg-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', barFrom: '#10b981', barTo: '#059669', glow: 'shadow-emerald-500/30' },
            green: { gradient: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-500', badgeText: 'text-white', line: 'border-emerald-300', cardBorder: 'border-emerald-200 dark:border-emerald-800', cardAccent: 'bg-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', barFrom: '#10b981', barTo: '#059669', glow: 'shadow-emerald-500/30' },
            rose: { gradient: 'from-rose-500 to-rose-600', dot: 'bg-rose-500', badge: 'bg-rose-500', badgeText: 'text-white', line: 'border-rose-300', cardBorder: 'border-rose-200 dark:border-rose-800', cardAccent: 'bg-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-900/30', barFrom: '#f43f5e', barTo: '#e11d48', glow: 'shadow-rose-500/30' },
            amber: { gradient: 'from-amber-500 to-amber-600', dot: 'bg-amber-500', badge: 'bg-amber-500', badgeText: 'text-white', line: 'border-amber-300', cardBorder: 'border-amber-200 dark:border-amber-800', cardAccent: 'bg-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-900/30', barFrom: '#f59e0b', barTo: '#d97706', glow: 'shadow-amber-500/30' },
            purple: { gradient: 'from-purple-500 to-purple-600', dot: 'bg-purple-500', badge: 'bg-purple-500', badgeText: 'text-white', line: 'border-purple-300', cardBorder: 'border-purple-200 dark:border-purple-800', cardAccent: 'bg-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-900/30', barFrom: '#a855f7', barTo: '#9333ea', glow: 'shadow-purple-500/30' },
            indigo: { gradient: 'from-indigo-500 to-indigo-600', dot: 'bg-indigo-500', badge: 'bg-indigo-500', badgeText: 'text-white', line: 'border-indigo-300', cardBorder: 'border-indigo-200 dark:border-indigo-800', cardAccent: 'bg-indigo-500', iconBg: 'bg-indigo-50 dark:bg-indigo-900/30', barFrom: '#6366f1', barTo: '#4f46e5', glow: 'shadow-indigo-500/30' },
            cyan: { gradient: 'from-cyan-500 to-cyan-600', dot: 'bg-cyan-500', badge: 'bg-cyan-500', badgeText: 'text-white', line: 'border-cyan-300', cardBorder: 'border-cyan-200 dark:border-cyan-800', cardAccent: 'bg-cyan-500', iconBg: 'bg-cyan-50 dark:bg-cyan-900/30', barFrom: '#06b6d4', barTo: '#0891b2', glow: 'shadow-cyan-500/30' },
            orange: { gradient: 'from-orange-500 to-orange-600', dot: 'bg-orange-500', badge: 'bg-orange-500', badgeText: 'text-white', line: 'border-orange-300', cardBorder: 'border-orange-200 dark:border-orange-800', cardAccent: 'bg-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-900/30', barFrom: '#f97316', barTo: '#ea580c', glow: 'shadow-orange-500/30' },
            slate: { gradient: 'from-slate-500 to-slate-600', dot: 'bg-slate-500', badge: 'bg-slate-500', badgeText: 'text-white', line: 'border-slate-300', cardBorder: 'border-slate-200 dark:border-slate-800', cardAccent: 'bg-slate-500', iconBg: 'bg-slate-50 dark:bg-slate-900/30', barFrom: '#64748b', barTo: '#475569', glow: 'shadow-slate-500/30' },
        };
        return palette[colorName] || palette.blue;
    };

    const timelineData = useMemo(() => {
        const phases = columns.filter(col => col.items && col.items.length > 0)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        if (phases.length === 0) return null;

        const getDates = (items: DashboardItem[]) =>
            items.map(i => i.date ? parseISO(i.date) : null).filter(d => d && isValid(d)) as Date[];

        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        const phaseDetails = phases.map(phase => {
            const dates = getDates(phase.items);
            const phaseMin = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
            const phaseMax = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

            if (phaseMin && (!minDate || phaseMin < minDate)) minDate = phaseMin;
            if (phaseMax && (!maxDate || phaseMax > maxDate)) maxDate = phaseMax;

            // Calculate completion percentage
            const completedItems = phase.items.filter(i => {
                const statusCat = (phase.statusCategories || []).find(s => s.id === i.status);
                const label = (statusCat?.label || i.status || '').toLowerCase();
                return label.includes('completad') || label.includes('done') || label.includes('terminad');
            }).length;
            const completionPct = phase.items.length > 0 ? Math.round((completedItems / phase.items.length) * 100) : 0;

            // Determine phase status
            const overdueItems = phase.items.filter(i => {
                if (!i.date) return false;
                const d = parseISO(i.date);
                return isValid(d) && isBefore(d, today);
            }).length;

            let phaseStatus: 'completed' | 'overdue' | 'in-progress' | 'upcoming' = 'upcoming';
            if (completionPct === 100) phaseStatus = 'completed';
            else if (overdueItems > 0) phaseStatus = 'overdue';
            else if (completionPct > 0) phaseStatus = 'in-progress';

            return {
                id: phase.id,
                title: phase.title,
                description: phase.description || '',
                items: [...phase.items].sort((a, b) => (a.position || 0) - (b.position || 0)),
                min: phaseMin,
                max: phaseMax,
                color: phase.color || 'blue',
                completionPct,
                overdueItems,
                phaseStatus
            };
        });

        const hasDates = minDate && maxDate;
        const totalDuration = hasDates ? differenceInDays(maxDate!, minDate!) || 1 : phases.length;

        return { phaseDetails, minDate, maxDate, totalDuration, hasDates };
    }, [columns]);

    if (!timelineData || timelineData.phaseDetails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
                <Calendar size={64} className="mb-6 opacity-20" />
                <p className="text-lg font-bold">Sin datos para el roadmap</p>
                <p className="text-sm mt-2">Agrega ítems con fechas a tus grupos para visualizar el cronograma.</p>
            </div>
        );
    }

    const { phaseDetails, totalDuration, hasDates } = timelineData;

    // Calculate stats
    const totalItems = phaseDetails.reduce((sum, p) => sum + p.items.length, 0);
    const totalOverdue = phaseDetails.reduce((sum, p) => sum + p.overdueItems, 0);
    const avgCompletion = phaseDetails.length > 0
        ? Math.round(phaseDetails.reduce((sum, p) => sum + p.completionPct, 0) / phaseDetails.length) : 0;

    // Build gradient stops for the thick timeline bar
    const gradientStops = phaseDetails.map((phase, idx) => {
        const colors = getPhaseColor(phase.color);
        const pos = (idx / Math.max(phaseDetails.length - 1, 1)) * 100;
        return `${colors.barFrom} ${pos}%`;
    }).join(', ');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'overdue': return <AlertTriangle size={14} className="text-rose-500" />;
            case 'in-progress': return <Zap size={14} className="text-blue-500" />;
            default: return <Clock size={14} className="text-slate-400" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Completado';
            case 'overdue': return 'Atención';
            case 'in-progress': return 'En Progreso';
            default: return 'Próximo';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500 text-white';
            case 'overdue': return 'bg-rose-500 text-white';
            case 'in-progress': return 'bg-blue-500 text-white';
            default: return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
        }
    };

    return (
        <div className="w-full bg-white dark:bg-slate-950 font-sans">

            {/* ─── HEADER ─── */}
            <div className="px-8 lg:px-12 pt-6 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Layout size={18} />
                    </div>
                    <div className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100 dark:border-blue-800/60">
                        Roadmap Estratégico
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800" />
                </div>

                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight leading-none">
                    {pageConfig.title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-3xl text-sm leading-relaxed">
                    {pageConfig.description || `Seguimiento de pendientes ${pageConfig.title}`}
                </p>
            </div>

            {/* ─── EXECUTIVE KPI STRIP ─── */}
            <div className="mx-8 lg:mx-12 mb-5 grid grid-cols-4 gap-3">
                {[
                    { label: 'Actividades', value: totalItems, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Fases', value: phaseDetails.length, icon: Flag, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Atención', value: totalOverdue, icon: AlertTriangle, color: totalOverdue > 0 ? 'text-rose-600' : 'text-emerald-600', bg: totalOverdue > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Avance', value: `${avgCompletion}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                ].map((kpi, i) => (
                    <div key={i} className={`${kpi.bg} rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800 flex items-center gap-3`}>
                        <kpi.icon size={16} className={kpi.color} />
                        <div>
                            <p className={`text-xl font-black ${kpi.color} leading-none`}>{kpi.value}</p>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── TIMELINE VISUALIZATION ─── */}
            <div className="relative px-8 lg:px-12">
                <div className="overflow-x-auto scrollbar-none pb-2">
                    <div className="min-w-[900px]" style={{ minWidth: `${Math.max(900, phaseDetails.length * 280)}px` }}>

                        {/* ─── UPPER LABELS (alternating above) ─── */}
                        <div className="relative flex w-full mb-0" style={{ height: '110px' }}>
                            {phaseDetails.map((phase, index) => {
                                const colors = getPhaseColor(phase.color);
                                const isAbove = index % 2 === 0;
                                let widthPct: number;
                                if (hasDates && phase.min && phase.max) {
                                    const dur = Math.max(differenceInDays(phase.max, phase.min), 7);
                                    widthPct = Math.max((dur / totalDuration) * 100, 15);
                                } else {
                                    widthPct = 100 / phaseDetails.length;
                                }

                                if (!isAbove) return (
                                    <div key={phase.id} style={{ width: `${widthPct}%` }} className="relative" />
                                );

                                return (
                                    <div key={phase.id} style={{ width: `${widthPct}%` }} className="relative flex flex-col items-center px-2">
                                        {/* Label Card Above */}
                                        <div className="flex flex-col items-center">
                                            {/* Date label */}
                                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mb-1.5 whitespace-nowrap">
                                                {phase.min ? format(phase.min, "d MMM", { locale: es }) : ''}
                                            </p>

                                            {/* Event Badge */}
                                            <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap`}>
                                                {getStatusIcon(phase.phaseStatus)}
                                                <span className="text-[10px] font-black uppercase tracking-wide">{phase.title}</span>
                                            </div>
                                        </div>

                                        {/* Vertical dashed line connecting to the bar */}
                                        <div className={`w-0 flex-1 border-l-2 border-dashed ${colors.line} dark:border-opacity-40 mt-2`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ─── THE MAIN TIMELINE BAR ─── */}
                        <div className="relative w-full h-3 rounded-full overflow-hidden shadow-inner"
                            style={{
                                background: `linear-gradient(90deg, ${gradientStops})`,
                            }}
                        >
                            {/* Glass overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                            {/* Subtle grid texture */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.3) 49px, rgba(255,255,255,0.3) 50px)'
                            }} />
                        </div>

                        {/* ─── MILESTONE DOTS ON THE BAR ─── */}
                        <div className="relative w-full" style={{ height: '0px', marginTop: '-18px' }}>
                            {phaseDetails.map((phase, index) => {
                                const colors = getPhaseColor(phase.color);
                                let leftPct: number;
                                if (hasDates && phase.min && timelineData.minDate) {
                                    leftPct = (differenceInDays(phase.min, timelineData.minDate!) / totalDuration) * 100;
                                } else {
                                    leftPct = (index / Math.max(phaseDetails.length - 1, 1)) * 100;
                                }

                                return (
                                    <div
                                        key={phase.id + '-dot'}
                                        className="absolute"
                                        style={{ left: `${Math.min(Math.max(leftPct, 2), 98)}%`, transform: 'translate(-50%, -50%)', top: '12px' }}
                                    >
                                        <div className={`w-7 h-7 rounded-full ${colors.dot} border-4 border-white dark:border-slate-950 shadow-xl ${colors.glow} z-20 relative`}>
                                            {/* Inner highlight */}
                                            <div className="absolute inset-1 rounded-full bg-white/30" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ─── LOWER LABELS (alternating below) ─── */}
                        <div className="relative flex w-full mt-3" style={{ minHeight: '120px' }}>
                            {phaseDetails.map((phase, index) => {
                                const colors = getPhaseColor(phase.color);
                                const isAbove = index % 2 === 0;
                                let widthPct: number;
                                if (hasDates && phase.min && phase.max) {
                                    const dur = Math.max(differenceInDays(phase.max, phase.min), 7);
                                    widthPct = Math.max((dur / totalDuration) * 100, 15);
                                } else {
                                    widthPct = 100 / phaseDetails.length;
                                }

                                if (isAbove) return (
                                    <div key={phase.id} style={{ width: `${widthPct}%` }} className="relative" />
                                );

                                return (
                                    <div key={phase.id} style={{ width: `${widthPct}%` }} className="relative flex flex-col items-center px-2">
                                        {/* Vertical dashed line connecting from the bar */}
                                        <div className={`w-0 border-l-2 border-dashed ${colors.line} dark:border-opacity-40 mb-1`} style={{ height: '18px' }} />

                                        {/* Event Badge */}
                                        <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap mb-1.5`}>
                                            {getStatusIcon(phase.phaseStatus)}
                                            <span className="text-[10px] font-black uppercase tracking-wide">{phase.title}</span>
                                        </div>

                                        {/* Date + Annotation */}
                                        <div className="text-center">
                                            <p className="text-slate-700 dark:text-slate-300 text-xs font-black">
                                                {phase.min ? format(phase.min, "d MMM", { locale: es }) : 'Sin fecha'}
                                            </p>
                                            <p className="text-slate-400 text-[9px] font-bold mt-0.5 leading-tight">
                                                {phase.items.length} act. · {phase.completionPct}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ─── DATE SCALE MARKERS ─── */}
                        {hasDates && timelineData.minDate && timelineData.maxDate && (
                            <div className="relative w-full flex justify-between mt-3 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {format(timelineData.minDate, "MMM yyyy", { locale: es })}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {format(timelineData.maxDate, "MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── PHASE DETAIL CARDS ─── */}
            <div className="px-8 lg:px-12 mt-6 mb-6">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="w-6 h-px bg-slate-300 dark:bg-slate-700" />
                    Detalle por Fase
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phaseDetails.map((phase, index) => {
                        const colors = getPhaseColor(phase.color);
                        return (
                            <div
                                key={phase.id + '-card'}
                                className={`bg-white dark:bg-slate-900 rounded-xl border ${colors.cardBorder} overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 group`}
                            >
                                {/* Card accent bar */}
                                <div className={`h-1 ${colors.cardAccent}`} />

                                <div className="p-3.5">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                                                <Flag size={13} className={`${colors.dot.replace('bg-', 'text-')}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{phase.title}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold">
                                                    {phase.min ? format(phase.min, "d MMM yyyy", { locale: es }) : 'Sin fecha'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1`}>
                                            {getStatusIcon(phase.phaseStatus)}
                                            {getStatusLabel(phase.phaseStatus)}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-2.5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progreso</span>
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{phase.completionPct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors.cardAccent} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${phase.completionPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Items list */}
                                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                                        {phase.items.map((item) => {
                                            const itemDate = item.date ? parseISO(item.date) : null;
                                            const isOverdue = itemDate && isValid(itemDate) && isBefore(itemDate, today);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${isOverdue
                                                        ? 'bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-rose-500' : colors.dot}`} />
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate flex-1">{item.label}</span>
                                                    {itemDate && isValid(itemDate) && (
                                                        <span className={`text-[9px] font-black tabular-nums shrink-0 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {format(itemDate, 'd/MM', { locale: es })}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── IMPACT / SUMMARY BAR ─── */}
            {totalOverdue > 0 && (
                <div className="mx-8 lg:mx-12 mb-5">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-xl px-5 py-3 flex items-center gap-3 shadow-xl">
                        <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} className="text-rose-400" />
                        </div>
                        <p className="text-white font-bold text-xs flex-1">
                            <span className="text-rose-400 font-black">Impacto:</span> {totalOverdue} actividad{totalOverdue !== 1 ? 'es' : ''} requiere{totalOverdue === 1 ? '' : 'n'} atención inmediata.
                        </p>
                        <div className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md shrink-0">
                            Acción Requerida
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FOOTER INFO ─── */}
            <div className="px-8 lg:px-12 pb-6">
                <div className="flex gap-4 pt-5 border-t border-slate-100 dark:border-slate-900">
                    {[
                        { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Flujo Operativo', desc: 'Sincronización con la estructura del proyecto.' },
                        { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', title: 'Gestión Temporal', desc: hasDates ? 'Escalamiento basado en fechas reales.' : 'Distribución equitativa de fases.' },
                        { icon: ChevronRight, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Continuidad', desc: 'Progresión de objetivos estratégicos.' }
                    ].map((item, i) => (
                        <div key={i} className="flex-1 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                                <item.icon size={16} className={item.color} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.title}</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExecutiveTimeline;
