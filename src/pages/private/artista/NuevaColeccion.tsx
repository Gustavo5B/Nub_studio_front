// src/pages/private/artista/NuevaColeccion.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
  .nc-wrap { padding: 36px 40px; max-width: 620px; font-family: 'Outfit', sans-serif; }
  .nc-back { background: none; border: none; color: #9896a8; font-size: 13px; cursor: pointer; font-family: 'Outfit', sans-serif; padding: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 5px; transition: color .2s; }
  .nc-back:hover { color: #1a1830; }
  .nc-title { font-size: 22px; font-weight: 700; color: #1a1830; margin: 0 0 4px; }
  .nc-subtitle { font-size: 13px; color: #7c7a8e; margin: 0 0 28px; }
  .nc-card { background: #fff; border: 1px solid #e8e6f0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin-bottom: 16px; }
  .nc-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .nc-field:last-child { margin-bottom: 0; }
  .nc-label { font-size: 12px; font-weight: 700; color: #5a5870; text-transform: uppercase; letter-spacing: .06em; }
  .nc-input, .nc-textarea, .nc-select { background: #faf9fc; border: 1.5px solid #e8e6f0; border-radius: 9px; padding: 10px 13px; color: #1a1830; font-family: 'Outfit', sans-serif; font-size: 14px; outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box; }
  .nc-input:focus, .nc-textarea:focus, .nc-select:focus { border-color: #FF840E; background: #fff; }
  .nc-input::placeholder, .nc-textarea::placeholder { color: #c5c3d4; }
  .nc-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .nc-img-drop { border: 2px dashed #e8e6f0; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; transition: all .2s; color: #9896a8; font-size: 13px; }
  .nc-img-drop:hover, .nc-img-drop.over { border-color: #FF840E; background: #fff8f3; color: #FF840E; }
  .nc-img-preview { position: relative; border-radius: 12px; overflow: hidden; }
  .nc-img-preview img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .nc-img-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.55); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
  .nc-img-remove:hover { background: #c4304a; }
  .nc-select { appearance: none; cursor: pointer; }
  .nc-actions { display: flex; gap: 10px; margin-top: 4px; }
  .nc-btn-cancel { background: #f3f2f8; color: #5a5870; border: none; padding: 11px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .2s; }
  .nc-btn-cancel:hover { background: #e8e6f0; }
  .nc-btn-save { flex: 1; background: #FF840E; color: #fff; border: none; padding: 11px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .2s; }
  .nc-btn-save:hover:not(:disabled) { background: #e07200; }
  .nc-btn-save:disabled { background: #e8e6f0; color: #9896a8; cursor: not-allowed; }
  .nc-spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: nc-rotate .7s linear infinite; vertical-align: middle; margin-right: 6px; }
  @keyframes nc-rotate { to { transform: rotate(360deg); } }
  @media (max-width: 600px) { .nc-wrap { padding: 20px 16px; } }
`;

export default function NuevaColeccion() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const esEdicion     = Boolean(id);

  const [nombre,       setNombre]       = useState("");
  const [historia,     setHistoria]     = useState("");
  const [estado,       setEstado]       = useState("borrador");
  const [imgFile,      setImgFile]      = useState<File | null>(null);
  const [imgPreview,   setImgPreview]   = useState<string>("");
  const [imgActual,    setImgActual]    = useState<string>("");
  const [dragOver,     setDragOver]     = useState(false);
  const [loading,      setLoading]      = useState(esEdicion);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    const cargar = async () => {
      try {
        const token = authService.getToken();
        const res   = await fetch(`${API}/api/colecciones/mis-colecciones`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const col  = (data.data || []).find((c: { id_coleccion: number }) => String(c.id_coleccion) === id);
        if (!col) { showToast("Colección no encontrada", "err"); navigate("/artista/colecciones"); return; }
        setNombre(col.nombre || "");
        setHistoria(col.historia || "");
        setEstado(col.estado || "borrador");
        setImgActual(col.imagen_portada || "");
      } catch (err) {
        showToast(handleNetworkError(err), "err");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)   { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const removeImg = () => {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(null);
    setImgPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { showToast("El nombre es requerido", "warn"); return; }

    setSaving(true);
    try {
      const token = authService.getToken();
      const fd    = new FormData();
      fd.append("nombre", nombre.trim());
      if (historia.trim()) fd.append("historia", historia.trim());
      if (esEdicion) fd.append("estado", estado);
      if (imgFile) fd.append("imagen_portada", imgFile);

      const url    = esEdicion ? `${API}/api/colecciones/${id}` : `${API}/api/colecciones`;
      const method = esEdicion ? "PUT" : "POST";

      const res  = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al guardar", "err"); return; }

      showToast(esEdicion ? "Colección actualizada" : "Colección creada", "ok");
      navigate("/artista/colecciones");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSaving(false);
    }
  };

  const portadaSrc = imgPreview || imgActual;

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="nc-wrap" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200 }}>
        <div className="nc-spin" style={{ width:28, height:28, borderWidth:3 }} />
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="nc-wrap">
        <button className="nc-back" onClick={() => navigate("/artista/colecciones")}>
          ← Mis colecciones
        </button>
        <h1 className="nc-title">{esEdicion ? "Editar colección" : "Nueva colección"}</h1>
        <p className="nc-subtitle">{esEdicion ? "Modifica los datos de tu colección" : "Agrupa tus obras con un contexto común"}</p>

        <form onSubmit={handleSubmit}>
          <div className="nc-card">
            <div className="nc-field">
              <label className="nc-label">Nombre *</label>
              <input className="nc-input" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Tierra y Barro" maxLength={200} />
            </div>

            <div className="nc-field">
              <label className="nc-label">Historia</label>
              <textarea className="nc-textarea" value={historia} onChange={e => setHistoria(e.target.value)}
                placeholder="Cuéntanos el origen, la inspiración o el contexto de esta colección…" rows={5} />
            </div>

            {esEdicion && (
              <div className="nc-field">
                <label className="nc-label">Estado</label>
                <select className="nc-select" value={estado} onChange={e => setEstado(e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="publicada">Publicada</option>
                </select>
              </div>
            )}
          </div>

          <div className="nc-card">
            <div className="nc-field" style={{ marginBottom:0 }}>
              <label className="nc-label">Imagen de portada <span style={{ textTransform:"none", fontWeight:400, letterSpacing:0 }}>— opcional</span></label>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {portadaSrc ? (
                <div className="nc-img-preview">
                  <img src={portadaSrc} alt="portada" />
                  <button type="button" className="nc-img-remove" onClick={removeImg}>✕</button>
                </div>
              ) : (
                <div className={`nc-img-drop${dragOver ? " over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🖼</div>
                  Arrastra una imagen o <strong style={{ color:"#FF840E" }}>haz clic aquí</strong>
                  <div style={{ fontSize:11.5, marginTop:4, color:"#c5c3d4" }}>PNG, JPG, WEBP — Máx 10 MB</div>
                </div>
              )}
            </div>
          </div>

          <div className="nc-actions">
            <button type="button" className="nc-btn-cancel" onClick={() => navigate("/artista/colecciones")}>
              Cancelar
            </button>
            <button type="submit" className="nc-btn-save" disabled={saving}>
              {saving && <span className="nc-spin" />}
              {saving ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear colección"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
