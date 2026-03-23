// src/pages/private/admin/DetalleArtista.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Palette, Mail, Phone, Award, Edit2,
  ImageIcon, RefreshCw, Star, Check, Ban, Bell,
  BarChart2, Plus, Clock, CheckCircle, XCircle,
  MapPin, ChevronRight, Users,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Paleta unificada (AdminLayout) ────────────────────────────────────────────
const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  red:      "#F87171",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.35)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const AVATAR_COLORS = [C.orange, C.pink, C.purple, C.blue, C.gold];

const ESTADOS_ARTISTA: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  activo:    { label: "Activo",    color: C.green, icon: CheckCircle },
  pendiente: { label: "Pendiente", color: C.gold,  icon: Clock       },
  inactivo:  { label: "Inactivo",  color: C.creamMut, icon: XCircle  },
  rechazado: { label: "Rechazado", color: C.red,   icon: Ban         },
};

const ESTADOS_OBRA: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green },
  pendiente: { label: "Pendiente", color: C.gold  },
  rechazada: { label: "Rechazada", color: C.red   },
  agotada:   { label: "Agotada",   color: C.creamMut },
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
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

// ── Modal Aprobar/Rechazar ────────────────────────────────────────────────────
function ModalAprobacion({ artista, onConfirm, onCancel, saving }: {
  artista:   ArtistaData;
  onConfirm: (a: "activo" | "rechazado") => void;
  onCancel:  () => void;
  saving:    boolean;
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(8,5,18,0.82)", backdropFilter:"blur(10px)" }}>
      <div style={{ background:"rgba(18,12,32,0.99)", border:`1px solid ${C.borderBr}`, borderRadius:22, padding:"36px", maxWidth:460, width:"90%", boxShadow:"0 40px 80px rgba(0,0,0,0.7)", animation:"modalIn .25s cubic-bezier(0.16,1,0.3,1)", fontFamily:FB }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`${C.gold}18`, border:`1px solid ${C.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <Bell size={24} color={C.gold} strokeWidth={2} />
        </div>
        <div style={{ fontSize:20, fontWeight:900, color:C.cream, marginBottom:6, fontFamily:FD }}>Revisar solicitud</div>
        <div style={{ fontSize:13.5, color:C.creamMut, marginBottom:24, lineHeight:1.7 }}>
          Decide si apruebas o rechazas la solicitud de <strong style={{ color:C.cream }}>{artista.nombre_completo}</strong>.
          {artista.nombre_artistico && <> Nombre artístico: <span style={{ color:C.gold }}>✦ {artista.nombre_artistico}</span>.</>}
        </div>
        <div style={{ background:"rgba(255,232,200,0.03)", border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:24 }}>
          {[
            { label:"Correo",    value: artista.correo                },
            { label:"Teléfono",  value: artista.telefono || "—"       },
            { label:"Categoría", value: artista.categoria_nombre || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:"flex", gap:10, marginBottom:8, fontSize:13 }}>
              <span style={{ color:C.creamMut, minWidth:80, fontWeight:600 }}>{label}:</span>
              <span style={{ color:C.cream }}>{value}</span>
            </div>
          ))}
          {artista.biografia && (
            <div style={{ marginTop:4, fontSize:12.5, color:C.creamMut, lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>
              {artista.biografia}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${C.border}`, background:"rgba(255,232,200,0.03)", color:C.creamMut, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB }}>
            Cerrar
          </button>
          <button onClick={() => onConfirm("rechazado")} disabled={saving}
            style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${C.red}30`, background:`${C.red}12`, color:C.red, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Ban size={14} /> Rechazar
            </span>
          </button>
          <button onClick={() => onConfirm("activo")} disabled={saving}
            style={{ flex:1.3, padding:"11px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${C.green}cc, #22c55e)`, color:"#000", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 20px ${C.green}30` }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {saving
                ? <RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }} />
                : <Check size={14} />}
              Aprobar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
// ✅ Sin sidebar propio — AdminLayout lo provee via <Outlet />
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
  useEffect(() => { globalThis.scrollTo(0, 0); cargar(); }, [id]);

  const handleAprobacion = async (accion: "activo" | "rechazado") => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/artistas/${id}`, {
        method:  "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${authService.getToken()}` },
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <div style={{ height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}` }} />
      <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:C.creamMut, fontFamily:FB }}>
        <RefreshCw size={20} style={{ animation:"spin 1s linear infinite" }} color={C.purple} />
        Cargando artista…
      </main>
    </>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!artista) return (
    <>
      <div style={{ height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}` }} />
      <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, color:C.creamMut, fontFamily:FB }}>
        <Users size={52} strokeWidth={1} style={{ opacity:.15 }} />
        <div style={{ fontSize:18, fontWeight:700, color:C.cream, fontFamily:FD }}>Artista no encontrado</div>
        <button onClick={() => navigate("/admin/artistas")}
          style={{ padding:"10px 24px", borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:FB }}>
          Volver a artistas
        </button>
      </main>
    </>
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
    <>
      {modalAprob && (
        <ModalAprobacion
          artista={artista}
          onConfirm={handleAprobacion}
          onCancel={() => setModalAprob(false)}
          saving={saving}
        />
      )}

      {/* TOPBAR — height:56, C.bgDeep sólido */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => navigate("/admin/artistas")}
            style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:C.creamMut, fontSize:11.5, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", transition:"color .15s", fontFamily:FB }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.orange}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <ArrowLeft size={13} strokeWidth={2} /> Admin
          </button>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase" }}>Artistas</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize:13, color:C.creamSub }}>{artista.nombre_artistico || artista.nombre_completo}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {esPendiente && (
            <button onClick={() => setModalAprob(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:9, border:`1px solid ${C.gold}40`, background:`${C.gold}12`, color:C.gold, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FB }}>
              <Bell size={14} /> Aprobar / Rechazar
            </button>
          )}
          <button onClick={() => navigate(`/admin/artistas/editar/${id}`)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FB, boxShadow:`0 4px 16px ${C.pink}25` }}>
            <Edit2 size={14} /> Editar Artista
          </button>
        </div>
      </div>

      <main style={{ flex:1, padding:"24px 28px 32px", overflowY:"auto" }}>

        {/* Banner pendiente */}
        {esPendiente && (
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", marginBottom:24, background:`${C.gold}0D`, border:`1px solid ${C.gold}30`, borderRadius:14 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${C.gold}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Bell size={18} color={C.gold} strokeWidth={2} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.gold, fontFamily:FB }}>Solicitud pendiente de revisión</div>
              <div style={{ fontSize:12.5, color:C.creamMut, marginTop:2, fontFamily:FB }}>Este artista se registró y espera tu aprobación para publicar obras en la galería.</div>
            </div>
            <button onClick={() => setModalAprob(true)}
              style={{ padding:"8px 18px", borderRadius:8, background:`${C.gold}18`, border:`1px solid ${C.gold}40`, color:C.gold, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FB, whiteSpace:"nowrap" }}>
              Revisar ahora
            </button>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>

          {/* ── Columna izquierda ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Perfil */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden", position:"relative" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${color}50,transparent)` }} />
              <div style={{ height:76, background:`linear-gradient(135deg, ${color}30, ${color}10)` }} />
              <div style={{ padding:"0 20px", marginTop:-38, position:"relative" }}>
                <div style={{ width:68, height:68, borderRadius:16, border:`3px solid ${C.bg}`, overflow:"hidden", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${color}35` }}>
                  {artista.foto_perfil
                    ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <span style={{ fontSize:24, fontWeight:900, color, fontFamily:FD }}>{initials}</span>}
                </div>
              </div>
              <div style={{ padding:"10px 20px 20px" }}>
                <div style={{ fontSize:17, fontWeight:900, color:C.cream, marginBottom:2, fontFamily:FD }}>{artista.nombre_completo}</div>
                {artista.nombre_artistico && (
                  <div style={{ fontSize:13, color, fontWeight:600, marginBottom:10, display:"flex", alignItems:"center", gap:5, fontFamily:FB }}>
                    <Star size={10} color={C.gold} strokeWidth={2} fill={C.gold} /> {artista.nombre_artistico}
                  </div>
                )}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, padding:"4px 10px", borderRadius:100, background:`${estadoInfo.color}14`, border:`1px solid ${estadoInfo.color}35`, color:estadoInfo.color, fontWeight:700, fontFamily:FB }}>
                    <EstadoIcon size={10} strokeWidth={2.5} /> {estadoInfo.label}
                  </span>
                  {artista.categoria_nombre && (
                    <span style={{ fontSize:11.5, padding:"4px 10px", borderRadius:100, background:`${C.blue}14`, border:`1px solid ${C.blue}25`, color:C.blue, fontWeight:600, fontFamily:FB }}>
                      {artista.categoria_nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Obras",    value: obraStats.total,                          color: C.orange },
                { label:"Públicas", value: obraStats.publicadas,                     color: C.green  },
                { label:"Comisión", value: `${artista.porcentaje_comision || 15}%`,  color: C.gold   },
              ].map(({ label, value, color: c }) => (
                <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:19, fontWeight:900, color:c, fontFamily:FD }}>{value}</div>
                  <div style={{ fontSize:10, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginTop:2, fontFamily:FB }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Contacto */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:14, fontFamily:FB }}>Información de contacto</div>
              {[
                { icon:Mail,   label:"Correo",    value:artista.correo,    color:C.blue   },
                { icon:Phone,  label:"Teléfono",  value:artista.telefono,  color:C.purple },
                { icon:Award,  label:"Matrícula", value:artista.matricula, color:C.gold   },
                { icon:MapPin, label:"Ubicación", value:"Hidalgo, México", color:C.orange },
              ].map(({ icon:Icon, label, value, color:c }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:`${c}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={13} color={c} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", fontFamily:FB }}>{label}</div>
                    <div style={{ fontSize:12.5, color:value ? C.creamSub : C.creamMut, fontFamily:FB }}>{value || "No registrado"}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Biografía */}
            {artista.biografia && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:10, fontFamily:FB }}>Biografía</div>
                <p style={{ fontSize:13.5, color:C.creamSub, lineHeight:1.85, margin:0, fontFamily:FB }}>{artista.biografia}</p>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {esPendiente && (
                <button onClick={() => setModalAprob(true)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.green}cc,#22c55e)`, color:"#000", fontWeight:800, fontSize:13.5, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 20px ${C.green}25` }}>
                  <Check size={15} /> Aprobar / Rechazar solicitud
                </button>
              )}
              <button onClick={() => navigate(`/admin/artistas/editar/${id}`)}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:12, border:`1px solid ${C.blue}28`, background:`${C.blue}0D`, color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB }}>
                <Edit2 size={13} /> Editar información
              </button>
              <button onClick={() => navigate("/admin/obras/crear")}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:12, border:`1px solid ${C.orange}28`, background:`${C.orange}0D`, color:C.orange, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB }}>
                <Plus size={13} /> Nueva obra
              </button>
            </div>
          </div>

          {/* ── Columna derecha — Obras ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${C.orange}16`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Palette size={14} color={C.orange} strokeWidth={2} />
                </div>
                <span style={{ fontSize:16, fontWeight:800, color:C.cream, fontFamily:FD }}>Obras del artista</span>
                <span style={{ fontSize:12, padding:"2px 9px", borderRadius:100, background:`${C.orange}14`, border:`1px solid ${C.orange}28`, color:C.orange, fontWeight:700, fontFamily:FB }}>{obraStats.total}</span>
              </div>
              <button onClick={() => navigate("/admin/obras/crear")}
                style={{ fontSize:13, color:C.orange, background:"transparent", border:"none", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4, fontFamily:FB }}>
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
                  <div key={label} style={{ background:C.card, border:`1px solid ${c}18`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${c}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <BarChart2 size={16} color={c} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize:22, fontWeight:900, color:c, fontFamily:FD }}>{value}</div>
                      <div style={{ fontSize:10.5, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", fontFamily:FB }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {obraStats.total === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"64px 20px", textAlign:"center" }}>
                <ImageIcon size={44} strokeWidth={1} color={C.creamMut} style={{ opacity:.18, marginBottom:16 }} />
                <div style={{ fontSize:16, fontWeight:700, color:C.cream, marginBottom:6, fontFamily:FD }}>Este artista no tiene obras aún</div>
                <div style={{ fontSize:13, color:C.creamMut, marginBottom:22, fontFamily:FB }}>
                  {esPendiente ? "Aprueba al artista primero para que pueda subir obras." : "Puedes agregar obras desde el módulo de obras."}
                </div>
                {!esPendiente && (
                  <button onClick={() => navigate("/admin/obras/crear")}
                    style={{ padding:"10px 24px", borderRadius:10, background:`linear-gradient(135deg,${C.orange},${C.pink})`, color:"white", border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB }}>
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
                      style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all .2s" }}
                      onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-3px)"; el.style.borderColor=color; el.style.boxShadow=`0 8px 24px ${color}20`; }}
                      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="none"; el.style.borderColor=C.border; el.style.boxShadow="none"; }}
                    >
                      <div style={{ height:130, background:"rgba(255,232,200,0.03)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        {obra.imagen_principal
                          ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <ImageIcon size={28} color={C.creamMut} strokeWidth={1.2} style={{ opacity:.25 }} />}
                        <div style={{ position:"absolute", top:8, right:8 }}>
                          <span style={{ fontSize:10.5, padding:"3px 9px", borderRadius:100, background:`${est.color}22`, border:`1px solid ${est.color}45`, color:est.color, fontWeight:700, fontFamily:FB }}>{est.label}</span>
                        </div>
                      </div>
                      <div style={{ padding:"12px" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4, fontFamily:FB }}>{obra.titulo}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                          <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{obra.categoria_nombre || "—"}</span>
                          {obra.precio_base && (
                            <span style={{ fontSize:12.5, fontWeight:800, color:C.orange, fontFamily:FD }}>${Number(obra.precio_base).toLocaleString("es-MX")}</span>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={e => { e.stopPropagation(); navigate(`/admin/obras/editar/${obra.id_obra}`); }}
                            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px", borderRadius:7, border:`1px solid ${C.blue}25`, background:`${C.blue}0D`, color:C.blue, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FB }}>
                            <Edit2 size={11} /> Editar
                          </button>
                          <button onClick={e => { e.stopPropagation(); navigate("/catalogo"); }}
                            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px", borderRadius:7, border:`1px solid ${C.purple}25`, background:`${C.purple}0D`, color:C.purple, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FB }}>
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
    </>
  );
}