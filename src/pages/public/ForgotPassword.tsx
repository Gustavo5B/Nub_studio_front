// src/pages/public/ForgotPassword.tsx
import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2,
  Shield, KeyRound, Lock, Eye, EyeOff, ArrowRight,
  RefreshCw, CheckCheck
} from "lucide-react";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", bg: "#F9F8FC",
  text: "#14121E", muted: "#9896A8",
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

type Step = "email" | "code" | "password" | "success";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [correo, setCorreo] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isError, setIsError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const showMsg = (msg: string, error: boolean) => { setMensaje(msg); setIsError(error); };
  const clearMsg = () => setMensaje("");

  // ── PASO 1: Solicitar código ──
  const handleRequestCode = async () => {
    if (!correo.trim()) { showMsg("Ingresa tu correo electrónico", true); return; }
    setIsLoading(true); clearMsg();
    try {
      const res = await fetch(`${API_BASE}/api/recovery/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.blocked ? `🔒 Demasiados intentos. Espera ${data.minutesRemaining} min.` : data.message || "Error al enviar el código", true);
        return;
      }
      // Enmascarar correo localmente
      const [loc, dom] = correo.split("@");
      const maskedLoc = loc.substring(0, 2) + "****";
      const domParts = dom?.split(".") || [];
      const maskedDom = (domParts[0]?.substring(0, 1) || "") + "***." + domParts.slice(1).join(".");
      setMaskedEmail(`${maskedLoc}@${maskedDom}`);
      setResendCooldown(60);
      setStep("code");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      showMsg("No se pudo conectar con el servidor", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true); clearMsg();
    try {
      await fetch(`${API_BASE}/api/recovery/request-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      setCodeDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setResendCooldown(60);
      showMsg("Código reenviado 📧", false);
    } catch {
      showMsg("Error al reenviar", true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Inputs del código: acepta letras y números ──
  const handleCodeChange = (idx: number, val: string) => {
    // Toma solo el último carácter, convierte a mayúscula
    const char = val.replaceAll(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...codeDigits];
    next[idx] = char;
    setCodeDigits(next);
    clearMsg();
    if (char && idx < 5) {
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    }
  };

  const handleCodeKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (codeDigits[idx]) {
        const next = [...codeDigits];
        next[idx] = "";
        setCodeDigits(next);
      } else if (idx > 0) {
        setTimeout(() => inputRefs.current[idx - 1]?.focus(), 0);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Acepta pegado de código con o sin guión: "VM32-V8JQ" → "VM32V8JQ" → toma primeros 6
    const pasted = e.clipboardData.getData("text")
      .replaceAll('-', "")           // quita guiones
      .replaceAll(/[^A-Za-z0-9]/g, "") // quita otros especiales
      .toUpperCase()
      .slice(0, 6);
    if (pasted.length > 0) {
      const next = ["", "", "", "", "", ""];
      pasted.split("").forEach((c, i) => { next[i] = c; });
      setCodeDigits(next);
      const lastIdx = Math.min(pasted.length, 5);
      setTimeout(() => inputRefs.current[lastIdx]?.focus(), 0);
    }
    e.preventDefault();
  };

  // ── PASO 2: Validar código ──
  const handleValidateCode = async () => {
    const codigo = codeDigits.join("");
    if (codigo.length < 6) { showMsg("Ingresa los 6 caracteres del código", true); return; }
    setIsLoading(true); clearMsg();
    try {
      const res = await fetch(`${API_BASE}/api/recovery/validate-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, codigo }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) { showMsg(data.message || "Código inválido o expirado", true); return; }
      setStep("password");
    } catch {
      showMsg("Error al validar el código", true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── PASO 3: Restablecer contraseña ──
  const handleResetPassword = async () => {
    if (!nuevaContrasena || !confirmar) { showMsg("Completa todos los campos", true); return; }
    if (nuevaContrasena !== confirmar) { showMsg("Las contraseñas no coinciden", true); return; }
    setIsLoading(true); clearMsg();
    try {
      const codigo = codeDigits.join("");
      const res = await fetch(`${API_BASE}/api/recovery/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, codigo, nuevaContrasena }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.errors?.length ? data.errors.join(" • ") : data.message || "Error al restablecer", true);
        return;
      }
      setStep("success");
    } catch {
      showMsg("Error al restablecer la contraseña", true);
    } finally {
      setIsLoading(false);
    }
  };

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[@$!%*?&#._-]/.test(p)) s++;
    return s;
  };
  const strength = getStrength(nuevaContrasena);
  const strengthColor = ["#C0BEC8", C.pink, "#f97316", C.gold, "#0E8A50", "#0E8A50"][strength];
  const strengthLabel = ["", "Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"][strength];

  const steps = [{ id: "email", label: "Correo" }, { id: "code", label: "Código" }, { id: "password", label: "Nueva clave" }];
  const stepIdx = steps.findIndex(s => s.id === step);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .fp-input {
          width: 100%; box-sizing: border-box; padding: 11px 14px;
          border-radius: 10px; border: 1.5px solid #E6E4EF;
          background: #FFFFFF; color: #14121E; font-size: 14px;
          font-family: 'Outfit', sans-serif; outline: none;
          transition: border 0.15s, box-shadow 0.15s; margin-bottom: 16px;
        }
        .fp-input:focus {
          border-color: rgba(232,100,12,0.6);
          box-shadow: 0 0 0 3px rgba(232,100,12,0.08);
        }
        .fp-code-input {
          width: 46px; height: 54px; text-align: center; font-size: 20px;
          font-weight: 700; border-radius: 12px; font-family: 'Outfit', sans-serif;
          outline: none; transition: all 0.15s; cursor: text;
          caret-color: transparent; -webkit-appearance: none;
          text-transform: uppercase; letter-spacing: 0;
        }
        .fp-code-input:focus {
          border-color: #E8640C !important;
          box-shadow: 0 0 0 3px rgba(232,100,12,0.15) !important;
          background: rgba(232,100,12,0.08) !important;
        }
      `}</style>

      {/* Orbs */}
      <div style={{ position: "fixed", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}20, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, right: -120, width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* Botón volver */}
      <button
        onClick={() => {
          if (step === "email") navigate("/login");
          else if (step === "code") { setStep("email"); clearMsg(); }
          else if (step === "password") { setStep("code"); clearMsg(); }
          else navigate("/login");
        }}
        style={{ position: "fixed", top: 20, left: 20, zIndex: 100, display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid #E6E4EF", color: "#5A5870", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 1px 8px rgba(0,0,0,0.08)", transition: "all .22s ease" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(232,100,12,0.08)"; el.style.borderColor = "rgba(232,100,12,0.30)"; el.style.color = C.orange; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.97)"; el.style.borderColor = "#E6E4EF"; el.style.color = "#5A5870"; }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        {step === "email" ? "Volver al login" : "Paso anterior"}
      </button>

      <div style={{ width: "100%", maxWidth: 440, padding: "20px" }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 46 }} />
        </div>

        {/* Stepper */}
        {step !== "success" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
            {steps.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: i <= stepIdx ? `linear-gradient(135deg, ${C.orange}, ${C.pink})` : "rgba(0,0,0,0.04)", border: i <= stepIdx ? "none" : "1.5px solid #E6E4EF", color: i <= stepIdx ? "#fff" : C.muted, boxShadow: i === stepIdx ? `0 0 20px ${C.orange}40` : "none" }}>
                    {i < stepIdx ? <CheckCheck size={15} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === stepIdx ? C.orange : C.muted }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 60, height: 2, margin: "0 4px", marginBottom: 20, background: i < stepIdx ? `linear-gradient(90deg, ${C.orange}, ${C.pink})` : "#E6E4EF" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E6E4EF", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>

          {/* ── PASO 1: Email ── */}
          {step === "email" && (
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.orange}22, ${C.pink}22)`, border: `1px solid ${C.orange}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Mail size={22} color={C.orange} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Recuperar contraseña</h2>
              <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 26px", lineHeight: 1.6 }}>
                Ingresa tu correo y te enviaremos un código de 6 caracteres para restablecer tu contraseña.
              </p>
              <label style={labelStyle}><Mail size={14} /> Correo electrónico</label>
              <input
                type="email"
                className="fp-input"
                value={correo}
                onChange={e => { setCorreo(e.target.value); clearMsg(); }}
                onKeyDown={e => e.key === "Enter" && handleRequestCode()}
                placeholder="tu@correo.com"
                disabled={isLoading}
                autoFocus
              />
              {mensaje && <MsgBox msg={mensaje} isError={isError} />}
              <button onClick={handleRequestCode} disabled={isLoading} style={{ ...btnPrimary, marginTop: 20, opacity: isLoading ? 0.8 : 1 }}>
                {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</> : <>Enviar código <ArrowRight size={16} /></>}
              </button>
            </div>
          )}

          {/* ── PASO 2: Código ── */}
          {step === "code" && (
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.purple}22, ${C.pink}22)`, border: `1px solid ${C.purple}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Shield size={22} color={C.purple} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Ingresa el código</h2>
              <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>Enviamos un código de 6 caracteres a</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.orange, margin: "0 0 24px" }}>{maskedEmail}</p>

              {/* 6 inputs alfanuméricos */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }} onPaste={handleCodePaste}>
                {codeDigits.map((d, i) => (
                  <input
                    key={`cp${i}`}
                    ref={el => { inputRefs.current[i] = el; }}
                    className="fp-code-input"
                    value={d}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    maxLength={1}
                    type="text"
                    inputMode="text"
                    disabled={isLoading}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{
                      border: d ? `2px solid ${C.orange}` : "1.5px solid #E6E4EF",
                      background: d ? `${C.orange}15` : "#F9F8FC",
                      color: C.text,
                      boxShadow: d ? `0 0 12px ${C.orange}25` : "none",
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginBottom: 20 }}>
                Puedes pegar el código directamente desde tu correo
              </p>

              {mensaje && <MsgBox msg={mensaje} isError={isError} />}

              <button onClick={handleValidateCode} disabled={isLoading || codeDigits.join("").length < 6}
                style={{ ...btnPrimary, opacity: (isLoading || codeDigits.join("").length < 6) ? 0.6 : 1 }}>
                {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</> : <>Verificar código <ArrowRight size={16} /></>}
              </button>

              <div style={{ textAlign: "center", marginTop: 18 }}>
                {resendCooldown > 0
                  ? <span style={{ fontSize: 13, color: C.muted }}>Reenviar en <strong style={{ color: C.orange }}>{resendCooldown}s</strong></span>
                  : <button onClick={handleResend} disabled={isLoading} style={{ background: "none", border: "none", color: C.orange, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw size={13} /> Reenviar código
                    </button>
                }
              </div>
            </div>
          )}

          {/* ── PASO 3: Nueva contraseña ── */}
          {step === "password" && (
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}22, ${C.orange}22)`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <KeyRound size={22} color={C.gold} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Nueva contraseña</h2>
              <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 26px", lineHeight: 1.6 }}>
                Mínimo 8 caracteres, mayúsculas, minúsculas, número y carácter especial (@$!%*?&#._-).
              </p>

              <label style={labelStyle}><Lock size={14} /> Nueva contraseña</label>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input type={showPass ? "text" : "password"} className="fp-input"
                  value={nuevaContrasena} onChange={e => { setNuevaContrasena(e.target.value); clearMsg(); }}
                  placeholder="••••••••" disabled={isLoading}
                  style={{ paddingRight: 44, marginBottom: 0 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={eyeBtn}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {nuevaContrasena.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 10, background: n <= strength ? strengthColor : "rgba(0,0,0,0.08)", transition: "background .3s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                </div>
              )}

              <label style={labelStyle}><Lock size={14} /> Confirmar contraseña</label>
              <div style={{ position: "relative" }}>
                <input type={showConfirm ? "text" : "password"} className="fp-input"
                  value={confirmar} onChange={e => { setConfirmar(e.target.value); clearMsg(); }}
                  placeholder="••••••••" disabled={isLoading}
                  style={{ paddingRight: 44, borderColor: confirmar && confirmar !== nuevaContrasena ? C.pink : undefined }} />
                <button type="button" onClick={() => setShowConfirm(p => !p)} style={eyeBtn}>
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmar && confirmar !== nuevaContrasena && (
                <p style={{ fontSize: 12, color: C.pink, margin: "-8px 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={12} /> Las contraseñas no coinciden
                </p>
              )}

              {mensaje && <MsgBox msg={mensaje} isError={isError} />}

              <button onClick={handleResetPassword}
                disabled={isLoading || !nuevaContrasena || !confirmar || nuevaContrasena !== confirmar}
                style={{ ...btnPrimary, marginTop: 20, opacity: (isLoading || !nuevaContrasena || !confirmar || nuevaContrasena !== confirmar) ? 0.6 : 1 }}>
                {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</> : <>Restablecer contraseña <CheckCheck size={16} /></>}
              </button>
            </div>
          )}

          {/* ── PASO 4: Éxito ── */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(14,138,80,0.08)", border: "2px solid rgba(14,138,80,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={36} color="#0E8A50" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>¡Contraseña actualizada!</h2>
              <p style={{ fontSize: 14, color: C.muted, margin: "0 0 30px", lineHeight: 1.6 }}>
                Tu contraseña ha sido restablecida. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <button onClick={() => navigate("/login")} style={btnPrimary}>
                Ir al inicio de sesión <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9896A8", marginTop: 20 }}>
          © {new Date().getFullYear()} Altar Studio. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

const MsgBox = ({ msg, isError }: { msg: string; isError: boolean }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 10, marginTop: 12, background: isError ? "rgba(168,59,144,0.08)" : "rgba(14,138,80,0.06)", border: `1px solid ${isError ? "rgba(168,59,144,0.30)" : "rgba(14,138,80,0.25)"}`, fontSize: 13, color: isError ? "#A83B90" : "#0E8A50", lineHeight: 1.5 }}>
    {isError ? <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
    {msg}
  </div>
);

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 600, color: "#5A5870",
  marginBottom: 8,
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "13px 20px", borderRadius: 12,
  background: "linear-gradient(135deg, #E8640C, #A83B90)",
  border: "none", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
  boxShadow: "0 8px 24px rgba(232,100,12,0.20)", transition: "opacity .2s",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%",
  transform: "translateY(-60%)",
  background: "none", border: "none", cursor: "pointer",
  color: "#9896A8", display: "flex", alignItems: "center",
};
