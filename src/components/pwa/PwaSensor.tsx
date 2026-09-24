import { useEffect } from "react";
import { useGeolocation } from "../../hooks/useGeolocation";

// Componente flotante para demostrar el sensor GPS (PWA)
// Solicita ubicación automáticamente al montar
export default function PwaSensor() {
  const { loading, lat, lng, accuracy, error, getLocation } = useGeolocation();

  // Activar sensor GPS al cargar la aplicación
  useEffect(() => {
    getLocation();
  }, []);

  const coordText =
    lat !== null && lng !== null
      ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      : null;

  return (
    <>
      <style>{`
        .pwa-sensor {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9998;
          background: #14121E;
          border: 1px solid rgba(232,100,12,0.4);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          color: #9896A8;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          max-width: 220px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .pwa-sensor:hover {
          border-color: #E8640C;
          box-shadow: 0 4px 20px rgba(232,100,12,0.2);
        }
        .pwa-sensor-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pwa-sensor-dot.active  { background: #0E8A50; animation: pulse 1.5s infinite; }
        .pwa-sensor-dot.loading { background: #E8640C; animation: pulse 0.7s infinite; }
        .pwa-sensor-dot.error   { background: #C4304A; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .pwa-sensor-text { line-height: 1.4; }
        .pwa-sensor-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #E8640C;
          font-weight: 700;
        }
      `}</style>
      <div className="pwa-sensor" onClick={getLocation} title="Sensor GPS — clic para re-activar">
        <div
          className={`pwa-sensor-dot ${loading ? "loading" : error ? "error" : lat ? "active" : "loading"}`}
        />
        <div className="pwa-sensor-text">
          <div className="pwa-sensor-label">📍 Sensor GPS</div>
          {loading && <div>Obteniendo ubicación…</div>}
          {!loading && error && <div>{error}</div>}
          {!loading && coordText && (
            <div>
              {coordText}
              {accuracy !== null && ` ±${Math.round(accuracy)}m`}
            </div>
          )}
          {!loading && !error && !coordText && <div>Clic para activar</div>}
        </div>
      </div>
    </>
  );
}
