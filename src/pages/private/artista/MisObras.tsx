// src/pages/private/artista/MisObras.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

interface Obra {
  id_obra: number; titulo: string; slug: string; descripcion: string;
  imagen_principal: string; precio_base: number;
  estado: "pendiente" | "publicada" | "rechazada" | "agotada";
  activa: boolean; visible: boolean; destacada: boolean; vistas: number;
  fecha_creacion: string; fecha_aprobacion: string | null;
  motivo_rechazo: string | null; anio_creacion: number | null;
  tecnica: string | null; permite_marco: boolean; con_certificado: boolean;
  categoria: string | null; nombre_coleccion: string | null;
  stock_actual?: number; stock_reservado?: number;
}
interface Stats { total: number; publicadas: number; pendientes: number; rechazadas: number; }
type Filtro = "todas" | "pendiente" | "publicada" | "rechazada";

const C = {
  orange: "#E8640C", pink: "#A83B90", gold: "#A87006",
  card: "#FFFFFF", border: "#E6E4EF", bg: "#F9F8FC",
  text: "#14121E", sub: "#5A5870", muted: "#9896A8",
  green: "#0E8A50", red: "#C4304A",
};
const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const CS2 = "0 8px 24px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.06)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono','Fira Code',monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const fmtFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default function MisObras() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [obras,   setObras]   = useState<Obra[]>([]);
  const [stats,   setStats]   = useState<Stats>({ total: 0, publicadas: 0, pendientes: 0, rechazadas: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState<Filtro>("todas");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/artista-portal/mis-obras`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { showToast("Error al cargar las obras", "err"); return; }
      const data = await res.json();
      setObras(data.obras || []);
      const s = data.stats || {};
      setStats({ total: s.total || 0, publicadas: s.publicadas || 0, pendientes: s.pendientes ?? 0, rechazadas: s.rechazadas || 0 });
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  };

  const obrasFiltradas = filtro === "todas" ? obras : obras.filter(o => o.estado === filtro);

  const getBadge = (estado: string) => {
    if (estado === "publicada") return { label: "Publicada",   bg: `${C.green}14`,  border: `${C.green}35`,  color: C.green };
    if (estado === "pendiente") return { label: "En revisión", bg: `${C.gold}14`,   border: `${C.gold}35`,   color: C.gold  };
    if (estado === "rechazada") return { label: "Rechazada",   bg: `${C.red}12`,    border: `${C.red}30`,    color: C.red   };
    if (estado === "agotada")   return { label: "Agotada",     bg: `${C.muted}12`,  border: `${C.muted}30`,  color: C.muted };
    return { label: estado, bg: "#F3F2F8", border: C.border, color: C.muted };
  };

  const getStockInfo = (obra: Obra) => {
    if (obra.stock_actual === undefined) return null;
    const disponible = Math.max((obra.stock_actual || 0) - (obra.stock_reservado || 0), 0);
    if (disponible === 0) return { label: "Agotado",       color: C.red,   bg: `${C.red}10`   };
    if (disponible <= 2)  return { label: `${disponible} última${disponible > 1 ? "s" : ""}`, color: C.gold, bg: `${C.gold}10` };
    return { label: `${disponible} disponibles`, color: C.green, bg: `${C.green}10` };
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13, fontFamily: FB }}>Cargando tus obras...</p>
    </div>
  );

  return (
    <div className="mo-wrap" style={{ padding: "36px 40px", fontFamily: FB, background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .mo-card { background:#fff; border:1px solid ${C.border}; border-radius:18px; overflow:hidden;
          transition:transform .22s, box-shadow .22s; box-shadow:${CS};
          animation: fadeUp .28s ease both; }
        .mo-card:hover { transform:translateY(-4px); box-shadow:${CS2}; }
        .mo-card:hover .mo-card-img img { transform:scale(1.06); }
        .mo-card-img img { transition:transform .5s cubic-bezier(.2,0,0,1); }

        .mo-btn { display:inline-flex; align-items:center; justify-content:center; gap:5px;
          padding:7px 14px; border-radius:8px; border:1px solid ${C.border}; background:#F3F2F8;
          color:${C.sub}; font-size:12px; font-weight:600; cursor:pointer;
          font-family:'Outfit',sans-serif; transition:all .15s; white-space:nowrap; }
        .mo-btn:hover { background:${C.orange}; border-color:${C.orange}; color:#fff; }

        /* Con sidebar (901–1100px) */
        @media (min-width: 901px) and (max-width: 1100px) {
          .mo-wrap { padding:28px 28px !important; }
          .mo-kpi  { grid-template-columns:repeat(2,1fr) !important; gap:12px !important; }
        }
        /* Sin sidebar (≤900px) — ancho completo */
        @media (max-width: 900px) {
          .mo-wrap { padding:24px 20px !important; }
          .mo-kpi  { grid-template-columns:repeat(4,1fr) !important; gap:12px !important; }
        }
        /* Tablet (≤768px) */
        @media (max-width: 768px) {
          .mo-wrap   { padding:20px 16px !important; }
          .mo-kpi    { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
          .mo-header { flex-direction:column !important; align-items:flex-start !important; }
          .mo-header > button { width:100% !important; }
          .mo-grid   { grid-template-columns:repeat(auto-fill,minmax(200px,1fr)) !important; gap:14px !important; }
        }
        /* Móvil (≤480px) */
        @media (max-width: 480px) {
          .mo-wrap { padding:16px 12px !important; }
          .mo-kpi  { gap:8px !important; }
          .mo-kpi > div { padding:14px !important; }
          .mo-grid { grid-template-columns:1fr 1fr !important; gap:10px !important; }
        }
        /* Móvil muy pequeño (≤360px) */
        @media (max-width: 360px) {
          .mo-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="mo-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 6px" }}>✦ Portal del Artista</p>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: "0 0 4px", lineHeight: 1.1 }}>Mis Obras</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{stats.total} obra{stats.total !== 1 ? "s" : ""} en tu catálogo</p>
        </div>
        <button onClick={() => navigate("/artista/nueva-obra")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, background: C.orange, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px ${C.orange}40`, flexShrink: 0 }}>
          + Nueva obra
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="mo-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "TOTAL OBRAS",  value: stats.total,      color: C.orange },
          { label: "PUBLICADAS",   value: stats.publicadas, color: C.green  },
          { label: "EN REVISIÓN",  value: stats.pendientes, color: C.gold   },
          { label: "RECHAZADAS",   value: stats.rechazadas, color: C.red    },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: CS }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
            <div style={{ fontSize: 30, fontWeight: 700, color: C.text, fontFamily: FM, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([
          { id: "todas",     label: "Todas",       count: stats.total      },
          { id: "publicada", label: "Publicadas",  count: stats.publicadas },
          { id: "pendiente", label: "En revisión", count: stats.pendientes },
          { id: "rechazada", label: "Rechazadas",  count: stats.rechazadas },
        ] as { id: Filtro; label: string; count: number }[]).map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: "7px 16px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, display: "flex", alignItems: "center", gap: 7, background: filtro === f.id ? `${C.orange}12` : "#fff", border: filtro === f.id ? `1px solid ${C.orange}50` : `1px solid ${C.border}`, color: filtro === f.id ? C.orange : C.muted, transition: "all .15s" }}>
            {f.label}
            <span style={{ background: filtro === f.id ? C.orange : C.border, borderRadius: 100, padding: "1px 7px", fontSize: 10, color: filtro === f.id ? "white" : C.muted, fontWeight: 800 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Vacío ── */}
      {obrasFiltradas.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎨</div>
          <h3 style={{ fontSize: 16, color: C.text, margin: "0 0 8px" }}>
            {filtro === "todas" ? "Aún no tienes obras" : "No hay obras en esta categoría"}
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
            {filtro === "todas" ? "¡Sube tu primera obra y empieza a vender!" : "Cambia el filtro para ver otras obras"}
          </p>
          {filtro === "todas" && (
            <button onClick={() => navigate("/artista/nueva-obra")}
              style={{ padding: "10px 22px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
              + Subir primera obra
            </button>
          )}
        </div>
      )}

      {/* ── Grid de tarjetas ── */}
      {obrasFiltradas.length > 0 && (
        <div className="mo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
          {obrasFiltradas.map((obra, i) => {
            const badge     = getBadge(obra.estado);
            const stockInfo = getStockInfo(obra);
            return (
              <div key={obra.id_obra} className="mo-card" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Imagen */}
                <div className="mo-card-img" style={{ height: 188, background: "#F3F2F8", position: "relative", overflow: "hidden" }}>
                  {obra.imagen_principal
                    ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🖼️</div>
                  }
                  <span style={{ position: "absolute", bottom: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 100, fontSize: 10, fontWeight: 800, color: badge.color, background: "rgba(255,255,255,.92)", border: `1px solid ${badge.border}`, textTransform: "uppercase", letterSpacing: ".06em", backdropFilter: "blur(6px)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: badge.color }}/>{badge.label}
                  </span>
                  {stockInfo && (
                    <span style={{ position: "absolute", bottom: 10, right: 10, padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, color: stockInfo.color, background: "rgba(255,255,255,.92)", border: `1px solid ${stockInfo.color}40`, backdropFilter: "blur(6px)" }}>
                      {stockInfo.label}
                    </span>
                  )}
                  {obra.destacada && (
                    <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.9)", border: `1px solid ${C.gold}50`, color: C.gold, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 100 }}>⭐ Destacada</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                    {obra.categoria        && <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, background: `${C.orange}10`, border: `1px solid ${C.orange}22`, padding: "2px 8px", borderRadius: 100 }}>{obra.categoria}</span>}
                    {obra.tecnica          && <span style={{ fontSize: 10, fontWeight: 600, color: C.muted,  background: "#F3F2F8", border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 100 }}>{obra.tecnica}</span>}
                    {obra.nombre_coleccion && <span style={{ fontSize: 10, fontWeight: 700, color: C.pink,   background: `${C.pink}10`, border: `1px solid ${C.pink}22`, padding: "2px 8px", borderRadius: 100 }}>🗂 {obra.nombre_coleccion}</span>}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.titulo}</h3>
                  <p style={{ fontSize: 17, color: C.orange, fontWeight: 900, margin: "0 0 10px", fontFamily: FM }}>{fmt(obra.precio_base)}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.muted, marginBottom: 10 }}>
                    <span>👁 {obra.vistas || 0} vistas</span>
                    <span>{fmtFecha(obra.fecha_creacion)}</span>
                  </div>
                  {obra.estado === "rechazada" && obra.motivo_rechazo && (
                    <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                      <strong style={{ color: C.red }}>Motivo: </strong>{obra.motivo_rechazo}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="mo-btn" onClick={() => navigate(`/artista/obra/${obra.id_obra}`)}>
                      👁 Ver
                    </button>
                    <button className="mo-btn" style={{ flex: 1 }} onClick={() => navigate(`/artista/editar-obra/${obra.id_obra}`)}>
                      ✏ Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
