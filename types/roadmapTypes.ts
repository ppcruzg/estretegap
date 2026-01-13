// ============================================================
// TIPOS PARA SISTEMA DE ROADMAP CON IA
// ============================================================

export interface RoadmapItem {
    id: string;
    title: string;
    date?: string;
    status: string;
    groupName: string;
    description?: string;
    responsible?: string;
}

export interface CriticalPoint {
    item: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    dueDate?: string;
    recommendation?: string;
}

export interface Responsibility {
    person: string;
    tasks: {
        title: string;
        date?: string;
        isCritical: boolean;
        status?: string;
    }[];
    workload: 'high' | 'medium' | 'low';
    criticalTasks: number;
}

export interface Insight {
    type: 'risk' | 'opportunity' | 'suggestion' | 'warning';
    message: string;
    priority: 'high' | 'medium' | 'low';
    relatedItems?: string[];
}

export interface Milestone {
    date: string;
    title: string;
    description?: string;
    items: string[];
    status: 'completed' | 'in-progress' | 'pending' | 'overdue';
}

export interface RoadmapAnalysis {
    summary: string;
    timeline: {
        totalItems: number;
        itemsWithDates: number;
        dateRange: { start: string; end: string } | null;
        overdueTasks: number;
        upcomingTasks: number;
    };
    criticalPoints: CriticalPoint[];
    responsibilities: Responsibility[];
    insights: Insight[];
    milestones: Milestone[];
    generatedAt: number;
}

export interface SystemConfig {
    openai_api_key?: string;
    openai_model?: string;
    ai_report_prompt?: string;
    roadmap_cache_ttl?: string;
}
