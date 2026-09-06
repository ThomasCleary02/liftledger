"use client";

import { FullScreenSheet } from "./FullScreenSheet";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <FullScreenSheet
      open={open}
      title={title}
      onClose={onCancel}
      closeText="Close"
      closeAriaLabel="Close dialog"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 min-h-[48px]">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "btn-danger flex-1 min-h-[48px]" : "btn-primary flex-1 min-h-[48px]"}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-gray-600">{message}</p>
    </FullScreenSheet>
  );
}
