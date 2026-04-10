// src/pages/private/admin/AdminBlog.tsx
// Panel de administración del blog — 3 pestañas: Posts, Moderación, Palabras prohibidas
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, MessageCircle, ShieldAlert, Eye, Edit3, Trash2, CheckCircle, XCircle, Plus, Ban, ToggleLeft, ToggleRight } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";

const C = {
  orange: "#E8640C",
  pink: "#A83B90",
  green: "#0E8A50",
  red: "#C4304A",
  ink: "#14121E",
  sub: "#5A5870",
  muted: "#9896A8",
  bg: "#F9F8FC",
  card: "#FFFFFF",
  border: "#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";

// ── TIPOS ─────────────────────────────────────────────────

interface PostAdmin {
  id_post: number;
  titulo: string;
  slug: string;
  estado: string;
  activo: boolean;
  autor_nombre: string;
  autor_rol: string;
  vistas: number;
  comentarios_pendientes: number;
  fecha_creacion: string;
}

interface Comentario {
  id_comentario: number;
  id_post: number;
  contenido: string;
  autor_nombre: string;
  usuario_rol: string;
  fecha_creacion: string;
  estado: string;
}

interface Palabra {
  id_palabra: number;
  palabra: string;
  activa: boolean;
  fecha_creacion: string;
}

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  publicado: { label: "Publicado", color: C.green,  bg: `${C.green}15` },
  borrador:  { label: "Borrador",  color: "#A87006", bg: "#A8700615" },
  oculto:    { label: "Oculto",    color: C.sub,     bg: `${C.sub}15` },
};

// ── COMPONENTE PRINCIPAL ─────────────────────────────────

export default function AdminBlog() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = authService.getToken();

  const [tab, setTab] = useState<"posts" | "moderacion" | "palabras">("posts");

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100, fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .ab-tab { padding: 10px 20px; border-radius: 100px; border: none; font-family: ${FB}; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.2s; }
        .ab-tab.active { background: ${C.orange}; color: #fff; }
        .ab-tab:not(.active) { background: ${C.card}; color: ${C.sub}; box-shadow: ${CS}; }
        .ab-tab:not(.active):hover { color: ${C.orange}; }
        .ab-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: ${C.card}; border-radius: 12px; box-shadow: ${CS}; margin-bottom: 8px; transition: box-shadow 0.18s; }
        .ab-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.08); }
        .ab-btn { background: none; border: none; cursor: pointer; padding: 7px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.18s, color 0.18s; color: ${C.muted}; }
        .ab-btn:hover { background: rgba(0,0,0,0.05); color: ${C.ink}; }
        .ab-btn.green:hover { background: ${C.green}15; color: ${C.green}; }
        .ab-btn.red:hover { background: ${C.red}15; color: ${C.red}; }
        .ab-input { width: 100%; padding: 11px 15px; border: 1.5px solid ${C.border}; border-radius: 10px; font-family: ${FB}; font-size: 13px; color: ${C.ink}; background: ${C.card}; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .ab-input:focus { border-color: ${C.orange}; }
        .ab-select { padding: 8px 14px; border: 1.5px solid ${C.border}; border-radius: 10px; font-family: ${FB}; font-size: 12px; color: ${C.sub}; background: ${C.card}; outline: none; cursor: pointer; }
        .btn-primary { padding: 10px 20px; background: ${C.orange}; border: none; border-radius: 100px; color: #fff; font-family: ${FB}; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.18s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: C.ink, margin: 0 }}>Blog</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Gestión de publicaciones, moderación y palabras prohibidas</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/blog/nuevo")}>
          <Plus size={14} /> Nuevo post
        </button>
      </div>

      {/* Pestañas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        <button className={`ab-tab ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>
          <BookOpen size={14} /> Posts
        </button>
        <button className={`ab-tab ${tab === "moderacion" ? "active" : ""}`} onClick={() => setTab("moderacion")}>
          <MessageCircle size={14} /> Moderación
        </button>
        <button className={`ab-tab ${tab === "palabras" ? "active" : ""}`} onClick={() => setTab("palabras")}>
          <ShieldAlert size={14} /> Palabras prohibidas
        </button>
      </div>

      {tab === "posts"     && <TabPosts token={token!} navigate={navigate} showToast={showToast} />}
      {tab === "moderacion" && <TabModeracion token={token!} showToast={showToast} />}
      {tab === "palabras"  && <TabPalabras token={token!} showToast={showToast} />}
    </div>
  );
}

// ── TAB POSTS ────────────────────────────────────────────

function TabPosts({ token, navigate, showToast }: {
  token: string;
  navigate: ReturnType<typeof useNavigate>;
  showToast: (msg: string, type: string) => void;
}) {
  const [posts, setPosts] = useState<PostAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroRol)    params.set("autor_rol", filtroRol);
    try {
      const res = await fetch(`${API}/api/blog/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch { showToast("Error al cargar posts", "err"); }
    finally { setLoading(false); }
  }, [page, filtroEstado, filtroRol, token, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const res = await fetch(`${API}/api/blog/admin/posts/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      const json = await res.json();
      if (json.success) { showToast("Estado actualizado", "ok"); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este post?")) return;
    try {
      const res = await fetch(`${API}/api/blog/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { showToast("Post eliminado", "ok"); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="ab-select" value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="publicado">Publicados</option>
          <option value="borrador">Borradores</option>
          <option value="oculto">Ocultos</option>
        </select>
        <select className="ab-select" value={filtroRol} onChange={(e) => { setFiltroRol(e.target.value); setPage(1); }}>
          <option value="">Todos los autores</option>
          <option value="admin">Admin</option>
          <option value="artista">Artistas</option>
        </select>
      </div>

      {loading ? (
        <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 12 }} />)}</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
          <BookOpen size={40} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, color: C.sub }}>No hay posts con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {posts.map((post, i) => {
            const est = ESTADO_LABEL[post.estado] ?? ESTADO_LABEL.borrador;
            return (
              <div key={post.id_post} className="ab-row fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.titulo}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: est.color, background: est.bg, borderRadius: 20, padding: "2px 9px", flexShrink: 0 }}>
                      {est.label}
                    </span>
                    {post.comentarios_pendientes > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, background: `${C.orange}15`, borderRadius: 20, padding: "2px 9px", flexShrink: 0 }}>
                        {post.comentarios_pendientes} pendiente{post.comentarios_pendientes > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
                    <span>{post.autor_nombre} ({post.autor_rol})</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={11} /> {post.vistas}</span>
                    <span>{formatFecha(post.fecha_creacion)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                  <select
                    className="ab-select"
                    value={post.estado}
                    onChange={(e) => cambiarEstado(post.id_post, e.target.value)}
                    style={{ fontSize: 11, padding: "6px 10px" }}
                  >
                    <option value="publicado">Publicado</option>
                    <option value="borrador">Borrador</option>
                    <option value="oculto">Oculto</option>
                  </select>
                  <button className="ab-btn" title="Editar" onClick={() => navigate(`/admin/blog/editar/${post.id_post}`)}>
                    <Edit3 size={15} />
                  </button>
                  {post.estado === "publicado" && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex" }}>
                      <button className="ab-btn" title="Ver en blog"><Eye size={15} /></button>
                    </a>
                  )}
                  <button className="ab-btn red" title="Eliminar" onClick={() => eliminar(post.id_post)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ width: 34, height: 34, borderRadius: "50%", border: p === page ? "none" : `1px solid ${C.border}`, background: p === page ? C.orange : C.card, color: p === page ? "#fff" : C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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

// ── TAB MODERACIÓN ───────────────────────────────────────

function TabModeracion({ token, showToast }: {
  token: string;
  showToast: (msg: string, type: string) => void;
}) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/blog/admin/comentarios/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setComentarios(json.data);
    } catch { showToast("Error al cargar comentarios", "err"); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const moderar = async (id: number, accion: "aprobar" | "rechazar") => {
    setAccionando(id);
    try {
      const res = await fetch(`${API}/api/blog/admin/comentarios/${id}/moderar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(accion === "aprobar" ? "Comentario aprobado" : "Comentario rechazado", "ok");
        cargar();
      } else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
    finally { setAccionando(null); }
  };

  const eliminar = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/blog/admin/comentarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { showToast("Comentario eliminado", "ok"); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10, borderRadius: 12 }} />)}</div>;

  if (comentarios.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: C.muted }}>
      <CheckCircle size={48} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} color={C.green} />
      <p style={{ margin: 0, color: C.sub, fontSize: 15 }}>No hay comentarios pendientes de moderación</p>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>
        {comentarios.length} comentario{comentarios.length !== 1 ? "s" : ""} esperando revisión
      </p>
      {comentarios.map((c, i) => (
        <div key={c.id_comentario} className="ab-row fade-up" style={{ alignItems: "flex-start", animationDelay: `${i * 0.04}s` }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${C.pink}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.pink }}>{c.autor_nombre[0]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{c.autor_nombre}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{c.usuario_rol}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{formatFecha(c.fecha_creacion)}</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#2a2840", lineHeight: 1.55 }}>{c.contenido}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Post ID: <span style={{ fontFamily: FM }}>{c.id_post}</span></p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              className="ab-btn green"
              title="Aprobar"
              disabled={accionando === c.id_comentario}
              onClick={() => moderar(c.id_comentario, "aprobar")}
            >
              <CheckCircle size={18} />
            </button>
            <button
              className="ab-btn red"
              title="Rechazar"
              disabled={accionando === c.id_comentario}
              onClick={() => moderar(c.id_comentario, "rechazar")}
            >
              <XCircle size={18} />
            </button>
            <button
              className="ab-btn red"
              title="Eliminar"
              onClick={() => eliminar(c.id_comentario)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TAB PALABRAS PROHIBIDAS ──────────────────────────────

function TabPalabras({ token, showToast }: {
  token: string;
  showToast: (msg: string, type: string) => void;
}) {
  const [palabras, setPalabras] = useState<Palabra[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaPalabra, setNuevaPalabra] = useState("");
  const [agregando, setAgregando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/blog/admin/palabras-prohibidas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setPalabras(json.data);
    } catch { showToast("Error al cargar palabras", "err"); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async () => {
    if (!nuevaPalabra.trim()) return;
    setAgregando(true);
    try {
      const res = await fetch(`${API}/api/blog/admin/palabras-prohibidas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ palabra: nuevaPalabra.trim() }),
      });
      const json = await res.json();
      if (json.success) { showToast("Palabra agregada", "ok"); setNuevaPalabra(""); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
    finally { setAgregando(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta palabra de la lista?")) return;
    try {
      const res = await fetch(`${API}/api/blog/admin/palabras-prohibidas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { showToast("Palabra eliminada", "ok"); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
  };

  const toggle = async (id: number, activa: boolean) => {
    try {
      const res = await fetch(`${API}/api/blog/admin/palabras-prohibidas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activa: !activa }),
      });
      const json = await res.json();
      if (json.success) { showToast(activa ? "Palabra desactivada" : "Palabra activada", "ok"); cargar(); }
      else showToast(json.message || "Error", "err");
    } catch { showToast("Error de conexión", "err"); }
  };

  return (
    <div>
      {/* Agregar nueva */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, alignItems: "center" }}>
        <input
          className="ab-input"
          style={{ flex: 1 }}
          value={nuevaPalabra}
          onChange={(e) => setNuevaPalabra(e.target.value)}
          placeholder="Nueva palabra prohibida…"
          maxLength={100}
          onKeyDown={(e) => { if (e.key === "Enter") agregar(); }}
        />
        <button className="btn-primary" onClick={agregar} disabled={agregando || !nuevaPalabra.trim()}>
          <Ban size={14} /> {agregando ? "Agregando…" : "Agregar"}
        </button>
      </div>

      {loading ? (
        <div>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8, borderRadius: 10 }} />)}</div>
      ) : palabras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
          <ShieldAlert size={40} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, color: C.sub }}>La lista de palabras prohibidas está vacía</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>
            {palabras.length} palabra{palabras.length !== 1 ? "s" : ""} en la lista
          </p>
          {palabras.map((p, i) => (
            <div
              key={p.id_palabra}
              className="ab-row fade-up"
              style={{ opacity: p.activa ? 1 : 0.5, animationDelay: `${i * 0.03}s` }}
            >
              <span style={{ fontFamily: FM, fontSize: 14, fontWeight: 600, color: p.activa ? C.red : C.muted, flex: 1 }}>
                {p.palabra}
              </span>
              <span style={{ fontSize: 10, color: p.activa ? C.green : C.muted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: p.activa ? `${C.green}15` : `${C.muted}15`, borderRadius: 20, padding: "2px 10px", marginRight: 8 }}>
                {p.activa ? "Activa" : "Inactiva"}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  className="ab-btn"
                  title={p.activa ? "Desactivar" : "Activar"}
                  onClick={() => toggle(p.id_palabra, p.activa)}
                >
                  {p.activa ? <ToggleRight size={18} color={C.green} /> : <ToggleLeft size={18} />}
                </button>
                <button
                  className="ab-btn red"
                  title="Eliminar"
                  onClick={() => eliminar(p.id_palabra)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
