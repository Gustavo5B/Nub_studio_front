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
  categoria: string | null;
  nombre_coleccion: string | null;
}
interface Stats { total: number; publicadas: number; pendientes: number; rechazadas: number; }
type Filtro = "todas" | "pendiente" | "publicada" | "rechazada" | "agotada";

const C = {
  orange: "#E8640C", pink: "#A83B90", gold: "#A87006",
  card: "#FFFFFF", border: "#E6E4EF",
  text: "#14121E", muted: "#9896A8", green: "#0E8A50",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
      const token   = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/artista-portal/mis-obras`, { headers });
      if (!res.ok) { showToast("Error al cargar las obras, intenta de nuevo", "err"); return; }
      const data = await res.json();
      setObras(data.obras || []);
      const s = data.stats || {};
      setStats({
        total:      s.total      || 0,
        publicadas: s.publicadas || 0,
        pendientes: s.pendientes ?? s.en_revision ?? 0,
        rechazadas: s.rechazadas || 0,
      });
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const obrasFiltradas = filtro === "todas" ? obras : obras.filter(o => o.estado === filtro);

  const getBadge = (estado: string) => {
    if (estado === "publicada") return { label: "Publicada",   color: C.green };
    if (estado === "pendiente") return { label: "En revisión", color: C.gold  };
    if (estado === "rechazada") return { label: "Rechazada",   color: C.pink  };
    if (estado === "agotada")   return { label: "Agotada",     color: C.muted };
    return { label: estado, color: C.muted };
  };

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 14, fontFamily: FB }}>Cargando tus obras...</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  return (
    <div style={{ padding: "36px 40px", fontFamily: FB }} className="artista-main-pad">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 6px" }}>✦ Portal del Artista</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: FB }}>Mis Obras</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{stats.total} obra{stats.total !== 1 ? "s" : ""} en total</p>
        </div>
        <button onClick={() => navigate("/artista/nueva-obra")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 12, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px ${C.orange}35` }}>
          + Nueva obra
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "TOTAL OBRAS",  value: stats.total,      color: C.orange },
          { label: "PUBLICADAS",   value: stats.publicadas, color: C.green  },
          { label: "EN REVISIÓN",  value: stats.pendientes, color: C.gold   },
          { label: "RECHAZADAS",   value: stats.rechazadas, color: C.pink   },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", position: "relative", overflow: "hidden", boxShadow: CS }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
            <div style={{ fontSize: 32, fontWeight: 900, color: C.text, fontFamily: FB, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {([
          { id: "todas",     label: "Todas",       count: stats.total      },
          { id: "publicada", label: "Publicadas",  count: stats.publicadas },
          { id: "pendiente", label: "En revisión", count: stats.pendientes },
          { id: "rechazada", label: "Rechazadas",  count: stats.rechazadas },
        ] as { id: Filtro; label: string; count: number }[]).map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: "8px 18px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, display: "flex", alignItems: "center", gap: 7, background: filtro === f.id ? `${C.orange}12` : "#F3F2F8", border: filtro === f.id ? `1px solid ${C.orange}50` : `1px solid ${C.border}`, color: filtro === f.id ? C.orange : C.muted, transition: "all .15s" }}>
            {f.label}
            <span style={{ background: filtro === f.id ? C.orange : C.border, borderRadius: 100, padding: "1px 8px", fontSize: 10.5, color: filtro === f.id ? "white" : C.muted, fontWeight: 800 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {obrasFiltradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h3 style={{ fontSize: 16, color: C.text, margin: "0 0 8px", fontFamily: FB }}>
            {filtro === "todas" ? "Aún no tienes obras" : "No hay obras en esta categoría"}
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
            {filtro === "todas" ? "¡Sube tu primera obra y empieza a vender!" : "Cambia el filtro para ver otras obras"}
          </p>
          {filtro === "todas" && (
            <button onClick={() => navigate("/artista/nueva-obra")}
              style={{ padding: "10px 24px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
              + Subir primera obra
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 18 }}>
          {obrasFiltradas.map(obra => {
            const badge = getBadge(obra.estado);
            return (
              <div key={obra.id_obra}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", transition: "transform .22s,box-shadow .22s,border-color .22s", boxShadow: CS }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; el.style.borderColor = `${C.orange}30`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = CS; el.style.borderColor = C.border; }}>
                <div style={{ height: 180, background: "#F3F2F8", position: "relative", overflow: "hidden" }}>
                  {obra.imagen_principal
                    ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🖼️</div>
                  }
                  <span style={{ position: "absolute", bottom: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: badge.color, background: `${badge.color}15`, border: `1px solid ${badge.color}40`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {badge.label}
                  </span>
                  {obra.destacada && (
                    <span style={{ position: "absolute", top: 10, right: 10, background: `${C.gold}20`, border: `1px solid ${C.gold}50`, color: C.gold, fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 100 }}>⭐ Destacada</span>
                  )}
                </div>

                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {obra.categoria        && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.orange, background: `${C.orange}12`, border: `1px solid ${C.orange}25`, padding: "2px 8px", borderRadius: 100 }}>{obra.categoria}</span>}
                    {obra.tecnica          && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: "#F3F2F8", border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 100 }}>{obra.tecnica}</span>}
                    {obra.nombre_coleccion && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.pink, background: `${C.pink}12`, border: `1px solid ${C.pink}25`, padding: "2px 8px", borderRadius: 100 }}>🗂 {obra.nombre_coleccion}</span>}
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, color: C.text, margin: "0 0 6px", fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.titulo}</h3>
                  <p style={{ fontSize: 16, color: C.orange, fontWeight: 900, margin: "0 0 10px", fontFamily: FB }}>
                    {formatPrecio(obra.precio_base)}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.muted, marginBottom: 10 }}>
                    <span>👁 {obra.vistas || 0} vistas</span>
                    <span>📅 {formatFecha(obra.fecha_creacion)}</span>
                  </div>
                  {obra.estado === "rechazada" && obra.motivo_rechazo && (
                    <div style={{ background: `${C.pink}10`, border: `1px solid ${C.pink}25`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
                      <strong style={{ color: C.pink }}>Motivo: </strong>{obra.motivo_rechazo}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {obra.permite_marco   && <span style={{ fontSize: 10.5, color: C.muted }}>🖼 Enmarcable</span>}
                    {obra.con_certificado && <span style={{ fontSize: 10.5, color: C.muted }}>📜 Certificado</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate(`/artista/editar-obra/${obra.id_obra}`)}
                      style={{ flex: 1, padding: "8px", borderRadius: 9, background: "#F3F2F8", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: FB, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600, transition: "all .15s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.orange; el.style.borderColor = `${C.orange}40`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.borderColor = C.border; }}>
                      ✏ Editar
                    </button>
                    {obra.slug && (
                      <button onClick={() => navigate(`/obras/${obra.slug}`)}
                        style={{ padding: "8px 12px", borderRadius: 9, background: "#F3F2F8", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", fontSize: 14 }}>
                        👁
                      </button>
                    )}
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