// ============================================================
// TIPOS PARA SISTEMA DE HISTORIAL DE CAMBIOS
// ============================================================

export type EntityType = 'column' | 'item' | 'page';

export type ActionType = 'created' | 'updated' | 'deleted' | 'moved';

export interface ChangeHistoryEntry {
    id: string;
    pageId: string;
    entityType: EntityType;
    entityId: string;
    action: ActionType;
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    changedBy?: string;
    changedByName?: string; // Nombre del usuario que hizo el cambio
    changedAt: number; // timestamp en milisegundos
    metadata?: {
        columnTitle?: string;
        fromColumn?: string;
        toColumn?: string;
        itemLabel?: string;
        description?: string;
        [key: string]: any;
    };
}

export interface ChangeHistoryFilters {
    entityType?: EntityType;
    action?: ActionType;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
}

export interface MovementReport {
    pageTitle: string;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalChanges: number;
        columnsCreated: number;
        columnsUpdated: number;
        columnsDeleted: number;
        itemsCreated: number;
        itemsMoved: number;
        itemsUpdated: number;
        itemsDeleted: number;
    };
    changes: ChangeHistoryEntry[];
    changesByUser: {
        userId: string;
        userName: string;
        changeCount: number;
    }[];
    changesByDay: {
        date: string;
        count: number;
    }[];
}

export interface ChangeHistoryStats {
    totalChanges: number;
    recentChanges: number; // últimas 24 horas
    mostActiveUsers: {
        userId: string;
        userName: string;
        changeCount: number;
    }[];
    changesByType: {
        [key in EntityType]: number;
    };
}
