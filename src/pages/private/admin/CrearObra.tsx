// src/pages/private/admin/CrearObra.tsx
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon, AlertCircle,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  LayoutDashboard, ShoppingBag, BarChart2, Settings,
  LogOut, Layers, Star, Sparkles, Eye,
  UploadCloud, X, FileImage
} from "lucide-react";
import { useRef } from "react";
import { obraService } from "../../../services/obraService";
import type { Obra } from "../../../services/obraService";
import { authService } from "../../../services/authService";

// ─────────────────────────────────────────────────────────────
// PALETA OFICIAL NU-B STUDIO
// ─────────────────────────────────────────────────────────────
const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(20,15,34,0.90)",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.20)",
  input:       "rgba(255,232,200,0.04)",
  inputBorder: "rgba(255,200,150,0.14)",
  inputFocus:  "rgba(255,132,14,0.08)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:LayoutDashboard, color:C.orange,  path:"/admin"          },
  { id:"obras",     label:"Obras",      icon:Layers,          color:C.blue,    path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",   icon:Users,           color:C.pink,    path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",     icon:ShoppingBag,     color:C.gold,    path:"/admin"          },
  { id:"reportes",  label:"Reportes",   icon:BarChart2,       color:C.purple,  path:"/admin"          },
];

interface Categoria { id_categoria: number; nombre: string; }
interface Tecnica    { id_tecnica:   number; nombre: string; }
interface Artista    { id_artista:   number; nombre_completo: string; nombre_artistico?: string; }

// ─── Logo ─────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoNO" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoNO)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoNO)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoNO)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ navigate }: { navigate: any }) {
  const active   = "obras";
  const userName = authService.getUserName?.() || "Admin";
  return (
    <div style={{ width: 240, minHeight: "100vh", background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bgDeep} 100%)`, borderRight: `1px solid ${C.borderBr}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0, zIndex: 40 }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />
      <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 20 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, fontFamily: FD }}>Nu-B Studio</div>
            <div style={{ fontSize: 10, color: C.orange, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FB, fontWeight: 700 }}>Panel Admin</div>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, rgba(118,78,49,0.20), rgba(255,132,14,0.08))`, border: `1px solid ${C.borderBr}`, borderRadius: 14, padding: "13px 14px", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white", fontFamily: FB }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userName}</div>
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>Administrador</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 7px ${C.green}` }} />
        </div>
      </div>
      <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.creamMut, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 10px 12px", fontFamily: FB }}>Navegación</div>
        {NAV.map(({ id, label, icon: Icon, color, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => navigate(path)} style={{ width: "100%", border: on ? `1px solid ${color}30` : "1px solid transparent", cursor: "pointer", background: on ? `linear-gradient(135deg, ${color}18, ${color}08)` : "transparent", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, transition: "all .18s", position: "relative", fontFamily: FB }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; } }}
            >
              {on && <div style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 3, borderRadius: "0 3px 3px 0", background: `linear-gradient(180deg, ${color}, ${color}70)`, boxShadow: `0 0 10px ${color}60` }} />}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: on ? `${color}22` : "rgba(255,232,200,0.06)", border: on ? `1px solid ${color}30` : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} color={on ? color : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: on ? 700 : 500, color: on ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
              {on && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 9px ${color}` }} />}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "14px 12px 20px", borderTop: `1px solid ${C.borderBr}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,232,200,0.03)", cursor: "pointer", fontSize: 12.5, color: C.creamSub, fontWeight: 600, fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
          ><Settings size={14} strokeWidth={1.8} /> Config</button>
          <button onClick={() => { authService.logout(); navigate("/login"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: `1px solid ${C.pink}30`, background: `${C.pink}08`, cursor: "pointer", fontSize: 12.5, color: C.pink, fontWeight: 600, fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.pink}18`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.pink}08`}
          ><LogOut size={14} strokeWidth={1.8} /> Salir</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function inputStyle(focused: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: focused ? C.inputFocus : C.input,
    border: `1.5px solid ${focused ? C.orange : C.inputBorder}`,
    borderRadius: 10, fontSize: 13.5, color: C.cream, outline: "none",
    transition: "border-color .15s, background .15s",
    fontFamily: FB, opacity: disabled ? 0.5 : 1,
  };
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, marginBottom: 7, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>
      {children}{req && <span style={{ color: C.orange }}>*</span>}
    </div>
  );
}

function Card({ accent, icon: Icon, title, children, delay = 0 }: any) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 14, backdropFilter: "blur(20px)", position: "relative", animation: `fadeUp .5s ease ${delay}s both` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}50, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}20`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${accent}25` }}>
          <Icon size={14} color={accent} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.cream, fontFamily: FD }}>{title}</span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${accent}20, transparent)` }} />
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function Toggle({ label, name, checked, onChange, disabled, icon: Icon, accent }: any) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer", border: `1.5px solid ${checked ? `${accent}55` : C.border}`, background: checked ? `${accent}12` : "rgba(255,232,200,0.02)", transition: "all .15s", userSelect: "none" as const }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${checked ? accent : C.creamMut}`, background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", boxShadow: checked ? `0 0 8px ${accent}40` : "none" }}>
        {checked && <CheckCircle2 size={11} color="white" strokeWidth={3} />}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display: "none" }} />
      <Icon size={14} color={checked ? accent : C.creamMut} strokeWidth={2} />
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
    </label>
  );
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── MAIN ─────────────────────────────────────────────────────
export default function CrearObra() {
  const navigate  = useNavigate();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [mensaje,    setMensaje]    = useState("");
  const [isError,    setIsError]    = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");   // ObjectURL local
  const [imgMode,    setImgMode]    = useState<"upload" | "url">("upload"); // tab activo
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
          obraService.getCategorias(), obraService.getTecnicas(), obraService.getArtistas()
        ]);
        setCategorias(cR.categorias || []);
        setTecnicas(tR.tecnicas || []);
        setArtistas(aR.artistas || []);
      } catch { flash("Error al cargar datos", true); }
    })();
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === "number") setForm(p => ({ ...p, [name]: value === "" ? undefined : Number(value) }));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const flash = (msg: string, err: boolean) => {
    setMensaje(msg); setIsError(err);
    setTimeout(() => setMensaje(""), 5000);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return flash("Solo se permiten imágenes", true);
    if (file.size > 10 * 1024 * 1024) return flash("La imagen no puede superar 10 MB", true);
    setImgFile(file);
    const url = URL.createObjectURL(file);
    setImgPreview(url);
    setForm(p => ({ ...p, imagen_principal: "" })); // limpia URL manual
  };

  const clearFile = () => {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(null);
    setImgPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.descripcion) return flash("Completa título y descripción", true);
    if (!form.id_categoria)  return flash("Selecciona una categoría", true);
    if (!form.id_artista)    return flash("Selecciona un artista", true);
    if (!form.precio_base || form.precio_base <= 0) return flash("El precio debe ser mayor a 0", true);
    if (!imgFile && !form.imagen_principal) return flash("Agrega una imagen (archivo o URL)", true);

    setLoading(true);
    try {
      const fd = new FormData();
      // Campos del formulario
      fd.append("titulo",        form.titulo);
      fd.append("descripcion",   form.descripcion);
      fd.append("id_categoria",  String(form.id_categoria));
      fd.append("id_artista",    String(form.id_artista));
      fd.append("precio_base",   String(form.precio_base));
      fd.append("permite_marco",    String(form.permite_marco));
      fd.append("con_certificado",  String(form.con_certificado));
      if (form.id_tecnica)             fd.append("id_tecnica",             String(form.id_tecnica));
      if (form.anio_creacion)          fd.append("anio_creacion",          String(form.anio_creacion));
      if (form.dimensiones_alto)       fd.append("dimensiones_alto",       String(form.dimensiones_alto));
      if (form.dimensiones_ancho)      fd.append("dimensiones_ancho",      String(form.dimensiones_ancho));
      if (form.dimensiones_profundidad)fd.append("dimensiones_profundidad",String(form.dimensiones_profundidad));

      if (imgFile) {
        // Subida de archivo → multer lo procesa en el backend
        setUploading(true);
        fd.append("imagen", imgFile);
      } else {
        // Solo URL → el backend la guarda directamente
        fd.append("imagen_principal", form.imagen_principal || "");
      }

      const res  = await fetch(`${API_URL}/api/obras`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
        // NO pongas Content-Type — el browser lo setea automáticamente con el boundary
        body: fd,
      });
      setUploading(false);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Error al crear");
      flash("¡Obra creada y enviada a revisión!", false);
      setTimeout(() => navigate("/admin/obras"), 2000);
    } catch (err: any) {
      setUploading(false);
      flash(err.message || "Error al crear la obra", true);
    } finally { setLoading(false); }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });

  const artist  = artistas.find(a => a.id_artista === Number(form.id_artista));
  const cat     = categorias.find(c => c.id_categoria === Number(form.id_categoria));
  // La imagen a mostrar en preview: local tiene prioridad
  const previewSrc = imgPreview || form.imagen_principal || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream, position: "relative" }}>

      {/* Orbs */}
      <div style={{ position: "fixed", top: -160, right: -120, width: 620, height: 620, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -120, left: 180, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "38%", right: "26%", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${C.blue}05, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* TOPBAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64, background: "rgba(10,7,20,0.90)", borderBottom: `1px solid ${C.borderBr}`, backdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => navigate("/admin/obras")} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: C.creamMut, fontSize: 13, fontWeight: 600, fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}50`; (e.currentTarget as HTMLElement).style.color = C.orange; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
            ><ArrowLeft size={14} strokeWidth={2} /> Obras</button>

            <div style={{ width: 1, height: 22, background: C.borderBr }} />

            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.cream, fontFamily: FD, lineHeight: 1 }}>Nueva Obra</div>
              <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 3, fontFamily: FB }}>Agrega una pieza al catálogo</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/admin/obras")} disabled={loading} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
            >Cancelar</button>

            <button form="form-crear-obra" type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: loading ? `${C.orange}40` : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontSize: 13.5, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: FB, boxShadow: loading ? "none" : `0 6px 24px ${C.orange}45`, transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px ${C.orange}60`; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : `0 6px 24px ${C.orange}45`; }}
            >
              {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</> : <><Save size={15} strokeWidth={2.5} /> Publicar Obra</>}
            </button>
          </div>
        </div>

        {/* MAIN */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 28, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <Star size={12} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.14em", fontFamily: FB }}>Catálogo · Nueva pieza</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Agregar{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Nueva Obra
              </span>
            </h1>
          </div>

          {/* Alert */}
          {mensaje && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 13, marginBottom: 22, background: isError ? `${C.pink}12` : `${C.green}10`, border: `1px solid ${isError ? `${C.pink}40` : `${C.green}35`}`, color: isError ? C.pink : C.green, fontSize: 13.5, fontWeight: 600, fontFamily: FB, animation: "fadeUp .25s ease" }}>
              {isError ? <AlertCircle size={17} strokeWidth={2.5} /> : <CheckCircle2 size={17} strokeWidth={2.5} />}
              {mensaje}
            </div>
          )}

          <form id="form-crear-obra" onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>

              {/* ── IZQUIERDA ── */}
              <div>

                {/* Información básica */}
                <Card accent={C.orange} icon={Type} title="Información básica" delay={0.05}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <Label req>Título de la obra</Label>
                      <input name="titulo" value={form.titulo} onChange={onChange} placeholder="Ej: Amanecer en la Huasteca" required disabled={loading} style={inputStyle(focused === "titulo", loading)} {...fi("titulo")} />
                    </div>
                    <div>
                      <Label req><FileText size={10} /> Descripción</Label>
                      <textarea name="descripcion" value={form.descripcion} onChange={onChange} placeholder="Describe la obra, su técnica, inspiración, historia…" rows={4} required disabled={loading} style={{ ...inputStyle(focused === "desc", loading), resize: "vertical" as const }} {...fi("desc")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <Label req><Tag size={10} /> Categoría</Label>
                        <select name="id_categoria" value={form.id_categoria} onChange={onChange} required disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")}>
                          <option value="0">Seleccionar…</option>
                          {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label><Layers size={10} /> Técnica</Label>
                        <select name="id_tecnica" value={form.id_tecnica || ""} onChange={onChange} disabled={loading} style={inputStyle(focused === "tec", loading)} {...fi("tec")}>
                          <option value="">Sin técnica</option>
                          {tecnicas.map(t => <option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label req><Users size={10} /> Artista</Label>
                        <select name="id_artista" value={form.id_artista} onChange={onChange} required disabled={loading} style={inputStyle(focused === "art", loading)} {...fi("art")}>
                          <option value="0">Seleccionar…</option>
                          {artistas.map(a => <option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico || a.nombre_completo}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label><Calendar size={10} /> Año de creación</Label>
                        <input type="number" name="anio_creacion" value={form.anio_creacion || ""} onChange={onChange} min="1900" max={new Date().getFullYear()} placeholder={String(new Date().getFullYear())} disabled={loading} style={inputStyle(focused === "anio", loading)} {...fi("anio")} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dimensiones */}
                <Card accent={C.blue} icon={Ruler} title="Dimensiones (cm)" delay={0.1}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {[
                      { name: "dimensiones_alto",        label: "Alto",        ph: "50" },
                      { name: "dimensiones_ancho",       label: "Ancho",       ph: "70" },
                      { name: "dimensiones_profundidad", label: "Profundidad", ph: "5"  },
                    ].map(({ name, label, ph }) => (
                      <div key={name}>
                        <Label>{label}</Label>
                        <input type="number" name={name} value={(form as any)[name] || ""} onChange={onChange} placeholder={ph} step="0.01" min="0" disabled={loading} style={inputStyle(focused === name, loading)} {...fi(name)} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: `${C.blue}08`, border: `1px solid ${C.blue}18`, display: "flex", alignItems: "center", gap: 8 }}>
                    <Ruler size={13} color={C.blue} strokeWidth={1.8} />
                    <span style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>Ingresa las medidas en centímetros. La profundidad es opcional.</span>
                  </div>
                </Card>

                {/* Opciones */}
                <Card accent={C.purple} icon={Award} title="Opciones adicionales" delay={0.15}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Toggle label="Permite marco personalizado" name="permite_marco" checked={form.permite_marco} onChange={onChange} disabled={loading} icon={Frame} accent={C.purple} />
                    <Toggle label="Incluye certificado de autenticidad" name="con_certificado" checked={form.con_certificado} onChange={onChange} disabled={loading} icon={Award} accent={C.gold} />
                  </div>
                </Card>

              </div>

              {/* ── DERECHA ── */}
              <div>

                {/* PREVIEW CARD — protagonista */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", marginBottom: 14, backdropFilter: "blur(20px)", position: "relative", animation: "fadeUp .5s ease .05s both" }}>

                  {/* Imagen preview como banner */}
                  <div style={{ height: 160, background: previewSrc ? "transparent" : `linear-gradient(135deg, ${C.orange}20, ${C.gold}15, ${C.pink}10)`, position: "relative", overflow: "hidden" }}>
                    {previewSrc && (
                      <img src={previewSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    {!previewSrc && (
                      <>
                        <div style={{ position: "absolute", inset: 0, background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <ImageIcon size={32} strokeWidth={1} color={`${C.cream}20`} />
                          <span style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>Vista previa de imagen</span>
                        </div>
                      </>
                    )}
                    {/* Overlay bottom fade */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(transparent, ${C.card})` }} />
                    {/* Top accent */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink})` }} />
                    {/* Badge */}
                    <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(10,7,20,0.75)", border: `1px solid ${C.borderHi}`, backdropFilter: "blur(12px)" }}>
                      <Sparkles size={10} color={C.gold} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.1em" }}>Nueva</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px 20px 20px" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: form.titulo ? C.cream : C.creamMut, fontFamily: form.titulo ? FD : FB, marginBottom: 6, lineHeight: 1.2 }}>
                      {form.titulo || "Título de la obra"}
                    </div>

                    {artist && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg, ${C.pink}60, ${C.purple}60)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "white", fontFamily: FD }}>
                          {(artist.nombre_artistico || artist.nombre_completo)[0]}
                        </div>
                        <span style={{ fontSize: 12.5, color: C.creamSub, fontFamily: FB }}>
                          {artist.nombre_artistico || artist.nombre_completo}
                        </span>
                      </div>
                    )}

                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, marginBottom: 14 }} />

                    {/* Stats row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}22`, borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Precio</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: form.precio_base ? C.gold : C.creamMut, fontFamily: FD }}>
                          {form.precio_base ? `$${Number(form.precio_base).toLocaleString("es-MX")}` : "—"}
                        </div>
                      </div>
                      <div style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}20`, borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Categoría</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: cat ? C.blue : C.creamMut, fontFamily: FB }}>
                          {cat?.nombre || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRECIO */}
                <Card accent={C.gold} icon={DollarSign} title="Precio" delay={0.1}>
                  <Label req>Precio base (MXN)</Label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 900, color: C.gold, pointerEvents: "none", fontFamily: FD }}>$</span>
                    <input type="number" name="precio_base" value={form.precio_base || ""} onChange={onChange} placeholder="2,500" step="0.01" min="0" required disabled={loading} style={{ ...inputStyle(focused === "precio", loading), paddingLeft: 30 }} {...fi("precio")} />
                  </div>
                  {Number(form.precio_base) > 0 && (
                    <div style={{ marginTop: 10, padding: "11px 14px", borderRadius: 11, background: `${C.gold}12`, border: `1px solid ${C.gold}28`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB }}>Total estimado</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: C.gold, fontFamily: FD }}>${Number(form.precio_base).toLocaleString("es-MX")} MXN</span>
                    </div>
                  )}
                </Card>

                {/* IMAGEN PRINCIPAL — Uploader dual */}
                <Card accent={C.pink} icon={ImageIcon} title="Imagen principal" delay={0.15}>

                  {/* Tabs: Archivo / URL */}
                  <div style={{ display: "flex", marginBottom: 14, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.input }}>
                    {(["upload", "url"] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setImgMode(tab)} style={{ flex: 1, padding: "9px", border: "none", cursor: "pointer", fontFamily: FB, fontSize: 12.5, fontWeight: imgMode === tab ? 800 : 500, background: imgMode === tab ? `linear-gradient(135deg, ${C.pink}25, ${C.purple}15)` : "transparent", color: imgMode === tab ? C.cream : C.creamMut, borderRight: tab === "upload" ? `1px solid ${C.border}` : "none", transition: "all .15s" }}>
                        {tab === "upload" ? <><UploadCloud size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />Subir archivo</> : <><LinkIcon size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />URL externa</>}
                      </button>
                    ))}
                  </div>

                  {imgMode === "upload" ? (
                    <>
                      {/* Input oculto */}
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                      {imgFile ? (
                        /* Archivo seleccionado */
                        <div style={{ borderRadius: 12, overflow: "hidden", position: "relative", border: `1.5px solid ${C.pink}50` }}>
                          <img src={imgPreview} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                          {/* Overlay con nombre */}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", background: "linear-gradient(transparent, rgba(10,7,20,0.92))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <FileImage size={13} color={C.pink} />
                              <span style={{ fontSize: 12, color: C.creamSub, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{imgFile.name}</span>
                            </div>
                            <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>{(imgFile.size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                          {/* Botón quitar */}
                          <button type="button" onClick={clearFile} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(10,7,20,0.80)", border: `1px solid ${C.pink}50`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.pink}40`}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(10,7,20,0.80)"}
                          ><X size={13} color={C.pink} /></button>
                        </div>
                      ) : (
                        /* Drop zone */
                        <div
                          onClick={() => fileRef.current?.click()}
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={onDrop}
                          style={{ borderRadius: 14, border: `2px dashed ${dragOver ? C.pink : C.inputBorder}`, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", background: dragOver ? `${C.pink}08` : C.input, transition: "all .2s" }}
                        >
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: dragOver ? `${C.pink}20` : "rgba(255,232,200,0.06)", border: `1px solid ${dragOver ? `${C.pink}40` : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                            <UploadCloud size={22} color={dragOver ? C.pink : C.creamMut} strokeWidth={1.5} />
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: dragOver ? C.pink : C.creamSub, fontFamily: FB }}>
                              {dragOver ? "Suelta aquí" : "Arrastra o haz clic para subir"}
                            </div>
                            <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 3, fontFamily: FB }}>JPG, PNG, WEBP · Máx 10 MB</div>
                          </div>
                        </div>
                      )}

                      {/* Indicador subiendo */}
                      {uploading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "9px 13px", borderRadius: 10, background: `${C.orange}10`, border: `1px solid ${C.orange}30` }}>
                          <Loader2 size={14} color={C.orange} style={{ animation: "spin 1s linear infinite" }} />
                          <span style={{ fontSize: 12.5, color: C.orange, fontFamily: FB, fontWeight: 600 }}>Subiendo imagen a Cloudinary…</span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Tab URL */
                    <>
                      <Label><LinkIcon size={10} /> URL de imagen externa</Label>
                      <input type="url" name="imagen_principal" value={form.imagen_principal || ""} onChange={e => { onChange(e); setImgFile(null); setImgPreview(""); }} placeholder="https://res.cloudinary.com/…/imagen.jpg" disabled={loading} style={inputStyle(focused === "img", loading)} {...fi("img")} />
                      <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 6, fontFamily: FB }}>Cloudinary, Imgur, o cualquier URL pública de imagen.</div>
                      {form.imagen_principal && (
                        <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: `1.5px solid ${C.pink}40`, height: 120 }}>
                          <img src={form.imagen_principal} alt="preview url" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                        </div>
                      )}
                    </>
                  )}
                </Card>

                {/* Resumen compacto */}
                <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: "18px 20px", backdropFilter: "blur(20px)", position: "relative", overflow: "hidden", animation: "fadeUp .5s ease .2s both" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink})` }} />
                  <div style={{ position: "absolute", bottom: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: "none" }} />

                  <div style={{ fontSize: 11, fontWeight: 800, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 16, fontFamily: FB, display: "flex", alignItems: "center", gap: 7 }}>
                    <Eye size={12} color={C.creamMut} /> Resumen
                  </div>

                  {[
                    { label: "Título",    val: form.titulo || "—",                                              color: undefined },
                    { label: "Artista",   val: artist?.nombre_artistico || artist?.nombre_completo || "—",     color: C.pink    },
                    { label: "Categoría", val: cat?.nombre || "—",                                              color: C.blue    },
                    { label: "Precio",    val: form.precio_base ? `$${Number(form.precio_base).toLocaleString("es-MX")}` : "—", color: C.gold },
                    { label: "Año",       val: form.anio_creacion ? String(form.anio_creacion) : "—",          color: undefined },
                  ].map(({ label, val, color }, i, arr) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, borderBottom: i < arr.length - 1 ? `1px solid rgba(255,232,200,0.05)` : "none", paddingBottom: 10, marginBottom: 10 }}>
                      <span style={{ color: C.creamMut, fontFamily: FB }}>{label}</span>
                      <span style={{ fontWeight: 700, color: color || C.cream, maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: label === "Precio" ? FD : FB }}>
                        {val}
                      </span>
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
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,232,200,0.18); font-family: ${FB}; }
        select option { background: #100D1C; color: ${C.cream}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}