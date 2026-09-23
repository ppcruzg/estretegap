import React, { useEffect, useId } from "react";
import { buttonClasses } from "./ui";

interface ConfirmDangerModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDangerModal: React.FC<ConfirmDangerModalProps> = ({
  open,
  title,
  description,
  confirmText = "Confirmar",
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="bg-surface-raised text-fg border border-border rounded-card shadow-pop w-full max-w-md p-6">
        <h2 id={titleId} className="text-lg font-semibold text-danger">{title}</h2>

        <p className="mt-3 text-sm text-fg-muted">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={buttonClasses("secondary", "md")}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className={buttonClasses("danger", "md")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDangerModal;
