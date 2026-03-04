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

interface FormState {
  titulo: string;
  descripcion: string;
  id_categoria: string;
  tecnica: string;
  anio_creacion: string;
  dimensiones_alto: string;
  dimensiones_ancho: string;
  dimensiones_profundidad: string;
  precio_base: string;
  permite_marco: boolean;
  con_certificado: boolean;
  imagen_principal: string;
  etiquetas: number[];
}

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function EditarObra() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const fileRef        = useRef<HTMLInputElement>(null);
  const { showToast }  = useToast();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [etiquetas,  setEtiquetas]  = useState<Etiqueta[]>([]);

  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [imgMode,    setImgMode]    = useState<"upload" | "url">("upload");
  const [dragOver,   setDragOver]   = useState(false);

  const [form, setForm] = useState<FormState>({
    titulo: "", descripcion: "", id_categoria: "", tecnica: "",
    anio_creacion: new Date().getFullYear().toString(),
    dimensiones_alto: "", dimensiones_ancho: "", dimensiones_profundidad: "",
    precio_base: "", permite_marco: false, con_certificado: false,
    imagen_principal: "", etiquetas: [],
  });

  const [obraEstado, setObraEstado] = useState<string>("");
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); }, [id]);

  const cargarDatos = async () => {
    try {
      const token   = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [obraRes, catRes, etqRes] = await Promise.all([
        fetch(`${API}/api/artista-portal/obra/${id}`, { headers }),
        fetch(`${API}/api/categorias`, { headers }),
        fetch(`${API}/api/etiquetas`,  { headers }),
      ]);

      if (!obraRes.ok) {
        const msg = await handleApiError(obraRes);
        showToast(msg, "err");
        setLoading(false);
        return;
      }

      const obra = await obraRes.json();
      setObraEstado(obra.estado || "");

      setForm({
        titulo:                  obra.titulo         || "",
        descripcion:             obra.descripcion    || "",
        id_categoria:            String(obra.id_categoria || ""),
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

      if (catRes.ok) {
        const d = await catRes.json();
        setCategorias(Array.isArray(d) ? d : d.categorias || d.data || []);
      }
      if (etqRes.ok) {
        const d = await etqRes.json();
        setEtiquetas(Array.isArray(d) ? d : d.etiquetas || d.data || []);
      }
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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
    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten imágenes", "warn");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("La imagen no puede superar 10 MB", "warn");
      return;
    }
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
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      showToast("El título es requerido", "warn");
      return;
    }
    if (!form.precio_base || parseFloat(form.precio_base) <= 0) {
      showToast("El precio es requerido", "warn");
      return;
    }

    setSaving(true);

    try {
      const token = authService.getToken();

      let body: BodyInit;
      let headers: HeadersInit = { Authorization: `Bearer ${token}` };

      if (imgFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k === "etiquetas") fd.append("etiquetas", JSON.stringify(v));
          else fd.append(k, String(v));
        });
        fd.append("imagen", imgFile);
        body = fd;
      } else {
        headers = { ...headers, "Content-Type": "application/json" };
        body = JSON.stringify({ ...form, etiquetas: JSON.stringify(form.etiquetas) });
      }

      const res = await fetch(`${API}/api/artista-portal/obra/${id}`, {
        method: "PUT", headers, body,
      });

      if (!res.ok) {
        const msg = await handleApiError(res);
        showToast(msg, "err");
        return;
      }

      setSuccess(true);
      showToast("¡Cambios guardados correctamente!", "ok");
      setTimeout(() => navigate("/artista/mis-obras"), 2200);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = imgPreview || form.imagen_principal;

  const estadoBadgeColor: Record<string, string> = {
    pendiente: "#FFC110", aprobada: "#3DDB85", rechazada: "#CC59AD",
  };

  // ── LOADING ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="nueva-obra-page">
        <aside className="artista-sidebar">
          <div className="sidebar-brand">
            <span className="brand-nu">NU</span><span className="brand-b">·B</span>
          </div>
        </aside>
        <main className="nueva-obra-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "#FF840E" }} />
            <p style={{ marginTop: 12, color: "rgba(245,240,255,0.45)", fontSize: 14 }}>Cargando obra...</p>
          </div>
        </main>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // ── SUCCESS ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="nueva-obra-success">
        <div className="success-content">
          <div className="success-icon-wrap"><CheckCircle size={64} /></div>
          <h2>¡Obra actualizada!</h2>
          <p>Los cambios han sido guardados correctamente.</p>
          <span className="success-tag">Redirigiendo...</span>
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="nueva-obra-page">

      {/* SIDEBAR */}
      <aside className="artista-sidebar">
        <div className="sidebar-brand">
          <span className="brand-nu">NU</span><span className="brand-b">·B</span>
        </div>
        <div className="sidebar-artist-info">
          <div className="artist-avatar-sm">
            {authService.getUserName()?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="artist-name-sm">{authService.getUserName()}</p>
            <span className="artist-badge">Artista activo</span>
          </div>
        </div>
        <nav className="sidebar-nav-links">
          <p className="nav-label">NAVEGACIÓN</p>
          <button className="nav-link" onClick={() => navigate("/artista/dashboard")}>
            <span className="nav-icon">⊞</span> Overview
          </button>
          <button className="nav-link active" onClick={() => navigate("/artista/mis-obras")}>
            <span className="nav-icon">🖼</span> Mis obras
          </button>
          <button className="nav-link" onClick={() => navigate("/artista/perfil")}>
            <span className="nav-icon">👤</span> Mi perfil
          </button>
        </nav>
        <button className="sidebar-upload-btn" onClick={() => navigate("/artista/nueva-obra")}>
          + Subir nueva obra
        </button>
        <button className="sidebar-logout" onClick={() => { authService.logout(); navigate("/login"); }}>
          ↪ Cerrar sesión
        </button>
      </aside>

      {/* MAIN */}
      <main className="nueva-obra-main">
        <div className="nueva-obra-header">
          <button className="back-btn" onClick={() => navigate("/artista/mis-obras")}>
            <ArrowLeft size={18} /> Mis obras
          </button>
          <div>
            <h1 className="page-title"><Sparkles size={22} /> Editar Obra</h1>
            <p className="page-subtitle" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {form.titulo || "Cargando..."}
              {obraEstado && (
                <span style={{
                  padding: "2px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 800,
                  color: estadoBadgeColor[obraEstado] || "#fff",
                  background: `${estadoBadgeColor[obraEstado] || "#fff"}18`,
                  border: `1px solid ${estadoBadgeColor[obraEstado] || "#fff"}40`,
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {obraEstado}
                </span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="nueva-obra-form">
          <div className="form-step">

            {/* IMAGEN */}
            <div className="form-section">
              <h3 className="section-title"><Image size={18} /> Imagen de la obra</h3>

              <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
                {(["upload", "url"] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setImgMode(tab)}
                    style={{ flex: 1, padding: "9px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: imgMode === tab ? 800 : 500, background: imgMode === tab ? "linear-gradient(135deg, rgba(204,89,173,0.25), rgba(141,76,205,0.15))" : "transparent", color: imgMode === tab ? "#f5f0ff" : "rgba(245,240,255,0.45)", borderRight: tab === "upload" ? "1px solid rgba(255,255,255,0.07)" : "none", transition: "all .15s" }}>
                    {tab === "upload"
                      ? <><UploadCloud size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />Subir archivo</>
                      : <><FileImage  size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />URL externa</>
                    }
                  </button>
                ))}
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              {imgMode === "upload" ? (
                imgFile ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(204,89,173,0.3)" }}>
                    <img src={imgPreview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", background: "linear-gradient(to top, rgba(8,6,18,0.9), transparent)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#f5f0ff", fontWeight: 600 }}>
                        {imgFile.name} · {(imgFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button type="button" onClick={() => fileRef.current?.click()}
                        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#f5f0ff", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer" }}>
                        Cambiar
                      </button>
                    </div>
                    <button type="button" onClick={clearFile}
                      style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(10,7,20,0.8)", border: "1px solid rgba(204,89,173,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={14} color="#CC59AD" />
                    </button>
                  </div>
                ) : (
                  <div>
                    {form.imagen_principal && (
                      <div style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
                        <img src={form.imagen_principal} alt="actual" style={{ width: "100%", height: 180, objectFit: "cover", display: "block", opacity: 0.7 }} />
                        <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(8,6,18,0.8)", color: "rgba(245,240,255,0.55)", fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
                          Imagen actual
                        </span>
                      </div>
                    )}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileRef.current?.click()}
                      style={{ borderRadius: 12, border: `2px dashed ${dragOver ? "#CC59AD" : "rgba(255,255,255,0.12)"}`, height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", background: dragOver ? "rgba(204,89,173,0.05)" : "rgba(255,255,255,0.02)", transition: "all .2s" }}>
                      <UploadCloud size={22} color={dragOver ? "#CC59AD" : "rgba(245,240,255,0.35)"} strokeWidth={1.5} />
                      <span style={{ fontSize: 12.5, color: "rgba(245,240,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}>
                        {form.imagen_principal ? "Arrastra para reemplazar la imagen" : "Arrastra o haz clic para seleccionar"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(245,240,255,0.25)" }}>PNG, JPG, WEBP — Máx 10 MB</span>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <input type="url" name="imagen_principal" value={form.imagen_principal}
                    onChange={handleChange} placeholder="https://ejemplo.com/imagen.jpg" className="field-input" />
                  {form.imagen_principal && (
                    <img src={form.imagen_principal} alt="preview url"
                      style={{ marginTop: 10, width: "100%", height: 170, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </div>
              )}
            </div>

            {/* INFORMACIÓN BÁSICA */}
            <div className="form-section">
              <h3 className="section-title"><FileText size={18} /> Información básica</h3>
              <div className="field-group">
                <label>Título de la obra *</label>
                <input type="text" name="titulo" value={form.titulo} onChange={handleChange}
                  placeholder="Ej: Atardecer en la Huasteca" className="field-input" />
              </div>
              <div className="field-group">
                <label>Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                  placeholder="Cuéntanos sobre esta obra..." rows={4} className="field-input field-textarea" />
              </div>
              <div className="fields-row">
                <div className="field-group">
                  <label>Categoría</label>
                  <select name="id_categoria" value={form.id_categoria} onChange={handleChange} className="field-input field-select">
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Técnica</label>
                  <input type="text" name="tecnica" value={form.tecnica} onChange={handleChange}
                    placeholder="Ej: Óleo sobre lienzo" className="field-input" />
                </div>
                <div className="field-group">
                  <label>Año de creación</label>
                  <input type="number" name="anio_creacion" value={form.anio_creacion} onChange={handleChange}
                    min={1900} max={new Date().getFullYear()} className="field-input" />
                </div>
              </div>
            </div>

            {/* DIMENSIONES */}
            <div className="form-section">
              <h3 className="section-title"><Ruler size={18} /> Dimensiones (cm)</h3>
              <div className="fields-row">
                {[
                  { name: "dimensiones_alto",        label: "Alto" },
                  { name: "dimensiones_ancho",       label: "Ancho" },
                  { name: "dimensiones_profundidad", label: "Profundidad" },
                ].map(f => (
                  <div key={f.name} className="field-group">
                    <label>{f.label}</label>
                    <input type="number" name={f.name}
                      value={form[f.name as keyof FormState] as string}
                      onChange={handleChange} placeholder="0" min={0} step="0.1" className="field-input" />
                  </div>
                ))}
              </div>
            </div>

            {/* PRECIO */}
            <div className="form-section">
              <h3 className="section-title"><DollarSign size={18} /> Precio</h3>
              <div className="price-field-wrap">
                <div className="field-group price-field">
                  <label>Precio base (MXN) *</label>
                  <div className="price-input-wrap">
                    <span className="price-symbol">$</span>
                    <input type="number" name="precio_base" value={form.precio_base} onChange={handleChange}
                      placeholder="0.00" min={0} step="0.01" className="field-input price-input" />
                  </div>
                </div>
                {form.precio_base && parseFloat(form.precio_base) > 0 && (
                  <div className="price-breakdown">
                    <div className="breakdown-row">
                      <span>Tu precio</span>
                      <strong>${parseFloat(form.precio_base).toLocaleString("es-MX")} MXN</strong>
                    </div>
                    <div className="breakdown-row commission">
                      <span>Comisión Nu-B (15%)</span>
                      <strong>- ${(parseFloat(form.precio_base) * 0.15).toLocaleString("es-MX")} MXN</strong>
                    </div>
                    <div className="breakdown-row total">
                      <span>Tú recibes</span>
                      <strong className="receive-amount">
                        ${(parseFloat(form.precio_base) * 0.85).toLocaleString("es-MX")} MXN
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* EXTRAS */}
            <div className="form-section">
              <h3 className="section-title"><Palette size={18} /> Extras</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="permite_marco" checked={form.permite_marco} onChange={handleChange} />
                  <span className="checkbox-custom" /> Permite enmarcar
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="con_certificado" checked={form.con_certificado} onChange={handleChange} />
                  <span className="checkbox-custom" /> Incluye certificado de autenticidad
                </label>
              </div>
            </div>

            {/* ETIQUETAS */}
            {etiquetas.length > 0 && (
              <div className="form-section">
                <h3 className="section-title"><Tag size={18} /> Etiquetas</h3>
                <div className="tags-grid">
                  {etiquetas.map(e => (
                    <button key={e.id_etiqueta} type="button"
                      className={`tag-btn ${form.etiquetas.includes(e.id_etiqueta) ? "selected" : ""}`}
                      onClick={() => toggleEtiqueta(e.id_etiqueta)}>
                      {e.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RESUMEN */}
            <div className="form-section obra-summary">
              <h3 className="section-title">✦ Resumen</h3>
              <div className="summary-grid">
                {previewSrc && (
                  <img src={previewSrc} alt="preview"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="summary-info">
                  <p className="summary-title">{form.titulo || "Sin título"}</p>
                  <p className="summary-cat">
                    {categorias.find(c => c.id_categoria === parseInt(form.id_categoria))?.nombre || "Sin categoría"}
                  </p>
                  {form.tecnica    && <p className="summary-tech">{form.tecnica}</p>}
                  {form.precio_base && (
                    <p className="summary-price">
                      ${parseFloat(form.precio_base).toLocaleString("es-MX")} MXN
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="form-actions two-btns">
              <button type="button" className="btn-back" onClick={() => navigate("/artista/mis-obras")}>
                ← Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={saving}>
                {saving
                  ? <><Loader2 size={18} className="spin" /> Guardando...</>
                  : <><Save size={18} /> Guardar cambios</>
                }
              </button>
            </div>

          </div>
        </form>
      </main>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}