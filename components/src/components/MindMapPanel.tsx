import React, { useMemo, useState, useRef } from "react";
import { X, Network, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PageData, DashboardColumn, DashboardItem } from "../../../types";
import { useTranslation } from "../hooks/useTranslation";
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

    // Color mapping based on Tailwind colors from types
    const getColorClass = (color?: string, type?: string) => {
        if (type === 'root') return "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl border-slate-700";

        switch (color) {
            case 'blue': return "bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400";
            case 'orange': return "bg-orange-500/10 border-orange-500/50 text-orange-700 dark:text-orange-400";
            case 'purple': return "bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400";
            case 'green': return "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400";
            case 'rose':
            case 'red': return "bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400";
            case 'amber': return "bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400";
            case 'indigo': return "bg-indigo-500/10 border-indigo-500/50 text-indigo-700 dark:text-indigo-400";
            case 'cyan': return "bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-400";
            default: return "bg-slate-500/10 border-slate-500/50 text-slate-700 dark:text-slate-400";
        }
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
                        className="text-slate-200 dark:text-slate-700 transition-colors"
                    />
                );
            });
        });
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full h-full bg-white dark:bg-slate-950 border border-white/20 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">

                {/* Header Premium */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                            <Network className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('viewMindMap')}</h2>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">{pageData.pageConfig.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><ZoomIn size={18} /></button>
                            <span className="px-2 text-xs font-bold text-slate-500 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><ZoomOut size={18} /></button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><RotateCcw size={18} /></button>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 rounded-2xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Mind Map Area */}
                <div
                    ref={containerRef}
                    className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-950/20"
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
                                className={`absolute flex flex-col items-center justify-center px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl z-20 group
                                    ${getColorClass(node.color, node.type)}
                                   ${node.type === 'item' && node.status === 'completado' ? 'ring-2 ring-emerald-500/50 border-emerald-500 shadow-lg shadow-emerald-500/10' : ''}
                                   ${node.type === 'item' && node.status === 'bloqueado' ? 'ring-2 ring-rose-500/50 border-rose-500 shadow-lg shadow-rose-500/10 animate-pulse' : ''}
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
                                        <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                                    )}
                                    {node.type === 'item' && node.status === 'completado' && (
                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
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
                                    <div className="flex items-center gap-1 mt-1 opacity-60">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-bold">
                                            {format(parseISO(node.date), "d MMM yyyy", { locale: es })}
                                        </span>
                                    </div>
                                )}

                                {/* Status Dot for Items (Legacy or subtle indicator) */}
                                {node.type === 'item' && node.status && node.status !== 'completado' && node.status !== 'bloqueado' && (
                                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm
                                        ${node.status === 'en-proceso' ? 'bg-blue-500' : 'bg-slate-400'}
                                    `} />
                                )}

                                {/* Progress Bar for Items with Checklist */}
                                {node.type === 'item' && node.children.length > 0 && (
                                    <div className="absolute -bottom-1 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full opacity-50 transition-all duration-500 ${node.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${node.progress || 0}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
