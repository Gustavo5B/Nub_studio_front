// src/pages/private/admin/AdminEstadisticas.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ChevronRight, RefreshCw, Users, TrendingUp, TrendingDown,
  Clock, Calendar, BarChart2, Table2, CheckCircle, XCircle,
  PieChart as PieIcon, Thermometer, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Line, Legend,
  PieChart, Pie, ReferenceLine,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast }    from "../../../context/ToastContext";

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  orange:"#FF840E", pink:"#CC59AD", purple:"#8D4CCD",
  blue:"#79AAF5",   gold:"#FFC110", green:"#22C97A",
  cream:"#FFF8EE",  creamSub:"#D8CABC",
  creamMut:"rgba(255,232,200,0.35)",
  bgDeep:"#070510", bg:"#0C0812",
  card:"rgba(18,13,30,0.95)",
  cardHover:"rgba(22,16,36,0.98)",
  border:"rgba(255,200,150,0.08)",
  borderBr:"rgba(118,78,49,0.20)",
  borderHi:"rgba(255,200,150,0.18)",
  red:"#F04E6B",
};
const FB = "'Outfit', sans-serif";
const FD = "'Cormorant Garamond', serif";
const FM = "'JetBrains Mono', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }
const fmt  = (n: number) => new Intl.NumberFormat("es-MX").format(n ?? 0);
const fmtP = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

const PIE_COLORS: Record<string, string> = {
  LOGIN_EXITOSO:   C.green,
  LOGIN_FALLIDO:   C.red,
  LOGOUT:          C.blue,
  LOGIN_2FA:       C.gold,
  LOGIN_BLOQUEADO: C.pink,
};

const EVENTO_LABELS: Record<string, { label:string; icon:string; color:string }> = {
  LOGIN_EXITOSO:   { label:"Acceso exitoso",   icon:"✅", color:C.green  },
  LOGIN_FALLIDO:   { label:"Contraseña incorrecta", icon:"❌", color:C.red    },
  LOGOUT:          { label:"Cierre de sesión", icon:"🚪", color:C.blue   },
  LOGIN_2FA:       { label:"Verificación 2FA", icon:"🔐", color:C.gold   },
  LOGIN_BLOQUEADO: { label:"Cuenta bloqueada", icon:"🔒", color:C.pink   },
};

// ── Tipos ──────────────────────────────────────────────────────────────────────
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
interface TipProps { readonly active?:boolean; readonly payload?:{color:string;name:string;value:number}[]; readonly label?:string }

type Tab = "resumen"|"semanal"|"diario"|"hora"|"dia-semana"|"pastel"|"calor"|"historial";

// ═════════════════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ═════════════════════════════════════════════════════════════════════════════
function Skeleton({ w="100%", h=20, r=6 }: { w?:string|number; h?:number; r?:number }) {
  return (
    <div style={{ width:w, height:h, borderRadius:r, background:"rgba(255,232,200,0.06)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 0%,rgba(255,200,150,0.08) 50%,transparent 100%)", animation:"shimmer 1.5s infinite" }} />
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:16 }}>
      <Skeleton w={46} h={46} r={12} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
        <Skeleton w="45%" h={26} r={5} />
        <Skeleton w="55%" h={11} r={4} />
        <Skeleton w="70%" h={10} r={4} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TOOLTIP PERSONALIZADO
// ═════════════════════════════════════════════════════════════════════════════
const ChartTip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(7,4,18,0.98)", border:`1px solid rgba(255,132,14,0.25)`, borderRadius:12, padding:"12px 16px", fontFamily:FB, boxShadow:"0 8px 32px rgba(0,0,0,0.6)", backdropFilter:"blur(12px)" }}>
      <div style={{ fontSize:10, fontWeight:800, color:C.orange, textTransform:"uppercase", letterSpacing:"0.10em", marginBottom:10, paddingBottom:6, borderBottom:`1px solid rgba(255,132,14,0.15)` }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, fontWeight:600, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, boxShadow:`0 0 6px ${p.color}` }} />
          <span style={{ color:C.creamMut }}>{p.name}:</span>
          <strong style={{ color:C.cream }}>{fmt(p.value)}</strong>
          <span style={{ fontSize:10, color:C.creamMut }}>accesos</span>
        </div>
      ))}
    </div>
  );
};

const PieTip = ({ active, payload }: { active?:boolean; payload?:{name:string;value:number;payload:{porcentaje:number}}[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const ev = EVENTO_LABELS[p.name] ?? { label:p.name, icon:"●", color:C.blue };
  return (
    <div style={{ background:"rgba(7,4,18,0.98)", border:`1px solid rgba(255,132,14,0.25)`, borderRadius:12, padding:"12px 16px", fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <span style={{ fontSize:16 }}>{ev.icon}</span>
        <span style={{ fontSize:12, fontWeight:700, color:ev.color }}>{ev.label}</span>
      </div>
      <div style={{ fontSize:13, fontWeight:900, color:C.cream, fontFamily:FD }}>{p.payload.porcentaje}%</div>
      <div style={{ fontSize:11, color:C.creamMut }}>{fmt(p.value)} eventos en total</div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// KPI CARD
// ═════════════════════════════════════════════════════════════════════════════
function KpiCard({ label, value, contexto, sub, accent, icon:Icon, tendencia, animating }: {
  label:string; value:string|number; contexto:string; sub?:string;
  accent:string; icon:React.ElementType; tendencia?:number; animating?:boolean;
}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", position:"relative", overflow:"hidden", transition:"all .2s", cursor:"default", display:"flex", alignItems:"center", gap:16 }}
      onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}50`; el.style.transform="translateY(-1px)"; el.style.boxShadow=`0 8px 24px ${accent}12`; }}
      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; el.style.boxShadow="none"; }}>
      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg,${accent},${accent}40)`, borderRadius:"14px 0 0 14px" }} />
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 0% 50%, ${accent}0A 0%, transparent 60%)`, pointerEvents:"none" }} />
      <div style={{ position:"relative", width:46, height:46, borderRadius:12, background:`${accent}14`, border:`1px solid ${accent}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={20} color={accent} strokeWidth={1.8} />
      </div>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:8 }}>
          <div style={{ fontSize:30, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1, animation: animating ? "pulseNum .4s ease" : "none" }}>
            {value}
          </div>
          {tendencia !== undefined && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:20, flexShrink:0,
              background: tendencia >= 0 ? "rgba(34,201,122,0.12)" : "rgba(240,78,107,0.12)",
              border:`1px solid ${tendencia >= 0 ? "rgba(34,201,122,0.28)" : "rgba(240,78,107,0.28)"}` }}>
              {tendencia >= 0 ? <TrendingUp size={9} color={C.green}/> : <TrendingDown size={9} color={C.red}/>}
              <span style={{ fontSize:10, fontWeight:800, color:tendencia>=0?C.green:C.red }}>{fmtP(tendencia)}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize:11.5, fontWeight:700, color:C.creamSub, fontFamily:FB, marginTop:3, marginBottom:1 }}>{label}</div>
        <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{contexto}</div>
        {sub && <div style={{ fontSize:10, color:accent, fontFamily:FB, marginTop:2, fontWeight:700 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODELO BOX
// ═════════════════════════════════════════════════════════════════════════════
function getModeloTexts(fase: string, confiableR2: boolean) {
  if (!confiableR2) {
    return {
      titulo: "No se detectó una tendencia clara",
      descripcion: "Los datos varían demasiado (picos y caídas) para que el modelo exponencial detecte una tendencia definida. Las predicciones son aproximadas.",
      emoji: "⚠️",
    };
  }
  if (fase === "crecimiento") {
    return {
      titulo: "Los accesos están creciendo",
      descripcion: "La plataforma está ganando actividad de forma exponencial.",
      emoji: "📈",
    };
  }
  if (fase === "decrecimiento") {
    return {
      titulo: "Los accesos están bajando",
      descripcion: "La actividad en la plataforma está disminuyendo con el tiempo.",
      emoji: "📉",
    };
  }
  return {
    titulo: "Los accesos se mantienen estables",
    descripcion: "No hay una tendencia clara de crecimiento ni caída.",
    emoji: "➡️",
  };
}

function getTCaractLabel(fase: string): string | null {
  if (fase === "crecimiento") return "los accesos se duplican cada";
  if (fase === "decrecimiento") return "los accesos se reducen a la mitad cada";
  return null;
}

function ModeloBox({ modelo, periodo }: { modelo:Modelo; periodo:string }) {
  const [verTecnico, setVerTecnico] = useState(false);
  const { estadisticos, y0, k, fase, ecuacion, t_caracteristico, errores } = modelo;

  const r2Pct     = (estadisticos.r2 * 100).toFixed(0);
  const confColor = estadisticos.r2 >= 0.8 ? C.green : estadisticos.r2 >= 0.6 ? C.gold : C.red;
  const faseColor = fase === "crecimiento" ? C.green : fase === "decrecimiento" ? C.red : C.gold;

  const confiableR2  = estadisticos.r2 >= 0.3;
  const tCaractUtil  = t_caracteristico !== null && t_caracteristico <= 60;
  const tCaractLabel = getTCaractLabel(fase);
  const tCaractVal = confiableR2 && tCaractUtil && tCaractLabel ? `${t_caracteristico} periodos` : null;

  const { titulo: tituloPrincipal, descripcion: descripcionFase, emoji: faseEmoji } = getModeloTexts(fase, confiableR2);
  const displayColor = !confiableR2 ? C.gold : faseColor;

  const erroresConRel = errores.filter(e => e.error_relativo !== null);
  const errMed = erroresConRel.length > 0
    ? erroresConRel.reduce((s, e) => s + (e.error_relativo ?? 0), 0) / erroresConRel.length
    : null;

  return (
    <div style={{ border:`1px solid rgba(141,76,205,0.28)`, borderRadius:16, overflow:"hidden", marginBottom:18, boxShadow:"0 8px 32px rgba(0,0,0,0.22)" }}>
      {/* SECCIÓN HUMANA */}
      <ModeloHumanSection
        tituloPrincipal={tituloPrincipal}
        descripcionFase={descripcionFase}
        faseEmoji={faseEmoji}
        displayColor={displayColor}
        faseColor={faseColor}
        tCaractLabel={tCaractLabel}
        tCaractVal={tCaractVal}
        estadisticos={estadisticos}
      />
      {/* SECCIÓN TÉCNICA (colapsable) */}
      <ModeloTechSection
        verTecnico={verTecnico}
        setVerTecnico={setVerTecnico}
        periodo={periodo}
        ecuacion={ecuacion}
        y0={y0}
        k={k}
        faseColor={faseColor}
        confColor={confColor}
        r2Pct={r2Pct}
        t_caracteristico={t_caracteristico}
        estadisticos={estadisticos}
        errMed={errMed}
        errores={errores}
      />
    </div>
  );
}

function ModeloHumanSection({ tituloPrincipal, descripcionFase, faseEmoji, displayColor, faseColor, tCaractLabel, tCaractVal, estadisticos }: {
  tituloPrincipal:string; descripcionFase:string; faseEmoji:string; displayColor:string; faseColor:string;
  tCaractLabel:string|null; tCaractVal:string|null;
  estadisticos:{ media:number; moda:number; desv_std:number; r2:number };
}) {
  const stats = [
    { emoji:"📊", label:"Promedio histórico", value:String(estadisticos.media), sub:"accesos por periodo", color:C.orange },
    { emoji:"🔁", label:"Valor más frecuente", value:String(estadisticos.moda), sub:"el que más se repite", color:C.pink },
    { emoji:"📐", label:"Variación típica", value:`±${estadisticos.desv_std}`, sub:"qué tanto varía normalmente", color:C.blue },
  ];

  return (
    <div style={{ background:`linear-gradient(135deg, rgba(141,76,205,0.13) 0%, rgba(7,5,16,0.70) 100%)`, padding:"20px 22px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`${displayColor}20`, border:`1px solid ${displayColor}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:22 }}>
            {faseEmoji}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:displayColor, fontFamily:FD, lineHeight:1 }}>{tituloPrincipal}</div>
            <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:5, lineHeight:1.5, maxWidth:480 }}>{descripcionFase}</div>
            {tCaractVal && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:8, padding:"4px 10px", borderRadius:20, background:`${faseColor}14`, border:`1px solid ${faseColor}30` }}>
                <span style={{ fontSize:11, color:faseColor, fontFamily:FB }}>
                  ⏱ {tCaractLabel} <strong>{tCaractVal}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {stats.map(({ emoji, label, value, sub, color }) => (
          <div key={label} style={{ padding:"12px 14px", borderRadius:12, background:"rgba(255,232,200,0.03)", border:`1px solid rgba(255,200,150,0.08)`, transition:"border-color .2s, background .2s" }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${color}35`; el.style.background=`${color}08`; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,200,150,0.08)"; el.style.background="rgba(255,232,200,0.03)"; }}>
            <div style={{ fontSize:16, marginBottom:6 }}>{emoji}</div>
            <div style={{ fontSize:9.5, color:C.creamMut, fontFamily:FB, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:900, color, fontFamily:FD, lineHeight:1, marginBottom:3 }}>{value}</div>
            <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeloTechSection({ verTecnico, setVerTecnico, periodo, ecuacion, y0, k, faseColor, confColor, r2Pct, t_caracteristico, estadisticos, errMed, errores }: {
  verTecnico:boolean; setVerTecnico:(fn:(v:boolean)=>boolean)=>void; periodo:string;
  ecuacion:string; y0:number; k:number; faseColor:string; confColor:string; r2Pct:string;
  t_caracteristico:number|null; estadisticos:{ r2:number }; errMed:number|null; errores:ModeloError[];
}) {
  const techStats = [
    { label:"y₀ — valor inicial",   value:String(y0),                           sub:`condición inicial t = 0`,            color:C.blue    },
    { label:"k — tasa de cambio",    value:k >= 0 ? `+${k}` : String(k),         sub:`ln(2)/|k| = ${t_caracteristico ?? "∞"}`, color:faseColor },
    { label:"R² — ajuste linealizado", value:`${r2Pct}%`,                         sub: estadisticos.r2 >= 0.7 ? "buen ajuste en ln(y)" : "ajuste en escala ln(y)", color:confColor },
    { label:"Error relativo medio",  value:errMed !== null ? `${errMed.toFixed(2)}%` : "—", sub:"sMAPE · simétrico, acotado 0–200%", color: errMed !== null && errMed < 20 ? C.green : C.gold },
  ];

  return (
    <div style={{ borderTop:`1px solid rgba(141,76,205,0.18)` }}>
      <button
        onClick={() => setVerTecnico(v => !v)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 22px", background:"rgba(141,76,205,0.06)", border:"none", cursor:"pointer", transition:"background .15s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(141,76,205,0.11)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(141,76,205,0.06)"}
      >
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Sparkles size={12} color={C.purple} strokeWidth={2} />
          <span style={{ fontSize:11, fontWeight:700, color:C.purple, fontFamily:FB }}>Detalle técnico del modelo</span>
          <span style={{ fontSize:10, color:C.creamMut, fontFamily:FM }}>y(t) = y₀·eᵏᵗ · {periodo}</span>
        </div>
        <span style={{ fontSize:11, color:C.creamMut, fontFamily:FM, transition:"transform .2s", display:"inline-block", transform: verTecnico ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {verTecnico && (
        <div style={{ padding:"16px 22px 20px", background:"rgba(7,5,16,0.55)" }}>
          <div style={{ marginBottom:14, padding:"11px 16px", borderRadius:10, background:"rgba(141,76,205,0.10)", border:`1px solid rgba(141,76,205,0.25)` }}>
            <div style={{ fontSize:9, color:`${C.purple}90`, fontFamily:FB, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.10em" }}>Ecuación · dy/dt = k·y</div>
            <div style={{ fontSize:14, fontWeight:900, color:C.purple, fontFamily:FM }}>{ecuacion}</div>
            <div style={{ fontSize:9.5, color:C.creamMut, fontFamily:FB, marginTop:4 }}>k y y₀ estimados por mínimos cuadrados sobre ln(y) = ln(y₀) + k·t</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
            {techStats.map(({ label, value, sub, color }) => (
              <div key={label} style={{ padding:"9px 12px", borderRadius:9, background:"rgba(255,232,200,0.02)", border:`1px solid rgba(255,200,150,0.06)` }}>
                <div style={{ fontSize:8.5, color:C.creamMut, fontFamily:FB, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
                <div style={{ fontSize:17, fontWeight:900, color, fontFamily:FM, lineHeight:1, marginBottom:2 }}>{value}</div>
                <div style={{ fontSize:9.5, color:C.creamMut, fontFamily:FB }}>{sub}</div>
              </div>
            ))}
          </div>
          {errores.length > 0 && <ErroresTable errores={errores} />}
        </div>
      )}
    </div>
  );
}

function ErroresTable({ errores }: { errores:ModeloError[] }) {
  return (
    <div style={{ borderRadius:9, border:`1px solid rgba(141,76,205,0.16)`, overflow:"hidden" }}>
      <div style={{ padding:"6px 12px", background:"rgba(141,76,205,0.10)", fontSize:9.5, fontWeight:700, color:C.purple, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.07em" }}>
        Errores punto a punto ({errores.length} observaciones)
      </div>
      <div style={{ overflowX:"auto", maxHeight:200, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:FM }}>
          <thead>
            <tr style={{ background:"rgba(7,5,16,0.60)", position:"sticky", top:0 }}>
              {["t","y real","ŷ modelo","error abs.","error rel."].map(h => (
                <th key={h} style={{ padding:"6px 12px", textAlign:"right", color:C.creamMut, fontWeight:700, fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {errores.map((e, i) => (
              <ErrorRow key={`err-${i}`} error={e} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ErrorRow({ error, index }: { error:ModeloError; index:number }) {
  const ec = getErrorColor(error.error_relativo);
  return (
    <tr style={{ borderBottom:`1px solid rgba(255,200,150,0.04)`, background:index%2===0?"rgba(255,232,200,0.012)":"transparent" }}>
      <td style={{ padding:"5px 12px", textAlign:"right", color:C.creamMut }}>{error.x}</td>
      <td style={{ padding:"5px 12px", textAlign:"right", color:C.cream, fontWeight:600 }}>{error.y_real}</td>
      <td style={{ padding:"5px 12px", textAlign:"right", color:C.purple }}>{error.y_modelo}</td>
      <td style={{ padding:"5px 12px", textAlign:"right", color:error.error >= 0 ? C.green : C.red }}>{error.error >= 0 ? "+" : ""}{error.error}</td>
      <td style={{ padding:"5px 12px", textAlign:"right" }}>
        <span style={{ padding:"2px 7px", borderRadius:20, background:`${ec}18`, color:ec, fontSize:10, fontWeight:700 }}>
          {error.error_relativo !== null ? `${error.error_relativo}%` : "—"}
        </span>
      </td>
    </tr>
  );
}

function getErrorColor(errorRelativo: number | null): string {
  if (errorRelativo !== null && errorRelativo > 30) return C.red;
  if (errorRelativo !== null && errorRelativo > 15) return C.gold;
  return C.green;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAPA DE CALOR
// ═════════════════════════════════════════════════════════════════════════════
function MapaCalor({ datos, maxVal: _maxVal }: { datos:CalorCell[]; maxVal:number }) {
  const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const HORAS = Array.from({length:24}, (_,h) => `${String(h).padStart(2,"00")}:00`);
  const [tooltip, setTooltip] = useState<{ cell:CalorCell; x:number; y:number }|null>(null);

  const porHora: Record<number, Record<number, CalorCell>> = {};
  datos.forEach(c => {
    if (!porHora[c.hora]) porHora[c.hora] = {};
    porHora[c.hora][c.dia] = c;
  });

  return (
    <div style={{ position:"relative" }}>
      {tooltip && <CalorTooltip tooltip={tooltip} />}
      <div style={{ overflowX:"auto" }}>
        <div style={{ minWidth:680 }}>
          <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", gap:3, marginBottom:4 }}>
            <div style={{ fontSize:9, color:C.creamMut, fontFamily:FB, textAlign:"center", paddingTop:4 }}>Hora</div>
            {DIAS.map(d => (
              <div key={d} style={{ fontSize:11, fontWeight:800, color:C.orange, textAlign:"center", fontFamily:FB, padding:"4px 0", background:"rgba(255,132,14,0.05)", borderRadius:6 }}>{d}</div>
            ))}
          </div>
          {HORAS.map((h, hi) => (
            <CalorRow key={h} horaLabel={h} horaIndex={hi} porHora={porHora} setTooltip={setTooltip} />
          ))}
          <CalorLegend />
        </div>
      </div>
    </div>
  );
}

function CalorTooltip({ tooltip }: { tooltip:{ cell:CalorCell; x:number; y:number } }) {
  const activityLabel = getActivityLabel(tooltip.cell.intensidad, tooltip.cell.total);
  return (
    <div style={{ position:"fixed", top:tooltip.y-60, left:tooltip.x+10, zIndex:100, background:"rgba(7,4,18,0.98)", border:`1px solid rgba(255,132,14,0.35)`, borderRadius:10, padding:"10px 14px", fontFamily:FB, pointerEvents:"none", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.cream }}>{tooltip.cell.dia_label} a las {tooltip.cell.hora_label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:5, marginTop:3 }}>
        <span style={{ fontSize:20, fontWeight:900, color:C.orange, fontFamily:FD }}>{tooltip.cell.total}</span>
        <span style={{ fontSize:11, color:C.creamMut }}>accesos acumulados</span>
      </div>
      <div style={{ fontSize:10, color:C.creamMut, marginTop:2 }}>{activityLabel}</div>
    </div>
  );
}

function getActivityLabel(intensidad: number, total: number): string {
  if (intensidad >= 0.7) return "🔥 Alta actividad";
  if (intensidad >= 0.3) return "📊 Actividad media";
  if (total > 0) return "💤 Baja actividad";
  return "⬜ Sin registros";
}

function getHeatColor(intensidad: number): string {
  if (intensidad === 0) return "rgba(255,255,255,0.025)";
  if (intensidad < 0.15) return `rgba(121,170,245,${0.20 + intensidad * 1.5})`;
  if (intensidad < 0.40) return `rgba(255,193,16,${0.30 + intensidad})`;
  if (intensidad < 0.70) return `rgba(255,132,14,${0.40 + intensidad * 0.6})`;
  return `rgba(240,78,107,${0.50 + intensidad * 0.5})`;
}

function CalorRow({ horaLabel, horaIndex, porHora, setTooltip }: {
  horaLabel:string; horaIndex:number;
  porHora:Record<number, Record<number, CalorCell>>;
  setTooltip:(v:{ cell:CalorCell; x:number; y:number }|null)=>void;
}) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", gap:3, marginBottom:3 }}>
      <div style={{ fontSize:9, color:C.creamMut, fontFamily:FM, textAlign:"right", paddingRight:8, display:"flex", alignItems:"center", justifyContent:"flex-end" }}>{horaLabel}</div>
      {Array.from({length:7}, (_,di) => {
        const cell    = porHora[horaIndex]?.[di];
        const intens  = cell?.intensidad ?? 0;
        const hasDatos = (cell?.total ?? 0) > 0;
        return (
          <div key={di}
            onMouseEnter={e => { if (hasDatos) { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltip({ cell: cell!, x: r.right, y: r.top }); (e.currentTarget as HTMLElement).style.transform="scale(1.4)"; (e.currentTarget as HTMLElement).style.zIndex="10"; (e.currentTarget as HTMLElement).style.boxShadow=`0 0 8px ${getHeatColor(intens)}`; } }}
            onMouseLeave={e => { setTooltip(null); (e.currentTarget as HTMLElement).style.transform="scale(1)"; (e.currentTarget as HTMLElement).style.zIndex="1"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}
            style={{ height:22, borderRadius:4, background:getHeatColor(intens), border:`1px solid rgba(255,255,255,0.04)`, cursor:hasDatos?"crosshair":"default", transition:"transform .12s, box-shadow .12s", position:"relative" }}>
          </div>
        );
      })}
    </div>
  );
}

function CalorLegend() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:14, justifyContent:"center" }}>
      <span style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>⬜ Sin actividad</span>
      <div style={{ display:"flex", gap:3 }}>
        {[0.05, 0.15, 0.35, 0.60, 0.85, 1.0].map((v) => (
          <div key={`heat-${v}`} style={{ width:22, height:14, borderRadius:3, background:getHeatColor(v) }} />
        ))}
      </div>
      <span style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>🔥 Máxima actividad</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// INSIGHT BADGE
// ═════════════════════════════════════════════════════════════════════════════
function InsightBadge({ emoji, titulo, valor, detalle, color }: { emoji:string; titulo:string; valor:string; detalle:string; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, background:`${color}08`, border:`1px solid ${color}20`,
      transition:"all .2s", cursor:"default" }}
      onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background=`${color}12`; el.style.borderColor=`${color}35`; el.style.transform="translateX(4px)"; }}
      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background=`${color}08`; el.style.borderColor=`${color}20`; el.style.transform="translateX(0)"; }}>
      <span style={{ fontSize:22, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11.5, fontWeight:700, color:C.cream, fontFamily:FB }}>{titulo}</div>
        <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB, marginTop:1 }}>{detalle}</div>
      </div>
      <div style={{ fontSize:20, fontWeight:900, color, fontFamily:FD, flexShrink:0 }}>{valor}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TOPBAR
// ═════════════════════════════════════════════════════════════════════════════
function Topbar({ navigate, onRefresh, loading }: { navigate:(p:string)=>void; onRefresh:()=>void; loading:boolean }) {
  const hoy = new Date().toLocaleDateString("es-MX", { weekday:"long", day:"2-digit", month:"long" });
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span role="button" tabIndex={0} style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }} onClick={() => navigate("/admin")} onKeyDown={e => { if (e.key === "Enter") navigate("/admin"); }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub }}>Estadísticas</span>
        <div style={{ marginLeft:8, padding:"3px 10px", borderRadius:100, background:"rgba(255,200,150,0.05)", border:`1px solid ${C.border}`, fontSize:11, color:C.creamMut, fontFamily:FB }}>{hoy}</div>
      </div>
      <button onClick={onRefresh} disabled={loading}
        style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,132,14,0.08)", border:`1px solid rgba(255,132,14,0.25)`, borderRadius:9, padding:"7px 16px", color:C.orange, fontSize:12.5, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:FB, transition:"all .15s" }}
        onMouseEnter={e => { if(!loading) (e.currentTarget as HTMLElement).style.background="rgba(255,132,14,0.16)"; }}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(255,132,14,0.08)"}>
        <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
        {loading ? "Actualizando..." : "Actualizar"}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER: Encontrar pico y valle en un array
// ═════════════════════════════════════════════════════════════════════════════
function findPicoValle<T extends { total: number }>(data: T[]): { pico: T; valle: T } | null {
  const filtered = data.filter(d => d.total > 0);
  if (filtered.length === 0) return null;
  const pico  = filtered.reduce((m, d) => d.total > m.total ? d : m, filtered[0]);
  const valle = filtered.reduce((m, d) => d.total < m.total ? d : m, filtered[0]);
  return { pico, valle };
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: RESUMEN
// ═════════════════════════════════════════════════════════════════════════════
function TabResumen({ porHora, porDia, distribucion, distribucionWithFill, fechaInicio }: {
  porHora:HoraData[]; porDia:DiaData[]; distribucion:DistItem[];
  distribucionWithFill:DistItem[]; fechaInicio:string;
}) {
  const pv = findPicoValle(porHora);
  const pvD = findPicoValle(porDia);

  return (
    <div style={{ animation:"tabSlide .3s ease", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      {/* Actividad por hora */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>📊 Actividad por hora del día</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:14, padding:"4px 10px", background:"rgba(255,193,16,0.06)", borderRadius:6, border:`1px solid rgba(255,193,16,0.15)`, display:"inline-block" }}>
          ⚠ Histórico acumulado desde {fechaInicio} · suma de TODOS los días
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={porHora} margin={{ top:0, right:0, bottom:0, left:-24 }}>
            <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:8, fontFamily:FB }} interval={3} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:8, fontFamily:FB }} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="total" name="Accesos acumulados" fill={C.orange} radius={[3,3,0,0]} fillOpacity={0.85}
              background={{ fill:"rgba(255,132,14,0.04)", radius:3 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pastel de tipos */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>🍩 ¿Cómo terminan los accesos?</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:12 }}>Proporción de cada tipo de evento en el historial</div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={60} innerRadius={32} paddingAngle={2} strokeWidth={0} />
              <Tooltip content={<PieTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
            {distribucion.map((d) => {
              const ev = EVENTO_LABELS[d.tipo_evento] ?? { label:d.tipo_evento, icon:"●", color:C.blue };
              return (
                <div key={d.tipo_evento} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:13 }}>{ev.icon}</span>
                    <span style={{ fontSize:11, color:C.creamSub, fontFamily:FB }}>{ev.label}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:50, height:4, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                      <div style={{ width:`${d.porcentaje}%`, height:"100%", background:ev.color, borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:ev.color, fontFamily:FM, minWidth:34, textAlign:"right" }}>{d.porcentaje}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actividad por día de semana */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>📅 Actividad por día de la semana</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:14 }}>Suma de todos los accesos agrupados por día</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={porDia} margin={{ top:0, right:0, bottom:0, left:-24 }}>
            <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:10, fontFamily:FB }} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:8, fontFamily:FB }} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="exitosos" name="Accesos exitosos"   fill={C.purple} radius={[3,3,0,0]} fillOpacity={0.85} stackId="a" />
            <Bar dataKey="fallidos" name="Intentos fallidos"  fill={C.pink}   radius={[3,3,0,0]} fillOpacity={0.80} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hallazgos clave */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:14 }}>🔍 Hallazgos clave</div>
        {pv && pvD && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <InsightBadge emoji="🔥" titulo="Hora pico (histórico)" valor={pv.pico.label} detalle={`${pv.pico.total} accesos acumulados · más activo del día`} color={C.orange} />
            <InsightBadge emoji="💤" titulo="Hora de menor actividad" valor={pv.valle.label} detalle={`Solo ${pv.valle.total} accesos · menor tráfico del día`} color={C.blue} />
            <InsightBadge emoji="📅" titulo="Día de semana más activo" valor={pvD.pico.label} detalle={`${pvD.pico.total} accesos acumulados todos los ${pvD.pico.label}s`} color={C.green} />
            <InsightBadge emoji="📭" titulo="Día de semana menos activo" valor={pvD.valle.label} detalle={`${pvD.valle.total} accesos · menor tráfico semanal`} color={C.purple} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: SEMANAL
// ═════════════════════════════════════════════════════════════════════════════
function TabSemanal({ semanal, predSemanal, modeloSem, semanalComb }: {
  semanal:SemanaData[]; predSemanal:Prediccion[]; modeloSem:Modelo|null;
  semanalComb:Record<string,unknown>[];
}) {
  return (
    <div style={{ animation:"tabSlide .3s ease", display:"flex", flexDirection:"column", gap:14 }}>
      {(modeloSem || predSemanal.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:14, alignItems:"start" }}>
          {modeloSem && <ModeloBox modelo={modeloSem} periodo="Últimas 12 semanas" />}
          {predSemanal.length > 0 && (
            <PrediccionesCard titulo="Próximas 4 semanas" subtitulo={`confianza: ${modeloSem ? `${(modeloSem.estadisticos.r2*100).toFixed(0)}%` : "—"}`}
              predicciones={predSemanal} labelPrefix="semana del" labelSuffix="sem." />
          )}
        </div>
      )}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD }}>📊 Accesos por semana — histórico y predicción</div>
          <div style={{ display:"flex", gap:12 }}>
            {[{ bg:C.blue, label:"Accesos reales" },{ bg:C.gold, label:"Predicción", op:0.7 }].map(({ bg, label, op }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.creamMut, fontFamily:FB }}>
                <div style={{ width:10, height:10, borderRadius:3, background:bg, opacity:op??1 }} /> {label}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={semanalComb} margin={{ top:5, right:10, bottom:5, left:-10 }}>
            <CartesianGrid stroke="rgba(255,232,200,0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="fecha_label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:10, fontFamily:FB }} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} width={32} />
            <Tooltip content={<ChartTip />} />
            {semanal.length > 0 && <ReferenceLine x={semanal[semanal.length-1]?.fecha_label} stroke={`${C.gold}50`} strokeDasharray="4 2" label={{ value:"hoy →", fill:C.gold, fontSize:10, position:"insideTopRight" }} />}
            <Bar dataKey="total"      name="Accesos reales esa semana"      fill={C.blue} radius={[5,5,0,0]} fillOpacity={0.88} />
            <Bar dataKey="prediccion" name="Accesos predichos (estimación)" fill={C.gold} radius={[5,5,0,0]} fillOpacity={0.65} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: DIARIO
// ═════════════════════════════════════════════════════════════════════════════
function TabDiario({ diario, predDiario, modeloDia, diarioComb }: {
  diario:DiaHistData[]; predDiario:Prediccion[]; modeloDia:Modelo|null;
  diarioComb:Record<string,unknown>[];
}) {
  return (
    <div style={{ animation:"tabSlide .3s ease", display:"flex", flexDirection:"column", gap:14 }}>
      {(modeloDia || predDiario.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:14, alignItems:"start" }}>
          {modeloDia && <ModeloBox modelo={modeloDia} periodo="Últimos 30 días" />}
          {predDiario.length > 0 && <PrediccionesDiarioCard predicciones={predDiario} />}
        </div>
      )}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD }}>📈 Accesos diarios — últimos 30 días</div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {[
              { color:C.orange, label:"Accesos reales" },
              { color:C.gold,   label:"Predicción" },
              { color:C.green,  label:"Promedio móvil 7d" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.creamMut, fontFamily:FB }}>
                <div style={{ width:12, height:3, borderRadius:99, background:color }} />{label}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={diarioComb} margin={{ top:5, right:10, bottom:5, left:-10 }}>
            <defs>
              <linearGradient id="gO2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.orange} stopOpacity={0.28} />
                <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} interval={3} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} width={32} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="total"          name="Accesos reales ese día"    stroke={C.orange} strokeWidth={2.2} fill="url(#gO2)" dot={false} />
            <Area type="monotone" dataKey="prediccion"     name="Predicción (días futuros)" stroke={C.gold}   strokeWidth={2}   fill="none" dot={{ r:5, fill:C.gold, strokeWidth:0 }} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="promedio_movil" name="Promedio móvil 7 días"     stroke={C.green}  strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PREDICCIONES CARDS
// ═════════════════════════════════════════════════════════════════════════════
function PrediccionesCard({ titulo, subtitulo, predicciones, labelPrefix, labelSuffix }: {
  titulo:string; subtitulo:string; predicciones:Prediccion[]; labelPrefix:string; labelSuffix:string;
}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:18 }}>🔮</span>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:C.cream, fontFamily:FD, lineHeight:1 }}>{titulo}</div>
          <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{subtitulo}</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {predicciones.map((p, i) => {
          const opacity = 1 - i * 0.10;
          return (
            <div key={p.fecha_label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:12, background:`rgba(255,193,16,${0.06 - i * 0.01})`, border:`1px solid rgba(255,193,16,${0.22 - i * 0.04})`, opacity }}>
              <div>
                <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginBottom:2 }}>{labelPrefix} {p.fecha_label}</div>
                <div style={{ fontSize:10, color:`rgba(255,193,16,0.55)`, fontFamily:FM }}>+{i+1} {labelSuffix} · {p.label}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:26, fontWeight:900, color:C.gold, fontFamily:FD, lineHeight:1 }}>{p.prediccion}</div>
                <div style={{ fontSize:9.5, color:C.creamMut, fontFamily:FB }}>accesos est.</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrediccionesDiarioCard({ predicciones }: { predicciones:Prediccion[] }) {
  const maxPred = Math.max(...predicciones.map(x => x.prediccion));
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:18 }}>🔮</span>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:C.cream, fontFamily:FD, lineHeight:1 }}>Próximos 7 días</div>
          <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:2 }}>accesos estimados por día</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {predicciones.map((p, i) => {
          const opacity = 1 - i * 0.07;
          const barW = maxPred > 0 ? (p.prediccion / maxPred) * 100 : 0;
          return (
            <div key={p.fecha_label} style={{ opacity }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>{p.fecha_label}</span>
                <span style={{ fontSize:14, fontWeight:900, color:C.gold, fontFamily:FD }}>{p.prediccion}</span>
              </div>
              <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                <div style={{ width:`${barW}%`, height:"100%", borderRadius:99, background:`linear-gradient(90deg,${C.gold}80,${C.gold})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: POR HORA
// ═════════════════════════════════════════════════════════════════════════════
function TabHora({ porHora, fechaInicio }: { porHora:HoraData[]; fechaInicio:string }) {
  const pv = findPicoValle(porHora);

  return (
    <div style={{ animation:"tabSlide .3s ease" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>⏰ Distribución de accesos por hora</div>
        <div style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,193,16,0.07)", border:`1px solid rgba(255,193,16,0.18)`, fontSize:11, color:C.gold, fontFamily:FB, marginBottom:16, display:"inline-block" }}>
          ⚠ Estos son totales ACUMULADOS desde {fechaInicio} — NO son accesos de hoy únicamente
        </div>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={porHora} margin={{ top:5, right:10, bottom:5, left:-10 }}>
            <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} width={32} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.creamMut, fontFamily:FB, paddingTop:8 }} />
            <Bar dataKey="exitosos" name="✅ Accesos exitosos a esa hora" fill={C.green} radius={[3,3,0,0]} fillOpacity={0.85} stackId="a" />
            <Bar dataKey="fallidos" name="❌ Intentos fallidos a esa hora" fill={C.red}  radius={[3,3,0,0]} fillOpacity={0.80} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {pv && <PicoValleCards pico={pv.pico} valle={pv.valle} picoColor={C.green} valleColor={C.blue} picoLabel="Hora pico" valleLabel="Menor actividad" picoDesc={`accesos acumulados a esta hora en el historial completo.\nEs la hora del día con más actividad en la plataforma.`} valleDesc={`accesos acumulados.\nEs cuando menos usuarios se conectan a la plataforma.`} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: DÍA SEMANA
// ═════════════════════════════════════════════════════════════════════════════
function TabDiaSemana({ porDia, fechaInicio }: { porDia:DiaData[]; fechaInicio:string }) {
  const pv = findPicoValle(porDia);

  return (
    <div style={{ animation:"tabSlide .3s ease" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>📆 Patrón semanal de actividad</div>
        <div style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,193,16,0.07)", border:`1px solid rgba(255,193,16,0.18)`, fontSize:11, color:C.gold, fontFamily:FB, marginBottom:16, display:"inline-block" }}>
          ⚠ Suma de TODOS los {'{'}día{"}"} registrados desde {fechaInicio} — incluye cada lunes, cada martes, etc.
        </div>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={porDia} margin={{ top:5, right:10, bottom:5, left:-10 }}>
            <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
            <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:9, fontFamily:FB }} width={32} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:C.creamMut, fontFamily:FB, paddingTop:8 }} />
            <Bar dataKey="exitosos" name="✅ Accesos exitosos" fill={C.purple} radius={[5,5,0,0]} fillOpacity={0.88} stackId="a" />
            <Bar dataKey="fallidos" name="❌ Intentos fallidos" fill={C.pink} radius={[5,5,0,0]} fillOpacity={0.80} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {pv && <PicoValleCards pico={pv.pico} valle={pv.valle} picoColor={C.purple} valleColor={C.pink}
        picoLabel="Día más activo de la semana" valleLabel="Día menos activo"
        picoDesc={`accesos acumulados todos los ${pv.pico.label}s.\nEs el día de la semana con más tráfico histórico.`}
        valleDesc={`accesos todos los ${pv.valle.label}s.\nEs el día con menor tráfico histórico.`}
      />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PICO / VALLE CARDS (reutilizable entre hora y día-semana)
// ═════════════════════════════════════════════════════════════════════════════
function PicoValleCards({ pico, valle, picoColor, valleColor, picoLabel, valleLabel, picoDesc, valleDesc }: {
  pico:{ label:string; total:number }; valle:{ label:string; total:number };
  picoColor:string; valleColor:string; picoLabel:string; valleLabel:string;
  picoDesc:string; valleDesc:string;
}) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <div style={{ background:C.card, border:`1px solid ${picoColor}40`, borderRadius:14, padding:"20px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <span style={{ fontSize:22 }}>🔥</span>
          <div style={{ fontSize:11, color:picoColor, fontWeight:700, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.08em" }}>{picoLabel}</div>
        </div>
        <div style={{ fontSize:40, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1 }}>{pico.label}</div>
        <div style={{ marginTop:10, fontSize:13, color:C.creamMut, fontFamily:FB, lineHeight:1.6 }}>
          <strong style={{ color:picoColor, fontSize:16 }}>{pico.total}</strong> {picoDesc.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br/>}</span>)}
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${valleColor}40`, borderRadius:14, padding:"20px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <span style={{ fontSize:22 }}>💤</span>
          <div style={{ fontSize:11, color:valleColor, fontWeight:700, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.08em" }}>{valleLabel}</div>
        </div>
        <div style={{ fontSize:40, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1 }}>{valle.label}</div>
        <div style={{ marginTop:10, fontSize:13, color:C.creamMut, fontFamily:FB, lineHeight:1.6 }}>
          Solo <strong style={{ color:valleColor, fontSize:16 }}>{valle.total}</strong> {valleDesc.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br/>}</span>)}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: PASTEL
// ═════════════════════════════════════════════════════════════════════════════
function TabPastel({ distribucion, distribucionWithFill }: { distribucion:DistItem[]; distribucionWithFill:DistItem[] }) {
  return (
    <div style={{ animation:"tabSlide .3s ease", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 22px" }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:4 }}>🍩 ¿Cómo terminan los intentos de acceso?</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:16 }}>Distribución de todos los eventos en el historial</div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={distribucionWithFill} dataKey="total" nameKey="tipo_evento" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={3} strokeWidth={0} />
            <Tooltip content={<PieTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 22px" }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:4 }}>Desglose por tipo de evento</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:16 }}>Qué significa cada tipo y cuántos hubo</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {distribucion.map((d) => {
            const ev    = EVENTO_LABELS[d.tipo_evento] ?? { label:d.tipo_evento, icon:"●", color:C.blue };
            const color = ev.color;
            return (
              <div key={d.tipo_evento} style={{ padding:"13px 16px", borderRadius:12, background:`${color}07`, border:`1px solid ${color}20`, position:"relative", overflow:"hidden",
                transition:"all .2s", cursor:"default" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background=`${color}12`; el.style.borderColor=`${color}35`; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background=`${color}07`; el.style.borderColor=`${color}20`; }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${d.porcentaje}%`, background:`${color}10`, transition:"width .8s ease" }} />
                <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>{ev.icon}</span>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:C.cream, fontFamily:FB }}>{d.tipo_evento}</div>
                      <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{ev.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:900, color, fontFamily:FD, lineHeight:1 }}>{d.porcentaje}%</div>
                    <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FM }}>{fmt(d.total)} eventos</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: CALOR
// ═════════════════════════════════════════════════════════════════════════════
function TabCalor({ mapaCalor, mapaMax, mapaTop5 }: { mapaCalor:CalorCell[]; mapaMax:number; mapaTop5:CalorCell[] }) {
  return (
    <div style={{ animation:"tabSlide .3s ease" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:2 }}>🌡️ ¿A qué hora y día hay más actividad?</div>
        <div style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,193,16,0.07)", border:`1px solid rgba(255,193,16,0.18)`, fontSize:11, color:C.gold, fontFamily:FB, marginBottom:18, display:"inline-block" }}>
          💡 Pasa el cursor sobre una celda para ver el detalle · colores más cálidos = más accesos
        </div>
        <MapaCalor datos={mapaCalor} maxVal={mapaMax} />
      </div>
      {mapaTop5.length > 0 && <CalorTop5 top5={mapaTop5} />}
    </div>
  );
}

function CalorTop5({ top5 }: { top5:CalorCell[] }) {
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px" }}>
      <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:4 }}>🏆 Top 5 — momentos de mayor actividad histórica</div>
      <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:16 }}>Combinación día + hora con más accesos acumulados en todo el historial</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
        {top5.map((c, i) => (
          <div key={`top-${i}`} style={{ textAlign:"center", padding:"16px 10px", borderRadius:14, background:"rgba(255,132,14,0.07)", border:`1px solid rgba(255,132,14,0.20)`, transition:"all .2s" }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(255,132,14,0.12)"; el.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(255,132,14,0.07)"; el.style.transform="translateY(0)"; }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{medals[i]}</div>
            <div style={{ fontSize:26, fontWeight:900, color:C.orange, fontFamily:FD, lineHeight:1 }}>{c.total}</div>
            <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:2 }}>accesos</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FB, marginTop:8 }}>{c.dia_label}</div>
            <div style={{ fontSize:11, color:C.gold, fontFamily:FM, marginTop:2 }}>{c.hora_label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB: HISTORIAL
// ═════════════════════════════════════════════════════════════════════════════
function TabHistorial({ historial, filtroDia, setFiltroDia }: {
  historial:EventoHistorial[]; filtroDia:string; setFiltroDia:(v:string)=>void;
}) {
  const histFiltrado = filtroDia === "todos" ? historial : historial.filter(e => e.tipo_evento === filtroDia);

  return (
    <div style={{ animation:"tabSlide .3s ease" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        <HistorialHeader filtroDia={filtroDia} setFiltroDia={setFiltroDia} count={histFiltrado.length} />
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:FB }}>
            <thead>
              <tr style={{ background:"rgba(7,5,16,0.98)" }}>
                {["Fecha y hora","Usuario","Correo","Resultado","IP","Detalle"].map((h) => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10.5, fontWeight:800, color:C.orange, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {histFiltrado.map((e, i) => <HistorialRow key={e.id_historial} evento={e} index={i} />)}
              {histFiltrado.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding:"40px", textAlign:"center", color:C.creamMut, fontFamily:FB, fontSize:13 }}>
                    No hay registros para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HistorialHeader({ filtroDia, setFiltroDia, count }: { filtroDia:string; setFiltroDia:(v:string)=>void; count:number }) {
  return (
    <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD }}>📋 Historial completo de accesos</div>
        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:2 }}>Cada fila = un evento de login o logout · más reciente primero</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", gap:4, background:"rgba(255,232,200,0.04)", padding:3, borderRadius:9, border:`1px solid ${C.border}` }}>
          {["todos", "LOGIN_EXITOSO", "LOGIN_FALLIDO", "LOGOUT"].map(tipo => {
            const on = filtroDia === tipo;
            const ev = EVENTO_LABELS[tipo] ?? { label:"Todos", icon:"📋", color:C.creamMut };
            return (
              <button key={tipo} onClick={() => setFiltroDia(tipo)}
                style={{ padding:"4px 10px", borderRadius:7, border: on ? `1px solid ${ev.color}35` : "1px solid transparent", background: on ? `${ev.color}12` : "transparent", color: on ? ev.color : C.creamMut, fontSize:11, fontWeight:on?700:500, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}>
                {tipo === "todos" ? "📋 Todos" : `${ev.icon} ${tipo.replace("LOGIN_","")}`}
              </button>
            );
          })}
        </div>
        <div style={{ padding:"3px 10px", borderRadius:20, background:"rgba(255,132,14,0.12)", border:"1px solid rgba(255,132,14,0.25)", fontSize:11, color:C.orange, fontWeight:700 }}>
          {count} registros
        </div>
      </div>
    </div>
  );
}

function HistorialRow({ evento, index }: { evento:EventoHistorial; index:number }) {
  const ev    = EVENTO_LABELS[evento.tipo_evento] ?? { label:evento.tipo_evento, icon:"●", color:C.creamMut };
  const color = ev.color;
  return (
    <tr
      style={{ borderBottom:`1px solid rgba(255,200,150,0.04)`, background:index%2===0?"rgba(255,232,200,0.01)":"transparent", transition:"background .15s", cursor:"default" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,132,14,0.05)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=index%2===0?"rgba(255,232,200,0.01)":"transparent"}>
      <td style={{ padding:"9px 14px", fontSize:11.5, color:C.creamMut, fontFamily:FM, whiteSpace:"nowrap" }}>
        {new Date(evento.fecha).toLocaleString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
      </td>
      <td style={{ padding:"9px 14px", fontSize:12, color:C.cream, fontFamily:FB, fontWeight:600 }}>{evento.nombre_completo||"—"}</td>
      <td style={{ padding:"9px 14px", fontSize:11.5, color:C.creamSub, fontFamily:FM }}>{evento.correo}</td>
      <td style={{ padding:"9px 14px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:`${color}14`, border:`1px solid ${color}25` }}>
          <span style={{ fontSize:12 }}>{ev.icon}</span>
          <span style={{ fontSize:10.5, fontWeight:700, color, fontFamily:FB }}>{ev.label}</span>
        </div>
      </td>
      <td style={{ padding:"9px 14px", fontSize:11.5, color:C.creamMut, fontFamily:FM }}>{evento.ip_address||"—"}</td>
      <td style={{ padding:"9px 14px", fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{evento.detalles||"—"}</td>
    </tr>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB CONTENT ROUTER — selecciona qué tab renderizar
// ═════════════════════════════════════════════════════════════════════════════
function TabContent({ tab, porHora, porDia, distribucion, distribucionWithFill, fechaInicio,
  semanal, predSemanal, modeloSem, semanalComb, diario, predDiario, modeloDia, diarioComb,
  mapaCalor, mapaMax, mapaTop5, historial, filtroDia, setFiltroDia }: {
  tab:Tab; porHora:HoraData[]; porDia:DiaData[]; distribucion:DistItem[]; distribucionWithFill:DistItem[];
  fechaInicio:string; semanal:SemanaData[]; predSemanal:Prediccion[]; modeloSem:Modelo|null;
  semanalComb:Record<string,unknown>[]; diario:DiaHistData[]; predDiario:Prediccion[];
  modeloDia:Modelo|null; diarioComb:Record<string,unknown>[]; mapaCalor:CalorCell[];
  mapaMax:number; mapaTop5:CalorCell[]; historial:EventoHistorial[];
  filtroDia:string; setFiltroDia:(v:string)=>void;
}) {
  switch (tab) {
    case "resumen":    return <TabResumen porHora={porHora} porDia={porDia} distribucion={distribucion} distribucionWithFill={distribucionWithFill} fechaInicio={fechaInicio} />;
    case "semanal":    return <TabSemanal semanal={semanal} predSemanal={predSemanal} modeloSem={modeloSem} semanalComb={semanalComb} />;
    case "diario":     return <TabDiario diario={diario} predDiario={predDiario} modeloDia={modeloDia} diarioComb={diarioComb} />;
    case "hora":       return <TabHora porHora={porHora} fechaInicio={fechaInicio} />;
    case "dia-semana": return <TabDiaSemana porDia={porDia} fechaInicio={fechaInicio} />;
    case "pastel":     return <TabPastel distribucion={distribucion} distribucionWithFill={distribucionWithFill} />;
    case "calor":      return <TabCalor mapaCalor={mapaCalor} mapaMax={mapaMax} mapaTop5={mapaTop5} />;
    case "historial":  return <TabHistorial historial={historial} filtroDia={filtroDia} setFiltroDia={setFiltroDia} />;
    default:           return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// KPIs GRID
// ═════════════════════════════════════════════════════════════════════════════
function KpisGrid({ resumen, animKpis }: { resumen:Resumen; animKpis:boolean }) {
  const tasaExito = resumen.total_eventos > 0 ? `${Math.round(resumen.logins_exitosos/resumen.total_eventos*100)}%` : "—";
  const subFallidos = resumen.logins_fallidos > 0 ? `${resumen.logins_fallidos} intentos fallaron` : "✓ Sin intentos fallidos";

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24, animation:"fadeUp .4s ease" }}>
      <KpiCard label="Total eventos"     value={fmt(resumen.total_eventos)}   accent={C.blue}   icon={Activity}    contexto="Todos los accesos registrados"          animating={animKpis} />
      <KpiCard label="Logins exitosos"   value={fmt(resumen.logins_exitosos)} accent={C.green}  icon={CheckCircle} contexto="Accesos completados con éxito"           animating={animKpis} />
      <KpiCard label="Intentos fallidos" value={fmt(resumen.logins_fallidos)} accent={C.red}    icon={XCircle}     contexto="Contraseña incorrecta o bloqueado"       animating={animKpis} />
      <KpiCard label="Usuarios únicos"   value={fmt(resumen.usuarios_unicos)} accent={C.purple} icon={Users}       contexto="Personas distintas que accedieron"       animating={animKpis} />
      <KpiCard label="Accesos hoy"       value={fmt(resumen.accesos_hoy)}     accent={C.orange} icon={Clock}       contexto="Número de accesos en el día de hoy"
        tendencia={resumen.tendencia_pct} sub={`Ayer: ${resumen.accesos_ayer}`} animating={animKpis} />
      <KpiCard label="Tasa de éxito" value={tasaExito} accent={C.gold} icon={TrendingUp}
        contexto="Accesos exitosos vs total de intentos" sub={subFallidos} animating={animKpis} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB BAR
// ═════════════════════════════════════════════════════════════════════════════
const TABS: { id:Tab; label:string; icon:React.ElementType; desc:string }[] = [
  { id:"resumen",    label:"Resumen",      icon:BarChart2,   desc:"Vista general" },
  { id:"semanal",    label:"Semanas",      icon:Calendar,    desc:"Últimas 12 sem." },
  { id:"diario",     label:"Días",         icon:TrendingUp,  desc:"Últimos 30 días" },
  { id:"hora",       label:"Por hora",     icon:Clock,       desc:"0 – 23 hs" },
  { id:"dia-semana", label:"Día semana",   icon:Activity,    desc:"Lun → Dom" },
  { id:"pastel",     label:"Tipos",        icon:PieIcon,     desc:"% de eventos" },
  { id:"calor",      label:"Mapa calor",   icon:Thermometer, desc:"Hora × Día" },
  { id:"historial",  label:"Historial",    icon:Table2,      desc:"Tabla completa" },
];

function TabBar({ tab, setTab }: { tab:Tab; setTab:(t:Tab)=>void }) {
  return (
    <div style={{ display:"flex", gap:4, marginBottom:22, background:"rgba(255,232,200,0.025)", padding:4, borderRadius:12, border:`1px solid ${C.border}` }}>
      {TABS.map(({ id, label, icon:Icon }) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 6px",
              borderRadius:9, border: on ? `1px solid ${C.orange}40` : "1px solid transparent",
              background: on ? "rgba(255,132,14,0.13)" : "transparent",
              color: on ? C.orange : C.creamMut,
              cursor:"pointer", fontFamily:FB, transition:"all .15s", whiteSpace:"nowrap", position:"relative" }}
            onMouseEnter={e => { if(!on){ const el=e.currentTarget as HTMLElement; el.style.background="rgba(255,200,150,0.05)"; el.style.color=C.creamSub; } }}
            onMouseLeave={e => { if(!on){ const el=e.currentTarget as HTMLElement; el.style.background="transparent"; el.style.color=C.creamMut; } }}>
            {on && <div style={{ position:"absolute", bottom:2, left:"25%", right:"25%", height:1.5, borderRadius:99, background:C.orange, opacity:0.8 }} />}
            <Icon size={12} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.3 : 1.7} />
            <span style={{ fontSize:12, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE HEADER
// ═════════════════════════════════════════════════════════════════════════════
function PageHeader({ resumen, fechaInicio, fechaFin }: { resumen:Resumen|null; fechaInicio:string; fechaFin:string }) {
  return (
    <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
      <div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:100, background:"rgba(255,132,14,0.09)", border:`1px solid rgba(255,132,14,0.22)`, fontSize:10.5, color:C.orange, marginBottom:12, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase" }}>
          <Activity size={9} color={C.orange} strokeWidth={2.5} /> Estadísticas de acceso
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, color:C.cream, fontFamily:FD, margin:"0 0 6px", lineHeight:1.1 }}>
          Análisis de{" "}
          <span style={{ background:`linear-gradient(90deg,${C.orange},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Interacción
          </span>
        </h1>
        <p style={{ fontSize:12.5, color:C.creamMut, margin:0, fontFamily:FB }}>
          Histórico desde{" "}
          <strong style={{ color:C.creamSub }}>{fechaInicio}</strong>
          {" "}hasta{" "}
          <strong style={{ color:C.creamSub }}>{fechaFin}</strong>
          {" "}· Modelo exponencial y(t) = y₀·eᵏᵗ
        </p>
      </div>
      {resumen && (
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {[
            { label:"Tasa de éxito", value: resumen.total_eventos > 0 ? `${Math.round(resumen.logins_exitosos/resumen.total_eventos*100)}%` : "—", color:C.green },
            { label:"Eventos hoy",   value: fmt(resumen.accesos_hoy), color:C.orange },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding:"10px 18px", borderRadius:12, background:`${color}08`, border:`1px solid ${color}20`, textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900, color, fontFamily:FD, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT — ahora con complejidad mínima
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminEstadisticas() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [tab,          setTab]          = useState<Tab>("resumen");
  const [loading,      setLoading]      = useState(true);
  const [animKpis,     setAnimKpis]     = useState(false);
  const [resumen,      setResumen]      = useState<Resumen|null>(null);
  const [porHora,      setPorHora]      = useState<HoraData[]>([]);
  const [porDia,       setPorDia]       = useState<DiaData[]>([]);
  const [semanal,      setSemanal]      = useState<SemanaData[]>([]);
  const [diario,       setDiario]       = useState<DiaHistData[]>([]);
  const [predSemanal,  setPredSemanal]  = useState<Prediccion[]>([]);
  const [predDiario,   setPredDiario]   = useState<Prediccion[]>([]);
  const [modeloSem,    setModeloSem]    = useState<Modelo|null>(null);
  const [modeloDia,    setModeloDia]    = useState<Modelo|null>(null);
  const [distribucion, setDistribucion] = useState<DistItem[]>([]);
  const distribucionWithFill = distribucion.map(d => ({ ...d, fill: PIE_COLORS[d.tipo_evento] ?? C.blue }));
  const [mapaCalor,    setMapaCalor]    = useState<CalorCell[]>([]);
  const [mapaMax,      setMapaMax]      = useState(1);
  const [mapaTop5,     setMapaTop5]     = useState<CalorCell[]>([]);
  const [historial,    setHistorial]    = useState<EventoHistorial[]>([]);
  const [filtroDia,    setFiltroDia]    = useState<string>("todos");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authH();
      const [rR,hR,dR,sR,diR,distR,mcR,hiR] = await Promise.all([
        fetch(`${API}/api/estadisticas/resumen`,        { headers }),
        fetch(`${API}/api/estadisticas/por-hora`,       { headers }),
        fetch(`${API}/api/estadisticas/por-dia-semana`, { headers }),
        fetch(`${API}/api/estadisticas/por-semana`,     { headers }),
        fetch(`${API}/api/estadisticas/por-dia`,        { headers }),
        fetch(`${API}/api/estadisticas/distribucion`,   { headers }),
        fetch(`${API}/api/estadisticas/mapa-calor`,     { headers }),
        fetch(`${API}/api/estadisticas/historial`,      { headers }),
      ]);
      const [rJ,hJ,dJ,sJ,diJ,distJ,mcJ,hiJ] = await Promise.all([rR.json(),hR.json(),dR.json(),sR.json(),diR.json(),distR.json(),mcR.json(),hiR.json()]);
      if (rJ.success)    { setResumen(rJ.data); setAnimKpis(true); setTimeout(()=>setAnimKpis(false),600); }
      if (hJ.success)    setPorHora(hJ.data);
      if (dJ.success)    setPorDia(dJ.data);
      if (sJ.success)    { setSemanal(sJ.data); setPredSemanal(sJ.predicciones); setModeloSem(sJ.modelo); }
      if (diJ.success)   { setDiario(diJ.data); setPredDiario(diJ.predicciones); setModeloDia(diJ.modelo); }
      if (distJ.success) setDistribucion(distJ.data);
      if (mcJ.success)   { setMapaCalor(mcJ.data); setMapaMax(mcJ.max_valor); setMapaTop5(mcJ.top5); }
      if (hiJ.success)   setHistorial(hiJ.data);
    } catch { showToast("Error al cargar estadísticas","err"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const fechaInicio = historial.length > 0 ? new Date(historial[historial.length-1]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const fechaFin    = historial.length > 0 ? new Date(historial[0]?.fecha).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  const semanalComb = [...semanal.map(d=>({...d,tipo:"historico"})), ...predSemanal.map(d=>({...d,total:undefined,tipo:"prediccion"}))];
  const diarioComb  = [...diario.map(d=>({...d,tipo:"historico"})), ...predDiario.map(d=>({...d,total:undefined,tipo:"prediccion"}))];

  return (
    <>
      <style>{`
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulseNum  { 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }
        @keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes tabSlide  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar  { width:5px; height:5px }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.15); border-radius:99px }
      `}</style>

      <Topbar navigate={navigate} onRefresh={cargar} loading={loading} />

      <main style={{ flex:1, padding:"22px 26px 40px", overflowY:"auto", backgroundColor:C.bg, backgroundImage:`radial-gradient(ellipse at 85% 0%,rgba(255,132,14,0.07) 0%,transparent 45%),radial-gradient(ellipse at 5% 85%,rgba(141,76,205,0.07) 0%,transparent 40%)`, fontFamily:FB }}>

        <PageHeader resumen={resumen} fechaInicio={fechaInicio} fechaFin={fechaFin} />

        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
            {Array.from({length:6}).map((_,i) => <KpiSkeleton key={`kpi-sk-${i}`} />)}
          </div>
        ) : resumen && <KpisGrid resumen={resumen} animKpis={animKpis} />}

        <TabBar tab={tab} setTab={setTab} />

        <TabContent
          tab={tab} porHora={porHora} porDia={porDia} distribucion={distribucion}
          distribucionWithFill={distribucionWithFill} fechaInicio={fechaInicio}
          semanal={semanal} predSemanal={predSemanal} modeloSem={modeloSem} semanalComb={semanalComb}
          diario={diario} predDiario={predDiario} modeloDia={modeloDia} diarioComb={diarioComb}
          mapaCalor={mapaCalor} mapaMax={mapaMax} mapaTop5={mapaTop5}
          historial={historial} filtroDia={filtroDia} setFiltroDia={setFiltroDia}
        />

        {loading && (
          <div style={{ position:"fixed", bottom:24, right:24, display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10, background:C.card, border:`1px solid rgba(255,132,14,0.25)`, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
            <RefreshCw size={13} color={C.orange} style={{ animation:"spin 1s linear infinite" }} />
            <span style={{ fontSize:12.5, color:C.orange, fontFamily:FB, fontWeight:600 }}>Cargando estadísticas...</span>
          </div>
        )}
      </main>
    </>
  );
}