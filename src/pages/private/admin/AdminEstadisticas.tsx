// src/pages/private/admin/AdminEstadisticas.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ChevronRight, RefreshCw, Users, TrendingUp, TrendingDown,
  Clock, BarChart2, Table2, CheckCircle, XCircle,
  PieChart as PieIcon, Thermometer, Sparkles, Home,
  LogOut, Key, Lock, Filter, X, AlertTriangle, CalendarDays, Lightbulb,
} from "lucide-react";
const TrendingUpIcon = TrendingUp;
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Line, Legend,
  PieChart as RePieChart, Pie, Cell,
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
type Preset = "hoy"|"semana"|"mes"|"3meses"|"todo"|"custom";

interface FiltroState { inicio: string; fin: string; preset: Preset }

// Usa fecha LOCAL (no UTC) para que coincida con la hora del usuario en México
function localISO(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function hoy()    { return localISO(new Date()); }
function diasAtras(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return localISO(d);
}
function inicioSemana() {
  const d = new Date();
  // Semana domingo–sábado: getDay() = 0 para domingo
  d.setDate(d.getDate() - d.getDay());
  return localISO(d);
}
function inicioMes() {
  const d = new Date(); d.setDate(1);
  return localISO(d);
}

const PRESETS: { id: Preset; label: string }[] = [
  { id:"hoy",    label:"Hoy"         },
  { id:"semana", label:"Esta semana" },
  { id:"mes",    label:"Este mes"    },
  { id:"3meses", label:"3 meses"     },
  { id:"todo",   label:"Todo"        },
];

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

type Segmento = "todo" | "artista" | "cliente";

// ── Filtro de fechas + segmento de usuario ───────────────────────────
function FiltroFecha({
  filtro, onChange,
  segmento, onSegmentoChange,
}: {
  filtro: FiltroState; onChange: (f: FiltroState) => void;
  segmento: Segmento; onSegmentoChange: (s: Segmento) => void;
}) {
  const aplicarPreset = (id: Preset) => {
    const fin = hoy();
    let inicio = "";
    if (id === "hoy")    inicio = hoy();
    if (id === "semana") inicio = inicioSemana();
    if (id === "mes")    inicio = inicioMes();
    if (id === "3meses") inicio = diasAtras(90);
    if (id === "todo")   { onChange({ inicio: "", fin: "", preset: "todo" }); return; }
    onChange({ inicio, fin, preset: id });
  };

  const tieneFilro = filtro.preset !== "todo";

  const SEGMENTOS: { id: Segmento; label: string; color: string }[] = [
    { id:"todo",    label:"Todos",    color:C.blue   },
    { id:"artista", label:"Artistas", color:C.purple },
    { id:"cliente", label:"Clientes", color:C.orange },
  ];

  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:20, fontFamily:SANS }}>
      {/* Fila 1: período */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, color:C.orange, fontWeight:700, fontSize:12 }}>
          <Filter size={14} /> Período
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {PRESETS.map(p => {
            const on = filtro.preset === p.id;
            return (
              <button key={p.id} onClick={() => aplicarPreset(p.id)}
                style={{ padding:"5px 12px", borderRadius:8, border: on ? `1px solid ${C.orange}` : `1px solid ${C.border}`,
                  background: on ? `${C.orange}12` : "transparent",
                  color: on ? C.orange : C.muted,
                  fontFamily:SANS, fontSize:12, fontWeight: on ? 700 : 500, cursor:"pointer", transition:"all .15s" }}>
                {p.label}
              </button>
            );
          })}
        </div>

        <div style={{ width:1, height:20, background:C.border }} />

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.muted }}>Desde</span>
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <input type="date" value={filtro.inicio} max={filtro.fin || hoy()}
              onChange={e => onChange({ ...filtro, inicio: e.target.value, preset: "custom" })}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:C.inputBg, fontFamily:SANS, fontSize:12, color:C.ink, outline:"none" }} />
            {filtro.inicio && <span style={{ fontSize:9, color:C.muted, textAlign:"center" }}>{filtro.inicio.split("-").reverse().join("/")}</span>}
          </div>
          <span style={{ fontSize:11, color:C.muted }}>Hasta</span>
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <input type="date" value={filtro.fin} min={filtro.inicio} max={hoy()}
              onChange={e => onChange({ ...filtro, fin: e.target.value, preset: "custom" })}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:C.inputBg, fontFamily:SANS, fontSize:12, color:C.ink, outline:"none" }} />
            {filtro.fin && <span style={{ fontSize:9, color:C.muted, textAlign:"center" }}>{filtro.fin.split("-").reverse().join("/")}</span>}
          </div>
        </div>

        {tieneFilro && filtro.preset !== "todo" && (
          <button onClick={() => onChange({ inicio:"", fin:"", preset:"todo" })}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:11, cursor:"pointer" }}>
            <X size={11} /> Limpiar
          </button>
        )}

        {filtro.preset === "custom" && filtro.inicio && filtro.fin && (
          <span style={{ fontSize:11, color:C.orange, marginLeft:"auto" }}>
            {new Date(filtro.inicio + "T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"short"})}
            {" → "}
            {new Date(filtro.fin + "T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"short"})}
          </span>
        )}
      </div>

      {/* Divisor */}
      <div style={{ height:1, background:C.border, margin:"10px 0" }} />

      {/* Fila 2: segmento de usuario */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:C.blue }}>
          <Users size={14} /> Segmento
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {SEGMENTOS.map(s => {
            const on = segmento === s.id;
            return (
              <button key={s.id} onClick={() => onSegmentoChange(s.id)}
                style={{ padding:"5px 14px", borderRadius:8,
                  border: on ? `1px solid ${s.color}` : `1px solid ${C.border}`,
                  background: on ? `${s.color}12` : "transparent",
                  color: on ? s.color : C.muted,
                  fontFamily:SANS, fontSize:12, fontWeight: on ? 700 : 500,
                  cursor:"pointer", transition:"all .15s" }}>
                {s.label}
              </button>
            );
          })}
        </div>
        {segmento !== "todo" && (
          <span style={{ fontSize:11, color:C.muted }}>
            Mostrando solo <strong style={{ color:segmento==="artista"?C.purple:C.orange }}>{segmento === "artista" ? "artistas" : "clientes"}</strong> · el modelo exponencial y las predicciones reflejan solo ese grupo
          </span>
        )}
      </div>
    </div>
  );
}

// ── Encabezado de sección ────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, accent = C.orange }: { icon: React.ElementType; title: string; sub?: string; accent?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:32, height:32, borderRadius:10, background:`${accent}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={16} color={accent} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:C.ink }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{sub}</div>}
      </div>
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
          Histórico desde <strong>{fechaInicio}</strong> hasta <strong>{fechaFin}</strong>
          <span style={{ margin:"0 8px", opacity:0.3 }}>·</span>
          <span style={{ color:C.orange, fontWeight:500 }}>Análisis de interacción y predicción exponencial</span>
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

// ── ModeloBox ─────────────────────────────────────────────────────────
// Por defecto solo muestra la fórmula.
// El resto (R², error, tiempo característico, errores punto a punto)
// queda oculto y se expande con "Ver análisis técnico".
function ModeloBox({ modelo, periodo }: any) {
  const [verAnalisis, setVerAnalisis] = useState(false);
  const [verErrores,  setVerErrores]  = useState(false);

  const { estadisticos, y0, k, fase, t_caracteristico, errores } = modelo;
  const faseColor  = fase === "crecimiento" ? C.success : fase === "decrecimiento" ? C.error : C.gold;
  const confColor  = estadisticos.r2 >= 0.8 ? C.success : estadisticos.r2 >= 0.6 ? C.gold : C.error;
  const r2Pct      = (estadisticos.r2 * 100).toFixed(0);
  const errMed     = errores.filter((e: any) => e.error_relativo !== null)
                       .reduce((s: number, e: any) => s + (e.error_relativo ?? 0), 0)
                     / (errores.filter((e: any) => e.error_relativo !== null).length || 1);
  const tCaractLabel = fase === "crecimiento" ? "Los accesos se duplican cada"
                     : fase === "decrecimiento" ? "Los accesos se reducen a la mitad cada" : null;
  const tCaractVal   = t_caracteristico !== null && t_caracteristico <= 60 && tCaractLabel
                       ? `${t_caracteristico} periodos` : null;

  const kFmt        = k >= 0 ? `+${k}` : `${k}`;
  const ecuacionFmt = `p(t) = ${y0} · e^(${kFmt} · t)`;

  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:20 }}>

      {/* Cabecera — clickeable para expandir/colapsar */}
      <button
        onClick={() => setVerAnalisis(v => !v)}
        style={{ width:"100%", padding:"12px 20px", background:C.inputBg, border:"none", borderBottom: verAnalisis ? `1px solid ${C.border}` : "none", display:"flex", alignItems:"center", gap:8, cursor:"pointer", textAlign:"left" }}>
        <Sparkles size={14} color={faseColor} />
        <span style={{ fontSize:13, fontWeight:700, color:C.ink, fontFamily:SANS, flex:1 }}>
          Modelo predictivo — {periodo}
        </span>
        <span style={{ fontSize:10, padding:"2px 10px", borderRadius:40, background:`${faseColor}12`, color:faseColor, fontWeight:700, fontFamily:SANS }}>
          {fase === "crecimiento" ? "Crecimiento" : fase === "decrecimiento" ? "Decrecimiento" : "Estable"}
        </span>
        <ChevronRight size={14} color={C.muted} style={{ transform: verAnalisis ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }} />
      </button>

      {verAnalisis && (
      <div style={{ padding:"14px 20px" }}>

        {/* ── Fórmula ── */}
        <div style={{ background:C.bgPage, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10, fontFamily:SANS }}>
            Ley de Crecimiento / Decrecimiento Exponencial
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {/* Ley diferencial */}
            <div style={{ display:"flex", alignItems:"center" }}>
              <div style={{ fontSize:9, color:C.muted, width:148, flexShrink:0, fontFamily:SANS }}>Ley (ec. diferencial)</div>
              <div style={{ fontFamily:FM, fontSize:12.5, color:C.ink, fontWeight:500 }}>dp / p = k · dt</div>
            </div>
            {/* Solución general */}
            <div style={{ display:"flex", alignItems:"center" }}>
              <div style={{ fontSize:9, color:C.muted, width:148, flexShrink:0, fontFamily:SANS }}>Solución general</div>
              <div style={{ fontFamily:FM, fontSize:12.5, color:C.ink, fontWeight:500 }}>p(t) = C.I. · e^(k·t)</div>
            </div>
            {/* Modelo ajustado — resaltado */}
            <div style={{ display:"flex", alignItems:"center", background:`${faseColor}09`, borderRadius:8, padding:"7px 10px", marginTop:2 }}>
              <div style={{ fontSize:9, color:faseColor, width:148, flexShrink:0, fontWeight:700, fontFamily:SANS }}>Modelo ajustado</div>
              <div style={{ fontFamily:FM, fontSize:14, color:faseColor, fontWeight:700, letterSpacing:"0.01em" }}>
                {ecuacionFmt}
              </div>
            </div>
          </div>
        </div>

        {/* ── Análisis técnico (dentro del toggle principal) ── */}
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>

          {/* R² + Error relativo */}
          <div style={{ display:"flex", alignItems:"center", gap:16, padding:"8px 12px", background:C.bgPage, borderRadius:8, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:9, color:C.muted, fontFamily:SANS }}>R² ajustado</span>
              <span style={{ fontSize:14, fontWeight:700, fontFamily:FM, color:confColor }}>{r2Pct}%</span>
            </div>
            <div style={{ width:1, height:16, background:C.border }} />
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:9, color:C.muted, fontFamily:SANS }}>Error relativo</span>
              <span style={{ fontSize:14, fontWeight:700, fontFamily:FM, color: errMed < 20 ? C.success : C.gold }}>{errMed.toFixed(1)}%</span>
            </div>
            <div style={{ marginLeft:"auto", fontSize:10, color:C.muted, fontFamily:SANS }}>
              {estadisticos.r2 >= 0.8 ? "Confianza alta" : estadisticos.r2 >= 0.5 ? "Confianza media" : "Pocos datos — predicción aproximada"}
            </div>
          </div>

          {/* Errores punto a punto */}
          <button onClick={() => setVerErrores(v => !v)}
            style={{ background:"none", border:"none", color:C.muted, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:SANS, padding:0 }}>
            <ChevronRight size={12} style={{ transform:verErrores?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s" }} />
            {verErrores ? "Ocultar errores punto a punto" : "Ver errores punto a punto (sMAPE)"}
          </button>

          {verErrores && (
            <div style={{ paddingTop:8, borderTop:`1px solid ${C.border}` }}>
              <div style={{ maxHeight:160, overflowY:"auto", fontSize:10.5, fontFamily:FM }}>
                <div style={{ display:"flex", gap:12, padding:"4px 0", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:9, textTransform:"uppercase" }}>
                  <span style={{ width:40 }}>t</span>
                  <span style={{ width:60 }}>p real</span>
                  <span style={{ width:60 }}>p modelo</span>
                  <span>error %</span>
                </div>
                {errores.map((e: any, i: number) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ width:40, color:C.muted }}>t={e.x}</span>
                    <span style={{ width:60 }}>{e.y_real}</span>
                    <span style={{ width:60, color:C.blue }}>{Math.round(e.y_modelo)}</span>
                    <span style={{ color: e.error_relativo !== null && e.error_relativo > 20 ? C.error : C.success }}>
                      {e.error_relativo !== null ? `${e.error_relativo}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
      )}
    </div>
  );
}

// ── Mapa de actividad por día y bloque horario ──────────────────────
const BLOQUES_HORA = [
  { label:"Madrugada", sub:"00:00 – 05:59", horas:[0,1,2,3,4,5],     color:C.purple },
  { label:"Mañana",    sub:"06:00 – 11:59", horas:[6,7,8,9,10,11],   color:C.blue   },
  { label:"Tarde",     sub:"12:00 – 17:59", horas:[12,13,14,15,16,17], color:C.gold  },
  { label:"Noche",     sub:"18:00 – 23:59", horas:[18,19,20,21,22,23], color:C.orange},
];
const DIAS_FULL  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function MapaCalor({ datos }: any) {
  // Construir mapa: dia → hora → total
  const mapa: Record<number, Record<number, number>> = {};
  for (let d = 0; d < 7; d++) { mapa[d] = {}; for (let h = 0; h < 24; h++) mapa[d][h] = 0; }
  datos.forEach((c: CalorCell) => { mapa[c.dia][c.hora] = c.total; });

  // Agregar por bloques: grid[dia][bloque]
  const grid = DIAS_FULL.map((diaFull, di) => ({
    diaFull,
    diaShort: DIAS_SHORT[di],
    bloques: BLOQUES_HORA.map(b => ({
      ...b,
      total: b.horas.reduce((sum, h) => sum + (mapa[di]?.[h] ?? 0), 0),
    })),
    totalDia: Object.values(mapa[di]).reduce((a, b) => a + b, 0),
  }));

  const maxTotal = Math.max(...grid.flatMap(r => r.bloques.map(b => b.total)), 1);

  const cellStyle = (total: number, accentColor: string): React.CSSProperties => {
    if (total === 0) return { background: C.bgPage, border:`1px solid ${C.border}` };
    const r = total / maxTotal;
    const opacity = Math.round(10 + r * 75); // 10%–85%
    return {
      background: `${accentColor}${opacity.toString(16).padStart(2,"0")}`,
      border: `1px solid ${accentColor}30`,
    };
  };
  const textColor = (total: number, max: number): string =>
    total / max > 0.6 ? C.ink : C.muted;

  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"20px" }}>
      {/* Encabezado de columnas (bloques) */}
      <div style={{ display:"grid", gridTemplateColumns:"110px repeat(4,1fr) 72px", gap:6, marginBottom:10 }}>
        <div />
        {BLOQUES_HORA.map(b => (
          <div key={b.label} style={{ textAlign:"center", padding:"6px 4px", background:C.bgPage, borderRadius:8, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:b.color, fontFamily:SANS }}>{b.label}</div>
            <div style={{ fontSize:9, color:C.muted, marginTop:1 }}>{b.sub}</div>
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase" }}>
          Total
        </div>
      </div>

      {/* Filas: un día por fila */}
      {grid.map((row, ri) => (
        <div key={row.diaFull} style={{ display:"grid", gridTemplateColumns:"110px repeat(4,1fr) 72px", gap:6, marginBottom:6 }}>
          {/* Nombre del día */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:32, borderRadius:2, background: row.totalDia > 0 ? C.orange : C.border }} />
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.ink, fontFamily:SANS }}>{row.diaFull}</div>
              <div style={{ fontSize:9, color:C.muted }}>{row.diaShort}</div>
            </div>
          </div>

          {/* Celdas por bloque */}
          {row.bloques.map(b => (
            <div key={b.label} style={{ ...cellStyle(b.total, b.color), borderRadius:10, height:52, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
              {b.total > 0 ? (
                <>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:FM, color: textColor(b.total, maxTotal), lineHeight:1 }}>
                    {b.total}
                  </div>
                  <div style={{ fontSize:8, color:C.muted, marginTop:1 }}>accesos</div>
                </>
              ) : (
                <div style={{ fontSize:9, color:C.border }}>—</div>
              )}
            </div>
          ))}

          {/* Total del día */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", background: row.totalDia > 0 ? `${C.orange}10` : C.bgPage, borderRadius:10, border:`1px solid ${row.totalDia > 0 ? C.orange+"30" : C.border}` }}>
            <span style={{ fontSize:14, fontWeight:700, fontFamily:FM, color: row.totalDia > 0 ? C.orange : C.muted }}>
              {row.totalDia || "—"}
            </span>
          </div>
        </div>
      ))}

      {/* Leyenda de bloques */}
      <div style={{ marginTop:14, padding:"10px 14px", background:C.bgPage, borderRadius:10, display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
        {BLOQUES_HORA.map(b => (
          <div key={b.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:b.color }} />
            <span style={{ fontSize:10, color:C.muted, fontFamily:SANS }}>{b.label} <span style={{ color:b.color, fontWeight:600 }}>{b.sub}</span></span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:8, fontSize:10, color:C.muted, textAlign:"center", fontFamily:SANS }}>
        Los números son accesos acumulados del período seleccionado · "Lunes" = suma de todos los lunes del rango
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

// ── Helper: fecha fin de semana (inicio + 6 días) ────────────────────
function semanaFinLabel(semanaIsoStr: string): string {
  try {
    const d = new Date(semanaIsoStr + "T12:00:00Z");
    d.setDate(d.getDate() + 6);
    return d.toLocaleDateString("es-MX", { day:"2-digit", month:"short" });
  } catch { return ""; }
}

// ── Tooltip semanal con rango de fecha ───────────────────────────────
const ChartTipSemanal = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.payload;
  const fin = raw?.semana ? semanaFinLabel(raw.semana) : "";
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", boxShadow:`0 4px 12px ${C.shadow}`, fontFamily:SANS }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.orange, marginBottom:4 }}>Semana del {label}</div>
      {fin && <div style={{ fontSize:10, color:C.muted, marginBottom:8 }}>al {fin} (lun → dom)</div>}
      {payload.map((p: any) => (
        <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }} />
          <span style={{ color:C.muted }}>{p.name}:</span>
          <strong style={{ color:C.ink }}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Tooltip para sección de predicción ──────────────────────────────
const PredTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", boxShadow:`0 4px 12px ${C.shadow}`, fontFamily:SANS }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.gold, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, fontFamily:FM, color:C.ink }}>
        {payload[0]?.value} <span style={{ fontSize:10, fontWeight:400, color:C.muted }}>accesos estimados</span>
      </div>
    </div>
  );
};

// ── Sección de predicciones con selector de vista ────────────────────
function PredSection({ pred, esSemanal }: { pred: any[]; esSemanal: boolean }) {
  const [vista, setVista] = useState<"tarjetas"|"barras"|"area">("tarjetas");

  // Normalizar: siempre tener un campo `lbl` con la etiqueta de fecha legible
  // - semanal: prefiere fecha_label ("16-mar"), fallback label ("S10")
  // - diario:  label ya es la fecha formateada ("13-abr")
  const data = pred.map((p: any) => ({
    ...p,
    lbl: p.fecha_label ?? p.label ?? "—",
  }));

  const VISTAS = [
    { id:"tarjetas" as const, label:"Tarjetas" },
    { id:"barras"   as const, label:"Barras"   },
    { id:"area"     as const, label:"Área"     },
  ];

  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
      {/* Encabezado + selector */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <TrendingUpIcon size={14} color={C.gold} />
        <span style={{ fontSize:13, fontWeight:700, color:C.ink, flex:1 }}>
          {esSemanal ? "Próximas 4 semanas" : "Próximos 7 días"} — predicción
        </span>
        <div style={{ display:"flex", gap:3, background:C.inputBg, borderRadius:8, padding:3, border:`1px solid ${C.border}` }}>
          {VISTAS.map(v => {
            const on = vista === v.id;
            return (
              <button key={v.id} onClick={() => setVista(v.id)}
                style={{ padding:"3px 12px", borderRadius:6, border: on ? `1px solid ${C.gold}` : "1px solid transparent",
                  background: on ? C.bgCard : "transparent", color: on ? C.gold : C.muted,
                  fontSize:11, fontWeight: on ? 700 : 500, fontFamily:SANS, cursor:"pointer", transition:"all .15s" }}>
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista: Tarjetas */}
      {vista === "tarjetas" && (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${data.length},1fr)`, gap:10 }}>
          {data.map((p: any, i: number) => (
            <div key={i} style={{ textAlign:"center", padding:"12px 8px", background:`${C.gold}08`, borderRadius:12, border:`1px solid ${C.gold}25` }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{p.lbl}</div>
              <div style={{ fontSize:22, fontWeight:700, color:C.gold, fontFamily:FM, lineHeight:1.1 }}>{p.prediccion}</div>
              <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>accesos estimados</div>
            </div>
          ))}
        </div>
      )}

      {/* Vista: Barras */}
      {vista === "barras" && (
        <ResponsiveContainer width="100%" height={220}>
          <ReBarChart data={data} margin={{ top:10, right:16, bottom:24, left:0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="lbl" tick={{ fill:C.muted, fontSize:10 }} label={{ value: esSemanal ? "Semana" : "Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<PredTip />} />
            <Bar dataKey="prediccion" name="Predicción" fill={C.gold} radius={[5,5,0,0]} fillOpacity={0.85} maxBarSize={60} />
          </ReBarChart>
        </ResponsiveContainer>
      )}

      {/* Vista: Área */}
      {vista === "area" && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top:10, right:16, bottom:24, left:0 }}>
            <defs>
              <linearGradient id="gradPredGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.gold} stopOpacity={0.28} />
                <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="lbl" tick={{ fill:C.muted, fontSize:10 }} label={{ value: esSemanal ? "Semana" : "Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
            <Tooltip content={<PredTip />} />
            <Area type="monotone" dataKey="prediccion" name="Predicción" stroke={C.gold} strokeWidth={2.5} fill="url(#gradPredGold)" dot={{ r:5, fill:C.gold, strokeWidth:0 }} activeDot={{ r:7 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Paleta cíclica para gráfica de pastel en tendencia
const PIE_TREND_COLORS = [C.blue, C.purple, C.orange, C.gold, C.pink, C.success, "#2D9CDB","#6FCF97","#F2994A","#9B51E0"];

type TipoGrafica = "area" | "barras" | "pastel";

// ── Tooltip para pastel de tendencia ────────────────────────────────
const PieTipTendencia = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", boxShadow:`0 4px 12px ${C.shadow}`, fontFamily:SANS }}>
      <div style={{ fontSize:12, fontWeight:700, color:p.payload.fill, marginBottom:4 }}>{p.name}</div>
      <div style={{ fontSize:18, fontWeight:700, fontFamily:FM, color:C.ink }}>{fmt(p.value)}</div>
      <div style={{ fontSize:10, color:C.muted }}>accesos en el período</div>
    </div>
  );
};

// ── Sección: Tendencia (toggle día / semana + tipo de gráfica) ────────
function SeccionTendencia({ semanalComb, predSemanal, modeloSem, modeloSemExtendido, diarioComb, predDiario, modeloDia, modeloDiaExtendido }: any) {
  // Contar puntos reales de cada vista
  const semanalPuntos = semanalComb.filter((d: any) => d.total !== undefined).length;
  const diarioPuntos  = diarioComb.filter((d: any)  => d.total !== undefined).length;

  // Auto-switch: si hay pocas semanas, mostrar vista diaria
  const [granularidad, setGranularidad] = useState<"dia"|"semana">("semana");
  const [tipoGrafica, setTipoGrafica] = useState<TipoGrafica>("area");

  useEffect(() => {
    if (semanalPuntos < 4) setGranularidad("dia");
  }, [semanalPuntos]);

  const esSemanal    = granularidad === "semana";
  const comb         = esSemanal ? semanalComb : diarioComb;
  const pred         = esSemanal ? predSemanal : predDiario;
  const modelo       = esSemanal ? modeloSem   : modeloDia;
  const nPuntos      = esSemanal ? semanalPuntos : diarioPuntos;
  const extendido    = esSemanal ? modeloSemExtendido : modeloDiaExtendido;
  // Válido: ≥4 puntos en pantalla, o backend extendido con ≥2 puntos históricos
  const modeloValido = modelo && (nPuntos >= 4 || (extendido && nPuntos >= 2));

  const datosReales = comb.filter((d: any) => d.total !== undefined);

  const periodoLabel = (() => {
    if (datosReales.length === 0) return "Sin datos";
    if (datosReales.length === 1) return datosReales[0].fecha_label ?? datosReales[0].label;
    return `${datosReales[0].fecha_label ?? datosReales[0].label} – ${datosReales[datosReales.length-1].fecha_label ?? datosReales[datosReales.length-1].label} (${datosReales.length} ${esSemanal ? "sem." : "días"})`;
  })();

  // Datos pie: cada punto real como slice
  const dataPie = datosReales.map((d: any, i: number) => ({
    name: d.fecha_label ?? d.label,
    value: d.total,
    fill: PIE_TREND_COLORS[i % PIE_TREND_COLORS.length],
  }));

  const TIPOS: { id: TipoGrafica; label: string }[] = [
    { id:"area",   label:"Área"   },
    { id:"barras", label:"Barras" },
    { id:"pastel", label:"Pastel" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Controles: granularidad + tipo de gráfica */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        {/* Toggle granularidad */}
        <div style={{ display:"flex", alignItems:"center", gap:4, background:C.inputBg, borderRadius:10, padding:3, border:`1px solid ${C.border}` }}>
          {(["semana","dia"] as const).map(g => {
            const on = granularidad === g;
            return (
              <button key={g} onClick={() => setGranularidad(g)}
                style={{ padding:"5px 16px", borderRadius:8, border: on ? `1px solid ${C.orange}` : "1px solid transparent",
                  background: on ? C.bgCard : "transparent", color: on ? C.orange : C.muted,
                  fontSize:12, fontWeight: on ? 700 : 500, fontFamily:SANS, cursor:"pointer", transition:"all .15s" }}>
                {g === "semana" ? "Por semana" : "Por día"}
              </button>
            );
          })}
        </div>

        <div style={{ width:1, height:20, background:C.border }} />

        {/* Toggle tipo de gráfica */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:SANS }}>Vista:</span>
          <div style={{ display:"flex", alignItems:"center", gap:4, background:C.inputBg, borderRadius:10, padding:3, border:`1px solid ${C.border}` }}>
            {TIPOS.map(t => {
              const on = tipoGrafica === t.id;
              return (
                <button key={t.id} onClick={() => setTipoGrafica(t.id)}
                  style={{ padding:"4px 14px", borderRadius:8, border: on ? `1px solid ${C.purple}` : "1px solid transparent",
                    background: on ? C.bgCard : "transparent", color: on ? C.purple : C.muted,
                    fontSize:11, fontWeight: on ? 700 : 500, fontFamily:SANS, cursor:"pointer", transition:"all .15s" }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aviso de semanas insuficientes */}
        {esSemanal && semanalPuntos < 4 && (
          <span style={{ fontSize:11, color:C.gold, fontFamily:SANS }}>
            Con {semanalPuntos} sem. el modelo no es confiable — cambia a "Por día"
          </span>
        )}
      </div>

      {/* Nota sobre semanas */}
      {esSemanal && semanalPuntos > 0 && tipoGrafica !== "pastel" && (
        <div style={{ padding:"8px 14px", background:`${C.blue}07`, border:`1px solid ${C.blue}18`, borderRadius:8, fontSize:11, color:C.muted, fontFamily:SANS }}>
          <span style={{ color:C.blue, fontWeight:700 }}>ℹ </span>
          Cada barra = una semana completa (lunes → domingo). Si el filtro empieza a mitad de semana, la primera barra puede
          verse más pequeña. Pasa el cursor sobre cada barra para ver el rango exacto.
        </div>
      )}

      {/* Nota modelo extendido */}
      {modeloValido && extendido && (
        <div style={{ padding:"8px 14px", background:`${C.purple}08`, border:`1px solid ${C.purple}20`, borderRadius:8, fontSize:11, color:C.muted, fontFamily:SANS, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:C.purple, fontWeight:700 }}>★</span>
          <span>
            <strong style={{ color:C.purple }}>Predicción basada en todo el histórico.</strong>{" "}
            El período seleccionado tiene pocos datos, por lo que el modelo usa todos los registros disponibles
            para calcular la tendencia. La gráfica solo muestra el rango filtrado.
          </span>
        </div>
      )}

      {modeloValido && <ModeloBox modelo={modelo} periodo={periodoLabel} />}

      {nPuntos === 0 ? (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"48px", textAlign:"center", color:C.muted, fontSize:13 }}>
          No hay registros en el período seleccionado.
        </div>

      ) : tipoGrafica === "pastel" ? (
        /* ── PASTEL ── */
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{periodoLabel}</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>Distribución de accesos por {esSemanal ? "semana" : "día"}</div>
          <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
            <ResponsiveContainer width={280} height={280}>
              <RePieChart>
                <Pie data={dataPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={55} paddingAngle={2}>
                  {dataPie.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip content={<PieTipTendencia />} />
              </RePieChart>
            </ResponsiveContainer>
            {/* Leyenda lateral */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6, maxHeight:260, overflowY:"auto" }}>
              {dataPie.map((d: any, i: number) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 8px", borderRadius:8, background:C.bgPage, border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:d.fill, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:C.ink, fontFamily:SANS }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:FM, color:d.fill }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : tipoGrafica === "barras" ? (
        /* ── BARRAS ── */
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>{periodoLabel}</div>
          <ResponsiveContainer width="100%" height={300}>
            <ReBarChart data={comb} margin={{ top:20, right:30, bottom:30, left:0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={esSemanal ? "fecha_label" : "label"} tick={{ fill:C.muted, fontSize:9, interval: esSemanal ? 0 : 2 }} label={{ value: esSemanal ? "Semana" : "Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
              <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
              <Tooltip content={esSemanal ? <ChartTipSemanal /> : <ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
              <Bar dataKey="total" name="Accesos reales" fill={C.blue} radius={[4,4,0,0]} fillOpacity={0.85} />
              {modeloValido && <Bar dataKey="prediccion" name="Predicción" fill={C.gold} radius={[4,4,0,0]} fillOpacity={0.65} />}
            </ReBarChart>
          </ResponsiveContainer>
        </div>

      ) : (
        /* ── ÁREA (default) ── */
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>{periodoLabel}</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={comb} margin={{ top:20, right:30, bottom:30, left:0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.orange} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={esSemanal ? "fecha_label" : "label"} tick={{ fill:C.muted, fontSize:9, interval: esSemanal ? 0 : 2 }} label={{ value: esSemanal ? "Semana" : "Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
              <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
              <Tooltip content={esSemanal ? <ChartTipSemanal /> : <ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
              <Area type="monotone" dataKey="total" name="Accesos reales" stroke={C.blue} strokeWidth={2} fill="url(#gradBlue)" dot={false} />
              {modeloValido && <Area type="monotone" dataKey="prediccion" name="Predicción" stroke={C.gold} strokeWidth={2} fill="none" strokeDasharray="5 3" dot={{ r:3, fill:C.gold }} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sección de predicción con selector de vista */}
      {modeloValido && pred.length > 0 && tipoGrafica !== "pastel" && (
        <PredSection pred={pred} esSemanal={esSemanal} />
      )}
    </div>
  );
}



// ── Historial de accesos con paginación ─────────────────────────────
const POR_PAGINA = 50;

function TabHistorial({ historial, filtroDia, setFiltroDia }: any) {
  const [pagina, setPagina] = useState(1);

  const filtrado = filtroDia === "todos"
    ? historial
    : historial.filter((e: EventoHistorial) => e.tipo_evento === filtroDia);

  const totalPaginas = Math.max(1, Math.ceil(filtrado.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * POR_PAGINA;
  const pagActual = filtrado.slice(inicio, inicio + POR_PAGINA);

  // Al cambiar filtro, volver a la primera página
  const handleFiltro = (tipo: string) => { setFiltroDia(tipo); setPagina(1); };

  return (
    <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
      {/* Cabecera */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.inputBg, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Table2 size={14} color={C.orange} />
          <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Historial de accesos</span>
          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:40, background:`${C.orange}10`, color:C.orange }}>{filtrado.length} registros</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["todos", "LOGIN_EXITOSO", "LOGIN_FALLIDO", "LOGOUT"].map(tipo => {
            const on = filtroDia === tipo;
            const ev = EVENTO_LABELS[tipo] ?? { label:"Todos", color:C.muted };
            const IconComponent = EVENTO_ICONS[tipo] || Activity;
            return (
              <button key={tipo} onClick={() => handleFiltro(tipo)}
                style={{ padding:"4px 10px", borderRadius:8, border: on ? `1px solid ${ev.color}` : `1px solid ${C.border}`, background: on ? `${ev.color}10` : "transparent", color: on ? ev.color : C.muted, fontSize:11, cursor:"pointer", transition:"all 0.2s" }}>
                <IconComponent size={10} style={{ marginRight:4 }} />
                {tipo === "todos" ? "Todos" : ev.label.replace("Acceso exitoso","Exitoso").replace("Contraseña incorrecta","Fallido").replace("Cierre de sesión","Salida")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:C.inputBg, borderBottom:`1px solid ${C.border}` }}>
              {["Fecha y hora","Usuario","Correo","Evento","IP","Detalle"].map(h =>
                <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:C.muted, fontWeight:600 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pagActual.map((e: EventoHistorial, i: number) => {
              const ev = EVENTO_LABELS[e.tipo_evento] ?? { label:e.tipo_evento, color:C.blue };
              const IconComponent = EVENTO_ICONS[e.tipo_evento] || Activity;
              return (
                <tr key={e.id_historial} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"transparent":C.inputBg }}>
                  <td style={{ padding:"8px 12px", whiteSpace:"nowrap", color:C.muted }}>{new Date(e.fecha).toLocaleString()}</td>
                  <td style={{ padding:"8px 12px", fontWeight:600 }}>{e.nombre_completo || "—"}</td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.correo}</td>
                  <td style={{ padding:"8px 12px" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:`${ev.color}10`, padding:"2px 8px", borderRadius:20, fontSize:11, color:ev.color }}>
                      <IconComponent size={10} /> {ev.label}
                    </span>
                  </td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.ip_address || "—"}</td>
                  <td style={{ padding:"8px 12px", color:C.muted }}>{e.detalles || "—"}</td>
                </tr>
              );
            })}
            {filtrado.length === 0 && (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:C.muted }}>No hay registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.inputBg }}>
          <span style={{ fontSize:11, color:C.muted }}>
            Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, filtrado.length)} de {filtrado.length}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <button onClick={() => setPagina(1)} disabled={paginaSegura === 1}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:paginaSegura===1?C.border:C.muted, fontSize:11, cursor:paginaSegura===1?"default":"pointer" }}>
              «
            </button>
            <button onClick={() => setPagina(p => Math.max(1, p-1))} disabled={paginaSegura === 1}
              style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:paginaSegura===1?C.border:C.muted, fontSize:11, cursor:paginaSegura===1?"default":"pointer" }}>
              ‹ Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaSegura) <= 1)
              .reduce<(number|"…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && (n as number) - (arr[idx-1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) => n === "…"
                ? <span key={`e${i}`} style={{ padding:"4px 6px", fontSize:11, color:C.muted }}>…</span>
                : <button key={n} onClick={() => setPagina(n as number)}
                    style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${n===paginaSegura?C.orange:C.border}`, background:n===paginaSegura?`${C.orange}10`:"transparent", color:n===paginaSegura?C.orange:C.muted, fontSize:11, fontWeight:n===paginaSegura?700:400, cursor:"pointer" }}>
                    {n}
                  </button>
              )
            }

            <button onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} disabled={paginaSegura === totalPaginas}
              style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:paginaSegura===totalPaginas?C.border:C.muted, fontSize:11, cursor:paginaSegura===totalPaginas?"default":"pointer" }}>
              Siguiente ›
            </button>
            <button onClick={() => setPagina(totalPaginas)} disabled={paginaSegura === totalPaginas}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:paginaSegura===totalPaginas?C.border:C.muted, fontSize:11, cursor:paginaSegura===totalPaginas?"default":"pointer" }}>
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sección: Interpretación del modelo y recomendaciones ────────────
function SeccionInterpretacion({ modeloDia, modeloSem, porHora, porDia, segmento, modeloDiaExtendido, modeloSemExtendido }: any) {
  // Usar modelo diario si existe y tiene datos, si no el semanal
  const modelo = modeloDia ?? modeloSem;
  const extendido = modeloDia ? modeloDiaExtendido : modeloSemExtendido;
  const esSemanal = !modeloDia && !!modeloSem;
  if (!modelo) return null;

  const { y0, k, fase, estadisticos } = modelo;
  const faseColor = fase === "crecimiento" ? C.success : fase === "decrecimiento" ? C.error : C.gold;
  const kPct      = (Math.abs(k) * 100).toFixed(2);
  const unidad    = esSemanal ? "semana" : "día";
  const r2        = estadisticos.r2;

  // Hora pico
  const horaPico = porHora.length > 0
    ? porHora.reduce((m: any, d: any) => d.total > m.total ? d : m, porHora[0])
    : null;
  // Día de semana pico
  const diaPico = porDia.length > 0
    ? porDia.reduce((m: any, d: any) => d.total > m.total ? d : m, porDia[0])
    : null;

  // Recomendaciones dinámicas
  interface Rec { color: string; Icon: React.ElementType; titulo: string; texto: string }
  const recs: Rec[] = [];

  // 1. Hora pico
  if (horaPico && horaPico.total > 0) {
    recs.push({
      color: C.blue, Icon: Clock,
      titulo: `Hora pico de accesos: ${horaPico.label}`,
      texto: `La mayor concentración de usuarios ocurre a las ${horaPico.label}. Asegura la disponibilidad de la plataforma en esa franja horaria y evita programar mantenimientos en ese período.`,
    });
  }

  // 2. Día más activo
  if (diaPico && diaPico.total > 0) {
    recs.push({
      color: C.purple, Icon: CalendarDays,
      titulo: `Día más activo: ${diaPico.label}`,
      texto: `El ${diaPico.label} concentra el mayor número de interacciones de la semana. Es el momento ideal para publicar contenido nuevo, obras destacadas o enviar comunicaciones a los usuarios.`,
    });
  }


  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader icon={Lightbulb} title="Interpretación del modelo" sub="Condiciones iniciales · análisis de resultados · recomendaciones de gestión" accent={C.purple} />

      {/* Recomendaciones */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display:"flex", gap:14, padding:"14px 18px", borderRadius:13, background:`${r.color}07`, border:`1px solid ${r.color}22`, alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:10, background:`${r.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <r.Icon size={15} color={r.color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.ink, fontFamily:SANS, marginBottom:3 }}>{r.titulo}</div>
              <div style={{ fontSize:12.5, color:C.ink, fontFamily:SANS, lineHeight:1.6, opacity:0.75 }}>{r.texto}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
export default function AdminEstadisticas() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dotRef, ringRef, cursorOn, cursorOff } = useCustomCursor();
  const [filtro, setFiltro] = useState<FiltroState>({ inicio:"", fin:"", preset:"todo" });
  const [segmento, setSegmento] = useState<Segmento>("todo");
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
  const [modeloSemExtendido, setModeloSemExtendido] = useState(false);
  const [modeloDiaExtendido, setModeloDiaExtendido] = useState(false);
  const [distribucion, setDistribucion] = useState<DistItem[]>([]);
  const distribucionWithFill = distribucion.map(d => ({ ...d, fill: PIE_COLORS[d.tipo_evento] ?? C.blue }));
  const [mapaCalor, setMapaCalor] = useState<CalorCell[]>([]);
  const [mapaMax, setMapaMax] = useState(1);
  const [mapaTop5, setMapaTop5] = useState<CalorCell[]>([]);
  const [historial, setHistorial] = useState<EventoHistorial[]>([]);
  const [filtroDia, setFiltroDia] = useState<string>("todos");

  const buildQS = useCallback((f: FiltroState, seg: Segmento) => {
    const p = new URLSearchParams();
    if (f.inicio) p.set("fecha_inicio", f.inicio);
    if (f.fin)    p.set("fecha_fin",    f.fin);
    if (seg !== "todo") p.set("rol", seg);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const cargar = useCallback(async (f?: FiltroState, seg?: Segmento) => {
    setLoading(true);
    const useSeg = seg ?? segmento;
    const qs = buildQS(f ?? filtro, useSeg);
    try {
      const headers = authH();
      const [rR,hR,dR,sR,diR,distR,mcR,hiR] = await Promise.all([
        fetch(`${API}/api/estadisticas/resumen${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/por-hora${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/por-dia-semana${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/por-semana${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/por-dia${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/distribucion${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/mapa-calor${qs}`, { headers }),
        fetch(`${API}/api/estadisticas/historial${qs}`, { headers }),
      ]);
      const [rJ,hJ,dJ,sJ,diJ,distJ,mcJ,hiJ] = await Promise.all([rR.json(),hR.json(),dR.json(),sR.json(),diR.json(),distR.json(),mcR.json(),hiR.json()]);
      if (rJ.success) setResumen(rJ.data);
      if (hJ.success) setPorHora(hJ.data);
      if (dJ.success) setPorDia(dJ.data);
      if (sJ.success) { setSemanal(sJ.data); setPredSemanal(sJ.predicciones); setModeloSem(sJ.modelo); setModeloSemExtendido(!!sJ.modelo_extendido); }
      if (diJ.success) { setDiario(diJ.data); setPredDiario(diJ.predicciones); setModeloDia(diJ.modelo); setModeloDiaExtendido(!!diJ.modelo_extendido); }
      if (distJ.success) setDistribucion(distJ.data);
      if (mcJ.success) { setMapaCalor(mcJ.data); setMapaMax(mcJ.max_valor); setMapaTop5(mcJ.top5); }
      if (hiJ.success) setHistorial(hiJ.data);
    } catch (err) { showToast("Error al cargar estadísticas","err"); }
    finally { setLoading(false); }
  }, [showToast, filtro, segmento, buildQS]);

  useEffect(() => { cargar(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltroChange = useCallback((f: FiltroState) => {
    setFiltro(f);
    cargar(f, segmento);
  }, [cargar, segmento]);

  const handleSegmentoChange = useCallback((seg: Segmento) => {
    setSegmento(seg);
    cargar(filtro, seg);
  }, [cargar, filtro]);

  const fechaInicio = historial.length > 0 ? new Date(historial[historial.length-1]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const fechaFin    = historial.length > 0 ? new Date(historial[0]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const semanalComb = [...semanal.map(d=>({...d})), ...predSemanal.map(d=>({...d,total:undefined}))];
  const diarioComb  = [...diario.map(d=>({...d})), ...predDiario.map(d=>({...d,total:undefined}))];
  const pvH = findPicoValle(porHora);
  const pvD = findPicoValle(porDia);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
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

      <Topbar navigate={navigate} onRefresh={() => cargar()} loading={loading} cursorOn={cursorOn} cursorOff={cursorOff} />
      <main style={{ padding:"24px 24px 60px", background:C.bgPage, minHeight:"100vh", fontFamily:SANS }}>
        <PageHeader resumen={resumen} fechaInicio={fechaInicio} fechaFin={fechaFin} />
        <FiltroFecha filtro={filtro} onChange={handleFiltroChange} segmento={segmento} onSegmentoChange={handleSegmentoChange} />

        {/* ── Banner de segmento activo ───────────────────────────── */}
        {segmento !== "todo" && (
          <div style={{
            marginBottom: 20,
            padding: "10px 16px",
            borderRadius: 12,
            background: segmento === "artista" ? `${C.purple}10` : `${C.orange}10`,
            border: `1px solid ${segmento === "artista" ? C.purple : C.orange}30`,
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: SANS,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: segmento === "artista" ? C.purple : C.orange,
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${segmento === "artista" ? C.purple : C.orange}30`,
            }} />
            <span style={{ fontSize: 12, color: C.ink }}>
              <strong style={{ color: segmento === "artista" ? C.purple : C.orange }}>
                Filtrando por segmento: {segmento === "artista" ? "Artistas" : "Clientes"}
              </strong>
              {" — "}todos los datos (KPIs, gráficas, mapa de calor, historial) muestran solo este grupo.
            </span>
            <button
              onClick={() => handleSegmentoChange("todo")}
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 11, fontFamily: SANS }}>
              <X size={12} /> Ver todos
            </button>
          </div>
        )}

        {/* ── KPIs ───────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:32 }}>
            {Array.from({length:6}).map((_,i) => <div key={i} style={{ height:90, background:C.bgCard, borderRadius:14, border:`1px solid ${C.border}` }} />)}
          </div>
        ) : resumen && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:32 }}>
            <KpiCard label="Total eventos" value={fmt(resumen.total_eventos)} contexto="Todos los accesos" accent={C.blue} icon={Activity} />
            <KpiCard label="Logins exitosos" value={fmt(resumen.logins_exitosos)} contexto="Accesos completados" accent={C.success} icon={CheckCircle} />
            <KpiCard label="Intentos fallidos" value={fmt(resumen.logins_fallidos)} contexto="Contraseña incorrecta" accent={C.error} icon={XCircle} />
            <KpiCard label="Usuarios únicos" value={fmt(resumen.usuarios_unicos)} contexto="Personas distintas" accent={C.purple} icon={Users} />
            <KpiCard label="Accesos hoy" value={fmt(resumen.accesos_hoy)} contexto="En el día de hoy" accent={C.orange} icon={Clock} tendencia={resumen.tendencia_pct} sub={`Ayer: ${resumen.accesos_ayer}`} />
            <KpiCard label="Tasa de éxito" value={resumen.total_eventos > 0 ? `${Math.round(resumen.logins_exitosos/resumen.total_eventos*100)}%` : "—"} contexto="Exitosos vs total" accent={C.gold} icon={TrendingUp} sub={`${resumen.logins_fallidos} fallidos`} />
          </div>
        )}

        {/* ── §1 Tendencia ───────────────────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={TrendingUpIcon} title="Tendencia de accesos" sub="Evolución en el tiempo · modelo exponencial + predicción" />
          <SeccionTendencia semanalComb={semanalComb} predSemanal={predSemanal} modeloSem={modeloSem} modeloSemExtendido={modeloSemExtendido} diarioComb={diarioComb} predDiario={predDiario} modeloDia={modeloDia} modeloDiaExtendido={modeloDiaExtendido} />
        </section>

        {/* ── §2 Interpretación del modelo ────────────────────────── */}
        <SeccionInterpretacion
          modeloDia={modeloDia}
          modeloSem={modeloSem}
          modeloDiaExtendido={modeloDiaExtendido}
          modeloSemExtendido={modeloSemExtendido}
          porHora={porHora}
          porDia={porDia}
          segmento={segmento}
        />

        {/* ── §3 Patrones de actividad ────────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={BarChart2} title="Patrones de actividad" sub="Distribución acumulada por hora del día y día de la semana" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Por hora */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4 }}>Por hora del día</div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Acumulado del período · exitosos y fallidos</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={porHora} margin={{ top:10, right:16, bottom:24, left:0 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Hora", position:"insideBottom", offset:-8, fill:C.muted, fontSize:9 }} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:9 }} />
                    <Tooltip content={<ChartTip />} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:10, paddingTop:6 }} />
                    <Bar dataKey="exitosos" name="Exitosos" fill={C.success} radius={[3,3,0,0]} stackId="a" fillOpacity={0.85} />
                    <Bar dataKey="fallidos" name="Fallidos" fill={C.error} radius={[3,3,0,0]} stackId="a" fillOpacity={0.8} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              {pvH && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {/* Hora pico */}
                  <div style={{ borderRadius:14, border:`1px solid ${C.orange}22`, background:`${C.orange}06`, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, borderRadius:"14px 14px 0 0", background:C.orange }} />
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                      <Clock size={13} color={C.orange} />
                      <span style={{ fontSize:10, fontWeight:700, color:C.orange, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:SANS }}>Hora pico</span>
                    </div>
                    <div style={{ fontSize:30, fontWeight:700, fontFamily:FM, color:C.ink, lineHeight:1, letterSpacing:"-0.02em" }}>{(pvH.pico as any).label}</div>
                    <div style={{ fontSize:11, color:"#5A5870", marginTop:6, fontFamily:SANS }}>
                      <strong style={{ color:C.orange, fontFamily:FM }}>{pvH.pico.total}</strong> accesos acumulados
                    </div>
                  </div>
                  {/* Menor actividad */}
                  <div style={{ borderRadius:14, border:`1px solid ${C.blue}22`, background:`${C.blue}06`, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, borderRadius:"14px 14px 0 0", background:C.blue }} />
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                      <Clock size={13} color={C.blue} />
                      <span style={{ fontSize:10, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:SANS }}>Menor actividad</span>
                    </div>
                    <div style={{ fontSize:30, fontWeight:700, fontFamily:FM, color:C.ink, lineHeight:1, letterSpacing:"-0.02em" }}>{(pvH.valle as any).label}</div>
                    <div style={{ fontSize:11, color:"#5A5870", marginTop:6, fontFamily:SANS }}>
                      <strong style={{ color:C.blue, fontFamily:FM }}>{pvH.valle.total}</strong> accesos acumulados
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Por día de semana */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4 }}>Por día de la semana</div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>Suma de todos los lunes, martes, etc. del período</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={porDia} margin={{ top:10, right:16, bottom:24, left:0 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Día", position:"insideBottom", offset:-8, fill:C.muted, fontSize:9 }} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:9 }} />
                    <Tooltip content={<ChartTip />} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:10, paddingTop:6 }} />
                    <Bar dataKey="exitosos" name="Exitosos" fill={C.purple} radius={[3,3,0,0]} stackId="a" fillOpacity={0.85} />
                    <Bar dataKey="fallidos" name="Fallidos" fill={C.pink} radius={[3,3,0,0]} stackId="a" fillOpacity={0.8} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              {pvD && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {/* Día más activo */}
                  <div style={{ borderRadius:14, border:`1px solid ${C.success}22`, background:`${C.success}06`, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, borderRadius:"14px 14px 0 0", background:C.success }} />
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                      <CalendarDays size={13} color={C.success} />
                      <span style={{ fontSize:10, fontWeight:700, color:C.success, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:SANS }}>Día más activo</span>
                    </div>
                    <div style={{ fontSize:30, fontWeight:700, fontFamily:FM, color:C.ink, lineHeight:1, letterSpacing:"-0.02em" }}>{(pvD.pico as any).label}</div>
                    <div style={{ fontSize:11, color:"#5A5870", marginTop:6, fontFamily:SANS }}>
                      <strong style={{ color:C.success, fontFamily:FM }}>{pvD.pico.total}</strong> accesos acumulados
                    </div>
                  </div>
                  {/* Día menos activo */}
                  <div style={{ borderRadius:14, border:`1px solid ${C.purple}22`, background:`${C.purple}06`, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, borderRadius:"14px 14px 0 0", background:C.purple }} />
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                      <CalendarDays size={13} color={C.purple} />
                      <span style={{ fontSize:10, fontWeight:700, color:C.purple, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:SANS }}>Día menos activo</span>
                    </div>
                    <div style={{ fontSize:30, fontWeight:700, fontFamily:FM, color:C.ink, lineHeight:1, letterSpacing:"-0.02em" }}>{(pvD.valle as any).label}</div>
                    <div style={{ fontSize:11, color:"#5A5870", marginTop:6, fontFamily:SANS }}>
                      <strong style={{ color:C.purple, fontFamily:FM }}>{pvD.valle.total}</strong> accesos acumulados
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── §4 Distribución de eventos ──────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={PieIcon} title="Distribución de eventos" sub="Proporción de cada tipo de acceso en el período" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                    {distribucionWithFill.map(d => <Cell key={d.tipo_evento} fill={d.fill!} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:16 }}>Desglose por tipo</div>
              {distribucion.map((d: any) => {
                const ev = EVENTO_LABELS[d.tipo_evento] ?? { label:d.tipo_evento, color:C.blue };
                const IconEv = EVENTO_ICONS[d.tipo_evento] || Activity;
                return (
                  <div key={d.tipo_evento} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <IconEv size={14} color={ev.color} />
                      <span style={{ fontSize:12, color:C.ink }}>{ev.label}</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:ev.color }}>{d.porcentaje}%</div>
                      <div style={{ fontSize:10, color:C.muted }}>{fmt(d.total)} eventos</div>
                    </div>
                  </div>
                );
              })}
              {distribucion.length === 0 && <div style={{ color:C.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>Sin datos en el período</div>}
            </div>
          </div>
        </section>

        {/* ── §5 Mapa de calor ───────────────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={Thermometer} title="Mapa de calor de accesos" sub="¿A qué hora y qué días de la semana entra más gente? · Solo datos históricos reales, sin predicciones" />
          {/* Nota explicativa del mapa */}
          <div style={{ marginBottom:14, padding:"10px 14px", background:`${C.blue}08`, border:`1px solid ${C.blue}20`, borderRadius:10, fontSize:12, color:C.muted, fontFamily:SANS, display:"flex", alignItems:"flex-start", gap:8 }}>
            <span style={{ color:C.blue, fontSize:16, flexShrink:0 }}>ℹ</span>
            <span>
              <strong style={{ color:C.ink }}>Cómo leer este mapa:</strong> cada columna es un día de la semana (Dom, Lun, Mar...) y cada fila es una hora del día.
              El color naranja intenso indica más accesos acumulados en esa combinación.{" "}
              <strong>No son predicciones</strong> — muestra el patrón histórico del período seleccionado.
              "Domingo" significa la suma de <em>todos los domingos</em> del período, no un domingo específico.
            </span>
          </div>
          <MapaCalor datos={mapaCalor} maxVal={mapaMax} />
          {mapaTop5.length > 0 && (
            <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px", marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:12 }}>Top 5 franjas de mayor actividad</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                {mapaTop5.map((c: CalorCell, i: number) => (
                  <div key={i} style={{ padding:"12px 14px", background:C.inputBg, borderRadius:12, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:4 }}>
                    {/* Posición */}
                    <div style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase" }}>#{i + 1}</div>
                    {/* Accesos */}
                    <div style={{ fontSize:24, fontWeight:700, fontFamily:FM, color:C.orange, lineHeight:1 }}>{c.total}</div>
                    <div style={{ fontSize:9, color:C.muted }}>accesos acumulados</div>
                    {/* Franja */}
                    <div style={{ marginTop:4, padding:"4px 0", borderTop:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.ink }}>{c.hora_label}</div>
                      <div style={{ fontSize:11, color:C.gold, fontWeight:600 }}>{c.dia_label}s</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:11, color:C.muted, fontFamily:SANS }}>
                Datos acumulados del período · cada franja suma todos los registros de ese día de la semana a esa hora.
              </div>
            </div>
          )}
        </section>

        {/* ── §6 Historial ───────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Table2} title="Historial de accesos" sub="Registro completo del período seleccionado" />
          <TabHistorial historial={historial} filtroDia={filtroDia} setFiltroDia={setFiltroDia} />
        </section>
      </main>
    </>
  );
}