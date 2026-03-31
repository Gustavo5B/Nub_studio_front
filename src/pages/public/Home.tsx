// src/pages/public/Home.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../../components/LoginModal";
import {
  ArrowRight, Star, Sparkles, Palette, Camera,
  Frame, Gem, ShieldCheck, Users, Award, ChevronDown,
} from "lucide-react";

import heroMain from "../../assets/images/trabajo.jpg"
import obraImg2 from "../../assets/images/cuadro.png";

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
  bgDeep:   "#FFECD4",
  panel:    "#FFffff",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
  borderHi: "rgba(0,0,0,0.10)",
};

const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

const STATS = [
  { num: "500+", label: "Obras"        },
  { num: "50+",  label: "Artistas"     },
  { num: "98%",  label: "Satisfacción" },
  { num: "5",    label: "Años"         },
];

const VALORES = [
  { num: "01", icon: ShieldCheck, color: C.green,  title: "100% Auténtico", desc: "Certificado oficial en cada obra"  },
  { num: "02", icon: Award,       color: C.gold,   title: "Artistas Elite", desc: "Selección curada por expertos"    },
  { num: "03", icon: Users,       color: C.blue,   title: "Comunidad Viva", desc: "Artistas locales de la Huasteca"  },
  { num: "04", icon: Star,        color: C.orange, title: "5.0 Valoración", desc: "1,247 reseñas verificadas"        },
];

const CATS = [
  { slug: "artesania",  label: "Artesanía",  count: "200+", color: C.gold,   icon: Gem,     img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=900&q=80" },
  { slug: "pintura",    label: "Pintura",    count: "120+", color: C.orange, icon: Palette, img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=80" },
  { slug: "fotografia", label: "Fotografía", count: "85+",  color: C.pink,   icon: Camera,  img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80" },
  { slug: "escultura",  label: "Escultura",  count: "60+",  color: C.purple, icon: Frame,   img: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=900&q=80" },
];

const MARQUEE_ITEMS = ["ARTESANÍA", "PINTURA", "FOTOGRAFÍA", "ESCULTURA", "ARTE HUASTECO", "NU-B STUDIO"];

interface Obra {
  id_obra:          number;
  titulo:           string;
  slug:             string;
  imagen_principal: string;
  precio_base:      number;
  precio_minimo:    number;
  categoria_nombre: string;
  artista_nombre:   string;
  artista_alias:    string;
  estado:           string;
}

// ── CatCard ─────────────────────────────────────────────────────────────
function CatCard({
  label, count, color, icon: Icon, img, gridStyle = {}, onClick,
}: {
  readonly label: string; readonly count: string; readonly color: string;
  readonly icon: React.ElementType; readonly img: string;
  readonly gridStyle?: React.CSSProperties; readonly onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === "Enter") onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: 24, overflow: "hidden",
        cursor: "pointer", height: "100%",
        border: `1px solid ${hov ? color + "55" : C.borderBr}`,
        boxShadow: hov ? `0 32px 80px ${color}28, 0 0 0 1px ${color}18` : `0 4px 24px rgba(0,0,0,0.10)`,
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        transition: "border-color 0.3s, box-shadow 0.3s, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        ...gridStyle,
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${img})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: hov ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.65s cubic-bezier(0.16,1,0.3,1)",
        filter: "saturate(0.65) brightness(0.82)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(170deg, rgba(7,5,16,0.18) 0%, rgba(7,5,16,0.52) 55%, rgba(7,5,16,0.95) 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(140deg, ${color}18 0%, transparent 60%)`, opacity: hov ? 1 : 0.4, transition: "opacity 0.3s" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}25, transparent)` }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 24px 28px" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 15,
          background: `${color}22`, border: `1px solid ${color}55`,
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 6px 20px ${color}28`,
          transform: hov ? "scale(1.08) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <Icon size={20} color={color} strokeWidth={1.8} />
        </div>

        <div>
          <div style={{ fontSize: 10.5, color: `${color}CC`, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8, fontFamily: FB }}>{count} obras</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#F4F0FF", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1 }}>{label}</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700, color, flexShrink: 0,
              opacity: hov ? 1 : 0, transform: hov ? "translateX(0)" : "translateX(-10px)",
              transition: "opacity 0.22s, transform 0.28s",
            }}>
              Ver <ArrowRight size={12} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function heroAnim(visible: boolean, delay: string) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.85s ease ${delay}, transform 0.85s ease ${delay}`,
  };
}

function sectionFade(inView: boolean, delay = "0s") {
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  };
}

function MarqueeStrip() {
  return (
    <div style={{
      background: C.bgDeep, overflow: "hidden",
      borderTop: `1px solid ${C.borderBr}`, borderBottom: `1px solid ${C.borderBr}`,
      padding: "14px 0",
    }}>
      <div style={{ display: "flex", animation: "marqueeScroll 30s linear infinite", width: "max-content" }}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={`mq-${i}`} style={{
            display: "inline-flex", alignItems: "center", gap: 20,
            padding: "0 28px",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.16em",
            textTransform: "uppercase", fontFamily: FB,
            color: i % 3 === 1 ? `${C.orange}85` : C.creamMut,
          }}>
            {item}
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.orange, display: "inline-block", opacity: 0.55, flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── ObraCardHorizontal ────────────────────────────────────────────────
function ObraCardHorizontal({
  title, price, image, artistName, onClick,
}: {
  readonly id: string; readonly title: string; readonly price: number;
  readonly image: string; readonly artistName: string; readonly onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === "Enter") onClick(); }}
      style={{
        cursor: "pointer", minWidth: "280px", flexShrink: 0,
        borderRadius: 12, overflow: "hidden",
        background: "#FFECD4", border: `1px solid ${C.border}`,
        boxShadow: hov ? "0 12px 36px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ position: "relative", width: "100%", height: 240, overflow: "hidden", background: "#F5F5F5" }}>
        <img
          src={image}
          alt={title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <div style={{ padding: "16px 16px" }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: C.cream, margin: "0 0 6px",
          fontFamily: FD, letterSpacing: "-0.01em", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </h3>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.orange, marginBottom: 8, fontFamily: FB }}>
          ${price.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: C.creamSub, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {artistName}
        </div>
      </div>
    </div>
  );
}

// ── Carrusel Horizontal ───────────────────────────────────────────────
function HorizontalCarousel({
  obras, onView, loading,
}: {
  readonly obras: Obra[];
  readonly onView: (id: string) => void;
  readonly loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
        {[...new Array(4)].map((_, i) => (
          <div key={`sk-${i}`} style={{ minWidth: "280px", height: 340, borderRadius: 12, background: "#F0F0F0", animation: "shimmer 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: C.creamSub, fontSize: 15, fontFamily: FB }}>
        Pronto habrá obras disponibles aquí.
      </div>
    );
  }

  return (
    <div ref={scrollRef} style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollBehavior: "smooth" }} className="horizontal-carousel">
      {obras.map(obra => (
        <ObraCardHorizontal
          key={obra.id_obra}
          id={String(obra.id_obra)}
          title={obra.titulo}
          price={Number(obra.precio_minimo || obra.precio_base) || 0}
          image={obra.imagen_principal || ""}
          artistName={obra.artista_alias || obra.artista_nombre}
          onClick={() => onView(String(obra.id_obra))}
        />
      ))}
    </div>
  );
}

function ObrasRecientesSection({ obras, obrasLoad, navigate, onView }: {
  readonly obras: Obra[];
  readonly obrasLoad: boolean;
  readonly navigate: ReturnType<typeof useNavigate>;
  readonly onView: (id: string) => void;
}) {
  const { ref, inView } = useInView(0.08);
  return (
    <section ref={ref} style={{
      padding: "80px 60px 100px", maxWidth: 1400, margin: "0 auto",
      background: "#FAFAFA",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: "opacity 0.8s ease, transform 0.8s ease",
    }}>
      <div style={{ height: 1, background: C.border, marginBottom: 64 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48 }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", borderRadius: 100,
            background: "rgba(232, 100, 12, 0.1)", border: `1px solid rgba(232, 100, 12, 0.3)`,
            fontSize: 11, fontWeight: 800, color: C.orange,
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, fontFamily: FB,
          }}>
            <Star size={11} fill={C.orange} color={C.orange} /> Recién llegadas
          </div>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 900, color: C.cream, margin: 0, fontFamily: FD, letterSpacing: "-0.025em" }}>
            Obras <span style={{ color: C.orange }}>recientes</span>
          </h2>
          <p style={{ fontSize: 14.5, color: C.creamSub, margin: "10px 0 0", fontFamily: FB }}>Las últimas incorporaciones a nuestra galería</p>
        </div>
        <button className="btn-ghost-sm-light" onClick={() => navigate("/catalogo")}>
          Ver colección <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      <HorizontalCarousel obras={obras} onView={onView} loading={obrasLoad} />
      <div style={{ textAlign: "center", marginTop: 52 }}>
        <button className="btn-primary-light" onClick={() => navigate("/catalogo")}>
          Ver colección completa <ArrowRight size={17} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

// ── Home ──────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [loginOpen,   setLoginOpen]   = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [obras,       setObras]       = useState<Obra[]>([]);
  const [obrasLoad,   setObrasLoad]   = useState(true);

  const catSection = useInView();
  const valSection = useInView();
  const ctaSection = useInView();

  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 120); return () => clearTimeout(t); }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/obras?limit=4&ordenar=recientes`)
      .then(r => r.json())
      .then(j => setObras(j.data || []))
      .catch(() => {})
      .finally(() => setObrasLoad(false));
  }, []);

  const handleVerObra = (id: string) => {
    const obra = obras.find(o => String(o.id_obra) === id);
    if (obra?.slug) navigate(`/obras/${obra.slug}`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: FB, overflowX: "hidden",
      transform: loginOpen ? "scale(0.97)" : "scale(1)",
      filter: loginOpen ? "brightness(0.45)" : "brightness(1)",
      transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease",
    }}>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ══════════════════════════════════════════════════
          HERO — EDITORIAL IZQUIERDA + FLOTANTES
      ══════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        {/* Imagen de fondo */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${heroMain})`,
          backgroundSize: "cover", backgroundPosition: "center 38%",
          transform: heroVisible ? "scale(1.0)" : "scale(1.06)",
          transition: "transform 8s cubic-bezier(0.0, 0.0, 0.2, 1)",
        }} />

        {/* Overlay: más opaco a la izquierda para legibilidad del texto */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(7,5,16,0.92) 0%, rgba(7,5,16,0.78) 38%, rgba(7,5,16,0.30) 65%, rgba(7,5,16,0.10) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 80% at 0% 100%, ${C.orange}22, transparent 60%)` }} />

        {/* ── Elementos decorativos flotantes (derecha) ── */}

        {/* Stat card 1 — Obras */}
        <div style={{
          position: "absolute", right: "clamp(180px,18vw,280px)", top: "22%",
          transform: heroVisible ? "rotate(-6deg) translateY(0)" : "rotate(-6deg) translateY(30px)",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.8s ease 0.9s, transform 0.8s ease 0.9s",
          animation: heroVisible ? "floatA 5s ease-in-out infinite 1s" : "none",
        }}>
          <div style={{
            padding: "14px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
            border: `2px solid ${C.orange}40`,
            textAlign: "center", minWidth: 90,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.orange, fontFamily: FD, lineHeight: 1 }}>500+</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.creamSub, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4, fontFamily: FB }}>Obras</div>
          </div>
        </div>

        {/* Stat card 2 — Artistas */}
        <div style={{
          position: "absolute", right: "clamp(60px,6vw,100px)", top: "18%",
          transform: heroVisible ? "rotate(5deg) translateY(0)" : "rotate(5deg) translateY(30px)",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.8s ease 1.05s, transform 0.8s ease 1.05s",
          animation: heroVisible ? "floatB 6s ease-in-out infinite 1.2s" : "none",
        }}>
          <div style={{
            padding: "14px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
            border: `2px solid ${C.purple}40`,
            textAlign: "center", minWidth: 90,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.purple, fontFamily: FD, lineHeight: 1 }}>50+</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.creamSub, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4, fontFamily: FB }}>Artistas</div>
          </div>
        </div>

        {/* Rating badge flotante */}
        <div style={{
          position: "absolute", right: "clamp(100px,10vw,160px)", top: "54%",
          transform: heroVisible ? "rotate(-3deg) translateY(0)" : "rotate(-3deg) translateY(30px)",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.8s ease 1.2s, transform 0.8s ease 1.2s",
          animation: heroVisible ? "floatA 7s ease-in-out infinite 0.5s" : "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 50,
            background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)",
            border: `1px solid ${C.gold}40`,
            whiteSpace: "nowrap",
          }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[...new Array(5)].map((_, i) => <Star key={i} size={12} fill={C.gold} color={C.gold} />)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.cream, fontFamily: FB }}>5.0</span>
            <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>1,247 reseñas</span>
          </div>
        </div>

        {/* Badge "98% satisfacción" */}
        <div style={{
          position: "absolute", right: "clamp(55px,5vw,90px)", top: "66%",
          transform: heroVisible ? "rotate(4deg) translateY(0)" : "rotate(4deg) translateY(30px)",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.8s ease 1.35s, transform 0.8s ease 1.35s",
          animation: heroVisible ? "floatB 5.5s ease-in-out infinite 0.8s" : "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 12,
            background: `${C.green}E8`, backdropFilter: "blur(12px)",
            border: `1px solid ${C.green}60`,
          }}>
            <ShieldCheck size={14} color="white" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "white", fontFamily: FB }}>Certificado oficial</span>
          </div>
        </div>

        {/* Círculo decorativo grande — fondo derecho */}
        <div style={{
          position: "absolute", right: "-60px", top: "50%",
          transform: "translateY(-50%)",
          width: "clamp(300px,35vw,500px)", height: "clamp(300px,35vw,500px)",
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.06)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: "20px", top: "50%",
          transform: "translateY(-50%)",
          width: "clamp(200px,25vw,360px)", height: "clamp(200px,25vw,360px)",
          borderRadius: "50%",
          border: `1px solid ${C.orange}20`,
          pointerEvents: "none",
        }} />

        {/* ── Contenido principal — IZQUIERDA ── */}
        <div className="hero-bottom" style={{
          position: "relative",
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 clamp(24px, 5vw, 72px)",
          width: "100%",
          zIndex: 2,
          paddingTop: "clamp(80px, 10vh, 120px)",
          paddingBottom: "clamp(80px, 10vh, 120px)",
        }}>
          <div style={{ maxWidth: "clamp(320px, 52%, 620px)" }}>

            {/* Badge certificada */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px 6px 8px", borderRadius: 100,
              background: "rgba(255,255,255,0.10)", backdropFilter: "blur(10px)",
              border: `1px solid rgba(255,255,255,0.22)`,
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.88)",
              fontFamily: FB, letterSpacing: "0.06em",
              marginBottom: 28,
              opacity: heroVisible ? 1 : 0, transition: "opacity 0.7s ease 0.2s",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 7,
                background: C.orange,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Sparkles size={11} color="white" />
              </div>
              Galería Certificada · Huasteca Hidalguense
            </div>

            {/* H1 — izquierda, grande, respirado */}
            <div style={{ marginBottom: "clamp(20px, 3vh, 32px)" }}>
              <h1 style={{
                fontSize: "clamp(40px, 6.5vw, 86px)",
                fontWeight: 900, color: "#FFECD4",
                lineHeight: 1.0, margin: "0 0 4px",
                fontFamily: FD, letterSpacing: "-0.035em",
                ...heroAnim(heroVisible, "0.28s"),
              }}>
                El Arte
              </h1>
              <h1 style={{
                fontSize: "clamp(40px, 6.5vw, 86px)",
                fontWeight: 900, lineHeight: 1.0,
                margin: "0 0 4px", fontFamily: FD, letterSpacing: "-0.035em",
                background: `linear-gradient(135deg, ${C.orange} 0%, ${C.pink} 55%, ${C.purple} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                ...heroAnim(heroVisible, "0.42s"),
              }}>
                Huasteco
              </h1>
              <h1 style={{
                fontSize: "clamp(40px, 6.5vw, 86px)",
                fontWeight: 900, color: "#FFECD4",
                lineHeight: 1.0, margin: 0,
                fontFamily: FD, letterSpacing: "-0.035em",
                position: "relative", display: "inline-block",
                ...heroAnim(heroVisible, "0.56s"),
              }}>
                que{" "}
                <span style={{ position: "relative", display: "inline-block" }}>
                  transforma
                  <svg style={{ position: "absolute", bottom: "-8px", left: 0, width: "100%", overflow: "visible" }} height="10" viewBox="0 0 220 10" preserveAspectRatio="none">
                    <path d="M2,8 Q55,2 110,6 Q165,10 218,4" stroke={C.orange} strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </div>

            {/* Descripción */}
            <p style={{
              fontSize: "clamp(14px, 1.8vw, 17px)",
              color: "rgba(200,196,224,0.85)",
              lineHeight: 1.78,
              margin: "0 0 clamp(28px, 4vh, 40px)",
              maxWidth: 480,
              fontFamily: FB,
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 0.8s ease 0.7s",
            }}>
              Conecta con la tradición vibrante y el talento extraordinario de artistas locales. Cada obra, un certificado de autenticidad garantizado.
            </p>

            {/* Botones */}
            <div style={{
              display: "flex", gap: 14, flexWrap: "wrap",
              opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.84s",
            }}>
              <button onClick={() => navigate("/catalogo")} className="btn-primary">
                Explorar galería <ArrowRight size={17} strokeWidth={2.5} />
              </button>
              <button onClick={() => setLoginOpen(true)} className="btn-ghost-hero">
                Iniciar sesión
              </button>
            </div>

            {/* Línea de stats horizontal — compacta, bajo los botones */}
            <div style={{
              display: "flex", gap: 28, marginTop: "clamp(28px, 4vh, 44px)",
              opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 1.0s",
            }}>
              {STATS.map(({ num, label }) => (
                <div key={label}>
                  <div style={{
                    fontSize: "clamp(18px, 2.8vw, 28px)", fontWeight: 900,
                    color: C.orange, fontFamily: FD, lineHeight: 1, marginBottom: 3,
                  }}>{num}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "rgba(200,196,224,0.55)",
                    letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB,
                  }}>{label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
          opacity: heroVisible ? 0.4 : 0, transition: "opacity 1.2s ease 1.8s",
          pointerEvents: "none", zIndex: 3,
        }}>
          <span style={{ fontSize: 9, color: "rgba(200,196,224,0.6)", letterSpacing: "0.22em", fontFamily: FB, fontWeight: 700, textTransform: "uppercase" }}>Explorar</span>
          <ChevronDown size={16} color="rgba(200,196,224,0.6)" strokeWidth={1.5} style={{ animation: "scrollBounce 2.2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════════════ */}
      <MarqueeStrip />

      {/* ══════════════════════════════════════════════════
          CATEGORÍAS — Bento asimétrico
      ══════════════════════════════════════════════════ */}
      <section ref={catSection.ref} style={{ padding: "100px 60px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52,
          ...sectionFade(catSection.inView),
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 100,
              background: `${C.purple}15`, border: `1px solid ${C.purple}32`,
              fontSize: 11, fontWeight: 800, color: C.purple,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, fontFamily: FB,
            }}>
              <Sparkles size={11} /> Explora por disciplina
            </div>
            <h2 style={{ fontSize: "clamp(30px, 3.5vw, 50px)", fontWeight: 900, color: C.cream, margin: 0, fontFamily: FD, letterSpacing: "-0.025em" }}>
              Cada obra cuenta{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                una historia
              </span>
            </h2>
          </div>
          <button className="btn-ghost-sm" onClick={() => navigate("/catalogo")}>
            Ver todo el catálogo <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr 1fr",
          gridTemplateRows: "310px 250px",
          gap: 14,
          opacity: catSection.inView ? 1 : 0,
          transition: "opacity 0.7s ease 0.12s",
        }} className="bento-grid">
          <CatCard {...CATS[0]} gridStyle={{ gridRow: "1 / 3" }} onClick={() => navigate(`/catalogo?categoria=${CATS[0].slug}`)} />
          <CatCard {...CATS[1]} onClick={() => navigate(`/catalogo?categoria=${CATS[1].slug}`)} />
          <CatCard {...CATS[2]} onClick={() => navigate(`/catalogo?categoria=${CATS[2].slug}`)} />
          <CatCard {...CATS[3]} gridStyle={{ gridColumn: "2 / 4" }} onClick={() => navigate(`/catalogo?categoria=${CATS[3].slug}`)} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VALORES
      ══════════════════════════════════════════════════ */}
      <section ref={valSection.ref} style={{ padding: "0 0 100px" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, marginBottom: 80 }} />

        <div style={{
          maxWidth: 1320, margin: "0 auto", padding: "0 60px",
          textAlign: "center", marginBottom: 52,
          opacity: valSection.inView ? 1 : 0,
          transform: valSection.inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 900, color: C.cream, margin: "0 0 12px", fontFamily: FD, letterSpacing: "-0.02em" }}>
            Por qué elegir{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Nu-B Studio
            </span>
          </h2>
          <p style={{ fontSize: 15, color: C.creamSub, margin: 0, fontFamily: FB }}>
            Arte con respaldo, comunidad y autenticidad garantizada
          </p>
        </div>

        <div style={{
          maxWidth: 1320, margin: "0 auto", padding: "0 60px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          borderRadius: 24, overflow: "hidden",
          border: `1px solid ${C.borderBr}`,
          opacity: valSection.inView ? 1 : 0,
          transform: valSection.inView ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
        }} className="valores-strip">
          {VALORES.map(({ num, icon: Icon, color, title, desc }, i) => (
            <div key={title} className="valor-cell" style={{
              padding: "50px 28px 46px",
              borderRight: i < 3 ? `1px solid ${C.border}` : "none",
              background: `linear-gradient(145deg, ${C.panel}, #F9F8FC)`,
              position: "relative", textAlign: "center",
            }}>
              <div style={{
                position: "absolute", top: 12, right: 18,
                fontSize: 56, fontWeight: 900, fontFamily: FD,
                color: `${color}12`, lineHeight: 1, userSelect: "none",
                letterSpacing: "-0.04em",
              }}>{num}</div>
              <div style={{ position: "absolute", top: 0, left: "18%", right: "18%", height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: 2 }} />
              <div style={{
                width: 60, height: 60, borderRadius: 19,
                background: `${color}16`, border: `1px solid ${color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: `0 10px 32px ${color}20`,
              }}>
                <Icon size={25} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: C.cream, marginBottom: 10, fontFamily: FB }}>{title}</div>
              <div style={{ fontSize: 13.5, color: C.creamSub, lineHeight: 1.76, fontFamily: FB }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          OBRAS RECIENTES
      ══════════════════════════════════════════════════ */}
      <ObrasRecientesSection
        obras={obras}
        obrasLoad={obrasLoad}
        navigate={navigate}
        onView={handleVerObra}
      />

      {/* ══════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section ref={ctaSection.ref} style={{
        position: "relative", overflow: "hidden",
        padding: "140px 60px",
        background: `linear-gradient(145deg, ${C.bgDeep} 0%, rgba(96,40,170,0.06) 38%, rgba(232,100,12,0.04) 68%, ${C.bgDeep} 100%)`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${obraImg2})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.04, filter: "saturate(0) blur(2px)",
        }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 820, height: 820, borderRadius: "50%", border: `1px solid ${C.orange}07`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 580, height: 580, borderRadius: "50%", border: `1px solid ${C.orange}11`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 350, height: 350, borderRadius: "50%", border: `1px solid ${C.orange}20`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.orange}30, ${C.pink}18, transparent)` }} />

        <div style={{
          maxWidth: 740, margin: "0 auto", textAlign: "center", position: "relative",
          opacity: ctaSection.inView ? 1 : 0,
          transform: ctaSection.inView ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 20px", borderRadius: 100,
            background: `${C.orange}14`, border: `1px solid ${C.orange}32`,
            fontSize: 11, fontWeight: 800, color: C.orange,
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 32, fontFamily: FB,
          }}>
            <ShieldCheck size={13} /> Certificado de autenticidad
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 62px)", fontWeight: 900, color: C.cream,
            margin: "0 0 22px", fontFamily: FD, letterSpacing: "-0.03em", lineHeight: 1.02,
          }}>
            Arte auténtico,{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              garantizado
            </span>
          </h2>

          <p style={{ fontSize: 16, color: C.creamSub, lineHeight: 1.85, margin: "0 auto 44px", maxWidth: 560, fontFamily: FB }}>
            Cada obra viene con certificado de autenticidad y soporte completo. Invierte con confianza en el arte de la Huasteca Hidalguense.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/catalogo")}>
              Ver catálogo completo <ArrowRight size={17} strokeWidth={2.5} />
            </button>
            <button className="btn-ghost" onClick={() => navigate("/registro-artista")}>
              Registrarme como artista
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ESTILOS GLOBALES
      ══════════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        /* ── Botones ── */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 9px;
          padding: clamp(11px,1.5vh,14px) clamp(20px,2.5vw,30px);
          border-radius: 50px;
          background: ${C.orange};
          border: none; color: white;
          font-size: clamp(13px, 1.8vw, 15px); font-weight: 800;
          cursor: pointer; font-family: ${FB};
          box-shadow: 0 8px 28px ${C.orange}55;
          transition: transform .2s, box-shadow .2s, background .15s;
          white-space: nowrap; letter-spacing: 0.01em;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 36px ${C.orange}65; background: #d4560a; }

        .btn-primary-light {
          display: inline-flex; align-items: center; gap: 9px;
          padding: clamp(11px,1.5vh,14px) clamp(20px,2.5vw,30px);
          border-radius: 50px;
          background: ${C.orange};
          border: none; color: white;
          font-size: clamp(13px, 1.8vw, 15px); font-weight: 800;
          cursor: pointer; font-family: ${FB};
          box-shadow: 0 8px 28px ${C.orange}55;
          transition: transform .2s, box-shadow .2s, background .15s;
          white-space: nowrap; letter-spacing: 0.01em;
        }
        .btn-primary-light:hover { transform: translateY(-2px); box-shadow: 0 14px 36px ${C.orange}65; background: #d4560a; }

        /* Botón ghost para el hero (fondo oscuro) */
        .btn-ghost-hero {
          display: inline-flex; align-items: center; gap: 9px;
          padding: clamp(11px,1.5vh,14px) clamp(20px,2.5vw,30px);
          border-radius: 50px;
          background: rgba(255,255,255,0.10);
          border: 1.5px solid rgba(255,255,255,0.35);
          color: rgba(255,255,255,0.88);
          font-size: clamp(13px, 1.8vw, 15px); font-weight: 600;
          cursor: pointer; font-family: ${FB};
          transition: background .18s, border-color .18s;
          white-space: nowrap; backdrop-filter: blur(8px);
        }
        .btn-ghost-hero:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.55); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 9px;
          padding: clamp(10px,1.5vh,13px) clamp(18px,2.5vw,28px);
          border-radius: 50px;
          background: rgba(0,0,0,0.03);
          border: 1.5px solid ${C.borderHi};
          color: ${C.creamSub};
          font-size: clamp(13px, 2vw, 14.5px); font-weight: 600;
          cursor: pointer; font-family: ${FB};
          transition: background .15s, border-color .15s, color .15s;
          white-space: nowrap;
        }
        .btn-ghost:hover { background: rgba(0,0,0,0.06); border-color: rgba(0,0,0,0.18); color: ${C.cream}; }

        .btn-ghost-sm {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 10px;
          background: rgba(0,0,0,0.03);
          border: 1px solid ${C.borderHi};
          color: ${C.creamSub}; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: ${FB};
          transition: all .15s; white-space: nowrap;
        }
        .btn-ghost-sm:hover { background: rgba(0,0,0,0.06); color: ${C.cream}; }

        .btn-ghost-sm-light {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 10px;
          background: rgba(0,0,0,0.03);
          border: 1px solid ${C.borderHi};
          color: ${C.creamSub}; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: ${FB};
          transition: all .15s; white-space: nowrap;
        }
        .btn-ghost-sm-light:hover { background: rgba(0,0,0,0.06); color: ${C.cream}; }

        .valor-cell:hover { background: rgba(0,0,0,0.02) !important; }

        /* Carrusel */
        .horizontal-carousel {
          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }
        .horizontal-carousel::-webkit-scrollbar { height: 6px; }
        .horizontal-carousel::-webkit-scrollbar-track { background: transparent; }
        .horizontal-carousel::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        .horizontal-carousel::-webkit-scrollbar-thumb:hover { background: ${C.creamMut}; }

        /* Animaciones */
        @keyframes floatA       { 0%,100%{transform:translateY(0) rotate(-2deg)}  50%{transform:translateY(-14px) rotate(-1deg)} }
        @keyframes floatB       { 0%,100%{transform:translateY(0) rotate(2deg)}   50%{transform:translateY(-11px) rotate(1deg)}  }
        @keyframes shimmer      { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @keyframes scrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        @keyframes marqueeScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E6E4EF; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #9896A8; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .bento-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
          .bento-grid > *:first-child { grid-row: auto !important; grid-column: 1 / 3 !important; height: 300px; }
          .bento-grid > *:last-child  { grid-column: 1 / 3 !important; height: 240px; }
          .bento-grid > *:not(:first-child):not(:last-child) { height: 240px; }
          .valores-strip { grid-template-columns: repeat(2, 1fr) !important; border-radius: 0; }
          .valores-strip > *:nth-child(2) { border-right: none !important; }
          .valores-strip > *:nth-child(3) { border-top: 1px solid #E6E4EF; }
        }

        @media (max-width: 768px) {
          /* Ocultar flotantes en móvil — el texto ocupa todo el ancho */
          .hero-bottom > div { max-width: 100% !important; }
          /* Hero padding ya usa clamp, solo ajustamos secciones */
          section[style*="padding: 100px 60px"] { padding: 64px 24px !important; }
          .btn-ghost-sm, .btn-ghost-sm-light { display: none !important; }
        }

        @media (max-width: 640px) {
          .bento-grid { grid-template-columns: 1fr !important; }
          .bento-grid > * { height: 220px !important; grid-column: auto !important; grid-row: auto !important; }
          .valores-strip { grid-template-columns: 1fr !important; }
          .valores-strip > * { border-right: none !important; border-top: 1px solid #E6E4EF; }
          .btn-primary, .btn-ghost { width: 100%; justify-content: center; }
        }

        @media (max-width: 400px) {
          /* En pantallas muy pequeñas, la pill de stats se pone en 2x2 */
          .hero-stats-pill { flex-wrap: wrap; max-width: 260px; }
          .hero-stats-pill > div { width: 50%; border-right: none !important; }
          .hero-stats-pill > div:nth-child(1),
          .hero-stats-pill > div:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.10); }
          .hero-stats-pill > div:nth-child(1) { border-right: 1px solid rgba(255,255,255,0.10) !important; }
          .hero-stats-pill > div:nth-child(3) { border-right: 1px solid rgba(255,255,255,0.10) !important; }
        }
      `}</style>
    </div>
  );
}