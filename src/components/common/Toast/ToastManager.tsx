import React, { useState, useCallback } from "react";
import { Toast, ToastType } from "./Toast";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const hide = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => show(message, "success"),
    [show]
  );
  const error = useCallback(
    (message: string) => show(message, "error"),
    [show]
  );
  const info = useCallback((message: string) => show(message, "info"), [show]);

  const ToastContainer = useCallback(
    () => (
      <>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hide(toast.id)}
          />
        ))}
      </>
    ),
    [toasts, hide]
  );

  return {
    show,
    success,
    error,
    info,
    ToastContainer,
  };
};
