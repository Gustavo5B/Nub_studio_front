import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

// Lucide
import {
  LayoutDashboard, Image, Users, ShoppingBag,
  BarChart2, Settings, Clock, Award, Heart,
  Eye, TrendingUp, TrendingDown, Bell, Search,
   ChevronRight, Palette
} from "lucide-react";

// Heroicons
import {
  SparklesIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// ── tokens ────────────────────────────────────────────────────────
const P = {
  orange: "#FF840E",
  blue:   "#79AAF5",
  pink:   "#CC59AD",
  purple: "#8D4CCD",
  gold:   "#FFC110",
  gray:   "#6B7280",
  bg:       "#F2F4F7",
  surface:  "#FFFFFF",
  border:   "#E8EAF0",
  text:     "#1C1F26",
  muted:    "#9CA3AF",
  sidebar:  "#1C1F26",
};

// ── data ──────────────────────────────────────────────────────────
const chartData = [
  { s:"S1", v:38, o:14 }, { s:"S2", v:52, o:19 },
  { s:"S3", v:44, o:16 }, { s:"S4", v:67, o:25 },
  { s:"S5", v:59, o:22 }, { s:"S6", v:81, o:31 },
  { s:"S7", v:74, o:28 }, { s:"S8", v:93, o:35 },
];

const artists = [
  { name:"María Colín",  val:"$42k", sub:"18 obras", color:P.orange },
  { name:"Pedro Ramos",  val:"$31k", sub:"14 obras", color:P.blue   },
  { name:"Ana Flores",   val:"$28k", sub:"11 obras", color:P.pink   },
  { name:"Carmen Díaz",  val:"$22k", sub:"9 obras",  color:P.purple },
  { name:"Luis Vega",    val:"$17k", sub:"7 obras",  color:P.gold   },
];

const txs = [
  { obra:"Danza Huasteca",     who:"M. Colín",  monto:"$4,200", tag:"Venta",     c:P.orange, t:"Hace 2h" },
  { obra:"Ritual del Maíz",    who:"C. Díaz",   monto:"$5,400", tag:"Venta",     c:P.orange, t:"Hace 5h" },
  { obra:"Sierra Amanecer",    who:"P. Ramos",  monto:"$2,800", tag:"Reserva",   c:P.blue,   t:"Hace 8h" },
  { obra:"Tejido Ancestral",   who:"A. Flores", monto:"$6,500", tag:"Pendiente", c:P.gold,   t:"Ayer"    },
  { obra:"Mercado de Colores", who:"L. Vega",   monto:"$3,100", tag:"Venta",     c:P.orange, t:"Ayer"    },
];

const techs = [
  { n:"Óleo",       p:38, c:P.orange },
  { n:"Acuarela",   p:24, c:P.blue   },
  { n:"Fotografía", p:19, c:P.pink   },
  { n:"Escultura",  p:12, c:P.purple },
  { n:"Grabado",    p: 7, c:P.gold   },
];

const Tip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { color: string; name: string; value: string | number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${P.border}`, borderRadius:10, padding:"8px 12px", fontSize:12, boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ color:P.muted, marginBottom:4 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color:entry.color, fontWeight:700 }}>{entry.name}: {entry.value}</div>
      ))}
    </div>
  );
};
// ── nav items ─────────────────────────────────────────────────────
const NAV = [
  { id:"overview", label:"Overview",  icon:LayoutDashboard, color:P.orange },
  { id:"obras",    label:"Obras",     icon:Image,           color:P.blue   },
  { id:"artistas", label:"Artistas",  icon:Palette,         color:P.pink   },
  { id:"pedidos",  label:"Pedidos",   icon:ShoppingBag,     color:P.purple },
  { id:"reportes", label:"Reportes",  icon:BarChart2,       color:P.gray   },
];

// ── sidebar ───────────────────────────────────────────────────────
function Sidebar({ active, setActive }: { active:string; setActive:(v:string)=>void }) {
  return (
    <div style={{
      width:80, minHeight:"100vh", background:P.sidebar,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"20px 0", position:"sticky", top:0, height:"100vh", flexShrink:0,
    }}>
      {/* logo */}
      <div style={{
        width:38, height:38, borderRadius:11, background:P.orange,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:32, boxShadow:`0 4px 14px ${P.orange}50`,
      }}>
        <SparklesIcon style={{ width:20, height:20, color:"white" }} />
      </div>

      {/* nav */}
      <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1, alignItems:"center", width:"100%" }}>
        {NAV.map(({ id, label, icon:Icon, color }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setActive(id)}
              title={label}
              style={{
                width:"100%", border:"none", cursor:"pointer",
                background: on ? `${color}20` : "transparent",
                borderLeft:`3px solid ${on ? color : "transparent"}`,
                padding:"11px 0 9px",
                display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                transition:"all .15s",
              }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background="transparent"; }}
            >
              <Icon size={19} color={on ? color : "rgba(255,255,255,0.3)"} strokeWidth={on ? 2.2 : 1.6} />
              <span style={{
                fontSize:9, fontWeight: on ? 700 : 400, letterSpacing:"0.4px",
                textTransform:"uppercase",
                color: on ? color : "rgba(255,255,255,0.28)",
              }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* bottom icons */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, paddingBottom:8 }}>
        <button style={{ background:"transparent", border:"none", cursor:"pointer", padding:4 }}>
          <Settings size={17} color="rgba(255,255,255,0.25)" strokeWidth={1.6} />
        </button>
        <div style={{
          width:30, height:30, borderRadius:"50%", background:P.pink,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:800, color:"white", cursor:"pointer",
        }}>G</div>
      </div>
    </div>
  );
}

// ── topbar ────────────────────────────────────────────────────────
function Topbar() {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"13px 24px", background:P.surface,
      borderBottom:`1px solid ${P.border}`,
      position:"sticky", top:0, zIndex:30,
      fontFamily:"'Outfit',sans-serif",
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight:800, color:P.text, lineHeight:1 }}>Overview</div>
        <div style={{ fontSize:11.5, color:P.muted, marginTop:2 }}>Feb 17 – 24, 2026</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* search */}
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          background:P.bg, border:`1px solid ${P.border}`,
          borderRadius:8, padding:"7px 14px", cursor:"text",
        }}>
          <Search size={14} color={P.muted} strokeWidth={1.8} />
          <span style={{ fontSize:12.5, color:P.muted }}>Buscar…</span>
        </div>
        {/* bell */}
        <button style={{
          position:"relative", width:36, height:36, borderRadius:8,
          background:P.bg, border:`1px solid ${P.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
        }}>
          <Bell size={16} color={P.gray} strokeWidth={1.8} />
          <span style={{ position:"absolute", top:6, right:6, width:7, height:7, background:P.orange, borderRadius:"50%", border:`2px solid ${P.surface}` }} />
        </button>
        {/* period */}
        <div style={{ display:"flex", background:P.bg, border:`1px solid ${P.border}`, borderRadius:8, overflow:"hidden" }}>
          {["7d","30d","90d"].map((p,i) => (
            <button key={p} style={{
              padding:"6px 13px", border:"none", cursor:"pointer",
              background: i===0 ? P.orange : "transparent",
              color: i===0 ? "white" : P.muted,
              fontSize:12, fontWeight: i===0 ? 700 : 400,
              fontFamily:"'Outfit',sans-serif",
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── kpi cards ─────────────────────────────────────────────────────
function KpiCards() {
  const cards = [
    { value:"$93,400", label:"Ingresos",   delta:"+18%",   up:true,  accent:P.orange, Icon:CurrencyDollarIcon },
    { value:"35",      label:"Vendidas",   delta:"+4",     up:true,  accent:P.blue,   Icon:PhotoIcon          },
    { value:"138",     label:"Galería",    delta:"+9",     up:true,  accent:P.purple, Icon:UserGroupIcon      },
    { value:"8.2%",    label:"Conversión", delta:"−0.4%",  up:false, accent:P.gray,   Icon:ArrowTrendingUpIcon},
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
      {cards.map(({ value, label, delta, up, accent, Icon }) => (
        <div key={label} style={{
          background:P.surface, borderRadius:14,
          border:`1px solid ${P.border}`,
          padding:"20px 20px 18px", position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${accent}00)` }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <span style={{ fontSize:11, color:P.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>{label}</span>
            <div style={{ width:30, height:30, borderRadius:8, background:`${accent}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon style={{ width:16, height:16, color:accent }} />
            </div>
          </div>
          <div style={{ fontSize:32, fontWeight:900, color:P.text, letterSpacing:"-1px", lineHeight:1 }}>{value}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:10 }}>
            {up
              ? <TrendingUp size={13} color={P.orange} strokeWidth={2.5} />
              : <TrendingDown size={13} color={P.gray} strokeWidth={2.5} />
            }
            <span style={{
              fontSize:11.5, fontWeight:700,
              color: up ? P.orange : P.gray,
              background: up ? `${P.orange}12` : `${P.gray}12`,
              padding:"2px 8px", borderRadius:20,
            }}>{delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── stat strip ────────────────────────────────────────────────────
function StatStrip() {
  const items = [
    { label:"Favoritos",    value:"47",    color:P.pink,   Icon:Heart      },
    { label:"Visitas",      value:"1,284", color:P.blue,   Icon:Eye        },
    { label:"Pendientes",   value:"12",    color:P.orange, Icon:Clock      },
    { label:"Certificados", value:"8",     color:P.gold,   Icon:Award      },
    { label:"Usuarios",     value:"23",    color:P.purple, Icon:Users      },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:20 }}>
      {items.map(({ label, value, color, Icon }) => (
        <div key={label} style={{
          background:P.surface, borderRadius:12,
          border:`1px solid ${P.border}`,
          padding:"15px 18px",
          display:"flex", flexDirection:"column", gap:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:P.muted, fontWeight:500 }}>{label}</span>
            <div style={{ width:26, height:26, borderRadius:7, background:`${color}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={13} color={color} strokeWidth={2} />
            </div>
          </div>
          <span style={{ fontSize:22, fontWeight:900, color, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── charts row ────────────────────────────────────────────────────
function ChartsRow() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 220px 200px", gap:14, marginBottom:20 }}>
      {/* area chart */}
      <div style={{ background:P.surface, borderRadius:14, border:`1px solid ${P.border}`, padding:"22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:P.text }}>Ingresos & Obras</div>
          <div style={{ display:"flex", gap:14 }}>
            {[{c:P.orange,l:"Ingresos"},{c:P.blue,l:"Obras"}].map(({c,l}) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:P.muted }}>
                <span style={{ width:18, height:3, background:c, display:"inline-block", borderRadius:2 }} />{l}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <defs>
              <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.orange} stopOpacity={.18}/>
                <stop offset="100%" stopColor={P.orange} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.blue} stopOpacity={.15}/>
                <stop offset="100%" stopColor={P.blue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke={P.border} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="s" stroke="transparent" tick={{ fill:P.muted, fontSize:11 }} />
            <YAxis stroke="transparent" tick={{ fill:P.muted, fontSize:11 }} />
            <Tooltip content={<Tip/>} />
            <Area type="monotone" dataKey="v" name="Ingresos" stroke={P.orange} strokeWidth={2.5} fill="url(#gO)" dot={false} />
            <Area type="monotone" dataKey="o" name="Obras" stroke={P.blue} strokeWidth={2.5} fill="url(#gB)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* top artistas */}
      <div style={{ background:P.surface, borderRadius:14, border:`1px solid ${P.border}`, padding:"22px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:P.text, marginBottom:18 }}>Top Artistas</div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {artists.map(({ name, val, sub, color }, i) => (
            <div key={name} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                background:`${color}16`, color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:800,
              }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:P.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                <div style={{ fontSize:11, color:P.muted }}>{sub}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:800, color, flexShrink:0 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* técnicas */}
      <div style={{ background:P.surface, borderRadius:14, border:`1px solid ${P.border}`, padding:"22px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:P.text, marginBottom:18 }}>Técnicas</div>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          {techs.map(({ n, p, c }) => (
            <div key={n}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12.5, color:P.muted }}>{n}</span>
                <span style={{ fontSize:12.5, fontWeight:800, color:c }}>{p}%</span>
              </div>
              <div style={{ height:6, background:`${c}18`, borderRadius:6 }}>
                <div style={{ height:"100%", width:`${p}%`, borderRadius:6, background:c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── transactions ──────────────────────────────────────────────────
function TxTable() {
  return (
    <div style={{ background:P.surface, borderRadius:14, border:`1px solid ${P.border}`, padding:"22px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:700, color:P.text }}>Transacciones Recientes</div>
        <button style={{
          display:"flex", alignItems:"center", gap:5,
          background:`${P.orange}12`, border:`1px solid ${P.orange}30`,
          color:P.orange, fontSize:12.5, fontWeight:600,
          padding:"6px 14px", borderRadius:8, cursor:"pointer",
          fontFamily:"'Outfit',sans-serif",
        }}>
          Ver todo <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ borderBottom:`2px solid ${P.bg}` }}>
            {["Obra","Artista","Monto","Estado","Tiempo"].map(h => (
              <th key={h} style={{
                textAlign:"left", paddingBottom:10, paddingRight:14,
                fontSize:10.5, fontWeight:700, letterSpacing:"1px",
                textTransform:"uppercase", color:P.muted,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txs.map(({ obra, who, monto, tag, c, t }, i) => (
            <tr key={i}
              style={{ borderBottom: i < txs.length-1 ? `1px solid ${P.bg}` : "none", cursor:"default" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=P.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
            >
              <td style={{ padding:"11px 14px 11px 0", fontSize:13.5, fontWeight:600, color:P.text }}>{obra}</td>
              <td style={{ padding:"11px 14px 11px 0", fontSize:13, color:P.muted }}>{who}</td>
              <td style={{ padding:"11px 14px 11px 0", fontSize:14, fontWeight:800, color:P.text }}>{monto}</td>
              <td style={{ padding:"11px 14px 11px 0" }}>
                <span style={{ fontSize:12, padding:"4px 11px", borderRadius:20, fontWeight:700, background:`${c}15`, color:c }}>{tag}</span>
              </td>
              <td style={{ padding:"11px 0", fontSize:12, color:P.muted }}>{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── root ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [active, setActive] = useState("overview");
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:P.bg, fontFamily:"'Outfit',sans-serif", color:P.text }}>
      <Sidebar active={active} setActive={setActive} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <Topbar />
        <main style={{ flex:1, padding:"24px", overflowY:"auto" }}>
          <KpiCards />
          <StatStrip />
          <ChartsRow />
          <TxTable />
        </main>
      </div>
    </div>
  );
}