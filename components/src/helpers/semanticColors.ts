/**
 * Semantic tones for feedback UI (severity, insights, workload, change actions,
 * milestone status).
 *
 * - danger / warning / success / neutral resolve to theme tokens.
 * - info resolves to the blue *data* color instead of `primary`: the primary
 *   color changes with the palette (e.g. green in "emerald"), which would make
 *   "info" indistinguishable from "success".
 *
 * Every class is a complete static string so Tailwind can detect it.
 */
import { getStatusColorClasses, type StatusColorName } from "./statusColors";

export type Tone = "danger" | "warning" | "success" | "info" | "neutral";

export interface ToneClasses {
  /** Tinted background + readable text + subtle border. */
  badge: string;
  /** Readable text/icon color on app surfaces. */
  text: string;
  /** Solid indicator dot. */
  dot: string;
}

const info = getStatusColorClasses("blue");

export const TONE_CLASSES: Record<Tone, ToneClasses> = {
  danger: { badge: "bg-danger-soft text-danger border-danger/30", text: "text-danger", dot: "bg-danger" },
  warning: { badge: "bg-warning-soft text-warning border-warning/30", text: "text-warning", dot: "bg-warning" },
  success: { badge: "bg-success-soft text-success border-success/30", text: "text-success", dot: "bg-success" },
  info: { badge: info.badge, text: info.text, dot: info.dot },
  neutral: { badge: "bg-surface-muted text-fg-muted border-border", text: "text-fg-muted", dot: "bg-fg-subtle" },
};

/** Critical point severity (was red / yellow / blue / slate). */
export function severityTone(severity: string): Tone {
  switch (severity) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "info";
    default:
      return "neutral";
  }
}

/** AI insight type (was red / emerald / blue / yellow / slate). */
export function insightTone(type: string): Tone {
  switch (type) {
    case "risk":
      return "danger";
    case "opportunity":
      return "success";
    case "suggestion":
      return "info";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}

/** Responsible person's workload (was red / yellow / emerald). */
export function workloadTone(workload: string): Tone {
  if (workload === "high") return "danger";
  if (workload === "medium") return "warning";
  return "success";
}

/** Change history action badge classes (was emerald / blue / red / purple / slate). */
export function changeActionClasses(action: string): string {
  switch (action) {
    case "created":
      return TONE_CLASSES.success.badge;
    case "updated":
      return TONE_CLASSES.info.badge;
    case "deleted":
      return TONE_CLASSES.danger.badge;
    case "moved":
      return getStatusColorClasses("purple").badge;
    default:
      return TONE_CLASSES.neutral.badge;
  }
}

/** Roadmap milestone status as a data color (was emerald / blue / red / fallback). */
export function milestoneStatusColor(
  status: string,
  fallback: StatusColorName = "slate",
): StatusColorName {
  switch (status) {
    case "completed":
      return "emerald";
    case "in-progress":
      return "blue";
    case "overdue":
      return "rose";
    default:
      return fallback;
  }
}
