// src/pages/public/RegistroArtista.tsx
import { useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Lock, Phone, Palette, FileText,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Check, ChevronRight, ChevronLeft, Sparkles, Info
} from "lucide-react";
import logoImg from "../../assets/images/logo.png";

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

  // ── nuevo estado para nombre artístico ocupado ──────────
  const [nombreArtisticoOcupado, setNombreArtisticoOcupado] = useState(false);

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
    // si el artista empieza a escribir un nombre nuevo, limpiamos el aviso
    if (name === "nombre_artistico") {
      setNombreArtisticoOcupado(false);
    }
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
    setMensaje("");
  };

  const validarPaso0 = () => {
    if (!form.nombre_completo.trim()) return "El nombre completo es obligatorio";
    if (form.nombre_completo.length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (!form.correo.trim()) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return "Formato de correo inválido";
    if (!form.contrasena) return "La contraseña es obligatoria";
    if (form.contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(form.contrasena)) return "La contraseña necesita al menos una mayúscula";
    if (!/[0-9]/.test(form.contrasena)) return "La contraseña necesita al menos un número";
    return null;
  };

  const validarPaso1 = () => {
    if (!form.biografia.trim()) return "La biografía es obligatoria";
    if (form.biografia.length < 30) return "La biografía debe tener al menos 30 caracteres";
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

  const handleSubmit = async (e: FormEvent) => {
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
          id_categoria_principal: parseInt(form.id_categoria_principal),
        }),
      });

      const data = await res.json();

      // ── nombre artístico ocupado (409) ──────────────────
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
    } catch (err: any) {
      setMensaje(err.message || "Error al registrar. Intenta de nuevo.");
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
          placeholder="Ej: María López Hernández" style={inputStyle} />
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
              form.contrasena.length >= 8,
              /[A-Z]/.test(form.contrasena),
              /[0-9]/.test(form.contrasena),
              /[@$!%*?&#]/.test(form.contrasena),
            ].map((met, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: met ? C.orange : "rgba(255,255,255,0.1)", transition: "background .2s" }} />
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

      {/* nombre artístico + aviso si está ocupado */}
      <Field label="Nombre artístico (opcional)" icon={<Sparkles size={15} />}>
        <input
          name="nombre_artistico"
          value={form.nombre_artistico}
          onChange={handle}
          placeholder="Ej: María Colores"
          style={{
            ...inputStyle,
            borderColor: nombreArtisticoOcupado ? C.warning : "rgba(255,255,255,0.1)",
          }}
        />

        {/* aviso nombre ocupado */}
        {nombreArtisticoOcupado && (
          <div style={{
            marginTop: 10,
            padding: "12px 14px",
            borderRadius: 10,
            background: C.warningBg,
            border: `1px solid ${C.warningBorder}`,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}>
            <Info size={15} color={C.warning} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.warning }}>
                Nombre artístico no disponible
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Ese nombre ya está registrado en Nu-B Studio. Por ahora escribe un <strong style={{ color: "rgba(255,255,255,0.85)" }}>nombre provisional</strong> para completar tu solicitud.
                Una vez dentro del portal podrás <strong style={{ color: C.orange }}>solicitar una aclaración al equipo</strong> si eres el artista original y consideras que hubo una suplantación.
              </p>
            </div>
          </div>
        )}
      </Field>

      <Field label="Teléfono (opcional)" icon={<Phone size={15} />}>
        <input name="telefono" value={form.telefono} onChange={handle}
          placeholder="Ej: 7711234567" style={inputStyle} />
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
          rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} />
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: "right" }}>
          {form.biografia.length} / 500
        </div>
      </Field>

      {/* términos */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <div onClick={() => setForm(f => ({ ...f, acepta_terminos: !f.acepta_terminos }))}
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
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
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
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>
      {/* orbs de fondo */}
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* panel izquierdo */}
      <div className="artista-banner" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", position: "relative" }}>
        <div style={{ maxWidth: 400 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 52, marginBottom: 32 }} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.1, margin: "0 0 16px" }}>
            Forma parte de<br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>nuestra galería</span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 40px" }}>
            Conectamos artistas de la Huasteca con coleccionistas de todo México. Comparte tu arte y genera ingresos con tu pasión.
          </p>

          {[
            { icon: <Palette size={18} color={C.orange} />, title: "Exposición nacional", desc: "Tu obra llega a coleccionistas de todo el país" },
            { icon: <Sparkles size={18} color={C.pink} />, title: "Certificado de autenticidad", desc: "Cada obra recibe su certificado oficial" },
            { icon: <CheckCircle2 size={18} color={C.gold} />, title: "Soporte completo", desc: "Te acompañamos en todo el proceso de venta" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

      {/* panel derecho */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", position: "relative" }} className="artista-form-panel">
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* stepper */}
          {!terminado && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 0 }}>
              {PASOS.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < PASOS.length - 1 ? 1 : "initial" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: i <= paso ? `linear-gradient(135deg, ${C.orange}, ${C.pink})` : "rgba(255,255,255,0.08)", border: `2px solid ${i <= paso ? "transparent" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: i <= paso ? "white" : C.muted, transition: "all .3s" }}>
                      {i < paso ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 11, color: i <= paso ? C.orange : C.muted, fontWeight: i <= paso ? 600 : 400 }}>{label}</span>
                  </div>
                  {i < PASOS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: paso > i ? `linear-gradient(90deg, ${C.orange}, ${C.pink})` : "rgba(255,255,255,0.1)", margin: "0 8px 16px", transition: "background .3s" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: "32px 28px", backdropFilter: "blur(20px)" }}>
            {!terminado && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px", fontFamily: "'Outfit',sans-serif" }}>
                  {paso === 0 ? "Crea tu cuenta" : "Tu perfil artístico"}
                </h2>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px" }}>
                  {paso === 0 ? "Datos de acceso a tu cuenta" : "Cuéntanos sobre tu arte"}
                </p>
              </>
            )}

            {paso === 0 && !terminado && renderPaso0()}
            {paso === 1 && !terminado && renderPaso1()}
            {terminado && renderExito()}
          </div>

          <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20 }}>
            ¿Ya tienes cuenta?{" "}
            <span onClick={() => navigate("/login")} style={{ color: C.orange, cursor: "pointer", fontWeight: 600 }}>
              Inicia sesión
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .artista-banner { display: none !important; }
          .artista-form-panel { width: 100% !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
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
  fontFamily: "'Outfit',sans-serif",
  outline: "none", transition: "border .15s",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: `linear-gradient(135deg, #FF840E, #CC59AD)`,
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Outfit',sans-serif",
  boxShadow: "0 8px 24px rgba(255,132,14,0.3)",
};

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "13px 20px", borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "'Outfit',sans-serif",
};