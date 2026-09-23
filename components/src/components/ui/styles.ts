import { cn, focusRing } from "./cn";

/*
 * Class recipes for the UI primitives. Exported separately so non-React code
 * (and elements that cannot use the components, e.g. <Link>) can reuse them.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-card",
  secondary:
    "bg-surface text-fg border border-border hover:bg-surface-muted hover:border-border-strong",
  ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  danger: "bg-danger text-danger-fg hover:opacity-90 shadow-card",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export const buttonClasses = (variant: ButtonVariant = "primary", size: ButtonSize = "md") =>
  cn(
    "inline-flex items-center justify-center font-semibold rounded-control transition-colors duration-150 select-none",
    "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
    focusRing,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
  );

export type IconButtonVariant = "ghost" | "secondary" | "danger";

const ICON_BUTTON_VARIANTS: Record<IconButtonVariant, string> = {
  ghost: "text-fg-muted hover:bg-primary-soft hover:text-primary-soft-fg",
  secondary:
    "bg-surface text-fg-muted border border-border hover:text-fg hover:border-border-strong hover:bg-surface-muted",
  danger: "text-fg-muted hover:bg-danger-soft hover:text-danger",
};

const ICON_BUTTON_SIZES = { sm: "h-8 w-8", md: "h-9 w-9" } as const;

export const iconButtonClasses = (variant: IconButtonVariant = "ghost", size: "sm" | "md" = "md") =>
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-control transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none",
    focusRing,
    ICON_BUTTON_VARIANTS[variant],
    ICON_BUTTON_SIZES[size],
  );

export const inputClasses = cn(
  "w-full h-10 px-3 rounded-control border border-border bg-surface text-sm text-fg",
  "placeholder:text-fg-subtle transition-colors duration-150 hover:border-border-strong",
  "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
  "aria-[invalid=true]:border-danger disabled:opacity-60 disabled:cursor-not-allowed",
);

/** Base card surface; pick the elevation separately to avoid conflicting shadow classes. */
export const cardClasses = "bg-surface text-fg border border-border rounded-card";

export const CARD_ELEVATION = { flat: "", card: "shadow-card", pop: "shadow-pop" } as const;
