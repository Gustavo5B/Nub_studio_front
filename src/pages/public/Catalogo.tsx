// src/pages/public/Catalogo.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, X, Image as ImageIcon,
  Eye, Sparkles,
  ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  magenta:  "#A83B90",
  purple:   "#6028AA",
  gold:     "#A87006",
  green:    "#0E8A50",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  bgDeep:   "#FFFFFF",
  panel:    "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
  borderHi: "rgba(0,0,0,0.10)",
};

const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";

interface Obra {
  id_obra: number; titulo: string; slug: string;
  imagen_principal: string; precio_base: number; precio_minimo: number;
  categoria_nombre: string; artista_nombre: string; artista_alias: string;
  anio_creacion: number; vistas: number; estado: string;
}
interface Categoria { id_categoria: number; nombre: string; slug: string; }

const ORDENAR = [
  { val: "recientes",   label: "Más recientes"         },
  { val: "antiguos",    label: "Más antiguos"           },
  { val: "nombre",      label: "A → Z"                 },
  { val: "precio_asc",  label: "Precio: menor a mayor" },
  { val: "precio_desc", label: "Precio: mayor a menor" },
];

function catColor(slug: string): string {
  const map: Record<string, string> = {
    artesania: C.gold, pintura: C.orange, fotografia: C.pink, escultura: C.purple,
  };
  return map[slug?.toLowerCase()] ?? C.purple;
}
function catColorByName(nombre: string): string {
  const n = nombre?.toLowerCase() ?? "";
  if (n.includes("artesani")) return C.gold;
  if (n.includes("pintura"))  return C.orange;
  if (n.includes("fotograf")) return C.pink;
  if (n.includes("escultur")) return C.purple;
  return C.purple;
}

// ── ObraCard — Tarjeta vertical estilo galería con fondo cálido ──────────────────────
function ObraCard({
  obra,
  isHovered,
  isSelected,
  onHover,
  onLeave,
  onClick,
}: {
  readonly obra: Obra;
  readonly isHovered: boolean;
  readonly isSelected: boolean;
  readonly onHover: () => void;
  readonly onLeave: () => void;
  readonly onClick: () => void;
}) {
  const precio = obra.precio_minimo || obra.precio_base;
  const color  = catColorByName(obra.categoria_nombre);
  const active = isHovered || isSelected;

  // Formatear precio sin decimales si es entero
  const formattedPrice = Number(precio || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 280,
        height: 420,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        background: "#FFECD4",
        border: isSelected
          ? `2px solid ${color}`
          : `1px solid rgba(0,0,0,0.08)`,
        boxShadow: active
          ? `0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px ${color}20`
          : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all .35s cubic-bezier(0.2, 0, 0, 1)",
        transform: active ? "translateY(-6px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Contenedor de imagen */}
      <div style={{
        height: 280,
        position: "relative",
        overflow: "hidden",
        background: "#F5E5C8",
        margin: 12,
        marginBottom: 0,
        borderRadius: 16,
        flexShrink: 0,
      }}>
        {obra.imagen_principal ? (
          <img
            src={obra.imagen_principal}
            alt={obra.titulo}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: active ? "scale(1.05)" : "scale(1)",
              transition: "transform .5s cubic-bezier(0.2, 0, 0, 1)",
              borderRadius: 16,
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, #F5E5C8, #E8D5B5)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <ImageIcon size={48} color="#C4A962" strokeWidth={1} style={{ opacity: 0.5 }} />
          </div>
        )}

        {/* Badge de categoría en hover */}
        {active && (
          <div style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "4px 12px",
            borderRadius: 30,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            fontSize: 10,
            fontWeight: 600,
            color: color,
            fontFamily: FB,
            letterSpacing: "0.5px",
          }}>
            {obra.categoria_nombre}
          </div>
        )}
      </div>

      {/* Información inferior */}
      <div style={{
        padding: "16px 20px 20px",
        background: "#FFECD4",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        {/* Precio */}
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          color: C.orange,
          fontFamily: FD,
          marginBottom: 8,
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
        }}>
          ${formattedPrice}
        </div>

        {/* Título */}
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#2C241A",
          fontFamily: FD,
          lineHeight: 1.3,
          marginBottom: 8,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
        }}>
          {obra.titulo}
        </div>

        {/* Artista */}
        <div style={{
          fontSize: 13,
          color: "#8B7355",
          fontFamily: FB,
          fontWeight: 500,
          lineHeight: 1.4,
          marginTop: "auto",
          overflow: "visible",
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}>
          {obra.artista_alias || obra.artista_nombre}
        </div>
      </div>

      {/* Línea de acento en hover */}
      {active && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${C.orange})`,
        }} />
      )}
    </article>
  );
}

// ── Panel lateral de detalle ──────────────────────────────────────────
function DetallePanel({
  obra,
  onClose,
  navigate,
}: {
  readonly obra: Obra | null;
  readonly onClose: () => void;
  readonly navigate: ReturnType<typeof useNavigate>;
}) {
  if (!obra) return null;
  const precio = obra.precio_minimo || obra.precio_base;
  const color  = catColorByName(obra.categoria_nombre);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 999,
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: 400,
        background: C.panel,
        borderLeft: `1px solid ${C.border}`,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Imagen grande */}
        <div style={{
          height: 300,
          position: "relative",
          flexShrink: 0,
          background: C.bg,
        }}>
          {obra.imagen_principal && (
            <img
              src={obra.imagen_principal}
              alt={obra.titulo}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                filter: "saturate(0.88) brightness(0.92)",
              }}
            />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 45%, rgba(255,255,255,0.96) 100%)",
          }} />

          {/* Top accent */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />

          {/* Cerrar */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
              border: `1px solid ${C.border}`,
              color: C.cream, fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 40px", flex: 1 }}>
          {/* Categoría */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 100,
            background: `${color}14`, border: `1px solid ${color}35`,
            fontSize: 9, fontWeight: 800, color,
            letterSpacing: ".12em", textTransform: "uppercase",
            fontFamily: FB, marginBottom: 12,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
            {obra.categoria_nombre}
          </div>

          {/* Título */}
          <h2 style={{
            fontSize: 26, fontWeight: 900, color: C.cream,
            fontFamily: FD, margin: "0 0 5px",
            letterSpacing: "-.025em", lineHeight: 1.1,
          }}>
            {obra.titulo}
          </h2>

          {/* Artista */}
          <div style={{ fontSize: 13, color: C.creamSub, fontFamily: FB, marginBottom: 22 }}>
            por <span style={{ color, fontWeight: 700 }}>{obra.artista_alias || obra.artista_nombre}</span>
            {obra.anio_creacion && <span style={{ color: C.creamMut }}> · {obra.anio_creacion}</span>}
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 22 }} />

          {/* Precio */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
              Precio base
            </div>
            <div style={{
              fontSize: 30, fontWeight: 900, fontFamily: FD, lineHeight: 1,
              background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              ${Number(precio || 0).toLocaleString("es-MX")}
              <span style={{ fontSize: 13, fontWeight: 600, WebkitTextFillColor: C.creamMut, marginLeft: 4 }}>MXN</span>
            </div>
          </div>

          {/* Estado */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 100, marginBottom: 28,
            background: obra.estado === "publicada" ? `${C.green}14` : `${C.orange}14`,
            border: `1px solid ${obra.estado === "publicada" ? C.green : C.orange}45`,
            fontSize: 10, fontWeight: 700,
            color: obra.estado === "publicada" ? C.green : C.orange,
            letterSpacing: ".1em", textTransform: "uppercase", fontFamily: FB,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: obra.estado === "publicada" ? C.green : C.orange,
            }} />
            {obra.estado === "publicada" ? "Disponible" : "No disponible"}
          </div>

          {/* Vistas */}
          {obra.vistas > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, color: C.creamMut, fontFamily: FB, marginBottom: 28,
            }}>
              <Eye size={13} strokeWidth={1.8} /> {obra.vistas} visualizaciones
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate(`/obras/${obra.slug}`)}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: FB,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 8px 24px ${C.orange}35`,
            }}
          >
            Ver obra completa <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Fila horizontal de obras ──────────────────────────────────────────
function ObrasHorizontal({
  obras,
  loading,
  navigate,
}: {
  readonly obras: Obra[];
  readonly loading: boolean;
  readonly navigate: ReturnType<typeof useNavigate>;
}) {
  const [hoveredId,    setHoveredId]    = useState<number | null>(null);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  const handleClick = (obra: Obra) => {
    setSelectedObra(prev => prev?.id_obra === obra.id_obra ? null : obra);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 20, padding: "12px 0 24px", overflowX: "hidden" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            flexShrink: 0, width: 280, height: 380,
            borderRadius: 20, background: C.border,
            animation: "shimmer 1.5s ease-in-out infinite",
            opacity: 0.6 - i * 0.06,
          }} />
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", fontFamily: FB }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: C.bg, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <ImageIcon size={36} strokeWidth={1} color={C.creamMut} style={{ opacity: 0.5 }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.creamSub, fontFamily: FD, marginBottom: 8 }}>Sin resultados</div>
        <div style={{ fontSize: 13.5, color: C.creamMut, lineHeight: 1.7 }}>Intenta con otro término o categoría</div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: "flex",
        gap: 20,
        padding: "12px 0 28px",
        overflowX: "auto",
        scrollbarWidth: "none",
        alignItems: "stretch",
        scrollSnapType: "x mandatory",
      }}
        className="obras-scroll"
      >
        {obras.map(obra => (
          <div key={obra.id_obra} style={{ scrollSnapAlign: "start" }}>
            <ObraCard
              obra={obra}
              isHovered={hoveredId === obra.id_obra}
              isSelected={selectedObra?.id_obra === obra.id_obra}
              onHover={() => setHoveredId(obra.id_obra)}
              onLeave={() => setHoveredId(null)}
              onClick={() => handleClick(obra)}
            />
          </div>
        ))}
      </div>

      {selectedObra && (
        <DetallePanel
          obra={selectedObra}
          onClose={() => setSelectedObra(null)}
          navigate={navigate}
        />
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────
export default function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [obras,      setObras]      = useState<Obra[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search,    setSearch]    = useState(searchParams.get("q") || "");
  const [catActiva, setCatActiva] = useState<number | null>(
    searchParams.get("categoria") ? Number(searchParams.get("categoria")) : null
  );
  const [ordenar, setOrdenar] = useState(searchParams.get("ordenar") || "recientes");
  const [page,    setPage]    = useState(Number(searchParams.get("page")) || 1);

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(j => setCategorias(j.data || []))
      .catch(() => {});
  }, []);

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
        if (catActiva) params.set("categoria", String(catActiva));
        const res  = await fetch(`${API_URL}/api/obras?${params}`);
        const json = await res.json();
        setObras(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch { setObras([]); }
    finally { setLoading(false); }
  }, [search, catActiva, ordenar, page]);

  useEffect(() => { cargarObras(); }, [cargarObras]);

  const handleCat    = (id: number | null) => { setCatActiva(id); setPage(1); };
  const handleSearch = (val: string)       => { setSearch(val);   setPage(1); };
  const handleOrden  = (val: string)       => { setOrdenar(val);  setPage(1); };
  const catNombre    = catActiva ? categorias.find(c => c.id_categoria === catActiva)?.nombre : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>

      {/* ══ HERO - VERSIÓN ULTRA COMPACTA ══ */}
      <section style={{ 
        position: "relative", 
        padding: "24px 60px 32px",
        overflow: "hidden", 
        borderBottom: `1px solid ${C.borderBr}` 
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple})` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 90% at 10% 60%, ${C.pink}14, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 80% at 90% 25%, ${C.purple}12, transparent)`, pointerEvents: "none" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: "72px 72px", opacity: 0.4, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", 
            alignItems: "center", 
            gap: 5,
            padding: "3px 12px",
            borderRadius: 100,
            background: `${C.orange}18`, 
            border: `1px solid ${C.orange}38`,
            fontSize: 9,
            fontWeight: 700, 
            color: C.orange,
            letterSpacing: "0.12em", 
            textTransform: "uppercase", 
            marginBottom: 12,
            fontFamily: FB,
          }}>
            <Sparkles size={9} />
            Colección Nu-B Studio
          </div>

          {/* Título y descripción - TÍTULO MÁS GRANDE */}
          <div style={{ maxWidth: 650, margin: "0 auto", textAlign: "center", marginBottom: 20 }}>
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 58px)", // TÍTULO MÁS GRANDE
              fontWeight: 900, 
              color: C.cream,
              margin: "0 0 8px",
              fontFamily: FD, 
              letterSpacing: "-0.025em", 
              lineHeight: 1.1,
            }}>
              Catálogo de{" "}
              <span style={{ 
                color: C.orange,
              }}>
                Arte Huasteco
              </span>
            </h1>
            <p style={{ 
              fontSize: 13,
              color: C.creamSub, 
              margin: "0 auto", 
              maxWidth: 480,
              lineHeight: 1.4,
              fontFamily: FB,
            }}>
              Descubre obras únicas de artistas locales. Cada pieza es un puente entre la tradición ancestral y el arte contemporáneo.
            </p>
          </div>

          {/* Buscador - compacto */}
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{
              display: "flex", 
              alignItems: "center", 
              gap: 8,
              background: "rgba(255,255,255,0.98)", 
              border: `1px solid ${C.borderHi}`,
              borderRadius: 60, 
              padding: "3px 3px 3px 18px",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <Search size={14} color={C.orange} strokeWidth={1.8} />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar obra, artista..."
                style={{ 
                  border: "none", 
                  outline: "none", 
                  background: "transparent", 
                  color: C.cream, 
                  fontSize: 13,
                  flex: 1, 
                  fontFamily: FB,
                  padding: "8px 0",
                }}
              />
              {search && (
                <button 
                  onClick={() => handleSearch("")} 
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    cursor: "pointer", 
                    padding: 4, 
                    display: "flex",
                    borderRadius: "50%",
                    color: C.orange,
                  }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
              <button
                style={{
                  background: C.orange,
                  border: "none",
                  borderRadius: 50,
                  padding: "5px 16px",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: FB,
                  cursor: "pointer",
                  boxShadow: `0 2px 4px ${C.orange}40`,
                }}
              >
                Buscar
              </button>
            </div>
            
            {/* Indicador de búsqueda activa */}
            {search && (
              <div style={{
                marginTop: 6,
                textAlign: "center",
                fontSize: 10,
                color: C.orange,
                fontFamily: FB,
                fontWeight: 500,
              }}>
                "{search}"
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 60px 80px" }}>

        {/* ── Filtros: categorías MÁS GRANDES ── */}
        <div className="cats-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
          <button 
            onClick={() => handleCat(null)} 
            style={{
              padding: "12px 28px", 
              borderRadius: 60,
              border: `1.5px solid ${catActiva === null ? "#FF763E" : C.borderHi}`,
              background: catActiva === null ? "#FF763E" : "rgba(0,0,0,0.02)",
              color: catActiva === null ? "white" : "#1A1A1A",
              fontWeight: catActiva === null ? 700 : 500,
              fontSize: 15, 
              cursor: "pointer", 
              fontFamily: FB, 
              transition: "all .18s",
              boxShadow: catActiva === null ? `0 4px 16px #FF763E40` : "none",
              display: "flex", 
              alignItems: "center", 
              gap: 6,
            }}>
            {catActiva === null && (
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: "50%", 
                background: "white", 
                display: "inline-block" 
              }} />
            )}
            Todas
          </button>
          
          {categorias.map(c => {
            const color  = catColor(c.slug);
            const activa = catActiva === c.id_categoria;
            return (
              <button 
                key={c.id_categoria} 
                onClick={() => handleCat(c.id_categoria)} 
                style={{
                  padding: "12px 28px", 
                  borderRadius: 60,
                  border: `1.5px solid ${activa ? "#FF763E" : C.borderHi}`,
                  background: activa ? "#FF763E" : "rgba(0,0,0,0.02)",
                  color: activa ? "white" : "#1A1A1A",
                  fontWeight: activa ? 700 : 500,
                  fontSize: 15, 
                  cursor: "pointer", 
                  fontFamily: FB, 
                  transition: "all .18s",
                  boxShadow: activa ? `0 4px 16px #FF763E40` : "none",
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                }}>
                {activa && (
                  <span style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: "50%", 
                    background: "white", 
                    display: "inline-block" 
                  }} />
                )}
                {c.nombre}
              </button>
            );
          })}
        </div>

        {/* ── Barra de resultados + ordenar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, color: C.creamMut, fontFamily: FB }}>
              {loading ? "Cargando…" : (
                <><strong style={{ color: C.cream }}>{total}</strong> obras encontradas
                  {catNombre && <> en <strong style={{ color: C.orange }}>{catNombre}</strong></>}
                  {search && <> para "<strong style={{ color: C.cream }}>{search}</strong>"</>}
                </>
              )}
            </div>
            {(catActiva || search) && (
              <button onClick={() => { handleCat(null); handleSearch(""); }} style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 12.5, color: C.orange, background: "transparent",
                border: "none", cursor: "pointer", fontWeight: 700, fontFamily: FB,
              }}>
                <X size={13} strokeWidth={2.5} /> Limpiar filtros
              </button>
            )}
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <select value={ordenar} onChange={e => handleOrden(e.target.value)} style={{
              background: C.panel, border: `1px solid ${C.borderBr}`, borderRadius: 10,
              color: C.creamSub, fontSize: 13, padding: "8px 36px 8px 14px",
              fontFamily: FB, fontWeight: 600, cursor: "pointer", outline: "none",
              appearance: "none", WebkitAppearance: "none",
            }}>
              {ORDENAR.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, pointerEvents: "none", color: C.creamMut, fontSize: 11 }}>▾</span>
          </div>
        </div>

        {/* ══ GALERÍA HORIZONTAL ══ */}
        <ObrasHorizontal obras={obras} loading={loading} navigate={navigate} />

        {/* ── Paginación ── */}
        {totalPages > 1 && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 48 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
              width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.borderHi}`,
              background: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1,
              color: C.creamSub, transition: "all .18s",
            }}>
              <ChevronLeft size={17} strokeWidth={2} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 42, height: 42, borderRadius: 12,
                  border: `1.5px solid ${p === page ? C.orange : C.borderHi}`,
                  background: p === page ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(0,0,0,0.02)",
                  color: p === page ? "white" : C.creamSub,
                  fontWeight: p === page ? 800 : 500,
                  fontSize: 14, cursor: "pointer", fontFamily: FB, transition: "all .15s",
                  boxShadow: p === page ? `0 4px 16px ${C.orange}40` : "none",
                }}>
                  {p}
                </button>
              );
            })}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
              width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.borderHi}`,
              background: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1,
              color: C.creamSub, transition: "all .18s",
            }}>
              <ChevronRight size={17} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #9896A8; }

        .obras-scroll::-webkit-scrollbar { display: none; }
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.6} }

        .cats-row { flex-wrap: wrap; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E6E4EF; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #9896A8; }

        @media (max-width: 768px) {
          .cats-row { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
          .cats-row::-webkit-scrollbar { display: none; }
          .cats-row button { flex-shrink: 0; }
        }
      `}</style>
    </div>
  );
}