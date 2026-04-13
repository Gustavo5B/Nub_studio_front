// src/pages/private/admin/AdminEstadisticas.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ChevronRight, RefreshCw, Users, TrendingUp, TrendingDown,
  Clock, BarChart2, Table2, CheckCircle, XCircle,
  PieChart as PieIcon, Thermometer, Sparkles, Home,
  LogOut, Key, Lock, TrendingUp as TrendingUpIcon,
  Filter, X,
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Line, Legend,
  PieChart as RePieChart, Pie,
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

// ── Filtro de fechas ─────────────────────────────────────────────────
function FiltroFecha({ filtro, onChange }: { filtro: FiltroState; onChange: (f: FiltroState) => void }) {
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

  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", fontFamily:SANS }}>
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
      <div style={{ marginTop:12, padding:"8px 12px", background:C.bgPage, borderRadius:8, fontSize:11, color:C.muted, textAlign:"center" }}>
        Cada celda = total de accesos registrados en esa combinación hora/día · pasa el cursor para ver el número exacto
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, justifyContent:"center" }}>
        <span style={{ fontSize:10, color:C.muted }}>Sin actividad</span>
        <div style={{ display:"flex", gap:3 }}>
          {[0,0.1,0.3,0.5,0.7,0.9].map(v => <div key={v} style={{ width:20, height:10, borderRadius:3, background:getHeatColor(v), border:`1px solid ${C.border}` }} />)}
        </div>
        <span style={{ fontSize:10, color:C.muted }}>Alta actividad</span>
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

// ── Sección: Tendencia (toggle día / semana) ─────────────────────────
function SeccionTendencia({ semanalComb, predSemanal, modeloSem, diarioComb, predDiario, modeloDia }: any) {
  const [granularidad, setGranularidad] = useState<"dia"|"semana">("semana");
  const esSemanal = granularidad === "semana";

  const comb    = esSemanal ? semanalComb : diarioComb;
  const pred    = esSemanal ? predSemanal : predDiario;
  const modelo  = esSemanal ? modeloSem   : modeloDia;
  const nPuntos = comb.filter((d: any) => d.total !== undefined).length;
  // Mínimo 4 puntos para que el modelo exponencial sea confiable
  const modeloValido = modelo && nPuntos >= 4;

  const periodoLabel = (() => {
    const reales = comb.filter((d: any) => d.total !== undefined);
    if (reales.length === 0) return "Sin datos";
    if (reales.length === 1) return reales[0].fecha_label ?? reales[0].label;
    return `${reales[0].fecha_label ?? reales[0].label} – ${reales[reales.length-1].fecha_label ?? reales[reales.length-1].label} (${reales.length} ${esSemanal ? "sem." : "días"})`;
  })();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:4, alignSelf:"flex-start", background:C.inputBg, borderRadius:10, padding:3, border:`1px solid ${C.border}` }}>
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

      {nPuntos > 0 && nPuntos < 4 && (
        <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}30`, borderRadius:12, padding:"12px 16px", fontSize:12, color:C.gold, display:"flex", alignItems:"center", gap:8 }}>
          <Sparkles size={14} /> El modelo de predicción requiere al menos 4 {esSemanal ? "semanas" : "días"} de datos. Con {nPuntos} {esSemanal ? (nPuntos === 1 ? "semana" : "semanas") : (nPuntos === 1 ? "día" : "días")} el margen de error sería muy alto. Amplía el rango.
        </div>
      )}

      {modeloValido && <ModeloBox modelo={modelo} periodo={periodoLabel} />}

      {nPuntos === 0 ? (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"48px", textAlign:"center", color:C.muted, fontSize:13 }}>
          No hay registros en el período seleccionado.
        </div>
      ) : esSemanal ? (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>{periodoLabel}</div>
          <ResponsiveContainer width="100%" height={300}>
            <ReBarChart data={semanalComb} margin={{ top:20, right:30, bottom:30, left:0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha_label" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Semana", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
              <YAxis tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
              <Bar dataKey="total" name="Accesos reales" fill={C.blue} radius={[5,5,0,0]} fillOpacity={0.85} />
              {modeloValido && <Bar dataKey="prediccion" name="Predicción" fill={C.gold} radius={[5,5,0,0]} fillOpacity={0.65} />}
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:12 }}>{periodoLabel}</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={diarioComb} margin={{ top:20, right:30, bottom:30, left:0 }}>
              <defs>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.orange} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9, interval:2 }} label={{ value:"Día", position:"insideBottom", offset:-10, fill:C.muted, fontSize:10 }} />
              <YAxis tick={{ fill:C.muted, fontSize:9 }} label={{ value:"Accesos", angle:-90, position:"insideLeft", fill:C.muted, fontSize:10 }} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.muted, paddingTop:8 }} />
              <Area type="monotone" dataKey="total" name="Accesos reales" stroke={C.orange} strokeWidth={2} fill="url(#gradOrange)" dot={false} />
              {modeloValido && <Area type="monotone" dataKey="prediccion" name="Predicción" stroke={C.gold} strokeWidth={2} fill="none" strokeDasharray="5 3" dot={{ r:3, fill:C.gold }} />}
              {modeloValido && <Line type="monotone" dataKey="promedio_movil" name="Promedio móvil 7d" stroke={C.success} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {modeloValido && pred.length > 0 && (
        <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <TrendingUpIcon size={14} color={C.gold} />
            <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>
              {esSemanal ? "Próximas 4 semanas" : "Próximos 7 días"} (predicción)
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${pred.length},1fr)`, gap:10 }}>
            {pred.map((p: any) => (
              <div key={p.fecha_label} style={{ textAlign:"center", padding:"10px 8px", background:C.inputBg, borderRadius:12 }}>
                <div style={{ fontSize:10, color:C.muted }}>{p.fecha_label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:C.gold, fontFamily:FM }}>{p.prediccion}</div>
                <div style={{ fontSize:9, color:C.muted }}>estimados</div>
              </div>
            ))}
          </div>
        </div>
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

// ========== COMPONENTE PRINCIPAL ==========
export default function AdminEstadisticas() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dotRef, ringRef, cursorOn, cursorOff } = useCustomCursor();
  const [filtro, setFiltro] = useState<FiltroState>({ inicio:"", fin:"", preset:"todo" });
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

  const buildQS = useCallback((f: FiltroState) => {
    const p = new URLSearchParams();
    if (f.inicio) p.set("fecha_inicio", f.inicio);
    if (f.fin)    p.set("fecha_fin",    f.fin);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const cargar = useCallback(async (f?: FiltroState) => {
    setLoading(true);
    const qs = buildQS(f ?? filtro);
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
      if (sJ.success) { setSemanal(sJ.data); setPredSemanal(sJ.predicciones); setModeloSem(sJ.modelo); }
      if (diJ.success) { setDiario(diJ.data); setPredDiario(diJ.predicciones); setModeloDia(diJ.modelo); }
      if (distJ.success) setDistribucion(distJ.data);
      if (mcJ.success) { setMapaCalor(mcJ.data); setMapaMax(mcJ.max_valor); setMapaTop5(mcJ.top5); }
      if (hiJ.success) setHistorial(hiJ.data);
    } catch (err) { showToast("Error al cargar estadísticas","err"); }
    finally { setLoading(false); }
  }, [showToast, filtro, buildQS]);

  useEffect(() => { cargar(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltroChange = useCallback((f: FiltroState) => {
    setFiltro(f);
    cargar(f);
  }, [cargar]);

  const fechaInicio = historial.length > 0 ? new Date(historial[historial.length-1]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const fechaFin    = historial.length > 0 ? new Date(historial[0]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const semanalComb = [...semanal.map(d=>({...d})), ...predSemanal.map(d=>({...d,total:undefined}))];
  const diarioComb  = [...diario.map(d=>({...d})), ...predDiario.map(d=>({...d,total:undefined}))];
  const pvH = findPicoValle(porHora);
  const pvD = findPicoValle(porDia);

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

      <Topbar navigate={navigate} onRefresh={() => cargar()} loading={loading} cursorOn={cursorOn} cursorOff={cursorOff} />
      <main style={{ padding:"24px 24px 60px", background:C.bgPage, minHeight:"100vh", fontFamily:SANS }}>
        <PageHeader resumen={resumen} fechaInicio={fechaInicio} fechaFin={fechaFin} />
        <FiltroFecha filtro={filtro} onChange={handleFiltroChange} />

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
          <SeccionTendencia semanalComb={semanalComb} predSemanal={predSemanal} modeloSem={modeloSem} diarioComb={diarioComb} predDiario={predDiario} modeloDia={modeloDia} />
        </section>

        {/* ── §2 Patrones de actividad ────────────────────────────── */}
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
                  <div style={{ background:C.bgCard, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.orange, marginBottom:4 }}>Hora pico</div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:FM, color:C.ink }}>{(pvH.pico as any).label}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{pvH.pico.total} accesos</div>
                  </div>
                  <div style={{ background:C.bgCard, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.blue, marginBottom:4 }}>Menor actividad</div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:FM, color:C.ink }}>{(pvH.valle as any).label}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{pvH.valle.total} accesos</div>
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
                  <div style={{ background:C.bgCard, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.success, marginBottom:4 }}>Día más activo</div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:FM, color:C.ink }}>{(pvD.pico as any).label}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{pvD.pico.total} accesos</div>
                  </div>
                  <div style={{ background:C.bgCard, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.purple, marginBottom:4 }}>Día menos activo</div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:FM, color:C.ink }}>{(pvD.valle as any).label}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{pvD.valle.total} accesos</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── §3 Distribución de eventos ──────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={PieIcon} title="Distribución de eventos" sub="Proporción de cada tipo de acceso en el período" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} />
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

        {/* ── §4 Mapa de calor ───────────────────────────────────── */}
        <section style={{ marginBottom:40 }}>
          <SectionHeader icon={Thermometer} title="Mapa de calor de accesos" sub="Concentración de accesos al sistema por franja horaria y día de la semana · naranja intenso = mayor tráfico acumulado" />
          <MapaCalor datos={mapaCalor} maxVal={mapaMax} />
          {mapaTop5.length > 0 && (
            <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px 20px", marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:12 }}>Top 5 momentos de mayor actividad</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                {mapaTop5.map((c: CalorCell, i: number) => (
                  <div key={i} style={{ textAlign:"center", padding:"12px", background:C.inputBg, borderRadius:12 }}>
                    <div style={{ fontSize:20, fontWeight:700, fontFamily:FM, color:C.orange }}>{c.total}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{c.dia_label}</div>
                    <div style={{ fontSize:10, color:C.gold }}>{c.hora_label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── §5 Historial ───────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Table2} title="Historial de accesos" sub="Registro completo del período seleccionado" />
          <TabHistorial historial={historial} filtroDia={filtroDia} setFiltroDia={setFiltroDia} />
        </section>
      </main>
    </>
  );
}