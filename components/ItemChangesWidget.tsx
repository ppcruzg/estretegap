import React, { useState } from 'react';
import { ChangeRecord } from '../types';
import { ChevronUp, ChevronDown, Edit } from 'lucide-react';

interface ItemChangesWidgetProps {
  changes: ChangeRecord[];
}

const ItemChangesWidget: React.FC<ItemChangesWidgetProps> = ({ changes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter only item changes
  const itemChanges = changes.filter(c => c.type === 'item').slice(0, 5);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const getChangeTypeLabel = (description: string) => {
    if (description.includes('actualizada')) return 'Actualizado';
    if (description.includes('eliminada')) return 'Eliminado';
    if (description.includes('creada')) return 'Creado';
    return 'Cambio';
  };

  return (
    <div className={`fixed right-6 top-28 w-80 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 shadow-xl z-40 transition-all duration-300 ${
      isExpanded ? 'max-h-[500px]' : 'max-h-16'
    } overflow-hidden flex flex-col backdrop-blur-sm hover:shadow-2xl`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 hover:bg-slate-100/50 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Edit size={16} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
            Cambios de items
          </span>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
            {itemChanges.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
        )}
      </button>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {itemChanges.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Sin cambios de items
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {itemChanges.map((change) => (
              <div key={change.id} className="px-4 py-3 hover:bg-blue-50/60 transition-colors border-l-2 border-transparent hover:border-blue-400">
                {/* Change Type Badge + Time */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap
                    ${change.action === 'updated' ? 'bg-blue-100 text-blue-700' :
                      change.action === 'deleted' ? 'bg-red-100 text-red-700' :
                      'bg-emerald-100 text-emerald-700'}`}
                  >
                    {getChangeTypeLabel(change.description)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-auto">
                    {formatTime(change.timestamp)}
                  </span>
                </div>

                {/* Item Name */}
                <p className="text-sm font-semibold text-slate-900 truncate mb-1">
                  📋 {change.details?.itemName || 'Item'}
                </p>

                {/* Group Name */}
                {change.details?.groupName && (
                  <p className="text-xs text-slate-600 truncate mb-2 pl-5">
                    <span className="font-medium">en "{change.details.groupName}"</span>
                  </p>
                )}

                {/* Change Details */}
                <div className="text-xs text-slate-700 space-y-1 pl-5">
                  {change.details?.previousValue && (
                    <p className="text-slate-500">
                      <span className="font-medium">De:</span> {change.details.previousValue}
                    </p>
                  )}
                  {change.details?.newValue && (
                    <p className="text-slate-900 font-medium">
                      <span className="text-emerald-600">→</span> {change.details.newValue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemChangesWidget;
