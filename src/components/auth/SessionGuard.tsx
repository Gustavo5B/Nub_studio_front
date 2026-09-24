import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

// Escucha el evento global 'auth:session-expired' emitido por el interceptor
// de fetch en main.tsx y redirige al login con un mensaje claro.
export default function SessionGuard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    const onExpired = () => {
      if (handled.current) return;
      handled.current = true;

      showToast("Tu sesión expiró. Por favor inicia sesión de nuevo.", "warning");

      setTimeout(() => {
        navigate("/login", { replace: true });
        handled.current = false;
      }, 1800);
    };

    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, [navigate, showToast]);

  return null;
}
