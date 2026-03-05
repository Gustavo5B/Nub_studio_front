// src/pages/public/Register.tsx
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, UserPlus, Loader2,
  AlertCircle, CheckCircle2, Palette, Camera,
  Frame, User, ArrowLeft, Check
} from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

// ── Paleta idéntica al sistema ────────────────────────────
const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#0f0c1a",
  text: "#ffffff", muted: "rgba(255,255,255,0.5)",
};

interface PasswordReq { text: string; met: boolean; }
interface RegisterError {
  status?: number;
  error?: { message?: string; errors?: string[]; };
}

export default function Register() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({ nombre: "", correo: "", contrasena: "" });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [passReqs, setPassReqs] = useState<PasswordReq[]>([
    { text: "Mínimo 8 caracteres",           met: false },
    { text: "Una letra mayúscula",            met: false },
    { text: "Una letra minúscula",            met: false },
    { text: "Un número",                      met: false },
    { text: "Un carácter especial (@$!%*?&#)", met: false },
  ]);

  const validatePassword = (p: string) => setPassReqs([
    { text: "Mínimo 8 caracteres",            met: p.length >= 8 },
    { text: "Una letra mayúscula",            met: /[A-Z]/.test(p) },
    { text: "Una letra minúscula",            met: /[a-z]/.test(p) },
    { text: "Un número",                      met: /[0-9]/.test(p) },
    { text: "Un carácter especial (@$!%*?&#)", met: /[@$!%*?&#]/.test(p) },
  ]);

  const metCount = passReqs.filter(r => r.met).length;
  const isPasswordValid = metCount === 5;
  const strengthColor = ["transparent", C.pink, "#F59E0B", C.gold, "#4ADE80", "#4ADE80"][metCount];
  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte", "Fuerte"][metCount];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    if (name === "contrasena") validatePassword(value);
    setMensaje("");
  };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setMensaje("");
  if (!aceptoTerminos) { setMensaje("Debes aceptar los Términos y Condiciones"); setIsError(true); return; }
  if (!formData.nombre || !formData.correo || !formData.contrasena) { setMensaje("Todos los campos son obligatorios"); setIsError(true); return; }
  if (formData.nombre.length < 2) { setMensaje("El nombre debe tener al menos 2 caracteres"); setIsError(true); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) { setMensaje("El formato del correo no es válido"); setIsError(true); return; }
  if (!isPasswordValid) { setMensaje("La contraseña no cumple todos los requisitos"); setIsError(true); return; }

  setIsLoading(true);
  try {
    const response = await authService.register(formData.nombre, formData.correo, formData.contrasena, true);

    if (response.requiresVerification) {
      localStorage.setItem('temp_correo_verificacion', formData.correo);
      setMensaje("¡Cuenta creada! Revisa tu correo para verificarla 📧");
      setIsError(false);
      setTimeout(() => navigate("/verify-email-code", {
        state: { correo: formData.correo }
      }), 2000);
    } else {
      setMensaje("¡Cuenta creada! Redirigiendo al inicio de sesión...");
      setIsError(false);
      setTimeout(() => navigate("/login"), 2000);
    }
  } catch (err) {
    const error = err as RegisterError;
    if (error.status === 400) {
      setMensaje(error.error?.errors?.join(", ") || error.error?.message || "El correo ya está registrado");
    } else if (error.status === 0) {
      setMensaje("No se pudo conectar con el servidor");
    } else {
      setMensaje(error.error?.message || "Error al registrar");
    }
    setIsError(true);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* Orbs */}
      <div style={{ position: "fixed", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, right: -120, width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* ── Botón flotante volver ── */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(15, 12, 26, 0.85)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all .22s ease",
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,132,14,0.15)"; el.style.borderColor = `${C.orange}50`; el.style.color = C.orange; el.style.transform = "translateX(-2px)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(15,12,26,0.85)"; el.style.borderColor = "rgba(255,255,255,0.12)"; el.style.color = "rgba(255,255,255,0.7)"; el.style.transform = "translateX(0)"; }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Volver al inicio
      </button>

      {/* ── Panel izquierdo (50%) ── */}
      <div className="reg-banner" style={{ 
        flex: "0 0 50%",
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "60px 40px" 
      }}>
        <div style={{ maxWidth: 400 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 28 }} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.1, margin: "0 0 16px" }}>
            Únete a nuestra<br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              galería
            </span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 40px" }}>
            Comienza a explorar y coleccionar arte auténtico de la Huasteca. Tu viaje artístico empieza aquí.
          </p>
          {[
            { icon: <Palette size={18} color={C.orange} />, title: "Acceso a artistas exclusivos",  desc: "Descubre talentos únicos de la región"       },
            { icon: <Camera  size={18} color={C.pink}   />, title: "Compra obras auténticas",       desc: "Cada pieza con certificado de autenticidad"  },
            { icon: <Frame   size={18} color={C.gold}   />, title: "Personaliza tus favoritos",     desc: "Elige tamaño, marco y acabado a tu gusto"    },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho (45%) - MÁS ANCHO PARA REGISTER ── */}
      <div className="reg-form-panel" style={{ 
        flex: "0 0 45%",  // 🔹 AUMENTADO DE 40% A 45% PARA DAR MÁS ESPACIO
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "30px 20px",
        overflowY: "auto" 
      }}>
        <div style={{ 
          width: "100%", 
          maxWidth: 420  // 🔹 AUMENTADO DE 380 A 420 PARA MÁS ESPACIO
        }}>

          {/* Logo mobile */}
          <div className="reg-mobile-logo" style={{ display: "none", justifyContent: "center", marginBottom: 28 }}>
            <img src={logoImg} alt="Nu-B Studio" style={{ height: 44 }} />
          </div>

          {/* Card */}
          <div style={{ 
            background: "rgba(255,255,255,0.03)", 
            border: "1px solid rgba(255,255,255,0.08)", 
            borderRadius: 20, 
            padding: "32px 28px",  // 🔹 AUMENTADO EL PADDING
            backdropFilter: "blur(20px)" 
          }}>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 800, 
              color: C.text, 
              margin: "0 0 4px",
              textAlign: "center"
            }}>Crear cuenta</h2>
            <p style={{ 
              fontSize: 13, 
              color: C.muted, 
              margin: "0 0 28px",  // 🔹 AUMENTADO EL MARGEN
              textAlign: "center"
            }}>Únete a nuestra plataforma de arte</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}> {/* 🔹 AUMENTADO GAP */}

              {/* Nombre */}
              <div>
                <label style={labelStyle}><User size={14} /> Nombre completo</label>
                <input 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez" 
                  disabled={isLoading} 
                  required 
                  style={inputStyle} 
                />
              </div>

              {/* Correo */}
              <div>
                <label style={labelStyle}><Mail size={14} /> Correo electrónico</label>
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

              {/* Contraseña */}
              <div>
                <label style={labelStyle}><Lock size={14} /> Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={mostrarPass ? "text" : "password"} 
                    name="contrasena"
                    value={formData.contrasena} 
                    onChange={handleChange}
                    placeholder="••••••••" 
                    disabled={isLoading} 
                    required
                    style={{ 
                      ...inputStyle, 
                      paddingRight: 44,
                      border: mostrarPass ? `1.5px solid ${C.orange}` : "1.5px solid rgba(255,255,255,0.2)"
                    }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setMostrarPass(p => !p)}
                    style={{ 
                      position: "absolute", 
                      right: 12, 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      background: "rgba(0,0,0,0.3)",
                      border: "none", 
                      borderRadius: 6,
                      cursor: "pointer", 
                      color: mostrarPass ? C.orange : C.muted,
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
                      e.currentTarget.style.color = mostrarPass ? C.orange : C.muted;
                    }}
                  >
                    {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Barra de fortaleza */}
                {formData.contrasena.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= metCount ? strengthColor : "rgba(255,255,255,0.08)", transition: "background .2s" }} />
                      ))}
                    </div>
                    {strengthLabel && <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>}
                  </div>
                )}

                {/* Requisitos */}
                {formData.contrasena.length > 0 && (
                  <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {passReqs.map((req, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 4 ? 8 : 0, fontSize: 12, color: req.met ? "#4ADE80" : C.muted, transition: "color .2s" }}>
                        {req.met
                          ? <CheckCircle2 size={13} color="#4ADE80" />
                          : <AlertCircle size={13} color="rgba(255,255,255,0.3)" />
                        }
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Términos */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginTop: 4 }}>
                <div
                  onClick={() => setAceptoTerminos(p => !p)}
                  style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${aceptoTerminos ? C.orange : "rgba(255,255,255,0.2)"}`, background: aceptoTerminos ? C.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "all .15s", cursor: "pointer" }}
                >
                  {aceptoTerminos && <Check size={12} color="white" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  Acepto los{" "}
                  <span style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Términos y Condiciones</span>
                  {" "}y la{" "}
                  <span style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Política de Privacidad</span>
                </span>
              </label>

              {/* Mensaje */}
              {mensaje && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: 8, 
                  padding: "12px 16px", 
                  borderRadius: 10, 
                  fontSize: 13, 
                  background: isError ? "rgba(204,89,173,0.12)" : "rgba(74,222,128,0.12)", 
                  border: `1px solid ${isError ? C.pink : "#4ADE80"}`, 
                  color: isError ? C.pink : "#4ADE80",
                  textAlign: "center",
                  marginTop: 8
                }}>
                  {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  {mensaje}
                </div>
              )}

              {/* Botón */}
              <button type="submit" disabled={isLoading || !aceptoTerminos}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "14px 20px", borderRadius: 12, marginTop: 8,
                  background: aceptoTerminos ? "linear-gradient(135deg, #FF840E, #CC59AD)" : "rgba(255,255,255,0.06)",
                  border: "none", color: aceptoTerminos ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: 15, fontWeight: 700, cursor: isLoading || !aceptoTerminos ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: aceptoTerminos ? "0 8px 24px rgba(255,132,14,0.3)" : "none",
                  opacity: isLoading ? 0.8 : 1,
                  transition: "all .2s",
                }}>
                  {isLoading
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Registrando...</>
                    : <><UserPlus size={16} /> {aceptoTerminos ? "Crear cuenta" : "Acepta los términos para continuar"}</>
                  }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 18px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: C.muted }}>o</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: "0 0 8px" }}>
              ¿Ya tienes cuenta?{" "}
              <span onClick={() => navigate("/login")} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Iniciar sesión</span>
            </p>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
              ¿Eres artista?{" "}
              <span onClick={() => navigate("/registro-artista")} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Regístrate aquí</span>
            </p>
          </div>

          {/* Footer */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 16 }}>
            © {currentYear} Altar Studio. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .reg-banner { display: none !important; }
          .reg-form-panel { width: 100% !important; padding: 32px 20px !important; }
          .reg-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%", 
  boxSizing: "border-box",
  padding: "12px 16px", 
  borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.3)",
  color: "#ffffff", 
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none", 
  transition: "border .15s, background .15s",
};