// src/context/ToastContext.tsx
import { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Tipos ────────────────────────────────────────────────────
export type ToastType = "ok" | "err" | "warn";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number; // ms, 0 = no se cierra solo
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: number) => void;
}

// ─── Contexto ─────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = "ok",
    duration?: number
  ) => {
    // Duración por defecto según tipo:
    // ✅ ok   → 4 segundos (se cierra solo)
    // ❌ err  → 0 (no se cierra solo, usuario lo cierra)
    // ⚠️ warn → 5 segundos
    const defaultDuration = type === "ok" ? 4000 : type === "warn" ? 5000 : 0;
    const finalDuration = duration ?? defaultDuration;

    const id = ++counterRef.current;

    setToasts(prev => [...prev, { id, type, message, duration: finalDuration }]);

    if (finalDuration > 0) {
      setTimeout(() => removeToast(id), finalDuration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}