// src/pages/private/admin/AdminEstadisticas.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ChevronRight, RefreshCw, Users, TrendingUp, TrendingDown,
  Clock, Calendar, BarChart2, Table2, CheckCircle, XCircle,
  PieChart as PieIcon, Thermometer, Sparkles, Home,
  LogOut, Key, Lock, BarChart, TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon, Clock as ClockIcon, Activity as ActivityIcon,
  PieChart, MapPin, Award,
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Line, Legend,
  PieChart as RePieChart, Pie, ReferenceLine,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

// ========== PALETA CLARA (unificada) ==========
const C = {
  orange: "#E8640C",
  orangeDark: "#D45A0A",
  orangeLight: "#FEE9E0",
  ink: "#14121E",
  muted: "#8A8A8A",
  border: "#EDEDE9",
  bgCard: "#FFFFFF",
  bgPage: "#F8F8F6",
  inputBg: "#F5F5F2",
  error: "#C4304A",
  success: "#1A7A45",
  successLight: "rgba(26,122,69,0.1)",
  shadow: "rgba(0,0,0,0.04)",
  purple: "#6028AA",
  blue: "#2D6FBE",
  gold: "#A87006",
  pink: "#A83B90",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }
const fmt  = (n: number) => new Intl.NumberFormat("es-MX").format(n ?? 0);
const fmtP = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

const PIE_COLORS: Record<string, string> = {
  LOGIN_EXITOSO:   C.success,
  LOGIN_FALLIDO:   C.error,
  LOGOUT:          C.blue,
  LOGIN_2FA:       C.gold,
  LOGIN_BLOQUEADO: C.pink,
};

// Iconos para cada tipo de evento (sin emojis)
const EVENTO_ICONS: Record<string, React.ElementType> = {
  LOGIN_EXITOSO:   CheckCircle,
  LOGIN_FALLIDO:   XCircle,
  LOGOUT:          LogOut,
  LOGIN_2FA:       Key,
  LOGIN_BLOQUEADO: Lock,
};

const EVENTO_LABELS: Record<string, { label:string; color:string }> = {
  LOGIN_EXITOSO:   { label:"Acceso exitoso",   color:C.success },
  LOGIN_FALLIDO:   { label:"Contraseña incorrecta", color:C.error },
  LOGOUT:          { label:"Cierre de sesión", color:C.blue },
  LOGIN_2FA:       { label:"Verificación 2FA", color:C.gold },
  LOGIN_BLOQUEADO: { label:"Cuenta bloqueada", color:C.pink },
};

// ── Tipos ──────────────────────────────────────────────────────────────
interface Resumen { total_eventos:number; logins_exitosos:number; logins_fallidos:number; usuarios_unicos:number; accesos_hoy:number; accesos_ayer:number; tendencia_pct:number }
interface HoraData { hora:number; label:string; total:number; exitosos:number; fallidos:number }
interface DiaData { dia_num:number; label:string; total:number; exitosos:number; fallidos:number }
interface SemanaData { semana:string; label:string; fecha_label:string; total:number; exitosos:number; fallidos:number; usuarios_unicos:number; x:number }
interface DiaHistData { dia:string; label:string; total:number; exitosos:number; fallidos:number; promedio_movil:number; x:number }
interface Prediccion { label:string; fecha_label:string; prediccion:number }
interface ModeloError { x:number; y_real:number; y_modelo:number; error:number; error_relativo:number|null }
interface Modelo {
  y0: number; k: number;
  fase: "crecimiento"|"decrecimiento"|"estable";
  ecuacion: string;
  t_caracteristico: number|null;
  estadisticos: { media:number; moda:number; desv_std:number; r2:number };
  errores: ModeloError[];
}
interface DistItem { tipo_evento:string; total:number; porcentaje:number; fill?:string }
interface CalorCell { dia:number; dia_label:string; hora:number; hora_label:string; total:number; intensidad:number }
interface EventoHistorial { id_historial:number; correo:string; tipo_evento:string; ip_address:string; fecha:string; detalles:string; nombre_completo:string }
type Tab = "resumen"|"semanal"|"diario"|"hora"|"dia-semana"|"pastel"|"calor"|"historial";

// ========== COMPONENTES UI ==========

// ── Cursor personalizado ──────────────────────────────────────────────
function useCustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) { dotRef.current.style.left = `${mx}px`; dotRef.current.style.top = `${my}px`; }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);
  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);
  return { dotRef, ringRef, cursorOn, cursorOff };
}

// ── Topbar con breadcrumb ────────────────────────────────────────────
function Topbar({ navigate, onRefresh, loading, cursorOn, cursorOff }: any) {
  const hoy = new Date().toLocaleDateString("es-MX", { weekday:"long", day:"2-digit", month:"long" });
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:56, background:C.bgCard, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:30, fontFamily:SANS }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => navigate("/admin/dashboard")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:C.muted, fontSize:12, fontWeight:500 }}>
          <Home size={14} /> Inicio
        </button>
        <ChevronRight size={12} color={C.muted} />
        <span style={{ display:"flex", alignItems:"center", gap:6, color:C.orange, fontSize:12, fontWeight:700 }}>
          <Activity size={14} /> Estadísticas
        </span>
        <div style={{ marginLeft:8, padding:"3px 10px", borderRadius:40, background:C.inputBg, border:`1px solid ${C.border}`, fontSize:11, color:C.muted }}>{hoy}</div>
      </div>
      <button onClick={onRefresh} disabled={loading} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
        style={{ display:"flex", alignItems:"center", gap:6, background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", color:C.ink, fontSize:12, fontWeight:500, cursor:loading?"wait":"pointer", transition:"all .15s" }}>
        <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
        {loading ? "Actualizando..." : "Actualizar"}
      </button>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ label, value, contexto, accent, icon:Icon, tendencia, sub }: any) {
  return (
    <div style={{ background:C.bgCard, borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s", boxShadow:`0 1px 2px ${C.shadow}` }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 20px ${C.shadow}`; e.currentTarget.style.borderColor=accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 1px 2px ${C.shadow}`; e.currentTarget.style.borderColor=C.border; }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${accent}10`, border:`1px solid ${accent}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={20} color={accent} strokeWidth={1.8} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:6 }}>
          <span style={{ fontSize:26, fontWeight:700, fontFamily:SERIF, color:C.ink, lineHeight:1 }}>{value}</span>
          {tendencia !== undefined && (
            <div style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:20, background:tendencia>=0?`${C.success}10`:`${C.error}10` }}>
              {tendencia >= 0 ? <TrendingUp size={10} color={C.success}/> : <TrendingDown size={10} color={C.error}/>}
              <span style={{ fontSize:10, fontWeight:700, color:tendencia>=0?C.success:C.error }}>{fmtP(tendencia)}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginTop:2 }}>{label}</div>
        <div style={{ fontSize:10.5, color:C.muted, marginTop:1 }}>{contexto}</div>
        {sub && <div style={{ fontSize:10, color:accent, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Tooltips mejorados ─────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", boxShadow:`0 4px 12px ${C.shadow}`, fontFamily:SANS }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.orange, marginBottom:8, borderBottom:`1px solid ${C.border}`, paddingBottom:4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }} />
          <span style={{ color:C.muted }}>{p.name}:</span>
          <strong style={{ color:C.ink }}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

const PieTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const ev = EVENTO_LABELS[p.name] ?? { label:p.name, color:C.blue };
  const IconComponent = EVENTO_ICONS[p.name] || Activity;
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", boxShadow:`0 4px 12px ${C.shadow}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        <IconComponent size={14} color={ev.color} />
        <span style={{ fontSize:12, fontWeight:700, color:ev.color }}>{ev.label}</span>
      </div>
      <div style={{ fontSize:18, fontWeight:700, fontFamily:SERIF, color:C.ink }}>{p.payload.porcentaje}%</div>
      <div style={{ fontSize:10, color:C.muted }}>{fmt(p.value)} eventos</div>
    </div>
  );
};

// ── Tab Bar (iconos sin emojis) ─────────────────────────────────────
const TABS: { id:Tab; label:string; icon:React.ElementType; desc:string }[] = [
  { id:"resumen",    label:"Resumen",    icon:BarChart2,   desc:"Vista general" },
  { id:"semanal",    label:"Semanas",    icon:Calendar,    desc:"Últimas 12 sem." },
  { id:"diario",     label:"Días",       icon:TrendingUp,  desc:"Últimos 30 días" },
  { id:"hora",       label:"Por hora",   icon:Clock,       desc:"0 – 23 hs" },
  { id:"dia-semana", label:"Día semana", icon:Activity,    desc:"Lun → Dom" },
  { id:"pastel",     label:"Tipos",      icon:PieIcon,     desc:"% de eventos" },
  { id:"calor",      label:"Mapa calor", icon:Thermometer, desc:"Hora × Día" },
  { id:"historial",  label:"Historial",  icon:Table2,      desc:"Tabla completa" },
];

function TabBar({ tab, setTab }: any) {
  return (
    <div style={{ display:"flex", gap:4, marginBottom:24, background:C.inputBg, padding:4, borderRadius:12, border:`1px solid ${C.border}` }}>
      {TABS.map(({ id, label, icon:Icon }) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 6px",
              borderRadius:9, border: on ? `1px solid ${C.orange}` : "1px solid transparent",
              background: on ? C.bgCard : "transparent",
              color: on ? C.orange : C.muted,
              cursor:"pointer", fontFamily:SANS, transition:"all .15s", fontWeight: on ? 700 : 500, fontSize:12 }}>
            <Icon size={14} color={on ? C.orange : C.muted} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Page Header ──────────────────────────────────────────────────────
function PageHeader({ resumen, fechaInicio, fechaFin }: any) {
  return (
    <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
      <div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:40, background:`${C.orange}10`, border:`1px solid ${C.orange}20`, fontSize:10, color:C.orange, marginBottom:12, fontWeight:700 }}>
          <Activity size={10} /> Estadísticas de acceso
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, fontFamily:SERIF, color:C.ink, margin:"0 0 6px", lineHeight:1.1 }}>
          Análisis de <span style={{ color:C.orange }}>Interacción</span>
        </h1>
        <p style={{ fontSize:12.5, color:C.muted, margin:0 }}>
          Histórico desde <strong>{fechaInicio}</strong> hasta <strong>{fechaFin}</strong> · Modelo exponencial y(t) = y₀·eᵏᵗ
        </p>
      </div>
      {resumen && (
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ padding:"8px 16px", borderRadius:12, background:`${C.success}10`, border:`1px solid ${C.success}20`, textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, fontFamily:SERIF, color:C.success }}>{resumen.total_eventos > 0 ? `${Math.round(resumen.logins_exitosos/resumen.total_eventos*100)}%` : "—"}</div>
            <div style={{ fontSize:10, color:C.muted }}>Tasa éxito</div>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:12, background:`${C.orange}10`, border:`1px solid ${C.orange}20`, textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, fontFamily:SERIF, color:C.orange }}>{fmt(resumen.accesos_hoy)}</div>
            <div style={{ fontSize:10, color:C.muted }}>Eventos hoy</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ModeloBox (con detalles técnicos) ────────────────────────────────
function ModeloBox({ modelo, periodo }: any) {
  const [verTecnico, setVerTecnico] = useState(false);
  const { estadisticos, y0, k, fase, ecuacion, t_caracteristico, errores } = modelo;
  const r2Pct = (estadisticos.r2 * 100).toFixed(0);
  const confColor = estadisticos.r2 >= 0.8 ? C.success : estadisticos.r2 >= 0.6 ? C.gold : C.error;
  const faseColor = fase === "crecimiento" ? C.success : fase === "decrecimiento" ? C.error : C.gold;
  const errMed = errores.filter((e: any) => e.error_relativo !== null).reduce((s: number, e: any) => s + (e.error_relativo ?? 0), 0) / (errores.filter((e: any) => e.error_relativo !== null).length || 1);
  const tieneError = errMed > 0;
  const tCaractLabel = fase === "crecimiento" ? "los accesos se duplican cada" : fase === "decrecimiento" ? "los accesos se reducen a la mitad cada" : null;
  const tCaractVal = t_caracteristico !== null && t_caracteristico <= 60 && tCaractLabel ? `${t_caracteristico} periodos` : null;

  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:20 }}>
      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, background:C.inputBg, display:"flex", alignItems:"center", gap:8 }}>
        <Sparkles size={14} color={faseColor} />
        <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>Predicción de accesos ({periodo})</span>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:40, background:`${faseColor}10`, color:faseColor, fontWeight:700 }}>{fase === "crecimiento" ? "Creciendo" : fase === "decrecimiento" ? "Decreciendo" : "Estable"}</span>
      </div>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Ecuación</div>
          <div style={{ fontFamily:FM, fontSize:12, color:C.ink }}>{ecuacion}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
          <div><div style={{ fontSize:9, color:C.muted }}>y₀ inicial</div><div style={{ fontSize:14, fontWeight:700 }}>{y0}</div></div>
          <div><div style={{ fontSize:9, color:C.muted }}>k (tasa)</div><div style={{ fontSize:14, fontWeight:700, color:faseColor }}>{k >=0 ? `+${k}` : k}</div></div>
          <div><div style={{ fontSize:9, color:C.muted }}>R² ajustado</div><div style={{ fontSize:14, fontWeight:700, color:confColor }}>{r2Pct}%</div></div>
          <div><div style={{ fontSize:9, color:C.muted }}>Error relativo</div><div style={{ fontSize:14, fontWeight:700, color:tieneError && errMed < 20 ? C.success : C.gold }}>{errMed.toFixed(1)}%</div></div>
        </div>
        {tCaractVal && <div style={{ marginBottom:12, padding:"6px 12px", background:`${faseColor}08`, borderRadius:8, fontSize:11, color:faseColor }}>⏱ {tCaractLabel} {tCaractVal}</div>}
        <button onClick={() => setVerTecnico(!verTecnico)} style={{ background:"none", border:"none", color:C.muted, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
          <Sparkles size={10} /> {verTecnico ? "Ocultar detalles" : "Ver detalles técnicos"} <ChevronRight size={10} style={{ transform:verTecnico ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s" }} />
        </button>
        {verTecnico && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:8 }}>Errores punto a punto (sMAPE)</div>
            <div style={{ maxHeight:150, overflowY:"auto", fontSize:10 }}>
              {errores.map((e: any, i: number) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ width:40 }}>t={e.x}</span>
                  <span style={{ width:50 }}>real:{e.y_real}</span>
                  <span style={{ width:50 }}>pred:{Math.round(e.y_modelo)}</span>
                  <span style={{ color:e.error_relativo !== null && e.error_relativo > 20 ? C.error : C.muted }}>{e.error_relativo !== null ? `${e.error_relativo}%` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mapa de Calor (con leyenda) ─────────────────────────────────────
function MapaCalor({ datos, maxVal: _maxVal }: any) {
  const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const HORAS = Array.from({length:24}, (_,h) => `${String(h).padStart(2,"0")}:00`);
  const [tooltip, setTooltip] = useState<{ cell:CalorCell; x:number; y:number }|null>(null);
  const porHora: Record<number, Record<number, CalorCell>> = {};
  datos.forEach((c: CalorCell) => { if (!porHora[c.hora]) porHora[c.hora] = {}; porHora[c.hora][c.dia] = c; });
  const getHeatColor = (intensidad: number) => {
    if (intensidad === 0) return C.border;
    if (intensidad < 0.2) return `${C.orange}20`;
    if (intensidad < 0.5) return `${C.orange}50`;
    if (intensidad < 0.8) return `${C.orange}80`;
    return C.orange;
  };
  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:12 }}>Mapa de calor: actividad por hora y día</div>
      <div style={{ overflowX:"auto" }}>
        <div style={{ minWidth:680 }}>
          <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", gap:3, marginBottom:6 }}>
            <div style={{ fontSize:9, color:C.muted, textAlign:"center", paddingTop:4 }}>Hora</div>
            {DIAS.map(d => <div key={d} style={{ fontSize:11, fontWeight:700, color:C.orange, textAlign:"center", padding:"4px 0" }}>{d}</div>)}
          </div>
          {HORAS.map((h, hi) => (
            <div key={h} style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", gap:3, marginBottom:3 }}>
              <div style={{ fontSize:9, color:C.muted, textAlign:"right", paddingRight:8, display:"flex", alignItems:"center", justifyContent:"flex-end" }}>{h}</div>
              {Array.from({length:7}, (_,di) => {
                const cell = porHora[hi]?.[di];
                const intens = cell?.intensidad ?? 0;
                const hasDatos = (cell?.total ?? 0) > 0;
                return (
                  <div key={di}
                    onMouseEnter={e => { if (hasDatos) { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltip({ cell: cell!, x: r.right, y: r.top }); } }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ height:22, borderRadius:4, background:getHeatColor(intens), border:`1px solid ${C.border}`, cursor:hasDatos?"crosshair":"default", transition:"all 0.1s" }}>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tooltip && (
        <div style={{ position:"fixed", top:tooltip.y-60, left:tooltip.x+10, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:11, boxShadow:`0 4px 12px ${C.shadow}`, zIndex:100 }}>
          <strong>{tooltip.cell.dia_label} {tooltip.cell.hora_label}</strong><br />
          {tooltip.cell.total} accesos
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:12, justifyContent:"center" }}>
        <span style={{ fontSize:10, color:C.muted }}>Baja</span>
        <div style={{ display:"flex", gap:3 }}>
          {[0.1,0.3,0.5,0.7,0.9].map(v => <div key={v} style={{ width:20, height:10, borderRadius:3, background:getHeatColor(v) }} />)}
        </div>
        <span style={{ fontSize:10, color:C.muted }}>Alta</span>
      </div>
    </div>
  );
}

// ── Helper findPicoValle ─────────────────────────────────────────────
function findPicoValle<T extends { total: number }>(data: T[]): { pico: T; valle: T } | null {
  const filtered = data.filter(d => d.total > 0);
  if (filtered.length === 0) return null;
  const pico = filtered.reduce((m, d) => d.total > m.total ? d : m, filtered[0]);
  const valle = filtered.reduce((m, d) => d.total < m.total ? d : m, filtered[0]);
  return { pico, valle };
}

// ========== TABLAS MEJORADAS CON ETIQUETAS DE EJES ==========

// ── Tab: Resumen ─────────────────────────────────────────────────────
function TabResumen({ porHora, porDia, distribucion, distribucionWithFill, fechaInicio }: any) {
  const pvH = findPicoValle(porHora);
  const pvD = findPicoValle(porDia);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <BarChart size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Actividad por hora del día</span>
        </div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Suma histórica desde {fechaInicio} · acumulado de todos los días</div>
        <ResponsiveContainer width="100%" height={180}>
          <ReBarChart data={porHora} margin={{ top:10, right:20, bottom:20, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Hora del día", position:"insideBottom", offset:-5, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="total" name="Accesos acumulados" fill={C.orange} radius={[4,4,0,0]} fillOpacity={0.85} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <PieIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Distribución por tipo de evento</span>
        </div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Proporción de cada tipo de acceso en el historial</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <ResponsiveContainer width={140} height={140}>
            <RePieChart>
              <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={60} innerRadius={32} paddingAngle={2} />
              <Tooltip content={<PieTip />} />
            </RePieChart>
          </ResponsiveContainer>
          <div style={{ flex:1 }}>
            {distribucion.map((d: any) => {
              const ev = EVENTO_LABELS[d.tipo_evento] ?? { label:d.tipo_evento, color:C.blue };
              const IconComponent = EVENTO_ICONS[d.tipo_evento] || Activity;
              return (
                <div key={d.tipo_evento} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <IconComponent size={12} color={ev.color} />
                    <span style={{ fontSize:11, color:C.muted }}>{ev.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:ev.color }}>{d.porcentaje}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <CalendarIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Actividad por día de la semana</span>
        </div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Suma de accesos agrupados por día (todos los lunes, martes, etc.)</div>
        <ResponsiveContainer width="100%" height={180}>
          <ReBarChart data={porDia} margin={{ top:10, right:20, bottom:20, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Día de la semana", position:"insideBottom", offset:-5, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
            <Bar dataKey="exitosos" name="Exitosos" fill={C.purple} radius={[4,4,0,0]} stackId="a" fillOpacity={0.85} />
            <Bar dataKey="fallidos" name="Fallidos" fill={C.pink} radius={[4,4,0,0]} stackId="a" fillOpacity={0.8} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Award size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Hallazgos clave</span>
        </div>
        {pvH && pvD && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div><span style={{ fontWeight:700, color:C.orange }}>Hora pico:</span> {pvH.pico.label} ({pvH.pico.total} accesos)</div>
            <div><span style={{ fontWeight:700, color:C.blue }}>Menor actividad:</span> {pvH.valle.label} ({pvH.valle.total} accesos)</div>
            <div><span style={{ fontWeight:700, color:C.success }}>Día más activo:</span> {pvD.pico.label} ({pvD.pico.total} accesos)</div>
            <div><span style={{ fontWeight:700, color:C.purple }}>Día menos activo:</span> {pvD.valle.label} ({pvD.valle.total} accesos)</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Semanal ─────────────────────────────────────────────────────
function TabSemanal({ semanal, predSemanal, modeloSem, semanalComb }: any) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {modeloSem && <ModeloBox modelo={modeloSem} periodo="Últimas 12 semanas" />}
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <CalendarIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Accesos por semana (histórico + predicción)</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={semanalComb} margin={{ top:20, right:30, bottom:30, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="fecha_label" tick={{ fill:C.muted, fontSize:10, rotate: -15 }} label={{ value:"Semana", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
            <Bar dataKey="total" name="Accesos reales" fill={C.blue} radius={[5,5,0,0]} fillOpacity={0.85} />
            <Bar dataKey="prediccion" name="Predicción" fill={C.gold} radius={[5,5,0,0]} fillOpacity={0.65} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {predSemanal.length > 0 && (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <TrendingUpIcon size={16} color={C.gold} />
            <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Próximas 4 semanas (predicción)</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {predSemanal.map((p: any) => (
              <div key={p.fecha_label} style={{ textAlign:"center", padding:"10px", background:C.inputBg, borderRadius:12 }}>
                <div style={{ fontSize:11, color:C.muted }}>{p.fecha_label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:C.gold, fontFamily:SERIF }}>{p.prediccion}</div>
                <div style={{ fontSize:10, color:C.muted }}>accesos estimados</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Diario ──────────────────────────────────────────────────────
function TabDiario({ diario, predDiario, modeloDia, diarioComb }: any) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {modeloDia && <ModeloBox modelo={modeloDia} periodo="Últimos 30 días" />}
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <TrendingUpIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Accesos diarios (últimos 30 días + predicción)</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={diarioComb} margin={{ top:20, right:30, bottom:30, left:0 }}>
            <defs><linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.2} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9, interval:2 }} label={{ value:"Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
            <Area type="monotone" dataKey="total" name="Accesos reales" stroke={C.orange} strokeWidth={2} fill="url(#gradOrange)" dot={false} />
            <Area type="monotone" dataKey="prediccion" name="Predicción" stroke={C.gold} strokeWidth={2} fill="none" strokeDasharray="5 3" dot={{ r:3, fill:C.gold }} />
            <Line type="monotone" dataKey="promedio_movil" name="Promedio móvil 7d" stroke={C.success} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {predDiario.length > 0 && (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <ClockIcon size={16} color={C.gold} />
            <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Próximos 7 días (predicción)</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8 }}>
            {predDiario.map((p: any) => (
              <div key={p.fecha_label} style={{ textAlign:"center", padding:"8px", background:C.inputBg, borderRadius:10 }}>
                <div style={{ fontSize:10, color:C.muted }}>{p.fecha_label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:C.gold, fontFamily:SERIF }}>{p.prediccion}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Por hora (detallada) ────────────────────────────────────────
function TabHora({ porHora, fechaInicio }: any) {
  const pv = findPicoValle(porHora);
  return (
    <div>
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <ClockIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Distribución de accesos por hora</span>
        </div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Acumulado histórico desde {fechaInicio} · NO son accesos de hoy únicamente</div>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={porHora} margin={{ top:20, right:30, bottom:30, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Hora del día", position:"insideBottom", offset:-5, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
            <Bar dataKey="exitosos" name="Accesos exitosos" fill={C.success} radius={[4,4,0,0]} stackId="a" fillOpacity={0.85} />
            <Bar dataKey="fallidos" name="Intentos fallidos" fill={C.error} radius={[4,4,0,0]} stackId="a" fillOpacity={0.8} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {pv && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.orange, marginBottom:8 }}>Hora pico</div>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:SERIF, color:C.ink }}>{pv.pico.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{pv.pico.total} accesos acumulados</div>
          </div>
          <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:8 }}>Menor actividad</div>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:SERIF, color:C.ink }}>{pv.valle.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{pv.valle.total} accesos</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Día semana (detallada) ──────────────────────────────────────
function TabDiaSemana({ porDia, fechaInicio }: any) {
  const pv = findPicoValle(porDia);
  return (
    <div>
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <ActivityIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Patrón semanal de actividad</span>
        </div>
        <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Suma de todos los registros desde {fechaInicio} por día de la semana</div>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={porDia} margin={{ top:20, right:30, bottom:30, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:11 }} label={{ value:"Día de la semana", position:"insideBottom", offset:-5, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Número de accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
            <Bar dataKey="exitosos" name="Accesos exitosos" fill={C.purple} radius={[5,5,0,0]} stackId="a" fillOpacity={0.85} />
            <Bar dataKey="fallidos" name="Intentos fallidos" fill={C.pink} radius={[5,5,0,0]} stackId="a" fillOpacity={0.8} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {pv && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.success, marginBottom:8 }}>Día más activo</div>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:SERIF, color:C.ink }}>{pv.pico.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{pv.pico.total} accesos</div>
          </div>
          <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.purple, marginBottom:8 }}>Día menos activo</div>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:SERIF, color:C.ink }}>{pv.valle.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{pv.valle.total} accesos</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Pastel (tipos) ──────────────────────────────────────────────
function TabPastel({ distribucion, distribucionWithFill }: any) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <PieIcon size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Distribución de eventos de acceso</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <RePieChart>
            <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} />
            <Tooltip content={<PieTip />} />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Table2 size={16} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Desglose por tipo de evento</span>
        </div>
        {distribucion.map((d: any) => {
          const ev = EVENTO_LABELS[d.tipo_evento] ?? { label:d.tipo_evento, color:C.blue };
          const IconComponent = EVENTO_ICONS[d.tipo_evento] || Activity;
          return (
            <div key={d.tipo_evento} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <IconComponent size={14} color={ev.color} />
                <span style={{ fontSize:12, color:C.ink }}>{ev.label}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:700, color:ev.color }}>{d.porcentaje}%</div>
                <div style={{ fontSize:10, color:C.muted }}>{fmt(d.total)} eventos</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Mapa calor (ya mejorado) ───────────────────────────────────
function TabCalor({ mapaCalor, mapaMax, mapaTop5 }: any) {
  return (
    <div>
      <MapaCalor datos={mapaCalor} maxVal={mapaMax} />
      {mapaTop5.length > 0 && (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px", marginTop:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <Award size={16} color={C.orange} />
            <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Top 5 momentos de mayor actividad histórica</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
            {mapaTop5.map((c: CalorCell, i: number) => (
              <div key={i} style={{ textAlign:"center", padding:"12px", background:C.inputBg, borderRadius:12 }}>
                <div style={{ fontSize:20, fontWeight:700, fontFamily:SERIF, color:C.orange }}>{c.total}</div>
                <div style={{ fontSize:11, color:C.muted }}>{c.dia_label}</div>
                <div style={{ fontSize:10, color:C.gold }}>{c.hora_label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Historial (tabla detallada) ─────────────────────────────────
function TabHistorial({ historial, filtroDia, setFiltroDia }: any) {
  const filtrado = filtroDia === "todos" ? historial : historial.filter((e: EventoHistorial) => e.tipo_evento === filtroDia);
  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.inputBg }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Table2 size={14} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Historial completo de accesos</span>
          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:40, background:`${C.orange}10`, color:C.orange }}>{filtrado.length} registros</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["todos", "LOGIN_EXITOSO", "LOGIN_FALLIDO", "LOGOUT"].map(tipo => {
            const on = filtroDia === tipo;
            const ev = EVENTO_LABELS[tipo] ?? { label:"Todos", color:C.muted };
            const IconComponent = EVENTO_ICONS[tipo] || Activity;
            return (
              <button key={tipo} onClick={() => setFiltroDia(tipo)}
                style={{ padding:"4px 10px", borderRadius:8, border: on ? `1px solid ${ev.color}` : `1px solid ${C.border}`, background: on ? `${ev.color}10` : "transparent", color: on ? ev.color : C.muted, fontSize:11, cursor:"pointer", transition:"all 0.2s" }}>
                <IconComponent size={10} style={{ marginRight:4 }} />
                {tipo === "todos" ? "Todos" : ev.label.replace("Acceso exitoso","Exitoso").replace("Contraseña incorrecta","Fallido").replace("Cierre de sesión","Salida")}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:C.inputBg, borderBottom:`1px solid ${C.border}` }}>
              {["Fecha y hora", "Usuario", "Correo", "Evento", "IP", "Detalle"].map(h => <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:C.muted, fontWeight:600 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtrado.map((e: EventoHistorial, i: number) => {
              const ev = EVENTO_LABELS[e.tipo_evento] ?? { label:e.tipo_evento, color:C.blue };
              const IconComponent = EVENTO_ICONS[e.tipo_evento] || Activity;
              return (
                <tr key={e.id_historial} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0 ? "transparent" : C.inputBg }}>
                  <td style={{ padding:"8px 12px", whiteSpace:"nowrap", color:C.muted }}>{new Date(e.fecha).toLocaleString()}</td>
                  <td style={{ padding:"8px 12px", fontWeight:600 }}>{e.nombre_completo || "—"}</td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.correo}</td>
                  <td style={{ padding:"8px 12px" }}><span style={{ display:"inline-flex", alignItems:"center", gap:4, background:`${ev.color}10`, padding:"2px 8px", borderRadius:20, fontSize:11, color:ev.color }}><IconComponent size={10} /> {ev.label}</span></td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.ip_address || "—"}</td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.detalles || "—"}</td>
                </tr>
              );
            })}
            {filtrado.length === 0 && <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:C.muted }}>No hay registros</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
export default function AdminEstadisticas() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dotRef, ringRef, cursorOn, cursorOff } = useCustomCursor();
  const [tab, setTab] = useState<Tab>("resumen");
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<Resumen|null>(null);
  const [porHora, setPorHora] = useState<HoraData[]>([]);
  const [porDia, setPorDia] = useState<DiaData[]>([]);
  const [semanal, setSemanal] = useState<SemanaData[]>([]);
  const [diario, setDiario] = useState<DiaHistData[]>([]);
  const [predSemanal, setPredSemanal] = useState<Prediccion[]>([]);
  const [predDiario, setPredDiario] = useState<Prediccion[]>([]);
  const [modeloSem, setModeloSem] = useState<Modelo|null>(null);
  const [modeloDia, setModeloDia] = useState<Modelo|null>(null);
  const [distribucion, setDistribucion] = useState<DistItem[]>([]);
  const distribucionWithFill = distribucion.map(d => ({ ...d, fill: PIE_COLORS[d.tipo_evento] ?? C.blue }));
  const [mapaCalor, setMapaCalor] = useState<CalorCell[]>([]);
  const [mapaMax, setMapaMax] = useState(1);
  const [mapaTop5, setMapaTop5] = useState<CalorCell[]>([]);
  const [historial, setHistorial] = useState<EventoHistorial[]>([]);
  const [filtroDia, setFiltroDia] = useState<string>("todos");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authH();
      const [rR,hR,dR,sR,diR,distR,mcR,hiR] = await Promise.all([
        fetch(`${API}/api/estadisticas/resumen`, { headers }),
        fetch(`${API}/api/estadisticas/por-hora`, { headers }),
        fetch(`${API}/api/estadisticas/por-dia-semana`, { headers }),
        fetch(`${API}/api/estadisticas/por-semana`, { headers }),
        fetch(`${API}/api/estadisticas/por-dia`, { headers }),
        fetch(`${API}/api/estadisticas/distribucion`, { headers }),
        fetch(`${API}/api/estadisticas/mapa-calor`, { headers }),
        fetch(`${API}/api/estadisticas/historial`, { headers }),
      ]);
      const [rJ,hJ,dJ,sJ,diJ,distJ,mcJ,hiJ] = await Promise.all([rR.json(),hR.json(),dR.json(),sR.json(),diR.json(),distR.json(),mcR.json(),hiR.json()]);
      if (rJ.success) setResumen(rJ.data);
      if (hJ.success) setPorHora(hJ.data);
      if (dJ.success) setPorDia(dJ.data);
      if (sJ.success) { setSemanal(sJ.data); setPredSemanal(sJ.predicciones); setModeloSem(sJ.modelo); }
      if (diJ.success) { setDiario(diJ.data); setPredDiario(diJ.predicciones); setModeloDia(diJ.modelo); }
      if (distJ.success) setDistribucion(distJ.data);
      if (mcJ.success) { setMapaCalor(mcJ.data); setMapaMax(mcJ.max_valor); setMapaTop5(mcJ.top5); }
      if (hiJ.success) setHistorial(hiJ.data);
    } catch (err) { showToast("Error al cargar estadísticas","err"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const fechaInicio = historial.length > 0 ? new Date(historial[historial.length-1]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const fechaFin    = historial.length > 0 ? new Date(historial[0]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const semanalComb = [...semanal.map(d=>({...d})), ...predSemanal.map(d=>({...d,total:undefined}))];
  const diarioComb  = [...diario.map(d=>({...d})), ...predDiario.map(d=>({...d,total:undefined}))];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cur-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width .22s, height .22s, background .22s;
        }
        .cur-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .cur-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .cur-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
      `}</style>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />

      <Topbar navigate={navigate} onRefresh={cargar} loading={loading} cursorOn={cursorOn} cursorOff={cursorOff} />
      <main style={{ padding:"24px 24px 40px", background:C.bgPage, minHeight:"100vh", fontFamily:SANS }}>
        <PageHeader resumen={resumen} fechaInicio={fechaInicio} fechaFin={fechaFin} />
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
            {Array.from({length:6}).map((_,i) => <div key={i} style={{ height:90, background:C.bgCard, borderRadius:14, border:`1px solid ${C.border}` }} />)}
          </div>
        ) : resumen && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
            <KpiCard label="Total eventos" value={fmt(resumen.total_eventos)} contexto="Todos los accesos" accent={C.blue} icon={Activity} />
            <KpiCard label="Logins exitosos" value={fmt(resumen.logins_exitosos)} contexto="Accesos completados" accent={C.success} icon={CheckCircle} />
            <KpiCard label="Intentos fallidos" value={fmt(resumen.logins_fallidos)} contexto="Contraseña incorrecta" accent={C.error} icon={XCircle} />
            <KpiCard label="Usuarios únicos" value={fmt(resumen.usuarios_unicos)} contexto="Personas distintas" accent={C.purple} icon={Users} />
            <KpiCard label="Accesos hoy" value={fmt(resumen.accesos_hoy)} contexto="En el día de hoy" accent={C.orange} icon={Clock} tendencia={resumen.tendencia_pct} sub={`Ayer: ${resumen.accesos_ayer}`} />
            <KpiCard label="Tasa de éxito" value={resumen.total_eventos > 0 ? `${Math.round(resumen.logins_exitosos/resumen.total_eventos*100)}%` : "—"} contexto="Exitosos vs total" accent={C.gold} icon={TrendingUp} sub={`${resumen.logins_fallidos} fallidos`} />
          </div>
        )}
        <TabBar tab={tab} setTab={setTab} />
        {tab === "resumen" && <TabResumen porHora={porHora} porDia={porDia} distribucion={distribucion} distribucionWithFill={distribucionWithFill} fechaInicio={fechaInicio} />}
        {tab === "semanal" && <TabSemanal semanal={semanal} predSemanal={predSemanal} modeloSem={modeloSem} semanalComb={semanalComb} />}
        {tab === "diario" && <TabDiario diario={diario} predDiario={predDiario} modeloDia={modeloDia} diarioComb={diarioComb} />}
        {tab === "hora" && <TabHora porHora={porHora} fechaInicio={fechaInicio} />}
        {tab === "dia-semana" && <TabDiaSemana porDia={porDia} fechaInicio={fechaInicio} />}
        {tab === "pastel" && <TabPastel distribucion={distribucion} distribucionWithFill={distribucionWithFill} />}
        {tab === "calor" && <TabCalor mapaCalor={mapaCalor} mapaMax={mapaMax} mapaTop5={mapaTop5} />}
        {tab === "historial" && <TabHistorial historial={historial} filtroDia={filtroDia} setFiltroDia={setFiltroDia} />}
      </main>
    </>
  );
}