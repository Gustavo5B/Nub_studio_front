// src/pages/public/Artistas.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ImageIcon, X, ChevronRight, Grid3x3, LayoutList, Layers, Eye, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#FF763E",
  pink:     "#A83B90",
  magenta:  "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  panel:    "#FFFFFF",
  card:     "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
  borderHi: "rgba(0,0,0,0.10)",
};

const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";

type ViewMode = "grid" | "list" | "compact";

interface Artista {
  id_artista: number;
  nombre_completo: string;
  nombre_artistico: string;
  biografia: string;
  foto_perfil: string;
  foto_portada?: string;
  categoria_nombre: string;
  total_obras: number;
  estado: string;
}

// ── Artista Card - Estilo Instagram ──
function ArtistaCard({ 
  artista, 
  viewMode,
  index 
}: { 
  readonly artista: Artista; 
  readonly viewMode: ViewMode;
  readonly index: number;
}) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const color = C.orange;
  const seudonimo = artista.nombre_artistico || artista.nombre_completo.split(" ")[0];

  // Modo List
  if (viewMode === "list") {
    return (
      <div
        ref={ref}
        onClick={() => navigate(`/artistas/${artista.id_artista}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "16px 20px",
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${hov ? color + "40" : C.border}`,
          cursor: "pointer",
          opacity: inView ? 1 : 0,
          transform: hov ? "translateX(4px)" : "translateX(0)",
          transition: `opacity .4s ${index * 0.05}s, transform .4s ${index * 0.05}s, border .2s`,
        }}
      >
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          overflow: "hidden",
          background: `${color}22`,
          flexShrink: 0,
        }}>
          {artista.foto_perfil ? (
            <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color }}>
              {artista.nombre_completo[0]}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 4 }}>
            {seudonimo}
          </div>
          <div style={{ fontSize: 13, color: C.creamSub, fontFamily: FB }}>
            {artista.nombre_completo}
          </div>
          {artista.categoria_nombre && (
            <div style={{ fontSize: 11, color: color, marginTop: 6 }}>
              {artista.categoria_nombre}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.cream }}>
            {artista.total_obras || 0}
          </div>
          <div style={{ fontSize: 11, color: C.creamMut }}>obras</div>
        </div>
        <ChevronRight size={18} color={C.creamMut} style={{ opacity: hov ? 1 : 0.4 }} />
      </div>
    );
  }

  // Modo Compact
  if (viewMode === "compact") {
    return (
      <div
        ref={ref}
        onClick={() => navigate(`/artistas/${artista.id_artista}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${hov ? color + "40" : C.border}`,
          cursor: "pointer",
          overflow: "hidden",
          opacity: inView ? 1 : 0,
          transform: hov ? "translateY(-4px)" : "translateY(0)",
          transition: `opacity .4s ${index * 0.05}s, transform .4s ${index * 0.05}s`,
        }}
      >
        <div style={{
          height: 120,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {artista.foto_perfil ? (
            <img src={artista.foto_perfil} alt={seudonimo} style={{ width: 80, height: 80, borderRadius: 40, objectFit: "cover", border: `3px solid white` }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 40, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color }}>
              {seudonimo[0]}
            </div>
          )}
        </div>
        <div style={{ padding: "12px 16px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 2 }}>
            {seudonimo}
          </div>
          <div style={{ fontSize: 11, color: C.creamSub, marginBottom: 6 }}>
            {artista.nombre_completo}
          </div>
          <div style={{ fontSize: 12, color: color, fontWeight: 600 }}>
            {artista.total_obras || 0} obras
          </div>
        </div>
      </div>
    );
  }

  // Modo Grid (default)
  return (
    <div
      ref={ref}
      onClick={() => navigate(`/artistas/${artista.id_artista}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        borderRadius: 20,
        border: `1px solid ${hov ? color + "40" : C.border}`,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: hov ? `0 20px 40px rgba(0,0,0,0.12)` : "0 2px 8px rgba(0,0,0,0.04)",
        opacity: inView ? 1 : 0,
        transform: hov ? "translateY(-8px)" : "translateY(0)",
        transition: `opacity .5s ${index * 0.05}s, transform .5s ${index * 0.05}s, box-shadow .2s`,
      }}
    >
      <div style={{
        height: 140,
        background: `${color}20`,
        position: "relative",
        overflow: "hidden",
      }}>
        {artista.foto_portada && (
          <img src={artista.foto_portada} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {artista.categoria_nombre && (
          <div style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            fontSize: 10,
            fontWeight: 600,
            color: color,
            fontFamily: FB,
          }}>
            {artista.categoria_nombre}
          </div>
        )}
      </div>
      <div style={{ padding: "0 20px", marginTop: -40, position: "relative", zIndex: 2 }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          border: `4px solid ${C.card}`,
          overflow: "hidden",
          background: `${color}22`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
        }}>
          {artista.foto_perfil ? (
            <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color }}>
              {artista.nombre_completo[0]}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "16px 20px 24px" }}>
        <div style={{
          fontSize: 24,
          fontWeight: 800,
          color: C.cream,
          fontFamily: FD,
          marginBottom: 6,
          letterSpacing: "-0.02em",
        }}>
          {seudonimo}
        </div>
        <div style={{
          fontSize: 13,
          color: C.creamSub,
          fontFamily: FB,
          marginBottom: 12,
        }}>
          {artista.nombre_completo}
        </div>
        {artista.biografia && (
          <p style={{
            fontSize: 13,
            color: C.creamMut,
            lineHeight: 1.5,
            margin: "0 0 16px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontFamily: FB,
          }}>
            {artista.biografia}
          </p>
        )}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Eye size={14} color={C.creamMut} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>
              {artista.total_obras || 0}
            </span>
            <span style={{ fontSize: 11, color: C.creamMut }}>obras</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Artistas() {
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/artistas`);
        const json = await res.json();
        setArtistas(json.data || []);
      } catch {
        setArtistas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorias = [...new Set(artistas.map(a => a.categoria_nombre).filter(Boolean))];
  const filtrados = artistas.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || 
      [a.nombre_completo, a.nombre_artistico, a.biografia].some(v => v?.toLowerCase().includes(q));
    const matchCat = !catActiva || a.categoria_nombre === catActiva;
    return matchSearch && matchCat;
  });

  // Calcular total de obras correctamente
  const totalObras = artistas.reduce((sum, artista) => {
    const obras = Number(artista.total_obras);
    return sum + (isNaN(obras) ? 0 : obras);
  }, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>
      
      {/* ══ HERO - Sin degradados ══ */}
      <section style={{
        position: "relative",
        padding: "64px 60px 72px",
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          
          {/* Título y descripción */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 20px",
              borderRadius: 100,
              background: `${C.orange}12`,
              border: `1px solid ${C.orange}25`,
              marginBottom: 24,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.orange,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.orange,
                letterSpacing: "0.5px",
                fontFamily: FB,
              }}>
                COMUNIDAD DE CREADORES
              </span>
            </div>
            
            <h2 style={{
              fontSize: "clamp(32px, 5vw, 58px)", // TÍTULO MÁS GRANDE como en Catálogo
              fontWeight: 900,
              color: C.cream,
              fontFamily: FD,
              margin: "0 0 20px",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}>
              Nuestros{" "}
              <span style={{ color: C.orange }}>
                Artistas
              </span>
            </h2>
            
            <p style={{
              fontSize: 18,
              color: C.creamSub,
              margin: "0 auto",
              maxWidth: 600,
              lineHeight: 1.6,
              fontFamily: FB,
            }}>
              Conoce a los creadores que dan vida al arte huasteco con sus manos, su historia y su pasión
            </p>
          </div>

          {/* Barra de controles */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            background: "white",
            borderRadius: 80,
            padding: "8px 12px 8px 24px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            border: `1px solid ${C.border}`,
            maxWidth: 780,
            margin: "0 auto",
          }}>
            {/* Buscador */}
            <div style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 260,
            }}>
              <Search size={20} color={C.orange} strokeWidth={1.8} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar artista por nombre o seudónimo..."
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 15,
                  flex: 1,
                  fontFamily: FB,
                  padding: "12px 0",
                  color: C.cream,
                }}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  style={{ 
                    background: `${C.orange}10`,
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} color={C.orange} />
                </button>
              )}
            </div>

            {/* Separador */}
            <div style={{
              width: 1,
              height: 36,
              background: C.border,
            }} />

            {/* Selector de vista */}
            <div style={{
              display: "flex",
              gap: 6,
              background: C.bg,
              borderRadius: 60,
              padding: 4,
            }}>
              {[
                { mode: "grid" as ViewMode, icon: Grid3x3, label: "Cuadrícula" },
                { mode: "list" as ViewMode, icon: LayoutList, label: "Lista" },
                { mode: "compact" as ViewMode, icon: Layers, label: "Compacto" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 40,
                    background: viewMode === mode ? C.orange : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all .2s",
                  }}
                >
                  <Icon size={18} color={viewMode === mode ? "white" : C.creamSub} />
                  <span style={{
                    fontSize: 14,
                    fontWeight: viewMode === mode ? 600 : 500,
                    color: viewMode === mode ? "white" : C.creamSub,
                    fontFamily: FB,
                  }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Estadísticas rápidas - NÚMEROS EN VERDE #31692E */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            marginTop: 48,
            flexWrap: "wrap",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#31692E", // VERDE
                fontFamily: FD,
              }}>
                {artistas.length}
              </div>
              <div style={{
                fontSize: 13,
                color: C.creamMut,
                fontWeight: 500,
                marginTop: 4,
              }}>
                Artistas activos
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#31692E", // VERDE
                fontFamily: FD,
              }}>
                {totalObras}
              </div>
              <div style={{
                fontSize: 13,
                color: C.creamMut,
                fontWeight: 500,
                marginTop: 4,
              }}>
                Obras creadas
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#31692E", // VERDE
                fontFamily: FD,
              }}>
                {categorias.length}
              </div>
              <div style={{
                fontSize: 13,
                color: C.creamMut,
                fontWeight: 500,
                marginTop: 4,
              }}>
                Categorías
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Contenido ══ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 60px 80px" }}>
        
        {/* Filtros de categoría */}
        {categorias.length > 0 && (
          <div style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 32,
            paddingBottom: 20,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <button
              onClick={() => setCatActiva(null)}
              style={{
                padding: "8px 20px",
                borderRadius: 40,
                border: `1px solid ${catActiva === null ? C.orange : C.border}`,
                background: catActiva === null ? C.orange : "transparent",
                color: catActiva === null ? "white" : "#1A1A1A",
                fontSize: 14,
                fontWeight: catActiva === null ? 600 : 500,
                cursor: "pointer",
                fontFamily: FB,
                transition: "all .2s",
              }}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCatActiva(catActiva === cat ? null : cat)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 40,
                  border: `1px solid ${catActiva === cat ? C.orange : C.border}`,
                  background: catActiva === cat ? C.orange : "transparent",
                  color: catActiva === cat ? "white" : "#1A1A1A",
                  fontSize: 14,
                  fontWeight: catActiva === cat ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: FB,
                  transition: "all .2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Contador de resultados */}
        <div style={{
          marginBottom: 28,
          fontSize: 14,
          color: C.creamMut,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: C.orange,
          }} />
          {!loading && (
            <><strong style={{ color: C.cream }}>{filtrados.length}</strong> artistas encontrados</>
          )}
        </div>

        {/* Grid de artistas */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: viewMode === "list" ? "1fr" : viewMode === "compact" ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
            gap: 24,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: viewMode === "list" ? 100 : viewMode === "compact" ? 200 : 340,
                background: C.border,
                borderRadius: 20,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `${C.orange}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <Users size={32} color={C.orange} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.cream, fontFamily: FD, marginBottom: 8 }}>
              No se encontraron artistas
            </div>
            <div style={{ fontSize: 14, color: C.creamMut }}>
              Intenta con otro término de búsqueda o categoría
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: viewMode === "list" ? "1fr" : viewMode === "compact" ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
            gap: viewMode === "compact" ? 20 : 28,
          }}>
            {filtrados.map((artista, i) => (
              <ArtistaCard
                key={artista.id_artista}
                artista={artista}
                viewMode={viewMode}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #9896A8; }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E6E4EF; border-radius: 10px; }
        
        @media (max-width: 1000px) {
          .artistas-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .artistas-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}