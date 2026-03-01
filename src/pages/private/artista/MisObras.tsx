// src/pages/private/artista/MisObras.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ Después:
import { authService } from "../../../services/authService";
import "../../../styles/mis-obras.css";

interface Obra {
  id_obra: number;
  titulo: string;
  slug: string;
  descripcion: string;
  imagen_principal: string;
  precio_base: number;
  estado: "pendiente" | "aprobada" | "rechazada";
  activa: boolean;
  visible: boolean;
  destacada: boolean;
  vistas: number;
  fecha_creacion: string;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  anio_creacion: number | null;
  tecnica: string | null;
  permite_marco: boolean;
  con_certificado: boolean;
  categoria: string | null;
}

interface Stats {
  total: number;
  publicadas: number;
  en_revision: number;
  rechazadas: number;
}

type Filtro = "todas" | "pendiente" | "aprobada" | "rechazada";

export default function MisObras() {
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, publicadas: 0, en_revision: 0, rechazadas: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [artista, setArtista] = useState<{ nombre_completo?: string; nombre_artistico?: string }>({});

  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [obrasRes, perfilRes] = await Promise.all([
        fetch(`${API}/api/artista-portal/mis-obras`, { headers }),
        fetch(`${API}/api/artista-portal/mi-perfil`, { headers }),
      ]);

      if (obrasRes.ok) {
        const data = await obrasRes.json();
        setObras(data.obras || []);
        setStats(data.stats || { total: 0, publicadas: 0, en_revision: 0, rechazadas: 0 });
      }

      if (perfilRes.ok) {
        const p = await perfilRes.json();
        setArtista(p);
      }
    } catch (err) {
      console.error("Error cargando obras:", err);
    } finally {
      setLoading(false);
    }
  };

  const obrasFiltradas = filtro === "todas" ? obras : obras.filter(o => o.estado === filtro);

  const estadoBadge = (estado: string, activa: boolean) => {
    if (estado === "aprobada" && activa) return { label: "Publicada", cls: "badge--verde" };
    if (estado === "aprobada" && !activa) return { label: "Inactiva", cls: "badge--gris" };
    if (estado === "pendiente") return { label: "En revisión", cls: "badge--amarillo" };
    if (estado === "rechazada") return { label: "Rechazada", cls: "badge--rojo" };
    return { label: estado, cls: "badge--gris" };
  };

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="mo-layout">
        <div className="mo-sidebar">
          <div className="mo-logo">NU·B</div>
          <div className="mo-skeleton-sidebar" />
        </div>
        <div className="mo-main">
          <div className="mo-loading">
            <div className="mo-spinner" />
            <p>Cargando tus obras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mo-layout">
      {/* ── SIDEBAR ── */}
      <aside className="mo-sidebar">
        <div className="mo-logo" onClick={() => navigate("/artista/dashboard")}>NU·B</div>

        <div className="mo-artista-card">
          <div className="mo-avatar">
            {(artista.nombre_artistico || artista.nombre_completo || "A")[0].toUpperCase()}
          </div>
          <div>
            <div className="mo-artista-nombre">{artista.nombre_artistico || artista.nombre_completo}</div>
            <div className="mo-artista-badge">Artista activo</div>
          </div>
        </div>

        <nav className="mo-nav">
          <p className="mo-nav-label">NAVEGACIÓN</p>
          <button className="mo-nav-item" onClick={() => navigate("/artista/dashboard")}>
            <span className="mo-nav-icon">⊞</span> Overview
          </button>
          <button className="mo-nav-item mo-nav-item--active">
            <span className="mo-nav-icon">⊠</span> Mis obras
          </button>
          <button className="mo-nav-item" onClick={() => navigate("/artista/perfil")}>
            <span className="mo-nav-icon">◯</span> Mi perfil
          </button>
        </nav>

        <button className="mo-btn-nueva" onClick={() => navigate("/artista/nueva-obra")}>
          + Subir nueva obra
        </button>

        <button className="mo-cerrar" onClick={() => { authService.logout(); navigate("/login"); }}>
          ↩ Cerrar sesión
        </button>
      </aside>

      {/* ── CONTENIDO ── */}
      <main className="mo-main">
        {/* Header */}
        <div className="mo-header">
          <div>
            <p className="mo-header-sub">✦ PORTAL DEL ARTISTA</p>
            <h1 className="mo-header-titulo">Mis Obras</h1>
            <p className="mo-header-desc">{stats.total} obra{stats.total !== 1 ? "s" : ""} en total</p>
          </div>
          <button className="mo-btn-primary" onClick={() => navigate("/artista/nueva-obra")}>
            + Nueva obra
          </button>
        </div>

        {/* Stats */}
        <div className="mo-stats">
          <div className="mo-stat-card mo-stat-card--naranja">
            <div className="mo-stat-icon">⊞</div>
            <div className="mo-stat-num">{stats.total}</div>
            <div className="mo-stat-label">TOTAL OBRAS</div>
          </div>
          <div className="mo-stat-card mo-stat-card--verde">
            <div className="mo-stat-icon">✓</div>
            <div className="mo-stat-num">{stats.publicadas}</div>
            <div className="mo-stat-label">PUBLICADAS</div>
          </div>
          <div className="mo-stat-card mo-stat-card--amarillo">
            <div className="mo-stat-icon">◷</div>
            <div className="mo-stat-num">{stats.en_revision}</div>
            <div className="mo-stat-label">EN REVISIÓN</div>
          </div>
          <div className="mo-stat-card mo-stat-card--rojo">
            <div className="mo-stat-icon">✕</div>
            <div className="mo-stat-num">{stats.rechazadas}</div>
            <div className="mo-stat-label">RECHAZADAS</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mo-filtros">
          {(["todas", "aprobada", "pendiente", "rechazada"] as Filtro[]).map(f => (
            <button
              key={f}
              className={`mo-filtro ${filtro === f ? "mo-filtro--active" : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "todas" ? "Todas" : f === "aprobada" ? "Publicadas" : f === "pendiente" ? "En revisión" : "Rechazadas"}
            </button>
          ))}
        </div>

        {/* Grid de obras */}
        {obrasFiltradas.length === 0 ? (
          <div className="mo-empty">
            <div className="mo-empty-icon">🎨</div>
            <h3>
              {filtro === "todas" ? "Aún no tienes obras" : `No hay obras ${filtro === "aprobada" ? "publicadas" : filtro === "pendiente" ? "en revisión" : "rechazadas"}`}
            </h3>
            <p>
              {filtro === "todas" ? "¡Sube tu primera obra y empieza a vender!" : "Cambia el filtro para ver otras obras"}
            </p>
            {filtro === "todas" && (
              <button className="mo-btn-primary" onClick={() => navigate("/artista/nueva-obra")}>
                + Subir primera obra
              </button>
            )}
          </div>
        ) : (
          <div className="mo-grid">
            {obrasFiltradas.map(obra => {
              const badge = estadoBadge(obra.estado, obra.activa);
              return (
                <div key={obra.id_obra} className="mo-card">
                  <div className="mo-card-img-wrap">
                    {obra.imagen_principal ? (
                      <img src={obra.imagen_principal} alt={obra.titulo} className="mo-card-img" />
                    ) : (
                      <div className="mo-card-img-placeholder">🖼️</div>
                    )}
                    <span className={`mo-badge ${badge.cls}`}>{badge.label}</span>
                    {obra.destacada && <span className="mo-badge-destacada">⭐ Destacada</span>}
                  </div>

                  <div className="mo-card-body">
                    <div className="mo-card-meta">
                      {obra.categoria && <span className="mo-card-categoria">{obra.categoria}</span>}
                      {obra.tecnica && <span className="mo-card-tecnica">{obra.tecnica}</span>}
                    </div>

                    <h3 className="mo-card-titulo">{obra.titulo}</h3>

                    <div className="mo-card-precio">{formatPrecio(obra.precio_base)}</div>

                    <div className="mo-card-info">
                      <span>👁 {obra.vistas || 0} vistas</span>
                      <span>📅 {formatFecha(obra.fecha_creacion)}</span>
                    </div>

                    {obra.estado === "rechazada" && obra.motivo_rechazo && (
                      <div className="mo-card-rechazo">
                        <strong>Motivo:</strong> {obra.motivo_rechazo}
                      </div>
                    )}

                    <div className="mo-card-extras">
                      {obra.permite_marco && <span className="mo-extra">🖼 Enmarcable</span>}
                      {obra.con_certificado && <span className="mo-extra">📜 Certificado</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}