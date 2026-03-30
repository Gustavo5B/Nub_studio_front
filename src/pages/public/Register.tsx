// src/pages/public/Register.tsx
//
// STATIC ADDITIONS (can be replaced with live API data later):
//  - Two floating artwork mini-cards (obraImg1 = artesanas.webp, obraImg2 = cuadro.png)
//    → currently static imports; replace src with API artwork thumbnails when available.
//  - Stats row (500+ Obras, 50+ Artistas, 98% Satisfacción)
//    → static numbers; fetch from a /stats endpoint to make them dynamic.
//  - Step journey indicator (① Crea tu cuenta → ② Verifica tu correo → ③ Explora el arte)
//    → static visual, always shows step 1 as active since this is the Register page.

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, UserPlus, Loader2,
  AlertCircle, CheckCircle2, Palette, Camera,
  Frame, User, ArrowLeft, Check
} from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";
import obraImg1 from "../../assets/images/artesanas.webp";
import obraImg2 from "../../assets/images/cuadro.png";

// ── Paleta idéntica al sistema ────────────────────────────
const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", bg: "#F9F8FC",
  text: "#14121E", muted: "#9896A8",
};

// ── Sanitización y validación frontend (RASP) ────────────────
const xssPattern   = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern  = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string): boolean => xssPattern.test(v) || sqliPattern.test(v);

// Validaciones de formato
const soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;
const validarNombre = (v: string): string | null => {
  if (!v.trim()) return null;
  if (v.trim().length < 2) return "Mínimo 2 caracteres";
  if (!soloLetrasYEspacios.test(v.trim())) return "Solo se permiten letras y espacios";
  if (hasSuspiciousContent(v)) return "Contenido no permitido";
  return null;
};
// ─────────────────────────────────────────────────────────────

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
  const [nombreError, setNombreError] = useState<string>("");
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
    { text: "Un número",                      met: /\d/.test(p) },
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
    // Validación en tiempo real del nombre
    if (name === "nombre") {
      const err = validarNombre(value);
      setNombreError(err ?? "");
    }
    setMensaje("");
  };

  const validateForm = (): string | null => {
    if (!aceptoTerminos) return "Debes aceptar los Términos y Condiciones";
    if (!formData.nombre || !formData.correo || !formData.contrasena) return "Todos los campos son obligatorios";
    if (formData.nombre.length < 2) return "El nombre debe tener al menos 2 caracteres";
    const errNombre = validarNombre(formData.nombre);
    if (errNombre) return `Nombre: ${errNombre}`;
    const emailParts = formData.correo.split("@");
    if (emailParts.length !== 2 || !emailParts[1].includes(".")) return "El formato del correo no es válido";
    if (!isPasswordValid) return "La contraseña no cumple todos los requisitos";
    if (hasSuspiciousContent(formData.nombre)) return "El nombre contiene contenido no permitido";
    if (hasSuspiciousContent(formData.correo)) return "El correo contiene contenido no permitido";
    return null;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setMensaje("");
    const validationError = validateForm();
    if (validationError) { setMensaje(validationError); setIsError(true); return; }

    setIsLoading(true);
    try {
      const response = await authService.register(formData.nombre, formData.correo, formData.contrasena, true);

      if (response.success) {
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

  const passInputType = mostrarPass ? "text" : "password";
  const eyeToggleColor = mostrarPass ? C.orange : C.muted;
  const passInputBorder = mostrarPass ? `1.5px solid ${C.orange}` : "1.5px solid #E6E4EF";
  const eyeIcon = mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />;
  const checkboxBorderColor = aceptoTerminos ? C.orange : "#E6E4EF";
  const checkboxBg = aceptoTerminos ? C.orange : "transparent";
  const msgBg = isError ? "rgba(168,59,144,0.08)" : "rgba(14,138,80,0.06)";
  const msgBorderColor = isError ? "rgba(168,59,144,0.30)" : "rgba(14,138,80,0.25)";
  const msgTextColor = isError ? C.pink : "#0E8A50";
  const msgIcon = isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />;
  const btnBg = aceptoTerminos ? `linear-gradient(135deg, ${C.orange}, ${C.pink})` : "rgba(0,0,0,0.05)";
  const btnColor = aceptoTerminos ? "white" : "#9896A8";
  const btnCursor = isLoading || !aceptoTerminos ? "not-allowed" : "pointer";
  const btnShadow = aceptoTerminos ? "0 8px 24px rgba(232,100,12,0.20)" : "none";
  const btnOpacity = isLoading ? 0.8 : 1;
  const btnLabel = aceptoTerminos ? "Crear cuenta" : "Acepta los términos para continuar";

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Outfit', sans-serif",
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Background orbs ── */}
      <div style={{ position: "fixed", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -120, right: -120, width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* ── Botón flotante volver ── */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid #E6E4EF",
          color: "#5A5870", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          transition: "all .22s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(232,100,12,0.08)";
          el.style.borderColor = "rgba(232,100,12,0.30)";
          el.style.color = C.orange;
          el.style.transform = "translateX(-2px)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,255,255,0.97)";
          el.style.borderColor = "#E6E4EF";
          el.style.color = "#5A5870";
          el.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Volver al inicio
      </button>

      {/* ════════════════════════════════════════════
          LEFT PANEL
      ════════════════════════════════════════════ */}
      <div
        className="reg-banner"
        style={{
          flex: "0 0 50%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 48px 60px",
          background: C.bg,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0 L40 40 M40 0 L0 40' stroke='rgba(0,0,0,0.04)' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      >
        {/* Rainbow top line */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${C.orange}, ${C.pink}, ${C.purple}, ${C.gold})`,
        }} />

        {/* Floating card 1 — top-right (artesanas) */}
        <div style={{
          position: "absolute",
          top: 60,
          right: 32,
          width: 160,
          borderRadius: 16,
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid #E6E4EF",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          animation: "floatA 6s ease-in-out infinite",
          zIndex: 2,
        }}>
          <img
            src={obraImg1}
            alt="Artesanía Huasteca"
            style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
          />
          <div style={{ padding: "8px 10px" }}>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#14121E",
              letterSpacing: 0.3,
            }}>
              Artesanía Huasteca
            </span>
          </div>
        </div>

        {/* Floating card 2 — bottom-left (cuadro) */}
        <div style={{
          position: "absolute",
          bottom: 130,
          left: 24,
          width: 152,
          borderRadius: 16,
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid #E6E4EF",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          animation: "floatB 8s ease-in-out infinite",
          zIndex: 2,
        }}>
          <img
            src={obraImg2}
            alt="Pintura Original"
            style={{ width: "100%", height: 105, objectFit: "cover", display: "block" }}
          />
          <div style={{ padding: "8px 10px" }}>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#14121E",
              letterSpacing: 0.3,
            }}>
              Pintura Original
            </span>
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 380, position: "relative", zIndex: 3 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 28 }} />

          <h1 style={{
            fontSize: 38,
            fontWeight: 900,
            color: C.text,
            lineHeight: 1.15,
            margin: "0 0 16px",
            fontFamily: "'Outfit', sans-serif",
          }}>
            Únete a nuestra{" "}
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontStyle: "italic",
              background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              galería
            </span>
          </h1>

          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 36px" }}>
            Comienza a explorar y coleccionar arte auténtico de la Huasteca. Tu viaje artístico empieza aquí.
          </p>

          {/* Feature items */}
          {[
            { icon: <Palette size={18} color={C.orange} />, title: "Acceso a artistas exclusivos",  desc: "Descubre talentos únicos de la región",       accent: C.orange },
            { icon: <Camera  size={18} color={C.pink}   />, title: "Compra obras auténticas",       desc: "Cada pieza con certificado de autenticidad",  accent: C.pink   },
            { icon: <Frame   size={18} color={C.gold}   />, title: "Personaliza tus favoritos",     desc: "Elige tamaño, marco y acabado a tu gusto",    accent: C.gold   },
          ].map(({ icon, title, desc, accent }) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 12,
                borderLeft: `3px solid ${accent}`,
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(0,0,0,0.03)",
                border: "1px solid #E6E4EF",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
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
          <div style={{
            display: "flex",
            gap: 10,
            marginTop: 32,
            flexWrap: "wrap",
          }}>
            {[
              { value: "500+", label: "Obras" },
              { value: "50+",  label: "Artistas" },
              { value: "98%",  label: "Satisfacción" },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderRadius: 100,
                  background: "rgba(0,0,0,0.02)",
                  border: "1px solid #E6E4EF",
                }}
              >
                <span style={{
                  fontSize: 15,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {value}
                </span>
                <span style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT PANEL
      ════════════════════════════════════════════ */}
      <div
        className="reg-form-panel"
        style={{
          flex: "0 0 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Logo mobile */}
          <div className="reg-mobile-logo" style={{ display: "none", justifyContent: "center", marginBottom: 28 }}>
            <img src={logoImg} alt="Nu-B Studio" style={{ height: 44 }} />
          </div>

          {/* ── Form Card ── */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E6E4EF",
            borderRadius: 24,
            padding: "36px 32px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}>

            {/* Rainbow top line on card */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${C.orange}, ${C.pink}, ${C.purple}, ${C.gold})`,
              borderRadius: "24px 24px 0 0",
            }} />

            <h2 style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.text,
              margin: "8px 0 4px",
              textAlign: "center",
              fontFamily: "'Outfit', sans-serif",
            }}>
              Crear cuenta
            </h2>
            <p style={{
              fontSize: 13,
              color: C.muted,
              margin: "0 0 28px",
              textAlign: "center",
            }}>
              Únete a nuestra plataforma de arte
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

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
                  style={{ ...inputStyle, borderColor: nombreError ? "#C4304A" : "#E6E4EF" }}
                />
                {nombreError && (
                  <span style={{ fontSize: 11.5, color: "#C4304A", fontWeight: 600, marginTop: 4, display: "block" }}>
                    ⚠ {nombreError}
                  </span>
                )}
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
                    type={passInputType}
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    style={{
                      ...inputStyle,
                      paddingRight: 44,
                      border: passInputBorder,
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
                      background: "rgba(0,0,0,0.04)",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: eyeToggleColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 6,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(232,100,12,0.10)";
                      e.currentTarget.style.color = C.orange;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                      e.currentTarget.style.color = eyeToggleColor;
                    }}
                  >
                    {eyeIcon}
                  </button>
                </div>

                {/* Barra de fortaleza */}
                {formData.contrasena.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div
                          key={n}
                          style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: n <= metCount ? strengthColor : "rgba(0,0,0,0.08)",
                            transition: "background .2s",
                          }}
                        />
                      ))}
                    </div>
                    {strengthLabel && (
                      <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>
                        {strengthLabel}
                      </span>
                    )}
                  </div>
                )}

                {/* Requisitos */}
                {formData.contrasena.length > 0 && (
                  <div style={{
                    marginTop: 12,
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "#F9F8FC",
                    border: "1px solid #E6E4EF",
                  }}>
                    {passReqs.map((req, i) => (
                      <div
                        key={req.text}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          marginBottom: i < 4 ? 8 : 0,
                          fontSize: 12,
                          color: req.met ? "#0E8A50" : C.muted,
                          transition: "color .2s",
                        }}
                      >
                        {req.met
                          ? <CheckCircle2 size={13} color="#0E8A50" />
                          : <AlertCircle  size={13} color="#9896A8" />
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setAceptoTerminos(p => !p)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setAceptoTerminos(p => !p); }}
                  style={{
                    width: 20, height: 20, borderRadius: 5,
                    border: `1.5px solid ${checkboxBorderColor}`,
                    background: checkboxBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                    transition: "all .15s", cursor: "pointer",
                  }}
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
                  background: msgBg,
                  border: `1px solid ${msgBorderColor}`,
                  color: msgTextColor,
                  textAlign: "center",
                  marginTop: 8,
                }}>
                  {msgIcon}
                  {mensaje}
                </div>
              )}

              {/* Botón submit */}
              <button
                type="submit"
                disabled={isLoading || !aceptoTerminos}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "14px 20px", borderRadius: 12, marginTop: 8,
                  background: btnBg,
                  border: "none",
                  color: btnColor,
                  fontSize: 15, fontWeight: 700,
                  cursor: btnCursor,
                  fontFamily: "'DM Sans', 'Outfit', sans-serif",
                  boxShadow: btnShadow,
                  opacity: btnOpacity,
                  transition: "all .2s",
                }}
              >
                {isLoading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Registrando...</>
                  : <><UserPlus size={16} /> {btnLabel}</>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 18px" }}>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
              <span style={{ fontSize: 12, color: C.muted }}>o</span>
              <div style={{ flex: 1, height: 1, background: "#E6E4EF" }} />
            </div>

            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: "0 0 8px" }}>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => navigate("/login")}
                style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 700, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
              >
                Iniciar sesión
              </button>
            </p>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>
              ¿Eres artista?{" "}
              <button
                onClick={() => navigate("/registro-artista")}
                style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          {/* ── Step journey indicator ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            marginTop: 28,
          }}>
            {[
              { num: "①", label: "Crea tu cuenta",     active: true  },
              { num: "②", label: "Verifica tu correo", active: false },
              { num: "③", label: "Explora el arte",    active: false },
            ].map(({ num, label, active }, idx) => (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <span style={{
                    fontSize: 18,
                    color: active ? C.orange : "#9896A8",
                    fontWeight: active ? 800 : 400,
                    transition: "color .2s",
                  }}>
                    {num}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: active ? C.orange : "#9896A8",
                    fontWeight: active ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div style={{
                    width: 36,
                    height: 1,
                    background: "#E6E4EF",
                    margin: "0 8px",
                    marginBottom: 18,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ fontSize: 11, color: "#9896A8", textAlign: "center", marginTop: 16 }}>
            © {currentYear} Nu-B Studio. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes floatA {
          0%,100% { transform: translateY(0)    rotate(-5deg); }
          50%     { transform: translateY(-14px) rotate(-3deg); }
        }

        @keyframes floatB {
          0%,100% { transform: translateY(0)    rotate(4deg); }
          50%     { transform: translateY(-10px) rotate(6deg); }
        }

        @media (max-width: 768px) {
          .reg-banner     { display: none !important; }
          .reg-form-panel { flex: unset !important; width: 100% !important; padding: 32px 20px !important; }
          .reg-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 600,
  color: "#5A5870",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1.5px solid #E6E4EF",
  background: "#FFFFFF",
  color: "#14121E",
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border .15s, background .15s",
};