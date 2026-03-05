// src/pages/public/Login.tsx
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2,
  AlertCircle, CheckCircle2, Palette, Camera,
  Frame, Shield, FileText, ArrowLeft
} from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#0f0c1a",
  border: "rgba(255,255,255,0.1)", text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
};

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje("");
    if (!formData.correo || !formData.contrasena) {
      showMessage("Por favor completa todos los campos", true); return;
    }
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
      const error = err as LoginError;
      if (error.status === 0) { showMessage(error.error?.message || "No se pudo conectar", true); }
      else if (error.status === 403 && error.error?.blocked) {
        const m = error.error.minutesRemaining || error.error.minutesBlocked || 5;
        showMessage(`🔒 Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`, true);
      } else if (error.status === 401 && error.error?.attemptsRemaining !== undefined) {
        const r = error.error.attemptsRemaining;
        showMessage(r === 0 ? "🔒 Has excedido el límite de intentos." : `❌ Contraseña incorrecta. Te quedan ${r} intento${r > 1 ? "s" : ""}.`, true);
      } else if (error.status === 404) {
        showMessage("Usuario no encontrado", true);
      } else {
        showMessage(error.error?.message || "Error al iniciar sesión", true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* ── Orbs de fondo ── */}
      <div style={{ position: "fixed", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, right: -120, width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "45%", left: "28%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* ── Botón flotante fijo: Volver al inicio ── */}
      <button
        onClick={() => navigate("/")}
        className="btn-back-home"
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(15, 12, 26, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all .22s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,132,14,0.15)";
          el.style.borderColor = `${C.orange}50`;
          el.style.color = C.orange;
          el.style.transform = "translateX(-2px)";
          el.style.boxShadow = `0 4px 24px ${C.orange}25`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(15, 12, 26, 0.85)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
          el.style.color = "rgba(255,255,255,0.7)";
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
        position: "relative" 
      }}>
        <div style={{ maxWidth: 400 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 28 }} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.1, margin: "0 0 16px" }}>
            Descubre el arte<br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              de la Huasteca
            </span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 40px" }}>
            Arte auténtico de nuestra región. Fotografías, esculturas y pinturas de artistas locales con entrega a todo México.
          </p>

          {[
            { icon: <Palette size={18} color={C.orange} />, title: "Galería de artistas locales", desc: "Obras originales de la Huasteca Hidalguense" },
            { icon: <Camera size={18} color={C.pink} />, title: "Obras originales y editables", desc: "Personaliza el tamaño y formato de tu obra" },
            { icon: <Frame size={18} color={C.gold} />, title: "Entrega con marco personalizado", desc: "Enmarcado profesional incluido en tu pedido" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
            background: "rgba(255,255,255,0.03)", 
            border: "1px solid rgba(255,255,255,0.08)", 
            borderRadius: 20, 
            padding: "28px 24px",
            backdropFilter: "blur(20px)" 
          }}>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 800, 
              color: C.text, 
              margin: "0 0 4px",
              textAlign: "center"
            }}>Iniciar sesión</h2>
            <p style={{ 
              fontSize: 13, 
              color: C.muted, 
              margin: "0 0 24px",
              textAlign: "center"
            }}>Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
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
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
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
                      border: mostrarContrasena ? `1.5px solid ${C.orange}` : "1.5px solid rgba(255,255,255,0.2)"
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
                      background: "rgba(0,0,0,0.3)",
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
                      e.currentTarget.style.background = "rgba(255,132,14,0.2)";
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
                  background: isError ? "rgba(204,89,173,0.12)" : "rgba(74,222,128,0.12)", 
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
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: C.muted }}>o</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: "0 0 8px" }}>
              ¿No tienes cuenta?{" "}
              <span onClick={() => navigate("/register")} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Crear una cuenta</span>
            </p>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
              ¿Eres artista?{" "}
              <span onClick={() => navigate("/registro-artista")} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Regístrate aquí</span>
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>
              Al iniciar sesión aceptas nuestros
            </p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted, cursor: "pointer" }}><FileText size={12} /> Términos y Condiciones</span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted, cursor: "pointer" }}><Shield size={12} /> Política de Privacidad</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
              © {currentYear} Altar Studio. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
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
  border: "1.5px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.3)",
  color: "#ffffff", 
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none", 
  transition: "border .15s, background .15s",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: "linear-gradient(135deg, #FF840E, #CC59AD)",
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 8px 24px rgba(255,132,14,0.3)",
};