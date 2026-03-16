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