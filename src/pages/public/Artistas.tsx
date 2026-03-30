// src/pages/public/Artistas.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search,  ImageIcon, Palette, Sparkles, X, ChevronRight, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
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
const PALETTE = [C.orange, C.pink, C.purple, C.blue, C.gold];

// Color dot per category index (cycles through PALETTE)
const CAT_COLORS = PALETTE;

interface Artista {
  id_artista: number;
  nombre_completo: string;
  nombre_artistico: string;
  biografia: string;
  foto_perfil: string;
  categoria_nombre: string;
  total_obras: number;
  estado: string;
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function SkeletonCard() {
  return (
    <div style={{
      background: C.card,
      borderRadius: 22,
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      backdropFilter: "blur(20px)",
    }}>
      {/* Banner skeleton */}
      <div style={{ height: 128, background: "rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
        <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
      </div>
      {/* Avatar skeleton */}
      <div style={{ padding: "0 22px", marginTop: -38, marginBottom: 16, position: "relative", zIndex: 2 }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
        </div>
      </div>
      {/* Text skeleton */}
      <div style={{ padding: "0 22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 16, borderRadius: 8, background: "rgba(0,0,0,0.04)", width: "65%", position: "relative", overflow: "hidden" }}>
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
        </div>
        <div style={{ height: 12, borderRadius: 8, background: "rgba(0,0,0,0.03)", width: "45%", position: "relative", overflow: "hidden" }}>
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
        </div>
        <div style={{ height: 12, borderRadius: 8, background: "rgba(0,0,0,0.02)", width: "90%", position: "relative", overflow: "hidden" }}>
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
        </div>
        <div style={{ height: 12, borderRadius: 8, background: "rgba(0,0,0,0.02)", width: "75%", position: "relative", overflow: "hidden" }}>
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0 }} />
        </div>
      </div>
    </div>
  );
}

function ArtistaCard({ artista, index }: { readonly artista: Artista; readonly index: number }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [entered, setEntered] = useState(false);
  const { ref, inView } = useInView();
  const color    = PALETTE[artista.id_artista % PALETTE.length];
  const initials = artista.nombre_completo?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?";

  // Once entered, remove stagger delay so hover doesn't lag
  useEffect(() => {
    if (inView && !entered) {
      const t = setTimeout(() => setEntered(true), index * 60 + 700);
      return () => clearTimeout(t);
    }
  }, [inView, entered, index]);

  let cardTransform: string;
  if (!inView) cardTransform = "translateY(32px) scale(0.97)";
  else if (hov) cardTransform = "translateY(-7px) scale(1.01)";
  else cardTransform = "translateY(0) scale(1)";

  return (
    <div ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/artistas/${artista.id_artista}`)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate(`/artistas/${artista.id_artista}`); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        borderRadius: 22,
        border: `1px solid ${hov ? color + "45" : C.border}`,
        overflow: "hidden", cursor: "pointer",
        transition: entered
          ? "border-color .22s 0s, box-shadow .22s 0s, transform .22s 0s"
          : `opacity .55s ${index * 0.06}s, transform .65s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s, border-color .22s 0s, box-shadow .22s 0s`,
        transform: cardTransform,
        opacity: inView ? 1 : 0,
        boxShadow: hov ? `0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px ${color}18` : "0 4px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        position: "relative",
      }}
    >
      {/* ── Accent bar (left edge) ── */}
      <div style={{
        position: "absolute",
        left: 0,
        top: "30%",
        width: 3,
        height: "40%",
        borderRadius: "0 3px 3px 0",
        background: `linear-gradient(180deg, ${color}, ${color}40)`,
        zIndex: 5,
        opacity: hov ? 1 : 0.55,
        transition: "opacity .25s",
      }} />

      {/* ── Banner ── */}
      <div style={{
        height: 128,
        background: `linear-gradient(135deg, ${color}20, ${color}06)`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top gradient line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        {/* Diagonal stripe pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(45deg, ${color}08 0px, ${color}08 1px, transparent 1px, transparent 18px)`,
          pointerEvents: "none",
        }} />
        {artista.categoria_nombre && (
          <div style={{ position: "absolute", top: 12, right: 14, fontSize: 10, padding: "3px 11px", borderRadius: 100, background: "rgba(7,5,16,0.80)", backdropFilter: "blur(10px)", border: `1px solid ${color}35`, color, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FB }}>
            {artista.categoria_nombre}
          </div>
        )}
        <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${color}16, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, left: -10, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${color}10, transparent 70%)`, pointerEvents: "none" }} />
      </div>

      {/* ── Avatar ── */}
      <div style={{ padding: "0 22px", marginTop: -38, position: "relative", zIndex: 2, marginBottom: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, border: `3px solid ${C.panel}`, overflow: "hidden", background: `linear-gradient(135deg, ${color}22, ${color}08)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${color}35, 0 0 0 1px ${color}20` }}>
          {artista.foto_perfil
            ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 26, fontWeight: 900, color, fontFamily: FD }}>{initials}</span>
          }
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ padding: "0 22px 24px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.cream, marginBottom: 2, fontFamily: FB, lineHeight: 1.3 }}>
          {artista.nombre_completo}
        </div>
        {artista.nombre_artistico && (
          <div style={{ fontSize: 12.5, color, fontWeight: 700, marginBottom: 8, fontFamily: FB, opacity: 0.9 }}>
            {artista.nombre_artistico}
          </div>
        )}

        {artista.biografia && (
          <p style={{ fontSize: 13, color: C.creamSub, lineHeight: 1.7, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: FB }}>
            {artista.biografia}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.creamMut, fontFamily: FB }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}14`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Palette size={12} color={color} strokeWidth={2} />
            </div>
            <span><strong style={{ color: C.cream, fontWeight: 700 }}>{artista.total_obras || 0}</strong> obras</span>
          </div>
          {/* Ver perfil button — always visible, arrow slides on hover */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12.5,
            color: hov ? color : C.creamSub,
            fontWeight: 700, fontFamily: FB,
            transition: "color .2s",
            background: hov ? `${color}14` : "rgba(0,0,0,0.02)",
            border: `1px solid ${hov ? color + "40" : C.borderBr}`,
            borderRadius: 8,
            padding: "5px 12px",
          }}>
            {"Ver perfil"}
            <span style={{ display: "inline-flex", transform: hov ? "translateX(3px)" : "translateX(0)", transition: "transform .2s" }}>
              <ChevronRight size={13} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Artistas() {
  const [artistas,  setArtistas]  = useState<Artista[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [visible,   setVisible]   = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/api/artistas`);
        const json = await res.json();
        setArtistas(json.data || []);
      } catch { setArtistas([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const categorias = [...new Set(artistas.map(a => a.categoria_nombre).filter(Boolean))];
  const filtrados  = artistas.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || [a.nombre_completo, a.nombre_artistico, a.biografia].some(v => v?.toLowerCase().includes(q));
    const matchCat    = !catActiva || a.categoria_nombre === catActiva;
    return matchSearch && matchCat;
  });

  const totalObras = artistas.reduce((s, a) => s + Number(a.total_obras || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.borderBr}` }}>

        {/* Rainbow top line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})`, zIndex: 10 }} />

        {/* Background radial glows */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${C.orange}08, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 80% at 100% 30%, ${C.purple}10, transparent)`, pointerEvents: "none" }} />

        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          opacity: 0.2,
        }} />

        <div
          className="hero-grid"
          style={{
            maxWidth: 1280, margin: "0 auto",
            padding: "80px 60px 64px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72,
            alignItems: "center",
            position: "relative", zIndex: 1,
          }}
        >
          {/* ── Izquierda ── */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 100, background: `${C.orange}15`, border: `1px solid ${C.orange}35`, fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 22, fontFamily: FB, opacity: visible ? 1 : 0, transition: "opacity .6s .1s" }}>
              <Sparkles size={11} /> Artistas certificados
            </div>

            <h1 style={{ fontSize: "clamp(36px, 4.5vw, 58px)", fontWeight: 900, color: C.cream, margin: "0 0 18px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.05, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .8s .2s, transform .8s .2s" }}>
              Los creadores del{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Arte Huasteco</span>
            </h1>

            <p style={{ fontSize: 15.5, color: C.creamSub, margin: "0 0 32px", lineHeight: 1.8, fontFamily: FB, opacity: visible ? 1 : 0, transition: "opacity .8s .35s" }}>
              Conoce a los creadores que preservan y renuevan la tradición huasteca. Cada artista está verificado y certificado por Galería Altar.
            </p>

            {/* Buscador */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.02)", border: `1.5px solid ${C.borderBr}`, borderRadius: 13, padding: "11px 16px", maxWidth: 440, backdropFilter: "blur(12px)", opacity: visible ? 1 : 0, transition: "opacity .8s .45s" }}>
              <Search size={15} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artistas…"
                style={{ border: "none", outline: "none", background: "transparent", color: C.cream, fontSize: 14, flex: 1, fontFamily: FB }} />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}>
                  <X size={14} color={C.creamMut} />
                </button>
              )}
            </div>

            {/* Subtitle count */}
            <div style={{ marginTop: 14, fontSize: 12.5, color: C.creamMut, fontFamily: FB, opacity: visible ? 1 : 0, transition: "opacity .8s .55s", letterSpacing: "0.04em" }}>
              {artistas.length > 0 && (
                <span><strong style={{ color: C.orange }}>{artistas.length}</strong> artistas certificados en la plataforma</span>
              )}
            </div>
          </div>

          {/* ── Derecha — stat cards ── */}
          <div className="hero-stats" style={{ display: "flex", flexDirection: "column", gap: 14, opacity: visible ? 1 : 0, transition: "opacity .9s .4s" }}>
            {[
              { num: artistas.length,   label: "Artistas activos",  color: C.orange, icon: Users    },
              { num: totalObras,        label: "Obras en galería",   color: C.gold,   icon: Palette  },
              { num: categorias.length, label: "Disciplinas",        color: C.purple, icon: Sparkles },
            ].map(({ num, label, color, icon: Icon }) => {
              return (
                <StatCard key={label} num={num} label={label} color={color} Icon={Icon} />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 48px 80px" }}>

        {/* Filtros */}
        {categorias.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap", alignItems: "center" }}>
            {[{ label: "Todos", val: null as string | null, catColor: C.orange }, ...categorias.map((c, i) => ({ label: c, val: c, catColor: CAT_COLORS[i % CAT_COLORS.length] }))].map(({ label, val, catColor }) => {
              const active = catActiva === val;
              return (
                <button key={label} onClick={() => setCatActiva(val)}
                  style={{
                    padding: "7px 18px", borderRadius: 100,
                    border: `1px solid ${active ? catColor + "70" : C.borderBr}`,
                    background: active ? `${catColor}18` : "rgba(0,0,0,0.02)",
                    color: active ? C.cream : C.creamSub,
                    fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB,
                    transition: "all .15s",
                    boxShadow: active ? `0 0 16px ${catColor}22` : "none",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                  onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderHi; el.style.color = C.cream; } }}
                  onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderBr; el.style.color = C.creamSub; } }}
                >
                  {/* Colored dot */}
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, display: "inline-block", flexShrink: 0, opacity: active ? 1 : 0.55 }} />
                  {label}
                </button>
              );
            })}
            <div style={{ marginLeft: "auto", fontSize: 13, color: C.creamMut, fontFamily: FB }}>
              {!loading && <><strong style={{ color: C.cream }}>{filtrados.length}</strong> artistas</>}
            </div>
          </div>
        )}

        {/* Grid / Loading / Empty */}
        {(() => {
          if (loading) return (
            <div className="artistas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
              {(['sk1','sk2','sk3','sk4','sk5','sk6']).map(k => <SkeletonCard key={k} />)}
            </div>
          );
          if (filtrados.length === 0) return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <ImageIcon size={52} color={C.creamMut} strokeWidth={1} style={{ opacity: .2, marginBottom: 20 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 8 }}>Sin resultados</div>
              <div style={{ fontSize: 14, color: C.creamSub, fontFamily: FB }}>Intenta con otro término o categoría</div>
            </div>
          );
          return (
            <div className="artistas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
              {filtrados.map((a, i) => <ArtistaCard key={a.id_artista} artista={a} index={i} />)}
            </div>
          );
        })()}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #9896A8; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E6E4EF; border-radius: 10px; }
        .skeleton-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,200,150,0.06), transparent);
          animation: shimmer 1.6s infinite;
        }
        @media (max-width: 1100px) { .artistas-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px)  { .artistas-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px)  { .hero-grid { grid-template-columns: 1fr !important; } .hero-stats { display: none !important; } }
      `}</style>
    </div>
  );
}

// ── Stat card with hover translateX effect ──
function StatCard({ num, label, color, Icon }: { readonly num: number; readonly label: string; readonly color: string; readonly Icon: React.ElementType }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="presentation"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 18,
        padding: "20px 24px",
        borderRadius: 16,
        background: C.card,
        borderTop: `1px solid ${hov ? color + "30" : C.border}`,
        borderRight: `1px solid ${hov ? color + "30" : C.border}`,
        borderBottom: `1px solid ${hov ? color + "30" : C.border}`,
        borderLeft: `4px solid ${color}`,
        backdropFilter: "blur(16px)",
        transform: hov ? "translateX(4px)" : "translateX(0)",
        transition: "transform .22s, border-color .22s, box-shadow .22s",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${color}14` : "0 2px 12px rgba(0,0,0,0.2)",
        cursor: "default",
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.cream, fontFamily: FD, lineHeight: 1 }}>{num}</div>
        <div style={{ fontSize: 12, color: C.creamMut, marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FB, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ marginLeft: "auto", width: 4, height: 40, borderRadius: 4, background: `linear-gradient(180deg, ${color}, ${color}30)` }} />
    </div>
  );
}
