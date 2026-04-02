// src/pages/public/AcervoDetalle.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  border:   "#E6E4EF",
};

const FD = "'Playfair Display', serif";
const FB = "'Outfit', sans-serif";

const heroImages: Record<string, string> = {
  pintura:     "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=90",
  artesania:   "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=1600&q=90",
  fotografia:  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600&q=90",
  escultura:   "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=1600&q=90",
  ceramica:    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600&q=90",
  grabado:     "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1600&q=90",
  ilustracion: "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=1600&q=90",
  textil:      "https://images.unsplash.com/photo-1609078011441-82e4d9b8dc9b?w=1600&q=90",
  todas:       "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=90",
  default:     "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=90",
};

function getHeroImage(slug: string) {
  return heroImages[slug?.toLowerCase()] ?? heroImages.default;
}

const ORDENAR = [
  { val: "recientes",   label: "Más recientes"         },
  { val: "antiguos",    label: "Más antiguos"           },
  { val: "nombre",      label: "A → Z"                 },
  { val: "precio_asc",  label: "Precio: menor a mayor"  },
  { val: "precio_desc", label: "Precio: mayor a menor"  },
];

interface Obra {
  id_obra: number; titulo: string; slug: string;
  imagen_principal: string; precio_base: number; precio_minimo: number;
  categoria_nombre: string; artista_nombre: string; artista_alias: string;
  anio_creacion: number; vistas: number; estado: string;
}
interface Categoria {
  id_categoria: number; nombre: string; slug: string; descripcion?: string;
}

function SkeletonHorizontal() {
  return (
    <div style={{
      display: "flex", gap: 64,
      padding: "80px 96px 100px 96px",
    }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ flexShrink: 0, width: 238, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ width: 238, height: 306, background: "#ece9e4" }} />
          <div style={{ width: 180, height: 16, background: "#ece9e4", marginTop: 14, borderRadius: 4 }} />
          <div style={{ width: 80, height: 14, background: "#ece9e4", marginTop: 6, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function AcervoDetalle() {
  const navigate       = useNavigate();
  const { slug }       = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const [categoria, setCategoria]   = useState<Categoria | null>(null);
  const [obras, setObras]           = useState<Obra[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]   = useState(searchParams.get("q") || "");
  const [ordenar, setOrdenar] = useState(searchParams.get("ordenar") || "recientes");
  const [page, setPage]       = useState(Number(searchParams.get("page")) || 1);

  const galRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const esAll  = !slug || slug === "todas";

  useEffect(() => {
    if (esAll) { setCategoria(null); return; }
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(j => {
        const cats: Categoria[] = j.data || [];
        setCategoria(cats.find(c => c.slug === slug) || null);
      })
      .catch(() => {});
  }, [slug, esAll]);

  const cargarObras = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim().length >= 2) {
        const res  = await fetch(`${API_URL}/api/obras/buscar?q=${encodeURIComponent(search)}&page=${page}&limit=12`);
        const json = await res.json();
        setObras(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      } else {
        const params = new URLSearchParams({ page: String(page), limit: "12", ordenar });
        if (categoria) params.set("categoria", String(categoria.id_categoria));
        const res  = await fetch(`${API_URL}/api/obras?${params}`);
        const json = await res.json();
        setObras(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch { setObras([]); }
    finally   { setLoading(false); }
  }, [search, categoria, ordenar, page]);

  useEffect(() => { cargarObras(); }, [cargarObras]);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const scrollToGal  = () => galRef.current?.scrollIntoView({ behavior: "smooth" });

  const nombreCat = categoria?.nombre ?? "Acervo";
  const heroImg   = getHeroImage(esAll ? "todas" : (slug ?? "default"));

  // Efecto de parallax en el hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: FB, overflowX: "visible" }}>

      {/* ══ HERO CON ANIMACIONES DE MUSEO Y PARALLAX ══ */}
      <div style={{
        position: "relative",
        height: "100vh", minHeight: 620, maxHeight: 800,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        {/* Imagen con parallax */}
        <div ref={heroRef} style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "120%",
          top: "-10%",
          transition: "transform 0.1s ease-out",
        }}>
          <img src={heroImg} alt={nombreCat} style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
            filter: "brightness(0.4)",
          }} />
        </div>

        {/* Gradiente mejorado */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(20,18,30,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)",
        }} />

        {/* Efecto de luz que se mueve */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          background: "radial-gradient(ellipse at 30% 40%, rgba(232,100,12,0.15) 0%, transparent 60%)",
          animation: "lightMove 8s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Partículas sutiles */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          opacity: 0.5,
        }} />

        {/* Overlay que se desvanece al entrar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.3)",
          pointerEvents: "none",
          animation: "fadeOut 1.8s ease forwards",
        }} />

        {/* ❌ LÍNEA NARANJA ELIMINADA - Comentada o removida */}
        {/* 
        <div style={{
          position: "absolute",
          top: "30%",
          left: 0,
          width: "100%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${C.orange}, transparent)`,
          transform: "scaleX(0)",
          transformOrigin: "center",
          animation: "expandLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }} />
        */}

        <div style={{
          position: "relative", zIndex: 2, width: "100%", maxWidth: 1200,
          margin: "0 auto", padding: "0 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            {/* Badge con efecto vidrio */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: 24,
              animation: "slideDown 0.6s ease both",
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.orange,
                display: "inline-block",
                animation: "pulse 2s infinite",
              }} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
              }}>
                {categoria ? categoria.nombre : "Colección"}
              </span>
            </div>

            {/* Título con animación de letras */}
            <h1 style={{
              fontFamily: FD, fontSize: "clamp(56px, 9vw, 100px)",
              fontWeight: 700, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 0.9, margin: "0 0 28px",
              opacity: 0,
              transform: "translateY(30px)",
              animation: "titleReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards",
            }}>
              {nombreCat.split("").map((letter, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    animation: `letterPop 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) ${0.3 + i * 0.03}s forwards`,
                    opacity: 0,
                    transform: "translateY(20px)",
                  }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </span>
              ))}
            </h1>

            <p style={{
              fontSize: 15, color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6, maxWidth: 440, margin: 0,
              opacity: 0,
              transform: "translateY(20px)",
              animation: "fadeUp 0.6s ease 0.5s forwards",
            }}>
              {categoria?.descripcion || "Descubre nuestras obras seleccionadas de artistas locales e internacionales."}
            </p>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {!loading && (
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10,
                opacity: 0,
                animation: "fadeIn 0.6s ease 0.7s forwards",
              }}>
                {total} obras disponibles
              </div>
            )}
          </div>
        </div>

        {/* ⬇️ INDICADOR DE SCROLL GRANDE Y CENTRADO ⬇️ */}
        <div
          onClick={scrollToGal}
          style={{
            position: "absolute",
            bottom: "48px",
            left: "50%",
            transform: "translateX(-50%)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            zIndex: 10,
            opacity: 0,
            animation: "fadeUp 0.6s ease 1s forwards",
          }}
        >
          {/* Círculo decorativo con glow */}
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: `1.5px solid rgba(255,255,255,0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.2, 0, 0, 1)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 0 20px rgba(232,100,12,0)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.orange;
            (e.currentTarget as HTMLElement).style.background = `rgba(232,100,12,0.2)`;
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${C.orange}40`;
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(232,100,12,0)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}>
            <ArrowDown size={28} color="white" strokeWidth={1.5} style={{ animation: "bounce 1.8s ease-in-out infinite" }} />
          </div>
          
          {/* Texto */}
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}>
            DESCUBRIR
          </div>
          
          {/* Línea animada */}
          <div style={{
            width: 1,
            height: 40,
            background: `linear-gradient(to bottom, ${C.orange}, transparent)`,
            animation: "scrollLine 2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* ══ CONTROLES ══ */}
      <div ref={galRef} style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 72px 0" }}>

        {/* Buscador */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          border: `1px solid ${C.border}`, borderRadius: 60,
          padding: "8px 8px 8px 28px", marginBottom: 48,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 640,
        }}>
          <Search size={18} color={C.creamMut} />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar obra, artista..."
            style={{
              border: "none", outline: "none", flex: 1,
              fontSize: 15, fontFamily: FB, padding: "12px 0", background: "transparent",
            }}
          />
          {search && (
            <button onClick={() => handleSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={15} color={C.creamMut} />
            </button>
          )}
          <button style={{
            background: C.orange, border: "none", borderRadius: 60,
            padding: "10px 28px", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB,
          }}>
            Buscar
          </button>
        </div>

        {/* Resultados + ordenar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 32, flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ fontSize: 13, color: C.creamMut }}>
            {!loading && <><strong style={{ color: C.cream }}>{total}</strong> obras encontradas</>}
          </div>
          <select value={ordenar} onChange={e => { setOrdenar(e.target.value); setPage(1); }} style={{
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 40,
            padding: "9px 20px", fontSize: 12, fontFamily: FB,
            cursor: "pointer", outline: "none", color: C.cream,
          }}>
            {ORDENAR.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>

        {/* Label sección */}
        <div style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: "0.30em",
          textTransform: "uppercase", color: "rgba(0,0,0,0.16)",
          display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
        }}>
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
          {categoria ? categoria.nombre : "Todas las obras"}
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
        </div>
      </div>

      {/* ══ SECCIÓN SCROLL HORIZONTAL - CON TÍTULO Y PRECIO ══ */}
      <section style={{
        background: "#fafaf9",
        borderTop: "1px solid rgba(0,0,0,.04)",
        overflow: "visible",
        padding: "40px 0",
        minHeight: "600px",
      }}>
        {loading ? (
          <SkeletonHorizontal />
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <div style={{ fontSize: 18, color: C.creamSub, marginBottom: 8 }}>No se encontraron obras</div>
            <div style={{ fontSize: 13, color: C.creamMut }}>Intenta con otro término de búsqueda</div>
          </div>
        ) : (
          <div
            className="scroll-horizontal"
            style={{
              display: "flex",
              gap: 64,
              overflowX: "auto",
              overflowY: "visible",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,0,0,.15) rgba(0,0,0,0.08)",
              padding: "80px 96px 100px 96px",
              WebkitOverflowScrolling: "touch",
              alignItems: "flex-start",
            }}
          >
            {obras.map((obra) => {
              const precio = obra.precio_minimo || obra.precio_base;
              const formattedPrice = Number(precio || 0).toLocaleString("es-MX");
              
              return (
                <div
                  key={obra.id_obra}
                  className="obra-item"
                  onClick={() => navigate(`/obras/${obra.slug}`)}
                  style={{
                    flexShrink: 0,
                    width: 238,
                    cursor: "pointer",
                    scrollSnapAlign: "start",
                    zIndex: 1,
                    transition: "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                    transformOrigin: "center center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.zIndex = "20";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.32)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.zIndex = "1";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                >
                  {/* Imagen */}
                  <div className="obra-image-wrapper" style={{ width: 238, height: 306, overflow: "hidden" }}>
                    <img
                      src={obra.imagen_principal}
                      alt={obra.titulo}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                        transition: "transform 0.7s cubic-bezier(0.2, 0, 0, 1)",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80";
                      }}
                    />
                  </div>

                  {/* Información - Título y Precio */}
                  <div style={{
                    marginTop: 14,
                    textAlign: "left",
                    width: 238,
                  }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.cream,
                      fontFamily: FD,
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                      marginBottom: 4,
                    }}>
                      {obra.titulo}
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.orange,
                      fontFamily: FB,
                    }}>
                      ${formattedPrice} MXN
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Paginación */}
      {totalPages > 1 && !loading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "40px 0 60px",
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: 38, height: 38, borderRadius: 38,
              border: `1px solid ${C.border}`, background: "#fff",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 38, height: 38, borderRadius: 38,
                border: `1px solid ${p === page ? C.orange : C.border}`,
                background: p === page ? C.orange : "#fff",
                color: p === page ? "#fff" : C.creamSub,
                fontWeight: p === page ? 700 : 400,
                fontSize: 14, cursor: "pointer", fontFamily: FB,
                transition: "all 0.2s",
              }}>
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: 38, height: 38, borderRadius: 38,
              border: `1px solid ${C.border}`, background: "#fff",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        /* Animaciones */
        @keyframes titleReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes letterPop {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
          }
        }

        @keyframes expandLine {
          to {
            transform: scaleX(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        @keyframes scrollLine {
          0% {
            opacity: 0;
            height: 0;
          }
          50% {
            opacity: 1;
            height: 40px;
          }
          100% {
            opacity: 0;
            height: 0;
          }
        }

        @keyframes lightMove {
          0% {
            opacity: 0.3;
            transform: translateX(-10%);
          }
          50% {
            opacity: 0.6;
            transform: translateX(10%);
          }
          100% {
            opacity: 0.3;
            transform: translateX(-10%);
          }
        }

        /* Scroll horizontal */
        .scroll-horizontal::-webkit-scrollbar { height: 4px; }
        .scroll-horizontal::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 4px; }
        .scroll-horizontal::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px; }
        .scroll-horizontal::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.25); }

        /* Tarjetas */
        .obra-item {
          flex-shrink: 0;
          position: relative;
          cursor: pointer;
          scroll-snap-align: start;
          z-index: 1;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center center;
        }
        .obra-image-wrapper {
          width: 100%;
          height: 306px;
          overflow: hidden;
        }
        .obra-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.7s cubic-bezier(0.2, 0, 0, 1);
        }
        .obra-item:hover {
          z-index: 20;
          transform: scale(1.32);
        }
        .obra-item:hover img {
          transform: scale(1);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}