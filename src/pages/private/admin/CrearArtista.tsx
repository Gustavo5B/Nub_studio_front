import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  orange:"#FF840E", pink:"#CC59AD", magenta:"#CC4EA1", purple:"#8D4CCD",
  blue:"#79AAF5", gold:"#FFC110", green:"#22C97A", cream:"#FFF8EE",
  creamSub:"#D8CABC", creamMut:"rgba(255,232,200,0.35)", bg:"#0C0812",
  bgDeep:"#070510", card:"rgba(18,13,30,0.95)", border:"rgba(255,200,150,0.08)",
  borderBr:"rgba(118,78,49,0.20)", borderHi:"rgba(255,200,150,0.18)",
  input:"rgba(255,232,200,0.04)", inputBorder:"rgba(255,200,150,0.14)",
  inputFocus:"rgba(255,132,14,0.08)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Sanitización y validaciones RASP frontend ────────────────────────────────
const xssPattern  = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const soloLetrasEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;
const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);

const validarCampos = (form: {
  nombre_completo: string; nombre_artistico: string;
  biografia: string; telefono: string;
}): string | null => {
  if (!form.nombre_completo.trim()) return "El nombre completo es obligatorio";
  if (hasSuspiciousContent(form.nombre_completo)) return "El nombre contiene contenido no permitido";
  if (!soloLetrasEspacios.test(form.nombre_completo.trim())) return "El nombre solo debe contener letras y espacios — sin números";
  if (form.nombre_completo.trim().length < 3) return "El nombre debe tener mínimo 3 caracteres";
  if (form.nombre_artistico && hasSuspiciousContent(form.nombre_artistico)) return "El nombre artístico contiene contenido no permitido";
  if (form.nombre_artistico && form.nombre_artistico.trim().length < 2) return "El nombre artístico debe tener mínimo 2 caracteres";
  if (form.biografia && hasSuspiciousContent(form.biografia)) return "La biografía contiene contenido no permitido";
  if (form.biografia && form.biografia.trim().length < 10) return "La biografía debe tener mínimo 10 caracteres";
  if (form.telefono && !/^\d{10}$/.test(form.telefono.replace(/[\s\-()]/g, ""))) return "El teléfono debe tener exactamente 10 dígitos numéricos";
  return null;
};

// ── Validación en tiempo real por campo (extraída para reducir complexity) ────
function validateNombreCompleto(value: string): string | null {
  if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  if (value && !soloLetrasEspacios.test(value)) return "Solo letras y espacios — sin números";
  if (value && value.trim().length < 3) return "Mínimo 3 caracteres";
  return null;
}

function validateNombreArtistico(value: string): string | null {
  if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  if (value && value.trim().length < 2) return "Mínimo 2 caracteres";
  return null;
}

function validateBiografia(value: string): string | null {
  if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  if (value && value.trim().length < 10) return "Mínimo 10 caracteres";
  return null;
}

function validateTelefono(value: string): string | null {
  const digits = value.replace(/[\s\-()]/g, "");
  if (value && !/^\d*$/.test(digits)) return "Solo se permiten números";
  if (value && digits.length > 10) return "Máximo 10 dígitos";
  if (value && digits.length < 10) return "Mínimo 10 dígitos";
  return null;
}

const FIELD_VALIDATORS: Record<string, (v: string) => string | null> = {
  nombre_completo: validateNombreCompleto,
  nombre_artistico: validateNombreArtistico,
  biografia: validateBiografia,
  telefono: validateTelefono,
};

function validateField(name: string, value: string): string | null {
  const validator = FIELD_VALIDATORS[name];
  return validator ? validator(value) : null;
}

// ─────────────────────────────────────────────────────────────────────────────

const ESTADOS = [
  { val: "activo",     label: "Activo",     color: C.green    },
  { val: "pendiente",  label: "Pendiente",  color: C.gold     },
  { val: "inactivo",   label: "Inactivo",   color: C.creamMut },
  { val: "suspendido", label: "Suspendido", color: C.pink     },
];

interface Categoria { id_categoria: number; nombre: string; }

interface ArtistaForm {
  nombre_completo: string; nombre_artistico: string; biografia: string;
  foto_perfil: string; correo: string; telefono: string;
  id_categoria_principal: string; porcentaje_comision: number; estado: string;
}

function inputStyle(focused: boolean, disabled: boolean, error?: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: error ? "rgba(204,89,173,0.05)" : focused ? C.inputFocus : C.input,
    border: `1.5px solid ${error ? C.pink : focused ? C.orange : C.inputBorder}`,
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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11.5, color: C.pink, fontWeight: 600, marginTop: 5, fontFamily: FB }}>⚠ {msg}</div>;
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

// ── Topbar ────────────────────────────────────────────────────────────────────
function CrearArtistaTopbar({ navigate, loading }: { navigate:(p:string)=>void; loading:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => navigate("/admin/artistas")}
          style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:C.creamMut, fontSize:11.5, fontWeight:700, fontFamily:FB, letterSpacing:"0.08em", textTransform:"uppercase", transition:"color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.orange}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
          <ArrowLeft size={13} strokeWidth={2} /> Admin
        </button>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase" }}>Artistas</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub }}>Nuevo</span>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => navigate("/admin/artistas")} disabled={loading}
          style={{ padding:"7px 16px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.creamSub, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
          Cancelar
        </button>
        <button form="form-crear-artista" type="submit" disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 18px", borderRadius:9, border:"none", background:loading ? `${C.orange}40` : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color:"white", fontSize:13, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:FB, boxShadow:loading?"none":`0 4px 14px ${C.orange}30`, transition:"transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
          {loading ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> Guardando…</> : <><Save size={14} strokeWidth={2.5} /> Crear Artista</>}
        </button>
      </div>
    </div>
  );
}

// ── Preview Card ──────────────────────────────────────────────────────────────
function getAvatarGrad(estado: string): string {
  if (estado === "activo") return `linear-gradient(135deg, ${C.green}40, ${C.blue}30)`;
  if (estado === "pendiente") return `linear-gradient(135deg, ${C.gold}40, ${C.orange}30)`;
  return `linear-gradient(135deg, ${C.pink}40, ${C.purple}30)`;
}

function PreviewCard({ form, fotoSrc, categorias }: { form:ArtistaForm; fotoSrc:string; categorias:Categoria[] }) {
  const initials = form.nombre_completo.split(" ").slice(0, 2).map((n: string) => n[0] || "").join("").toUpperCase() || "?";
  const cat = categorias.find(c => String(c.id_categoria) === String(form.id_categoria_principal));
  const est = ESTADOS.find(e => e.val === form.estado);
  const avatarGrad = getAvatarGrad(form.estado);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14, position:"relative", animation:"fadeUp .5s ease .05s both" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.blue})`, zIndex:1 }} />
      <div style={{ height:72, background:`linear-gradient(135deg, ${C.pink}28, ${C.purple}18, ${C.blue}12)`, position:"relative" }}>
        <div style={{ position:"absolute", top:10, right:10, display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:100, background:"rgba(10,7,20,0.65)", border:`1px solid ${C.borderHi}` }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:C.orange }} />
          <span style={{ fontSize:9.5, fontWeight:700, color:C.creamMut, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.1em" }}>Nuevo</span>
        </div>
      </div>
      <div style={{ padding:"0 18px 18px", marginTop:-28 }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:fotoSrc?"transparent":avatarGrad, border:`3px solid ${C.bg}`, outline:`2px solid ${est?.color || C.pink}40`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {fotoSrc ? <img src={fotoSrc} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              : <span style={{ fontSize:18, fontWeight:900, color:C.cream, fontFamily:FD }}>{initials}</span>}
          </div>
          {est && <span style={{ padding:"3px 10px", borderRadius:100, background:`${est.color}14`, border:`1px solid ${est.color}38`, color:est.color, fontSize:10.5, fontWeight:800, fontFamily:FB }}>{est.label}</span>}
        </div>
        <div style={{ fontSize:15, fontWeight:900, color:form.nombre_completo?C.cream:C.creamMut, fontFamily:form.nombre_completo?FD:FB, marginBottom:2 }}>
          {form.nombre_completo || "Nombre completo"}
        </div>
        {form.nombre_artistico && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8 }}>
            <Star size={8} color={C.gold} fill={C.gold} />
            <span style={{ fontSize:12, color:C.gold, fontFamily:FB, fontWeight:600 }}>{form.nombre_artistico}</span>
          </div>
        )}
        <div style={{ height:1, background:C.border, margin:"10px 0" }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          <div style={{ background:`${C.purple}0D`, border:`1px solid ${C.purple}22`, borderRadius:9, padding:"7px 10px" }}>
            <div style={{ fontSize:9.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:3 }}>Disciplina</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.blue, fontFamily:FB }}>{cat?.nombre || "—"}</div>
          </div>
          <div style={{ background:`${C.gold}0D`, border:`1px solid ${C.gold}20`, borderRadius:9, padding:"7px 10px" }}>
            <div style={{ fontSize:9.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:3 }}>Comisión</div>
            <div style={{ fontSize:13, fontWeight:900, color:C.gold, fontFamily:FD }}>{form.porcentaje_comision}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Foto Upload Section ───────────────────────────────────────────────────────
function FotoUploadArea({ fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop }: {
  fotoFile:File|null; fotoPreview:string; fileRef:React.RefObject<HTMLInputElement>;
  clearFoto:()=>void; dragOver:boolean; setDragOver:(v:boolean)=>void; onDrop:(e:React.DragEvent)=>void;
}) {
  if (fotoFile) {
    return (
      <div style={{ display:"flex", gap:10, alignItems:"center", padding:"10px", borderRadius:10, border:`1.5px solid ${C.pink}38`, background:`${C.pink}07`, position:"relative" }}>
        <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, border:`1.5px solid ${C.pink}45` }}>
          <img src={fotoPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
            <FileImage size={11} color={C.pink} />
            <span style={{ fontSize:12, fontWeight:700, color:C.cream, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fotoFile.name}</span>
          </div>
          <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{(fotoFile.size/1024/1024).toFixed(1)} MB</span>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ display:"block", marginTop:4, fontSize:11, color:C.pink, fontFamily:FB, fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0 }}>Cambiar</button>
        </div>
        <button type="button" onClick={clearFoto} style={{ position:"absolute", top:7, right:7, width:22, height:22, borderRadius:"50%", background:"rgba(10,7,20,0.80)", border:`1px solid ${C.pink}45`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <X size={10} color={C.pink} />
        </button>
      </div>
    );
  }

  return (
    <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={e => { if (e.key === "Enter") fileRef.current?.click(); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{ borderRadius:10, border:`2px dashed ${dragOver?C.pink:C.inputBorder}`, height:110, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:7, cursor:"pointer", background:dragOver?`${C.pink}07`:C.input, transition:"all .2s" }}>
      <UploadCloud size={22} color={dragOver?C.pink:C.creamMut} strokeWidth={1.5} />
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:12, fontWeight:700, color:dragOver?C.pink:C.creamSub, fontFamily:FB }}>{dragOver?"Suelta aquí":"Arrastra o haz clic"}</div>
        <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>JPG, PNG, WEBP · Máx 10 MB</div>
      </div>
    </div>
  );
}

function FotoUrlInput({ form, onChange, focused, loading, fi, clearFoto }: {
  form:ArtistaForm; onChange:(e:ChangeEvent<HTMLInputElement>)=>void;
  focused:string|null; loading:boolean; fi:(n:string)=>{ onFocus:()=>void; onBlur:()=>void }; clearFoto:()=>void;
}) {
  return (
    <>
      <Label><LinkIcon size={10} /> URL de imagen</Label>
      <input type="url" name="foto_perfil" value={form.foto_perfil} onChange={e => { onChange(e); clearFoto(); }} placeholder="https://res.cloudinary.com/…" disabled={loading} style={inputStyle(focused === "foto", loading)} {...fi("foto")} />
      <div style={{ fontSize:11, color:C.creamMut, marginTop:6, fontFamily:FB }}>Cloudinary, Imgur u otro servicio público.</div>
    </>
  );
}

function FotoCard({ form, fotoMode, setFotoMode, fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop, onChange, focused, loading, fi }: {
  form:ArtistaForm; fotoMode:"upload"|"url"; setFotoMode:(m:"upload"|"url")=>void;
  fotoFile:File|null; fotoPreview:string; fileRef:React.RefObject<HTMLInputElement>;
  clearFoto:()=>void; dragOver:boolean; setDragOver:(v:boolean)=>void; onDrop:(e:React.DragEvent)=>void;
  onChange:(e:ChangeEvent<HTMLInputElement>)=>void; focused:string|null; loading:boolean;
  fi:(n:string)=>{ onFocus:()=>void; onBlur:()=>void };
}) {
  return (
    <Card accent={C.pink} icon={ImageIcon} title="Foto de perfil" delay={0.1}>
      <div style={{ display:"flex", marginBottom:12, borderRadius:9, overflow:"hidden", border:`1px solid ${C.border}`, background:C.input }}>
        {(["upload","url"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setFotoMode(tab)}
            style={{ flex:1, padding:"8px", border:"none", cursor:"pointer", fontFamily:FB, fontSize:12, fontWeight:fotoMode===tab?800:500, background:fotoMode===tab?`${C.pink}18`:"transparent", color:fotoMode===tab?C.cream:C.creamMut, borderRight:tab==="upload"?`1px solid ${C.border}`:"none", transition:"all .15s" }}>
            {tab==="upload"?<><UploadCloud size={11} style={{ marginRight:4, verticalAlign:"middle" }}/>Subir</>:<><LinkIcon size={11} style={{ marginRight:4, verticalAlign:"middle" }}/>URL</>}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { /* handled via parent */ } }} />
      {fotoMode === "upload"
        ? <FotoUploadArea fotoFile={fotoFile} fotoPreview={fotoPreview} fileRef={fileRef} clearFoto={clearFoto} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} />
        : <FotoUrlInput form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} clearFoto={clearFoto} />
      }
    </Card>
  );
}

// ── Comisión Card ─────────────────────────────────────────────────────────────
function ComisionCard({ form, onChange, focused, loading, fi }: {
  form:ArtistaForm; onChange:(e:ChangeEvent<HTMLInputElement>)=>void;
  focused:string|null; loading:boolean; fi:(n:string)=>{ onFocus:()=>void; onBlur:()=>void };
}) {
  const comision = 10000 * Number(form.porcentaje_comision) / 100;
  return (
    <Card accent={C.gold} icon={DollarSign} title="Comisión" delay={0.14}>
      <Label><Percent size={10} /> Porcentaje sobre venta</Label>
      <div style={{ position:"relative" }}>
        <input type="number" name="porcentaje_comision" value={form.porcentaje_comision} onChange={onChange} min="0" max="100" step="1" disabled={loading} style={{ ...inputStyle(focused==="com", loading), paddingRight:36 }} {...fi("com")} />
        <span style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", fontSize:15, fontWeight:900, color:C.gold, pointerEvents:"none", fontFamily:FD }}>%</span>
      </div>
      {Number(form.porcentaje_comision) > 0 && (
        <div style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:9, background:`${C.gold}0D`, border:`1px solid ${C.gold}22` }}>
          <span style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>Por venta de $10,000</span>
          <span style={{ fontSize:13.5, fontWeight:900, color:C.gold, fontFamily:FD }}>${new Intl.NumberFormat("es-MX").format(comision)} MXN</span>
        </div>
      )}
    </Card>
  );
}

// ── Estado Card ───────────────────────────────────────────────────────────────
function EstadoCard({ form, setForm }: { form:ArtistaForm; setForm:(fn:(p:ArtistaForm)=>ArtistaForm)=>void }) {
  return (
    <Card accent={C.orange} icon={Award} title="Estado de la cuenta" delay={0.16}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {ESTADOS.map(({ val, label, color }) => {
          const on = form.estado === val;
          return (
            <button key={val} type="button" onClick={() => setForm(p => ({ ...p, estado: val }))}
              style={{ padding:"12px 8px", borderRadius:10, border:`1.5px solid ${on ? `${color}55` : C.border}`, background:on ? `${color}14` : "rgba(255,232,200,0.02)", color:on ? color : C.creamSub, fontWeight:on ? 800 : 400, fontSize:12, cursor:"pointer", fontFamily:FB, transition:"all .15s", position:"relative" }}>
              {on && <div style={{ position:"absolute", top:6, right:6, width:5, height:5, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }} />}
              {label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — low complexity
// ══════════════════════════════════════════════════════════════════════════════
export default function CrearArtista() {
  const navigate      = useNavigate();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState<string | null>(null);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [fotoFile,    setFotoFile]    = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [fotoMode,    setFotoMode]    = useState<"upload" | "url">("upload");
  const [dragOver,    setDragOver]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ArtistaForm>({
    nombre_completo: "", nombre_artistico: "", biografia: "",
    foto_perfil: "", correo: "", telefono: "",
    id_categoria_principal: "", porcentaje_comision: 15, estado: "pendiente",
  });

  useEffect(() => {
    obraService.getCategorias()
      .then(r => setCategorias(r.categorias || []))
      .catch(() => {});
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newVal = type === "number" ? (value === "" ? "" : Number(value)) : value;

    const error = validateField(name, value);
    if (error) {
      setFieldErrors(p => ({ ...p, [name]: error }));
    } else {
      setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
    }

    setForm(p => ({ ...p, [name]: newVal } as ArtistaForm));
  };

  const handleFoto = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("La foto no puede superar 10 MB", "warn"); return; }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setForm(p => ({ ...p, foto_perfil: "" }));
  };

  const clearFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null); setFotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handleFoto(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const error = validarCampos(form);
    if (error) { showToast(error, "err"); return; }

    setLoading(true);
    try {
      const res = await submitArtista(form, fotoFile);
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al crear", "err"); return; }
      showToast(`¡Artista creado! Matrícula: ${json.data?.matricula || ""}`, "ok");
      setTimeout(() => navigate("/admin/artistas"), 2200);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });
  const fotoSrc = fotoPreview || form.foto_perfil || "";

  // Handle file input change at parent level
  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const handler = () => { const f = input.files?.[0]; if (f) handleFoto(f); };
    input.addEventListener("change", handler);
    return () => input.removeEventListener("change", handler);
  }); // intentionally no deps - re-attach on every render to capture latest handleFoto

  return (
    <>
      <CrearArtistaTopbar navigate={navigate} loading={loading} />

      <main style={{ flex:1, padding:"22px 26px 28px", overflowY:"auto" }}>
        <div style={{ marginBottom:20, animation:"fadeUp .4s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
            <Star size={9} color={C.gold} fill={C.gold} />
            <span style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:FB }}>Comunidad · Nuevo registro</span>
          </div>
          <h1 style={{ fontSize:24, fontWeight:900, margin:0, fontFamily:FD, color:C.cream, letterSpacing:"-0.02em" }}>
            Registrar{" "}
            <span style={{ background:`linear-gradient(90deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Nuevo Artista</span>
          </h1>
        </div>

        <form id="form-crear-artista" onSubmit={onSubmit}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, alignItems:"start" }}>
            <div>
              <Card accent={C.pink} icon={Type} title="Información personal" delay={0.05}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <div>
                      <Label req>Nombre completo</Label>
                      <input name="nombre_completo" value={form.nombre_completo} onChange={onChange} required disabled={loading} placeholder="Ej: María López Martínez" style={inputStyle(focused === "nc", loading, !!fieldErrors.nombre_completo)} {...fi("nc")} />
                      <FieldError msg={fieldErrors.nombre_completo} />
                    </div>
                    <div>
                      <Label>Nombre artístico</Label>
                      <input name="nombre_artistico" value={form.nombre_artistico} onChange={onChange} disabled={loading} placeholder="Alias o seudónimo" style={inputStyle(focused === "na", loading, !!fieldErrors.nombre_artistico)} {...fi("na")} />
                      <FieldError msg={fieldErrors.nombre_artistico} />
                    </div>
                  </div>
                  <div>
                    <Label><FileText size={10} /> Biografía</Label>
                    <textarea name="biografia" value={form.biografia} onChange={onChange} rows={4} disabled={loading} placeholder="Cuéntanos sobre el artista… (mínimo 10 caracteres)" style={{ ...inputStyle(focused === "bio", loading, !!fieldErrors.biografia), resize:"vertical" as const }} {...fi("bio")} />
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                      <FieldError msg={fieldErrors.biografia} />
                      <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>{form.biografia.length} caracteres</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card accent={C.blue} icon={Phone} title="Contacto" delay={0.08}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <Label><Mail size={10} /> Correo electrónico</Label>
                    <input type="email" name="correo" value={form.correo} onChange={onChange} disabled={loading} placeholder="artista@correo.com" style={inputStyle(focused === "correo", loading)} {...fi("correo")} />
                  </div>
                  <div>
                    <Label><Phone size={10} /> Teléfono <span style={{ color:C.creamMut, fontWeight:400, textTransform:"none" }}>(10 dígitos)</span></Label>
                    <input name="telefono" value={form.telefono} onChange={onChange} disabled={loading} placeholder="7711234567" maxLength={10} inputMode="numeric" style={inputStyle(focused === "tel", loading, !!fieldErrors.telefono)} {...fi("tel")} />
                    <FieldError msg={fieldErrors.telefono} />
                  </div>
                </div>
              </Card>

              <Card accent={C.purple} icon={Tag} title="Categoría y matrícula" delay={0.12}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <Label><Palette size={10} /> Disciplina principal</Label>
                    <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={onChange} disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label><Hash size={10} /> Matrícula</Label>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:`${C.purple}0D`, border:`1.5px dashed ${C.purple}30`, minHeight:44 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:C.purple, flexShrink:0, boxShadow:`0 0 8px ${C.purple}80`, animation:"pulse 2s infinite" }} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.purple, fontFamily:FB, letterSpacing:1 }}>GAL-{new Date().getFullYear()}-XXXX</div>
                        <div style={{ fontSize:10, color:C.creamMut, fontFamily:FB, marginTop:1 }}>Se asigna al guardar</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <EstadoCard form={form} setForm={setForm} />
            </div>

            <div>
              <PreviewCard form={form} fotoSrc={fotoSrc} categorias={categorias} />

              <FotoCard form={form} fotoMode={fotoMode} setFotoMode={setFotoMode} fotoFile={fotoFile} fotoPreview={fotoPreview} fileRef={fileRef as React.RefObject<HTMLInputElement>} clearFoto={clearFoto} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} onChange={onChange} focused={focused} loading={loading} fi={fi} />

              <ComisionCard form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} />
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

// ── Helper: submit artista ────────────────────────────────────────────────────
async function submitArtista(form: ArtistaForm, fotoFile: File | null): Promise<Response> {
  const headers = { Authorization: `Bearer ${authService.getToken()}` };
  if (fotoFile) {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("foto", fotoFile);
    return fetch(`${API_URL}/api/artistas`, { method: "POST", headers, body: fd });
  }
  return fetch(`${API_URL}/api/artistas`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}