// src/pages/private/admin/ListaObras.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Settings, Search, Edit2, Trash2,
  CheckCircle, Clock, XCircle, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, X,
  RefreshCw, Image as ImageIcon, LogOut, Layers, Star,
} from "lucide-react";
import { obraService } from "../../../services/obraService";
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

// Playfair Display → títulos y números | DM Sans → todo lo demás
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ESTADOS: Record<string, { label: string; color: string; icon: any }> = {
  pendiente: { label: "Pendiente", color: C.gold,  icon: Clock       },
  publicada: { label: "Publicada", color: C.green, icon: CheckCircle },
  rechazada: { label: "Rechazada", color: C.pink,  icon: XCircle     },
};

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       path:"/admin"          },
];

// ── Sidebar — idéntico al AdminDashboard ──────────────────────────────────────
function Sidebar({ navigate }: { navigate: any }) {
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
      {/* Línea de colores — patrón unificado */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      {/* Logo + usuario */}
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

      {/* Nav links */}
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
function ModalEliminar({ obra, onConfirm, onCancel }: { obra: any; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 400, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: `rgba(204,89,173,0.14)`, border: `1px solid rgba(204,89,173,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <AlertTriangle size={22} color={C.pink} strokeWidth={2} />
        </div>
        {/* Playfair Display para título del modal */}
        <div style={{ fontSize: 19, fontWeight: 900, color: C.cream, marginBottom: 10, fontFamily: FD }}>¿Eliminar obra?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 26, lineHeight: 1.7, fontFamily: FB }}>
          Vas a eliminar <strong style={{ color: C.cream }}>"{obra?.titulo}"</strong>. Esta acción no se puede deshacer.
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
            Cancelar
          </button>
          {/* btn-primary: gradiente pink-purple para acción destructiva */}
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px rgba(204,89,173,0.35)`, transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 26px rgba(204,89,173,0.50)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(204,89,173,0.35)`; }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Estado ───────────────────────────────────────────────────────────────
function ModalEstado({ obra, onConfirm, onCancel }: { obra: any; onConfirm: (estado: string, motivo?: string) => void; onCancel: () => void }) {
  const [selected, setSelected] = useState(obra?.estado || "pendiente");
  const [motivo,   setMotivo]   = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "28px", maxWidth: 380, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.cream, fontFamily: FD }}>Cambiar estado</div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <X size={14} color={C.creamMut} />
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 18, fontFamily: FB }}>
          Obra: <span style={{ color: C.creamSub, fontWeight: 600 }}>{obra?.titulo}</span>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
          {Object.entries(ESTADOS).map(([key, { label, color, icon: Icon }]) => {
            const on = selected === key;
            return (
              <button key={key} onClick={() => setSelected(key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 11, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}12` : "rgba(255,232,200,0.02)", cursor: "pointer", textAlign: "left", fontFamily: FB, transition: "all .15s" }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}16`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB, flex: 1 }}>{label}</span>
                {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 7px ${color}` }} />}
              </button>
            );
          })}
        </div>

        {/* Motivo rechazo — solo si estado = rechazada */}
        {selected === "rechazada" && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7, fontFamily: FB }}>
              Motivo de rechazo
            </label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza la obra..."
              rows={3}
              style={{ width: "100%", padding: "11px 13px", borderRadius: 9, border: `1px solid rgba(204,89,173,0.35)`, background: "rgba(204,89,173,0.05)", color: C.cream, fontSize: 13, fontFamily: FB, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* btn-primary: gradiente naranja-magenta */}
        <button onClick={() => onConfirm(selected, selected === "rechazada" ? motivo : undefined)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px ${C.orange}38`, transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px ${C.orange}50`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.orange}38`; }}>
          Guardar cambio
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
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
      const res = await fetch(`${API_URL}/api/obras?${new URLSearchParams(params)}`, {
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

  const handleCambiarEstado = async (nuevoEstado: string, motivo?: string) => {
    if (!modalEstado) return;
    try {
      await fetch(`${API_URL}/api/obras/${modalEstado.id_obra}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ estado: nuevoEstado, motivo_rechazo: motivo || null }),
      });
      setModalEstado(null); cargarObras();
    } catch (err) { console.error(err); }
  };

  const FILTROS = [
    { key: "todos",    label: "Todos",    color: C.orange },
    ...Object.entries(ESTADOS).map(([k, v]) => ({ key: k, label: v.label, color: v.color })),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FB, color: C.cream }}>
      {modalEliminar && <ModalEliminar obra={modalEliminar} onConfirm={handleEliminar} onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   obra={modalEstado}   onConfirm={handleCambiarEstado} onCancel={() => setModalEstado(null)} />}

      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar — mismo estilo que AdminDashboard */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FB }}>Admin</span>
            <ChevronRight size={12} color={C.creamMut} />
            <span style={{ fontSize: 13, color: C.creamSub, fontFamily: FB }}>Obras</span>
            {/* Badge con total — borderRadius:100, patrón unificado */}
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(121,170,245,0.12)", border: `1px solid rgba(121,170,245,0.25)`, color: C.blue, fontWeight: 700, fontFamily: FB }}>
              {total} obras
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={cargarObras} style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}45`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
              <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>

          </div>
        </div>

        <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto" }}>

          {/* Encabezado de página */}
          <div style={{ marginBottom: 20, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Star size={11} color={C.gold} fill={C.gold} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: FB }}>Catálogo de arte</span>
            </div>
            {/* Playfair Display para el h1 */}
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
              Gestión de{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Obras
              </span>
            </h1>
          </div>

          {/* Filtros */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .45s ease .05s both" }}>
            {/* Buscador */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", transition: "border-color .15s" }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
              <Search size={13} color={C.creamMut} strokeWidth={1.8} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por título o artista…"
                style={{ border: "none", outline: "none", fontSize: 13, color: C.cream, background: "transparent", width: "100%", fontFamily: FB }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={12} color={C.creamMut} />
                </button>
              )}
            </div>

            {/* Selector categoría */}
            <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPage(1); }}
              style={{ padding: "9px 13px", borderRadius: 9, border: `1px solid ${C.border}`, background: "rgba(255,232,200,0.04)", fontSize: 13, color: C.creamSub, cursor: "pointer", fontFamily: FB, outline: "none" }}>
              <option value="todas">Todas las categorías</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>

            {/* Filtros de estado — badges borderRadius:100, patrón unificado */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {FILTROS.map(({ key, label, color }) => {
                const on = filtroEstado === key;
                return (
                  <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }} style={{ padding: "7px 14px", borderRadius: 100, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}14` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 400, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
                    onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                    onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", animation: "fadeUp .5s ease .1s both" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: C.creamMut, gap: 10, fontSize: 13, fontFamily: FB }}>
                <RefreshCw size={16} strokeWidth={1.8} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
                Cargando obras…
              </div>
            ) : obras.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, color: C.creamMut, gap: 10 }}>
                <ImageIcon size={36} strokeWidth={1} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: 14, fontFamily: FD, color: C.creamSub }}>No se encontraron obras</div>
               
<div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB }}>
  No hay obras registradas aún
</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.borderBr}` }}>
                    {["Obra", "Artista", "Categoría", "Precio", "Estado", "Vistas", "Acciones"].map((h, i) => (
                      <th key={h} style={{ textAlign: "left", padding: "13px 15px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.creamSub, background: "rgba(255,232,200,0.03)", fontFamily: FB, borderRight: i < 6 ? `1px solid ${C.border}` : "none" }}>
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
                        style={{ borderBottom: i < obras.length - 1 ? `1px solid rgba(255,232,200,0.04)` : "none", transition: "background .12s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.rowHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>

                        {/* Obra */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(121,170,245,0.10)", border: `1px solid rgba(121,170,245,0.22)`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {obra.imagen_principal
                                ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                : <ImageIcon size={15} color={C.blue} strokeWidth={1.8} />
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{obra.titulo}</div>
                              <div style={{ fontSize: 11, color: C.creamMut, marginTop: 2, fontFamily: FB }}>{obra.anio_creacion || "—"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Artista */}
                        <td style={{ padding: "13px 15px", fontSize: 13, color: C.creamSub, fontFamily: FB, borderRight: `1px solid ${C.border}` }}>
                          {obra.artista_alias || obra.artista_nombre || "—"}
                        </td>

                        {/* Categoría — badge unificado */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 100, background: "rgba(121,170,245,0.10)", border: `1px solid rgba(121,170,245,0.22)`, color: C.blue, fontWeight: 700, fontFamily: FB }}>
                            {obra.categoria_nombre || "—"}
                          </span>
                        </td>

                        {/* Precio — DM Sans, color cream, formato limpio */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.cream, fontFamily: FB }}>
                            {obra.precio_minimo
                              ? `$${Number(obra.precio_minimo).toLocaleString("es-MX")}`
                              : obra.precio_base
                              ? `$${Number(obra.precio_base).toLocaleString("es-MX")}`
                              : <span style={{ color: C.creamMut }}>—</span>
                            }
                          </span>
                        </td>

                        {/* Estado — badge clickeable */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <button onClick={() => setModalEstado(obra)} title="Cambiar estado"
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 100, background: `${estado.color}12`, border: `1px solid ${estado.color}30`, color: estado.color, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}24`}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}12`}>
                            <EstadoIcon size={11} strokeWidth={2.5} />
                            {estado.label}
                          </button>
                        </td>

                        {/* Vistas */}
                        <td style={{ padding: "13px 15px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.creamSub, fontFamily: FB }}>
                            <Eye size={12} color={C.creamMut} strokeWidth={1.8} />
                            {obra.vistas || 0}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "13px 15px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[
                              { icon: Edit2,  color: C.blue, action: () => navigate(`/admin/obras/editar/${obra.id_obra}`), title: "Editar"   },
                              { icon: Trash2, color: C.pink, action: () => setModalEliminar(obra),                         title: "Eliminar" },
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
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1, transition: "border-color .15s" }}
                  onMouseEnter={e => { if (page !== 1) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                  <ChevronLeft size={14} color={C.creamMut} strokeWidth={2} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  const isActive = p === page;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isActive ? `${C.orange}55` : C.border}`, background: isActive ? `linear-gradient(135deg, ${C.orange}, ${C.magenta})` : "transparent", color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 800 : 400, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: isActive ? `0 4px 14px ${C.orange}35` : "none", transition: "all .15s" }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1, transition: "border-color .15s" }}
                  onMouseEnter={e => { if (page !== totalPages) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
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
        textarea::placeholder { color:rgba(255,232,200,0.20); font-family:${FB}; }
        select option { background:#100D1C; color:${C.cream}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.10); border-radius:8px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,200,150,0.18); }
      `}</style>
    </div>
  );
}