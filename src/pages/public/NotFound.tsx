// src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const C = {
  orange: "#E8640C", pink: "#A83B90",
  purple: "#6028AA", violet: "#6028AA", blue: "#2D6FBE",
  cream: "#14121E", creamSub: "#5A5870",
  bg: "#F9F8FC", bgDeep: "#FFFFFF", panel: "#FFFFFF",
  card: "#FFFFFF", border: "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};
const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";

export default function NotFound() {
  const navigate = useNavigate();
  const [hoverBack, setHoverBack] = useState(false);
  const [hoverHome, setHoverHome] = useState(false);
  const [glitch, setGlitch] = useState(false);

  // Efecto glitch periódico en el "404"
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes glitch1 {
          0%   { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 0); }
          25%  { clip-path: inset(60% 0 10% 0); transform: translate(4px, 0); }
          50%  { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 0); }
          75%  { clip-path: inset(80% 0 5% 0);  transform: translate(3px, 0); }
          100% { clip-path: inset(40% 0 30% 0); transform: translate(0, 0); }
        }
        @keyframes glitch2 {
          0%   { clip-path: inset(50% 0 30% 0); transform: translate(4px, 0); }
          25%  { clip-path: inset(15% 0 65% 0); transform: translate(-4px, 0); }
          50%  { clip-path: inset(70% 0 5% 0);  transform: translate(2px, 0); }
          75%  { clip-path: inset(5% 0 85% 0);  transform: translate(-3px, 0); }
          100% { clip-path: inset(35% 0 45% 0); transform: translate(0, 0); }
        }
        @keyframes orb {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.18; }
          33%       { transform: scale(1.15) translate(20px,-15px); opacity: 0.28; }
          66%       { transform: scale(0.9) translate(-15px,20px); opacity: 0.14; }
        }
        .nf-glitch-layer1 {
          animation: glitch1 0.3s steps(1) forwards;
        }
        .nf-glitch-layer2 {
          animation: glitch2 0.3s steps(1) forwards;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.bgDeep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FB,
        overflow: "hidden",
        position: "relative",
      }}>

        {/* Orbes de fondo */}
        <div style={{
          position: "absolute", top: "15%", left: "10%",
          width: 420, height: 420, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.purple}55 0%, transparent 70%)`,
          animation: "orb 8s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "8%",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.pink}44 0%, transparent 70%)`,
          animation: "orb 11s ease-in-out infinite reverse", pointerEvents: "none",
        }} />

        {/* Contenido principal */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 0, textAlign: "center", zIndex: 1,
          animation: "fadeUp 0.7s ease both",
          padding: "40px 24px",
        }}>

          {/* Número 404 con efecto glitch */}
          <div style={{ position: "relative", lineHeight: 1, marginBottom: 8 }}>
            {/* Texto base */}
            <span style={{
              fontFamily: FD,
              fontSize: "clamp(120px, 20vw, 200px)",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${C.violet} 0%, ${C.orange} 60%, ${C.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "block",
              letterSpacing: "-4px",
              userSelect: "none",
            }}>404</span>

            {/* Capa glitch 1 */}
            {glitch && (
              <span className="nf-glitch-layer1" style={{
                position: "absolute", top: 0, left: 0, width: "100%",
                fontFamily: FD,
                fontSize: "clamp(120px, 20vw, 200px)",
                fontWeight: 900,
                color: C.blue,
                opacity: 0.7,
                letterSpacing: "-4px",
                userSelect: "none",
              }}>404</span>
            )}
            {/* Capa glitch 2 */}
            {glitch && (
              <span className="nf-glitch-layer2" style={{
                position: "absolute", top: 0, left: 0, width: "100%",
                fontFamily: FD,
                fontSize: "clamp(120px, 20vw, 200px)",
                fontWeight: 900,
                color: C.orange,
                opacity: 0.6,
                letterSpacing: "-4px",
                userSelect: "none",
              }}>404</span>
            )}
          </div>

          {/* Ícono flotante */}
          <div style={{
            fontSize: 56,
            animation: "float 4s ease-in-out infinite",
            marginBottom: 20,
            filter: "drop-shadow(0 0 18px rgba(96,40,170,0.20))",
          }}>
            🎨
          </div>

          {/* Título */}
          <h1 style={{
            fontFamily: FD,
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 700,
            color: C.cream,
            margin: "0 0 12px 0",
            letterSpacing: "0.3px",
          }}>
            Página no encontrada
          </h1>

          {/* Subtítulo */}
          <p style={{
            fontFamily: FB,
            fontSize: 15,
            color: C.creamSub,
            opacity: 0.72,
            margin: "0 0 36px 0",
            maxWidth: 360,
            lineHeight: 1.6,
          }}>
            La obra que buscas no existe o fue movida a otra galería.
            <br />Verifica la URL o regresa al inicio.
          </p>

          {/* Botones */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => navigate(-1)}
              onMouseEnter={() => setHoverBack(true)}
              onMouseLeave={() => setHoverBack(false)}
              style={{
                padding: "11px 26px",
                borderRadius: 10,
                border: `1.5px solid ${hoverBack ? C.orange : C.borderBr}`,
                background: hoverBack ? "rgba(232,100,12,0.08)" : "transparent",
                color: hoverBack ? C.orange : C.creamSub,
                fontFamily: FB,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.2px",
              }}
            >
              ← Volver atrás
            </button>

            <button
              onClick={() => navigate("/")}
              onMouseEnter={() => setHoverHome(true)}
              onMouseLeave={() => setHoverHome(false)}
              style={{
                padding: "11px 26px",
                borderRadius: 10,
                border: "none",
                background: hoverHome
                  ? `linear-gradient(135deg, ${C.violet}, ${C.pink})`
                  : `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                color: "#fff",
                fontFamily: FB,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: hoverHome
                  ? `0 6px 24px rgba(96,40,170,0.25)`
                  : `0 4px 16px rgba(96,40,170,0.15)`,
                letterSpacing: "0.2px",
              }}
            >
              Ir al inicio
            </button>
          </div>

          {/* Línea decorativa inferior */}
          <div style={{
            marginTop: 48,
            display: "flex", alignItems: "center", gap: 10, opacity: 0.3,
          }}>
            <div style={{ width: 40, height: 1, background: C.creamSub }} />
            <span style={{ fontFamily: FD, fontSize: 13, color: C.creamSub, letterSpacing: 2 }}>
              NU★B STUDIO
            </span>
            <div style={{ width: 40, height: 1, background: C.creamSub }} />
          </div>

        </div>
      </div>
    </>
  );
}