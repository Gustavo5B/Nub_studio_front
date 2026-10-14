import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

// =========================================================
// PWA — Inyecta en dist/sw.js la lista de TODOS los archivos
// del build (JS/CSS con hash, fuentes, iconos...) para que el
// Service Worker los descargue en "install" y la app funcione
// sin internet desde la primera visita.
// =========================================================
function pwaPrecache(apiUrl: string): Plugin {
  let outDir = 'dist'
  return {
    name: 'nub-pwa-precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files: string[] = []
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name)
          if (statSync(full).isDirectory()) walk(full)
          else files.push('/' + relative(outDir, full).split('\\').join('/'))
        }
      }
      walk(outDir)

      const precache = files.filter((f) => f !== '/sw.js' && !f.endsWith('.map'))
      const hash = createHash('sha256')
      for (const f of precache) hash.update(f).update(readFileSync(join(outDir, f)))
      const version = hash.digest('hex').slice(0, 10)

      const swPath = join(outDir, 'sw.js')
      const sw = readFileSync(swPath, 'utf8')
        .replace('self.__BUILD_VERSION__', JSON.stringify(version))
        .replace('self.__PRECACHE_MANIFEST__', JSON.stringify(precache))
        .replace('self.__API_ORIGIN__', JSON.stringify(new URL(apiUrl).origin))
      writeFileSync(swPath, sw)
      console.log(`[PWA] sw.js → versión ${version}, ${precache.length} archivos en precache`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:4000'

  return {
    plugins: [react(), pwaPrecache(apiUrl)],
    build: {
      rollupOptions: {}
    },
    // =========================================================
    // FIX ZAP — Headers de seguridad en desarrollo
    // Corrige: CSP, Anti-Clickjacking, X-Content-Type-Options
    // =========================================================
    server: {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com",
          "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
          // El Service Worker hace fetch() a CDN e imágenes estáticas para guardarlos en cache
          "connect-src 'self' http://localhost:4000 https://nubstudio-precio-api.onrender.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com",
          "frame-ancestors 'none'"
        ].join('; '),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    }
  }
})
