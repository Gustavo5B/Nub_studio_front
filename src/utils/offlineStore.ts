// src/utils/offlineStore.ts
// Respaldo en localStorage de datos públicos de la API.
// Si no hay internet (o el backend falla) se devuelve la última copia guardada.
// Funciona junto con el Service Worker (cache nub-api-*) como segunda capa offline.

const PREFIX = "nub_offline:";

export async function fetchJsonWithBackup<T>(url: string): Promise<T> {
  const key = PREFIX + url;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as T;
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: json }));
    } catch {
      /* localStorage lleno o bloqueado: seguimos sin respaldo */
    }
    return json;
  } catch (err) {
    const saved = localStorage.getItem(key);
    if (saved) {
      console.info("[Offline] Usando respaldo de localStorage:", url);
      return (JSON.parse(saved) as { data: T }).data;
    }
    throw err;
  }
}
