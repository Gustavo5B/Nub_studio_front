// ================================================
// NU★B Studio — Service Worker
// Eventos: install, activate, fetch, message
//
// Caches:
//   nub-static-<ver>  → App Shell + todo el build (JS, CSS, fuentes, iconos)
//   nub-pages-<ver>   → páginas (HTML) visitadas
//   nub-api-<ver>     → respuestas GET públicas del backend (datos de la BD)
//   nub-cdn-<ver>     → Bootstrap, Google Fonts, imágenes estáticas de Sobre nosotros
//
// Estrategias:
//   - Navegación (páginas) → Network First → cache → index.html (App Shell)
//   - Estáticos propios    → Cache First → red
//   - API (solo Sobre nosotros, municipios, categorías) → Network First → cache
//   - CDN / imágenes estáticas → Stale While Revalidate
//   Obras, artistas, colecciones e imágenes de Cloudinary NO se guardan.
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
const IMG_CACHE = `nub-img-${BUILD_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE, CDN_CACHE, IMG_CACHE];

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
  '/terminos',
  '/privacidad',
  '/login',
  '/register',
];

// Recursos externos que usa index.html (Bootstrap y Google Fonts)
const CDN_FILES = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap',
];

// Imágenes estáticas externas de "Sobre nosotros" y del Home (se descargan al instalar)
const STATIC_IMAGES = [
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=900&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=85',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&q=80',
  'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=300&q=80',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=90',
  'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300&q=80',
];

// Datos públicos de la BD que se respaldan desde la instalación
const API_TO_PRECACHE = [
  '/api/sobre-nosotros',
  '/api/sobre-nosotros/trayectoria',
  '/api/municipios/hidalgo/count',
  '/api/categorias',
];

// Solo estos datos de la API se guardan; obras, artistas, carrito, etc. NO
const API_CACHEABLE = new Set(API_TO_PRECACHE);

// Blog (público): lista, detalle y relacionados. Comentarios y reacciones NO se guardan.
const BLOG_LIST = '/api/blog/posts?limit=12';
const BLOG_CACHEABLE = /^\/api\/blog\/posts(\/[^/]+(\/relacionados)?)?$/;

// Home: las 12 obras recientes y los artistas que muestra la página de inicio.
// Solo estas dos consultas exactas se guardan (no el resto de /api/obras ni /api/artistas).
const HOME_OBRAS = '/api/obras?limit=12&ordenar=recientes';
const HOME_ARTISTAS = '/api/artistas?limit=8';
const HOME_API = new Set([HOME_OBRAS, HOME_ARTISTAS]);
const IMG_HOST = 'res.cloudinary.com';

// Guarda las imágenes indicadas (Cloudinary). Con prune=true borra las que ya no se usan.
// Solo se sirven desde aquí las imágenes de este cache; el resto sigue yendo a la red.
function cacheImages(urls, prune) {
  const wanted = [...new Set(urls)].filter((u) => {
    try { return new URL(u).hostname === IMG_HOST; } catch { return false; }
  });
  return caches.open(IMG_CACHE).then((cache) =>
    cache.keys()
      .then((keys) =>
        prune ? Promise.all(keys.filter((r) => !wanted.includes(r.url)).map((r) => cache.delete(r))) : null
      )
      .then(() =>
        Promise.allSettled(
          wanted.map((u) =>
            cache.match(u, { ignoreVary: true }).then((hit) =>
              hit ||
              fetch(u, { mode: 'cors' })
                .then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return cache.put(u, res);
                })
                .catch((err) => {
                  precacheFailures++;
                  console.warn('[SW] No se pudo cachear imagen:', u, err.message);
                })
            )
          )
        )
      )
  );
}

// Descarga las obras y artistas del Home y guarda sus imágenes
function precacheHome() {
  return caches.open(API_CACHE).then((cache) => {
    const load = (path, pick) =>
      fetch(API_ORIGIN + path, { mode: 'cors' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          cache.put(API_ORIGIN + path, res.clone());
          return res.json();
        })
        // El Home muestra 12 obras y 10 artistas como máximo
        .then((json) => (Array.isArray(json.data) ? json.data : []).slice(0, 12).map(pick))
        .catch((err) => {
          precacheFailures++;
          console.warn('[SW] No se pudo cachear el Home:', path, err.message);
          return [];
        });

    return Promise.all([
      load(HOME_OBRAS, (o) => o.imagen_principal),
      load(HOME_ARTISTAS, (a) => a.foto_perfil),
    ]).then(([obras, artistas]) => {
      const urls = [...obras, ...artistas.slice(0, 10)].filter(Boolean);
      // Si no se pudo descargar nada (sin red), no se borra lo que ya estaba guardado
      return urls.length ? cacheImages(urls, true) : null;
    });
  });
}

// Descarga la lista del blog y, de cada post, su detalle y relacionados
function precacheBlog() {
  return caches.open(API_CACHE).then((cache) =>
    fetch(API_ORIGIN + BLOG_LIST, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cache.put(API_ORIGIN + BLOG_LIST, res.clone());
        return res.json();
      })
      .then((json) => {
        const slugs = (json.data || []).map((p) => p.slug).filter(Boolean);
        const urls = slugs.flatMap((s) => [
          `${API_ORIGIN}/api/blog/posts/${s}`,
          `${API_ORIGIN}/api/blog/posts/${s}/relacionados`,
        ]);
        return cacheEach(API_CACHE, urls, { mode: 'cors' });
      })
      .catch((err) => {
        precacheFailures++;
        console.warn('[SW] No se pudo cachear el blog:', err.message);
      })
  );
}

const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Cuántas descargas fallaron en el precache actual (para no decir "listo" si no lo está)
let precacheFailures = 0;

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
          .catch((err) => {
            precacheFailures++;
            console.warn('[SW] No se pudo cachear:', url, err.message);
          })
      )
    )
  );
}

// Descarga todo lo que debe quedar disponible sin conexión
function precacheAll() {
  precacheFailures = 0;
  const staticFiles = [...new Set([...APP_SHELL_FILES, ...PRECACHE_BUILD])];

  return Promise.all([
    cacheEach(STATIC_CACHE, staticFiles),
    cacheEach(PAGES_CACHE, PAGES_TO_PRECACHE),
    cacheEach(CDN_CACHE, CDN_FILES, { mode: 'cors' }),
    cacheEach(CDN_CACHE, STATIC_IMAGES, { mode: 'no-cors' }),
    cacheEach(API_CACHE, API_TO_PRECACHE.map((p) => API_ORIGIN + p), { mode: 'cors' }),
    precacheBlog(),
    precacheHome(),
  ]).then(() => {
    if (precacheFailures === 0) {
      console.log(`[SW] Precache listo ✓ (${staticFiles.length} estáticos, ${PAGES_TO_PRECACHE.length} páginas)`);
      notifyClients({ type: 'PRECACHE_DONE', version: BUILD_VERSION });
    } else {
      console.warn(`[SW] Precache incompleto: ${precacheFailures} descargas fallaron. Se reintentará al volver la conexión.`);
    }
  });
}

// Avisa a las pestañas abiertas (la app muestra "Listo para usar sin conexión")
function notifyClients(message) {
  return self.clients
    .matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clients) => clients.forEach((c) => c.postMessage(message)));
}

// ── INSTALL ────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] install → versión', BUILD_VERSION);
  event.waitUntil(
    precacheAll().then(() => {
      // Primera instalación: se activa sola. Si ya había una versión en uso, espera a que el
      // usuario pulse "Actualizar" en la app (mensaje SKIP_WAITING) para no mezclar versiones.
      if (!self.registration.active) return self.skipWaiting();
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

  // 2. Backend: solo los datos públicos de la lista (Sobre nosotros, etc.)
  if (url.origin === API_ORIGIN) {
    const cacheable =
      API_CACHEABLE.has(url.pathname) ||
      BLOG_CACHEABLE.test(url.pathname) ||
      HOME_API.has(url.pathname + url.search);
    if (!cacheable || request.headers.has('Authorization')) return;
    event.respondWith(networkFirst(request, API_CACHE).catch(() => Response.error()));
    return;
  }

  // 2b. Imágenes de Cloudinary: solo se sirven desde el cache las del Home; el resto va a la red
  if (url.hostname === IMG_HOST && request.destination === 'image') {
    event.respondWith(
      caches.match(request, { cacheName: IMG_CACHE, ignoreVary: true }).then((hit) => hit || fetch(request))
    );
    return;
  }

  // 3. CDN, fuentes e imágenes estáticas de la lista
  if (CDN_HOSTS.includes(url.hostname) || STATIC_IMAGES.includes(request.url)) {
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
  // La app avisa que volvió la conexión: se completa lo que faltó en el precache
  if (event.data && event.data.type === 'PRECACHE') {
    event.waitUntil(precacheAll());
  }
  // El Home pide guardar las imágenes que está mostrando ahora mismo
  if (event.data && event.data.type === 'CACHE_IMAGES' && Array.isArray(event.data.urls)) {
    event.waitUntil(cacheImages(event.data.urls));
  }
});
