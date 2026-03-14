// src/pages/private/admin/AdminDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  Eye, Bell, Search,
  CheckCircle, Clock, XCircle, TrendingUp,
  TrendingDown, Package, ChevronRight,
  Image, RefreshCw, ArrowUpRight,
  BarChart, LineChart, AreaChart as AreaIcon,
  Layers, Star, Database, Users,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart as RBarChart, Bar,
  LineChart as RLineChart, Line,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.35)",
  bgDeep:   "#070510",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const statusCfg: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green    },
  pendiente: { label: "Pendiente", color: C.gold     },
  rechazada: { label: "Rechazada", color: C.pink     },
  agotada:   { label: "Agotada",   color: C.creamMut },
};

interface ObraReciente {
  id_obra: number; titulo: string; estado: string;
  imagen_principal?: string; artista_alias?: string; artista_nombre?: string;
}
interface StatsData {
  kpis: Record<string, number>;
  obras_recientes: ObraReciente[];
  strip: Record<string, number>;
}
interface TooltipProps {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(10,7,20,0.98)", border:`1px solid ${C.borderBr}`, borderRadius:10, padding:"10px 14px", fontFamily:FB, boxShadow:"0 8px 28px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12.5, fontWeight:600, color:C.creamSub, marginBottom:3 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, display:"inline-block", flexShrink:0 }} />
          <span style={{ color:C.creamMut }}>{p.name}:</span>
          <strong style={{ color:C.cream }}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate, onRefresh, loading, onBackup, backupLoading }: {
  navigate:(p:string) => void; onRefresh:() => void; loading:boolean;
  onBackup:() => void; backupLoading:boolean;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub }}>Dashboard</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,232,200,0.03)", border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 16px", width:240, cursor:"text", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Search size={14} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ fontSize:13, color:C.creamMut, userSelect:"none" }}>Buscar obras, artistas...</span>
        </div>
        <button onClick={onRefresh} style={{ width:34, height:34, borderRadius:9, background:"transparent", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}45`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button style={{ position:"relative", width:34, height:34, borderRadius:9, background:"transparent", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Bell size={13} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ position:"absolute", top:8, right:8, width:5, height:5, background:C.orange, borderRadius:"50%", border:`1.5px solid ${C.bgDeep}` }} />
        </button>
        <button onClick={onBackup} disabled={backupLoading}
          style={{ display:"flex", alignItems:"center", gap:6, background: backupLoading ? "rgba(141,76,205,0.06)" : "rgba(141,76,205,0.12)", border:`1px solid rgba(141,76,205,${backupLoading ? "0.20" : "0.35"})`, color: backupLoading ? C.creamMut : C.cream, padding:"7px 14px", borderRadius:9, fontWeight:600, fontSize:13, cursor: backupLoading ? "wait" : "pointer", fontFamily:FB, transition:"all .15s", opacity: backupLoading ? 0.7 : 1 }}
          onMouseEnter={e => { if (backupLoading) return; const el=e.currentTarget as HTMLElement; el.style.background="rgba(141,76,205,0.22)"; el.style.borderColor="rgba(141,76,205,0.60)"; el.style.color="white"; }}
          onMouseLeave={e => { if (backupLoading) return; const el=e.currentTarget as HTMLElement; el.style.background="rgba(141,76,205,0.12)"; el.style.borderColor="rgba(141,76,205,0.35)"; el.style.color=C.cream; }}>
          <Database size={14} strokeWidth={1.8} color={backupLoading ? C.creamMut : C.purple} style={{ animation: backupLoading ? "spin 1s linear infinite" : "none" }} />
          {backupLoading ? "Generando..." : "Respaldo"}
        </button>
        <button onClick={() => navigate("/admin/obras?estado=pendiente")}
          style={{ display:"flex", alignItems:"center", gap:6, background:`linear-gradient(135deg, ${C.orange}, ${C.magenta})`, border:"none", color:"white", padding:"7px 15px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 4px 14px ${C.orange}30`, transition:"transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 22px ${C.orange}45`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 4px 14px ${C.orange}30`; }}>
          <Clock size={14} strokeWidth={2.5} /> Revisar pendientes
        </button>
      </div>
    </div>
  );
}

// ── WelcomeBanner ─────────────────────────────────────────────────────────────
function WelcomeBanner({ userName }: { userName:string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const now  = new Date();
  const days   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  return (
    <div style={{ borderRadius:14, padding:"22px 26px", background:`linear-gradient(135deg, rgba(255,132,14,0.08), rgba(141,76,205,0.05))`, border:`1px solid rgba(255,132,14,0.14)`, marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-50, right:-40, width:180, height:180, borderRadius:"50%", background:`radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"relative" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:"rgba(255,248,238,0.05)", border:`1px solid ${C.borderBr}`, fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:10 }}>
          <Star size={9} color={C.gold} fill={C.gold} /> {dateStr}
        </div>
        <h1 style={{ fontSize:22, fontWeight:900, margin:"0 0 4px", fontFamily:FD, color:C.cream }}>
          {greeting},{" "}
          <span style={{ background:`linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{userName}</span>
        </h1>
        <p style={{ fontSize:13, color:C.creamMut, margin:0, fontFamily:FB }}>Tu plataforma está activa y funcionando correctamente.</p>
      </div>
      <div style={{ display:"flex", gap:7, position:"relative" }}>
        {[
          { label:"Sistema", value:"Activo",  color:C.green },
          { label:"API",     value:"Estable", color:C.blue  },
          { label:"Backups", value:"Al día",  color:C.gold  },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:100, background:`${color}0D`, border:`1px solid ${color}25`, fontFamily:FB }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:11, color:C.creamMut }}>{label}:</span>
            <span style={{ fontSize:11, color, fontWeight:700 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────
function KpiCards({ kpis, loading }: { kpis:Record<string,number> | null; loading:boolean }) {
  const cards = [
    { value: kpis?.total_obras      ?? 0, label:"Total Obras", sub:"en catálogo",   accent:C.orange, Icon:Layers,      trend:+12 },
    { value: kpis?.obras_publicadas ?? 0, label:"Publicadas",  sub:"activas ahora", accent:C.green,  Icon:CheckCircle, trend:+8  },
    { value: kpis?.obras_pendientes ?? 0, label:"Pendientes",  sub:"por revisar",   accent:C.gold,   Icon:Clock,       trend:-3  },
    { value: kpis?.obras_rechazadas ?? 0, label:"Rechazadas",  sub:"este período",  accent:C.pink,   Icon:XCircle,     trend:-2  },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
      {cards.map(({ value, label, sub, accent, Icon, trend }, i) => {
        const pos = trend > 0;
        const tc = pos ? C.green : C.pink;
        const TI = pos ? TrendingUp : TrendingDown;
        return (
          <div key={label}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden", transition:"border-color .2s, transform .2s", cursor:"default", animation:`fadeUp .45s ease ${i*0.06}s both` }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}32`; el.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, transparent)` }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${accent}14`, border:`1px solid ${accent}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={14} color={accent} strokeWidth={2} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:tc, fontFamily:FB, display:"flex", alignItems:"center", gap:2, background:`${tc}10`, padding:"3px 6px", borderRadius:20, border:`1px solid ${tc}20` }}>
                <TI size={10} strokeWidth={2.5} />{pos ? "+" : ""}{trend}%
              </span>
            </div>
            <div style={{ fontSize:26, fontWeight:900, color: loading ? C.creamMut : `${accent}DD`, letterSpacing:"-0.5px", lineHeight:1, marginBottom:4, fontFamily:FD, transition:"color .3s" }}>
              {loading ? "—" : fmt(value)}
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.creamSub, fontFamily:FB }}>{label}</span>
              <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB, background:"rgba(255,255,255,0.03)", padding:"2px 6px", borderRadius:12 }}>{sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ChartSection ──────────────────────────────────────────────────────────────
function ChartSection() {
  const [chartType, setChartType] = useState<"area"|"bar"|"line">("area");
  const chartTypes = [{ id:"area" as const, Icon:AreaIcon }, { id:"bar" as const, Icon:BarChart }, { id:"line" as const, Icon:LineChart }];
  const data = [{ s:"May", v:38, o:14, a:26 }, { s:"Jun", v:61, o:24, a:44 }, { s:"Jul", v:54, o:20, a:38 }, { s:"Ago", v:78, o:30, a:55 }];
  const axis = { stroke:"transparent", tick:{ fill:C.creamMut, fontSize:10, fontFamily:FB } };
  const grid = <CartesianGrid stroke="rgba(255,232,200,0.05)" strokeDasharray="3 3" vertical={false} />;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 14px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD }}>Actividad</div>
          <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:1 }}>4 meses</div>
        </div>
        <div style={{ display:"flex", gap:2, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, borderRadius:6, padding:2 }}>
          {chartTypes.map(({ id, Icon }) => (
            <button key={id} onClick={() => setChartType(id)}
              style={{ width:24, height:24, borderRadius:4, border:"none", background: chartType===id ? "rgba(255,132,14,0.18)" : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={11} color={chartType===id ? C.orange : C.creamMut} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:14, padding:"8px 14px 4px" }}>
        {[{c:C.orange,l:"Ventas"},{c:C.blue,l:"Obras"},{c:C.purple,l:"Artistas"}].map(({c,l}) => (
          <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.creamMut, fontFamily:FB }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block" }} />{l}
          </span>
        ))}
      </div>
      <div style={{ flex:1, padding:"0 10px 8px", minHeight:120 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data} margin={{ top:5, right:5, bottom:5, left:-10 }}>
              <defs>
                <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.20}/><stop offset="100%" stopColor={C.orange} stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.14}/><stop offset="100%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.11}/><stop offset="100%" stopColor={C.purple} stopOpacity={0}/></linearGradient>
              </defs>
              {grid}<XAxis dataKey="s" {...axis} /><YAxis {...axis} width={25} /><Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2}   fill="url(#gO)" dot={false} />
              <Area type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2}   fill="url(#gB)" dot={false} />
              <Area type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={1.5} fill="url(#gP)" dot={false} />
            </AreaChart>
          ) : chartType === "bar" ? (
            <RBarChart data={data} margin={{ top:5, right:5, bottom:5, left:-10 }}>
              {grid}<XAxis dataKey="s" {...axis} /><YAxis {...axis} width={25} /><Tooltip content={<ChartTip />} />
              <Bar dataKey="v" name="Ventas"   fill={C.orange} radius={[4,4,0,0]} fillOpacity={0.8} barSize={12} />
              <Bar dataKey="o" name="Obras"    fill={C.blue}   radius={[4,4,0,0]} fillOpacity={0.8} barSize={12} />
              <Bar dataKey="a" name="Artistas" fill={C.purple} radius={[4,4,0,0]} fillOpacity={0.8} barSize={12} />
            </RBarChart>
          ) : (
            <RLineChart data={data} margin={{ top:5, right:5, bottom:5, left:-10 }}>
              {grid}<XAxis dataKey="s" {...axis} /><YAxis {...axis} width={25} /><Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2.2} dot={{ r:3, fill:C.orange, strokeWidth:0 }} />
              <Line type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2.2} dot={{ r:3, fill:C.blue, strokeWidth:0 }} />
              <Line type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={1.8} dot={{ r:3, fill:C.purple, strokeWidth:0 }} />
            </RLineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── ObrasRecientes ────────────────────────────────────────────────────────────
function ObrasRecientes({ obras, loading, navigate }: { obras:ObraReciente[]; loading:boolean; navigate:(p:string) => void }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px", display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD }}>Obras recientes</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>Últimas subidas</div>
        </div>
        <button onClick={() => navigate("/admin/obras")} style={{ display:"flex", alignItems:"center", gap:3, background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 10px", color:C.creamMut, fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.orange; el.style.borderColor=`${C.orange}38`; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamMut; el.style.borderColor=C.border; }}>
          Ver todas <ChevronRight size={11} />
        </button>
      </div>
      <div style={{ height:1, background:C.border, marginBottom:12 }} />
      <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 6px" }}>
              <div style={{ width:40, height:40, borderRadius:8, background:"rgba(255,232,200,0.05)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ height:10, background:"rgba(255,232,200,0.05)", borderRadius:3, marginBottom:5, width:"68%" }} />
                <div style={{ height:8, background:"rgba(255,232,200,0.04)", borderRadius:3, width:"46%" }} />
              </div>
              <div style={{ width:68, height:20, background:"rgba(255,232,200,0.05)", borderRadius:20 }} />
            </div>
          ))
        ) : obras.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.creamMut, fontSize:13, fontFamily:FB }}>
            <Layers size={24} color={C.creamMut} style={{ marginBottom:8, opacity:.3 }} />
            <div>Sin obras aún</div>
          </div>
        ) : obras.map((obra, i) => {
          const cfg = statusCfg[obra.estado] || statusCfg.pendiente;
          return (
            <div key={obra.id_obra}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 8px", borderRadius:9, cursor:"pointer", transition:"background .15s", borderBottom: i < obras.length-1 ? `1px solid rgba(255,232,200,0.04)` : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}>
              <div style={{ width:40, height:40, borderRadius:8, flexShrink:0, background:`${cfg.color}10`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${cfg.color}24` }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => {(e.target as HTMLImageElement).style.display="none";}} />
                  : <Image size={15} color={cfg.color} strokeWidth={1.8} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.cream, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:FB }}>{obra.titulo}</div>
                <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{obra.artista_alias || obra.artista_nombre}</div>
              </div>
              <span style={{ fontSize:10, padding:"4px 10px", borderRadius:100, fontWeight:700, background:`${cfg.color}12`, color:cfg.color, flexShrink:0, border:`1px solid ${cfg.color}28`, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StatStrip ─────────────────────────────────────────────────────────────────
function StatStrip({ strip, loading }: { strip:Record<string,number> | null; loading:boolean }) {
  const items = [
    { value: strip?.artistas_activos ?? 0, label:"Artistas activos", sub:"en la plataforma", accent:C.pink,   Icon:Users   },
    { value: strip?.categorias       ?? 0, label:"Categorías",       sub:"tipos de arte",    accent:C.blue,   Icon:Package },
    { value: strip?.visitas_total    ?? 0, label:"Visitas totales",  sub:"a la galería",     accent:C.purple, Icon:Eye     },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
      {items.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, transition:"border-color .2s, transform .2s", cursor:"default", position:"relative", overflow:"hidden", animation:`fadeUp .5s ease ${0.25+i*0.08}s both` }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}28`; el.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, transparent)` }} />
          <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:`${accent}12`, border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon size={18} color={accent} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color: loading ? C.creamMut : C.cream, letterSpacing:"-0.5px", lineHeight:1, marginBottom:3, fontFamily:FD, transition:"color .3s" }}>
              {loading ? "—" : fmt(Number(value))}
            </div>
            <div style={{ fontSize:12.5, fontWeight:600, color:C.creamSub, fontFamily:FB }}>{label}</div>
            <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{sub}</div>
          </div>
          <ArrowUpRight size={13} color={accent} style={{ marginLeft:"auto", flexShrink:0, opacity:0.55 }} />
        </div>
      ))}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [userName,      setUserName]      = useState("");
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState<StatsData | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stats/dashboard`, {
        headers: { Authorization:`Bearer ${authService.getToken()}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
      const json = await res.json();
      if (json.success) setStats(json.data as StatsData);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ✅ Auth manejada por AdminLayout — solo cargamos datos
    setUserName(authService.getUserName() || "Admin");
    fetchStats();
  }, [fetchStats]);

  const handleBackupDownload = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) throw new Error("Error al generar el respaldo");
      const blob  = await res.blob();
      const url   = window.URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = url;
      const cd    = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download  = match?.[1] || `nub-backup-${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Respaldo descargado correctamente", "ok");
    } catch {
      showToast("Error al generar el respaldo", "err");
    } finally { setBackupLoading(false); }
  };

  // ✅ Sin wrapper externo, sin <Sidebar />, sin <style> — todo lo maneja AdminLayout
  return (
    <>
      <Topbar
        navigate={navigate}
        onRefresh={fetchStats}
        loading={loading}
        onBackup={handleBackupDownload}
        backupLoading={backupLoading}
      />
     <main style={{
  flex: 1,
  padding: "22px 26px 28px",
  overflowY: "auto",
  backgroundColor: "#0C0812",
  backgroundImage: `
    radial-gradient(circle at 80% 5%, rgba(141,76,205,0.10) 0%, transparent 35%),
    radial-gradient(circle at 5% 90%, rgba(255,132,14,0.07) 0%, transparent 30%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-12.7V22.7L28 10 6 22.7v24.6L28 60z' fill='none' stroke='rgba(141,76,205,0.07)' stroke-width='1'/%3E%3C/svg%3E")
  `,
}}>
        <WelcomeBanner userName={userName} />
        <KpiCards kpis={stats?.kpis ?? null} loading={loading} />
        <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:14, marginBottom:14 }}>
          <ObrasRecientes obras={stats?.obras_recientes || []} loading={loading} navigate={navigate} />
          <ChartSection />
        </div>
        <StatStrip strip={stats?.strip ?? null} loading={loading} />
      </main>
    </>
  );
}