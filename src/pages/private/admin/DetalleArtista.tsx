// src/pages/private/admin/DetalleArtista.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Palette, Mail, Phone, Award, Edit2,
  ImageIcon, RefreshCw, Star, Check, Ban, Bell,
  BarChart2, Plus, Clock, CheckCircle, XCircle,
  Settings, LogOut, ShoppingBag, Users, LayoutDashboard,
  MapPin, ChevronRight,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", blue: "#79AAF5", green: "#4ADE80", red: "#F87171",
  bg: "#0f0c1a", surface: "rgba(18,12,32,0.9)",
  border: "rgba(255,255,255,0.08)", text: "#ffffff",
  muted: "rgba(255,255,255,0.45)", sidebar: "rgba(10,7,20,0.97)",
};

const AVATAR_COLORS = [C.orange, C.pink, C.purple, C.blue, C.gold];

const ESTADOS_ARTISTA: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  activo:    { label: "Activo",    color: C.green, icon: CheckCircle },
  pendiente: { label: "Pendiente", color: C.gold,  icon: Clock       },
  inactivo:  { label: "Inactivo",  color: C.muted, icon: XCircle     },
  rechazado: { label: "Rechazado", color: C.red,   icon: Ban         },
};

const ESTADOS_OBRA: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green },
  pendiente: { label: "Pendiente", color: C.gold  },
  rechazada: { label: "Rechazada", color: C.red   },
  agotada:   { label: "Agotada",   color: C.muted },
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, color:C.orange, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Palette,         color:C.blue,   path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           color:C.pink,   path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     color:C.purple, path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       color:C.muted,  path:"/admin"          },
];

// ── Tipos ──────────────────────────────────────────────────────
interface ObraItem {
  id_obra: number;
  titulo: string;
  estado: string;
  imagen_principal?: string;
  categoria_nombre?: string;
  precio_base?: number;
}

interface ArtistaData {
  id_artista: number;
  nombre_completo: string;
  nombre_artistico?: string;
  foto_perfil?: string;
  correo?: string;
  telefono?: string;
  matricula?: string;
  biografia?: string;
  estado: string;
  categoria_nombre?: string;
  porcentaje_comision?: number;
  obras?: ObraItem[];
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ navigate }: { navigate: (p: string) => void }) {
  const active   = "artistas";
  const userName = authService.getUserName?.() || "A";
  return (
    <div style={{ width:220, minHeight:"100vh", background:C.sidebar, borderRight:`1px solid ${C.border}`, backdropFilter:"blur(40px)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0, zIndex:40 }}>
      <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${C.orange}, ${C.pink})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${C.orange}40` }}>
            <Palette size={18} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.text, lineHeight:1 }}>Altar Studio</div>
            <div style={{ fontSize:10.5, color:C.muted, marginTop:2, letterSpacing:"0.04em" }}>Panel Admin</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 10px 10px" }}>Navegación</div>
        {NAV.map(({ id, label, icon:Icon, color, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => navigate(path)}
              style={{ width:"100%", border:"none", cursor:"pointer", background:on ? `${color}15` : "transparent", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, transition:"all .15s", position:"relative", fontFamily:"'Outfit', sans-serif" }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background="transparent"; }}
            >
              {on && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:3, borderRadius:"0 3px 3px 0", background:`linear-gradient(180deg, ${color}, ${color}80)` }} />}
              <div style={{ width:32, height:32, borderRadius:8, background:on ? `${color}20` : "rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={16} color={on ? color : "rgba(255,255,255,0.35)"} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize:13.5, fontWeight:on ? 700 : 500, color:on ? C.text : "rgba(255,255,255,0.45)" }}>{label}</span>
              {on && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:color }} />}
            </button>
          );
        })}
      </div>
      <div style={{ padding:"12px 10px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white" }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userName}</div>
            <div style={{ fontSize:11, color:C.muted }}>Administrador</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, padding:"8px 12px 0" }}>
          <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", borderRadius:8, border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", cursor:"pointer", fontSize:11.5, color:C.muted, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={() => { authService.logout(); navigate("/login"); }}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", borderRadius:8, border:`1px solid rgba(204,89,173,0.2)`, background:"rgba(204,89,173,0.06)", cursor:"pointer", fontSize:11.5, color:C.pink, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Aprobar/Rechazar ────────────────────────────────────
function ModalAprobacion({ artista, onConfirm, onCancel, saving }: {
  artista: ArtistaData;
  onConfirm: (a: "activo" | "rechazado") => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(8,5,18,0.82)", backdropFilter:"blur(10px)" }}>
      <div style={{ background:"rgba(18,12,32,0.99)", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:22, padding:"36px", maxWidth:460, width:"90%", boxShadow:"0 40px 80px rgba(0,0,0,0.7)", animation:"modalIn .25s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`${C.gold}18`, border:`1px solid ${C.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <Bell size={24} color={C.gold} strokeWidth={2} />
        </div>
        <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:6 }}>Revisar solicitud</div>
        <div style={{ fontSize:13.5, color:C.muted, marginBottom:24, lineHeight:1.7 }}>
          Decide si apruebas o rechazas la solicitud de <strong style={{ color:C.text }}>{artista.nombre_completo}</strong>.
          {artista.nombre_artistico && <> Nombre artístico: <span style={{ color:C.gold }}>✦ {artista.nombre_artistico}</span>.</>}
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.07)`, borderRadius:12, padding:"14px 16px", marginBottom:24 }}>
          {[
            { label:"Correo",    value:artista.correo           },
            { label:"Teléfono", value:artista.telefono || "—"  },
            { label:"Categoría",value:artista.categoria_nombre || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:"flex", gap:10, marginBottom:8, fontSize:13 }}>
              <span style={{ color:C.muted, minWidth:80, fontWeight:600 }}>{label}:</span>
              <span style={{ color:C.text }}>{value}</span>
            </div>
          ))}
          {artista.biografia && (
            <div style={{ marginTop:4, fontSize:12.5, color:C.muted, lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>
              {artista.biografia}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} disabled={saving} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:C.muted, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
            Cerrar
          </button>
          <button onClick={() => onConfirm("rechazado")} disabled={saving} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${C.red}30`, background:`${C.red}12`, color:C.red, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Ban size={14} /> Rechazar
            </span>
          </button>
          <button onClick={() => onConfirm("activo")} disabled={saving} style={{ flex:1.3, padding:"11px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${C.green}cc, #22c55e)`, color:"#000", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:`0 6px 20px ${C.green}30` }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {saving ? <RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Check size={14} />}
              Aprobar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function DetalleArtista() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [artista,    setArtista]    = useState<ArtistaData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [modalAprob, setModalAprob] = useState(false);
  const [saving,     setSaving]     = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/artistas/${id}`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
      const json = await res.json();
      if (json.success) setArtista(json.data as ArtistaData);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo(0, 0); cargar(); }, [id]);

  const handleAprobacion = async (accion: "activo" | "rechazado") => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/artistas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ ...artista, estado: accion }),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      setModalAprob(false);
      showToast(accion === "activo" ? "Artista aprobado correctamente" : "Artista rechazado", accion === "activo" ? "ok" : "warn");
      cargar();
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Outfit',sans-serif" }}>
      <Sidebar navigate={navigate} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:C.muted }}>
        <RefreshCw size={22} style={{ animation:"spin 1s linear infinite" }} /> Cargando artista…
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Not found ──
  if (!artista) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Outfit',sans-serif" }}>
      <Sidebar navigate={navigate} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, color:C.muted }}>
        <Users size={52} strokeWidth={1} style={{ opacity:.15 }} />
        <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Artista no encontrado</div>
        <button onClick={() => navigate("/admin/artistas")} style={{ padding:"10px 24px", borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
          Volver a artistas
        </button>
      </div>
    </div>
  );

  const color       = AVATAR_COLORS[artista.id_artista % AVATAR_COLORS.length];
  const initials    = artista.nombre_completo?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?";
  const estadoInfo  = ESTADOS_ARTISTA[artista.estado] || ESTADOS_ARTISTA.pendiente;
  const EstadoIcon  = estadoInfo.icon;
  const obras       = artista.obras || [];
  const esPendiente = artista.estado === "pendiente";

  const obraStats = {
    total:      obras.length,
    publicadas: obras.filter(o => o.estado === "publicada").length,
    pendientes: obras.filter(o => o.estado === "pendiente").length,
    rechazadas: obras.filter(o => o.estado === "rechazada").length,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Outfit',sans-serif", color:C.text, position:"relative" }}>
      <div style={{ position:"fixed", top:-100, right:-100, width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, ${color}10, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-100, left:240, width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      {modalAprob && <ModalAprobacion artista={artista} onConfirm={handleAprobacion} onCancel={() => setModalAprob(false)} saving={saving} />}

      <Sidebar navigate={navigate} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:1 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:"rgba(10,7,20,0.8)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:30 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => navigate("/admin/artistas")} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=C.text}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=C.muted}>
              <ArrowLeft size={14} strokeWidth={2} /> Artistas
            </button>
            <div style={{ width:1, height:20, background:C.border }} />
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Detalle de Artista</div>
              <div style={{ fontSize:11.5, color:C.muted }}>{artista.nombre_artistico || artista.nombre_completo}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {esPendiente && (
              <button onClick={() => setModalAprob(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:`1px solid ${C.gold}40`, background:`${C.gold}15`, color:C.gold, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", animation:"pulse 2s ease infinite" }}>
                <Bell size={14} /> Aprobar / Rechazar
              </button>
            )}
            <button onClick={() => navigate(`/admin/artistas/editar/${id}`)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:`0 4px 16px ${C.pink}30` }}>
              <Edit2 size={14} /> Editar Artista
            </button>
          </div>
        </div>

        <main style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Banner pendiente */}
          {esPendiente && (
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", marginBottom:24, background:`${C.gold}10`, border:`1px solid ${C.gold}30`, borderRadius:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${C.gold}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Bell size={18} color={C.gold} strokeWidth={2} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.gold }}>Solicitud pendiente de revisión</div>
                <div style={{ fontSize:12.5, color:C.muted, marginTop:2 }}>Este artista se registró y espera tu aprobación para publicar obras en la galería.</div>
              </div>
              <button onClick={() => setModalAprob(true)} style={{ padding:"8px 18px", borderRadius:8, background:`${C.gold}20`, border:`1px solid ${C.gold}40`, color:C.gold, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
                Revisar ahora
              </button>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>

            {/* Columna izquierda */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Perfil card */}
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden" }}>
                <div style={{ height:76, background:`linear-gradient(135deg, ${color}35, ${color}10)`, position:"relative" }}>
                  <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 25% 50%, ${color}20, transparent)` }} />
                </div>
                <div style={{ padding:"0 20px", marginTop:-38, position:"relative" }}>
                  <div style={{ width:68, height:68, borderRadius:16, border:`3px solid rgba(18,12,32,0.95)`, overflow:"hidden", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${color}40` }}>
                    {artista.foto_perfil
                      ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontSize:24, fontWeight:900, color }}>{initials}</span>
                    }
                  </div>
                </div>
                <div style={{ padding:"10px 20px 20px" }}>
                  <div style={{ fontSize:17, fontWeight:900, color:C.text, marginBottom:2 }}>{artista.nombre_completo}</div>
                  {artista.nombre_artistico && (
                    <div style={{ fontSize:13, color, fontWeight:600, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                      <Star size={10} color={C.gold} strokeWidth={2} fill={C.gold} /> {artista.nombre_artistico}
                    </div>
                  )}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, padding:"4px 10px", borderRadius:20, background:`${estadoInfo.color}15`, border:`1px solid ${estadoInfo.color}35`, color:estadoInfo.color, fontWeight:700 }}>
                      <EstadoIcon size={10} strokeWidth={2.5} /> {estadoInfo.label}
                    </span>
                    {artista.categoria_nombre && (
                      <span style={{ fontSize:11.5, padding:"4px 10px", borderRadius:20, background:`${C.blue}15`, border:`1px solid ${C.blue}25`, color:C.blue, fontWeight:600 }}>
                        {artista.categoria_nombre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats rápidos */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  { label:"Obras",    value:obraStats.total,                            color:C.orange },
                  { label:"Públicas", value:obraStats.publicadas,                       color:C.green  },
                  { label:"Comisión", value:`${artista.porcentaje_comision || 15}%`,    color:C.gold   },
                ].map(({ label, value, color:c }) => (
                  <div key={label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:19, fontWeight:900, color:c }}>{value}</div>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Contacto */}
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:14 }}>Información de contacto</div>
                {[
                  { icon:Mail,   label:"Correo",    value:artista.correo,     color:C.blue   },
                  { icon:Phone,  label:"Teléfono",  value:artista.telefono,   color:C.purple },
                  { icon:Award,  label:"Matrícula", value:artista.matricula,  color:C.gold   },
                  { icon:MapPin, label:"Ubicación", value:"Hidalgo, México",  color:C.orange },
                ].map(({ icon:Icon, label, value, color:c }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={13} color={c} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                      <div style={{ fontSize:12.5, color:value ? C.text : C.muted }}>{value || "No registrado"}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Biografía */}
              {artista.biografia && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:10 }}>Biografía</div>
                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.7)", lineHeight:1.85, margin:0 }}>{artista.biografia}</p>
                </div>
              )}

              {/* Acciones */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {esPendiente && (
                  <button onClick={() => setModalAprob(true)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.green}cc, #22c55e)`, color:"#000", fontWeight:800, fontSize:13.5, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:`0 6px 20px ${C.green}25` }}>
                    <Check size={15} /> Aprobar / Rechazar solicitud
                  </button>
                )}
                <button onClick={() => navigate(`/admin/artistas/editar/${id}`)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:12, border:`1px solid ${C.blue}30`, background:`${C.blue}10`, color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <Edit2 size={13} /> Editar información
                </button>
                <button onClick={() => navigate("/admin/obras/crear")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:12, border:`1px solid ${C.orange}30`, background:`${C.orange}10`, color:C.orange, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <Plus size={13} /> Nueva obra
                </button>
              </div>
            </div>

            {/* Columna derecha — Obras */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:`${C.orange}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Palette size={14} color={C.orange} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize:16, fontWeight:800, color:C.text }}>Obras del artista</span>
                  <span style={{ fontSize:12, padding:"2px 9px", borderRadius:20, background:`${C.orange}15`, color:C.orange, fontWeight:700 }}>{obraStats.total}</span>
                </div>
                <button onClick={() => navigate("/admin/obras/crear")} style={{ fontSize:13, color:C.orange, background:"transparent", border:"none", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4, fontFamily:"'Outfit',sans-serif" }}>
                  <Plus size={13} /> Nueva obra
                </button>
              </div>

              {obraStats.total > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
                  {[
                    { label:"Publicadas", value:obraStats.publicadas, color:C.green },
                    { label:"Pendientes", value:obraStats.pendientes, color:C.gold  },
                    { label:"Rechazadas", value:obraStats.rechazadas, color:C.red   },
                  ].map(({ label, value, color:c }) => (
                    <div key={label} style={{ background:C.surface, border:`1px solid ${c}18`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <BarChart2 size={16} color={c} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize:22, fontWeight:900, color:c }}>{value}</div>
                        <div style={{ fontSize:10.5, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {obraStats.total === 0 ? (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"64px 20px", textAlign:"center" }}>
                  <ImageIcon size={44} strokeWidth={1} color={C.muted} style={{ opacity:.18, marginBottom:16 }} />
                  <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>Este artista no tiene obras aún</div>
                  <div style={{ fontSize:13, color:C.muted, marginBottom:22 }}>
                    {esPendiente ? "Aprueba al artista primero para que pueda subir obras." : "Puedes agregar obras desde el módulo de obras."}
                  </div>
                  {!esPendiente && (
                    <button onClick={() => navigate("/admin/obras/crear")} style={{ padding:"10px 24px", borderRadius:10, background:`linear-gradient(135deg,${C.orange},${C.pink})`, color:"white", border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      + Agregar primera obra
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))", gap:14 }}>
                  {obras.map(obra => {
                    const est = ESTADOS_OBRA[obra.estado] || ESTADOS_OBRA.pendiente;
                    return (
                      <div key={obra.id_obra}
                        onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}
                        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all .2s" }}
                        onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-3px)"; el.style.borderColor=color; el.style.boxShadow=`0 8px 24px ${color}20`; }}
                        onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="none"; el.style.borderColor=C.border; el.style.boxShadow="none"; }}
                      >
                        <div style={{ height:130, background:"rgba(255,255,255,0.03)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                          {obra.imagen_principal
                            ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            : <ImageIcon size={28} color={C.muted} strokeWidth={1.2} style={{ opacity:.25 }} />
                          }
                          <div style={{ position:"absolute", top:8, right:8 }}>
                            <span style={{ fontSize:10.5, padding:"3px 9px", borderRadius:20, background:`${est.color}dd`, color:est.color===C.gold?"#000":"white", fontWeight:700 }}>{est.label}</span>
                          </div>
                        </div>
                        <div style={{ padding:"12px" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4 }}>{obra.titulo}</div>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                            <span style={{ fontSize:11, color:C.muted }}>{obra.categoria_nombre || "—"}</span>
                            {obra.precio_base && (
                              <span style={{ fontSize:12.5, fontWeight:800, color:C.orange }}>${Number(obra.precio_base).toLocaleString("es-MX")}</span>
                            )}
                          </div>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={e => { e.stopPropagation(); navigate(`/admin/obras/editar/${obra.id_obra}`); }} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px", borderRadius:7, border:`1px solid ${C.blue}25`, background:`${C.blue}10`, color:C.blue, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              <Edit2 size={11} /> Editar
                            </button>
                            <button onClick={e => { e.stopPropagation(); navigate("/catalogo"); }} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px", borderRadius:7, border:`1px solid ${C.purple}25`, background:`${C.purple}10`, color:C.purple, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              <ChevronRight size={11} /> Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(255,193,16,0.3)} 50%{box-shadow:0 0 0 6px rgba(255,193,16,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}