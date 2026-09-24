import { useState, useCallback } from "react";

interface GeoState {
  loading: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    loading: false,
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
  });

  const getLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Geolocalización no disponible en este dispositivo." }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    console.log("[Sensor GPS] Solicitando ubicación...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[Sensor GPS] Ubicación obtenida ✓", pos.coords);
        setState({
          loading: false,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
        });
      },
      (err) => {
        console.error("[Sensor GPS] Error:", err.message);
        setState((s) => ({
          ...s,
          loading: false,
          error:
            err.code === 1
              ? "Permiso de ubicación denegado."
              : "No se pudo obtener la ubicación.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, getLocation };
}
