# AdminDashboard — Rediseño a tema claro con bento grid

**Fecha:** 2026-03-25
**Archivo:** `src/pages/private/admin/AdminDashboard.tsx`
**Estado:** Aprobado — listo para implementar

---

## Objetivo

Migrar `AdminDashboard.tsx` del tema oscuro actual (`#070510` background, paleta warm-cream) al sistema de diseño claro de NU★B Studio documentado en `CLAUDE.md`, y rediseñar el layout a una estructura bento grid más moderna y funcional.

---

## Decisiones de diseño aprobadas

### Tema
- Mismo sistema de diseño que `AdminMonitoreo.tsx` (referencia de implementación)
- Paleta `C`, constante `CS`, fuentes `FB`/`FM` exactamente como en `CLAUDE.md`
- Sin emojis — iconos SVG Lucide en todo

### Layout: Bento grid

```
┌─────────────────────────────────────────────────────────┐
│ Topbar (breadcrumb + refresh + bell + CTA)              │
├─────────────────────────────────────────────────────────┤
│ [Alerta pendientes — barra compacta si obras_pendientes > 0] │
├─────────────────────┬────────┬────────┬────────┬────────┤
│ Welcome banner      │ KPI    │ KPI    │ KPI    │ KPI    │
│ (2fr)               │ (1fr)  │ (1fr)  │ (1fr)  │ (1fr)  │
├─────────────────────┴────────┴────────┴────────┴────────┤
│ StatStrip — 3 métricas horizontales (ancho completo)    │
├──────────────────────────────┬──────────────────────────┤
│ Donut chart (1fr)            │ Columna derecha (1fr)    │
│ Distribución por estado      │  ┌─ Obras recientes ──┐  │
│                              │  └────────────────────┘  │
│                              │  ┌─ Acciones rápidas ─┐  │
│                              │  └────────────────────┘  │
└──────────────────────────────┴──────────────────────────┘
```

**CSS de las filas:**
- Fila 1 (welcome + KPIs): Envolver `WelcomeBanner` + las 4 `KpiCard` en un **único `<div>` contenedor grid** con `gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr"`. No son siblings sueltos — deben estar en el mismo grid para que el welcome ocupe 2fr.
- Fila 2 (StatStrip): un solo `div` de ancho completo
- Fila 3 (donut + columna derecha): `gridTemplateColumns: "1fr 1fr"`

---

## API

**Endpoint existente — NO modificar:** `GET /api/stats/dashboard`
(prefijo `/api/stats/` registrado en `statsRoutes.js`, montado en `server.js`)

**Respuesta real del servidor:**
```ts
{
  success: true,
  data: {
    kpis: {
      total_obras:      number,
      obras_publicadas: number,
      obras_pendientes: number,
      obras_rechazadas: number,
      // obras_agotadas NO existe en la respuesta — calcular en frontend
    },
    strip: {
      artistas_activos: number,
      categorias:       number,
      visitas_total:    number,
    },
    obras_recientes: ObraReciente[],
  }
}
```

**No se requieren nuevos endpoints.**

---

## Componentes

### Topbar
- Breadcrumb: `Admin › Dashboard` (mismo estilo que AdminMonitoreo)
- Botón refresh con ícono `RefreshCw`
- Botón campana `Bell` — **sin punto de notificación** (el punto naranja actual es hardcodeado y falso; se elimina)
- Botón CTA naranja: "Revisar pendientes" → `/admin/obras?estado=pendiente`

### AlertaPendientes
- Solo visible si `kpis.obras_pendientes > 0`
- Barra horizontal compacta, color gold (`#A87006`)
- Botón "Revisar ahora ›" navega a `/admin/obras?estado=pendiente`

### WelcomeBanner
- Fondo: `linear-gradient(135deg, rgba(232,100,12,.07), rgba(96,40,170,.04))`
- Borde: `rgba(232,100,12,.15)`
- Mantener el círculo decorativo `radial-gradient` en la esquina superior derecha
- Contenido: fecha actual formateada + saludo por hora del día + nombre del admin
- Indicador de estado: punto verde `C.green` (`#0E8A50`) + texto "Plataforma activa"
- **Sin emojis** — el punto verde reemplaza al emoji de sol/luna/noche

### KpiCards (4 tarjetas)
- **Estilo: barra de color arriba (2.5px `height`, `borderRadius: 2px`)** — NO usar `border-left` de `AdminMonitoreo`; las KPI del dashboard usan la tira horizontal superior que ya existe en el código actual
- Label uppercase `FB`, número `FM` 22px letter-spacing -0.02em, subtexto en `C.sub`
- Tarjetas: Total obras (azul `C.blue`), Publicadas (verde `C.green`), Pendientes (gold `C.gold`), Rechazadas (rojo `C.red`)

### StatStrip
- **Se mantiene** con los 3 datos de `strip`: Artistas activos, Categorías, Visitas totales
- Rediseño al tema claro: fondo `C.card`, sombra `CS`, borde `C.border`
- Estructura: 3 tarjetas en fila (`gridTemplateColumns: "repeat(3,1fr)"`)
- Estilo igual a KpiCard pero más compacto (horizontal, sin barra de color lateral)
- Números en `FM`, labels en `FB`

### DonutChart — Distribución de obras
- Librería: `recharts` — importar `PieChart, Pie, Cell, Tooltip, ResponsiveContainer`
- **Datos derivados en el frontend** a partir de los KPIs ya cargados:
  ```ts
  const agotadas = Math.max(0,
    (kpis.total_obras ?? 0)
    - (kpis.obras_publicadas ?? 0)
    - (kpis.obras_pendientes ?? 0)
    - (kpis.obras_rechazadas ?? 0)
  );
  // Usar Math.max(0, ...) para evitar valores negativos por inconsistencias del servidor
  // Si agotadas === 0, omitir ese slice del array de datos del donut
  ```
- Colores de los segmentos:
  - Publicadas: `C.green` (`#0E8A50`)
  - Pendientes: `C.gold` (`#A87006`)
  - Rechazadas: `C.red` (`#C4304A`)
  - Agotadas: `C.creamMut` (`#9896A8`) — solo si > 0
- Leyenda a la derecha del donut: color dot + label + subtexto + número en `FM`
- Número total en el centro del donut usando custom label de recharts:
  ```tsx
  <Pie ... label={false} labelLine={false}>
    {/* El número central se renderiza con un <text> SVG posicionado manualmente */}
  </Pie>
  // Dentro del <PieChart>, añadir un texto SVG absoluto:
  // <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
  //   style={{ fontFamily: FM, fontSize: 18, fontWeight: 700, fill: C.cream }}>
  //   {fmt(kpis?.total_obras ?? 0)}
  // </text>
  ```
- **Estado de carga (`loading === true` o `stats === null`):** mostrar un círculo gris placeholder del mismo tamaño con `C.border` como color y sin leyenda
- Tooltip de recharts: fondo `C.card`, borde `C.border`, texto `C.cream` — reescribir `ChartTip` para tema claro

### ObrasRecientes
- Lista de hasta 5 obras más recientes
- Thumbnail: si `imagen_principal` existe, mostrar `<img>` con `object-fit: cover`; si no, placeholder con ícono Lucide `Image` sobre fondo `C.bg`
- Título, `artista_alias`, badge de estado con colores semánticos
- **`statusCfg` para el badge `rechazada` usa `C.red` (`#C4304A`)** — consistente con el KPI card. Actualizar la constante `statusCfg` al mismo tiempo que se migra la paleta.
- Link "Ver todas ›" en color `C.blue` → `/admin/obras`

### AccionesRapidas
- Grid **3×2** (`gridTemplateColumns: "repeat(3,1fr)"`), 6 botones
- Fondo de cada botón: `C.bg` con `border: 1px solid C.border` — **sin gradientes**
- Caja de ícono: mantiene tinte de color `${color}18` (igual que KpiCard en AdminMonitoreo)
- Label + subtexto en `FB`
- Los 6 destinos se mantienen igual: Pendientes, Artistas, Reportes, Importar, Estadísticas, Sobre nosotros

---

## Lo que cambia respecto al código actual

| Elemento | Antes | Después |
|----------|-------|---------|
| Paleta `C` | Oscura (`#070510`, warm cream) | Clara (sistema de CLAUDE.md) |
| `FD` Cormorant Garamond | Usado en KPIs y títulos | Eliminado — `FB` títulos, `FM` números |
| Layout | Pisos lineales | Bento grid (5 columnas fila 1, ancho completo StatStrip, 2 columnas fila 3) |
| `ChartSection` | AreaChart/BarChart/LineChart (datos falsos) | Eliminado — reemplazado por `DonutChart` |
| `ChartTip` tooltip | Fondo oscuro | Fondo blanco `C.card` con borde `C.border` |
| `StatStrip` | Tema oscuro, fila inferior | Tema claro, fila entre KPIs y donut |
| `KpiCards` grid | `repeat(4,1fr)` standalone | Integrado en bento row 1 como columnas 2-5 |
| `AccionesRapidas` grid | `repeat(5,1fr)` con gradientes | `repeat(3,1fr)` sin gradientes |
| Emojis en `WelcomeBanner` | Presentes | Eliminados — punto verde `C.green` |
| Thumbnails de obras | Sin imagen real | `<img>` si `imagen_principal` existe, ícono placeholder si no |
| Bell notification dot | Hardcodeado siempre visible | Eliminado |

---

## Imports necesarios de recharts

```ts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
// Eliminar: AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line
```

---

## Notas de implementación

- El `<style>` block incluye:
  - `@import` Google Fonts (Outfit + JetBrains Mono, igual que `AdminMonitoreo`)
  - `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }` — para el ícono `RefreshCw` al cargar
  - `@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }` — para animación de entrada de cards
  - `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }` — para el punto verde de estado en `WelcomeBanner`
  - Estilos de scrollbar (mismo que `AdminMonitoreo`)
- El tipo `StatsData` se puede mantener igual — `kpis` es `Record<string, number>` y `obras_agotadas` simplemente no aparece (se calcula)
- Eliminar los imports de Lucide que ya no se usen (`BarChart as BarChartIcon`, `LineChart as LineChartIcon`, `AreaChart as AreaIcon`, `TrendingDown`)
