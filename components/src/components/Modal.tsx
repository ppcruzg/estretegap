import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import IconButton from "./ui/IconButton";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
};

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = "md",
}) => {
    const { t } = useTranslation();
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    // Move focus into the dialog on open and restore it on close.
    useEffect(() => {
        if (!isOpen) return;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        return () => previouslyFocused?.focus?.();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`bg-surface-raised text-fg border border-border rounded-card shadow-pop w-full ${maxWidthClasses[maxWidth]} overflow-hidden outline-none animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                    <h3 id={titleId} className="text-lg font-semibold text-fg">{title}</h3>
                    <IconButton aria-label={t("close")} size="sm" variant="ghost" onClick={onClose}>
                        <X size={18} />
                    </IconButton>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 bg-surface-muted flex justify-end gap-3 border-t border-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
