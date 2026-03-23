// src/pages/private/artista/MiPerfil.tsx
import { useState, useRef, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", text: "#f5f0ff", muted: "rgba(245,240,255,0.45)",
  green: "#3DDB85", red: "#FF4D6A", blue: "#4D9FFF",
};

export interface ArtistaInfo {
  id_artista: number;
  nombre_completo: string;
  nombre_artistico?: string;
  biografia?: string;
  estado: string;
  porcentaje_comision: number;
  correo?: string;
  telefono?: string;
  matricula?: string;
  categoria_nombre?: string;
  id_categoria_principal?: number;
  foto_perfil?: string;
  ciudad?: string;
  direccion_taller?: string;
  codigo_postal?: string;
  id_estado_base?: number;
  nombre_estado?: string;
  dias_preparacion_default?: number;
  acepta_envios?: boolean;
  solo_entrega_personal?: boolean;
  politica_envios?: string;
  politica_devoluciones?: string;
  email_usuario?: string;
}

interface Estado    { id_estado:   number; nombre: string; codigo: string; }
interface Categoria { id_categoria: number; nombre: string; }
interface RedSocial { id_red: number; red_social: string; url: string; usuario?: string; }

interface Props {
  readonly artista: ArtistaInfo;
  readonly token: string;
  readonly onActualizar: (nuevaFoto?: string) => void;
}

const CAMPOS_REQUERIDOS: { key: keyof ArtistaInfo; label: string }[] = [
  { key: "foto_perfil",            label: "Foto de perfil" },
  { key: "nombre_artistico",       label: "Nombre artístico" },
  { key: "biografia",              label: "Biografía" },
  { key: "telefono",               label: "Teléfono" },
  { key: "ciudad",                 label: "Ciudad" },
  { key: "id_estado_base",         label: "Estado" },
  { key: "codigo_postal",          label: "Código postal" },
  { key: "direccion_taller",       label: "Dirección del taller" },
  { key: "id_categoria_principal", label: "Categoría principal" },
];

const REDES_OPCIONES = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook",  label: "Facebook",  icon: "📘" },
  { value: "tiktok",    label: "TikTok",    icon: "🎵" },
  { value: "youtube",   label: "YouTube",   icon: "▶️" },
  { value: "twitter",   label: "Twitter/X", icon: "🐦" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "otra",      label: "Otra",      icon: "🔗" },
];

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

  .mp-input,.mp-textarea,.mp-select{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 14px;color:#f5f0ff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;transition:all 0.2s ease;line-height:1.5}
  .mp-select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(245,240,255,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
  .mp-select option{background:#1a1025;color:#f5f0ff}
  .mp-input::placeholder,.mp-textarea::placeholder{color:rgba(245,240,255,0.2)}
  .mp-input:focus,.mp-textarea:focus,.mp-select:focus{border-color:rgba(255,132,14,0.55);background:rgba(255,132,14,0.05);box-shadow:0 0 0 3px rgba(255,132,14,0.08)}
  .mp-input.required-empty,.mp-select.required-empty{border-color:rgba(255,77,106,0.5);background:rgba(255,77,106,0.04)}
  .mp-input.required-empty:focus,.mp-select.required-empty:focus{border-color:rgba(255,77,106,0.7);box-shadow:0 0 0 3px rgba(255,77,106,0.1)}
  .mp-input.field-error,.mp-textarea.field-error{border-color:rgba(255,77,106,0.6);background:rgba(255,77,106,0.05)}
  .mp-input-ro{width:100%;background:rgba(255,255,255,0.02);border:1.5px solid rgba(255,255,255,0.05);border-radius:10px;padding:11px 14px;color:rgba(245,240,255,0.35);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;cursor:default}
  .mp-textarea{resize:vertical}
  .mp-section{background:rgba(255,255,255,0.025);border:1.5px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px 28px 28px;margin-bottom:18px}
  .mp-toggle-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.2s ease;user-select:none}
  .mp-toggle-row:hover{border-color:rgba(255,132,14,0.25);background:rgba(255,132,14,0.04)}
  .mp-toggle-row.active{border-color:rgba(255,132,14,0.3);background:rgba(255,132,14,0.07)}
  .mp-save-btn{width:100%;padding:15px 0;border-radius:14px;border:none;background:linear-gradient(135deg,#FF840E 0%,#CC59AD 100%);color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 8px 28px rgba(255,132,14,0.28);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);display:flex;align-items:center;justify-content:center;gap:8px}
  .mp-save-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(255,132,14,0.4)}
  .mp-save-btn:active:not(:disabled){transform:translateY(0)}
  .mp-save-btn:disabled{background:rgba(255,255,255,0.06);color:rgba(245,240,255,0.3);box-shadow:none;cursor:not-allowed}
  .mp-foto-wrap{width:100px;height:100px;border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.25s ease;position:relative}
  .mp-foto-wrap:hover{transform:scale(1.04)}
  .mp-foto-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(0,0,0,0.5);border-radius:50%;opacity:0;transition:opacity 0.2s}
  .mp-foto-wrap:hover .mp-foto-overlay{opacity:1}
  .mp-btn-foto{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 20px;color:#f5f0ff;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;transition:all 0.2s}
  .mp-btn-foto:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.18)}
  .mp-progress-bar{height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;margin-top:10px}
  .mp-progress-fill{height:100%;border-radius:3px;transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1)}
  .mp-req-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif}
  .mp-red-pill{background:rgba(255,77,106,0.1);border:1px solid rgba(255,77,106,0.25);color:#FF4D6A}
  .mp-red-dot{width:6px;height:6px;border-radius:50%;background:#FF4D6A;flex-shrink:0}
  .mp-green-pill{background:rgba(61,219,133,0.1);border:1px solid rgba(61,219,133,0.25);color:#3DDB85}
  .mp-green-dot{width:6px;height:6px;border-radius:50%;background:#3DDB85;flex-shrink:0}
  .mp-red-social-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);animation:slideIn 0.2s ease}
  .mp-red-social-row:hover{border-color:rgba(255,255,255,0.12)}
  .mp-btn-add-red{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1.5px dashed rgba(255,132,14,0.3);background:rgba(255,132,14,0.04);color:rgba(255,132,14,0.8);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;transition:all 0.2s;width:100%}
  .mp-btn-add-red:hover{border-color:rgba(255,132,14,0.6);background:rgba(255,132,14,0.08);color:#FF840E}
  .mp-btn-del{background:none;border:none;cursor:pointer;color:rgba(255,77,106,0.5);font-size:16px;padding:4px 6px;border-radius:6px;transition:all 0.2s;flex-shrink:0}
  .mp-btn-del:hover{color:#FF4D6A;background:rgba(255,77,106,0.1)}
  .mp-label{font-size:10.5px;font-weight:700;color:rgba(245,240,255,0.45);text-transform:uppercase;letter-spacing:1.3px;margin-bottom:7px;font-family:'DM Sans',sans-serif}
  .mp-field-error{font-size:11px;color:#FF4D6A;font-weight:600;margin-top:5px;display:flex;align-items:center;gap:4px}
`;

// ── Sanitización frontend ─────────────────────────────────────────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;

const hasSuspiciousContent = (value: string): boolean =>
  xssPattern.test(value) || sqliPattern.test(value);

const sanitizeText = (value: string): string =>
  value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/eval\(/gi, "")
    .trim();

// ── Validaciones de formato ───────────────────────────────────────────────────
const validaciones: Record<string, (v: string) => string | null> = {
  telefono:          v => !v ? null : !/^\d{10}$/.test(v.trim()) ? "Solo 10 dígitos numéricos" : null,
  codigo_postal:     v => !v ? null : !/^\d{5}$/.test(v.trim()) ? "Solo 5 dígitos numéricos" : null,
  ciudad:            v => !v ? null : v.trim().length < 3 ? "Mínimo 3 caracteres" : !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v.trim()) ? "Solo letras permitidas" : null,
  direccion_taller:  v => !v ? null : v.trim().length < 10 ? "Mínimo 10 caracteres" : null,
  nombre_artistico:  v => !v ? null : v.trim().length < 3 ? "Mínimo 3 caracteres" : null,
  biografia:         v => !v ? null : v.trim().length < 20 ? "Mínimo 20 caracteres" : null,
};
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, badge }: { icon: string; title: string; badge?: React.ReactNode }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid rgba(255,255,255,0.07)" }}>
    <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:"linear-gradient(135deg,rgba(255,132,14,0.18),rgba(204,89,173,0.18))", border:"1.5px solid rgba(255,132,14,0.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{icon}</div>
    <h3 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:15.5, fontWeight:700, color:C.text, flex:1 }}>{title}</h3>
    {badge}
  </div>
);

const Field = ({ label, hint, children, full, required, empty }: { label:string; hint?:string; children:React.ReactNode; full?:boolean; required?:boolean; empty?:boolean }) => (
  <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
      <div className="mp-label">{label}</div>
      {required && <span style={{ fontSize:10, color: empty ? C.red : C.green, fontWeight:700 }}>{empty ? "✕ requerido" : "✓"}</span>}
    </div>
    {children}
    {hint && <p style={{ margin:"6px 0 0", fontSize:11.5, color:"rgba(245,240,255,0.28)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{hint}</p>}
  </div>
);

const Toggle = ({ value, onChange, label }: { value:boolean; onChange:(v:boolean)=>void; label:string }) => (
  <div className={`mp-toggle-row${value?" active":""}`} role="button" tabIndex={0} onClick={() => onChange(!value)} onKeyDown={e => { if (e.key === "Enter") onChange(!value); }}>
    <div style={{ width:46, height:26, borderRadius:13, flexShrink:0, position:"relative", background:value?"linear-gradient(135deg,#FF840E,#CC59AD)":"rgba(255,255,255,0.1)", boxShadow:value?"0 0 14px rgba(255,132,14,0.4)":"none", transition:"all 0.25s ease" }}>
      <div style={{ position:"absolute", top:4, left:value?24:4, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 2px 6px rgba(0,0,0,0.3)", transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
    <span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:value?C.text:C.muted, fontWeight:value?500:400, transition:"color 0.2s" }}>{label}</span>
  </div>
);

export default function MiPerfil({ artista, token, onActualizar }: Props) {
  const { showToast } = useToast();
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoFile,    setFotoFile]    = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>(artista.foto_perfil ?? "");
  const [saving,      setSaving]      = useState(false);
  const [estados,     setEstados]     = useState<Estado[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [redes,       setRedes]       = useState<RedSocial[]>([]);
  const [loadingRedes,setLoadingRedes]= useState(true);
  const [nuevaRed,    setNuevaRed]    = useState<{ red_social: string; url: string; usuario: string } | null>(null);
  const [savingRed,   setSavingRed]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    nombre_artistico:         artista.nombre_artistico         ?? "",
    biografia:                artista.biografia                ?? "",
    telefono:                 artista.telefono                 ?? "",
    ciudad:                   artista.ciudad                   ?? "",
    direccion_taller:         artista.direccion_taller         ?? "",
    codigo_postal:            artista.codigo_postal            ?? "",
    id_estado_base:           artista.id_estado_base           ? String(artista.id_estado_base) : "",
    id_categoria_principal:   artista.id_categoria_principal   ? String(artista.id_categoria_principal) : "",
    dias_preparacion_default: artista.dias_preparacion_default ? String(artista.dias_preparacion_default) : "3",
    acepta_envios:            artista.acepta_envios            ?? false,
    solo_entrega_personal:    artista.solo_entrega_personal    ?? false,
    politica_envios:          artista.politica_envios          ?? "",
    politica_devoluciones:    artista.politica_devoluciones    ?? "",
  });

  const set = (key: string, val: string | boolean) => {
    if (typeof val === "string") {

      // Validación de seguridad (XSS/SQLi)
      if (["nombre_artistico","biografia","ciudad","direccion_taller","politica_envios","politica_devoluciones"].includes(key)) {
        if (hasSuspiciousContent(val)) {
          setFieldErrors(prev => ({ ...prev, [key]: "Contenido no permitido" }));
          setForm(f => ({ ...f, [key]: val }));
          return;
        }
      }

      // Validación de formato
      const validar = validaciones[key];
      if (validar) {
        const error = validar(val);
        setFieldErrors(prev => ({ ...prev, [key]: error ?? "" }));
      } else {
        setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
    setForm(f => ({ ...f, [key]: val }));
  };

  const camposActuales: ArtistaInfo = {
    ...artista,
    foto_perfil:            fotoFile ? "ok" : artista.foto_perfil,
    nombre_artistico:       form.nombre_artistico,
    biografia:              form.biografia,
    telefono:               form.telefono,
    ciudad:                 form.ciudad,
    id_estado_base:         form.id_estado_base ? Number(form.id_estado_base) : undefined,
    codigo_postal:          form.codigo_postal,
    direccion_taller:       form.direccion_taller,
    id_categoria_principal: form.id_categoria_principal ? Number(form.id_categoria_principal) : undefined,
  };
  const completados    = CAMPOS_REQUERIDOS.filter(c => !!camposActuales[c.key]).length;
  const progreso       = Math.round((completados / CAMPOS_REQUERIDOS.length) * 100);
  const perfilCompleto = completados === CAMPOS_REQUERIDOS.length;

  useEffect(() => {
    fetch(`${API}/api/estados`)
      .then(r => r.json()).then(d => setEstados(d.data || [])).catch(() => {});
    fetch(`${API}/api/categorias`)
      .then(r => r.json()).then(d => setCategorias(d.data || [])).catch(() => {});
    fetch(`${API}/api/artista-portal/redes-sociales`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRedes(d.data || [])).catch(() => {})
      .finally(() => setLoadingRedes(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validación de formato ────────────────────────────────
    const erroresFormato: Record<string, string> = {};
    Object.entries(validaciones).forEach(([campo, validar]) => {
      const valor = String(form[campo as keyof typeof form] ?? "");
      const error = validar(valor);
      if (error) erroresFormato[campo] = error;
    });
    if (Object.keys(erroresFormato).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...erroresFormato }));
      showToast("Corrige los errores antes de guardar", "err");
      return;
    }

    // ── Validación de seguridad ──────────────────────────────
    const camposTexto = [
      "nombre_artistico", "biografia", "telefono", "ciudad",
      "direccion_taller", "politica_envios", "politica_devoluciones"
    ] as const;
    for (const campo of camposTexto) {
      if (hasSuspiciousContent(String(form[campo]))) {
        showToast(`El campo "${campo}" contiene contenido no permitido`, "err");
        setFieldErrors(prev => ({ ...prev, [campo]: "Contenido no permitido" }));
        return;
      }
    }

    // ── Sanitizar antes de enviar ────────────────────────────
    const formSanitizado = {
      ...form,
      nombre_artistico:     sanitizeText(form.nombre_artistico),
      biografia:            sanitizeText(form.biografia),
      ciudad:               sanitizeText(form.ciudad),
      direccion_taller:     sanitizeText(form.direccion_taller),
      politica_envios:      sanitizeText(form.politica_envios),
      politica_devoluciones: sanitizeText(form.politica_devoluciones),
    };

    setSaving(true);
    try {
      let body: BodyInit;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      if (fotoFile) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        Object.entries(formSanitizado).forEach(([k, v]) => fd.append(k, String(v)));
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(formSanitizado);
      }

      const res = await fetch(`${API}/api/artista-portal/mi-perfil`, { method: "PUT", headers, body });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.code === "XSS_DETECTED") {
          showToast(`Contenido no permitido en el campo "${data.field}"`, "err");
          return;
        }
        if (res.status === 400 && data.code === "SQL_INJECTION_DETECTED") {
          showToast(`Contenido no permitido en el campo "${data.field}"`, "err");
          return;
        }
        const message = await handleApiError(res);
        showToast(message, "err");
        if (res.status === 401) setTimeout(() => { globalThis.location.href = "/login"; }, 2000);
        return;
      }

      const data = await res.json();
      if (data.foto_perfil) setFotoPreview(data.foto_perfil);
      setFotoFile(null);
      setFieldErrors({});
      showToast("Perfil actualizado correctamente", "ok");
      onActualizar(data.foto_perfil);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarRed = async () => {
    if (!nuevaRed?.red_social || !nuevaRed?.url) {
      showToast("Selecciona la red y escribe la URL", "warn"); return;
    }
    // Validar URL
    if (hasSuspiciousContent(nuevaRed.url)) {
      showToast("La URL contiene contenido no permitido", "err"); return;
    }
    setSavingRed(true);
    try {
      const res = await fetch(`${API}/api/artista-portal/redes-sociales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevaRed),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const data = await res.json();
      setRedes(r => [...r, data.data]);
      setNuevaRed(null);
      showToast("Red social agregada", "ok");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSavingRed(false);
    }
  };

  const handleEliminarRed = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/artista-portal/redes-sociales/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      setRedes(r => r.filter(x => x.id_red !== id));
      showToast("Red social eliminada", "ok");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    }
  };

  const redesUsadas      = redes.map(r => r.red_social);
  const redesDisponibles = REDES_OPCIONES.filter(o => !redesUsadas.includes(o.value));

  return (
    <>
      <style>{css}</style>
      <div style={{ animation:"fadeUp .4s ease both", maxWidth:"100%", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <p style={{ margin:"0 0 10px", fontSize:10.5, fontWeight:800, color:C.orange, textTransform:"uppercase", letterSpacing:2.5 }}>✦ Portal del Artista</p>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ margin:"0 0 5px", fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:C.text, letterSpacing:-0.8, lineHeight:1 }}>Mi perfil</h2>
              <p style={{ margin:0, fontSize:13.5, color:C.muted }}>Edita tu información pública y configuración</p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {artista.categoria_nombre && <span style={{ fontSize:11.5, color:C.purple, fontWeight:700, background:"rgba(141,76,205,0.15)", border:"1.5px solid rgba(141,76,205,0.28)", borderRadius:20, padding:"5px 15px" }}>{artista.categoria_nombre}</span>}
              {artista.matricula && <span style={{ fontSize:11.5, fontWeight:800, color:C.gold, background:"rgba(255,193,16,0.1)", border:"1.5px solid rgba(255,193,16,0.3)", borderRadius:20, padding:"5px 15px", letterSpacing:1 }}>{artista.matricula}</span>}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ background:"rgba(255,255,255,0.025)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px 22px", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>Completitud del perfil</span>
              {perfilCompleto
                ? <span className="mp-req-chip mp-green-pill"><span className="mp-green-dot" />Listo para subir obras</span>
                : <span className="mp-req-chip mp-red-pill"><span className="mp-red-dot" />Completa para subir obras</span>}
            </div>
            <span style={{ fontSize:15, fontWeight:800, color: progreso === 100 ? C.green : progreso >= 60 ? C.gold : C.red, fontFamily:"'DM Sans',sans-serif" }}>{progreso}%</span>
          </div>
          <div className="mp-progress-bar">
            <div className="mp-progress-fill" style={{ width:`${progreso}%`, background: progreso === 100 ? "linear-gradient(90deg,#3DDB85,#4D9FFF)" : progreso >= 60 ? "linear-gradient(90deg,#FFC110,#FF840E)" : "linear-gradient(90deg,#FF4D6A,#CC59AD)" }} />
          </div>
          {!perfilCompleto && (
            <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:6 }}>
              {CAMPOS_REQUERIDOS.filter(c => !camposActuales[c.key]).map(c => (
                <span key={c.key} className="mp-req-chip mp-red-pill">{c.label}</span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Foto */}
          <div className="mp-section">
            <SectionHeader icon="📷" title="Foto de perfil" />
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>
              <div className="mp-foto-wrap" role="button" tabIndex={0} onClick={() => fotoRef.current?.click()} onKeyDown={e => { if (e.key === "Enter") fotoRef.current?.click(); }}
                style={{ border:fotoPreview?"2.5px solid rgba(255,132,14,0.5)":!camposActuales.foto_perfil?"2px dashed rgba(255,77,106,0.4)":"2px dashed rgba(255,255,255,0.15)", background:fotoPreview?"transparent":"rgba(255,255,255,0.03)", boxShadow:fotoPreview?"0 0 0 5px rgba(255,132,14,0.08)":"none" }}>
                {fotoPreview ? <img src={fotoPreview} alt="Foto" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:30, opacity:0.2 }}>👤</span>}
                <div className="mp-foto-overlay">📷</div>
              </div>
              <div>
                <button type="button" className="mp-btn-foto" onClick={() => fotoRef.current?.click()}>{fotoPreview?"Cambiar foto":"Subir foto"}</button>
                {fotoFile && <p style={{ margin:"8px 0 0", fontSize:12, color:C.green, fontWeight:600 }}>✓ {fotoFile.name}</p>}
                {!fotoPreview && <p style={{ margin:"6px 0 0", fontSize:11.5, color:C.red, fontWeight:600 }}>⚠ Requerida para subir obras</p>}
                <p style={{ margin:"6px 0 0", fontSize:11.5, color:C.muted }}>JPG o PNG · máx. 10 MB</p>
              </div>
              <input ref={fotoRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!["image/jpeg","image/png","image/webp"].includes(f.type)) { showToast("Solo se permiten imágenes JPG, PNG o WebP","warn"); return; }
                  if (f.size > 10 * 1024 * 1024) { showToast("La imagen no puede superar los 10 MB","warn"); return; }
                  setFotoFile(f); setFotoPreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          {/* Info artística */}
          <div className="mp-section">
            <SectionHeader icon="🎨" title="Información artística" />
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Nombre artístico" required empty={!form.nombre_artistico}>
                <input className={`mp-input${!form.nombre_artistico?" required-empty":""}${fieldErrors.nombre_artistico?" field-error":""}`}
                  value={form.nombre_artistico} onChange={e => set("nombre_artistico", e.target.value)}
                  placeholder="Como aparecerás en el catálogo (mínimo 3 caracteres)" />
                {fieldErrors.nombre_artistico && <div className="mp-field-error">⚠ {fieldErrors.nombre_artistico}</div>}
              </Field>
              <Field label="Categoría principal" required empty={!form.id_categoria_principal}>
                <select className={`mp-select${!form.id_categoria_principal?" required-empty":""}`}
                  value={form.id_categoria_principal} onChange={e => set("id_categoria_principal", e.target.value)}>
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </Field>
              <Field label="Biografía" hint={`${form.biografia.length} caracteres — mínimo 20`} required empty={!form.biografia}>
                <textarea className={`mp-textarea${!form.biografia?" required-empty":""}${fieldErrors.biografia?" field-error":""}`}
                  rows={4} value={form.biografia} onChange={e => set("biografia", e.target.value)}
                  placeholder="Cuéntanos sobre ti, tu técnica y tu obra… (mínimo 20 caracteres)" />
                {fieldErrors.biografia && <div className="mp-field-error">⚠ {fieldErrors.biografia}</div>}
              </Field>
            </div>
          </div>

          {/* Contacto y ubicación */}
          <div className="mp-section">
            <SectionHeader icon="📍" title="Contacto y ubicación" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Teléfono" required empty={!form.telefono}>
                <input className={`mp-input${!form.telefono?" required-empty":""}${fieldErrors.telefono?" field-error":""}`}
                  value={form.telefono} onChange={e => set("telefono", e.target.value.replace(/\D/g, "").slice(0,10))}
                  placeholder="10 dígitos" maxLength={10} inputMode="numeric" />
                {fieldErrors.telefono && <div className="mp-field-error">⚠ {fieldErrors.telefono}</div>}
              </Field>
              <Field label="Ciudad" required empty={!form.ciudad}>
                <input className={`mp-input${!form.ciudad?" required-empty":""}${fieldErrors.ciudad?" field-error":""}`}
                  value={form.ciudad} onChange={e => set("ciudad", e.target.value)} placeholder="Ciudad" />
                {fieldErrors.ciudad && <div className="mp-field-error">⚠ {fieldErrors.ciudad}</div>}
              </Field>
              <Field label="Estado" required empty={!form.id_estado_base}>
                <select className={`mp-select${!form.id_estado_base?" required-empty":""}`}
                  value={form.id_estado_base} onChange={e => set("id_estado_base", e.target.value)}>
                  <option value="">Selecciona un estado</option>
                  {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                </select>
              </Field>
              <Field label="Código postal" required empty={!form.codigo_postal}>
                <input className={`mp-input${!form.codigo_postal?" required-empty":""}${fieldErrors.codigo_postal?" field-error":""}`}
                  value={form.codigo_postal} onChange={e => set("codigo_postal", e.target.value.replace(/\D/g, "").slice(0,5))}
                  placeholder="5 dígitos" maxLength={5} inputMode="numeric" />
                {fieldErrors.codigo_postal && <div className="mp-field-error">⚠ {fieldErrors.codigo_postal}</div>}
              </Field>
              <Field label="Dirección del taller" full required empty={!form.direccion_taller}>
                <input className={`mp-input${!form.direccion_taller?" required-empty":""}${fieldErrors.direccion_taller?" field-error":""}`}
                  value={form.direccion_taller} onChange={e => set("direccion_taller", e.target.value)}
                  placeholder="Calle, número, colonia (mínimo 10 caracteres)" />
                {fieldErrors.direccion_taller && <div className="mp-field-error">⚠ {fieldErrors.direccion_taller}</div>}
              </Field>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="mp-section">
            <SectionHeader icon="🌐" title="Redes sociales" />
            {loadingRedes ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"20px 0" }}>
                <span style={{ width:20, height:20, border:"2px solid rgba(245,240,255,0.1)", borderTopColor:C.orange, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <div style={{ display:"grid", gap:8 }}>
                {redes.map(red => {
                  const opt = REDES_OPCIONES.find(o => o.value === red.red_social);
                  return (
                    <div key={red.id_red} className="mp-red-social-row">
                      <span style={{ fontSize:18, flexShrink:0 }}>{opt?.icon ?? "🔗"}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{opt?.label ?? red.red_social}</div>
                        <div style={{ fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{red.url}</div>
                      </div>
                      <button type="button" className="mp-btn-del" onClick={() => handleEliminarRed(red.id_red)}>✕</button>
                    </div>
                  );
                })}
                {nuevaRed ? (
                  <div style={{ background:"rgba(255,132,14,0.04)", border:"1.5px solid rgba(255,132,14,0.2)", borderRadius:14, padding:"16px 18px", display:"grid", gap:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <div className="mp-label">Red social</div>
                        <select className="mp-select" value={nuevaRed.red_social} onChange={e => setNuevaRed(n => n ? {...n, red_social: e.target.value} : n)}>
                          <option value="">Selecciona</option>
                          {redesDisponibles.map(o => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="mp-label">Usuario (opcional)</div>
                        <input className="mp-input" value={nuevaRed.usuario} onChange={e => setNuevaRed(n => n ? {...n, usuario: e.target.value} : n)} placeholder="@usuario" />
                      </div>
                    </div>
                    <div>
                      <div className="mp-label">URL del perfil</div>
                      <input className="mp-input" value={nuevaRed.url} onChange={e => setNuevaRed(n => n ? {...n, url: e.target.value} : n)} placeholder="https://..." />
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button type="button" onClick={handleAgregarRed} disabled={savingRed}
                        style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF840E,#CC59AD)", color:"#fff", fontWeight:700, cursor:savingRed?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13.5, opacity:savingRed?0.6:1 }}>
                        {savingRed ? "Guardando…" : "Agregar"}
                      </button>
                      <button type="button" onClick={() => setNuevaRed(null)}
                        style={{ padding:"10px 20px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.1)", background:"none", color:C.muted, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13.5 }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : redesDisponibles.length > 0 ? (
                  <button type="button" className="mp-btn-add-red" onClick={() => setNuevaRed({ red_social:"", url:"", usuario:"" })}>
                    <span style={{ fontSize:18 }}>+</span> Agregar red social
                  </button>
                ) : (
                  <p style={{ margin:0, fontSize:12.5, color:C.muted, textAlign:"center", padding:"8px 0" }}>Ya tienes todas las redes registradas</p>
                )}
              </div>
            )}
          </div>

          {/* Envíos */}
          <div className="mp-section">
            <SectionHeader icon="📦" title="Política de envíos" />
            <div style={{ display:"grid", gap:10, marginBottom:22 }}>
              <Toggle value={form.acepta_envios} onChange={v => set("acepta_envios", v)} label="Acepto envíos a domicilio" />
              <Toggle value={form.solo_entrega_personal} onChange={v => set("solo_entrega_personal", v)} label="Solo entrega personal / en taller" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
              <Field label="Días de preparación" hint="Tiempo antes de enviar">
                <input className="mp-input" type="number" min="1" max="30"
                  value={form.dias_preparacion_default} onChange={e => set("dias_preparacion_default", e.target.value)} />
              </Field>
            </div>
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Política de envíos" hint="Tiempos, costos, cobertura">
                <textarea className={`mp-textarea${fieldErrors.politica_envios?" field-error":""}`}
                  rows={3} value={form.politica_envios} onChange={e => set("politica_envios", e.target.value)}
                  placeholder="Ej: Envíos en 3–5 días hábiles…" />
                {fieldErrors.politica_envios && <div className="mp-field-error">⚠ {fieldErrors.politica_envios}</div>}
              </Field>
              <Field label="Política de devoluciones">
                <textarea className={`mp-textarea${fieldErrors.politica_devoluciones?" field-error":""}`}
                  rows={3} value={form.politica_devoluciones} onChange={e => set("politica_devoluciones", e.target.value)}
                  placeholder="Ej: No se aceptan devoluciones…" />
                {fieldErrors.politica_devoluciones && <div className="mp-field-error">⚠ {fieldErrors.politica_devoluciones}</div>}
              </Field>
            </div>
          </div>

          {/* Cuenta */}
          <div className="mp-section">
            <SectionHeader icon="🔒" title="Datos de cuenta" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <Field label="Correo"><input className="mp-input-ro" value={artista.email_usuario??""} readOnly /></Field>
              <Field label="Nombre completo"><input className="mp-input-ro" value={artista.nombre_completo??""} readOnly /></Field>
              <Field label="Matrícula"><input className="mp-input-ro" value={artista.matricula??"—"} readOnly /></Field>
              <Field label="Comisión"><input className="mp-input-ro" value={artista.porcentaje_comision?`${artista.porcentaje_comision}%`:"—"} readOnly /></Field>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 15px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1.5px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize:14, flexShrink:0 }}>ℹ️</span>
              <p style={{ margin:0, fontSize:12, color:C.muted, lineHeight:1.6 }}>Para cambiar correo, contraseña o matrícula contacta a Nu-B Studio.</p>
            </div>
          </div>

          <button type="submit" disabled={saving} className="mp-save-btn">
            {saving
              ? <><span style={{ width:17, height:17, border:"2.5px solid rgba(245,240,255,0.25)", borderTopColor:"rgba(245,240,255,0.7)", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />Guardando…</>
              : "Guardar cambios"}
          </button>
        </form>
        <div style={{ height:48 }} />
      </div>
    </>
  );
}