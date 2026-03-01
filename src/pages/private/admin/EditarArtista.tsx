// src/pages/private/admin/EditarArtista.tsx
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon, AlertCircle,
  CheckCircle2, Loader2, Users, Tag,
  DollarSign, Award, Link as LinkIcon, Type,
  FileText, Phone, Mail, Hash,
  LayoutDashboard, ShoppingBag, BarChart2, Settings,
  LogOut, Layers, Star, Palette, MapPin, Percent
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";

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
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:LayoutDashboard, color:C.orange,  path:"/admin"          },
  { id:"obras",     label:"Obras",      icon:Layers,          color:C.blue,    path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",   icon:Users,           color:C.pink,    path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",     icon:ShoppingBag,     color:C.gold,    path:"/admin"          },
  { id:"reportes",  label:"Reportes",   icon:BarChart2,       color:C.purple,  path:"/admin"          },
];

const ESTADOS = [
  { val:"activo",     label:"Activo",     color:C.green   },
  { val:"pendiente",  label:"Pendiente",  color:C.gold    },
  { val:"inactivo",   label:"Inactivo",   color:C.creamMut },
  { val:"suspendido", label:"Suspendido", color:C.pink    },
];

// ─── Logo ────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoEA2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={C.orange}  />
          <stop offset="55%"  stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple}  />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoEA2)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoEA2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoEA2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ navigate }: { navigate: any }) {
  const active   = "artistas";
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

// ─── MAIN ─────────────────────────────────────────────────────
export default function EditarArtista() {
  const navigate    = useNavigate();
  const { id }      = useParams<{ id: string }>();
  const [loading,     setLoading]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [mensaje,     setMensaje]     = useState("");
  const [isError,     setIsError]     = useState(false);
  const [focused,     setFocused]     = useState<string | null>(null);
  const [categorias,  setCategorias]  = useState<any[]>([]);

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
          fetch(`${API_URL}/api/artistas/${id}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } })
        ]);
        setCategorias(cR.categorias || []);
        const json = await res.json();
        if (json.success && json.data) {
          const a = json.data;
          setForm({ nombre_completo: a.nombre_completo || "", nombre_artistico: a.nombre_artistico || "", biografia: a.biografia || "", foto_perfil: a.foto_perfil || "", correo: a.correo || "", telefono: a.telefono || "", matricula: a.matricula || "", id_categoria_principal: a.id_categoria_principal || "", porcentaje_comision: a.porcentaje_comision || 15, estado: a.estado || "pendiente" });
        } else { flash("No se encontró el artista", true); }
      } catch { flash("Error al cargar datos", true); }
      finally { setLoadingData(false); }
    })();
  }, [id]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") setForm(p => ({ ...p, [name]: value === "" ? "" : Number(value) } as any));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const flash = (msg: string, err: boolean) => {
    setMensaje(msg); setIsError(err);
    setTimeout(() => setMensaje(""), 5000);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre_completo) return flash("El nombre completo es obligatorio", true);
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/artistas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Error al actualizar");
      flash("¡Artista actualizado correctamente!", false);
      setTimeout(() => navigate("/admin/artistas"), 1500);
    } catch (err: any) { flash(err.message || "Error al actualizar", true); }
    finally { setLoading(false); }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });

  const initials = form.nombre_completo.split(" ").slice(0, 2).map((n: string) => n[0] || "").join("").toUpperCase() || "?";
  const cat      = categorias.find(c => String(c.id_categoria) === String(form.id_categoria_principal));
  const est      = ESTADOS.find(e => e.val === form.estado);
  const comision = (10000 * Number(form.porcentaje_comision) / 100);

  // ── AVATARES COLOR ──
  const avatarGrad = form.estado === "activo"
    ? `linear-gradient(135deg, ${C.green}40, ${C.blue}30)`
    : form.estado === "pendiente"
    ? `linear-gradient(135deg, ${C.gold}40, ${C.orange}30)`
    : `linear-gradient(135deg, ${C.pink}40, ${C.purple}30)`;

  if (loadingData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: FB, flexDirection: "column", gap: 16 }}>
      <LogoMark size={52} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.creamSub, fontSize: 14 }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
        Cargando artista…
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream, position: "relative" }}>

      {/* Orbs */}
      <div style={{ position: "fixed", top: -160, right: -120, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}09, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, left: 200, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "45%", right: "30%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}05, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* TOPBAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64, background: "rgba(10,7,20,0.90)", borderBottom: `1px solid ${C.borderBr}`, backdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => navigate("/admin/artistas")} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: C.creamMut, fontSize: 13, fontWeight: 600, fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}50`; (e.currentTarget as HTMLElement).style.color = C.orange; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
            ><ArrowLeft size={14} strokeWidth={2} /> Artistas</button>

            <div style={{ width: 1, height: 22, background: C.borderBr }} />

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: C.cream, fontFamily: FD }}>Editar Artista</span>
                {est && (
                  <span style={{ padding: "3px 12px", borderRadius: 20, background: `${est.color}18`, border: `1px solid ${est.color}40`, color: est.color, fontSize: 11.5, fontWeight: 800, fontFamily: FB, boxShadow: est.color === C.green ? `0 0 10px ${C.green}30` : "none" }}>
                    {est.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 2, fontFamily: FB }}>
                ID <span style={{ color: C.orange, fontWeight: 700 }}>#{id}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/admin/artistas")} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
            >Cancelar</button>
            <button form="form-artista" type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: loading ? `${C.orange}40` : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontSize: 13.5, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: FB, boxShadow: loading ? "none" : `0 6px 24px ${C.orange}45`, transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px ${C.orange}60`; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : `0 6px 24px ${C.orange}45`; }}
            >
              {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</> : <><Save size={15} strokeWidth={2.5} /> Guardar Cambios</>}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* Page title */}
          <div style={{ marginBottom: 24, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <Star size={12} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.14em", fontFamily: FB }}>Comunidad · Edición</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream }}>
              Editar{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {form.nombre_completo || "Artista"}
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

          <form id="form-artista" onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 16, alignItems: "start" }}>

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
                        <input name="nombre_artistico" value={form.nombre_artistico} onChange={onChange} disabled={loading} style={inputStyle(focused === "na", loading)} {...fi("na")} placeholder="Alias o seudónimo" />
                      </div>
                    </div>
                    <div>
                      <Label><FileText size={10} /> Biografía</Label>
                      <textarea name="biografia" value={form.biografia} onChange={onChange} rows={4} disabled={loading} placeholder="Describe al artista, su estilo, técnica, trayectoria…" style={{ ...inputStyle(focused === "bio", loading), resize: "vertical" as const }} {...fi("bio")} />
                    </div>
                  </div>
                </Card>

                <Card accent={C.blue} icon={Phone} title="Contacto" delay={0.1}>
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

                <Card accent={C.purple} icon={Tag} title="Categoría y matrícula" delay={0.15}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label><Palette size={10} /> Disciplina principal</Label>
                      <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={onChange} disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")}>
                        <option value="">Sin categoría</option>
                        {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label><Hash size={10} /> Matrícula / Clave</Label>
                      <input name="matricula" value={form.matricula} onChange={onChange} disabled={loading} placeholder="EJ: NUB-2024-001" style={inputStyle(focused === "mat", loading)} {...fi("mat")} />
                    </div>
                  </div>
                </Card>

                <Card accent={C.orange} icon={Award} title="Estado de la cuenta" delay={0.2}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {ESTADOS.map(({ val, label, color }) => {
                      const on = form.estado === val;
                      return (
                        <button key={val} type="button"
                          onClick={() => setForm(p => ({ ...p, estado: val }))}
                          style={{ padding: "13px 8px", borderRadius: 12, border: `1.5px solid ${on ? `${color}65` : C.border}`, background: on ? `${color}18` : "rgba(255,232,200,0.02)", color: on ? color : C.creamSub, fontWeight: on ? 800 : 400, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s", boxShadow: on ? `0 4px 18px ${color}28` : "none", position: "relative" }}>
                          {on && <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* ── DERECHA ── */}
              <div>

                {/* PROFILE CARD — protagonista de la columna derecha */}
                <div style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 20, overflow: "hidden", marginBottom: 14,
                  backdropFilter: "blur(20px)", position: "relative",
                  animation: "fadeUp .5s ease .05s both",
                }}>
                  {/* Banner degradado de fondo */}
                  <div style={{ height: 80, background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}20, ${C.blue}15)`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                    {/* Multicolor top bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.blue})` }} />
                  </div>

                  {/* Avatar flotante */}
                  <div style={{ padding: "0 20px 20px", marginTop: -32, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: form.foto_perfil ? "transparent" : avatarGrad,
                        border: `3px solid ${C.bg}`,
                        outline: `2px solid ${est?.color || C.pink}50`,
                        overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 8px 28px rgba(0,0,0,0.5)`,
                        flexShrink: 0,
                      }}>
                        {form.foto_perfil
                          ? <img src={form.foto_perfil} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <span style={{ fontSize: 22, fontWeight: 900, color: C.cream, fontFamily: FD }}>{initials}</span>
                        }
                      </div>
                      {est && (
                        <span style={{ padding: "4px 12px", borderRadius: 20, background: `${est.color}18`, border: `1px solid ${est.color}45`, color: est.color, fontSize: 11, fontWeight: 800, fontFamily: FB, boxShadow: est.color === C.green ? `0 0 10px ${C.green}25` : "none" }}>
                          {est.label}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, fontFamily: FD, marginBottom: 2 }}>
                      {form.nombre_completo || <span style={{ color: C.creamMut, fontFamily: FB, fontWeight: 400, fontSize: 14 }}>Nombre completo</span>}
                    </div>
                    {form.nombre_artistico && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                        <Star size={9} color={C.gold} fill={C.gold} />
                        <span style={{ fontSize: 12.5, color: C.gold, fontFamily: FB, fontWeight: 600 }}>{form.nombre_artistico}</span>
                      </div>
                    )}

                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, margin: "12px 0" }} />

                    {/* Mini stats row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: `${C.purple}12`, border: `1px solid ${C.purple}25`, borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Disciplina</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, fontFamily: FB }}>{cat?.nombre || "—"}</div>
                      </div>
                      <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}22`, borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB, marginBottom: 3 }}>Comisión</div>
                        <div style={{ fontSize: 12.5, fontWeight: 900, color: C.gold, fontFamily: FD }}>{form.porcentaje_comision}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOTO DE PERFIL */}
                <Card accent={C.pink} icon={ImageIcon} title="Foto de perfil" delay={0.1}>
                  <Label><LinkIcon size={10} /> URL de imagen</Label>
                  <input type="url" name="foto_perfil" value={form.foto_perfil} onChange={onChange} placeholder="https://…/foto.jpg" disabled={loading} style={inputStyle(focused === "foto", loading)} {...fi("foto")} />
                  <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 6, fontFamily: FB }}>Imgur, Cloudinary u otro servicio de imágenes.</div>
                </Card>

                {/* COMISIÓN */}
                <Card accent={C.gold} icon={DollarSign} title="Comisión" delay={0.15}>
                  <Label><Percent size={10} /> Porcentaje sobre venta</Label>
                  <div style={{ position: "relative" }}>
                    <input type="number" name="porcentaje_comision" value={form.porcentaje_comision} onChange={onChange} min="0" max="100" step="1" disabled={loading} style={{ ...inputStyle(focused === "com", loading), paddingRight: 38 }} {...fi("com")} />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 900, color: C.gold, pointerEvents: "none", fontFamily: FD }}>%</span>
                  </div>
                  {Number(form.porcentaje_comision) > 0 && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: `${C.gold}10`, border: `1px solid ${C.gold}25` }}>
                      <span style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB }}>Por venta de $10,000</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: C.gold, fontFamily: FD }}>${comision.toLocaleString("es-MX")} MXN</span>
                    </div>
                  )}
                </Card>

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