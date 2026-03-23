// src/pages/public/ActivarCuenta.tsx
// Ruta: /activar-cuenta?token=xxxxx
// Uso:  Artista creado por admin → define contraseña → queda logueado directo

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader, ShieldCheck, ArrowRight } from "lucide-react";

// ── Importa tu authService real aquí ──────────────────────────
// import { authService } from "../../services/authService";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(20,15,34,0.95)",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.20)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Requisitos de contraseña ───────────────────────────────────
const requisitos = [
  { id: "len",   label: "Al menos 8 caracteres",          test: (p: string) => p.length >= 8               },
  { id: "upper", label: "Una letra mayúscula",            test: (p: string) => /[A-Z]/.test(p)             },
  { id: "lower", label: "Una letra minúscula",            test: (p: string) => /[a-z]/.test(p)             },
  { id: "num",   label: "Un número",                      test: (p: string) => /\d/.test(p)                },
];

function LogoMark({ size = 38 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoAC" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoAC)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoAC)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoAC)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ── Medidor de fortaleza ───────────────────────────────────────
function FuerzaPassword({ password }: { readonly password: string }) {
  const score = requisitos.filter(r => r.test(password)).length;
  const niveles = [
    { label: "Muy débil",  color: "#ef4444" },
    { label: "Débil",      color: C.pink    },
    { label: "Regular",    color: C.gold    },
    { label: "Buena",      color: C.blue    },
    { label: "Excelente",  color: C.green   },
  ];
  const nivel = niveles[score];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {niveles.map((n, i) => (
          <div key={n.label} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? n.color : "rgba(255,232,200,0.1)",
            transition: "background .3s",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: nivel.color, fontWeight: 700, fontFamily: FB, letterSpacing: "0.05em" }}>
        {nivel.label}
      </div>
    </div>
  );
}

// ── Input de contraseña ────────────────────────────────────────
function InputPassword({
  label, value, onChange, placeholder, error,
}: {
  readonly label: string; readonly value: string; readonly onChange: (v: string) => void;
  readonly placeholder?: string; readonly error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? `${C.pink}60` : focused ? `${C.orange}50` : C.border;
  const shadowColor = error ? C.pink : C.orange;
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: FB }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,232,200,0.04)",
        border: `1px solid ${borderColor}`,
        borderRadius: 12, padding: "0 14px",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: focused ? `0 0 0 3px ${shadowColor}12` : "none",
      }}>
        <Lock size={15} color={focused ? C.orange : C.creamMut} strokeWidth={1.8} style={{ flexShrink: 0, transition: "color .2s" }} />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            color: C.cream, fontSize: 14.5, fontFamily: FB, padding: "14px 0",
          }}
        />
        <button type="button" onClick={() => setVisible(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: C.creamMut, transition: "color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.cream}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}
        >
          {visible ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
        </button>
      </div>
      {error && <div style={{ marginTop: 6, fontSize: 12, color: C.pink, fontFamily: FB, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={11} strokeWidth={2} />{error}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═════════════════════════════════════════════════════════════
export default function ActivarCuenta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password,    setPassword]    = useState("");
  const [confirmar,   setConfirmar]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const [exito,       setExito]       = useState(false);
  const [error,       setError]       = useState("");
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [correoExp,   setCorreoExp]   = useState("");

  // Validar que el token existe al montar
  useEffect(() => {
    if (!token) { setTokenValido(false); return; }
    setTokenValido(true);
  }, [token]);

  const cumpleRequisitos = requisitos.every(r => r.test(password));
  const coinciden        = password === confirmar;
  const puedeEnviar      = cumpleRequisitos && coinciden && password.length > 0 && confirmar.length > 0;

  const handleSubmit = async () => {
    if (!puedeEnviar || loading) return;
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/activar-cuenta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.expired) setCorreoExp(json.correo || "");
        setError(json.message || "Error al activar la cuenta");
        setLoading(false);
        return;
      }

      // Guardar sesión igual que el login normal
      if (json.access_token) {
        localStorage.setItem("access_token", json.access_token);
        localStorage.setItem("isLoggedIn",   "true");
        localStorage.setItem("userName",     json.usuario?.nombre  || "");
        localStorage.setItem("userEmail",    json.usuario?.correo  || "");
        localStorage.setItem("userId",       String(json.usuario?.id || ""));
      }

      setExito(true);
      setTimeout(() => navigate("/artista/dashboard"), 2200);

    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setLoading(false);
    }
  };

  // ── Token inválido / sin token ────────────────────────────
  if (tokenValido === false) {
    return (
      <Wrapper>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `${C.pink}18`, border: `1px solid ${C.pink}35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 6px 24px ${C.pink}28` }}>
            <AlertCircle size={28} color={C.pink} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 22, fontWeight: 900, color: C.cream, margin: "0 0 10px" }}>Enlace inválido</h2>
          <p style={{ color: C.creamSub, fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
            Este enlace no es válido o ya fue utilizado.<br />Solicita uno nuevo a tu administrador.
          </p>
          <LinkButton onClick={() => navigate("/login")}>Ir al inicio de sesión</LinkButton>
        </div>
      </Wrapper>
    );
  }

  // ── Éxito ─────────────────────────────────────────────────
  if (exito) {
    return (
      <Wrapper>
        <div style={{ textAlign: "center", animation: "fadeUp .5s ease both" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `${C.green}18`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: `0 8px 32px ${C.green}30` }}>
            <CheckCircle size={34} color={C.green} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 24, fontWeight: 900, color: C.cream, margin: "0 0 10px" }}>¡Cuenta activada!</h2>
          <p style={{ color: C.creamSub, fontSize: 14.5, lineHeight: 1.7, margin: "0 0 8px" }}>
            Tu contraseña fue creada correctamente.
          </p>
          <p style={{ color: C.creamMut, fontSize: 13, margin: "0 0 28px" }}>
            Redirigiendo a tu portal de artista…
          </p>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {[C.orange, C.pink, C.purple, C.blue, C.green].map((c, i) => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, animation: `pulse 1.2s ease ${i * 0.15}s infinite` }} />
            ))}
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── Formulario principal ──────────────────────────────────
  return (
    <Wrapper>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp .45s ease both" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <LogoMark size={44} />
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 100, background: `${C.orange}15`, border: `1px solid ${C.orange}35`, marginBottom: 14 }}>
          <ShieldCheck size={11} color={C.orange} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>Activación de cuenta</span>
        </div>
        <h1 style={{ fontFamily: FD, fontSize: 26, fontWeight: 900, color: C.cream, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Crea tu{" "}
          <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>contraseña</span>
        </h1>
        <p style={{ color: C.creamSub, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Has sido registrado como artista en Nu-B Studio.<br />
          Elige una contraseña segura para acceder a tu portal.
        </p>
      </div>

      {/* Tarjeta del formulario */}
      <div style={{ background: C.card, border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", animation: "fadeUp .5s ease .08s both", backdropFilter: "blur(20px)" }}>

        {/* Error global */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 11, background: `${C.pink}12`, border: `1px solid ${C.pink}35`, marginBottom: 22 }}>
            <AlertCircle size={16} color={C.pink} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13.5, color: C.pink, fontWeight: 600, fontFamily: FB }}>{error}</div>
              {correoExp && (
                <button onClick={() => navigate(`/reenviar-activacion?correo=${encodeURIComponent(correoExp)}`)}
                  style={{ background: "none", border: "none", color: C.orange, fontSize: 12.5, cursor: "pointer", padding: 0, marginTop: 4, fontFamily: FB, fontWeight: 600, textDecoration: "underline" }}>
                  Solicitar nuevo enlace →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Campos */}
        <InputPassword
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 8 caracteres"
        />

        {/* Medidor y requisitos */}
        {password && (
          <div style={{ marginTop: -12, marginBottom: 18, animation: "fadeUp .3s ease both" }}>
            <FuerzaPassword password={password} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: 10 }}>
              {requisitos.map(r => {
                const ok = r.test(password);
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ok ? C.green : C.creamMut, fontFamily: FB, transition: "color .2s" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: ok ? `${C.green}22` : "rgba(255,232,200,0.06)", border: `1px solid ${ok ? C.green + "50" : "rgba(255,232,200,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                      {ok && <CheckCircle size={9} color={C.green} strokeWidth={3} />}
                    </div>
                    {r.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <InputPassword
          label="Confirmar contraseña"
          value={confirmar}
          onChange={setConfirmar}
          placeholder="Repite tu contraseña"
          error={confirmar && !coinciden ? "Las contraseñas no coinciden" : undefined}
        />

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={!puedeEnviar || loading}
          style={{
            width: "100%", padding: "15px", borderRadius: 13, border: "none",
            background: puedeEnviar
              ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})`
              : "rgba(255,232,200,0.06)",
            color: puedeEnviar ? "white" : C.creamMut,
            fontWeight: 800, fontSize: 15, cursor: puedeEnviar ? "pointer" : "not-allowed",
            fontFamily: FB, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: puedeEnviar ? `0 8px 28px ${C.orange}38` : "none",
            transition: "all .2s", marginTop: 6,
            opacity: !puedeEnviar && !loading ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (puedeEnviar) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 14px 36px ${C.orange}50`; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = puedeEnviar ? `0 8px 28px ${C.orange}38` : "none"; }}
        >
          {loading
            ? <><Loader size={17} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} /> Activando cuenta…</>
            : <><ShieldCheck size={17} strokeWidth={2.5} /> Activar mi cuenta <ArrowRight size={15} strokeWidth={2.5} /></>
          }
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 22, animation: "fadeUp .5s ease .16s both" }}>
        <span style={{ fontSize: 13, color: C.creamMut, fontFamily: FB }}>¿Ya tienes contraseña? </span>
        <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: C.orange, fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: FB, padding: 0 }}>
          Inicia sesión →
        </button>
      </div>
    </Wrapper>
  );
}

// ── Wrapper centrado ───────────────────────────────────────────
function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", position: "relative", fontFamily: FB }}>
      {/* Orbes de fondo */}
      <div style={{ position: "fixed", top: -160, right: -80,  width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}08, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -80, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}07, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", left: "10%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}06, transparent 70%)`, pointerEvents: "none" }} />

      {/* Barra de color superior */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})`, zIndex: 50 }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
        {children}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.4);opacity:1} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.22); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function LinkButton({ onClick, children }: { readonly onClick: () => void; readonly children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: "12px 28px", borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 22px ${C.pink}40` }}>
      {children}
    </button>
  );
}