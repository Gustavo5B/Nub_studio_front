// src/components/LoginModal.tsx
// ⚠️ IMPORTANTE: Este componente usa React Portal para montarse en document.body
// directamente, así NO hereda el transform/scale del Home y la animación se ve limpia.
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2,
  AlertCircle, CheckCircle2, X, Palette
} from "lucide-react";
import { authService } from "../services/authService";
import logoImg from "../assets/images/logo.png";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  text: "#ffffff", muted: "rgba(255,255,255,0.5)",
};

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginError {
  status?: number;
  error?: {
    blocked?: boolean;
    minutesRemaining?: number;
    minutesBlocked?: number;
    attemptsRemaining?: number;
    message?: string;
    requiresVerification?: boolean;
  };
}

function ModalContent({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ correo: "", contrasena: "" });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => { document.body.style.overflow = ""; }, 350);
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.correo || !formData.contrasena) {
      setMensaje("Por favor completa todos los campos"); setIsError(true); return;
    }
    setIsLoading(true); setMensaje("");
    try {
      const response = await authService.login(formData.correo, formData.contrasena);
      if (response.blocked) {
        const m = response.minutesRemaining || response.minutesBlocked || 5;
        setMensaje(`🔒 Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`);
        setIsError(true); setIsLoading(false); return;
      }
      if (response.requiresVerification) {
        setMensaje("Cuenta pendiente de verificación. Revisa tu correo 📧");
        setIsError(true); setIsLoading(false); return;
      }
      if (response.requires2FA) {
        setMensaje("Verificando 2FA..."); setIsError(false);
        localStorage.setItem("temp_correo_2fa", response.correo || formData.correo);
        setTimeout(() => {
          onClose();
          navigate(response.metodo_2fa === "TOTP" ? "/two-factor-verify" : "/verify-email-code", {
            state: { correo: response.correo || formData.correo, metodo_2fa: response.metodo_2fa }
          });
        }, 1200);
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
      setMensaje("¡Bienvenido de vuelta! ✓"); setIsError(false);
      setTimeout(() => { onClose(); navigate(response.usuario?.rol === "admin" ? "/admin" : "/"); }, 900);
    } catch (err) {
      const error = err as LoginError;
      if (error.status === 403 && error.error?.blocked) {
        const m = error.error.minutesRemaining || error.error.minutesBlocked || 5;
        setMensaje(`🔒 Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`);
      } else if (error.status === 401 && error.error?.attemptsRemaining !== undefined) {
        const r = error.error.attemptsRemaining;
        setMensaje(r === 0 ? "🔒 Has excedido el límite de intentos." : `❌ Contraseña incorrecta. Te quedan ${r} intento${r > 1 ? "s" : ""}.`);
      } else if (error.status === 404) {
        setMensaje("Usuario no encontrado");
      } else {
        setMensaje(error.error?.message || "Error al iniciar sesión");
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !visible) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        background: visible ? "rgba(8, 5, 18, 0.85)" : "rgba(8, 5, 18, 0)",  // 🔹 Fondo oscuro visible
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",  // 🔹 Desenfoque añadido
        opacity: visible ? 1 : 0,
        transition: "background 0.3s ease, backdrop-filter 0.3s ease, opacity 0.3s ease",
      }}
    >
      {/* Card: fade + zoom desde el centro */}
      <div style={{
        width: "100%", maxWidth: 460, position: "relative",
        background: "rgba(18, 12, 32, 0.97)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 24, padding: "40px 36px",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,132,14,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.88)",
        transition: "opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}>

        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}15, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}12, transparent 70%)`, pointerEvents: "none" }} />

        {/* Botón cerrar */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.12)"; el.style.color = "#fff"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.06)"; el.style.color = C.muted; }}
        ><X size={15} /></button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 38, marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px", fontFamily: "'Outfit', sans-serif" }}>Bienvenido de vuelta</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Inicia sesión para explorar la galería</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}><Mail size={14} /> Correo electrónico</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="tu@correo.com" disabled={isLoading} required style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...labelStyle, margin: 0 }}><Lock size={14} /> Contraseña</label>
              <span onClick={() => { onClose(); navigate("/forgot-password"); }} style={{ fontSize: 12, color: C.orange, cursor: "pointer", fontWeight: 500 }}>¿Olvidaste tu contraseña?</span>
            </div>
            <div style={{ position: "relative" }}>
              <input type={mostrarPass ? "text" : "password"} name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="••••••••" disabled={isLoading} required style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setMostrarPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
                {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mensaje && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: isError ? "rgba(204,89,173,0.12)" : "rgba(74,222,128,0.12)", border: `1px solid ${isError ? C.pink : "#4ADE80"}`, color: isError ? C.pink : "#4ADE80", animation: "msgIn 0.2s ease" }}>
              {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {mensaje}
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 12, marginTop: 4, background: "linear-gradient(135deg, #FF840E, #CC59AD)", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 8px 24px rgba(255,132,14,0.3)", opacity: isLoading ? 0.8 : 1, transition: "opacity .15s, transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { if (!isLoading) { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 12px 32px rgba(255,132,14,0.45)"; } }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 8px 24px rgba(255,132,14,0.3)"; }}
          >
            {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</> : <><LogIn size={16} /> Iniciar sesión</>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: 12, color: C.muted }}>o</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            ¿No tienes cuenta?{" "}
            <span onClick={() => { onClose(); navigate("/register"); }} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Crear una cuenta</span>
          </p>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Palette size={13} color={C.orange} />
            ¿Eres artista?{" "}
            <span onClick={() => { onClose(); navigate("/registro-artista"); }} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>Regístrate aquí</span>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Wrapper con Portal para salir del árbol del Home ──────────
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(
    <ModalContent isOpen={isOpen} onClose={onClose} />,
    document.body
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff", fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none", transition: "border .15s",
};