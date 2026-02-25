import React, { useEffect } from "react";

const toastStyles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-rose-50 border-rose-200 text-rose-800",
};

const ActionToast = ({
  message,
  type = "success",
  onClose,
  offset = 0,
  duration = 3500,
}) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed right-4 z-[100] min-w-[280px] max-w-sm rounded-lg border px-4 py-3 shadow-lg ${toastStyles[type] || toastStyles.success}`}
      style={{ top: `${16 + offset * 72}px` }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold opacity-80 hover:opacity-100"
          aria-label="Close notification"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default ActionToast;
