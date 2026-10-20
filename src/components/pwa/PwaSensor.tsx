import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ExternalLink, RefreshCw, X } from "lucide-react";
import { useGeolocation } from "../../hooks/useGeolocation";

// Paneles privados donde el sensor no se muestra
const HIDDEN_PATHS = /^\/(admin|artista(\/|$)|dashboard|mi-cuenta|checkout)/;

// Pin de ubicación (usa currentColor para seguir la paleta de la marca)
function LocationPin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="currentColor"
      />
      <circle cx="12" cy="9" r="2.6" fill="#FFFFFF" />
    </svg>
  );
}

// Sensor GPS (PWA): botón circular discreto con indicador de estado.
// La ubicación se pide al hacer clic (no al cargar la página), como
// recomiendan los navegadores para permisos sensibles.
export default function PwaSensor() {
  const { pathname } = useLocation();
  const { loading, lat, lng, accuracy, error, getLocation } = useGeolocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cerrar la tarjeta al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (HIDDEN_PATHS.test(pathname)) return null;

  const hasCoords = lat !== null && lng !== null;
  const status = loading ? "loading" : error ? "error" : hasCoords ? "active" : "idle";
  const statusText = {
    loading: "Obteniendo ubicación…",
    error: error ?? "",
    active: "Ubicación activa",
    idle: "Ubicación no activada",
  }[status];

  const toggle = () => {
    if (!open && !hasCoords && !loading) getLocation();
    setOpen((o) => !o);
  };

  return (
    <>
      <style>{`
        .gps-root {
          position: fixed;
          bottom: 24px;
          left: 24px;
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
          transform: translateY(-1px);
        }
        .gps-btn:focus-visible { outline: 2px solid #E8640C; outline-offset: 2px; }
        .gps-dot {
          position: absolute;
          top: 5px; right: 5px;
          width: 8px; height: 8px;
          border-radius: 50%;
          border: 1.5px solid #FFFFFF;
        }
        .gps-dot.active  { background: #0E8A50; }
        .gps-dot.loading { background: #E8640C; animation: gpsPulse .9s infinite; }
        .gps-dot.error   { background: #C4304A; }
        .gps-dot.idle    { display: none; }
        @keyframes gpsPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

        .gps-card {
          position: absolute;
          bottom: 54px; left: 0;
          width: 248px;
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
        .gps-status .gps-dot { position: static; border: none; display: block; }
        .gps-status .gps-dot.idle { background: #9896A8; }
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
        .gps-maps {
          margin-top: 10px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border: 1px solid #E6E4EF; border-radius: 100px;
          padding: 7px 0;
          font-size: 11.5px; font-weight: 600;
          color: #14121E; text-decoration: none;
          transition: border-color .2s, color .2s;
        }
        .gps-maps:hover { border-color: #E8640C; color: #E8640C; }
        .gps-refresh {
          margin-top: 8px; width: 100%;
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
        @media (max-width: 480px) { .gps-root { bottom: 16px; left: 16px; } }
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

            {hasCoords && (
              <a
                className="gps-maps"
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LocationPin size={14} />
                Ver en Google Maps
                <ExternalLink size={11} />
              </a>
            )}

            <button className="gps-refresh" onClick={getLocation} disabled={loading}>
              <RefreshCw size={12} className={loading ? "spin" : ""} />
              {loading ? "Buscando" : hasCoords ? "Actualizar" : "Obtener ubicación"}
            </button>
          </div>
        )}

        <button
          className={`gps-btn ${open ? "open" : ""}`}
          onClick={toggle}
          aria-label={`Sensor GPS: ${statusText}`}
          title={`Sensor GPS — ${statusText}`}
        >
          <LocationPin size={22} />
          <span className={`gps-dot ${status}`} />
        </button>
      </div>
    </>
  );
}
