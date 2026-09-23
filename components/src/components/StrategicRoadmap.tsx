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
import { PageData, DashboardItem } from '@/types';
import { parseISO, differenceInDays, format, isValid, isBefore, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusColorClasses } from '../helpers/statusColors';

interface ExecutiveTimelineProps {
    pageData: PageData;
}

const ExecutiveTimeline: React.FC<ExecutiveTimelineProps> = ({ pageData }) => {
    const { columns, pageConfig } = pageData;
    const today = startOfDay(new Date());

    // Phase colors are data colors: identical across UI palettes, light/dark aware.
    // Unknown names keep the historical blue fallback.
    const getPhaseColor = (colorName: string) => getStatusColorClasses(colorName, 'blue');

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
            <div className="flex flex-col items-center justify-center p-20 text-fg-subtle border-2 border-dashed border-border rounded-card bg-surface">
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
        return `${colors.hex} ${pos}%`;
    }).join(', ');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={14} className={getStatusColorClasses('emerald').icon} />;
            case 'overdue': return <AlertTriangle size={14} className={getStatusColorClasses('rose').icon} />;
            case 'in-progress': return <Zap size={14} className={getStatusColorClasses('blue').icon} />;
            default: return <Clock size={14} className={getStatusColorClasses('slate').icon} />;
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
            case 'completed': return `border ${getStatusColorClasses('emerald').badge}`;
            case 'overdue': return `border ${getStatusColorClasses('rose').badge}`;
            case 'in-progress': return `border ${getStatusColorClasses('blue').badge}`;
            default: return `border ${getStatusColorClasses('slate').badge}`;
        }
    };

    return (
        <div className="w-full bg-surface text-fg font-sans">

            {/* ─── HEADER ─── */}
            <div className="px-8 lg:px-12 pt-6 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
                        <Layout size={18} />
                    </div>
                    <div className="px-4 py-1.5 bg-primary-soft text-primary-soft-fg rounded-control text-[11px] font-black uppercase tracking-[0.2em] border border-primary/20">
                        Roadmap Estratégico
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>

                <h1 className="text-2xl lg:text-3xl font-black text-fg mb-1 tracking-tight leading-none">
                    {pageConfig.title}
                </h1>
                <p className="text-fg-muted max-w-3xl text-sm leading-relaxed">
                    {pageConfig.description || `Seguimiento de pendientes ${pageConfig.title}`}
                </p>
            </div>

            {/* ─── EXECUTIVE KPI STRIP ─── */}
            <div className="mx-8 lg:mx-12 mb-5 grid grid-cols-4 gap-3">
                {[
                    { label: 'Actividades', value: totalItems, icon: Target, color: 'text-primary-soft-fg', bg: 'bg-primary-soft' },
                    { label: 'Fases', value: phaseDetails.length, icon: Flag, color: getStatusColorClasses('indigo').text, bg: getStatusColorClasses('indigo').bg },
                    { label: 'Atención', value: totalOverdue, icon: AlertTriangle, color: totalOverdue > 0 ? 'text-danger' : 'text-success', bg: totalOverdue > 0 ? 'bg-danger-soft' : 'bg-success-soft' },
                    { label: 'Avance', value: `${avgCompletion}%`, icon: TrendingUp, color: 'text-success', bg: 'bg-success-soft' },
                ].map((kpi, i) => (
                    <div key={i} className={`${kpi.bg} rounded-card px-4 py-3 border border-border flex items-center gap-3`}>
                        <kpi.icon size={16} className={kpi.color} />
                        <div>
                            <p className={`text-xl font-black ${kpi.color} leading-none`}>{kpi.value}</p>
                            <span className="text-[11px] font-black text-fg-muted uppercase tracking-widest">{kpi.label}</span>
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
                                            <p className="text-fg-muted text-[11px] font-bold mb-1.5 whitespace-nowrap">
                                                {phase.min ? format(phase.min, "d MMM", { locale: es }) : ''}
                                            </p>

                                            {/* Event Badge */}
                                            <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-3 py-1.5 rounded-control shadow-card flex items-center gap-1.5 whitespace-nowrap`}>
                                                {getStatusIcon(phase.phaseStatus)}
                                                <span className="text-[11px] font-black uppercase tracking-wide">{phase.title}</span>
                                            </div>
                                        </div>

                                        {/* Vertical dashed line connecting to the bar */}
                                        <div className={`w-0 flex-1 border-l-2 border-dashed ${colors.border} mt-2`} />
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
                                        <div className={`w-7 h-7 rounded-full ${colors.dot} border-4 border-surface shadow-pop z-20 relative`}>
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
                                        <div className={`w-0 border-l-2 border-dashed ${colors.border} mb-1`} style={{ height: '18px' }} />

                                        {/* Event Badge */}
                                        <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-3 py-1.5 rounded-control shadow-card flex items-center gap-1.5 whitespace-nowrap mb-1.5`}>
                                            {getStatusIcon(phase.phaseStatus)}
                                            <span className="text-[11px] font-black uppercase tracking-wide">{phase.title}</span>
                                        </div>

                                        {/* Date + Annotation */}
                                        <div className="text-center">
                                            <p className="text-fg text-xs font-black">
                                                {phase.min ? format(phase.min, "d MMM", { locale: es }) : 'Sin fecha'}
                                            </p>
                                            <p className="text-fg-muted text-[11px] font-bold mt-0.5 leading-tight">
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
                                <span className="text-[11px] font-black text-fg-muted uppercase tracking-widest">
                                    {format(timelineData.minDate, "MMM yyyy", { locale: es })}
                                </span>
                                <span className="text-[11px] font-black text-fg-muted uppercase tracking-widest">
                                    {format(timelineData.maxDate, "MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── PHASE DETAIL CARDS ─── */}
            <div className="px-8 lg:px-12 mt-6 mb-6">
                <h3 className="text-[11px] font-black text-fg-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="w-6 h-px bg-border-strong" />
                    Detalle por Fase
                    <div className="flex-1 h-px bg-border" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phaseDetails.map((phase, index) => {
                        const colors = getPhaseColor(phase.color);
                        return (
                            <div
                                key={phase.id + '-card'}
                                className={`bg-surface rounded-card border ${colors.border} shadow-card overflow-hidden transition-all hover:shadow-pop hover:-translate-y-0.5 group`}
                            >
                                {/* Card accent bar */}
                                <div className={`h-1 ${colors.dot}`} />

                                <div className="p-3.5">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-control ${colors.bg} flex items-center justify-center`}>
                                                <Flag size={13} className={colors.icon} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-fg uppercase tracking-tight leading-none">{phase.title}</h4>
                                                <p className="text-[11px] text-fg-muted font-bold">
                                                    {phase.min ? format(phase.min, "d MMM yyyy", { locale: es }) : 'Sin fecha'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`${getStatusBadgeClass(phase.phaseStatus)} px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1`}>
                                            {getStatusIcon(phase.phaseStatus)}
                                            {getStatusLabel(phase.phaseStatus)}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-2.5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-black text-fg-muted uppercase tracking-widest">Progreso</span>
                                            <span className="text-[11px] font-black text-fg">{phase.completionPct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors.dot} rounded-full transition-all duration-1000 ease-out`}
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
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-control text-[11px] transition-all ${isOverdue
                                                        ? 'bg-danger-soft border border-danger/20'
                                                        : 'bg-surface-muted border border-transparent hover:border-border-strong'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-danger' : colors.dot}`} />
                                                    <span className="font-bold text-fg truncate flex-1">{item.label}</span>
                                                    {itemDate && isValid(itemDate) && (
                                                        <span className={`text-[11px] font-black tabular-nums shrink-0 ${isOverdue ? 'text-danger' : 'text-fg-muted'}`}>
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
                    <div className="bg-danger-soft border border-danger/30 rounded-card px-5 py-3 flex items-center gap-3 shadow-card">
                        <div className="w-8 h-8 bg-danger/15 rounded-control flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} className="text-danger" />
                        </div>
                        <p className="text-fg font-bold text-xs flex-1">
                            <span className="text-danger font-black">Impacto:</span> {totalOverdue} actividad{totalOverdue !== 1 ? 'es' : ''} requiere{totalOverdue === 1 ? '' : 'n'} atención inmediata.
                        </p>
                        <div className="px-3 py-1.5 bg-danger text-danger-fg rounded-control text-[11px] font-black uppercase tracking-widest shadow-card shrink-0">
                            Acción Requerida
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FOOTER INFO ─── */}
            <div className="px-8 lg:px-12 pb-6">
                <div className="flex gap-4 pt-5 border-t border-border">
                    {[
                        { icon: CheckCircle2, color: 'text-primary-soft-fg', bg: 'bg-primary-soft', title: 'Flujo Operativo', desc: 'Sincronización con la estructura del proyecto.' },
                        { icon: Clock, color: 'text-warning', bg: 'bg-warning-soft', title: 'Gestión Temporal', desc: hasDates ? 'Escalamiento basado en fechas reales.' : 'Distribución equitativa de fases.' },
                        { icon: ChevronRight, color: 'text-success', bg: 'bg-success-soft', title: 'Continuidad', desc: 'Progresión de objetivos estratégicos.' }
                    ].map((item, i) => (
                        <div key={i} className="flex-1 p-4 rounded-card bg-surface-muted border border-border flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-control ${item.bg} flex items-center justify-center shrink-0`}>
                                <item.icon size={16} className={item.color} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-fg">{item.title}</h4>
                                <p className="text-[11px] text-fg-muted leading-snug">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExecutiveTimeline;
