// src/pages/public/VerifyEmailCode.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", bg: "#F9F8FC",
  text: "#14121E", muted: "#9896A8",
};

export default function VerifyEmailCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);

  const correo = location.state?.correo
    || localStorage.getItem('temp_correo_verificacion')
    || localStorage.getItem('temp_correo_2fa');

  useEffect(() => {
    if (!correo) navigate('/login');
  }, [correo, navigate]);

  const handleChange = (e: { target: HTMLInputElement }) => {
    const value = e.target.value.replaceAll(/\D/g, '').slice(0, 6);
    setCodigo(value);
    setMensaje("");
  };

  const showMessage = (msg: string, error: boolean) => {
    setMensaje(msg);
    setIsError(error);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setMensaje("");

    if (codigo.length !== 6) {
      showMessage("El código debe tener 6 dígitos", true);
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyEmail(correo ?? '', codigo);
      showMessage("¡Cuenta verificada! Redirigiendo al login... ✓", false);
      setTimeout(() => {
        localStorage.removeItem('temp_correo_verificacion');
        localStorage.removeItem('temp_correo_2fa');
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.status === 401) {
        showMessage("Código incorrecto. Intenta de nuevo.", true);
      } else if (err.status === 404) {
        showMessage("Código no encontrado o expirado.", true);
      } else {
        showMessage(err.error?.message || "Error al verificar el código", true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviar = async () => {
    try {
      showMessage("Reenviando código...", false);
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });
      showMessage("Código reenviado. Revisa tu correo 📧", false);
    } catch {
      showMessage("Error al reenviar el código", true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* Orbs */}
      <div style={{ position: "fixed", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, right: -120, width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* Botón volver */}
      <button
        onClick={() => navigate('/login')}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
          border: "1px solid #E6E4EF",
          color: "#5A5870", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)", transition: "all .22s ease",
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(232,100,12,0.08)"; el.style.borderColor = "rgba(232,100,12,0.30)"; el.style.color = C.orange; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.97)"; el.style.borderColor = "#E6E4EF"; el.style.color = "#5A5870"; }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Volver al login
      </button>

      {/* Panel izquierdo */}
      <div className="verify-banner" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div style={{ maxWidth: 400 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 28 }} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.1, margin: "0 0 16px" }}>
            Casi listo,<br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              verifica tu cuenta
            </span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 40px" }}>
            Te enviamos un código de 6 dígitos a tu correo. Ingrésalo para activar tu cuenta y comenzar a explorar.
          </p>

          {[
            { icon: <Mail size={18} color={C.orange} />, title: "Revisa tu bandeja de entrada", desc: "El código llega en menos de un minuto" },
            { icon: <ShieldCheck size={18} color={C.pink} />, title: "Código de un solo uso", desc: "Expira en 24 horas por seguridad" },
            { icon: <CheckCircle2 size={18} color={C.gold} />, title: "Una vez verificado", desc: "Podrás acceder a toda la galería" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0,0,0,0.03)", border: "1px solid #E6E4EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="verify-form-panel" style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo mobile */}
          <div className="verify-mobile-logo" style={{ display: "none", justifyContent: "center", marginBottom: 28 }}>
            <img src={logoImg} alt="Nu-B Studio" style={{ height: 44 }} />
          </div>

          {/* Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E6E4EF", borderRadius: 20, padding: "36px 32px" }}>

            {/* Icono central */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}20, ${C.pink}20)`, border: `1.5px solid ${C.orange}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={28} color={C.orange} />
              </div>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px", textAlign: "center" }}>Verifica tu email</h2>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", textAlign: "center", lineHeight: 1.6 }}>
              Ingresa el código de 6 dígitos enviado a<br />
              <span style={{ color: C.orange, fontWeight: 600 }}>{correo}</span>
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Input código */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5A5870", marginBottom: 8 }}>
                  <Mail size={14} /> Código de verificación
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={handleChange}
                  placeholder="000000"
                  disabled={isLoading}
                  maxLength={6}
                  required
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "14px", borderRadius: 10,
                    border: `1.5px solid ${codigo.length === 6 ? C.orange : "#E6E4EF"}`,
                    background: "#FFFFFF",
                    color: "#14121E", fontSize: 28,
                    fontFamily: "'Outfit', sans-serif",
                    outline: "none", textAlign: "center",
                    letterSpacing: "12px", fontWeight: 700,
                    transition: "border .15s",
                  }}
                />
                {/* Indicador de dígitos */}
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                  {[0,1,2,3,4,5].map(n => (
                    <div key={n} style={{ width: 8, height: 8, borderRadius: "50%", background: n < codigo.length ? C.orange : "#E6E4EF", transition: "background .15s" }} />
                  ))}
                </div>
              </div>

              {/* Mensaje */}
              {mensaje && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: isError ? "rgba(168,59,144,0.08)" : "rgba(14,138,80,0.06)", border: `1px solid ${isError ? "rgba(168,59,144,0.30)" : "rgba(14,138,80,0.25)"}`, color: isError ? C.pink : "#0E8A50" }}>
                  {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  {mensaje}
                </div>
              )}

              {/* Botón verificar */}
              <button
                type="submit"
                disabled={isLoading || codigo.length !== 6}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "13px 20px", borderRadius: 12,
                  background: codigo.length === 6 ? `linear-gradient(135deg, ${C.orange}, ${C.pink})` : "rgba(0,0,0,0.05)",
                  border: "none", color: codigo.length === 6 ? "white" : "#9896A8",
                  fontSize: 15, fontWeight: 700, cursor: isLoading || codigo.length !== 6 ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: codigo.length === 6 ? "0 8px 24px rgba(232,100,12,0.20)" : "none",
                  transition: "all .2s",
                }}
              >
                {isLoading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</>
                  : <><ShieldCheck size={16} /> Verificar cuenta</>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
              <span style={{ fontSize: 12, color: C.muted }}>o</span>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
            </div>

            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
              ¿No recibiste el código?{" "}
              <button onClick={handleReenviar} style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                Reenviar código
              </button>
            </p>
          </div>

          <p style={{ fontSize: 11, color: "#9896A8", textAlign: "center", marginTop: 16 }}>
            © {new Date().getFullYear()} Altar Studio. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .verify-banner { display: none !important; }
          .verify-form-panel { width: 100% !important; padding: 32px 20px !important; }
          .verify-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}