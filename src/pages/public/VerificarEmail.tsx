// src/pages/public/VerificarEmail.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Mail } from "lucide-react";
import logoImg from "../../assets/images/logo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  blue: "#79AAF5", bg: "#0f0c1a", text: "#ffffff",
  muted: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.08)",
};

type Estado = "cargando" | "exitoso" | "error" | "expirado";

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState("");
  const [correoReenvio, setCorreoReenvio] = useState("");
  const [reenvioLoading, setReenvioLoading] = useState(false);
  const [reenvioExitoso, setReenvioExitoso] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("No se encontró el token de verificación.");
      return;
    }
    verificar();
  }, [token]);

  const verificar = async () => {
    setEstado("cargando");
    try {
      const res = await fetch(`${API_URL}/api/auth/verificar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEstado("exitoso");
      } else if (data.expired) {
        setEstado("expirado");
        setCorreoReenvio(data.correo || "");
      } else {
        setEstado("error");
        setMensaje(data.message || "No se pudo verificar el correo.");
      }
    } catch {
      setEstado("error");
      setMensaje("Error de conexión. Intenta de nuevo.");
    }
  };

  const reenviar = async () => {
    if (!correoReenvio) return;
    setReenvioLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reenviar-activacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correoReenvio }),
      });
      const data = await res.json();
      if (res.ok && data.success) setReenvioExitoso(true);
    } catch {
      // silencioso — respuesta genérica por seguridad
    } finally {
      setReenvioLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Outfit', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", position: "relative", overflow: "hidden",
    }}>
      {/* orbs */}
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}15, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative" }}>
        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 44 }} />
        </div>

        {/* card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "40px 36px",
          backdropFilter: "blur(20px)",
          textAlign: "center",
        }}>

          {/* ── CARGANDO ── */}
          {estado === "cargando" && (
            <>
              <div style={iconWrap("#8D4CCD")}>
                <Loader2 size={32} color="white" style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <h2 style={titleStyle}>Verificando tu correo...</h2>
              <p style={subtitleStyle}>Un momento, estamos confirmando tu cuenta.</p>
            </>
          )}

          {/* ── EXITOSO ── */}
          {estado === "exitoso" && (
            <>
              <div style={iconWrap("#22C97A", `0 0 40px rgba(34,201,122,0.35)`)}>
                <CheckCircle2 size={32} color="white" strokeWidth={2} />
              </div>
              <h2 style={titleStyle}>¡Correo verificado!</h2>
              <p style={subtitleStyle}>
                Tu cuenta está activa. El equipo de{" "}
                <strong style={{ color: C.orange }}>Nu-B Studio</strong>{" "}
                revisará tu solicitud y te notificará por correo cuando seas aprobado.
              </p>

              <div style={{
                background: "rgba(34,201,122,0.06)",
                border: "1px solid rgba(34,201,122,0.2)",
                borderRadius: 12, padding: "14px 18px",
                margin: "24px 0", textAlign: "left",
              }}>
                {[
                  "Tu solicitud está en revisión (hasta 48 hrs)",
                  "Recibirás un correo cuando seas aprobado",
                  "Una vez aprobado podrás subir tus obras",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C97A", flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>

              <button onClick={() => navigate("/login")} style={btnPrimary}>
                Ir al inicio de sesión
              </button>
            </>
          )}

          {/* ── EXPIRADO ── */}
          {estado === "expirado" && (
            <>
              <div style={iconWrap(C.orange, `0 0 40px rgba(255,132,14,0.3)`)}>
                <RefreshCw size={32} color="white" strokeWidth={2} />
              </div>
              <h2 style={titleStyle}>Enlace expirado</h2>
              <p style={subtitleStyle}>
                Este enlace de verificación ya no es válido. Podemos enviarte uno nuevo.
              </p>

              {!reenvioExitoso ? (
                <>
                  {correoReenvio && (
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: "12px 16px",
                      margin: "20px 0", fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Mail size={15} color={C.orange} />
                      {correoReenvio}
                    </div>
                  )}
                  <button onClick={reenviar} disabled={reenvioLoading} style={btnPrimary}>
                    {reenvioLoading
                      ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
                      : "Reenviar enlace de verificación"
                    }
                  </button>
                </>
              ) : (
                <div style={{
                  background: "rgba(34,201,122,0.08)",
                  border: "1px solid rgba(34,201,122,0.2)",
                  borderRadius: 12, padding: "16px",
                  marginTop: 20, fontSize: 14,
                  color: "#22C97A",
                }}>
                  <CheckCircle2 size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Enlace enviado. Revisa tu correo.
                </div>
              )}
            </>
          )}

          {/* ── ERROR ── */}
          {estado === "error" && (
            <>
              <div style={iconWrap(C.pink, `0 0 40px rgba(204,89,173,0.3)`)}>
                <XCircle size={32} color="white" strokeWidth={2} />
              </div>
              <h2 style={titleStyle}>No se pudo verificar</h2>
              <p style={subtitleStyle}>{mensaje || "El enlace es inválido o ya fue utilizado."}</p>

              <button onClick={() => navigate("/registro-artista")} style={{ ...btnPrimary, marginBottom: 12 }}>
                Volver al registro
              </button>
              <button onClick={() => navigate("/login")} style={btnSecondary}>
                Ir al inicio de sesión
              </button>
            </>
          )}

        </div>

        <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20 }}>
          ¿Necesitas ayuda?{" "}
          <span style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>
            Contacta al equipo
          </span>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ── helpers de estilo ──────────────────────────────────────
const iconWrap = (color: string, shadow?: string): React.CSSProperties => ({
  width: 72, height: 72, borderRadius: "50%",
  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 auto 24px",
  boxShadow: shadow || `0 0 32px ${color}40`,
});

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, color: "#ffffff",
  margin: "0 0 10px", fontFamily: "'Outfit', sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14, color: "rgba(255,255,255,0.55)",
  lineHeight: 1.7, margin: "0 0 4px",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: "linear-gradient(135deg, #FF840E, #CC59AD)",
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 8px 24px rgba(255,132,14,0.3)", marginTop: 8,
};

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "'Outfit', sans-serif", marginTop: 8,
};