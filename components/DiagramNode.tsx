import React, { useState, useMemo, useEffect } from 'react';
import { ProjectStatus, StatusCategory, TailwindColor, ChecklistItem } from '../types';
import EditableText from './EditableText';
import { useTranslation } from './src/hooks/useTranslation';
import * as Repo from './src/repository/estrategiaRepository';
import type { ChangeHistoryEntry } from '../types/changeHistory';

import {
  Lightbulb,
  DollarSign,
  RefreshCw,
  Box,
  Settings,
  Activity,
  Globe,
  Server,
  Link,
  Trash2,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  Wrench,
  AlertCircle,
  Loader,
  Loader2,
  TrendingUp,
  Shield,
  Clock,
  User,
  Sparkles,
  Plus,
  Check,
  History,
  FileText,
  MousePointer2,
} from 'lucide-react';


interface DiagramNodeProps {
  label: string;
  type?: 'root' | 'group' | 'leaf' | 'external';
  color: 'blue' | 'orange' | 'purple' | 'slate' | 'green';
  status?: string;
  availableStatuses?: StatusCategory[];
  hasIcon?: 'dollar' | 'bulb' | 'refresh';
  description?: string;
  checklist?: ChecklistItem[];
  isExternalLink?: boolean;
  date?: string;
  responsible?: string;

  onDelete?: () => void;
  onUpdateLabel?: (val: string) => void;
  onUpdateDescription?: (val: string) => void;
  onUpdateDate?: (val: string) => void;
  onUpdateStatus?: (newStatusId: string) => void;
  onUpdateResponsible?: (val: string) => void;
  onUpdateChecklist?: (items: ChecklistItem[]) => void;
  canEdit?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  columnId?: string;
  itemId?: string;
  pageId?: string;
}

const colorStyles: Record<TailwindColor, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
};


const statusIconMap: Record<string, React.ReactElement> = {
  check: <CheckCircle size={12} />,
  loader: <Loader2 size={12} />,
  alert: <AlertTriangle size={12} />,
  zap: <Zap size={12} />,
  wrench: <Wrench size={12} />,
  shield: <Shield size={12} />,
  globe: <Globe size={12} />,
  box: <Box size={12} />,
  server: <Server size={12} />,
  activity: <Activity size={12} />,
};

const DiagramNode: React.FC<DiagramNodeProps> = ({
  label,
  color,
  status,
  availableStatuses = [],
  hasIcon,
  description,
  isExternalLink,
  date,
  onDelete,
  onUpdateLabel,
  onUpdateDescription,
  onUpdateDate,
  onUpdateStatus,
  onUpdateResponsible,
  responsible,
  canEdit = false,
  onDragStart,
  columnId,
  itemId,
  checklist = [],
  onUpdateChecklist,
  pageId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<ChangeHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { t, language } = useTranslation();

  const loadHistory = async () => {
    if (!pageId || !itemId) return;
    setLoadingHistory(true);
    try {
      const logs = await Repo.getPageChangeHistory(pageId, { entityId: itemId, limit: 10 });
      setHistoryItems(logs);
    } catch (e) {
      console.error("Error loading item history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getHistoryActionLabel = (entry: ChangeHistoryEntry) => {
    switch (entry.action) {
      case 'created': return t('created') || 'Creado';
      case 'updated':
        if (entry.fieldName === 'label') return t('renamed') || 'Renombrado';
        if (entry.fieldName === 'status') return t('statusChanged') || 'Cambio Estatus';
        return t('updated') || 'Actualizado';
      case 'moved': return t('moved') || 'Movido';
      case 'deleted': return t('deleted') || 'Eliminado';
      default: return entry.action;
    }
  };

  const getHistoryActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus size={10} className="text-emerald-500" />;
      case 'updated': return <RefreshCw size={10} className="text-blue-500" />;
      case 'deleted': return <Trash2 size={10} className="text-red-500" />;
      case 'moved': return <TrendingUp size={10} className="text-purple-500" />;
      default: return <Clock size={10} className="text-slate-400" />;
    }
  };

  // Cálculo de progreso
  const progress = useMemo(() => {
    if (!checklist?.length) return 0;
    const completedCount = checklist.filter(item => item.completed).length;
    return Math.round((completedCount / checklist.length) * 100);
  }, [checklist]);

  // Lógica de estatus automático
  useEffect(() => {
    if (!canEdit || !checklist?.length || !onUpdateStatus) return;

    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;

    if (completedCount === totalCount && status !== 'completado') {
      onUpdateStatus('completado');
    } else if (completedCount > 0 && completedCount < totalCount && status !== 'en-proceso') {
      onUpdateStatus('en-proceso');
    }
  }, [checklist, status, onUpdateStatus, canEdit]);

  const fallbackStatuses: StatusCategory[] = [
    { id: 'prod', status_id: 'productivo', label: t('pending'), color: 'emerald' },
    { id: 'proc', status_id: 'en-proceso', label: t('inProgress'), color: 'blue' },
    { id: 'bloq', status_id: 'bloqueado', label: t('blocked'), color: 'rose' },
  ];


  // ----------------------------------------
  // FORMATEAR FECHAS
  // ----------------------------------------
  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // ----------------------------------------
  // ICONO DE ESTATUS
  // ----------------------------------------
  const renderStatusIcon = (cat?: StatusCategory) => {
    if (cat?.icon && statusIconMap[cat.icon]) {
      return statusIconMap[cat.icon];
    }
    return <Activity size={12} />;
  };

  // ----------------------------------------
  // BADGE DE ESTATUS
  // ----------------------------------------
  const getStatusBadge = () => {
    if (!status || isExternalLink) return null;

    const list = availableStatuses?.length ? availableStatuses : fallbackStatuses;
    const cat = list.find((c) => c.status_id === status);

    if (!cat) return null;

    const style = colorStyles[cat.color] || colorStyles.slate;

    return (
      <div className={`relative ${showStatusMenu ? 'z-[2100]' : 'z-auto'}`}>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border select-none transition-all hover:brightness-95 cursor-pointer ${style}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canEdit) setShowStatusMenu(!showStatusMenu);
          }}
        >
          {renderStatusIcon(cat)}
          {cat.label}
        </span>

        {showStatusMenu && (
          <>
            {/* Overlay to catch clicks outside */}
            <div
              className="fixed inset-0 z-[1001]"
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(false);
              }}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-none z-[2000] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('changeStatus')}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="p-1.5 space-y-0.5 max-h-[300px] overflow-y-auto overscroll-contain">
                {list.map((s) => {
                  const isActive = s.status_id === status;

                  // Mapeo dinámico de colores para los círculos (dots)
                  const dotColors: Record<string, string> = {
                    emerald: 'bg-emerald-500',
                    blue: 'bg-blue-500',
                    rose: 'bg-rose-500',
                    amber: 'bg-amber-500',
                    purple: 'bg-purple-500',
                    slate: 'bg-slate-400',
                    indigo: 'bg-indigo-500',
                    cyan: 'bg-cyan-500',
                  };

                  const dotColor = dotColors[s.color] || dotColors.slate;

                  return (
                    <button
                      key={s.status_id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus?.(s.status_id);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-700 group ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{s.label}</span>
                      </div>
                      {isActive && <CheckCircle size={12} className="text-blue-500 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ----------------------------------------
  // CAMBIAR ESTATUS CON CLICK
  // ----------------------------------------
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Ya no hacemos clic para ciclar, ver getStatusBadge dropdown
  };

  // ----------------------------------------
  // ICONO PRINCIPAL
  // ----------------------------------------
  const renderIcon = () => {
    if (!status || !availableStatuses?.length) {
      return <Settings size={16} className="text-slate-400 dark:text-slate-600" />;
    }

    const statusConfig = availableStatuses.find(
      (s: any) => s.status_id === status
    );

    const icons: Record<string, React.ReactElement> = {
      check: <CheckCircle size={16} />,
      loader: <Loader2 size={16} />,
      alert: <AlertTriangle size={16} />,
      zap: <Zap size={16} />,
      wrench: <Wrench size={16} />,
      shield: <Shield size={16} />,
      globe: <Globe size={16} />,
      box: <Box size={16} />,
      server: <Server size={16} />,
      activity: <Activity size={16} />,
      clock: <Clock size={16} />,
    };

    const colorMap: Record<string, string> = {
      emerald: "text-emerald-600",
      blue: "text-blue-500",
      rose: "text-rose-500",
      amber: "text-amber-500",
      purple: "text-purple-600",
      slate: "text-slate-500",
      indigo: "text-indigo-600",
      green: "text-green-600",
      orange: "text-orange-500",
    };

    if (!statusConfig || !statusConfig.icon) {
      return <Settings size={16} className="text-slate-400 dark:text-slate-600" />;
    }

    const Icon = icons[statusConfig.icon];

    if (!Icon) {
      return <Settings size={16} className="text-slate-400 dark:text-slate-600" />;
    }

    return React.cloneElement(Icon, {
      className: `${colorMap[statusConfig.color] || "text-slate-400"} font-bold`,
      strokeWidth: 2.5,
    });

  };


  const isActive = isEditing || showStatusMenu || showHistory;

  return (
    <div className={`group flex items-start gap-1.5 p-1.5 pt-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md relative bg-white dark:bg-slate-900 ${showHistory || showStatusMenu ? 'overflow-visible' : 'overflow-hidden'} ${isActive ? 'z-[2000] ring-2 ring-blue-100 dark:ring-blue-900/30 border-blue-200 dark:border-blue-800 shadow-xl' : 'z-10'}`}>

      {/* Barra de Progreso Superior */}
      {checklist && checklist.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ICONO IZQUIERDO - DRAG HANDLE */}
      <div
        className="mt-1 flex-shrink-0 text-slate-400 dark:text-slate-400 cursor-grab active:cursor-grabbing"
        draggable={true}
        onDragStart={onDragStart}
        title="Drag to move"
      >
        {renderIcon()}
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 min-w-0 pr-4">

        {/* LABEL + STATUS */}
        <div
          data-text-area="true"
          className={`flex items-start justify-between gap-2 mb-1 relative select-text cursor-text ${showStatusMenu ? 'z-[50]' : 'z-30'}`}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        >
          <div className="flex-1 min-w-0">
            {onUpdateLabel && canEdit ? (
              <EditableText
                value={label}
                onSave={onUpdateLabel}
                onEditingChange={setIsEditing}
                variant="dark"
                className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug"
              />
            ) : (
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{label}</p>
            )}
          </div>

          {/* BADGE DE STATUS + ELIMINAR */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {status && (
              <div
                className="cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={handleStatusClick}
              >
                {getStatusBadge()}
              </div>
            )}

            {onDelete && canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* SECCIÓN CONTENIDO */}
        <div className="mt-1.5 mb-1.5">
          <div className="flex items-center justify-between mb-1 grayscale opacity-50">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('content')}</span>
            {canEdit && checklist.length === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newItem: ChecklistItem = { id: crypto.randomUUID(), text: '', completed: false };
                  onUpdateChecklist?.([newItem]);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all"
                title={t('addItem')}
              >
                <Plus size={10} />
              </button>
            )}
          </div>

          <div
            data-text-area="true"
            className="relative z-20 select-text cursor-text"
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          >
            <div className="flex items-center justify-between gap-1 group/desc">
              <div className="flex-1">
                {onUpdateDescription && canEdit ? (
                  <EditableText
                    value={description || ''}
                    onSave={onUpdateDescription}
                    onEditingChange={setIsEditing}
                    variant="dark"
                    className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic block w-full"
                    placeholder={t('addDescription')}
                    multiline
                  />
                ) : (
                  description && <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed block w-full">{description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN CHECKLIST */}
        {checklist && checklist.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between mb-1 grayscale opacity-50">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  {t('checklist')}
                </span>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                  {progress}%
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newItem: ChecklistItem = { id: crypto.randomUUID(), text: '', completed: false };
                    onUpdateChecklist?.([...checklist, newItem]);
                  }}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all hover:scale-110"
                  title={t('addItem')}
                >
                  <Plus size={11} />
                </button>
              )}
            </div>

            <div className={`grid ${checklist.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-2 gap-y-0.5`}>
              {checklist.length === 0 && canEdit && (
                <p className="text-[10px] text-slate-400 dark:text-slate-600 italic px-1">{t('noChecklistItems')}</p>
              )}

              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1.5 group/check animate-in fade-in duration-300 min-w-0"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newList = checklist.map(t => t.id === item.id ? { ...t, completed: !t.completed } : t);
                      onUpdateChecklist?.(newList);
                    }}
                    className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-md border transition-all flex items-center justify-center
                      ${item.completed
                        ? 'bg-blue-500 border-blue-500 text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 shadow-sm'
                      }`}
                  >
                    {item.completed && <Check size={10} strokeWidth={4} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {canEdit ? (
                      <input
                        className={`w-full bg-transparent text-[11px] outline-none transition-all py-0
                          ${item.completed
                            ? 'text-slate-400 dark:text-slate-500 line-through opacity-60'
                            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
                        value={item.text}
                        onChange={(e) => {
                          const newList = checklist.map(t => t.id === item.id ? { ...t, text: e.target.value } : t);
                          onUpdateChecklist?.(newList);
                        }}
                        placeholder={t('taskDescription')}
                      />
                    ) : (
                      <span className={`text-[11px] block py-0
                        ${item.completed ? 'text-slate-400 line-through opacity-60' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.text}
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newList = checklist.filter(t => t.id !== item.id);
                        onUpdateChecklist?.(newList);
                      }}
                      className="opacity-0 group-hover/check:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESPONSABLE Y FECHA */}
        <div className="mt-2 flex items-center justify-between gap-2 relative z-30">
          {/* Responsable */}
          {/* RESPONSIBLE FIELD REMOVED PER USER REQUEST */}

          {/* Fecha */}
          {onUpdateDate && canEdit && (
            <div
              className="relative flex items-center gap-1.5"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icono de Historial (Bitácora) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showHistory) loadHistory();
                  setShowHistory(!showHistory);
                }}
                className={`p-1 rounded-md transition-all flex items-center justify-center hover:scale-110 ${showHistory ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                title="Ver Bitácora de Cambios"
              >
                <History size={13} />
              </button>

              <div className="relative flex-shrink-0">
                <input
                  type="date"
                  value={date || ''}
                  onChange={(e) => onUpdateDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[40]"
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker();
                    } catch (err) { }
                  }}
                />
                <div className="text-[9px] font-bold text-slate-600 dark:text-slate-300 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 rounded-md">
                  <Clock size={9} className="text-slate-400" />
                  {date ? formatDate(date) : t('addDate')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ventana Contextual de Historial (Fixed Centered) */}
        {showHistory && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
              onClick={() => setShowHistory(false)}
            />

            <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl backdrop-saturate-[180%] border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5 flex flex-col">
              {/* Header Premium */}
              <div className="p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 border-b border-white/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                      <History size={22} className="text-white" />
                    </div>
                    <div>
                      <span className="text-[14px] font-black text-white uppercase tracking-[0.3em] block leading-tight">Bitácora</span>
                      <span className="text-[11px] text-white/70 font-bold tracking-widest uppercase">Historial de Cambios</span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[11px] text-white font-black tracking-widest">{historyItems.length} REG</span>
                  </div>
                </div>
              </div>

              {/* Content Glassmorphism */}
              <div className="p-6 max-h-[60vh] overflow-y-auto overscroll-contain bg-white/30 dark:bg-slate-900/40 custom-scrollbar relative flex-1">
                {loadingHistory ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                    </div>
                    <span className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando...</span>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-12">
                      <Clock size={40} className="text-slate-300" />
                    </div>
                    <p className="text-[14px] text-slate-500 font-bold px-10 leading-relaxed italic">No se han registrado movimientos todavía para este item.</p>
                  </div>
                ) : (
                  <div className="relative space-y-10 before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-[4px] before:bg-gradient-to-b before:from-blue-500/30 before:via-indigo-500/30 before:to-transparent">
                    {historyItems.map((entry, idx) => (
                      <div key={entry.id}
                        className="relative pl-12 animate-in slide-in-from-left-8 duration-700"
                        style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="absolute left-0 top-1 w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-50 dark:border-slate-700 flex items-center justify-center z-10 shadow-2xl ring-4 ring-blue-50 dark:ring-blue-900/20 transition-transform hover:scale-110">
                          {getHistoryActionIcon(entry.action)}
                        </div>

                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white dark:border-slate-700/50 rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-default group/item text-left">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                              {getHistoryActionLabel(entry)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">{formatDate(new Date(entry.changedAt).toISOString().split('T')[0])}</span>
                          </div>

                          <div className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-5">
                            {entry.fieldName === 'status' ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-slate-400 line-through opacity-50 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg">{entry.oldValue}</span>
                                <TrendingUp size={16} className="text-blue-500" />
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-black shadow-sm">{entry.newValue}</span>
                              </div>
                            ) : entry.fieldName === 'label' ? (
                              <div className="flex items-start gap-3">
                                <FileText size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                                <span className="text-slate-900 dark:text-white font-black leading-snug">"{entry.newValue}"</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Sparkles size={18} className="text-amber-400" />
                                <span>Propiedad <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{entry.fieldName || 'item'}</span> actualizada</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center border border-white dark:border-slate-700 shadow-md">
                                <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span className="text-[12px] font-black text-slate-500 dark:text-slate-400">{entry.changedByName || 'Admin'}</span>
                            </div>
                            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <MousePointer2 size={12} className="text-slate-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Close */}
              <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-full py-5 bg-slate-50 dark:bg-slate-900/50 text-[12px] font-black text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600/50 rounded-3xl uppercase tracking-[0.5em] transition-all duration-500 border border-slate-200/50 dark:border-slate-700/50 shadow-inner group"
                >
                  <span className="group-hover:scale-110 transition-transform block">Finalizar Consulta</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DiagramNode;
