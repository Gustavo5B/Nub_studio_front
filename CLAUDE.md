# CLAUDE.md

This file provides guidance to Claude Code when working with the **NU★B Studio** frontend repository.

## Commands
```bash
npm run dev       # Start Vite dev server with HMR (puerto 5173)
npm run build     # TypeScript compile + Vite production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

⚠️ There are no tests — do NOT generate test files or suggest adding a test suite.

## Project Overview

**NU★B Studio** is a React 19 + TypeScript SPA for a regional digital art gallery platform serving the Huasteca Hidalguense region. Built with Vite. Styling via Bootstrap 5 (CDN) + inline `<style>` blocks inside each `.tsx` component.

User roles: `admin`, `artista`, `cliente`, `visitante`.

## Architecture

### Routing — DO NOT MODIFY

Three distinct route groups. The routing structure is stable and must not be changed:

- **Public** (`/`, `/catalogo`, `/artistas`, `/login`, `/register`, etc.) → `PublicLayout` (Navbar + Footer)
- **Artist portal** (`/artista/*`) → `ArtistaLayout` (sidebar), protected by `ArtistaRoute`
- **Admin panel** (`/admin/*`) → `AdminLayout` (sidebar), protected by `AdminRoute`

Route guards (`PrivateRoute`, `AdminRoute`, `ArtistaRoute`) read auth state from `localStorage`.

### API Communication

- Base URL: `import.meta.env.VITE_API_URL` (defaults to `http://localhost:4000`)
- Always use the native **Fetch API** — never use Axios even though it's installed
- Authenticated requests use `Authorization: Bearer <token>`
- Tokens and user data stored in `localStorage` via `src/services/authService.ts`
- API errors translated to Spanish via `src/utils/handleApiError.ts`

### State Management

- **Auth**: `localStorage` only — no reactive Context. Use `src/services/authService.ts`
- **Toasts**: `src/context/ToastContext.tsx` — use `useToast()` → `showToast(message, type)` for all user notifications
- **Everything else**: local `useState` / `useEffect`

### Key Files

- `src/services/authService.ts` — login, register, 2FA, email verification, session
- `src/services/obraService.ts` — artwork CRUD + categories/techniques/artists
- `src/utils/handleApiError.ts` — error translation to Spanish

## Design System — Admin Panel (tema claro)

El panel de admin usa un **tema claro** con la paleta de marca NU★B. Aplicar en cualquier vista nueva bajo `/admin/*`.

### Paleta de colores (`C`)
```ts
const C = {
  orange:"#E8640C", pink:"#A83B90", purple:"#6028AA",
  blue:"#2D6FBE",   gold:"#A87006", green:"#0E8A50",
  cream:"#14121E",  creamSub:"#5A5870",
  creamMut:"#9896A8",
  bgDeep:"#FFFFFF", bg:"#F9F8FC",
  card:"#FFFFFF",
  border:"#E6E4EF",
  borderBr:"rgba(0,0,0,0.05)",
  borderHi:"rgba(0,0,0,0.10)",
  red:"#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)"; // sombra de tarjeta
```

### Tipografía
```ts
const FB = "'Outfit', sans-serif";       // texto, labels, títulos
const FM = "'JetBrains Mono', 'Fira Code', monospace"; // números y datos
```
- **Outfit** → todo texto: labels, descripciones, títulos de sección, botones
- **JetBrains Mono** → exclusivo para números, métricas, IDs, código SQL
- Importar ambas fuentes vía `@import` en el `<style>` del componente:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
  ```

### Reglas de diseño
- Fondo de página: `C.bg` (`#F9F8FC`), fondo de tarjeta: `C.card` (`#FFFFFF`)
- Todas las tarjetas llevan `boxShadow: CS` — nunca solo borde sin sombra
- Tarjetas KPI — dos variantes aceptadas según el contexto:
  - **`border-left: 3px solid <accent>`** — estándar para grids densos de datos (ej. `AdminMonitoreo`)
  - **Tira de color superior (`height: 2.5px`, `borderRadius: 2px`)** — para grids bento donde las tarjetas son más cuadradas (ej. `AdminDashboard`)
  - Ambas usan `boxShadow: CS` y el mismo sistema de colores de acento
- Texto principal: `C.cream` — subtexto: `C.creamSub` (`#5A5870`, weight 500) — nunca usar `#9896A8` para texto legible
- Cajas de código / SQL: `background: "#F3F2F8"` con `border: 1px solid C.border`
- Nunca usar `rgba(0,0,0,0.2+)` como fondo en tema claro — se ve como bloque oscuro

### Escala tipográfica
| Uso | Tamaño |
|-----|--------|
| Label uppercase en KPI | 10px, weight 700 |
| Subtexto secundario | 11.5px, weight 500 |
| Texto de cuerpo / descripciones | 13px |
| Títulos de sección | 15px, weight 700–800 |
| Mini-números en tarjetas | 20px, FM, weight 700 |
| Números TxStats | 24px, FM, weight 700 |
| Números KPI grandes | 30px, FM, weight 700, letter-spacing -0.02em |
| Título de página (h1) | 28px, weight 600 |

### Referencia
Ver implementación completa en `src/pages/private/admin/AdminMonitoreo.tsx`.

---

## Coding Conventions — Always Follow

### Styles
- All styles go inside the `.tsx` file as an inline `<style>` block — never create external `.css` files
- Reference components: `MiPerfil.tsx`, `NuevaObra.tsx`

### Language
- All user-facing text (labels, buttons, messages, placeholders, errors) must be in **Spanish**
- Code identifiers (variables, functions, types) in English

### General
- Never use Axios — always native `fetch`
- Never generate test files
- Use `useToast()` for all feedback messages, never `alert()` or `console.log` as UI feedback
- Always use optional chaining (`?.`) when accessing `req.user` or any potentially undefined object
- TypeScript strict — avoid `any`