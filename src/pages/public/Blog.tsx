// src/pages/public/Blog.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ArrowRight, Star, Mail, Eye } from "lucide-react";
import { authService } from "../../services/authService";
import estrellaImg from "../../assets/images/Estrella1jpeg.jpeg";

const C = {
  orange: "#E8640C",
  orangeLight: "#F57C2E",
  orangeDark: "#C24E08",
  orangeMuted: "#FDE8DB",
  ink: "#14121E",
  sub: "#9896A8",
  dark: "#0D0B14",
  border: "#E6E4EF",
  white: "#FFFFFF",
};

const SERIF = "'SolveraLorvane', serif";
const SANS = "'Outfit', sans-serif";

const WhatsAppIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.4 2.4-11.1 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

interface Post {
  id: number;
  cat: string;
  catLabel: string;
  titulo: string;
  excerpt: string;
  autor: string;
  fecha: string;
  lectura: string;
  img: string;
}

const CATS = [
  { key: "todos", label: "Todos" },
  { key: "arte", label: "Arte" },
  { key: "cultura", label: "Cultura" },
  { key: "tecnicas", label: "Técnicas" },
  { key: "artistas", label: "Artistas" },
  { key: "eventos", label: "Eventos" },
];

const POSTS: Post[] = [
  {
    id: 1, cat: "arte", catLabel: "Arte",
    titulo: "El alma de la Huasteca en cada trazo",
    excerpt: "Descubre cómo los artistas de la región traducen siglos de historia en colores, formas y texturas que hablan al mundo entero.",
    autor: "Equipo NUB", fecha: "15 Mar 2025", lectura: "8 min",
    img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1400&q=80",
  },
  {
    id: 2, cat: "cultura", catLabel: "Cultura",
    titulo: "Los colores que nos definen",
    excerpt: "Una exploración visual de la paleta cromática Huasteca y su profundo significado cultural a través del tiempo.",
    autor: "María Sánchez", fecha: "10 Mar 2025", lectura: "5 min",
    img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=80",
  },
  {
    id: 3, cat: "tecnicas", catLabel: "Técnicas",
    titulo: "Tejidos que resisten el tiempo",
    excerpt: "Las técnicas ancestrales de bordado Huasteco que sobreviven de generación en generación.",
    autor: "Carlos Mendoza", fecha: "5 Mar 2025", lectura: "6 min",
    img: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=900&q=80",
  },
  {
    id: 4, cat: "artistas", catLabel: "Artistas",
    titulo: "Voces emergentes de la región",
    excerpt: "Nuevos talentos que están redefiniendo el arte contemporáneo desde la Huasteca Hidalguense.",
    autor: "Lucía Torres", fecha: "28 Feb 2025", lectura: "7 min",
    img: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&q=80",
  },
  {
    id: 5, cat: "arte", catLabel: "Arte",
    titulo: "La arcilla como lenguaje universal",
    excerpt: "Del barro al arte: la cerámica Huasteca como puente entre lo sagrado y lo cotidiano.",
    autor: "Ana García", fecha: "20 Feb 2025", lectura: "4 min",
    img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=900&q=80",
  },
  {
    id: 6, cat: "eventos", catLabel: "Eventos",
    titulo: "Exposiciones que marcaron el año",
    excerpt: "Un recorrido por las exhibiciones más importantes que reunieron lo mejor del arte Huasteco.",
    autor: "Equipo NUB", fecha: "15 Feb 2025", lectura: "5 min",
    img: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=900&q=80",
  },
];

export default function Blog() {
  const navigate = useNavigate();
  const isLoggedIn = authService.isAuthenticated();
  const userRol = localStorage.getItem("userRol") || "";

  const [filtro, setFiltro] = useState("todos");
  const [email, setEmail] = useState("");

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      document.body.style.cursor = "none";
      let rx = 0, ry = 0;
      let rafId: number | null = null;

      const onMove = (e: MouseEvent) => {
        const { clientX: mx, clientY: my } = e;
        if (dotRef.current) {
          dotRef.current.style.left = `${mx}px`;
          dotRef.current.style.top = `${my}px`;
        }
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rx += (mx - rx) * 0.15;
          ry += (my - ry) * 0.15;
          if (ringRef.current) {
            ringRef.current.style.left = `${rx}px`;
            ringRef.current.style.top = `${ry}px`;
          }
          rafId = null;
        });
      };

      document.addEventListener("mousemove", onMove);
      return () => {
        document.removeEventListener("mousemove", onMove);
        if (rafId) cancelAnimationFrame(rafId);
        document.body.style.cursor = "";
      };
    }
  }, []);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  const handleLeer = () => alert("Este artículo estará disponible próximamente");
  const handleSubscribe = () => {
    if (!email.trim()) return alert("Ingresa tu correo electrónico");
    alert("¡Pronto recibirás nuestras historias en tu correo!");
    setEmail("");
  };

  const postsFiltrados = filtro === "todos" ? POSTS : POSTS.filter(p => p.cat === filtro);
  const featured = postsFiltrados[0] ?? null;
  const rest = postsFiltrados.slice(1);

  return (
    <div style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');

        @font-face {
          font-family: 'SolveraLorvane';
          src: url('/fonts/SolveraLorvane.ttf') format('truetype');
          font-weight: normal; font-style: normal; font-display: swap;
        }

        .home-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        .home-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%); transition: width .22s, height .22s, background .22s;
        }
        .home-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%); transition: width .3s, height .3s, border-color .25s;
        }
        .home-cursor-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .home-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }

        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(36px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes letterRise {
          0% { opacity: 0; transform: translateY(70px) skewY(6deg); }
          60% { opacity: 1; transform: translateY(-8px) skewY(-1deg); }
          100% { opacity: 1; transform: translateY(0) skewY(0); }
        }
        
        .animate-title {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .card {
          background: #fff;
          border-radius: 28px;
          border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
          box-shadow: 0 8px 20px -12px rgba(0,0,0,0.08);
          overflow: hidden;
          cursor: pointer;
          opacity: 0;
          transform: translateY(30px);
        }
        .card.reveal {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1), transform 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 40px -16px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.02);
          border-color: rgba(0,0,0,0.08);
        }
        
        .img-wrapper {
          position: relative;
          overflow: hidden;
        }
        .img-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
          pointer-events: none;
        }
        .card:hover .img-wrapper::after {
          transform: translateX(100%);
        }
        
        .read-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          color: white;
          z-index: 2;
        }
        .img-wrapper:hover .read-overlay {
          opacity: 1;
        }
        
        .category-chip {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
          z-index: 1;
          position: relative;
        }
        
        .filter-btn {
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          cursor: pointer;
          border: none;
          background: transparent;
          color: #9896A8;
        }
        .filter-btn.active {
          background: #E8640C;
          color: white;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(232,100,12,0.3);
          transform: scale(1.02);
        }
        .filter-btn:hover:not(.active) {
          background: rgba(0,0,0,0.03);
          color: #14121E;
          transform: translateY(-2px);
        }
        
        .whatsapp-float {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: #25D366; border-radius: 50%; width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2); cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .whatsapp-float:hover { transform: scale(1.08) rotate(4deg); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        
        /* Menú lateral uniforme con Contact.tsx */
        .side-nav {
          position: absolute;
          top: 30px;
          left: 52px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 11;
        }
        .side-nav-link {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #9896A8;
          text-decoration: none;
          transition: color 0.25s ease, gap 0.25s ease;
        }
        .side-nav-link::before {
          content: '';
          display: block;
          width: 12px;
          height: 1px;
          background: currentColor;
          flex-shrink: 0;
          transition: width 0.28s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .side-nav-link:hover {
          color: #E8640C;
          gap: 14px;
        }
        .side-nav-link:hover::before {
          width: 22px;
        }
        
        @media (max-width: 768px) {
          .card { border-radius: 24px; }
          .filter-btn { padding: 8px 18px; font-size: 12px; }
          .side-nav { left: 24px; top: 20px; gap: 8px; }
          .side-nav-link { font-size: 8px; gap: 6px; }
          .side-nav-link::before { width: 8px; }
          .side-nav-link:hover { gap: 10px; }
          .side-nav-link:hover::before { width: 16px; }
        }
      `}</style>

      <div className="home-grain" />
      <div ref={dotRef} className="home-cursor-dot" />
      <div ref={ringRef} className="home-cursor-ring" />

      <nav className="side-nav">
        <Link to="/" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Inicio</Link>
        <Link to="/catalogo" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Galería</Link>
        <Link to="/artistas" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Artistas</Link>
        <Link to="/blog" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Blog</Link>
        <Link to="/sobre-nosotros" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Nosotros</Link>
        <Link to="/contacto" className="side-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Contacto</Link>
      </nav>

      <div style={{ position: "absolute", top: 30, right: 52, display: "flex", alignItems: "center", gap: 12, animation: "fadeSlideUp 0.8s ease 0.3s both", zIndex: 11 }}>
        {!isLoggedIn ? (
          <>
            <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", textDecoration: "none", transition: "all 0.2s" }}>Ingresar</Link>
            <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", padding: "7px 16px", borderRadius: 100, background: C.orange, textDecoration: "none", transition: "all 0.2s" }}>Ser artista</Link>
          </>
        ) : (
          <>
            <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", textDecoration: "none" }}>Mi cuenta</Link>
            <button onClick={() => { authService.logout(); navigate("/"); }} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", background: C.ink, border: "none", padding: "7px 14px", borderRadius: 100, cursor: "pointer", transition: "all .22s" }}>Salir</button>
          </>
        )}
      </div>

      <a href="https://wa.me/527713338453?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20ALTAR%20Galer%C3%ADa" target="_blank" rel="noopener noreferrer" className="whatsapp-float" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>
        <WhatsAppIcon size={32} />
      </a>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) 24px 80px" }}>

        <div className="animate-title" style={{ textAlign: "center", marginBottom: 64 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(56px, 8vw, 96px)", fontWeight: 900, color: C.ink, letterSpacing: "-0.02em", marginBottom: 32 }}>
            {"BLOG".split("").map((l, i) => (
              <span key={i} style={{ display: "inline-block", opacity: 0, animation: `letterRise 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.18 + i * 0.1}s forwards` }}>{l}</span>
            ))}
          </h1>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 24 }}>
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
            <div
              style={{
                width: "clamp(32px, 4vw, 48px)",
                height: "clamp(32px, 4vw, 48px)",
                transition: "transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { cursorOn(); e.currentTarget.style.transform = "scale(1.15)"; }}
              onMouseLeave={(e) => { cursorOff(); e.currentTarget.style.transform = "scale(1)"; }}
            >
              <img src={estrellaImg} alt="ALTAR Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
          </div>
          <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: C.sub, maxWidth: 620, margin: "0 auto", lineHeight: 1.6, fontWeight: 400 }}>
            Relatos, técnicas y voces del arte que nace de la Huasteca
          </p>
        </div>

        <div style={{ marginBottom: 70, overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, minWidth: "max-content", margin: "0 auto" }}>
            {CATS.map(({ key, label }) => {
              const active = filtro === key;
              return (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  className={`filter-btn ${active ? "active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {featured && (
          <div
            onClick={handleLeer}
            onMouseEnter={cursorOn}
            onMouseLeave={cursorOff}
            className="card reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              marginBottom: 80,
              cursor: "pointer",
            }}
          >
            <div className="img-wrapper" style={{ position: "relative", minHeight: 380, overflow: "hidden" }}>
              <img
                src={featured.img}
                alt={featured.titulo}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
              />
              <div className="read-overlay">
                <Eye size={32} strokeWidth={1.5} />
                <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>Leer artículo</span>
              </div>
              <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1 }}>
                <span className="category-chip" style={{ color: C.orange, border: `1px solid ${C.orange}30` }}>
                  {featured.catLabel}
                </span>
              </div>
            </div>
            <div style={{ padding: "clamp(32px, 5vw, 48px)" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: C.ink, marginBottom: 20, lineHeight: 1.2 }}>
                {featured.titulo}
              </h2>
              <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, marginBottom: 28 }}>
                {featured.excerpt}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  {featured.autor[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: C.ink }}>{featured.autor}</div>
                  <div style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 6 }}>
                    {featured.fecha} · <Clock size={12} /> {featured.lectura}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "clamp(28px, 4vw, 40px)" }}>
          {rest.map((post, idx) => (
            <PostCard
              key={post.id}
              post={post}
              index={idx}
              cursorOn={cursorOn}
              cursorOff={cursorOff}
              handleLeer={handleLeer}
            />
          ))}
        </div>
      </div>

      <section style={{ background: C.dark, color: "#fff", padding: "clamp(64px, 8vw, 96px) 24px", marginTop: 40 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", transition: "transform 0.3s", animation: "fadeSlideUp 0.6s ease" }}>
            <Mail size={28} color={C.orange} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 42px)", marginBottom: 16, animation: "fadeSlideUp 0.6s ease 0.1s both" }}>Recibe las historias</h2>
          <p style={{ color: C.sub, marginBottom: 32, lineHeight: 1.6, animation: "fadeSlideUp 0.6s ease 0.2s both" }}>
            Las mejores reflexiones, técnicas y novedades del arte huasteco directo a tu correo.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", animation: "fadeSlideUp 0.6s ease 0.3s both" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
              style={{ flex: "1 1 240px", padding: "14px 20px", borderRadius: 60, border: "none", fontSize: 14, outline: "none", background: "#1a1a24", color: "#fff", transition: "all 0.2s" }}
              onFocus={e => e.currentTarget.style.background = "#252530"}
              onBlur={e => e.currentTarget.style.background = "#1a1a24"}
            />
            <button
              onClick={handleSubscribe}
              style={{
                padding: "14px 32px", background: C.orange, border: "none",
                borderRadius: 60, fontWeight: 700, color: "#fff", cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1)"
              }}
              onMouseEnter={(e) => {
                cursorOn();
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(232,100,12,0.4)";
              }}
              onMouseLeave={(e) => {
                cursorOff();
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Suscribirme
            </button>
          </div>
          <div style={{ marginTop: 28, fontSize: 12, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Star size={10} fill={C.orange} color={C.orange} /> Sin spam, solo arte
          </div>
        </div>
      </section>

      <footer style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,.05)", padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.sub, letterSpacing: ".04em", margin: 0 }}>
          © 2025 ALTAR — Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

function PostCard({ post, index, cursorOn, cursorOff, handleLeer }: { post: Post; index: number; cursorOn: () => void; cursorOff: () => void; handleLeer: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "40px" }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      onClick={handleLeer}
      onMouseEnter={cursorOn}
      onMouseLeave={cursorOff}
      className="card"
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      <div className="img-wrapper" style={{ height: 240, overflow: "hidden", position: "relative" }}>
        <img
          src={post.img}
          alt={post.titulo}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
          onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"}
          onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
        />
        <div className="read-overlay">
          <Eye size={28} strokeWidth={1.5} />
          <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>Leer artículo</span>
        </div>
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1 }}>
          <span className="category-chip" style={{ color: C.orange, border: `1px solid ${C.orange}30` }}>
            {post.catLabel}
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 24px 32px" }}>
        <h3 style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.3, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
          {post.titulo}
        </h3>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.65, marginBottom: 24 }}>
          {post.excerpt}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: 18, fontSize: 12, color: C.sub }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>
              {post.autor[0]}
            </div>
            <span style={{ fontWeight: 500 }}>{post.autor}</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={12} /> {post.lectura}
          </span>
        </div>
      </div>
    </article>
  );
}