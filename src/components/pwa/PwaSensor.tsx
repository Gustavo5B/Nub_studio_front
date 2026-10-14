import { useEffect, useRef, useState } from "react";
import { MapPin, RefreshCw, X } from "lucide-react";
import { useGeolocation } from "../../hooks/useGeolocation";

// Sensor GPS (PWA): botón circular discreto con indicador de estado.
// Al hacer clic muestra una tarjeta con las coordenadas.
// Solicita ubicación automáticamente al montar.
export default function PwaSensor() {
  const { loading, lat, lng, accuracy, error, getLocation } = useGeolocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Activar sensor GPS al cargar la aplicación
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Cerrar la tarjeta al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const hasCoords = lat !== null && lng !== null;
  const status = loading ? "loading" : error ? "error" : hasCoords ? "active" : "idle";
  const statusText = {
    loading: "Obteniendo ubicación…",
    error: error ?? "",
    active: "Ubicación activa",
    idle: "Sin ubicación",
  }[status];

  return (
    <>
      <style>{`
        .gps-root {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9998;
          font-family: 'Outfit', sans-serif;
        }
        .gps-btn {
          position: relative;
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 1px solid #E6E4EF;
          background: #FFFFFF;
          color: #14121E;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(20,18,30,0.10);
          transition: border-color .2s, color .2s, box-shadow .2s, transform .2s;
        }
        .gps-btn:hover, .gps-btn.open {
          border-color: #E8640C;
          color: #E8640C;
          box-shadow: 0 4px 16px rgba(232,100,12,0.18);
        }
        .gps-btn:focus-visible { outline: 2px solid #E8640C; outline-offset: 2px; }
        .gps-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 8px; height: 8px;
          border-radius: 50%;
          border: 1.5px solid #FFFFFF;
        }
        .gps-dot.active  { background: #0E8A50; }
        .gps-dot.loading { background: #E8640C; animation: gpsPulse .9s infinite; }
        .gps-dot.error   { background: #C4304A; }
        .gps-dot.idle    { background: #9896A8; }
        @keyframes gpsPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

        .gps-card {
          position: absolute;
          bottom: 54px; right: 0;
          width: 240px;
          background: #FFFFFF;
          border: 1px solid #E6E4EF;
          border-radius: 12px;
          box-shadow: 0 8px 28px rgba(20,18,30,0.14);
          padding: 14px 16px;
          color: #14121E;
          animation: gpsIn .16s ease-out;
        }
        @keyframes gpsIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .gps-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .gps-title {
          font-size: 10px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: #5A5870;
        }
        .gps-close {
          border: none; background: none; padding: 2px;
          color: #9896A8; cursor: pointer; display: flex;
        }
        .gps-close:hover { color: #14121E; }
        .gps-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; color: #5A5870;
          margin-bottom: 8px;
        }
        .gps-status .gps-dot { position: static; border: none; }
        .gps-coords {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 12.5px; font-weight: 600;
          background: #F3F2F8;
          border: 1px solid #E6E4EF;
          border-radius: 8px;
          padding: 8px 10px;
          line-height: 1.6;
        }
        .gps-coords span { color: #9896A8; font-weight: 400; margin-right: 6px; }
        .gps-refresh {
          margin-top: 12px; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border: 1px solid #14121E; background: #14121E; color: #FFFFFF;
          border-radius: 100px; padding: 7px 0;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: .2em; text-transform: uppercase;
          cursor: pointer; transition: background .2s, border-color .2s;
        }
        .gps-refresh:hover:not(:disabled) { background: #E8640C; border-color: #E8640C; }
        .gps-refresh:disabled { opacity: .55; cursor: default; }
        .gps-refresh .spin { animation: gpsSpin 1s linear infinite; }
        @keyframes gpsSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="gps-root" ref={rootRef}>
        {open && (
          <div className="gps-card" role="dialog" aria-label="Sensor GPS">
            <div className="gps-head">
              <span className="gps-title">Sensor GPS</span>
              <button className="gps-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X size={14} />
              </button>
            </div>

            <div className="gps-status">
              <span className={`gps-dot ${status}`} />
              {statusText}
            </div>

            {hasCoords && (
              <div className="gps-coords">
                <div><span>Lat</span>{lat.toFixed(5)}</div>
                <div><span>Lng</span>{lng.toFixed(5)}</div>
                {accuracy !== null && <div><span>Precisión</span>±{Math.round(accuracy)} m</div>}
              </div>
            )}

            <button className="gps-refresh" onClick={getLocation} disabled={loading}>
              <RefreshCw size={12} className={loading ? "spin" : ""} />
              {loading ? "Buscando" : "Actualizar"}
            </button>
          </div>
        )}

        <button
          className={`gps-btn ${open ? "open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={`Sensor GPS: ${statusText}`}
          title={`Sensor GPS — ${statusText}`}
        >
          <MapPin size={20} strokeWidth={1.8} />
          <span className={`gps-dot ${status}`} />
        </button>
      </div>
    </>
  );
}
