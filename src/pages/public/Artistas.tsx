// src/pages/public/Artistas.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, ImageIcon, Palette, Sparkles, X, ChevronRight, Users } from "lucide-react";

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
  creamMut: "rgba(255,232,200,0.32)",
  bg:       "#0C0812",
  panel:    "#100D1C",
  card:     "rgba(16,13,28,0.90)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.22)",
  borderHi: "rgba(255,200,150,0.18)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const PALETTE = [C.orange, C.pink, C.purple, C.blue, C.gold];

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

function ArtistaCard({ artista, index }: { artista: Artista; index: number }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const { ref, inView } = useInView();
  const color    = PALETTE[artista.id_artista % PALETTE.length];
  const initials = artista.nombre_completo?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?";

  return (
    <div ref={ref}
      onClick={() => navigate(`/artistas/${artista.id_artista}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        borderRadius: 22,
        border: `1px solid ${hov ? color + "40" : C.border}`,
        overflow: "hidden", cursor: "pointer",
        transition: "border-color .25s, box-shadow .25s, transform .25s",
        transform: inView ? (hov ? "translateY(-6px)" : "translateY(0)") : "translateY(28px)",
        opacity: inView ? 1 : 0,
        boxShadow: hov ? `0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px ${color}18` : "0 4px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        transitionDelay: inView ? "0s" : `${index * 0.06}s`,
      }}
    >
      {/* ── Banner ── */}
      <div style={{ height: 96, background: `linear-gradient(135deg, ${color}20, ${color}06)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        {artista.categoria_nombre && (
          <div style={{ position: "absolute", top: 12, right: 14, fontSize: 10, padding: "3px 11px", borderRadius: 100, background: "rgba(7,5,16,0.80)", backdropFilter: "blur(10px)", border: `1px solid ${color}35`, color, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FB }}>
            {artista.categoria_nombre}
          </div>
        )}
        <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${color}16, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, left: -10, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${color}10, transparent 70%)`, pointerEvents: "none" }} />


      </div>

      {/* ── Avatar ── */}
      <div style={{ padding: "0 22px", marginTop: -34, position: "relative", zIndex: 2, marginBottom: 16 }}>
        <div style={{ width: 68, height: 68, borderRadius: 20, border: `3px solid ${C.panel}`, overflow: "hidden", background: `linear-gradient(135deg, ${color}22, ${color}08)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${color}35, 0 0 0 1px ${color}20` }}>
          {artista.foto_perfil
            ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 24, fontWeight: 900, color, fontFamily: FD }}>{initials}</span>
          }
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ padding: "0 22px 22px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: hov ? color : C.creamMut, fontWeight: 700, fontFamily: FB, transition: "color .2s" }}>
            Ver perfil <ChevronRight size={13} strokeWidth={2.5} />
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

      {/* ── Hero — 2 columnas ── */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.borderBr}` }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${C.orange}08, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 80% at 100% 30%, ${C.purple}10, transparent)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 48px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Izquierda */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 100, background: `${C.orange}15`, border: `1px solid ${C.orange}35`, fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 22, fontFamily: FB, opacity: visible ? 1 : 0, transition: "opacity .6s .1s" }}>
              <Sparkles size={11} /> Artistas certificados
            </div>

            <h1 style={{ fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 900, color: C.cream, margin: "0 0 18px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.08, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .8s .2s, transform .8s .2s" }}>
              Los creadores del{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Arte Huasteco</span>
            </h1>

            <p style={{ fontSize: 15.5, color: C.creamSub, margin: "0 0 36px", lineHeight: 1.8, fontFamily: FB, opacity: visible ? 1 : 0, transition: "opacity .8s .35s" }}>
              Conoce a los creadores que preservan y renuevan la tradición huasteca. Cada artista está verificado y certificado por Galería Altar.
            </p>

            {/* Buscador */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,200,150,0.04)", border: `1.5px solid ${C.borderBr}`, borderRadius: 13, padding: "11px 16px", maxWidth: 440, backdropFilter: "blur(12px)", opacity: visible ? 1 : 0, transition: "opacity .8s .45s" }}
              onFocus={() => {}}
            >
              <Search size={15} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artistas…"
                style={{ border: "none", outline: "none", background: "transparent", color: C.cream, fontSize: 14, flex: 1, fontFamily: FB }} />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}>
                  <X size={14} color={C.creamMut} />
                </button>
              )}
            </div>
          </div>

          {/* Derecha — stats visuales */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: visible ? 1 : 0, transition: "opacity .9s .4s" }}>
            {[
              { num: artistas.length,    label: "Artistas activos",    color: C.orange, icon: Users   },
              { num: totalObras,         label: "Obras en galería",    color: C.gold,   icon: Palette },
              { num: categorias.length,  label: "Disciplinas",         color: C.purple, icon: Sparkles },
            ].map(({ num, label, color, icon: Icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, backdropFilter: "blur(16px)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.cream, fontFamily: FD, lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 12, color: C.creamMut, marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FB, fontWeight: 600 }}>{label}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 4, height: 40, borderRadius: 4, background: `linear-gradient(180deg, ${color}, ${color}30)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 48px 80px" }}>

        {/* Filtros */}
        {categorias.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap", alignItems: "center" }}>
            {[{ label: "Todos", val: null as string | null }, ...categorias.map(c => ({ label: c, val: c }))].map(({ label, val }) => {
              const active = catActiva === val;
              return (
                <button key={label} onClick={() => setCatActiva(val)}
                  style={{ padding: "7px 18px", borderRadius: 100, border: `1px solid ${active ? C.orange + "55" : C.borderBr}`, background: active ? `${C.orange}15` : "rgba(255,200,150,0.04)", color: active ? C.cream : C.creamSub, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s", boxShadow: active ? `0 0 16px ${C.orange}18` : "none" }}
                  onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderHi; el.style.color = C.cream; } }}
                  onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderBr; el.style.color = C.creamSub; } }}
                >{label}</button>
              );
            })}
            <div style={{ marginLeft: "auto", fontSize: 13, color: C.creamMut, fontFamily: FB }}>
              {!loading && <><strong style={{ color: C.cream }}>{filtrados.length}</strong> artistas</>}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "100px 0", gap: 12, color: C.creamMut }}>
            <RefreshCw size={18} color={C.orange} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 14, fontFamily: FB }}>Cargando artistas…</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <ImageIcon size={52} color={C.creamMut} strokeWidth={1} style={{ opacity: .2, marginBottom: 20 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 8 }}>Sin resultados</div>
            <div style={{ fontSize: 14, color: C.creamSub, fontFamily: FB }}>Intenta con otro término o categoría</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtrados.map((a, i) => <ArtistaCard key={a.id_artista} artista={a} index={i} />)}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.28); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}