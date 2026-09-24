import { useEffect, useRef } from "react";
import { useToast } from "../../context/ToastContext";

// Escucha el evento global 'auth:session-expired' emitido por el interceptor
// de fetch en main.tsx y redirige al login con un mensaje claro.
export default function SessionGuard() {
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    const onExpired = () => {
      // Ignorar si ya estamos en login o si ya se está manejando
      if (handled.current) return;
      if (window.location.pathname === "/login") return;

      handled.current = true;
      showToast("Tu sesión expiró. Por favor inicia sesión de nuevo.", "warning");

      setTimeout(() => {
        window.location.replace("/login");
      }, 1800);
    };

    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, [showToast]);

  return null;
}
