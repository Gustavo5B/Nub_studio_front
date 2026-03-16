// src/pages/public/Catalogo.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, X, Image as ImageIcon,
  Eye, Heart, Sparkles, RefreshCw,
  ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

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
  return map[slug?.toLowerCase()] ?? C.blue;
}
function catColorByName(nombre: string): string {
  const n = nombre?.toLowerCase() ?? "";
  if (n.includes("artesani")) return C.gold;
  if (n.includes("pintura"))  return C.orange;
  if (n.includes("fotograf")) return C.pink;
  if (n.includes("escultur")) return C.purple;
  return C.blue;
}

// ── ObraCard — portrait full-image with overlay info ──────────────────
function ObraCard({ obra, navigate }: { obra: Obra; navigate: ReturnType<typeof useNavigate> }) {
  const [hov, setHov] = useState(false);
  const precio = obra.precio_minimo || obra.precio_base;
  const color  = catColorByName(obra.categoria_nombre);

  return (
    <article
      onClick={() => navigate(`/obras/${obra.slug}`)}
      className="obra-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        borderRadius: 22,
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: "3/4",
        border: `1px solid ${hov ? color + "50" : C.borderBr}`,
        boxShadow: hov
          ? `0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px ${color}18`
          : "0 6px 28px rgba(0,0,0,0.4)",
        transform: hov ? "translateY(-7px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Full image */}
      {obra.imagen_principal ? (
        <img
          src={obra.imagen_principal}
          alt={obra.titulo}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.07)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
            filter: "saturate(0.82) brightness(0.9)",
          }}
        />
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(145deg, ${C.panel}, ${C.bgDeep})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ImageIcon size={40} color={C.creamMut} strokeWidth={1} style={{ opacity: 0.3 }} />
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(7,5,16,0.98) 0%, rgba(7,5,16,0.82) 28%, rgba(7,5,16,0.35) 55%, transparent 80%)",
      }} />

      {/* Color tint */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(155deg, ${color}15 0%, transparent 55%)`,
        opacity: hov ? 1 : 0.35,
        transition: "opacity 0.3s",
      }} />

      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, ${color}30, transparent)`,
      }} />

      {/* Heart button */}
      <button
        onClick={e => e.stopPropagation()}
        className="wish-btn"
        style={{
          position: "absolute", top: 14, right: 14, zIndex: 3,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(7,5,16,0.78)", backdropFilter: "blur(10px)",
          border: `1px solid ${C.borderHi}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: C.creamMut, transition: "all .22s",
        }}
      >
        <Heart size={13} strokeWidth={1.8} />
      </button>

      {/* Category badge */}
      <div style={{
        position: "absolute", top: 14, left: 14, zIndex: 3,
        padding: "4px 11px", borderRadius: 20,
        background: "rgba(7,5,16,0.82)", backdropFilter: "blur(10px)",
        border: `1px solid ${color}45`,
        fontSize: 10.5, fontWeight: 700, color,
        fontFamily: FB,
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        {obra.categoria_nombre}
      </div>

      {/* Info panel — overlaid at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2,
        padding: "30px 18px 18px",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Artist + year */}
        <div style={{
          fontSize: 11, color: `${color}CC`, fontWeight: 700,
          letterSpacing: "0.07em", marginBottom: 5, fontFamily: FB,
          textTransform: "uppercase",
        }}>
          {obra.artista_alias || obra.artista_nombre}
          {obra.anio_creacion ? ` · ${obra.anio_creacion}` : ""}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 16.5, fontWeight: 800, color: C.cream,
          fontFamily: FD, letterSpacing: "-0.01em", lineHeight: 1.22,
          marginBottom: 12,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {obra.titulo}
        </div>

        {/* Price + views */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {precio ? (
            <div style={{
              fontSize: 20, fontWeight: 900, lineHeight: 1,
              background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: FB,
            }}>
              ${Number(precio).toLocaleString("es-MX")}
              <span style={{ fontSize: 10, fontWeight: 600, WebkitTextFillColor: C.creamMut, marginLeft: 3 }}>MXN</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.creamMut, fontStyle: "italic", fontFamily: FB }}>A consultar</div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11.5, color: C.creamMut, fontFamily: FB,
          }}>
            <Eye size={12} strokeWidth={1.8} /> {obra.vistas || 0}
          </div>
        </div>

        {/* "Ver obra" button reveal on hover */}
        <div style={{
          overflow: "hidden",
          maxHeight: hov ? 42 : 0,
          opacity: hov ? 1 : 0,
          marginTop: hov ? 12 : 0,
          transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.25s, margin-top 0.32s",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 38, borderRadius: 11,
            background: `linear-gradient(135deg, ${color}, ${C.magenta})`,
            fontSize: 13, fontWeight: 700, color: "white", fontFamily: FB,
            boxShadow: `0 6px 20px ${color}40`,
          }}>
            <Eye size={14} strokeWidth={2} /> Ver obra
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Featured Obra — large horizontal card ──────────────────────────────
function FeaturedCard({ obra, navigate }: { obra: Obra; navigate: ReturnType<typeof useNavigate> }) {
  const [hov, setHov] = useState(false);
  const precio = obra.precio_minimo || obra.precio_base;
  const color  = catColorByName(obra.categoria_nombre);

  return (
    <article
      onClick={() => navigate(`/obras/${obra.slug}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "320px 1fr",
        borderRadius: 24, overflow: "hidden", cursor: "pointer",
        border: `1px solid ${hov ? color + "50" : C.borderBr}`,
        boxShadow: hov ? `0 28px 80px rgba(0,0,0,0.65), 0 0 0 1px ${color}18` : "0 6px 32px rgba(0,0,0,0.4)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        background: C.panel,
      }}
      className="featured-card"
    >
      {/* Left: image */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 300 }}>
        {obra.imagen_principal ? (
          <img
            src={obra.imagen_principal}
            alt={obra.titulo}
            style={{
              width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
              position: "absolute", inset: 0,
              transform: hov ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
              filter: "saturate(0.9) brightness(0.92)",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", minHeight: 300, background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={40} color={C.creamMut} strokeWidth={1} style={{ opacity: 0.3 }} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 55%, ${C.panel})` }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}40, transparent)` }} />
        {/* Category label over image */}
        <div style={{ position: "absolute", bottom: 16, left: 16, padding: "5px 13px", borderRadius: 20, background: "rgba(7,5,16,0.82)", backdropFilter: "blur(10px)", border: `1px solid ${color}45`, fontSize: 10.5, fontWeight: 700, color, fontFamily: FB, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block" }} />
          {obra.categoria_nombre}
        </div>
      </div>

      {/* Right: info */}
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
        {/* Obra destacada chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 20, alignSelf: "flex-start",
          background: `${C.gold}14`, border: `1px solid ${C.gold}35`,
          fontSize: 10.5, fontWeight: 800, color: C.gold, fontFamily: FB,
        }}>
          ★ Obra destacada
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: "clamp(22px, 2.5vw, 36px)", fontWeight: 900,
          color: C.cream, margin: 0, fontFamily: FD, letterSpacing: "-0.025em",
          lineHeight: 1.08,
        }}>
          {obra.titulo}
        </h3>

        {/* Artist */}
        <div style={{ fontSize: 14, color: C.creamSub, fontFamily: FB }}>
          por <span style={{ color, fontWeight: 700 }}>{obra.artista_alias || obra.artista_nombre}</span>
          {obra.anio_creacion ? <span style={{ color: C.creamMut }}> · {obra.anio_creacion}</span> : ""}
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, ${color}30, transparent)` }} />

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          {precio ? (
            <div>
              <div style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Desde</div>
              <div style={{
                fontSize: 32, fontWeight: 900, lineHeight: 1,
                background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontFamily: FB,
              }}>
                ${Number(precio).toLocaleString("es-MX")}
                <span style={{ fontSize: 12, fontWeight: 600, WebkitTextFillColor: C.creamMut, marginLeft: 4 }}>MXN</span>
              </div>
            </div>
          ) : null}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 12,
            background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
            fontSize: 14, fontWeight: 700, color: "white", fontFamily: FB,
            boxShadow: `0 8px 28px ${C.orange}45`,
            transition: "transform .2s, box-shadow .2s",
            transform: hov ? "translateX(5px)" : "translateX(0)",
          }}>
            Ver obra <ArrowRight size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Views */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.creamMut, fontFamily: FB }}>
          <Eye size={12} strokeWidth={1.8} /> {obra.vistas || 0} visualizaciones
        </div>
      </div>
    </article>
  );
}

// ── Página ────────────────────────────────────────────────────────────
export default function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [obras,       setObras]       = useState<Obra[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [showFiltros, setShowFiltros] = useState(false);

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

  // Featured = first obra (shown above grid when no search/filter active)
  const showFeatured = !search && !catActiva && page === 1 && obras.length > 0 && !loading;
  const featuredObra = showFeatured ? obras[0] : null;
  const gridObras    = showFeatured ? obras.slice(1) : obras;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>

      {/* ══ HERO ══ */}
      <section style={{ position: "relative", padding: "80px 60px 64px", overflow: "hidden", borderBottom: `1px solid ${C.borderBr}` }}>
        {/* Rainbow top line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

        {/* Ambient orbs */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 90% at 10% 60%, ${C.pink}16, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 80% at 90% 25%, ${C.purple}14, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 40% 60% at 50% 110%, ${C.orange}10, transparent)`, pointerEvents: "none" }} />

        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(118,78,49,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(118,78,49,0.12) 1px, transparent 1px)`,
          backgroundSize: "72px 72px", opacity: 0.35, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 16px", borderRadius: 100,
            background: `${C.orange}18`, border: `1px solid ${C.orange}38`,
            fontSize: 11, fontWeight: 700, color: C.orange,
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 22, fontFamily: FB,
          }}>
            <Sparkles size={12} /> Colección Nu-B Studio
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontSize: "clamp(32px, 4.5vw, 62px)", fontWeight: 900, color: C.cream,
                margin: "0 0 14px", fontFamily: FD, letterSpacing: "-0.025em", lineHeight: 1.05,
              }}>
                Catálogo de{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.orange} 0%, ${C.gold} 40%, ${C.pink} 80%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Arte Huasteco
                </span>
              </h1>
              <p style={{ fontSize: 15.5, color: C.creamSub, margin: 0, maxWidth: 540, lineHeight: 1.78, fontFamily: FB }}>
                Descubre obras únicas de artistas locales. Cada pieza es un puente entre la tradición ancestral y el arte contemporáneo.
              </p>
            </div>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 440, minWidth: 260 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,232,200,0.05)", border: `1.5px solid ${C.borderHi}`,
                borderRadius: 14, padding: "13px 18px", backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,232,200,0.06)",
              }}>
                <Search size={16} color={C.creamMut} strokeWidth={1.8} />
                <input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Buscar obras, artistas…"
                  style={{ border: "none", outline: "none", background: "transparent", color: C.cream, fontSize: 14.5, flex: 1, fontFamily: FB }}
                />
                {search && (
                  <button onClick={() => handleSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                    <X size={13} color={C.creamMut} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 60px 80px" }}>

        {/* ── Category pills ── */}
        <div className="cats-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <button onClick={() => handleCat(null)} style={{
            padding: "8px 20px", borderRadius: 50,
            border: `1.5px solid ${catActiva === null ? C.orange : C.borderHi}`,
            background: catActiva === null ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)",
            color: catActiva === null ? "white" : C.creamSub,
            fontWeight: catActiva === null ? 700 : 500,
            fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .18s",
            boxShadow: catActiva === null ? `0 4px 16px ${C.orange}40` : "none",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {catActiva === null && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.85)", display: "inline-block" }} />}
            Todas
          </button>
          {categorias.map(c => {
            const color  = catColor(c.slug);
            const activa = catActiva === c.id_categoria;
            return (
              <button key={c.id_categoria} onClick={() => handleCat(c.id_categoria)} style={{
                padding: "8px 20px", borderRadius: 50,
                border: `1.5px solid ${activa ? color : C.borderHi}`,
                background: activa ? color : "rgba(255,232,200,0.04)",
                color: activa ? "white" : C.creamSub,
                fontWeight: activa ? 700 : 500,
                fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .18s",
                boxShadow: activa ? `0 4px 16px ${color}45` : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: activa ? "rgba(255,255,255,0.85)" : color, display: "inline-block", flexShrink: 0 }} />
                {c.nombre}
              </button>
            );
          })}
        </div>

        {/* ── Results bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, color: C.creamMut, fontFamily: FB }}>
              {loading ? "Cargando…" : (
                <><strong style={{ color: C.cream }}>{total}</strong> obras encontradas{catNombre && <> en <strong style={{ color: C.orange }}>{catNombre}</strong></>}{search && <> para "<strong style={{ color: C.cream }}>{search}</strong>"</>}</>
              )}
            </div>
            {(catActiva || search) && (
              <button onClick={() => { handleCat(null); handleSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.orange, background: "transparent", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: FB }}>
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

        {/* ══ GRID / STATES ══ */}
        {loading ? (
          /* Skeleton */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", borderRadius: 24, overflow: "hidden", marginBottom: 36, height: 200, background: C.panel, border: `1px solid ${C.border}`, animation: "shimmer 1.5s ease-in-out infinite" }} className="skeleton-shimmer" />
            <div className="obras-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ borderRadius: 22, background: C.panel, border: `1px solid ${C.border}`, aspectRatio: "3/4", animation: "shimmer 1.5s ease-in-out infinite", opacity: 0.6 - i * 0.04 }} className="skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", fontFamily: FB }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              background: `radial-gradient(circle, ${C.orange}16, ${C.purple}10, transparent)`,
              border: `1px solid ${C.borderHi}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
            }}>
              <ImageIcon size={44} strokeWidth={1} color={C.creamMut} style={{ opacity: 0.55 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.creamSub, marginBottom: 10, fontFamily: FD, letterSpacing: "-0.01em" }}>Sin resultados</div>
            <div style={{ fontSize: 14, color: C.creamMut, lineHeight: 1.7, marginBottom: 24 }}>Intenta con otro término o categoría</div>
            <button onClick={() => { handleCat(null); handleSearch(""); }} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
              border: "none", color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: FB, boxShadow: `0 8px 24px ${C.orange}40`,
            }}>
              Ver todas las obras <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <>
            {/* Featured obra */}
            {featuredObra && (
              <div style={{ marginBottom: 40 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 800, color: C.gold,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  marginBottom: 16, fontFamily: FB,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                  Obra destacada
                </div>
                <FeaturedCard obra={featuredObra} navigate={navigate} />
              </div>
            )}

            {/* Grid */}
            {gridObras.length > 0 && (
              <>
                {featuredObra && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.creamMut, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20, fontFamily: FB }}>
                    Toda la colección
                  </div>
                )}
                <div className="obras-grid">
                  {gridObras.map(obra => <ObraCard key={obra.id_obra} obra={obra} navigate={navigate} />)}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 64 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn" style={{
              width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.borderHi}`,
              background: "rgba(255,232,200,0.04)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1, color: C.creamSub, transition: "all .18s",
            }}>
              <ChevronLeft size={17} strokeWidth={2} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} className="page-btn" style={{
                  width: 42, height: 42, borderRadius: 12,
                  border: `1.5px solid ${p === page ? C.orange : C.borderHi}`,
                  background: p === page ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)",
                  color: p === page ? "white" : C.creamSub,
                  fontWeight: p === page ? 800 : 500,
                  fontSize: 14, cursor: "pointer", fontFamily: FB, transition: "all .15s",
                  boxShadow: p === page ? `0 4px 16px ${C.orange}40` : "none",
                }}>
                  {p}
                </button>
              );
            })}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn" style={{
              width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.borderHi}`,
              background: "rgba(255,232,200,0.04)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1, color: C.creamSub, transition: "all .18s",
            }}>
              <ChevronRight size={17} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.28); }

        .obras-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .obra-card {
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .obra-card:hover .wish-btn {
          background: rgba(204,89,173,0.3) !important;
          border-color: ${C.pink} !important;
          color: ${C.pink} !important;
        }
        .featured-card:hover img { transform: scale(1.06) !important; }
        .page-btn:hover { background: rgba(255,232,200,0.09) !important; color: ${C.cream} !important; }
        .skeleton-shimmer { animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{opacity:0.35} 50%{opacity:0.65} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }

        @media (max-width: 1100px) {
          .obras-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .featured-card { grid-template-columns: 240px 1fr !important; }
        }
        @media (max-width: 900px) {
          .featured-card { grid-template-columns: 1fr !important; }
          .featured-card > div:first-child { height: 220px; }
        }
        @media (max-width: 640px) {
          .obras-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .cats-row { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
          .cats-row::-webkit-scrollbar { display: none; }
          .cats-row button { flex-shrink: 0; }
        }
        @media (max-width: 460px) {
          .obras-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
