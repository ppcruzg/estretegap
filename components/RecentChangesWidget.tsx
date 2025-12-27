import React, { useState } from 'react';
import { ChangeRecord } from '../types';
import { Clock, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface RecentChangesWidgetProps {
  changes: ChangeRecord[];
}

const RecentChangesWidget: React.FC<RecentChangesWidgetProps> = ({ changes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus size={16} className="text-emerald-500" />;
      case 'updated':
        return <Edit size={16} className="text-blue-500" />;
      case 'deleted':
        return <Trash2 size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'item':
        return '📋 Tarjeta';
      case 'status':
        return '🔄 Estado';
      case 'group':
      case 'column':
        return '📁 Grupo';
      case 'metric':
        return '📊 Métrica';
      default:
        return 'Cambio';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Creado';
      case 'updated':
        return 'Actualizado';
      case 'deleted':
        return 'Eliminado';
      default:
        return 'Cambio';
    }
  };

  return (
    <div className={`fixed top-32 right-6 w-96 bg-white rounded-xl border border-slate-200 shadow-lg transition-all duration-300 overflow-hidden z-35`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-200"
      >
        <Clock size={18} className="text-blue-600 flex-shrink-0" />
        <h3 className="font-bold text-slate-900">Últimos cambios</h3>
        {isExpanded ? (
          <ChevronUp size={18} className="ml-auto text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="ml-auto text-slate-500 flex-shrink-0" />
        )}
      </button>

      {/* Content - Only visible when expanded */}
      {isExpanded && (
        <div className="max-h-[600px] overflow-y-auto bg-slate-50/50">
          {changes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Sin cambios registrados</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {changes.slice(0, 5).map((change) => {
                // Determine group color based on group name
                const getGroupColorClass = () => {
                  const groupName = change.details?.groupName || '';
                  if (groupName.toUpperCase().includes('COMPLIANCE')) return 'border-l-green-500 bg-green-50';
                  if (groupName.toUpperCase().includes('AXESS')) return 'border-l-purple-500 bg-purple-50';
                  if (groupName.toUpperCase().includes('POA')) return 'border-l-orange-500 bg-orange-50';
                  if (groupName.toUpperCase().includes('CITAS')) return 'border-l-blue-500 bg-blue-50';
                  if (groupName.toUpperCase().includes('SIDON')) return 'border-l-slate-500 bg-slate-50';
                  return 'border-l-blue-400 bg-blue-50';
                };
                
                return (
                <div
                  key={change.id}
                  className={`p-3 hover:bg-white transition-colors border-l-4 ${getGroupColorClass()}`}
                >
                  {/* Title */}
                  <p className="text-sm font-semibold text-slate-900 truncate mb-1.5">
                    {change.description}
                  </p>

                  {/* Details Row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold
                      ${change.action === 'created' ? 'bg-emerald-100 text-emerald-700' :
                        change.action === 'updated' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'}`}
                    >
                      {getActionLabel(change.action)}
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {getTypeLabel(change.type)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      {formatTime(change.timestamp)}
                    </span>
                  </div>

                  {/* Additional Details */}
                  {change.details && (
                    <div className="text-xs text-slate-700 space-y-1 bg-white rounded p-2 border border-slate-200">
                      {change.details.itemName && (
                        <p className="truncate">
                          <span className="font-medium text-slate-900">Elemento:</span> <span className="text-slate-600">{change.details.itemName}</span>
                        </p>
                      )}
                      {change.details.groupName && (
                        <p className="truncate">
                          <span className="font-medium text-slate-900">Grupo:</span> <span className="text-slate-600">{change.details.groupName}</span>
                        </p>
                      )}
                      {change.details.newValue && (
                        <p className="truncate">
                          <span className="font-medium text-slate-900">Nuevo:</span> <span className="text-emerald-700 font-medium">{change.details.newValue}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentChangesWidget;
