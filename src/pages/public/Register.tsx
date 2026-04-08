// src/pages/public/Register.tsx
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, ArrowLeft, Check
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
    { text: "Mínimo 8 caracteres",            met: false },
    { text: "Una letra mayúscula",             met: false },
    { text: "Una letra minúscula",             met: false },
    { text: "Un número",                       met: false },
    { text: "Un carácter especial (@$!%*?&#)", met: false },
  ]);

  const validatePassword = (p: string) => setPassReqs([
    { text: "Mínimo 8 caracteres",            met: p.length >= 8 },
    { text: "Una letra mayúscula",             met: /[A-Z]/.test(p) },
    { text: "Una letra minúscula",             met: /[a-z]/.test(p) },
    { text: "Un número",                       met: /\d/.test(p) },
    { text: "Un carácter especial (@$!%*?&#)", met: /[@$!%*?&#]/.test(p) },
  ]);

  const metCount = passReqs.filter(r => r.met).length;
  const isPasswordValid = metCount === 5;
  const strengthColor = ["transparent", C.pink, "#F59E0B", "#A87006", C.orange, C.orange][metCount];

  // Door animation
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorGone, setDoorGone] = useState(false);

  // Custom cursor
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Reveal
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setDoorOpen(true),  500);
    const t2 = setTimeout(() => setDoorGone(true),  1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    document.body.style.cursor = "none";
    let rx = 0, ry = 0;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const dot = dotRef.current;
      if (dot) { dot.style.left = e.clientX + "px"; dot.style.top = e.clientY + "px"; }
      const tick = () => {
        rx += (e.clientX - rx) * 0.15;
        ry += (e.clientY - ry) * 0.15;
        const ring = ringRef.current;
        if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
        rafId = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

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
  }, [doorGone]);

  const cursorOn  = () => { dotRef.current?.classList.add("cur-over");  ringRef.current?.classList.add("cur-over");  };
  const cursorOff = () => { dotRef.current?.classList.remove("cur-over"); ringRef.current?.classList.remove("cur-over"); };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    if (name === "contrasena") validatePassword(value);
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
      if (response.requiresVerification || response.user) {
        localStorage.setItem("temp_correo_verificacion", formData.correo);
        setMensaje("Cuenta creada. Revisa tu correo para verificarla.");
        setIsError(false);
        setTimeout(() => navigate("/verify-email-code", { state: { correo: formData.correo } }), 2000);
      } else {
        setMensaje("Cuenta creada. Redirigiendo...");
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
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS, position: "relative", overflow: "hidden" }}>

      {/* ── Grain ── */}
      <div className="reg-grain" />

      {/* ── Custom cursor ── */}
      <div ref={dotRef}  className="reg-cursor-dot"  />
      <div ref={ringRef} className="reg-cursor-ring" />

      {/* ── Door animation ── */}
      {!doorGone && (
        <>
          <div className={`reg-door-wrap${doorOpen ? " open" : ""}`}>
            <div className="reg-door izq" />
            <div className="reg-door der" />
          </div>
          <div className={`reg-door-logo${doorOpen ? " open" : ""}`}>ALTAR</div>
          <div className={`reg-door-sub${doorOpen  ? " open" : ""}`}>Galería de Arte</div>
          <div className={`reg-door-line${doorOpen ? " open" : ""}`} />
        </>
      )}

      {/* ── Línea naranja→pink superior ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 1, zIndex: 200,
        background: `linear-gradient(90deg, transparent, ${C.orange} 25%, ${C.pink} 75%, transparent)`,
      }} />

      {/* ── Volver ── */}
      <button
        onClick={() => navigate("/")}
        onMouseEnter={cursorOn}
        onMouseLeave={cursorOff}
        className="reg-back-btn"
        style={{
          position: "fixed", top: 28, left: 52, zIndex: 300,
          display: "flex", alignItems: "center", gap: 9,
          background: "none", border: "none", cursor: "none",
          fontFamily: SANS, fontSize: 9.5, fontWeight: 700,
          letterSpacing: ".22em", textTransform: "uppercase",
          color: C.sub, transition: "color .25s", padding: 0,
        }}
      >
        <ArrowLeft size={11} strokeWidth={2.5} />
        Volver
      </button>

      {/* ── Layout principal ── */}
      <div ref={pageRef} style={{ display: "flex", minHeight: "100vh" }}>

        {/* ════ PANEL IZQUIERDO ════ */}
        <div className="reg-left" style={{
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

          {/* ALTAR — marca de agua centrada */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", pointerEvents: "none", userSelect: "none",
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

          {/* Carta al visitante */}
          <div style={{ width: "100%", position: "relative", zIndex: 2, maxWidth: 360 }}>

            <div data-rv>

              {/* Apertura */}
              <p style={{
                fontFamily: SANS, fontStyle: "italic",
                fontSize: 13, color: C.sub,
                letterSpacing: ".04em", margin: "0 0 32px",
              }}>
                — Para el coleccionista,
              </p>

              {/* Cuerpo de la carta */}
              <p style={{
                fontFamily: SANS, fontSize: 15,
                color: C.ink, lineHeight: 1.9,
                margin: "0 0 24px", fontWeight: 400,
              }}>
                Aquí encontrarás obras<br />
                que no verás en ningún<br />
                otro lugar.
              </p>

              <p style={{
                fontFamily: SANS, fontSize: 15,
                color: C.sub, lineHeight: 1.9,
                margin: "0 0 48px", fontWeight: 400,
              }}>
                Arte auténtico, creado<br />
                por manos locales,<br />
                esperando ser tuyo.
              </p>

              {/* Firma */}
              <div style={{
                width: 40, height: 1,
                background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`,
                margin: "0 0 14px",
              }} />

              <p style={{
                fontFamily: SERIF,
                fontSize: "clamp(22px, 2.8vw, 32px)",
                fontWeight: 900, color: C.ink,
                letterSpacing: "-.01em",
                margin: 0, lineHeight: 1,
              }}>
                ALTAR
              </p>

            </div>

          </div>
        </div>

        {/* ════ PANEL DERECHO ════ */}
        <div className="reg-right" style={{
          flex: "0 0 48%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 64px",
          position: "relative",
          overflowY: "auto",
        }}>

          {/* Corner markers */}
          <div className="fc tl" /><div className="fc tr" />
          <div className="fc bl" /><div className="fc br" />

          <div data-rv style={{ width: "100%", maxWidth: 360 }}>

            <p style={{
              fontFamily: SANS, fontSize: 9.5, fontWeight: 700,
              letterSpacing: ".22em", textTransform: "uppercase",
              color: C.sub, margin: "0 0 40px",
            }}>
              Crear cuenta
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  disabled={isLoading}
                  required
                  onFocus={e  => { e.currentTarget.style.borderBottomColor = nombreError ? "#C4304A" : C.orange; }}
                  onBlur={e   => { e.currentTarget.style.borderBottomColor = nombreError ? "#C4304A" : "rgba(0,0,0,0.12)"; }}
                  style={{ ...lineInput, borderBottomColor: nombreError ? "#C4304A" : "rgba(0,0,0,0.12)" }}
                />
                {nombreError && (
                  <span style={{ fontFamily: SANS, fontSize: 11, color: "#C4304A", marginTop: 5, display: "block", letterSpacing: ".04em" }}>
                    {nombreError}
                  </span>
                )}
              </div>

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
                    type={mostrarPass ? "text" : "password"}
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
                    onClick={() => setMostrarPass(p => !p)}
                    style={{
                      position: "absolute", right: 0, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "none", padding: 4,
                      color: mostrarPass ? C.orange : C.sub,
                      display: "flex", alignItems: "center",
                      transition: "color .2s",
                    }}
                  >
                    {mostrarPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Barra de fortaleza */}
                {formData.contrasena.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{
                          flex: 1, height: 2, borderRadius: 1,
                          background: n <= metCount ? strengthColor : "rgba(0,0,0,0.07)",
                          transition: "background .2s",
                        }} />
                      ))}
                    </div>

                    {/* Requisitos */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {passReqs.map(req => (
                        <div key={req.text} style={{
                          display: "flex", alignItems: "center", gap: 7,
                          fontFamily: SANS, fontSize: 11,
                          color: req.met ? "#0E8A50" : C.sub,
                          letterSpacing: ".02em",
                          transition: "color .2s",
                        }}>
                          {req.met
                            ? <CheckCircle2 size={11} color="#0E8A50" />
                            : <AlertCircle  size={11} color="#9896A8" />
                          }
                          {req.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Términos */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAceptoTerminos(p => !p)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setAceptoTerminos(p => !p); }}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  cursor: "none", marginTop: -4,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${aceptoTerminos ? C.orange : "rgba(0,0,0,0.18)"}`,
                  background: aceptoTerminos ? C.orange : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .15s",
                }}>
                  {aceptoTerminos && <Check size={10} color="white" strokeWidth={3} />}
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.sub, lineHeight: 1.6, letterSpacing: ".02em" }}>
                  Acepto los{" "}
                  <span style={{ color: C.orange, fontWeight: 600 }}>Términos y Condiciones</span>
                  {" "}y la{" "}
                  <span style={{ color: C.orange, fontWeight: 600 }}>Política de Privacidad</span>
                </span>
              </div>

              {/* Mensaje */}
              {mensaje && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 0",
                  borderBottom: `1px solid ${isError ? C.pink : "#4ADE80"}`,
                  fontFamily: SANS, fontSize: 12,
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
                disabled={isLoading || !aceptoTerminos}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  ...pillBtn,
                  opacity: isLoading || !aceptoTerminos ? 0.45 : 1,
                  cursor: isLoading || !aceptoTerminos ? "not-allowed" : "none",
                  marginTop: 4,
                }}
              >
                {isLoading
                  ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Registrando...</>
                  : "Unirse a la galería"
                }
              </button>

            </form>

            {/* Divisor */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
              <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.sub, letterSpacing: ".14em" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
            </div>

            {/* Links — pill outline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => navigate("/login")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                className="reg-pill-outline"
                style={pillOutline}
              >
                Ya tengo cuenta
              </button>
              <button
                onClick={() => navigate("/registro-artista")}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                className="reg-pill-outline"
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
              marginTop: 32, letterSpacing: ".04em",
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

        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .reg-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        .reg-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%,-50%);
          transition: width .22s, height .22s, background .22s;
        }
        .reg-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%,-50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .reg-cursor-dot.cur-over  { width: 4px; height: 4px; background: #E8640C; }
        .reg-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }

        .reg-door-wrap {
          position: fixed; inset: 0; z-index: 99990;
          display: flex; pointer-events: none;
        }
        .reg-door {
          flex: 1; background: #0D0B14;
          transition: transform 1.2s cubic-bezier(.76,0,.24,1);
        }
        .reg-door.izq  { transform-origin: left  center; }
        .reg-door.der  { transform-origin: right center; }
        .reg-door-wrap.open .reg-door.izq { transform: translateX(-100%); }
        .reg-door-wrap.open .reg-door.der { transform: translateX(100%);  }
        .reg-door-logo {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
          z-index: 99991; font-family: 'SolveraLorvane', serif;
          font-size: clamp(64px, 10vw, 130px); font-weight: 900; color: #fff;
          letter-spacing: -.03em; pointer-events: none;
          transition: opacity .35s ease .8s;
        }
        .reg-door-logo.open { opacity: 0; }
        .reg-door-sub {
          position: fixed; top: calc(50% + clamp(48px, 8vw, 104px)); left: 50%;
          transform: translateX(-50%); z-index: 99991;
          font-size: 9px; font-weight: 700; letter-spacing: .44em;
          text-transform: uppercase; color: rgba(255,255,255,.35);
          pointer-events: none; transition: opacity .3s ease .7s;
          font-family: 'Outfit', sans-serif;
        }
        .reg-door-sub.open { opacity: 0; }
        .reg-door-line {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
          z-index: 99991; width: 1px; height: 60px; background: #E8640C;
          pointer-events: none; transition: opacity .25s ease .75s;
        }
        .reg-door-line.open { opacity: 0; }

        [data-rv] { opacity:0; transform:translateY(24px); transition:opacity .9s ease, transform .9s ease; }
        [data-rv].rv-in { opacity:1; transform:translateY(0); }
        [data-rv][data-d="2"] { transition-delay: .18s; }

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

        .reg-back-btn:hover { color: #14121E !important; }
        .reg-pill-outline:hover { border-color: rgba(0,0,0,0.22) !important; color: #14121E !important; }

        @media (max-width: 768px) {
          .reg-left  { display: none !important; }
          .reg-right { flex: 1 !important; padding: 80px 32px !important; }
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
  fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 4px 20px rgba(232,100,12,.28)",
  transition: "opacity .2s",
};

const pillOutline: React.CSSProperties = {
  width: "100%", padding: "11px 24px",
  borderRadius: 100,
  background: "none",
  border: "1px solid rgba(0,0,0,0.10)",
  color: "#9896A8",
  fontSize: 9.5, fontWeight: 700,
  letterSpacing: ".18em", textTransform: "uppercase",
  cursor: "none", fontFamily: "'Outfit', sans-serif",
  transition: "border-color .22s, color .22s",
};
