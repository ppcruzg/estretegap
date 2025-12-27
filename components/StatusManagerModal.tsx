
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { StatusCategory, TailwindColor } from '../types';

interface StatusManagerModalProps {
  isOpen: boolean;
  columnTitle: string;
  categories: StatusCategory[];
  onSave: (categories: StatusCategory[]) => void;
  onClose: () => void;
}

const AVAILABLE_COLORS: { value: TailwindColor; label: string; bg: string }[] = [
  { value: 'emerald', label: 'Verde', bg: 'bg-emerald-500' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { value: 'rose', label: 'Rojo', bg: 'bg-rose-500' },
  { value: 'amber', label: 'Naranja', bg: 'bg-amber-500' },
  { value: 'purple', label: 'Morado', bg: 'bg-purple-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { value: 'slate', label: 'Gris', bg: 'bg-slate-500' },
];

const StatusManagerModal: React.FC<StatusManagerModalProps> = ({
  isOpen,
  columnTitle,
  categories,
  onSave,
  onClose,
}) => {
  const [localCategories, setLocalCategories] = useState<StatusCategory[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(JSON.parse(JSON.stringify(categories)));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const newId = `status-${Date.now()}`;
    setLocalCategories([
      ...localCategories,
      { id: newId, label: 'Nuevo Estado', color: 'slate' }
    ]);
  };

  const handleUpdateCategory = (id: string, field: keyof StatusCategory, value: string) => {
    setLocalCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const handleDeleteCategory = (id: string) => {
    setLocalCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Administrar Estados</h3>
            <p className="text-sm text-slate-500">Para el grupo: <span className="font-semibold text-blue-600">{columnTitle}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Define las etiquetas que aparecerán al hacer clic en el botón de estado de las tarjetas.
          </p>

          <div className="space-y-3">
            {localCategories.map((cat, index) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-blue-300 transition-colors">
                
                {/* Color Picker Trigger */}
                <div className="relative group/color">
                  <div className={`w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm ring-1 ring-slate-200 ${AVAILABLE_COLORS.find(c => c.value === cat.color)?.bg}`} />
                  
                  {/* Color Dropdown */}
                  <div className="absolute left-0 top-full mt-2 p-2 bg-white rounded-lg shadow-xl border border-slate-100 grid grid-cols-4 gap-2 z-50 w-48 opacity-0 group-hover/color:opacity-100 invisible group-hover/color:visible transition-all">
                    {AVAILABLE_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => handleUpdateCategory(cat.id, 'color', color.value)}
                        className={`w-8 h-8 rounded-full ${color.bg} hover:scale-110 transition-transform flex items-center justify-center`}
                        title={color.label}
                      >
                         {cat.color === color.value && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label Input */}
                <input
                  type="text"
                  value={cat.label}
                  onChange={(e) => handleUpdateCategory(cat.id, 'label', e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-slate-700"
                  placeholder="Nombre del estado"
                />

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar estado"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {localCategories.length === 0 && (
               <div className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                 No hay estados definidos.
               </div>
            )}
          </div>

          <button
            onClick={handleAddCategory}
            className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Agregar nuevo estado
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white border border-transparent hover:border-slate-300 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusManagerModal;
