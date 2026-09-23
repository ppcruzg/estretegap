import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Hash } from 'lucide-react';
import * as Repo from './src/repository/estrategiaRepository';

interface EditableTextProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  multiline?: boolean;
  variant?: 'light' | 'dark';
  placeholder?: string;
  onEditingChange?: (isEditing: boolean) => void;
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  multiline = false,
  variant = 'light',
  placeholder = 'Click to edit',
  onEditingChange
}) => {

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Cargar etiquetas al montar o al entrar en modo edición
  useEffect(() => {
    if (isEditing && multiline) {
      loadTags();
    }
    onEditingChange?.(isEditing);
  }, [isEditing, multiline]);

  const loadTags = async () => {
    try {
      const tags = await Repo.getProjectTags();
      setSuggestions(tags);
    } catch (error) {
      console.error("Error loading tags for autocomplete:", error);
    }
  };

  // 🔥 FIX CRÍTICO:
  // Solo actualizar tempValue desde props si NO estamos editando.
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onSave(tempValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredSuggestions[highlightedIndex]) {
          insertTag(filteredSuggestions[highlightedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !multiline) handleBlur();
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const pos = e.target.selectionStart || 0;
    setTempValue(newVal);
    setCursorPosition(pos);

    if (multiline) {
      // Detectar si estamos escribiendo un tag
      const textBeforeCursor = newVal.substring(0, pos);
      const lastTagIndex = textBeforeCursor.lastIndexOf('#');

      if (lastTagIndex !== -1) {
        const query = textBeforeCursor.substring(lastTagIndex);
        // Solo mostrar si no hay espacios entre el # y el cursor
        if (!query.includes(' ')) {
          const filtered = suggestions
            .filter(s => s.toLowerCase().startsWith(query.toLowerCase()))
            .sort((a, b) => a.localeCompare(b));
          setFilteredSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          setHighlightedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const insertTag = (tag: string) => {
    const textBeforeCursor = tempValue.substring(0, cursorPosition);
    const textAfterCursor = tempValue.substring(cursorPosition);
    const lastTagIndex = textBeforeCursor.lastIndexOf('#');

    const newVal = textBeforeCursor.substring(0, lastTagIndex) + tag + ' ' + textAfterCursor;
    setTempValue(newVal);
    setShowSuggestions(false);

    // Necesitamos devolver el foco al input después de un timeout corto para que React actualice el valor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = lastTagIndex + tag.length + 1;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        // Auto-expand textarea
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline, tempValue]);

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const baseInputStyles =
    "rounded-md px-1 outline-none w-full border transition-colors font-inherit";

  // 'light' = text on a saturated/colored background; 'dark' = text on an app surface.
  const variantStyles =
    variant === 'light'
      ? "bg-white/20 text-white border-white/30 focus:bg-white/30 placeholder-white/50"
      : "bg-surface text-fg border-primary focus:ring-2 focus:ring-ring/30 placeholder:text-fg-subtle";

  if (isEditing) {
    if (multiline) {
      return (
        <div className="relative w-full" onMouseDown={stopPropagation}>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={handleInputChange}
            onBlur={() => {
              // Pequeño retraso para permitir clicks en las sugerencias
              setTimeout(handleBlur, 200);
            }}
            onKeyDown={handleKeyDown}
            className={`${baseInputStyles} ${variantStyles} overflow-hidden resize-none ${className}`}
            placeholder={placeholder}
          />

          {showSuggestions && (
            <div className="absolute z-[1000] left-0 top-full mt-1 w-full bg-surface-raised border border-border rounded-control shadow-pop overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-surface-muted px-3 py-1.5 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-fg-subtle" />
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Etiquetas Disponibles</span>
                </div>
                <span className="text-[11px] text-fg-muted font-medium">{filteredSuggestions.length} resultados</span>
              </div>
              <div className="max-h-60 overflow-y-auto overscroll-contain">
                {filteredSuggestions.map((tag, idx) => (
                  <div
                    key={tag}
                    onClick={() => insertTag(tag)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${highlightedIndex === idx ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-muted hover:bg-surface-muted'
                      }`}
                  >
                    <span className="font-medium">{tag}</span>
                    {highlightedIndex === idx && <span className="text-[11px] opacity-70">Enter ↲</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        className={`${baseInputStyles} ${variantStyles} ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
      draggable={false}
      className={`select-text cursor-text rounded px-1 -ml-1 border border-transparent transition-all relative group 
        ${variant === 'light' ? 'hover:bg-white/10 hover:border-white/10' : 'hover:bg-surface-muted hover:border-border'} 
        ${!value ? 'italic opacity-60 text-xs py-1' : ''}
        ${className}`}
      title="Click to edit"
    >
      {value || placeholder}
      <Pencil
        className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-3 h-3 
        ${variant === 'light' ? 'text-white' : 'text-fg-subtle'}`}
      />
    </div>
  );
};

export default EditableText;
