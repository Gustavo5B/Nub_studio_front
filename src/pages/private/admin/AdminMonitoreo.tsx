// src/pages/private/admin/AdminMonitoreo.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Database, Zap, AlertTriangle, CheckCircle,
  RefreshCw, ChevronRight, Cpu, Clock, Users, TrendingUp,
  AlertCircle, Info, Table2, Search, BarChart2, PlayCircle,
  Lock, Settings, Wrench, History, Code2, BookOpen,
  ChevronDown, ChevronUp, HardDrive, Trash2, XCircle,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast }    from "../../../context/ToastContext";

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
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)"; // card shadow
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }
const fmt  = (n: number) => new Intl.NumberFormat("es-MX").format(n ?? 0);
const fmtB = (b: number) => {
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(2)} MB`;
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Resumen {
  bd:{ size:string; bytes:number; tablas:number; filas:number };
  rendimiento:{ cache_hit_ratio:number; conexiones_total:number; conexiones_activas:number; conexiones_inactivas:number; tx_total:number; tx_commits:number; tx_rollbacks:number };
  indices:{ sin_uso:number };
  servidor:{ uptime:string; uptime_ms:number; mem_total_mb:number; mem_usada_mb:number; mem_pct:number; node_version:string };
}
interface TablaInfo {
  nombre:string; filas_vivas:number; filas_muertas:number;
  size_total:string; bytes_total:number; size_indices:string;
  scans_secuenciales:number; scans_por_indice:number;
  inserciones:number; actualizaciones:number; eliminaciones:number;
  last_vacuum?:string; last_analyze?:string;
}
interface QueryLenta { query:string; calls?:number; tiempo_promedio_ms?:number; duracion_seg?:number; state?:string; }
interface Indice { indice:string; tabla:string; usos?:number; tamanio:string; bytes?:number; }
interface Alerta { nivel:"ok"|"info"|"advertencia"|"critico"; tipo:string; titulo:string; descripcion:string; valor:number; tabla?:string; }
interface VacuumResult { tabla:string; ok:boolean; duracion:number; error?:string; }
interface Herramienta {
  nombre:string; tipo:string; categoria:string; disponible:boolean;
  descripcion:string; metricas:string[]; uso_en_panel:string; sql_ejemplo:string;
}
interface Bloqueo {
  pid_bloqueado:number; usuario:string; query_bloqueada:string; espera_seg:number;
  pid_bloqueante:number; usuario_bloqueante:string; query_bloqueante:string;
  wait_event_type:string; wait_event:string;
}
interface ParamPG { name:string; setting:string; unit:string; category:string; short_desc:string; }
interface HistorialEntry {
  id:number; tipo:string; tabla:string|null; alcance:string;
  duracion_ms:number; exitoso:boolean; error_msg:string|null;
  ejecutado_en:string; admin_nombre:string|null;
}
interface ConexionData { pid:number; usuario:string; aplicacion:string; state:string; query:string; duracion_seg:number; }
interface ConexionesState { conexiones:ConexionData[]; max_conexiones:number; por_estado:{ state:string; total:number }[] }
interface BloqueosState { bloqueos_activos:Bloqueo[]; estadisticas_bd:Record<string,unknown>; eventos_espera:{ wait_event_type:string; wait_event:string; total:number }[] }
interface ConfigState { parametros:ParamPG[]; evaluaciones:Record<string,{estado:string;recomendacion:string|null}>; version:string; extensiones:{ name:string; installed_version:string }[] }
interface IndicesState { usados:Indice[]; sin_uso:Indice[]; posibles_faltantes:TablaInfo[] }

type Tab = "resumen"|"alertas"|"tablas"|"queries"|"indices"|"conexiones"|"bloqueos"|"configuracion"|"herramientas"|"historial";

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════════════════
function KpiCard({ label, value, sub, accent, icon:Icon }:{
  label:string; value:string|number; sub?:string; accent:string; icon:React.ElementType; gauge?:number;
}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${accent}`, borderRadius:10, padding:"14px 16px", boxShadow:CS, transition:"box-shadow .2s" }}
      onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow=`0 4px 16px rgba(0,0,0,0.09), 0 0 0 1px ${accent}28`; }}
      onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow=CS; }}>
      {/* Label + ícono arriba-izquierda */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
        <div style={{ width:22, height:22, borderRadius:6, background:`${accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={12} color={accent} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:accent, fontFamily:FB }}>{label}</span>
      </div>
      {/* Sub izquierda · Número derecha */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:8 }}>
        {sub
          ? <div style={{ fontSize:11.5, color:C.creamSub, fontFamily:FB, fontWeight:500, lineHeight:1.45, maxWidth:"55%" }}>{sub}</div>
          : <div />}
        <div style={{ fontSize:30, fontWeight:700, color:C.cream, fontFamily:FM, lineHeight:1, letterSpacing:"-0.02em", flexShrink:0 }}>{value}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERTA BADGE
// ═══════════════════════════════════════════════════════════════════════════
const ALERTA_MAP = {
  ok:          { color:C.green, bg:"rgba(34,201,122,0.07)",   bd:"rgba(34,201,122,0.20)",  icon:CheckCircle   },
  info:        { color:C.blue,  bg:"rgba(121,170,245,0.07)",  bd:"rgba(121,170,245,0.20)", icon:Info          },
  advertencia: { color:C.gold,  bg:"rgba(255,193,16,0.07)",   bd:"rgba(255,193,16,0.20)",  icon:AlertTriangle },
  critico:     { color:C.red,   bg:"rgba(240,78,107,0.09)",   bd:"rgba(240,78,107,0.25)",  icon:AlertCircle   },
};

function AlertaBadge({ alerta, onVacuum, vacuuming }:{ alerta:Alerta; onVacuum?:(t:string)=>void; vacuuming?:boolean }) {
  const s = ALERTA_MAP[alerta.nivel];
  const Icon = s.icon;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderRadius:10, background:s.bg, border:`1px solid ${s.bd}`, marginBottom:8 }}>
      <div style={{ width:30, height:30, borderRadius:8, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={14} color={s.color} strokeWidth={2} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FB, marginBottom:2 }}>{alerta.titulo}</div>
        <div style={{ fontSize:13, color:C.creamMut, fontFamily:FB, lineHeight:1.5 }}>{alerta.descripcion}</div>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
        {alerta.tipo==="vacuum" && alerta.tabla && onVacuum && (
          <button onClick={()=>onVacuum(alerta.tabla!)} disabled={vacuuming}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, border:`1px solid ${C.orange}35`, background:`${C.orange}10`, color:vacuuming?C.creamMut:C.orange, fontSize:12, fontWeight:700, cursor:vacuuming?"wait":"pointer", fontFamily:FB }}>
            {vacuuming?<RefreshCw size={10} style={{ animation:"spin 1s linear infinite" }}/>:<PlayCircle size={10}/>}
            VACUUM
          </button>
        )}
        <span style={{ fontSize:10.5, padding:"2px 8px", borderRadius:20, fontWeight:800, background:`${s.color}18`, color:s.color, fontFamily:FB, border:`1px solid ${s.color}22`, textTransform:"uppercase" }}>{alerta.nivel}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VACUUM MODAL
// ═══════════════════════════════════════════════════════════════════════════
function VacuumModal({ resultados, duracion, onClose }:{ resultados:VacuumResult[]; duracion:number; onClose:()=>void }) {
  const ok=resultados.filter(r=>r.ok).length, err=resultados.filter(r=>!r.ok).length;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, backdropFilter:"blur(4px)" }}>
      <div style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:500, maxHeight:"80vh", display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:600, color:C.cream, fontFamily:FB, letterSpacing:"-0.01em" }}>VACUUM ANALYZE Global</div>
            <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, marginTop:3 }}>{ok} exitosas · {err} errores · {(duracion/1000).toFixed(1)}s</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", color:C.creamMut, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"border-color .15s" }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
          {[{ l:"Procesadas", v:resultados.length, c:C.blue },{ l:"Exitosas", v:ok, c:C.green },{ l:"Errores", v:err, c:err>0?C.red:C.creamMut }].map(({ l,v,c },i)=>(
            <div key={l} style={{ textAlign:"center", padding:"14px 10px", background:C.card, borderLeft:i>0?`1px solid ${C.border}`:"none" }}>
              <div style={{ fontSize:26, fontWeight:700, color:c, fontFamily:FM, letterSpacing:"-0.02em" }}>{v}</div>
              <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowY:"auto", maxHeight:260, display:"flex", flexDirection:"column", gap:3 }}>
          {resultados.map((r)=>(
            <div key={r.tabla} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderRadius:7, background:r.ok?"rgba(19,138,78,0.04)":"rgba(200,54,79,0.04)", border:`1px solid ${r.ok?"rgba(19,138,78,0.15)":"rgba(200,54,79,0.18)"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                {r.ok?<CheckCircle size={11} color={C.green}/>:<AlertCircle size={11} color={C.red}/>}
                <span style={{ fontSize:13, color:C.cream, fontFamily:FM }}>{r.tabla}</span>
                {r.error&&<span style={{ fontSize:11.5, color:C.red, fontFamily:FB }}>· {r.error}</span>}
              </div>
              <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FM }}>{r.duracion}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════════════════
function Topbar({ navigate, onRefresh, loading }:{ navigate:(p:string)=>void; onRefresh:()=>void; loading:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:48, background:C.bgDeep, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:30, fontFamily:FB, boxShadow:"0 1px 0 rgba(0,0,0,0.08)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span role="button" tabIndex={0} style={{ fontSize:12, fontWeight:600, color:C.creamMut, letterSpacing:"0.04em", cursor:"pointer", transition:"color .15s" }}
          onClick={()=>navigate("/admin")}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.cream}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.creamMut}
          onKeyDown={e => { if (e.key === "Enter") navigate("/admin"); }}>Admin</span>
        <ChevronRight size={10} color={C.creamMut} style={{ opacity:0.4 }} />
        <span style={{ fontSize:12, color:C.creamSub }}>Monitoreo</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}80`, animation:"pulse 2s infinite" }} />
          <span style={{ fontSize:11.5, color:C.creamMut, fontWeight:500 }}>PostgreSQL</span>
        </div>
        <div style={{ width:1, height:14, background:C.border }} />
        <button onClick={onRefresh} disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:"none", color:loading?C.creamMut:C.creamSub, fontSize:12.5, fontWeight:500, cursor:loading?"wait":"pointer", fontFamily:FB, transition:"color .15s", padding:"4px 2px" }}>
          <RefreshCw size={12} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTON helper
// ═══════════════════════════════════════════════════════════════════════════
function ActionBtn({ onClick, disabled, icon:Icon, label, color, borderColor, bgColor }: {
  onClick:()=>void; disabled:boolean; icon:React.ElementType; label:string;
  color:string; borderColor:string; bgColor:string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6,
        border:`1px solid ${borderColor}`, background:bgColor,
        color:disabled?C.creamMut:color, fontSize:11.5, fontWeight:600,
        cursor:disabled?"wait":"pointer", fontFamily:FB, whiteSpace:"nowrap" }}>
      {disabled?<RefreshCw size={9} style={{ animation:"spin 1s linear infinite" }}/>:<Icon size={9}/>}
      {disabled?"...":label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: RESUMEN
// ═══════════════════════════════════════════════════════════════════════════
function getCacheAccent(ratio: number): string {
  if (ratio >= 99) return C.green;
  if (ratio >= 95) return C.gold;
  return C.red;
}

function getCacheSub(ratio: number): string {
  if (ratio >= 99) return "✓ Óptimo — datos en RAM";
  if (ratio >= 95) return `⚠ ${(100-ratio).toFixed(1)}% lecturas de disco`;
  return `❌ ${(100-ratio).toFixed(1)}% lecturas de disco — RAM insuficiente`;
}

function getMemAccent(pct: number): string {
  if (pct > 85) return C.red;
  if (pct > 70) return C.gold;
  return C.green;
}

function getMemSub(pct: number, total: number): string {
  const label = pct > 85 ? "⚠ Crítica" : pct > 70 ? "Elevada" : "Normal";
  return `${label} · ${total} MB total`;
}

function TabResumen({ resumen }: { resumen:Resumen }) {
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
        <KpiCard label="Tamaño de la BD" value={resumen.bd.size} accent={C.blue} icon={Database} sub="Espacio total ocupado en disco" />
        <KpiCard label="Eficiencia de caché" value={`${resumen.rendimiento.cache_hit_ratio}%`}
          sub={getCacheSub(resumen.rendimiento.cache_hit_ratio)}
          accent={getCacheAccent(resumen.rendimiento.cache_hit_ratio)}
          icon={TrendingUp} gauge={resumen.rendimiento.cache_hit_ratio} />
        <KpiCard label="RAM del servidor" value={`${resumen.servidor.mem_usada_mb} MB`}
          accent={getMemAccent(resumen.servidor.mem_pct)} icon={Cpu} gauge={resumen.servidor.mem_pct}
          sub={getMemSub(resumen.servidor.mem_pct, resumen.servidor.mem_total_mb)} />
        <KpiCard label="Tiempo en línea" value={resumen.servidor.uptime} accent={C.purple} icon={Clock} sub="Desde el último reinicio" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        <KpiCard label="Total de tablas" value={resumen.bd.tablas} accent={C.orange} icon={Table2} sub="En schema público" />
        <KpiCard label="Total de filas" value={fmt(resumen.bd.filas)} accent={C.blue} icon={HardDrive} sub="Filas activas en todas las tablas" />
        <KpiCard label="Conexiones activas" value={resumen.rendimiento.conexiones_activas}
          accent={resumen.rendimiento.conexiones_activas>20?C.gold:C.green} icon={Users}
          sub={`${resumen.rendimiento.conexiones_total} total · ${resumen.rendimiento.conexiones_activas>20?"⚠ Alta demanda":"Normal"}`} />
        <KpiCard label="Índices inactivos" value={resumen.indices.sin_uso}
          accent={resumen.indices.sin_uso>5?C.gold:C.green} icon={Zap}
          sub={resumen.indices.sin_uso>0?"Sin uso — candidatos a eliminar":"Sin índices innecesarios"} />
      </div>
      <TxStats rendimiento={resumen.rendimiento} />
    </div>
  );
}

function TxStats({ rendimiento }: { rendimiento:Resumen["rendimiento"] }) {
  const items = [
    { label:"Transacciones totales", value:fmt(rendimiento.tx_total), color:C.blue },
    { label:"Commits exitosos", value:fmt(rendimiento.tx_commits), color:C.green },
    { label:"Rollbacks", value:fmt(rendimiento.tx_rollbacks), color:rendimiento.tx_rollbacks>100?C.red:C.gold },
  ];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:CS, overflow:"hidden" }}>
      <div style={{ padding:"11px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:7 }}>
        <BarChart2 size={12} color={C.orange} strokeWidth={2} />
        <span style={{ fontSize:13, fontWeight:600, color:C.cream, fontFamily:FB }}>Estadísticas de transacciones</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)" }}>
        {items.map(({ label,value,color },i)=>(
          <div key={label} style={{ padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderRight:i<2?`1px solid ${C.border}`:"none" }}>
            <div style={{ fontSize:11.5, color:C.creamSub, fontFamily:FB, fontWeight:500 }}>{label}</div>
            <div style={{ fontSize:24, fontWeight:700, color, fontFamily:FM, letterSpacing:"-0.02em" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: ALERTAS
// ═══════════════════════════════════════════════════════════════════════════
function TabAlertas({ alertas, alertasCriticas, onVacuum, vacuumingTabla }: {
  alertas:Alerta[]; alertasCriticas:number; onVacuum:(t:string)=>void; vacuumingTabla:string|null;
}) {
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      {alertasCriticas>0 && (
        <div style={{ padding:"10px 16px", borderRadius:10, background:"rgba(240,78,107,0.08)", border:`1px solid rgba(240,78,107,0.25)`, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <AlertCircle size={14} color={C.red} />
          <span style={{ fontSize:14, color:C.red, fontWeight:700, fontFamily:FB }}>{alertasCriticas} problema(s) crítico(s) — requieren atención inmediata</span>
        </div>
      )}
      {alertas.map((a)=><AlertaBadge key={`${a.tipo}-${a.tabla}`} alerta={a} onVacuum={a.tipo==="vacuum"?onVacuum:undefined} vacuuming={vacuumingTabla===a.tabla} />)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: TABLAS
// ═══════════════════════════════════════════════════════════════════════════
function TablaRow({ t, index, onVacuum, onReindex, vacuumingTabla, reindexing }: {
  t:TablaInfo; index:number; onVacuum:(s:string)=>void; onReindex:(s:string)=>void;
  vacuumingTabla:string|null; reindexing:string|null;
}) {
  const pctM = t.filas_vivas>0 ? Math.round((t.filas_muertas/(t.filas_vivas+t.filas_muertas))*100) : 0;
  const needsV = pctM>5 || t.filas_muertas>500;
  const isV = vacuumingTabla===t.nombre;
  const isR = reindexing===t.nombre;
  const lastA = t.last_analyze ? new Date(t.last_analyze).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}) : "Nunca";
  const muertasColor = pctM>15?C.red:pctM>5?C.gold:C.creamMut;

  return (
    <tr style={{ borderBottom:`1px solid rgba(0,0,0,0.04)`, background:index%2===0?"rgba(0,0,0,0.015)":"transparent" }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(0,0,0,0.03)"}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=index%2===0?"rgba(0,0,0,0.015)":"transparent"}>
      <td style={{ padding:"8px 12px" }}><span style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FM }}>{t.nombre}</span></td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.green, fontFamily:FM, fontWeight:600 }}>{fmt(t.filas_vivas)}</td>
      <td style={{ padding:"8px 12px" }}>
        <span style={{ fontSize:12.5, color:muertasColor, fontFamily:FM }}>
          {fmt(t.filas_muertas)}{pctM>5&&<span style={{ fontSize:10.5 }}> ({pctM}%)</span>}
        </span>
      </td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.blue, fontFamily:FM }}>{t.size_total}</td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.purple, fontFamily:FM }}>{t.size_indices}</td>
      <td style={{ padding:"8px 12px", fontSize:12, color:C.creamMut, fontFamily:FM }}>
        <span style={{ color:t.scans_secuenciales>1000?C.gold:C.creamMut }}>{fmt(t.scans_secuenciales)}</span>/<span style={{ color:C.green }}>{fmt(t.scans_por_indice)}</span>
      </td>
      <td style={{ padding:"8px 12px", fontSize:12, fontFamily:FM }}>
        <span style={{ color:C.green }}>{fmt(t.inserciones)}</span>/<span style={{ color:C.gold }}>{fmt(t.actualizaciones)}</span>/<span style={{ color:C.red }}>{fmt(t.eliminaciones)}</span>
      </td>
      <td style={{ padding:"8px 12px", fontSize:12, color:lastA==="Nunca"?C.red:C.creamMut, fontFamily:FM }}>{lastA}</td>
      <td style={{ padding:"8px 12px" }}>
        <ActionBtn onClick={()=>onVacuum(t.nombre)} disabled={isV||!!vacuumingTabla}
          icon={PlayCircle} label="VACUUM" color={needsV?C.orange:C.creamMut}
          borderColor={needsV?C.orange+"45":C.border} bgColor={needsV?`${C.orange}10`:"rgba(0,0,0,0.02)"} />
      </td>
      <td style={{ padding:"8px 12px" }}>
        <ActionBtn onClick={()=>onReindex(t.nombre)} disabled={isR||!!reindexing}
          icon={Zap} label="REINDEX" color={C.purple}
          borderColor="rgba(141,76,205,0.35)" bgColor="rgba(141,76,205,0.08)" />
      </td>
    </tr>
  );
}

function TabTablas({ tablas, onVacuum, onReindex, vacuumingTabla, reindexing }: {
  tablas:TablaInfo[]; onVacuum:(s:string)=>void; onReindex:(s:string)=>void;
  vacuumingTabla:string|null; reindexing:string|null;
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = tablas.filter(t=>t.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, background:C.card, borderRadius:9, padding:"7px 12px", boxShadow:CS }}>
          <Search size={12} color={C.creamMut} />
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar tabla..."
            style={{ background:"transparent", border:"none", outline:"none", color:C.cream, fontSize:13.5, fontFamily:FM, flex:1 }} />
        </div>
        <span style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB }}>{filtradas.length} tablas</span>
      </div>
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8F7FC" }}>
                {["Tabla","Filas vivas","Filas obsoletas","Tamaño","Índices","Escaneos (Comp./Índice)","Operaciones (I/U/E)","Últ. Análisis","VACUUM","REINDEX"].map(h=>(
                  <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.creamSub, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((t,i)=>(
                <TablaRow key={t.nombre} t={t} index={i} onVacuum={onVacuum} onReindex={onReindex} vacuumingTabla={vacuumingTabla} reindexing={reindexing} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display:"flex", gap:14, marginTop:8, padding:"8px 12px", borderRadius:9, background:"rgba(0,0,0,0.02)", border:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.orange }}>●</span> Naranja = tabla necesita VACUUM (filas obsoletas &gt; 5%)</span>
        <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.red }}>Nunca</span> = sin estadísticas — ANALYZE mejora el planificador</span>
        <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.purple }}>REINDEX</span> = reconstruye índices inflados o corruptos</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: QUERIES
// ═══════════════════════════════════════════════════════════════════════════
function ActiveQueryCard({ c }: { c:ConexionData }) {
  return (
    <div style={{ padding:"10px 13px", borderRadius:9, background:"rgba(34,201,122,0.04)", border:`1px solid rgba(34,201,122,0.14)` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, padding:"2px 7px", borderRadius:20, background:"rgba(34,201,122,0.12)", color:C.green, fontFamily:FM, fontWeight:700 }}>PID {c.pid}</span>
          <span style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>{c.usuario}</span>
        </div>
        <span style={{ fontSize:13, color:c.duracion_seg>30?C.red:C.gold, fontFamily:FM, fontWeight:700 }}>{c.duracion_seg}s</span>
      </div>
      <div style={{ fontSize:12, color:C.cream, fontFamily:FM, background:"#F3F2F8", border:`1px solid ${C.border}`, padding:"7px 10px", borderRadius:6, lineHeight:1.5, wordBreak:"break-all" }}>{c.query}</div>
    </div>
  );
}

function QueryCard({ q, index }: { q:QueryLenta; index:number }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:9, marginBottom:6, background:"rgba(0,0,0,0.02)", border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:20, height:20, borderRadius:5, background:`${C.orange}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.orange }}>{index+1}</span>
          {q.calls!==undefined&&<span style={{ fontSize:11.5, padding:"2px 7px", borderRadius:20, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.22)", color:C.blue, fontFamily:FM }}>{fmt(q.calls)} ejecuciones</span>}
          {q.state&&<span style={{ fontSize:11.5, padding:"2px 7px", borderRadius:20, background:"rgba(34,201,122,0.10)", color:C.green, fontFamily:FB }}>{q.state}</span>}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {q.tiempo_promedio_ms!==undefined&&<span style={{ fontSize:13, color:q.tiempo_promedio_ms>1000?C.red:q.tiempo_promedio_ms>100?C.gold:C.green, fontFamily:FM, fontWeight:700 }}>Prom. {q.tiempo_promedio_ms}ms</span>}
          {q.duracion_seg!==undefined&&<span style={{ fontSize:13, color:q.duracion_seg>30?C.red:C.gold, fontFamily:FM, fontWeight:700 }}>{q.duracion_seg}s activa</span>}
        </div>
      </div>
      <div style={{ fontSize:12, color:C.cream, fontFamily:FM, background:"#F3F2F8", border:`1px solid ${C.border}`, padding:"7px 10px", borderRadius:6, lineHeight:1.5, wordBreak:"break-all" }}>{q.query}</div>
    </div>
  );
}

function TabQueries({ queries, conexiones }: { queries:QueryLenta[]; conexiones:ConexionesState|null }) {
  const activeConns = conexiones ? (conexiones.conexiones as ConexionData[]).filter(c=>c.query&&c.state==="active") : [];

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
          <Search size={13} color={C.orange} />
          <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Consultas más lentas</span>
          <span style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>Top 10 por tiempo promedio de ejecución</span>
        </div>
        <div style={{ padding:"8px 10px" }}>
          {queries.length===0 ? (
            <QueriesFallback activeConns={activeConns} />
          ) : queries.map((q,i)=>(
            <QueryCard key={`q-${i}`} q={q} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QueriesFallback({ activeConns }: { activeConns:ConexionData[] }) {
  return (
    <div style={{ padding:"20px" }}>
      <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(121,170,245,0.07)", border:`1px solid rgba(121,170,245,0.20)`, marginBottom:14, display:"flex", alignItems:"flex-start", gap:10 }}>
        <Info size={14} color={C.blue} style={{ flexShrink:0, marginTop:1 }} />
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FB, marginBottom:2 }}>pg_stat_statements no disponible</div>
          <div style={{ fontSize:13, color:C.creamMut, fontFamily:FB, lineHeight:1.6 }}>
            Requiere activación por el proveedor. Mostrando consultas activas en tiempo real desde <span style={{ color:C.blue, fontFamily:FM }}>pg_stat_activity</span>.
          </div>
        </div>
      </div>
      {activeConns.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {activeConns.map(c=><ActiveQueryCard key={c.pid} c={c} />)}
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"20px", color:C.creamMut, fontSize:14, fontFamily:FB }}>No hay consultas activas en este momento</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: ÍNDICES
// ═══════════════════════════════════════════════════════════════════════════
function IndiceExpandido({ idx, tipo }: {
  idx:Indice; tipo:"sinuso"|"usado"; onEliminar?:(n:string,t:string)=>void; deleting?:boolean;
  position?:number; totalUsados?:number;
}) {
  if (tipo === "sinuso") {
    return (
      <div style={{ padding:"12px 16px", borderTop:`1px solid rgba(255,193,16,0.15)`, background:"rgba(0,0,0,0.025)", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(255,193,16,0.06)", border:`1px solid rgba(255,193,16,0.15)` }}>
            <div style={{ fontSize:10.5, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Usos desde último reset</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.cream, fontFamily:FM, letterSpacing:"-0.02em" }}>0</div>
            <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>idx_scan = 0 — nunca usado</div>
          </div>
          <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(121,170,245,0.06)", border:`1px solid rgba(121,170,245,0.15)` }}>
            <div style={{ fontSize:10.5, fontWeight:800, color:C.blue, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Espacio que libera</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.cream, fontFamily:FM, letterSpacing:"-0.02em" }}>{idx.tamanio}</div>
            <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>si se elimina</div>
          </div>
          <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(34,201,122,0.06)", border:`1px solid rgba(34,201,122,0.15)` }}>
            <div style={{ fontSize:10.5, fontWeight:800, color:C.green, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Impacto al eliminar</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.green, fontFamily:FB, marginTop:4 }}>✓ Ninguno</div>
            <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>las queries no lo usan</div>
          </div>
        </div>
        <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.15)`, fontSize:12.5, color:C.creamSub, fontFamily:FB, lineHeight:1.6 }}>
          💡 <strong style={{ color:C.orange }}>¿Por qué existe?</strong> Este índice fue creado pero PostgreSQL nunca lo ha usado para acelerar ninguna consulta. Eliminarlo libera {idx.tamanio} sin afectar el rendimiento.
        </div>
      </div>
    );
  }
  return null;
}

function IndiceUsadoExpandido({ idx, position, totalUsados }: { idx:Indice; position:number; totalUsados:number }) {
  return (
    <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.borderBr}`, background:"rgba(0,0,0,0.025)", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(34,201,122,0.06)", border:`1px solid rgba(34,201,122,0.15)` }}>
          <div style={{ fontSize:10.5, fontWeight:800, color:C.green, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Total de usos</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.cream, fontFamily:FM, letterSpacing:"-0.02em" }}>{fmt(idx.usos??0)}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>escaneos por índice</div>
        </div>
        <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(121,170,245,0.06)", border:`1px solid rgba(121,170,245,0.15)` }}>
          <div style={{ fontSize:10.5, fontWeight:800, color:C.blue, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Tamaño en disco</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.cream, fontFamily:FM, letterSpacing:"-0.02em" }}>{idx.tamanio}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>espacio usado</div>
        </div>
        <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.15)` }}>
          <div style={{ fontSize:10.5, fontWeight:800, color:C.orange, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:4 }}>Posición por uso</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.cream, fontFamily:FM, letterSpacing:"-0.02em" }}>#{position}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>de {totalUsados} índices activos</div>
        </div>
      </div>
      <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(34,201,122,0.05)", border:`1px solid rgba(34,201,122,0.15)`, fontSize:12.5, color:C.creamSub, fontFamily:FB, lineHeight:1.6 }}>
        ✅ <strong style={{ color:C.green }}>Índice saludable</strong> — PostgreSQL lo usa activamente para acelerar consultas en la tabla <span style={{ color:C.cream, fontFamily:FM }}>{idx.tabla}</span>.
      </div>
    </div>
  );
}

function TabIndices({ indices, onEliminar, deletingIdx }: {
  indices:IndicesState; onEliminar:(n:string,t:string)=>void; deletingIdx:string|null;
}) {
  const [expandedIdx, setExpandedIdx] = useState<string|null>(null);
  const maxUsos = indices.usados[0]?.usos ?? 1;

  return (
    <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
      {indices.sin_uso.length>0 && (
        <div style={{ background:C.card, border:`1px solid rgba(255,193,16,0.22)`, borderRadius:13, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(255,193,16,0.05)" }}>
            <AlertTriangle size={13} color={C.gold} />
            <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Índices inactivos</span>
            <span style={{ fontSize:11.5, padding:"1px 7px", borderRadius:20, background:"rgba(255,193,16,0.12)", border:"1px solid rgba(255,193,16,0.25)", color:C.gold, fontWeight:700 }}>{indices.sin_uso.length}</span>
            <span style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB }}>Candidatos a eliminar</span>
          </div>
          <div style={{ padding:"8px 10px" }}>
            {indices.sin_uso.map(idx => {
              const expKey = `sinuso-${idx.indice}`;
              const exp = expandedIdx === expKey;
              return (
                <div key={idx.indice} style={{ borderRadius:9, marginBottom:6, overflow:"hidden", border:`1px solid ${exp?"rgba(255,193,16,0.30)":"rgba(255,193,16,0.12)"}` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:"rgba(255,193,16,0.04)", cursor:"pointer" }}
                    onClick={()=>setExpandedIdx(exp?null:expKey)}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {exp?<ChevronUp size={12} color={C.gold}/>:<ChevronDown size={12} color={C.gold}/>}
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FM }}>{idx.indice}</div>
                        <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>tabla: {idx.tabla}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:13, color:C.gold, fontFamily:FM, fontWeight:600 }}>{idx.tamanio}</span>
                      <button onClick={e=>{ e.stopPropagation(); onEliminar(idx.indice, idx.tabla); }} disabled={deletingIdx===idx.indice}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, border:`1px solid rgba(240,78,107,0.35)`, background:"rgba(240,78,107,0.08)", color:deletingIdx===idx.indice?C.creamMut:C.red, fontSize:12, fontWeight:700, cursor:deletingIdx===idx.indice?"wait":"pointer", fontFamily:FB }}>
                        {deletingIdx===idx.indice?<RefreshCw size={10} style={{ animation:"spin 1s linear infinite" }}/>:<Trash2 size={10}/>}
                        Eliminar
                      </button>
                    </div>
                  </div>
                  {exp && <IndiceExpandido idx={idx} tipo="sinuso" onEliminar={onEliminar} deleting={deletingIdx===idx.indice} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
          <Zap size={13} color={C.green} />
          <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Índices más utilizados</span>
        </div>
        <div style={{ padding:"8px 10px" }}>
          {indices.usados.map((idx,i) => {
            const expKey = `usado-${idx.indice}`;
            const exp = expandedIdx === expKey;
            const pct = Math.min(((idx.usos??0)/(maxUsos||1))*100, 100);
            return (
              <div key={idx.indice} style={{ borderRadius:9, marginBottom:4, overflow:"hidden", border:`1px solid ${exp?"rgba(34,201,122,0.25)":C.border}` }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 80px 24px", alignItems:"center", gap:10, padding:"9px 12px", background:i%2===0?"rgba(0,0,0,0.015)":"transparent", cursor:"pointer" }}
                  onClick={()=>setExpandedIdx(exp?null:expKey)}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FM }}>{idx.indice}</div>
                    <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{idx.tabla}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12.5, color:C.green, fontFamily:FM, fontWeight:700 }}>{fmt(idx.usos??0)}</div>
                    <div style={{ fontSize:10, color:C.creamMut }}>usos</div>
                  </div>
                  <div style={{ textAlign:"right", fontSize:12.5, color:C.blue, fontFamily:FM }}>{idx.tamanio}</div>
                  <div><div style={{ height:4, background:`${C.green}18`, borderRadius:99, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:C.green, borderRadius:99 }}/></div></div>
                  {exp?<ChevronUp size={12} color={C.creamMut}/>:<ChevronDown size={12} color={C.creamMut}/>}
                </div>
                {exp && <IndiceUsadoExpandido idx={idx} position={i+1} totalUsados={indices.usados.length} />}
              </div>
            );
          })}
        </div>
      </div>
      {indices.posibles_faltantes.length>0 && (
        <div style={{ background:C.card, border:`1px solid rgba(240,78,107,0.22)`, borderRadius:13, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(240,78,107,0.05)" }}>
            <AlertCircle size={13} color={C.red} />
            <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Posibles índices faltantes</span>
          </div>
          <div style={{ padding:"8px 10px" }}>
            {indices.posibles_faltantes.map(t=>(
              <div key={t.nombre} style={{ padding:"8px 12px", borderRadius:7, marginBottom:4, background:"rgba(240,78,107,0.04)", border:`1px solid rgba(240,78,107,0.12)` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FM }}>{t.nombre}</span>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:12, color:C.red, fontFamily:FM }}>Completas: {fmt(t.scans_secuenciales)}</span>
                    <span style={{ fontSize:12, color:C.green, fontFamily:FM }}>Por índice: {fmt(t.scans_por_indice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: CONEXIONES
// ═══════════════════════════════════════════════════════════════════════════
function TabConexiones({ conexiones, onKill, killingPid }: { conexiones:ConexionesState; onKill:(pid:number)=>void; killingPid:number|null }) {
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
        {conexiones.por_estado.map(({ state, total })=>{
          const color=state==="active"?C.green:state==="idle"?C.blue:C.gold;
          return (
            <div key={state} style={{ background:C.card, borderRadius:11, boxShadow:CS, padding:"13px 16px", borderLeft:`3px solid ${color}` }}>
              <div style={{ fontSize:26, fontWeight:700, color, fontFamily:FM, letterSpacing:"-0.02em" }}>{total}</div>
              <div style={{ fontSize:12, color:C.creamMut, fontFamily:FM, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{state||"sin estado"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Users size={13} color={C.blue} />
            <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Conexiones activas</span>
          </div>
          <span style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB }}>Máximo permitido: {conexiones.max_conexiones}</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8F7FC" }}>
              {["PID","Usuario","Aplicación","Estado","Duración","Consulta en curso","Acción"].map(h=>(
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.creamSub, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {conexiones.conexiones.map((c,i)=>(
                <ConexionRow key={c.pid} c={c} index={i} onKill={onKill} killingPid={killingPid} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConexionRow({ c, index, onKill, killingPid }: { c:ConexionData; index:number; onKill:(pid:number)=>void; killingPid:number|null }) {
  return (
    <tr style={{ borderBottom:`1px solid rgba(0,0,0,0.04)`, background:index%2===0?"rgba(0,0,0,0.015)":"transparent" }}>
      <td style={{ padding:"7px 12px", fontSize:12.5, color:C.creamMut, fontFamily:FM }}>{c.pid}</td>
      <td style={{ padding:"7px 12px", fontSize:12.5, color:C.cream, fontFamily:FM, fontWeight:600 }}>{c.usuario}</td>
      <td style={{ padding:"7px 12px", fontSize:12, color:C.creamMut, fontFamily:FB }}>{c.aplicacion||"—"}</td>
      <td style={{ padding:"7px 12px" }}>
        <span style={{ fontSize:11, padding:"2px 7px", borderRadius:20, fontWeight:700, fontFamily:FM, background:c.state==="active"?"rgba(34,201,122,0.12)":"rgba(121,170,245,0.10)", color:c.state==="active"?C.green:C.blue }}>{c.state}</span>
      </td>
      <td style={{ padding:"7px 12px", fontSize:12.5, color:c.duracion_seg>30?C.red:C.creamMut, fontFamily:FM }}>{c.duracion_seg!=null?`${c.duracion_seg}s`:"—"}</td>
      <td style={{ padding:"7px 12px", fontSize:11.5, color:C.creamSub, fontFamily:FM, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.query||"—"}</td>
      <td style={{ padding:"7px 12px" }}>
        <ActionBtn onClick={()=>onKill(c.pid)} disabled={killingPid===c.pid} icon={XCircle} label="Kill" color={C.red} borderColor="rgba(240,78,107,0.35)" bgColor="rgba(240,78,107,0.08)" />
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: BLOQUEOS
// ═══════════════════════════════════════════════════════════════════════════
function TabBloqueos({ bloqueos, onKill, killingPid }: { bloqueos:BloqueosState; onKill:(pid:number)=>void; killingPid:number|null }) {
  const count = bloqueos.bloqueos_activos.length;
  return (
    <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ padding:"12px 16px", borderRadius:11, display:"flex", alignItems:"center", gap:12,
        background:count>0?"rgba(240,78,107,0.08)":"rgba(34,201,122,0.07)",
        border:`1px solid ${count>0?"rgba(240,78,107,0.25)":"rgba(34,201,122,0.20)"}` }}>
        <Lock size={16} color={count>0?C.red:C.green} />
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.cream, fontFamily:FB }}>
            {count>0 ? `${count} proceso(s) bloqueado(s) en este momento` : "Sin bloqueos activos — sistema fluido"}
          </div>
          <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>
            Deadlocks históricos: {String(bloqueos.estadisticas_bd.deadlocks ?? 0)} · Conflictos: {String(bloqueos.estadisticas_bd.conflicts ?? 0)}
          </div>
        </div>
      </div>
      {count>0 && <BloqueosActivos bloqueos={bloqueos.bloqueos_activos} onKill={onKill} killingPid={killingPid} />}
      {bloqueos.eventos_espera.length>0 && <EventosEspera eventos={bloqueos.eventos_espera} />}
    </div>
  );
}

function BloqueosActivos({ bloqueos, onKill, killingPid }: { bloqueos:Bloqueo[]; onKill:(pid:number)=>void; killingPid:number|null }) {
  return (
    <div style={{ background:C.card, border:`1px solid rgba(240,78,107,0.22)`, borderRadius:13, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(240,78,107,0.06)" }}>
        <AlertCircle size={13} color={C.red} />
        <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Bloqueos activos</span>
      </div>
      <div style={{ padding:"10px" }}>
        {bloqueos.map(b=><BloqueoCard key={b.pid_bloqueado} b={b} onKill={onKill} killingPid={killingPid} />)}
      </div>
    </div>
  );
}

function BloqueoCard({ b, onKill, killingPid }: { b:Bloqueo; onKill:(pid:number)=>void; killingPid:number|null }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:9, marginBottom:6, background:"rgba(240,78,107,0.05)", border:`1px solid rgba(240,78,107,0.15)` }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Proceso bloqueado (PID {b.pid_bloqueado})</div>
          <div style={{ fontSize:13, color:C.cream, fontFamily:FM, fontWeight:600 }}>{b.usuario}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FM, marginTop:3, wordBreak:"break-all" }}>{b.query_bloqueada}</div>
          <div style={{ fontSize:12, color:C.red, marginTop:4 }}>⏳ Esperando {b.espera_seg}s · {b.wait_event_type}: {b.wait_event}</div>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Proceso bloqueante (PID {b.pid_bloqueante})</div>
          <div style={{ fontSize:13, color:C.cream, fontFamily:FM, fontWeight:600 }}>{b.usuario_bloqueante}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FM, marginTop:3, wordBreak:"break-all" }}>{b.query_bloqueante}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10, paddingTop:10, borderTop:`1px solid rgba(240,78,107,0.15)` }}>
        <ActionBtn onClick={()=>onKill(b.pid_bloqueante)} disabled={killingPid===b.pid_bloqueante} icon={XCircle}
          label={`Terminar bloqueante (PID ${b.pid_bloqueante})`} color={C.red} borderColor="rgba(240,78,107,0.40)" bgColor="rgba(240,78,107,0.12)" />
        <ActionBtn onClick={()=>onKill(b.pid_bloqueado)} disabled={killingPid===b.pid_bloqueado} icon={XCircle}
          label={`Terminar bloqueado (PID ${b.pid_bloqueado})`} color={C.creamMut} borderColor={C.border} bgColor="rgba(0,0,0,0.03)" />
      </div>
    </div>
  );
}

function EventosEspera({ eventos }: { eventos:{ wait_event_type:string; wait_event:string; total:number }[] }) {
  return (
    <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
        <Clock size={13} color={C.gold} />
        <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Procesos en espera</span>
      </div>
      <div style={{ padding:"8px 10px" }}>
        {eventos.map(e=>(
          <div key={`${e.wait_event_type}-${e.wait_event}`} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:7, marginBottom:3, background:"rgba(255,193,16,0.04)", border:`1px solid rgba(255,193,16,0.12)` }}>
            <div>
              <span style={{ fontSize:13, color:C.gold, fontFamily:FM, fontWeight:700 }}>{e.wait_event}</span>
              <span style={{ fontSize:12, color:C.creamMut, fontFamily:FB, marginLeft:8 }}>{e.wait_event_type}</span>
            </div>
            <span style={{ fontSize:13, color:C.cream, fontFamily:FM, fontWeight:700 }}>{e.total} procesos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function TabConfiguracion({ config }: { config:ConfigState }) {
  return (
    <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:C.card, borderRadius:13, boxShadow:CS, padding:"14px 18px" }}>
        <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, marginBottom:6 }}>Versión del motor de base de datos</div>
        <div style={{ fontSize:14, color:C.green, fontFamily:FM, fontWeight:600 }}>{config.version}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {config.extensiones.map(e=>(
            <span key={e.name} style={{ fontSize:11.5, padding:"2px 8px", borderRadius:20, background:"rgba(34,201,122,0.10)", border:"1px solid rgba(34,201,122,0.22)", color:C.green, fontFamily:FM }}>
              {e.name} {e.installed_version}
            </span>
          ))}
        </div>
      </div>
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
          <Settings size={13} color={C.orange} />
          <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Parámetros clave de PostgreSQL</span>
        </div>
        <div style={{ padding:"8px 10px" }}>
          {config.parametros.map((p,i)=><ParamRow key={p.name} param={p} eval={config.evaluaciones[p.name]} index={i} />)}
        </div>
      </div>
    </div>
  );
}

function ParamRow({ param, eval: ev, index }: { param:ParamPG; eval?:{estado:string;recomendacion:string|null}; index:number }) {
  const color = ev?.estado==="critico"?C.red:ev?.estado==="advertencia"?C.gold:ev?.estado==="info"?C.blue:C.green;
  return (
    <div style={{ padding:"10px 14px", borderRadius:9, marginBottom:4, background:index%2===0?"rgba(0,0,0,0.015)":"transparent", border:`1px solid ${ev?.estado!=="ok"&&ev?.estado?`${color}20`:C.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FM }}>{param.name}</span>
            <span style={{ fontSize:10.5, padding:"1px 6px", borderRadius:20, background:`${color}18`, color, fontWeight:700, border:`1px solid ${color}25` }}>{ev?.estado??'ok'}</span>
          </div>
          <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, lineHeight:1.5 }}>{param.short_desc}</div>
          {ev?.recomendacion&&<div style={{ fontSize:12.5, color, fontFamily:FB, marginTop:4, fontStyle:"italic" }}>💡 {ev.recomendacion}</div>}
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FM }}>{param.setting}<span style={{ fontSize:11, color:C.creamMut, fontWeight:400 }}> {param.unit}</span></div>
          <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{param.category}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: HERRAMIENTAS
// ═══════════════════════════════════════════════════════════════════════════
function getHerramientaIcon(tipo: string, disponible: boolean) {
  const color = disponible?C.green:C.red;
  if (tipo==="extensión") return <Zap size={14} color={color}/>;
  if (tipo==="comando SQL") return <Code2 size={14} color={color}/>;
  return <Database size={14} color={color}/>;
}

function HerramientaCard({ h, expanded, onToggle }: { h:Herramienta; expanded:boolean; onToggle:()=>void }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${h.disponible?C.border:"rgba(240,78,107,0.15)"}`, borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:h.disponible?"transparent":"rgba(240,78,107,0.04)" }}
        onClick={onToggle}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:h.disponible?"rgba(34,201,122,0.10)":"rgba(240,78,107,0.10)", border:`1px solid ${h.disponible?"rgba(34,201,122,0.22)":"rgba(240,78,107,0.22)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {getHerramientaIcon(h.tipo, h.disponible)}
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FM }}>{h.nombre}</span>
              <span style={{ fontSize:10.5, padding:"1px 7px", borderRadius:20, fontFamily:FB, fontWeight:700, background:h.disponible?"rgba(34,201,122,0.12)":"rgba(240,78,107,0.12)", color:h.disponible?C.green:C.red, border:`1px solid ${h.disponible?"rgba(34,201,122,0.25)":"rgba(240,78,107,0.25)"}` }}>
                {h.disponible?"✓ Disponible":"✗ No disponible"}
              </span>
              <span style={{ fontSize:10.5, padding:"1px 7px", borderRadius:20, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.22)", color:C.blue, fontFamily:FB }}>{h.tipo}</span>
            </div>
            <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{h.descripcion.substring(0,90)}...</div>
          </div>
        </div>
        {expanded?<ChevronUp size={14} color={C.creamMut}/>:<ChevronDown size={14} color={C.creamMut}/>}
      </div>
      {expanded && <HerramientaDetalle h={h} />}
    </div>
  );
}

function HerramientaDetalle({ h }: { h:Herramienta }) {
  return (
    <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${C.borderBr}` }}>
      <div style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:14, color:C.creamSub, fontFamily:FB, lineHeight:1.7 }}>{h.descripcion}</div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.10em", fontFamily:FB, marginBottom:6 }}>Métricas que expone</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {h.metricas.map((m,mi)=>(
              <span key={mi} style={{ fontSize:12.5, padding:"3px 10px", borderRadius:20, background:"rgba(0,0,0,0.04)", border:`1px solid ${C.border}`, color:C.creamSub, fontFamily:FB }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.18)` }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.orange, fontFamily:FB }}>📍 En este panel: </span>
          <span style={{ fontSize:12.5, color:C.creamSub, fontFamily:FB }}>{h.uso_en_panel}</span>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.10em", fontFamily:FB, marginBottom:6 }}>Consulta de ejemplo</div>
          <div style={{ background:"#F3F2F8", border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 14px", fontFamily:FM, fontSize:13, color:C.cream, lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{h.sql_ejemplo}</div>
        </div>
      </div>
    </div>
  );
}

function TabHerramientas({ herramientas }: { herramientas:Herramienta[] }) {
  const [expandedHerr, setExpandedHerr] = useState<string|null>(null);
  const grouped = herramientas.reduce((acc, h) => {
    if (!acc[h.categoria]) acc[h.categoria] = [];
    acc[h.categoria].push(h);
    return acc;
  }, {} as Record<string, Herramienta[]>);

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ padding:"14px 18px", borderRadius:12, background:"rgba(121,170,245,0.07)", border:`1px solid rgba(121,170,245,0.20)`, marginBottom:16, display:"flex", alignItems:"flex-start", gap:12 }}>
        <BookOpen size={18} color={C.blue} style={{ flexShrink:0, marginTop:2 }} />
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB, marginBottom:4 }}>Herramientas de Monitoreo del SGBD</div>
          <div style={{ fontSize:13.5, color:C.creamMut, fontFamily:FB, lineHeight:1.6 }}>
            PostgreSQL incluye un conjunto de <strong style={{ color:C.blue }}>vistas del sistema, extensiones y comandos</strong> que permiten supervisar el rendimiento en tiempo real.
          </div>
        </div>
      </div>
      {Object.entries(grouped).map(([categoria, items])=>(
        <div key={categoria} style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.creamMut, letterSpacing:"0.10em", textTransform:"uppercase", fontFamily:FB, marginBottom:8, paddingLeft:4 }}>{categoria}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {items.map(h=>(
              <HerramientaCard key={h.nombre} h={h} expanded={expandedHerr===h.nombre} onToggle={()=>setExpandedHerr(expandedHerr===h.nombre?null:h.nombre)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: HISTORIAL
// ═══════════════════════════════════════════════════════════════════════════
function HistorialRow({ h, index }: { h:HistorialEntry; index:number }) {
  const tipoColor = h.tipo==="vacuum"?C.green:C.purple;
  return (
    <tr style={{ borderBottom:`1px solid rgba(0,0,0,0.04)`, background:index%2===0?"rgba(0,0,0,0.015)":"transparent" }}>
      <td style={{ padding:"8px 12px" }}>
        <span style={{ fontSize:12, padding:"2px 8px", borderRadius:20, fontWeight:700, fontFamily:FM,
          background:`${tipoColor}14`, color:tipoColor, border:`1px solid ${tipoColor}25`, textTransform:"uppercase" }}>
          {h.tipo}
        </span>
      </td>
      <td style={{ padding:"8px 12px", fontSize:13, color:C.cream, fontFamily:FM }}>{h.tabla ?? <span style={{ color:C.creamMut }}>todas las tablas</span>}</td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.creamMut, fontFamily:FB }}>{h.alcance}</td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.blue, fontFamily:FM }}>{h.duracion_ms}ms</td>
      <td style={{ padding:"8px 12px" }}>
        {h.exitoso
          ?<span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.green }}><CheckCircle size={11}/>Exitoso</span>
          :<span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.red }}><AlertCircle size={11}/>{h.error_msg?.substring(0,40)}</span>}
      </td>
      <td style={{ padding:"8px 12px", fontSize:12.5, color:C.creamMut, fontFamily:FB }}>{h.admin_nombre??"—"}</td>
      <td style={{ padding:"8px 12px", fontSize:12, color:C.creamMut, fontFamily:FM }}>
        {new Date(h.ejecutado_en).toLocaleString("es-MX",{ day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
      </td>
    </tr>
  );
}

function TabHistorial({ historial }: { historial:HistorialEntry[] }) {
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ background:C.card, borderRadius:13, overflow:"hidden", boxShadow:CS }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
          <History size={13} color={C.purple} />
          <span style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>Historial de mantenimiento</span>
          <span style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>Últimas 100 operaciones ejecutadas</span>
        </div>
        {historial.length===0
          ? <div style={{ padding:"32px", textAlign:"center", color:C.creamMut, fontSize:14, fontFamily:FB }}>Sin operaciones registradas aún.</div>
          : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"rgba(7,5,16,0.98)" }}>
                  {["Operación","Tabla afectada","Alcance","Duración","Resultado","Admin","Fecha y hora"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:C.orange, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {historial.map((h,i)=><HistorialRow key={h.id} h={h} index={i} />)}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB BAR
// ═══════════════════════════════════════════════════════════════════════════
function TabButton({ label, icon:Icon, badge, badgeColor, active, onClick }: {
  id:string; label:string; icon:React.ElementType; badge?:number; badgeColor?:string; active:boolean; onClick:()=>void;
}) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px 10px",
        borderRadius:8, border:"none",
        background:"transparent",
        color:active?C.cream:C.creamMut, fontSize:12.5, fontWeight:active?600:400,
        cursor:"pointer", fontFamily:FB, transition:"color .15s", position:"relative", whiteSpace:"nowrap",
        borderBottom:active?`1.5px solid ${C.orange}`:"1.5px solid transparent" }}>
      <Icon size={11} strokeWidth={active?2:1.6} />
      {label}
      {badge!==undefined && <span style={{ fontSize:8.5, padding:"1px 5px", borderRadius:20, background:badgeColor, color:"white", fontWeight:800, lineHeight:1.6 }}>{badge}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT — low complexity
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminMonitoreo() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [tab,         setTab]         = useState<Tab>("resumen");
  const [loading,     setLoading]     = useState(true);
  const [resumen,     setResumen]     = useState<Resumen|null>(null);
  const [tablas,      setTablas]      = useState<TablaInfo[]>([]);
  const [queries,     setQueries]     = useState<QueryLenta[]>([]);
  const [indices,     setIndices]     = useState<IndicesState|null>(null);
  const [conexiones,  setConexiones]  = useState<ConexionesState|null>(null);
  const [alertas,     setAlertas]     = useState<Alerta[]>([]);
  const [bloqueos,    setBloqueos]    = useState<BloqueosState|null>(null);
  const [config,      setConfig]      = useState<ConfigState|null>(null);
  const [herramientas,setHerramientas]= useState<Herramienta[]>([]);
  const [historial,   setHistorial]   = useState<HistorialEntry[]>([]);

  const [vacuumingTabla, setVacuumingTabla] = useState<string|null>(null);
  const [vacuumingAll,   setVacuumingAll]   = useState(false);
  const [vacuumModal,    setVacuumModal]    = useState<{ resultados:VacuumResult[]; duracion:number }|null>(null);
  const [reindexing,     setReindexing]     = useState<string|null>(null);
  const [killingPid,     setKillingPid]     = useState<number|null>(null);
  const [deletingIdx,    setDeletingIdx]    = useState<string|null>(null);
  const [autoRefresh,    setAutoRefresh]    = useState(false);
  const [countdown,      setCountdown]      = useState(30);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rR,tR,qR,iR,cR,aR,bR,cfR,hR,hiR] = await Promise.all([
        fetch(`${API}/api/admin/monitoreo/resumen`,        { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/tablas`,         { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/queries-lentas`, { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/indices`,        { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/conexiones`,     { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/alertas`,        { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/bloqueos`,       { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/configuracion`,  { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/herramientas`,   { headers:authH() }),
        fetch(`${API}/api/admin/monitoreo/historial`,      { headers:authH() }),
      ]);
      const [rJ,tJ,qJ,iJ,cJ,aJ,bJ,cfJ,hJ,hiJ] = await Promise.all([rR.json(),tR.json(),qR.json(),iR.json(),cR.json(),aR.json(),bR.json(),cfR.json(),hR.json(),hiR.json()]);
      if (rJ.success)  setResumen(rJ.data);
      if (tJ.success)  setTablas(tJ.data);
      if (qJ.success)  setQueries(qJ.data);
      if (iJ.success)  setIndices(iJ.data);
      if (cJ.success)  setConexiones(cJ.data);
      if (aJ.success)  setAlertas(aJ.data);
      if (bJ.success)  setBloqueos(bJ.data);
      if (cfJ.success) setConfig(cfJ.data);
      if (hJ.success)  setHerramientas(hJ.data);
      if (hiJ.success) setHistorial(hiJ.data);
    } catch { showToast("Error al cargar métricas","err"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!autoRefresh) { setCountdown(30); return; }
    const tick = setInterval(() => {
      setCountdown(c => { if (c <= 1) { cargar(); return 30; } return c - 1; });
    }, 1000);
    return () => clearInterval(tick);
  }, [autoRefresh, cargar]);

  const handleVacuumTabla = async (tabla:string) => {
    setVacuumingTabla(tabla);
    try {
      const res = await fetch(`${API}/api/admin/monitoreo/vacuum/${tabla}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`VACUUM ANALYZE en "${tabla}" completado en ${json.duracion_ms}ms ✓`, "ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en VACUUM","err"); }
    finally { setVacuumingTabla(null); }
  };

  const handleVacuumAll = async () => {
    if (!confirm("¿Ejecutar VACUUM ANALYZE en todas las tablas?")) return;
    setVacuumingAll(true);
    try {
      const res = await fetch(`${API}/api/admin/monitoreo/vacuum-all`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setVacuumModal({ resultados:json.resultados, duracion:json.duracion_ms });
      showToast(`VACUUM global: ${json.tablas_ok} tablas en ${(json.duracion_ms/1000).toFixed(1)}s ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en VACUUM global","err"); }
    finally { setVacuumingAll(false); }
  };

  const handleReindex = async (tabla:string) => {
    if (!confirm(`¿Reconstruir índices de "${tabla}"?`)) return;
    setReindexing(tabla);
    try {
      const res = await fetch(`${API}/api/admin/monitoreo/reindex/${tabla}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const ahorrado = json.bytes_ahorrados > 0 ? ` · ${fmtB(json.bytes_ahorrados)} liberados` : "";
      showToast(`REINDEX "${tabla}" completado en ${json.duracion_ms}ms${ahorrado} ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en REINDEX","err"); }
    finally { setReindexing(null); }
  };

  const handleKillPid = async (pid:number) => {
    if (!confirm(`¿Terminar la conexión PID ${pid}?`)) return;
    setKillingPid(pid);
    try {
      const res = await fetch(`${API}/api/admin/monitoreo/kill-pid/${pid}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Conexión PID ${pid} terminada ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error al terminar conexión","err"); }
    finally { setKillingPid(null); }
  };

  const handleEliminarIndice = async (nombre:string, tabla:string) => {
    if (!confirm(`¿Eliminar el índice "${nombre}" de "${tabla}"?`)) return;
    setDeletingIdx(nombre);
    try {
      const res = await fetch(`${API}/api/admin/monitoreo/indice/${nombre}`, { method:"DELETE", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Índice "${nombre}" eliminado · ${json.tamanio_liberado} liberados ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error al eliminar índice","err"); }
    finally { setDeletingIdx(null); }
  };

  const alertasCriticas = alertas.filter(a=>a.nivel==="critico").length;
  const bloqueosActivos = bloqueos?.bloqueos_activos.length ?? 0;

  const TABS:{id:Tab;label:string;icon:React.ElementType;badge?:number;badgeColor?:string}[] = [
    { id:"resumen",       label:"Resumen",       icon:BarChart2    },
    { id:"alertas",       label:"Alertas",       icon:AlertTriangle, badge:alertasCriticas>0?alertasCriticas:undefined, badgeColor:C.red },
    { id:"tablas",        label:"Tablas",        icon:Table2       },
    { id:"queries",       label:"Queries",       icon:Search       },
    { id:"indices",       label:"Índices",       icon:Zap          },
    { id:"conexiones",    label:"Conexiones",    icon:Users        },
    { id:"bloqueos",      label:"Bloqueos",      icon:Lock, badge:bloqueosActivos>0?bloqueosActivos:undefined, badgeColor:C.red },
    { id:"configuracion", label:"Configuración", icon:Settings     },
    { id:"herramientas",  label:"Herramientas",  icon:Wrench       },
    { id:"historial",     label:"Historial",     icon:History      },
  ];

  const renderTab = () => {
    switch (tab) {
      case "resumen":       return resumen ? <TabResumen resumen={resumen} /> : null;
      case "alertas":       return <TabAlertas alertas={alertas} alertasCriticas={alertasCriticas} onVacuum={handleVacuumTabla} vacuumingTabla={vacuumingTabla} />;
      case "tablas":        return <TabTablas tablas={tablas} onVacuum={handleVacuumTabla} onReindex={handleReindex} vacuumingTabla={vacuumingTabla} reindexing={reindexing} />;
      case "queries":       return <TabQueries queries={queries} conexiones={conexiones} />;
      case "indices":       return indices ? <TabIndices indices={indices} onEliminar={handleEliminarIndice} deletingIdx={deletingIdx} /> : null;
      case "conexiones":    return conexiones ? <TabConexiones conexiones={conexiones} onKill={handleKillPid} killingPid={killingPid} /> : null;
      case "bloqueos":      return bloqueos ? <TabBloqueos bloqueos={bloqueos} onKill={handleKillPid} killingPid={killingPid} /> : null;
      case "configuracion": return config ? <TabConfiguracion config={config} /> : null;
      case "herramientas":  return <TabHerramientas herramientas={herramientas} />;
      case "historial":     return <TabHistorial historial={historial} />;
      default:              return null;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.13);border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,0.22)}
        button{outline:none;}
        input{color:#14121E;}
      `}</style>

      <Topbar navigate={navigate} onRefresh={cargar} loading={loading} />
      {vacuumModal && <VacuumModal resultados={vacuumModal.resultados} duracion={vacuumModal.duracion} onClose={()=>setVacuumModal(null)} />}

      <main style={{ flex:1, padding:"28px 30px 40px", overflowY:"auto", backgroundColor:C.bg, fontFamily:FB }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:600, color:C.cream, fontFamily:FB, margin:"0 0 5px", letterSpacing:"-0.01em" }}>
              Monitoreo <span style={{ color:C.creamMut, fontWeight:400, fontStyle:"italic" }}>del sistema</span>
            </h1>
            <p style={{ fontSize:13, color:C.creamMut, margin:0, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ display:"inline-block", width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}80`, animation:"pulse 2s infinite" }} />
              PostgreSQL · Neon · Node.js {resumen?.servidor.node_version ?? ""}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>{ setAutoRefresh(v=>!v); setCountdown(30); }}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:autoRefresh?C.blue:C.creamMut, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}>
              <Activity size={11} strokeWidth={1.8} style={{ animation:autoRefresh?"spin 3s linear infinite":"none" }} />
              {autoRefresh ? `${countdown}s` : "Auto-refresh"}
            </button>
            <button onClick={handleVacuumAll} disabled={vacuumingAll||loading}
              style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 12px", color:vacuumingAll?C.creamMut:C.orange, fontSize:12.5, fontWeight:500, cursor:vacuumingAll?"wait":"pointer", fontFamily:FB, transition:"all .15s" }}>
              {vacuumingAll?<RefreshCw size={11} style={{ animation:"spin 1s linear infinite" }}/>:<PlayCircle size={11} strokeWidth={1.8}/>}
              VACUUM Global
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ marginBottom:24, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:2, marginBottom:-1 }}>
            {TABS.map(t=><TabButton key={t.id} {...t} active={tab===t.id} onClick={()=>setTab(t.id)} />)}
          </div>
        </div>

        {/* Tab content */}
        {renderTab()}

        {loading && (
          <div style={{ position:"fixed", bottom:20, right:20, display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, background:C.bgDeep, border:`1px solid ${C.border}`, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", zIndex:50 }}>
            <RefreshCw size={11} color={C.creamMut} style={{ animation:"spin 1s linear infinite" }} />
            <span style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB }}>Cargando métricas...</span>
          </div>
        )}
      </main>
    </>
  );
}