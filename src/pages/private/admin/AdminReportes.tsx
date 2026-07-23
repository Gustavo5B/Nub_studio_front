// src/pages/private/admin/AdminReportes.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, Download, RefreshCw, ChevronRight,
  TrendingUp, DollarSign, ShoppingBag, Activity,
  Clock, Users, Layers, FileSpreadsheet,
  Trophy, Medal, FileText, Calendar, Package,
  CheckSquare, Square,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart as RBarChart, Bar,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  blue: "#2D6FBE", gold: "#A87006", green: "#0E8A50",
  red: "#C4304A", cream: "#14121E", creamSub: "#5A5870",
  creamMut: "#9896A8", bg: "#F9F8FC", card: "#FFFFFF",
  border: "#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const YEAR = new Date().getFullYear();

const fmtN  = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const fmtM  = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const fmtD  = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const fmtK  = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

// ── Types ─────────────────────────────────────────────────────────────────────
type PeriodoKey = "hoy" | "7d" | "mes" | "90d" | "año" | "custom";

interface Periodo { desde: string; hasta: string; }

interface KPIData {
  ingresos_totales: number; obras_vendidas: number; ticket_promedio: number;
  comisiones_pendientes: number; artistas_activos: number; obras_activas: number;
}
interface VentaMes { mes: string; mes_num: number; cantidad: number; total: number; }
interface IngresoComision {
  mes: string; ingresos: number; neto_artistas: number; comision_plataforma: number;
}
interface TopObra {
  id_obra: number; titulo: string; imagen_principal: string | null;
  artista: string; total_ventas: number; ingresos: number;
}
interface TopArtista {
  id_artista: number; nombre_completo: string; nombre_artistico: string | null;
  foto_perfil: string | null; porcentaje_comision: number;
  ventas_totales: number; comisiones_generadas: number;
  neto_artista: number; comisiones_pendientes: number;
}
interface TooltipItem { color: string; name: string; value: number; }

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }

// ── Período helpers ───────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function calcPeriodo(key: PeriodoKey, custom?: Periodo): Periodo {
  const today = new Date();
  const todayStr = fmtISO(today);
  if (key === "hoy")  return { desde: todayStr, hasta: todayStr };
  if (key === "7d")   { const d = new Date(today); d.setDate(d.getDate() - 6); return { desde: fmtISO(d), hasta: todayStr }; }
  if (key === "mes")  { const d = new Date(today.getFullYear(), today.getMonth(), 1); return { desde: fmtISO(d), hasta: todayStr }; }
  if (key === "90d")  { const d = new Date(today); d.setDate(d.getDate() - 89); return { desde: fmtISO(d), hasta: todayStr }; }
  if (key === "año")  return { desde: `${today.getFullYear()}-01-01`, hasta: todayStr };
  return custom ?? { desde: `${today.getFullYear()}-01-01`, hasta: todayStr };
}

const PERIODOS: { key: PeriodoKey; label: string }[] = [
  { key: "hoy",    label: "Hoy"          },
  { key: "7d",     label: "7 días"       },
  { key: "mes",    label: "Este mes"     },
  { key: "90d",    label: "90 días"      },
  { key: "año",    label: "Este año"     },
  { key: "custom", label: "Personalizado"},
];

// ── PDF generator ─────────────────────────────────────────────────────────────
function generarPDF(
  kpis: KPIData | null,
  topObras: TopObra[],
  topArtistas: TopArtista[],
  ventasMes: VentaMes[],
  periodo: Periodo,
) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte NU★B Studio · ${fmtD(periodo.desde)} — ${fmtD(periodo.hasta)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Outfit',sans-serif;color:#14121E;background:#fff;padding:48px 56px;font-size:13px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E8640C;padding-bottom:20px;margin-bottom:32px}
  .logo{font-size:30px;font-weight:800;letter-spacing:-0.03em}
  .logo span{color:#E8640C}
  .sub{font-size:12px;color:#9896A8;margin-top:3px}
  .period{text-align:right}
  .period-label{font-size:10px;font-weight:700;color:#9896A8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
  .period-val{font-size:14px;font-weight:700;color:#14121E}
  .section{margin-bottom:36px}
  .sec-title{font-size:11px;font-weight:700;color:#9896A8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #E6E4EF}
  .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .kpi{background:#F9F8FC;border-radius:10px;padding:16px 18px;border-left:3px solid #E8640C}
  .kpi-v{font-size:22px;font-weight:700;font-family:monospace;letter-spacing:-0.02em}
  .kpi-l{font-size:10px;font-weight:600;color:#9896A8;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
  .chart-row{display:flex;gap:8px;align-items:flex-end;margin-top:8px}
  .bar{background:#E8640C;border-radius:3px 3px 0 0;min-width:28px;flex:1;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px}
  .bar-lbl{font-size:9px;color:#fff;font-weight:600}
  .bar-wrap{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1}
  .bar-mes{font-size:9px;color:#9896A8}
  table{width:100%;border-collapse:collapse}
  th{background:#F9F8FC;padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#9896A8;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #E6E4EF}
  td{padding:9px 12px;border-bottom:1px solid #F0EEF8;font-size:12px}
  .rank{font-weight:800;color:#E8640C;font-family:monospace;font-size:15px}
  .money{font-weight:700;color:#E8640C}
  .chip{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:#E8640C18;color:#E8640C}
  .ftr{margin-top:40px;padding-top:16px;border-top:1px solid #E6E4EF;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9896A8}
  .ftr strong{color:#E8640C;font-weight:800}
  @media print{body{padding:20px 28px}@page{margin:15mm}}
</style>
</head>
<body>
<div class="hdr">
  <div>
    <div class="logo">NU<span>★</span>B Studio</div>
    <div class="sub">Galería Altar · Panel Administrativo</div>
  </div>
  <div class="period">
    <div class="period-label">Período del reporte</div>
    <div class="period-val">${fmtD(periodo.desde)} — ${fmtD(periodo.hasta)}</div>
  </div>
</div>

${kpis ? `
<div class="section">
  <div class="sec-title">Indicadores clave del período</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-v">${fmtM(kpis.ingresos_totales)}</div><div class="kpi-l">Ingresos totales</div></div>
    <div class="kpi"><div class="kpi-v">${fmtN(kpis.obras_vendidas)}</div><div class="kpi-l">Obras vendidas</div></div>
    <div class="kpi"><div class="kpi-v">${fmtM(kpis.ticket_promedio)}</div><div class="kpi-l">Ticket promedio</div></div>
    <div class="kpi" style="border-left-color:#A87006"><div class="kpi-v">${fmtM(kpis.comisiones_pendientes)}</div><div class="kpi-l">Pendiente por liquidar</div></div>
    <div class="kpi" style="border-left-color:#A83B90"><div class="kpi-v">${fmtN(kpis.artistas_activos)}</div><div class="kpi-l">Artistas activos</div></div>
    <div class="kpi" style="border-left-color:#6028AA"><div class="kpi-v">${fmtN(kpis.obras_activas)}</div><div class="kpi-l">Obras publicadas</div></div>
  </div>
</div>` : ""}

${ventasMes.length > 0 ? (() => {
  const maxTotal = Math.max(...ventasMes.map(v => Number(v.total)));
  return `
<div class="section">
  <div class="sec-title">Ventas mensuales ${YEAR}</div>
  <div class="chart-row">
    ${ventasMes.map(v => {
      const h = Math.round((Number(v.total) / (maxTotal || 1)) * 80);
      return `<div class="bar-wrap"><div class="bar" style="height:${Math.max(h, 6)}px"><span class="bar-lbl">${Math.round(Number(v.total)/1000)}k</span></div><div class="bar-mes">${v.mes}</div></div>`;
    }).join("")}
  </div>
</div>`;
})() : ""}

${topObras.length > 0 ? `
<div class="section">
  <div class="sec-title">Top ${topObras.length} obras por ingresos</div>
  <table>
    <thead><tr><th>#</th><th>Obra</th><th>Artista</th><th style="text-align:center">Ventas</th><th style="text-align:right">Ingresos</th></tr></thead>
    <tbody>
      ${topObras.map((o, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td><strong>${o.titulo}</strong></td>
          <td>${o.artista}</td>
          <td style="text-align:center">${o.total_ventas}</td>
          <td style="text-align:right" class="money">${fmtM(Number(o.ingresos))}</td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

${topArtistas.length > 0 ? `
<div class="section">
  <div class="sec-title">Top ${topArtistas.length} artistas por neto generado</div>
  <table>
    <thead><tr><th>#</th><th>Artista</th><th style="text-align:center">Ventas</th><th style="text-align:right">Neto artista</th><th style="text-align:right">Pendiente pago</th></tr></thead>
    <tbody>
      ${topArtistas.map((a, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td><strong>${a.nombre_artistico || a.nombre_completo}</strong><br><span style="font-size:10px;color:#9896A8">${a.porcentaje_comision}% comisión plataforma</span></td>
          <td style="text-align:center">${a.ventas_totales}</td>
          <td style="text-align:right" class="money">${fmtM(Number(a.neto_artista))}</td>
          <td style="text-align:right;color:#A87006">${fmtM(Number(a.comisiones_pendientes))}</td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<div class="ftr">
  <div><strong>NU★B Studio</strong> · Galería Altar · Panel Administrativo</div>
  <div>Generado el ${new Date().toLocaleString("es-MX", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
</div>

<script>
  if (document.fonts) {
    document.fonts.ready.then(() => setTimeout(() => window.print(), 400));
  } else {
    setTimeout(() => window.print(), 800);
  }
</script>
</body></html>`;

  const w = window.open("", "_blank", "width=960,height=720");
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, fontFamily: FB }}>
      <span style={{ flex: 1, height: 1, background: C.border }} />
      {children}
      <span style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
function FilterBar({
  periodoKey, setPeriodoKey, periodo, setCustom, loading,
}: {
  periodoKey: PeriodoKey;
  setPeriodoKey: (k: PeriodoKey) => void;
  periodo: Periodo;
  setCustom: (p: Periodo) => void;
  loading: boolean;
}) {
  const [customDesde, setCustomDesde] = useState(periodo.desde);
  const [customHasta, setCustomHasta] = useState(periodo.hasta);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <Calendar size={12} color={C.creamMut} style={{ marginRight: 2 }} />
      {PERIODOS.filter(p => p.key !== "custom").map(p => {
        const active = periodoKey === p.key;
        return (
          <button key={p.key} onClick={() => setPeriodoKey(p.key)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: "pointer", border: "none", fontFamily: FB, transition: "all .15s",
              background: active ? C.orange : "transparent",
              color: active ? "#fff" : C.creamSub,
            }}>
            {p.label}
          </button>
        );
      })}
      <button onClick={() => setPeriodoKey("custom")}
        style={{
          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: periodoKey === "custom" ? 700 : 500,
          cursor: "pointer", border: "none", fontFamily: FB, transition: "all .15s",
          background: periodoKey === "custom" ? C.orange : "transparent",
          color: periodoKey === "custom" ? "#fff" : C.creamSub,
        }}>
        Personalizado
      </button>

      {periodoKey === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
          <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)}
            style={{ padding: "3px 8px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FB, color: C.cream, background: C.bg }} />
          <span style={{ fontSize: 12, color: C.creamMut }}>—</span>
          <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)}
            style={{ padding: "3px 8px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FB, color: C.cream, background: C.bg }} />
          <button onClick={() => setCustom({ desde: customDesde, hasta: customHasta })}
            style={{ padding: "4px 11px", borderRadius: 7, border: "none", background: C.orange, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
            Aplicar
          </button>
        </div>
      )}

      {loading && <RefreshCw size={11} color={C.orange} style={{ animation: "spin 1s linear infinite", marginLeft: 4 }} />}

      {periodoKey !== "custom" && (
        <span style={{ fontSize: 11, color: C.creamMut, marginLeft: 6, fontFamily: FB }}>
          {fmtD(periodo.desde)} — {fmtD(periodo.hasta)}
        </span>
      )}
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────
function KPIStrip({ kpis, loading }: { kpis: KPIData | null; loading: boolean }) {
  const items = [
    { label: "Ingresos del período", value: fmtM(kpis?.ingresos_totales ?? 0),    icon: DollarSign,  accent: C.orange },
    { label: "Obras vendidas",       value: fmtN(kpis?.obras_vendidas ?? 0),        icon: ShoppingBag, accent: C.green  },
    { label: "Ticket promedio",      value: fmtM(kpis?.ticket_promedio ?? 0),       icon: TrendingUp,  accent: C.blue   },
    { label: "Pend. por liquidar",   value: fmtM(kpis?.comisiones_pendientes ?? 0), icon: Clock,       accent: C.gold   },
    { label: "Artistas activos",     value: fmtN(kpis?.artistas_activos ?? 0),      icon: Users,       accent: C.pink   },
    { label: "Obras publicadas",     value: fmtN(kpis?.obras_activas ?? 0),         icon: Layers,      accent: C.purple },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
      {items.map(({ label, value, icon: Icon, accent }, i) => (
        <div key={label} style={{ background: C.card, borderRadius: 12, padding: "14px 15px 12px", boxShadow: CS, borderTop: `2.5px solid ${accent}`, animation: `fadeUp .3s ease ${i * 0.04}s both` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={11} color={accent} strokeWidth={2.2} />
            </div>
          </div>
          <div style={{ fontSize: loading ? 14 : 20, fontWeight: 700, color: loading ? C.creamMut : C.cream, fontFamily: FM, letterSpacing: "-0.02em", marginBottom: 4 }}>
            {loading ? "—" : value}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CTip({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontFamily: FB, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: C.creamMut }}>{p.name}:</span>
          <strong style={{ color: C.cream, fontFamily: FM }}>{fmtM(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Charts ─────────────────────────────────────────────────────────────────────
function Charts({ ventasMes, ingresos }: { ventasMes: VentaMes[]; ingresos: IngresoComision[] }) {
  const grid = <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />;
  const ax   = { stroke: "transparent" as const, tick: { fill: C.creamMut, fontSize: 10, fontFamily: FB } };
  const axY  = { ...ax, width: 38, tickFormatter: fmtK };

  const empty = (
    <div style={{ height: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.4 }}>
      <Activity size={18} color={C.creamMut} />
      <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>Sin datos aún</span>
    </div>
  );

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px 20px 14px", boxShadow: CS, marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Ventas por mes */}
        <div style={{ paddingRight: 20, borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FB, marginBottom: 2 }}>Ventas por mes</div>
          <div style={{ fontSize: 11, color: C.creamMut, marginBottom: 14 }}>Año {YEAR} · total MXN</div>
          {ventasMes.length === 0 ? empty : (
            <ResponsiveContainer width="100%" height={170}>
              <RBarChart data={ventasMes} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                {grid}
                <XAxis dataKey="mes" {...ax} />
                <YAxis {...axY} />
                <Tooltip content={<CTip />} cursor={{ fill: `${C.orange}08` }} />
                <Bar dataKey="total" name="Total" fill={C.orange} radius={[3, 3, 0, 0]} fillOpacity={0.9} />
              </RBarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Ingresos vs Artistas */}
        <div style={{ paddingLeft: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FB, marginBottom: 2 }}>Ingresos vs Neto artistas</div>
          <div style={{ fontSize: 11, color: C.creamMut, marginBottom: 14 }}>Año {YEAR} · plataforma vs artistas</div>
          {ingresos.length === 0 ? empty : (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={ingresos} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.2} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.14} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient>
                </defs>
                {grid}
                <XAxis dataKey="mes" {...ax} />
                <YAxis {...axY} />
                <Tooltip content={<CTip />} />
                <Area type="monotone" dataKey="ingresos"      name="Ingresos"      stroke={C.orange} strokeWidth={2}   fill="url(#gO)" dot={false} />
                <Area type="monotone" dataKey="neto_artistas" name="Neto artistas" stroke={C.purple} strokeWidth={1.8} fill="url(#gP)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TopRankings ───────────────────────────────────────────────────────────────
function TopRankings({ topObras, topArtistas }: { topObras: TopObra[]; topArtistas: TopArtista[] }) {
  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy size={11} color={C.gold} strokeWidth={2} />;
    if (i === 1) return <Medal size={11} color="#9BA7B0" strokeWidth={2} />;
    if (i === 2) return <Medal size={11} color="#B87333" strokeWidth={2} />;
    return <span style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, fontFamily: FM, minWidth: 12, textAlign: "center" }}>{i + 1}</span>;
  };

  const RankRow = ({ gold, children }: { gold?: boolean; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 9px", borderRadius: 8, background: gold ? `${C.gold}08` : C.bg, border: `1px solid ${gold ? C.gold + "22" : C.border}`, marginBottom: 5 }}>
      {children}
    </div>
  );

  const noData = (
    <div style={{ textAlign: "center", padding: "24px 0", color: C.creamMut, fontSize: 12, fontFamily: FB }}>
      Sin datos para este período
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* Top Obras */}
      <div style={{ background: C.card, borderRadius: 14, padding: "16px 18px", boxShadow: CS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.orange}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={12} color={C.orange} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.cream, fontFamily: FB }}>Top Obras</div>
            <div style={{ fontSize: 10.5, color: C.creamMut }}>por ingresos del período</div>
          </div>
        </div>
        {topObras.length === 0 ? noData : topObras.slice(0, 6).map((o, i) => (
          <RankRow key={o.id_obra} gold={i === 0}>
            <div style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0 }}>{rankIcon(i)}</div>
            {o.imagen_principal && (
              <img src={o.imagen_principal} alt="" style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover", flexShrink: 0 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.titulo}</div>
              <div style={{ fontSize: 10.5, color: C.creamMut }}>{o.artista} · {o.total_ventas} venta{o.total_ventas !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.orange, fontFamily: FM, flexShrink: 0 }}>{fmtM(Number(o.ingresos))}</div>
          </RankRow>
        ))}
      </div>

      {/* Top Artistas */}
      <div style={{ background: C.card, borderRadius: 14, padding: "16px 18px", boxShadow: CS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.pink}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={12} color={C.pink} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.cream, fontFamily: FB }}>Top Artistas</div>
            <div style={{ fontSize: 10.5, color: C.creamMut }}>por neto generado del período</div>
          </div>
        </div>
        {topArtistas.length === 0 ? noData : topArtistas.slice(0, 6).map((a, i) => (
          <RankRow key={a.id_artista} gold={i === 0}>
            <div style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0 }}>{rankIcon(i)}</div>
            {a.foto_perfil ? (
              <img src={a.foto_perfil} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.pink}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.pink }}>{(a.nombre_artistico || a.nombre_completo).charAt(0)}</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nombre_artistico || a.nombre_completo}</div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 10.5, color: C.creamMut }}>{a.ventas_totales} venta{a.ventas_totales !== 1 ? "s" : ""}</span>
                {Number(a.comisiones_pendientes) > 0 && (
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: C.gold, background: `${C.gold}14`, borderRadius: 4, padding: "1px 5px" }}>pend.</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.pink, fontFamily: FM, flexShrink: 0 }}>{fmtM(Number(a.neto_artista))}</div>
          </RankRow>
        ))}
      </div>
    </div>
  );
}

// ── ReportGenerator ───────────────────────────────────────────────────────────
type RFormat = "excel" | "pdf";

const REPORT_ITEMS = [
  { id: "ventas",                  label: "Ventas detalladas",   desc: "Cada transacción con fechas, obra y totales", icon: ShoppingBag,    accent: C.orange },
  { id: "financiero",              label: "Resumen financiero",  desc: "Ingresos, comisiones y neto por período",    icon: TrendingUp,     accent: C.purple },
  { id: "artistas",                label: "Artistas",            desc: "Nombre, obras, ventas y comisiones",         icon: Users,          accent: C.pink   },
  { id: "catalogo",                label: "Catálogo de obras",   desc: "Ficha completa de cada obra",                icon: Layers,         accent: C.blue   },
  { id: "obras-plantilla-vacia",   label: "Plantilla obras",     desc: "Excel vacío con validaciones para importar", icon: FileSpreadsheet, accent: C.gold  },
  { id: "artistas-plantilla-vacia",label: "Plantilla artistas",  desc: "Excel vacío con validaciones para importar", icon: Package,         accent: C.gold  },
];

function ReportGenerator({
  kpis, topObras, topArtistas, ventasMes, periodo, onExportXlsx, exporting,
}: {
  kpis: KPIData | null; topObras: TopObra[]; topArtistas: TopArtista[];
  ventasMes: VentaMes[]; periodo: Periodo;
  onExportXlsx: (ids: string[], periodo: Periodo) => Promise<void>;
  exporting: boolean;
}) {
  const [format, setFormat]     = useState<RFormat>("excel");
  const [checked, setChecked]   = useState<Set<string>>(new Set(["ventas", "financiero", "artistas", "catalogo"]));
  const [generating, setGenerating] = useState(false);

  const toggle = (id: string) =>
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleGenerar = async () => {
    if (format === "pdf") { generarPDF(kpis, topObras, topArtistas, ventasMes, periodo); return; }
    const ids = REPORT_ITEMS.map(r => r.id).filter(id => checked.has(id));
    if (!ids.length) return;
    setGenerating(true);
    await onExportXlsx(ids, periodo);
    setGenerating(false);
  };

  const busy = generating || exporting;
  const canGenerate = format === "pdf" || checked.size > 0;

  const fmtBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 0", borderRadius: 8,
    border: `1.5px solid ${active ? C.orange : C.border}`,
    background: active ? `${C.orange}10` : "transparent",
    color: active ? C.orange : C.creamMut,
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FB,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s",
  });

  return (
    <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: CS }}>
      {/* Header stripe */}
      <div style={{ background: C.cream, padding: "16px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: FB, marginBottom: 3 }}>Generar reporte</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: FB }}>
          {fmtD(periodo.desde)} — {fmtD(periodo.hasta)}
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Format toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button style={fmtBtn(format === "excel")} onClick={() => setFormat("excel")}>
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button style={fmtBtn(format === "pdf")} onClick={() => setFormat("pdf")}>
            <FileText size={13} /> PDF
          </button>
        </div>

        {/* Description */}
        <div style={{ fontSize: 11.5, color: C.creamSub, fontFamily: FB, background: C.bg, borderRadius: 8, padding: "9px 12px", marginBottom: 16, border: `1px solid ${C.border}`, lineHeight: 1.5 }}>
          {format === "excel"
            ? "Descarga archivos .xlsx con portada de marca, filtros y formato profesional."
            : "Vista previa en el navegador. Usa Imprimir → Guardar como PDF para exportar."}
        </div>

        {/* Content selector */}
        {format === "excel" && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Contenido a incluir
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
              {REPORT_ITEMS.map(({ id, label, desc, icon: Icon, accent }) => {
                const active = checked.has(id);
                return (
                  <div key={id} onClick={() => toggle(id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${active ? accent + "44" : C.border}`, background: active ? `${accent}05` : C.bg, cursor: "pointer", transition: "all .12s" }}>
                    <div style={{ flexShrink: 0 }}>
                      {active
                        ? <CheckSquare size={14} color={accent} strokeWidth={2} />
                        : <Square size={14} color={C.creamMut} strokeWidth={1.5} />}
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={11} color={accent} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? C.cream : C.creamSub, fontFamily: FB }}>{label}</div>
                      <div style={{ fontSize: 10.5, color: C.creamMut, lineHeight: 1.3 }}>{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Generate button */}
        <button onClick={handleGenerar} disabled={busy || !canGenerate}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: busy || !canGenerate ? C.border : C.orange,
            color: busy || !canGenerate ? C.creamMut : "#fff",
            fontSize: 13.5, fontWeight: 700, cursor: busy || !canGenerate ? "default" : "pointer",
            fontFamily: FB, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all .2s",
          }}>
          {busy
            ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generando…</>
            : format === "excel"
              ? <><Download size={14} /> {checked.size > 1 ? `Descargar ${checked.size} archivos` : "Descargar Excel"}</>
              : <><FileText size={14} /> Abrir vista previa PDF</>}
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminReportes() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [periodoKey,  setPeriodoKeyRaw] = useState<PeriodoKey>("mes");
  const [customP,     setCustomP]       = useState<Periodo>(() => calcPeriodo("mes"));
  const periodo = periodoKey === "custom" ? customP : calcPeriodo(periodoKey);

  const [kpis,         setKpis]       = useState<KPIData | null>(null);
  const [ventasMes,    setVentasMes]  = useState<VentaMes[]>([]);
  const [ingresos,     setIngresos]   = useState<IngresoComision[]>([]);
  const [topObras,     setTopObras]   = useState<TopObra[]>([]);
  const [topArtistas,  setTopArtistas]= useState<TopArtista[]>([]);
  const [loadingKpis,  setLoadingKpis]= useState(true);
  const [exporting,    setExporting]  = useState(false);

  const load = useCallback(async () => {
    setLoadingKpis(true);
    const { desde, hasta } = periodo;
    const qp = new URLSearchParams({ desde, hasta });
    try {
      const [kR, vR, iR, toR, taR] = await Promise.all([
        fetch(`${API}/api/reportes/kpis?${qp}`,                { headers: authH() }),
        fetch(`${API}/api/reportes/ventas-por-mes`,             { headers: authH() }),
        fetch(`${API}/api/reportes/ingresos-vs-comisiones`,     { headers: authH() }),
        fetch(`${API}/api/reportes/top-obras?${qp}`,            { headers: authH() }),
        fetch(`${API}/api/reportes/top-artistas?${qp}`,         { headers: authH() }),
      ]);
      const [kJ, vJ, iJ, toJ, taJ] = await Promise.all([kR.json(), vR.json(), iR.json(), toR.json(), taR.json()]);
      if (kJ.success)  setKpis(kJ.data);
      if (vJ.success)  setVentasMes(vJ.data);
      if (iJ.success)  setIngresos(iJ.data);
      if (toJ.success) setTopObras(toJ.data);
      if (taJ.success) setTopArtistas(taJ.data);
    } catch { /* silencioso */ }
    finally  { setLoadingKpis(false); }
  }, [periodo.desde, periodo.hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleExportXlsx = async (ids: string[], p: Periodo) => {
    const pathMap: Record<string, string> = { catalogo: "catalogo-obras" };
    setExporting(true);
    for (const id of ids) {
      try {
        const urlPath = pathMap[id] ?? id;
        const qp = new URLSearchParams({ desde: p.desde, hasta: p.hasta });
        const res = await fetch(`${API}/api/reportes/exportar/${urlPath}?${qp}`, { headers: authH() });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const a    = document.createElement("a");
        a.href     = URL.createObjectURL(blob);
        const cd   = res.headers.get("Content-Disposition") || "";
        const m    = cd.match(/filename="?([^"]+)"?/);
        a.download = m?.[1] || `reporte-${id}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch { showToast(`Error al exportar ${id}`, "err"); }
    }
    setExporting(false);
    if (ids.length > 1) showToast(`${ids.length} reportes descargados`, "ok");
    else showToast("Reporte descargado correctamente", "ok");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", height: 52, background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.09em", textTransform: "uppercase" }}>Admin</span>
          <ChevronRight size={11} color={C.creamMut} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.cream }}>Reportes</span>
        </div>
        <button onClick={() => navigate("/admin")}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.creamSub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.cream; el.style.borderColor = C.creamMut; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.creamSub; el.style.borderColor = C.border; }}>
          <BarChart2 size={12} strokeWidth={1.8} /> Dashboard
        </button>
      </div>

      <main style={{ flex: 1, padding: "18px 22px 36px", overflowY: "auto", background: C.bg, fontFamily: FB }}>

        {/* ── Header card: título + filtro integrado ── */}
        <div style={{ background: C.card, borderRadius: 13, padding: "14px 20px", boxShadow: CS, marginBottom: 16, animation: "fadeUp .35s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.cream, margin: 0, fontFamily: FB }}>Análisis &amp; Reportes</h1>
              <p style={{ fontSize: 11.5, color: C.creamMut, margin: "2px 0 0", fontFamily: FB }}>Datos en tiempo real · {YEAR}</p>
            </div>
            <button onClick={load}
              style={{ display: "flex", alignItems: "center", gap: 5, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 13px", color: C.creamSub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.orange; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
              <RefreshCw size={11} style={loadingKpis ? { animation: "spin 1s linear infinite" } : {}} /> Actualizar
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
            <FilterBar
              periodoKey={periodoKey}
              setPeriodoKey={k => setPeriodoKeyRaw(k)}
              periodo={periodo}
              setCustom={p => { setCustomP(p); setPeriodoKeyRaw("custom"); }}
              loading={loadingKpis}
            />
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <KPIStrip kpis={kpis} loading={loadingKpis} />

        {/* ── Dos columnas: analítica | generador ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14, alignItems: "start" }}>

          {/* Columna izquierda: gráficos + rankings */}
          <div>
            <SectionLabel>Gráficos del período</SectionLabel>
            <Charts ventasMes={ventasMes} ingresos={ingresos} />

            <SectionLabel>Rankings del período</SectionLabel>
            <TopRankings topObras={topObras} topArtistas={topArtistas} />
          </div>

          {/* Columna derecha: generador sticky */}
          <div style={{ position: "sticky", top: 68 }}>
            <ReportGenerator
              kpis={kpis}
              topObras={topObras}
              topArtistas={topArtistas}
              ventasMes={ventasMes}
              periodo={periodo}
              onExportXlsx={handleExportXlsx}
              exporting={exporting}
            />
          </div>
        </div>

      </main>
    </>
  );
}
