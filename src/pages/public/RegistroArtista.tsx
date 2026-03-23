// src/pages/public/RegistroArtista.tsx
import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Lock, Phone, Palette, FileText,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Check, ChevronRight, ChevronLeft, Sparkles, Info
} from "lucide-react";
import logoImg from "../../assets/images/logo.png";
import obraImg1 from "../../assets/images/Artesania.webp";
import obraImg2 from "../../assets/images/OLLA.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  blue: "#79AAF5", gold: "#FFC110",
  bg: "#0f0c1a", surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.1)", text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  warning: "#FFC110",
  warningBg: "rgba(255,193,16,0.08)",
  warningBorder: "rgba(255,193,16,0.25)",
};

// ── Sanitización y validación frontend (RASP) ────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string): boolean => xssPattern.test(v) || sqliPattern.test(v);

// Validaciones de formato
const soloLetrasEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;

const validarNombreCompleto = (v: string): string | null => {
  if (!v.trim()) return "El nombre completo es obligatorio";
  if (v.trim().length < 3) return "Mínimo 3 caracteres";
  if (!soloLetrasEspacios.test(v.trim())) return "Solo letras y espacios — no se permiten números";
  if (hasSuspiciousContent(v)) return "Contenido no permitido";
  return null;
};

const validarTelefono = (v: string): string | null => {
  if (!v.trim()) return null; // opcional
  if (!/^\d{10}$/.test(v.trim())) return "Solo 10 dígitos numéricos";
  return null;
};

const validarNombreArtistico = (v: string): string | null => {
  if (!v.trim()) return null; // opcional
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

const PASOS = ["Cuenta", "Perfil"];

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

  // Errores de campo en tiempo real
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(d => setCategorias(d.categorias || d.data || []))
      .catch(() => {});
  }, []);

  const handle = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "nombre_artistico") setNombreArtisticoOcupado(false);

    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
    setMensaje("");

    // ── Validación en tiempo real ────────────────────────
    if (name === "nombre_completo") {
      const err = validarNombreCompleto(value);
      setFieldErrors(prev => ({ ...prev, nombre_completo: err ?? "" }));
    }
    if (name === "telefono") {
      const err = validarTelefono(value);
      setFieldErrors(prev => ({ ...prev, telefono: err ?? "" }));
    }
    if (name === "nombre_artistico") {
      const err = validarNombreArtistico(value);
      setFieldErrors(prev => ({ ...prev, nombre_artistico: err ?? "" }));
    }
    if (name === "biografia") {
      const err = validarBiografia(value);
      setFieldErrors(prev => ({ ...prev, biografia: err ?? "" }));
    }
    // ────────────────────────────────────────────────────
  };

  const validarPaso0 = () => {
    const errNombre = validarNombreCompleto(form.nombre_completo);
    if (errNombre) return errNombre;
    if (!form.correo.trim()) return "El correo es obligatorio";
    const emailParts = form.correo.split("@");
    if (emailParts.length !== 2 || !emailParts[1].includes(".")) return "Formato de correo inválido";
    if (hasSuspiciousContent(form.correo)) return "El correo contiene contenido no permitido";
    if (!form.contrasena) return "La contraseña es obligatoria";
    if (form.contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(form.contrasena)) return "La contraseña necesita al menos una mayúscula";
    if (!/\d/.test(form.contrasena)) return "La contraseña necesita al menos un número";
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

  // ── PASO 0: datos de cuenta ─────────────────────────────
  const renderPaso0 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field label="Nombre completo" icon={<User size={15} />}>
        <input name="nombre_completo" value={form.nombre_completo} onChange={handle}
          placeholder="Ej: María López Hernández"
          style={{ ...inputStyle, borderColor: fieldErrors.nombre_completo ? C.warning : "rgba(255,255,255,0.1)" }} />
        {fieldErrors.nombre_completo && (
          <span style={{ fontSize: 11.5, color: "#FF4D6A", fontWeight: 600, marginTop: 4, display: "block" }}>
            ⚠ {fieldErrors.nombre_completo}
          </span>
        )}
      </Field>

      <Field label="Correo electrónico" icon={<Mail size={15} />}>
        <input name="correo" type="email" value={form.correo} onChange={handle}
          placeholder="tu@correo.com" style={inputStyle} />
      </Field>

      <Field label="Contraseña" icon={<Lock size={15} />}>
        <div style={{ position: "relative" }}>
          <input name="contrasena" type={mostrarPass ? "text" : "password"}
            value={form.contrasena} onChange={handle}
            placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
            style={{ ...inputStyle, paddingRight: 44 }} />
          <button type="button" onClick={() => setMostrarPass(p => !p)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            {mostrarPass ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {form.contrasena && (
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {[
              { key: "len",     met: form.contrasena.length >= 8 },
              { key: "upper",   met: /[A-Z]/.test(form.contrasena) },
              { key: "digit",   met: /\d/.test(form.contrasena) },
              { key: "special", met: /[@$!%*?&#]/.test(form.contrasena) },
            ].map(({ key, met }) => (
              <div key={key} style={{ flex: 1, height: 3, borderRadius: 2, background: met ? C.orange : "rgba(255,255,255,0.1)", transition: "background .2s" }} />
            ))}
          </div>
        )}
      </Field>

      {mensaje && (
        <div style={alertStyle(true)}>
          <AlertCircle size={15} /> {mensaje}
        </div>
      )}

      <button type="button" onClick={siguiente} style={{ ...btnPrimary, marginTop: 8 }}>
        Continuar <ChevronRight size={17} strokeWidth={2.5} />
      </button>
    </div>
  );

  // ── PASO 1: perfil artístico ────────────────────────────
  const renderPaso1 = () => (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <Field label="Nombre artístico (opcional)" icon={<Sparkles size={15} />}>
        {(() => {
          let borderColor = "rgba(255,255,255,0.1)";
          if (nombreArtisticoOcupado) borderColor = C.warning;
          else if (fieldErrors.nombre_artistico) borderColor = "#FF4D6A";
          return (
            <input
              name="nombre_artistico"
              value={form.nombre_artistico}
              onChange={handle}
              placeholder="Ej: María Colores"
              style={{ ...inputStyle, borderColor }}
            />
          );
        })()}
        {fieldErrors.nombre_artistico && (
          <span style={{ fontSize: 11.5, color: "#FF4D6A", fontWeight: 600, marginTop: 4, display: "block" }}>
            ⚠ {fieldErrors.nombre_artistico}
          </span>
        )}
        {nombreArtisticoOcupado && (
          <div style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 10,
            background: C.warningBg, border: `1px solid ${C.warningBorder}`,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <Info size={15} color={C.warning} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.warning }}>
                Nombre artístico no disponible
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Ese nombre ya está registrado en Nu-B Studio. Por ahora escribe un <strong style={{ color: "rgba(255,255,255,0.85)" }}>nombre provisional</strong> para completar tu solicitud.
                Una vez dentro del portal podrás <strong style={{ color: C.orange }}>solicitar una aclaración al equipo</strong> si eres el artista original.
              </p>
            </div>
          </div>
        )}
      </Field>

      <Field label="Teléfono (opcional)" icon={<Phone size={15} />}>
        <input name="telefono" value={form.telefono} onChange={handle}
          placeholder="Ej: 7711234567 (10 dígitos)"
          inputMode="numeric"
          maxLength={10}
          style={{
            ...inputStyle,
            borderColor: fieldErrors.telefono ? "#FF4D6A" : "rgba(255,255,255,0.1)"
          }} />
        {fieldErrors.telefono && (
          <span style={{ fontSize: 11.5, color: "#FF4D6A", fontWeight: 600, marginTop: 4, display: "block" }}>
            ⚠ {fieldErrors.telefono}
          </span>
        )}
      </Field>

      <Field label="Categoría principal" icon={<Palette size={15} />}>
        <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={handle}
          style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Selecciona una categoría</option>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>
      </Field>

      <Field label="Biografía" icon={<FileText size={15} />}>
        <textarea name="biografia" value={form.biografia} onChange={handle}
          placeholder="Cuéntanos sobre ti, tu obra y tu inspiración... (mínimo 30 caracteres)"
          rows={4}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 100,
            borderColor: fieldErrors.biografia ? "#FF4D6A" : "rgba(255,255,255,0.1)"
          }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {fieldErrors.biografia
            ? <span style={{ fontSize: 11.5, color: "#FF4D6A", fontWeight: 600 }}>⚠ {fieldErrors.biografia}</span>
            : <span />
          }
          <span style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>{form.biografia.length} / 500</span>
        </div>
      </Field>

      {/* términos */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setForm(f => ({ ...f, acepta_terminos: !f.acepta_terminos }))}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setForm(f => ({ ...f, acepta_terminos: !f.acepta_terminos })); }}
          style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${form.acepta_terminos ? C.orange : C.border}`, background: form.acepta_terminos ? C.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .15s", cursor: "pointer" }}>
          {form.acepta_terminos && <Check size={12} color="white" strokeWidth={3} />}
        </div>
        <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          Acepto los <span style={{ color: C.orange, cursor: "pointer" }}>Términos y Condiciones</span> y entiendo que mi solicitud será revisada por el equipo de Nu-B Studio antes de ser aprobada.
        </span>
      </label>

      {mensaje && (
        <div style={alertStyle(isError)}>
          {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {mensaje}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => setPaso(0)} style={{ ...btnSecondary, flex: 1 }}>
          <ChevronLeft size={16} /> Atrás
        </button>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, flex: 2 }}>
          {loading
            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
            : <>Enviar solicitud <ChevronRight size={16} /></>
          }
        </button>
      </div>
    </form>
  );

  // ── PASO 2: éxito ───────────────────────────────────────
  const renderExito = () => (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 8px 32px ${C.orange}40` }}>
        <CheckCircle2 size={36} color="white" strokeWidth={2} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 12px", fontFamily: "'Outfit',sans-serif" }}>
        ¡Solicitud enviada!
      </h3>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: "0 0 28px" }}>
        Tu solicitud ha sido recibida. El equipo de <strong style={{ color: C.orange }}>Nu-B Studio</strong> revisará tu perfil y te notificará por correo en los próximos días.
      </p>
      <div style={{ background: "rgba(255,132,14,0.08)", border: `1px solid ${C.orange}30`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
        {[
          "Recibirás un correo con el resultado",
          "Si eres aprobado, podrás subir tus obras",
          "El equipo puede contactarte para más info",
        ].map((t, i) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
            {t}
          </div>
        ))}
      </div>
      <button onClick={() => navigate("/login")} style={btnPrimary}>
        Ir al inicio de sesión
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Outfit',sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>

      {/* ── orbs de fondo ── */}
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* ════════════════════════════════════════════════════
          PANEL IZQUIERDO
      ════════════════════════════════════════════════════ */}
      <div className="artista-banner" style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0C0812", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <img src={obraImg1} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.18, zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #0C0812 30%, rgba(12,8,18,0.7) 65%, rgba(12,8,18,0.95) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#FF840E,#CC59AD,#8D4CCD,#FFC110)", zIndex: 10 }} />

        <div style={{ position: "relative", zIndex: 3, padding: "60px 52px" }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 44, marginBottom: 40, display: "block" }} />
          <h1 style={{ fontSize: "clamp(28px,2.8vw,40px)", fontWeight: 900, color: C.text, lineHeight: 1.15, margin: "0 0 14px", fontFamily: "'Playfair Display','Georgia',serif" }}>
            Forma parte de<br />
            <span style={{ background: `linear-gradient(135deg,${C.orange},${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              nuestra galería
            </span>
          </h1>
          <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.75, margin: "0 0 36px", fontFamily: "'DM Sans',sans-serif", maxWidth: 400 }}>
            Conectamos artistas de la <strong style={{ color: "rgba(255,255,255,0.75)" }}>Huasteca Hidalguense</strong> con coleccionistas de todo México.
          </p>

          {[
            { color: C.orange, title: "Exposición nacional",         desc: "Tu obra llega a coleccionistas de todo el país" },
            { color: C.pink,   title: "Certificado de autenticidad", desc: "Cada obra recibe su certificado oficial" },
            { color: C.gold,   title: "Soporte completo",            desc: "Te acompañamos en todo el proceso de venta" },
          ].map(({ color, title, desc }) => (
            <div key={title} style={{ borderLeft: `3px solid ${color}`, padding: "10px 16px", marginBottom: 12, background: "rgba(255,255,255,0.04)", borderRadius: "0 10px 10px 0" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }}>{title}</div>
              <div style={{ fontSize: 12.5, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{desc}</div>
            </div>
          ))}

          <div style={{ marginTop: 28, background: "rgba(141,76,205,0.10)", border: "1px solid rgba(141,76,205,0.25)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.purple, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>
              Beneficios exclusivos para artistas certificados
            </div>
            {[
              { dot: C.orange, text: "Comisión del 80% por cada venta" },
              { dot: C.pink,   text: "Perfil artístico verificado" },
              { dot: C.purple, text: "Exposición en eventos locales" },
              { dot: C.gold,   text: "Asesoría en precios y packaging" },
            ].map(({ dot, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans',sans-serif" }}>{text}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", marginTop: 10, fontStyle: "italic", fontFamily: "'DM Sans',sans-serif" }}>
              (Estático — /api/artista/beneficios)
            </div>
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ animation: "floatA 7s ease-in-out infinite" }}>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,132,14,0.25)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", width: 100 }}>
                <img src={obraImg1} alt="Artesanía" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "6px 10px", background: "rgba(14,11,26,0.9)" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif" }}>Artesanía</span>
                </div>
              </div>
            </div>
            <div style={{ animation: "floatB 9s ease-in-out infinite" }}>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(204,89,173,0.25)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", width: 88 }}>
                <img src={obraImg2} alt="Cerámica" style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "6px 10px", background: "rgba(14,11,26,0.9)" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif" }}>Cerámica</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif", paddingBottom: 8, paddingLeft: 4 }}>
              +500 obras<br />en galería
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          PANEL DERECHO
      ════════════════════════════════════════════════════ */}
      <div
        style={{ width: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", position: "relative", zIndex: 2 }}
        className="artista-form-panel"
      >
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* ── Stepper ── */}
          {!terminado && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 36, gap: 0 }}>
              {PASOS.map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", flex: i < PASOS.length - 1 ? 1 : "initial" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: i <= paso ? `linear-gradient(135deg, ${C.orange}, ${C.pink})` : "rgba(255,255,255,0.06)",
                      border: `2px solid ${i <= paso ? "transparent" : "rgba(255,255,255,0.12)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800,
                      color: i <= paso ? "white" : C.muted,
                      transition: "all .3s",
                      boxShadow: i === paso ? `0 0 14px ${C.orange}55` : "none",
                      fontFamily: "'Outfit',sans-serif",
                    }}>
                      {i < paso ? <Check size={16} strokeWidth={3} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: i <= paso ? C.orange : C.muted, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.03em" }}>
                      {label}
                    </span>
                  </div>
                  {i < PASOS.length - 1 && (
                    <div style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: paso > i ? `linear-gradient(90deg, ${C.orange}, ${C.pink})` : "rgba(255,255,255,0.08)",
                      margin: "16px 10px 0",
                      transition: "background .4s",
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Card ── */}
          <div style={{
            background: "rgba(14,11,26,0.88)",
            border: "1px solid rgba(255,200,150,0.12)",
            borderRadius: 24,
            padding: "36px 32px",
            backdropFilter: "blur(24px)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #FF840E, #CC59AD, #8D4CCD, #FFC110)", borderRadius: "24px 24px 0 0" }} />

            {!terminado && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px", fontFamily: "'Playfair Display','Georgia',serif" }}>
                  {paso === 0 ? "Crea tu cuenta" : "Tu perfil artístico"}
                </h2>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", fontFamily: "'DM Sans',sans-serif" }}>
                  {paso === 0 ? "Datos de acceso a tu cuenta" : "Cuéntanos sobre tu arte"}
                </p>
              </>
            )}

            {paso === 0 && !terminado && renderPaso0()}
            {paso === 1 && !terminado && renderPaso1()}
            {terminado && renderExito()}
          </div>

          <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20, fontFamily: "'DM Sans',sans-serif" }}>
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontWeight: 700, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>
              Inicia sesión
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-12px) rotate(-4deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(5deg)} 50%{transform:translateY(-8px) rotate(7deg)} }
        @media (max-width: 900px) {
          .artista-banner { display: none !important; }
          .artista-form-panel { width: 100% !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────
function Field({ label, icon, children }: { readonly label: string; readonly icon: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

const alertStyle = (isError: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 8,
  padding: "10px 14px", borderRadius: 10,
  background: isError ? "rgba(204,89,173,0.12)" : "rgba(74,222,128,0.12)",
  border: `1px solid ${isError ? "#CC59AD" : "#4ADE80"}`,
  fontSize: 13, color: isError ? "#CC59AD" : "#4ADE80",
});

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff", fontSize: 14,
  fontFamily: "'DM Sans','Outfit',sans-serif",
  outline: "none", transition: "border .15s",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: `linear-gradient(135deg, #FF840E, #CC59AD)`,
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'DM Sans','Outfit',sans-serif",
  boxShadow: "0 8px 24px rgba(255,132,14,0.3)",
};

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "13px 20px", borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans','Outfit',sans-serif",
};