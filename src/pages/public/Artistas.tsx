// src/pages/public/Artistas.tsx (REFACTORIZADO - LAYOUT VERTICAL)
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Grid3x3, LayoutList, Layers } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  ink:    "#14121E",
  sub:    "#9896A8",
  dark:   "#0D0B14",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

type ViewMode = "grid" | "list" | "compact";

interface Artista {
  id_artista:      number;
  nombre_completo: string;
  nombre_artistico?: string;
  alias?:          string;
  biografia?:      string;
  foto_perfil?:    string;
  foto_portada?:   string;
  categoria_nombre?: string;
  total_obras?:    number;
}

function useReveal(threshold = 0.10) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const targets = container.querySelectorAll<HTMLElement>("[data-rv],[data-clip],[data-clip-h],[data-num]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add("rv-in");
          if (el.dataset.num) {
            const raw    = el.dataset.num;
            const suffix = raw.replace(/[\d.]/g, "");
            const target = Number.parseFloat(raw);
            const dur    = 1200;
            const start  = performance.now();
            const tick = (now: number) => {
              const p    = Math.min((now - start) / dur, 1);
              const ease = 1 - Math.pow(1 - p, 4);
              el.textContent = Math.round(ease * target) + suffix;
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = raw;
            };
            requestAnimationFrame(tick);
          }
          io.unobserve(el);
        }
      });
    }, { threshold });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);
  return containerRef;
}

// ── ARTISTA CARD ──
function ArtistaCard({ 
  artista, 
  viewMode,
  index,
  cursorOn,
  cursorOff
}: { 
  readonly artista: Artista; 
  readonly viewMode: ViewMode;
  readonly index: number;
  readonly cursorOn: () => void;
  readonly cursorOff: () => void;
}) {
  const navigate = useNavigate();
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const seudonimo = artista.nombre_artistico || artista.alias || artista.nombre_completo.split(" ")[0];
  const obras = artista.total_obras || 0;

  // ── MODO LIST ──
  if (viewMode === "list") {
    return (
      <div
        ref={ref}
        data-rv data-d={String((index % 5) + 1)}
        onClick={() => navigate(`/artistas/${artista.id_artista}`)}
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "20px 24px",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,.05)",
          cursor: "pointer",
          opacity: inView ? 1 : 0.5,
          transition: "all .4s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          overflow: "hidden",
          background: `${C.orange}15`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 900,
          color: C.orange,
        }}>
          {artista.foto_perfil ? (
            <img src={artista.foto_perfil} alt={seudonimo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            seudonimo[0].toUpperCase()
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: NEXA_HEAVY, fontSize: 18, fontWeight: 900, color: C.ink, letterSpacing: "-.02em", marginBottom: 4 }}>
            {seudonimo}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.sub }}>
            {artista.nombre_completo}
          </div>
          {artista.categoria_nombre && (
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 600, marginTop: 6, fontFamily: SANS }}>
              {artista.categoria_nombre}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: C.ink, fontStyle: "italic" }}>
            {obras}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: C.sub, fontWeight: 600 }}>
            obras
          </div>
        </div>
      </div>
    );
  }

  // ── MODO COMPACT ──
  if (viewMode === "compact") {
    return (
      <div
        ref={ref}
        data-rv data-d={String((index % 5) + 1)}
        onClick={() => navigate(`/artistas/${artista.id_artista}`)}
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,.05)",
          cursor: "pointer",
          overflow: "hidden",
          opacity: inView ? 1 : 0.5,
          transition: "all .55s cubic-bezier(.16,1,.3,1)",
          boxShadow: "0 4px 12px rgba(0,0,0,.06)",
        }}
      >
        <div style={{
          height: 100,
          background: `linear-gradient(135deg, ${C.orange}20 0%, ${C.pink}15 100%)`,
          position: "relative",
          overflow: "hidden",
        }}>
          {artista.foto_portada && (
            <img src={artista.foto_portada} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
          )}
        </div>

        <div style={{
          padding: "0 16px",
          marginTop: -32,
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          marginBottom: 12,
        }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: 14,
            border: "3px solid #fff",
            overflow: "hidden",
            background: `${C.orange}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 900,
            color: C.orange,
            boxShadow: "0 4px 16px rgba(0,0,0,.10)",
          }}>
            {artista.foto_perfil ? (
              <img src={artista.foto_perfil} alt={seudonimo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              seudonimo[0].toUpperCase()
            )}
          </div>
        </div>

        <div style={{ padding: "12px 16px 18px", textAlign: "center" }}>
          <div style={{
            fontFamily: NEXA_HEAVY,
            fontSize: 16,
            fontWeight: 900,
            color: C.ink,
            letterSpacing: "-.02em",
            marginBottom: 4,
          }}>
            {seudonimo}
          </div>
          <div style={{
            fontFamily: SANS,
            fontSize: 11,
            color: C.sub,
            marginBottom: 10,
          }}>
            {artista.nombre_completo}
          </div>
          <div style={{
            fontFamily: SERIF,
            fontSize: 13,
            fontWeight: 900,
            color: C.orange,
            fontStyle: "italic",
          }}>
            {obras} {obras === 1 ? "obra" : "obras"}
          </div>
        </div>
      </div>
    );
  }

  // ── MODO GRID ──
  return (
    <div
      ref={ref}
      data-rv data-d={String((index % 5) + 1)}
      onClick={() => navigate(`/artistas/${artista.id_artista}`)}
      onMouseEnter={cursorOn}
      onMouseLeave={cursorOff}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,.05)",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,.06)",
        opacity: inView ? 1 : 0.5,
        transition: "all .55s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${C.orange}25 0%, ${C.pink}18 100%)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {artista.foto_portada ? (
          <img src={artista.foto_portada} alt="" style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.7s cubic-bezier(0.2, 0, 0, 1)",
          }} />
        ) : (
          <div style={{
            fontSize: 64,
            fontWeight: 900,
            color: C.orange,
            opacity: 0.15,
            fontFamily: SERIF,
          }}>
            ★
          </div>
        )}
      </div>

      <div style={{
        padding: "0 20px",
        marginTop: -48,
        position: "relative",
        zIndex: 2,
        marginBottom: 16,
      }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 20,
          border: "4px solid #fff",
          overflow: "hidden",
          background: `${C.orange}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          fontWeight: 900,
          color: C.orange,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        }}>
          {artista.foto_perfil ? (
            <img src={artista.foto_perfil} alt={seudonimo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            seudonimo[0].toUpperCase()
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <h3 style={{
          fontFamily: NEXA_HEAVY,
          fontSize: "clamp(24px, 5vw, 32px)",
          fontWeight: 900,
          color: C.ink,
          letterSpacing: "-.03em",
          margin: "0 0 8px",
          lineHeight: 1.1,
        }}>
          {seudonimo}
        </h3>

        <div style={{
          fontFamily: SANS,
          fontSize: 13,
          color: C.sub,
          marginBottom: 12,
        }}>
          {artista.nombre_completo}
        </div>

        {artista.categoria_nombre && (
          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 20,
            background: `${C.orange}15`,
            fontSize: 10,
            fontWeight: 700,
            color: C.orange,
            fontFamily: SANS,
            letterSpacing: ".5px",
            marginBottom: 14,
          }}>
            {artista.categoria_nombre}
          </div>
        )}

        {artista.biografia && (
          <p style={{
            fontFamily: SANS,
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.5,
            margin: "0 0 16px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {artista.biografia}
          </p>
        )}

        <div style={{
          height: 1,
          background: "rgba(0,0,0,.05)",
          margin: "16px 0",
        }} />

        <div style={{
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 900,
          color: C.ink,
          fontStyle: "italic",
        }}>
          {obras} <span style={{ fontFamily: SANS, fontSize: 11, color: C.sub, fontWeight: 600 }}>{obras === 1 ? "obra" : "obras"}</span>
        </div>
      </div>
    </div>
  );
}

export default function Artistas() {
  const navigate = useNavigate();
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const artistasRef = useRef<HTMLDivElement>(null);

  const pageRef = useReveal(0.10);

  const cursorOn = useCallback(() => {}, []);
  const cursorOff = useCallback(() => {}, []);

  const scrollToArtistas = () => {
    if (artistasRef.current) {
      artistasRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/artistas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const json = await res.json();
        
        // El backend retorna { success: true, data: [...] }
        const artistasData = json.data && Array.isArray(json.data) ? json.data : [];
        
        console.log("Artistas recibidos:", artistasData.length, artistasData);
        
        if (artistasData.length > 0) {
          setArtistas(artistasData);
        } else {
          // Si no hay datos, usar datos de prueba
          setArtistas([
            { id_artista: 1, nombre_completo: "Artista Uno", nombre_artistico: "Artist 1", foto_perfil: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", total_obras: 12, categoria_nombre: "Pintura" },
            { id_artista: 2, nombre_completo: "Artista Dos", nombre_artistico: "Artist 2", foto_perfil: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", total_obras: 8, categoria_nombre: "Escultura" },
            { id_artista: 3, nombre_completo: "Artista Tres", nombre_artistico: "Artist 3", foto_perfil: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80", total_obras: 15, categoria_nombre: "Fotografía" },
            { id_artista: 4, nombre_completo: "Artista Cuatro", nombre_artistico: "Artist 4", foto_perfil: "https://images.unsplash.com/photo-1507842955343-583cf270ce90?w=400&q=80", total_obras: 10, categoria_nombre: "Pintura" },
            { id_artista: 5, nombre_completo: "Artista Cinco", nombre_artistico: "Artist 5", foto_perfil: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80", total_obras: 20, categoria_nombre: "Cerámica" },
            { id_artista: 6, nombre_completo: "Artista Seis", nombre_artistico: "Artist 6", foto_perfil: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80", total_obras: 7, categoria_nombre: "Textiles" },
          ]);
        }
      } catch (err) {
        console.error("Error cargando artistas:", err);
        // Fallback a datos de prueba si hay error
        setArtistas([
          { id_artista: 1, nombre_completo: "Artista Uno", nombre_artistico: "Artist 1", foto_perfil: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", total_obras: 12, categoria_nombre: "Pintura" },
          { id_artista: 2, nombre_completo: "Artista Dos", nombre_artistico: "Artist 2", foto_perfil: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", total_obras: 8, categoria_nombre: "Escultura" },
          { id_artista: 3, nombre_completo: "Artista Tres", nombre_artistico: "Artist 3", foto_perfil: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80", total_obras: 15, categoria_nombre: "Fotografía" },
          { id_artista: 4, nombre_completo: "Artista Cuatro", nombre_artistico: "Artist 4", foto_perfil: "https://images.unsplash.com/photo-1507842955343-583cf270ce90?w=400&q=80", total_obras: 10, categoria_nombre: "Pintura" },
          { id_artista: 5, nombre_completo: "Artista Cinco", nombre_artistico: "Artist 5", foto_perfil: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80", total_obras: 20, categoria_nombre: "Cerámica" },
          { id_artista: 6, nombre_completo: "Artista Seis", nombre_artistico: "Artist 6", foto_perfil: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80", total_obras: 7, categoria_nombre: "Textiles" },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorias = [...new Set(artistas.map(a => a.categoria_nombre).filter(Boolean))];
  const filtrados = artistas.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || 
      [a.nombre_completo, a.nombre_artistico, a.alias, a.biografia].some(v => v?.toLowerCase().includes(q));
    const matchCat = !catActiva || a.categoria_nombre === catActiva;
    return matchSearch && matchCat;
  });

  const totalObras = artistas.reduce((sum, a) => {
    const obras = typeof a.total_obras === 'string' ? Number.parseInt(a.total_obras, 10) : (a.total_obras || 0);
    return sum + (isNaN(obras) ? 0 : obras);
  }, 0);

  return (
    <div ref={pageRef} style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');

        @font-face {
          font-family: 'SolveraLorvane';
          src: url('/fonts/SolveraLorvane.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Nexa-Heavy';
          src: url('/fonts/Nexa-Heavy.ttf') format('truetype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        @keyframes fadeL    { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeI    { from{opacity:0} to{opacity:1} }
        @keyframes pulse    { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }
        @keyframes slideDown { 0% { transform: translateX(-50%) translateY(0); opacity: 0.6 } 50% { transform: translateX(-50%) translateY(12px); opacity: 1 } 100% { transform: translateX(-50%) translateY(0); opacity: 0.6 } }

        [data-rv]   { opacity:0; transform:translateY(26px); transition:opacity .9s ease, transform .9s ease; }
        [data-rv].rv-in   { opacity:1; transform:translateY(0); }
        [data-rv][data-d="1"]{transition-delay:.06s}
        [data-rv][data-d="2"]{transition-delay:.14s}
        [data-rv][data-d="3"]{transition-delay:.22s}
        [data-rv][data-d="4"]{transition-delay:.30s}
        [data-rv][data-d="5"]{transition-delay:.38s}

        input::placeholder { color: ${C.sub}; }
      `}</style>

      {/* ═══ MENÚ NAVEGACIÓN - LADO IZQUIERDO (COMO ANTES) ═══ */}
      <nav style={{ position: "absolute", top: 40, left: 52, display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        <a href="/catalogo" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", transition: "color .25s" }}>
          <span style={{ display: "block", width: 12, height: 1, background: "currentColor", flexShrink: 0, transition: "width .28s" }} /> Galería
        </a>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", transition: "color .25s" }}>
          <span style={{ display: "block", width: 12, height: 1, background: "currentColor", flexShrink: 0, transition: "width .28s" }} /> Inicio
        </a>
        <a href="/blog" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.orange, textDecoration: "none", transition: "color .25s" }}>
          <span style={{ display: "block", width: 12, height: 1, background: "currentColor", flexShrink: 0, transition: "width .28s" }} /> Artistas
        </a>
        <a href="/sobre-nosotros" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", transition: "color .25s" }}>
          <span style={{ display: "block", width: 12, height: 1, background: "currentColor", flexShrink: 0, transition: "width .28s" }} /> Contacto
        </a>
      </nav>

      {/* ═══ HERO VERTICAL CON BOTÓN DESCUBRE CENTRADO ═══ */}
      <section style={{
        padding: "80px 72px 100px",
        position: "relative",
        overflow: "visible",
        borderBottom: "1px solid rgba(0,0,0,.05)",
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
          <div data-rv style={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: ".3em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 28,
            fontFamily: SANS,
          }}>
            <span style={{ display: "block", width: 18, height: 1, background: "rgba(0,0,0,.05)" }} />
            Directorio de artistas
            <span style={{ display: "block", width: 18, height: 1, background: "rgba(0,0,0,.05)" }} />
          </div>

          <h1 data-rv data-d="1" style={{
            fontFamily: NEXA_HEAVY,
            fontSize: "clamp(52px, 8vw, 76px)",
            fontWeight: 900,
            color: C.ink,
            lineHeight: 1.06,
            letterSpacing: "-.025em",
            margin: "0 0 24px",
          }}>
            Nuestros<br /><span style={{ color: C.orange }}>Artistas</span>
          </h1>

          <p data-rv data-d="2" style={{
            fontSize: 16,
            color: C.sub,
            lineHeight: 1.7,
            fontFamily: SANS,
            maxWidth: 560,
            margin: "0 auto 80px",
          }}>
            Creadores que dan vida al arte huasteco con sus manos, su historia y su pasión. Conoce el talento detrás de cada obra.
          </p>

          {/* ═══ BOTÓN DESCUBRE - CENTRADO Y MEJORADO ═══ */}
          <div 
            onClick={scrollToArtistas}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              const circle = (e.currentTarget as HTMLElement).querySelector('.circle-hover') as HTMLElement;
              if (circle) circle.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              const circle = (e.currentTarget as HTMLElement).querySelector('.circle-hover') as HTMLElement;
              if (circle) circle.style.transform = "scale(0)";
            }}
          >
            <div style={{ position: "relative" }}>
              <div 
                className="circle-hover"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 90,
                  height: 90,
                  marginLeft: -45,
                  marginTop: -45,
                  borderRadius: "50%",
                  background: `${C.orange}15`,
                  transform: "scale(0)",
                  transition: "transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
                  pointerEvents: "none",
                }}
              />
              <div style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: `2px solid ${C.orange}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                color: C.orange,
                transition: "all 0.3s ease",
                position: "relative",
                zIndex: 1,
              }}>
                ↓
              </div>
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".3em",
              textTransform: "uppercase",
              color: C.orange,
              fontFamily: SANS,
            }}>
              DESCUBRE
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ padding: "50px 72px 70px", borderTop: "1px solid rgba(0,0,0,.05)", borderBottom: "1px solid rgba(0,0,0,.05)", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
          {[
            { val: artistas.length.toString(), label: "Artistas activos" },
            { val: totalObras.toString(), label: "Obras creadas" },
            { val: categorias.length.toString(), label: "Categorías" },
          ].map((stat, i) => (
            <div key={stat.label} data-rv data-d={String(i + 1)} style={{ padding: "20px 0", textAlign: "center", position: "relative" }}>
              {i > 0 && <div style={{ position: "absolute", left: 0, top: "15%", height: "70%", width: 1, background: "rgba(0,0,0,.08)" }} />}
              <div style={{ fontFamily: SERIF, fontSize: "clamp(38px,5vw,54px)", fontWeight: 900, fontStyle: "italic", color: C.ink, letterSpacing: "-.03em", lineHeight: 1, display: "inline-block", marginBottom: 8 }}>{stat.val}</div>
              <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.25)", marginTop: 10, fontFamily: SANS }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONTENIDO ARTISTAS ═══ */}
      <div ref={artistasRef} style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 72px 100px" }}>
        
        {/* Buscador y filtros */}
        <div style={{ marginBottom: 40 }}>
          {/* Search */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#fff",
            borderRadius: 8,
            padding: "12px 20px",
            border: "1px solid rgba(0,0,0,.05)",
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,.06)",
          }}>
            <Search size={20} color={C.orange} strokeWidth={1.5} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artista por nombre..."
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15,
                flex: 1,
                color: C.ink,
                fontFamily: SANS,
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                style={{ background: `${C.orange}10`, border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} color={C.orange} />
              </button>
            )}
          </div>

          {/* View Mode */}
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,.03)", borderRadius: 50, padding: 4 }}>
              {[
                { mode: "grid" as ViewMode, icon: Grid3x3, label: "Grid" },
                { mode: "compact" as ViewMode, icon: Layers, label: "Compact" },
                { mode: "list" as ViewMode, icon: LayoutList, label: "List" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 40,
                    background: viewMode === mode ? C.orange : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: viewMode === mode ? 700 : 500,
                    color: viewMode === mode ? "#fff" : C.sub,
                    transition: "all .22s",
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 13, color: C.sub }}>
              <strong style={{ color: C.ink }}>{filtrados.length}</strong> artistas
            </div>
          </div>
        </div>

        {/* Filtros categoría */}
        {categorias.length > 0 && (
          <div style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 32,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(0,0,0,.05)",
          }}>
            <button
              onClick={() => setCatActiva(null)}
              style={{
                padding: "8px 18px",
                borderRadius: 40,
                border: `1px solid ${catActiva === null ? C.orange : "rgba(0,0,0,.10)"}`,
                background: catActiva === null ? C.orange : "transparent",
                color: catActiva === null ? "#fff" : C.ink,
                fontSize: 13,
                fontWeight: catActiva === null ? 700 : 600,
                cursor: "pointer",
                fontFamily: SANS,
                transition: "all .22s",
              }}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCatActiva(catActiva === cat ? null : cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 40,
                  border: `1px solid ${catActiva === cat ? C.orange : "rgba(0,0,0,.10)"}`,
                  background: catActiva === cat ? C.orange : "transparent",
                  color: catActiva === cat ? "#fff" : C.ink,
                  fontSize: 13,
                  fontWeight: catActiva === cat ? 700 : 600,
                  cursor: "pointer",
                  fontFamily: SANS,
                  transition: "all .22s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: viewMode === "list" ? "1fr" : viewMode === "compact" ? "repeat(auto-fill, minmax(280px, 1fr))" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: viewMode === "list" ? 16 : 28,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: viewMode === "list" ? 100 : 380,
                background: "rgba(0,0,0,.04)",
                borderRadius: 12,
              }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: NEXA_HEAVY, fontSize: 24, fontWeight: 900, color: C.ink, marginBottom: 8 }}>
              No encontramos artistas
            </div>
            <div style={{ fontSize: 14, color: C.sub }}>
              Intenta con otro término de búsqueda
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: viewMode === "list" ? "1fr" : viewMode === "compact" ? "repeat(auto-fill, minmax(280px, 1fr))" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: viewMode === "list" ? 16 : 28,
          }}>
            {filtrados.map((artista, i) => (
              <ArtistaCard
                key={artista.id_artista}
                artista={artista}
                viewMode={viewMode}
                index={i}
                cursorOn={cursorOn}
                cursorOff={cursorOff}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}