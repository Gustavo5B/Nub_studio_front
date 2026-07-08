// src/pages/cliente/MisFavoritos.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import { emitCartUpdate } from "../../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:  "#E8640C",
  pink:    "#A83B90",
  ink:     "#14121E",
  sub:     "#9896A8",
  subLight:"#C4C2D0",
  bg:      "#F9F8FC",
  card:    "#FFFFFF",
  border:  "#E6E4EF",
  dark:    "#0D0B14",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface Favorito {
  id_favorito:      number;
  id_obra:          number;
  titulo:           string;
  slug:             string;
  imagen_principal: string;
  precio_base:      number;
  estado:           string;
  artista_alias:    string;
  created_at:       string;
}

export default function MisFavoritos() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [favoritos,   setFavoritos]   = useState<Favorito[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [removiendo,  setRemoviendo]  = useState<Set<number>>(new Set());
  const [agregando,   setAgregando]   = useState<Set<number>>(new Set());
  const [enCarrito,   setEnCarrito]   = useState<Set<number>>(new Set());

  const token   = authService.getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFavoritos = useCallback(async () => {
    if (!token) { navigate("/login"); return; }
    try {
      const res  = await fetch(`${API_URL}/api/favoritos`, { headers });
      const data = await res.json();
      if (data.success) setFavoritos(data.data);
    } catch {
      showToast("Error al cargar favoritos", "err");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchFavoritos(); }, [fetchFavoritos]);

  const handleRemover = async (id_obra: number) => {
    if (removiendo.has(id_obra)) return;
    setRemoviendo(prev => new Set(prev).add(id_obra));
    try {
      const res  = await fetch(`${API_URL}/api/favoritos/${id_obra}`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (data.success) {
        setFavoritos(prev => prev.filter(f => f.id_obra !== id_obra));
        showToast("Obra eliminada de favoritos", "ok");
      }
    } catch {
      showToast("Error al eliminar favorito", "err");
    } finally {
      setRemoviendo(prev => { const n = new Set(prev); n.delete(id_obra); return n; });
    }
  };

  const handleAgregarCarrito = async (fav: Favorito) => {
    if (agregando.has(fav.id_obra) || enCarrito.has(fav.id_obra)) return;
    setAgregando(prev => new Set(prev).add(fav.id_obra));
    try {
      const res = await fetch(`${API_URL}/api/carrito`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ id_obra: fav.id_obra, cantidad: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Error al agregar al carrito", "err");
        return;
      }
      setEnCarrito(prev => new Set(prev).add(fav.id_obra));
      showToast(`"${fav.titulo}" agregada al carrito`, "ok");
      emitCartUpdate();
    } catch {
      showToast("Sin conexión", "err");
    } finally {
      setAgregando(prev => { const n = new Set(prev); n.delete(fav.id_obra); return n; });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .fav-card {
          transition: box-shadow .25s ease, transform .22s ease;
          cursor: pointer;
        }
        .fav-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(20,18,30,.12) !important;
        }
        .fav-img { user-select: none; -webkit-user-select: none; }
        .fav-img img {
          transition: transform .55s cubic-bezier(.2,0,0,1);
          -webkit-user-drag: none; pointer-events: none;
        }
        .fav-card:hover .fav-img img { transform: scale(1.06); }

        .fav-watermark {
          position: absolute; bottom: 10px; right: 12px; z-index: 3;
          pointer-events: none;
          font-family: ${NEXA}; font-size: 9px; font-weight: 900;
          letter-spacing: .25em; text-transform: uppercase; color: #fff;
          mix-blend-mode: difference; opacity: .55;
          white-space: nowrap;
        }

        .fav-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(14,12,28,.72) 100%);
          opacity: 0;
          transition: opacity .28s ease;
          pointer-events: none;
        }
        .fav-card:hover .fav-overlay { opacity: 1; }

        .fav-actions {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px;
          display: flex; gap: 8px;
          transform: translateY(8px);
          opacity: 0;
          transition: transform .28s ease, opacity .28s ease;
          pointer-events: none;
        }
        .fav-card:hover .fav-actions {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .fav-remove-btn {
          position: absolute; top: 12px; right: 12px;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,.92); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(8px);
          opacity: 0; transition: opacity .2s, background .2s;
          z-index: 2;
        }
        .fav-card:hover .fav-remove-btn { opacity: 1; }
        .fav-remove-btn:hover { background: #FEF2F2 !important; }

        .cart-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px; border-radius: 10px;
          background: ${C.orange}; border: none;
          color: #fff; font-size: 10.5px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; font-family: ${SANS};
          transition: background .18s, transform .15s;
        }
        .cart-btn:hover:not(:disabled) { background: #D4570A; transform: scale(1.02); }
        .cart-btn:disabled { opacity: .7; cursor: not-allowed; }
        .cart-btn.done { background: #0E8A50; }

        .view-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: background .18s;
        }
        .view-btn:hover { background: rgba(255,255,255,.28); }

        .shimmer {
          background: linear-gradient(90deg, #ece9f0 25%, #f5f3f8 50%, #ece9f0 75%);
          background-size: 200% 100%;
          animation: shimmerAnim 1.4s infinite;
        }
        @keyframes shimmerAnim {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fav-card { animation: fadeUp .3s ease both; }
      `}</style>


      {/* ── Hero title ── */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 0" }}>
        <h1 style={{
          fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900,
          color: C.ink, margin: "0 0 4px", letterSpacing: "-.03em",
        }}>
          Mis favoritos
        </h1>
        <div style={{
          height: 3, width: 48, borderRadius: 2,
          background: `linear-gradient(90deg, ${C.pink}, ${C.orange})`,
          marginBottom: 32,
        }} />
      </div>

      {/* ── Contenido ── */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div className="shimmer" style={{ aspectRatio: "3/4" }} />
                <div style={{ padding: "16px" }}>
                  <div className="shimmer" style={{ height: 14, borderRadius: 6, marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 11, width: "55%", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vacío */}
        {!loading && favoritos.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "55vh", textAlign: "center", padding: "40px 32px",
          }}>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{
                width: 84, height: 84, borderRadius: "50%",
                background: "linear-gradient(135deg,#F8F0F6,#F2E6F0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(20,18,30,.08)",
              }}>
                <Heart size={34} color={C.pink} strokeWidth={1.2} />
              </div>
              <div style={{
                position: "absolute", top: -5, right: -5,
                width: 20, height: 20, borderRadius: "50%",
                background: C.orange, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#fff", fontWeight: 900,
              }}>★</div>
            </div>

            <div style={{
              fontFamily: SERIF, fontStyle: "italic",
              fontSize: "clamp(26px,4vw,38px)", fontWeight: 900,
              color: C.ink, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 12,
            }}>
              Aún no tienes favoritos
            </div>

            <div style={{
              width: 36, height: 2, borderRadius: 2,
              background: `linear-gradient(90deg,${C.orange},${C.pink})`,
              margin: "0 auto 16px",
            }} />

            <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 28, lineHeight: 1.75, maxWidth: 340 }}>
              Explora el catálogo y guarda las obras que más te gusten tocando el ♥
            </div>

            <button onClick={() => navigate("/catalogo")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px", borderRadius: 100,
              background: C.orange, border: "none", color: "#fff",
              fontSize: 11, fontWeight: 700, letterSpacing: ".14em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: SANS,
              boxShadow: `0 8px 24px ${C.orange}35`, transition: "background .18s, transform .18s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d45a0a"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.orange; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              <Sparkles size={13} strokeWidth={2} /> Explorar galería
            </button>

            <div style={{ marginTop: 20, fontSize: 11, color: C.subLight, letterSpacing: ".04em", fontStyle: "italic" }}>
              Arte auténtico de la Huasteca Hidalguense
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && favoritos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {favoritos.map((fav, idx) => (
              <div
                key={fav.id_favorito}
                className="fav-card"
                style={{
                  background: C.card, borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 8px rgba(20,18,30,.05)",
                  overflow: "hidden", position: "relative",
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Imagen */}
                <div
                  className="fav-img"
                  onClick={() => navigate(`/obras/${fav.slug}`)}
                  onContextMenu={e => e.preventDefault()}
                  style={{ aspectRatio: "3/4", overflow: "hidden", position: "relative", background: "#EDE9E3" }}
                >
                  {fav.imagen_principal
                    ? <img
                        src={fav.imagen_principal} alt={fav.titulo}
                        draggable={false}
                        onDragStart={e => e.preventDefault()}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Heart size={32} color={C.subLight} strokeWidth={1} />
                      </div>
                  }

                  {/* Marca de agua */}
                  <div className="fav-watermark">NU★B STUDIO</div>

                  {/* Overlay en hover */}
                  <div className="fav-overlay" />

                  {/* Badge estado */}
                  {fav.estado !== "publicada" && (
                    <div style={{
                      position: "absolute", top: 12, left: 12,
                      padding: "3px 10px", borderRadius: 100,
                      background: "rgba(168,112,6,.88)", backdropFilter: "blur(6px)",
                      fontSize: 9, fontWeight: 800, color: "#fff",
                      letterSpacing: ".1em", textTransform: "uppercase", fontFamily: SANS,
                    }}>En revisión</div>
                  )}

                  {/* Botón quitar */}
                  <button
                    className="fav-remove-btn"
                    onClick={e => { e.stopPropagation(); handleRemover(fav.id_obra); }}
                    disabled={removiendo.has(fav.id_obra)}
                    title="Quitar de favoritos"
                    style={{ opacity: removiendo.has(fav.id_obra) ? 0.4 : undefined } as React.CSSProperties}
                  >
                    <Trash2 size={13} color="#C4304A" strokeWidth={2} />
                  </button>

                  {/* Acciones en hover */}
                  <div className="fav-actions">
                    <button
                      className={`cart-btn${enCarrito.has(fav.id_obra) ? " done" : ""}`}
                      onClick={e => { e.stopPropagation(); handleAgregarCarrito(fav); }}
                      disabled={agregando.has(fav.id_obra) || fav.estado !== "publicada"}
                    >
                      <ShoppingCart size={12} strokeWidth={2.5} />
                      {agregando.has(fav.id_obra) ? "Agregando…"
                        : enCarrito.has(fav.id_obra) ? "En carrito ✓"
                        : fav.estado !== "publicada" ? "No disponible"
                        : "Agregar"}
                    </button>
                    <button
                      className="view-btn"
                      onClick={e => { e.stopPropagation(); navigate(`/obras/${fav.slug}`); }}
                      title="Ver obra"
                    >
                      <ArrowRight size={15} color="#fff" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div
                  style={{ padding: "14px 16px 16px" }}
                  onClick={() => navigate(`/obras/${fav.slug}`)}
                >
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: SANS,
                    marginBottom: 3,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {fav.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
                    {fav.artista_alias}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: NEXA, fontSize: 16, fontWeight: 900, color: C.orange }}>
                      {fmt(Number(fav.precio_base))}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Heart size={12} color={C.pink} fill={C.pink} strokeWidth={0} />
                      <span style={{ fontSize: 10, color: C.subLight, fontWeight: 500 }}>guardada</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer link */}
        {!loading && favoritos.length > 0 && (
          <div style={{ marginTop: 48, textAlign: "center" }}>
            <button
              onClick={() => navigate("/catalogo")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "none", border: `1.5px solid ${C.border}`, borderRadius: 100,
                padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em",
                textTransform: "uppercase", color: C.sub, cursor: "pointer",
                fontFamily: SANS, transition: "all .18s",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.ink; el.style.color = C.ink; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.color = C.sub; }}
            >
              Seguir explorando <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
