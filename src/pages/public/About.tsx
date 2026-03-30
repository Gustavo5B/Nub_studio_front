// src/pages/public/About.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users, Palette, Globe, MapPin, Heart } from "lucide-react";
import { getSobreNosotros, getTrayectoria } from "../../services/sobreNosotrosService";
import { getMunicipiosHidalgo } from "../../services/municipiosService";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  bgDeep:   "#FFFFFF",
  borderBr: "rgba(0,0,0,0.05)",
};

const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";

const TRAYECTORIA_COLORS = [C.orange, C.gold, C.pink, C.purple, C.green];

const VALOR_ICONS = [
  { icon: ShieldCheck, color: C.green  },
  { icon: Users,       color: C.blue   },
  { icon: Palette,     color: C.pink   },
  { icon: Globe,       color: C.orange },
];

const STATS_COLORS = [C.orange, C.pink, C.gold, C.green];

interface SobreNosotrosData {
  id: number;
  mision: string;
  vision: string;
  historia: string;
  año_fundacion: number;
  logros: string;
  valores: string;
  descripcion_region: string;
}

interface TrayectoriaItem {
  id: number;
  año: string;
  titulo: string;
  descripcion: string;
}

export default function About() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<SobreNosotrosData | null>(null);
  const [trayectoria, setTrayectoria] = useState<TrayectoriaItem[]>([]);
  const [municipios, setMunicipios] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSobreNosotros(),
      getTrayectoria(),
      getMunicipiosHidalgo(),
    ])
      .then(([sobreNosotros, tray, totalMunicipios]) => {
        setInfo(sobreNosotros);
        setTrayectoria(tray);
        setMunicipios(totalMunicipios);
      })
      .catch((err) => console.log("ERROR:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!info) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.creamMut, fontFamily: FB }}>Sin datos disponibles</p>
    </div>
  );

  const logros  = info.logros.split(".").filter(Boolean);
  const valores = info.valores.split(".").filter(Boolean);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FB, overflowX: "hidden" }}>

      {/* HERO */}
      <section style={{ background: C.bgDeep, padding: "100px 60px 80px", maxWidth: 1320, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.orange, fontFamily: FB, margin: "0 0 24px" }}>
          NU★B Studio · Sobre nosotros
        </p>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 80px)", fontWeight: 900, fontFamily: FD, margin: "0 0 4px", lineHeight: 0.94, color: C.cream, letterSpacing: "-0.03em" }}>
          Arte que nace
        </h1>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 80px)", fontWeight: 900, fontFamily: FD, margin: "0 0 40px", lineHeight: 0.94, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${C.orange}, ${C.pink} 55%, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          de la tierra
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px", alignItems: "start" }} className="about-hero-grid">
          <p style={{ fontSize: 16, color: C.creamSub, lineHeight: 1.85, margin: 0 }}>{info.historia}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/catalogo")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
              Ver catálogo <ArrowRight size={14} strokeWidth={2.5} />
            </button>
            <button onClick={() => navigate("/artistas")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamSub, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
              Conocer artistas
            </button>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* TRAYECTORIA */}
      {trayectoria.length > 0 && (
        <section style={{ padding: "80px 60px", maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 80 }} className="about-hist-grid">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.orange, margin: "0 0 12px" }}>Nuestra trayectoria</p>
              <h2 style={{ fontSize: "clamp(22px, 2.5vw, 34px)", fontWeight: 900, color: C.cream, margin: "0 0 14px", fontFamily: FD, lineHeight: 1.15 }}>
                Años construyendo algo único
              </h2>
              <p style={{ fontSize: 14, color: C.creamMut, lineHeight: 1.8, margin: 0 }}>{info.historia}</p>
            </div>
            <div>
              {trayectoria.map((item, i) => {
                const isLast = i === trayectoria.length - 1;
                const color = TRAYECTORIA_COLORS[i % TRAYECTORIA_COLORS.length];
                return (
                  <div key={item.id} style={{ display: "flex", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 4 }} />
                      {!isLast && <div style={{ width: 1, flex: 1, minHeight: 36, background: C.borderBr, margin: "5px 0" }} />}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 28 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.06em", marginBottom: 3 }}>{item.año} · {item.titulo}</div>
                      <p style={{ fontSize: 14, color: C.creamSub, lineHeight: 1.75, margin: 0 }}>{item.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* MISIÓN + VISIÓN */}
      <section style={{ padding: "80px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.purple, margin: "0 0 12px" }}>Propósito y dirección</p>
        <h2 style={{ fontSize: "clamp(22px, 2.5vw, 38px)", fontWeight: 900, color: C.cream, margin: "0 0 48px", fontFamily: FD, letterSpacing: "-0.02em" }}>
          Lo que nos mueve y hacia <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dónde vamos</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${C.borderBr}`, borderRadius: 16, overflow: "hidden" }} className="about-mv-grid">
          <div style={{ padding: "40px", borderRight: `1px solid ${C.borderBr}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Heart size={15} color={C.orange} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.14em", textTransform: "uppercase" }}>Misión</span>
            </div>
            <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, margin: 0 }}>{info.mision}</p>
          </div>
          <div style={{ padding: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Globe size={15} color={C.purple} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase" }}>Visión</span>
            </div>
            <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, margin: 0 }}>{info.vision}</p>
          </div>
        </div>
      </section>

      {/* LOGROS */}
      <section style={{ background: C.bgDeep, borderTop: `1px solid ${C.borderBr}`, borderBottom: `1px solid ${C.borderBr}` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${logros.length}, 1fr)` }} className="about-stats-grid">
          {logros.map((logro, i) => (
            <div key={logro.trim()} style={{ padding: "48px 32px", borderRight: i < logros.length - 1 ? `1px solid ${C.borderBr}` : "none", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: STATS_COLORS[i % STATS_COLORS.length], fontFamily: FB }}>{logro.trim()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VALORES */}
      <section style={{ padding: "80px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.pink, margin: "0 0 12px" }}>Nuestros pilares</p>
        <h2 style={{ fontSize: "clamp(22px, 2.5vw, 38px)", fontWeight: 900, color: C.cream, margin: "0 0 48px", fontFamily: FD }}>
          Lo que nos <span style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>define</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }} className="about-val-grid">
          {valores.map((valor, i) => {
            const { icon: Icon, color } = VALOR_ICONS[i % VALOR_ICONS.length];
            return (
              <div key={valor.trim()}>
                <Icon size={20} color={color} strokeWidth={1.8} style={{ marginBottom: 14 }} />
                <div style={{ height: 1, width: 20, background: color, marginBottom: 14, borderRadius: 1 }} />
                <div style={{ fontSize: 14, color: C.creamSub, lineHeight: 1.8 }}>{valor.trim()}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* LA HUASTECA */}
      <section style={{ padding: "80px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="about-huest-grid">
          <div style={{ borderRadius: 14, overflow: "hidden", height: 400, position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=900&q=80" alt="Huasteca" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,5,16,0.5) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={12} color={C.gold} strokeWidth={2} />
              <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 600 }}>Huasteca Hidalguense · Hidalgo, México</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, margin: "0 0 12px" }}>La región</p>
            <h2 style={{ fontSize: "clamp(22px, 2.5vw, 36px)", fontWeight: 900, color: C.cream, margin: "0 0 20px", fontFamily: FD, lineHeight: 1.2 }}>
              Donde el arte y la tierra <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>se unen</span>
            </h2>
            <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, margin: "0 0 36px" }}>
              {info.descripcion_region}
            </p>
            <div style={{ display: "flex", gap: 36 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, fontFamily: FD, color: C.gold, lineHeight: 1, marginBottom: 3 }}>{municipios}</div>
                <div style={{ fontSize: 12, color: C.creamMut, fontWeight: 600 }}>Municipios</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${C.borderBr}`, padding: "80px 60px", background: C.bgDeep }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.pink, margin: "0 0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Heart size={11} fill={C.pink} color={C.pink} /> Únete a la comunidad
          </p>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 48px)", fontWeight: 900, color: C.cream, margin: "0 0 16px", fontFamily: FD, lineHeight: 1.1 }}>
            Sé parte de <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>esta historia</span>
          </h2>
          <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, margin: "0 0 36px" }}>
            Ya seas coleccionista, amante del arte o artista Huasteco, hay un lugar para ti en NU★B Studio.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/catalogo")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
              Explorar catálogo <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button onClick={() => navigate("/registro-artista")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamSub, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
              Registrarme como artista
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 1000px) {
          .about-hero-grid  { grid-template-columns: 1fr !important; gap: 28px !important; }
          .about-hist-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .about-mv-grid    { grid-template-columns: 1fr !important; }
          .about-mv-grid > *:first-child { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.05) !important; }
          .about-val-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .about-huest-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
        @media (max-width: 640px) {
          .about-val-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}