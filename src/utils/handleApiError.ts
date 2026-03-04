// src/utils/handleApiError.ts

/**
 * Traduce errores de fetch/API a mensajes amigables para el usuario.
 *
 * Uso:
 *   const message = await handleApiError(response);
 *   showToast(message, "err");
 *
 * O para errores de red (catch):
 *   const message = handleNetworkError(error);
 *   showToast(message, "err");
 */

// ─── Errores HTTP (respuesta del servidor) ────────────────────
export async function handleApiError(res: Response): Promise<string> {
  // Intentar leer el mensaje del backend
  let backendMessage = "";
  try {
    const data = await res.json();
    backendMessage = data.message ?? data.error ?? "";
  } catch {
    // El body no era JSON (ej: error 502 de nginx devuelve HTML)
    backendMessage = "";
  }

  switch (res.status) {
    case 400:
      return backendMessage
        ? `Datos inválidos: ${backendMessage}`
        : "Los datos enviados no son válidos, revisa el formulario";

    case 401:
      return "Tu sesión expiró, vuelve a iniciar sesión";

    case 403:
      return "No tienes permiso para realizar esta acción";

    case 404:
      return "No se encontró el recurso solicitado";

    case 409:
      return backendMessage || "Ya existe un registro con esos datos";

    case 413:
      return "El archivo es demasiado grande para el servidor";

    case 422:
      return backendMessage
        ? `Error de validación: ${backendMessage}`
        : "Los datos no pasaron la validación del servidor";

    case 429:
      return "Demasiadas solicitudes, espera un momento e intenta de nuevo";

    case 500:
      return "Error interno del servidor, intenta más tarde";

    case 502:
    case 503:
    case 504:
      return "El servicio no está disponible en este momento, intenta más tarde";

    default:
      return backendMessage || `Error inesperado (código ${res.status})`;
  }
}

// ─── Errores de red (bloque catch) ───────────────────────────
export function handleNetworkError(error: unknown): string {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();

    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return "Sin conexión, revisa tu internet e intenta de nuevo";
    }
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return "La solicitud tardó demasiado, intenta de nuevo";
    }
    if (msg.includes("cors")) {
      return "Error de conexión con el servidor";
    }
  }

  if (error instanceof Error) {
    return error.message || "Ocurrió un error inesperado";
  }

  return "Ocurrió un error inesperado";
}