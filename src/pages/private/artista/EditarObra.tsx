// src/pages/private/artista/EditarObra.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Image, X, Sparkles, Palette,
  Ruler, Tag, FileText, DollarSign, CheckCircle,
  Loader2, Save, UploadCloud, FileImage,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";
import "../../../styles/nueva-obra.css";

interface Categoria { id_categoria: number; nombre: string; }
interface Etiqueta  { id_etiqueta: number;  nombre: string; }
interface Coleccion { id_coleccion: number; nombre: string; estado: string; }

interface FormState {
  titulo: string; descripcion: string; historia: string; id_categoria: string; id_coleccion: string; tecnica: string;
  anio_creacion: string; dimensiones_alto: string; dimensiones_ancho: string;
  dimensiones_profundidad: string; precio_base: string;
  permite_marco: boolean; con_certificado: boolean;
  imagen_principal: string; etiquetas: number[];
}

interface ImagenObra { id_imagen: number; url_imagen: string; es_principal: boolean; orden: number; }

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Sanitización frontend ─────────────────────────────────────────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:|data:text\/html/i;
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
const validaciones: Partial<Record<keyof FormState, (v: string) => string | null>> = {
  titulo:      v => !v.trim() ? "El título es requerido" : v.trim().length < 3 ? "Mínimo 3 caracteres" : null,
  descripcion: v => !v.trim() ? null : v.trim().length < 20 ? "Mínimo 20 caracteres" : null,
  tecnica:     v => !v.trim() ? null : v.trim().length < 3 ? "Mínimo 3 caracteres" : null,
  precio_base: v => !v ? "El precio es requerido" : parseFloat(v) <= 0 ? "El precio debe ser mayor a 0" : null,
};
// ─────────────────────────────────────────────────────────────────────────────

export default function EditarObra() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const galeriaRef                            = useRef<HTMLInputElement>(null);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [etiquetas,   setEtiquetas]   = useState<Etiqueta[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [imgFile,     setImgFile]     = useState<File | null>(null);
  const [imgPreview,  setImgPreview]  = useState<string>("");
  const [imgMode,     setImgMode]     = useState<"upload" | "url">("upload");
  const [dragOver,    setDragOver]    = useState(false);
  const [obraEstado,  setObraEstado]  = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [imagenes,    setImagenes]    = useState<ImagenObra[]>([]);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);

  const [form, setForm] = useState<FormState>({
    titulo: "", descripcion: "", historia: "", id_categoria: "", id_coleccion: "", tecnica: "",
    anio_creacion: new Date().getFullYear().toString(),
    dimensiones_alto: "", dimensiones_ancho: "", dimensiones_profundidad: "",
    precio_base: "", permite_marco: false, con_certificado: false,
    imagen_principal: "", etiquetas: [],
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); }, [id]);

  const cargarDatos = async () => {
    try {
      const token   = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [obraRes, catRes, etqRes, colsRes] = await Promise.all([
        fetch(`${API}/api/artista-portal/obra/${id}`, { headers }),
        fetch(`${API}/api/categorias`, { headers }),
        fetch(`${API}/api/etiquetas`,  { headers }),
        fetch(`${API}/api/colecciones/mis-colecciones`, { headers }),
      ]);
      if (!obraRes.ok) { showToast(await handleApiError(obraRes), "err"); setLoading(false); return; }
      const obra = await obraRes.json();
      setObraEstado(obra.estado || "");
      setImagenes(obra.imagenes || []);
      setForm({
        titulo:                  obra.titulo         || "",
        descripcion:             obra.descripcion    || "",
        historia:                obra.historia       || "",
        id_categoria:            String(obra.id_categoria  || ""),
        id_coleccion:            String(obra.id_coleccion  || ""),
        tecnica:                 obra.tecnica        || "",
        anio_creacion:           String(obra.anio_creacion || new Date().getFullYear()),
        dimensiones_alto:        String(obra.dimensiones?.alto        ?? obra.alto_cm        ?? ""),
        dimensiones_ancho:       String(obra.dimensiones?.ancho       ?? obra.ancho_cm       ?? ""),
        dimensiones_profundidad: String(obra.dimensiones?.profundidad ?? obra.profundidad_cm ?? ""),
        precio_base:             String(obra.precio_base || ""),
        permite_marco:           Boolean(obra.permite_marco),
        con_certificado:         Boolean(obra.con_certificado),
        imagen_principal:        obra.imagen_principal || "",
        etiquetas:               (obra.etiquetas || []).map((e: { id_etiqueta?: number } | number) =>
          typeof e === "number" ? e : e.id_etiqueta ?? 0
        ),
      });
      if (catRes.ok)  { const d = await catRes.json();  setCategorias(Array.isArray(d) ? d : d.categorias || d.data || []); }
      if (etqRes.ok)  { const d = await etqRes.json();  setEtiquetas(Array.isArray(d) ? d : d.etiquetas  || d.data || []); }
      if (colsRes.ok) { const d = await colsRes.json(); setColecciones(d.data || []); }
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    if (typeof newValue === "string") {
      // Validación seguridad (XSS/SQLi)
      if (["titulo", "descripcion", "tecnica"].includes(name)) {
        if (hasSuspiciousContent(newValue)) {
          setFieldErrors(prev => ({ ...prev, [name as keyof FormState]: "Contenido no permitido" }));
          setForm(prev => ({ ...prev, [name]: newValue }));
          return;
        }
      }
      // Validación de formato en tiempo real
      const validar = validaciones[name as keyof FormState];
      if (validar) {
        const error = validar(newValue);
        setFieldErrors(prev => ({ ...prev, [name as keyof FormState]: error ?? undefined }));
      } else {
        setFieldErrors(prev => ({ ...prev, [name as keyof FormState]: undefined }));
      }
    }

    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const toggleEtiqueta = (id: number) => {
    setForm(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(id)
        ? prev.etiquetas.filter(e => e !== id)
        : [...prev.etiquetas, id],
    }));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)   { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(null);
    setImgPreview("");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validación de formato completa ──
    const erroresFormato: Partial<Record<keyof FormState, string>> = {};
    (Object.entries(validaciones) as [keyof FormState, (v: string) => string | null][]).forEach(([campo, validar]) => {
      const error = validar(String(form[campo] ?? ""));
      if (error) erroresFormato[campo] = error;
    });
    if (Object.keys(erroresFormato).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...erroresFormato }));
      showToast("Corrige los errores antes de guardar", "err");
      return;
    }

    // ── Validación de seguridad ──
    const camposTexto = ["titulo", "descripcion", "historia", "tecnica"] as const;
    for (const campo of camposTexto) {
      if (hasSuspiciousContent(String(form[campo]))) {
        showToast(`El campo "${campo}" contiene contenido no permitido`, "err");
        setFieldErrors(prev => ({ ...prev, [campo]: "Contenido no permitido" }));
        return;
      }
    }

    setSaving(true);
    try {
      const token = authService.getToken();
      let body: BodyInit;
      let headers: HeadersInit = { Authorization: `Bearer ${token}` };

      // ── Sanitizar texto antes de enviar ──
      const formSanitizado = {
        ...form,
        titulo:      sanitizeText(form.titulo),
        descripcion: sanitizeText(form.descripcion),
        historia:    sanitizeText(form.historia),
        tecnica:     sanitizeText(form.tecnica),
      };

      if (imgFile) {
        const fd = new FormData();
        Object.entries(formSanitizado).forEach(([k, v]) => {
          if (k === "etiquetas") fd.append("etiquetas", JSON.stringify(v));
          else fd.append(k, String(v));
        });
        fd.append("imagen", imgFile);
        body = fd;
      } else {
        headers = { ...headers, "Content-Type": "application/json" };
        body = JSON.stringify({ ...formSanitizado, etiquetas: JSON.stringify(formSanitizado.etiquetas) });
      }

      const res = await fetch(`${API}/api/artista-portal/obra/${id}`, { method: "PUT", headers, body });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 400 && data.code === "XSS_DETECTED") {
          showToast(`Contenido no permitido en el campo "${data.field}"`, "err"); return;
        }
        if (res.status === 400 && data.code === "SQL_INJECTION_DETECTED") {
          showToast(`Contenido no permitido en el campo "${data.field}"`, "err"); return;
        }
        showToast(await handleApiError(res), "err");
        return;
      }

      setSuccess(true);
      showToast("¡Cambios guardados correctamente!", "ok");
      setTimeout(() => navigate("/artista/mis-obras"), 2200);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setSaving(false); }
  };

  const subirFotoGaleria = async (files: FileList) => {
    const token = authService.getToken();
    setUploadingGaleria(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); continue; }
        if (file.size > 10 * 1024 * 1024)    { showToast("Cada imagen no puede superar 10 MB", "warn"); continue; }
        const fd = new FormData();
        fd.append("id_obra", String(id));
        fd.append("imagenes", file);
        const res = await fetch(`${API}/api/imagenes/galeria`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || "Error al subir imagen", "err"); continue; }
        setImagenes(prev => [...prev, data.data?.[0] ?? { id_imagen: Date.now(), url_imagen: URL.createObjectURL(file), es_principal: false, orden: prev.length }]);
      }
      showToast("Foto(s) agregada(s)", "ok");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setUploadingGaleria(false);
      if (galeriaRef.current) galeriaRef.current.value = "";
    }
  };

  const eliminarFotoGaleria = async (idImagen: number) => {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API}/api/imagenes/${idImagen}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al eliminar", "err"); return; }
      setImagenes(prev => prev.filter(img => img.id_imagen !== idImagen));
      showToast("Foto eliminada", "ok");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    }
  };

  const previewSrc = imgPreview || form.imagen_principal;
  const estadoBadgeColor: Record<string, string> = {
    pendiente: "#FFC110", aprobada: "#3DDB85", rechazada: "#CC59AD",
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh", flexDirection:"column", gap:16 }}>
      <Loader2 size={36} style={{ animation:"spin 1s linear infinite", color:"#FF840E" }} />
      <p style={{ color:"#666", fontSize:14 }}>Cargando obra...</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (success) return (
    <div className="nueva-obra-success">
      <div className="success-content">
        <div className="success-icon-wrap"><CheckCircle size={64} /></div>
        <h2>¡Obra actualizada!</h2>
        <p>Los cambios han sido guardados correctamente.</p>
        <span className="success-tag">Redirigiendo...</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"32px 36px", maxWidth:860, background:"#fff", minHeight:"100vh" }} className="artista-main-pad">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <button onClick={() => navigate("/artista/mis-obras")}
          style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:16, padding:0 }}>
          <ArrowLeft size={16} /> Mis obras
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:"#1a1a1a", margin:0, fontFamily:"'Playfair Display',serif", display:"flex", alignItems:"center", gap:8 }}>
            <Sparkles size={22} color="#FF840E" /> Editar Obra
          </h1>
          {obraEstado && (
            <span style={{ padding:"3px 12px", borderRadius:100, fontSize:10.5, fontWeight:800,
              color: estadoBadgeColor[obraEstado] || "#fff",
              background: `${estadoBadgeColor[obraEstado] || "#fff"}18`,
              border: `1px solid ${estadoBadgeColor[obraEstado] || "#fff"}40`,
              textTransform:"uppercase" }}>
              {obraEstado}
            </span>
          )}
        </div>
        <p style={{ fontSize:13, color:"#666", margin:"6px 0 0" }}>{form.titulo}</p>
      </div>

      <form onSubmit={handleSubmit} className="nueva-obra-form">
        <div className="form-step">

          {/* IMAGEN */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><Image size={18} /> Imagen de la obra</h3>
            <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:"1px solid #e0e0e0", marginBottom:12 }}>
              {(["upload", "url"] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setImgMode(tab)}
                  style={{ flex:1, padding:"9px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12.5, fontWeight:imgMode===tab?800:500, background:imgMode===tab?"#f0f0f0":"transparent", color:imgMode===tab?"#333":"#999", borderRight:tab==="upload"?"1px solid #e0e0e0":"none", transition:"all .15s" }}>
                  {tab === "upload"
                    ? <><UploadCloud size={12} style={{ marginRight:5, verticalAlign:"middle" }} />Subir archivo</>
                    : <><FileImage  size={12} style={{ marginRight:5, verticalAlign:"middle" }} />URL externa</>}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {imgMode === "upload" ? (
              imgFile ? (
                <div style={{ position:"relative", borderRadius:12, overflow:"hidden", border:"1px solid #ddd" }}>
                  <img src={imgPreview} alt="preview" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }} />
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 14px", background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{imgFile.name} · {(imgFile.size/1024/1024).toFixed(1)} MB</span>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:6, color:"#fff", fontSize:11, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>
                      Cambiar
                    </button>
                  </div>
                  <button type="button" onClick={clearFile}
                    style={{ position:"absolute", top:8, right:8, width:26, height:26, borderRadius:"50%", background:"rgba(0,0,0,0.7)", border:"1px solid #FF840E", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <X size={14} color="#FF840E" />
                  </button>
                </div>
              ) : (
                <div>
                  {form.imagen_principal && (
                    <div style={{ marginBottom:10, borderRadius:12, overflow:"hidden", border:"1px solid #e0e0e0", position:"relative" }}>
                      <img src={form.imagen_principal} alt="actual" style={{ width:"100%", height:180, objectFit:"cover", display:"block", opacity:0.7 }} />
                      <span style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:10.5, fontWeight:700, padding:"3px 10px", borderRadius:100, border:"1px solid rgba(0,0,0,0.1)" }}>
                        Imagen actual
                      </span>
                    </div>
                  )}
                  <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)} onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{ borderRadius:12, border:`2px dashed ${dragOver?"#FF840E":"#ccc"}`, height:110, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer", background:dragOver?"rgba(255,132,14,0.05)":"#fafafa", transition:"all .2s" }}>
                    <UploadCloud size={22} color={dragOver?"#FF840E":"#999"} strokeWidth={1.5} />
                    <span style={{ fontSize:12.5, color:"#666", fontFamily:"'DM Sans',sans-serif" }}>
                      {form.imagen_principal ? "Arrastra para reemplazar la imagen" : "Arrastra o haz clic para seleccionar"}
                    </span>
                    <span style={{ fontSize:11, color:"#999" }}>PNG, JPG, WEBP — Máx 10 MB</span>
                  </div>
                </div>
              )
            ) : (
              <div>
                <input type="url" name="imagen_principal" value={form.imagen_principal} onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg" className="field-input" style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }} />
                {form.imagen_principal && (
                  <img src={form.imagen_principal} alt="preview url"
                    style={{ marginTop:10, width:"100%", height:170, objectFit:"cover", borderRadius:10, border:"1px solid #e0e0e0" }}
                    onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                )}
              </div>
            )}
          </div>

          {/* INFORMACIÓN BÁSICA */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><FileText size={18} /> Información básica</h3>
            <div className="field-group">
              <label style={{ color:"#333", fontWeight:600 }}>Título de la obra * <span style={{ fontSize:10.5, color:"#999", fontWeight:400 }}>mínimo 3 caracteres</span></label>
              <input type="text" name="titulo" value={form.titulo} onChange={handleChange}
                placeholder="Ej: Atardecer en la Huasteca"
                style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }}
                className={`field-input${fieldErrors.titulo ? " field-input-error" : ""}`} />
              {fieldErrors.titulo && <span style={{ fontSize:11.5, color:"#e74c3c", fontWeight:600, marginTop:4, display:"block" }}>⚠ {fieldErrors.titulo}</span>}
            </div>
            <div className="field-group">
              <label style={{ color:"#333", fontWeight:600 }}>
                Descripción
                <span style={{ fontSize:10.5, color:"#999", fontWeight:400, marginLeft:6 }}>
                  {form.descripcion.length} caracteres{form.descripcion.length > 0 && form.descripcion.length < 20 ? " — mínimo 20" : ""}
                </span>
              </label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder="Cuéntanos sobre esta obra... (mínimo 20 caracteres si la llenas)" rows={4}
                style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%", fontFamily:"inherit" }}
                className={`field-input field-textarea${fieldErrors.descripcion ? " field-input-error" : ""}`} />
              {fieldErrors.descripcion && <span style={{ fontSize:11.5, color:"#e74c3c", fontWeight:600, marginTop:4, display:"block" }}>⚠ {fieldErrors.descripcion}</span>}
            </div>
            <div className="field-group">
              <label style={{ color:"#333", fontWeight:600 }}>Historia de la obra</label>
              <textarea name="historia" value={form.historia} onChange={handleChange}
                placeholder="Cuéntanos el contexto, el proceso o la historia detrás de esta obra…" rows={4}
                style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%", fontFamily:"inherit" }}
                className={`field-input field-textarea${fieldErrors.historia ? " field-input-error" : ""}`} />
              {fieldErrors.historia && <span style={{ fontSize:11.5, color:"#e74c3c", fontWeight:600, marginTop:4, display:"block" }}>⚠ {fieldErrors.historia}</span>}
            </div>
            {colecciones.length > 0 && (
              <div className="field-group">
                <label style={{ color:"#333", fontWeight:600 }}>Colección <span style={{ fontSize:10.5, color:"#999", fontWeight:400 }}>— opcional</span></label>
                <select name="id_coleccion" value={form.id_coleccion} onChange={handleChange} style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%", background:"#fff" }}>
                  <option value="">Sin colección</option>
                  {colecciones.map(c => (
                    <option key={c.id_coleccion} value={c.id_coleccion}>
                      {c.nombre}{c.estado === "borrador" ? " (borrador)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="fields-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div className="field-group">
                <label style={{ color:"#333", fontWeight:600 }}>Categoría</label>
                <select name="id_categoria" value={form.id_categoria} onChange={handleChange} style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%", background:"#fff" }}>
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label style={{ color:"#333", fontWeight:600 }}>Técnica <span style={{ fontSize:10.5, color:"#999", fontWeight:400 }}>mínimo 3 caracteres</span></label>
                <input type="text" name="tecnica" value={form.tecnica} onChange={handleChange}
                  placeholder="Ej: Óleo sobre lienzo"
                  style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }}
                  className={`field-input${fieldErrors.tecnica ? " field-input-error" : ""}`} />
                {fieldErrors.tecnica && <span style={{ fontSize:11.5, color:"#e74c3c", fontWeight:600, marginTop:4, display:"block" }}>⚠ {fieldErrors.tecnica}</span>}
              </div>
              <div className="field-group">
                <label style={{ color:"#333", fontWeight:600 }}>Año de creación</label>
                <input type="number" name="anio_creacion" value={form.anio_creacion} onChange={handleChange}
                  min={1900} max={new Date().getFullYear()} style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }} />
              </div>
            </div>
          </div>

          {/* DIMENSIONES */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><Ruler size={18} /> Dimensiones (cm)</h3>
            <div className="fields-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              {[
                { name:"dimensiones_alto",        label:"Alto" },
                { name:"dimensiones_ancho",       label:"Ancho" },
                { name:"dimensiones_profundidad", label:"Profundidad" },
              ].map(f => (
                <div key={f.name} className="field-group">
                  <label style={{ color:"#333", fontWeight:600 }}>{f.label}</label>
                  <input type="number" name={f.name} value={form[f.name as keyof FormState] as string}
                    onChange={handleChange} placeholder="0" min={0} step="0.1" style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }} />
                </div>
              ))}
            </div>
          </div>

          {/* PRECIO */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><DollarSign size={18} /> Precio</h3>
            <div className="price-field-wrap">
              <div className="field-group price-field">
                <label style={{ color:"#333", fontWeight:600 }}>Precio base (MXN) *</label>
                <div className="price-input-wrap" style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="price-symbol" style={{ fontSize:18, fontWeight:600 }}>$</span>
                  <input type="number" name="precio_base" value={form.precio_base} onChange={handleChange}
                    placeholder="0.00" min={0} step="0.01" style={{ border:"1px solid #ddd", padding:"10px", borderRadius:8, width:"100%" }}
                    className={`price-input${fieldErrors.precio_base ? " field-input-error" : ""}`} />
                </div>
                {fieldErrors.precio_base && <span style={{ fontSize:11.5, color:"#e74c3c", fontWeight:600, marginTop:4, display:"block" }}>⚠ {fieldErrors.precio_base}</span>}
              </div>
              {form.precio_base && parseFloat(form.precio_base) > 0 && (
                <div style={{ marginTop:16, padding:12, background:"#f5f5f5", borderRadius:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}><span style={{ color:"#666" }}>Tu precio</span><strong style={{ color:"#333" }}>${parseFloat(form.precio_base).toLocaleString("es-MX")} MXN</strong></div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}><span style={{ color:"#666" }}>Comisión Nu-B (15%)</span><strong style={{ color:"#e74c3c" }}>- ${(parseFloat(form.precio_base)*0.15).toLocaleString("es-MX")} MXN</strong></div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0 0", borderTop:"1px solid #ddd", marginTop:4 }}><span style={{ fontWeight:600, color:"#333" }}>Tú recibes</span><strong style={{ fontSize:18, color:"#27ae60" }}>${(parseFloat(form.precio_base)*0.85).toLocaleString("es-MX")} MXN</strong></div>
                </div>
              )}
            </div>
          </div>

          {/* EXTRAS */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><Palette size={18} /> Extras</h3>
            <div className="checkbox-group" style={{ display:"flex", gap:24 }}>
              <label className="checkbox-label" style={{ display:"flex", alignItems:"center", gap:8, color:"#333" }}>
                <input type="checkbox" name="permite_marco" checked={form.permite_marco} onChange={handleChange} />
                Permite enmarcar
              </label>
              <label className="checkbox-label" style={{ display:"flex", alignItems:"center", gap:8, color:"#333" }}>
                <input type="checkbox" name="con_certificado" checked={form.con_certificado} onChange={handleChange} />
                Incluye certificado de autenticidad
              </label>
            </div>
          </div>

          {/* ETIQUETAS */}
          {etiquetas.length > 0 && (
            <div className="form-section">
              <h3 className="section-title" style={{ color:"#333" }}><Tag size={18} /> Etiquetas</h3>
              <div className="tags-grid" style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {etiquetas.map(e => (
                  <button key={e.id_etiqueta} type="button"
                    style={{ padding:"6px 14px", borderRadius:20, border:"1px solid #ddd", background:form.etiquetas.includes(e.id_etiqueta) ? "#FF840E" : "#fff", color:form.etiquetas.includes(e.id_etiqueta) ? "#fff" : "#666", cursor:"pointer", fontSize:12, transition:"all .2s" }}
                    onClick={() => toggleEtiqueta(e.id_etiqueta)}>
                    {e.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GALERÍA */}
          <div className="form-section">
            <h3 className="section-title" style={{ color:"#333" }}><FileImage size={18} /> Fotos adicionales
              <span style={{ fontSize:11, fontWeight:400, color:"#999", marginLeft:8 }}>
                {imagenes.length}/6 fotos · máx. 6
              </span>
            </h3>
            <input ref={galeriaRef} type="file" accept="image/*" multiple style={{ display:"none" }}
              onChange={e => { if (e.target.files) subirFotoGaleria(e.target.files); }} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:10 }}>
              {imagenes.map(img => (
                <div key={img.id_imagen} style={{ position:"relative", width:90, height:90 }}>
                  <img src={img.url_imagen} alt="" style={{ width:90, height:90, objectFit:"cover", borderRadius:10, border:`1.5px solid ${img.es_principal ? "#FF840E" : "#ddd"}` }} />
                  {img.es_principal && (
                    <span style={{ position:"absolute", bottom:3, left:3, background:"rgba(255,132,14,0.9)", color:"#fff", fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:4 }}>
                      PRINCIPAL
                    </span>
                  )}
                  {!img.es_principal && (
                    <button type="button" onClick={() => eliminarFotoGaleria(img.id_imagen)}
                      style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {imagenes.length < 6 && (
                <button type="button" onClick={() => galeriaRef.current?.click()} disabled={uploadingGaleria}
                  style={{ width:90, height:90, borderRadius:10, border:"2px dashed #ccc", background:"#fafafa", color:"#999", cursor:"pointer", fontSize:uploadingGaleria ? 12 : 24, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {uploadingGaleria ? <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> : "+"}
                </button>
              )}
            </div>
            <p style={{ fontSize:11, color:"#999", margin:0 }}>
              La foto principal no se puede eliminar desde aquí. Para cambiarla sube una nueva imagen arriba.
            </p>
          </div>

          {/* RESUMEN */}
          <div className="form-section obra-summary" style={{ background:"#f9f9f9", padding:16, borderRadius:12 }}>
            <h3 className="section-title" style={{ color:"#333" }}>✦ Resumen</h3>
            <div style={{ display:"flex", gap:16, alignItems:"center" }}>
              {previewSrc && (
                <img src={previewSrc} alt="preview" style={{ width:80, height:80, objectFit:"cover", borderRadius:10 }}
                  onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              )}
              <div>
                <p style={{ fontSize:16, fontWeight:700, color:"#333", margin:0 }}>{form.titulo || "Sin título"}</p>
                <p style={{ fontSize:12, color:"#666", margin:"4px 0" }}>{categorias.find(c => c.id_categoria === parseInt(form.id_categoria))?.nombre || "Sin categoría"}</p>
                {form.tecnica     && <p style={{ fontSize:12, color:"#666", margin:"2px 0" }}>{form.tecnica}</p>}
                {form.precio_base && <p style={{ fontSize:14, fontWeight:700, color:"#27ae60", margin:"4px 0 0" }}>${parseFloat(form.precio_base).toLocaleString("es-MX")} MXN</p>}
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="form-actions two-btns" style={{ display:"flex", gap:16, marginTop:24 }}>
            <button type="button" className="btn-back" onClick={() => navigate("/artista/mis-obras")}
              style={{ flex:1, padding:"12px", border:"1px solid #ddd", background:"#fff", borderRadius:8, color:"#666", cursor:"pointer", fontWeight:600 }}>
              ← Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={saving}
              style={{ flex:1, padding:"12px", border:"none", background:"#FF840E", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {saving
                ? <><Loader2 size={18} className="spin" /> Guardando...</>
                : <><Save size={18} /> Guardar cambios</>}
            </button>
          </div>

        </div>
      </form>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}