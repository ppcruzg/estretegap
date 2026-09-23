import React, { useEffect, useId, useRef, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { PALETTE_IDS, PALETTE_SWATCHES, type PaletteId } from "../helpers/theme";
import { cn, focusRing } from "./ui/cn";
import { iconButtonClasses } from "./ui/styles";

const PALETTE_LABEL_KEYS = {
  ocean: "paletteOcean",
  emerald: "paletteEmerald",
  violet: "paletteViolet",
  amber: "paletteAmber",
  graphite: "paletteGraphite",
} as const satisfies Record<PaletteId, string>;

/** Check mark color that stays visible on each swatch. */
const SWATCH_CHECK: Record<PaletteId, string> = {
  ocean: "text-white",
  emerald: "text-white",
  violet: "text-white",
  amber: "text-black/80",
  graphite: "text-white",
};

/** Compact appearance popover: palette swatches + light/dark switch. */
const ThemePicker: React.FC = () => {
  const { mode, palette, setPalette, toggleMode } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    selectedRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const isDark = mode === "dark";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("appearance")}
        title={t("appearance")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(iconButtonClasses("ghost"), "relative", open && "bg-primary-soft text-primary-soft-fg")}
      >
        <Palette size={18} />
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-surface"
          style={{ backgroundColor: PALETTE_SWATCHES[palette] }}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("appearance")}
          className="absolute right-0 top-full mt-2 z-50 w-64 p-3 bg-surface-raised border border-border rounded-card shadow-pop animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <p id={`${panelId}-palette`} className="px-1 mb-2 text-xs font-semibold text-fg-muted">
            {t("themePalette")}
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${panelId}-palette`}
            className="grid grid-cols-5 gap-2 px-1"
          >
            {PALETTE_IDS.map((id) => {
              const selected = id === palette;
              const label = t(PALETTE_LABEL_KEYS[id]);
              return (
                <button
                  key={id}
                  ref={selected ? selectedRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={label}
                  title={label}
                  onClick={() => setPalette(id)}
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110",
                    focusRing,
                    selected && "ring-2 ring-offset-2 ring-offset-surface-raised ring-fg-subtle",
                  )}
                  style={{ backgroundColor: PALETTE_SWATCHES[id] }}
                >
                  {selected && <Check size={16} strokeWidth={3} className={SWATCH_CHECK[id]} />}
                </button>
              );
            })}
          </div>

          <div className="my-3 h-px bg-border" />

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={t("darkMode")}
            onClick={toggleMode}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-2 py-2 rounded-control text-sm text-fg hover:bg-surface-muted transition-colors",
              focusRing,
            )}
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon size={16} className="text-fg-muted" /> : <Sun size={16} className="text-fg-muted" />}
              {t("darkMode")}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                isDark ? "bg-primary" : "bg-border-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface shadow-card transition-transform",
                  isDark && "translate-x-4",
                )}
              />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
