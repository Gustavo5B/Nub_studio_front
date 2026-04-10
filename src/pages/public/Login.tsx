// src/pages/public/Login.tsx
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, ArrowLeft
} from "lucide-react";
import { authService } from "../../services/authService";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  ink:    "#14121E",
  sub:    "#9896A8",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

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
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({ correo: "", contrasena: "" });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);

  // Custom cursor
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Reveal
  const pageRef = useRef<HTMLDivElement>(null);

  // ─── Custom cursor ────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = "none";
    document.documentElement.style.cursor = "none";
    
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;
    let isAnimating = false;
    
    const animate = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      
      if (ringRef.current) {
        ringRef.current.style.left = `${rx}px`;
        ringRef.current.style.top = `${ry}px`;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      
      if (!isAnimating) {
        isAnimating = true;
        animate();
      }
    };
    
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };
  }, []);

  // ─── Scroll reveal ────────────────────────────────────────────
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    const targets = container.querySelectorAll<HTMLElement>("[data-rv]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("rv-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const cursorOn  = () => { dotRef.current?.classList.add("cur-over");  ringRef.current?.classList.add("cur-over");  };
  const cursorOff = () => { dotRef.current?.classList.remove("cur-over"); ringRef.current?.classList.remove("cur-over"); };

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
      showMessage(`Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`, true);
    } else if (error.status === 401 && error.error?.attemptsRemaining !== undefined) {
      const r = error.error.attemptsRemaining;
      const plural = r > 1 ? "s" : "";
      const msg = r === 0 ? "Has excedido el límite de intentos." : `Contraseña incorrecta. Te quedan ${r} intento${plural}.`;
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
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect") || "/";
    const validationError = validateLoginInput();
    if (validationError) { showMessage(validationError, true); return; }

    setIsLoading(true);
    try {
      const response = await authService.login(formData.correo, formData.contrasena);

      if (response.blocked) {
        const m = response.minutesRemaining || response.minutesBlocked || 5;
        showMessage(`Cuenta bloqueada. Intenta en ${m} minuto${m > 1 ? "s" : ""}.`, true);
        setIsLoading(false); return;
      }
      if (response.requiresVerification) {
        showMessage("Cuenta pendiente de verificación. Revisa tu correo.", true);
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
      showMessage("Acceso concedido", false);
      const rol = response.usuario?.rol;
      const artista_estado = response.usuario?.artista_estado;
      setTimeout(() => {
        if (rol === "admin") window.location.href = "/admin";
        else if (rol === "artista" && artista_estado === "pendiente") window.location.href = "/artista/pendiente";
        else if (rol === "artista") window.location.href = "/artista/dashboard";
        else window.location.href = redirectTo;
      }, 300);
    } catch (err) {
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS, position: "relative", overflow: "hidden" }}>

      {/* ── Grain ── */}
      <div className="login-grain" />

      {/* ── Custom cursor ── */}
      <div ref={dotRef}  className="login-cursor-dot"  />
      <div ref={ringRef} className="login-cursor-ring" />

      {/* ── Volver al inicio ── */}
      <button
        onClick={() => navigate("/")}
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
        className="login-back-btn"
        style={{
          position: "fixed", top: 28, left: 52, zIndex: 300,
          display: "flex", alignItems: "center", gap: 9,
          background: "none", border: "none", cursor: "pointer",
          fontFamily: SANS, fontSize: 9.5, fontWeight: 700,
          letterSpacing: ".22em", textTransform: "uppercase",
          color: C.sub, transition: "color .25s", padding: 0,
        }}
      >
        <ArrowLeft size={11} strokeWidth={2.5} />
        Volver
      </button>

      {/* ── Layout principal ── */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ════ PANEL IZQUIERDO ════ */}
        <div className="login-left" style={{
          flex: "0 0 52%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 64px",
          borderRight: "1px solid rgba(0,0,0,0.055)",
        }}>

          {/* Corner decorations */}
          <div className="lc tl" /><div className="lc tr" />
          <div className="lc bl" /><div className="lc br" />

          {/* Línea vertical naranja→pink en borde derecho */}
          <div style={{
            position: "absolute", top: "18%", right: -1, width: 1, height: "64%",
            background: `linear-gradient(180deg, transparent, ${C.orange}70, ${C.pink}70, transparent)`,
            zIndex: 2,
          }} />

          {/* ── ALTAR — marca de agua centrada ── */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pointerEvents: "none",
            userSelect: "none",
          }}>
            <span style={{
              fontFamily: NEXA_HEAVY,
              fontSize: "clamp(96px, 12vw, 160px)",
              fontWeight: 900,
              color: "rgba(0,0,0,0.038)",
              letterSpacing: ".12em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}>
              ALTAR
            </span>
          </div>

          {/* ── Contenido editorial centrado ── */}
          <div style={{ width: "100%", paddingLeft: 88, position: "relative", zIndex: 2 }}>

            <div data-rv>
              <p style={{
                fontFamily: SANS, fontSize: 9.5, fontWeight: 700,
                letterSpacing: ".28em", textTransform: "uppercase",
                color: C.sub, margin: "0 0 28px",
              }}>
                ALTAR · Galería de Arte
              </p>

              <h2 style={{
                fontFamily: SERIF, fontStyle: "italic",
                fontSize: "clamp(30px, 3.8vw, 48px)",
                fontWeight: 900, color: C.ink,
                lineHeight: 1.15, margin: "0 0 22px",
                letterSpacing: "-.02em",
              }}>
                Arte auténtico,<br />raíces profundas.
              </h2>

              <div style={{
                width: 44, height: 1,
                background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`,
                margin: "0 0 28px",
              }} />

              <p style={{
                fontFamily: SANS, fontSize: 13,
                color: C.sub, lineHeight: 1.75,
                margin: "0 0 44px", maxWidth: 280,
              }}>
                Obras originales de artistas locales.<br />
                Pinturas, esculturas y fotografía.<br />
              </p>
            </div>
          </div>
        </div>

        {/* ════ PANEL DERECHO ════ */}
        <div className="login-right" style={{
          flex: "0 0 48%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 64px",
          position: "relative",
        }}>

          {/* Corner markers en el área del form */}
          <div className="fc tl" /><div className="fc tr" />
          <div className="fc bl" /><div className="fc br" />

          <div data-rv style={{ width: "100%", maxWidth: 360 }}>

            <p style={{
              fontFamily: SANS, fontSize: 9.5, fontWeight: 700,
              letterSpacing: ".22em", textTransform: "uppercase",
              color: C.sub, margin: "0 0 40px",
            }}>
              Iniciar sesión
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Correo */}
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                  required
                  onFocus={e => { e.currentTarget.style.borderBottomColor = C.orange; }}
                  onBlur={e  => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.12)"; }}
                  style={lineInput}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label style={labelStyle}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrarContrasena ? "text" : "password"}
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    onFocus={e => { e.currentTarget.style.borderBottomColor = C.orange; }}
                    onBlur={e  => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.12)"; }}
                    style={{ ...lineInput, paddingRight: 32 }}
                  />
                  <button
                    type="button"
                    onMouseEnter={cursorOn}
                    onMouseLeave={cursorOff}
                    onClick={() => setMostrarContrasena(p => !p)}
                    style={{
                      position: "absolute", right: 0, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", padding: 4,
                      color: mostrarContrasena ? C.orange : C.sub,
                      display: "flex", alignItems: "center",
                      transition: "color .2s",
                    }}
                  >
                    {mostrarContrasena ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Olvidé contraseña */}
              <div style={{ marginTop: -20 }}>
                <Link
                  to="/forgot-password"
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  style={{
                    fontFamily: SANS, fontSize: 11,
                    color: C.orange, textDecoration: "none",
                    letterSpacing: ".06em",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Mensaje */}
              {mensaje && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 0",
                  borderBottom: `1px solid ${isError ? C.pink : "#4ADE80"}`,
                  fontSize: 12, fontFamily: SANS,
                  color: isError ? C.pink : "#16A34A",
                  letterSpacing: ".04em",
                }}>
                  {isError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  {mensaje}
                </div>
              )}

              {/* Botón submit — pill */}
              <button
                type="submit"
                disabled={isLoading}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  ...pillBtn,
                  opacity: isLoading ? 0.75 : 1,
                  marginTop: 4,
                }}
              >
                {isLoading
                  ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Cargando...</>
                  : "Ingresar a la galería"
                }
              </button>

            </form>

            {/* Divisor */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "32px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
              <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.sub, letterSpacing: ".14em" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
            </div>

            {/* Links — pill outline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => navigate(redirectTo !== "/" ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                className="login-pill-outline"
                style={pillOutline}
              >
                Crear una cuenta
              </button>
              <button
                onClick={() => navigate("/registro-artista")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                className="login-pill-outline"
                style={pillOutline}
              >
                Registrarse como artista
              </button>
            </div>

            {/* Footer legal */}
            <p style={{
              fontFamily: SANS, fontSize: 10.5,
              color: "rgba(0,0,0,0.28)",
              textAlign: "center",
              marginTop: 36, letterSpacing: ".04em",
            }}>
              © {currentYear} ALTAR Galería de Arte
            </p>

          </div>
        </div>

      </div>

      <style>{`
        @font-face {
          font-family: 'SolveraLorvane';
          src: url('/fonts/SolveraLorvane.ttf') format('truetype');
          font-weight: 900; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: 'Nexa-Heavy';
          src: url('/fonts/Nexa-Heavy.ttf') format('truetype');
          font-weight: 900; font-style: normal; font-display: swap;
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        /* ── Grain ── */
        .login-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        /* ── Custom cursor ── */
        .login-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%,-50%);
          transition: width .22s, height .22s, background .22s;
        }
        .login-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%,-50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .login-cursor-dot.cur-over  { width: 4px; height: 4px; background: #E8640C; }
        .login-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }

        /* ── Reveal animations ── */
        [data-rv] { opacity:0; transform:translateY(24px); transition:opacity .9s ease, transform .9s ease; }
        [data-rv].rv-in { opacity:1; transform:translateY(0); }
        [data-rv][data-d="2"] { transition-delay: .18s; }

        /* ── Corner decorations (panel izquierdo) ── */
        .lc { position: absolute; width: 34px; height: 34px; pointer-events: none; }
        .lc::before, .lc::after { content: ''; position: absolute; background: rgba(0,0,0,0.08); }
        .lc::before { width: 1px; height: 34px; }
        .lc::after  { width: 34px; height: 1px; }
        .lc.tl { top: 24px; left: 24px; }
        .lc.tr { top: 24px; right: 24px; }
        .lc.tr::before { right: 0; left: auto; }
        .lc.tr::after  { right: 0; left: auto; }
        .lc.bl { bottom: 24px; left: 24px; }
        .lc.bl::before { bottom: 0; top: auto; }
        .lc.bl::after  { bottom: 0; top: auto; }
        .lc.br { bottom: 24px; right: 24px; }
        .lc.br::before { right: 0; left: auto; bottom: 0; top: auto; }
        .lc.br::after  { right: 0; left: auto; bottom: 0; top: auto; }

        /* ── Corner decorations (form) ── */
        .fc { position: absolute; width: 22px; height: 22px; pointer-events: none; }
        .fc::before, .fc::after { content: ''; position: absolute; background: rgba(232,100,12,0.30); }
        .fc::before { width: 1px; height: 22px; }
        .fc::after  { width: 22px; height: 1px; }
        .fc.tl { top: 36px; left: 36px; }
        .fc.tr { top: 36px; right: 36px; }
        .fc.tr::before { right: 0; left: auto; }
        .fc.tr::after  { right: 0; left: auto; }
        .fc.bl { bottom: 36px; left: 36px; }
        .fc.bl::before { bottom: 0; top: auto; }
        .fc.bl::after  { bottom: 0; top: auto; }
        .fc.br { bottom: 36px; right: 36px; }
        .fc.br::before { right: 0; left: auto; bottom: 0; top: auto; }
        .fc.br::after  { right: 0; left: auto; bottom: 0; top: auto; }

        /* ── Back button hover ── */
        .login-back-btn:hover { color: #14121E !important; }

        /* ── Pill outline hover ── */
        .login-pill-outline:hover {
          border-color: rgba(0,0,0,0.22) !important;
          color: #14121E !important;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .login-left  { display: none !important; }
          .login-right { flex: 1 !important; padding: 80px 32px !important; }
          .fc { display: none; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: ".20em",
  textTransform: "uppercase",
  color: "#9896A8",
  marginBottom: 10,
};

const lineInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 0",
  border: "none",
  borderBottom: "1.5px solid rgba(0,0,0,0.12)",
  background: "transparent",
  color: "#14121E",
  fontSize: 15,
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color .2s",
};

const pillBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 24px",
  borderRadius: 100,
  background: "#E8640C",
  border: "none", color: "#fff",
  fontSize: 9.5, fontWeight: 700,
  letterSpacing: ".22em", textTransform: "uppercase",
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 4px 20px rgba(232,100,12,.28)",
  transition: "opacity .2s, box-shadow .2s",
};

const pillOutline: React.CSSProperties = {
  width: "100%", padding: "11px 24px",
  borderRadius: 100,
  background: "none",
  border: "1px solid rgba(0,0,0,0.10)",
  color: "#9896A8",
  fontSize: 9.5, fontWeight: 700,
  letterSpacing: ".18em", textTransform: "uppercase",
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  transition: "border-color .22s, color .22s",
};