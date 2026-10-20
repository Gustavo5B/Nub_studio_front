import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// Páginas que funcionan sin internet (estáticas o con datos en cache)
const OFFLINE_READY = ["/", "/sobre-nosotros", "/contacto", "/terminos", "/privacidad"];

const isOfflineReady = (path: string) => OFFLINE_READY.includes(path.replace(/\/+$/, "") || "/");

// Si el usuario entra SIN internet a una sección que necesita la API,
// se muestra una pantalla de "sin conexión" en lugar de una página vacía.
// Si la conexión se pierde estando ya dentro de una página, no se interrumpe.
export default function OfflineGate({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  const [blocked, setBlocked] = useState(() => !navigator.onLine && !isOfflineReady(pathname));

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setBlocked(!navigator.onLine && !isOfflineReady(pathname));
  }
  if (online && blocked) setBlocked(false);

  return blocked ? <OfflinePage /> : <>{children}</>;
}

function OfflinePage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        .nub-off {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #FAFAF9;
          padding: 32px 16px;
          font-family: 'Outfit', sans-serif;
          color: #14121E;
          text-align: center;
        }
        .nub-off-box { max-width: 420px; }
        .nub-off-icon {
          width: 72px; height: 72px;
          margin: 0 auto 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: #FFFFFF;
          border: 1px solid #E6E4EF;
          color: #E8640C;
          box-shadow: 0 6px 24px rgba(20,18,30,0.06);
        }
        .nub-off-kicker {
          font-size: 10px; font-weight: 700;
          letter-spacing: .24em; text-transform: uppercase;
          color: #E8640C;
          margin-bottom: 12px;
        }
        .nub-off-title {
          font-family: 'SolveraLorvane', serif;
          font-size: 40px; line-height: 1.05;
          margin: 0 0 14px;
        }
        .nub-off-text {
          font-size: 14.5px; line-height: 1.6;
          color: #5A5870;
          margin: 0 0 32px;
        }
        .nub-off-actions {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
        }
        .nub-off-btn {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 100px;
          padding: 12px 22px;
          font-family: 'Outfit', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase;
          cursor: pointer;
          transition: background .2s, border-color .2s, color .2s;
        }
        .nub-off-btn.primary { background: #14121E; border: 1px solid #14121E; color: #FFFFFF; }
        .nub-off-btn.primary:hover { background: #E8640C; border-color: #E8640C; }
        .nub-off-btn.ghost { background: transparent; border: 1px solid #E6E4EF; color: #14121E; }
        .nub-off-btn.ghost:hover { border-color: #14121E; }
      `}</style>
      <main className="nub-off">
        <div className="nub-off-box">
          <div className="nub-off-icon">
            <WifiOff size={28} strokeWidth={1.6} />
          </div>
          <div className="nub-off-kicker">Sin conexión</div>
          <h1 className="nub-off-title">Esta sección necesita internet</h1>
          <p className="nub-off-text">
            No pudimos cargar el contenido porque no hay conexión. Mientras tanto
            puedes visitar las páginas guardadas en tu dispositivo.
          </p>
          <div className="nub-off-actions">
            <button className="nub-off-btn primary" onClick={() => window.location.reload()}>
              <RefreshCw size={12} /> Reintentar
            </button>
            <button className="nub-off-btn ghost" onClick={() => navigate("/")}>
              Inicio
            </button>
            <button className="nub-off-btn ghost" onClick={() => navigate("/sobre-nosotros")}>
              Sobre nosotros
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
