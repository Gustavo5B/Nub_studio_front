// src/pages/private/admin/AdminEstadisticas.tsx
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity, Home, Download, Calendar, TrendingUp, Clock, Users, Zap,
  ArrowUpRight, ArrowDownRight, Minus, BarChart2, Table2, X,
  PieChart as PieIcon, ChevronDown, RefreshCw, Maximize2,
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend,
  ReferenceLine,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  orange: "#E8640C", pink:  "#A83B90", purple: "#6028AA",
  blue:   "#2D6FBE", gold:  "#A87006", green:  "#0E8A50",
  ink:    "#14121E", sub:   "#5A5870", muted:  "#9896A8",
  bg:     "#F9F8FC", card:  "#FFFFFF", border: "#E6E4EF",
  red:    "#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH(): Record<string, string> {
  return { Authorization: `Bearer ${authService.getToken()}` };
}
const fmt  = (n: number) => new Intl.NumberFormat("es-MX").format(n ?? 0);
const fmtP = (n: number, total: number) =>
  total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "—";

// ── Types ──────────────────────────────────────────────────────────────────
interface ObraRef      { id: string; total: number }
interface SegmentData  { artistas: number; clientes: number; publico: number; top_obras: ObraRef[] }
interface TemporalDato { label: string; total: number }
interface TemporalData {
  unidad: string;
  max:    { label: string; total: number };
  min:    { label: string; total: number };
  datos:  TemporalDato[];
  total_periodos: number;
}
interface PrediccionPunto { periodo: string; label: string; prediccion: number; x: number }
interface ModeloInfo {
  y0: number; k: number; fase: string; ecuacion: string;
  estadisticos: { r2: number; media: number; desv_std: number };
}
interface PrediccionData {
  modelo:            ModeloInfo;
  predicciones:      PrediccionPunto[];
  periodo_analizado: string;
}
type Unidad         = "dia" | "semana" | "mes";
type Segmento       = "todos" | "artistas" | "clientes" | "publico" | string;
type ViewSegmento   = "pie" | "bar" | "table";
type ViewTemporal   = "bar" | "table";
type ViewPrediccion = "bar" | "table";

// ── ViewToggle ─────────────────────────────────────────────────────────────
type VOpt<T extends string> = { key: T; icon: LucideIcon; label: string };
function ViewToggle<T extends string>({
  value, options, onChange,
}: { value: T; options: VOpt<T>[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", background: C.bg, borderRadius: 6, padding: 3, border: `1px solid ${C.border}`, gap: 1 }}>
      {options.map(({ key, icon: Icon, label }) => {
        const on = value === key;
        return (
          <button key={key} onClick={() => onChange(key)} title={label} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
            borderRadius: 4, border: "none", cursor: "pointer",
            background: on ? C.orange : "transparent",
            color: on ? "#FFF" : C.muted,
            fontSize: 11, fontWeight: 600, fontFamily: FB,
            transition: "background .14s, color .14s",
          }}>
            <Icon size={11} /> {label}
          </button>
        );
      })}
    </div>
  );
}

// ── DataTable genérica ─────────────────────────────────────────────────────
interface ColDef<T> {
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T, i: number) => React.ReactNode;
}
function DataTable<T>({ cols, rows, emptyMsg = "Sin datos" }: {
  cols: ColDef<T>[]; rows: T[]; emptyMsg?: string;
}) {
  if (!rows.length) return (
    <div style={{ padding: "28px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FB }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {cols.map(c => (
              <th key={c.header} style={{
                padding: "9px 14px", textAlign: c.align ?? "left",
                color: C.muted, fontWeight: 700, fontSize: 10,
                textTransform: "uppercase", letterSpacing: ".06em",
                borderBottom: `1px solid ${C.border}`,
              }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {cols.map(c => (
                <td key={c.header} style={{ padding: "10px 14px", textAlign: c.align ?? "left", verticalAlign: "middle" }}>
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PanelModal genérico ────────────────────────────────────────────────────
// Abre cualquier contenido en pantalla completa con su propio toggle de vistas.
function PanelModal<T extends string>({
  open, onClose, title, icon: Icon, accent,
  viewOpts, view, onViewChange, extra, children,
}: {
  open: boolean; onClose: () => void;
  title: string; icon: LucideIcon; accent: string;
  viewOpts: VOpt<T>[]; view: T; onViewChange: (v: T) => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(20,18,30,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, backdropFilter: "blur(5px)",
    }}>
      <div style={{
        background: C.card, borderRadius: 14, width: "96%", maxWidth: 1180,
        maxHeight: "92vh", display: "flex", flexDirection: "column",
        boxShadow: "0 28px 56px rgba(0,0,0,0.30)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 22px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.bg,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} color={accent} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: FB }}>{title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {extra}
            <ViewToggle value={view} options={viewOpts} onChange={onViewChange} />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4, borderRadius: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Cuerpo con scroll */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── DateRangePicker ────────────────────────────────────────────────────────
function DateRangePicker({ desde, hasta, onChange, label = "Rango" }: {
  desde: string; hasta: string;
  onChange: (d: string, h: string) => void;
  label?: string;
}) {
  const [open,  setOpen]  = useState(false);
  const [tempD, setTempD] = useState(desde);
  const [tempH, setTempH] = useState(hasta);
  const aplicar = () => { onChange(tempD, tempH); setOpen(false); };
  const limpiar = () => { onChange("", ""); setTempD(""); setTempH(""); setOpen(false); };
  const setQuick = (d: number) => {
    const hoy = new Date(), from = new Date(hoy);
    from.setDate(hoy.getDate() - d);
    setTempD(from.toISOString().split("T")[0]);
    setTempH(hoy.toISOString().split("T")[0]);
  };
  const setMes = () => {
    const hoy = new Date();
    setTempD(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0]);
    setTempH(hoy.toISOString().split("T")[0]);
  };
  const hay = desde || hasta;
  return (
    <div style={{ position: "relative", fontFamily: FB }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
        borderRadius: 6, border: `1px solid ${hay ? C.orange : C.border}`,
        background: C.card, cursor: "pointer", fontSize: 13, fontWeight: 500,
        color: hay ? C.orange : C.sub, width: "100%",
      }}>
        <Calendar size={14} />
        {label}
        {hay
          ? <span style={{ fontSize: 11, fontFamily: FM, color: C.orange, marginLeft: 2 }}>· {desde.slice(0,10)} → {hasta.slice(0,10)}</span>
          : <ChevronDown size={12} style={{ marginLeft: "auto" }} />
        }
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Seleccionar período</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="date" value={tempD} onChange={e => setTempD(e.target.value)} style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: FB, color: C.ink }} />
              <input type="date" value={tempH} onChange={e => setTempH(e.target.value)} style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: FB, color: C.ink }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={aplicar} style={{ flex: 1, padding: "8px", borderRadius: 6, background: C.orange, color: "#FFF", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: FB }}>Aplicar</button>
              <button onClick={limpiar} style={{ padding: "8px 12px", borderRadius: 6, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: FB }}>Limpiar</button>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Accesos rápidos</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[{ l: "Hoy", fn: () => setQuick(0) }, { l: "7 días", fn: () => setQuick(7) }, { l: "30 días", fn: () => setQuick(30) }, { l: "Este mes", fn: setMes }].map(o => (
                  <button key={o.l} onClick={o.fn} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", color: C.sub, fontFamily: FB }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── KpiCard ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, accent = C.orange }: {
  label: string; value: string | number; sub?: string;
  icon: LucideIcon; trend?: number; accent?: string;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 10, padding: "18px 20px", boxShadow: CS }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={accent} />
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FM, color: trend >= 0 ? C.green : C.red, background: trend >= 0 ? `${C.green}12` : `${C.red}12`, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, fontFamily: FM, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 7 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── TimeBadge ──────────────────────────────────────────────────────────────
function TimeBadge({ label, value, type }: { label: string; value: string; type: "max" | "min" }) {
  const color = type === "max" ? C.green : C.red;
  const Icon  = type === "max" ? ArrowUpRight : ArrowDownRight;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: FM }}>{value}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTENIDOS DE PANEL — reutilizables inline y dentro de modales
// ══════════════════════════════════════════════════════════════════════════════

// ── Segmentos ──────────────────────────────────────────────────────────────
type PieEntry = { name: string; value: number; color: string };
function SegContent({ view, data, h = 220 }: { view: ViewSegmento; data: PieEntry[]; h?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cols: ColDef<PieEntry>[] = [
    { header: "Segmento", render: r => (
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: C.ink }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flexShrink: 0, display: "inline-block" }} />
        {r.name}
      </span>
    )},
    { header: "Interacciones", align: "right", render: r => (
      <span style={{ fontFamily: FM, fontWeight: 700, color: C.ink }}>{fmt(r.value)}</span>
    )},
    { header: "% del total", align: "right", render: r => {
      const pct = total > 0 ? (r.value / total * 100) : 0;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <div style={{ width: 56, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: r.color, borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: FM, fontWeight: 700, color: r.color, minWidth: 40, textAlign: "right" }}>{fmtP(r.value, total)}</span>
        </div>
      );
    }},
  ];
  if (view === "pie") return (
    <>
      <ResponsiveContainer width="100%" height={h}>
        <RePieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={h * 0.22} outerRadius={h * 0.36} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: FB }}
            formatter={(v) => [fmt(Number(v)), "Interacciones"] as [string, string]} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: FB, paddingTop: 8 }} />
        </RePieChart>
      </ResponsiveContainer>
    </>
  );
  if (view === "bar") return (
    <ResponsiveContainer width="100%" height={h}>
      <ReBarChart data={data.filter(d => d.value > 0)} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted, fontFamily: FB }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: FM }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: FB }}
          formatter={(v) => [fmt(Number(v)), "Interacciones"] as [string, string]} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Interacciones">
          {data.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
  return <DataTable cols={cols} rows={data.filter(d => d.value > 0)} emptyMsg="Sin datos de segmentos" />;
}

// ── Temporal ───────────────────────────────────────────────────────────────
function TempContent({ view, temporal, unidad, h = 180 }: {
  view: ViewTemporal; temporal: TemporalData | null; unidad: string; h?: number;
}) {
  if (!temporal?.datos?.length) return (
    <div style={{ padding: "28px 0", textAlign: "center", color: C.muted, background: C.bg, borderRadius: 8, fontSize: 13 }}>
      Sin datos temporales para el rango seleccionado.
    </div>
  );
  const totTotal = temporal.datos.reduce((s, d) => s + d.total, 0);
  const cols: ColDef<TemporalDato>[] = [
    { header: unidad === "hora" ? "Hora" : "Día", render: r => <span style={{ color: C.ink, fontFamily: FM }}>{r.label}</span> },
    { header: "Interacciones", align: "right", render: r => <span style={{ fontFamily: FM, fontWeight: 700, color: C.ink }}>{fmt(r.total)}</span> },
    { header: "% del total",   align: "right", render: r => <span style={{ fontFamily: FM, fontWeight: 600, color: C.sub }}>{fmtP(r.total, totTotal)}</span> },
    { header: "Nivel", align: "center", render: r => {
      const max  = temporal.max?.total || 1;
      const pct  = (r.total / max) * 100;
      const col  = pct >= 75 ? C.green : pct >= 35 ? C.gold : C.muted;
      return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: `${col}14`, color: col }}>{pct >= 75 ? "Alto" : pct >= 35 ? "Medio" : "Bajo"}</span>;
    }},
  ];
  if (view === "bar") return (
    <>
      <ResponsiveContainer width="100%" height={h}>
        <ReBarChart data={temporal.datos} margin={{ top: 0, right: 0, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted, fontFamily: FM }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: C.muted, fontFamily: FM }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: FB }}
            formatter={(v) => [fmt(Number(v)), "Interacciones"] as [string, string]} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Interacciones">
            {temporal.datos.map((d, i) => (
              <Cell key={i} fill={d.label === temporal.max?.label ? C.green : d.label === temporal.min?.label ? C.red : C.blue} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <TimeBadge label={`Mayor ${unidad}`} value={temporal.max?.label || "—"} type="max" />
        <TimeBadge label={`Menor ${unidad}`} value={temporal.min?.label || "—"} type="min" />
      </div>
    </>
  );
  return <DataTable cols={cols} rows={temporal.datos} />;
}

// ── Predicción ─────────────────────────────────────────────────────────────
function PredContent({ view, prediccion, h = 200 }: {
  view: ViewPrediccion; prediccion: PrediccionData | null; h?: number;
}) {
  if (!prediccion) return (
    <div style={{ padding: "36px 0", textAlign: "center", color: C.muted, background: C.bg, borderRadius: 8, fontSize: 13 }}>
      Selecciona rango y unidad, luego presiona <strong style={{ color: C.ink }}>"Predecir"</strong> para generar la proyección.
    </div>
  );
  const cols: ColDef<PrediccionPunto>[] = [
    { header: "Período",    render: r => <span style={{ color: C.ink }}>{r.label}</span> },
    { header: "Predicción", align: "right", render: r => <span style={{ fontFamily: FM, fontWeight: 700, color: C.ink }}>{fmt(r.prediccion)}</span> },
    { header: "Variación",  align: "right", render: (r, i) => {
      const prev  = prediccion.predicciones[i - 1]?.prediccion ?? r.prediccion;
      const delta = prev ? ((r.prediccion - prev) / prev * 100) : 0;
      const pos   = delta >= 0;
      return <span style={{ fontFamily: FM, fontWeight: 700, color: pos ? C.green : C.red }}>{pos ? "+" : ""}{delta.toFixed(1)}%</span>;
    }},
    { header: "Período orig.", render: r => <span style={{ fontSize: 11, color: C.muted, fontFamily: FM }}>{r.periodo}</span> },
  ];
  if (view === "bar") return (
    <ResponsiveContainer width="100%" height={h}>
      <ReBarChart data={prediccion.predicciones} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
        <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted, fontFamily: FM }} axisLine={{ stroke: C.border }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: FM }} axisLine={{ stroke: C.border }} tickLine={false} width={40} />
        <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: FB }}
          formatter={(v) => [fmt(Number(v)), "Predicción"] as [string, string]} />
        <Bar dataKey="prediccion" fill={C.gold} radius={[4, 4, 0, 0]} name="Predicción" />
        <ReferenceLine x={prediccion.predicciones[0]?.label} stroke={C.muted} strokeDasharray="4 4"
          label={{ value: "Inicio →", fill: C.muted, fontSize: 10, position: "insideTop" }} />
      </ReBarChart>
    </ResponsiveContainer>
  );
  return <DataTable cols={cols} rows={prediccion.predicciones} />;
}

// ── ModeloStrip ────────────────────────────────────────────────────────────
function ModeloStrip({ modelo }: { modelo: ModeloInfo }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "8px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 14, fontSize: 11 }}>
      {[
        { l: "Ecuación", v: modelo.ecuacion },
        { l: "Fase",     v: modelo.fase },
        { l: "R²",       v: modelo.estadisticos.r2.toFixed(4) },
        { l: "Media",    v: modelo.estadisticos.media.toFixed(1) },
        { l: "σ",        v: modelo.estadisticos.desv_std.toFixed(2) },
      ].map(item => (
        <div key={item.l}>
          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: C.muted, fontSize: 10 }}>{item.l} </span>
          <span style={{ fontFamily: FM, fontWeight: 700, color: C.ink }}>{item.v}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminEstadisticas() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  // Filtros
  const [segmento,       setSegmento]       = useState<Segmento>("todos");
  const [fechaDesde,     setFechaDesde]     = useState("");
  const [fechaHasta,     setFechaHasta]     = useState("");
  const [unidadPred,     setUnidadPred]     = useState<Unidad>("mes");
  const [unidadTemporal, setUnidadTemporal] = useState<"hora" | "dia">("hora");

  // Datos
  const [prediccion,   setPrediccion]   = useState<PrediccionData | null>(null);
  const [cargandoPred, setCargandoPred] = useState(false);
  const [temporal,     setTemporal]     = useState<TemporalData | null>(null);
  const [segmentos,    setSegmentos]    = useState<SegmentData | null>(null);
  const [cargando,     setCargando]     = useState(false);
  const [hasCargado,   setHasCargado]   = useState(false);

  // Vistas (compartidas entre tarjeta inline y modal)
  const [viewSeg,  setViewSeg]  = useState<ViewSegmento>("pie");
  const [viewTemp, setViewTemp] = useState<ViewTemporal>("bar");
  const [viewPred, setViewPred] = useState<ViewPrediccion>("bar");

  // Modales abiertos
  const [modalSeg,  setModalSeg]  = useState(false);
  const [modalTemp, setModalTemp] = useState(false);
  const [modalPred, setModalPred] = useState(false);

  // Carga — solo se dispara cuando el usuario pulsa "Actualizar"
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const H  = authH();
      const qs = new URLSearchParams();
      if (fechaDesde) qs.append("desde", fechaDesde);
      if (fechaHasta) qs.append("hasta", fechaHasta);
      const q   = qs.toString();
      const sep = q ? `&${q}` : "";
      const [segR, tempR] = await Promise.all([
        fetch(`${API}/api/estadisticas/segmentos${q ? "?" + q : ""}`, { headers: H }),
        fetch(`${API}/api/estadisticas/analisis-temporal?unidad=${unidadTemporal}${sep}`, { headers: H }),
      ]);
      const [segJ, tempJ] = await Promise.all([segR.json(), tempR.json()]);
      if (segJ.success)  setSegmentos(segJ.data);
      if (tempJ.success) setTemporal(tempJ.data);
      setHasCargado(true);
    } catch {
      showToast("Error de conexión al cargar métricas", "err");
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, unidadTemporal, showToast]);

  const ejecutarPrediccion = async () => {
    setCargandoPred(true);
    try {
      const qs = new URLSearchParams();
      if (fechaDesde) qs.append("desde", fechaDesde);
      if (fechaHasta) qs.append("hasta", fechaHasta);
      qs.append("unidad", unidadPred);
      qs.append("segmento", segmento);
      const res  = await fetch(`${API}/api/estadisticas/prediccion-dinamica?${qs.toString()}`, { headers: authH() });
      const json = await res.json();
      if (json.success) { setPrediccion(json.data); setModalPred(true); }
      else showToast(json.message || "Error al generar predicción", "err");
    } catch {
      showToast("Error de conexión al predecir", "err");
    } finally {
      setCargandoPred(false);
    }
  };

  const totalSeg = (segmentos?.artistas || 0) + (segmentos?.clientes || 0) + (segmentos?.publico || 0);
  const pieData = useMemo<PieEntry[]>(() => [
    { name: "Artistas", value: segmentos?.artistas || 0, color: C.orange },
    { name: "Clientes", value: segmentos?.clientes || 0, color: C.blue   },
    { name: "Público",  value: segmentos?.publico  || 0, color: C.green  },
    { name: "Obras",    value: segmentos?.top_obras?.reduce((s, o) => s + o.total, 0) || 0, color: C.gold },
  ], [segmentos]);

  const nomUnidad = unidadPred === "dia" ? "Diaria" : unidadPred === "semana" ? "Semanal" : "Mensual";

  // Opciones de vista
  const segOpts: VOpt<ViewSegmento>[]   = [{ key: "pie", icon: PieIcon, label: "Pastel" }, { key: "bar", icon: BarChart2, label: "Barras" }, { key: "table", icon: Table2, label: "Tabla" }];
  const tempOpts: VOpt<ViewTemporal>[]  = [{ key: "bar", icon: BarChart2, label: "Barras" }, { key: "table", icon: Table2, label: "Tabla" }];
  const predOpts: VOpt<ViewPrediccion>[]= [{ key: "bar", icon: BarChart2, label: "Barras" }, { key: "table", icon: Table2, label: "Tabla" }];

  // Botón expandir reutilizable
  const BtnExpand = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} title="Abrir en modal" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.sub, fontFamily: FB }}>
      <Maximize2 size={11} /> Expandir
    </button>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        select, input { outline: none; }
        select:focus, input:focus { box-shadow: 0 0 0 2px ${C.orange}33; }
      `}</style>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => navigate("/admin/dashboard")} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontFamily: FB, padding: "4px 8px", borderRadius: 6 }}>
            <Home size={13} /> Inicio
          </button>
          <span style={{ color: C.border, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} color={C.orange} /> Centro de Predicción
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={cargarDatos} disabled={cargando} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
            <RefreshCw size={12} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }} /> Actualizar
          </button>
          <button onClick={() => window.open(`${API}/api/estadisticas/exportar-csv`, "_blank")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
            <Download size={12} /> Exportar CSV
          </button>
        </div>
      </div>

      <main style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: 0, letterSpacing: "-0.01em" }}>Análisis y Proyección de Interacción</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Selecciona segmento, rango temporal y unidad de proyección. El modelo exponencial calculará tendencias y picos de actividad.</p>
        </div>

        {/* Controles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 24, background: C.card, padding: 14, borderRadius: 10, boxShadow: CS }}>
          <select value={segmento} onChange={e => setSegmento(e.target.value as Segmento)}
            style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FB, color: C.ink }}>
            <option value="todos">Todos los segmentos</option>
            <option value="artistas">Artistas</option>
            <option value="clientes">Clientes</option>
            <option value="publico">Público general</option>
            {segmentos?.top_obras?.map(o => <option key={o.id} value={`obra_${o.id}`}>Obra #{o.id}</option>)}
          </select>
          <DateRangePicker desde={fechaDesde} hasta={fechaHasta} onChange={(d, h) => { setFechaDesde(d); setFechaHasta(h); }} label="Rango de fechas" />
          <select value={unidadTemporal} onChange={e => setUnidadTemporal(e.target.value as "hora" | "dia")}
            style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FB, color: C.ink }}>
            <option value="hora">Análisis por hora</option>
            <option value="dia">Análisis por día</option>
          </select>
          <select value={unidadPred} onChange={e => setUnidadPred(e.target.value as Unidad)}
            style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FB, color: C.ink }}>
            <option value="dia">Proyección diaria</option>
            <option value="semana">Proyección semanal</option>
            <option value="mes">Proyección mensual</option>
          </select>
          <button onClick={ejecutarPrediccion} disabled={cargandoPred}
            style={{ padding: "8px 14px", borderRadius: 6, background: cargandoPred ? C.muted : C.orange, color: "#FFF", border: "none", fontWeight: 700, cursor: cargandoPred ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontFamily: FB, transition: "background .15s" }}>
            <Zap size={14} /> {cargandoPred ? "Calculando…" : "Predecir"}
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center", color: C.muted, background: C.card, borderRadius: 10, boxShadow: CS }}>
            <Activity size={32} color={C.orange} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
            <span style={{ fontSize: 14 }}>Cargando métricas y modelos…</span>
          </div>
        ) : !hasCargado ? (
          <div style={{ padding: "56px 24px", textAlign: "center", background: C.card, borderRadius: 10, boxShadow: CS, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.orange}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={26} color={C.orange} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Sin datos cargados</div>
              <div style={{ fontSize: 13, color: C.sub, maxWidth: 380, lineHeight: 1.6 }}>
                Configura los filtros y haz clic en <strong style={{ color: C.ink }}>Actualizar</strong> para cargar las métricas y activar el análisis de predicción.
              </div>
            </div>
            <button onClick={cargarDatos} style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: C.orange, color: "#FFF", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: FB }}>
              <RefreshCw size={13} /> Cargar ahora
            </button>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <KpiCard label="Interacciones totales" value={fmt(totalSeg)} sub="Período seleccionado" icon={Activity} accent={C.orange} />
              <KpiCard label="Pico de actividad"     value={temporal?.max?.label || "—"} sub={temporal?.max?.total ? `${fmt(temporal.max.total)} accesos` : "Sin datos"} icon={Clock} accent={C.green} />
              <KpiCard label="Valle de actividad"    value={temporal?.min?.label || "—"} sub={temporal?.min?.total ? `${fmt(temporal.min.total)} accesos` : "Sin datos"} icon={Minus} accent={C.red} />
              <KpiCard label="Segmento activo"       value={segmento === "todos" ? "General" : segmento.charAt(0).toUpperCase() + segmento.slice(1)} sub="Filtro aplicado" icon={Users} accent={C.blue} />
            </div>

            {/* Grid 2 col */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginBottom: 16 }}>

              {/* ── Panel: Distribución ──────────────────────────────────── */}
              <div style={{ background: C.card, borderRadius: 10, padding: "18px 20px", boxShadow: CS }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}>
                    <PieIcon size={14} color={C.orange} /> Distribución por segmento
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <ViewToggle value={viewSeg} options={segOpts} onChange={setViewSeg} />
                    <BtnExpand onClick={() => setModalSeg(true)} />
                  </div>
                </div>
                <SegContent view={viewSeg} data={pieData} h={210} />
              </div>

              {/* ── Panel: Patrón temporal ───────────────────────────────── */}
              <div style={{ background: C.card, borderRadius: 10, padding: "18px 20px", boxShadow: CS }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}>
                    <TrendingUp size={14} color={C.blue} /> Patrón temporal ({unidadTemporal})
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <ViewToggle value={viewTemp} options={tempOpts} onChange={setViewTemp} />
                    <BtnExpand onClick={() => setModalTemp(true)} />
                  </div>
                </div>
                <TempContent view={viewTemp} temporal={temporal} unidad={unidadTemporal} h={170} />
              </div>
            </div>

            {/* ── Panel: Proyección ────────────────────────────────────── */}
            <div style={{ background: C.card, borderRadius: 10, padding: "18px 20px", boxShadow: CS }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}>
                  <Zap size={14} color={C.gold} /> Proyección generada
                  {prediccion && <span style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>· {prediccion.periodo_analizado}</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <ViewToggle value={viewPred} options={predOpts} onChange={setViewPred} />
                  {prediccion && <BtnExpand onClick={() => setModalPred(true)} />}
                </div>
              </div>
              {prediccion && <ModeloStrip modelo={prediccion.modelo} />}
              <PredContent view={viewPred} prediccion={prediccion} h={200} />
            </div>
          </>
        )}
      </main>

      {/* ══ MODALES ══════════════════════════════════════════════════════════ */}

      {/* Modal — Distribución */}
      <PanelModal
        open={modalSeg} onClose={() => setModalSeg(false)}
        title="Distribución por segmento" icon={PieIcon} accent={C.orange}
        viewOpts={segOpts} view={viewSeg} onViewChange={setViewSeg}
        extra={<span style={{ fontSize: 12, color: C.muted, fontFamily: FM }}>{fmt(totalSeg)} total</span>}
      >
        <SegContent view={viewSeg} data={pieData} h={420} />
      </PanelModal>

      {/* Modal — Patrón temporal */}
      <PanelModal
        open={modalTemp} onClose={() => setModalTemp(false)}
        title={`Patrón temporal (${unidadTemporal})`} icon={TrendingUp} accent={C.blue}
        viewOpts={tempOpts} view={viewTemp} onViewChange={setViewTemp}
        extra={temporal && <span style={{ fontSize: 12, color: C.muted, fontFamily: FM }}>{temporal.total_periodos} períodos</span>}
      >
        <TempContent view={viewTemp} temporal={temporal} unidad={unidadTemporal} h={440} />
      </PanelModal>

      {/* Modal — Proyección */}
      <PanelModal
        open={modalPred} onClose={() => setModalPred(false)}
        title={`Proyección ${nomUnidad}`} icon={Zap} accent={C.gold}
        viewOpts={predOpts} view={viewPred} onViewChange={setViewPred}
        extra={prediccion && <span style={{ fontSize: 11, color: C.muted }}>{prediccion.periodo_analizado}</span>}
      >
        {prediccion && <ModeloStrip modelo={prediccion.modelo} />}
        <PredContent view={viewPred} prediccion={prediccion} h={440} />
      </PanelModal>
    </div>
  );
}
