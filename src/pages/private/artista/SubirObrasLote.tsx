// src/pages/private/artista/SubirObrasLote.tsx
// Subida de varias obras "de un jalón" a una colección del artista.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService }        from "../../../services/authService";
import { useToast }           from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", purple: "#6028AA", gold: "#A87006",
  text: "#14121E", muted: "#9896A8", green: "#0E8A50",
  red: "#C4304A", bg: "#F9F8FC", card: "#FFFFFF",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes scaleIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }

  .sl-main { padding: 40px 48px 60px; max-width: 860px; margin: 0 auto; animation: fadeUp .4s ease both; font-family:'Outfit',sans-serif; }
  .sl-back { display:flex; align-items:center; gap:6px; background:#F3F2F8; border:1.5px solid #E6E4EF; color:#9896A8; padding:8px 14px; border-radius:10px; cursor:pointer; font-family:'Outfit',sans-serif; font-size:.83rem; transition:all .2s; flex-shrink:0; margin-top:6px; }
  .sl-back:hover { background:#E6E4EF; color:${C.text}; }
  .sl-title { margin:0 0 4px; font-size:2rem; font-weight:900; color:${C.text}; letter-spacing:-.5px; line-height:1; }
  .sl-subtitle { margin:0; font-size:.9rem; color:${C.muted}; }
  .sl-section { background:${C.card}; border:1.5px solid #E6E4EF; border-radius:20px; padding:24px 26px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.055); position:relative; }
  .sl-section-title { font-size:.78rem; font-weight:800; color:#5A5870; display:flex; align-items:center; gap:8px; margin:0 0 18px; text-transform:uppercase; letter-spacing:.1em; }
  .sl-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .sl-field-label { font-size:.7rem; font-weight:700; color:#5A5870; text-transform:uppercase; letter-spacing:.08em; }
  .sl-input,.sl-textarea,.sl-select { background:#FAFAF9; border:1.5px solid #E6E4EF; border-radius:10px; padding:10px 13px; color:${C.text}; font-family:'Outfit',sans-serif; font-size:.88rem; outline:none; transition:all .2s; width:100%; box-sizing:border-box; }
  .sl-input:focus,.sl-textarea:focus,.sl-select:focus { border-color:${C.orange}; background:#fff; box-shadow:0 0 0 3px rgba(232,100,12,0.08); }
  .sl-input.error,.sl-textarea.error { border-color:${C.red}; background:rgba(196,48,74,0.04); }
  .sl-textarea { resize:vertical; min-height:76px; line-height:1.55; }
  .sl-select { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239896A8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .sl-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sl-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .sl-field-error { font-size:.7rem; color:${C.red}; font-weight:600; }
  .sl-drop { border:2px dashed rgba(232,100,12,0.3); border-radius:14px; padding:26px 18px; text-align:center; cursor:pointer; transition:all .25s; color:${C.muted}; font-size:.85rem; }
  .sl-drop:hover,.sl-drop.over { border-color:${C.orange}; background:rgba(232,100,12,0.04); color:${C.text}; }
  .sl-preview { position:relative; border-radius:14px; overflow:hidden; }
  .sl-preview img { width:100%; height:180px; object-fit:cover; display:block; }
  .sl-preview-remove { position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.55); border:none; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; }
  .sl-preview-remove:hover { background:${C.red}; }
  .sl-obra-num { position:absolute; top:-12px; left:20px; background:${C.orange}; color:#fff; font-size:.72rem; font-weight:800; padding:3px 12px; border-radius:20px; letter-spacing:.06em; }
  .sl-obra-del { position:absolute; top:14px; right:16px; background:#FFF0F2; border:1px solid #F5C6CC; color:${C.red}; padding:5px 12px; border-radius:8px; font-size:.75rem; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:background .2s; }
  .sl-obra-del:hover { background:#FDE8EB; }
  .sl-add { width:100%; border:2px dashed #E6E4EF; background:transparent; border-radius:16px; padding:16px; color:${C.muted}; font-size:.9rem; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .2s; margin-bottom:16px; }
  .sl-add:hover { border-color:${C.orange}; color:${C.orange}; background:rgba(232,100,12,0.03); }
  .sl-submit { width:100%; background:${C.orange}; border:none; color:#fff; padding:15px 24px; border-radius:13px; font-size:.95rem; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; box-shadow:0 4px 16px rgba(232,100,12,0.28); transition:all .25s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .sl-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(232,100,12,0.38); }
  .sl-submit:disabled { background:#E6E4EF; color:#9896A8; box-shadow:none; cursor:not-allowed; }
  .sl-success { text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; animation:scaleIn .4s ease; padding: 80px 0; font-family:'Outfit',sans-serif; }
  .sl-success-icon { width:96px; height:96px; background:rgba(14,138,80,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.8rem; }
  @media(max-width:768px) {
    .sl-main { padding:24px 18px 48px; }
    .sl-grid-2,.sl-grid-3 { grid-template-columns:1fr; }
  }
`;

interface Categoria { id_categoria: number; nombre: string; }

interface ObraForm {
  key: number;
  file: File | null;
  preview: string;
  titulo: string;
  descripcion: string;
  tecnica: string;
  anio_creacion: string;
  precio_base: string;
  stock: string;
  id_categoria: string;
  errores: Record<string, string>;
}

const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:|data:text\/html/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);

const nuevaObraVacia = (key: number): ObraForm => ({
  key, file: null, preview: "",
  titulo: "", descripcion: "", tecnica: "",
  anio_creacion: new Date().getFullYear().toString(),
  precio_base: "", stock: "1", id_categoria: "",
  errores: {},
});

export default function SubirObrasLote() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const { showToast } = useToast();
  const keyRef        = useRef(2);

  const [nombreColeccion, setNombreColeccion] = useState("");
  const [categorias,      setCategorias]      = useState<Categoria[]>([]);
  const [obras,           setObras]           = useState<ObraForm[]>([nuevaObraVacia(1)]);
  const [programar,       setProgramar]       = useState(false);
  const [fechaProg,       setFechaProg]       = useState("");
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [dragOverKey,     setDragOverKey]     = useState<number | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    const h     = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/categorias`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/artista-portal/mis-colecciones`, { headers: h }).then(r => r.json()),
    ]).then(([cat, cols]) => {
      setCategorias(Array.isArray(cat) ? cat : cat.categorias || cat.data || []);
      const col = (cols.data || []).find((c: { id_coleccion: number }) => String(c.id_coleccion) === id);
      if (!col) {
        showToast("Colección no encontrada", "err");
        navigate("/artista/colecciones");
        return;
      }
      setNombreColeccion(col.nombre);
    }).catch(() => showToast("Error al cargar datos", "err"));
  }, [id]);

  const updateObra = (key: number, patch: Partial<ObraForm>) =>
    setObras(prev => prev.map(o => o.key === key ? { ...o, ...patch } : o));

  const setCampo = (key: number, campo: keyof ObraForm, valor: string) => {
    setObras(prev => prev.map(o => {
      if (o.key !== key) return o;
      const errores = { ...o.errores };
      delete errores[campo as string];
      if (typeof valor === "string" && hasSuspiciousContent(valor))
        errores[campo as string] = "Contenido no permitido";
      return { ...o, [campo]: valor, errores };
    }));
  };

  const setImagen = (key: number, file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)    { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    const obra = obras.find(o => o.key === key);
    if (obra?.preview) URL.revokeObjectURL(obra.preview);
    updateObra(key, { file, preview: URL.createObjectURL(file) });
  };

  const quitarImagen = (key: number) => {
    const obra = obras.find(o => o.key === key);
    if (obra?.preview) URL.revokeObjectURL(obra.preview);
    updateObra(key, { file: null, preview: "" });
  };

  const agregarCard = () => {
    if (obras.length >= 10) { showToast("Máximo 10 obras por lote", "warn"); return; }
    setObras(prev => [...prev, nuevaObraVacia(keyRef.current++)]);
  };

  const quitarCard = (key: number) => {
    const obra = obras.find(o => o.key === key);
    if (obra?.preview) URL.revokeObjectURL(obra.preview);
    setObras(prev => prev.filter(o => o.key !== key));
  };

  const validar = (): boolean => {
    let ok = true;
    const nuevas = obras.map(o => {
      const errores: Record<string, string> = {};
      if (!o.file)                                errores.imagen = "La imagen es requerida";
      if (!o.titulo.trim())                       errores.titulo = "El título es requerido";
      else if (o.titulo.trim().length < 5)        errores.titulo = "Mínimo 5 caracteres";
      else if (hasSuspiciousContent(o.titulo))    errores.titulo = "Contenido no permitido";
      if (!o.descripcion.trim())                  errores.descripcion = "La descripción es requerida";
      else if (o.descripcion.trim().length < 20)  errores.descripcion = "Mínimo 20 caracteres";
      else if (hasSuspiciousContent(o.descripcion)) errores.descripcion = "Contenido no permitido";
      if (o.tecnica.trim() && hasSuspiciousContent(o.tecnica)) errores.tecnica = "Contenido no permitido";
      if (!o.id_categoria)                        errores.id_categoria = "Selecciona una categoría";
      const precio = parseFloat(o.precio_base);
      if (!o.precio_base || Number.isNaN(precio) || precio <= 0) errores.precio_base = "Precio requerido";
      const stock = parseInt(o.stock);
      if (!o.stock || Number.isNaN(stock) || stock < 1)          errores.stock = "Mínimo 1";
      if (Object.keys(errores).length > 0) ok = false;
      return { ...o, errores };
    });
    setObras(nuevas);
    return ok;
  };

  const handleSubmit = async () => {
    if (!validar()) { showToast("Corrige los errores marcados antes de continuar", "warn"); return; }
    if (programar) {
      if (!fechaProg) { showToast("Indica la fecha de publicación programada", "warn"); return; }
      if (new Date(fechaProg).getTime() <= Date.now()) {
        showToast("La fecha de publicación debe ser futura", "warn"); return;
      }
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      const fd    = new FormData();
      const meta  = obras.map(o => ({
        titulo:        o.titulo.trim(),
        descripcion:   o.descripcion.trim(),
        tecnica:       o.tecnica.trim() || undefined,
        anio_creacion: o.anio_creacion || undefined,
        precio_base:   o.precio_base,
        stock:         o.stock,
        id_categoria:  o.id_categoria,
      }));
      fd.append("obras", JSON.stringify(meta));
      obras.forEach(o => { if (o.file) fd.append("imagenes", o.file); });
      if (programar && fechaProg) {
        fd.append("fecha_publicacion_programada", new Date(fechaProg).toISOString());
      }

      const res  = await fetch(`${API}/api/artista-portal/colecciones/${id}/obras-lote`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al subir las obras", "err"); return; }

      setSuccess(true);
      showToast(data.message || "Obras enviadas a revisión", "ok");
      setTimeout(() => navigate("/artista/colecciones"), 2500);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <>
      <style>{css}</style>
      <div className="sl-success">
        <div className="sl-success-icon">✓</div>
        <h2 style={{ fontSize:"2rem", fontWeight:900, color:C.text, margin:0 }}>¡Obras enviadas!</h2>
        <p style={{ color:C.muted, margin:0, fontSize:".95rem" }}>
          Las obras de "{nombreColeccion}" están en revisión. El equipo de Nu-B Studio las revisará pronto.
        </p>
        <span style={{ background:"rgba(14,138,80,0.1)", color:C.green, padding:"6px 18px", borderRadius:20, fontSize:".8rem", fontWeight:700 }}>
          Redirigiendo...
        </span>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <main className="sl-main">
        <div style={{ display:"flex", alignItems:"flex-start", gap:18, marginBottom:28 }}>
          <button className="sl-back" onClick={() => navigate("/artista/colecciones")}>← Volver</button>
          <div>
            <h1 className="sl-title">📤 Subir obras a la colección</h1>
            <p className="sl-subtitle">
              {nombreColeccion ? <>Colección: <strong style={{ color:C.orange }}>{nombreColeccion}</strong> · </> : null}
              Hasta 10 obras en un solo envío. Quedarán en revisión del equipo.
            </p>
          </div>
        </div>

        {obras.map((o, idx) => (
          <div key={o.key} className="sl-section" style={{ marginTop: 22 }}>
            <span className="sl-obra-num">OBRA {idx + 1}</span>
            {obras.length > 1 && (
              <button type="button" className="sl-obra-del" onClick={() => quitarCard(o.key)}>✕ Quitar</button>
            )}

            {/* Imagen */}
            <div className="sl-field" style={{ marginTop: 10 }}>
              <label className="sl-field-label">Imagen *</label>
              {o.preview ? (
                <div className="sl-preview">
                  <img src={o.preview} alt={`Obra ${idx + 1}`} />
                  <button type="button" className="sl-preview-remove" onClick={() => quitarImagen(o.key)}>✕</button>
                </div>
              ) : (
                <label className={`sl-drop${dragOverKey === o.key ? " over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOverKey(o.key); }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={e => { e.preventDefault(); setDragOverKey(null); const f = e.dataTransfer.files[0]; if (f) setImagen(o.key, f); }}>
                  <div style={{ fontSize:"1.8rem", opacity:.6, marginBottom:4 }}>🖼</div>
                  Arrastra la imagen o <strong style={{ color:C.orange }}>haz clic aquí</strong>
                  <div style={{ fontSize:".72rem", opacity:.6, marginTop:4 }}>PNG, JPG, WEBP — Máx 10 MB</div>
                  <input type="file" accept="image/*" hidden
                    onChange={e => { const f = e.target.files?.[0]; if (f) setImagen(o.key, f); }} />
                </label>
              )}
              {o.errores.imagen && <span className="sl-field-error">⚠ {o.errores.imagen}</span>}
            </div>

            <div className="sl-grid-2">
              <div className="sl-field">
                <label className="sl-field-label">Título *</label>
                <input className={`sl-input${o.errores.titulo ? " error" : ""}`} value={o.titulo}
                  placeholder="Ej: Atardecer en la Huasteca"
                  onChange={e => setCampo(o.key, "titulo", e.target.value)} />
                {o.errores.titulo && <span className="sl-field-error">⚠ {o.errores.titulo}</span>}
              </div>
              <div className="sl-field">
                <label className="sl-field-label">Categoría *</label>
                <select className="sl-select" value={o.id_categoria}
                  onChange={e => setCampo(o.key, "id_categoria", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
                {o.errores.id_categoria && <span className="sl-field-error">⚠ {o.errores.id_categoria}</span>}
              </div>
            </div>

            <div className="sl-field">
              <label className="sl-field-label">Descripción *</label>
              <textarea className={`sl-textarea${o.errores.descripcion ? " error" : ""}`} value={o.descripcion}
                placeholder="Cuéntanos sobre esta obra, su inspiración…" rows={3}
                onChange={e => setCampo(o.key, "descripcion", e.target.value)} />
              {o.errores.descripcion && <span className="sl-field-error">⚠ {o.errores.descripcion}</span>}
            </div>

            <div className="sl-grid-3" style={{ gridTemplateColumns:"1fr 1fr 1fr 1fr" }}>
              <div className="sl-field">
                <label className="sl-field-label">Técnica</label>
                <input className={`sl-input${o.errores.tecnica ? " error" : ""}`} value={o.tecnica}
                  placeholder="Óleo sobre lienzo"
                  onChange={e => setCampo(o.key, "tecnica", e.target.value)} />
              </div>
              <div className="sl-field">
                <label className="sl-field-label">Año</label>
                <input className="sl-input" type="number" min={1900} max={new Date().getFullYear()}
                  value={o.anio_creacion}
                  onChange={e => setCampo(o.key, "anio_creacion", e.target.value)} />
              </div>
              <div className="sl-field">
                <label className="sl-field-label">Precio (MXN) *</label>
                <input className={`sl-input${o.errores.precio_base ? " error" : ""}`} type="number" min={0} step="0.01"
                  placeholder="0.00" value={o.precio_base}
                  onChange={e => setCampo(o.key, "precio_base", e.target.value)} />
                {o.errores.precio_base && <span className="sl-field-error">⚠ {o.errores.precio_base}</span>}
              </div>
              <div className="sl-field">
                <label className="sl-field-label">Stock *</label>
                <input className={`sl-input${o.errores.stock ? " error" : ""}`} type="number" min={1} step="1"
                  value={o.stock}
                  onChange={e => setCampo(o.key, "stock", e.target.value)} />
                {o.errores.stock && <span className="sl-field-error">⚠ {o.errores.stock}</span>}
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="sl-add" onClick={agregarCard} style={{ marginTop: 6 }}>
          ＋ Agregar otra obra ({obras.length}/10)
        </button>

        {/* Programación opcional */}
        <div className="sl-section">
          <div className="sl-section-title"><span>⏱</span> Publicación programada — opcional</div>
          <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:".88rem", color:"#5A5870", userSelect:"none", marginBottom: programar ? 14 : 0 }}>
            <input type="checkbox" checked={programar} onChange={e => setProgramar(e.target.checked)}
              style={{ width:16, height:16, accentColor:C.orange }} />
            Programar la publicación de estas obras para una fecha futura
          </label>
          {programar && (
            <div className="sl-field" style={{ maxWidth: 280, marginBottom: 0 }}>
              <label className="sl-field-label">Fecha y hora de publicación</label>
              <input className="sl-input" type="datetime-local" value={fechaProg}
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                onChange={e => setFechaProg(e.target.value)} />
              <p style={{ fontSize:".72rem", color:C.muted, margin:"4px 0 0", fontStyle:"italic" }}>
                Tras la aprobación del equipo, las obras se publicarán automáticamente en esta fecha.
              </p>
            </div>
          )}
        </div>

        <button type="button" className="sl-submit" disabled={loading} onClick={handleSubmit}>
          {loading
            ? <><span style={{ width:16, height:16, border:"2.5px solid rgba(255,255,255,0.25)", borderTopColor:"rgba(255,255,255,0.7)", borderRadius:"50%", display:"inline-block", animation:"spin .7s linear infinite" }} /> Subiendo obras…</>
            : <>📤 Enviar {obras.length} obra{obras.length !== 1 ? "s" : ""} a revisión</>}
        </button>
      </main>
    </>
  );
}
