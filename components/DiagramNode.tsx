import React, { useState, useMemo, useEffect } from 'react';
import { StatusCategory, ChecklistItem } from '@/types';
import EditableText from './EditableText';
import { useTranslation } from './src/hooks/useTranslation';
import * as Repo from './src/repository/estrategiaRepository';
import type { ChangeHistoryEntry } from '@/types/changeHistory';
import { getStatusColorClasses } from './src/helpers/statusColors';
import { cn } from './src/components/ui/cn';

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
  const dateInputRef = React.useRef<HTMLInputElement>(null);

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
      case 'created': return <Plus size={14} className="text-success" />;
      case 'updated': return <RefreshCw size={14} className="text-primary-soft-fg" />;
      case 'deleted': return <Trash2 size={14} className="text-danger" />;
      case 'moved': return <TrendingUp size={14} className="text-warning" />;
      default: return <Clock size={14} className="text-fg-subtle" />;
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

    const style = getStatusColorClasses(cat.color).badge;

    return (
      <div className={`relative ${showStatusMenu ? 'z-[2100]' : 'z-auto'}`}>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border select-none transition-all hover:brightness-95 cursor-pointer ${style}`}
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
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-raised border border-border rounded-card shadow-pop z-[2000] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2.5 border-b border-border bg-surface-muted flex items-center justify-between">
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">{t('changeStatus')}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="p-1.5 space-y-0.5 max-h-[300px] overflow-y-auto overscroll-contain">
                {list.map((s) => {
                  const isActive = s.status_id === status;

                  const dotColor = getStatusColorClasses(s.color).dot;

                  return (
                    <button
                      key={s.status_id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus?.(s.status_id);
                        setShowStatusMenu(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-control text-xs transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive ? 'bg-primary-soft' : 'hover:bg-surface-muted',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className={`font-medium ${isActive ? 'text-primary-soft-fg' : 'text-fg'}`}>{s.label}</span>
                      </div>
                      {isActive && <CheckCircle size={12} className="text-primary-soft-fg" />}
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
      return <Settings size={16} className="text-fg-subtle" />;
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

    if (!statusConfig || !statusConfig.icon) {
      return <Settings size={16} className="text-fg-subtle" />;
    }

    const Icon = icons[statusConfig.icon];

    if (!Icon) {
      return <Settings size={16} className="text-fg-subtle" />;
    }

    return React.cloneElement(Icon, {
      className: `${getStatusColorClasses(statusConfig.color).icon} font-bold`,
      strokeWidth: 2.5,
    });

  };


  const isActive = isEditing || showStatusMenu || showHistory;

  return (
    <div className={cn(
      'group flex items-start gap-2 p-2.5 pt-3 rounded-card border relative bg-surface transition-all duration-200',
      showHistory || showStatusMenu ? 'overflow-visible' : 'overflow-hidden',
      isActive
        ? 'z-[2000] ring-2 ring-ring/30 border-primary shadow-pop'
        : 'z-10 border-border hover:border-border-strong hover:shadow-card',
    )}>

      {/* Barra de Progreso Superior */}
      {checklist && checklist.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ICONO IZQUIERDO - DRAG HANDLE */}
      <div
        className="mt-0.5 flex-shrink-0 text-fg-subtle cursor-grab active:cursor-grabbing"
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
                className="font-semibold text-fg text-sm leading-snug"
              />
            ) : (
              <p className="text-sm font-semibold text-fg leading-snug">{label}</p>
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
                aria-label={t('delete')}
                title={t('delete')}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-fg-subtle hover:text-danger hover:bg-danger-soft rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* SECCIÓN CONTENIDO */}
        <div className="mt-1.5 mb-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">{t('content')}</span>
            {canEdit && checklist.length === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newItem: ChecklistItem = { id: crypto.randomUUID(), text: '', completed: false };
                  onUpdateChecklist?.([newItem]);
                }}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded-md hover:bg-primary-soft text-fg-subtle hover:text-primary-soft-fg transition-colors"
                title={t('addItem')}
                aria-label={t('addItem')}
              >
                <Plus size={12} />
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
                    className="text-xs text-fg-muted leading-relaxed block w-full"
                    placeholder={t('addDescription')}
                    multiline
                  />
                ) : (
                  description && <p className="text-xs text-fg-muted leading-relaxed block w-full">{description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN CHECKLIST */}
        {checklist && checklist.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                  {t('checklist')}
                </span>
                <span className="text-[11px] font-semibold text-primary-soft-fg bg-primary-soft px-1.5 py-0.5 rounded-full">
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
                  className="p-1 rounded-md hover:bg-primary-soft text-fg-subtle hover:text-primary-soft-fg transition-colors"
                  title={t('addItem')}
                  aria-label={t('addItem')}
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            <div className={`grid ${checklist.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-2 gap-y-0.5`}>
              {checklist.length === 0 && canEdit && (
                <p className="text-[11px] text-fg-subtle italic px-1">{t('noChecklistItems')}</p>
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
                    role="checkbox"
                    aria-checked={item.completed}
                    aria-label={item.text || t('taskDescription')}
                    className={cn(
                      'mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-[4px] border transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      item.completed
                        ? 'bg-primary border-primary text-primary-fg'
                        : 'bg-surface border-border-strong hover:border-primary',
                    )}
                  >
                    {item.completed && <Check size={10} strokeWidth={4} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {canEdit ? (
                      <input
                        className={`w-full bg-transparent text-[11px] outline-none transition-all py-0
                          ${item.completed
                            ? 'text-fg-subtle line-through'
                            : 'text-fg'}`}
                        value={item.text}
                        onChange={(e) => {
                          const newList = checklist.map(t => t.id === item.id ? { ...t, text: e.target.value } : t);
                          onUpdateChecklist?.(newList);
                        }}
                        placeholder={t('taskDescription')}
                      />
                    ) : (
                      <span className={`text-[11px] block py-0
                        ${item.completed ? 'text-fg-subtle line-through' : 'text-fg'}`}>
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
                      aria-label={t('delete')}
                      className="opacity-0 group-hover/check:opacity-100 focus-visible:opacity-100 p-0.5 text-fg-subtle hover:text-danger transition-colors"
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
                className={cn(
                  'p-1 rounded-md transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  showHistory ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-subtle hover:text-primary-soft-fg hover:bg-primary-soft',
                )}
                title="Ver Bitácora de Cambios"
                aria-label="Ver Bitácora de Cambios"
              >
                <History size={13} />
              </button>

              <div className="relative flex-shrink-0">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={date || ''}
                  onChange={(e) => onUpdateDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                  tabIndex={-1}
                />
                <div
                  className="text-[11px] font-medium text-fg-muted px-1.5 py-0.5 bg-surface-muted border border-border cursor-pointer hover:border-border-strong hover:text-fg transition-colors flex items-center gap-1 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dateInputRef.current) {
                      try {
                        dateInputRef.current.showPicker();
                      } catch {
                        dateInputRef.current.click();
                      }
                    }
                  }}
                >
                  <Clock size={11} className="text-fg-subtle" />
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
              className="absolute inset-0 bg-overlay backdrop-blur-sm cursor-default"
              onClick={() => setShowHistory(false)}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Bitácora"
              className="relative w-full max-w-md bg-surface-raised text-fg border border-border rounded-card shadow-pop overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-primary text-primary-fg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-fg/15 rounded-control flex items-center justify-center">
                      <History size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-bold uppercase tracking-widest block leading-tight">Bitácora</span>
                      <span className="text-xs opacity-80 font-medium">Historial de Cambios</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary-fg/15 rounded-full">
                    <span className="text-xs font-semibold tracking-wide">{historyItems.length} REG</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto overscroll-contain bg-bg relative flex-1">
                {loadingHistory ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-fg-muted font-semibold uppercase tracking-widest animate-pulse">Sincronizando...</span>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-surface-muted rounded-card flex items-center justify-center mx-auto mb-6">
                      <Clock size={36} className="text-fg-subtle" />
                    </div>
                    <p className="text-sm text-fg-muted font-medium px-8 leading-relaxed">No se han registrado movimientos todavía para este item.</p>
                  </div>
                ) : (
                  <div className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
                    {historyItems.map((entry, idx) => (
                      <div key={entry.id}
                        className="relative pl-12 animate-in slide-in-from-left-4 duration-500"
                        style={{ animationDelay: `${idx * 60}ms` }}>
                        <div className="absolute left-0 top-1 w-10 h-10 bg-surface rounded-control border border-border flex items-center justify-center z-10 shadow-card">
                          {getHistoryActionIcon(entry.action)}
                        </div>

                        <div className="bg-surface border border-border rounded-card p-4 shadow-card cursor-default text-left">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="text-xs font-bold text-primary-soft-fg uppercase tracking-wider">
                              {getHistoryActionLabel(entry)}
                            </span>
                            <span className="text-[11px] text-fg-muted font-medium bg-surface-muted px-2 py-1 rounded-md border border-border">{formatDate(new Date(entry.changedAt).toISOString().split('T')[0])}</span>
                          </div>

                          <div className="text-sm text-fg leading-relaxed mb-3">
                            {entry.fieldName === 'status' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-fg-subtle line-through px-2 py-0.5 bg-surface-muted rounded-md">{entry.oldValue}</span>
                                <TrendingUp size={14} className="text-fg-subtle" />
                                <span className="px-2 py-0.5 bg-primary-soft text-primary-soft-fg rounded-md font-semibold">{entry.newValue}</span>
                              </div>
                            ) : entry.fieldName === 'label' ? (
                              <div className="flex items-start gap-2">
                                <FileText size={16} className="text-fg-subtle mt-0.5 flex-shrink-0" />
                                <span className="text-fg font-semibold leading-snug">"{entry.newValue}"</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-warning" />
                                <span>Propiedad <span className="font-semibold text-fg uppercase tracking-tight">{entry.fieldName || 'item'}</span> actualizada</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-primary-soft rounded-full flex items-center justify-center">
                                <User size={13} className="text-primary-soft-fg" />
                              </div>
                              <span className="text-xs font-semibold text-fg-muted">{entry.changedByName || 'Admin'}</span>
                            </div>
                            <MousePointer2 size={12} className="text-fg-subtle" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Close */}
              <div className="p-4 bg-surface-raised border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="w-full h-11 bg-surface-muted text-xs font-bold text-fg-muted hover:text-primary-soft-fg hover:bg-primary-soft rounded-control uppercase tracking-widest transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Finalizar Consulta
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
