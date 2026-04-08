// src/utils/apiCache.ts
// Caché en memoria por sesión — evita refetch al navegar de vuelta

const store = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutos

export function cacheGet(url: string): unknown | null {
  const entry = store.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { store.delete(url); return null; }
  return entry.data;
}

export function cacheSet(url: string, data: unknown): void {
  store.set(url, { data, ts: Date.now() });
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** Precarga un artista en caché al hacer hover */
export function prefetchArtista(matricula: string): void {
  if (!matricula) return;
  const url = `${API_URL}/api/artistas/matricula/${encodeURIComponent(matricula)}`;
  if (cacheGet(url)) return;
  fetch(url)
    .then(r => r.json())
    .then(j => { if (j.success && j.data) cacheSet(url, j.data); })
    .catch(() => { /* silencioso */ });
}

/** Precarga una colección en caché al hacer hover */
export function prefetchColeccion(slug: string): void {
  if (!slug) return;
  const url = `${API_URL}/api/colecciones/slug/${slug}`;
  if (cacheGet(url)) return;
  fetch(url)
    .then(r => r.json())
    .then(j => {
      if (j.success && j.data) {
        if (!j.data.obras) j.data.obras = [];
        cacheSet(url, j.data);
      }
    })
    .catch(() => { /* silencioso */ });
}

/** Precarga una obra en caché al hacer hover — no hace nada si ya está cacheada */
export function prefetchObra(slugOrId: string | number): void {
  const id = String(slugOrId);
  const url = /^\d+$/.test(id)
    ? `${API_URL}/api/obras/${id}`
    : `${API_URL}/api/obras/slug/${id}`;
  if (cacheGet(url)) return;
  fetch(url)
    .then(r => r.json())
    .then(j => {
      const d = j.success && j.data ? j.data : j.id_obra ? j : j.data?.id_obra ? j.data : null;
      if (d) cacheSet(url, d);
    })
    .catch(() => { /* silencioso */ });
}
