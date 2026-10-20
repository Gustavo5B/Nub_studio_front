import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// Aviso flotante de conexión: píldora oscura centrada abajo.
// Sin red se queda visible; al volver la red avisa 3 s y se oculta.
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [visible, setVisible] = useState(!online);
  const [prevOnline, setPrevOnline] = useState(online);

  // Cada cambio de conexión vuelve a mostrar el aviso
  if (online !== prevOnline) {
    setPrevOnline(online);
    setVisible(true);
  }

  // Con conexión, el aviso de "restaurada" se oculta a los 3 s
  useEffect(() => {
    if (!online || !visible) return;
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [online, visible]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes nubNetIn {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .nub-net {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: calc(100vw - 32px);
          padding: 10px 18px 10px 12px;
          border-radius: 100px;
          background: #14121E;
          color: #FFFFFF;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 8px 28px rgba(20,18,30,0.28);
          animation: nubNetIn .3s cubic-bezier(.16,1,.3,1) both;
        }
        .nub-net-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nub-net.offline .nub-net-icon { background: rgba(232,100,12,0.18); color: #E8640C; }
        .nub-net.online  .nub-net-icon { background: rgba(14,138,80,0.22); color: #3BC48A; }
        .nub-net-sub { color: #9896A8; }
        @media (max-width: 480px) { .nub-net-sub { display: none; } }
      `}</style>
      <div className={`nub-net ${online ? "online" : "offline"}`} role="status" aria-live="polite">
        <span className="nub-net-icon">
          {online ? <Wifi size={15} /> : <WifiOff size={15} />}
        </span>
        {online ? (
          <span>Conexión restaurada</span>
        ) : (
          <span>
            Sin conexión<span className="nub-net-sub"> · Mostrando contenido guardado</span>
          </span>
        )}
      </div>
    </>
  );
}
