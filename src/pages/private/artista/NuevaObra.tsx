// src/pages/private/artista/NuevaObra.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService }      from "../../../services/authService";
import { useToast }         from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", text: "#f5f0ff", muted: "rgba(245,240,255,0.45)",
  green: "#3DDB85", red: "#FF4D6A", bg: "#0d0b14",
  card: "rgba(255,255,255,0.025)",
};

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes scaleIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }

  .no-main { padding: 40px 48px 60px; max-width: 820px; margin: 0 auto; animation: fadeUp .4s ease both; }

  .no-header { display:flex; align-items:flex-start; gap:18px; margin-bottom:32px; }
  .no-back { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.09); color:rgba(245,240,255,0.55); padding:8px 14px; border-radius:10px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:.83rem; transition:all .2s; flex-shrink:0; margin-top:6px; }
  .no-back:hover { background:rgba(255,255,255,0.09); color:${C.text}; }
  .no-title { margin:0 0 4px; font-family:'Playfair Display',serif; font-size:2.1rem; font-weight:900; color:${C.text}; letter-spacing:-.5px; line-height:1; }
  .no-subtitle { margin:0; font-size:.9rem; color:${C.muted}; }

  .no-steps { display:flex; align-items:center; margin-bottom:32px; }
  .no-step { display:flex; flex-direction:column; align-items:center; gap:5px; }
  .no-step-circle { width:32px; height:32px; border-radius:50%; border:2px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; color:rgba(245,240,255,0.3); transition:all .3s; }
  .no-step-label { font-size:.68rem; color:rgba(245,240,255,0.3); white-space:nowrap; transition:all .3s; font-weight:600; letter-spacing:.05em; }
  .no-step.active .no-step-circle { border-color:${C.orange}; background:rgba(255,132,14,0.18); color:${C.orange}; }
  .no-step.active .no-step-label  { color:${C.orange}; }
  .no-step.done   .no-step-circle { border-color:${C.green}; background:rgba(61,219,133,0.15); color:${C.green}; }
  .no-step.done   .no-step-label  { color:${C.green}; }
  .no-step-line { flex:1; height:2px; background:rgba(255,255,255,0.08); margin:0 12px 20px; }

  .no-section { background:${C.card}; border:1.5px solid rgba(255,255,255,0.08); border-radius:20px; padding:26px 28px; margin-bottom:18px; }
  .no-section-title { font-size:.78rem; font-weight:800; color:rgba(245,240,255,0.55); display:flex; align-items:center; gap:8px; margin:0 0 20px; text-transform:uppercase; letter-spacing:.1em; }

  .no-drop { border:2px dashed rgba(255,132,14,0.25); border-radius:16px; padding:52px 28px; text-align:center; cursor:pointer; transition:all .3s; display:flex; flex-direction:column; align-items:center; gap:10px; color:${C.muted}; }
  .no-drop:hover,.no-drop.over { border-color:${C.orange}; background:rgba(255,132,14,0.04); color:${C.text}; }
  .no-drop p { margin:0; font-size:.95rem; }
  .no-drop span { color:${C.orange}; text-decoration:underline; font-weight:600; }
  .no-drop small { font-size:.75rem; opacity:.6; }
  .no-preview-wrap { position:relative; border-radius:16px; overflow:hidden; max-height:320px; }
  .no-preview-img { width:100%; max-height:320px; object-fit:cover; display:block; }
  .no-preview-remove { position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.2); color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1rem; transition:background .2s; }
  .no-preview-remove:hover { background:${C.red}; }
  .no-preview-badge { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(0,0,0,0.65)); padding:18px 16px 13px; font-size:.8rem; color:${C.green}; font-weight:700; }

  .no-field { display:flex; flex-direction:column; gap:7px; margin-bottom:16px; }
  .no-field:last-child { margin-bottom:0; }
  .no-field-label { font-size:.72rem; font-weight:700; color:${C.muted}; text-transform:uppercase; letter-spacing:.08em; }
  .no-input,.no-textarea,.no-select { background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 14px; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:.9rem; outline:none; transition:all .2s; width:100%; box-sizing:border-box; }
  .no-input::placeholder,.no-textarea::placeholder { color:rgba(245,240,255,0.18); }
  .no-input:focus,.no-textarea:focus,.no-select:focus { border-color:rgba(255,132,14,0.5); background:rgba(255,132,14,0.04); box-shadow:0 0 0 3px rgba(255,132,14,0.08); }
  .no-textarea { resize:vertical; min-height:96px; line-height:1.6; }
  .no-select { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(245,240,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .no-select option { background:#1a1025; color:${C.text}; }
  .no-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .no-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

  .no-tags { display:flex; flex-wrap:wrap; gap:7px; }
  .no-tag { background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.1); color:rgba(245,240,255,0.5); padding:5px 15px; border-radius:20px; cursor:pointer; font-size:.8rem; font-family:'DM Sans',sans-serif; transition:all .2s; font-weight:500; }
  .no-tag:hover { border-color:rgba(255,132,14,0.4); color:${C.text}; }
  .no-tag.sel { background:rgba(255,132,14,0.15); border-color:${C.orange}; color:${C.orange}; font-weight:700; }

  .no-price-wrap { display:flex; align-items:center; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.09); border-radius:10px; overflow:hidden; transition:border-color .2s; }
  .no-price-wrap:focus-within { border-color:rgba(255,132,14,0.5); }
  .no-price-sym { padding:11px 14px; background:rgba(255,132,14,0.1); color:${C.orange}; font-weight:800; font-size:1rem; flex-shrink:0; }
  .no-price-input { border:none!important; background:transparent!important; border-radius:0!important; flex:1; padding:11px 14px; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:.9rem; outline:none; }
  .no-price-input::placeholder { color:rgba(245,240,255,0.18); }
  .no-breakdown { background:rgba(255,255,255,0.02); border:1.5px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 18px; display:flex; flex-direction:column; gap:8px; margin-top:12px; }
  .no-breakdown-row { display:flex; justify-content:space-between; font-size:.85rem; color:${C.muted}; }
  .no-breakdown-row strong { color:rgba(245,240,255,0.75); }
  .no-breakdown-row.comm strong { color:rgba(255,77,106,0.85); }
  .no-breakdown-row.total { border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; margin-top:2px; font-weight:700; color:${C.text}; }
  .no-receive { color:${C.green}!important; font-size:.95rem; }

  .no-checks { display:flex; flex-direction:column; gap:12px; }
  .no-check-label { display:flex; align-items:center; gap:12px; cursor:pointer; font-size:.9rem; color:rgba(245,240,255,0.7); user-select:none; }
  .no-check-label input { display:none; }
  .no-check-box { width:20px; height:20px; border:2px solid rgba(255,255,255,0.18); border-radius:6px; flex-shrink:0; transition:all .2s; position:relative; background:rgba(255,255,255,0.03); }
  .no-check-label input:checked~.no-check-box { background:${C.orange}; border-color:${C.orange}; }
  .no-check-label input:checked~.no-check-box::after { content:'✓'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:.72rem; font-weight:800; }

  .no-summary { border-color:rgba(255,193,16,0.2)!important; }
  .no-summary-grid { display:flex; gap:18px; align-items:flex-start; }
  .no-summary-img { width:90px; height:90px; object-fit:cover; border-radius:12px; flex-shrink:0; }
  .no-summary-title { font-size:1.05rem; font-weight:700; margin:0 0 4px; color:${C.text}; }
  .no-summary-cat { font-size:.8rem; color:${C.orange}; margin:0 0 3px; }
  .no-summary-tech { font-size:.8rem; color:${C.muted}; margin:0 0 4px; }
  .no-summary-price { font-size:.95rem; font-weight:800; color:${C.gold}; margin:0; }

  .no-perfil-banner { background:rgba(255,77,106,0.08); border:1.5px solid rgba(255,77,106,0.25); border-radius:16px; padding:18px 22px; margin-bottom:18px; animation:fadeIn .3s ease; }
  .no-perfil-banner-title { font-size:.85rem; font-weight:800; color:${C.red}; margin:0 0 10px; display:flex; align-items:center; gap:8px; }
  .no-perfil-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
  .no-perfil-chip { font-size:.75rem; font-weight:700; background:rgba(255,77,106,0.12); border:1px solid rgba(255,77,106,0.25); color:${C.red}; padding:3px 10px; border-radius:20px; }
  .no-perfil-link { display:inline-flex; align-items:center; gap:6px; font-size:.82rem; font-weight:700; color:${C.orange}; cursor:pointer; background:rgba(255,132,14,0.1); border:1.5px solid rgba(255,132,14,0.25); padding:7px 16px; border-radius:10px; transition:all .2s; text-decoration:none; }
  .no-perfil-link:hover { background:rgba(255,132,14,0.18); border-color:rgba(255,132,14,0.45); }

  .no-actions { padding-top:6px; }
  .no-actions.two { display:flex; gap:12px; }
  .no-btn-next { width:100%; background:linear-gradient(135deg,#FF840E 0%,#CC59AD 100%); border:none; color:#fff; padding:14px 24px; border-radius:13px; font-size:.95rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 8px 28px rgba(255,132,14,0.25); transition:all .25s cubic-bezier(.34,1.56,.64,1); }
  .no-btn-next:hover { transform:translateY(-2px); box-shadow:0 14px 36px rgba(255,132,14,0.38); }
  .no-btn-back { background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.1); color:rgba(245,240,255,0.6); padding:14px 22px; border-radius:13px; font-size:.95rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap; }
  .no-btn-back:hover { background:rgba(255,255,255,0.09); color:${C.text}; }
  .no-btn-submit { flex:1; background:linear-gradient(135deg,#FF840E 0%,#CC59AD 100%); border:none; color:#fff; padding:14px 24px; border-radius:13px; font-size:.95rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 8px 28px rgba(255,132,14,0.25); transition:all .25s cubic-bezier(.34,1.56,.64,1); display:flex; align-items:center; justify-content:center; gap:8px; }
  .no-btn-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 36px rgba(255,132,14,0.38); }
  .no-btn-submit:disabled { background:rgba(255,255,255,0.06); color:rgba(245,240,255,0.3); box-shadow:none; cursor:not-allowed; transform:none; }

  .no-success-inner { text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; animation:scaleIn .4s ease; padding: 80px 0; }
  .no-success-icon { width:96px; height:96px; background:rgba(61,219,133,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.8rem; }
  .no-success-h { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:${C.text}; margin:0; }
  .no-success-p { color:${C.muted}; margin:0; font-size:.95rem; }
  .no-success-tag { background:rgba(61,219,133,0.12); color:${C.green}; padding:6px 18px; border-radius:20px; font-size:.8rem; font-weight:700; }

  @media(max-width:768px) {
    .no-main { padding:24px 18px 48px; }
    .no-grid-2,.no-grid-3 { grid-template-columns:1fr; }
    .no-actions.two { flex-direction:column-reverse; }
    .no-btn-back { width:100%; text-align:center; }
  }
`;

interface Categoria { id_categoria: number; nombre: string; }
interface Etiqueta  { id_etiqueta:  number; nombre: string; }
interface FormData {
  titulo: string; descripcion: string; id_categoria: string;
  tecnica: string; anio_creacion: string;
  dimensiones_alto: string; dimensiones_ancho: string; dimensiones_profundidad: string;
  precio_base: string; permite_marco: boolean; con_certificado: boolean; etiquetas: number[];
}

export default function NuevaObra() {
  const navigate      = useNavigate();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [categorias,       setCategorias]       = useState<Categoria[]>([]);
  const [etiquetas,        setEtiquetas]         = useState<Etiqueta[]>([]);
  const [preview,          setPreview]           = useState<string | null>(null);
  const [imageFile,        setImageFile]         = useState<File | null>(null);
  const [loading,          setLoading]           = useState(false);
  const [success,          setSuccess]           = useState(false);
  const [dragOver,         setDragOver]          = useState(false);
  const [step,             setStep]              = useState(1);
  const [perfilFaltantes,  setPerfilFaltantes]   = useState<string[]>([]);
  const [checkingPerfil,   setCheckingPerfil]    = useState(true);

  const [form, setForm] = useState<FormData>({
    titulo: "", descripcion: "", id_categoria: "", tecnica: "",
    anio_creacion: new Date().getFullYear().toString(),
    dimensiones_alto: "", dimensiones_ancho: "", dimensiones_profundidad: "",
    precio_base: "", permite_marco: false, con_certificado: false, etiquetas: [],
  });

  useEffect(() => {
    const token = authService.getToken();
    const h     = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/categorias`,              { headers: h }).then(r => r.json()),
      fetch(`${API}/api/etiquetas`,               { headers: h }).then(r => r.json()),
      fetch(`${API}/api/artista-portal/mi-perfil`, { headers: h }).then(r => r.json()),
    ]).then(([cat, etq, perfil]) => {
      setCategorias(Array.isArray(cat) ? cat : cat.categorias || cat.data || []);
      setEtiquetas(Array.isArray(etq)  ? etq : etq.etiquetas  || etq.data  || []);

      const faltantes: string[] = [];
      if (!perfil.nombre_artistico)       faltantes.push('nombre artístico');
      if (!perfil.biografia)              faltantes.push('biografía');
      if (!perfil.telefono)               faltantes.push('teléfono');
      if (!perfil.foto_perfil)            faltantes.push('foto de perfil');
      if (!perfil.ciudad)                 faltantes.push('ciudad');
      if (!perfil.id_estado_base)         faltantes.push('estado');
      if (!perfil.codigo_postal)          faltantes.push('código postal');
      if (!perfil.direccion_taller)       faltantes.push('dirección del taller');
      if (!perfil.id_categoria_principal) faltantes.push('categoría principal');

      if (faltantes.length > 0) {
        showToast("Completa tu perfil antes de subir obras", "warn");
        navigate("/artista/perfil");
        return;
      }
    }).catch(() => {}).finally(() => setCheckingPerfil(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const toggleTag = (id: number) =>
    setForm(p => ({ ...p, etiquetas: p.etiquetas.includes(id) ? p.etiquetas.filter(x => x !== id) : [...p.etiquetas, id] }));

  const processImage = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)    { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    setImageFile(file);
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleNext = () => {
    if (!form.titulo.trim())      { showToast("El título es requerido", "warn"); return; }
    if (!form.descripcion.trim()) { showToast("La descripción es requerida", "warn"); return; }
    if (!form.id_categoria)       { showToast("Selecciona una categoría", "warn"); return; }
    if (!imageFile)               { showToast("Debes subir una imagen", "warn"); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.precio_base || parseFloat(form.precio_base) <= 0) {
      showToast("El precio base es requerido", "warn"); return;
    }
    setLoading(true);
    setPerfilFaltantes([]);
    try {
      const token = authService.getToken();
      const fd    = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        fd.append(k, k === "etiquetas" ? JSON.stringify(v) : String(v))
      );
      if (imageFile) fd.append("imagen", imageFile);

      const res = await fetch(`${API}/api/artista-portal/nueva-obra`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 && data.camposFaltantes) {
          setPerfilFaltantes(data.camposFaltantes);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        showToast(data.message || "Error al enviar la obra", "err");
        return;
      }

      setSuccess(true);
      showToast("¡Obra enviada! Está en revisión.", "ok");
      setTimeout(() => navigate("/artista/mis-obras"), 2500);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const precio   = parseFloat(form.precio_base || "0");
  const comision = precio * 0.15;
  const neto     = precio * 0.85;

  if (checkingPerfil) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13 }}>Verificando perfil...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (success) return (
    <>
      <style>{css}</style>
      <div className="no-success-inner">
        <div className="no-success-icon">✓</div>
        <h2 className="no-success-h">¡Obra enviada!</h2>
        <p className="no-success-p">Tu obra está en revisión. El equipo de Nu-B Studio la revisará pronto.</p>
        <span className="no-success-tag">Redirigiendo...</span>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <main className="no-main">

        {/* Header */}
        <div className="no-header">
          <button className="no-back" onClick={() => navigate("/artista/dashboard")}>← Volver</button>
          <div>
            <h1 className="no-title">✦ Nueva Obra</h1>
            <p className="no-subtitle">Comparte tu arte con el mundo</p>
          </div>
        </div>

        {/* Banner perfil incompleto */}
        {perfilFaltantes.length > 0 && (
          <div className="no-perfil-banner">
            <p className="no-perfil-banner-title">⚠ Completa tu perfil antes de subir obras</p>
            <div className="no-perfil-chips">
              {perfilFaltantes.map(f => <span key={f} className="no-perfil-chip">{f}</span>)}
            </div>
            <button className="no-perfil-link" onClick={() => navigate("/artista/perfil")}>
              Ir a Mi perfil →
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="no-steps">
          <div className={`no-step${step >= 1 ? " active" : ""}${step > 1 ? " done" : ""}`}>
            <div className="no-step-circle">{step > 1 ? "✓" : "1"}</div>
            <div className="no-step-label">INFORMACIÓN</div>
          </div>
          <div className="no-step-line" />
          <div className={`no-step${step >= 2 ? " active" : ""}`}>
            <div className="no-step-circle">2</div>
            <div className="no-step-label">DETALLES & PRECIO</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              {/* Imagen */}
              <div className="no-section">
                <div className="no-section-title"><span>🖼</span> Imagen de la obra</div>
                {!preview ? (
                  <div className={`no-drop${dragOver ? " over" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processImage(f); }}
                    onClick={() => fileRef.current?.click()}>
                    <div style={{ fontSize:"2.5rem", opacity:.6 }}>📤</div>
                    <p>Arrastra tu imagen o <span>haz clic para seleccionar</span></p>
                    <small>PNG, JPG, WEBP — Máx 10 MB</small>
                    <input ref={fileRef} type="file" accept="image/*" hidden
                      onChange={e => { const f = e.target.files?.[0]; if (f) processImage(f); }} />
                  </div>
                ) : (
                  <div className="no-preview-wrap">
                    <img src={preview} alt="Preview" className="no-preview-img" />
                    <button type="button" className="no-preview-remove" onClick={removeImage}>✕</button>
                    <div className="no-preview-badge">✓ Imagen lista</div>
                  </div>
                )}
              </div>

              {/* Info básica */}
              <div className="no-section">
                <div className="no-section-title"><span>📝</span> Información básica</div>
                <div className="no-field">
                  <label className="no-field-label">Título *</label>
                  <input className="no-input" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej: Atardecer en la Huasteca" />
                </div>
                <div className="no-field">
                  <label className="no-field-label">Descripción *</label>
                  <textarea className="no-textarea" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Cuéntanos sobre esta obra, su inspiración…" rows={4} />
                </div>
                <div className="no-grid-3">
                  <div className="no-field">
                    <label className="no-field-label">Categoría *</label>
                    <select className="no-select" name="id_categoria" value={form.id_categoria} onChange={handleChange}>
                      <option value="">Seleccionar…</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="no-field">
                    <label className="no-field-label">Técnica</label>
                    <input className="no-input" name="tecnica" value={form.tecnica} onChange={handleChange} placeholder="Óleo sobre lienzo" />
                  </div>
                  <div className="no-field">
                    <label className="no-field-label">Año</label>
                    <input className="no-input" type="number" name="anio_creacion" value={form.anio_creacion} onChange={handleChange} min={1900} max={new Date().getFullYear()} />
                  </div>
                </div>
              </div>

              {/* Etiquetas */}
              {etiquetas.length > 0 && (
                <div className="no-section">
                  <div className="no-section-title"><span>🏷</span> Etiquetas</div>
                  <div className="no-tags">
                    {etiquetas.map(e => (
                      <button key={e.id_etiqueta} type="button"
                        className={`no-tag${form.etiquetas.includes(e.id_etiqueta) ? " sel" : ""}`}
                        onClick={() => toggleTag(e.id_etiqueta)}>
                        {e.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="no-actions">
                <button type="button" className="no-btn-next" onClick={handleNext}>
                  Siguiente — Detalles y precio →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              {/* Dimensiones */}
              <div className="no-section">
                <div className="no-section-title"><span>📐</span> Dimensiones (cm)</div>
                <div className="no-grid-3">
                  {([["dimensiones_alto","Alto"],["dimensiones_ancho","Ancho"],["dimensiones_profundidad","Profundidad"]] as const).map(([name,label]) => (
                    <div key={name} className="no-field">
                      <label className="no-field-label">{label}</label>
                      <input className="no-input" type="number" name={name} value={String(form[name as keyof typeof form])} onChange={handleChange} placeholder="0" min={0} step="0.1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div className="no-section">
                <div className="no-section-title"><span>💰</span> Precio</div>
                <div className="no-field">
                  <label className="no-field-label">Precio base (MXN) *</label>
                  <div className="no-price-wrap">
                    <span className="no-price-sym">$</span>
                    <input className="no-price-input" type="number" name="precio_base" value={form.precio_base} onChange={handleChange} placeholder="0.00" min={0} step="0.01" />
                  </div>
                </div>
                {precio > 0 && (
                  <div className="no-breakdown">
                    <div className="no-breakdown-row"><span>Tu precio</span><strong>${precio.toLocaleString()} MXN</strong></div>
                    <div className="no-breakdown-row comm"><span>Comisión Nu-B (15%)</span><strong>- ${comision.toLocaleString()} MXN</strong></div>
                    <div className="no-breakdown-row total"><span>Tú recibes</span><strong className="no-receive">${neto.toLocaleString()} MXN</strong></div>
                  </div>
                )}
              </div>

              {/* Extras */}
              <div className="no-section">
                <div className="no-section-title"><span>🎨</span> Extras</div>
                <div className="no-checks">
                  <label className="no-check-label">
                    <input type="checkbox" name="permite_marco" checked={form.permite_marco} onChange={handleChange} />
                    <span className="no-check-box" />
                    Permite enmarcar
                  </label>
                  <label className="no-check-label">
                    <input type="checkbox" name="con_certificado" checked={form.con_certificado} onChange={handleChange} />
                    <span className="no-check-box" />
                    Incluye certificado de autenticidad
                  </label>
                </div>
              </div>

              {/* Resumen */}
              <div className="no-section no-summary">
                <div className="no-section-title"><span>✦</span> Resumen</div>
                <div className="no-summary-grid">
                  {preview && <img src={preview} alt="Preview" className="no-summary-img" />}
                  <div>
                    <p className="no-summary-title">{form.titulo || "Sin título"}</p>
                    <p className="no-summary-cat">{categorias.find(c => c.id_categoria === parseInt(form.id_categoria))?.nombre || "Sin categoría"}</p>
                    {form.tecnica && <p className="no-summary-tech">{form.tecnica}</p>}
                    {precio > 0   && <p className="no-summary-price">${precio.toLocaleString()} MXN</p>}
                  </div>
                </div>
              </div>

              <div className="no-actions two">
                <button type="button" className="no-btn-back" onClick={() => setStep(1)}>← Regresar</button>
                <button type="submit" className="no-btn-submit" disabled={loading}>
                  {loading
                    ? <><span style={{ width:16, height:16, border:"2.5px solid rgba(245,240,255,0.25)", borderTopColor:"rgba(245,240,255,0.7)", borderRadius:"50%", display:"inline-block", animation:"spin .7s linear infinite" }} /> Enviando…</>
                    : <>📤 Publicar obra</>}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </>
  );
}