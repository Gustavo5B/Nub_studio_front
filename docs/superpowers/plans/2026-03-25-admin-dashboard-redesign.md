# AdminDashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `AdminDashboard.tsx` from dark theme to the NU★B light design system and redesign the layout to a bento grid with a real donut chart.

**Architecture:** Single file rewrite — `src/pages/private/admin/AdminDashboard.tsx`. All sub-components remain co-located in the same file. The palette constants, imports, and each component are replaced/updated in place.

**Tech Stack:** React 19, TypeScript, recharts (PieChart/Pie/Cell/Tooltip/ResponsiveContainer), Lucide React, inline `<style>` block, native fetch.

---

## File Map

| Action   | File                                                        | Purpose                        |
|----------|-------------------------------------------------------------|--------------------------------|
| Modify   | `src/pages/private/admin/AdminDashboard.tsx`                | Full rewrite — single target   |
| Reference | `src/pages/private/admin/AdminMonitoreo.tsx`               | Light theme reference          |
| Reference | `docs/superpowers/specs/2026-03-25-admin-dashboard-redesign.md` | Approved spec             |

---

## Task 1: Replace palette constants and imports

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx:1-22` (imports) and `:24-44` (constants)

- [ ] **Step 1: Replace the `C` palette**

Replace the entire dark `C` object (lines 24–40) with the light theme palette:

```tsx
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
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
```

- [ ] **Step 2: Replace font constants**

Remove `const FD = ...` (line 42) and add `FM`:

```tsx
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
```

- [ ] **Step 3: Update Lucide imports**

Replace the current Lucide import block with only what is needed:

```tsx
import {
  Bell, ChevronRight, Clock, CheckCircle, XCircle,
  Layers, Users, Package, Eye, Image, RefreshCw,
  ArrowUpRight, Upload, BarChart2, Activity, FileText,
} from "lucide-react";
```

Remove: `Search`, `TrendingUp`, `TrendingDown`, `BarChart as BarChartIcon`, `LineChart as LineChartIcon`, `AreaChart as AreaIcon`.

Keep `ArrowUpRight` — it is still used in `StatStrip`.

- [ ] **Step 4: Replace recharts imports**

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
```

Remove: `AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart as RBarChart, Bar, LineChart as RLineChart, Line`.

- [ ] **Step 5: Update `statusCfg`**

```tsx
const statusCfg: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green  },
  pendiente: { label: "Pendiente", color: C.gold   },
  rechazada: { label: "Rechazada", color: C.red    },
  agotada:   { label: "Agotada",   color: C.creamMut },
};
```

- [ ] **Step 6: Check for `FD` usage**

Search for remaining `FD` references in the file — they will be eliminated in Tasks 4 and 5. Do NOT run `tsc --noEmit` here because `FD` errors in other components will be present until Task 5 completes. Full TypeScript verification happens in Task 8.

---

## Task 2: Rewrite `ChartTip` and `Topbar` for light theme

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `ChartTip` (~line 70) and `Topbar` (~line 87)

- [ ] **Step 1: Rewrite `ChartTip` for light theme**

```tsx
const ChartTip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: FB, boxShadow: CS }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: C.creamSub, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: C.creamMut }}>{p.name}:</span>
          <strong style={{ color: C.cream }}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Rewrite `Topbar` for light theme**

Key changes:
- Background: `C.bg`, border: `C.border`
- Remove the search bar entirely
- Remove the bell notification dot (`<span>` with orange background)
- Keep: breadcrumb, refresh button, bell button (no dot), "Revisar pendientes" CTA

```tsx
function Topbar({ navigate, onRefresh, loading }: {
  navigate: (p: string) => void; onRefresh: () => void; loading: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize: 13, color: C.creamSub }}>Dashboard</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onRefresh} title="Actualizar datos"
          style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button title="Notificaciones"
          style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Bell size={13} color={C.creamMut} strokeWidth={1.8} />
        </button>
        <button onClick={() => navigate("/admin/obras?estado=pendiente")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, border: "none", color: "white", padding: "7px 15px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: `0 2px 8px ${C.orange}40`, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          <Clock size={14} strokeWidth={2.5} /> Revisar pendientes
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/pages/private/admin/AdminDashboard.tsx --max-warnings=0`
Expected: no new errors from these two components.

---

## Task 3: Rewrite `WelcomeBanner` and `AlertaPendientes`

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `WelcomeBanner` (~line 128) and `AlertaPendientes` (~line 153)

- [ ] **Step 1: Rewrite `WelcomeBanner`**

Key changes:
- Remove `fontFamily:FD` → use `FB` for text, keep gradient for the name span
- Remove emoji — use pulsing green dot for "Plataforma activa" status
- Date pill: light border, `C.creamSub` text
- Background: `linear-gradient(135deg, rgba(232,100,12,.07), rgba(96,40,170,.04))`

```tsx
function WelcomeBanner({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const now = new Date();
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  return (
    <div style={{ borderRadius: 14, padding: "22px 26px", background: "linear-gradient(135deg, rgba(232,100,12,.07), rgba(96,40,170,.04))", border: "1px solid rgba(232,100,12,.15)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,100,12,0.06), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: "rgba(0,0,0,0.03)", border: `1px solid ${C.border}`, fontSize: 11.5, color: C.creamSub, fontFamily: FB, marginBottom: 10 }}>
          {dateStr}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: FB, color: C.cream }}>
          {greeting},{" "}
          <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userName}</span>
        </h1>
        <p style={{ fontSize: 13, color: C.creamSub, margin: "0 0 10px", fontFamily: FB }}>Resumen general de la plataforma.</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: FB, color: C.green, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          Plataforma activa
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `AlertaPendientes`**

Key changes: light borders/backgrounds using `C.gold`, text colors → `C.cream` / `C.creamSub`

```tsx
function AlertaPendientes({ count, navigate }: { count: number; navigate: (p: string) => void }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderRadius: 10, background: `rgba(168,112,6,0.05)`, border: `1px solid rgba(168,112,6,0.25)`, fontFamily: FB, animation: "fadeUp .35s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Clock size={14} color={C.gold} strokeWidth={2} />
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>
            {count === 1 ? "Hay 1 obra pendiente de revisión" : `Hay ${count} obras pendientes de revisión`}
          </span>
          <div style={{ fontSize: 11.5, color: C.creamSub, marginTop: 2 }}>Revísalas para mantener el catálogo actualizado</div>
        </div>
      </div>
      <button onClick={() => navigate("/admin/obras?estado=pendiente")}
        style={{ display: "flex", alignItems: "center", gap: 5, background: `${C.gold}12`, border: `1px solid ${C.gold}35`, color: C.gold, padding: "7px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s", flexShrink: 0, whiteSpace: "nowrap" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.gold}22`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${C.gold}12`; }}>
        Revisar ahora <ChevronRight size={13} />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

---

## Task 4: Rewrite `KpiCards`

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `KpiCards` component (~line 179)

- [ ] **Step 1: Rewrite `KpiCards`**

Key changes:
- Light palette throughout
- `FD` → `FM` for the large number, `FB` for labels
- Remove trend indicator (no `TrendingUp`/`TrendingDown` — they were removed from imports)
- Cards: Total obras (blue), Publicadas (green), Pendientes (gold), Rechazadas (red)
- Accent colors updated: `C.blue`, `C.green`, `C.gold`, `C.red`
- Top color strip: `height:2.5px`, `borderRadius:2px` — keep this pattern

```tsx
function KpiCards({ kpis, loading }: { kpis: Record<string, number> | null; loading: boolean }) {
  const cards = [
    { value: kpis?.total_obras      ?? 0, label: "Total Obras",  sub: "en catálogo",   accent: C.blue,  Icon: Layers      },
    { value: kpis?.obras_publicadas ?? 0, label: "Publicadas",   sub: "activas ahora", accent: C.green, Icon: CheckCircle },
    { value: kpis?.obras_pendientes ?? 0, label: "Pendientes",   sub: "por revisar",   accent: C.gold,  Icon: Clock       },
    { value: kpis?.obras_rechazadas ?? 0, label: "Rechazadas",   sub: "este período",  accent: C.red,   Icon: XCircle     },
  ];
  return (
    <>
      {cards.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background: C.card, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden", boxShadow: CS, transition: "transform .2s, box-shadow .2s", cursor: "default", animation: `fadeUp .45s ease ${i * 0.06}s both` }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.08)`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = CS; }}>
          <div style={{ position: "absolute", top: 0, left: 16, right: 16, height: 2.5, background: accent, borderRadius: 2 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} color={accent} strokeWidth={2} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: loading ? C.creamMut : C.cream, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 5, fontFamily: FM, transition: "color .3s" }}>
            {loading ? "—" : fmt(value)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.creamSub, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>{sub}</div>
        </div>
      ))}
    </>
  );
}
```

Note: `KpiCards` now renders fragments (no wrapping div) — the bento grid row in the root component will provide the container. See Task 8.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

---

## Task 5: Rewrite `StatStrip`

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `StatStrip` component (~line 437)

- [ ] **Step 1: Rewrite `StatStrip` for light theme**

Key changes:
- `C.card` background, `CS` shadow, `C.border` border
- `FD` → `FM` for numbers, `FB` for labels
- Accent colors updated to light palette: `C.pink`→`C.pink`, `C.blue`, `C.purple`

```tsx
function StatStrip({ strip, loading }: { strip: Record<string, number> | null; loading: boolean }) {
  const items = [
    { value: strip?.artistas_activos ?? 0, label: "Artistas activos", sub: "en la plataforma", accent: C.pink,   Icon: Users   },
    { value: strip?.categorias       ?? 0, label: "Categorías",       sub: "tipos de arte",    accent: C.blue,   Icon: Package },
    { value: strip?.visitas_total    ?? 0, label: "Visitas totales",  sub: "a la galería",     accent: C.purple, Icon: Eye     },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {items.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background: C.card, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: CS, transition: "transform .2s", cursor: "default", animation: `fadeUp .5s ease ${0.25 + i * 0.08}s both` }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} color={accent} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: loading ? C.creamMut : C.cream, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 3, fontFamily: FM, transition: "color .3s" }}>
              {loading ? "—" : fmt(Number(value))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>{label}</div>
            <div style={{ fontSize: 11.5, color: C.creamSub, fontFamily: FB }}>{sub}</div>
          </div>
          <ArrowUpRight size={14} color={accent} style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} />
          {/* Note: ArrowUpRight import is kept because StatStrip uses it */}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

---

## Task 6: Replace `ChartSection` with `DonutChart`

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — delete `ChartSection` (~line 310), add `DonutChart`

- [ ] **Step 1: Delete the entire `ChartSection` function**

Remove lines approximately 310–373 (the full `ChartSection` component).

- [ ] **Step 2: Add `DonutChart` component**

Insert this component in place of `ChartSection`:

```tsx
// ── DonutChart — Distribución de obras ────────────────────────────────────────
function DonutChart({ kpis, loading }: { kpis: Record<string, number> | null; loading: boolean }) {
  const total    = kpis?.total_obras      ?? 0;
  const pub      = kpis?.obras_publicadas ?? 0;
  const pend     = kpis?.obras_pendientes ?? 0;
  const rech     = kpis?.obras_rechazadas ?? 0;
  const agotadas = Math.max(0, total - pub - pend - rech);

  const segments = [
    { name: "Publicadas", value: pub,      color: C.green,    sub: "activas" },
    { name: "Pendientes", value: pend,     color: C.gold,     sub: "en revisión" },
    { name: "Rechazadas", value: rech,     color: C.red,      sub: "sin publicar" },
    ...(agotadas > 0 ? [{ name: "Agotadas", value: agotadas, color: C.creamMut, sub: "sin stock" }] : []),
  ].filter(s => s.value > 0);

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", boxShadow: CS, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: FB }}>Distribución de obras</div>
        <div style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Por estado en el catálogo</div>
      </div>

      {loading || !kpis ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 160, height: 160, borderRadius: "50%", border: `16px solid ${C.border}` }} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
          <div style={{ width: 160, height: 160, flexShrink: 0, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {segments.map((s, i) => (
                    <Cell key={`cell-${i}`} fill={s.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: FM, fontSize: 18, fontWeight: 700, fill: C.cream }}>
                  {fmt(total)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {segments.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, fontFamily: FB }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>{s.sub}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: FM, letterSpacing: "-0.02em" }}>
                  {fmt(s.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors. `recharts` Pie/Cell/PieChart types resolve correctly.

---

## Task 7: Rewrite `ObrasRecientes` and `AccionesRapidas`

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `ObrasRecientes` (~line 376) and `AccionesRapidas` (~line 221)

- [ ] **Step 1: Rewrite `ObrasRecientes` for light theme**

Key changes:
- `C.card` background, `CS` shadow
- `FD` → `FB` for titles
- Skeleton loading bars: `C.bg` background
- Row hover: `C.bg` background
- "Ver todas" link: `C.blue` color on hover

```tsx
function ObrasRecientes({ obras, loading, navigate }: { obras: ObraReciente[]; loading: boolean; navigate: (p: string) => void }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", boxShadow: CS }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: FB }}>Obras recientes</div>
          <div style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Últimas subidas al catálogo</div>
        </div>
        <button onClick={() => navigate("/admin/obras")}
          style={{ display: "flex", alignItems: "center", gap: 3, background: "transparent", border: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          Ver todas <ChevronRight size={11} />
        </button>
      </div>
      <div style={{ height: 1, background: C.border, marginBottom: 10 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 6px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: C.bg, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: C.bg, borderRadius: 3, marginBottom: 5, width: "68%" }} />
                <div style={{ height: 8, background: C.bg, borderRadius: 3, width: "46%" }} />
              </div>
              <div style={{ width: 64, height: 20, background: C.bg, borderRadius: 20 }} />
            </div>
          ))
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.creamMut, fontSize: 13, fontFamily: FB }}>
            <Layers size={22} color={C.creamMut} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>Sin obras aún</div>
          </div>
        ) : obras.slice(0, 5).map((obra, i) => {
          const cfg = statusCfg[obra.estado] || statusCfg.pendiente;
          return (
            <div key={obra.id_obra}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 8px", borderRadius: 8, cursor: "pointer", transition: "background .12s", borderBottom: i < Math.min(obras.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}>
              <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: C.bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}` }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <Image size={14} color={C.creamMut} strokeWidth={1.8} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FB }}>{obra.titulo}</div>
                <div style={{ fontSize: 11.5, color: C.creamSub, fontFamily: FB, marginTop: 2 }}>{obra.artista_alias || obra.artista_nombre}</div>
              </div>
              <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, fontWeight: 700, background: `${cfg.color}12`, color: cfg.color, flexShrink: 0, border: `1px solid ${cfg.color}28`, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FB }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `AccionesRapidas` for light theme**

Key changes:
- Grid: `repeat(3,1fr)` instead of `repeat(5,1fr)`
- Button backgrounds: `C.bg` + `border: 1px solid C.border` — no gradients
- Icon box: `${color}18` tint (same as AdminMonitoreo AccionesRapidas)
- Remove `ArrowUpRight` corner icon

```tsx
function AccionesRapidas({ navigate }: { navigate: (p: string) => void }) {
  const acciones = [
    { label: "Pendientes",    sub: "Revisar solicitudes",  Icon: Clock,     color: C.gold,   path: "/admin/obras?estado=pendiente" },
    { label: "Artistas",      sub: "Gestionar artistas",   Icon: Users,     color: C.pink,   path: "/admin/artistas" },
    { label: "Reportes",      sub: "Ver métricas",         Icon: BarChart2, color: C.blue,   path: "/admin/reportes" },
    { label: "Importar",      sub: "Cargar datos externos",Icon: Upload,    color: C.purple, path: "/admin/importar" },
    { label: "Estadísticas",  sub: "Análisis completo",    Icon: Activity,  color: C.green,  path: "/admin/estadisticas" },
    { label: "Sobre nosotros",sub: "Editar contenido",     Icon: FileText,  color: C.green,  path: "/admin/sobre-nosotros" },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.creamMut, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FB, marginBottom: 10 }}>
        Acciones rápidas
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {acciones.map(({ label, sub, Icon, color, path }, i) => (
          <button key={label} onClick={() => navigate(path)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, cursor: "pointer", transition: "all .2s", fontFamily: FB, textAlign: "left", animation: `fadeUp .45s ease ${i * 0.05}s both` }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = `${color}40`;
              el.style.boxShadow = `0 4px 14px ${color}12`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.border;
              el.style.boxShadow = "none";
            }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, marginBottom: 2, lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: C.creamMut }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

---

## Task 8: Assemble bento grid layout and update `<style>` block

**Files:**
- Modify: `src/pages/private/admin/AdminDashboard.tsx` — `AdminDashboard` root function (~line 469) and the `<style>` block

- [ ] **Step 1: Update the `<style>` block**

Replace the existing `<style>` block with:

```tsx
<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#E6E4EF; border-radius:10px; }
  ::-webkit-scrollbar-thumb:hover { background:#9896A8; }
`}</style>
```

- [ ] **Step 2: Rewrite the `main` layout**

Replace the `<main>` block and its children with the bento grid structure:

```tsx
<main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto", background: C.bg }}>
  {/* Alerta compacta */}
  {(stats?.kpis?.obras_pendientes ?? 0) > 0 && (
    <div style={{ marginBottom: 14 }}>
      <AlertaPendientes count={stats!.kpis.obras_pendientes} navigate={navigate} />
    </div>
  )}

  {/* Fila 1: WelcomeBanner (2fr) + 4 KPI cards (1fr cada una) */}
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14, alignItems: "stretch" }}>
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <WelcomeBanner userName={userName} />
    </div>
    <KpiCards kpis={stats?.kpis ?? null} loading={loading} />
  </div>

  {/* Fila 2: StatStrip — ancho completo */}
  <div style={{ marginBottom: 14 }}>
    <StatStrip strip={stats?.strip ?? null} loading={loading} />
  </div>

  {/* Fila 3: DonutChart (1fr) + columna derecha: ObrasRecientes + AccionesRapidas (1fr) */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <DonutChart kpis={stats?.kpis ?? null} loading={loading} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ObrasRecientes obras={stats?.obras_recientes || []} loading={loading} navigate={navigate} />
      <AccionesRapidas navigate={navigate} />
    </div>
  </div>
</main>
```

- [ ] **Step 3: Final full verify**

Run both commands:
```bash
npx tsc --noEmit
npx eslint src/pages/private/admin/AdminDashboard.tsx --max-warnings=0
```
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Start dev server and visually inspect**

Run: `npm run dev`
Navigate to `http://localhost:5173` → log in as admin → go to Dashboard.

Verify:
- Light background (`#F9F8FC`) throughout
- Row 1: WelcomeBanner taking ~40% width, 4 KPI cards filling the rest
- Row 2: 3 StatStrip cards spanning full width
- Row 3 left: Donut chart with colored segments and center number
- Row 3 right top: ObrasRecientes list with thumbnails
- Row 3 right bottom: AccionesRapidas 3×2 grid
- No emojis anywhere
- Refresh spinner animates on load
- AlertaPendientes bar visible if there are pending obras
- All fonts: Outfit for text, JetBrains Mono for numbers
