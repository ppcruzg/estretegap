import React, { useEffect, useState } from "react";
import { getDefaultStatuses } from "../helpers/statuses";
import { useTranslation } from "../hooks/useTranslation";
import {
  Palette,
  Trash,
  Settings,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Zap,
  Wrench,
  Shield,
  Globe,
  Box,
  Server,
  Activity,
  Clock,
} from "lucide-react";
import DiagramNode from "../../DiagramNode";

interface ColumnGroupProps {
  columns: any[];
  onAddColumn: () => void;
  onUpdateColumn: (columnId: string, fields: any) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumns: (newColumns: any[]) => void;
  onAddItem: (columnId: string) => void;
  onUpdateItem: (columnId: string, itemId: string, fields: any) => void;
  onDeleteItem: (columnId: string, itemId: string) => void;
  onMoveItem: (sourceId: string, targetId: string, itemId: string) => void;
  onReorderItems: (columnId: string, newOrder: any[]) => void;
  onUpdateStatuses: (newStatuses: any[]) => void;
  onUpdateColumnStatuses: (columnId: string, newStatuses: any[]) => void;
  activeColorPicker: string | null;
  setActiveColorPicker: (val: string | null) => void;
  currentPageTitle?: string;
  canEdit?: boolean;
}

const ColumnGroup: React.FC<ColumnGroupProps> = ({
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onReorderItems,
  onUpdateStatuses,
  onUpdateColumnStatuses,
  currentPageTitle,
  canEdit = false,
}) => {
  const { t } = useTranslation();
  const [dragColumn, setDragColumn] = useState<string | null>(null);
  const [colDropPreview, setColDropPreview] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ colId: string; itemId: string } | null>(null);
  const [dropPreview, setDropPreview] = useState<{ colId: string; itemId: string | null } | null>(null);
  const [columnEdits, setColumnEdits] = useState<Record<string, { title: string; color: string }>>({});
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalColumnId, setStatusModalColumnId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<any[]>([]);
  const [openColorRow, setOpenColorRow] = useState<string | null>(null);
  const [openIconRow, setOpenIconRow] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ colId: string; itemId: string; label?: string } | null>(null);

  const colorOptions = [
    { id: "slate", label: "Slate", tone: "bg-gradient-to-br from-slate-600 to-slate-700" },
    { id: "blue", label: "Blue", tone: "bg-gradient-to-br from-blue-500 to-blue-700" },
    { id: "green", label: "Green", tone: "bg-gradient-to-br from-emerald-500 to-emerald-700" },
    { id: "orange", label: "Orange", tone: "bg-gradient-to-br from-orange-500 to-orange-700" },
    { id: "purple", label: "Purple", tone: "bg-gradient-to-br from-purple-500 to-purple-700" },
    { id: "pink", label: "Pink", tone: "bg-gradient-to-br from-pink-500 to-pink-700" },
    { id: "indigo", label: "Indigo", tone: "bg-gradient-to-br from-indigo-500 to-indigo-700" },
  ];

  const defaultStatuses = [
    { id: "productivo", label: t('pending'), color: "emerald", icon: "check" },
    { id: "en-proceso", label: t('inProgress'), color: "blue", icon: "loader" },
    { id: "bloqueado", label: t('blocked'), color: "rose", icon: "alert" },
  ];

  const statusColorPalette = [
    { id: "emerald", label: t('green'), tone: "bg-emerald-600" },
    { id: "blue", label: t('blue'), tone: "bg-blue-600" },
    { id: "rose", label: t('red'), tone: "bg-rose-600" },
    { id: "amber", label: t('amber'), tone: "bg-amber-500" },
    { id: "purple", label: t('purple'), tone: "bg-purple-600" },
    { id: "slate", label: t('slate'), tone: "bg-slate-700" },
    { id: "indigo", label: t('indigo'), tone: "bg-indigo-600" },
  ];

  const statusIconPalette = [
    { id: "check", label: "Check", icon: <CheckCircle size={16} /> },
    { id: "loader", label: "Loader", icon: <Loader2 size={16} /> },
    { id: "alert", label: "Alerta", icon: <AlertTriangle size={16} /> },
    { id: "zap", label: t('ray'), icon: <Zap size={16} /> },
    { id: "wrench", label: t('key'), icon: <Wrench size={16} /> },
    { id: "shield", label: t('shield'), icon: <Shield size={16} /> },
    { id: "globe", label: t('globe'), icon: <Globe size={16} /> },
    { id: "box", label: t('box'), icon: <Box size={16} /> },
    { id: "server", label: t('server'), icon: <Server size={16} /> },
    { id: "activity", label: t('activity'), icon: <Activity size={16} /> },
  ];

  useEffect(() => {
    const next: Record<string, { title: string; color: string }> = {};
    columns.forEach((c) => {
      next[c.id] = { title: c.title, color: c.color || "slate" };
    });
    setColumnEdits(next);
  }, [columns]);

  // cambio sugerido 

  useEffect(() => {
    if (!statusModalOpen || !statusModalColumnId) return;

    const col = columns.find(c => c.id === statusModalColumnId);
    if (!col) return;

    const base =
      Array.isArray(col.statusCategories) && col.statusCategories.length > 0
        ? col.statusCategories.map(s => ({
          ...s,
          tempId: s.id ?? crypto.randomUUID(),
          isNew: false,
        }))
        : getDefaultStatuses();

    setStatusDrafts(base);
  }, [statusModalOpen, statusModalColumnId, columns]);


  // fin cambio sugerido

  const updateColumnDraft = (columnId: string, draft: Partial<{ title: string; color: string }>) => {
    setColumnEdits((prev) => ({
      ...prev,
      [columnId]: {
        title: draft.title ?? prev[columnId]?.title ?? columns.find((c) => c.id === columnId)?.title ?? "",
        color: draft.color ?? prev[columnId]?.color ?? columns.find((c) => c.id === columnId)?.color ?? "slate",
      },
    }));
  };

  const commitColumnChanges = (columnId: string) => {
    const draft = columnEdits[columnId];
    const original = columns.find((c) => c.id === columnId);
    if (!draft || !original) return;

    const payload: any = {};
    if (draft.title !== original.title) payload.title = draft.title;
    if (draft.color !== (original.color || "slate")) payload.color = draft.color;

    if (Object.keys(payload).length) {
      onUpdateColumn(columnId, payload);
    }
  };

  // ------------------------------
  // COLUMN DRAG & DROP
  // ------------------------------
  const handleColumnDragStart = (colId: string) => {
    setDragColumn(colId);
  };

  const handleColumnDragEnter = (colId: string) => {
    if (dragColumn) setColDropPreview(colId);
  };

  const handleColumnDragEnd = () => {
    setDragColumn(null);
    setColDropPreview(null);
  };

  const handleColumnDrop = (targetColId: string) => {
    if (!dragColumn || dragColumn === targetColId) {
      handleColumnDragEnd();
      return;
    }

    const newOrder = [...columns];
    const from = newOrder.findIndex((c) => c.id === dragColumn);
    const to = newOrder.findIndex((c) => c.id === targetColId);

    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);

    onReorderColumns(newOrder);
    handleColumnDragEnd();
  };

  // ------------------------------
  // ITEM DRAG & DROP
  // ------------------------------
  const handleItemDragStart = (e: React.DragEvent, columnId: string, itemId: string) => {
    // Prevent drag if user is selecting text
    const target = e.target as HTMLElement;
    const isTextElement = target.tagName === 'P' ||
      target.tagName === 'SPAN' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('[data-text-area]');

    if (isTextElement) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    setDragItem({ colId: columnId, itemId });
    setDropPreview(null);
  };

  const handleItemDragEnter = (
    e: React.DragEvent,
    targetColId: string,
    targetItemId?: string | null
  ) => {
    if (!dragItem) return;
    e.preventDefault();
    e.stopPropagation();
    setDropPreview({ colId: targetColId, itemId: targetItemId ?? null });
  };

  const handleItemDrop = async (
    e: React.DragEvent,
    targetColId: string,
    targetItemId?: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem) return;

    const sourceColumn = columns.find((c) => c.id === dragItem.colId);
    const targetColumn = columns.find((c) => c.id === targetColId);

    if (!sourceColumn || !targetColumn) {
      setDragItem(null);
      return;
    }

    // MOVIMIENTO EN MISMA COLUMNA
    if (targetColId === dragItem.colId) {
      const newOrder = [...targetColumn.items];
      const fromIndex = newOrder.findIndex((i) => i.id === dragItem.itemId);

      if (fromIndex === -1) {
        setDragItem(null);
        return;
      }

      const [moved] = newOrder.splice(fromIndex, 1);
      const insertIndex = targetItemId
        ? newOrder.findIndex((i) => i.id === targetItemId)
        : newOrder.length;

      newOrder.splice(insertIndex === -1 ? newOrder.length : insertIndex, 0, moved);

      await onReorderItems(targetColId, newOrder);
    }
    // MOVIMIENTO ENTRE COLUMNAS DIFERENTES
    else {
      const movingItem = sourceColumn.items.find((i: any) => i.id === dragItem.itemId);
      if (!movingItem) {
        setDragItem(null);
        return;
      }

      const updatedSourceItems = sourceColumn.items.filter((i: any) => i.id !== dragItem.itemId);
      const updatedTargetItems = [...targetColumn.items];

      const insertIndex = targetItemId
        ? updatedTargetItems.findIndex((i) => i.id === targetItemId)
        : updatedTargetItems.length;

      updatedTargetItems.splice(
        insertIndex === -1 ? updatedTargetItems.length : insertIndex,
        0,
        { ...movingItem, column_id: targetColId }
      );

      await onReorderItems(dragItem.colId, updatedSourceItems);
      await onReorderItems(targetColId, updatedTargetItems);
    }

    setDragItem(null);
    setDropPreview(null);
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  // ------------------------------
  // RETURN (UI)
  // ------------------------------

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">

        {columns.map((col) => {
          const draft = columnEdits[col.id] || { title: col.title, color: col.color || "slate" };
          const tone = colorOptions.find((c) => c.id === draft.color)?.tone || "bg-gradient-to-br from-slate-600 to-slate-700";
          const isDragging = dragColumn === col.id;
          const isOver = colDropPreview === col.id && !isDragging;

          return (
            <div
              key={col.id}
              onDragEnter={() => handleColumnDragEnter(col.id)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => handleColumnDrop(col.id)}
              className={`group rounded-2xl border-2 shadow-lg hover:shadow-xl bg-white dark:bg-slate-900 transition-all duration-300 relative ${isDragging
                ? "opacity-40 border-blue-400 scale-95 shadow-2xl rotate-1"
                : isOver
                  ? "border-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30 scale-[1.02] z-50 shadow-2xl"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
            >
              {/* Overlay indicador de drop para el grupo */}
              {isOver && (
                <div className="absolute inset-0 bg-blue-500/5 rounded-2xl flex items-center justify-center pointer-events-none z-10">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce flex items-center gap-2">
                    <CheckCircle size={16} />
                    {t('dropToRelocate')}
                  </div>
                </div>
              )}

              {/* ================= HEADER DEL GRUPO ================= */}
              <div
                className={`group-header relative flex items-center justify-between p-4 text-white ${tone} shadow-md rounded-t-[14px] cursor-grab active:cursor-grabbing`}
                draggable={true}
                onDragStart={() => handleColumnDragStart(col.id)}
                onDragEnd={handleColumnDragEnd}
              >

                {/* TÍTULO */}
                <input
                  className="font-bold text-lg text-white bg-transparent w-full outline-none placeholder-white/70 focus:placeholder-white/50 transition-all"
                  value={draft.title}
                  onChange={(e) => updateColumnDraft(col.id, { title: e.target.value })}
                  onBlur={() => commitColumnChanges(col.id)}
                  placeholder={t('groupName')}
                />

                {/* BOTONES HEADER (Only if canEdit) */}
                {canEdit && (
                  <div className="flex items-center gap-2 ml-3">
                    {/* Cambiar color */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenColorPicker(prev => prev === col.id ? null : col.id)}
                        className="p-2 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110"
                        title={t('changeColor')}
                      >
                        <Palette size={18} />
                      </button>
                    </div>

                    {/* Configurar estados */}
                    <button
                      type="button"
                      onClick={() => {
                        setStatusModalColumnId(col.id);
                        const base =
                          col.statusCategories?.length
                            ? col.statusCategories.map(s => ({
                              ...s,
                              tempId: crypto.randomUUID(),
                            }))
                            : getDefaultStatuses();
                        setStatusDrafts(base);
                        setStatusModalOpen(true);
                      }}
                      className="p-2 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110"
                      title={t('configureStatus')}
                    >
                      <Settings size={18} />
                    </button>

                    {/* Picker de color */}
                    {openColorPicker === col.id && (
                      <div className="absolute top-full right-0 mt-2 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {colorOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`w-8 h-8 rounded-full border-3 transition-all duration-200 hover:scale-125 ${draft.color === opt.id ? "border-slate-800 ring-2 ring-slate-300" : "border-white shadow-md"
                              } ${opt.tone}`}
                            onClick={() => {
                              updateColumnDraft(col.id, { color: opt.id });
                              onUpdateColumn(col.id, { color: opt.id });
                              setOpenColorPicker(null);
                            }}
                            title={opt.label}
                          />
                        ))}
                      </div>
                    )}

                    {/* BORRAR GRUPO */}
                    <button
                      onClick={() => onDeleteColumn(col.id)}
                      className="ml-1 text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-110"
                      title={t('deleteGroup')}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                )}

              </div>

              {/* ================= TARJETAS ================= */}
              <div
                onDragOver={(e) => handleItemDragEnter(e, col.id, null)}
                onDrop={(e) => handleItemDrop(e, col.id)}
                className="flex flex-col gap-3 p-4 min-h-[120px]"
              >
                {col.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-400">
                    <Box size={32} className="mb-2 opacity-30" />
                    <p className="text-sm font-medium">{t('noCards')}</p>
                    {canEdit && <p className="text-xs mt-1">{t('addFirstCard')}</p>}
                  </div>
                )}

                {col.items.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleItemDragEnter(e, col.id, item.id);
                    }}
                    onDrop={(e) => handleItemDrop(e, col.id, item.id)}
                    onDragEnter={(e) => handleItemDragEnter(e, col.id, item.id)}
                    className="transition-all duration-200"
                  >
                    {/* Línea previa durante drag */}
                    {dropPreview &&
                      dropPreview.colId === col.id &&
                      dropPreview.itemId === item.id && (
                        <div
                          key={`preview-${item.id}`}
                          className="h-3 border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/10 mb-3 rounded-lg animate-pulse"
                        />
                      )}

                    <DiagramNode
                      label={item.label}
                      color={draft.color}
                      description={item.description}
                      date={item.date}
                      status={item.status}
                      availableStatuses={col.statusCategories || []}
                      hasIcon={item.hasIcon}
                      isExternalLink={item.isExternalLink}
                      onDelete={() =>
                        setPendingDelete({ colId: col.id, itemId: item.id, label: item.label })
                      }
                      onUpdateLabel={(val) => onUpdateItem(col.id, item.id, { label: val })}
                      onUpdateDescription={(val) => onUpdateItem(col.id, item.id, { description: val })}
                      onUpdateDate={(val) => onUpdateItem(col.id, item.id, { date: val })}
                      onUpdateStatus={(newStatus) =>
                        onUpdateItem(col.id, item.id, { status: newStatus })
                      }
                      responsible={item.responsible}
                      onUpdateResponsible={(val) => onUpdateItem(col.id, item.id, { responsible: val })}
                      canEdit={canEdit}
                      onDragStart={(e) => handleItemDragStart(e, col.id, item.id)}
                      columnId={col.id}
                      itemId={item.id}
                    />
                  </div>
                ))}
                {/* Área para drop al final */}
                {dropPreview &&
                  dropPreview.colId === col.id &&
                  dropPreview.itemId === null && (
                    <div
                      key={`preview-end-${col.id}`}
                      className="h-3 border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/10 rounded-lg animate-pulse"
                    />
                  )}
              </div>

              {/* ================= NUEVA TARJETA ================= */}
              {canEdit && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onAddItem(col.id)}
                    className="w-full text-sm px-4 py-2.5 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-200 hover:shadow-md border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700"
                  >
                    {t('addCard')}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* ================= NUEVO GRUPO ================= */}
        {canEdit && (
          <button
            onClick={onAddColumn}
            className="min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 flex items-center justify-center font-semibold text-lg hover:shadow-lg"
          >
            {t('newGroup')}
          </button>
        )}
      </div>

      {/* ================= MODAL BORRAR TARJETA ================= */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[998] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-transparent dark:border-slate-800">
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('deleteCard')}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('confirmDeleteCard', { label: pendingDelete.label })} {t('cannotUndo')}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
                onClick={() => setPendingDelete(null)}
              >
                {t('cancel')}
              </button>
              <button
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  onDeleteItem(pendingDelete.colId, pendingDelete.itemId);
                  setPendingDelete(null);
                }}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ESTADOS ================= */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-800">

            {/* HEADER MODAL */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('statusCategories')}</h3>
                {statusModalColumnId && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('groupLabel')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{columns.find(c => c.id === statusModalColumnId)?.title}</span>
                  </p>
                )}
              </div>

              <button
                className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition-all duration-200"
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusModalColumnId(null);
                }}
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* ESTADOS */}
            {statusDrafts.map((s, idx) => (
              <div
                key={s.tempId}
                className="grid grid-cols-[0.2fr_0.4fr_0.15fr_0.15fr_auto] items-center border p-2 rounded"
              >
                {/* ID */}
                <input
                  className="border dark:border-slate-700 rounded px-1 text-sm bg-transparent dark:text-slate-100"
                  placeholder="status_id"
                  value={s.status_id || ""}
                  onChange={(e) => {
                    const next = [...statusDrafts];
                    next[idx] = { ...next[idx], status_id: e.target.value };
                    setStatusDrafts(next);
                  }}
                />

                {/* Descripción */}
                <input
                  className="border dark:border-slate-700 rounded px-1 text-sm bg-transparent dark:text-slate-100"
                  value={s.label}
                  onChange={(e) => {
                    const next = [...statusDrafts];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setStatusDrafts(next);
                  }}
                />

                {/* Color */}
                <div className="relative flex justify-center">
                  <button
                    type="button"
                    className={`w-5 h-5 rounded-full border ${statusColorPalette.find(c => c.id === s.color)?.tone
                      }`}
                    onClick={() =>
                      setOpenColorRow(openColorRow === s.tempId ? null : s.tempId)
                    }
                  />

                  {openColorRow === s.tempId && (
                    <div
                      key={`color-picker-${s.tempId}`}
                      className="absolute top-full mt-2 flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow z-50"
                    >
                      {statusColorPalette.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={`w-5 h-5 rounded-full ${c.tone}`}
                          onClick={() => {
                            const next = [...statusDrafts];
                            next[idx] = { ...next[idx], color: c.id };
                            setStatusDrafts(next);
                            setOpenColorRow(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Ícono */}
                <div className="relative flex justify-center">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full border flex justify-center items-center"
                    onClick={() =>
                      setOpenIconRow(openIconRow === s.tempId ? null : s.tempId)
                    }
                  >
                    {statusIconPalette.find(i => i.id === s.icon)?.icon}
                  </button>

                  {openIconRow === s.tempId && (
                    <div
                      key={`icon-picker-${s.tempId}`}
                      className="absolute top-full mt-2 flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow z-50"
                    >
                      {statusIconPalette.map(i => (
                        <button
                          key={i.id}
                          type="button"
                          className="w-7 h-7 rounded-full border dark:border-slate-700 flex justify-center items-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          onClick={() => {
                            const next = [...statusDrafts];
                            next[idx] = { ...next[idx], icon: i.id };
                            setStatusDrafts(next);
                            setOpenIconRow(null);
                          }}
                        >
                          {i.icon}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Eliminar */}
                <button
                  className="text-xs text-red-500"
                  onClick={() =>
                    setStatusDrafts(statusDrafts.filter((_, i) => i !== idx))
                  }
                >
                  {t('delete')}
                </button>
              </div>
            ))}

            {/* AGREGAR NUEVO ESTADO */}
            <button
              className="w-full mt-4 px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-200 hover:shadow-md border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 text-sm"
              onClick={() =>
                setStatusDrafts([
                  ...statusDrafts,
                  {
                    tempId: crypto.randomUUID(),
                    status_id: "",
                    label: t('newStatus'),
                    color: "slate",
                    icon: "check",
                    isNew: true,
                  },
                ])
              }
            >
              {t('addStatus')}
            </button>




            {/* FOOTER MODAL */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                className="px-5 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
                onClick={() => setStatusModalOpen(false)}
              >
                {t('cancel')}
              </button>

              <button
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  if (!statusModalColumnId) return;

                  const normalized = statusDrafts.map((s) => ({
                    id: s.id ?? null,
                    status_id: s.status_id && s.status_id.trim() !== ""
                      ? s.status_id
                      : slugify(s.label),
                    label: s.label,
                    color: s.color,
                    icon: s.icon,
                  }));

                  onUpdateColumnStatuses(statusModalColumnId, normalized);

                  // 🔑 sincroniza estado local inmediatamente
                  setStatusDrafts(
                    normalized.map(s => ({
                      ...s,
                      tempId: crypto.randomUUID(),
                    }))
                  );

                  setStatusModalOpen(false);
                  setStatusModalColumnId(null);

                }}
              >
                {t('saveChanges')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ColumnGroup;
