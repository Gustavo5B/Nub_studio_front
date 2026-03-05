// src/pages/public/Catalogo.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, X, RefreshCw, Image as ImageIcon,
  SlidersHorizontal, Eye, Heart, Sparkles, Star,
  ChevronLeft, ChevronRight,
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
  { val: "recientes",   label: "Más recientes"          },
  { val: "antiguos",    label: "Más antiguos"            },
  { val: "nombre",      label: "A → Z"                  },
  { val: "precio_asc",  label: "Precio: menor a mayor"  },
  { val: "precio_desc", label: "Precio: mayor a menor"  },
];

// ── Card ──────────────────────────────────────────────────
function ObraCard({ obra, navigate }: { obra: Obra; navigate: ReturnType<typeof useNavigate> }) {
  const precio = obra.precio_minimo || obra.precio_base;

  return (
    <article
      onClick={() => navigate(`/obras/${obra.slug}`)}
      className="obra-card"
      style={{
        background: C.panel,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${C.border}`,
        transition: "all .3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Imagen */}
      <div style={{ aspectRatio: "1/1", position: "relative", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
        {obra.imagen_principal ? (
          <img
            src={obra.imagen_principal}
            alt={obra.titulo}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease" }}
            className="obra-img"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={36} color={C.creamMut} strokeWidth={1.2} />
          </div>
        )}

        {/* Overlay hover */}
        <div className="obra-overlay" style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity .25s",
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/obras/${obra.slug}`); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "white", border: "none", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FB }}
            >
              <Eye size={15} strokeWidth={2} /> Ver obra
            </button>
          </div>
        </div>

        {/* Wishlist */}
        <button
          onClick={e => e.stopPropagation()}
          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.creamMut, zIndex: 2, transition: "all .2s" }}
          className="wish-btn"
        >
          <Heart size={14} strokeWidth={1.8} />
        </button>

        {/* Badge categoría */}
        <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 20, background: "rgba(7,5,16,0.82)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderBr}`, fontSize: 11, fontWeight: 700, color: C.orange, fontFamily: FB, zIndex: 2 }}>
          {obra.categoria_nombre}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>
          {obra.titulo}
        </div>
        <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>
          {obra.artista_alias || obra.artista_nombre}
          {obra.anio_creacion ? ` · ${obra.anio_creacion}` : ""}
        </div>

        {/* Rating estático */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={11} fill={C.gold} color={C.gold} />)}
          <span style={{ fontSize: 11, color: C.creamMut, marginLeft: 4, fontFamily: FB }}>4.8</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          {precio ? (
            <div>
              <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.06em" }}>Desde</div>
              <div style={{ fontSize: 18, fontWeight: 900, background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: FB, lineHeight: 1.2 }}>
                ${Number(precio).toLocaleString("es-MX")}
                <span style={{ fontSize: 11, fontWeight: 600, WebkitTextFillColor: C.creamMut, marginLeft: 3 }}>MXN</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.creamMut, fontStyle: "italic", fontFamily: FB }}>A consultar</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.creamMut, fontFamily: FB }}>
            <Eye size={12} strokeWidth={1.8} /> {obra.vistas || 0}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); navigate(`/obras/${obra.slug}`); }}
          style={{ marginTop: 10, width: "100%", padding: "9px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px ${C.orange}30`, transition: "all .2s" }}
          className="ver-btn"
        >
          Ver obra
        </button>
      </div>
    </article>
  );
}

// ── Página ────────────────────────────────────────────────
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

  const catNombre = catActiva ? categorias.find(c => c.id_categoria === catActiva)?.nombre : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>

      {/* ── Hero strip ── */}
      <section style={{ position: "relative", padding: "64px 56px 52px", overflow: "hidden", borderBottom: `1px solid ${C.borderBr}` }}>
        {/* Fondos */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 80% at 20% 50%, ${C.pink}10, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 60% at 80% 30%, ${C.purple}0d, transparent)`, pointerEvents: "none" }} />
        {/* Línea top igual que navbar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

        <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 100, background: `${C.orange}18`, border: `1px solid ${C.orange}38`, fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20, fontFamily: FB }}>
            <Sparkles size={12} /> Colección Nu-B Studio
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 900, color: C.cream, margin: "0 0 12px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Catálogo de{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Arte Huasteco</span>
              </h1>
              <p style={{ fontSize: 15, color: C.creamSub, margin: 0, maxWidth: 520, lineHeight: 1.7, fontFamily: FB }}>
                Descubre obras únicas de artistas locales. Cada pieza es un puente entre la tradición ancestral y el arte contemporáneo.
              </p>
            </div>

            {/* Buscador */}
            <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 520, minWidth: 280 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,232,200,0.05)", border: `1.5px solid ${C.borderHi}`, borderRadius: 12, padding: "11px 16px", backdropFilter: "blur(10px)" }}>
                <Search size={15} color={C.creamMut} strokeWidth={1.8} />
                <input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Buscar obras, artistas…"
                  style={{ border: "none", outline: "none", background: "transparent", color: C.cream, fontSize: 14, flex: 1, fontFamily: FB }}
                />
                {search && (
                  <button onClick={() => handleSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                    <X size={13} color={C.creamMut} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFiltros(p => !p)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, background: showFiltros ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.05)", border: `1.5px solid ${showFiltros ? "transparent" : C.borderHi}`, color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB, transition: "all .2s", boxShadow: showFiltros ? `0 6px 20px ${C.orange}40` : "none" }}
              >
                <SlidersHorizontal size={15} strokeWidth={2} /> Filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 56px 80px" }}>

        {/* Filtros expandibles */}
        {showFiltros && (
          <div style={{ background: C.panel, borderRadius: 14, border: `1px solid ${C.borderBr}`, padding: "20px 24px", marginBottom: 24, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, fontFamily: FB }}>Ordenar por</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ORDENAR.map(o => (
                  <button key={o.val} onClick={() => handleOrden(o.val)}
                    style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${ordenar === o.val ? C.orange : C.borderHi}`, background: ordenar === o.val ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)", color: ordenar === o.val ? "white" : C.creamSub, fontSize: 13, fontWeight: ordenar === o.val ? 700 : 500, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categorías */}
        <div className="cats-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          <button onClick={() => handleCat(null)}
            style={{ padding: "8px 20px", borderRadius: 50, border: `1.5px solid ${catActiva === null ? C.orange : C.borderHi}`, background: catActiva === null ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)", color: catActiva === null ? "white" : C.creamSub, fontWeight: catActiva === null ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s", boxShadow: catActiva === null ? `0 4px 14px ${C.orange}35` : "none" }}>
            Todas
          </button>
          {categorias.map(c => (
            <button key={c.id_categoria} onClick={() => handleCat(c.id_categoria)}
              style={{ padding: "8px 20px", borderRadius: 50, border: `1.5px solid ${catActiva === c.id_categoria ? C.orange : C.borderHi}`, background: catActiva === c.id_categoria ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)", color: catActiva === c.id_categoria ? "white" : C.creamSub, fontWeight: catActiva === c.id_categoria ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s", boxShadow: catActiva === c.id_categoria ? `0 4px 14px ${C.orange}35` : "none" }}>
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Info resultados */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 13.5, color: C.creamMut, fontFamily: FB }}>
            {loading ? "Cargando…" : (
              <>
                <strong style={{ color: C.cream }}>{total}</strong> obras encontradas
                {catNombre && <> en <strong style={{ color: C.orange }}>{catNombre}</strong></>}
                {search && <> para "<strong style={{ color: C.cream }}>{search}</strong>"</>}
              </>
            )}
          </div>
          {(catActiva || search) && (
            <button onClick={() => { handleCat(null); handleSearch(""); }}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.orange, background: "transparent", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: FB }}>
              <X size={13} strokeWidth={2.5} /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0", gap: 12, color: C.creamMut, fontFamily: FB }}>
            <RefreshCw size={22} className="spin" />
            <span style={{ fontSize: 15 }}>Cargando obras…</span>
          </div>
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.creamMut, fontFamily: FB }}>
            <ImageIcon size={52} strokeWidth={1} style={{ opacity: .15, marginBottom: 20 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: C.creamSub, marginBottom: 8, fontFamily: FD }}>Sin resultados</div>
            <div style={{ fontSize: 14 }}>Intenta con otro término o categoría</div>
          </div>
        ) : (
          <div className="obras-grid">
            {obras.map(obra => <ObraCard key={obra.id_obra} obra={obra} navigate={navigate} />)}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 48 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.borderHi}`, background: "rgba(255,232,200,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1, color: C.creamMut, transition: "all .15s" }}>
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${p === page ? C.orange : C.borderHi}`, background: p === page ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.04)", color: p === page ? "white" : C.creamSub, fontWeight: p === page ? 800 : 500, fontSize: 14, cursor: "pointer", fontFamily: FB, transition: "all .15s", boxShadow: p === page ? `0 4px 14px ${C.orange}35` : "none" }}>
                  {p}
                </button>
              );
            })}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.borderHi}`, background: "rgba(255,232,200,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? .4 : 1, color: C.creamMut, transition: "all .15s" }}>
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .obras-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .obra-card:hover { transform: translateY(-6px); border-color: rgba(255,138,91,0.3); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
        .obra-card:hover .obra-img  { transform: scale(1.06); }
        .obra-card:hover .obra-overlay { opacity: 1 !important; }
        .obra-card:hover .ver-btn   { box-shadow: 0 8px 20px ${C.orange}50; }
        .wish-btn:hover { background: rgba(204,89,173,0.3) !important; border-color: ${C.pink} !important; color: ${C.pink} !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        @media (max-width: 1200px) {
          .obras-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .obras-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          section[style*="padding: 64px 56px"] { padding: 48px 24px 36px !important; }
          div[style*="padding: 28px 56px"]     { padding: 20px 24px 60px !important; }
        }
        @media (max-width: 560px) {
          .obras-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .cats-row   { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
          .cats-row::-webkit-scrollbar { display: none; }
          .cats-row button { flex-shrink: 0; }
        }
      `}</style>
    </div>
  );
}