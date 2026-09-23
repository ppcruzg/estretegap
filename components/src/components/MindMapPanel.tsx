import React, { useEffect, useMemo, useState, useRef } from "react";
import { X, Network, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PageData, DashboardColumn, DashboardItem } from "@/types";
import { useTranslation } from "../hooks/useTranslation";
import { getStatusColorClasses } from "../helpers/statusColors";
import IconButton from "./ui/IconButton";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface MindMapPanelProps {
    pageId: string;
    pageData: PageData;
    onClose: () => void;
}

interface Point {
    x: number;
    y: number;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'root' | 'column' | 'item' | 'checklist';
    color?: string;
    status?: string;
    date?: string;
    progress?: number;
    children: TreeNode[];
    width: number;
    height: number;
    x: number;
    y: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;
const NODE_SPACING_X = 280;
const NODE_SPACING_Y = 80;

const MindMapPanel: React.FC<MindMapPanelProps> = ({ pageData, onClose }) => {
    const { t } = useTranslation();
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<Point>({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Column colors are data colors (identical across palettes); the root node inverts the surface.
    const getColorClass = (color?: string, type?: string) => {
        if (type === 'root') return "bg-fg text-bg border-fg shadow-pop";
        return getStatusColorClasses(color).badge;
    };

    // Build the tree and calculate layout
    const tree = useMemo(() => {
        const root: TreeNode = {
            id: pageData.id,
            label: pageData.pageConfig.title,
            type: 'root',
            children: [],
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            x: 0,
            y: 0
        };

        let currentY = 0;

        root.children = (pageData.columns || []).map((col: DashboardColumn) => {
            const colNode: TreeNode = {
                id: col.id,
                label: col.title,
                type: 'column',
                color: col.color,
                children: [],
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                x: NODE_SPACING_X,
                y: 0
            };

            colNode.children = (col.items || [])
                .map((item: DashboardItem) => {
                    // Calculate progress
                    const completedTasks = (item.checklist || []).filter(c => c.completed).length;
                    const totalTasks = (item.checklist || []).length;
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                    const itemNode: TreeNode = {
                        id: item.id,
                        label: item.label,
                        type: 'item',
                        color: col.color,
                        status: item.status,
                        date: item.date,
                        progress: progress,
                        children: [],
                        width: NODE_WIDTH,
                        height: NODE_HEIGHT,
                        x: NODE_SPACING_X * 2,
                        y: 0
                    };

                    itemNode.children = (item.checklist || []).map((check) => ({
                        id: check.id,
                        label: check.text,
                        type: 'checklist',
                        color: col.color,
                        children: [],
                        width: NODE_WIDTH * 0.8,
                        height: NODE_HEIGHT * 0.7,
                        x: NODE_SPACING_X * 3,
                        y: 0
                    }));

                    return itemNode;
                });

            return colNode;
        });

        // Layout algorithm (Simple vertical stacking for leaf nodes)
        const flatten = (node: TreeNode, depth: number, result: TreeNode[]) => {
            node.x = depth * NODE_SPACING_X;
            if (node.children.length === 0) {
                node.y = currentY;
                currentY += NODE_SPACING_Y;
            } else {
                const startY = currentY;
                node.children.forEach(child => flatten(child, depth + 1, result));
                const endY = currentY - NODE_SPACING_Y;
                node.y = (startY + endY) / 2;
            }
            result.push(node);
        };

        const allNodes: TreeNode[] = [];
        flatten(root, 0, allNodes);

        // Center the tree vertically
        const midY = currentY / 2;
        allNodes.forEach(n => n.y -= midY);

        return allNodes;
    }, [pageData]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.2), 2));
    };

    const renderConnections = () => {
        return tree.flatMap(node => {
            return node.children.map(child => {
                const x1 = node.x + node.width / 2;
                const y1 = node.y;
                const x2 = child.x - child.width / 2;
                const y2 = child.y;

                // Bezier curve points
                const cp1x = x1 + (x2 - x1) / 2;
                const cp2x = x1 + (x2 - x1) / 2;

                return (
                    <path
                        key={`${node.id}-${child.id}`}
                        d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-border-strong transition-colors"
                    />
                );
            });
        });
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-overlay backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div role="dialog" aria-modal="true" aria-label={t('viewMindMap')} className="relative w-full h-full bg-surface text-fg border border-border rounded-[2.5rem] shadow-pop overflow-hidden flex flex-col">

                {/* Header Premium */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-surface/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary text-primary-fg rounded-2xl flex items-center justify-center shadow-card">
                            <Network size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-fg uppercase tracking-wider">{t('viewMindMap')}</h2>
                            <p className="text-xs text-fg-muted font-bold tracking-widest uppercase">{pageData.pageConfig.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-surface-muted rounded-control p-1 border border-border">
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} aria-label={t('zoomIn')} title={t('zoomIn')} className="p-2 hover:bg-surface rounded-control text-fg-muted hover:text-fg transition-all"><ZoomIn size={18} /></button>
                            <span className="px-2 text-xs font-bold text-fg-muted min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} aria-label={t('zoomOut')} title={t('zoomOut')} className="p-2 hover:bg-surface rounded-control text-fg-muted hover:text-fg transition-all"><ZoomOut size={18} /></button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label={t('resetView')} title={t('resetView')} className="p-2 hover:bg-surface rounded-control text-fg-muted hover:text-fg transition-all"><RotateCcw size={18} /></button>
                        </div>
                        <IconButton aria-label={t('close')} variant="danger" onClick={onClose} className="h-11 w-11 bg-surface-muted">
                            <X size={20} />
                        </IconButton>
                    </div>
                </div>

                {/* Mind Map Area */}
                <div
                    ref={containerRef}
                    className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-bg text-fg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    {/* Grid Background */}
                    <div
                        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                        style={{
                            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                            backgroundSize: '30px 30px',
                            color: 'inherit'
                        }}
                    />

                    <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                    >
                        <svg className="absolute overflow-visible w-full h-full pointer-events-none">
                            {renderConnections()}
                        </svg>

                        {tree.map(node => (
                            <div
                                key={node.id}
                                className={`absolute flex flex-col items-center justify-center px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-pop z-20 group
                                    ${getColorClass(node.color, node.type)}
                                   ${node.type === 'item' && node.status === 'completado' ? 'ring-2 ring-success/50 border-success shadow-card' : ''}
                                   ${node.type === 'item' && node.status === 'bloqueado' ? 'ring-2 ring-danger/50 border-danger shadow-card animate-pulse' : ''}
                                `}
                                style={{
                                    width: node.width,
                                    height: node.height,
                                    left: node.x - node.width / 2,
                                    top: node.y - node.height / 2,
                                }}
                            >
                                <div className="flex items-center gap-2 max-w-full">
                                    {node.type === 'item' && node.status === 'bloqueado' && (
                                        <AlertTriangle size={14} className="text-danger shrink-0" />
                                    )}
                                    {node.type === 'item' && node.status === 'completado' && (
                                        <CheckCircle2 size={14} className="text-success shrink-0" />
                                    )}
                                    <span className={`text-center font-bold tracking-tight leading-tight select-none truncate
                                        ${node.type === 'root' ? 'text-sm' : 'text-xs'}
                                        ${node.type === 'checklist' ? 'font-medium opacity-80' : ''}
                                        ${node.type === 'item' && (node.status === 'completado' || node.status === 'bloqueado') ? 'max-w-[calc(100%-20px)]' : 'w-full'}
                                    `}>
                                        {node.label}
                                    </span>
                                </div>

                                {/* Date Display */}
                                {node.type === 'item' && node.date && (
                                    <div className="flex items-center gap-1 mt-1 opacity-75">
                                        <Clock size={10} />
                                        <span className="text-[11px] font-bold">
                                            {format(parseISO(node.date), "d MMM yyyy", { locale: es })}
                                        </span>
                                    </div>
                                )}

                                {/* Status Dot for Items (Legacy or subtle indicator) */}
                                {node.type === 'item' && node.status && node.status !== 'completado' && node.status !== 'bloqueado' && (
                                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-surface shadow-card
                                        ${getStatusColorClasses(node.status === 'en-proceso' ? 'blue' : 'slate').dot}
                                    `} />
                                )}

                                {/* Progress Bar for Items with Checklist */}
                                {node.type === 'item' && node.children.length > 0 && (
                                    <div className="absolute -bottom-1 left-4 right-4 h-1 bg-border rounded-full overflow-hidden">
                                        <div className={`h-full opacity-50 transition-all duration-500 ${getStatusColorClasses(node.progress === 100 ? 'emerald' : 'blue').dot}`} style={{ width: `${node.progress || 0}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-surface-muted border-t border-border flex justify-between items-center text-[11px] font-bold text-fg-muted uppercase tracking-widest">
                    <div className="flex gap-6">
                        <span>Click & Drag para mover</span>
                        <span>Scroll para Zoom</span>
                    </div>
                    <span>Estratega Branch Map v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default MindMapPanel;
