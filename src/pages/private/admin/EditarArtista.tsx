// src/pages/private/admin/EditarArtista.tsx
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  Loader2, Tag,
  DollarSign, Award, Link as LinkIcon, Type,
  FileText, Phone, Mail, Hash,
  Star, Palette, Percent,
  UploadCloud, X, FileImage, ChevronRight,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

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
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ESTADOS = [
  { val: "activo",     label: "Activo",     color: C.green   },
  { val: "pendiente",  label: "Pendiente",  color: C.gold    },
  { val: "inactivo",   label: "Inactivo",   color: C.creamMut},
  { val: "suspendido", label: "Suspendido", color: C.pink    },
];

interface Categoria { id_categoria: number; nombre: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EditarArtista() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading,     setLoading]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [focused,     setFocused]     = useState<string | null>(null);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotoFile,    setFotoFile]    = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [fotoMode,    setFotoMode]    = useState<"upload" | "url">("upload");
  const [dragOver,    setDragOver]    = useState(false);

  const [form, setForm] = useState({
    nombre_completo: "", nombre_artistico: "", biografia: "",
    foto_perfil: "", correo: "", telefono: "", matricula: "",
    id_categoria_principal: "", porcentaje_comision: 15, estado: "pendiente",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cR, res] = await Promise.all([
          obraService.getCategorias(),
          fetch(`${API_URL}/api/artistas/${id}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } }),
        ]);
        setCategorias(cR.categorias || []);

        if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
        const json = await res.json();
        if (json.success && json.data) {
          const a = json.data;
          setForm({
            nombre_completo:        a.nombre_completo        || "",
            nombre_artistico:       a.nombre_artistico       || "",
            biografia:              a.biografia              || "",
            foto_perfil:            a.foto_perfil            || "",
            correo:                 a.correo                 || "",
            telefono:               a.telefono               || "",
            matricula:              a.matricula              || "",
            id_categoria_principal: a.id_categoria_principal || "",
            porcentaje_comision:    a.porcentaje_comision    || 15,
            estado:                 a.estado                 || "pendiente",
          });
        } else {
          showToast("No se encontró el artista", "warn");
        }
      } catch (err) {
        showToast(handleNetworkError(err), "err");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, showToast]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") setForm(p => ({ ...p, [name]: value === "" ? 0 : Number(value) }));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const handleFoto = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024)   { showToast("La foto no puede superar 10 MB", "warn"); return; }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setForm(p => ({ ...p, foto_perfil: "" }));
  };

  const clearFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null);
    setFotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFoto(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre_completo) { showToast("El nombre completo es obligatorio", "warn"); return; }
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { matricula: _mat, ...formSinMatricula } = form;
      let res: Response;

      if (fotoFile) {
        const fd = new FormData();
        Object.entries(formSinMatricula).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("foto", fotoFile);
        res = await fetch(`${API_URL}/api/artistas/${id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${authService.getToken()}` },
          body: fd,
        });
      } else {
        res = await fetch(`${API_URL}/api/artistas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
          body: JSON.stringify(formSinMatricula),
        });
      }

      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al actualizar", "err"); return; }

      showToast("¡Artista actualizado correctamente!", "ok");
      setTimeout(() => navigate("/admin/artistas"), 1500);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });

  const initials = form.nombre_completo.split(" ").slice(0, 2).map((n: string) => n[0] || "").join("").toUpperCase() || "?";
  const cat      = categorias.find(c => String(c.id_categoria) === String(form.id_categoria_principal));
  const est      = ESTADOS.find(e => e.val === form.estado);
  const comision = 10000 * Number(form.porcentaje_comision) / 100;
  const fotoSrc  = fotoPreview || form.foto_perfil || "";

  const avatarGrad = form.estado === "activo"
    ? `linear-gradient(135deg, ${C.green}40, ${C.blue}30)`
    : form.estado === "pendiente"
    ? `linear-gradient(135deg, ${C.gold}40, ${C.orange}30)`
    : `linear-gradient(135deg, ${C.pink}40, ${C.purple}30)`;

  // ✅ Loading state — sin full-page wrapper, AdminLayout ya provee el fondo
  if (loadingData) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: FB }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
      <span style={{ fontSize: 14, color: C.creamSub }}>Cargando artista…</span>
    </div>
  );

  // ✅ Sin wrapper externo, sin <Sidebar />, sin <style> — AdminLayout lo maneja
  return (
    <>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/admin/artistas")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.creamMut, fontSize: 11.5, fontWeight: 700, fontFamily: FB, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.orange}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <ArrowLeft size={13} strokeWidth={2} /> Admin
          </button>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Artistas</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 13, color: C.creamSub }}>Editar</span>
          {est && (
            <span style={{ padding: "2px 10px", borderRadius: 100, background: `${est.color}14`, border: `1px solid ${est.color}35`, color: est.color, fontSize: 11, fontWeight: 700, fontFamily: FB }}>
              {est.label}
            </span>
          )}
          <span style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>
            ID <span style={{ color: C.orange, fontWeight: 700 }}>#{id}</span>
            {form.matricula && <span style={{ marginLeft: 6, color: C.purple, fontWeight: 700 }}>· {form.matricula}</span>}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/admin/artistas")}
            style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
            Cancelar
          </button>
          <button form="form-artista" type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 18px", borderRadius: 9, border: "none", background: loading ? `${C.orange}40` : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: FB, boxShadow: loading ? "none" : `0 4px 14px ${C.orange}30`, transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px ${C.orange}45`; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : `0 4px 14px ${C.orange}30`; }}>
            {loading
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</>
              : <><Save size={14} strokeWidth={2.5} /> Guardar Cambios</>
            }
          </button>
        </div>
      </div>

      <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto" }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 20, animation: "fadeUp .4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Star size={9} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>Comunidad · Edición</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
            Editar{" "}
            <span style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {form.nombre_completo || "Artista"}
            </span>
          </h1>
        </div>

        <form id="form-artista" onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>

            {/* ── IZQUIERDA ── */}
            <div>
              <Card accent={C.pink} icon={Type} title="Información personal" delay={0.05}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label req>Nombre completo</Label>
                      <input name="nombre_completo" value={form.nombre_completo} onChange={onChange} required disabled={loading} style={inputStyle(focused === "nc", loading)} {...fi("nc")} />
                    </div>
                    <div>
                      <Label>Nombre artístico</Label>
                      <input name="nombre_artistico" value={form.nombre_artistico} onChange={onChange} disabled={loading} style={inputStyle(focused === "na", loading)} placeholder="Alias o seudónimo" {...fi("na")} />
                    </div>
                  </div>
                  <div>
                    <Label><FileText size={10} /> Biografía</Label>
                    <textarea name="biografia" value={form.biografia} onChange={onChange} rows={4} disabled={loading} placeholder="Describe al artista, su estilo, técnica, trayectoria…" style={{ ...inputStyle(focused === "bio", loading), resize: "vertical" as const }} {...fi("bio")} />
                  </div>
                </div>
              </Card>

              <Card accent={C.blue} icon={Phone} title="Contacto" delay={0.08}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Label><Mail size={10} /> Correo electrónico</Label>
                    <input type="email" name="correo" value={form.correo} onChange={onChange} disabled={loading} placeholder="artista@correo.com" style={inputStyle(focused === "correo", loading)} {...fi("correo")} />
                  </div>
                  <div>
                    <Label><Phone size={10} /> Teléfono</Label>
                    <input name="telefono" value={form.telefono} onChange={onChange} disabled={loading} placeholder="+52 444 000 0000" style={inputStyle(focused === "tel", loading)} {...fi("tel")} />
                  </div>
                </div>
              </Card>

              <Card accent={C.purple} icon={Tag} title="Categoría y matrícula" delay={0.12}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Label><Palette size={10} /> Disciplina principal</Label>
                    <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={onChange} disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label><Hash size={10} /> Matrícula</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: `${C.purple}0D`, border: `1.5px solid ${C.purple}28`, minHeight: 44 }}>
                      <Hash size={13} color={C.purple} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.purple, fontFamily: FB, letterSpacing: 1 }}>
                          {form.matricula || "Sin asignar"}
                        </div>
                        <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB, marginTop: 1 }}>No editable</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card accent={C.orange} icon={Award} title="Estado de la cuenta" delay={0.16}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {ESTADOS.map(({ val, label, color }) => {
                    const on = form.estado === val;
                    return (
                      <button key={val} type="button" onClick={() => setForm(p => ({ ...p, estado: val }))}
                        style={{ padding: "12px 8px", borderRadius: 10, border: `1.5px solid ${on ? `${color}55` : C.border}`, background: on ? `${color}14` : "rgba(255,232,200,0.02)", color: on ? color : C.creamSub, fontWeight: on ? 800 : 400, fontSize: 12, cursor: "pointer", fontFamily: FB, transition: "all .15s", position: "relative" }}
                        onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; }}
                        onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                        {on && <div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── DERECHA ── */}
            <div>
              {/* Preview card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 14, position: "relative", animation: "fadeUp .5s ease .05s both" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.blue})`, zIndex: 1 }} />
                <div style={{ height: 72, background: `linear-gradient(135deg, ${C.pink}28, ${C.purple}18, ${C.blue}12)` }} />
                <div style={{ padding: "0 18px 18px", marginTop: -28, position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: fotoSrc ? "transparent" : avatarGrad, border: `3px solid ${C.bg}`, outline: `2px solid ${est?.color || C.pink}45`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {fotoSrc
                        ? <img src={fotoSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <span style={{ fontSize: 20, fontWeight: 900, color: C.cream, fontFamily: FD }}>{initials}</span>
                      }
                    </div>
                    {est && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, background: `${est.color}14`, border: `1px solid ${est.color}38`, color: est.color, fontSize: 11, fontWeight: 700, fontFamily: FB }}>
                        {est.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: form.nombre_completo ? C.cream : C.creamMut, fontFamily: form.nombre_completo ? FD : FB, marginBottom: 2 }}>
                    {form.nombre_completo || "Nombre completo"}
                  </div>
                  {form.nombre_artistico && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <Star size={8} color={C.gold} fill={C.gold} />
                      <span style={{ fontSize: 12, color: C.gold, fontFamily: FB, fontWeight: 600 }}>{form.nombre_artistico}</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <div style={{ background: `${C.purple}0D`, border: `1px solid ${C.purple}22`, borderRadius: 9, padding: "7px 10px" }}>
                      <div style={{ fontSize: 9.5, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Disciplina</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, fontFamily: FB }}>{cat?.nombre || "—"}</div>
                    </div>
                    <div style={{ background: `${C.gold}0D`, border: `1px solid ${C.gold}20`, borderRadius: 9, padding: "7px 10px" }}>
                      <div style={{ fontSize: 9.5, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Comisión</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, fontFamily: FD }}>{form.porcentaje_comision}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foto de perfil */}
              <Card accent={C.pink} icon={ImageIcon} title="Foto de perfil" delay={0.08}>
                <div style={{ display: "flex", marginBottom: 12, borderRadius: 9, overflow: "hidden", border: `1px solid ${C.border}`, background: C.input }}>
                  {(["upload", "url"] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setFotoMode(tab)}
                      style={{ flex: 1, padding: "8px", border: "none", cursor: "pointer", fontFamily: FB, fontSize: 12, fontWeight: fotoMode === tab ? 800 : 500, background: fotoMode === tab ? `${C.pink}18` : "transparent", color: fotoMode === tab ? C.cream : C.creamMut, borderRight: tab === "upload" ? `1px solid ${C.border}` : "none", transition: "all .15s" }}>
                      {tab === "upload"
                        ? <><UploadCloud size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Subir</>
                        : <><LinkIcon   size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />URL</>
                      }
                    </button>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFoto(f); }} />

                {fotoMode === "upload" ? (
                  fotoFile ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px", borderRadius: 10, border: `1.5px solid ${C.pink}38`, background: `${C.pink}07`, position: "relative" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `1.5px solid ${C.pink}45` }}>
                        <img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                          <FileImage size={11} color={C.pink} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.cream, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fotoFile.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>{(fotoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "block", marginTop: 4, fontSize: 11, color: C.pink, fontFamily: FB, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Cambiar</button>
                      </div>
                      <button type="button" onClick={clearFoto} style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(10,7,20,0.80)", border: `1px solid ${C.pink}45`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={10} color={C.pink} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {form.foto_perfil && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, background: `${C.purple}0D`, border: `1px solid ${C.purple}22`, marginBottom: 2 }}>
                          <img src={form.foto_perfil} alt="actual" style={{ width: 34, height: 34, borderRadius: 7, objectFit: "cover", border: `1px solid ${C.purple}35` }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>Foto actual</div>
                            <div style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB }}>Sube una nueva para reemplazarla</div>
                          </div>
                        </div>
                      )}
                      <div onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        style={{ borderRadius: 10, border: `2px dashed ${dragOver ? C.pink : C.inputBorder}`, height: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", background: dragOver ? `${C.pink}07` : C.input, transition: "all .2s" }}>
                        <UploadCloud size={20} color={dragOver ? C.pink : C.creamMut} strokeWidth={1.5} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: dragOver ? C.pink : C.creamSub, fontFamily: FB }}>{dragOver ? "Suelta aquí" : "Arrastra o haz clic"}</div>
                          <div style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB }}>JPG, PNG, WEBP · Máx 10 MB</div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <Label><LinkIcon size={10} /> URL de imagen</Label>
                    <input type="url" name="foto_perfil" value={form.foto_perfil} onChange={e => { onChange(e); clearFoto(); }} placeholder="https://res.cloudinary.com/…" disabled={loading} style={inputStyle(focused === "foto", loading)} {...fi("foto")} />
                    <div style={{ fontSize: 11, color: C.creamMut, marginTop: 6, fontFamily: FB }}>Cloudinary, Imgur u otro servicio público.</div>
                  </>
                )}
              </Card>

              {/* Comisión */}
              <Card accent={C.gold} icon={DollarSign} title="Comisión" delay={0.12}>
                <Label><Percent size={10} /> Porcentaje sobre venta</Label>
                <div style={{ position: "relative" }}>
                  <input type="number" name="porcentaje_comision" value={form.porcentaje_comision} onChange={onChange} min="0" max="100" step="1" disabled={loading} style={{ ...inputStyle(focused === "com", loading), paddingRight: 36 }} {...fi("com")} />
                  <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 900, color: C.gold, pointerEvents: "none", fontFamily: FD }}>%</span>
                </div>
                {Number(form.porcentaje_comision) > 0 && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, background: `${C.gold}0D`, border: `1px solid ${C.gold}22` }}>
                    <span style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>Por venta de $10,000</span>
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: C.gold, fontFamily: FD }}>
                      ${new Intl.NumberFormat("es-MX").format(comision)} MXN
                    </span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}