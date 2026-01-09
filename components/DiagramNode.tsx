import React, { useState } from 'react';
import { ProjectStatus, StatusCategory, TailwindColor } from '../types';
import EditableText from './EditableText';
import { useTranslation } from './src/hooks/useTranslation';

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
} from 'lucide-react';


interface DiagramNodeProps {
  label: string;
  type?: 'root' | 'group' | 'leaf' | 'external';
  color: 'blue' | 'orange' | 'purple' | 'slate' | 'green';
  status?: string;
  availableStatuses?: StatusCategory[];
  hasIcon?: 'dollar' | 'bulb' | 'refresh';
  description?: string;
  isExternalLink?: boolean;
  date?: string;
  responsible?: string;

  onDelete?: () => void;
  onUpdateLabel?: (val: string) => void;
  onUpdateDescription?: (val: string) => void;
  onUpdateDate?: (val: string) => void;
  onUpdateStatus?: (newStatusId: string) => void;
  onUpdateResponsible?: (val: string) => void;
  canEdit?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  columnId?: string;
  itemId?: string;
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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const { t, language } = useTranslation();

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


  const isActive = isEditing || showStatusMenu;

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md relative bg-white dark:bg-slate-900 ${isActive ? 'z-[2000] ring-2 ring-blue-100 dark:ring-blue-900/30 border-blue-200 dark:border-blue-800 shadow-xl' : 'z-10'}`}>

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
      <div className="flex-1 min-w-0 pr-8">

        {/* LABEL + STATUS */}
        <div
          data-text-area="true"
          className="flex items-start justify-between gap-2 mb-1 relative z-30 select-text cursor-text"
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

          {/* BADGE DE STATUS */}
          {status && (
            <div
              className="cursor-pointer flex-shrink-0 hover:scale-105 transition-transform duration-200"
              onClick={handleStatusClick}
            >
              {getStatusBadge()}
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
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
                  className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 block w-full"
                  placeholder={t('addDescription')}
                  multiline
                />
              ) : (
                description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed block w-full">{description}</p>
              )}
            </div>


          </div>
        </div>

        {/* RESPONSABLE Y FECHA */}
        <div className="mt-2 flex items-center justify-between gap-2 relative z-30">
          {/* Responsable */}
          {/* RESPONSIBLE FIELD REMOVED PER USER REQUEST */}

          {/* Fecha */}
          {onUpdateDate && canEdit && (
            <div
              className="relative inline-block flex-shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="date"
                value={date || ''}
                onChange={(e) => onUpdateDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[40]"
                onClick={(e) => {
                  try {
                    (e.currentTarget as any).showPicker();
                  } catch (err) {
                    // Fallback for older browsers
                  }
                }}
              />
              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center gap-1">
                <Clock size={10} className="text-slate-400 dark:text-slate-400" />
                {date ? formatDate(date) : t('addDate')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE ICON */}
      {onDelete && canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
};

export default DiagramNode;
