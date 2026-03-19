// src/pages/public/About.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Users, Palette, Globe, MapPin, Heart,
} from "lucide-react";

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
  creamMut: "rgba(255,232,200,0.35)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.18)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const TIMELINE = [
  { year: "2020", color: C.orange, titulo: "El comienzo",      desc: "Nace la idea de crear un espacio digital dedicado al arte de la Huasteca, conectando artistas locales con el mundo." },
  { year: "2021", color: C.gold,   titulo: "Primera galería",  desc: "Lanzamos nuestra primera exhibición virtual con 12 artistas seleccionados y más de 60 obras certificadas." },
  { year: "2022", color: C.pink,   titulo: "Comunidad activa", desc: "Superamos las 100 obras publicadas y consolidamos una comunidad de 25 artistas activos de toda la región." },
  { year: "2023", color: C.purple, titulo: "Reconocimiento",   desc: "Reconocidos como proyecto cultural destacado dentro del sector educativo de la región Huasteca." },
  { year: "2025", color: C.green,  titulo: "Hoy",              desc: "Más de 500 obras, 50 artistas y una plataforma en constante crecimiento junto a su comunidad." },
];

const VALORES = [
  { icon: ShieldCheck, color: C.green,  titulo: "Autenticidad", desc: "Cada obra en NU★B Studio cuenta con certificado verificado y respaldo directo del artista que la creó." },
  { icon: Users,       color: C.blue,   titulo: "Comunidad",    desc: "Creemos en el arte comunitario. Cada compra apoya directamente al artista y fortalece la economía local." },
  { icon: Palette,     color: C.pink,   titulo: "Cultura",      desc: "Somos guardianes de las tradiciones Huastecas, preservando técnicas ancestrales en el espacio digital." },
  { icon: Globe,       color: C.orange, titulo: "Alcance",      desc: "Llevamos el arte Huasteco al mundo, conectando la riqueza cultural de la sierra con coleccionistas globales." },
];

const STATS = [
  { num: "500+", label: "Obras en catálogo", color: C.orange },
  { num: "50+",  label: "Artistas activos",  color: C.pink   },
  { num: "5",    label: "Años de historia",  color: C.gold   },
  { num: "98%",  label: "Satisfacción",      color: C.green  },
];

export default function About() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);

  const histSection  = useInView();
  const mvSection    = useInView();
  const valSection   = useInView();
  const statsSection = useInView();
  const huestSection = useInView();
  const ctaSection   = useInView();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FB, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════
          HERO — limpio, solo tipografía
      ══════════════════════════════════════════════════ */}
      <section style={{ background: C.bgDeep, padding: "120px 60px 100px", maxWidth: 1320, margin: "0 auto" }}>

        <p style={{
          fontSize: 11.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
          color: C.orange, fontFamily: FB, margin: "0 0 28px",
          opacity: heroVisible ? 1 : 0, transition: "opacity .6s ease .1s",
        }}>
          NU★B Studio · Sobre nosotros
        </p>

        <h1 style={{
          fontSize: "clamp(44px, 6.5vw, 86px)", fontWeight: 900, fontFamily: FD,
          margin: "0 0 6px", lineHeight: 0.94, color: C.cream, letterSpacing: "-0.03em",
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)",
          transition: "opacity .8s ease .2s, transform .8s ease .2s",
        }}>
          Arte que nace
        </h1>
        <h1 style={{
          fontSize: "clamp(44px, 6.5vw, 86px)", fontWeight: 900, fontFamily: FD,
          margin: "0 0 40px", lineHeight: 0.94, letterSpacing: "-0.03em",
          background: `linear-gradient(135deg, ${C.orange}, ${C.pink} 55%, ${C.purple})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)",
          transition: "opacity .8s ease .32s, transform .8s ease .32s",
        }}>
          de la tierra
        </h1>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px 80px", alignItems: "start",
          opacity: heroVisible ? 1 : 0, transition: "opacity .8s ease .48s",
        }} className="about-hero-grid">
          <p style={{ fontSize: 16, color: C.creamSub, lineHeight: 1.85, fontFamily: FB, margin: 0 }}>
            Somos una galería digital dedicada a preservar, celebrar y conectar el arte de la Huasteca Hidalguense con el mundo. Cada obra es un puente entre la tradición y el futuro.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/catalogo")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "opacity .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              Ver catálogo <ArrowRight size={14} strokeWidth={2.5} />
            </button>
            <button onClick={() => navigate("/artistas")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamMut, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "border-color .15s, color .15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.orange + "55"; el.style.color = C.cream; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderBr; el.style.color = C.creamMut; }}
            >
              Conocer artistas
            </button>
          </div>
        </div>
      </section>

      {/* Separador */}
      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* ══════════════════════════════════════════════════
          HISTORIA — Timeline desnudo
      ══════════════════════════════════════════════════ */}
      <section ref={histSection.ref} style={{ padding: "100px 60px", maxWidth: 1320, margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 80, opacity: histSection.inView ? 1 : 0, transform: histSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" }} className="about-hist-grid">
          {/* Label lateral */}
          <div style={{ paddingTop: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.orange, fontFamily: FB, margin: "0 0 14px" }}>
              Nuestra historia
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 900, color: C.cream, margin: "0 0 16px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Cinco años construyendo algo único
            </h2>
            <p style={{ fontSize: 14, color: C.creamMut, lineHeight: 1.8, fontFamily: FB, margin: 0 }}>
              De una idea gestada entre amigos apasionados por el arte regional, a una plataforma que conecta artistas Huastecos con el mundo.
            </p>
          </div>

          {/* Timeline */}
          <div>
            {TIMELINE.map((item, i) => {
              const isLast = i === TIMELINE.length - 1;
              return (
                <div key={item.year} style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
                  {/* Dot + línea */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: 6 }} />
                    {!isLast && (
                      <div style={{ width: 1, flex: 1, minHeight: 40, background: C.borderBr, margin: "6px 0" }} />
                    )}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 32 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.color, fontFamily: FB, letterSpacing: "0.06em", marginBottom: 4 }}>
                      {item.year} · {item.titulo}
                    </div>
                    <p style={{ fontSize: 14, color: C.creamSub, lineHeight: 1.75, fontFamily: FB, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Separador */}
      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* ══════════════════════════════════════════════════
          MISIÓN + VISIÓN
      ══════════════════════════════════════════════════ */}
      <section ref={mvSection.ref} style={{ padding: "100px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ opacity: mvSection.inView ? 1 : 0, transform: mvSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" }}>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.purple, fontFamily: FB, margin: "0 0 14px" }}>
            Propósito y dirección
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 42px)", fontWeight: 900, color: C.cream, margin: "0 0 56px", fontFamily: FD, letterSpacing: "-0.02em" }}>
            Lo que nos mueve y hacia{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dónde vamos</span>
          </h2>

          <div className="about-mv-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, border: `1px solid ${C.borderBr}`, borderRadius: 20, overflow: "hidden" }}>
            {/* Misión */}
            <div style={{ padding: "48px 44px", borderRight: `1px solid ${C.borderBr}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Heart size={16} color={C.orange} strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FB }}>Misión</span>
              </div>
              <h3 style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 16px", lineHeight: 1.25 }}>
                Conectar el arte con quienes lo merecen
              </h3>
              <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, fontFamily: FB, margin: 0 }}>
                Democratizar el acceso al arte Huasteco, conectando artistas locales con amantes del arte en todo el mundo. Preservar y difundir la riqueza cultural de la Huasteca Hidalguense a través de una plataforma accesible, auténtica y justa.
              </p>
            </div>

            {/* Visión */}
            <div style={{ padding: "48px 44px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Globe size={16} color={C.purple} strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FB }}>Visión</span>
              </div>
              <h3 style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 16px", lineHeight: 1.25 }}>
                El arte latinoamericano en el escenario global
              </h3>
              <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, fontFamily: FB, margin: 0 }}>
                Ser la plataforma de referencia para el arte latinoamericano auténtico, donde cada transacción sea un acto de preservación cultural y apoyo directo al artista, creando un ecosistema sostenible para la cultura regional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS — números grandes, fondo oscuro
      ══════════════════════════════════════════════════ */}
      <section ref={statsSection.ref} style={{ background: C.bgDeep, borderTop: `1px solid ${C.borderBr}`, borderBottom: `1px solid ${C.borderBr}` }}>
        <div className="about-stats-grid" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", opacity: statsSection.inView ? 1 : 0, transition: "opacity .7s ease" }}>
          {STATS.map(({ num, label, color }, i) => (
            <div key={label} style={{ padding: "60px 40px", borderRight: i < 3 ? `1px solid ${C.borderBr}` : "none", textAlign: "center" }}>
              <div style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, fontFamily: FD, color, lineHeight: 1, marginBottom: 10 }}>
                {num}
              </div>
              <div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VALORES — cuatro pilares sin ruido
      ══════════════════════════════════════════════════ */}
      <section ref={valSection.ref} style={{ padding: "100px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ opacity: valSection.inView ? 1 : 0, transform: valSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" }}>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.pink, fontFamily: FB, margin: "0 0 14px" }}>
            Nuestros pilares
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 42px)", fontWeight: 900, color: C.cream, margin: "0 0 56px", fontFamily: FD, letterSpacing: "-0.02em" }}>
            Lo que nos{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>define</span>
          </h2>

          <div className="about-val-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            {VALORES.map(({ icon: Icon, color, titulo, desc }) => (
              <div key={titulo}>
                <div style={{ width: 36, height: 36, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ height: 1, width: 24, background: color, marginBottom: 18, borderRadius: 1 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, marginBottom: 10, fontFamily: FB }}>{titulo}</div>
                <div style={{ fontSize: 14, color: C.creamSub, lineHeight: 1.8, fontFamily: FB }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separador */}
      <div style={{ height: 1, background: C.borderBr, maxWidth: 1320, margin: "0 auto" }} />

      {/* ══════════════════════════════════════════════════
          LA HUASTECA
      ══════════════════════════════════════════════════ */}
      <section ref={huestSection.ref} style={{ padding: "100px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <div className="about-huest-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", opacity: huestSection.inView ? 1 : 0, transform: huestSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" }}>

          {/* Imagen */}
          <div style={{ borderRadius: 16, overflow: "hidden", height: 440, position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=900&q=80"
              alt="Huasteca Hidalguense"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,5,16,0.55) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: 20, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={13} color={C.gold} strokeWidth={2} />
              <span style={{ fontSize: 12, color: C.cream, fontFamily: FB, fontWeight: 600 }}>Huasteca Hidalguense · Hidalgo, México</span>
            </div>
          </div>

          {/* Texto */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontFamily: FB, margin: "0 0 14px" }}>
              La región
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 900, color: C.cream, margin: "0 0 24px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Donde el arte y la tierra{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>se unen</span>
            </h2>
            <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, fontFamily: FB, margin: "0 0 16px" }}>
              La Huasteca Hidalguense es una región de biodiversidad cultural única. Sus pueblos originarios han cultivado por siglos una tradición artística que combina lo sagrado, lo cotidiano y lo bello.
            </p>
            <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, fontFamily: FB, margin: "0 0 40px" }}>
              Desde las cascadas de Tamazunchale hasta las montañas de Molango, la sierra inspira a artistas que transforman la naturaleza y la cultura en obras de valor universal.
            </p>

            <div style={{ display: "flex", gap: 40 }}>
              {[
                { label: "Municipios",  num: "18+", color: C.gold   },
                { label: "Tradiciones", num: "12",  color: C.orange },
                { label: "Lenguas",     num: "3",   color: C.pink   },
              ].map(({ label, num, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: FD, color, lineHeight: 1, marginBottom: 4 }}>{num}</div>
                  <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL — limpio
      ══════════════════════════════════════════════════ */}
      <section ref={ctaSection.ref} style={{ borderTop: `1px solid ${C.borderBr}`, padding: "100px 60px", background: C.bgDeep }}>
        <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center", opacity: ctaSection.inView ? 1 : 0, transform: ctaSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" }}>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.pink, fontFamily: FB, margin: "0 0 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Heart size={11} fill={C.pink} color={C.pink} /> Únete a la comunidad
          </p>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, color: C.cream, margin: "0 0 18px", fontFamily: FD, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Sé parte de{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>esta historia</span>
          </h2>

          <p style={{ fontSize: 15, color: C.creamSub, lineHeight: 1.85, margin: "0 0 40px", fontFamily: FB }}>
            Ya seas coleccionista, amante del arte o artista Huasteco, hay un lugar para ti en NU★B Studio.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/catalogo")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "opacity .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              Explorar catálogo <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button onClick={() => navigate("/registro-artista")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamMut, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "border-color .15s, color .15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.orange + "55"; el.style.color = C.cream; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderBr; el.style.color = C.creamMut; }}
            >
              Registrarme como artista
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        @media (max-width: 1000px) {
          .about-hero-grid  { grid-template-columns: 1fr !important; gap: 28px !important; }
          .about-hist-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .about-mv-grid    { grid-template-columns: 1fr !important; }
          .about-mv-grid > *:first-child { border-right: none !important; border-bottom: 1px solid rgba(118,78,49,0.18); }
          .about-val-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .about-stats-grid > *:nth-child(2) { border-right: none !important; }
          .about-stats-grid > *:nth-child(3) { border-top: 1px solid rgba(118,78,49,0.18); }
          .about-huest-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
        @media (max-width: 640px) {
          .about-val-grid   { grid-template-columns: 1fr !important; }
          .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
