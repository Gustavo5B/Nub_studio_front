// ================================================
// NU★B Studio — Service Worker
// Eventos: install, activate, fetch, message
//
// Caches:
//   nub-static-<ver>  → App Shell + todo el build (JS, CSS, fuentes, iconos)
//   nub-pages-<ver>   → páginas (HTML) visitadas
//   nub-api-<ver>     → respuestas GET públicas del backend (datos de la BD)
//   nub-cdn-<ver>     → Bootstrap, Google Fonts, imágenes de Cloudinary
//
// Estrategias:
//   - Navegación (páginas) → Network First → cache → index.html (App Shell)
//   - Estáticos propios    → Cache First → red
//   - API pública          → Network First → cache
//   - CDN / imágenes       → Stale While Revalidate
// ================================================

// En el build, el plugin de vite.config.ts reemplaza estos valores
// con la lista real de archivos de /dist y la URL del backend.
const BUILD_VERSION = self.__BUILD_VERSION__ || 'dev';
const PRECACHE_BUILD = self.__PRECACHE_MANIFEST__ || [];
const API_ORIGIN = self.__API_ORIGIN__ || 'http://localhost:4000';

const STATIC_CACHE = `nub-static-${BUILD_VERSION}`;
const PAGES_CACHE = `nub-pages-${BUILD_VERSION}`;
const API_CACHE = `nub-api-${BUILD_VERSION}`;
const CDN_CACHE = `nub-cdn-${BUILD_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE, CDN_CACHE];

// App Shell: lo mínimo para que la app arranque sin internet
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/SolveraLorvane.ttf',
  '/fonts/Nexa-Heavy.ttf',
];

// Páginas públicas que se guardan desde la instalación
const PAGES_TO_PRECACHE = [
  '/',
  '/catalogo',
  '/artistas',
  '/blog',
  '/sobre-nosotros',
  '/contacto',
  '/login',
  '/register',
];

// Recursos externos que usa index.html (Bootstrap y Google Fonts)
const CDN_FILES = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap',
];

// Datos públicos de la BD que se respaldan desde la instalación
const API_TO_PRECACHE = [
  '/api/sobre-nosotros',
  '/api/sobre-nosotros/trayectoria',
  '/api/municipios/hidalgo/count',
  '/api/categorias',
];

// Endpoints que nunca se guardan (sesión, datos privados del usuario)
const API_NO_CACHE = [
  '/api/auth',
  '/api/carrito',
  '/api/favoritos',
  '/api/pedidos',
  '/api/admin',
];

const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'res.cloudinary.com',
  'images.unsplash.com',
];

// Guarda cada URL por separado: si una falla, las demás sí se cachean
function cacheEach(cacheName, urls, init) {
  return caches.open(cacheName).then((cache) =>
    Promise.allSettled(
      urls.map((url) =>
        fetch(url, init)
          .then((res) => {
            if (res.ok || res.type === 'opaque') return cache.put(url, res);
            throw new Error(`HTTP ${res.status}`);
          })
          .catch((err) => console.warn('[SW] No se pudo cachear:', url, err.message))
      )
    )
  );
}

// ── INSTALL ────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] install → versión', BUILD_VERSION);
  const staticFiles = [...new Set([...APP_SHELL_FILES, ...PRECACHE_BUILD])];

  event.waitUntil(
    Promise.all([
      cacheEach(STATIC_CACHE, staticFiles),
      cacheEach(PAGES_CACHE, PAGES_TO_PRECACHE),
      cacheEach(CDN_CACHE, CDN_FILES, { mode: 'cors' }),
      cacheEach(API_CACHE, API_TO_PRECACHE.map((p) => API_ORIGIN + p), { mode: 'cors' }),
    ]).then(() => {
      console.log(`[SW] Precache listo ✓ (${staticFiles.length} estáticos, ${PAGES_TO_PRECACHE.length} páginas)`);
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ───────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] activate → limpiando caches viejos');
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !CURRENT_CACHES.includes(name))
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

// ── Estrategias ────────────────────────────────
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() =>
      caches.match(request, { cacheName }).then((cached) => {
        if (cached) {
          console.log('[SW] Offline → sirviendo desde cache:', request.url);
          return cached;
        }
        throw new Error('Sin red y sin cache');
      })
    );
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
      }
      return response;
    });
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
}

// ── FETCH ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navegación entre páginas (incluye recargar con F5)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGES_CACHE).catch(() =>
        // Ruta nunca visitada: la SPA arranca desde index.html y React Router la resuelve
        caches.match('/index.html').then((r) => r || caches.match('/')).then((r) => r || Response.error())
      )
    );
    return;
  }

  // 2. Backend: solo datos públicos y sin token
  if (url.origin === API_ORIGIN && url.pathname.startsWith('/api/')) {
    const isPrivate =
      request.headers.has('Authorization') ||
      API_NO_CACHE.some((p) => url.pathname.startsWith(p));
    if (isPrivate) return;
    event.respondWith(networkFirst(request, API_CACHE).catch(() => Response.error()));
    return;
  }

  // 3. CDN, fuentes e imágenes externas
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // 4. Estáticos propios (JS, CSS, fuentes, iconos)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE).catch(() => Response.error()));
  }
});

// ── MENSAJE desde la app ────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
