// src/pages/public/Contact.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import estrellaImg from "../../assets/images/Estrella1jpeg.jpeg";

const C = {
  orange: "#E8640C",
  pink: "#A83B90",
  ink: "#14121E",
  sub: "#9896A8",
  dark: "#0D0B14",
};

const SERIF = "'SolveraLorvane', serif";
const SANS = "'Outfit', sans-serif";

// Icono WhatsApp personalizado (SVG puro)
const WhatsAppIcon = ({ size = 32 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 448 512" 
    fill="white" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.4 2.4-11.1 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.6-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);
export default function Contact() {
  const navigate   = useNavigate();
  const { showToast } = useToast();
  const isLoggedIn = authService.isAuthenticated();
  const userRol    = localStorage.getItem("userRol") || "";

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.cursor = "none";
    let rx = 0, ry = 0;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) {
          ringRef.current.style.left = `${rx}px`;
          ringRef.current.style.top = `${ry}px`;
        }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setEnviado(true);
        setTimeout(() => {
          setEnviado(false);
          setFormData({ nombre: "", email: "", mensaje: "" });
        }, 3500);
      } else {
        showToast(data.message || "Error al enviar el mensaje", "err");
      }
    } catch {
      showToast("Sin conexión, intenta más tarde", "err");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');

        @font-face {
          font-family: 'SolveraLorvane';
          src: url('/fonts/SolveraLorvane.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .home-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        .home-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width .22s, height .22s, background .22s;
        }
        .home-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .home-cursor-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .home-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }

        .home-nav-link {
          display: flex; align-items: center; gap: 9px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .22em;
          text-transform: uppercase; color: #9896A8;
          text-decoration: none; transition: color .25s;
        }
        .home-nav-link::before {
          content: ''; display: block; width: 12px; height: 1px;
          background: currentColor; flex-shrink: 0;
          transition: width .28s;
        }
        .home-nav-link:hover { color: #14121E; }
        .home-nav-link:hover::before { width: 22px; }

        @keyframes fadeL { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeR { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeI { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 10px rgba(232,100,12,.5); transform: scale(1); }
          50% { box-shadow: 0 0 22px rgba(232,100,12,.85); transform: scale(1.38); }
        }

        .whatsapp-float {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: #25D366;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .whatsapp-float:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
      `}</style>

      <div className="home-grain" />
      <div ref={dotRef} className="home-cursor-dot" />
      <div ref={ringRef} className="home-cursor-ring" />

      

      {/* MENÚ DE NAVEGACIÓN */}
      <nav style={{ position: "absolute", top: 30, left: 52, display: "flex", flexDirection: "column", gap: 10, animation: "fadeL 1.1s ease .4s both", zIndex: 11 }}>
        <Link to="/" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Inicio</Link>
        <Link to="/catalogo" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Galería</Link>
        <Link to="/artistas" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Artistas</Link>
        <Link to="/blog" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Blog</Link>
        <Link to="/sobre-nosotros" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Nosotros</Link>
        <Link to="/contacto" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Contacto</Link>
      </nav>

      {/* BOTONES DE AUTENTICACIÓN */}
      <div style={{ position: "absolute", top: 30, right: 52, display: "flex", alignItems: "center", gap: 12, animation: "fadeR 1.1s ease .4s both", zIndex: 11 }}>
        {!isLoggedIn ? (
          <>
            <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", transition: "all .22s" }}>Ingresar</Link>
            <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", textDecoration: "none", padding: "7px 16px", borderRadius: 100, background: C.orange, transition: "all .22s" }}>Ser artista</Link>
          </>
        ) : (
          <>
            <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)" }}>Mi cuenta</Link>
            <button onClick={() => { authService.logout(); navigate("/"); }} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", background: "#14121E", border: "none", padding: "7px 14px", borderRadius: 100, cursor: "pointer", transition: "all .22s" }}>Salir</button>
          </>
        )}
      </div>

      {/* WhatsApp flotante - esquina inferior DERECHA con número 7713338453 */}
      <a
        href="https://wa.me/527713338453?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20ALTAR%20Galer%C3%ADa"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
        style={{
          width: 56,
          height: 56,
        }}
      >
        <WhatsAppIcon size={32} />
      </a>

      {/* Contenido principal */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* Título CONTACTO */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 900, color: C.ink, letterSpacing: "-.03em", margin: "0 0 24px", animation: "fadeI .8s ease .2s both" }}>
            CONTACTO
          </h1>

          {/* Estrella debajo del título */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 24 }}>
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
            <div
              style={{
                width: "clamp(28px, 3.5vw, 44px)",
                height: "clamp(28px, 3.5vw, 44px)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                cursorOn();
                e.currentTarget.style.transform = "scale(1.1) rotate(5deg)";
              }}
              onMouseLeave={(e) => {
                cursorOff();
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
              }}
            >
              <img src={estrellaImg} alt="ALTAR Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
          </div>

          <p style={{ fontSize: 14, color: C.sub, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Si tienes alguna pregunta, completa este formulario y nuestro equipo se pondrá en contacto contigo lo antes posible.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          
          {/* Formulario */}
          <div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {enviado && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)" }}>
                  <CheckCircle size={18} color="#4ADE80" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>¡Mensaje enviado!</div>
                    <div style={{ fontSize: 11, color: "rgba(74,222,128,0.7)" }}>Te responderemos pronto.</div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sub, marginBottom: 8, display: "block" }}>NOMBRE</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  style={{ width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: 15, outline: "none", fontFamily: SANS, transition: "border-color .2s" }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = C.orange}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(0,0,0,.08)"}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sub, marginBottom: 8, display: "block" }}>E-MAIL</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  style={{ width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: 15, outline: "none", fontFamily: SANS, transition: "border-color .2s" }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = C.orange}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(0,0,0,.08)"}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sub, marginBottom: 8, display: "block" }}>MENSAJE</label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows={5}
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  style={{ width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: 15, resize: "vertical", outline: "none", fontFamily: SANS, transition: "border-color .2s" }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = C.orange}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(0,0,0,.08)"}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || enviado}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{ marginTop: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 24px", borderRadius: 100, background: C.ink, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", border: "none", cursor: (isLoading || enviado) ? "not-allowed" : "pointer", fontFamily: SANS, transition: "all .25s", opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "Enviando..." : <><Send size={14} /> ENVIAR MENSAJE</>}
              </button>
            </form>
          </div>

{/* Mapa e información */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ 
              borderRadius: 12, 
              overflow: "hidden", 
              border: "1px solid rgba(0,0,0,.06)", 
              background: "#fff",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)"
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: 12 }}>
                <MapPin size={18} color={C.orange} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: SANS }}>Chapulhuacán, Hidalgo</div>
                  <div style={{ fontSize: 11, color: C.sub }}>México</div>
                </div>
              </div>
              
              <div style={{ width: "100%", height: "300px", background: "#f0f0f0" }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14841.564410145618!2d-98.9056345!3d21.1567439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d6be97ff138e09%3A0x548620f428908df9!2sChapulhuac%C3%A1n%2C%20Hgo.!5e0!3m2!1ses-419!2smx!4v1712150000000!5m2!1ses-419!2smx"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block", filter: "grayscale(0.3) contrast(1.1)" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingLeft: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Mail size={16} color={C.sub} />
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>nubstudio@gmail.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Phone size={16} color={C.sub} />
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>+52 771 333 8453</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,.05)", padding: "32px 72px", textAlign: "center" }}>
        <p style={{ fontSize: 10, color: C.sub, letterSpacing: ".04em", margin: 0 }}>
          © 2025 ALTAR — Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}