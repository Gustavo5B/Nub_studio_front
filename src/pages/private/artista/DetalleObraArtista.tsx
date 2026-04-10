// src/pages/private/artista/DetalleObraArtista.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Edit3, Eye, Package, TrendingUp,
  Award, Image, Tag, Calendar, Ruler, CheckCircle,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", green: "#0E8A50", red: "#C4304A",
  text: "#14121E", sub: "#5A5870", muted: "#9896A8",
  bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono','Fira Code',monospace";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const fmtFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

interface Obra {
  id_obra: number; titulo: string; slug: string;
  descripcion: string | null; historia: string | null;
  imagen_principal: string | null; imagenes: { id_imagen: number; url_imagen: string; es_principal: boolean }[];
  precio_base: number; estado: string; activa: boolean; visible: boolean;
  destacada: boolean; vistas: number; con_certificado: boolean; permite_marco: boolean;
  fecha_creacion: string; fecha_aprobacion: string | null; motivo_rechazo: string | null;
  anio_creacion: number | null; tecnica: string | null;
  dimensiones_alto: number | null; dimensiones_ancho: number | null;
  dimensiones_profundidad: number | null;
  categoria_nombre: string | null; nombre_coleccion?: string | null;
  etiquetas: { id_etiqueta: number; nombre: string }[];
  stock_actual: number; stock_reservado: number;
}

export default function DetalleObraArtista() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [obra,    setObra]    = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgSel,  setImgSel]  = useState<string>("");

  useEffect(() => { cargar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargar = async () => {
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/artista-portal/obra/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); navigate(-1 as any); return; }
      const data: Obra = await res.json();
      setObra(data);
      setImgSel(data.imagen_principal || "");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", gap: 14, flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap'); @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: C.orange, animation: "spin .8s linear infinite" }}/>
      <p style={{ color: C.muted, fontSize: 13, fontFamily: FB }}>Cargando obra...</p>
    </div>
  );

  if (!obra) return null;

  const stockDisponible = Math.max((obra.stock_actual || 0) - (obra.stock_reservado || 0), 0);
  const stockColor      = stockDisponible === 0 ? C.red : stockDisponible <= 2 ? C.gold : C.green;
  const stockLabel      = stockDisponible === 0 ? "Agotado" : stockDisponible === 1 ? "1 — última pieza" : `${stockDisponible} disponibles`;

  const badge = (() => {
    if (obra.estado === "publicada") return { label: "Publicada",   color: C.green, bg: `${C.green}14`,  border: `${C.green}35`  };
    if (obra.estado === "pendiente") return { label: "En revisión", color: C.gold,  bg: `${C.gold}14`,   border: `${C.gold}35`   };
    if (obra.estado === "rechazada") return { label: "Rechazada",   color: C.red,   bg: `${C.red}12`,    border: `${C.red}30`    };
    return { label: obra.estado, color: C.muted, bg: "#F3F2F8", border: C.border };
  })();

  const todasImg = [
    ...(obra.imagen_principal ? [{ id_imagen: 0, url_imagen: obra.imagen_principal, es_principal: true }] : []),
    ...(obra.imagenes || []).filter(i => i.url_imagen !== obra.imagen_principal),
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FB, padding: "36px 40px" }} className="artista-main-pad">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .doa-thumb { border-radius:8px; overflow:hidden; cursor:pointer; border:2px solid transparent; transition:border-color .18s, opacity .18s; opacity:.55; }
        .doa-thumb:hover { opacity:.85; }
        .doa-thumb.active { border-color:${C.orange}; opacity:1; }
        .doa-action-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; border:1px solid ${C.border}; background:#fff; color:${C.sub}; font-size:13px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .18s; }
        .doa-action-btn:hover { border-color:${C.orange}; color:${C.orange}; background:${C.orange}08; }
        .doa-action-btn.primary { background:${C.orange}; border-color:${C.orange}; color:#fff; }
        .doa-action-btn.primary:hover { opacity:.88; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <button onClick={() => navigate("/artista/mis-obras")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, fontFamily: FB, padding: 0, transition: "color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}
        >
          <ArrowLeft size={15} strokeWidth={2}/> Mis obras
        </button>
        <span style={{ color: C.border, fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: C.sub, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.titulo}</span>
      </div>

      {/* Layout principal: 2 columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Imagen principal */}
          <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: CS, overflow: "hidden" }}>
            <div style={{ position: "relative", height: 420, background: "#F3F2F8" }}>
              {imgSel
                ? <img src={imgSel} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🖼️</div>
              }
              {/* Estado badge sobre imagen */}
              <span style={{ position: "absolute", top: 16, left: 16, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 100, fontSize: 11, fontWeight: 800, color: badge.color, background: "rgba(255,255,255,.95)", border: `1px solid ${badge.border}`, backdropFilter: "blur(8px)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: badge.color }}/> {badge.label}
              </span>
              {obra.destacada && (
                <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.95)", border: `1px solid ${C.gold}50`, color: C.gold, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100 }}>⭐ Destacada</span>
              )}
            </div>

            {/* Thumbnails */}
            {todasImg.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                {todasImg.map(img => (
                  <div key={img.id_imagen} className={`doa-thumb${imgSel === img.url_imagen ? " active" : ""}`}
                    style={{ width: 64, height: 64 }}
                    onClick={() => setImgSel(img.url_imagen)}
                  >
                    <img src={img.url_imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descripción + Historia */}
          {(obra.descripcion || obra.historia) && (
            <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: CS, padding: "24px 28px" }}>
              {obra.descripcion && (
                <div style={{ marginBottom: obra.historia ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Image size={14} color={C.orange} strokeWidth={2}/>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Descripción</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, margin: 0 }}>{obra.descripcion}</p>
                </div>
              )}
              {obra.historia && (
                <div style={{ borderTop: obra.descripcion ? `1px solid ${C.border}` : "none", paddingTop: obra.descripcion ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Tag size={14} color={C.pink} strokeWidth={2}/>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Historia</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, margin: 0 }}>{obra.historia}</p>
                </div>
              )}
            </div>
          )}

          {/* Etiquetas */}
          {obra.etiquetas && obra.etiquetas.length > 0 && (
            <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: CS, padding: "20px 24px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Etiquetas</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {obra.etiquetas.map(e => (
                  <span key={e.id_etiqueta} style={{ fontSize: 12, fontWeight: 600, color: C.purple, background: `${C.purple}10`, border: `1px solid ${C.purple}25`, padding: "4px 13px", borderRadius: 100 }}>
                    {e.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>

          {/* Título + acciones */}
          <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: CS, padding: "24px 24px 20px" }}>
            {obra.categoria_nombre && (
              <span style={{ fontSize: 10, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: ".12em", display: "block", marginBottom: 8 }}>
                {obra.categoria_nombre}
              </span>
            )}
            <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: "0 0 6px", lineHeight: 1.15 }}>{obra.titulo}</h1>
            {obra.nombre_coleccion && (
              <p style={{ fontSize: 12, color: C.pink, margin: "0 0 14px", fontWeight: 600 }}>🗂 {obra.nombre_coleccion}</p>
            )}

            {/* Precio */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "16px 0 18px", padding: "14px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Precio base</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: C.orange, fontFamily: FM }}>{fmt(obra.precio_base)}</span>
            </div>

            {/* Botones acción */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="doa-action-btn primary" style={{ flex: 1 }} onClick={() => navigate(`/artista/editar-obra/${obra.id_obra}`)}>
                <Edit3 size={14} strokeWidth={2}/> Editar obra
              </button>
              {obra.estado === "publicada" && obra.slug && (
                <button className="doa-action-btn" onClick={() => window.open(`/obras/${obra.slug}`, "_blank")}>
                  <Eye size={14} strokeWidth={2}/> Ver pública
                </button>
              )}
            </div>

            {/* Aviso si rechazada */}
            {obra.estado === "rechazada" && obra.motivo_rechazo && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Motivo de rechazo</div>
                <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.6 }}>{obra.motivo_rechazo}</p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: CS, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Package size={15} color={C.orange} strokeWidth={2}/>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Inventario</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Total",      value: obra.stock_actual || 0,    color: C.text   },
                { label: "Reservado",  value: obra.stock_reservado || 0, color: C.gold   },
                { label: "Disponible", value: stockDisponible,            color: stockColor },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: FM, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: `${stockColor}10`, border: `1px solid ${stockColor}25`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: stockColor, flexShrink: 0 }}/>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: stockColor }}>{stockLabel}</span>
            </div>
          </div>

          {/* Métricas */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: CS, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <TrendingUp size={15} color={C.orange} strokeWidth={2}/>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Estadísticas</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Vistas totales",      value: obra.vistas || 0,                icon: <Eye size={13} color={C.muted} strokeWidth={2}/> },
                { label: "Fecha de creación",   value: fmtFecha(obra.fecha_creacion),    icon: <Calendar size={13} color={C.muted} strokeWidth={2}/> },
                { label: "Fecha de aprobación", value: obra.fecha_aprobacion ? fmtFecha(obra.fecha_aprobacion) : "Pendiente", icon: <CheckCircle size={13} color={C.muted} strokeWidth={2}/> },
              ].map(m => (
                <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.muted, fontSize: 12 }}>
                    {m.icon} {m.label}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, fontFamily: typeof m.value === "number" ? FM : FB }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles técnicos */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: CS, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Ruler size={15} color={C.orange} strokeWidth={2}/>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Detalles técnicos</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Técnica",      value: obra.tecnica        || "—" },
                { label: "Año",          value: obra.anio_creacion  ? String(obra.anio_creacion) : "—" },
                { label: "Dimensiones",  value: obra.dimensiones_alto && obra.dimensiones_ancho ? `${obra.dimensiones_alto} × ${obra.dimensiones_ancho} cm` : "—" },
                { label: "Marco",        value: obra.permite_marco    ? "Disponible" : "No" },
                { label: "Certificado",  value: obra.con_certificado ? "Incluido"   : "No" },
              ].map(d => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{d.label}</span>
                  <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          {(obra.permite_marco || obra.con_certificado) && (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: CS, padding: "16px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Award size={15} color={C.gold} strokeWidth={2}/>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Extras</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {obra.permite_marco    && <span style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, background: C.bg, border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: 100 }}>🖼 Enmarcable</span>}
                {obra.con_certificado && <span style={{ fontSize: 11.5, fontWeight: 600, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, padding: "5px 12px", borderRadius: 100 }}>📜 Certificado de autenticidad</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
