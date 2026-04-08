// src/pages/public/About.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Palette,
  Globe,
  MapPin,
  Heart,
  Star,
  Award,
  Clock,
} from "lucide-react";
import {
  getSobreNosotros,
  getTrayectoria,
} from "../../services/sobreNosotrosService";
import { getMunicipiosHidalgo } from "../../services/municipiosService";
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
  <svg
    width={size}
    height={size}
    viewBox="0 0 448 512"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.4 2.4-11.1 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

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
  const isLoggedIn = authService.isAuthenticated();
  const userRol = localStorage.getItem("userRol") || "";

  const [info, setInfo] = useState<SobreNosotrosData | null>(null);
  const [trayectoria, setTrayectoria] = useState<TrayectoriaItem[]>([]);
  const [municipios, setMunicipios] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      document.body.style.cursor = "none";
      let rx = 0,
        ry = 0;
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

  useEffect(() => {
    Promise.all([getSobreNosotros(), getTrayectoria(), getMunicipiosHidalgo()])
      .then(([sobreNosotros, tray, totalMunicipios]) => {
        setInfo(sobreNosotros);
        setTrayectoria(tray);
        setMunicipios(totalMunicipios);
      })
      .catch((err) => console.log("ERROR:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!info)
    return (
      <div
        style={{
          background: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: C.sub, fontFamily: SANS }}>Sin datos disponibles</p>
      </div>
    );

  const logros = info.logros.split(".").filter(Boolean);
  const valores = info.valores.split(".").filter(Boolean);
  const valoresIcons = [ShieldCheck, Users, Palette, Globe];

  return (
    <div
      style={{
        fontFamily: SANS,
        overflowX: "hidden",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
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
        
        @keyframes slowFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }

        .animate-title {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

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
        
        .whatsapp-float {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: #25D366; border-radius: 50%; width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2); cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .whatsapp-float:hover { transform: scale(1.08) rotate(4deg); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        
        .about-card {
          background: #fff;
          border-radius: 28px;
          border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
          box-shadow: 0 8px 20px -12px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .about-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 40px -16px rgba(0,0,0,0.12);
          border-color: rgba(0,0,0,0.08);
        }
        
        .timeline-item {
          position: relative;
          padding-left: 32px;
          margin-bottom: 32px;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #E8640C;
        }
        .timeline-item::after {
          content: '';
          position: absolute;
          left: 12px;
          top: 24px;
          bottom: -24px;
          width: 1px;
          background: #E6E4EF;
        }
        .timeline-item:last-child::after {
          display: none;
        }
        
        .stat-number {
          font-size: 44px;
          font-weight: 900;
          font-family: 'SolveraLorvane', serif;
          color: #E8640C;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        @media (max-width: 768px) {
          .side-nav { left: 24px; top: 20px; gap: 8px; }
          .side-nav-link { font-size: 8px; gap: 6px; }
          .side-nav-link::before { width: 8px; }
          .side-nav-link:hover { gap: 10px; }
          .side-nav-link:hover::before { width: 16px; }
          .stat-number { font-size: 32px; }
        }
      `}</style>

      <div className="home-grain" />
      <div ref={dotRef} className="home-cursor-dot" />
      <div ref={ringRef} className="home-cursor-ring" />

      {/* Menú lateral */}
      <nav className="side-nav">
        <Link
          to="/"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Inicio
        </Link>
        <Link
          to="/catalogo"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Galería
        </Link>
        <Link
          to="/artistas"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Artistas
        </Link>
        <Link
          to="/blog"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Blog
        </Link>
        <Link
          to="/sobre-nosotros"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Nosotros
        </Link>
        <Link
          to="/contacto"
          className="side-nav-link"
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
        >
          Contacto
        </Link>
      </nav>

      {/* Autenticación */}
      <div
        style={{
          position: "absolute",
          top: 30,
          right: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          animation: "fadeSlideUp 0.8s ease 0.3s both",
          zIndex: 11,
        }}
      >
        {!isLoggedIn ? (
          <>
            <Link
              to="/login"
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: C.sub,
                padding: "7px 14px",
                borderRadius: 100,
                border: "1px solid rgba(0,0,0,.10)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Ingresar
            </Link>
            <Link
              to="/register"
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "#fff",
                padding: "7px 16px",
                borderRadius: 100,
                background: C.orange,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Ser artista
            </Link>
          </>
        ) : (
          <Link
            to={
              userRol === "admin"
                ? "/admin"
                : userRol === "artista"
                  ? "/artista/dashboard"
                  : "/mi-cuenta"
            }
            onMouseEnter={cursorOn}
            onMouseLeave={cursorOff}
            style={{
              fontSize: "9.5px",
              fontWeight: 700,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: C.sub,
              padding: "7px 14px",
              borderRadius: 100,
              border: "1px solid rgba(0,0,0,.10)",
              textDecoration: "none",
            }}
          >
            Mi cuenta
          </Link>
        )}
      </div>

      {/* WhatsApp flotante */}
      <a
        href="https://wa.me/527713338453?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20ALTAR%20Galer%C3%ADa"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
      >
        <WhatsAppIcon size={32} />
      </a>

      {/* CONTENIDO PRINCIPAL */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(80px, 10vw, 120px) 24px 80px",
        }}
      >
        {/* Título mejor espaciado */}
        <div
          className="animate-title"
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(48px, 7vw, 88px)",
              fontWeight: 900,
              color: C.ink,
              letterSpacing: "-0.01em",
              marginBottom: 32,
              wordSpacing: "0.05em",
            }}
          >
            {"SOBRE NOSOTROS".split("").map((l, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: 0,
                  animation: `letterRise 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.18 + i * 0.07}s forwards`,
                  marginRight: l === " " ? "0.2em" : "0",
                }}
              >
                {l}
              </span>
            ))}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 24,
            }}
          >
            <div
              style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }}
            />
            <div
              style={{
                width: "clamp(32px, 4vw, 48px)",
                height: "clamp(32px, 4vw, 48px)",
                transition: "transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                cursorOn();
                e.currentTarget.style.transform = "scale(1.15) rotate(8deg)";
              }}
              onMouseLeave={(e) => {
                cursorOff();
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
              }}
            >
              <img
                src={estrellaImg}
                alt="ALTAR Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div
              style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }}
            />
          </div>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 17px)",
              color: C.sub,
              maxWidth: 620,
              margin: "0 auto",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Conoce la historia, misión y valores que dan vida a ALTAR Galería
          </p>
        </div>

        {/* Sección Hero con imagen flotante */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(40px, 6vw, 80px)",
            marginBottom: 100,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.orange,
                marginBottom: 16,
              }}
            ></p>
            <h2
              style={{
                fontSize: "clamp(34px, 4.5vw, 52px)",
                fontWeight: 900,
                fontFamily: SERIF,
                margin: "0 0 24px",
                lineHeight: 1.1,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              Arte que nace{" "}
              <span style={{ color: C.orange }}>de la tierra</span>
            </h2>
            <p
              style={{
                fontSize: 16,
                color: C.sub,
                lineHeight: 1.75,
                marginBottom: 32,
              }}
            >
              {info.historia}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/catalogo")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  borderRadius: 40,
                  background: C.orange,
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Ver catálogo <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate("/artistas")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  borderRadius: 40,
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.ink,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Conocer artistas
              </button>
            </div>
          </div>
          <div
            style={{
              borderRadius: 32,
              overflow: "hidden",
              height: 380,
              boxShadow: "0 20px 40px -20px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=900&q=80"
              alt="Huasteca"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Trayectoria con diseño de línea de tiempo mejorado */}
        {trayectoria.length > 0 && (
          <div style={{ marginBottom: 100 }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.orange,
                  marginBottom: 12,
                }}
              >
                Nuestra trayectoria
              </p>
              <h3
                style={{
                  fontSize: "clamp(28px, 3.5vw, 40px)",
                  fontWeight: 800,
                  fontFamily: SERIF,
                  color: C.ink,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Años construyendo{" "}
                <span style={{ color: C.orange }}>algo único</span>
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: C.sub,
                  maxWidth: 600,
                  margin: "0 auto",
                  lineHeight: 1.6,
                }}
              >
                {info.historia.substring(0, 120)}...
              </p>
            </div>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {trayectoria.map((item, i) => (
                <div
                  key={item.id}
                  className="timeline-item"
                  style={{
                    animation: `fadeSlideUp 0.6s ease ${i * 0.1}s both`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.orange,
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    {item.año} · {item.titulo}
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: C.sub,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {item.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Misión + Visión con tarjetas decoradas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginBottom: 100,
          }}
        >
          <div
            className="about-card"
            style={{ padding: "clamp(36px, 5vw, 48px)" }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: C.orangeMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Heart size={24} color={C.orange} />
            </div>
            <h4
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: SERIF,
                color: C.ink,
                marginBottom: 16,
              }}
            >
              Misión
            </h4>
            <p
              style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, margin: 0 }}
            >
              {info.mision}
            </p>
          </div>
          <div
            className="about-card"
            style={{ padding: "clamp(36px, 5vw, 48px)" }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: C.orangeMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Globe size={24} color={C.orange} />
            </div>
            <h4
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: SERIF,
                color: C.ink,
                marginBottom: 16,
              }}
            >
              Visión
            </h4>
            <p
              style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, margin: 0 }}
            >
              {info.vision}
            </p>
          </div>
        </div>

        {/* Logros con números destacados */}
        <div
          style={{
            background: C.orangeMuted,
            borderRadius: 48,
            marginBottom: 100,
            padding: "clamp(48px, 6vw, 72px) 24px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h3
              style={{
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 800,
                fontFamily: SERIF,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              Nuestros <span style={{ color: C.orange }}>logros</span>
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${logros.length}, 1fr)`,
              gap: 24,
              textAlign: "center",
            }}
          >
            {logros.map((logro, i) => (
              <div key={logro.trim()} style={{ padding: "0 16px" }}>
                <div className="stat-number">
                  {i === 0 ? "8+" : i === 1 ? "45+" : i === 2 ? "120+" : "15k+"}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: C.sub,
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {logro.trim()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Valores con iconos animados */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.orange,
                marginBottom: 12,
              }}
            >
              Nuestros pilares
            </p>
            <h3
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 800,
                fontFamily: SERIF,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              Lo que nos <span style={{ color: C.orange }}>define</span>
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
            }}
          >
            {valores.map((valor, i) => {
              const Icon = valoresIcons[i % valoresIcons.length];
              return (
                <div
                  key={valor.trim()}
                  className="about-card"
                  style={{ padding: "32px 28px", textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      background: C.orangeMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                    }}
                  >
                    <Icon size={28} color={C.orange} />
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: C.sub,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {valor.trim()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Región Huasteca con imagen y estadística */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(40px, 6vw, 80px)",
            marginBottom: 100,
            alignItems: "center",
          }}
        >
          <div
            style={{
              borderRadius: 32,
              overflow: "hidden",
              height: 360,
              boxShadow: "0 20px 40px -20px rgba(0,0,0,0.2)",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=900&q=80"
              alt="Huasteca"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.orange,
                marginBottom: 12,
              }}
            >
              La región
            </p>
            <h3
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 800,
                fontFamily: SERIF,
                color: C.ink,
                marginBottom: 20,
                letterSpacing: "-0.01em",
              }}
            >
              Donde el arte y la tierra{" "}
              <span style={{ color: C.orange }}>se unen</span>
            </h3>
            <p
              style={{
                fontSize: 15,
                color: C.sub,
                lineHeight: 1.75,
                marginBottom: 32,
              }}
            >
              {info.descripcion_region}
            </p>
            <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
              <div>
                <div className="stat-number" style={{ fontSize: 36 }}>
                  {municipios}
                </div>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                  Municipios
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: C.border }} />
              <div>
                <div className="stat-number" style={{ fontSize: 36 }}>
                  100+
                </div>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                  Artistas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA final con fondo decorativo */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.orangeMuted} 0%, #fff 100%)`,
            borderRadius: 48,
            padding: "clamp(48px, 6vw, 64px) 32px",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <Star size={32} color={C.orange} style={{ marginBottom: 24 }} />
          <h3
            style={{
              fontSize: "clamp(28px, 3.5vw, 40px)",
              fontWeight: 800,
              fontFamily: SERIF,
              color: C.ink,
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Sé parte de <span style={{ color: C.orange }}>esta historia</span>
          </h3>
          <p
            style={{
              fontSize: 15,
              color: C.sub,
              lineHeight: 1.7,
              maxWidth: 500,
              margin: "0 auto 32px",
            }}
          >
            Ya seas coleccionista, amante del arte o artista Huasteco, hay un
            lugar para ti en ALTAR Galería.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/catalogo")}
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 40,
                background: C.orange,
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Explorar catálogo <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("/register")}
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 40,
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.ink,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Registrarme como artista
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(0,0,0,.05)",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: C.sub,
            letterSpacing: ".04em",
            margin: 0,
          }}
        >
          © 2025 ALTAR — Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}
