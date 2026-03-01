// src/pages/private/admin/EditarObra.tsx
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon, AlertCircle,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  LayoutDashboard, ShoppingBag, BarChart2, Settings, LogOut, Layers, Star
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";

// ─────────────────────────────────────────────────────────────
// PALETA OFICIAL — idéntica al resto del sistema
// ─────────────────────────────────────────────────────────────
const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  violet:   "#D363FF",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  coffee:   "#764E31",
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:LayoutDashboard, color:C.orange,  path:"/admin"          },
  { id:"obras",     label:"Obras",      icon:Layers,          color:C.blue,    path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",   icon:Users,           color:C.pink,    path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",     icon:ShoppingBag,     color:C.gold,    path:"/admin"          },
  { id:"reportes",  label:"Reportes",   icon:BarChart2,       color:C.purple,  path:"/admin"          },
];

const ESTADOS_OPTS = [
  { val:"pendiente", label:"Pendiente", color:C.gold   },
  { val:"publicada", label:"Publicada", color:C.green  }, // ← VERDE
  { val:"rechazada", label:"Rechazada", color:C.pink   },
  { val:"agotada",   label:"Agotada",   color:C.creamMut },
];

interface Categoria { id_categoria: number; nombre: string; }
interface Tecnica    { id_tecnica:   number; nombre: string; }
interface Artista    { id_artista:   number; nombre_completo: string; nombre_artistico?: string; }

// ─────────────────────────────────────────────────────────────
// LOGO PROFESIONAL SVG
// ─────────────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoE" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoE)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoE)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoE)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function Sidebar({ navigate }: { navigate: any }) {
  const active   = "obras";
  const userName = authService.getUserName?.() || "Admin";

  return (
    <div style={{
      width: 240, minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bgDeep} 100%)`,
      borderRight: `1px solid ${C.borderBr}`,
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh", flexShrink: 0, zIndex: 40,
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})`, flexShrink: 0 }} />

      <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 20 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, lineHeight: 1.1, fontFamily: FD, letterSpacing: "-0.02em" }}>Nu-B Studio</div>
            <div style={{ fontSize: 10, color: C.orange, marginTop: 4, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FB, fontWeight: 700 }}>Panel Admin</div>
          </div>
        </div>

        <div style={{
          background: `linear-gradient(135deg, rgba(118,78,49,0.20), rgba(255,132,14,0.08))`,
          border: `1px solid ${C.borderBr}`, borderRadius: 14, padding: "13px 14px",
          display: "flex", alignItems: "center", gap: 11,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "white", fontFamily: FB,
            boxShadow: `0 4px 14px ${C.pink}40`,
          }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userName}</div>
            <div style={{ fontSize: 11, color: C.orange, marginTop: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>Administrador</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 7px ${C.green}`, flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.creamMut, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 10px 12px", fontFamily: FB }}>
          Navegación
        </div>
        {NAV.map(({ id, label, icon: Icon, color, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => navigate(path)}
              style={{
                width: "100%",
                border: on ? `1px solid ${color}30` : "1px solid transparent",
                cursor: "pointer",
                background: on ? `linear-gradient(135deg, ${color}18, ${color}08)` : "transparent",
                borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all .18s ease", position: "relative", fontFamily: FB,
              }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; } }}
            >
              {on && (
                <div style={{
                  position: "absolute", left: 0, top: "18%", bottom: "18%",
                  width: 3, borderRadius: "0 3px 3px 0",
                  background: `linear-gradient(180deg, ${color}, ${color}70)`,
                  boxShadow: `0 0 10px ${color}60`,
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: on ? `${color}22` : "rgba(255,232,200,0.06)",
                border: on ? `1px solid ${color}30` : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s",
              }}>
                <Icon size={17} color={on ? color : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: on ? 700 : 500, color: on ? C.cream : C.creamSub, fontFamily: FB }}>
                {label}
              </span>
              {on && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 9px ${color}` }} />}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 12px 20px", borderTop: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`,
            background: "rgba(255,232,200,0.03)", cursor: "pointer",
            fontSize: 12.5, color: C.creamSub, fontWeight: 600, fontFamily: FB, transition: "all .15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
          >
            <Settings size={14} strokeWidth={1.8} /> Config
          </button>
          <button onClick={() => { authService.logout(); navigate("/login"); }} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 10, border: `1px solid ${C.pink}30`,
            background: `${C.pink}08`, cursor: "pointer",
            fontSize: 12.5, color: C.pink, fontWeight: 600, fontFamily: FB, transition: "all .15s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.pink}18`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.pink}08`}
          >
            <LogOut size={14} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS — inputs con paleta crema
// ─────────────────────────────────────────────────────────────
function inputStyle(focused: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: focused ? C.inputFocus : C.input,
    border: `1.5px solid ${focused ? C.orange : C.inputBorder}`,
    borderRadius: 10, fontSize: 13.5, color: C.cream, outline: "none",
    transition: "border-color .15s, background .15s",
    fontFamily: FB,
    opacity: disabled ? 0.5 : 1,
  };
}

function FieldLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 700, color: C.creamSub,
      marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
      textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FB,
    }}>
      {children}
      {req && <span style={{ color: C.orange, fontSize: 14, lineHeight: 1 }}>*</span>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, accent, children }: { title: string; icon: any; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 18, overflow: "hidden", marginBottom: 16,
      backdropFilter: "blur(20px)", position: "relative",
    }}>
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)` }} />

      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "15px 20px", borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${accent}20`, border: `1px solid ${accent}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 10px ${accent}20`,
        }}>
          <Icon size={15} color={accent} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD }}>{title}</span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${accent}22, transparent)` }} />
      </div>

      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Toggle({ label, name, checked, onChange, disabled, icon: Icon, accent }: any) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11,
      cursor: disabled ? "not-allowed" : "pointer",
      border: `1.5px solid ${checked ? `${accent}50` : C.border}`,
      background: checked ? `${accent}12` : "rgba(255,232,200,0.02)",
      transition: "all .15s", userSelect: "none",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${checked ? accent : C.creamMut}`,
        background: checked ? accent : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s",
        boxShadow: checked ? `0 0 8px ${accent}40` : "none",
      }}>
        {checked && <CheckCircle2 size={11} color="white" strokeWidth={3} />}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display: "none" }} />
      <Icon size={14} color={checked ? accent : C.creamMut} strokeWidth={2} />
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function EditarObra() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();

  const [loading,     setLoading]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [mensaje,     setMensaje]     = useState("");
  const [isError,     setIsError]     = useState(false);
  const [focused,     setFocused]     = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tecnicas,   setTecnicas]   = useState<Tecnica[]>([]);
  const [artistas,   setArtistas]   = useState<Artista[]>([]);

  const [formData, setFormData] = useState({
    titulo: "", descripcion: "", id_categoria: 0, id_tecnica: 0,
    id_artista: 0, precio_base: 0, anio_creacion: new Date().getFullYear(),
    dimensiones_alto: "", dimensiones_ancho: "", dimensiones_profundidad: "",
    permite_marco: true, con_certificado: false, imagen_principal: "", estado: "pendiente",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cR, tR, aR] = await Promise.all([
          obraService.getCategorias(),
          obraService.getTecnicas(),
          obraService.getArtistas(),
        ]);
        setCategorias(cR.categorias || []);
        setTecnicas(tR.tecnicas || []);
        setArtistas(aR.artistas || []);

        const res  = await fetch(`${API_URL}/api/obras/${id}`, {
          headers: { Authorization: `Bearer ${authService.getToken()}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const o = json.data;
          setFormData({
            titulo:                  o.titulo || "",
            descripcion:             o.descripcion || "",
            id_categoria:            o.id_categoria || 0,
            id_tecnica:              o.id_tecnica || 0,
            id_artista:              o.id_artista || 0,
            precio_base:             o.precio_base || 0,
            anio_creacion:           o.anio_creacion || new Date().getFullYear(),
            dimensiones_alto:        o.dimensiones_alto || "",
            dimensiones_ancho:       o.dimensiones_ancho || "",
            dimensiones_profundidad: o.dimensiones_profundidad || "",
            permite_marco:           o.permite_marco ?? true,
            con_certificado:         o.con_certificado ?? false,
            imagen_principal:        o.imagen_principal || "",
            estado:                  o.estado || "pendiente",
          });
        } else { flash("No se encontró la obra", true); }
      } catch { flash("Error al cargar los datos", true); }
      finally { setLoadingData(false); }
    })();
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setFormData(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === "number") setFormData(p => ({ ...p, [name]: value === "" ? "" : Number(value) } as any));
    else setFormData(p => ({ ...p, [name]: value }));
  };

  const flash = (msg: string, err: boolean) => {
    setMensaje(msg); setIsError(err);
    setTimeout(() => setMensaje(""), 5000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion) return flash("Completa título y descripción", true);
    if (!formData.id_categoria) return flash("Selecciona una categoría", true);
    if (!formData.id_artista)   return flash("Selecciona un artista", true);
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Error al actualizar");
      flash("¡Obra actualizada exitosamente!", false);
      setTimeout(() => navigate("/admin/obras"), 1500);
    } catch (err: any) {
      flash(err.message || "Error al actualizar la obra", true);
    } finally { setLoading(false); }
  };

  const fi = (name: string) => ({
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(null),
  });

  const currentArtist = artistas.find(a => a.id_artista === Number(formData.id_artista));
  const currentCat    = categorias.find(c => c.id_categoria === Number(formData.id_categoria));
  const currentEstado = ESTADOS_OPTS.find(e => e.val === formData.estado);

  // ── Loading screen ────────────────────────────────────────
  if (loadingData) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: C.bg, fontFamily: FB,
      gap: 14, color: C.creamMut, flexDirection: "column",
    }}>
      <LogoMark size={48} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
        <span style={{ fontSize: 14, color: C.creamSub }}>Cargando obra…</span>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream, position: "relative" }}>

      {/* Background orbs */}
      <div style={{ position: "fixed", top: -140, right: -100, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}09, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -120, left: 180, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", right: "25%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}06, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* Topbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: 64,
          background: "rgba(10,7,20,0.88)",
          borderBottom: `1px solid ${C.borderBr}`,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          position: "sticky", top: 0, zIndex: 30, fontFamily: FB,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Back button */}
            <button onClick={() => navigate("/admin/obras")} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`,
              borderRadius: 9, padding: "8px 14px", cursor: "pointer",
              color: C.creamMut, fontSize: 13, fontWeight: 600, fontFamily: FB,
              transition: "all .15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}50`; (e.currentTarget as HTMLElement).style.color = C.orange; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
            >
              <ArrowLeft size={14} strokeWidth={2} /> Obras
            </button>

            <div style={{ width: 1, height: 22, background: C.borderBr }} />

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: C.cream, lineHeight: 1, fontFamily: FD }}>Editar Obra</div>
                {currentEstado && (
                  <span style={{
                    padding: "3px 11px", borderRadius: 20,
                    background: `${currentEstado.color}18`, border: `1px solid ${currentEstado.color}38`,
                    color: currentEstado.color, fontSize: 11.5, fontWeight: 800, fontFamily: FB,
                    boxShadow: currentEstado.color === C.green ? `0 0 8px ${C.green}25` : "none",
                  }}>
                    {currentEstado.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.creamMut, marginTop: 3, fontFamily: FB }}>
                ID <span style={{ color: C.orange, fontWeight: 700 }}>#{id}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => navigate("/admin/obras")} disabled={loading}
              style={{
                padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`,
                background: "transparent", color: C.creamSub,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
            >
              Cancelar
            </button>

            <button form="editar-form" type="submit" disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 9, border: "none",
                background: loading ? "rgba(255,132,14,0.35)" : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
                color: "white", fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: FB,
                boxShadow: loading ? "none" : `0 6px 22px ${C.orange}40`,
                transition: "transform .15s, box-shadow .15s",
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${C.orange}55`; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : `0 6px 22px ${C.orange}40`; }}
            >
              {loading
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</>
                : <><Save size={15} strokeWidth={2.5} /> Guardar Cambios</>
              }
            </button>
          </div>
        </div>

        {/* Main */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 22, animation: "fadeUp .45s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Star size={13} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>Catálogo · Edición</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Editar{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {formData.titulo || "Obra"}
              </span>
            </h1>
          </div>

          {/* Alert */}
          {mensaje && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 18px", borderRadius: 13, marginBottom: 22,
              background: isError ? `${C.pink}12` : `${C.green}10`,
              border: `1px solid ${isError ? `${C.pink}40` : `${C.green}35`}`,
              color: isError ? C.pink : C.green,
              fontSize: 13.5, fontWeight: 600, fontFamily: FB,
              animation: "msgIn .25s ease",
            }}>
              {isError ? <AlertCircle size={17} strokeWidth={2.5} /> : <CheckCircle2 size={17} strokeWidth={2.5} />}
              {mensaje}
            </div>
          )}

          <form id="editar-form" onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

              {/* ── Columna izquierda ── */}
              <div>
                {/* Información básica */}
                <SectionCard title="Información básica" icon={Type} accent={C.orange}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <FieldLabel req>Título de la obra</FieldLabel>
                      <input name="titulo" value={formData.titulo} onChange={handleChange}
                        placeholder="Ej: Amanecer en la Huasteca"
                        required disabled={loading}
                        style={inputStyle(focused === "titulo", loading)} {...fi("titulo")} />
                    </div>
                    <div>
                      <FieldLabel req><FileText size={11} /> Descripción</FieldLabel>
                      <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}
                        placeholder="Describe la obra, su técnica, inspiración…"
                        rows={4} required disabled={loading}
                        style={{ ...inputStyle(focused === "desc", loading), resize: "vertical" as const }} {...fi("desc")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <FieldLabel req><Tag size={11} /> Categoría</FieldLabel>
                        <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} required disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")}>
                          <option value="0">Seleccionar…</option>
                          {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel><Layers size={11} /> Técnica</FieldLabel>
                        <select name="id_tecnica" value={formData.id_tecnica || ""} onChange={handleChange} disabled={loading} style={inputStyle(focused === "tec", loading)} {...fi("tec")}>
                          <option value="">Sin técnica</option>
                          {tecnicas.map(t => <option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel req><Users size={11} /> Artista</FieldLabel>
                        <select name="id_artista" value={formData.id_artista} onChange={handleChange} required disabled={loading} style={inputStyle(focused === "art", loading)} {...fi("art")}>
                          <option value="0">Seleccionar…</option>
                          {artistas.map(a => <option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico || a.nombre_completo}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel><Calendar size={11} /> Año de creación</FieldLabel>
                        <input type="number" name="anio_creacion" value={formData.anio_creacion || ""}
                          onChange={handleChange} min="1900" max={new Date().getFullYear()}
                          disabled={loading} style={inputStyle(focused === "anio", loading)} {...fi("anio")} />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Dimensiones */}
                <SectionCard title="Dimensiones (cm)" icon={Ruler} accent={C.blue}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {[
                      { name: "dimensiones_alto",        label: "Alto",        ph: "50" },
                      { name: "dimensiones_ancho",       label: "Ancho",       ph: "70" },
                      { name: "dimensiones_profundidad", label: "Profundidad", ph: "5"  },
                    ].map(({ name, label, ph }) => (
                      <div key={name}>
                        <FieldLabel>{label}</FieldLabel>
                        <input type="number" name={name} value={(formData as any)[name] || ""}
                          onChange={handleChange} placeholder={ph}
                          step="0.01" min="0" disabled={loading}
                          style={inputStyle(focused === name, loading)} {...fi(name)} />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Opciones adicionales */}
                <SectionCard title="Opciones adicionales" icon={Award} accent={C.purple}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Toggle label="Permite marco personalizado" name="permite_marco" checked={formData.permite_marco} onChange={handleChange} disabled={loading} icon={Frame} accent={C.purple} />
                    <Toggle label="Incluye certificado de autenticidad" name="con_certificado" checked={formData.con_certificado} onChange={handleChange} disabled={loading} icon={Award} accent={C.gold} />
                  </div>
                </SectionCard>

                {/* Estado de publicación — con verde para "publicada" */}
                <SectionCard title="Estado de publicación" icon={CheckCircle2} accent={C.green}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {ESTADOS_OPTS.map(({ val, label, color }) => {
                      const isActive = formData.estado === val;
                      return (
                        <button key={val} type="button"
                          onClick={() => setFormData(p => ({ ...p, estado: val }))}
                          style={{
                            padding: "12px 8px", borderRadius: 11,
                            border: `1.5px solid ${isActive ? `${color}60` : C.border}`,
                            background: isActive ? `${color}18` : "rgba(255,232,200,0.02)",
                            color: isActive ? color : C.creamSub,
                            fontWeight: isActive ? 800 : 500, fontSize: 12.5,
                            cursor: "pointer", fontFamily: FB,
                            transition: "all .15s",
                            boxShadow: isActive ? `0 4px 16px ${color}25` : "none",
                          }}
                          onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.color = color; } }}
                          onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; } }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>
              </div>

              {/* ── Columna derecha ── */}
              <div>
                {/* Precio */}
                <SectionCard title="Precio" icon={DollarSign} accent={C.gold}>
                  <FieldLabel req>Precio base (MXN)</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      fontSize: 15, fontWeight: 900, color: C.gold, pointerEvents: "none", fontFamily: FD,
                    }}>$</span>
                    <input type="number" name="precio_base" value={formData.precio_base || ""}
                      onChange={handleChange} placeholder="2,500"
                      step="0.01" min="0" disabled={loading}
                      style={{ ...inputStyle(focused === "precio", loading), paddingLeft: 30 }} {...fi("precio")} />
                  </div>
                  {Number(formData.precio_base) > 0 && (
                    <div style={{
                      marginTop: 10, padding: "11px 14px", borderRadius: 11,
                      background: `${C.gold}12`, border: `1px solid ${C.gold}28`,
                      display: "flex", justifyContent: "space-between",
                      fontSize: 13.5, color: C.gold, fontWeight: 800, fontFamily: FD,
                    }}>
                      <span>Total estimado</span>
                      <span>${Number(formData.precio_base).toLocaleString("es-MX")} MXN</span>
                    </div>
                  )}
                </SectionCard>

                {/* Imagen principal */}
                <SectionCard title="Imagen principal" icon={ImageIcon} accent={C.pink}>
                  <FieldLabel><LinkIcon size={11} /> URL de imagen</FieldLabel>
                  <input type="url" name="imagen_principal" value={formData.imagen_principal || ""}
                    onChange={handleChange} placeholder="https://…/imagen.jpg"
                    disabled={loading}
                    style={inputStyle(focused === "img", loading)} {...fi("img")} />
                  <div style={{ fontSize: 12, color: C.creamMut, marginTop: 7, marginBottom: 14, fontFamily: FB }}>
                    Puedes usar Imgur, Cloudinary u otro servicio.
                  </div>

                  {/* Preview */}
                  <div style={{
                    borderRadius: 14, overflow: "hidden",
                    border: `1.5px dashed ${formData.imagen_principal ? `${C.pink}60` : C.borderBr}`,
                    height: 190,
                    background: "rgba(255,232,200,0.02)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color .2s",
                  }}>
                    {formData.imagen_principal ? (
                      <img src={formData.imagen_principal} alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ textAlign: "center", color: C.creamMut }}>
                        <ImageIcon size={32} strokeWidth={1.2} style={{ marginBottom: 10, opacity: 0.25 }} />
                        <div style={{ fontSize: 12.5, fontFamily: FB }}>Vista previa</div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Resumen */}
                <div style={{
                  background: C.card, borderRadius: 18, border: `1px solid ${C.border}`,
                  padding: "20px", backdropFilter: "blur(20px)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Top bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink})` }} />
                  {/* Orb */}
                  <div style={{ position: "absolute", bottom: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}14, transparent 70%)`, pointerEvents: "none" }} />

                  <div style={{ fontSize: 11.5, fontWeight: 800, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 18, fontFamily: FB }}>
                    Resumen
                  </div>

                  {[
                    { label: "Título",    val: formData.titulo || "—",                                                              color: undefined        },
                    { label: "Artista",   val: currentArtist?.nombre_artistico || currentArtist?.nombre_completo || "—",           color: undefined        },
                    { label: "Categoría", val: currentCat?.nombre || "—",                                                           color: C.blue           },
                    { label: "Precio",    val: formData.precio_base ? `$${Number(formData.precio_base).toLocaleString("es-MX")}` : "—", color: C.gold      },
                    { label: "Estado",    val: currentEstado?.label || "—",                                                         color: currentEstado?.color },
                  ].map(({ label, val, color }, i, arr) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 13, borderBottom: i < arr.length - 1 ? `1px solid rgba(255,232,200,0.06)` : "none",
                      paddingBottom: 11, marginBottom: 11,
                    }}>
                      <span style={{ color: C.creamMut, fontFamily: FB }}>{label}</span>
                      <span style={{
                        fontWeight: 700, color: color || C.cream,
                        maxWidth: 160, textAlign: "right",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontFamily: label === "Precio" ? FD : FB,
                      }}>
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes msgIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder, textarea::placeholder { color: rgba(255,232,200,0.20); font-family: ${FB}; }
        select option { background: #100D1C; color: ${C.cream}; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}