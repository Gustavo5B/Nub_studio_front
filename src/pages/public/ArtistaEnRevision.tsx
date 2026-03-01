// src/pages/public/ArtistaEnRevision.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, Mail, LogOut, Palette, CheckCircle2, Circle } from "lucide-react";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#0f0c1a",
  border: "rgba(255,255,255,0.1)", text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
};

export default function ArtistaEnRevision() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("userName") || "Artista";
  const correo = localStorage.getItem("userEmail") || "";
  const [dots, setDots] = useState(".");

  // Animación de puntos suspensivos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const pasos = [
    { label: "Solicitud enviada", done: true },
    { label: "En revisión por el equipo", done: false, active: true },
    { label: "Aprobación y activación", done: false },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Outfit', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 20px", position: "relative", overflow: "hidden"
    }}>

      {/* Orbs de fondo */}
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}15, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}08, transparent 70%)`, pointerEvents: "none" }} />

      {/* Logo */}
      <img src={logoImg} alt="Nu-B Studio" style={{ height: 48, marginBottom: 40 }} />

      {/* Card principal */}
      <div style={{
        width: "100%", maxWidth: 520,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "44px 40px",
        backdropFilter: "blur(20px)",
        textAlign: "center",
      }}>

        {/* Ícono animado */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}25, ${C.orange}15)`,
          border: `2px solid ${C.gold}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
          boxShadow: `0 0 40px ${C.gold}20`,
          animation: "pulse 2.5s ease-in-out infinite",
        }}>
          <Clock size={38} color={C.gold} strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "0 0 10px", lineHeight: 1.2 }}>
          Tu perfil está en revisión{dots}
        </h1>

        <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.7, margin: "0 0 32px" }}>
          Hola <span style={{ color: C.orange, fontWeight: 700 }}>{nombre}</span>, gracias por unirte a Nu-B Studio.<br />
          Nuestro equipo está revisando tu solicitud para verificar que cumple con los estándares de la galería.
        </p>

        {/* Pasos */}
        <div style={{ textAlign: "left", marginBottom: 32 }}>
          {pasos.map((paso, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: i < pasos.length - 1 ? 0 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {paso.done
                  ? <CheckCircle2 size={22} color="#4ADE80" />
                  : paso.active
                    ? <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        border: `2px solid ${C.gold}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
                      </div>
                    : <Circle size={22} color="rgba(255,255,255,0.2)" />
                }
                {i < pasos.length - 1 && (
                  <div style={{ width: 2, height: 28, background: paso.done ? "#4ADE8040" : "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                )}
              </div>
              <span style={{
                fontSize: 14, fontWeight: paso.active ? 700 : 500,
                color: paso.done ? "#4ADE80" : paso.active ? C.gold : "rgba(255,255,255,0.3)",
                paddingBottom: i < pasos.length - 1 ? 28 : 0,
              }}>
                {paso.label}
              </span>
            </div>
          ))}
        </div>

        {/* Info correo */}
        <div style={{
          background: "rgba(255,193,16,0.06)",
          border: `1px solid ${C.gold}25`,
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "flex-start", gap: 12,
          textAlign: "left", marginBottom: 32,
        }}>
          <Mail size={18} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.gold, margin: "0 0 4px" }}>
              Te notificaremos por correo
            </p>
            <p style={{ fontSize: 12.5, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              Enviaremos la resolución a <strong style={{ color: "rgba(255,255,255,0.7)" }}>{correo}</strong>.<br />
              El proceso suele tardar entre <strong style={{ color: "rgba(255,255,255,0.7)" }}>1 y 3 días hábiles</strong>.
            </p>
          </div>
        </div>

        {/* Qué pasa después */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "16px 20px",
          textAlign: "left", marginBottom: 32,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <Palette size={15} color={C.pink} /> ¿Qué pasa después?
          </p>
          {[
            "Recibirás un correo con la resolución",
            "Si eres aprobado, podrás subir tus obras",
            "Tus obras aparecerán en la galería pública",
            "Ganarás comisiones por cada venta",
          ].map((item, i) => (
            <p key={i} style={{ fontSize: 12.5, color: C.muted, margin: "0 0 6px", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: C.orange, fontWeight: 700, flexShrink: 0 }}>→</span> {item}
            </p>
          ))}
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            transition: "all .2s ease",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(204,89,173,0.1)";
            el.style.borderColor = `${C.pink}40`;
            el.style.color = C.pink;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(255,255,255,0.05)";
            el.style.borderColor = "rgba(255,255,255,0.1)";
            el.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>
        © {new Date().getFullYear()} Nu-B Studio · Galería de Arte Huasteco
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.97); }
        }
      `}</style>
    </div>
  );
}