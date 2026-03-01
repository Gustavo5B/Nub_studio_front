// src/pages/private/admin/ListaObras.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Settings, Plus, Search, Edit2, Trash2,
  CheckCircle, Clock, XCircle, Package, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, X,
  RefreshCw, Image as ImageIcon, LogOut, Layers, Star
} from "lucide-react";
import { obraService } from "../../../services/obraService";
import { authService } from "../../../services/authService";

// ─────────────────────────────────────────────────────────────
// PALETA OFICIAL — misma que AdminDashboard
// ─────────────────────────────────────────────────────────────
const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  violet:   "#D363FF",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",   // publicada
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
  rowHover: "rgba(255,232,200,0.035)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Estados con verde para "publicada" ───────────────────────
const ESTADOS: Record<string, { label: string; color: string; icon: any }> = {
  pendiente: { label: "Pendiente", color: C.gold,   icon: Clock       },
  publicada: { label: "Publicada", color: C.green,  icon: CheckCircle }, // ← VERDE
  rechazada: { label: "Rechazada", color: C.pink,   icon: XCircle     },
  agotada:   { label: "Agotada",   color: C.creamMut, icon: Package   },
};

const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:LayoutDashboard, color:C.orange,  path:"/admin"          },
  { id:"obras",     label:"Obras",      icon:Layers,          color:C.blue,    path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",   icon:Users,           color:C.pink,    path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",     icon:ShoppingBag,     color:C.gold,    path:"/admin"          },
  { id:"reportes",  label:"Reportes",   icon:BarChart2,       color:C.purple,  path:"/admin"          },
];

// ─────────────────────────────────────────────────────────────
// LOGO PROFESIONAL SVG — idéntico al AdminDashboard
// ─────────────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgLogoL" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={C.orange} />
          <stop offset="55%" stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.purple} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgLogoL)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgLogoL)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgLogoL)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="8" r="2.5" fill={C.gold} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR — igual al AdminDashboard
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

      {/* Barra decorativa top */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})`, flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 20 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, lineHeight: 1.1, fontFamily: FD, letterSpacing: "-0.02em" }}>Nu-B Studio</div>
            <div style={{ fontSize: 10, color: C.orange, marginTop: 4, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FB, fontWeight: 700 }}>Panel Admin</div>
          </div>
        </div>

        {/* User card */}
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

      {/* Nav */}
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
              <span style={{ fontSize: 14.5, fontWeight: on ? 700 : 500, color: on ? C.cream : C.creamSub, transition: "color .15s", fontFamily: FB }}>
                {label}
              </span>
              {on && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 9px ${color}` }} />}
            </button>
          );
        })}
      </div>

      {/* Bottom */}
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
// MODAL ELIMINAR
// ─────────────────────────────────────────────────────────────
function ModalEliminar({ obra, onConfirm, onCancel }: { obra: any; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,5,18,0.80)", backdropFilter: "blur(10px)" }}>
      <div style={{
        background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`,
        borderRadius: 22, padding: "34px", maxWidth: 420, width: "90%",
        boxShadow: "0 40px 80px rgba(0,0,0,0.7)", backdropFilter: "blur(40px)",
        animation: "modalIn .25s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: FB,
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${C.pink}18`, border: `1px solid ${C.pink}35`,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          boxShadow: `0 4px 18px ${C.pink}25`,
        }}>
          <AlertTriangle size={24} color={C.pink} strokeWidth={2} />
        </div>

        <div style={{ fontSize: 20, fontWeight: 900, color: C.cream, marginBottom: 10, fontFamily: FD }}>¿Eliminar obra?</div>
        <div style={{ fontSize: 14, color: C.creamSub, marginBottom: 30, lineHeight: 1.7, fontFamily: FB }}>
          Vas a eliminar <strong style={{ color: C.cream }}>"{obra?.titulo}"</strong>. Esta acción no se puede deshacer.
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.pink}30, transparent)`, marginBottom: 22 }} />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", borderRadius: 11, border: `1px solid ${C.border}`,
            background: "rgba(255,232,200,0.04)", color: C.creamSub,
            fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FB, transition: "all .15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
          >
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px", borderRadius: 11, border: "none",
            background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
            color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB,
            boxShadow: `0 6px 22px ${C.pink}38`, transition: "transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px ${C.pink}50`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 22px ${C.pink}38`; }}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL CAMBIAR ESTADO
// ─────────────────────────────────────────────────────────────
function ModalEstado({ obra, onConfirm, onCancel }: { obra: any; onConfirm: (estado: string) => void; onCancel: () => void }) {
  const [selected, setSelected] = useState(obra?.estado || "pendiente");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,5,18,0.80)", backdropFilter: "blur(10px)" }}>
      <div style={{
        background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`,
        borderRadius: 22, padding: "32px", maxWidth: 400, width: "90%",
        boxShadow: "0 40px 80px rgba(0,0,0,0.7)", backdropFilter: "blur(40px)",
        animation: "modalIn .25s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: C.cream, fontFamily: FD }}>Cambiar estado</div>
          <button onClick={onCancel} style={{
            width: 32, height: 32, borderRadius: 9, background: "rgba(255,232,200,0.05)",
            border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            transition: "border-color .15s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
          >
            <X size={15} color={C.creamMut} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: C.creamSub, marginBottom: 20, fontFamily: FB }}>
          Obra: <strong style={{ color: C.cream }}>{obra?.titulo}</strong>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.orange}30, transparent)`, marginBottom: 18 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          {Object.entries(ESTADOS).map(([key, { label, color, icon: Icon }]) => {
            const on = selected === key;
            return (
              <button key={key} onClick={() => setSelected(key)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 15px", borderRadius: 13,
                border: `1.5px solid ${on ? `${color}55` : C.border}`,
                background: on ? `${color}14` : "rgba(255,232,200,0.02)",
                cursor: "pointer", textAlign: "left", fontFamily: FB, transition: "all .15s",
              }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: on ? `0 2px 10px ${color}30` : "none",
                }}>
                  <Icon size={15} color={color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB }}>
                  {label}
                </span>
                {on && <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 9px ${color}` }} />}
              </button>
            );
          })}
        </div>

        <button onClick={() => onConfirm(selected)} style={{
          width: "100%", padding: "13px", borderRadius: 11, border: "none",
          background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
          color: "white", fontWeight: 700, fontSize: 14.5,
          cursor: "pointer", fontFamily: FB,
          boxShadow: `0 6px 22px ${C.orange}40`, transition: "transform .15s, box-shadow .15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${C.orange}55`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 22px ${C.orange}40`; }}
        >
          Guardar cambio
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function ListaObras() {
  const navigate = useNavigate();
  const [obras,           setObras]           = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [filtroEstado,    setFiltroEstado]    = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [categorias,      setCategorias]      = useState<any[]>([]);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [total,           setTotal]           = useState(0);
  const [modalEliminar,   setModalEliminar]   = useState<any>(null);
  const [modalEstado,     setModalEstado]     = useState<any>(null);

  const cargarObras = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "10", solo_publicadas: "false" };
      if (filtroCategoria !== "todas") params.categoria = filtroCategoria;
      const res  = await fetch(`${API_URL}/api/obras?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        let data = json.data || [];
        if (filtroEstado !== "todos") data = data.filter((o: any) => o.estado === filtroEstado);
        if (search.trim()) data = data.filter((o: any) =>
          o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
          o.artista_nombre?.toLowerCase().includes(search.toLowerCase())
        );
        setObras(data);
        setTotal(json.pagination?.total || data.length);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filtroEstado, filtroCategoria, search]);

  useEffect(() => { cargarObras(); }, [cargarObras]);
  useEffect(() => {
    obraService.getCategorias().then(r => setCategorias(r.categorias || [])).catch(() => {});
  }, []);

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await fetch(`${API_URL}/api/obras/${modalEliminar.id_obra}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      setModalEliminar(null); cargarObras();
    } catch (err) { console.error(err); }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!modalEstado) return;
    try {
      await fetch(`${API_URL}/api/obras/${modalEstado.id_obra}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ ...modalEstado, estado: nuevoEstado }),
      });
      setModalEstado(null); cargarObras();
    } catch (err) { console.error(err); }
  };

  const FILTROS = [
    { key: "todos", label: "Todos", color: C.orange },
    ...Object.entries(ESTADOS).map(([k, v]) => ({ key: k, label: v.label, color: v.color })),
  ];

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: C.bg, fontFamily: FB, color: C.cream, position: "relative",
    }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", top: -140, right: -100, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}09, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -120, left: 180, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", right: "25%", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${C.blue}06, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      {modalEliminar && <ModalEliminar obra={modalEliminar} onConfirm={handleEliminar} onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   obra={modalEstado}   onConfirm={handleCambiarEstado} onCancel={() => setModalEstado(null)} />}

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Breadcrumb */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 13px", borderRadius: 100,
              background: `linear-gradient(135deg, ${C.blue}20, ${C.purple}10)`,
              border: `1px solid ${C.blue}38`,
              fontSize: 11, fontWeight: 700, color: C.blue,
              letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: FB,
            }}>
              <Layers size={11} /> Obras
            </div>
            <ChevronRight size={13} color={C.creamMut} />
            <span style={{ fontSize: 14, color: C.creamSub, fontFamily: FB, fontWeight: 500 }}>Gestión</span>
            <span style={{
              fontSize: 12, padding: "3px 10px", borderRadius: 100,
              background: `${C.blue}15`, border: `1px solid ${C.blue}30`,
              color: C.blue, fontWeight: 700, fontFamily: FB,
            }}>
              {total} obras
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={cargarObras} style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}50`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
            >
              <RefreshCw size={14} color={C.creamMut} strokeWidth={1.8}
                style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>

            <button onClick={() => navigate("/admin/obras/crear")} style={{
              display: "flex", alignItems: "center", gap: 7,
              background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
              border: "none", color: "white", padding: "9px 18px", borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB,
              boxShadow: `0 6px 22px ${C.orange}40`, transition: "transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${C.orange}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 22px ${C.orange}40`; }}
            >
              <Plus size={15} strokeWidth={2.5} /> Nueva Obra
            </button>
          </div>
        </div>

        <main style={{ flex: 1, padding: "26px 32px", overflowY: "auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 22, animation: "fadeUp .45s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Star size={13} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>
                Catálogo de arte
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Gestión de{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Obras
              </span>
            </h1>
          </div>

          {/* Filtros */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "18px 20px", marginBottom: 18,
            display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
            animation: "fadeUp .5s ease .05s both",
          }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220,
              background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 14px", transition: "border-color .15s",
            }}
              onFocus={() => {}}
            >
              <Search size={14} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por título o artista…"
                style={{
                  border: "none", outline: "none",
                  fontSize: 13.5, color: C.cream,
                  background: "transparent", width: "100%", fontFamily: FB,
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                  <X size={13} color={C.creamMut} />
                </button>
              )}
            </div>

            {/* Categoría select */}
            <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPage(1); }}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "rgba(255,232,200,0.04)",
                fontSize: 13, color: C.creamSub, cursor: "pointer", fontFamily: FB, outline: "none",
                transition: "border-color .15s",
              }}>
              <option value="todas">Todas las categorías</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>

            {/* Estado pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FILTROS.map(({ key, label, color }) => {
                const on = filtroEstado === key;
                return (
                  <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }} style={{
                    padding: "8px 16px", borderRadius: 100,
                    border: `1.5px solid ${on ? `${color}55` : C.border}`,
                    background: on ? `${color}15` : "rgba(255,232,200,0.03)",
                    color: on ? color : C.creamSub,
                    fontWeight: on ? 700 : 500, fontSize: 12.5,
                    cursor: "pointer", fontFamily: FB, transition: "all .15s",
                    boxShadow: on ? `0 2px 12px ${color}25` : "none",
                  }}
                    onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                    onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table container */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 18, overflow: "hidden", backdropFilter: "blur(20px)",
            animation: "fadeUp .5s ease .1s both",
          }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: C.creamMut, gap: 12, fontSize: 13.5, fontFamily: FB }}>
                <RefreshCw size={18} strokeWidth={1.8} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
                Cargando obras…
              </div>
            ) : obras.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, color: C.creamMut, gap: 12 }}>
                <ImageIcon size={40} strokeWidth={1} style={{ opacity: 0.2, color: C.blue }} />
                <div style={{ fontSize: 14.5, fontFamily: FD, color: C.creamSub }}>No se encontraron obras</div>
                <button onClick={() => navigate("/admin/obras/crear")} style={{
                  fontSize: 13, color: C.orange, background: `${C.orange}12`,
                  border: `1px solid ${C.orange}35`, borderRadius: 8,
                  padding: "7px 16px", cursor: "pointer", fontWeight: 700, fontFamily: FB,
                }}>
                  + Crear primera obra
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.borderBr}` }}>
                    {["Obra", "Artista", "Categoría", "Precio", "Estado", "Vistas", "Acciones"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "14px 16px",
                        fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em",
                        textTransform: "uppercase", color: C.creamMut,
                        background: "rgba(255,232,200,0.025)",
                        fontFamily: FB,
                        borderRight: i < 6 ? `1px solid ${C.border}` : "none",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {obras.map((obra, i) => {
                    const estado     = ESTADOS[obra.estado] || ESTADOS.pendiente;
                    const EstadoIcon = estado.icon;
                    return (
                      <tr key={obra.id_obra}
                        style={{
                          borderBottom: i < obras.length - 1 ? `1px solid rgba(255,232,200,0.05)` : "none",
                          transition: "background .12s",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.rowHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        {/* Obra */}
                        <td style={{ padding: "14px 16px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 11,
                              background: `${C.blue}15`, border: `1px solid ${C.blue}30`,
                              overflow: "hidden", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: `0 2px 10px ${C.blue}18`,
                            }}>
                              {obra.imagen_principal
                                ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                : <ImageIcon size={17} color={C.blue} strokeWidth={1.8} />
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.cream, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>
                                {obra.titulo}
                              </div>
                              <div style={{ fontSize: 11.5, color: C.creamMut, marginTop: 2, fontFamily: FB }}>{obra.anio_creacion || "—"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Artista */}
                        <td style={{ padding: "14px 16px", fontSize: 13.5, color: C.creamSub, fontWeight: 500, fontFamily: FB, borderRight: `1px solid ${C.border}` }}>
                          {obra.artista_alias || obra.artista_nombre || "—"}
                        </td>

                        {/* Categoría */}
                        <td style={{ padding: "14px 16px", borderRight: `1px solid ${C.border}` }}>
                          <span style={{
                            fontSize: 12, padding: "5px 12px", borderRadius: 20,
                            background: `${C.blue}15`, border: `1px solid ${C.blue}28`,
                            color: C.blue, fontWeight: 700, fontFamily: FB,
                          }}>
                            {obra.categoria_nombre || "—"}
                          </span>
                        </td>

                        {/* Precio */}
                        <td style={{ padding: "14px 16px", borderRight: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 14.5, fontWeight: 900, color: C.gold, fontFamily: FD }}>
                            {obra.precio_minimo
                              ? `$${Number(obra.precio_minimo).toLocaleString("es-MX")}`
                              : obra.precio_base
                              ? `$${Number(obra.precio_base).toLocaleString("es-MX")}`
                              : "—"
                            }
                          </span>
                        </td>

                        {/* Estado — clic para cambiar */}
                        <td style={{ padding: "14px 16px", borderRight: `1px solid ${C.border}` }}>
                          <button onClick={() => setModalEstado(obra)} title="Click para cambiar estado"
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "6px 13px", borderRadius: 20,
                              background: `${estado.color}15`, border: `1px solid ${estado.color}35`,
                              color: estado.color, fontSize: 12, fontWeight: 800,
                              cursor: "pointer", fontFamily: FB, transition: "all .15s",
                              boxShadow: estado.color === C.green ? `0 0 10px ${C.green}25` : "none",
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}28`}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}15`}
                          >
                            <EstadoIcon size={12} strokeWidth={2.5} />
                            {estado.label}
                          </button>
                        </td>

                        {/* Vistas */}
                        <td style={{ padding: "14px 16px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.creamSub, fontFamily: FB }}>
                            <Eye size={13} color={C.purple} strokeWidth={1.8} />
                            {obra.vistas || 0}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[
                              { icon: Edit2,  color: C.blue, action: () => navigate(`/admin/obras/editar/${obra.id_obra}`), title: "Editar"   },
                              { icon: Trash2, color: C.pink, action: () => setModalEliminar(obra),                         title: "Eliminar" },
                            ].map(({ icon: Icon, color, action, title }) => (
                              <button key={title} onClick={action} title={title} style={{
                                width: 34, height: 34, borderRadius: 9,
                                background: `${color}12`, border: `1px solid ${color}25`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all .15s",
                              }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}28`; (e.currentTarget as HTMLElement).style.borderColor = `${color}55`; (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${color}30`; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${color}25`; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                              >
                                <Icon size={14} color={color} strokeWidth={2} />
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
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18,
              animation: "fadeUp .5s ease .15s both",
            }}>
              <div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB }}>
                Página <span style={{ color: C.cream, fontWeight: 700 }}>{page}</span> de <span style={{ color: C.cream, fontWeight: 700 }}>{totalPages}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{
                    width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`,
                    background: "rgba(255,232,200,0.03)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1, transition: "all .15s",
                  }}>
                  <ChevronLeft size={15} color={C.creamMut} strokeWidth={2} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  const isActive = p === page;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 36, height: 36, borderRadius: 9,
                      border: `1px solid ${isActive ? `${C.orange}60` : C.border}`,
                      background: isActive ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "rgba(255,232,200,0.03)",
                      color: isActive ? "white" : C.creamSub,
                      fontWeight: isActive ? 800 : 500, fontSize: 13.5,
                      cursor: "pointer", fontFamily: FB,
                      boxShadow: isActive ? `0 4px 16px ${C.orange}40` : "none",
                      transition: "all .15s",
                    }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{
                    width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`,
                    background: "rgba(255,232,200,0.03)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1, transition: "all .15s",
                  }}>
                  <ChevronRight size={15} color={C.creamMut} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.22); font-family: ${FB}; }
        select option { background: #100D1C; color: ${C.cream}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}