// ================================================
// NU★B Studio — Service Worker
// Eventos: install, activate, fetch
// Cache: nub-studio-shell-v1
// ================================================

const CACHE_NAME = 'nub-studio-shell-v1';

// Archivos del App Shell a cachear en install
const APP_SHELL_FILES = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/SolveraLorvane.ttf',
  '/fonts/Nexa-Heavy.ttf',
];

// ── INSTALL ────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] install → abriendo cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando app shell...');
      // addAll falla si algún recurso no existe; usamos add individualmente
      return Promise.allSettled(
        APP_SHELL_FILES.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('[SW] No se pudo cachear:', url, err.message)
          )
        )
      );
    }).then(() => {
      console.log('[SW] App shell cacheado ✓');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ───────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] activate → limpiando caches viejos');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando cache obsoleto:', name);
            return caches.delete(name);
          })
      )
    ).then(() => {
      console.log('[SW] Activado — tomando control ✓');
      return self.clients.claim();
    })
  );
});

// ── FETCH ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no sean GET o que vayan a la API
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  // Ignorar recursos externos (CDN, Google Fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Estrategia: Cache First → Network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        console.log('[SW] Sirviendo desde cache:', url.pathname);
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
          return response;
        })
        .catch(() => {
          // Sin red y sin cache: devolver la raíz del SPA (App Shell)
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});

// ── MENSAJE desde la app ────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
