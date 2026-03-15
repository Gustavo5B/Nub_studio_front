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
  orange:"#FF840E", pink:"#CC59AD", purple:"#8D4CCD",
  blue:"#79AAF5",   gold:"#FFC110", green:"#22C97A",
  cream:"#FFF8EE",  creamSub:"#D8CABC",
  creamMut:"rgba(255,232,200,0.35)",
  bgDeep:"#070510", bg:"#0C0812",
  card:"rgba(18,13,30,0.95)",
  border:"rgba(255,200,150,0.08)",
  borderBr:"rgba(118,78,49,0.20)",
  borderHi:"rgba(255,200,150,0.18)",
  red:"#F04E6B",
};
const FB = "'DM Sans', sans-serif";
const FD = "'Playfair Display', serif";
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
interface ParamPG {
  name:string; setting:string; unit:string; category:string; short_desc:string;
}
interface HistorialEntry {
  id:number; tipo:string; tabla:string|null; alcance:string;
  duracion_ms:number; exitoso:boolean; error_msg:string|null;
  ejecutado_en:string; admin_nombre:string|null;
}
type Tab = "resumen"|"alertas"|"tablas"|"queries"|"indices"|"conexiones"|"bloqueos"|"configuracion"|"herramientas"|"historial";

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({ value, color, size=72 }: { value:number; color:string; size?:number }) {
  const r=size/2-7, circ=2*Math.PI*r, dash=(Math.min(value,100)/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray .6s ease" }} />
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon:Icon, gauge }:{
  label:string; value:string|number; sub?:string; accent:string; icon:React.ElementType; gauge?:number;
}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden", transition:"border-color .2s, transform .2s" }}
      onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}35`; el.style.transform="translateY(-2px)"; }}
      onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},transparent)` }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ flex:1 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`${accent}14`, border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}>
            <Icon size={13} color={accent} strokeWidth={2} />
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1, marginBottom:3 }}>{value}</div>
          <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>{label}</div>
          {sub && <div style={{ fontSize:10, color:accent, fontFamily:FB, marginTop:2, fontWeight:600 }}>{sub}</div>}
        </div>
        {gauge!==undefined && (
          <div style={{ position:"relative", flexShrink:0 }}>
            <Gauge value={gauge} color={accent} />
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:12, fontWeight:800, color:accent, fontFamily:FM }}>{gauge}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alerta badge ──────────────────────────────────────────────────────────────
function AlertaBadge({ alerta, onVacuum, vacuuming }:{ alerta:Alerta; onVacuum?:(t:string)=>void; vacuuming?:boolean }) {
  const map = {
    ok:          { color:C.green, bg:"rgba(34,201,122,0.07)",   bd:"rgba(34,201,122,0.20)",  icon:CheckCircle   },
    info:        { color:C.blue,  bg:"rgba(121,170,245,0.07)",  bd:"rgba(121,170,245,0.20)", icon:Info          },
    advertencia: { color:C.gold,  bg:"rgba(255,193,16,0.07)",   bd:"rgba(255,193,16,0.20)",  icon:AlertTriangle },
    critico:     { color:C.red,   bg:"rgba(240,78,107,0.09)",   bd:"rgba(240,78,107,0.25)",  icon:AlertCircle   },
  };
  const s = map[alerta.nivel];
  const Icon = s.icon;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderRadius:10, background:s.bg, border:`1px solid ${s.bd}`, marginBottom:8 }}>
      <div style={{ width:30, height:30, borderRadius:8, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={14} color={s.color} strokeWidth={2} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FB, marginBottom:2 }}>{alerta.titulo}</div>
        <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB, lineHeight:1.5 }}>{alerta.descripcion}</div>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
        {alerta.tipo==="vacuum" && alerta.tabla && onVacuum && (
          <button onClick={()=>onVacuum(alerta.tabla!)} disabled={vacuuming}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, border:`1px solid ${C.orange}35`, background:`${C.orange}10`, color:vacuuming?C.creamMut:C.orange, fontSize:11, fontWeight:700, cursor:vacuuming?"wait":"pointer", fontFamily:FB }}>
            {vacuuming?<RefreshCw size={10} style={{ animation:"spin 1s linear infinite" }}/>:<PlayCircle size={10}/>}
            VACUUM
          </button>
        )}
        <span style={{ fontSize:9.5, padding:"2px 8px", borderRadius:20, fontWeight:800, background:`${s.color}18`, color:s.color, fontFamily:FB, border:`1px solid ${s.color}22`, textTransform:"uppercase" }}>{alerta.nivel}</span>
      </div>
    </div>
  );
}

// ── Modal VACUUM Global ───────────────────────────────────────────────────────
function VacuumModal({ resultados, duracion, onClose }:{ resultados:VacuumResult[]; duracion:number; onClose:()=>void }) {
  const ok=resultados.filter(r=>r.ok).length, err=resultados.filter(r=>!r.ok).length;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:C.card, border:`1px solid ${C.borderBr}`, borderRadius:16, padding:24, width:520, maxHeight:"80vh", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD }}>VACUUM ANALYZE Global</div>
            <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{ok} OK · {err} errores · {(duracion/1000).toFixed(1)}s</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", color:C.creamMut, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[{ l:"Procesadas", v:resultados.length, c:C.blue },{ l:"Exitosas", v:ok, c:C.green },{ l:"Errores", v:err, c:err>0?C.red:C.creamMut }].map(({ l,v,c })=>(
            <div key={l} style={{ textAlign:"center", padding:"10px", borderRadius:9, background:`${c}0A`, border:`1px solid ${c}20` }}>
              <div style={{ fontSize:22, fontWeight:900, color:c, fontFamily:FD }}>{v}</div>
              <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowY:"auto", maxHeight:280, display:"flex", flexDirection:"column", gap:4 }}>
          {resultados.map((r,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderRadius:7, background:r.ok?"rgba(34,201,122,0.05)":"rgba(240,78,107,0.07)", border:`1px solid ${r.ok?"rgba(34,201,122,0.15)":"rgba(240,78,107,0.20)"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                {r.ok?<CheckCircle size={12} color={C.green}/>:<AlertCircle size={12} color={C.red}/>}
                <span style={{ fontSize:12, color:C.cream, fontFamily:FM }}>{r.tabla}</span>
                {r.error&&<span style={{ fontSize:10.5, color:C.red, fontFamily:FB }}>· {r.error}</span>}
              </div>
              <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FM }}>{r.duracion}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate, onRefresh, loading, onVacuumAll, vacuumingAll }:{
  navigate:(p:string)=>void; onRefresh:()=>void; loading:boolean; onVacuumAll:()=>void; vacuumingAll:boolean;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }} onClick={()=>navigate("/admin")}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub }}>Monitoreo</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:100, background:"rgba(34,201,122,0.06)", border:`1px solid rgba(34,201,122,0.18)` }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 5px ${C.green}` }} />
          <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>PostgreSQL activo</span>
        </div>
        <button onClick={onVacuumAll} disabled={vacuumingAll||loading}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,132,14,0.10)", border:`1px solid rgba(255,132,14,0.30)`, borderRadius:9, padding:"7px 14px", color:vacuumingAll?C.creamMut:C.orange, fontSize:12.5, fontWeight:600, cursor:vacuumingAll?"wait":"pointer", fontFamily:FB }}>
          {vacuumingAll?<RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/>:<PlayCircle size={13} strokeWidth={2}/>}
          VACUUM Global
        </button>
        <button onClick={onRefresh} disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(141,76,205,0.08)", border:`1px solid rgba(141,76,205,0.25)`, borderRadius:9, padding:"7px 14px", color:C.purple, fontSize:12.5, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:FB }}>
          <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
          {loading?"Actualizando...":"Actualizar"}
        </button>
      </div>
    </div>
  );
}

// ── Modal Análisis IA ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminMonitoreo() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [tab,         setTab]         = useState<Tab>("resumen");
  const [loading,     setLoading]     = useState(true);
  const [resumen,     setResumen]     = useState<Resumen|null>(null);
  const [tablas,      setTablas]      = useState<TablaInfo[]>([]);
  const [queries,     setQueries]     = useState<QueryLenta[]>([]);
  const [indices,     setIndices]     = useState<{ usados:Indice[]; sin_uso:Indice[]; posibles_faltantes:TablaInfo[] }|null>(null);
  const [conexiones,  setConexiones]  = useState<{ conexiones:unknown[]; max_conexiones:number; por_estado:unknown[] }|null>(null);
  const [alertas,     setAlertas]     = useState<Alerta[]>([]);
  const [bloqueos,    setBloqueos]    = useState<{ bloqueos_activos:Bloqueo[]; estadisticas_bd:Record<string,unknown>; eventos_espera:unknown[] }|null>(null);
  const [config,      setConfig]      = useState<{ parametros:ParamPG[]; evaluaciones:Record<string,{estado:string;recomendacion:string|null}>; version:string; extensiones:unknown[] }|null>(null);
  const [herramientas,setHerramientas]= useState<Herramienta[]>([]);
  const [historial,   setHistorial]   = useState<HistorialEntry[]>([]);
  const [busqueda,    setBusqueda]    = useState("");
  const [expandedHerr,setExpandedHerr]= useState<string|null>(null);

  const [vacuumingTabla, setVacuumingTabla] = useState<string|null>(null);
  const [vacuumingAll,   setVacuumingAll]   = useState(false);
  const [vacuumModal,    setVacuumModal]    = useState<{ resultados:VacuumResult[]; duracion:number }|null>(null);
  const [reindexing,     setReindexing]     = useState<string|null>(null);
  const [killingPid,     setKillingPid]     = useState<number|null>(null);
  const [deletingIdx,    setDeletingIdx]    = useState<string|null>(null);

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

  const handleVacuumTabla = async (tabla:string) => {
    setVacuumingTabla(tabla);
    try {
      const res  = await fetch(`${API}/api/admin/monitoreo/vacuum/${tabla}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`VACUUM ANALYZE en "${tabla}" completado en ${json.duracion_ms}ms ✓`, "ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en VACUUM","err"); }
    finally { setVacuumingTabla(null); }
  };

  const handleVacuumAll = async () => {
    if (!confirm("¿Ejecutar VACUUM ANALYZE en todas las tablas?\n\nEsto puede tardar varios segundos.")) return;
    setVacuumingAll(true);
    try {
      const res  = await fetch(`${API}/api/admin/monitoreo/vacuum-all`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setVacuumModal({ resultados:json.resultados, duracion:json.duracion_ms });
      showToast(`VACUUM global: ${json.tablas_ok} tablas en ${(json.duracion_ms/1000).toFixed(1)}s ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en VACUUM global","err"); }
    finally { setVacuumingAll(false); }
  };

  const handleReindex = async (tabla:string) => {
    if (!confirm(`¿Reconstruir índices de "${tabla}"?\n\nEsta operación bloquea la tabla temporalmente.`)) return;
    setReindexing(tabla);
    try {
      const res  = await fetch(`${API}/api/admin/monitoreo/reindex/${tabla}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const ahorrado = json.bytes_ahorrados > 0 ? ` · ${fmtB(json.bytes_ahorrados)} liberados` : "";
      showToast(`REINDEX "${tabla}" completado en ${json.duracion_ms}ms${ahorrado} ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error en REINDEX","err"); }
    finally { setReindexing(null); }
  };

  const handleKillPid = async (pid:number) => {
    if (!confirm(`¿Terminar la conexión PID ${pid}?\n\nLa query en ejecución se cancelará.`)) return;
    setKillingPid(pid);
    try {
      const res  = await fetch(`${API}/api/admin/monitoreo/kill-pid/${pid}`, { method:"POST", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Conexión PID ${pid} terminada ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error al terminar conexión","err"); }
    finally { setKillingPid(null); }
  };

  const handleEliminarIndice = async (nombre:string, tabla:string) => {
    if (!confirm(`¿Eliminar el índice "${nombre}" de la tabla "${tabla}"?\n\nEsta acción no se puede deshacer.`)) return;
    setDeletingIdx(nombre);
    try {
      const res  = await fetch(`${API}/api/admin/monitoreo/indice/${nombre}`, { method:"DELETE", headers:authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Índice "${nombre}" eliminado · ${json.tamanio_liberado} liberados ✓`,"ok");
      await cargar();
    } catch (err) { showToast(err instanceof Error ? err.message : "Error al eliminar índice","err"); }
    finally { setDeletingIdx(null); }
  };

  const alertasCriticas = alertas.filter(a=>a.nivel==="critico").length;
  const bloqueosActivos = bloqueos?.bloqueos_activos.length ?? 0;
  const tablasFiltradas = tablas.filter(t=>t.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const TABS:{id:Tab;label:string;icon:React.ElementType;badge?:number;badgeColor?:string}[] = [
    { id:"resumen",       label:"Resumen",       icon:BarChart2    },
    { id:"alertas",       label:"Alertas",       icon:AlertTriangle, badge:alertasCriticas>0?alertasCriticas:undefined, badgeColor:C.red    },
    { id:"tablas",        label:"Tablas",        icon:Table2       },
    { id:"queries",       label:"Queries",       icon:Search       },
    { id:"indices",       label:"Índices",       icon:Zap          },
    { id:"conexiones",    label:"Conexiones",    icon:Users        },
    { id:"bloqueos",      label:"Bloqueos",      icon:Lock, badge:bloqueosActivos>0?bloqueosActivos:undefined, badgeColor:C.red    },
    { id:"configuracion", label:"Configuración", icon:Settings     },
    { id:"herramientas",  label:"Herramientas",  icon:Wrench       },
    { id:"historial",     label:"Historial",     icon:History      },
  ];

  return (
    <>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,200,150,0.15);border-radius:99px}
      `}</style>

      <Topbar navigate={navigate} onRefresh={cargar} loading={loading} onVacuumAll={handleVacuumAll} vacuumingAll={vacuumingAll} />
      {vacuumModal && <VacuumModal resultados={vacuumModal.resultados} duracion={vacuumModal.duracion} onClose={()=>setVacuumModal(null)} />}

      <main style={{ flex:1, padding:"20px 24px 36px", overflowY:"auto", backgroundColor:C.bg, backgroundImage:`radial-gradient(ellipse at 80% 0%,rgba(34,201,122,0.06) 0%,transparent 40%),radial-gradient(ellipse at 5% 90%,rgba(141,76,205,0.06) 0%,transparent 35%)`, fontFamily:FB }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:100, background:"rgba(34,201,122,0.08)", border:`1px solid rgba(34,201,122,0.20)`, fontSize:10.5, color:C.green, marginBottom:10, fontWeight:700, letterSpacing:"0.05em" }}>
            <Activity size={9} color={C.green} /> MONITOREO EN TIEMPO REAL
          </div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.cream, fontFamily:FD, margin:"0 0 3px" }}>
            Rendimiento del <span style={{ color:C.green, fontStyle:"italic" }}>Sistema</span>
          </h1>
          <p style={{ fontSize:12.5, color:C.creamMut, margin:0 }}>
            PostgreSQL · Supabase · Node.js {resumen?.servidor.node_version ?? ""}
          </p>
        </div>

        {/* Tabs — scrollable */}
        <div style={{ display:"flex", gap:3, marginBottom:18, overflowX:"auto", paddingBottom:4 }}>
          {TABS.map(({ id, label, icon:Icon, badge, badgeColor })=>{
            const on=tab===id;
            return (
              <button key={id} onClick={()=>setTab(id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", borderRadius:9, flexShrink:0, position:"relative",
                  border:on?`1px solid ${C.orange}45`:"1px solid rgba(255,200,150,0.08)",
                  background:on?"rgba(255,132,14,0.10)":"rgba(255,232,200,0.02)",
                  color:on?C.orange:C.creamMut, fontSize:12, fontWeight:on?700:400,
                  cursor:"pointer", fontFamily:FB, transition:"all .15s", whiteSpace:"nowrap" }}>
                <Icon size={12} strokeWidth={on?2.2:1.8} />
                {label}
                {badge!==undefined && (
                  <span style={{ fontSize:9, padding:"1px 5px", borderRadius:20, background:badgeColor, color:"white", fontWeight:800, marginLeft:2 }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── RESUMEN ── */}
        {tab==="resumen" && resumen && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
              <KpiCard label="Tamaño BD"        value={resumen.bd.size}       accent={C.blue}   icon={Database} />
              <KpiCard label="Cache Hit Ratio"   value={`${resumen.rendimiento.cache_hit_ratio}%`}
                accent={resumen.rendimiento.cache_hit_ratio>=99?C.green:resumen.rendimiento.cache_hit_ratio>=95?C.gold:C.red}
                icon={TrendingUp} gauge={resumen.rendimiento.cache_hit_ratio} />
              <KpiCard label="Memoria servidor"  value={`${resumen.servidor.mem_usada_mb} MB`}
                accent={resumen.servidor.mem_pct>85?C.red:resumen.servidor.mem_pct>70?C.gold:C.green}
                icon={Cpu} gauge={resumen.servidor.mem_pct} sub={`de ${resumen.servidor.mem_total_mb} MB`} />
              <KpiCard label="Uptime servidor"   value={resumen.servidor.uptime} accent={C.purple} icon={Clock} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              <KpiCard label="Total tablas"       value={resumen.bd.tablas}     accent={C.orange} icon={Table2}    />
              <KpiCard label="Total filas"         value={fmt(resumen.bd.filas)} accent={C.blue}   icon={HardDrive} />
              <KpiCard label="Conexiones activas"  value={resumen.rendimiento.conexiones_activas}
                accent={resumen.rendimiento.conexiones_activas>20?C.gold:C.green}
                icon={Users} sub={`${resumen.rendimiento.conexiones_total} total`} />
              <KpiCard label="Índices sin uso"     value={resumen.indices.sin_uso}
                accent={resumen.indices.sin_uso>5?C.gold:C.green} icon={Zap} />
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, padding:"16px 20px" }}>
              <div style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:12 }}>Estadísticas de transacciones</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"Total transacciones",  value:fmt(resumen.rendimiento.tx_total),    color:C.blue  },
                  { label:"Commits exitosos",      value:fmt(resumen.rendimiento.tx_commits),  color:C.green },
                  { label:"Rollbacks",             value:fmt(resumen.rendimiento.tx_rollbacks),color:resumen.rendimiento.tx_rollbacks>100?C.red:C.gold },
                ].map(({ label,value,color })=>(
                  <div key={label} style={{ padding:"13px 16px", borderRadius:10, background:`${color}08`, border:`1px solid ${color}22`, textAlign:"center", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />
                    <div style={{ fontSize:22, fontWeight:900, color, fontFamily:FD }}>{value}</div>
                    <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB, marginTop:4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ALERTAS ── */}
        {tab==="alertas" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {alertasCriticas>0 && (
              <div style={{ padding:"10px 16px", borderRadius:10, background:"rgba(240,78,107,0.08)", border:`1px solid rgba(240,78,107,0.25)`, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
                <AlertCircle size={14} color={C.red} />
                <span style={{ fontSize:13, color:C.red, fontWeight:700, fontFamily:FB }}>{alertasCriticas} problema(s) crítico(s) — requieren atención inmediata</span>
              </div>
            )}
            {alertas.map((a,i)=><AlertaBadge key={i} alerta={a} onVacuum={a.tipo==="vacuum"?handleVacuumTabla:undefined} vacuuming={vacuumingTabla===a.tabla} />)}
          </div>
        )}

        {/* ── TABLAS ── */}
        {tab==="tablas" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 12px" }}>
                <Search size={12} color={C.creamMut} />
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar tabla..."
                  style={{ background:"transparent", border:"none", outline:"none", color:C.cream, fontSize:12.5, fontFamily:FM, flex:1 }} />
              </div>
              <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{tablasFiltradas.length} tablas</span>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"rgba(7,5,16,0.98)" }}>
                      {["Tabla","Filas vivas","Filas muertas","Tamaño","Índices","Seq/Idx scans","Ins/Upd/Del","Análisis","VACUUM","REINDEX"].map((h,i)=>(
                        <th key={i} style={{ padding:"9px 12px", textAlign:"left", fontSize:10, fontWeight:800, color:C.orange, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tablasFiltradas.map((t,i)=>{
                      const pctM=t.filas_vivas>0?Math.round((t.filas_muertas/(t.filas_vivas+t.filas_muertas))*100):0;
                      const needsV=pctM>5||t.filas_muertas>500;
                      const isV=vacuumingTabla===t.nombre;
                      const isR=reindexing===t.nombre;
                      const lastA=t.last_analyze?new Date(t.last_analyze).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}):"Nunca";
                      return (
                        <tr key={t.nombre} style={{ borderBottom:`1px solid rgba(255,200,150,0.04)`, background:i%2===0?"rgba(255,232,200,0.01)":"transparent" }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,132,14,0.04)"}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=i%2===0?"rgba(255,232,200,0.01)":"transparent"}>
                          <td style={{ padding:"8px 12px" }}><span style={{ fontSize:12, fontWeight:700, color:C.cream, fontFamily:FM }}>{t.nombre}</span></td>
                          <td style={{ padding:"8px 12px", fontSize:11.5, color:C.green, fontFamily:FM, fontWeight:600 }}>{fmt(t.filas_vivas)}</td>
                          <td style={{ padding:"8px 12px" }}>
                            <span style={{ fontSize:11.5, color:pctM>15?C.red:pctM>5?C.gold:C.creamMut, fontFamily:FM }}>
                              {fmt(t.filas_muertas)}{pctM>5&&<span style={{ fontSize:9.5 }}> ({pctM}%)</span>}
                            </span>
                          </td>
                          <td style={{ padding:"8px 12px", fontSize:11.5, color:C.blue, fontFamily:FM }}>{t.size_total}</td>
                          <td style={{ padding:"8px 12px", fontSize:11.5, color:C.purple, fontFamily:FM }}>{t.size_indices}</td>
                          <td style={{ padding:"8px 12px", fontSize:11, color:C.creamMut, fontFamily:FM }}>
                            <span style={{ color:t.scans_secuenciales>1000?C.gold:C.creamMut }}>{fmt(t.scans_secuenciales)}</span>
                            <span style={{ color:C.creamMut }}>/</span>
                            <span style={{ color:C.green }}>{fmt(t.scans_por_indice)}</span>
                          </td>
                          <td style={{ padding:"8px 12px", fontSize:11, fontFamily:FM }}>
                            <span style={{ color:C.green }}>{fmt(t.inserciones)}</span>/<span style={{ color:C.gold }}>{fmt(t.actualizaciones)}</span>/<span style={{ color:C.red }}>{fmt(t.eliminaciones)}</span>
                          </td>
                          <td style={{ padding:"8px 12px", fontSize:11, color:lastA==="Nunca"?C.red:C.creamMut, fontFamily:FM }}>{lastA}</td>
                          <td style={{ padding:"8px 12px" }}>
                            <button onClick={()=>handleVacuumTabla(t.nombre)} disabled={isV||!!vacuumingTabla}
                              style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6,
                                border:`1px solid ${needsV?C.orange+"45":C.border}`, background:needsV?`${C.orange}10`:"rgba(255,232,200,0.03)",
                                color:isV?C.creamMut:needsV?C.orange:C.creamMut, fontSize:10.5, fontWeight:600,
                                cursor:(isV||!!vacuumingTabla)?"wait":"pointer", fontFamily:FB, whiteSpace:"nowrap" }}>
                              {isV?<RefreshCw size={9} style={{ animation:"spin 1s linear infinite" }}/>:<PlayCircle size={9}/>}
                              {isV?"...":"VACUUM"}
                            </button>
                          </td>
                          <td style={{ padding:"8px 12px" }}>
                            <button onClick={()=>handleReindex(t.nombre)} disabled={isR||!!reindexing}
                              style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6,
                                border:`1px solid rgba(141,76,205,0.35)`, background:"rgba(141,76,205,0.08)",
                                color:isR?C.creamMut:C.purple, fontSize:10.5, fontWeight:600,
                                cursor:(isR||!!reindexing)?"wait":"pointer", fontFamily:FB, whiteSpace:"nowrap" }}>
                              {isR?<RefreshCw size={9} style={{ animation:"spin 1s linear infinite" }}/>:<Zap size={9}/>}
                              {isR?"...":"REINDEX"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:8, padding:"8px 12px", borderRadius:9, background:"rgba(255,232,200,0.02)", border:`1px solid ${C.border}` }}>
              <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.orange }}>●</span> Naranja = tabla necesita VACUUM (filas muertas {'>'} 5%)</span>
              <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.red }}>Nunca</span> = sin estadísticas — ANALYZE mejora el planificador</span>
              <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}><span style={{ color:C.purple }}>REINDEX</span> = reconstruye índices inflados o corruptos</span>
            </div>
          </div>
        )}

        {/* ── QUERIES ── */}
        {tab==="queries" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
                <Search size={13} color={C.orange} />
                <span style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD }}>Queries más lentas</span>
                <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>Top 10 por tiempo promedio</span>
              </div>
              <div style={{ padding:"8px 10px" }}>
                {queries.length===0
                 ? <div style={{ padding:"28px", textAlign:"center", color:C.creamMut, fontSize:13, fontFamily:FB }}>No hay queries activas en este momento — los datos aparecen cuando hay tráfico en la BD</div>
                  : queries.map((q,i)=>(
                    <div key={i} style={{ padding:"11px 13px", borderRadius:9, marginBottom:6, background:"rgba(255,232,200,0.02)", border:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:20, height:20, borderRadius:5, background:`${C.orange}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.orange }}>{i+1}</span>
                          {q.calls!==undefined&&<span style={{ fontSize:10.5, padding:"2px 7px", borderRadius:20, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.22)", color:C.blue, fontFamily:FM }}>{fmt(q.calls)} llamadas</span>}
                          {q.state&&<span style={{ fontSize:10.5, padding:"2px 7px", borderRadius:20, background:"rgba(34,201,122,0.10)", color:C.green, fontFamily:FB }}>{q.state}</span>}
                        </div>
                        <div style={{ display:"flex", gap:10 }}>
                          {q.tiempo_promedio_ms!==undefined&&<span style={{ fontSize:12, color:q.tiempo_promedio_ms>1000?C.red:q.tiempo_promedio_ms>100?C.gold:C.green, fontFamily:FM, fontWeight:700 }}>ø {q.tiempo_promedio_ms}ms</span>}
                          {q.duracion_seg!==undefined&&<span style={{ fontSize:12, color:q.duracion_seg>30?C.red:C.gold, fontFamily:FM, fontWeight:700 }}>{q.duracion_seg}s activa</span>}
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:C.creamSub, fontFamily:FM, background:"rgba(0,0,0,0.2)", padding:"7px 10px", borderRadius:6, lineHeight:1.5, wordBreak:"break-all" }}>{q.query}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ÍNDICES ── */}
        {tab==="indices" && indices && (
          <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
            {indices.sin_uso.length>0&&(
              <div style={{ background:C.card, border:`1px solid rgba(255,193,16,0.22)`, borderRadius:13, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(255,193,16,0.05)" }}>
                  <AlertTriangle size={13} color={C.gold} />
                  <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Índices sin uso</span>
                  <span style={{ fontSize:10.5, padding:"1px 7px", borderRadius:20, background:"rgba(255,193,16,0.12)", border:"1px solid rgba(255,193,16,0.25)", color:C.gold, fontWeight:700 }}>{indices.sin_uso.length}</span>
                  <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>Candidatos a eliminar — liberan espacio sin afectar rendimiento</span>
                </div>
                <div style={{ padding:"8px 10px" }}>
                  {indices.sin_uso.map((idx,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:7, marginBottom:4, background:"rgba(255,193,16,0.04)", border:`1px solid rgba(255,193,16,0.12)` }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:700, color:C.cream, fontFamily:FM }}>{idx.indice}</div>
                        <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>tabla: {idx.tabla}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12, color:C.gold, fontFamily:FM, fontWeight:600 }}>{idx.tamanio}</span>
                        <button onClick={()=>handleEliminarIndice(idx.indice, idx.tabla)} disabled={deletingIdx===idx.indice}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, border:`1px solid rgba(240,78,107,0.35)`, background:"rgba(240,78,107,0.08)", color:deletingIdx===idx.indice?C.creamMut:C.red, fontSize:11, fontWeight:700, cursor:deletingIdx===idx.indice?"wait":"pointer", fontFamily:FB }}>
                          {deletingIdx===idx.indice?<RefreshCw size={10} style={{ animation:"spin 1s linear infinite" }}/>:<Trash2 size={10}/>}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
                <Zap size={13} color={C.green} />
                <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Índices más utilizados</span>
              </div>
              <div style={{ padding:"8px 10px" }}>
                {indices.usados.map((idx,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 80px", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:7, marginBottom:3, background:i%2===0?"rgba(255,232,200,0.01)":"transparent" }}>
                    <div><div style={{ fontSize:12, fontWeight:700, color:C.cream, fontFamily:FM }}>{idx.indice}</div><div style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>{idx.tabla}</div></div>
                    <div style={{ textAlign:"right" }}><div style={{ fontSize:11.5, color:C.green, fontFamily:FM, fontWeight:700 }}>{fmt(idx.usos??0)}</div><div style={{ fontSize:9, color:C.creamMut }}>usos</div></div>
                    <div style={{ textAlign:"right", fontSize:11.5, color:C.blue, fontFamily:FM }}>{idx.tamanio}</div>
                    <div><div style={{ height:4, background:`${C.green}18`, borderRadius:99, overflow:"hidden" }}><div style={{ height:"100%", width:`${Math.min((idx.usos??0)/((indices.usados[0]?.usos??1))*100,100)}%`, background:C.green, borderRadius:99 }}/></div></div>
                  </div>
                ))}
              </div>
            </div>
            {indices.posibles_faltantes.length>0&&(
              <div style={{ background:C.card, border:`1px solid rgba(240,78,107,0.22)`, borderRadius:13, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(240,78,107,0.05)" }}>
                  <AlertCircle size={13} color={C.red} />
                  <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Posibles índices faltantes</span>
                  <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>Tablas con scans secuenciales altos</span>
                </div>
                <div style={{ padding:"8px 10px" }}>
                  {indices.posibles_faltantes.map((t:TablaInfo,i)=>(
                    <div key={i} style={{ padding:"8px 12px", borderRadius:7, marginBottom:4, background:"rgba(240,78,107,0.04)", border:`1px solid rgba(240,78,107,0.12)` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.cream, fontFamily:FM }}>{t.nombre}</span>
                        <div style={{ display:"flex", gap:12 }}>
                          <span style={{ fontSize:11, color:C.red, fontFamily:FM }}>Seq: {fmt(t.scans_secuenciales)}</span>
                          <span style={{ fontSize:11, color:C.green, fontFamily:FM }}>Idx: {fmt(t.scans_por_indice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONEXIONES ── */}
        {tab==="conexiones" && conexiones && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
              {(conexiones.por_estado as { state:string; total:number }[]).map(({ state, total })=>{
                const color=state==="active"?C.green:state==="idle"?C.blue:C.gold;
                return (
                  <div key={state} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:"13px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />
                    <div style={{ fontSize:24, fontWeight:900, color, fontFamily:FD }}>{total}</div>
                    <div style={{ fontSize:11, color:C.creamMut, fontFamily:FM, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{state||"sin estado"}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Users size={13} color={C.blue} />
                  <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Conexiones activas</span>
                </div>
                <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>Máximo: {conexiones.max_conexiones}</span>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"rgba(7,5,16,0.98)" }}>
                    {["PID","Usuario","App","Estado","Duración","Query"].map((h,i)=>(
                      <th key={i} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:800, color:C.orange, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(conexiones.conexiones as { pid:number; usuario:string; aplicacion:string; state:string; query:string; duracion_seg:number }[]).map((c,i)=>(
                      <tr key={c.pid} style={{ borderBottom:`1px solid rgba(255,200,150,0.04)`, background:i%2===0?"rgba(255,232,200,0.01)":"transparent" }}>
                        <td style={{ padding:"7px 12px", fontSize:11.5, color:C.creamMut, fontFamily:FM }}>{c.pid}</td>
                        <td style={{ padding:"7px 12px", fontSize:11.5, color:C.cream, fontFamily:FM, fontWeight:600 }}>{c.usuario}</td>
                        <td style={{ padding:"7px 12px", fontSize:11, color:C.creamMut, fontFamily:FB }}>{c.aplicacion||"—"}</td>
                        <td style={{ padding:"7px 12px" }}>
                          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700, fontFamily:FM, background:c.state==="active"?"rgba(34,201,122,0.12)":"rgba(121,170,245,0.10)", color:c.state==="active"?C.green:C.blue }}>{c.state}</span>
                        </td>
                        <td style={{ padding:"7px 12px", fontSize:11.5, color:c.duracion_seg>30?C.red:C.creamMut, fontFamily:FM }}>{c.duracion_seg!=null?`${c.duracion_seg}s`:"—"}</td>
                        <td style={{ padding:"7px 12px", fontSize:10.5, color:C.creamSub, fontFamily:FM, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.query||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── BLOQUEOS ── */}
        {tab==="bloqueos" && bloqueos && (
          <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
            {/* Banner estado */}
            <div style={{ padding:"12px 16px", borderRadius:11, display:"flex", alignItems:"center", gap:12,
              background:bloqueosActivos>0?"rgba(240,78,107,0.08)":"rgba(34,201,122,0.07)",
              border:`1px solid ${bloqueosActivos>0?"rgba(240,78,107,0.25)":"rgba(34,201,122,0.20)"}` }}>
              <Lock size={16} color={bloqueosActivos>0?C.red:C.green} />
              <div>
                <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FB }}>
                  {bloqueosActivos>0 ? `${bloqueosActivos} proceso(s) bloqueado(s) en este momento` : "Sin bloqueos activos — sistema fluido"}
                </div>
                <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>
                  Deadlocks históricos: {String(bloqueos.estadisticas_bd.deadlocks ?? 0)} · Conflictos: {String(bloqueos.estadisticas_bd.conflicts ?? 0)}
                </div>
              </div>
            </div>

            {/* Bloqueos activos */}
            {bloqueosActivos>0 && (
              <div style={{ background:C.card, border:`1px solid rgba(240,78,107,0.22)`, borderRadius:13, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8, background:"rgba(240,78,107,0.06)" }}>
                  <AlertCircle size={13} color={C.red} />
                  <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Bloqueos activos</span>
                </div>
                <div style={{ padding:"10px" }}>
                  {bloqueos.bloqueos_activos.map((b,i)=>(
                    <div key={i} style={{ padding:"12px 14px", borderRadius:9, marginBottom:6, background:"rgba(240,78,107,0.05)", border:`1px solid rgba(240,78,107,0.15)` }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Proceso bloqueado (PID {b.pid_bloqueado})</div>
                          <div style={{ fontSize:12, color:C.cream, fontFamily:FM, fontWeight:600 }}>{b.usuario}</div>
                          <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FM, marginTop:3, wordBreak:"break-all" }}>{b.query_bloqueada}</div>
                          <div style={{ fontSize:11, color:C.red, marginTop:4 }}>⏳ Esperando {b.espera_seg}s · {b.wait_event_type}: {b.wait_event}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Proceso bloqueante (PID {b.pid_bloqueante})</div>
                          <div style={{ fontSize:12, color:C.cream, fontFamily:FM, fontWeight:600 }}>{b.usuario_bloqueante}</div>
                          <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FM, marginTop:3, wordBreak:"break-all" }}>{b.query_bloqueante}</div>
                        </div>
                      </div>
                      {/* Botones de acción */}
                      <div style={{ display:"flex", gap:8, marginTop:10, paddingTop:10, borderTop:`1px solid rgba(240,78,107,0.15)` }}>
                        <button onClick={()=>handleKillPid(b.pid_bloqueante)} disabled={killingPid===b.pid_bloqueante}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid rgba(240,78,107,0.40)`, background:"rgba(240,78,107,0.12)", color:killingPid===b.pid_bloqueante?C.creamMut:C.red, fontSize:12, fontWeight:700, cursor:killingPid===b.pid_bloqueante?"wait":"pointer", fontFamily:FB }}>
                          {killingPid===b.pid_bloqueante?<RefreshCw size={11} style={{ animation:"spin 1s linear infinite" }}/>:<XCircle size={11}/>}
                          Kill bloqueante (PID {b.pid_bloqueante})
                        </button>
                        <button onClick={()=>handleKillPid(b.pid_bloqueado)} disabled={killingPid===b.pid_bloqueado}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid rgba(255,200,150,0.20)`, background:"rgba(255,200,150,0.05)", color:C.creamMut, fontSize:12, fontWeight:600, cursor:killingPid===b.pid_bloqueado?"wait":"pointer", fontFamily:FB }}>
                          Kill bloqueado (PID {b.pid_bloqueado})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eventos de espera */}
            {(bloqueos.eventos_espera as { wait_event_type:string; wait_event:string; total:number }[]).length>0&&(
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
                  <Clock size={13} color={C.gold} />
                  <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Eventos de espera activos</span>
                </div>
                <div style={{ padding:"8px 10px" }}>
                  {(bloqueos.eventos_espera as { wait_event_type:string; wait_event:string; total:number }[]).map((e,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:7, marginBottom:3, background:"rgba(255,193,16,0.04)", border:`1px solid rgba(255,193,16,0.12)` }}>
                      <div>
                        <span style={{ fontSize:12, color:C.gold, fontFamily:FM, fontWeight:700 }}>{e.wait_event}</span>
                        <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginLeft:8 }}>{e.wait_event_type}</span>
                      </div>
                      <span style={{ fontSize:12, color:C.cream, fontFamily:FM, fontWeight:700 }}>{e.total} procesos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {tab==="configuracion" && config && (
          <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:12 }}>
            {/* Versión y extensiones */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, padding:"14px 18px" }}>
              <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginBottom:6 }}>Versión del motor</div>
              <div style={{ fontSize:13, color:C.green, fontFamily:FM, fontWeight:600 }}>{config.version}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
                {(config.extensiones as { name:string; installed_version:string }[]).map(e=>(
                  <span key={e.name} style={{ fontSize:10.5, padding:"2px 8px", borderRadius:20, background:"rgba(34,201,122,0.10)", border:"1px solid rgba(34,201,122,0.22)", color:C.green, fontFamily:FM }}>
                    {e.name} {e.installed_version}
                  </span>
                ))}
              </div>
            </div>

            {/* Parámetros */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
                <Settings size={13} color={C.orange} />
                <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Parámetros clave de PostgreSQL</span>
              </div>
              <div style={{ padding:"8px 10px" }}>
                {config.parametros.map((p,i)=>{
                  const ev=config.evaluaciones[p.name];
                  const color=ev?.estado==="critico"?C.red:ev?.estado==="advertencia"?C.gold:ev?.estado==="info"?C.blue:C.green;
                  return (
                    <div key={p.name} style={{ padding:"10px 14px", borderRadius:9, marginBottom:4, background:i%2===0?"rgba(255,232,200,0.01)":"transparent", border:`1px solid ${ev?.estado!=="ok"&&ev?.estado?`${color}20`:C.border}` }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:C.cream, fontFamily:FM }}>{p.name}</span>
                            <span style={{ fontSize:9.5, padding:"1px 6px", borderRadius:20, background:`${color}18`, color, fontWeight:700, border:`1px solid ${color}25` }}>{ev?.estado??'ok'}</span>
                          </div>
                          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, lineHeight:1.5 }}>{p.short_desc}</div>
                          {ev?.recomendacion&&<div style={{ fontSize:11.5, color, fontFamily:FB, marginTop:4, fontStyle:"italic" }}>💡 {ev.recomendacion}</div>}
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FM }}>{p.setting}<span style={{ fontSize:10, color:C.creamMut, fontWeight:400 }}> {p.unit}</span></div>
                          <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{p.category}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── HERRAMIENTAS ── */}
        {tab==="herramientas" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {/* Banner educativo */}
            <div style={{ padding:"14px 18px", borderRadius:12, background:"rgba(121,170,245,0.07)", border:`1px solid rgba(121,170,245,0.20)`, marginBottom:16, display:"flex", alignItems:"flex-start", gap:12 }}>
              <BookOpen size={18} color={C.blue} style={{ flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:4 }}>Herramientas de Monitoreo del SGBD</div>
                <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, lineHeight:1.6 }}>
                  PostgreSQL incluye un conjunto de <strong style={{ color:C.blue }}>vistas del sistema, extensiones y comandos</strong> que permiten supervisar el rendimiento en tiempo real. Cada herramienta expone métricas específicas que el administrador usa para detectar cuellos de botella, optimizar queries e identificar problemas antes de que afecten a los usuarios.
                </div>
              </div>
            </div>

            {/* Categorías */}
            {Object.entries(
              herramientas.reduce((acc, h) => {
                if (!acc[h.categoria]) acc[h.categoria] = [];
                acc[h.categoria].push(h);
                return acc;
              }, {} as Record<string, Herramienta[]>)
            ).map(([categoria, items])=>(
              <div key={categoria} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.creamMut, letterSpacing:"0.10em", textTransform:"uppercase", fontFamily:FB, marginBottom:8, paddingLeft:4 }}>{categoria}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {items.map(h=>{
                    const exp=expandedHerr===h.nombre;
                    return (
                      <div key={h.nombre} style={{ background:C.card, border:`1px solid ${h.disponible?C.border:"rgba(240,78,107,0.15)"}`, borderRadius:12, overflow:"hidden", transition:"border-color .2s" }}>
                        {/* Header clickeable */}
                        <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:h.disponible?"transparent":"rgba(240,78,107,0.04)" }}
                          onClick={()=>setExpandedHerr(exp?null:h.nombre)}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:9, background:h.disponible?"rgba(34,201,122,0.10)":"rgba(240,78,107,0.10)", border:`1px solid ${h.disponible?"rgba(34,201,122,0.22)":"rgba(240,78,107,0.22)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              {h.tipo==="extensión"?<Zap size={14} color={h.disponible?C.green:C.red}/>:
                               h.tipo==="comando SQL"?<Code2 size={14} color={h.disponible?C.green:C.red}/>:
                               <Database size={14} color={h.disponible?C.green:C.red}/>}
                            </div>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FM }}>{h.nombre}</span>
                                <span style={{ fontSize:9.5, padding:"1px 7px", borderRadius:20, fontFamily:FB, fontWeight:700,
                                  background:h.disponible?"rgba(34,201,122,0.12)":"rgba(240,78,107,0.12)",
                                  color:h.disponible?C.green:C.red,
                                  border:`1px solid ${h.disponible?"rgba(34,201,122,0.25)":"rgba(240,78,107,0.25)"}` }}>
                                  {h.disponible?"✓ Disponible":"✗ No disponible"}
                                </span>
                                <span style={{ fontSize:9.5, padding:"1px 7px", borderRadius:20, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.22)", color:C.blue, fontFamily:FB }}>{h.tipo}</span>
                              </div>
                              <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{h.descripcion.substring(0,90)}...</div>
                            </div>
                          </div>
                          {exp?<ChevronUp size={14} color={C.creamMut}/>:<ChevronDown size={14} color={C.creamMut}/>}
                        </div>

                        {/* Detalle expandido */}
                        {exp&&(
                          <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${C.borderBr}` }}>
                            <div style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:12 }}>
                              <div style={{ fontSize:13, color:C.creamSub, fontFamily:FB, lineHeight:1.7 }}>{h.descripcion}</div>

                              {/* Métricas */}
                              <div>
                                <div style={{ fontSize:10, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.10em", fontFamily:FB, marginBottom:6 }}>Métricas que expone</div>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                  {h.metricas.map((m,i)=>(
                                    <span key={i} style={{ fontSize:11.5, padding:"3px 10px", borderRadius:20, background:"rgba(255,200,150,0.05)", border:`1px solid ${C.border}`, color:C.creamSub, fontFamily:FB }}>
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Dónde se usa */}
                              <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.18)` }}>
                                <span style={{ fontSize:11, fontWeight:700, color:C.orange, fontFamily:FB }}>📍 En este panel: </span>
                                <span style={{ fontSize:11.5, color:C.creamSub, fontFamily:FB }}>{h.uso_en_panel}</span>
                              </div>

                              {/* SQL ejemplo */}
                              <div>
                                <div style={{ fontSize:10, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.10em", fontFamily:FB, marginBottom:6 }}>Query de ejemplo</div>
                                <div style={{ background:"rgba(0,0,0,0.3)", border:`1px solid ${C.borderBr}`, borderRadius:9, padding:"10px 14px", fontFamily:FM, fontSize:12, color:C.cream, lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
                                  {h.sql_ejemplo}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab==="historial" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", gap:8 }}>
                <History size={13} color={C.purple} />
                <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Historial de mantenimiento</span>
                <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>Últimas 100 operaciones</span>
              </div>
              {historial.length===0
                ? <div style={{ padding:"32px", textAlign:"center", color:C.creamMut, fontSize:13, fontFamily:FB }}>Sin operaciones registradas aún. Ejecuta un VACUUM o REINDEX para comenzar.</div>
                : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr style={{ background:"rgba(7,5,16,0.98)" }}>
                        {["Tipo","Tabla","Alcance","Duración","Estado","Admin","Fecha"].map((h,i)=>(
                          <th key={i} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:800, color:C.orange, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {historial.map((h,i)=>(
                          <tr key={h.id} style={{ borderBottom:`1px solid rgba(255,200,150,0.04)`, background:i%2===0?"rgba(255,232,200,0.01)":"transparent" }}>
                            <td style={{ padding:"8px 12px" }}>
                              <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, fontWeight:700, fontFamily:FM,
                                background:h.tipo==="vacuum"?`${C.green}14`:`${C.purple}14`,
                                color:h.tipo==="vacuum"?C.green:C.purple,
                                border:`1px solid ${h.tipo==="vacuum"?`${C.green}25`:`${C.purple}25`}`,
                                textTransform:"uppercase" }}>
                                {h.tipo}
                              </span>
                            </td>
                            <td style={{ padding:"8px 12px", fontSize:12, color:C.cream, fontFamily:FM }}>{h.tabla ?? <span style={{ color:C.creamMut }}>todas</span>}</td>
                            <td style={{ padding:"8px 12px", fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{h.alcance}</td>
                            <td style={{ padding:"8px 12px", fontSize:11.5, color:C.blue, fontFamily:FM }}>{h.duracion_ms}ms</td>
                            <td style={{ padding:"8px 12px" }}>
                              {h.exitoso
                                ?<span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.green }}><CheckCircle size={11}/>OK</span>
                                :<span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.red }}><AlertCircle size={11}/>{h.error_msg?.substring(0,40)}</span>}
                            </td>
                            <td style={{ padding:"8px 12px", fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{h.admin_nombre??"—"}</td>
                            <td style={{ padding:"8px 12px", fontSize:11, color:C.creamMut, fontFamily:FM }}>
                              {new Date(h.ejecutado_en).toLocaleString("es-MX",{ day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ position:"fixed", bottom:20, right:20, display:"flex", alignItems:"center", gap:7, padding:"9px 14px", borderRadius:9, background:C.card, border:`1px solid rgba(255,132,14,0.25)`, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
            <RefreshCw size={12} color={C.orange} style={{ animation:"spin 1s linear infinite" }} />
            <span style={{ fontSize:12, color:C.orange, fontFamily:FB, fontWeight:600 }}>Cargando métricas...</span>
          </div>
        )}
      </main>
    </>
  );
}