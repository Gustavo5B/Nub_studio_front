// src/pages/private/admin/ListaArtistas.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Settings, Search, RefreshCw, X, Eye, Edit2, Trash2,
  CheckCircle, Clock, XCircle, UserPlus, Phone, Mail,
  ChevronLeft, ChevronRight, AlertTriangle, Image as ImageIcon,
  Star, LogOut, Check, Ban, Bell, Layers, ShieldOff, UserCheck,
} from "lucide-react";
import { authService } from "../../../services/authService";
import logoImg from "../../../assets/images/logo.png";

// ── Paleta unificada ──────────────────────────────────────────────────────────
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
  creamMut: "rgba(255,232,200,0.35)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
  rowHover: "rgba(255,232,200,0.03)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ESTADOS: Record<string, { label: string; color: string; icon: any }> = {
  activo:     { label: "Activo",     color: C.green,   icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: C.gold,    icon: Clock       },
  inactivo:   { label: "Inactivo",   color: "#7B8FA1", icon: XCircle     },
  rechazado:  { label: "Rechazado",  color: C.pink,    icon: Ban         },
  suspendido: { label: "Suspendido", color: C.magenta, icon: XCircle     },
};

const OPCIONES_POR_ESTADO: Record<string, { estado: string; label: string; color: string; icon: any; fill?: boolean }[]> = {
  pendiente:  [
    { estado: "activo",     label: "Aprobar",              color: C.green,   icon: Check,     fill: true },
    { estado: "rechazado",  label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  activo:     [
    { estado: "inactivo",   label: "Desactivar",           color: "#7B8FA1", icon: XCircle               },
    { estado: "suspendido", label: "Suspender",            color: C.magenta, icon: ShieldOff             },
    { estado: "rechazado",  label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  inactivo:   [
    { estado: "activo",     label: "Reactivar",            color: C.green,   icon: UserCheck, fill: true },
    { estado: "rechazado",  label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  rechazado:  [
    { estado: "pendiente",  label: "Volver a revisar",     color: C.gold,    icon: Clock                 },
    { estado: "activo",     label: "Aprobar directamente", color: C.green,   icon: Check,     fill: true },
  ],
  suspendido: [
    { estado: "activo",     label: "Reactivar",            color: C.green,   icon: UserCheck, fill: true },
    { estado: "inactivo",   label: "Desactivar",           color: "#7B8FA1", icon: XCircle               },
  ],
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       path:"/admin"          },
];

// ── Sidebar — idéntico al sistema unificado ───────────────────────────────────
function Sidebar({ navigate, pendientes }: { navigate: any; pendientes: number }) {
  const active   = "artistas";
  const userName = authService.getUserName?.() || "Admin";

  return (
    <div style={{ width: 220, minHeight: "100vh", background: C.bgDeep, borderRight: `1px solid ${C.borderBr}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0, zIndex: 40 }}>
      {/* Línea de colores — patrón unificado */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      {/* Logo + usuario */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: "hidden", border: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
            <img src={logoImg} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

      {/* Nav */}
      <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.creamMut, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 8px 10px", fontFamily: FB }}>Navegación</div>
        {NAV.map(({ id, label, icon: Icon, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => navigate(path)}
              style={{ width: "100%", cursor: "pointer", background: on ? "rgba(255,132,14,0.10)" : "transparent", border: on ? "1px solid rgba(255,132,14,0.22)" : "1px solid transparent", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", position: "relative", fontFamily: FB }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {on && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2.5, borderRadius: "0 3px 3px 0", background: C.orange }} />}
              <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: on ? "rgba(255,132,14,0.15)" : "rgba(255,232,200,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: on ? "1px solid rgba(255,132,14,0.25)" : "1px solid transparent", transition: "all .15s" }}>
                <Icon size={15} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
             <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
              {/* Badge de pendientes en Artistas */}
              {id === "artistas" && pendientes > 0 ? (
                <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#000", padding: "0 5px" }}>{pendientes}</div>
              ) : on ? (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }} />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px 18px", borderTop: `1px solid ${C.borderBr}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 12, color: C.creamMut, fontWeight: 600, fontFamily: FB, transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.creamSub}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={() => { authService.logout(); navigate("/login"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid rgba(204,89,173,0.25)`, background: "rgba(204,89,173,0.06)", cursor: "pointer", fontSize: 12, color: C.pink, fontWeight: 600, fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Eliminar ─────────────────────────────────────────────────────────────
function ModalEliminar({ artista, onConfirm, onCancel }: { artista: any; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 400, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(204,89,173,0.14)", border: `1px solid rgba(204,89,173,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <AlertTriangle size={22} color={C.pink} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.cream, marginBottom: 8, fontFamily: FD }}>¿Eliminar artista?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 6, lineHeight: 1.7 }}>Vas a eliminar a <strong style={{ color: C.cream }}>{artista?.nombre_completo}</strong>.</div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 24 }}>Sus obras seguirán en el sistema.</div>
        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px rgba(204,89,173,0.35)`, transition: "transform .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Estado ───────────────────────────────────────────────────────────────
function ModalEstado({ artista, onConfirm, onCancel }: { artista: any; onConfirm: (s: string, m?: string) => void; onCancel: () => void }) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [motivo,       setMotivo]       = useState("");

  const estadoActual     = ESTADOS[artista?.estado] || ESTADOS.pendiente;
  const EstadoActualIcon = estadoActual.icon;
  const opciones         = OPCIONES_POR_ESTADO[artista?.estado] || [];
  const esPendiente      = artista?.estado === "pendiente";
  const opcionSel        = opciones.find(o => o.estado === seleccionado);
  const requiereMotivo   = seleccionado === "rechazado";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(12px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 480, width: "92%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${estadoActual.color}16`, border: `1px solid ${estadoActual.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EstadoActualIcon size={22} color={estadoActual.color} strokeWidth={2} />
          </div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <X size={14} color={C.creamMut} />
          </button>
        </div>

        <div style={{ fontSize: 18, fontWeight: 900, color: C.cream, marginBottom: 4, fontFamily: FD }}>
          {esPendiente ? "Revisar solicitud" : "Cambiar estado del artista"}
        </div>
        <div style={{ fontSize: 13, color: C.creamSub, marginBottom: 6, lineHeight: 1.6 }}>
          <strong style={{ color: C.cream }}>{artista?.nombre_completo}</strong>
          {artista?.nombre_artistico && <span style={{ color: C.gold }}> · ✦ {artista.nombre_artistico}</span>}
        </div>

        {/* Estado actual badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 100, background: `${estadoActual.color}13`, border: `1px solid ${estadoActual.color}32`, marginBottom: 18 }}>
          <EstadoActualIcon size={10} color={estadoActual.color} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 700, color: estadoActual.color, fontFamily: FB }}>Estado actual: {estadoActual.label}</span>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

        {/* Info artista — solo si pendiente */}
        {esPendiente && (
          <div style={{ background: "rgba(255,232,200,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", marginBottom: 18 }}>
            {[
              { label: "Correo",    value: artista?.correo,                 icon: Mail,  color: C.blue   },
              { label: "Teléfono",  value: artista?.telefono || "—",        icon: Phone, color: C.purple },
              { label: "Categoría", value: artista?.categoria_nombre || "—", icon: Star, color: C.gold  },
              { label: "Biografía", value: artista?.biografia,              icon: null,  color: null     },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ display: "flex", gap: 10, marginBottom: 7, fontSize: 12.5, lineHeight: 1.6, alignItems: "flex-start" }}>
                <span style={{ color: C.creamMut, minWidth: 80, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {Icon && <Icon size={10} color={color!} strokeWidth={2} />}{label}:
                </span>
                <span style={{ color: C.creamSub, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Opciones */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: FB }}>Cambiar a:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {opciones.map(({ estado, label, color, icon: Icon, fill }) => {
              const sel = seleccionado === estado;
              return (
                <button key={estado} onClick={() => { setSeleccionado(estado); setMotivo(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 11, cursor: "pointer", border: `1.5px solid ${sel ? `${color}55` : `${color}22`}`, background: sel ? `${color}16` : `${color}07`, transition: "all .15s", textAlign: "left" }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = `${color}12`; }}
                  onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = `${color}07`; }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: sel ? `${color}22` : `${color}10`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: sel ? 700 : 400, color: sel ? color : C.creamSub, fontFamily: FB, flex: 1 }}>{label}</span>
                  {sel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 7px ${color}` }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivo — solo si rechazado */}
        {requiereMotivo && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7, fontFamily: FB }}>Motivo del rechazo (opcional)</div>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza su solicitud..." rows={3}
              style={{ width: "100%", borderRadius: 9, padding: "11px 13px", background: "rgba(204,89,173,0.05)", border: `1px solid rgba(204,89,173,0.30)`, color: C.cream, fontSize: 13, fontFamily: FB, resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.cream; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamSub; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
            Cancelar
          </button>
          <button onClick={() => { if (!seleccionado) return; onConfirm(seleccionado, requiereMotivo ? motivo : undefined); }}
            disabled={!seleccionado}
            style={{
              flex: 1.5, padding: "11px", borderRadius: 10, fontWeight: 800, fontSize: 13.5, cursor: seleccionado ? "pointer" : "not-allowed", fontFamily: FB, transition: "all .15s",
              background: seleccionado && opcionSel ? (opcionSel.fill ? `linear-gradient(135deg, ${opcionSel.color}, ${opcionSel.color}cc)` : `${opcionSel.color}20`) : "rgba(255,232,200,0.05)",
              color: seleccionado && opcionSel ? (opcionSel.fill ? "#000" : opcionSel.color) : C.creamMut,
              border: seleccionado && opcionSel ? `1px solid ${opcionSel.color}45` : `1px solid ${C.border}`,
              boxShadow: seleccionado && opcionSel?.fill ? `0 6px 18px ${opcionSel.color}38` : "none",
              opacity: seleccionado ? 1 : 0.4,
            }}>
            {seleccionado && opcionSel ? `${opcionSel.label} →` : "Selecciona una opción"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ListaArtistas() {
  const navigate = useNavigate();
  const [artistas,      setArtistas]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filtroEstado,  setFiltroEstado]  = useState("todos");
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [pendientes,    setPendientes]    = useState(0);
  const [modalEliminar, setModalEliminar] = useState<any>(null);
  const [modalEstado,   setModalEstado]   = useState<any>(null);

  const cargarArtistas = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/artistas?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data || [];
        setPendientes(data.filter((a: any) => a.estado === "pendiente").length);
        if (filtroEstado !== "todos") data = data.filter((a: any) => a.estado === filtroEstado);
        if (search.trim()) data = data.filter((a: any) =>
          a.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
          a.nombre_artistico?.toLowerCase().includes(search.toLowerCase()) ||
          a.correo?.toLowerCase().includes(search.toLowerCase())
        );
        setArtistas(data);
        setTotal(json.pagination?.total || data.length);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filtroEstado, search]);

  useEffect(() => { cargarArtistas(); }, [cargarArtistas]);

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await fetch(`${API_URL}/api/artistas/${modalEliminar.id_artista}`, { method: "DELETE", headers: { Authorization: `Bearer ${authService.getToken()}` } });
      setModalEliminar(null); cargarArtistas();
    } catch (err) { console.error(err); }
  };

  const handleCambiarEstado = async (nuevoEstado: string, motivo?: string) => {
    if (!modalEstado) return;
    try {
      await fetch(`${API_URL}/api/artistas/${modalEstado.id_artista}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ estado: nuevoEstado, motivo: motivo || null }),
      });
      setModalEstado(null); cargarArtistas();
    } catch (err) { console.error(err); }
  };

  const getInitials    = (nombre: string) => nombre?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "?";
  const avatarColors   = [C.orange, C.blue, C.pink, C.purple, C.gold];
  const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

  const FILTROS = [
    { key: "todos",     label: "Todos",      color: C.orange  },
    { key: "pendiente", label: "Pendientes", color: C.gold    },
    { key: "activo",    label: "Activos",    color: C.green   },
    { key: "inactivo",  label: "Inactivos",  color: "#7B8FA1" },
    { key: "rechazado", label: "Rechazados", color: C.pink    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream }}>
      {modalEliminar && <ModalEliminar artista={modalEliminar} onConfirm={handleEliminar} onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   artista={modalEstado}   onConfirm={handleCambiarEstado} onCancel={() => setModalEstado(null)} />}

      <Sidebar navigate={navigate} pendientes={pendientes} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FB }}>Admin</span>
            <ChevronRight size={12} color={C.creamMut} />
            <span style={{ fontSize: 13, color: C.creamSub, fontFamily: FB }}>Artistas</span>
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(204,89,173,0.12)", border: `1px solid rgba(204,89,173,0.25)`, color: C.pink, fontWeight: 700, fontFamily: FB }}>
              {total} artistas
            </span>
            {pendientes > 0 && (
              <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: `rgba(255,193,16,0.12)`, border: `1px solid rgba(255,193,16,0.30)`, color: C.gold, fontWeight: 700, fontFamily: FB }}>
                ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={cargarArtistas} style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}45`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
              <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            {/* btn-primary pink-purple para artistas */}
            <button onClick={() => navigate("/admin/artistas/crear")} style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, border: "none", color: "white", padding: "7px 15px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px rgba(204,89,173,0.30)`, transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px rgba(204,89,173,0.45)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px rgba(204,89,173,0.30)`; }}>
              <UserPlus size={14} strokeWidth={2.5} /> Nuevo Artista
            </button>
          </div>
        </div>

        <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto" }}>

          {/* Encabezado */}
          <div style={{ marginBottom: 18, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Star size={11} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>Comunidad creativa</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Gestión de{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Artistas</span>
            </h1>
          </div>

          {/* Banner pendientes */}
          {pendientes > 0 && filtroEstado === "todos" && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 16, background: `linear-gradient(135deg, rgba(255,193,16,0.08), rgba(255,132,14,0.05))`, border: `1px solid rgba(255,193,16,0.28)`, borderRadius: 14, animation: "fadeUp .45s ease .05s both" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,193,16,0.16)", border: `1px solid rgba(255,193,16,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={17} color={C.gold} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.gold, fontFamily: FD, marginBottom: 2 }}>{pendientes} solicitud{pendientes > 1 ? "es" : ""} pendiente{pendientes > 1 ? "s" : ""} de aprobación</div>
                <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>Haz clic en el badge de estado para aprobar o rechazar</div>
              </div>
              <button onClick={() => setFiltroEstado("pendiente")} style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(255,193,16,0.16)", border: `1px solid rgba(255,193,16,0.38)`, color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FB, transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.28)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.16)"}>
                Ver pendientes →
              </button>
            </div>
          )}

          {/* Filtros */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "15px 18px", marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .45s ease .08s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px" }}>
              <Search size={13} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre, alias o correo…"
                style={{ border: "none", outline: "none", fontSize: 13, color: C.cream, background: "transparent", width: "100%", fontFamily: FB }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} color={C.creamMut} /></button>}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {FILTROS.map(({ key, label, color }) => {
                const on  = filtroEstado === key;
                const cnt = key === "pendiente" ? pendientes : 0;
                return (
                  <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }}
                    style={{ padding: "7px 14px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}14` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 400, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
                    onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                    onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                    {label}
                    {cnt > 0 && <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: "#000", borderRadius: 9, padding: "0 5px", fontSize: 10, fontWeight: 900 }}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", animation: "fadeUp .5s ease .12s both" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: C.creamMut, gap: 10, fontSize: 13, fontFamily: FB }}>
                <RefreshCw size={16} strokeWidth={1.8} style={{ animation: "spin 1s linear infinite", color: C.pink }} /> Cargando artistas…
              </div>
            ) : artistas.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, gap: 10 }}>
                <Users size={36} strokeWidth={1} style={{ opacity: 0.18, color: C.pink }} />
                <div style={{ fontSize: 14, fontFamily: FD, color: C.creamSub }}>No se encontraron artistas</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.borderBr}` }}>
                    {["Artista", "Contacto", "Categoría", "Comisión", "Obras", "Estado", "Acciones"].map((h, i) => (
                      <th key={h} style={{ textAlign: "left", padding: "13px 15px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.creamSub, background: "rgba(255,232,200,0.03)", fontFamily: FB, borderRight: i < 6 ? `1px solid ${C.border}` : "none" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {artistas.map((artista, i) => {
                    const estado      = ESTADOS[artista.estado] || ESTADOS.pendiente;
                    const EstadoIcon  = estado.icon;
                    const avatarCol   = getAvatarColor(artista.id_artista);
                    const esPendiente = artista.estado === "pendiente";
                    return (
                      <tr key={artista.id_artista}
                        style={{ borderBottom: i < artistas.length - 1 ? `1px solid rgba(255,232,200,0.04)` : "none", transition: "background .12s", background: esPendiente ? "rgba(255,193,16,0.04)" : "transparent" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = esPendiente ? "rgba(255,193,16,0.08)" : C.rowHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = esPendiente ? "rgba(255,193,16,0.04)" : "transparent"}>

                        {/* Artista */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: artista.foto_perfil ? "transparent" : `${avatarCol}16`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${esPendiente ? C.gold + "40" : avatarCol + "30"}` }}>
                              {artista.foto_perfil
                                ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                : <span style={{ fontSize: 14, fontWeight: 900, color: avatarCol, fontFamily: FB }}>{getInitials(artista.nombre_completo)}</span>
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FB }}>{artista.nombre_completo}</div>
                              {artista.nombre_artistico && <div style={{ fontSize: 11, color: C.gold, display: "flex", alignItems: "center", gap: 3, marginTop: 2, fontFamily: FB }}><Star size={8} strokeWidth={2} fill={C.gold} color={C.gold} /> {artista.nombre_artistico}</div>}
                              {artista.matricula && <div style={{ fontSize: 10.5, color: C.creamMut, marginTop: 1, fontFamily: FB }}>{artista.matricula}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {artista.correo && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.creamSub, fontFamily: FB }}><Mail size={10} strokeWidth={1.8} color={C.blue} /><span style={{ maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artista.correo}</span></div>}
                            {artista.telefono && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.creamSub, fontFamily: FB }}><Phone size={10} strokeWidth={1.8} color={C.purple} />{artista.telefono}</div>}
                          </div>
                        </td>

                        {/* Categoría — badge unificado */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          {artista.categoria_nombre
                            ? <span style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 100, background: "rgba(121,170,245,0.10)", border: `1px solid rgba(121,170,245,0.22)`, color: C.blue, fontWeight: 700, fontFamily: FB }}>{artista.categoria_nombre}</span>
                            : <span style={{ color: C.creamMut, fontSize: 13 }}>—</span>}
                        </td>

                        {/* Comisión — naranja para probar */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.orange, fontFamily: FB }}>
                            {artista.porcentaje_comision || 15}%
                          </span>
                        </td>

                        {/* Obras */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.creamSub, fontFamily: FB }}>
                            <ImageIcon size={12} color={C.creamMut} strokeWidth={1.8} />{artista.total_obras || 0}
                          </div>
                        </td>

                        {/* Estado — badge clickeable */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <button onClick={() => setModalEstado(artista)} title="Cambiar estado"
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 100, background: `${estado.color}12`, border: `1px solid ${estado.color}30`, color: estado.color, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}24`}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}12`}>
                            <EstadoIcon size={11} strokeWidth={2.5} />
                            {estado.label}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "13px 15px" }}>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {esPendiente && (
                              <button onClick={() => setModalEstado(artista)} title="Revisar solicitud"
                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 8, background: "rgba(255,193,16,0.14)", border: `1px solid rgba(255,193,16,0.32)`, color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.26)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.14)"}>
                                <Bell size={10} /> Revisar
                              </button>
                            )}
                            {[
                              { icon: Eye,    color: C.purple, action: () => navigate(`/admin/artistas/${artista.id_artista}`),        title: "Ver detalle" },
                              { icon: Edit2,  color: C.blue,   action: () => navigate(`/admin/artistas/editar/${artista.id_artista}`), title: "Editar"      },
                              { icon: Trash2, color: C.pink,   action: () => setModalEliminar(artista),                                title: "Eliminar"    },
                            ].map(({ icon: Icon, color, action, title }) => (
                              <button key={title} onClick={action} title={title} style={{ width: 32, height: 32, borderRadius: 8, background: `${color}10`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}24`; (e.currentTarget as HTMLElement).style.borderColor = `${color}48`; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${color}22`; }}>
                                <Icon size={13} color={color} strokeWidth={2} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, animation: "fadeUp .5s ease .15s both" }}>
              <div style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB }}>
                Página <span style={{ color: C.cream, fontWeight: 700 }}>{page}</span> de <span style={{ color: C.cream, fontWeight: 700 }}>{totalPages}</span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1 }}>
                  <ChevronLeft size={14} color={C.creamMut} strokeWidth={2} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  const isActive = p === page;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isActive ? `${C.pink}55` : C.border}`, background: isActive ? `linear-gradient(135deg, ${C.pink}, ${C.purple})` : "transparent", color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 800 : 400, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: isActive ? `0 4px 14px rgba(204,89,173,0.35)` : "none", transition: "all .15s" }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1 }}>
                  <ChevronRight size={14} color={C.creamMut} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder  { color:rgba(255,232,200,0.20); font-family:${FB}; }
        textarea { transition: border-color .15s; }
        textarea:focus { border-color: rgba(204,89,173,0.55) !important; }
        textarea::placeholder { color:rgba(255,232,200,0.20); font-family:${FB}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.10); border-radius:8px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,200,150,0.18); }
      `}</style>
    </div>
  );
}