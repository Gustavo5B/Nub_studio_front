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

/* ── Constantes ─────────────────────────────────────────────── */
const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  text: "#ffffff", muted: "rgba(255,255,255,0.5)",
};

/* ── Tipos ───────────────────────────────────────────────────── */
interface LoginModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
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

interface LoginResult {
  mensaje: string;
  isError: boolean;
  redirect?: { path: string; state?: Record<string, unknown>; delay?: number };
  storageActions?: () => void;
}

/* ── Helpers para reducir Cognitive Complexity ───────────────── */

function getBlockedMessage(minutes: number): string {
  return `🔒 Cuenta bloqueada. Intenta en ${minutes} minuto${minutes > 1 ? "s" : ""}.`;
}

function handleBlockedResponse(response: { minutesRemaining?: number; minutesBlocked?: number }): LoginResult {
  const m = response.minutesRemaining || response.minutesBlocked || 5;
  return { mensaje: getBlockedMessage(m), isError: true };
}

function handleVerificationResponse(): LoginResult {
  return { mensaje: "Cuenta pendiente de verificación. Revisa tu correo 📧", isError: true };
}

function handle2FAResponse(
  response: { correo?: string; metodo_2fa?: string },
  correo: string,
  onClose: () => void
): LoginResult {
  const userCorreo = response.correo || correo;
  const path = response.metodo_2fa === "TOTP" ? "/two-factor-verify" : "/verify-email-code";
  return {
    mensaje: "Verificando 2FA...",
    isError: false,
    storageActions: () => { localStorage.setItem("temp_correo_2fa", userCorreo); },
    redirect: {
      path,
      state: { correo: userCorreo, metodo_2fa: response.metodo_2fa },
      delay: 1200,
    },
  };
}

function storeUserSession(response: {
  access_token?: string;
  token?: string;
  usuario?: { correo: string; nombre: string; id: number; rol?: string };
}): void {
  const token = response.access_token || response.token;
  if (token) {
    localStorage.setItem("access_token", token);
    localStorage.setItem("token", token);
  }
  if (response.usuario) {
    localStorage.setItem("userEmail", response.usuario.correo);
    localStorage.setItem("userName", response.usuario.nombre);
    localStorage.setItem("userId", response.usuario.id.toString());
    localStorage.setItem("userRol", response.usuario.rol || "cliente");
  }
  localStorage.setItem("isLoggedIn", "true");
}

function handleSuccessResponse(response: {
  access_token?: string;
  token?: string;
  usuario?: { correo: string; nombre: string; id: number; rol?: string };
}): LoginResult {
  const redirectPath = response.usuario?.rol === "admin" ? "/admin" : "/";
  return {
    mensaje: "¡Bienvenido de vuelta! ✓",
    isError: false,
    storageActions: () => storeUserSession(response),
    redirect: { path: redirectPath, delay: 900 },
  };
}

function parseLoginError(err: unknown): LoginResult {
  const error = err as LoginError;

  if (error.status === 403 && error.error?.blocked) {
    const m = error.error.minutesRemaining || error.error.minutesBlocked || 5;
    return { mensaje: getBlockedMessage(m), isError: true };
  }

  if (error.status === 401 && error.error?.attemptsRemaining !== undefined) {
    const r = error.error.attemptsRemaining;
    const msg = r === 0
      ? "🔒 Has excedido el límite de intentos."
      : `❌ Contraseña incorrecta. Te quedan ${r} intento${r > 1 ? "s" : ""}.`;
    return { mensaje: msg, isError: true };
  }

  if (error.status === 404) {
    return { mensaje: "Usuario no encontrado", isError: true };
  }

  return { mensaje: error.error?.message || "Error al iniciar sesión", isError: true };
}

/* ── Hooks personalizados ────────────────────────────────────── */

function useModalVisibility(isOpen: boolean) {
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

  return visible;
}

function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    globalThis.addEventListener("keydown", handleKey);
    return () => globalThis.removeEventListener("keydown", handleKey);
  }, [onClose]);
}

/* ── Sub-componentes ─────────────────────────────────────────── */

function CloseButton({ onClose }: { readonly onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        position: "absolute", top: 16, right: 16, width: 32, height: 32,
        borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)", color: C.muted,
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", transition: "all .15s",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.12)"; el.style.color = "#fff"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.06)"; el.style.color = C.muted; }}
    >
      <X size={15} />
    </button>
  );
}

function ModalHeader() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <img src={logoImg} alt="Nu-B Studio" style={{ height: 38, marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px", fontFamily: "'Outfit', sans-serif" }}>
        Bienvenido de vuelta
      </h2>
      <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
        Inicia sesión para explorar la galería
      </p>
    </div>
  );
}

function StatusMessage({ mensaje, isError }: { readonly mensaje: string; readonly isError: boolean }) {
  if (!mensaje) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 14px", borderRadius: 10, fontSize: 13,
      background: isError ? "rgba(204,89,173,0.12)" : "rgba(74,222,128,0.12)",
      border: `1px solid ${isError ? C.pink : "#4ADE80"}`,
      color: isError ? C.pink : "#4ADE80",
      animation: "msgIn 0.2s ease",
    }}>
      {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      {mensaje}
    </div>
  );
}

function SubmitButton({ isLoading }: { readonly isLoading: boolean }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, width: "100%", padding: "13px 20px", borderRadius: 12, marginTop: 4,
        background: "linear-gradient(135deg, #FF840E, #CC59AD)",
        border: "none", color: "white", fontSize: 15, fontWeight: 700,
        cursor: isLoading ? "not-allowed" : "pointer",
        fontFamily: "'Outfit', sans-serif",
        boxShadow: "0 8px 24px rgba(255,132,14,0.3)",
        opacity: isLoading ? 0.8 : 1,
        transition: "opacity .15s, transform .15s, box-shadow .15s",
      }}
      onMouseEnter={e => { if (!isLoading) { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 12px 32px rgba(255,132,14,0.45)"; } }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 8px 24px rgba(255,132,14,0.3)"; }}
    >
      {isLoading
        ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</>
        : <><LogIn size={16} /> Iniciar sesión</>
      }
    </button>
  );
}

function ModalFooter({ onClose }: { readonly onClose: () => void }) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 12, color: C.muted }}>o</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
          ¿No tienes cuenta?{" "}
          <span role="button" tabIndex={0} onClick={() => handleNavigate("/register")} onKeyDown={e => { if (e.key === "Enter") handleNavigate("/register"); }} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>
            Crear una cuenta
          </span>
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Palette size={13} color={C.orange} />
          ¿Eres artista?{" "}
          <span role="button" tabIndex={0} onClick={() => handleNavigate("/registro-artista")} onKeyDown={e => { if (e.key === "Enter") handleNavigate("/registro-artista"); }} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>
            Regístrate aquí
          </span>
        </p>
      </div>
    </>
  );
}

/* ── Componente principal ────────────────────────────────────── */

function ModalContent({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ correo: "", contrasena: "" });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);

  const visible = useModalVisibility(isOpen);
  useEscapeKey(onClose);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje("");
  };

  const applyLoginResult = (result: LoginResult) => {
    setMensaje(result.mensaje);
    setIsError(result.isError);
    result.storageActions?.();

    if (result.redirect) {
      const { path, state, delay = 0 } = result.redirect;
      setTimeout(() => { onClose(); navigate(path, state ? { state } : undefined); }, delay);
    }
  };

  const processLoginResponse = (response: ReturnType<typeof Object>): LoginResult => {
    if (response.blocked) return handleBlockedResponse(response);
    if (response.requiresVerification) return handleVerificationResponse();
    if (response.requires2FA) return handle2FAResponse(response, formData.correo, onClose);
    return handleSuccessResponse(response);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.correo || !formData.contrasena) {
      setMensaje("Por favor completa todos los campos");
      setIsError(true);
      return;
    }
    setIsLoading(true);
    setMensaje("");

    try {
      const response = await authService.login(formData.correo, formData.contrasena);
      const result = processLoginResponse(response);
      applyLoginResult(result);
    } catch (err) {
      const result = parseLoginError(err);
      setMensaje(result.mensaje);
      setIsError(result.isError);
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
        background: visible ? "rgba(8, 5, 18, 0.85)" : "rgba(8, 5, 18, 0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        opacity: visible ? 1 : 0,
        transition: "background 0.3s ease, backdrop-filter 0.3s ease, opacity 0.3s ease",
      }}
    >
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

        {/* Decoraciones de fondo */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}15, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}12, transparent 70%)`, pointerEvents: "none" }} />

        <CloseButton onClose={onClose} />
        <ModalHeader />

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}><Mail size={14} /> Correo electrónico</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="tu@correo.com" disabled={isLoading} required style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...labelStyle, margin: 0 }}><Lock size={14} /> Contraseña</label>
              <span
                role="button" tabIndex={0}
                onClick={() => { onClose(); navigate("/forgot-password"); }}
                onKeyDown={e => { if (e.key === "Enter") { onClose(); navigate("/forgot-password"); } }}
                style={{ fontSize: 12, color: C.orange, cursor: "pointer", fontWeight: 500 }}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input type={mostrarPass ? "text" : "password"} name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="••••••••" disabled={isLoading} required style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setMostrarPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
                {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <StatusMessage mensaje={mensaje} isError={isError} />
          <SubmitButton isLoading={isLoading} />
        </form>

        <ModalFooter onClose={onClose} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ── Wrapper con Portal ──────────────────────────────────────── */
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(
    <ModalContent isOpen={isOpen} onClose={onClose} />,
    document.body
  );
}

/* ── Estilos compartidos ─────────────────────────────────────── */
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