// src/pages/private/admin/CrearObra.tsx
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  LayoutDashboard, ShoppingBag, BarChart2, Settings,
  LogOut, Layers, Star,
  UploadCloud, X, FileImage, ChevronRight,
} from "lucide-react";
import { obraService } from "../../../services/obraService";
import type { Obra } from "../../../services/obraService";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";
import logoImg from "../../../assets/images/logo.png";

// ── Paleta unificada ──────────────────────────────────────────
const C = {
  orange:      "#FF840E",
  pink:        "#CC59AD",
  magenta:     "#CC4EA1",
  purple:      "#8D4CCD",
  blue:        "#79AAF5",
  gold:        "#FFC110",
  green:       "#22C97A",
  cream:       "#FFF8EE",
  creamSub:    "#D8CABC",
  creamMut:    "rgba(255,232,200,0.35)",
  bg:          "#0C0812",
  bgDeep:      "#070510",
  panel:       "#100D1C",
  card:        "rgba(18,13,30,0.95)",
  border:      "rgba(255,200,150,0.08)",
  borderBr:    "rgba(118,78,49,0.20)",
  borderHi:    "rgba(255,200,150,0.18)",
  input:       "rgba(255,232,200,0.04)",
  inputBorder: "rgba(255,200,150,0.14)",
  inputFocus:  "rgba(255,132,14,0.08)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

// Formato de número profesional
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin"          },
  { id: "obras",     label: "Obras",     icon: Layers,          path: "/admin/obras"    },
  { id: "artistas",  label: "Artistas",  icon: Users,           path: "/admin/artistas" },
  { id: "ventas",    label: "Ventas",    icon: ShoppingBag,     path: "/admin"          },
  { id: "reportes",  label: "Reportes",  icon: BarChart2,       path: "/admin"          },
];

interface Categoria { id_categoria: number; nombre: string; }
interface Tecnica   { id_tecnica:   number; nombre: string; }
interface Artista   { id_artista:   number; nombre_completo: string; nombre_artistico?: string; }

// ── Sidebar canónico — 220px, logoImg, bgDeep sólido, naranja único ──
function Sidebar({ navigate }: { navigate: (p: string) => void }) {
  const active   = "obras";
  const userName = authService.getUserName?.() || "Admin";

  return (
    <div style={{
      width: 220, minHeight: "100vh",
      background: C.bgDeep,
      borderRight: `1px solid ${C.borderBr}`,
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh",
      flexShrink: 0, zIndex: 40,
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: "hidden", border: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
            <img src={logoImg} alt="Galería Altar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.cream, lineHeight: 1.1, fontFamily: FD, letterSpacing: "-0.01em" }}>Galería</div>
            <div style={{ fontSize: 9, color: C.orange, marginTop: 2, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: FB, fontWeight: 700 }}>Panel Admin</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,200,150,0.04)", border: `1px solid ${C.borderBr}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", fontFamily: FB }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userName}</div>
            <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>Admin</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav — naranja único como activo, sin colores por item */}
      <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.creamMut, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 8px 10px", fontFamily: FB }}>Navegación</div>
        {NAV.map(({ id, label, icon: Icon, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => navigate(path)}
              style={{ width: "100%", cursor: "pointer", background: on ? "rgba(255,132,14,0.10)" : "transparent", border: on ? "1px solid rgba(255,132,14,0.22)" : "1px solid transparent", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", position: "relative", fontFamily: FB }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {on && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2.5, borderRadius: "0 3px 3px 0", background: C.orange }} />}
              <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: on ? "rgba(255,132,14,0.15)" : "rgba(255,232,200,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: on ? "1px solid rgba(255,132,14,0.25)" : "1px solid transparent", transition: "all .15s" }}>
                <Icon size={15} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "12px 10px 18px", borderTop: `1px solid ${C.borderBr}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 12, color: C.creamMut, fontWeight: 600, fontFamily: FB, transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.creamSub}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={() => { authService.logout(); navigate("/login"); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid rgba(204,89,173,0.25)`, background: "rgba(204,89,173,0.06)", cursor: "pointer", fontSize: 12, color: C.pink, fontWeight: 600, fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function IS(focused: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: focused ? C.inputFocus : C.input,
    border: `1.5px solid ${focused ? C.orange : C.inputBorder}`,
    borderRadius: 10, fontSize: 13.5, color: C.cream, outline: "none",
    transition: "border-color .15s, background .15s",
    fontFamily: FB, opacity: disabled ? 0.5 : 1,
  };
}

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, marginBottom: 7, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>
      {children}{req && <span style={{ color: C.orange }}>*</span>}
    </div>
  );
}

// ── Card — borderRadius:14, accent line height:2 ──────────────
function Card({ accent, icon: Icon, title, children, delay = 0 }: {
  accent: string; icon: React.ElementType; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 14, position: "relative", animation: `fadeUp .5s ease ${delay}s both` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}50, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={accent} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.cream, fontFamily: FD }}>{title}</span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${accent}18, transparent)` }} />
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function Toggle({ label, name, checked, onChange, disabled, icon: Icon, accent }: {
  label: string; name: string; checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean; icon: React.ElementType; accent: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", border: `1.5px solid ${checked ? `${accent}50` : C.border}`, background: checked ? `${accent}10` : "rgba(255,232,200,0.02)", transition: "all .15s", userSelect: "none" as const }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${checked ? accent : C.creamMut}`, background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
        {checked && <CheckCircle2 size={11} color="white" strokeWidth={3} />}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display: "none" }} />
      <Icon size={14} color={checked ? accent : C.creamMut} strokeWidth={2} />
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
    </label>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function CrearObra() {
  const navigate      = useNavigate();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [imgMode,    setImgMode]    = useState<"upload" | "url">("upload");
  const [dragOver,   setDragOver]   = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tecnicas,   setTecnicas]   = useState<Tecnica[]>([]);
  const [artistas,   setArtistas]   = useState<Artista[]>([]);

  const [form, setForm] = useState<Obra>({
    titulo: "", descripcion: "", id_categoria: 0, id_tecnica: undefined, id_artista: 0,
    precio_base: 0, anio_creacion: new Date().getFullYear(),
    dimensiones_alto: undefined, dimensiones_ancho: undefined, dimensiones_profundidad: undefined,
    permite_marco: true, con_certificado: false, imagen_principal: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cR, tR, aR] = await Promise.all([
          obraService.getCategorias(), obraService.getTecnicas(), obraService.getArtistas(),
        ]);
        setCategorias(cR.categorias || []);
        setTecnicas(tR.tecnicas || []);
        setArtistas(aR.artistas || []);
      } catch (err) {
        showToast(handleNetworkError(err), "err");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === "number") setForm(p => ({ ...p, [name]: value === "" ? undefined : Number(value) }));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)   { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setForm(p => ({ ...p, imagen_principal: "" }));
  };

  const clearFile = () => {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(null); setImgPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handleFile(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.descripcion) { showToast("Completa título y descripción", "warn"); return; }
    if (!form.id_categoria)  { showToast("Selecciona una categoría", "warn"); return; }
    if (!form.id_artista)    { showToast("Selecciona un artista", "warn"); return; }
    if (!form.precio_base || form.precio_base <= 0) { showToast("El precio debe ser mayor a 0", "warn"); return; }
    if (!imgFile && !form.imagen_principal) { showToast("Agrega una imagen (archivo o URL)", "warn"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("titulo",       form.titulo);
      fd.append("descripcion",  form.descripcion);
      fd.append("id_categoria", String(form.id_categoria));
      fd.append("id_artista",   String(form.id_artista));
      fd.append("precio_base",  String(form.precio_base));
      fd.append("permite_marco",   String(form.permite_marco));
      fd.append("con_certificado", String(form.con_certificado));
      if (form.id_tecnica)              fd.append("id_tecnica",              String(form.id_tecnica));
      if (form.anio_creacion)           fd.append("anio_creacion",           String(form.anio_creacion));
      if (form.dimensiones_alto)        fd.append("dimensiones_alto",        String(form.dimensiones_alto));
      if (form.dimensiones_ancho)       fd.append("dimensiones_ancho",       String(form.dimensiones_ancho));
      if (form.dimensiones_profundidad) fd.append("dimensiones_profundidad", String(form.dimensiones_profundidad));

      if (imgFile) { setUploading(true); fd.append("imagen", imgFile); }
      else fd.append("imagen_principal", form.imagen_principal || "");

      const res = await fetch(`${API_URL}/api/obras`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
        body: fd,
      });
      setUploading(false);

      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al crear", "err"); return; }
      showToast("¡Obra creada y enviada a revisión!", "ok");
      setTimeout(() => navigate("/admin/obras"), 2000);
    } catch (err) {
      setUploading(false);
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });

  const artist     = artistas.find(a => a.id_artista === Number(form.id_artista));
  const cat        = categorias.find(c => c.id_categoria === Number(form.id_categoria));
  const previewSrc = imgPreview || form.imagen_principal || "";

  return (
    // Sin orbes position:fixed — patrón canónico
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream }}>
      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* TOPBAR — height:56, C.bgDeep sólido, sin backdropFilter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => navigate("/admin/obras")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.creamMut, fontSize: 11.5, fontWeight: 700, fontFamily: FB, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.orange}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
              <ArrowLeft size={13} strokeWidth={2} /> Admin
            </button>
            <ChevronRight size={12} color={C.creamMut} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FB }}>Obras</span>
            <ChevronRight size={12} color={C.creamMut} />
            <span style={{ fontSize: 13, color: C.creamSub, fontFamily: FB }}>Nueva</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/admin/obras")} disabled={loading}
              style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
              Cancelar
            </button>
            <button form="form-crear-obra" type="submit" disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 18px", borderRadius: 9, border: "none", background: loading ? `${C.orange}40` : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: FB, boxShadow: loading ? "none" : `0 4px 14px ${C.orange}30`, transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px ${C.orange}45`; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : `0 4px 14px ${C.orange}30`; }}>
              {loading
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</>
                : <><Save size={14} strokeWidth={2.5} /> Publicar Obra</>
              }
            </button>
          </div>
        </div>

        <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto" }}>

          {/* Encabezado */}
          <div style={{ marginBottom: 20, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Star size={9} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>Catálogo · Nueva pieza</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Agregar{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Nueva Obra
              </span>
            </h1>
          </div>

          <form id="form-crear-obra" onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>

              {/* ── IZQUIERDA ── */}
              <div>
                <Card accent={C.orange} icon={Type} title="Información básica" delay={0.05}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <Lbl req>Título de la obra</Lbl>
                      <input name="titulo" value={form.titulo} onChange={onChange} placeholder="Ej: Amanecer en la Huasteca" required disabled={loading} style={IS(focused === "titulo", loading)} {...fi("titulo")} />
                    </div>
                    <div>
                      <Lbl req><FileText size={10} /> Descripción</Lbl>
                      <textarea name="descripcion" value={form.descripcion} onChange={onChange} placeholder="Describe la obra, técnica, inspiración…" rows={4} required disabled={loading} style={{ ...IS(focused === "desc", loading), resize: "vertical" as const }} {...fi("desc")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <Lbl req><Tag size={10} /> Categoría</Lbl>
                        <select name="id_categoria" value={form.id_categoria} onChange={onChange} required disabled={loading} style={IS(focused === "cat", loading)} {...fi("cat")}>
                          <option value="0">Seleccionar…</option>
                          {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl><Layers size={10} /> Técnica</Lbl>
                        <select name="id_tecnica" value={form.id_tecnica || ""} onChange={onChange} disabled={loading} style={IS(focused === "tec", loading)} {...fi("tec")}>
                          <option value="">Sin técnica</option>
                          {tecnicas.map(t => <option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl req><Users size={10} /> Artista</Lbl>
                        <select name="id_artista" value={form.id_artista} onChange={onChange} required disabled={loading} style={IS(focused === "art", loading)} {...fi("art")}>
                          <option value="0">Seleccionar…</option>
                          {artistas.map(a => <option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico || a.nombre_completo}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl><Calendar size={10} /> Año de creación</Lbl>
                        <input type="number" name="anio_creacion" value={form.anio_creacion || ""} onChange={onChange} min="1900" max={new Date().getFullYear()} placeholder={String(new Date().getFullYear())} disabled={loading} style={IS(focused === "anio", loading)} {...fi("anio")} />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card accent={C.blue} icon={Ruler} title="Dimensiones (cm)" delay={0.08}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {([
                      { name: "dimensiones_alto",        label: "Alto",        ph: "50" },
                      { name: "dimensiones_ancho",       label: "Ancho",       ph: "70" },
                      { name: "dimensiones_profundidad", label: "Profundidad", ph: "5"  },
                    ] as const).map(({ name, label, ph }) => (
                      <div key={name}>
                        <Lbl>{label}</Lbl>
                        <input type="number" name={name} value={(form[name as keyof Obra] as number) || ""} onChange={onChange} placeholder={ph} step="0.01" min="0" disabled={loading} style={IS(focused === name, loading)} {...fi(name)} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, background: `${C.blue}08`, border: `1px solid ${C.blue}18`, display: "flex", alignItems: "center", gap: 7 }}>
                    <Ruler size={12} color={C.blue} strokeWidth={1.8} />
                    <span style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>Ingresa las medidas en centímetros. La profundidad es opcional.</span>
                  </div>
                </Card>

                <Card accent={C.purple} icon={Award} title="Opciones adicionales" delay={0.12}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Toggle label="Permite marco personalizado"         name="permite_marco"   checked={form.permite_marco}   onChange={onChange} disabled={loading} icon={Frame} accent={C.purple} />
                    <Toggle label="Incluye certificado de autenticidad" name="con_certificado" checked={form.con_certificado} onChange={onChange} disabled={loading} icon={Award}  accent={C.gold}   />
                  </div>
                </Card>
              </div>

              {/* ── DERECHA ── */}
              <div>
                {/* Preview card */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 14, position: "relative", animation: "fadeUp .5s ease .05s both" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink})`, zIndex: 1 }} />
                  <div style={{ height: 130, background: previewSrc ? "transparent" : `linear-gradient(135deg, ${C.orange}18, ${C.gold}10, ${C.pink}08)`, position: "relative", overflow: "hidden" }}>
                    {previewSrc && <img src={previewSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    {!previewSrc && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <ImageIcon size={26} strokeWidth={1} color={`${C.cream}14`} />
                        <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>Vista previa</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${C.card})` }} />
                  </div>
                  <div style={{ padding: "12px 16px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: form.titulo ? C.cream : C.creamMut, fontFamily: form.titulo ? FD : FB, marginBottom: 4 }}>
                      {form.titulo || "Título de la obra"}
                    </div>
                    {artist && (
                      <div style={{ fontSize: 12, color: C.creamSub, marginBottom: 10, fontFamily: FB, display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={8} color={C.gold} fill={C.gold} />
                        {artist.nombre_artistico || artist.nombre_completo}
                      </div>
                    )}
                    <div style={{ height: 1, background: C.border, marginBottom: 10 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      <div style={{ background: `${C.gold}0D`, border: `1px solid ${C.gold}20`, borderRadius: 9, padding: "7px 10px" }}>
                        <div style={{ fontSize: 9.5, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Precio</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: form.precio_base ? C.gold : C.creamMut, fontFamily: FD }}>
                          {form.precio_base ? `$${fmt(Number(form.precio_base))}` : "—"}
                        </div>
                      </div>
                      <div style={{ background: `${C.blue}0D`, border: `1px solid ${C.blue}20`, borderRadius: 9, padding: "7px 10px" }}>
                        <div style={{ fontSize: 9.5, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Categoría</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: cat ? C.blue : C.creamMut, fontFamily: FB }}>{cat?.nombre || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precio */}
                <Card accent={C.gold} icon={DollarSign} title="Precio" delay={0.08}>
                  <Lbl req>Precio base (MXN)</Lbl>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 900, color: C.gold, pointerEvents: "none", fontFamily: FD }}>$</span>
                    <input type="number" name="precio_base" value={form.precio_base || ""} onChange={onChange} placeholder="2500" step="0.01" min="0" required disabled={loading} style={{ ...IS(focused === "precio", loading), paddingLeft: 28 }} {...fi("precio")} />
                  </div>
                  {Number(form.precio_base) > 0 && (
                    <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, background: `${C.gold}0D`, border: `1px solid ${C.gold}22`, display: "flex", justifyContent: "space-between", fontSize: 13, color: C.gold, fontWeight: 800, fontFamily: FD }}>
                      <span>Total</span>
                      <span>${fmt(form.precio_base)} MXN</span>
                    </div>
                  )}
                </Card>

                {/* Imagen principal */}
                <Card accent={C.pink} icon={ImageIcon} title="Imagen principal" delay={0.12}>
                  <div style={{ display: "flex", marginBottom: 12, borderRadius: 9, overflow: "hidden", border: `1px solid ${C.border}`, background: C.input }}>
                    {(["upload", "url"] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setImgMode(tab)}
                        style={{ flex: 1, padding: "8px", border: "none", cursor: "pointer", fontFamily: FB, fontSize: 12, fontWeight: imgMode === tab ? 800 : 500, background: imgMode === tab ? `${C.pink}18` : "transparent", color: imgMode === tab ? C.cream : C.creamMut, borderRight: tab === "upload" ? `1px solid ${C.border}` : "none", transition: "all .15s" }}>
                        {tab === "upload"
                          ? <><UploadCloud size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Subir</>
                          : <><LinkIcon   size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />URL</>
                        }
                      </button>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                  {imgMode === "upload" ? (
                    imgFile ? (
                      <div style={{ borderRadius: 10, overflow: "hidden", position: "relative", border: `1.5px solid ${C.pink}45` }}>
                        <img src={imgPreview} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "7px 10px", background: "linear-gradient(transparent,rgba(10,7,20,0.90))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <FileImage size={11} color={C.pink} />
                            <span style={{ fontSize: 11, color: C.creamSub, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{imgFile.name}</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB }}>{(imgFile.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <button type="button" onClick={clearFile} style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: "50%", background: "rgba(10,7,20,0.80)", border: `1px solid ${C.pink}45`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <X size={11} color={C.pink} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        style={{ borderRadius: 10, border: `2px dashed ${dragOver ? C.pink : C.inputBorder}`, height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", background: dragOver ? `${C.pink}07` : C.input, transition: "all .2s" }}>
                        <UploadCloud size={20} color={dragOver ? C.pink : C.creamMut} strokeWidth={1.5} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: dragOver ? C.pink : C.creamSub, fontFamily: FB }}>{dragOver ? "Suelta aquí" : "Arrastra o haz clic"}</div>
                          <div style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB }}>JPG, PNG, WEBP · Máx 10 MB</div>
                        </div>
                      </div>
                    )
                  ) : (
                    <>
                      <Lbl><LinkIcon size={10} /> URL de imagen</Lbl>
                      <input type="url" name="imagen_principal" value={form.imagen_principal || ""} onChange={e => { onChange(e); clearFile(); }} placeholder="https://res.cloudinary.com/…" disabled={loading} style={IS(focused === "img", loading)} {...fi("img")} />
                      <div style={{ fontSize: 11, color: C.creamMut, marginTop: 6, fontFamily: FB }}>Cloudinary, Imgur u otro servicio público.</div>
                      {form.imagen_principal && (
                        <div style={{ marginTop: 10, borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.pink}35`, height: 110 }}>
                          <img src={form.imagen_principal} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                        </div>
                      )}
                    </>
                  )}

                  {uploading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "9px 12px", borderRadius: 9, background: `${C.orange}10`, border: `1px solid ${C.orange}28` }}>
                      <Loader2 size={13} color={C.orange} style={{ animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 12, color: C.orange, fontFamily: FB, fontWeight: 600 }}>Subiendo imagen…</span>
                    </div>
                  )}
                </Card>

                {/* Resumen — headers creamSub 11px */}
                <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px", position: "relative", overflow: "hidden", animation: "fadeUp .5s ease .16s both" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink})` }} />
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14, fontFamily: FB }}>Resumen</div>
                  {[
                    { label: "Título",    val: form.titulo || "—",                                           color: undefined },
                    { label: "Artista",   val: artist?.nombre_artistico || artist?.nombre_completo || "—",   color: C.pink    },
                    { label: "Categoría", val: cat?.nombre || "—",                                           color: C.blue    },
                    { label: "Precio",    val: form.precio_base ? `$${fmt(Number(form.precio_base))}` : "—", color: C.gold    },
                    { label: "Año",       val: form.anio_creacion ? String(form.anio_creacion) : "—",        color: undefined },
                  ].map(({ label, val, color }, i, arr) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: i < arr.length - 1 ? `1px solid rgba(255,232,200,0.05)` : "none", paddingBottom: 9, marginBottom: 9 }}>
                      <span style={{ fontSize: 11, color: C.creamSub, fontFamily: FB }}>{label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: color || C.cream, maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: label === "Precio" ? FD : FB }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,232,200,0.18); font-family: ${FB}; }
        select option { background: #100D1C; color: ${C.cream}; }
        textarea { transition: border-color .15s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.10); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.18); }
      `}</style>
    </div>
  );
}