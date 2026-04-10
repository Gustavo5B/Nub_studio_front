// src/pages/public/RegistroArtista.tsx
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check, ArrowLeft
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  ink:    "#14121E",
  sub:    "#9896A8",
  warning: "#A87006",
  warningBg: "rgba(168,112,6,0.07)",
  warningBorder: "rgba(168,112,6,0.22)",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

// ── Sanitización y validación frontend (RASP) ────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string): boolean => xssPattern.test(v) || sqliPattern.test(v);

const soloLetrasEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;

const validarNombreCompleto = (v: string): string | null => {
  if (!v.trim()) return "El nombre completo es obligatorio";
  if (v.trim().length < 3) return "Mínimo 3 caracteres";
  if (!soloLetrasEspacios.test(v.trim())) return "Solo letras y espacios";
  if (hasSuspiciousContent(v)) return "Contenido no permitido";
  return null;
};

const validarTelefono = (v: string): string | null => {
  if (!v.trim()) return null;
  if (!/^\d{10}$/.test(v.trim())) return "Solo 10 dígitos numéricos";
  return null;
};

const validarNombreArtistico = (v: string): string | null => {
  if (!v.trim()) return null;
  if (v.trim().length < 2) return "Mínimo 2 caracteres";
  if (hasSuspiciousContent(v)) return "Contenido no permitido";
  return null;
};

const validarBiografia = (v: string): string | null => {
  if (!v.trim()) return "La biografía es obligatoria";
  if (v.trim().length < 30) return "Mínimo 30 caracteres";
  if (hasSuspiciousContent(v)) return "Contenido no permitido";
  return null;
};
// ─────────────────────────────────────────────────────────────

interface Categoria { id_categoria: number; nombre: string; }

export default function RegistroArtista() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [terminado, setTerminado] = useState(false);
  const [nombreArtisticoOcupado, setNombreArtisticoOcupado] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  interface PasswordReq { text: string; met: boolean; }
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
  const strengthColor = ["transparent", C.pink, "#F59E0B", "#A87006", C.orange, C.orange][metCount];

  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    contrasena: "",
    nombre_artistico: "",
    telefono: "",
    biografia: "",
    id_categoria_principal: "",
    acepta_terminos: false,
  });

  // Custom cursor
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(d => setCategorias(d.categorias || d.data || []))
      .catch(() => {});
  }, []);

  // ─── Custom cursor ────────────────────────────────────────────
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

  const cursorOn  = () => { dotRef.current?.classList.add("cur-over");  ringRef.current?.classList.add("cur-over");  };
  const cursorOff = () => { dotRef.current?.classList.remove("cur-over"); ringRef.current?.classList.remove("cur-over"); };

  const handle = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "nombre_artistico") setNombreArtisticoOcupado(false);
    setForm(f => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
    setMensaje("");
    if (name === "contrasena") validatePassword(value);
    if (name === "nombre_completo") { const err = validarNombreCompleto(value); setFieldErrors(p => ({ ...p, nombre_completo: err ?? "" })); }
    if (name === "telefono")        { const err = validarTelefono(value);        setFieldErrors(p => ({ ...p, telefono: err ?? "" })); }
    if (name === "nombre_artistico"){ const err = validarNombreArtistico(value); setFieldErrors(p => ({ ...p, nombre_artistico: err ?? "" })); }
    if (name === "biografia")       { const err = validarBiografia(value);       setFieldErrors(p => ({ ...p, biografia: err ?? "" })); }
  };

  const validarPaso0 = () => {
    const errNombre = validarNombreCompleto(form.nombre_completo);
    if (errNombre) return errNombre;
    if (!form.correo.trim()) return "El correo es obligatorio";
    const emailParts = form.correo.split("@");
    if (emailParts.length !== 2 || !emailParts[1].includes(".")) return "Formato de correo inválido";
    if (hasSuspiciousContent(form.correo)) return "El correo contiene contenido no permitido";
    if (!form.contrasena) return "La contraseña es obligatoria";
    if (form.contrasena.length < 8)          return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(form.contrasena))      return "La contraseña necesita al menos una mayúscula";
    if (!/[a-z]/.test(form.contrasena))      return "La contraseña necesita al menos una minúscula";
    if (!/\d/.test(form.contrasena))         return "La contraseña necesita al menos un número";
    if (!/[@$!%*?&#]/.test(form.contrasena)) return "La contraseña necesita al menos un carácter especial";
    return null;
  };

  const validarPaso1 = () => {
    const errBio = validarBiografia(form.biografia);
    if (errBio) return errBio;
    const errTel = validarTelefono(form.telefono);
    if (errTel) return errTel;
    const errNomArt = validarNombreArtistico(form.nombre_artistico);
    if (errNomArt) return errNomArt;
    if (!form.id_categoria_principal) return "Selecciona una categoría principal";
    if (!form.acepta_terminos) return "Debes aceptar los términos y condiciones";
    return null;
  };

  const siguiente = () => {
    const error = paso === 0 ? validarPaso0() : null;
    if (error) { setMensaje(error); setIsError(true); return; }
    setMensaje("");
    setPaso(p => p + 1);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const error = validarPaso1();
    if (error) { setMensaje(error); setIsError(true); return; }
    setLoading(true);
    setMensaje("");
    setNombreArtisticoOcupado(false);
    try {
      const res = await fetch(`${API_URL}/api/auth/registro-artista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_completo: form.nombre_completo,
          correo: form.correo,
          contrasena: form.contrasena,
          nombre_artistico: form.nombre_artistico || null,
          telefono: form.telefono || null,
          biografia: form.biografia,
          id_categoria_principal: Number.parseInt(form.id_categoria_principal, 10),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.nombreArtisticoOcupado) {
        setNombreArtisticoOcupado(true);
        setForm(f => ({ ...f, nombre_artistico: "" }));
        setMensaje("");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.message || "Error al registrar");
      setTerminado(true);
      setPaso(2);
    } catch (err: unknown) {
      setMensaje((err instanceof Error ? err.message : null) || "Error al registrar. Intenta de nuevo.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── PASO 0 ──────────────────────────────────────────────────
  const renderPaso0 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <label style={labelStyle}>Nombre completo</label>
        <input name="nombre_completo" value={form.nombre_completo} onChange={handle}
          placeholder="Ej: María López Hernández"
          onFocus={e => { e.currentTarget.style.borderBottomColor = fieldErrors.nombre_completo ? "#C4304A" : C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = fieldErrors.nombre_completo ? "#C4304A" : "rgba(0,0,0,0.12)"; }}
          style={{ ...lineInput, borderBottomColor: fieldErrors.nombre_completo ? "#C4304A" : "rgba(0,0,0,0.12)" }} />
        {fieldErrors.nombre_completo && <FieldError>{fieldErrors.nombre_completo}</FieldError>}
      </div>

      <div>
        <label style={labelStyle}>Correo electrónico</label>
        <input name="correo" type="email" value={form.correo} onChange={handle}
          placeholder="tu@correo.com"
          onFocus={e => { e.currentTarget.style.borderBottomColor = C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.12)"; }}
          style={lineInput} />
      </div>

      <div>
        <label style={labelStyle}>Contraseña</label>
        <div style={{ position: "relative" }}>
          <input name="contrasena" type={mostrarPass ? "text" : "password"}
            value={form.contrasena} onChange={handle}
            placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
            onFocus={e => { e.currentTarget.style.borderBottomColor = C.orange; }}
            onBlur={e  => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.12)"; }}
            style={{ ...lineInput, paddingRight: 32 }} />
          <button type="button"
            onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            onClick={() => setMostrarPass(p => !p)}
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: mostrarPass ? C.orange : C.sub, display: "flex", alignItems: "center", transition: "color .2s", padding: 4 }}>
            {mostrarPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {form.contrasena.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ flex: 1, height: 2, borderRadius: 1, background: n <= metCount ? strengthColor : "rgba(0,0,0,0.07)", transition: "background .2s" }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {passReqs.map(req => (
                <div key={req.text} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: SANS, fontSize: 11, color: req.met ? "#0E8A50" : C.sub, letterSpacing: ".02em", transition: "color .2s" }}>
                  {req.met ? <CheckCircle2 size={11} color="#0E8A50" /> : <AlertCircle size={11} color="#9896A8" />}
                  {req.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mensaje && <MsgAlert isError={isError}>{mensaje}</MsgAlert>}

      <button type="button"
        onMouseEnter={cursorOn} onMouseLeave={cursorOff}
        onClick={siguiente} style={{ ...pillBtn, marginTop: 4 }}>
        Continuar
      </button>
    </div>
  );

  // ── PASO 1 ──────────────────────────────────────────────────
  const renderPaso1 = () => (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <label style={labelStyle}>Nombre artístico <span style={{ color: C.sub, fontWeight: 400 }}>(opcional)</span></label>
        <input name="nombre_artistico" value={form.nombre_artistico} onChange={handle}
          placeholder="Ej: María Colores"
          onFocus={e => { e.currentTarget.style.borderBottomColor = (nombreArtisticoOcupado || fieldErrors.nombre_artistico) ? "#C4304A" : C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = (nombreArtisticoOcupado || fieldErrors.nombre_artistico) ? "#C4304A" : "rgba(0,0,0,0.12)"; }}
          style={{ ...lineInput, borderBottomColor: (nombreArtisticoOcupado || fieldErrors.nombre_artistico) ? "#C4304A" : "rgba(0,0,0,0.12)" }} />
        {fieldErrors.nombre_artistico && <FieldError>{fieldErrors.nombre_artistico}</FieldError>}
        {nombreArtisticoOcupado && (
          <div style={{ marginTop: 10, padding: "10px 0", borderBottom: `1px solid ${C.warning}`, fontSize: 12, color: C.warning, fontFamily: SANS, letterSpacing: ".02em" }}>
            Ese nombre ya está registrado. Escribe uno provisional y podrás solicitar aclaración al equipo dentro del portal.
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Teléfono <span style={{ color: C.sub, fontWeight: 400 }}>(opcional)</span></label>
        <input name="telefono" value={form.telefono} onChange={handle}
          placeholder="10 dígitos" inputMode="numeric" maxLength={10}
          onFocus={e => { e.currentTarget.style.borderBottomColor = fieldErrors.telefono ? "#C4304A" : C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = fieldErrors.telefono ? "#C4304A" : "rgba(0,0,0,0.12)"; }}
          style={{ ...lineInput, borderBottomColor: fieldErrors.telefono ? "#C4304A" : "rgba(0,0,0,0.12)" }} />
        {fieldErrors.telefono && <FieldError>{fieldErrors.telefono}</FieldError>}
      </div>

      <div>
        <label style={labelStyle}>Categoría principal</label>
        <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={handle}
          onFocus={e => { e.currentTarget.style.borderBottomColor = C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.12)"; }}
          style={{ ...lineInput, cursor: "pointer", appearance: "none" as const }}>
          <option value="">Selecciona una categoría</option>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Biografía</label>
        <textarea name="biografia" value={form.biografia} onChange={handle}
          placeholder="Cuéntanos sobre ti, tu obra y tu inspiración... (mínimo 30 caracteres)"
          rows={4}
          onFocus={e => { e.currentTarget.style.borderBottomColor = fieldErrors.biografia ? "#C4304A" : C.orange; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = fieldErrors.biografia ? "#C4304A" : "rgba(0,0,0,0.12)"; }}
          style={{ ...lineInput, resize: "vertical", minHeight: 90, borderBottomColor: fieldErrors.biografia ? "#C4304A" : "rgba(0,0,0,0.12)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {fieldErrors.biografia
            ? <FieldError>{fieldErrors.biografia}</FieldError>
            : <span />}
          <span style={{ fontFamily: SANS, fontSize: 10, color: C.sub, letterSpacing: ".06em" }}>{form.biografia.length} / 500</span>
        </div>
      </div>

      {/* Términos */}
      <div
        role="button" tabIndex={0}
        onMouseEnter={cursorOn} onMouseLeave={cursorOff}
        onClick={() => setForm(f => ({ ...f, acepta_terminos: !f.acepta_terminos }))}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setForm(f => ({ ...f, acepta_terminos: !f.acepta_terminos })); }}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1, border: `1.5px solid ${form.acepta_terminos ? C.orange : "rgba(0,0,0,0.18)"}`, background: form.acepta_terminos ? C.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
          {form.acepta_terminos && <Check size={10} color="white" strokeWidth={3} />}
        </div>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.sub, lineHeight: 1.6, letterSpacing: ".02em" }}>
          Acepto los <span style={{ color: C.orange, fontWeight: 600 }}>Términos y Condiciones</span> y entiendo que mi solicitud será revisada por el equipo antes de ser aprobada.
        </span>
      </div>

      {mensaje && <MsgAlert isError={isError}>{mensaje}</MsgAlert>}

      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button type="button"
          onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          onClick={() => setPaso(0)} style={pillOutline}>
          Atrás
        </button>
        <button type="submit" disabled={loading}
          onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ ...pillBtn, flex: 2, opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
            : "Enviar solicitud"
          }
        </button>
      </div>
    </form>
  );

  // ── ÉXITO ───────────────────────────────────────────────────
  const renderExito = () => (
    <div style={{ padding: "12px 0" }}>
      <p style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, margin: "0 0 20px" }}>
        Solicitud enviada
      </p>
      <h3 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 900, color: C.ink, margin: "0 0 16px", letterSpacing: "-.02em", lineHeight: 1.1 }}>
        Bienvenido<br />a la galería.
      </h3>
      <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`, margin: "0 0 24px" }} />
      <p style={{ fontFamily: SANS, fontSize: 13, color: C.sub, lineHeight: 1.8, margin: "0 0 28px" }}>
        Tu perfil ha sido recibido. El equipo de <span style={{ color: C.ink, fontWeight: 600 }}>ALTAR</span> revisará tu solicitud y te notificará por correo en los próximos días.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 32px" }}>
        {[
          "Recibirás un correo con el resultado",
          "Si eres aprobado, podrás subir tus obras",
          "El equipo puede contactarte para más info",
        ].map(t => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 12, color: C.sub, letterSpacing: ".02em" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
            {t}
          </div>
        ))}
      </div>
      <button
        onMouseEnter={cursorOn} onMouseLeave={cursorOff}
        onClick={() => navigate("/login")} style={pillBtn}>
        Ir al inicio de sesión
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS, position: "relative", overflow: "hidden" }}>

      {/* ── Grain ── */}
      <div className="ra-grain" />

      {/* ── Custom cursor ── */}
      <div ref={dotRef}  className="ra-cursor-dot"  />
      <div ref={ringRef} className="ra-cursor-ring" />

      {/* ── Volver ── */}
      <button
        onClick={() => navigate("/")}
        onMouseEnter={cursorOn} onMouseLeave={cursorOff}
        className="ra-back-btn"
        style={{ position: "fixed", top: 28, left: 52, zIndex: 300, display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, transition: "color .25s", padding: 0 }}
      >
        <ArrowLeft size={11} strokeWidth={2.5} />
        Volver
      </button>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ════ PANEL IZQUIERDO — Carta al artista ════ */}
        <div className="ra-left" style={{
          flex: "0 0 52%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 64px",
          borderRight: "1px solid rgba(0,0,0,0.055)",
          overflow: "hidden",
        }}>

          <div className="lc tl" /><div className="lc tr" />
          <div className="lc bl" /><div className="lc br" />

          <div style={{ position: "absolute", top: "18%", right: -1, width: 1, height: "64%", background: `linear-gradient(180deg, transparent, ${C.orange}70, ${C.pink}70, transparent)`, zIndex: 2 }} />

          {/* ═══ ALTAR WATERMARK — ESTÁTICO (SIN ANIMACIÓN) ═══ */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
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

          {/* Carta */}
          <div style={{ width: "100%", paddingLeft: 88, position: "relative", zIndex: 2 }}>

            <div>
              <p style={{ fontFamily: SANS, fontStyle: "italic", fontSize: 13, color: C.sub, letterSpacing: ".04em", margin: "0 0 32px" }}>
                — Para el artista,
              </p>

              <p style={{ fontFamily: SANS, fontSize: 15, color: C.ink, lineHeight: 1.9, margin: "0 0 24px", fontWeight: 400 }}>
                Tu trabajo merece<br />
                estar donde<br />
                pertenece.
              </p>

              <p style={{ fontFamily: SANS, fontSize: 15, color: C.sub, lineHeight: 1.9, margin: "0 0 48px", fontWeight: 400 }}>
                Comparte tu arte<br />
                con quienes<br />
                lo aprecian.
              </p>

              <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`, margin: "0 0 14px" }} />

              <p style={{ fontFamily: SERIF, fontSize: "clamp(22px, 2.8vw, 32px)", fontWeight: 900, color: C.ink, letterSpacing: "-.01em", margin: 0, lineHeight: 1 }}>
                ALTAR
              </p>
            </div>

          </div>
        </div>

        {/* ════ PANEL DERECHO ════ */}
        <div className="ra-right" style={{ flex: "0 0 48%", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 64px", position: "relative", overflowY: "auto" }}>

          <div className="fc tl" /><div className="fc tr" />
          <div className="fc bl" /><div className="fc br" />

          <div style={{ width: "100%", maxWidth: 360 }}>

            {/* Stepper editorial */}
            {!terminado && (
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 44 }}>
                {["Cuenta", "Perfil"].map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", flex: i === 0 ? 1 : "initial" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{ fontFamily: NEXA_HEAVY, fontSize: 22, fontWeight: 900, color: i <= paso ? C.orange : "rgba(0,0,0,0.12)", lineHeight: 1, transition: "color .3s" }}>
                        0{i + 1}
                      </span>
                      <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: i <= paso ? C.ink : C.sub, transition: "color .3s" }}>
                        {label}
                      </span>
                    </div>
                    {i === 0 && (
                      <div style={{ flex: 1, height: 1, margin: "0 16px 14px", background: paso > 0 ? `linear-gradient(90deg, ${C.orange}, ${C.pink})` : "rgba(0,0,0,0.08)", transition: "background .4s" }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {paso === 0 && !terminado && renderPaso0()}
            {paso === 1 && !terminado && renderPaso1()}
            {terminado && renderExito()}

            {!terminado && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                  <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.sub, letterSpacing: ".14em" }}>o</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                </div>
                <button
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  onClick={() => navigate("/login")}
                  className="ra-pill-outline" style={pillOutline}>
                  Ya tengo cuenta
                </button>
              </>
            )}

            <p style={{ fontFamily: SANS, fontSize: 10.5, color: "rgba(0,0,0,0.28)", textAlign: "center", marginTop: 32, letterSpacing: ".04em" }}>
              © {new Date().getFullYear()} ALTAR Galería de Arte
            </p>

          </div>
        </div>

      </div>

      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-weight:900; font-style:normal; font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-weight:900; font-style:normal; font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .ra-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026; background-image:url("image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:160px 160px; mix-blend-mode:multiply; }

        .ra-cursor-dot { position:fixed; width:6px; height:6px; border-radius:50%; background:#14121E; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
        .ra-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
        .ra-cursor-dot.cur-over  { width:4px; height:4px; background:#E8640C; }
        .ra-cursor-ring.cur-over { width:52px; height:52px; border-color:#E8640C; }

        .lc { position:absolute; width:34px; height:34px; pointer-events:none; }
        .lc::before,.lc::after { content:''; position:absolute; background:rgba(0,0,0,0.08); }
        .lc::before { width:1px; height:34px; }
        .lc::after  { width:34px; height:1px; }
        .lc.tl { top:24px; left:24px; }
        .lc.tr { top:24px; right:24px; }
        .lc.tr::before { right:0; left:auto; }
        .lc.tr::after  { right:0; left:auto; }
        .lc.bl { bottom:24px; left:24px; }
        .lc.bl::before { bottom:0; top:auto; }
        .lc.bl::after  { bottom:0; top:auto; }
        .lc.br { bottom:24px; right:24px; }
        .lc.br::before { right:0; left:auto; bottom:0; top:auto; }
        .lc.br::after  { right:0; left:auto; bottom:0; top:auto; }

        .fc { position:absolute; width:22px; height:22px; pointer-events:none; }
        .fc::before,.fc::after { content:''; position:absolute; background:rgba(232,100,12,0.30); }
        .fc::before { width:1px; height:22px; }
        .fc::after  { width:22px; height:1px; }
        .fc.tl { top:36px; left:36px; }
        .fc.tr { top:36px; right:36px; }
        .fc.tr::before { right:0; left:auto; }
        .fc.tr::after  { right:0; left:auto; }
        .fc.bl { bottom:36px; left:36px; }
        .fc.bl::before { bottom:0; top:auto; }
        .fc.bl::after  { bottom:0; top:auto; }
        .fc.br { bottom:36px; right:36px; }
        .fc.br::before { right:0; left:auto; bottom:0; top:auto; }
        .fc.br::after  { right:0; left:auto; bottom:0; top:auto; }

        .ra-back-btn:hover { color:#14121E !important; }
        .ra-pill-outline:hover { border-color:rgba(0,0,0,0.22) !important; color:#14121E !important; }

        @media (max-width: 768px) {
          .ra-left  { display:none !important; }
          .ra-right { flex:1 !important; padding:80px 32px !important; }
          .fc { display:none; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────
function FieldError({ children }: { readonly children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#C4304A", marginTop: 5, display: "block", letterSpacing: ".04em" }}>
      {children}
    </span>
  );
}

function MsgAlert({ children, isError }: { readonly children: React.ReactNode; readonly isError: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${isError ? "#A83B90" : "#4ADE80"}`, fontFamily: "'Outfit',sans-serif", fontSize: 12, color: isError ? "#A83B90" : "#16A34A", letterSpacing: ".04em" }}>
      {isError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 9.5, fontWeight: 700,
  letterSpacing: ".20em", textTransform: "uppercase",
  color: "#9896A8", marginBottom: 10,
};

const lineInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 0", border: "none",
  borderBottom: "1.5px solid rgba(0,0,0,0.12)",
  background: "transparent", color: "#14121E",
  fontSize: 15, fontFamily: "'Outfit', sans-serif",
  outline: "none", transition: "border-color .2s",
};

const pillBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 24px", borderRadius: 100,
  background: "#E8640C", border: "none", color: "#fff",
  fontSize: 9.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase",
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 4px 20px rgba(232,100,12,.28)", transition: "opacity .2s",
};

const pillOutline: React.CSSProperties = {
  width: "100%", padding: "11px 24px", borderRadius: 100,
  background: "none", border: "1px solid rgba(0,0,0,0.10)",
  color: "#9896A8", fontSize: 9.5, fontWeight: 700,
  letterSpacing: ".18em", textTransform: "uppercase",
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  transition: "border-color .22s, color .22s",
};