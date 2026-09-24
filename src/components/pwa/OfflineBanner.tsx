import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => {
      console.log("[PWA] Sin conexión a internet");
      setOffline(true);
      setVisible(true);
    };
    const goOnline = () => {
      console.log("[PWA] Conexión restaurada");
      setOffline(false);
      // Mantener el banner de "volviste" unos segundos
      setTimeout(() => setVisible(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .pwa-offline-banner {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 24px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.03em;
          animation: slideDown 0.35s ease;
        }
        .pwa-offline-banner.offline {
          background: #C4304A;
          color: #fff;
        }
        .pwa-offline-banner.online {
          background: #0E8A50;
          color: #fff;
        }
      `}</style>
      <div className={`pwa-offline-banner ${offline ? "offline" : "online"}`}>
        {offline ? (
          <>
            <span>⚠</span>
            <span>Sin conexión a internet — navegando en modo offline</span>
          </>
        ) : (
          <>
            <span>✓</span>
            <span>Conexión restaurada</span>
          </>
        )}
      </div>
    </>
  );
}
