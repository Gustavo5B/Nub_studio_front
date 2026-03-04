// src/pages/private/artista/NuevaObra.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Image,
  X,
  Sparkles,
  Palette,
  Ruler,
  Tag,
  FileText,
  DollarSign,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";
import "../../../styles/nueva-obra.css";

interface Categoria {
  id_categoria: number;
  nombre: string;
}

interface Etiqueta {
  id_etiqueta: number;
  nombre: string;
}

interface FormData {
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
  etiquetas: number[];
}

export default function NuevaObra() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [etiquetas, setEtiquetas]   = useState<Etiqueta[]>([]);
  const [preview,   setPreview]     = useState<string | null>(null);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [loading,   setLoading]     = useState(false);
  const [success,   setSuccess]     = useState(false);
  const [dragOver,  setDragOver]    = useState(false);
  const [step,      setStep]        = useState(1);

  const [form, setForm] = useState<FormData>({
    titulo: "",
    descripcion: "",
    id_categoria: "",
    tecnica: "",
    anio_creacion: new Date().getFullYear().toString(),
    dimensiones_alto: "",
    dimensiones_ancho: "",
    dimensiones_profundidad: "",
    precio_base: "",
    permite_marco: false,
    con_certificado: false,
    etiquetas: [],
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarCatalogos(); }, []);

  const cargarCatalogos = async () => {
    try {
      const token   = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [catRes, etqRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/etiquetas`,  { headers }),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategorias(Array.isArray(catData) ? catData : catData.categorias || catData.data || []);
      } else {
        showToast("No se pudieron cargar las categorías", "warn");
      }

      if (etqRes.ok) {
        const etqData = await etqRes.json();
        setEtiquetas(Array.isArray(etqData) ? etqData : etqData.etiquetas || etqData.data || []);
      }
    } catch (err) {
      showToast(handleNetworkError(err), "err");
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

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processImage(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const processImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateStep1 = () => {
    if (!form.titulo.trim())      return "El título es requerido";
    if (!form.descripcion.trim()) return "La descripción es requerida";
    if (!form.id_categoria)       return "Selecciona una categoría";
    if (!imageFile)               return "Debes subir una imagen de la obra";
    return null;
  };

  const handleNextStep = () => {
    const err = validateStep1();
    if (err) {
      showToast(err, "warn");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.precio_base || parseFloat(form.precio_base) <= 0) {
      showToast("El precio base es requerido", "warn");
      return;
    }

    setLoading(true);

    try {
      const token    = authService.getToken();
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "etiquetas") {
          formData.append("etiquetas", JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      if (imageFile) formData.append("imagen", imageFile);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/artista-portal/nueva-obra`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const msg = await handleApiError(res);
        showToast(msg, "err");
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

  if (success) {
    return (
      <div className="nueva-obra-success">
        <div className="success-content">
          <div className="success-icon-wrap">
            <CheckCircle size={64} />
          </div>
          <h2>¡Obra enviada!</h2>
          <p>Tu obra está en revisión. El equipo de Nu-B Studio la revisará pronto.</p>
          <span className="success-tag">Redirigiendo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nueva-obra-page">
      {/* Sidebar */}
      <aside className="artista-sidebar">
        <div className="sidebar-brand">
          <span className="brand-nu">NU</span>
          <span className="brand-b">·B</span>
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

      {/* Main */}
      <main className="nueva-obra-main">
        <div className="nueva-obra-header">
          <button className="back-btn" onClick={() => navigate("/artista/dashboard")}>
            <ArrowLeft size={18} /> Volver
          </button>
          <div>
            <h1 className="page-title"><Sparkles size={22} /> Nueva Obra</h1>
            <p className="page-subtitle">Comparte tu arte con el mundo</p>
          </div>
        </div>

        <div className="steps-indicator">
          <div className={`step-dot ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
            <span>1</span>
            <label>Información</label>
          </div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? "active" : ""}`}>
            <span>2</span>
            <label>Detalles & Precio</label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="nueva-obra-form">

          {/* ===== STEP 1 ===== */}
          {step === 1 && (
            <div className="form-step">
              <div className="form-section">
                <h3 className="section-title"><Image size={18} /> Imagen de la obra</h3>
                {!preview ? (
                  <div
                    className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleImageDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={40} />
                    <p>Arrastra tu imagen aquí o <span>haz clic para seleccionar</span></p>
                    <small>PNG, JPG, WEBP — Máx 10MB</small>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} hidden />
                  </div>
                ) : (
                  <div className="image-preview-wrap">
                    <img src={preview} alt="Preview" className="image-preview" />
                    <button type="button" className="remove-image-btn" onClick={removeImage}>
                      <X size={18} />
                    </button>
                    <div className="image-overlay"><span>✓ Imagen lista</span></div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3 className="section-title"><FileText size={18} /> Información básica</h3>

                <div className="field-group">
                  <label>Título de la obra *</label>
                  <input type="text" name="titulo" value={form.titulo} onChange={handleChange}
                    placeholder="Ej: Atardecer en la Huasteca" className="field-input" />
                </div>

                <div className="field-group">
                  <label>Descripción *</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                    placeholder="Cuéntanos sobre esta obra, su inspiración, el proceso creativo..."
                    rows={4} className="field-input field-textarea" />
                </div>

                <div className="fields-row">
                  <div className="field-group">
                    <label>Categoría *</label>
                    <select name="id_categoria" value={form.id_categoria} onChange={handleChange}
                      className="field-input field-select">
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

              <div className="form-actions">
                <button type="button" className="btn-next" onClick={handleNextStep}>
                  Siguiente — Detalles y precio →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2 ===== */}
          {step === 2 && (
            <div className="form-step">
              <div className="form-section">
                <h3 className="section-title"><Ruler size={18} /> Dimensiones (cm)</h3>
                <div className="fields-row">
                  <div className="field-group">
                    <label>Alto</label>
                    <input type="number" name="dimensiones_alto" value={form.dimensiones_alto}
                      onChange={handleChange} placeholder="0" min={0} step="0.1" className="field-input" />
                  </div>
                  <div className="field-group">
                    <label>Ancho</label>
                    <input type="number" name="dimensiones_ancho" value={form.dimensiones_ancho}
                      onChange={handleChange} placeholder="0" min={0} step="0.1" className="field-input" />
                  </div>
                  <div className="field-group">
                    <label>Profundidad</label>
                    <input type="number" name="dimensiones_profundidad" value={form.dimensiones_profundidad}
                      onChange={handleChange} placeholder="0" min={0} step="0.1" className="field-input" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title"><DollarSign size={18} /> Precio</h3>
                <div className="price-field-wrap">
                  <div className="field-group price-field">
                    <label>Precio base (MXN) *</label>
                    <div className="price-input-wrap">
                      <span className="price-symbol">$</span>
                      <input type="number" name="precio_base" value={form.precio_base}
                        onChange={handleChange} placeholder="0.00" min={0} step="0.01"
                        className="field-input price-input" />
                    </div>
                  </div>
                  {form.precio_base && (
                    <div className="price-breakdown">
                      <div className="breakdown-row">
                        <span>Tu precio</span>
                        <strong>${parseFloat(form.precio_base || "0").toLocaleString()} MXN</strong>
                      </div>
                      <div className="breakdown-row commission">
                        <span>Comisión Nu-B (15%)</span>
                        <strong>- ${(parseFloat(form.precio_base || "0") * 0.15).toLocaleString()} MXN</strong>
                      </div>
                      <div className="breakdown-row total">
                        <span>Tú recibes</span>
                        <strong className="receive-amount">
                          ${(parseFloat(form.precio_base || "0") * 0.85).toLocaleString()} MXN
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title"><Palette size={18} /> Extras</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="permite_marco" checked={form.permite_marco} onChange={handleChange} />
                    <span className="checkbox-custom" />
                    Permite enmarcar
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="con_certificado" checked={form.con_certificado} onChange={handleChange} />
                    <span className="checkbox-custom" />
                    Incluye certificado de autenticidad
                  </label>
                </div>
              </div>

              <div className="form-section obra-summary">
                <h3 className="section-title">✦ Resumen</h3>
                <div className="summary-grid">
                  {preview && <img src={preview} alt="Preview" className="summary-img" />}
                  <div className="summary-info">
                    <p className="summary-title">{form.titulo || "Sin título"}</p>
                    <p className="summary-cat">
                      {categorias.find(c => c.id_categoria === parseInt(form.id_categoria))?.nombre || "Sin categoría"}
                    </p>
                    {form.tecnica    && <p className="summary-tech">{form.tecnica}</p>}
                    {form.precio_base && <p className="summary-price">${parseFloat(form.precio_base).toLocaleString()} MXN</p>}
                  </div>
                </div>
              </div>

              <div className="form-actions two-btns">
                <button type="button" className="btn-back" onClick={() => setStep(1)}>
                  ← Regresar
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading
                    ? <><Loader2 size={18} className="spin" /> Enviando...</>
                    : <><Upload size={18} /> Publicar obra</>
                  }
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}