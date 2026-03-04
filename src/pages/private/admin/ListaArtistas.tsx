// src/pages/private/admin/ListaArtistas.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Settings, Search, RefreshCw, X, Eye, Edit2, Trash2,
  CheckCircle, Clock, XCircle, UserPlus, Phone, Mail,
  ChevronLeft, ChevronRight, AlertTriangle, Image as ImageIcon,
  Star, LogOut, Check, Ban, Bell, Layers,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

// ─────────────────────────────────────────────────────────────
// PALETA
// ─────────────────────────────────────────────────────────────
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
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(20,15,34,0.90)",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.20)",
  rowHover: "rgba(255,232,200,0.035)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface Artista {
  id_artista:          number;
  nombre_completo:     string;
  nombre_artistico?:   string;
  correo?:             string;
  telefono?:           string;
  foto_perfil?:        string;
  biografia?:          string;
  estado:              string;
  matricula?:          string;
  categoria_nombre?:   string;
  porcentaje_comision?:number;
  total_obras?:        number;
}

const ESTADOS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  activo:     { label: "Activo",     color: C.green,    icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: C.gold,     icon: Clock       },
  inactivo:   { label: "Inactivo",   color: C.creamMut, icon: XCircle     },
  rechazado:  { label: "Rechazado",  color: C.pink,     icon: Ban         },
  suspendido: { label: "Suspendido", color: C.magenta,  icon: XCircle     },
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, color:C.orange, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          color:C.blue,   path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           color:C.pink,   path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     color:C.gold,   path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       color:C.purple, path:"/admin"          },
];

// ─────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoA" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoA)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoA)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoA)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function Sidebar({ navigate, pendientes }: { navigate:(p:string)=>void; pendientes: number }) {
  const active   = "artistas";
  const userName = authService.getUserName?.() || "Admin";

  return (
    <div style={{ width:240, minHeight:"100vh", background:`linear-gradient(180deg,${C.panel} 0%,${C.bgDeep} 100%)`, borderRight:`1px solid ${C.borderBr}`, backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0, zIndex:40 }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${C.orange},${C.gold},${C.pink},${C.purple},${C.blue})`, flexShrink:0 }} />
      <div style={{ padding:"22px 22px 18px", borderBottom:`1px solid ${C.borderBr}`, flexShrink:0 }}>
        <div onClick={()=>navigate("/")} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", marginBottom:20 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.cream, lineHeight:1.1, fontFamily:FD, letterSpacing:"-0.02em" }}>Nu-B Studio</div>
            <div style={{ fontSize:10, color:C.orange, marginTop:4, letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:FB, fontWeight:700 }}>Panel Admin</div>
          </div>
        </div>
        <div style={{ background:`linear-gradient(135deg,rgba(118,78,49,0.20),rgba(255,132,14,0.08))`, border:`1px solid ${C.borderBr}`, borderRadius:14, padding:"13px 14px", display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"white", fontFamily:FB, boxShadow:`0 4px 14px ${C.pink}40` }}>
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
            <button key={id} onClick={()=>navigate(path)}
              style={{ width:"100%", border:on?`1px solid ${color}30`:"1px solid transparent", cursor:"pointer", background:on?`linear-gradient(135deg,${color}18,${color}08)`:"transparent", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, transition:"all .18s ease", position:"relative", fontFamily:FB }}
              onMouseEnter={e=>{ if(!on){ (e.currentTarget as HTMLElement).style.background="rgba(255,232,200,0.05)"; (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; }}}
              onMouseLeave={e=>{ if(!on){ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.borderColor="transparent"; }}}
            >
              {on && <div style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3, borderRadius:"0 3px 3px 0", background:`linear-gradient(180deg,${color},${color}70)`, boxShadow:`0 0 10px ${color}60` }} />}
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:on?`${color}22`:"rgba(255,232,200,0.06)", border:on?`1px solid ${color}30`:"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .18s" }}>
                <Icon size={17} color={on?color:C.creamMut} strokeWidth={on?2.2:1.8} />
              </div>
              <span style={{ fontSize:14.5, fontWeight:on?700:500, color:on?C.cream:C.creamSub, fontFamily:FB }}>{label}</span>
              {id === "artistas" && pendientes > 0 ? (
                <div style={{ marginLeft:"auto", minWidth:22, height:22, borderRadius:11, background:`linear-gradient(135deg,${C.gold},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:900, color:"#000", padding:"0 6px", boxShadow:`0 2px 10px ${C.gold}50` }}>{pendientes}</div>
              ) : on ? (
                <div style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 9px ${color}` }} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div style={{ padding:"14px 12px 20px", borderTop:`1px solid ${C.borderBr}`, flexShrink:0 }}>
        <div style={{ display:"flex", gap:6 }}>
          <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:10, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", cursor:"pointer", fontSize:12.5, color:C.creamSub, fontWeight:600, fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; (e.currentTarget as HTMLElement).style.color=C.cream; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border;   (e.currentTarget as HTMLElement).style.color=C.creamSub; }}
          ><Settings size={14} strokeWidth={1.8} /> Config</button>
          <button onClick={()=>{ authService.logout(); navigate("/login"); }} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:10, border:`1px solid ${C.pink}30`, background:`${C.pink}08`, cursor:"pointer", fontSize:12.5, color:C.pink, fontWeight:600, fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}18`}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}08`}
          ><LogOut size={14} strokeWidth={1.8} /> Salir</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL ELIMINAR
// ─────────────────────────────────────────────────────────────
function ModalEliminar({ artista, onConfirm, onCancel }: { artista:Artista; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(8,5,18,0.82)", backdropFilter:"blur(10px)" }}>
      <div style={{ background:"rgba(16,13,28,0.98)", border:`1px solid ${C.borderBr}`, borderRadius:22, padding:"34px", maxWidth:420, width:"90%", boxShadow:"0 40px 80px rgba(0,0,0,0.7)", backdropFilter:"blur(40px)", animation:"modalIn .25s cubic-bezier(0.16,1,0.3,1)", fontFamily:FB }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`${C.pink}18`, border:`1px solid ${C.pink}35`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, boxShadow:`0 4px 18px ${C.pink}25` }}>
          <AlertTriangle size={24} color={C.pink} strokeWidth={2} />
        </div>
        <div style={{ fontSize:20, fontWeight:900, color:C.cream, marginBottom:10, fontFamily:FD }}>¿Eliminar artista?</div>
        <div style={{ fontSize:14, color:C.creamSub, marginBottom:10, lineHeight:1.7, fontFamily:FB }}>
          Vas a eliminar a <strong style={{ color:C.cream }}>{artista?.nombre_completo}</strong>.
        </div>
        <div style={{ fontSize:13, color:C.creamMut, marginBottom:28, fontFamily:FB }}>Sus obras seguirán en el sistema.</div>
        <div style={{ height:1, background:`linear-gradient(90deg,${C.pink}30,transparent)`, marginBottom:22 }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"12px", borderRadius:11, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.04)", color:C.creamSub, fontWeight:600, fontSize:13.5, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; (e.currentTarget as HTMLElement).style.color=C.cream; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border;   (e.currentTarget as HTMLElement).style.color=C.creamSub; }}
          >Cancelar</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"12px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"white", fontWeight:700, fontSize:13.5, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 22px ${C.pink}38`, transition:"transform .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform="translateY(-1px)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform="translateY(0)"}
          >Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL APROBACIÓN
// ─────────────────────────────────────────────────────────────
function ModalAprobacion({ artista, onConfirm, onCancel }: { artista:Artista; onConfirm:(accion:"activo"|"rechazado")=>void; onCancel:()=>void }) {
  const infoRows: { label:string; value:string|undefined; icon:React.ElementType|null; color:string|null }[] = [
    { label:"Correo",    value:artista?.correo,                  icon:Mail,  color:C.blue   },
    { label:"Teléfono",  value:artista?.telefono || "—",         icon:Phone, color:C.purple },
    { label:"Categoría", value:artista?.categoria_nombre || "—", icon:Star,  color:C.gold   },
    { label:"Biografía", value:artista?.biografia,               icon:null,  color:null     },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(8,5,18,0.82)", backdropFilter:"blur(10px)" }}>
      <div style={{ background:"rgba(16,13,28,0.98)", border:`1px solid ${C.borderBr}`, borderRadius:22, padding:"36px", maxWidth:460, width:"90%", boxShadow:"0 40px 80px rgba(0,0,0,0.7)", backdropFilter:"blur(40px)", animation:"modalIn .25s cubic-bezier(0.16,1,0.3,1)", fontFamily:FB }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${C.gold}18`, border:`1px solid ${C.gold}35`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 18px ${C.gold}28` }}>
            <Bell size={24} color={C.gold} strokeWidth={2} />
          </div>
          <button onClick={onCancel} style={{ width:32, height:32, borderRadius:9, background:"rgba(255,232,200,0.05)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"border-color .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.borderHi}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}
          ><X size={14} color={C.creamMut} /></button>
        </div>

        <div style={{ fontSize:20, fontWeight:900, color:C.cream, marginBottom:6, fontFamily:FD }}>Solicitud de artista</div>
        <div style={{ fontSize:14, color:C.creamSub, marginBottom:22, lineHeight:1.7, fontFamily:FB }}>
          Revisa la solicitud de <strong style={{ color:C.cream }}>{artista?.nombre_completo}</strong>
          {artista?.nombre_artistico && <> (<span style={{ color:C.gold }}>✦ {artista.nombre_artistico}</span>)</>}
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,${C.gold}35,transparent)`, marginBottom:18 }} />

        <div style={{ background:"rgba(255,232,200,0.03)", border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", marginBottom:24 }}>
          {infoRows.map(({ label, value, icon:Icon, color }) => (
            <div key={label} style={{ display:"flex", gap:10, marginBottom:10, fontSize:13.5, lineHeight:1.6, alignItems:"flex-start" }}>
              <span style={{ color:C.creamMut, minWidth:84, fontWeight:600, fontFamily:FB, display:"flex", alignItems:"center", gap:5 }}>
                {Icon && color && <Icon size={11} color={color} strokeWidth={2} />}
                {label}:
              </span>
              <span style={{ color:C.creamSub, flex:1, overflow:"hidden", textOverflow:"ellipsis", fontFamily:FB }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"12px", borderRadius:11, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", color:C.creamSub, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.color=C.cream; (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.color=C.creamSub; (e.currentTarget as HTMLElement).style.borderColor=C.border; }}
          >Cerrar</button>
          <button onClick={()=>onConfirm("rechazado")} style={{ flex:1, padding:"12px", borderRadius:11, border:`1px solid ${C.pink}35`, background:`${C.pink}12`, color:C.pink, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}25`}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}12`}
          ><span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Ban size={14} /> Rechazar</span></button>
          <button onClick={()=>onConfirm("activo")} style={{ flex:1.3, padding:"12px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.green},#1aab67)`, color:"#000", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 22px ${C.green}35`, transition:"transform .15s, box-shadow .15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 10px 28px ${C.green}50`; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(0)";    (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 22px ${C.green}35`; }}
          ><span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Check size={14} /> Aprobar</span></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function ListaArtistas() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [artistas,      setArtistas]      = useState<Artista[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filtroEstado,  setFiltroEstado]  = useState("todos");
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [pendientes,    setPendientes]    = useState(0);
  const [modalEliminar, setModalEliminar] = useState<Artista|null>(null);
  const [modalAprob,    setModalAprob]    = useState<Artista|null>(null);

  const cargarArtistas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/artistas?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (json.success) {
        let data: Artista[] = json.data || [];
        setPendientes(data.filter(a => a.estado === "pendiente").length);
        if (filtroEstado !== "todos") data = data.filter(a => a.estado === filtroEstado);
        if (search.trim()) data = data.filter(a =>
          a.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
          a.nombre_artistico?.toLowerCase().includes(search.toLowerCase()) ||
          a.correo?.toLowerCase().includes(search.toLowerCase())
        );
        setArtistas(data);
        setTotal(json.pagination?.total || data.length);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch(err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  }, [page, filtroEstado, search, showToast]);

  useEffect(() => { cargarArtistas(); }, [cargarArtistas]);

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      const res = await fetch(`${API_URL}/api/artistas/${modalEliminar.id_artista}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      showToast("Artista eliminado correctamente", "ok");
      setModalEliminar(null);
      cargarArtistas();
    } catch(err) {
      showToast(handleNetworkError(err), "err");
    }
  };

  const handleAprobacion = async (accion: "activo" | "rechazado") => {
    if (!modalAprob) return;
    try {
      const res = await fetch(`${API_URL}/api/artistas/${modalAprob.id_artista}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ ...modalAprob, estado: accion }),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      showToast(accion === "activo" ? "Artista aprobado" : "Artista rechazado", accion === "activo" ? "ok" : "warn");
      setModalAprob(null);
      cargarArtistas();
    } catch(err) {
      showToast(handleNetworkError(err), "err");
    }
  };

  const handleToggleEstado = async (artista: Artista) => {
    if (artista.estado === "pendiente") { setModalAprob(artista); return; }
    const nuevoEstado = artista.estado === "activo" ? "inactivo" : "activo";
    try {
      const res = await fetch(`${API_URL}/api/artistas/${artista.id_artista}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ ...artista, estado: nuevoEstado }),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      cargarArtistas();
    } catch(err) {
      showToast(handleNetworkError(err), "err");
    }
  };

  const getInitials   = (nombre: string) => nombre?.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase() || "?";
  const avatarColors  = [C.orange, C.blue, C.pink, C.purple, C.gold];
  const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

  const FILTROS = [
    { key:"todos",     label:"Todos",      color:C.pink              },
    { key:"pendiente", label:"Pendientes", color:C.gold              },
    { key:"activo",    label:"Activos",    color:C.green             },
    { key:"inactivo",  label:"Inactivos",  color:C.creamMut as string},
    { key:"rechazado", label:"Rechazados", color:C.pink              },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:FB, color:C.cream, position:"relative" }}>
      <div style={{ position:"fixed", top:-140, right:-100, width:560, height:560, borderRadius:"50%", background:`radial-gradient(circle,${C.pink}09,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-120, left:180, width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}08,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"40%", right:"25%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${C.blue}06,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      {modalEliminar && <ModalEliminar artista={modalEliminar} onConfirm={handleEliminar} onCancel={()=>setModalEliminar(null)} />}
      {modalAprob    && <ModalAprobacion artista={modalAprob} onConfirm={handleAprobacion} onCancel={()=>setModalAprob(null)} />}

      <Sidebar navigate={navigate} pendientes={pendientes} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:1 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:64, background:"rgba(10,7,20,0.88)", borderBottom:`1px solid ${C.borderBr}`, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 13px", borderRadius:100, background:`linear-gradient(135deg,${C.pink}20,${C.purple}10)`, border:`1px solid ${C.pink}38`, fontSize:11, fontWeight:700, color:C.pink, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:FB }}>
              <Users size={11} /> Artistas
            </div>
            <ChevronRight size={13} color={C.creamMut} />
            <span style={{ fontSize:14, color:C.creamSub, fontFamily:FB, fontWeight:500 }}>Gestión</span>
            <span style={{ fontSize:12, padding:"3px 10px", borderRadius:100, background:`${C.pink}15`, border:`1px solid ${C.pink}30`, color:C.pink, fontWeight:700, fontFamily:FB }}>{total} artistas</span>
            {pendientes > 0 && (
              <span style={{ fontSize:12, padding:"3px 10px", borderRadius:100, background:`${C.gold}15`, border:`1px solid ${C.gold}38`, color:C.gold, fontWeight:700, fontFamily:FB, boxShadow:`0 0 10px ${C.gold}25` }}>
                ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={cargarArtistas} style={{ width:38, height:38, borderRadius:10, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=`${C.orange}50`}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}
            >
              <RefreshCw size={14} color={C.creamMut} strokeWidth={1.8} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
            </button>
            <button onClick={()=>navigate("/admin/artistas/crear")} style={{ display:"flex", alignItems:"center", gap:7, background:`linear-gradient(135deg,${C.pink},${C.purple})`, border:"none", color:"white", padding:"9px 18px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 22px ${C.pink}40`, transition:"transform .15s, box-shadow .15s" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 10px 30px ${C.pink}55`; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(0)";    (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 22px ${C.pink}40`; }}
            ><UserPlus size={15} strokeWidth={2.5} /> Nuevo Artista</button>
          </div>
        </div>

        <main style={{ flex:1, padding:"26px 32px", overflowY:"auto" }}>

          {/* Page header */}
          <div style={{ marginBottom:22, animation:"fadeUp .45s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <Star size={13} color={C.gold} fill={C.gold} />
              <span style={{ fontSize:11, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:FB }}>Comunidad creativa</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, margin:0, fontFamily:FD, color:C.cream, letterSpacing:"-0.02em" }}>
              Gestión de{" "}
              <span style={{ background:`linear-gradient(90deg,${C.pink},${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Artistas</span>
            </h1>
          </div>

          {/* Banner pendientes */}
          {pendientes > 0 && filtroEstado === "todos" && (
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", marginBottom:20, background:`linear-gradient(135deg,${C.gold}12,${C.orange}06)`, border:`1px solid ${C.gold}35`, borderRadius:16, animation:"fadeUp .5s ease .05s both" }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${C.gold}22`, border:`1px solid ${C.gold}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 14px ${C.gold}30` }}>
                <Bell size={19} color={C.gold} strokeWidth={2} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14.5, fontWeight:800, color:C.gold, fontFamily:FD, marginBottom:3 }}>
                  {pendientes} solicitud{pendientes > 1 ? "es" : ""} pendiente{pendientes > 1 ? "s" : ""} de aprobación
                </div>
                <div style={{ fontSize:12.5, color:C.creamSub, fontFamily:FB }}>
                  Haz clic en el badge <strong style={{ color:C.gold }}>Pendiente</strong> de cada artista para aprobar o rechazar
                </div>
              </div>
              <button onClick={()=>setFiltroEstado("pendiente")} style={{ padding:"8px 16px", borderRadius:10, background:`${C.gold}22`, border:`1px solid ${C.gold}45`, color:C.gold, fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:FB, whiteSpace:"nowrap", transition:"all .15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.gold}35`}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${C.gold}22`}
              >Ver pendientes →</button>
            </div>
          )}

          {/* Filtros */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:18, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center", animation:"fadeUp .5s ease .08s both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:220, background:"rgba(255,232,200,0.04)", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
              <Search size={14} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre, alias o correo…"
                style={{ border:"none", outline:"none", fontSize:13.5, color:C.cream, background:"transparent", width:"100%", fontFamily:FB }} />
              {search && (
                <button onClick={()=>setSearch("")} style={{ background:"transparent", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
                  <X size={13} color={C.creamMut} />
                </button>
              )}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {FILTROS.map(({ key, label, color }) => {
                const on  = filtroEstado === key;
                const cnt = key === "pendiente" ? pendientes : undefined;
                return (
                  <button key={key} onClick={()=>{ setFiltroEstado(key); setPage(1); }} style={{ padding:"8px 16px", borderRadius:100, display:"flex", alignItems:"center", gap:6, border:`1.5px solid ${on?`${color}55`:C.border}`, background:on?`${color}15`:"rgba(255,232,200,0.03)", color:on?color:C.creamSub, fontWeight:on?700:500, fontSize:12.5, cursor:"pointer", fontFamily:FB, transition:"all .15s", boxShadow:on?`0 2px 12px ${color}25`:"none" }}
                    onMouseEnter={e=>{ if(!on)(e.currentTarget as HTMLElement).style.borderColor=C.borderHi; }}
                    onMouseLeave={e=>{ if(!on)(e.currentTarget as HTMLElement).style.borderColor=C.border; }}
                  >
                    {label}
                    {cnt !== undefined && cnt > 0 && (
                      <span style={{ background:`linear-gradient(135deg,${C.gold},${C.orange})`, color:"#000", borderRadius:10, padding:"0 6px", fontSize:10, fontWeight:900 }}>{cnt}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden", backdropFilter:"blur(20px)", animation:"fadeUp .5s ease .12s both" }}>
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:240, color:C.creamMut, gap:12, fontSize:13.5, fontFamily:FB }}>
                <RefreshCw size={18} strokeWidth={1.8} style={{ animation:"spin 1s linear infinite", color:C.pink }} /> Cargando artistas…
              </div>
            ) : artistas.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:240, color:C.creamMut, gap:12 }}>
                <Users size={40} strokeWidth={1} style={{ opacity:0.18, color:C.pink }} />
                <div style={{ fontSize:14.5, fontFamily:FD, color:C.creamSub }}>No se encontraron artistas</div>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.borderBr}` }}>
                    {["Artista","Contacto","Categoría","Comisión","Obras","Estado","Acciones"].map((h,i)=>(
                      <th key={h} style={{ textAlign:"left", padding:"14px 16px", fontSize:10.5, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:C.creamMut, background:"rgba(255,232,200,0.025)", fontFamily:FB, borderRight:i<6?`1px solid ${C.border}`:"none" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {artistas.map((artista, i) => {
                    const estado      = ESTADOS[artista.estado] || ESTADOS.pendiente;
                    const EstadoIcon  = estado.icon;
                    const avatarCol   = getAvatarColor(artista.id_artista);
                    const esPendiente = artista.estado === "pendiente";
                    return (
                      <tr key={artista.id_artista}
                        style={{ borderBottom:i<artistas.length-1?`1px solid rgba(255,232,200,0.05)`:"none", transition:"background .12s", background:esPendiente?`${C.gold}06`:"transparent" }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=esPendiente?`${C.gold}10`:C.rowHover}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=esPendiente?`${C.gold}06`:"transparent"}
                      >
                        {/* Artista */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:artista.foto_perfil?"transparent":`${avatarCol}18`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${esPendiente?C.gold+"45":avatarCol+"35"}`, boxShadow:esPendiente?`0 0 10px ${C.gold}25`:`0 2px 10px ${avatarCol}18` }}>
                              {artista.foto_perfil
                                ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                                : <span style={{ fontSize:15, fontWeight:900, color:avatarCol, fontFamily:FB }}>{getInitials(artista.nombre_completo)}</span>
                              }
                            </div>
                            <div>
                              <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FB }}>{artista.nombre_completo}</div>
                              {artista.nombre_artistico && (
                                <div style={{ fontSize:11.5, color:C.gold, display:"flex", alignItems:"center", gap:4, marginTop:2, fontFamily:FB }}>
                                  <Star size={9} strokeWidth={2} fill={C.gold} color={C.gold} /> {artista.nombre_artistico}
                                </div>
                              )}
                              {artista.matricula && <div style={{ fontSize:10.5, color:C.creamMut, marginTop:2, fontFamily:FB }}>{artista.matricula}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            {artista.correo && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, color:C.creamSub, fontFamily:FB }}><Mail size={11} strokeWidth={1.8} color={C.blue}/><span style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{artista.correo}</span></div>}
                            {artista.telefono && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, color:C.creamSub, fontFamily:FB }}><Phone size={11} strokeWidth={1.8} color={C.purple}/> {artista.telefono}</div>}
                          </div>
                        </td>

                        {/* Categoría */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          {artista.categoria_nombre
                            ? <span style={{ fontSize:12, padding:"5px 12px", borderRadius:20, background:`${C.blue}15`, border:`1px solid ${C.blue}28`, color:C.blue, fontWeight:700, fontFamily:FB }}>{artista.categoria_nombre}</span>
                            : <span style={{ color:C.creamMut, fontSize:13 }}>—</span>
                          }
                        </td>

                        {/* Comisión */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:15, fontWeight:900, color:C.gold, fontFamily:FD }}>{artista.porcentaje_comision || 15}%</span>
                        </td>

                        {/* Obras */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13.5, color:C.creamSub, fontFamily:FB }}>
                            <ImageIcon size={13} color={C.purple} strokeWidth={1.8}/> {artista.total_obras || 0}
                          </div>
                        </td>

                        {/* Estado */}
                        <td style={{ padding:"14px 16px", borderRight:`1px solid ${C.border}` }}>
                          <button onClick={()=>handleToggleEstado(artista)}
                            title={esPendiente?"Clic para revisar solicitud":"Clic para activar/desactivar"}
                            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 13px", borderRadius:20, background:`${estado.color}15`, border:`1px solid ${estado.color}38`, color:estado.color, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:FB, transition:"all .15s", boxShadow:esPendiente?`0 0 12px ${C.gold}30`:estado.color===C.green?`0 0 10px ${C.green}25`:"none" }}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${estado.color}28`}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${estado.color}15`}
                          >
                            <EstadoIcon size={12} strokeWidth={2.5}/> {estado.label}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {esPendiente && (
                              <button onClick={()=>setModalAprob(artista)} title="Revisar solicitud"
                                style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8, background:`${C.gold}18`, border:`1px solid ${C.gold}38`, color:C.gold, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
                                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.gold}30`}
                                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${C.gold}18`}
                              ><Bell size={11}/> Revisar</button>
                            )}
                            {([
                              { icon:Eye,    color:C.purple, action:()=>navigate(`/admin/artistas/${artista.id_artista}`),        title:"Ver detalle" },
                              { icon:Edit2,  color:C.blue,   action:()=>navigate(`/admin/artistas/editar/${artista.id_artista}`), title:"Editar"      },
                              { icon:Trash2, color:C.pink,   action:()=>setModalEliminar(artista),                                title:"Eliminar"    },
                            ] as const).map(({ icon:Icon, color, action, title }) => (
                              <button key={title} onClick={action} title={title} style={{ width:34, height:34, borderRadius:9, background:`${color}12`, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .15s" }}
                                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${color}28`; (e.currentTarget as HTMLElement).style.borderColor=`${color}55`; (e.currentTarget as HTMLElement).style.boxShadow=`0 2px 12px ${color}30`; }}
                                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=`${color}12`; (e.currentTarget as HTMLElement).style.borderColor=`${color}25`; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}
                              ><Icon size={14} color={color} strokeWidth={2}/></button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:18, animation:"fadeUp .5s ease .15s both" }}>
              <div style={{ fontSize:13, color:C.creamMut, fontFamily:FB }}>
                Página <span style={{ color:C.cream, fontWeight:700 }}>{page}</span> de <span style={{ color:C.cream, fontWeight:700 }}>{totalPages}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ width:36, height:36, borderRadius:9, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", display:"flex", alignItems:"center", justifyContent:"center", cursor:page===1?"not-allowed":"pointer", opacity:page===1?0.35:1 }}>
                  <ChevronLeft size={15} color={C.creamMut} strokeWidth={2}/>
                </button>
                {Array.from({ length:Math.min(5,totalPages) },(_,i)=>{
                  const p = Math.max(1,Math.min(page-2,totalPages-4))+i;
                  const isActive = p === page;
                  return (
                    <button key={p} onClick={()=>setPage(p)} style={{ width:36, height:36, borderRadius:9, border:`1px solid ${isActive?`${C.pink}60`:C.border}`, background:isActive?`linear-gradient(135deg,${C.pink},${C.purple})`:"rgba(255,232,200,0.03)", color:isActive?"white":C.creamSub, fontWeight:isActive?800:500, fontSize:13.5, cursor:"pointer", fontFamily:FB, boxShadow:isActive?`0 4px 16px ${C.pink}40`:"none", transition:"all .15s" }}>{p}</button>
                  );
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{ width:36, height:36, borderRadius:9, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", display:"flex", alignItems:"center", justifyContent:"center", cursor:page===totalPages?"not-allowed":"pointer", opacity:page===totalPages?0.35:1 }}>
                  <ChevronRight size={15} color={C.creamMut} strokeWidth={2}/>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.22); font-family: ${FB}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}