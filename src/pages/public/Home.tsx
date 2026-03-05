// src/pages/public/Home.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../../components/LoginModal";
import ProductCard from "../../components/ProductCard";
import {
  ArrowRight, Star, Sparkles, Palette, Camera,
  Frame, Gem, ShieldCheck, Users, Award, ChevronRight,
} from "lucide-react";

import heroMain from "../../assets/images/trabajo.jpg";
import obraImg1 from "../../assets/images/artesanas.webp";
import obraImg2 from "../../assets/images/cuadro.png";

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

const CATEGORIAS = [
  { icon: Palette, label: "Pintura",    count: "120+ obras",  color: C.orange,  slug: "pintura"    },
  { icon: Camera,  label: "Fotografía", count: "85+ obras",   color: C.pink,    slug: "fotografia" },
  { icon: Frame,   label: "Escultura",  count: "60+ obras",   color: C.purple,  slug: "escultura"  },
  { icon: Gem,     label: "Artesanía",  count: "200+ obras",  color: C.gold,    slug: "artesania"  },
];

const STATS = [
  { num: "500+",   label: "Obras Premium"   },
  { num: "50+",    label: "Artistas Elite"  },
  { num: "98%",    label: "Satisfacción"    },
  { num: "5 años", label: "De experiencia"  },
];

const VALORES = [
  { icon: ShieldCheck, color: C.green,  title: "100% Auténtico",  desc: "Certificado oficial en cada obra"  },
  { icon: Award,       color: C.gold,   title: "Artistas Elite",  desc: "Selección curada por expertos"    },
  { icon: Users,       color: C.blue,   title: "Comunidad Viva",  desc: "Artistas locales de la Huasteca"  },
  { icon: Star,        color: C.orange, title: "5.0 Valoración",  desc: "1,247 reseñas verificadas"        },
];

interface Obra {
  id_obra: number;
  titulo: string;
  slug: string;
  imagen_principal: string;
  precio_base: number;
  precio_minimo: number;
  categoria_nombre: string;
  artista_nombre: string;
  artista_alias: string;
  estado: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [loginOpen,   setLoginOpen]   = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [obras,       setObras]       = useState<Obra[]>([]);
  const [obrasLoad,   setObrasLoad]   = useState(true);

  const catSection  = useInView();
  const valSection  = useInView();
  const featSection = useInView(0.08);
  const ctaSection  = useInView();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Cargar solo 4 obras recientes — sin filtros ni paginación
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
      minHeight: "100vh",
      background: C.bg,
      fontFamily: FB,
      overflowX: "hidden",
      transform: loginOpen ? "scale(0.97)" : "scale(1)",
      filter: loginOpen ? "brightness(0.45)" : "brightness(1)",
      transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease",
    }}>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${C.pink}12, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 80% at 80% 30%, ${C.purple}10, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 50% at 60% 80%, ${C.orange}07, transparent)`, pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 1320, margin: "0 auto", padding: "20px 56px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, marginBottom: 20, background: `linear-gradient(135deg, ${C.orange}18, ${C.gold}10)`, border: `1px solid ${C.orange}38`, fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB, opacity: heroVisible ? 1 : 0, transition: "opacity 0.6s ease 0.1s" }}>
              <Sparkles size={12} /> Galería Certificada · Huasteca Hidalguense
            </div>

            <h1 style={{ fontSize: "clamp(40px, 5vw, 66px)", fontWeight: 900, color: C.cream, lineHeight: 1.06, margin: "0 0 24px", fontFamily: FD, letterSpacing: "-0.02em", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" }}>
              El{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Arte Huasteco</span>
              <br />que{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                transforma
                <span style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`, borderRadius: 2 }} />
              </span>
              {" "}espacios
            </h1>

            <p style={{ fontSize: 16, color: C.creamSub, lineHeight: 1.8, margin: "0 0 40px", maxWidth: 500, fontFamily: FB, opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.35s" }}>
              Conecta con la tradición vibrante y el talento extraordinario de artistas locales. Cada obra es una inversión cultural única con certificado de autenticidad.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.5s" }}>
              <button onClick={() => navigate("/catalogo")} className="btn-primary">
                Explorar Colección <ArrowRight size={17} strokeWidth={2.5} />
              </button>
              <button onClick={() => setLoginOpen(true)} className="btn-ghost">
                Iniciar sesión
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.65s" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={13} fill={C.gold} color={C.gold} />)}
              </div>
              <span style={{ fontSize: 13, color: C.creamMut, fontFamily: FB }}>5.0 · 1,247 valoraciones verificadas</span>
            </div>
          </div>

          {/* Imágenes hero */}
          <div style={{ position: "relative", height: 580, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateX(0)" : "translateX(48px)", transition: "opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 300, height: 390, borderRadius: 24, overflow: "hidden", border: `1.5px solid ${C.borderBr}`, boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${C.orange}18` }}>
              <img src={heroMain} alt="Arte Huasteco" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(7,5,16,0.75) 100%)" }} />
              <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: "rgba(7,5,16,0.85)", backdropFilter: "blur(12px)", border: `1px solid ${C.borderBr}`, fontSize: 11.5, fontWeight: 700, color: C.gold, fontFamily: FB }}>
                <Sparkles size={10} color={C.gold} /> Obra Destacada
              </div>
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(7,5,16,0.92)", backdropFilter: "blur(12px)", border: `1px solid ${C.borderBr}`, fontSize: 13.5, fontWeight: 800, color: C.cream, fontFamily: FD }}>
                Desde $2,500 MXN
              </div>
            </div>
            <div style={{ position: "absolute", top: 40, left: -20, width: 144, height: 172, borderRadius: 18, overflow: "hidden", border: `1.5px solid ${C.borderBr}`, boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${C.pink}18`, animation: "floatA 6s ease-in-out infinite" }}>
              <img src={obraImg1} alt="Artesanía" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.pink}20, transparent)` }} />
            </div>
            <div style={{ position: "absolute", bottom: 30, right: -24, width: 154, height: 186, borderRadius: 18, overflow: "hidden", border: `1.5px solid ${C.borderBr}`, boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${C.purple}18`, animation: "floatB 7.5s ease-in-out infinite" }}>
              <img src={obraImg2} alt="Colección" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.purple}20, transparent)` }} />
            </div>
            <div style={{ position: "absolute", top: 90, right: 40, width: 52, height: 52, borderRadius: "50%", background: `${C.orange}15`, border: `1px solid ${C.orange}35`, animation: "pulse 3s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: 110, left: 30, width: 36, height: 36, borderRadius: "50%", background: `${C.pink}15`, border: `1px solid ${C.pink}35`, animation: "pulse 4.5s ease-in-out infinite 1s" }} />
            <div style={{ position: "absolute", top: "44%", right: -10, width: 24, height: 24, borderRadius: "50%", background: `${C.blue}20`, border: `1px solid ${C.blue}38`, animation: "pulse 5s ease-in-out infinite 2s" }} />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: `1px solid ${C.borderBr}`, background: "rgba(7,5,16,0.92)", backdropFilter: "blur(24px)", opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.7s" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 56px", display: "flex", justifyContent: "center", gap: 72, flexWrap: "wrap" }}>
            {STATS.map(({ num, label }) => (
              <div key={label} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 26, fontWeight: 900, background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: FD, lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 11, color: C.creamMut, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FB, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CATEGORÍAS
      ══════════════════════════════════ */}
      <section ref={catSection.ref} style={{ padding: "100px 56px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56, opacity: catSection.inView ? 1 : 0, transform: catSection.inView ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 100, background: `${C.purple}18`, border: `1px solid ${C.purple}35`, fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, fontFamily: FB }}>
            <Sparkles size={11} /> Explora por disciplina
          </div>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, color: C.cream, margin: "0 0 14px", fontFamily: FD, letterSpacing: "-0.02em" }}>
            Cada obra cuenta{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>una historia</span>
          </h2>
          <p style={{ fontSize: 15, color: C.creamSub, margin: 0, fontFamily: FB }}>Descubre el arte auténtico de la Huasteca Hidalguense por categoría</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
         

{CATEGORIAS.map(({ icon: Icon, label, count, color, slug }, i) => {
  // Imágenes de fondo según categoría
  const bgImages = {
    pintura: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80",
    fotografia: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80",
    escultura: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=200&q=80",
    artesania: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=200&q=80"
  };
  
  return (
    <div key={slug} onClick={() => navigate(`/catalogo?categoria=${slug}`)}
      style={{
        padding: "36px 24px 28px",
        borderRadius: 20,
        cursor: "pointer",
        background: C.panel,
        border: `5px solid ${C.border}`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        opacity: catSection.inView ? 1 : 0,
        transform: catSection.inView ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
        isolation: "isolate"
      }}
      className="cat-card"
      onMouseEnter={e => { 
        const el = e.currentTarget as HTMLElement; 
        el.style.borderColor = `${color}45`; 
        el.style.boxShadow = `0 20px 50px ${color}18`; 
        el.style.transform = "translateY(-6px)"; 
      }}
      onMouseLeave={e => { 
        const el = e.currentTarget as HTMLElement; 
        el.style.borderColor = C.border; 
        el.style.boxShadow = "none"; 
        el.style.transform = "translateY(0)"; 
      }}
    >
     {/* Imagen de fondo con overlay */}
<div style={{
  position: "absolute",
  inset: 0,
  backgroundImage: `url(${bgImages[slug as keyof typeof bgImages]})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 0.35,
  transition: "opacity 0.4s ease, transform 0.4s ease",
  transform: "scale(1)",
  filter: "blur(1px)",
}} />

{/* Overlay de color */}
<div style={{
  position: "absolute",
  inset: 0,
  background: `linear-gradient(180deg, ${C.panel}80 0%, ${color}30 50%, ${C.panel}90 100%)`,
}} />
      
      {/* Línea superior */}
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: "20%", 
        right: "20%", 
        height: 2, 
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`, 
        borderRadius: 2,
        zIndex: 2
      }} />
      
      {/* Glow */}
      <div style={{ 
        position: "absolute", 
        top: -20, 
        left: "50%", 
        transform: "translateX(-50%)", 
        width: 100, 
        height: 100, 
        borderRadius: "50%", 
        background: `radial-gradient(circle, ${color}20, transparent 70%)`, 
        pointerEvents: "none",
        zIndex: 2
      }} />
      
      {/* Contenido (con posición relativa para estar sobre el overlay) */}
      <div style={{ position: "relative", zIndex: 3 }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 18, 
          background: `${color}20`, 
          border: `1px solid ${color}50`, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 18px", 
          boxShadow: `0 6px 20px ${color}30`,
          position: "relative",
          backdropFilter: "blur(4px)"
        }}>
          <Icon size={26} color={color} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.cream, marginBottom: 6, fontFamily: FB }}>{label}</div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 16, fontFamily: FB }}>{count}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color, fontFamily: FB }}>
          Explorar <ChevronRight size={13} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
})}
        </div>
      </section>

      {/* ══════════════════════════════════
          VALORES / CONFIANZA
      ══════════════════════════════════ */}
      <section ref={valSection.ref} style={{ padding: "0 56px 100px", maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, marginBottom: 72 }} />
        <div style={{ textAlign: "center", marginBottom: 48, opacity: valSection.inView ? 1 : 0, transform: valSection.inView ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 900, color: C.cream, margin: "0 0 10px", fontFamily: FD, letterSpacing: "-0.02em" }}>
            Por qué elegir{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nu-B Studio</span>
          </h2>
          <p style={{ fontSize: 14.5, color: C.creamSub, margin: 0, fontFamily: FB }}>Arte con respaldo, comunidad y autenticidad garantizada</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {VALORES.map(({ icon: Icon, color, title, desc }, i) => (
            <div key={title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 22px", borderRadius: 18, background: C.panel, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden", opacity: valSection.inView ? 1 : 0, transform: valSection.inView ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s` }}>
              <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: 2 }} />
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, border: `1px solid ${color}32`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: `0 6px 20px ${color}20` }}>
                <Icon size={24} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, marginBottom: 8, fontFamily: FB }}>{title}</div>
              <div style={{ fontSize: 13, color: C.creamSub, lineHeight: 1.65, fontFamily: FB }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          4 OBRAS RECIENTES — sin filtros
      ══════════════════════════════════ */}
      <section ref={featSection.ref} style={{ padding: "0 56px 100px", maxWidth: 1320, margin: "0 auto", opacity: featSection.inView ? 1 : 0, transform: featSection.inView ? "translateY(0)" : "translateY(32px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, marginBottom: 56 }} />

        {/* Header de sección */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 100, background: `${C.gold}15`, border: `1px solid ${C.gold}35`, fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontFamily: FB }}>
              <Star size={11} fill={C.gold} color={C.gold} /> Recién llegadas
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 900, color: C.cream, margin: 0, fontFamily: FD, letterSpacing: "-0.02em" }}>
              Obras{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>recientes</span>
            </h2>
            <p style={{ fontSize: 14, color: C.creamSub, margin: "10px 0 0", fontFamily: FB }}>Las últimas incorporaciones a nuestra galería</p>
          </div>
          <button className="btn-ghost-sm" onClick={() => navigate("/catalogo")}>
            Ver colección completa <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Grid de 4 obras */}
        {obrasLoad ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ borderRadius: 18, background: C.panel, border: `1px solid ${C.border}`, height: 340, animation: "shimmer 1.5s ease-in-out infinite", opacity: 0.5 }} />
            ))}
          </div>
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.creamMut, fontSize: 15, fontFamily: FB }}>
            Pronto habrá obras disponibles aquí.
          </div>
        ) : (
          <div className="mp-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {obras.map(obra => (
              <ProductCard
                key={obra.id_obra}
                id={String(obra.id_obra)}
                category={obra.categoria_nombre || "Arte"}
                title={obra.titulo}
                price={Number(obra.precio_minimo || obra.precio_base) || 0}
                image={obra.imagen_principal || ""}
                available={obra.estado === "publicada"}
                artistName={obra.artista_alias || obra.artista_nombre}
                onView={handleVerObra}
                onBuy={handleVerObra}
              />
            ))}
          </div>
        )}

        {/* CTA centrado debajo del grid */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button className="btn-primary" onClick={() => navigate("/catalogo")}>
            Ver colección completa <ArrowRight size={17} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA FINAL
      ══════════════════════════════════ */}
      <section ref={ctaSection.ref} style={{ padding: "100px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${C.pink}09, transparent)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)` }} />

        <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center", position: "relative", opacity: ctaSection.inView ? 1 : 0, transform: ctaSection.inView ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: `${C.orange}15`, border: `1px solid ${C.orange}32`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 8px 28px ${C.orange}22` }}>
            <ShieldCheck size={26} color={C.orange} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, color: C.cream, margin: "0 0 16px", fontFamily: FD, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Arte auténtico,{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>garantizado</span>
          </h2>
          <p style={{ fontSize: 15.5, color: C.creamSub, lineHeight: 1.8, marginBottom: 40, fontFamily: FB }}>
            Cada obra viene con certificado de autenticidad y soporte completo de nuestro equipo. Invierte con confianza en el arte de la Huasteca.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/catalogo")}>
              Ver catálogo completo <ArrowRight size={17} strokeWidth={2.5} />
            </button>
            <button className="btn-ghost" onClick={() => navigate("/registro-artista")}>
              Registrarme como artista
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 28px; border-radius: 12px;
          background: linear-gradient(135deg, ${C.orange}, ${C.magenta});
          border: none; color: white; font-size: 14.5px; font-weight: 800;
          cursor: pointer; font-family: ${FB};
          box-shadow: 0 10px 32px ${C.orange}42;
          transition: transform .2s, box-shadow .2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px ${C.orange}55; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 28px; border-radius: 12px;
          background: rgba(255,232,200,0.05);
          border: 1.5px solid ${C.borderHi};
          color: ${C.creamSub}; font-size: 14.5px; font-weight: 600;
          cursor: pointer; font-family: ${FB};
          transition: background .15s, border-color .15s, color .15s;
        }
        .btn-ghost:hover { background: rgba(255,232,200,0.09); border-color: rgba(255,200,150,0.32); color: ${C.cream}; }

        .btn-ghost-sm {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 10px;
          background: rgba(255,232,200,0.05);
          border: 1px solid ${C.borderHi};
          color: ${C.creamSub}; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: ${FB};
          transition: all .15s; white-space: nowrap;
        }
        .btn-ghost-sm:hover { background: rgba(255,232,200,0.09); color: ${C.cream}; }

        @keyframes floatA  { 0%,100%{transform:translateY(0px) rotate(-2deg)} 50%{transform:translateY(-16px) rotate(-1deg)} }
        @keyframes floatB  { 0%,100%{transform:translateY(0px) rotate(2deg)}  50%{transform:translateY(-12px) rotate(1deg)} }
        @keyframes pulse   { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.18);opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.6} }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }

        @media (max-width: 900px) {
          section > div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
          section > div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          .btn-primary, .btn-ghost { width: 100%; justify-content: center; }
          .mp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}