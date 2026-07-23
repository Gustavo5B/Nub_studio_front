// src/pages/public/BlogDetalle.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Eye, MessageCircle, Send, Trash2, ChevronRight } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import estrellaImg from "../../assets/images/Estrella1jpeg.jpeg";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  orangeDark: "#C24E08",
  ink: "#14121E",
  sub: "#9896A8",
  dark: "#0D0B14",
  border: "rgba(0,0,0,0.07)",
};
const SERIF = "'SolveraLorvane', serif";
const SANS = "'Outfit', sans-serif";

interface Post {
  id_post: number;
  titulo: string;
  slug: string;
  extracto: string | null;
  contenido: string;
  imagen_destacada: string | null;
  autor_nombre: string;
  autor_foto: string | null;
  autor_rol: string;
  autor_artista_id: number | null;
  autor_matricula: string | null;
  categoria_nombre: string | null;
  vistas: number;
  fecha_publicacion: string;
  fecha_actualizacion: string;
}

interface PostRelacionado {
  id_post: number;
  slug: string;
  titulo: string;
  extracto: string | null;
  imagen_destacada: string | null;
  score: number;
  etiquetas: string[];
}

interface Comentario {
  id_comentario: number;
  id_usuario: number;
  padre_id: number | null;
  nivel: number;
  contenido: string;
  imagen_url: string | null;
  fecha_creacion: string;
  usuario_rol: string;
  autor_nombre: string;
  autor_foto: string | null;
  respuestas: Comentario[];
}

interface ConteoReaccion {
  emoji: string;
  total: number;
}

const contarComentarios = (lista: Comentario[]): number =>
  lista.reduce((acc, c) => acc + 1 + contarComentarios(c.respuestas), 0);

const WhatsAppIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.4 2.4-11.1 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

export default function BlogDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isLoggedIn = authService.isAuthenticated();
  const userRol = localStorage.getItem("userRol") || "";
  const token = authService.getToken();

  const [post, setPost] = useState<Post | null>(null);
  const [relacionados, setRelacionados] = useState<PostRelacionado[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComents, setLoadingComents] = useState(true);

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [respondiendo, setRespondiendo] = useState<{ id: number; nombre: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [emojis, setEmojis] = useState<string[]>([]);
  const [conteos, setConteos] = useState<ConteoReaccion[]>([]);
  const [miReaccion, setMiReaccion] = useState<string | null>(null);
  const [reaccionando, setReaccionando] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      document.body.style.cursor = "none";
      let rx = 0, ry = 0;
      let rafId: number | null = null;
      const onMove = (e: MouseEvent) => {
        const { clientX: mx, clientY: my } = e;
        if (dotRef.current) {
          dotRef.current.style.left = `${mx}px`;
          dotRef.current.style.top = `${my}px`;
        }
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rx += (mx - rx) * 0.15;
          ry += (my - ry) * 0.15;
          if (ringRef.current) {
            ringRef.current.style.left = `${rx}px`;
            ringRef.current.style.top = `${ry}px`;
          }
          rafId = null;
        });
      };
      document.addEventListener("mousemove", onMove);
      return () => {
        document.removeEventListener("mousemove", onMove);
        if (rafId) cancelAnimationFrame(rafId);
        document.body.style.cursor = "";
      };
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoadingPost(true);
    fetch(`${API}/api/blog/posts/${slug}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setPost(json.data);
        else navigate("/blog");
      })
      .catch(() => navigate("/blog"))
      .finally(() => setLoadingPost(false));
  }, [slug, navigate]);

  // Posts relacionados (precalculados por el modelo, servidos desde la tabla)
  useEffect(() => {
    if (!slug) return;
    setRelacionados([]);
    fetch(`${API}/api/blog/posts/${slug}/relacionados`)
      .then(r => r.json())
      .then(json => { if (json.success) setRelacionados(json.data); })
      .catch(() => {});
  }, [slug]);

  const cargarComentarios = useCallback(() => {
    if (!post) return;
    setLoadingComents(true);
    fetch(`${API}/api/blog/posts/${post.id_post}/comentarios`)
      .then(r => r.json())
      .then(json => { if (json.success) setComentarios(json.data); })
      .catch(() => {})
      .finally(() => setLoadingComents(false));
  }, [post]);

  useEffect(() => {
    cargarComentarios();
  }, [cargarComentarios]);

  const cargarReacciones = useCallback(() => {
    if (!post) return;
    fetch(`${API}/api/blog/posts/${post.id_post}/reacciones`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setConteos(json.data.conteos || []);
          setMiReaccion(json.data.mi_reaccion || null);
          setEmojis(json.data.emojis_permitidos || []);
        }
      })
      .catch(() => {});
  }, [post, token]);

  useEffect(() => {
    cargarReacciones();
  }, [cargarReacciones]);

  const toggleReaccion = async (emoji: string) => {
    if (!post || reaccionando) return;
    if (!isLoggedIn || !["cliente", "artista", "admin"].includes(userRol)) {
      showToast("Inicia sesión para reaccionar", "err");
      return;
    }
    setReaccionando(true);
    try {
      const quitar = miReaccion === emoji;
      const res = await fetch(`${API}/api/blog/posts/${post.id_post}/reacciones`, {
        method: quitar ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(quitar ? {} : { body: JSON.stringify({ emoji }) }),
      });
      const json = await res.json();
      if (json.success) {
        cargarReacciones();
      } else {
        showToast(json.message || "Error al reaccionar", "err");
      }
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setReaccionando(false);
    }
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    if (!post) return;
    setEnviando(true);
    try {
      const body: Record<string, string> = { contenido: nuevoComentario.trim() };
      if (respondiendo) body.padre_id = String(respondiendo.id);

      const res = await fetch(`${API}/api/blog/posts/${post.id_post}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Comentario publicado.", "ok");
        setNuevoComentario("");
        setRespondiendo(null);
        cargarComentarios();
      } else {
        showToast(json.message || "Error al enviar el comentario", "err");
      }
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setEnviando(false);
    }
  };

  const eliminarComentario = async (idComentario: number) => {
    try {
      const res = await fetch(`${API}/api/blog/comentarios/${idComentario}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast("Comentario eliminado", "ok");
        cargarComentarios();
      } else {
        showToast(json.message || "Error al eliminar", "err");
      }
    } catch {
      showToast("Error de conexión", "err");
    }
  };

  const iniciarRespuesta = (id: number, nombre: string) => {
    setRespondiendo({ id, nombre });
    setTimeout(() => commentRef.current?.focus(), 100);
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  const idUsuarioActual = parseInt(localStorage.getItem("userId") || "0", 10);

  return (
    <div style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display: swap; }
        .home-grain { position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 160px 160px; mix-blend-mode: multiply; }
        .home-cursor-dot { position: fixed; width: 6px; height: 6px; border-radius: 50%; background: #14121E; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); transition: width .22s, height .22s, background .22s; }
        .home-cursor-ring { position: fixed; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); transition: width .3s, height .3s, border-color .25s; }
        .home-cursor-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .home-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .whatsapp-float { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background: #25D366; border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.2); cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .whatsapp-float:hover { transform: scale(1.08) rotate(4deg); }
        .prose p { margin-bottom: 1.4em; line-height: 1.8; font-size: 17px; color: #2a2840; }
        .prose h2 { font-family: ${SERIF}; font-size: 28px; font-weight: 800; color: ${C.ink}; margin: 2em 0 0.6em; }
        .prose h3 { font-family: ${SERIF}; font-size: 22px; font-weight: 700; color: ${C.ink}; margin: 1.6em 0 0.5em; }
        .prose ul, .prose ol { margin: 1em 0 1.4em 1.5em; }
        .prose li { margin-bottom: 0.5em; line-height: 1.7; font-size: 16px; color: #2a2840; }
        .prose blockquote { border-left: 3px solid ${C.orange}; padding: 12px 20px; margin: 1.5em 0; background: rgba(232,100,12,0.04); border-radius: 0 8px 8px 0; }
        .prose blockquote p { color: ${C.ink}; font-style: italic; font-size: 16px; margin: 0; }
        .prose img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; }
        .comment-textarea { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid rgba(0,0,0,0.1); font-family: ${SANS}; font-size: 14px; color: ${C.ink}; resize: vertical; min-height: 90px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .comment-textarea:focus { border-color: ${C.orange}; }
        .btn-primary { padding: 11px 26px; background: ${C.orange}; border: none; border-radius: 100px; color: #fff; font-family: ${SANS}; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { background: ${C.orangeDark}; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .side-nav { position: absolute; top: 30px; left: 52px; display: flex; flex-direction: column; gap: 10px; z-index: 11; }
        .side-nav-link { display: flex; align-items: center; gap: 9px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #9896A8; text-decoration: none; transition: color 0.25s ease, gap 0.25s ease; }
        .side-nav-link::before { content: ''; display: block; width: 12px; height: 1px; background: currentColor; flex-shrink: 0; transition: width 0.28s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .side-nav-link:hover { color: #E8640C; gap: 14px; }
        .side-nav-link:hover::before { width: 22px; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
        .reaccion-pill { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 100px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reaccion-pill:hover { border-color: ${C.orange}; transform: translateY(-2px); }
        .reaccion-pill.active { border-color: ${C.orange}; background: ${C.orange}12; box-shadow: 0 2px 10px rgba(232,100,12,0.18); }
        .reaccion-pill:disabled { opacity: 0.6; cursor: wait; transform: none; }
        .rel-card { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s; }
        .rel-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.10); }
        .rel-card:hover h3 { color: ${C.orange}; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media (max-width: 768px) {
          .side-nav { display: none !important; }
          .bd-hero-auth { display: none !important; }
          .bd-article { padding: 72px 20px 60px !important; }
          .bd-loading { padding: 80px 20px 60px !important; }
        }
      `}</style>

      <div className="home-grain" />
      <div ref={dotRef} className="home-cursor-dot" />
      <div ref={ringRef} className="home-cursor-ring" />

      <nav className="side-nav">
        <Link to="/" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Inicio</Link>
        <Link to="/catalogo" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Galería</Link>
        <Link to="/artistas" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Artistas</Link>
        <Link to="/blog" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Blog</Link>
        <Link to="/sobre-nosotros" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Nosotros</Link>
        <Link to="/contacto" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Contacto</Link>
      </nav>

      <div className="bd-hero-auth" style={{ position: "absolute", top: 30, right: 52, display: "flex", alignItems: "center", gap: 12, zIndex: 11 }}>
        {!isLoggedIn ? (
          <>
            <Link to="/login" style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", textDecoration: "none" }}>Ingresar</Link>
            <Link to="/register" style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", padding: "7px 16px", borderRadius: 100, background: C.orange, textDecoration: "none" }}>Ser artista</Link>
          </>
        ) : (
          <>
            <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", textDecoration: "none" }}>Mi cuenta</Link>
            <button onClick={() => { authService.logout(); navigate("/"); }} style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", background: C.ink, border: "none", padding: "9px 20px", borderRadius: 100, cursor: "pointer" }}>Salir</button>
          </>
        )}
      </div>

      <a href="https://wa.me/527713338453?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20ALTAR%20Galer%C3%ADa" target="_blank" rel="noopener noreferrer" className="whatsapp-float">
        <WhatsAppIcon size={32} />
      </a>

      {loadingPost ? (
        <div className="bd-loading" style={{ maxWidth: 760, margin: "0 auto", padding: "140px 24px 80px" }}>
          <div className="skeleton" style={{ height: 32, width: 160, marginBottom: 40 }} />
          <div className="skeleton" style={{ height: 56, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 56, width: "70%", marginBottom: 40 }} />
          <div className="skeleton" style={{ height: 400, borderRadius: 20, marginBottom: 40 }} />
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 20, marginBottom: 14 }} />)}
        </div>
      ) : post ? (
        <article className="bd-article" style={{ maxWidth: 760, margin: "0 auto", padding: "140px 24px 80px" }}>
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <Link to="/blog" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", transition: "color 0.2s" }}>
              <ArrowLeft size={14} /> Blog
            </Link>
          </div>

          {post.categoria_nombre && (
            <div className="fade-up" style={{ marginBottom: 16 }}>
              <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 40, fontSize: 11, fontWeight: 700, background: `${C.orange}15`, color: C.orange, letterSpacing: ".1em", textTransform: "uppercase" }}>
                {post.categoria_nombre}
              </span>
            </div>
          )}

          <h1 className="fade-up" style={{ fontFamily: SERIF, fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, color: C.ink, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 24 }}>
            {post.titulo}
          </h1>

          {post.extracto && (
            <p className="fade-up" style={{ fontSize: 18, color: C.sub, lineHeight: 1.6, marginBottom: 32 }}>
              {post.extracto}
            </p>
          )}

          <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
            {post.autor_foto ? (
              <img src={post.autor_foto} alt={post.autor_nombre} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>
                {post.autor_nombre[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{post.autor_nombre}</div>
              <div style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> {formatFecha(post.fecha_publicacion)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Eye size={12} /> {post.vistas} vistas</span>
              </div>
            </div>
            {post.autor_matricula && (
              <Link to={`/artistas/${post.autor_matricula}`} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.orange, textDecoration: "none", border: `1px solid ${C.orange}40`, borderRadius: 100, padding: "6px 14px" }}>
                Ver perfil
              </Link>
            )}
          </div>

          {post.imagen_destacada && (
            <div className="fade-up" style={{ marginBottom: 48, borderRadius: 20, overflow: "hidden" }}>
              <img src={post.imagen_destacada} alt={post.titulo} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          )}

          <div className="prose fade-up" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contenido) }} />

          {/* ── Reacciones ── */}
          {emojis.length > 0 && (
            <section style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, marginBottom: 14 }}>
                ¿Qué te pareció esta publicación?
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {emojis.map((e) => {
                  const total = conteos.find((c) => c.emoji === e)?.total || 0;
                  const activa = miReaccion === e;
                  return (
                    <button
                      key={e}
                      onClick={() => toggleReaccion(e)}
                      onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                      disabled={reaccionando}
                      title={activa ? "Quitar mi reacción" : "Reaccionar"}
                      className={`reaccion-pill${activa ? " active" : ""}`}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{e}</span>
                      {total > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: activa ? C.orange : C.sub }}>{total}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!isLoggedIn && (
                <p style={{ fontSize: 12, color: C.sub, marginTop: 10 }}>
                  Inicia sesión para reaccionar — solo una reacción por persona.
                </p>
              )}
            </section>
          )}

          {/* ── Posts relacionados (modelo de clasificación) ── */}
          {relacionados.length > 0 && (
            <section style={{ marginTop: 48, paddingTop: 48, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.orange }}>
                Sigue leyendo
              </span>
              <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 800, color: C.ink, margin: "10px 0 28px" }}>
                Posts relacionados
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 }}>
                {relacionados.map(rp => (
                  <Link
                    key={rp.id_post}
                    to={`/blog/${rp.slug}`}
                    className="rel-card"
                    onMouseEnter={cursorOn}
                    onMouseLeave={cursorOff}
                    style={{ textDecoration: "none", display: "flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff" }}
                  >
                    <div style={{ aspectRatio: "16 / 10", background: C.dark, overflow: "hidden" }}>
                      {rp.imagen_destacada && (
                        <img src={rp.imagen_destacada} alt={rp.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.25, transition: "color 0.2s" }}>
                        {rp.titulo}
                      </h3>
                      {rp.etiquetas?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
                          {rp.etiquetas.slice(0, 3).map(et => (
                            <span key={et} style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: C.sub, border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 100 }}>
                              {et}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Sección de comentarios ── */}
          <section style={{ marginTop: 48, paddingTop: 48, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <img src={estrellaImg} alt="NUB" style={{ width: 28, height: 28, objectFit: "contain" }} />
              <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 800, color: C.ink, margin: 0 }}>
                {loadingComents ? "Cargando comentarios…" : `${contarComentarios(comentarios)} comentario${contarComentarios(comentarios) !== 1 ? "s" : ""}`}
              </h2>
            </div>

            {/* Formulario de nuevo comentario */}
            {isLoggedIn && (userRol === "cliente" || userRol === "artista") ? (
              <div style={{ background: "#fafaf9", borderRadius: 18, padding: 24, marginBottom: 40, border: `1px solid ${C.border}` }}>
                {respondiendo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "8px 14px", background: `${C.orange}10`, borderRadius: 10 }}>
                    <ChevronRight size={14} color={C.orange} />
                    <span style={{ fontSize: 13, color: C.ink }}>Respondiendo a <strong>{respondiendo.nombre}</strong></span>
                    <button onClick={() => setRespondiendo(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                )}
                <textarea
                  ref={commentRef}
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder={respondiendo ? `Responder a ${respondiendo.nombre}…` : "Escribe un comentario…"}
                  className="comment-textarea"
                  maxLength={2000}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: C.sub }}>{nuevoComentario.length}/2000</span>
                  <button className="btn-primary" onClick={enviarComentario} disabled={enviando || !nuevoComentario.trim()}>
                    <Send size={13} /> {enviando ? "Enviando…" : "Publicar"}
                  </button>
                </div>
              </div>
            ) : !isLoggedIn ? (
              <div style={{ background: "#fafaf9", borderRadius: 18, padding: 24, marginBottom: 40, textAlign: "center", border: `1px solid ${C.border}` }}>
                <p style={{ color: C.sub, marginBottom: 16, fontSize: 14 }}>
                  Para comentar necesitas iniciar sesión
                </p>
                <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#fff", background: C.orange, padding: "10px 24px", borderRadius: 100, textDecoration: "none" }}>
                  Iniciar sesión
                </Link>
              </div>
            ) : null}

            {/* Lista de comentarios */}
            {loadingComents ? (
              <div>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", gap: 14, marginBottom: 28 }}>
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: "30%", marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 14, width: "80%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : comentarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px", color: C.sub }}>
                <MessageCircle size={36} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Sé el primero en comentar</p>
              </div>
            ) : (
              <div>
                {comentarios.map((c) => (
                  <ComentarioItem
                    key={c.id_comentario}
                    comentario={c}
                    idUsuarioActual={idUsuarioActual}
                    canComment={isLoggedIn && (userRol === "cliente" || userRol === "artista")}
                    onResponder={iniciarRespuesta}
                    onEliminar={eliminarComentario}
                    cursorOn={cursorOn}
                    cursorOff={cursorOff}
                  />
                ))}
              </div>
            )}
          </section>
        </article>
      ) : null}
    </div>
  );
}

function ComentarioItem({
  comentario, idUsuarioActual, canComment, onResponder, onEliminar, cursorOn, cursorOff,
}: {
  comentario: Comentario;
  idUsuarioActual: number;
  canComment: boolean;
  onResponder: (id: number, nombre: string) => void;
  onEliminar: (id: number) => void;
  cursorOn: () => void;
  cursorOff: () => void;
}) {
  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  const indent = comentario.nivel * 28;

  return (
    <div style={{ marginLeft: indent, marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {comentario.autor_foto ? (
          <img src={comentario.autor_foto} alt={comentario.autor_nombre} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6028AA, #A83B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>
            {comentario.autor_nombre[0]}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fafaf9", borderRadius: "0 16px 16px 16px", padding: "14px 18px", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#14121E" }}>{comentario.autor_nombre}</span>
                {comentario.usuario_rol === "artista" && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "#E8640C15", color: "#E8640C", borderRadius: 20, padding: "2px 8px" }}>Artista</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#9896A8" }}>{formatFecha(comentario.fecha_creacion)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#2a2840", lineHeight: 1.6 }}>{comentario.contenido}</p>
            {comentario.imagen_url && (
              <img src={comentario.imagen_url} alt="adjunto" style={{ marginTop: 12, maxWidth: 240, borderRadius: 10, display: "block" }} />
            )}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, paddingLeft: 4 }}>
            {canComment && comentario.nivel < 2 && (
              <button
                onClick={() => onResponder(comentario.id_comentario, comentario.autor_nombre)}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#9896A8", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s", padding: 0 }}
              >
                <MessageCircle size={12} /> Responder
              </button>
            )}
            {idUsuarioActual > 0 && comentario.id_usuario === idUsuarioActual && (
              <button
                onClick={() => onEliminar(comentario.id_comentario)}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#9896A8", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s", padding: 0 }}
              >
                <Trash2 size={12} /> Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {comentario.respuestas.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {comentario.respuestas.map(r => (
            <ComentarioItem
              key={r.id_comentario}
              comentario={r}
              idUsuarioActual={idUsuarioActual}
              canComment={canComment}
              onResponder={onResponder}
              onEliminar={onEliminar}
              cursorOn={cursorOn}
              cursorOff={cursorOff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
