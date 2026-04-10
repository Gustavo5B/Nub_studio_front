// src/pages/cliente/MisFavoritos.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Image as ImageIcon, ShoppingCart, Sparkles, Trash2 } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", pink: "#A83B90", blue: "#2D6FBE",
  ink:    "#14121E", sub:  "#9896A8", muted: "#C4C2CF",
  bg:     "#FAFAF9", card: "#FFFFFF",
  border: "rgba(0,0,0,0.07)", borderHi: "rgba(0,0,0,0.12)",
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

  const [favoritos,  setFavoritos]  = useState<Favorito[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [removiendo, setRemoviendo] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = authService.getToken();
    if (!token) { navigate("/login"); return; }
    fetch(`${API_URL}/api/favoritos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setFavoritos(d.data); })
      .catch(() => showToast("Error al cargar favoritos", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleRemover = async (id_obra: number) => {
    if (removiendo.has(id_obra)) return;
    const token = authService.getToken();
    setRemoviendo(prev => new Set(prev).add(id_obra));
    try {
      const res  = await fetch(`${API_URL}/api/favoritos/${id_obra}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFavoritos(prev => prev.filter(f => f.id_obra !== id_obra));
        showToast("Obra eliminada de favoritos", "success");
      }
    } catch {
      showToast("Error al eliminar favorito", "error");
    }
    setRemoviendo(prev => { const n = new Set(prev); n.delete(id_obra); return n; });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>

      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .fav-card { transition: box-shadow .22s, transform .22s; }
        .fav-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.09) !important; }
        .fav-img img { transition: transform .5s cubic-bezier(.2,0,0,1); }
        .fav-card:hover .fav-img img { transform: scale(1.05); }
        .fav-remove { opacity: 0; transition: opacity .2s; }
        .fav-card:hover .fav-remove { opacity: 1; }
        @media (max-width: 640px) {
          .fav-grid { grid-template-columns: 1fr !important; }
          .fav-hero { padding: 32px 20px 24px !important; }
          .fav-body { padding: 0 20px 60px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,249,0.96)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 40px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: SERIF, fontSize: 19, fontWeight: 900,
          color: C.ink, letterSpacing: "-.02em", padding: 0,
        }}>ALTAR</button>

        <button onClick={() => navigate("/mi-cuenta")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: `1px solid ${C.border}`, borderRadius: 100,
          padding: "5px 14px", cursor: "pointer",
          fontSize: 11, fontWeight: 600, color: C.sub, fontFamily: SANS,
          transition: "all .2s",
        }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.borderHi; el.style.color=C.ink; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.color=C.sub; }}
        >
          Mi cuenta
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="fav-hero" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 40px 32px" }}>
        <button onClick={() => navigate("/mi-cuenta")} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 700, color: C.sub, fontFamily: SANS,
          letterSpacing: ".12em", textTransform: "uppercase", padding: 0,
          marginBottom: 32, transition: "color .18s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
        >
          <ArrowLeft size={13} strokeWidth={2.5} /> Mi cuenta
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `${C.pink}14`, border: `1px solid ${C.pink}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Heart size={18} color={C.pink} strokeWidth={1.8} fill={`${C.pink}33`} />
          </div>
          <h1 style={{
            margin: 0, fontFamily: SERIF,
            fontSize: "clamp(22px,3vw,28px)", fontWeight: 900,
            color: C.ink, letterSpacing: "-.025em",
          }}>Mis favoritos</h1>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: C.sub, fontFamily: SANS }}>
          {loading ? "Cargando…" : favoritos.length === 0
            ? "Aún no tienes obras guardadas"
            : `${favoritos.length} ${favoritos.length === 1 ? "obra guardada" : "obras guardadas"}`
          }
        </p>

        <div style={{
          height: 1, marginTop: 32,
          background: `linear-gradient(90deg, ${C.pink}40, transparent)`,
        }} />
      </section>

      {/* ── Cuerpo ── */}
      <section className="fav-body" style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px 80px" }}>

        {/* Estado vacío */}
        {!loading && favoritos.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 24px", gap: 20, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: `${C.pink}10`, border: `1px solid ${C.pink}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart size={30} color={C.pink} strokeWidth={1.3} style={{ opacity: .4 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: SANS, marginBottom: 8 }}>
                Sin favoritos aún
              </div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: SANS, maxWidth: 280, lineHeight: 1.7 }}>
                Explora el catálogo y guarda las obras que más te gusten con el botón ❤️
              </div>
            </div>
            <button onClick={() => navigate("/catalogo")} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 100,
              background: `linear-gradient(135deg,${C.orange},${C.pink})`,
              border: "none", color: "#fff",
              fontSize: 10.5, fontWeight: 700, letterSpacing: ".16em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: SANS,
              boxShadow: `0 8px 24px ${C.orange}35`,
            }}>
              <Sparkles size={13} strokeWidth={2} /> Explorar galería
            </button>
          </div>
        )}

        {/* Skeleton carga */}
        {loading && (
          <div className="fav-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, paddingTop: 8 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ aspectRatio: "3/4", background: "rgba(0,0,0,0.05)" }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ height: 14, width: "70%", background: "rgba(0,0,0,0.06)", borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 11, width: "40%", background: "rgba(0,0,0,0.04)", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de favoritos */}
        {!loading && favoritos.length > 0 && (
          <div className="fav-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, paddingTop: 8 }}>
            {favoritos.map(fav => (
              <div
                key={fav.id_favorito}
                className="fav-card"
                style={{
                  background: C.card, borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                  overflow: "hidden", position: "relative",
                }}
              >
                {/* Imagen */}
                <div className="fav-img" style={{
                  aspectRatio: "3/4", overflow: "hidden",
                  background: "#ece9e4", position: "relative", cursor: "pointer",
                }} onClick={() => navigate(`/obras/${fav.slug}`)}>
                  {fav.imagen_principal
                    ? <img src={fav.imagen_principal} alt={fav.titulo}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageIcon size={32} color="rgba(0,0,0,.12)" strokeWidth={1} />
                      </div>
                  }

                  {/* Overlay gradiente */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(180deg,transparent 55%,rgba(7,5,16,.5) 100%)",
                    pointerEvents: "none",
                  }} />

                  {/* Botón quitar favorito */}
                  <button
                    className="fav-remove"
                    onClick={e => { e.stopPropagation(); handleRemover(fav.id_obra); }}
                    disabled={removiendo.has(fav.id_obra)}
                    title="Quitar de favoritos"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(255,255,255,.92)", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", backdropFilter: "blur(8px)",
                      opacity: removiendo.has(fav.id_obra) ? 0.5 : undefined,
                    }}
                  >
                    <Trash2 size={13} color="#C4304A" strokeWidth={2} />
                  </button>

                  {/* Estado obra */}
                  {fav.estado !== "publicada" && (
                    <div style={{
                      position: "absolute", bottom: 10, left: 10,
                      padding: "3px 10px", borderRadius: 100,
                      background: "rgba(168,112,6,0.85)", backdropFilter: "blur(6px)",
                      fontSize: 10, fontWeight: 700, color: "#fff",
                      letterSpacing: ".1em", textTransform: "uppercase", fontFamily: SANS,
                    }}>En revisión</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 800, color: C.ink,
                    fontFamily: SANS, marginBottom: 3,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    cursor: "pointer",
                  }} onClick={() => navigate(`/obras/${fav.slug}`)}>
                    {fav.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontFamily: SANS, marginBottom: 12 }}>
                    {fav.artista_alias}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontFamily: NEXA, fontSize: 15, fontWeight: 900, color: C.ink,
                    }}>{fmt(Number(fav.precio_base))}</span>

                    <button
                      onClick={() => navigate(`/obras/${fav.slug}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 100,
                        background: `linear-gradient(135deg,${C.orange},${C.pink})`,
                        border: "none", color: "#fff",
                        fontSize: 10, fontWeight: 700, letterSpacing: ".14em",
                        textTransform: "uppercase", cursor: "pointer", fontFamily: SANS,
                        boxShadow: `0 4px 14px ${C.orange}30`,
                      }}
                    >
                      <ShoppingCart size={11} strokeWidth={2.5} />
                      Ver obra
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
