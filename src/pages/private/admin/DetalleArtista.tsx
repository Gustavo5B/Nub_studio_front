// src/pages/private/admin/DetalleArtista.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Palette, Mail, Phone, Award, Edit2,
  ImageIcon, RefreshCw, Star, Check, Ban, Bell,
  BarChart2, Clock, CheckCircle, XCircle,
  MapPin, ChevronRight, Users,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  red:      "#C4304A",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  card:     "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};

const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono', 'Fira Code', monospace";

const AVATAR_COLORS = [C.orange, C.pink, C.purple, C.blue, C.gold];

const ESTADOS_ARTISTA: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  activo:    { label: "Activo",    color: C.green,   icon: CheckCircle },
  pendiente: { label: "Pendiente", color: C.gold,    icon: Clock       },
  inactivo:  { label: "Inactivo",  color: C.creamMut,icon: XCircle     },
  rechazado: { label: "Rechazado", color: C.red,     icon: Ban         },
  suspendido:{ label: "Suspendido",color: C.pink,    icon: XCircle     },
};

const ESTADOS_OBRA: Record<string, { label: string; color: string }> = {
  aprobada:  { label: "Publicada", color: C.green },
  pendiente: { label: "Pendiente", color: C.gold  },
  rechazada: { label: "Rechazada", color: C.red   },
};

interface ObraItem {
  id_obra:          number;
  titulo:           string;
  estado:           string;
  imagen_principal?: string;
  categoria_nombre?: string;
  precio_base?:     number;
}

interface ArtistaData {
  id_artista:          number;
  nombre_completo:     string;
  nombre_artistico?:   string;
  foto_perfil?:        string;
  correo?:             string;
  telefono?:           string;
  matricula?:          string;
  biografia?:          string;
  estado:              string;
  categoria_nombre?:   string;
  porcentaje_comision?: number;
  obras?:              ObraItem[];
}

// ── Modal Aprobar / Rechazar ──────────────────────────────────────────────────
function ModalAprobacion({ artista, onConfirm, onCancel, saving }: {
  artista:   ArtistaData;
  onConfirm: (a: "activo" | "rechazado") => void;
  onCancel:  () => void;
  saving:    boolean;
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(20,18,30,0.45)", backdropFilter:"blur(6px)" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:"32px", maxWidth:460, width:"90%", boxShadow:"0 24px 60px rgba(0,0,0,0.14)", animation:"modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily:FB }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`${C.gold}18`, border:`1px solid ${C.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
          <Bell size={20} color={C.gold} strokeWidth={2} />
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:C.cream, marginBottom:5 }}>Revisar solicitud</div>
        <div style={{ fontSize:13.5, color:C.creamSub, marginBottom:22, lineHeight:1.7 }}>
          Decide si apruebas o rechazas la solicitud de <strong style={{ color:C.cream }}>{artista.nombre_completo}</strong>.
          {artista.nombre_artistico && <> Nombre artístico: <span style={{ color:C.gold }}>✦ {artista.nombre_artistico}</span>.</>}
        </div>
        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginBottom:22 }}>
          {[
            { label:"Correo",    value: artista.correo                  },
            { label:"Teléfono",  value: artista.telefono || "—"         },
            { label:"Categoría", value: artista.categoria_nombre || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:"flex", gap:10, marginBottom:8, fontSize:13 }}>
              <span style={{ color:C.creamMut, minWidth:80, fontWeight:600 }}>{label}:</span>
              <span style={{ color:C.cream }}>{value}</span>
            </div>
          ))}
          {artista.biografia && (
            <div style={{ marginTop:4, fontSize:12.5, color:C.creamSub, lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>
              {artista.biografia}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.creamSub, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB }}>
            Cerrar
          </button>
          <button onClick={() => onConfirm("rechazado")} disabled={saving}
            style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.red}30`, background:`${C.red}10`, color:C.red, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Ban size={13} /> Rechazar
            </span>
          </button>
          <button onClick={() => onConfirm("activo")} disabled={saving}
            style={{ flex:1.3, padding:"10px", borderRadius:9, border:"none", background:C.green, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:`0 4px 14px ${C.green}30` }}>
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {saving
                ? <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }} />
                : <Check size={13} />}
              Aprobar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
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
      const res = await fetch(`${API_URL}/api/artistas/${id}/estado`, {
        method:  "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${authService.getToken()}` },
        body: JSON.stringify({ estado: accion }),
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
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:C.creamMut, fontFamily:FB, fontSize:14 }}>
      <RefreshCw size={18} style={{ animation:"spin 1s linear infinite" }} color={C.purple} />
      Cargando artista…
    </div>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!artista) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, fontFamily:FB }}>
      <Users size={48} strokeWidth={1} color={C.creamMut} style={{ opacity:.4 }} />
      <div style={{ fontSize:17, fontWeight:700, color:C.cream }}>Artista no encontrado</div>
      <button onClick={() => navigate("/admin/artistas")}
        style={{ padding:"9px 22px", borderRadius:9, background:C.purple, color:"white", border:"none", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB }}>
        Volver a artistas
      </button>
    </div>
  );

  const avatarColor = AVATAR_COLORS[artista.id_artista % AVATAR_COLORS.length];
  const initials    = artista.nombre_completo?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?";
  const estadoInfo  = ESTADOS_ARTISTA[artista.estado] || ESTADOS_ARTISTA.pendiente;
  const EstadoIcon  = estadoInfo.icon;
  const obras       = artista.obras || [];
  const esPendiente = artista.estado === "pendiente";

  const obraStats = {
    total:      obras.length,
    publicadas: obras.filter(o => o.estado === "aprobada").length,
    pendientes: obras.filter(o => o.estado === "pendiente").length,
    rechazadas: obras.filter(o => o.estado === "rechazada").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {modalAprob && (
        <ModalAprobacion
          artista={artista}
          onConfirm={handleAprobacion}
          onCancel={() => setModalAprob(false)}
          saving={saving}
        />
      )}

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.card, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <button onClick={() => navigate("/admin/artistas")}
            style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:"none", cursor:"pointer", color:C.creamMut, fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:FB }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.orange}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <ArrowLeft size={13} strokeWidth={2} /> Artistas
          </button>
          <ChevronRight size={12} color={C.border} />
          <span style={{ fontSize:13, fontWeight:600, color:C.cream }}>{artista.nombre_artistico || artista.nombre_completo}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {esPendiente && (
            <button onClick={() => setModalAprob(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 15px", borderRadius:8, border:`1px solid ${C.gold}40`, background:`${C.gold}10`, color:C.gold, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB }}>
              <Bell size={13} /> Aprobar / Rechazar
            </button>
          )}
          <button onClick={() => navigate(`/admin/artistas/editar/${id}`)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 15px", borderRadius:8, border:"none", background:C.purple, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB, boxShadow:`0 2px 8px ${C.purple}30` }}>
            <Edit2 size={13} /> Editar Artista
          </button>
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, padding:"24px 28px 36px", background:C.bg, overflowY:"auto" }}>

        {/* Banner pendiente */}
        {esPendiente && (
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", marginBottom:22, background:`${C.gold}0D`, border:`1px solid ${C.gold}35`, borderRadius:12, animation:"fadeUp .3s ease both" }}>
            <div style={{ width:36, height:36, borderRadius:9, background:`${C.gold}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Bell size={17} color={C.gold} strokeWidth={2} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.gold, fontFamily:FB }}>Solicitud pendiente de revisión</div>
              <div style={{ fontSize:12.5, color:C.creamSub, marginTop:1, fontFamily:FB }}>Este artista espera tu aprobación para publicar obras en la galería.</div>
            </div>
            <button onClick={() => setModalAprob(true)}
              style={{ padding:"7px 16px", borderRadius:8, background:`${C.gold}18`, border:`1px solid ${C.gold}40`, color:C.gold, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB, whiteSpace:"nowrap" }}>
              Revisar ahora
            </button>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"290px 1fr", gap:20, alignItems:"start" }}>

          {/* ── Columna izquierda ─────────────────────────────────────────── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Perfil */}
            <div style={{ background:C.card, borderRadius:14, boxShadow:CS, overflow:"hidden", animation:"fadeUp .35s ease both" }}>
              <div style={{ height:64, background:`linear-gradient(135deg, ${avatarColor}22, ${avatarColor}08)`, borderBottom:`1px solid ${C.border}`, position:"relative" }}>
                <div style={{ position:"absolute", bottom:-28, left:20 }}>
                  <div style={{ width:56, height:56, borderRadius:14, border:`3px solid ${C.card}`, overflow:"hidden", background:`${avatarColor}18`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:CS }}>
                    {artista.foto_perfil
                      ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontSize:20, fontWeight:800, color:avatarColor, fontFamily:FB }}>{initials}</span>}
                  </div>
                </div>
              </div>
              <div style={{ padding:"38px 20px 18px" }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.cream, marginBottom:2, fontFamily:FB }}>{artista.nombre_completo}</div>
                {artista.nombre_artistico && (
                  <div style={{ fontSize:12.5, color:C.creamSub, fontWeight:500, marginBottom:10, display:"flex", alignItems:"center", gap:4, fontFamily:FB }}>
                    <Star size={9} color={C.gold} fill={C.gold} /> {artista.nombre_artistico}
                  </div>
                )}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, padding:"3px 10px", borderRadius:100, background:`${estadoInfo.color}12`, border:`1px solid ${estadoInfo.color}30`, color:estadoInfo.color, fontWeight:700, fontFamily:FB }}>
                    <EstadoIcon size={10} strokeWidth={2.5} /> {estadoInfo.label}
                  </span>
                  {artista.categoria_nombre && (
                    <span style={{ fontSize:11.5, padding:"3px 10px", borderRadius:100, background:`${C.blue}10`, border:`1px solid ${C.blue}22`, color:C.blue, fontWeight:600, fontFamily:FB }}>
                      {artista.categoria_nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, animation:"fadeUp .35s ease .05s both" }}>
              {[
                { label:"OBRAS",    value: obraStats.total,                         color: C.orange },
                { label:"PÚBLICAS", value: obraStats.publicadas,                    color: C.green  },
                { label:"COMISIÓN", value: `${artista.porcentaje_comision ?? 15}%`, color: C.gold   },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:C.card, borderRadius:10, boxShadow:CS, padding:"13px 8px", textAlign:"center", borderLeft:`3px solid ${color}` }}>
                  <div style={{ fontSize:20, fontWeight:700, color, fontFamily:FM, letterSpacing:"-0.02em" }}>{value}</div>
                  <div style={{ fontSize:9.5, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2, fontFamily:FB }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Contacto */}
            <div style={{ background:C.card, borderRadius:14, boxShadow:CS, padding:"18px 20px", animation:"fadeUp .35s ease .08s both" }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14, fontFamily:FB }}>Información de contacto</div>
              {[
                { icon:Mail,   label:"Correo",    value:artista.correo,    color:C.blue   },
                { icon:Phone,  label:"Teléfono",  value:artista.telefono,  color:C.purple },
                { icon:Award,  label:"Matrícula", value:artista.matricula, color:C.gold   },
                { icon:MapPin, label:"Ubicación", value:"Hidalgo, México", color:C.orange },
              ].map(({ icon:Icon, label, value, color }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:`${color}10`, border:`1px solid ${color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={13} color={color} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:FB }}>{label}</div>
                    <div style={{ fontSize:13, color:value ? C.cream : C.creamMut, fontWeight:value ? 500 : 400, fontFamily:FB }}>{value || "No registrado"}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Biografía */}
            {artista.biografia && (
              <div style={{ background:C.card, borderRadius:14, boxShadow:CS, padding:"18px 20px", animation:"fadeUp .35s ease .11s both" }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, fontFamily:FB }}>Biografía</div>
                <p style={{ fontSize:13.5, color:C.creamSub, lineHeight:1.8, margin:0, fontFamily:FB }}>{artista.biografia}</p>
              </div>
            )}

            {/* Acción editar */}
            <button onClick={() => navigate(`/admin/artistas/editar/${id}`)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.creamSub, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB, boxShadow:CS, animation:"fadeUp .35s ease .13s both" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.purple; (e.currentTarget as HTMLElement).style.color = C.purple; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
              <Edit2 size={13} /> Editar información
            </button>
          </div>

          {/* ── Columna derecha — Obras ───────────────────────────────────── */}
          <div style={{ animation:"fadeUp .35s ease .06s both" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${C.orange}12`, border:`1px solid ${C.orange}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Palette size={15} color={C.orange} strokeWidth={2} />
              </div>
              <span style={{ fontSize:15, fontWeight:700, color:C.cream, fontFamily:FB }}>Obras del artista</span>
              <span style={{ fontSize:12, padding:"2px 10px", borderRadius:100, background:`${C.orange}10`, border:`1px solid ${C.orange}22`, color:C.orange, fontWeight:700, fontFamily:FM }}>{obraStats.total}</span>
            </div>

            {/* Mini-stats (solo si hay obras) */}
            {obraStats.total > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
                {[
                  { label:"Publicadas", value:obraStats.publicadas, color:C.green  },
                  { label:"Pendientes", value:obraStats.pendientes, color:C.gold   },
                  { label:"Rechazadas", value:obraStats.rechazadas, color:C.red    },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:C.card, borderRadius:10, boxShadow:CS, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${color}10`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <BarChart2 size={14} color={color} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize:20, fontWeight:700, color, fontFamily:FM }}>{value}</div>
                      <div style={{ fontSize:10.5, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid de obras / estado vacío */}
            {obraStats.total === 0 ? (
              <div style={{ background:C.card, borderRadius:14, boxShadow:CS, padding:"56px 20px", textAlign:"center" }}>
                <ImageIcon size={40} strokeWidth={1} color={C.creamMut} style={{ opacity:.3, marginBottom:14 }} />
                <div style={{ fontSize:15, fontWeight:700, color:C.cream, marginBottom:6, fontFamily:FB }}>Este artista no tiene obras aún</div>
                <div style={{ fontSize:13, color:C.creamMut, fontFamily:FB }}>
                  {esPendiente
                    ? "Aprueba al artista primero para que pueda publicar obras."
                    : "Las obras del artista aparecerán aquí una vez que las suba."}
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                {obras.map(obra => {
                  const est = ESTADOS_OBRA[obra.estado] || { label: obra.estado, color: C.creamMut };
                  return (
                    <div key={obra.id_obra}
                      onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}
                      style={{ background:C.card, borderRadius:12, boxShadow:CS, overflow:"hidden", cursor:"pointer", transition:"all .18s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 6px 20px rgba(0,0,0,0.10)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform="none"; el.style.boxShadow=CS; }}
                    >
                      <div style={{ height:130, background:C.bg, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        {obra.imagen_principal
                          ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <ImageIcon size={26} color={C.creamMut} strokeWidth={1.2} style={{ opacity:.3 }} />}
                        <div style={{ position:"absolute", top:8, right:8 }}>
                          <span style={{ fontSize:10.5, padding:"3px 9px", borderRadius:100, background:`${est.color}18`, border:`1px solid ${est.color}38`, color:est.color, fontWeight:700, fontFamily:FB }}>{est.label}</span>
                        </div>
                      </div>
                      <div style={{ padding:"12px" }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3, fontFamily:FB }}>{obra.titulo}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{obra.categoria_nombre || "—"}</span>
                          {obra.precio_base && (
                            <span style={{ fontSize:12.5, fontWeight:700, color:C.orange, fontFamily:FM }}>${Number(obra.precio_base).toLocaleString("es-MX")}</span>
                          )}
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
