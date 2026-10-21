import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Download, RefreshCw, X } from "lucide-react";

// Avisos de la PWA (píldora oscura, abajo al centro):
//   - "Listo para usar sin conexión": una sola vez, cuando el Service Worker termina de guardar todo
//   - "Hay una versión nueva": con botón Actualizar (el SW nuevo espera a que el usuario acepte)
//   - "Instalar app": solo si el navegador permite instalar (Chrome/Edge/Android)

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY_READY = "nub_pwa_ready_shown";
const KEY_INSTALL_DISMISSED = "nub_pwa_install_dismissed";
const INSTALL_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // si lo cierra, no se vuelve a ofrecer en 7 días
const UPDATE_CHECK_MS = 60 * 60 * 1000;
const READY_VISIBLE_MS = 6000;

// Paneles privados donde no se muestran avisos de instalación
const HIDDEN_PATHS = /^\/(admin|artista(\/|$)|dashboard|mi-cuenta|checkout)/;

const read = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* sin almacenamiento: se muestra de nuevo */ }
};

export default function PwaPrompts() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const updating = useRef(false);

  // ── Service Worker: "listo sin conexión" y nueva versión ──
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "PRECACHE_DONE" && !read(KEY_READY)) {
        write(KEY_READY, "1");
        setReady(true);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Al aceptar la actualización el SW nuevo toma el control: se recarga una sola vez
    const onControllerChange = () => {
      if (updating.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let timer: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    const watch = (worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        // "installed" con un SW ya controlando la página = es una actualización, no la primera instalación
        if (worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker);
      });
    };
    const checkForUpdate = () => { registration?.update().catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === "visible") checkForUpdate(); };

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      if (reg.installing) watch(reg.installing);
      reg.addEventListener("updatefound", () => { if (reg.installing) watch(reg.installing); });
      timer = setInterval(checkForUpdate, UPDATE_CHECK_MS);
      document.addEventListener("visibilitychange", onVisible);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearInterval(timer);
    };
  }, []);

  // El aviso de "listo" se quita solo
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setReady(false), READY_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [ready]);

  // ── Instalación ──
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const dismissedAt = Number(read(KEY_INSTALL_DISMISSED) || 0);
      if (Date.now() - dismissedAt < INSTALL_SNOOZE_MS) return;
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const update = useCallback(() => {
    if (!waiting) return;
    updating.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  const install = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null); // el navegador solo permite usar el evento una vez
  }, [installEvent]);

  const dismissInstall = useCallback(() => {
    write(KEY_INSTALL_DISMISSED, String(Date.now()));
    setInstallEvent(null);
  }, []);

  const showInstall = !!installEvent && !HIDDEN_PATHS.test(pathname);
  if (!ready && !waiting && !showInstall) return null;

  return (
    <>
      <style>{`
        @keyframes nubPwaIn {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .nub-pwa-stack {
          position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%);
          z-index: 99998;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          width: max-content; max-width: calc(100vw - 32px);
          pointer-events: none;
          animation: nubPwaIn .3s cubic-bezier(.16,1,.3,1) both;
        }
        .nub-pwa {
          pointer-events: auto;
          display: flex; align-items: center; gap: 10px;
          max-width: 100%;
          padding: 10px 12px 10px 12px;
          border-radius: 100px;
          background: #14121E; color: #FFFFFF;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
          box-shadow: 0 8px 28px rgba(20,18,30,0.28);
        }
        .nub-pwa-icon {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(232,100,12,0.18); color: #E8640C;
        }
        .nub-pwa-icon.ok { background: rgba(14,138,80,0.22); color: #3BC48A; }
        .nub-pwa-sub { color: #9896A8; }
        .nub-pwa-btn {
          border: none; cursor: pointer; flex-shrink: 0;
          background: #E8640C; color: #FFFFFF;
          border-radius: 100px; padding: 7px 16px;
          font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          transition: background .2s;
        }
        .nub-pwa-btn:hover { background: #C24E08; }
        .nub-pwa-btn:focus-visible, .nub-pwa-x:focus-visible { outline: 2px solid #E8640C; outline-offset: 2px; }
        .nub-pwa-x {
          border: none; background: none; cursor: pointer; flex-shrink: 0;
          color: #9896A8; display: flex; padding: 4px; border-radius: 50%;
        }
        .nub-pwa-x:hover { color: #FFFFFF; }
        @media (max-width: 480px) { .nub-pwa-sub { display: none; } }
      `}</style>

      <div className="nub-pwa-stack" role="status" aria-live="polite">
        {waiting && (
          <div className="nub-pwa">
            <span className="nub-pwa-icon"><RefreshCw size={15} /></span>
            <span>Hay una versión nueva<span className="nub-pwa-sub"> · Actualiza para verla</span></span>
            <button className="nub-pwa-btn" onClick={update}>Actualizar</button>
          </div>
        )}

        {showInstall && (
          <div className="nub-pwa">
            <span className="nub-pwa-icon"><Download size={15} /></span>
            <span>Instala NU★B Studio<span className="nub-pwa-sub"> · Acceso rápido y sin conexión</span></span>
            <button className="nub-pwa-btn" onClick={install}>Instalar</button>
            <button className="nub-pwa-x" onClick={dismissInstall} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
        )}

        {ready && (
          <div className="nub-pwa">
            <span className="nub-pwa-icon ok"><CheckCircle2 size={15} /></span>
            <span>Listo para usar sin conexión<span className="nub-pwa-sub"> · Contenido guardado</span></span>
          </div>
        )}
      </div>
    </>
  );
}
