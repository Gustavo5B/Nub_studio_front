// src/pages/private/admin/AdminDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, ShoppingBag,
  Settings, Eye, LogOut, Bell, Search,
  CheckCircle, Clock, XCircle, TrendingUp,
  TrendingDown, Package, ChevronRight, BarChart2,
  Image, RefreshCw, ArrowUpRight,
  BarChart, LineChart, AreaChart as AreaIcon,
  Layers, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart as RBarChart, Bar,
  LineChart as RLineChart, Line,
} from "recharts";
import logoImg from "../../../assets/images/logo.png";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

// ── Paleta unificada ──────────────────────────────────────────────────────────
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
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

// Playfair Display → títulos y números grandes | DM Sans → todo lo demás
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

// Formato de número profesional
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const chartData = [
  { s:"Ene", v:28, o:9,  a:18 }, { s:"Feb", v:34, o:12, a:24 },
  { s:"Mar", v:22, o:8,  a:15 }, { s:"Abr", v:46, o:18, a:31 },
  { s:"May", v:38, o:14, a:26 }, { s:"Jun", v:61, o:24, a:44 },
  { s:"Jul", v:54, o:20, a:38 }, { s:"Ago", v:78, o:30, a:55 },
];

const statusCfg: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green },
  pendiente: { label: "Pendiente", color: C.gold  },
  rechazada: { label: "Rechazada", color: C.pink  },
  agotada:   { label: "Agotada",   color: C.creamMut },
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       path:"/admin"          },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ObraReciente {
  id_obra: number;
  titulo: string;
  estado: string;
  imagen_principal?: string;
  artista_alias?: string;
  artista_nombre?: string;
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

// ── Tooltip gráfica ────────────────────────────────────────────────────────────
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

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, userName, onLogout, navigate }: {
  active: string; setActive: (v:string) => void;
  userName: string; onLogout: () => void; navigate: (p:string) => void;
}) {
  return (
    <div style={{
      width: 220, minHeight:"100vh",
      background: C.bgDeep,
      borderRight:`1px solid ${C.borderBr}`,
      display:"flex", flexDirection:"column",
      position:"sticky", top:0, height:"100vh",
      flexShrink:0, zIndex:40,
    }}>
      {/* Línea de colores — patrón unificado */}
      <div style={{ height:2, background:`linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      {/* Logo + usuario */}
      <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, overflow:"hidden", border:`1px solid ${C.borderBr}`, flexShrink:0 }}>
            <img src={logoImg} alt="Galería Altar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
          <div>
            {/* Playfair Display para el nombre */}
            <div style={{ fontSize:14, fontWeight:900, color:C.cream, lineHeight:1.1, fontFamily:FD, letterSpacing:"-0.01em" }}>Galería</div>
            <div style={{ fontSize:9, color:C.orange, marginTop:2, letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:FB, fontWeight:700 }}>Panel Admin</div>
          </div>
        </div>

        {/* Usuario */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.borderBr}` }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", fontFamily:FB }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:FB }}>{userName}</div>
            <div style={{ fontSize:10, color:C.orange, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB }}>Admin</div>
          </div>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}`, flexShrink:0 }} />
        </div>
      </div>

      {/* Nav links */}
      <div style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.creamMut, letterSpacing:"0.16em", textTransform:"uppercase", padding:"0 8px 10px", fontFamily:FB }}>Navegación</div>
        {NAV.map(({ id, label, icon:Icon, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => { setActive(id); navigate(path); }}
              style={{ width:"100%", cursor:"pointer", background: on ? "rgba(255,132,14,0.10)" : "transparent", border: on ? "1px solid rgba(255,132,14,0.22)" : "1px solid transparent", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, transition:"all .15s", position:"relative", fontFamily:FB }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {on && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:2.5, borderRadius:"0 3px 3px 0", background:C.orange }} />}
              <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, background: on ? "rgba(255,132,14,0.15)" : "rgba(255,232,200,0.05)", display:"flex", alignItems:"center", justifyContent:"center", border: on ? "1px solid rgba(255,132,14,0.25)" : "1px solid transparent", transition:"all .15s" }}>
                <Icon size={15} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize:13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily:FB }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer sidebar */}
      <div style={{ padding:"12px 10px 18px", borderTop:`1px solid ${C.borderBr}` }}>
        <div style={{ display:"flex", gap:6 }}>
          <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", fontSize:12, color:C.creamMut, fontWeight:600, fontFamily:FB, transition:"color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.creamSub}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={onLogout} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px", borderRadius:9, border:`1px solid rgba(204,89,173,0.25)`, background:"rgba(204,89,173,0.06)", cursor:"pointer", fontSize:12, color:C.pink, fontWeight:600, fontFamily:FB, transition:"background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ navigate, onRefresh, loading }: { navigate:(p:string) => void; onRefresh:() => void; loading:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub, fontFamily:FB }}>Dashboard</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,232,200,0.03)", border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 14px", cursor:"text", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Search size={12} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, userSelect:"none" }}>Buscar…</span>
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
        {/* btn-primary: acceso rápido a obras pendientes de revisión */}
        <button onClick={() => navigate("/admin/obras?estado=pendiente")} style={{ display:"flex", alignItems:"center", gap:6, background:`linear-gradient(135deg, ${C.orange}, ${C.magenta})`, border:"none", color:"white", padding:"7px 15px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 4px 14px ${C.orange}30`, transition:"transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 22px ${C.orange}45`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 4px 14px ${C.orange}30`; }}>
          <Clock size={14} strokeWidth={2.5} /> Revisar pendientes
        </button>
      </div>
    </div>
  );
}

// ── WelcomeBanner ──────────────────────────────────────────────────────────────
function WelcomeBanner({ userName }: { userName:string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const now  = new Date();
  const days   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;

  return (
    <div style={{ borderRadius:14, padding:"22px 26px", background:`linear-gradient(135deg, rgba(255,132,14,0.08), rgba(141,76,205,0.05))`, border:`1px solid rgba(255,132,14,0.14)`, marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
      {/* Orbe sutil */}
      <div style={{ position:"absolute", top:-50, right:-40, width:180, height:180, borderRadius:"50%", background:`radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ position:"relative" }}>
        {/* Badge fecha — borderRadius:100, patrón unificado */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:"rgba(255,248,238,0.05)", border:`1px solid ${C.borderBr}`, fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:10 }}>
          <Star size={9} color={C.gold} fill={C.gold} /> {dateStr}
        </div>
        {/* Playfair Display para el saludo */}
        <h1 style={{ fontSize:22, fontWeight:900, margin:"0 0 4px", fontFamily:FD, color:C.cream }}>
          {greeting},{" "}
          <span style={{ background:`linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{userName}</span>
        </h1>
        <p style={{ fontSize:13, color:C.creamMut, margin:0, fontFamily:FB }}>Tu plataforma está activa y funcionando correctamente.</p>
      </div>

      {/* Status badges */}
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

// ── KPI Cards ──────────────────────────────────────────────────────────────────
function KpiCards({ kpis, loading }: { kpis:Record<string,number> | null; loading:boolean }) {
  const cards = [
    { value: kpis?.total_obras      ?? 0, label:"Total Obras", sub:"en catálogo",   accent:C.orange, Icon:Layers,      trend:+12 },
    { value: kpis?.obras_publicadas ?? 0, label:"Publicadas",  sub:"activas ahora", accent:C.green,  Icon:CheckCircle, trend:+8  },
    { value: kpis?.obras_pendientes ?? 0, label:"Pendientes",  sub:"por revisar",   accent:C.gold,   Icon:Clock,       trend:-3  },
    { value: kpis?.obras_rechazadas ?? 0, label:"Rechazadas",  sub:"este período",  accent:C.pink,   Icon:XCircle,     trend:-2  },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14 }}>
      {cards.map(({ value, label, sub, accent, Icon, trend }, i) => (
        <div key={label}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", position:"relative", overflow:"hidden", transition:"border-color .2s, transform .2s", cursor:"default", animation:`fadeUp .45s ease ${i*0.06}s both` }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}32`; el.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}
        >
          {/* Accent line — patrón unificado */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, transparent)` }} />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${accent}14`, border:`1px solid ${accent}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={15} color={accent} strokeWidth={2} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color: trend > 0 ? C.green : "#f87171", fontFamily:FB, display:"flex", alignItems:"center", gap:3 }}>
              {trend > 0 ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>

          {/* Número — Playfair Display, formateado profesionalmente */}
          <div style={{ fontSize:28, fontWeight:900, color: loading ? C.creamMut : C.cream, letterSpacing:"-0.5px", lineHeight:1, marginBottom:5, fontFamily:FD, transition:"color .3s" }}>
            {loading ? "—" : fmt(Number(value))}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:C.creamSub, marginBottom:2, fontFamily:FB }}>{label}</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── ChartSection ───────────────────────────────────────────────────────────────
function ChartSection() {
  const [chartType, setChartType] = useState<"area"|"bar"|"line">("area");
  const chartTypes = [
    { id:"area" as const, Icon:AreaIcon  },
    { id:"bar"  as const, Icon:BarChart  },
    { id:"line" as const, Icon:LineChart },
  ];

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.cream, fontFamily:FD }}>Actividad</div>
          <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>Últimas 8 semanas</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Leyenda compacta */}
          <div style={{ display:"flex", gap:12 }}>
            {[{c:C.orange,l:"Ventas"},{c:C.blue,l:"Obras"},{c:C.purple,l:"Artistas"}].map(({c,l}) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11.5, color:C.creamMut, fontFamily:FB }}>
                <span style={{ width:14, height:2, background:c, display:"inline-block", borderRadius:2 }} />{l}
              </span>
            ))}
          </div>
          {/* Selector tipo */}
          <div style={{ display:"flex", gap:2, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, borderRadius:8, padding:2 }}>
            {chartTypes.map(({ id, Icon }) => (
              <button key={id} onClick={() => setChartType(id)}
                style={{ width:26, height:26, borderRadius:6, border:"none", background: chartType===id ? "rgba(255,132,14,0.18)" : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                <Icon size={12} color={chartType===id ? C.orange : C.creamMut} strokeWidth={1.8} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfica — padding consistente, bien contenida */}
      <div style={{ padding:"10px 6px 6px" }}>
        <ResponsiveContainer width="100%" height={195}>
          {chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top:4, right:12, bottom:0, left:-18 }}>
              <defs>
                <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.20}/><stop offset="100%" stopColor={C.orange} stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue}   stopOpacity={0.14}/><stop offset="100%" stopColor={C.blue}   stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.11}/><stop offset="100%" stopColor={C.purple} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="s" stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2}   fill="url(#gO)" dot={false} />
              <Area type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2}   fill="url(#gB)" dot={false} />
              <Area type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={1.5} fill="url(#gP)" dot={false} />
            </AreaChart>
          ) : chartType === "bar" ? (
            <RBarChart data={chartData} margin={{ top:4, right:12, bottom:0, left:-18 }}>
              <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="s" stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="v" name="Ventas"   fill={C.orange} radius={[4,4,0,0]} fillOpacity={0.75} />
              <Bar dataKey="o" name="Obras"    fill={C.blue}   radius={[4,4,0,0]} fillOpacity={0.75} />
              <Bar dataKey="a" name="Artistas" fill={C.purple} radius={[4,4,0,0]} fillOpacity={0.75} />
            </RBarChart>
          ) : (
            <RLineChart data={chartData} margin={{ top:4, right:12, bottom:0, left:-18 }}>
              <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="s" stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <YAxis stroke="transparent" tick={{ fill:C.creamMut, fontSize:11, fontFamily:FB }} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2}   dot={{ r:3, fill:C.orange, strokeWidth:0 }} />
              <Line type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2}   dot={{ r:3, fill:C.blue, strokeWidth:0 }} />
              <Line type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={1.5} dot={{ r:3, fill:C.purple, strokeWidth:0 }} />
            </RLineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── ObrasRecientes ─────────────────────────────────────────────────────────────
function ObrasRecientes({ obras, loading, navigate }: { obras:ObraReciente[]; loading:boolean; navigate:(p:string) => void }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px", display:"flex", flexDirection:"column" }}>
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

      <div style={{ height:1, background:C.border, marginBottom:8 }} />

      <div style={{ display:"flex", flexDirection:"column", gap:1, flex:1 }}>
        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 6px" }}>
              <div style={{ width:34, height:34, borderRadius:8, background:"rgba(255,232,200,0.05)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ height:10, background:"rgba(255,232,200,0.05)", borderRadius:3, marginBottom:5, width:"58%" }} />
                <div style={{ height:8, background:"rgba(255,232,200,0.04)", borderRadius:3, width:"36%" }} />
              </div>
              <div style={{ width:58, height:18, background:"rgba(255,232,200,0.05)", borderRadius:20 }} />
            </div>
          ))
        ) : obras.length === 0 ? (
          <div style={{ textAlign:"center", padding:"36px 0", color:C.creamMut, fontSize:13, fontFamily:FB }}>
            <Layers size={22} color={C.creamMut} style={{ marginBottom:8, opacity:.3 }} />
            <div>Sin obras aún</div>
          </div>
        ) : obras.map((obra, i) => {
          const cfg = statusCfg[obra.estado] || statusCfg.pendiente;
          return (
            <div key={obra.id_obra}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 6px", borderRadius:9, cursor:"pointer", transition:"background .15s", borderBottom: i < obras.length-1 ? `1px solid rgba(255,232,200,0.04)` : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}>
              <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:`${cfg.color}10`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${cfg.color}24` }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => {(e.target as HTMLImageElement).style.display="none";}} />
                  : <Image size={13} color={cfg.color} strokeWidth={1.8} />
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:C.cream, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:FB }}>{obra.titulo}</div>
                <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{obra.artista_alias || obra.artista_nombre}</div>
              </div>
              {/* Badge estado — borderRadius:100, patrón unificado */}
              <span style={{ fontSize:9.5, padding:"3px 8px", borderRadius:100, fontWeight:700, background:`${cfg.color}12`, color:cfg.color, flexShrink:0, border:`1px solid ${cfg.color}28`, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StatStrip ──────────────────────────────────────────────────────────────────
function StatStrip({ strip, loading }: { strip:Record<string,number> | null; loading:boolean }) {
  const items = [
    { value: strip?.artistas_activos ?? 0, label:"Artistas activos", sub:"en la plataforma", accent:C.pink,   Icon:Users   },
    { value: strip?.categorias       ?? 0, label:"Categorías",       sub:"tipos de arte",    accent:C.blue,   Icon:Package },
    { value: strip?.visitas_total    ?? 0, label:"Visitas totales",  sub:"a la galería",      accent:C.purple, Icon:Eye     },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
      {items.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, transition:"border-color .2s, transform .2s", cursor:"default", position:"relative", overflow:"hidden", animation:`fadeUp .5s ease ${0.25+i*0.08}s both` }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}28`; el.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}
        >
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, transparent)` }} />
          <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:`${accent}12`, border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon size={18} color={accent} strokeWidth={1.8} />
          </div>
          <div>
            {/* Número formateado — Playfair Display */}
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

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [userName, setUserName] = useState("");
  const [active,   setActive]   = useState("dashboard");
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState<StatsData | null>(null);

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
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login"); return; }
    setUserName(authService.getUserName() || "Admin");
    fetchStats();
  }, [navigate, fetchStats]);

  const handleLogout = () => { authService.logout(); navigate("/login"); };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:FB, color:C.cream }}>
      <Sidebar active={active} setActive={setActive} userName={userName} onLogout={handleLogout} navigate={navigate} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <Topbar navigate={navigate} onRefresh={fetchStats} loading={loading} />
        <main style={{ flex:1, padding:"22px 26px 28px", overflowY:"auto" }}>
          <WelcomeBanner userName={userName} />
          <KpiCards kpis={stats?.kpis ?? null} loading={loading} />

          {/* Fila principal */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, marginBottom:14 }}>
            <ChartSection />
            <ObrasRecientes obras={stats?.obras_recientes || []} loading={loading} navigate={navigate} />
          </div>

          {/* Métricas secundarias */}
          <StatStrip strip={stats?.strip ?? null} loading={loading} />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.10); border-radius:8px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,200,150,0.18); }
      `}</style>
    </div>
  );
}