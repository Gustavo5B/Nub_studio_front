// src/components/ui/Toast.tsx
import { useEffect, useState } from "react";
import { useToast, type Toast, type ToastType } from "../../context/ToastContext";

const CONFIG: Record<ToastType, { color: string; bg: string; border: string; icon: string; label: string; textColor: string }> = {
  ok:   { 
    color: "#3DDB85", 
    bg: "rgba(61,219,133,0.10)",  
    border: "rgba(61,219,133,0.30)",  
    icon: "✓", 
    label: "Éxito",
    textColor: "#1B5E20"  // ← Verde oscuro (visible)
  },
  err:  { 
    color: "#CC59AD", 
    bg: "rgba(204,89,173,0.10)",  
    border: "rgba(204,89,173,0.30)",  
    icon: "✕", 
    label: "Error",
    textColor: "#B71C1C"  // ← Rojo oscuro (visible)
  },
  warn: { 
    color: "#FFC110", 
    bg: "rgba(255,193,16,0.10)",  
    border: "rgba(255,193,16,0.30)",  
    icon: "⚠", 
    label: "Aviso",
    textColor: "#E65100"  // ← Naranja oscuro (visible)
  },
};

const css = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(110%); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0);   max-height: 100px; margin-bottom: 10px; }
    to   { opacity: 0; transform: translateX(110%); max-height: 0;    margin-bottom: 0;   }
  }
  @keyframes toastProgress {
    from { width: 100%; }
    to   { width: 0%; }
  }
  .toast-item          { animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .toast-item.leaving  { animation: toastOut 0.3s ease forwards; }
  .toast-close {
    background: transparent; border: none; cursor: pointer;
    padding: 2px 6px; border-radius: 6px; font-size: 14px;
    line-height: 1; transition: background 0.15s; flex-shrink: 0;
  }
  .toast-close:hover { background: rgba(0,0,0,0.08); }
`;

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [leaving, setLeaving] = useState(false);
  const cfg = CONFIG[toast.type];

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => removeToast(toast.id), 280);
  };

  useEffect(() => {
    if (toast.duration > 0) {
      const t = setTimeout(() => setLeaving(true), toast.duration - 300);
      return () => clearTimeout(t);
    }
  }, [toast.duration]);

  return (
    <div
      className={`toast-item${leaving ? " leaving" : ""}`}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "13px 16px", borderRadius: 14,
        background: cfg.bg, border: `1.5px solid ${cfg.border}`,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${cfg.border}`,
        minWidth: 280, maxWidth: 380,
        position: "relative", overflow: "hidden",
        marginBottom: 10,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Ícono */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
        background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, color: cfg.color,
      }}>
        {cfg.icon}
      </div>

      {/* Texto - AHORA CON COLOR OSCURO Y VISIBLE */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: cfg.color,
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 3,
        }}>
          {cfg.label}
        </div>
        <div style={{ 
          fontSize: 13.5, 
          color: cfg.textColor,  // ← CAMBIADO: ahora usa texto oscuro
          lineHeight: 1.5, 
          wordBreak: "break-word",
          fontWeight: 500,
        }}>
          {toast.message}
        </div>
      </div>

      {/* Cerrar - AHORA CON COLOR OSCURO */}
      <button 
        className="toast-close" 
        onClick={handleClose} 
        style={{ 
          color: cfg.textColor,
          opacity: 0.6,
        }}
      >
        ✕
      </button>

      {/* Barra de progreso */}
      {toast.duration > 0 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 3,
          background: cfg.color, borderRadius: "0 0 0 14px", opacity: 0.6,
          animation: `toastProgress ${toast.duration}ms linear forwards`,
        }} />
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  return (
    <>
      <style>{css}</style>
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column-reverse",
        alignItems: "flex-end", pointerEvents: "none",
      }}>
        <div style={{ pointerEvents: "auto" }}>
          {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
        </div>
      </div>
    </>
  );
}