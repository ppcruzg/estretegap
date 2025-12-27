import React from "react";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-red-600">{title}</h2>

        <p className="mt-3 text-sm text-gray-700">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded border"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDangerModal;
