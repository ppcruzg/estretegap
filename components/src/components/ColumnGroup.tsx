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
import { getStatusColorClasses } from "../helpers/statusColors";
import { Button, IconButton, cn, focusRing } from "./ui";

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
  pageId?: string;
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
  pageId,
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

  // Column color ids are persisted as-is ("green" stays "green"); classes come from the shared helper.
  const colorOptions = [
    { id: "slate", label: t('slate') },
    { id: "blue", label: t('blue') },
    { id: "green", label: t('green') },
    { id: "orange", label: t('orange') },
    { id: "purple", label: t('purple') },
    { id: "pink", label: t('pink') },
    { id: "indigo", label: t('indigo') },
  ];

  const defaultStatuses = [
    { id: "productivo", label: t('pending'), color: "emerald", icon: "check" },
    { id: "en-proceso", label: t('inProgress'), color: "blue", icon: "loader" },
    { id: "bloqueado", label: t('blocked'), color: "rose", icon: "alert" },
  ];

  const statusColorPalette = [
    { id: "emerald", label: t('green') },
    { id: "blue", label: t('blue') },
    { id: "rose", label: t('red') },
    { id: "amber", label: t('amber') },
    { id: "purple", label: t('purple') },
    { id: "slate", label: t('slate') },
    { id: "indigo", label: t('indigo') },
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

  const statusFieldClasses =
    "h-8 w-full px-2 rounded-control border border-border bg-surface text-sm text-fg outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

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
          const tone = getStatusColorClasses(draft.color).solid;
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
              className={cn(
                "group rounded-card border bg-surface transition-all duration-300 relative",
                isDragging
                  ? "opacity-40 border-primary scale-95 shadow-pop rotate-1"
                  : isOver
                    ? "border-primary ring-4 ring-ring/25 scale-[1.02] z-50 shadow-pop"
                    : "border-border shadow-card hover:shadow-pop hover:border-border-strong",
              )}
            >
              {/* Overlay indicador de drop para el grupo */}
              {isOver && (
                <div className="absolute inset-0 bg-primary/5 rounded-card flex items-center justify-center pointer-events-none z-10">
                  <div className="bg-primary text-primary-fg px-4 py-2 rounded-full text-sm font-semibold shadow-pop animate-bounce flex items-center gap-2">
                    <CheckCircle size={16} />
                    {t('dropToRelocate')}
                  </div>
                </div>
              )}

              {/* ================= HEADER DEL GRUPO ================= */}
              <div
                className={`group-header relative flex items-center justify-between px-4 py-3.5 text-white ${tone} rounded-t-[calc(var(--radius-card)-1px)] cursor-grab active:cursor-grabbing`}
                draggable={true}
                onDragStart={() => handleColumnDragStart(col.id)}
                onDragEnd={handleColumnDragEnd}
              >

                {/* TÍTULO */}
                <input
                  className="font-bold text-base tracking-tight text-white bg-transparent w-full outline-none rounded-md px-1 -mx-1 placeholder-white/70 focus:placeholder-white/50 focus-visible:ring-2 focus-visible:ring-white/60 transition-all"
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
                        className="p-1.5 rounded-control border border-white/25 bg-white/10 hover:bg-white/20 text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        title={t('changeColor')}
                        aria-label={t('changeColor')}
                        aria-expanded={openColorPicker === col.id}
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
                      className="p-1.5 rounded-control border border-white/25 bg-white/10 hover:bg-white/20 text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      title={t('configureStatus')}
                      aria-label={t('configureStatus')}
                    >
                      <Settings size={18} />
                    </button>

                    {/* Picker de color */}
                    {openColorPicker === col.id && (
                      <div className="absolute top-full right-0 mt-2 flex items-center gap-2 bg-surface-raised border border-border rounded-card px-3 py-2 shadow-pop z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {colorOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            className={cn(
                              "w-7 h-7 rounded-full border-2 border-surface-raised transition-transform duration-150 hover:scale-110",
                              focusRing,
                              draft.color === opt.id ? "ring-2 ring-fg-muted" : "shadow-card",
                              getStatusColorClasses(opt.id).solid,
                            )}
                            aria-label={opt.label}
                            aria-pressed={draft.color === opt.id}
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
                      className="ml-1 text-white/80 hover:text-white p-1.5 rounded-control hover:bg-white/15 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      title={t('deleteGroup')}
                      aria-label={t('deleteGroup')}
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
                  <div className="flex flex-col items-center justify-center py-8 text-fg-muted">
                    <Box size={32} className="mb-2 opacity-40" />
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
                          className="h-3 border-2 border-dashed border-primary bg-primary-soft mb-3 rounded-control animate-pulse"
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
                      pageId={pageId}
                      checklist={item.checklist}
                      onUpdateChecklist={(val) =>
                        onUpdateItem(col.id, item.id, { checklist: val })
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
                      className="h-3 border-2 border-dashed border-primary bg-primary-soft rounded-control animate-pulse"
                    />
                  )}
              </div>

              {/* ================= NUEVA TARJETA ================= */}
              {canEdit && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onAddItem(col.id)}
                    className={cn("w-full text-sm h-10 px-4", "text-primary-soft-fg font-semibold bg-primary-soft border border-transparent hover:border-primary/40 rounded-control transition-colors duration-150", focusRing)}
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
            className={cn(
              "min-h-[200px] border-2 border-dashed border-border-strong rounded-card p-6 bg-surface/60 text-fg-muted hover:bg-surface hover:text-primary-soft-fg hover:border-primary transition-colors duration-200 flex items-center justify-center font-semibold text-base",
              focusRing,
            )}
          >
            {t('newGroup')}
          </button>
        )}
      </div>

      {/* ================= MODAL BORRAR TARJETA ================= */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[998] animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-title"
            className="bg-surface-raised text-fg rounded-card p-6 shadow-pop w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border"
          >
            <h4 id="delete-card-title" className="text-lg font-bold text-fg mb-2">{t('deleteCard')}</h4>
            <p className="text-sm text-fg-muted leading-relaxed">
              {t('confirmDeleteCard', { label: pendingDelete.label })} {t('cannotUndo')}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onDeleteItem(pendingDelete.colId, pendingDelete.itemId);
                  setPendingDelete(null);
                }}
              >
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ESTADOS ================= */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
            className="bg-surface-raised text-fg rounded-card shadow-pop w-full max-w-5xl p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto border border-border"
          >

            {/* HEADER MODAL */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div>
                <h3 id="status-modal-title" className="text-xl font-bold text-fg tracking-tight">{t('statusCategories')}</h3>
                {statusModalColumnId && (
                  <p className="text-sm text-fg-muted mt-1">
                    {t('groupLabel')}: <span className="font-semibold text-fg">{columns.find(c => c.id === statusModalColumnId)?.title}</span>
                  </p>
                )}
              </div>

              <IconButton
                aria-label={t('close')}
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusModalColumnId(null);
                }}
              >
                <span className="text-2xl leading-none">×</span>
              </IconButton>
            </div>

            {/* ESTADOS */}
            {statusDrafts.map((s, idx) => (
              <div
                key={s.tempId}
                className="grid grid-cols-[0.2fr_0.4fr_0.15fr_0.15fr_auto] items-center gap-2 border border-border bg-surface p-2 mb-2 rounded-control"
              >
                {/* ID */}
                <input
                  className={statusFieldClasses}
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
                  className={statusFieldClasses}
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
                    className={cn("w-5 h-5 rounded-full ring-1 ring-border-strong", focusRing, getStatusColorClasses(s.color).dot)}
                    aria-label={statusColorPalette.find(c => c.id === getStatusColorClasses(s.color).name)?.label ?? String(s.color)}
                    onClick={() =>
                      setOpenColorRow(openColorRow === s.tempId ? null : s.tempId)
                    }
                  />

                  {openColorRow === s.tempId && (
                    <div
                      key={`color-picker-${s.tempId}`}
                      className="absolute top-full mt-2 flex gap-1 bg-surface-raised border border-border rounded-control p-1.5 shadow-pop z-50"
                    >
                      {statusColorPalette.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={cn("w-5 h-5 rounded-full hover:scale-110 transition-transform", focusRing, getStatusColorClasses(c.id).dot)}
                          aria-label={c.label}
                          title={c.label}
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
                    className={cn("w-7 h-7 rounded-full border border-border text-fg-muted flex justify-center items-center hover:bg-surface-muted", focusRing)}
                    onClick={() =>
                      setOpenIconRow(openIconRow === s.tempId ? null : s.tempId)
                    }
                  >
                    {statusIconPalette.find(i => i.id === s.icon)?.icon}
                  </button>

                  {openIconRow === s.tempId && (
                    <div
                      key={`icon-picker-${s.tempId}`}
                      className="absolute top-full mt-2 flex gap-1 bg-surface-raised border border-border rounded-control p-1.5 shadow-pop z-50"
                    >
                      {statusIconPalette.map(i => (
                        <button
                          key={i.id}
                          type="button"
                          className={cn("w-7 h-7 rounded-full border border-border flex justify-center items-center text-fg-muted hover:bg-surface-muted hover:text-fg", focusRing)}
                          aria-label={i.label}
                          title={i.label}
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
                  className="text-xs font-medium text-danger hover:underline px-1"
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
              className={cn("w-full mt-4 h-10 px-4 text-sm", "text-primary-soft-fg font-semibold bg-primary-soft border border-transparent hover:border-primary/40 rounded-control transition-colors duration-150", focusRing)}
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
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
                {t('cancel')}
              </Button>

              <Button
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
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ColumnGroup;
