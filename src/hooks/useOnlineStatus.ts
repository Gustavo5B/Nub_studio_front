import { useEffect, useState } from "react";

// Estado de conexión del navegador (eventos online / offline)
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      console.log("[PWA] Conexión restaurada");
      setOnline(true);
    };
    const goOffline = () => {
      console.log("[PWA] Sin conexión a internet");
      setOnline(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
