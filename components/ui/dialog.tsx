"use client";

import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      className="rounded-lg border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="dialog">
      {children}
    </dialog>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
}

export const DialogContent = ({
  children,
  title,
  onClose,
}: DialogContentProps) => {
  return (
    <div className="w-full max-w-2xl">
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              data-testid="dialog-close">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
    </div>
  );
};
