// src/pages/public/Unauthorized.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "../../services/authService";

const C = {
  orange: "#FF840E", pink: "#CC59AD", magenta: "#CC4EA1",
  purple: "#8D4CCD", violet: "#D363FF", blue: "#79AAF5",
  cream: "#FFF8EE", creamSub: "#D8CABC",
  bg: "#0C0812", bgDeep: "#070510",
  red: "#E53535", redDark: "#B01E1E", redGlow: "rgba(229,53,53,0.18)",
  redBorder: "rgba(229,53,53,0.30)", redSoft: "rgba(229,53,53,0.08)",
  borderBr: "rgba(118,78,49,0.24)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

export default function Unauthorized() {
  const navigate = useNavigate();
  const [hoverLogin, setHoverLogin] = useState(false);
  const [hoverBack, setHoverBack]   = useState(false);

  const isLoggedIn = !!authService.getToken();
  const userName   = authService.getUserName?.() ?? null;

  function handleGoLogin() {
    authService.logout();
    navigate("/login");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbRed {
          0%, 100% { transform: scale(1) translate(0,0);       opacity: 0.22; }
          33%       { transform: scale(1.1) translate(18px,-12px); opacity: 0.32; }
          66%       { transform: scale(0.92) translate(-12px,18px); opacity: 0.16; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20%       { transform: translateX(-7px) rotate(-3deg); }
          40%       { transform: translateX(7px) rotate(3deg); }
          60%       { transform: translateX(-4px) rotate(-1deg); }
          80%       { transform: translateX(4px) rotate(1deg); }
        }
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,53,53,0.5); }
          50%       { box-shadow: 0 0 0 16px rgba(229,53,53,0); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); opacity: 0.06; }
          100% { transform: translateY(100vh);  opacity: 0.06; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(229,53,53,0.30); }
          50%       { border-color: rgba(229,53,53,0.65); }
        }
        .ua-card {
          animation: fadeUp 0.65s ease both, borderPulse 2.5s ease-in-out infinite;
        }
        .ua-lock {
          animation: pulseRed 2s ease-in-out infinite, shake 0.55s ease 0.7s 1;
        }
        .ua-dot {
          animation: blink 1.2s ease-in-out infinite;
        }
        .ua-dot:nth-child(2) { animation-delay: 0.2s; }
        .ua-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.bgDeep,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FB, overflow: "hidden", position: "relative",
      }}>

        {/* Línea de scan */}
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: 2,
          background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
          animation: "scanline 4s linear infinite",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Orbe rojo principal */}
        <div style={{
          position: "absolute", top: "10%", left: "50%",
          transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(229,53,53,0.14) 0%, transparent 65%)`,
          animation: "orbRed 10s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        {/* Orbe rojo secundario */}
        <div style={{
          position: "absolute", bottom: "5%", right: "5%",
          width: 280, height: 280, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(229,53,53,0.10) 0%, transparent 70%)`,
          animation: "orbRed 13s ease-in-out infinite reverse",
          pointerEvents: "none",
        }} />
        {/* Orbe magenta sutil */}
        <div style={{
          position: "absolute", bottom: "20%", left: "5%",
          width: 220, height: 220, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(204,78,161,0.10) 0%, transparent 70%)`,
          animation: "orbRed 16s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Tarjeta central */}
        <div className="ua-card" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", zIndex: 1,
          padding: "40px 36px 36px",
          maxWidth: 500, width: "100%",
          background: "rgba(20,8,8,0.82)",
          border: `1.5px solid ${C.redBorder}`,
          borderRadius: 20,
          backdropFilter: "blur(12px)",
          boxShadow: `0 0 60px rgba(229,53,53,0.10), 0 8px 40px rgba(0,0,0,0.5)`,
          margin: "0 20px",
        }}>

          {/* Badge de alerta superior */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: C.redSoft,
            border: `1px solid ${C.redBorder}`,
            borderRadius: 20, padding: "5px 14px",
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 11 }}>🔴</span>
            <span style={{
              fontFamily: FB, fontSize: 11, fontWeight: 700,
              letterSpacing: 2.5, color: C.red, textTransform: "uppercase",
            }}>
              Acceso Denegado
            </span>
            {/* Puntos parpadeantes */}
            <span style={{ display: "flex", gap: 3, marginLeft: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} className="ua-dot" style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: C.red, display: "inline-block",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </span>
          </div>

          {/* Ícono candado */}
          <div className="ua-lock" style={{
            width: 90, height: 90, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(229,53,53,0.18) 0%, rgba(176,30,30,0.08) 100%)`,
            border: `2px solid rgba(229,53,53,0.40)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42, marginBottom: 22,
          }}>
            🔒
          </div>

          {/* Código */}
          <div style={{
            fontFamily: FB, fontSize: 11, fontWeight: 600,
            letterSpacing: 3, color: C.red,
            textTransform: "uppercase", marginBottom: 10, opacity: 0.7,
          }}>
            Error 403
          </div>

          {/* Título */}
          <h1 style={{
            fontFamily: FD,
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 700, color: C.cream,
            margin: "0 0 14px 0", letterSpacing: "0.3px",
          }}>
            Acceso no autorizado
          </h1>

          {/* Separador rojo */}
          <div style={{
            width: 48, height: 2,
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            marginBottom: 16, borderRadius: 2,
          }} />

          {/* Mensaje */}
          {isLoggedIn ? (
            <p style={{
              fontFamily: FB, fontSize: 14, color: C.creamSub,
              opacity: 0.75, margin: "0 0 8px 0", lineHeight: 1.65,
            }}>
              {userName
                ? <><strong style={{ color: C.cream }}>{userName}</strong>, tu cuenta</>
                : "Tu cuenta"
              }{" "}
              no tiene los permisos para acceder a esta sección.
            </p>
          ) : (
            <p style={{
              fontFamily: FB, fontSize: 14, color: C.creamSub,
              opacity: 0.75, margin: "0 0 8px 0", lineHeight: 1.65,
            }}>
              Necesitas una cuenta con los permisos adecuados para ver este contenido.
            </p>
          )}

          <p style={{
            fontFamily: FB, fontSize: 12, color: C.creamSub,
            opacity: 0.38, margin: "0 0 24px 0", lineHeight: 1.5,
          }}>
            Si crees que esto es un error, contacta al administrador.
          </p>

          {/* Bloque de advertencia */}
          <div style={{
            width: "100%",
            background: C.redSoft,
            border: `1px solid ${C.redBorder}`,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 28,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>⛔</span>
            <span style={{
              fontFamily: FB, fontSize: 12, color: C.red,
              opacity: 0.9, textAlign: "left", lineHeight: 1.55,
            }}>
              Esta es una zona restringida. El acceso no autorizado puede derivar
              en la suspensión de tu cuenta.
            </span>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => navigate(-1)}
              onMouseEnter={() => setHoverBack(true)}
              onMouseLeave={() => setHoverBack(false)}
              style={{
                padding: "10px 24px", borderRadius: 9,
                border: `1.5px solid ${hoverBack ? C.red : "rgba(229,53,53,0.20)"}`,
                background: hoverBack ? "rgba(229,53,53,0.10)" : "transparent",
                color: hoverBack ? C.red : C.creamSub,
                fontFamily: FB, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s ease",
              }}
            >
              ← Volver atrás
            </button>

            <button
              onClick={handleGoLogin}
              onMouseEnter={() => setHoverLogin(true)}
              onMouseLeave={() => setHoverLogin(false)}
              style={{
                padding: "10px 24px", borderRadius: 9, border: "none",
                background: hoverLogin
                  ? `linear-gradient(135deg, ${C.red}, ${C.redDark})`
                  : `linear-gradient(135deg, rgba(229,53,53,0.9), ${C.redDark})`,
                color: "#fff",
                fontFamily: FB, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s ease",
                boxShadow: hoverLogin
                  ? `0 6px 22px rgba(229,53,53,0.45)`
                  : `0 3px 14px rgba(229,53,53,0.25)`,
              }}
            >
              {isLoggedIn ? "Cambiar cuenta" : "Iniciar sesión"}
            </button>
          </div>

          {/* Firma */}
          <div style={{
            marginTop: 36,
            display: "flex", alignItems: "center", gap: 10, opacity: 0.2,
          }}>
            <div style={{ width: 32, height: 1, background: C.creamSub }} />
            <span style={{ fontFamily: FD, fontSize: 11, color: C.creamSub, letterSpacing: 2 }}>
              NU★B STUDIO
            </span>
            <div style={{ width: 32, height: 1, background: C.creamSub }} />
          </div>

        </div>
      </div>
    </>
  );
}