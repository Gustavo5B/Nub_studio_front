import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com",
        "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
        "connect-src 'self' http://localhost:4000",
        "frame-ancestors 'none'"
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }
})