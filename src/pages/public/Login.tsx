// src/pages/public/Login.tsx
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2,
  AlertCircle, CheckCircle2, Palette, Camera,
  Frame, Shield, FileText, ArrowLeft
} from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

import heroImg from "../../assets/images/trabajo.jpg";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", bg: "#F9F8FC",
  border: "#E6E4EF", text: "#14121E",
  muted: "#9896A8",
};

// ── Sanitización y validación frontend (RASP) ────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string): boolean => xssPattern.test(v) || sqliPattern.test(v);
// ─────────────────────────────────────────────────────────────

interface LoginError {
  status?: number;
  error?: {
    blocked?: boolean;
    minutesRemaining?: number;
    minutesBlocked?: number;
    unlockTime?: string;
    attemptsRemaining?: number;
    totalAttempts?: number;
    message?: string;
    requiresVerification?: boolean;
  };
}

export default function Login() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({ correo: "", contrasena: "" });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje("");
  };

  const showMessage = (msg: string, error: boolean) => {
    setMensaje(msg); setIsError(error);
  };

  const validateLoginInput = (): string | null => {
    if (!formData.correo || !formData.contrasena) return "Por favor completa todos los campos";
    if (hasSuspiciousContent(formData.correo) || hasSuspiciousContent(formData.contrasena)) return "Los datos ingresados contienen contenido no permitido";
    return null;
  };

  const handleLoginError = (err: unknown) => {
    const error = err as LoginError;
    if (error.status === 0) {
      showMessage(error.error?.message || "No se pudo conectar", true);
    } else if (error.status === 403 && error.error?.blocked) {
      const m = error.error.minutesRemaining || error.error.minutesBlocked || 5;
      showMessage(`🔒 Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`, true);
    } else if (error.status === 401 && error.error?.attemptsRemaining !== undefined) {
      const r = error.error.attemptsRemaining;
      const plural = r > 1 ? "s" : "";
      const msg = r === 0 ? "🔒 Has excedido el límite de intentos." : `❌ Contraseña incorrecta. Te quedan ${r} intento${plural}.`;
      showMessage(msg, true);
    } else if (error.status === 404) {
      showMessage("Usuario no encontrado", true);
    } else {
      showMessage(error.error?.message || "Error al iniciar sesión", true);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setMensaje("");
    const validationError = validateLoginInput();
    if (validationError) { showMessage(validationError, true); return; }

    setIsLoading(true);
    try {
      const response = await authService.login(formData.correo, formData.contrasena);

      if (response.blocked) {
        const m = response.minutesRemaining || response.minutesBlocked || 5;
        showMessage(`🔒 Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`, true);
        setIsLoading(false); return;
      }
      if (response.requiresVerification) {
        showMessage("Cuenta pendiente de verificación. Revisa tu correo 📧", true);
        setIsLoading(false); return;
      }
      if (response.requires2FA) {
        showMessage("Credenciales correctas. Verificando 2FA...", false);
        localStorage.setItem("temp_correo_2fa", response.correo || formData.correo);
        setTimeout(() => {
          navigate(response.metodo_2fa === "TOTP" ? "/two-factor-verify" : "/verify-email-code", {
            state: { correo: response.correo || formData.correo, metodo_2fa: response.metodo_2fa }
          });
        }, 1500);
        setIsLoading(false); return;
      }

      const token = response.access_token || response.token;
      if (token) { localStorage.setItem("access_token", token); localStorage.setItem("token", token); }
      if (response.usuario) {
        localStorage.setItem("userEmail", response.usuario.correo);
        localStorage.setItem("userName", response.usuario.nombre);
        localStorage.setItem("userId", response.usuario.id.toString());
        localStorage.setItem("userRol", response.usuario.rol || "cliente");
      }
      localStorage.setItem("isLoggedIn", "true");
      showMessage("Inicio de sesión exitoso ✓", false);
      setTimeout(() => {
        const rol = response.usuario?.rol;
        const artista_estado = response.usuario?.artista_estado;
        if (rol === "admin") navigate("/admin");
        else if (rol === "artista" && artista_estado === "pendiente") navigate("/artista/pendiente");
        else if (rol === "artista") navigate("/artista/dashboard");
        else navigate("/");
      }, 1000);
    } catch (err) {
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* ── Orbs de fondo ── */}
      <div style={{ position: "fixed", top: -150, left: -150, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}30, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 660, height: 660, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}28, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "45%", left: "28%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "15%", right: "10%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: "none" }} />

      {/* ── Botón flotante fijo: Volver al inicio ── */}
      <button
        onClick={() => navigate("/")}
        className="btn-back-home"
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(255,255,255,0.90)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.08)",
          color: "#5A5870", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all .22s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(232,100,12,0.08)";
          el.style.borderColor = `${C.orange}50`;
          el.style.color = C.orange;
          el.style.transform = "translateX(-2px)";
          el.style.boxShadow = `0 4px 24px ${C.orange}25`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,255,255,0.90)";
          el.style.borderColor = "rgba(0,0,0,0.08)";
          el.style.color = "#5A5870";
          el.style.transform = "translateX(0)";
          el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Volver al inicio
      </button>

      {/* ── Panel izquierdo (50%) ── */}
      <div className="login-banner-panel" style={{
        flex: "0 0 50%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Rainbow line at top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${C.purple}, ${C.pink}, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple})`,
          zIndex: 3,
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(145deg, rgba(96,40,170,0.08) 0%, rgba(232,100,12,0.06) 60%, rgba(255,255,255,0.96) 100%)`,
          zIndex: 0,
        }} />

        {/* Hero background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.07,
          zIndex: 0,
        }} />

        {/* Content */}
        <div style={{ maxWidth: 400, position: "relative", zIndex: 2 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 28 }} />
          <h1 style={{ fontSize: 42, fontWeight: 900, color: C.text, lineHeight: 1.08, margin: "0 0 16px" }}>
            Descubre el arte<br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              de la Huasteca
            </span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 40px" }}>
            Arte auténtico de nuestra región. Fotografías, esculturas y pinturas de artistas locales con entrega a todo México.
          </p>

          {[
            { icon: <Palette size={18} color={C.orange} />, title: "Galería de artistas locales", desc: "Obras originales de la Huasteca Hidalguense", accentColor: C.orange, bg: "rgba(232,100,12,0.08)", brd: "rgba(232,100,12,0.20)" },
            { icon: <Camera size={18} color={C.pink} />, title: "Obras originales y editables", desc: "Personaliza el tamaño y formato de tu obra", accentColor: C.pink, bg: "rgba(168,59,144,0.08)", brd: "rgba(168,59,144,0.20)" },
            { icon: <Frame size={18} color={C.gold} />, title: "Entrega con marco personalizado", desc: "Enmarcado profesional incluido en tu pedido", accentColor: C.gold, bg: "rgba(168,112,6,0.08)", brd: "rgba(168,112,6,0.22)" },
          ].map(({ icon, title, desc, accentColor, bg, brd }) => (
            <div key={title} style={{
              display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20,
              borderLeft: `3px solid ${accentColor}`,
              paddingLeft: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: bg,
                border: `1px solid ${brd}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{desc}</div>
              </div>
            </div>
          ))}

          {/* Stats row */}
          <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
            {[{ n: "500+", l: "Obras" }, { n: "50+", l: "Artistas" }, { n: "98%", l: "Satisfacción" }].map(({ n, l }) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, fontFamily: "'Outfit', sans-serif" }}>{n}</div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (40%) ── */}
      <div className="login-form-panel" style={{
        flex: "0 0 40%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        position: "relative"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 380
        }}>

          <div className="login-mobile-logo" style={{ display: "none", justifyContent: "center", marginBottom: 28 }}>
            <img src={logoImg} alt="Nu-B Studio" style={{ height: 44 }} />
          </div>

          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E6E4EF",
            borderRadius: 20,
            padding: "32px 28px",
            backdropFilter: "blur(20px)"
          }}>
            <h2 style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.text,
              margin: "0 0 4px",
              textAlign: "center",
              fontFamily: "'Outfit', sans-serif",
            }}>Iniciar sesión</h2>
            <p style={{
              fontSize: 13,
              color: C.muted,
              margin: "0 0 24px",
              textAlign: "center"
            }}>Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5A5870", marginBottom: 6 }}>
                  <Mail size={15} /> Correo electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5A5870", marginBottom: 6 }}>
                  <Lock size={15} /> Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrarContrasena ? "text" : "password"}
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    style={{
                      ...inputStyle,
                      paddingRight: 44,
                      border: mostrarContrasena ? `1.5px solid ${C.orange}` : "1.5px solid #E6E4EF"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContrasena(p => !p)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.05)",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: mostrarContrasena ? C.orange : C.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 6,
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(232,100,12,0.10)";
                      e.currentTarget.style.color = C.orange;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                      e.currentTarget.style.color = mostrarContrasena ? C.orange : C.muted;
                    }}
                  >
                    {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{
                textAlign: "center",
                marginTop: -4
              }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {mensaje && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isError ? "rgba(168,59,144,0.08)" : "rgba(14,138,80,0.08)",
                  border: `1px solid ${isError ? C.pink : "#4ADE80"}`,
                  fontSize: 13,
                  color: isError ? C.pink : "#4ADE80",
                  textAlign: "center"
                }}>
                  {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                  {mensaje}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                style={{ ...btnPrimary, marginTop: 2, opacity: isLoading ? 0.8 : 1 }}>
                {isLoading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Cargando...</>
                  : <><LogIn size={16} /> Iniciar sesión</>
                }
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
              <span style={{ fontSize: 12, color: C.muted }}>o</span>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
            </div>

            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: "0 0 8px" }}>
              ¿No tienes cuenta?{" "}
              <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Crear una cuenta</button>
            </p>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
              ¿Eres artista?{" "}
              <button onClick={() => navigate("/registro-artista")} style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Regístrate aquí</button>
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#9896A8", margin: "0 0 6px" }}>
              Al iniciar sesión aceptas nuestros
            </p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted, cursor: "pointer" }}><FileText size={12} /> Términos y Condiciones</span>
              <span style={{ color: "#9896A8", fontSize: 12 }}>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted, cursor: "pointer" }}><Shield size={12} /> Política de Privacidad</span>
            </div>
            <p style={{ fontSize: 11, color: "#9896A8", marginTop: 8 }}>
              © {currentYear} Altar Studio. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-14px) rotate(-0.5deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1.5deg)} 50%{transform:translateY(-11px) rotate(0.5deg)} }
        @media (max-width: 768px) {
          .login-banner-panel { display: none !important; }
          .login-form-panel { width: 100% !important; padding: 32px 20px !important; }
          .login-mobile-logo { display: flex !important; }
          .btn-back-home span { display: none; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #E6E4EF",
  background: "#FFFFFF",
  color: "#14121E",
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border .15s, background .15s",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: "linear-gradient(135deg, #E8640C, #A83B90)",
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 8px 24px rgba(232,100,12,0.25)",
};