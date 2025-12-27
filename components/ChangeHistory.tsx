import React, { useState } from 'react';
import { ChangeRecord } from '../types';
import { Clock, Plus, Edit, Trash2, X, ChevronDown } from 'lucide-react';

interface ChangeHistoryProps {
  changes: ChangeRecord[];
  compact?: boolean;
}

const ChangeHistory: React.FC<ChangeHistoryProps> = ({ changes, compact = false }) => {
  const [showDetailView, setShowDetailView] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus size={14} className="text-emerald-500" />;
      case 'updated':
        return <Edit size={14} className="text-blue-500" />;
      case 'deleted':
        return <Trash2 size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'item':
        return 'Tarjeta';
      case 'status':
        return 'Estado';
      case 'group':
      case 'column':
        return 'Grupo';
      case 'metric':
        return 'Métrica';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  function filteredChanges(): ChangeRecord[] {
    if (filterType === 'all') return changes;
    return changes.filter(c => c.type === filterType);
  }

  return (
    <div className={`${compact ? 'inline-flex items-center gap-2' : 'bg-white rounded-lg border border-slate-200 p-4 shadow-sm'}`}>
      {compact ? (
        // Compact inline version - clickable to show detail view
        <button
          onClick={() => setShowDetailView(true)}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1 text-xs font-semibold">
            <Clock size={14} />
            <span>Últimos cambios:</span>
          </div>
          {changes.length === 0 ? (
            <span className="text-xs text-slate-400">Sin cambios</span>
          ) : (
            <div className="flex items-center gap-1">
              {changes.slice(0, 3).map((change) => (
                <div key={change.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] truncate max-w-[100px] hover:bg-blue-100 transition-colors">
                  {getActionIcon(change.action)}
                  <span className="truncate">{change.description.substring(0, 20)}</span>
                </div>
              ))}
              <ChevronDown size={12} className="text-slate-400" />
            </div>
          )}
        </button>
      ) : (
        // Full version
        <>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900">Últimos cambios</h3>
          </div>

          {changes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin cambios registrados</p>
          ) : (
            <div className="space-y-2">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getActionIcon(change.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-900">
                        {change.description}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        {getTypeLabel(change.type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatTime(change.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detailed View Modal */}
      {showDetailView && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDetailView(false)}
          />

          {/* Modal */}
          <div className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                <h2 className="font-bold text-slate-900">Historial de cambios</h2>
              </div>
              <button
                onClick={() => setShowDetailView(false)}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-2 border-b border-slate-200 bg-slate-50 overflow-x-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todos ({changes.length})
              </button>
              <button
                onClick={() => setFilterType('item')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === 'item'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tarjetas ({changes.filter(c => c.type === 'item').length})
              </button>
              <button
                onClick={() => setFilterType('status')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === 'status'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Estados ({changes.filter(c => c.type === 'status').length})
              </button>
              <button
                onClick={() => setFilterType('column')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === 'column'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Grupos ({changes.filter(c => c.type === 'column').length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {filteredChanges().length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="text-slate-500">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin cambios de este tipo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredChanges().map((change, idx) => (
                    <div
                      key={change.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getActionIcon(change.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-slate-900 text-sm">
                              {change.description}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold
                              ${change.action === 'created' ? 'bg-emerald-100 text-emerald-700' :
                                change.action === 'updated' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'}`}
                            >
                              {change.action.toUpperCase()}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {getTypeLabel(change.type)}
                            </span>
                          </div>
                          
                          {change.details && (
                            <div className="text-xs text-slate-600 space-y-0.5 mt-1 pl-2 border-l-2 border-slate-300">
                              {change.details.itemName && (
                                <p><span className="font-medium">Elemento:</span> {change.details.itemName}</p>
                              )}
                              {change.details.groupName && (
                                <p><span className="font-medium">Grupo:</span> {change.details.groupName}</p>
                              )}
                              {change.details.groupDescription && (
                                <p><span className="font-medium">Descripción:</span> {change.details.groupDescription}</p>
                              )}
                              {change.details.previousValue && (
                                <p><span className="font-medium">Anterior:</span> {change.details.previousValue}</p>
                              )}
                              {change.details.newValue && (
                                <p><span className="font-medium">Nuevo:</span> {change.details.newValue}</p>
                              )}
                            </div>
                          )}

                          <p className="text-[11px] text-slate-500 mt-2 font-medium">
                            {formatTime(change.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChangeHistory;
