import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (identifier: string, title: string) => void;
  existingIdentifiers: string[];
}

const NewPageModal: React.FC<NewPageModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingIdentifiers,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    setError('');

    if (!identifier.trim()) {
      setError('El identificador es requerido');
      return;
    }

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (existingIdentifiers.includes(identifier)) {
      setError('El identificador ya existe');
      return;
    }

    onCreate(identifier, title);
    setIdentifier('');
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Crear Nueva Página</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Identificador (ID único)
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ej: O2T-NEW-2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Se usa para navegar entre páginas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título de la Página
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: 2026 – Nueva Estrategia"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Nota:</strong> La nueva página se creará basada en la plantilla actual.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Crear Página
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPageModal;
