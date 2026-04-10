// src/pages/private/artista/MisBlogPosts.tsx
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenSquare, Eye, MessageCircle, Trash2, Edit3, Plus, BookOpen } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SERIF = "'SolveraLorvane', serif";
const SANS = "'Outfit', sans-serif";

const C = {
  orange: "#E8640C",
  pink: "#A83B90",
  ink: "#14121E",
  sub: "#5A5870",
  muted: "#9896A8",
  bg: "#F9F8FC",
  card: "#FFFFFF",
  border: "#E6E4EF",
  red: "#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";

interface PostResumen {
  id_post: number;
  titulo: string;
  slug: string;
  estado: "borrador" | "publicado" | "oculto";
  activo: boolean;
  imagen_destacada: string | null;
  vistas: number;
  total_comentarios: number;
  fecha_creacion: string;
  fecha_publicacion: string | null;
}

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  publicado: { label: "Publicado", color: "#0E8A50", bg: "#0E8A5015" },
  borrador:  { label: "Borrador",  color: "#A87006", bg: "#A8700615" },
  oculto:    { label: "Oculto",    color: "#5A5870", bg: "#5A587015" },
};

export default function MisBlogPosts() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = authService.getToken();

  const [posts, setPosts] = useState<PostResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (filtroEstado) params.set("estado", filtroEstado);
      const res = await fetch(`${API}/api/blog/mis-posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      showToast("Error al cargar los posts", "err");
    } finally {
      setLoading(false);
    }
  }, [page, filtroEstado, token, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este post?")) return;
    setEliminando(id);
    try {
      const res = await fetch(`${API}/api/blog/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast("Post eliminado", "ok");
        cargar();
      } else {
        showToast(json.message || "Error al eliminar", "err");
      }
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setEliminando(null);
    }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ padding: "36px 40px", maxWidth: 940, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display: swap; }
        .mbp-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: ${C.card}; border-radius: 14px; box-shadow: ${CS}; margin-bottom: 10px; transition: box-shadow 0.2s; }
        .mbp-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.08); }
        .mbp-action { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; color: ${C.muted}; }
        .mbp-action:hover { background: rgba(0,0,0,0.05); color: ${C.ink}; }
        .mbp-action.del:hover { background: rgba(196,48,74,0.1); color: ${C.red}; }
        .mbp-filter { padding: 8px 16px; border-radius: 100px; border: 1px solid ${C.border}; font-family: ${SANS}; font-size: 12px; font-weight: 600; cursor: pointer; background: ${C.card}; color: ${C.sub}; transition: all 0.2s; }
        .mbp-filter.active { background: ${C.orange}; color: #fff; border-color: ${C.orange}; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PenSquare size={20} color={C.orange} />
          </div>
          <div>
            <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: C.ink, margin: 0 }}>Mis posts</h1>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Gestiona tus publicaciones</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/artista/blog/nuevo")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: C.orange, border: "none", borderRadius: 100, color: "#fff", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", cursor: "pointer" }}
        >
          <Plus size={14} /> Nuevo post
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "", label: "Todos" },
          { key: "publicado", label: "Publicados" },
          { key: "borrador", label: "Borradores" },
          { key: "oculto", label: "Ocultos" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFiltroEstado(f.key); setPage(1); }}
            className={`mbp-filter ${filtroEstado === f.key ? "active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 72, marginBottom: 10, borderRadius: 14 }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: C.muted }}>
          <BookOpen size={48} strokeWidth={1.2} style={{ marginBottom: 16, opacity: 0.4 }} />
          <p style={{ fontSize: 16, margin: "0 0 20px", color: C.sub }}>
            {filtroEstado ? "Sin posts con ese filtro" : "Aún no tienes posts publicados"}
          </p>
          <button
            onClick={() => navigate("/artista/blog/nuevo")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: C.orange, border: "none", borderRadius: 100, color: "#fff", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", cursor: "pointer" }}
          >
            <Plus size={14} /> Crear primer post
          </button>
        </div>
      ) : (
        <>
          {posts.map((post, i) => {
            const est = ESTADO_LABEL[post.estado] ?? ESTADO_LABEL.borrador;
            return (
              <div key={post.id_post} className="mbp-row fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                {post.imagen_destacada ? (
                  <img src={post.imagen_destacada} alt={post.titulo} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PenSquare size={20} color={C.orange} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.titulo}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: est.color, background: est.bg, borderRadius: 20, padding: "2px 10px", flexShrink: 0 }}>
                      {est.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 5, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {post.vistas}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MessageCircle size={12} /> {post.total_comentarios}</span>
                    <span>{formatFecha(post.fecha_creacion)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {post.estado === "publicado" && (
                    <Link to={`/blog/${post.slug}`} target="_blank" style={{ display: "flex" }}>
                      <button className="mbp-action" title="Ver en blog"><Eye size={16} /></button>
                    </Link>
                  )}
                  <button className="mbp-action" title="Editar" onClick={() => navigate(`/artista/blog/editar/${post.id_post}`)}>
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="mbp-action del"
                    title="Eliminar"
                    disabled={eliminando === post.id_post}
                    onClick={() => eliminar(post.id_post)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: p === page ? "none" : `1px solid ${C.border}`, background: p === page ? C.orange : C.card, color: p === page ? "#fff" : C.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
