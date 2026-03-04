// src/pages/private/admin/AdminDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, ShoppingBag,
  Settings, Eye, LogOut, Plus, Bell, Search,
  CheckCircle, Clock, XCircle, TrendingUp,
  TrendingDown, Package, ChevronRight, BarChart2,
  Image, RefreshCw, Sparkles, ArrowUpRight,
  BarChart, LineChart, AreaChart as AreaIcon,
  Layers, Star,
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
  violet:   "#D363FF",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  coffee:   "#764E31",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.40)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(20,15,34,0.90)",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.20)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const chartData = [
  { s:"Ene", v:28, o:9,  a:18 }, { s:"Feb", v:34, o:12, a:24 },
  { s:"Mar", v:22, o:8,  a:15 }, { s:"Abr", v:46, o:18, a:31 },
  { s:"May", v:38, o:14, a:26 }, { s:"Jun", v:61, o:24, a:44 },
  { s:"Jul", v:54, o:20, a:38 }, { s:"Ago", v:78, o:30, a:55 },
];

const statusCfg: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green   },
  pendiente: { label: "Pendiente", color: C.gold    },
  rechazada: { label: "Rechazada", color: C.pink    },
  agotada:   { label: "Agotada",   color: C.creamMut },
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, color:C.orange, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          color:C.blue,   path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           color:C.pink,   path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     color:C.gold,   path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       color:C.purple, path:"/admin"          },
];

// ── Tipos ─────────────────────────────────────────────────────
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

// ── Components ────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogo" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogo)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

const ChartTip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(10,7,20,0.97)", border:`1px solid ${C.borderBr}`, borderRadius:12, padding:"10px 14px", fontSize:12, backdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,0.6)", fontFamily:FB }}>
      <div style={{ color:C.creamMut, marginBottom:7, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", fontSize:10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontWeight:700, marginBottom:3, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, display:"inline-block" }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function Sidebar({ active, setActive, userName, onLogout, navigate }: {
  active: string; setActive: (v: string) => void;
  userName: string; onLogout: () => void; navigate: (p: string) => void;
}) {
  return (
    <div style={{ width:240, minHeight:"100vh", background:`linear-gradient(180deg, ${C.panel} 0%, ${C.bgDeep} 100%)`, borderRight:`1px solid ${C.borderBr}`, backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0, zIndex:40 }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})`, flexShrink:0 }} />

      <div style={{ padding:"22px 22px 18px", borderBottom:`1px solid ${C.borderBr}`, flexShrink:0 }}>
        <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", marginBottom:20 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.cream, lineHeight:1.1, fontFamily:FD, letterSpacing:"-0.02em" }}>Nu-B Studio</div>
            <div style={{ fontSize:10, color:C.orange, marginTop:4, letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:FB, fontWeight:700 }}>Panel Admin</div>
          </div>
        </div>
        <div style={{ background:`linear-gradient(135deg, rgba(118,78,49,0.20), rgba(255,132,14,0.08))`, border:`1px solid ${C.borderBr}`, borderRadius:14, padding:"13px 14px", display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"white", fontFamily:FB, boxShadow:`0 4px 14px ${C.pink}40` }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:FB }}>{userName}</div>
            <div style={{ fontSize:11, color:C.orange, marginTop:2, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB }}>Administrador</div>
          </div>
          <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:`0 0 7px ${C.green}`, flexShrink:0 }} />
        </div>
      </div>

      <div style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
        <div style={{ fontSize:10.5, fontWeight:800, color:C.creamMut, letterSpacing:"0.16em", textTransform:"uppercase", padding:"0 10px 12px", fontFamily:FB }}>Navegación</div>
        {NAV.map(({ id, label, icon:Icon, color, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => { setActive(id); navigate(path); }}
              style={{ width:"100%", border:on ? `1px solid ${color}30` : "1px solid transparent", cursor:"pointer", background:on ? `linear-gradient(135deg, ${color}18, ${color}08)` : "transparent", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, transition:"all .18s ease", position:"relative", fontFamily:FB }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background="rgba(255,232,200,0.05)"; (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.borderColor="transparent"; } }}
            >
              {on && <div style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3, borderRadius:"0 3px 3px 0", background:`linear-gradient(180deg, ${color}, ${color}70)`, boxShadow:`0 0 10px ${color}60` }} />}
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:on ? `${color}22` : "rgba(255,232,200,0.06)", display:"flex", alignItems:"center", justifyContent:"center", border:on ? `1px solid ${color}30` : "1px solid transparent", transition:"all .18s" }}>
                <Icon size={17} color={on ? color : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize:14.5, fontWeight:on ? 700 : 500, color:on ? C.cream : C.creamSub, transition:"color .15s", fontFamily:FB }}>{label}</span>
              {on && <div style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 9px ${color}` }} />}
            </button>
          );
        })}
      </div>

      <div style={{ padding:"14px 12px 20px", borderTop:`1px solid ${C.borderBr}`, flexShrink:0 }}>
        <div style={{ display:"flex", gap:6 }}>
          <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:10, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", cursor:"pointer", fontSize:12.5, color:C.creamSub, fontWeight:600, fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; (e.currentTarget as HTMLElement).style.color=C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.color=C.creamSub; }}>
            <Settings size={14} strokeWidth={1.8} /> Config
          </button>
          <button onClick={onLogout} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:10, border:`1px solid ${C.pink}30`, background:`${C.pink}08`, cursor:"pointer", fontSize:12.5, color:C.pink, fontWeight:600, fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${C.pink}18`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=`${C.pink}08`}>
            <LogOut size={14} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

function Topbar({ navigate, onRefresh, loading }: { navigate: (p: string) => void; onRefresh: () => void; loading: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:64, background:"rgba(10,7,20,0.88)", borderBottom:`1px solid ${C.borderBr}`, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 13px", borderRadius:100, background:`linear-gradient(135deg, ${C.orange}20, ${C.gold}10)`, border:`1px solid ${C.orange}38`, fontSize:11, fontWeight:700, color:C.orange, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:FB }}>
          <Sparkles size={11} /> Admin
        </div>
        <ChevronRight size={13} color={C.creamMut} />
        <span style={{ fontSize:14, color:C.creamSub, fontFamily:FB, fontWeight:500 }}>Dashboard</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 16px", cursor:"text", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor=C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border}>
          <Search size={13} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ fontSize:13, color:C.creamMut, userSelect:"none", fontFamily:FB }}>Buscar obras, artistas…</span>
        </div>
        <button onClick={onRefresh} style={{ width:38, height:38, borderRadius:10, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor=`${C.orange}50`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border}>
          <RefreshCw size={14} color={C.creamMut} strokeWidth={1.8} style={{ animation:loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button style={{ position:"relative", width:38, height:38, borderRadius:10, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor=C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border}>
          <Bell size={15} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ position:"absolute", top:9, right:9, width:7, height:7, background:C.orange, borderRadius:"50%", border:`2px solid ${C.bg}`, boxShadow:`0 0 6px ${C.orange}` }} />
        </button>
        <button onClick={() => navigate("/admin/obras/crear")} style={{ display:"flex", alignItems:"center", gap:7, background:`linear-gradient(135deg, ${C.orange}, ${C.magenta})`, border:"none", color:"white", padding:"9px 18px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 22px ${C.orange}40`, transition:"transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 10px 30px ${C.orange}55`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 22px ${C.orange}40`; }}>
          <Plus size={15} strokeWidth={2.5} /> Nueva Obra
        </button>
      </div>
    </div>
  );
}

function WelcomeBanner({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dayNames   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const now = new Date();
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`;
  return (
    <div style={{ position:"relative", borderRadius:20, overflow:"hidden", padding:"28px 32px", background:`linear-gradient(135deg, rgba(255,132,14,0.12) 0%, rgba(204,78,161,0.08) 50%, rgba(141,76,205,0.10) 100%)`, border:`1px solid rgba(255,132,14,0.22)`, marginBottom:24, animation:"fadeUp .45s ease both" }}>
      <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle, ${C.orange}22, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-30, left:"40%", width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle, ${C.purple}15, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:100, background:"rgba(255,248,238,0.08)", border:`1px solid ${C.borderHi}`, fontSize:11, fontWeight:600, color:C.creamSub, fontFamily:FB, marginBottom:12, letterSpacing:"0.05em" }}>
            <Star size={10} color={C.gold} fill={C.gold} /> {dateStr}
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:"0 0 6px", lineHeight:1.15, fontFamily:FD, color:C.cream }}>
            {greeting},{" "}
            <span style={{ background:`linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{userName}</span>{" "}✦
          </h1>
          <p style={{ fontSize:14, color:C.creamSub, margin:0, fontFamily:FB, fontWeight:400 }}>
            Tu plataforma artística está activa y funcionando correctamente.
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
          {[
            { label:"Sistema", value:"Activo",  color:C.green },
            { label:"API",     value:"Estable", color:C.blue  },
            { label:"Backups", value:"Al día",  color:C.gold  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:`${color}12`, border:`1px solid ${color}30`, fontFamily:FB }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 7px ${color}` }} />
              <span style={{ fontSize:11.5, color:C.creamSub, fontWeight:500 }}>{label}:</span>
              <span style={{ fontSize:11.5, color, fontWeight:700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCards({ kpis, loading }: { kpis: Record<string, number> | null; loading: boolean }) {
  const cards = [
    { value:kpis?.total_obras      ?? "—", label:"Total Obras", sub:"en catálogo",   accent:C.orange, accent2:C.gold,    Icon:Layers,      trend:true  },
    { value:kpis?.obras_publicadas ?? "—", label:"Publicadas",  sub:"activas ahora", accent:C.green,  accent2:C.blue,    Icon:CheckCircle, trend:true  },
    { value:kpis?.obras_pendientes ?? "—", label:"Pendientes",  sub:"por revisar",   accent:C.gold,   accent2:C.orange,  Icon:Clock,       trend:false },
    { value:kpis?.obras_rechazadas ?? "—", label:"Rechazadas",  sub:"este período",  accent:C.pink,   accent2:C.magenta, Icon:XCircle,     trend:false },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
      {cards.map(({ value, label, sub, accent, accent2, Icon, trend }, i) => (
        <div key={label}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px 22px", position:"relative", overflow:"hidden", backdropFilter:"blur(20px)", transition:"border-color .2s, box-shadow .2s, transform .2s", cursor:"default", animation:`fadeUp .5s ease ${i * 0.07}s both` }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=`${accent}50`; el.style.boxShadow=`0 12px 40px ${accent}20`; el.style.transform="translateY(-3px)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.boxShadow="none"; el.style.transform="translateY(0)"; }}
        >
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, ${accent2})` }} />
          <div style={{ position:"absolute", top:-40, right:-40, width:130, height:130, borderRadius:"50%", background:`radial-gradient(circle, ${accent}20, transparent 70%)`, pointerEvents:"none" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, position:"relative" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${accent}28, ${accent2}15)`, border:`1px solid ${accent}38`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${accent}28` }}>
              <Icon size={19} color={accent} strokeWidth={2} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              {trend ? <TrendingUp size={13} color={accent} strokeWidth={2.5} /> : <TrendingDown size={13} color={accent} strokeWidth={2.5} />}
              <span style={{ fontSize:11.5, fontWeight:700, color:accent, fontFamily:FB }}>{trend ? "+12%" : "−3%"}</span>
            </div>
          </div>
          <div style={{ fontSize:40, fontWeight:900, color:loading ? "rgba(255,232,200,0.15)" : C.cream, letterSpacing:"-1.5px", lineHeight:1, marginBottom:7, transition:"color .3s", position:"relative", fontFamily:FD }}>
            {loading ? "—" : value}
          </div>
          <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, marginBottom:3, fontFamily:FB }}>{label}</div>
          <div style={{ fontSize:12, color:C.creamSub, fontFamily:FB }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

function ChartSection() {
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");
  const [showChart, setShowChart] = useState(true);
  const chartTypes = [
    { id:"area" as const, label:"Área",   Icon:AreaIcon },
    { id:"bar"  as const, label:"Barras", Icon:BarChart },
    { id:"line" as const, label:"Líneas", Icon:LineChart },
  ];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px", backdropFilter:"blur(20px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showChart ? 22 : 0 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:3 }}>Ventas & Obras</div>
          <div style={{ fontSize:12, color:C.creamSub, fontFamily:FB }}>Últimas 8 semanas</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {showChart && (
            <div style={{ display:"flex", gap:14, marginRight:8 }}>
              {[{c:C.orange,l:"Ventas"},{c:C.blue,l:"Obras"},{c:C.purple,l:"Artistas"}].map(({c,l}) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:C.creamSub, fontFamily:FB }}>
                  <span style={{ width:18, height:3, background:c, display:"inline-block", borderRadius:2, boxShadow:`0 0 5px ${c}80` }} />{l}
                </span>
              ))}
            </div>
          )}
          {showChart && (
            <div style={{ display:"flex", gap:2, background:"rgba(255,232,200,0.05)", border:`1px solid ${C.border}`, borderRadius:10, padding:3 }}>
              {chartTypes.map(({id, label, Icon}) => (
                <button key={id} onClick={() => setChartType(id)} title={label}
                  style={{ width:32, height:32, borderRadius:8, border:"none", background:chartType===id ? `${C.orange}25` : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s", boxShadow:chartType===id ? `0 0 10px ${C.orange}30` : "none" }}>
                  <Icon size={15} color={chartType===id ? C.orange : C.creamMut} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowChart(v => !v)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, background:showChart ? `${C.orange}18` : "rgba(255,232,200,0.05)", border:`1px solid ${showChart ? C.orange+"40" : C.border}`, color:showChart ? C.orange : C.creamMut, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FB, transition:"all .18s" }}>
            <BarChart2 size={13} strokeWidth={2} />
            {showChart ? "Ocultar" : "Ver gráfica"}
          </button>
        </div>
      </div>
      {showChart && (
        <div style={{ animation:"fadeUp .3s ease both" }}>
          <ResponsiveContainer width="100%" height={220}>
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.28}/><stop offset="100%" stopColor={C.orange} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue}   stopOpacity={0.22}/><stop offset="100%" stopColor={C.blue}   stopOpacity={0}/></linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.18}/><stop offset="100%" stopColor={C.purple} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="s" stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <YAxis stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2.5} fill="url(#gO)" dot={false} />
                <Area type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2.5} fill="url(#gB)" dot={false} />
                <Area type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={2}   fill="url(#gP)" dot={false} />
              </AreaChart>
            ) : chartType === "bar" ? (
              <RBarChart data={chartData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="s" stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <YAxis stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="v" name="Ventas"   fill={C.orange} radius={[5,5,0,0]} fillOpacity={0.85} />
                <Bar dataKey="o" name="Obras"    fill={C.blue}   radius={[5,5,0,0]} fillOpacity={0.85} />
                <Bar dataKey="a" name="Artistas" fill={C.purple} radius={[5,5,0,0]} fillOpacity={0.85} />
              </RBarChart>
            ) : (
              <RLineChart data={chartData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <CartesianGrid stroke="rgba(255,232,200,0.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="s" stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <YAxis stroke="transparent" tick={{fill:C.creamSub,fontSize:11,fontFamily:FB}} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="v" name="Ventas"   stroke={C.orange} strokeWidth={2.5} dot={{r:4,fill:C.orange}} />
                <Line type="monotone" dataKey="o" name="Obras"    stroke={C.blue}   strokeWidth={2.5} dot={{r:4,fill:C.blue}} />
                <Line type="monotone" dataKey="a" name="Artistas" stroke={C.purple} strokeWidth={2}   dot={{r:3,fill:C.purple}} />
              </RLineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      {!showChart && (
        <div style={{ display:"flex", gap:20, marginTop:16, animation:"fadeUp .3s ease both" }}>
          {[{label:"Ventas",value:"78",color:C.orange},{label:"Obras",value:"30",color:C.blue},{label:"Artistas",value:"55",color:C.purple}].map(({label,value,color}) => (
            <div key={label} style={{ flex:1, padding:"14px", borderRadius:12, background:`${color}10`, border:`1px solid ${color}25`, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color, fontFamily:FD }}>{value}</div>
              <div style={{ fontSize:11, color:C.creamSub, fontFamily:FB, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ObrasRecientes({ obrasRecientes, loading, navigate }: { obrasRecientes: ObraReciente[]; loading: boolean; navigate: (p: string) => void }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px", backdropFilter:"blur(20px)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:3 }}>Obras Recientes</div>
          <div style={{ fontSize:12, color:C.creamSub, fontFamily:FB }}>Últimas subidas al catálogo</div>
        </div>
        <button onClick={() => navigate("/admin/obras")} style={{ display:"flex", alignItems:"center", gap:4, background:`${C.orange}15`, border:`1px solid ${C.orange}38`, borderRadius:9, padding:"7px 13px", color:C.orange, fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${C.orange}28`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=`${C.orange}15`}>
          Ver todas <ChevronRight size={13} />
        </button>
      </div>
      <div style={{ height:1, background:`linear-gradient(90deg, ${C.orange}30, transparent)`, marginBottom:12 }} />
      <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 10px" }}>
              <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,232,200,0.06)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ height:12, background:"rgba(255,232,200,0.06)", borderRadius:4, marginBottom:7, width:"65%" }} />
                <div style={{ height:9,  background:"rgba(255,232,200,0.04)", borderRadius:4, width:"40%" }} />
              </div>
              <div style={{ width:70, height:22, background:"rgba(255,232,200,0.06)", borderRadius:20 }} />
            </div>
          ))
        ) : obrasRecientes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"44px 0", color:C.creamMut, fontSize:13, fontFamily:FB }}>
            <Layers size={28} color={C.creamMut} style={{ marginBottom:10 }} />
            <div>Sin obras aún</div>
          </div>
        ) : obrasRecientes.map((obra, i) => {
          const cfg = statusCfg[obra.estado] || statusCfg.pendiente;
          return (
            <div key={obra.id_obra}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 10px", borderRadius:12, borderBottom:i < obrasRecientes.length-1 ? `1px solid rgba(255,232,200,0.05)` : "none", cursor:"pointer", transition:"background .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,232,200,0.05)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
              onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}>
              <div style={{ width:40, height:40, borderRadius:11, flexShrink:0, background:`${cfg.color}18`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${cfg.color}35`, boxShadow:`0 2px 10px ${cfg.color}18` }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => {(e.target as HTMLImageElement).style.display="none";}} />
                  : <Image size={16} color={cfg.color} strokeWidth={1.8} />
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:FB, marginBottom:2 }}>{obra.titulo}</div>
                <div style={{ fontSize:11.5, color:C.creamSub, fontFamily:FB }}>{obra.artista_alias || obra.artista_nombre}</div>
              </div>
              <span style={{ fontSize:10.5, padding:"4px 11px", borderRadius:20, fontWeight:800, background:`${cfg.color}18`, color:cfg.color, flexShrink:0, border:`1px solid ${cfg.color}38`, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, boxShadow:cfg.color===C.green ? `0 0 8px ${C.green}30` : "none" }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatStrip({ strip, loading }: { strip: Record<string, number> | null; loading: boolean }) {
  const items = [
    { value:strip?.artistas_activos ?? "—", label:"Artistas activos", sub:"en la plataforma", accent:C.pink,   accent2:C.magenta, Icon:Users   },
    { value:strip?.categorias       ?? "—", label:"Categorías",       sub:"tipos de arte",    accent:C.blue,   accent2:C.purple,  Icon:Package },
    { value:strip?.visitas_total    ?? "—", label:"Visitas totales",  sub:"a la galería",     accent:C.purple, accent2:C.violet,  Icon:Eye     },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
      {items.map(({ value, label, sub, accent, accent2, Icon }, i) => (
        <div key={label}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 24px", display:"flex", alignItems:"center", gap:18, backdropFilter:"blur(20px)", transition:"border-color .2s, box-shadow .2s, transform .2s", cursor:"default", position:"relative", overflow:"hidden", animation:`fadeUp .5s ease ${0.4+i*0.1}s both` }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}50`; el.style.boxShadow=`0 12px 40px ${accent}15`; el.style.transform="translateY(-3px)"; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.boxShadow="none"; el.style.transform="translateY(0)"; }}
        >
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, ${accent2})` }} />
          <div style={{ position:"absolute", bottom:-30, right:-30, width:130, height:130, borderRadius:"50%", background:`radial-gradient(circle, ${accent}18, transparent 70%)`, pointerEvents:"none" }} />
          <div style={{ width:54, height:54, borderRadius:14, flexShrink:0, background:`linear-gradient(135deg, ${accent}28, ${accent2}15)`, border:`1px solid ${accent}38`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 18px ${accent}28` }}>
            <Icon size={23} color={accent} strokeWidth={2} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:34, fontWeight:900, color:loading ? "rgba(255,232,200,0.15)" : C.cream, letterSpacing:"-1px", lineHeight:1, marginBottom:6, transition:"color .3s", fontFamily:FD }}>
              {loading ? "—" : value}
            </div>
            <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FB }}>{label}</div>
            <div style={{ fontSize:12, color:C.creamSub, marginTop:2, fontFamily:FB }}>{sub}</div>
          </div>
          <ArrowUpRight size={16} color={accent} style={{ flexShrink:0, opacity:0.8 }} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
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
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) {
        const msg = await handleApiError(res);
        showToast(msg, "warn");
        return;
      }
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
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:FB, color:C.cream, position:"relative" }}>
      <div style={{ position:"fixed", top:-140, right:-100, width:560, height:560, borderRadius:"50%", background:`radial-gradient(circle, ${C.pink}10, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-120, left:180, width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, ${C.purple}09, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"35%", right:"28%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${C.blue}06, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"20%", right:-80, width:360, height:360, borderRadius:"50%", background:`radial-gradient(circle, ${C.orange}06, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      <Sidebar active={active} setActive={setActive} userName={userName} onLogout={handleLogout} navigate={navigate} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:1 }}>
        <Topbar navigate={navigate} onRefresh={fetchStats} loading={loading} />
        <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
          <WelcomeBanner userName={userName} />
          <KpiCards kpis={stats?.kpis ?? null} loading={loading} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, marginBottom:24 }}>
            <ChartSection />
            <ObrasRecientes obrasRecientes={stats?.obras_recientes || []} loading={loading} navigate={navigate} />
          </div>
          <StatStrip strip={stats?.strip ?? null} loading={loading} />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}