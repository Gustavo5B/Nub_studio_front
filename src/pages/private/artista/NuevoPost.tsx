// src/pages/private/artista/NuevoPost.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PenSquare, Image, Save, Eye, ChevronLeft,
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Minus,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";

const C = {
  orange: "#E8640C",
  ink:    "#14121E",
  sub:    "#5A5870",
  muted:  "#9896A8",
  bg:     "#F9F8FC",
  card:   "#FFFFFF",
  border: "#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";

interface Categoria { id_categoria: number; nombre: string; }

// ── Editor de texto enriquecido ──────────────────────────
function RichEditor({
  value, onChange,
}: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Inicializar contenido al montar o cuando value cambia externamente.
  // lastValue arranca en null para que la primera vez que llegue un value
  // (incluso si el componente monta con el valor ya cargado) se escriba en el DOM.
  const lastValue = useRef<string | null>(null);
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValue.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
      lastValue.current = value;
    }
  }, [value]);

  const updateFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold"))        formats.add("bold");
    if (document.queryCommandState("italic"))      formats.add("italic");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList"))   formats.add("ol");
    setActiveFormats(formats);
  }, []);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateFormats();
    if (editorRef.current) {
      lastValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  };

  const wrapBlock = (tag: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const block = document.createElement(tag);
    try {
      range.surroundContents(block);
    } catch {
      // si la selección cruza elementos, usar formatBlock
      document.execCommand("formatBlock", false, tag);
    }
    if (editorRef.current) {
      lastValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt("URL del enlace:");
    if (!url) return;
    exec("createLink", url);
  };

  const toolbarBtn = (
    onClick: () => void,
    icon: React.ReactNode,
    title: string,
    active = false,
  ) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        width: 34, height: 34, borderRadius: 8, border: "none",
        background: active ? `${C.orange}18` : "transparent",
        color: active ? C.orange : C.sub,
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {icon}
    </button>
  );

  const sep = () => (
    <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px", flexShrink: 0 }} />
  );

  return (
    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.card, transition: "border-color 0.2s" }}
      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.orange}
      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
    >
      {/* Barra de herramientas */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2,
        padding: "8px 10px", borderBottom: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        {toolbarBtn(() => exec("bold"),   <Bold size={15} strokeWidth={2} />,   "Negrita (Ctrl+B)",   activeFormats.has("bold"))}
        {toolbarBtn(() => exec("italic"), <Italic size={15} strokeWidth={2} />, "Cursiva (Ctrl+I)",   activeFormats.has("italic"))}
        {sep()}
        {toolbarBtn(() => exec("formatBlock", "h2"), <Heading2 size={15} strokeWidth={2} />, "Título H2")}
        {toolbarBtn(() => exec("formatBlock", "h3"), <Heading3 size={15} strokeWidth={2} />, "Título H3")}
        {toolbarBtn(() => exec("formatBlock", "p"),
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: SANS }}>¶</span>, "Párrafo")}
        {sep()}
        {toolbarBtn(() => exec("insertUnorderedList"), <List size={15} strokeWidth={2} />,          "Lista con viñetas", activeFormats.has("ul"))}
        {toolbarBtn(() => exec("insertOrderedList"),   <ListOrdered size={15} strokeWidth={2} />,   "Lista numerada",    activeFormats.has("ol"))}
        {sep()}
        {toolbarBtn(() => wrapBlock("blockquote"), <Quote size={15} strokeWidth={2} />, "Cita")}
        {toolbarBtn(insertLink, <LinkIcon size={15} strokeWidth={2} />, "Insertar enlace")}
        {toolbarBtn(() => exec("insertHorizontalRule"), <Minus size={15} strokeWidth={2} />, "Línea separadora")}
        {sep()}
        {toolbarBtn(() => exec("removeFormat"),
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, letterSpacing: "-0.03em" }}>Tx</span>,
          "Limpiar formato")}
      </div>

      {/* Área editable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) {
            lastValue.current = editorRef.current.innerHTML;
            onChange(editorRef.current.innerHTML);
          }
        }}
        onKeyUp={updateFormats}
        onMouseUp={updateFormats}
        onSelect={updateFormats}
        data-placeholder="Escribe el contenido del post aquí…"
        style={{
          minHeight: 320, padding: "18px 20px",
          outline: "none", fontFamily: SANS,
          fontSize: 15, color: C.ink, lineHeight: 1.75,
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9896A8;
          pointer-events: none;
        }
        [contenteditable] h2 { font-family: ${SERIF}; font-size: 24px; font-weight: 800; margin: 1.4em 0 0.4em; color: ${C.ink}; }
        [contenteditable] h3 { font-family: ${SERIF}; font-size: 19px; font-weight: 700; margin: 1.2em 0 0.4em; color: ${C.ink}; }
        [contenteditable] p  { margin: 0 0 1em; }
        [contenteditable] ul, [contenteditable] ol { margin: 0.6em 0 1em 1.4em; }
        [contenteditable] li { margin-bottom: 0.3em; }
        [contenteditable] blockquote { border-left: 3px solid ${C.orange}; padding: 8px 16px; margin: 1em 0; background: ${C.orange}08; border-radius: 0 8px 8px 0; font-style: italic; color: #2a2840; }
        [contenteditable] a { color: ${C.orange}; text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 1px solid ${C.border}; margin: 1.5em 0; }
      `}</style>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────
export default function NuevoPost() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token   = authService.getToken();
  const userRol = localStorage.getItem("userRol") || "artista";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categorias,      setCategorias]      = useState<Categoria[]>([]);
  const [loadingPost,     setLoadingPost]     = useState(false);
  const [titulo,          setTitulo]          = useState("");
  const [extracto,        setExtracto]        = useState("");
  const [contenido,       setContenido]       = useState("");
  const [idCategoria,     setIdCategoria]     = useState("");
  const [estado,          setEstado]          = useState("borrador");
  const [metaDescription, setMetaDescription] = useState("");
  const [imagenActual,    setImagenActual]    = useState<string | null>(null);
  const [imagenFile,      setImagenFile]      = useState<File | null>(null);
  const [imagenPreview,   setImagenPreview]   = useState<string | null>(null);
  const [guardando,       setGuardando]       = useState(false);

  useEffect(() => {
    fetch(`${API}/api/categorias`)
      .then(r => r.json())
      .then(json => { if (json.data) setCategorias(json.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing || !id) return;
    setLoadingPost(true);
    fetch(`${API}/api/blog/posts/${id}/editar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) { showToast("Post no encontrado", "err"); navigate(-1); return; }
        const d = json.data;
        setTitulo(d.titulo ?? "");
        setExtracto(d.extracto ?? "");
        setContenido(d.contenido ?? "");
        setIdCategoria(d.id_categoria ? String(d.id_categoria) : "");
        setEstado(d.estado ?? "borrador");
        setMetaDescription(d.meta_description ?? "");
        setImagenActual(d.imagen_destacada ?? null);
      })
      .catch(() => showToast("Error al cargar el post", "err"))
      .finally(() => setLoadingPost(false));
  }, [id, isEditing, token, navigate, showToast]);

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => setImagenPreview(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const guardar = async (estadoFinal: string) => {
    if (!titulo.trim())   { showToast("El título es obligatorio", "err"); return; }
    if (!contenido.trim() || contenido === "<br>") { showToast("El contenido es obligatorio", "err"); return; }
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("titulo",   titulo.trim());
      formData.append("contenido", contenido);
      formData.append("extracto", extracto.trim());
      formData.append("estado",   estadoFinal);
      if (idCategoria)             formData.append("id_categoria",    idCategoria);
      if (metaDescription.trim())  formData.append("meta_description", metaDescription.trim());
      if (imagenFile)              formData.append("imagen", imagenFile);

      const res = await fetch(
        isEditing ? `${API}/api/blog/posts/${id}` : `${API}/api/blog/posts`,
        { method: isEditing ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      const json = await res.json();
      if (json.success) {
        showToast(isEditing ? "Post actualizado" : "Post creado", "ok");
        navigate(userRol === "admin" ? "/admin/blog" : "/artista/blog");
      } else {
        showToast(json.message || "Error al guardar", "err");
      }
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setGuardando(false);
    }
  };

  if (loadingPost) {
    return (
      <div style={{ padding: "36px 40px", maxWidth: 800, fontFamily: SANS }}>
        <style>{`.skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:10px}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 52, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  const imagenMostrar = imagenPreview ?? imagenActual;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 860, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display: swap; }
        .np-input    { width:100%; padding:12px 16px; border:1.5px solid ${C.border}; border-radius:12px; font-family:${SANS}; font-size:14px; color:${C.ink}; background:${C.card}; outline:none; transition:border-color .2s; box-sizing:border-box; }
        .np-input:focus { border-color:${C.orange}; }
        .np-textarea { width:100%; padding:14px 16px; border:1.5px solid ${C.border}; border-radius:12px; font-family:${SANS}; font-size:14px; color:${C.ink}; background:${C.card}; outline:none; resize:vertical; transition:border-color .2s; box-sizing:border-box; }
        .np-textarea:focus { border-color:${C.orange}; }
        .np-select   { width:100%; padding:12px 16px; border:1.5px solid ${C.border}; border-radius:12px; font-family:${SANS}; font-size:14px; color:${C.ink}; background:${C.card}; outline:none; cursor:pointer; }
        .np-label    { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${C.sub}; margin-bottom:6px; display:block; }
        .np-card     { background:${C.card}; border-radius:18px; padding:24px; box-shadow:${CS}; margin-bottom:20px; }
        .btn-primary { padding:11px 24px; background:${C.orange}; border:none; border-radius:100px; color:#fff; font-family:${SANS}; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; }
        .btn-primary:hover { opacity:.9; transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .btn-ghost   { padding:11px 24px; background:transparent; border:1.5px solid ${C.border}; border-radius:100px; color:${C.sub}; font-family:${SANS}; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; }
        .btn-ghost:hover { border-color:${C.orange}; color:${C.orange}; }
        .upload-zone { border:2px dashed ${C.border}; border-radius:14px; padding:32px; text-align:center; cursor:pointer; transition:all .2s; background:${C.bg}; }
        .upload-zone:hover { border-color:${C.orange}; background:rgba(232,100,12,0.03); }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate(userRol === "admin" ? "/admin/blog" : "/artista/blog")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 12, fontWeight: 600 }}
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PenSquare size={18} color={C.orange} />
        </div>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: C.ink, margin: 0 }}>
            {isEditing ? "Editar post" : "Nuevo post"}
          </h1>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {isEditing ? "Modifica el contenido de tu publicación" : "Crea una nueva publicación para el blog"}
          </p>
        </div>
      </div>

      {/* Título */}
      <div className="np-card">
        <label className="np-label" htmlFor="titulo">Título *</label>
        <input id="titulo" className="np-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Escribe el título del post…" maxLength={200} />
        <div style={{ textAlign: "right", fontSize: 11, color: C.muted, marginTop: 6 }}>{titulo.length}/200</div>
      </div>

      {/* Extracto */}
      <div className="np-card">
        <label className="np-label" htmlFor="extracto">Extracto / Resumen</label>
        <textarea id="extracto" className="np-textarea" value={extracto} onChange={e => setExtracto(e.target.value)} placeholder="Breve descripción del artículo (aparece en la lista del blog)…" rows={3} maxLength={400} />
        <div style={{ textAlign: "right", fontSize: 11, color: C.muted, marginTop: 6 }}>{extracto.length}/400</div>
      </div>

      {/* Contenido — editor enriquecido */}
      <div className="np-card">
        <span className="np-label">Contenido *</span>
        <RichEditor value={contenido} onChange={setContenido} />
      </div>

      {/* Imagen de portada */}
      <div className="np-card">
        <label className="np-label">Imagen de portada</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImagenChange}
        />
        {imagenMostrar ? (
          <div style={{ position: "relative" }}>
            <img src={imagenMostrar} alt="portada" style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 12, display: "block", background: C.bg }} />
            <button
              onClick={() => { setImagenFile(null); setImagenPreview(null); setImagenActual(null); }}
              style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1 }}
            >×</button>
          </div>
        ) : (
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <Image size={32} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>Haz click para seleccionar una imagen</div>
            <div style={{ fontSize: 11, color: C.muted }}>JPG, PNG o WebP · Máx. 5MB</div>
          </div>
        )}
      </div>

      {/* Categoría, estado y SEO */}
      <div className="np-card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label className="np-label" htmlFor="categoria">Categoría</label>
            <select id="categoria" className="np-select" value={idCategoria} onChange={e => setIdCategoria(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="np-label" htmlFor="estado">Estado</label>
            <select id="estado" className="np-select" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="oculto">Oculto</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <label className="np-label" htmlFor="meta">Meta descripción (SEO)</label>
          <input id="meta" className="np-input" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="Descripción para motores de búsqueda…" maxLength={160} />
          <div style={{ textAlign: "right", fontSize: 11, color: C.muted, marginTop: 6 }}>{metaDescription.length}/160</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {estado !== "publicado" && (
          <button className="btn-ghost" onClick={() => guardar("borrador")} disabled={guardando}>
            <Save size={14} /> Guardar borrador
          </button>
        )}
        <button className="btn-primary" onClick={() => guardar(estado)} disabled={guardando}>
          <Eye size={14} /> {guardando ? "Guardando…" : estado === "publicado" ? "Publicar" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
