// src/helpers/statuses.ts

export type StatusDraft = {
  tempId: string;
  status_id: string;
  label: string;
  color: string;
  icon: string;
  isNew: true;
};

export const getDefaultStatuses = (): StatusDraft[] => [
  {
    tempId: crypto.randomUUID(),
    status_id: "pendiente",
    label: "Pendiente",
    color: "emerald",
    icon: "check",
    isNew: true,
  },
  {
    tempId: crypto.randomUUID(),
    status_id: "en-proceso",
    label: "En proceso",
    color: "blue",
    icon: "loader",
    isNew: true,
  },
  {
    tempId: crypto.randomUUID(),
    status_id: "bloqueado",
    label: "Bloqueado",
    color: "rose",
    icon: "alert",
    isNew: true,
  },
  {
    tempId: crypto.randomUUID(),
    status_id: "completado",
    label: "Completado",
    color: "slate",
    icon: "check",
    isNew: true,
  },
];
