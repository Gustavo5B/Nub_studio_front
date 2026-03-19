// src/pages/private/admin/ListaObras.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Search, Edit2, Trash2, CheckCircle, Clock, XCircle, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, X, RefreshCw,
  Image as ImageIcon, Star, Layers, DollarSign,
} from "lucide-react";
import { obraService } from "../../../services/obraService";
import { authService } from "../../../services/authService";

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
  bgDeep:   "#070510",
  bg:       "#0C0812",
  card:     "rgba(18,13,30,0.95)",
  cardHov:  "rgba(22,16,36,0.98)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FD = "'Cormorant Garamond', serif";
const FB = "'Outfit', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface ObraItem {
  id_obra:           number;
  titulo:            string;
  estado:            string;
  imagen_principal?: string;
  artista_nombre?:   string;
  artista_alias?:    string;
  categoria_nombre?: string;
  precio_base?:      number;
  precio_minimo?:    number;
  anio_creacion?:    number | string;
  vistas?:           number;
}

interface CategoriaItem { id_categoria: number; nombre: string }
interface EstadoConfig   { label: string; color: string; icon: LucideIcon }

const ESTADOS: Record<string, EstadoConfig> = {
  pendiente: { label: "Pendiente", color: C.gold,  icon: Clock       },
  publicada: { label: "Publicada", color: C.green, icon: CheckCircle },
  rechazada: { label: "Rechazada", color: C.pink,  icon: XCircle     },
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
function ObraCardSkeleton() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 158, background: "rgba(255,232,200,0.04)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,200,150,0.06),transparent)", animation: "shimmer 1.6s infinite" }} />
      </div>
      <div style={{ padding: "14px 14px 14px" }}>
        <div style={{ height: 16, borderRadius: 6, background: "rgba(255,232,200,0.06)", marginBottom: 8, width: "75%" }} />
        <div style={{ height: 11, borderRadius: 5, background: "rgba(255,232,200,0.04)", marginBottom: 12, width: "50%" }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div style={{ height: 22, borderRadius: 100, background: "rgba(255,232,200,0.04)", width: 80 }} />
          <div style={{ height: 22, borderRadius: 100, background: "rgba(255,232,200,0.04)", width: 70 }} />
        </div>
        <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 26, borderRadius: 100, background: "rgba(255,232,200,0.04)", width: 80 }} />
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.04)" }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.04)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Eliminar ─────────────────────────────────────────────────────────────
function ModalEliminar({ obra, onConfirm, onCancel }: {
  obra: ObraItem; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.88)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 400, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(204,89,173,0.14)", border: `1px solid rgba(204,89,173,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <AlertTriangle size={22} color={C.pink} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.cream, marginBottom: 8, fontFamily: FD }}>¿Eliminar obra?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 6, lineHeight: 1.7 }}>
          Vas a eliminar <strong style={{ color: C.cream }}>"{obra.titulo}"</strong>.
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 24 }}>Esta acción no se puede deshacer.</div>
        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.cream; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px rgba(204,89,173,0.35)`, transition: "transform .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Estado ──────────────────────────────────────────────────────────────
function ModalEstado({ obra, onConfirm, onCancel }: {
  obra: ObraItem; onConfirm: (estado: string, motivo?: string) => void; onCancel: () => void;
}) {
  const [selected, setSelected] = useState(obra.estado || "pendiente");
  const [motivo,   setMotivo]   = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.88)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "28px", maxWidth: 380, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.cream, fontFamily: FD }}>Cambiar estado</div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color={C.creamMut} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 18 }}>
          Obra: <span style={{ color: C.creamSub, fontWeight: 600 }}>{obra.titulo}</span>
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
          {Object.entries(ESTADOS).map(([key, { label, color, icon: Icon }]) => {
            const on = selected === key;
            return (
              <button key={key} onClick={() => setSelected(key)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 11, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}12` : "rgba(255,232,200,0.02)", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}16`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB, flex: 1 }}>{label}</span>
                {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 7px ${color}` }} />}
              </button>
            );
          })}
        </div>
        {selected === "rechazada" && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>
              Motivo de rechazo
            </label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza la obra..." rows={3}
              style={{ width: "100%", padding: "11px 13px", borderRadius: 9, border: `1px solid rgba(204,89,173,0.35)`, background: "rgba(204,89,173,0.05)", color: C.cream, fontSize: 13, fontFamily: FB, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        )}
        <button onClick={() => onConfirm(selected, selected === "rechazada" ? motivo : undefined)}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FB, boxShadow: `0 6px 20px ${C.orange}38`, transition: "transform .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
          Guardar cambio
        </button>
      </div>
    </div>
  );
}

// ── Obra Card ─────────────────────────────────────────────────────────────────
function ObraCard({ obra, onEditar, onEliminar, onCambiarEstado }: {
  obra: ObraCard_Props;
  onEditar: () => void;
  onEliminar: () => void;
  onCambiarEstado: () => void;
}) {
  const estado     = ESTADOS[obra.estado] || ESTADOS.pendiente;
  const EstadoIcon = estado.icon;
  const isPend     = obra.estado === "pendiente";
  const precio     = obra.precio_minimo ?? obra.precio_base;

  return (
    <div style={{ background: C.card, border: `1px solid ${isPend ? "rgba(255,193,16,0.22)" : C.border}`, borderRadius: 16, overflow: "hidden", transition: "all .2s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.45)"; el.style.borderColor = isPend ? "rgba(255,193,16,0.40)" : C.borderHi; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; el.style.borderColor = isPend ? "rgba(255,193,16,0.22)" : C.border; }}>

      {/* Image */}
      <div style={{ height: 158, background: "rgba(121,170,245,0.06)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        {obra.imagen_principal
          ? <img src={obra.imagen_principal} alt={obra.titulo}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <ImageIcon size={28} color="rgba(121,170,245,0.30)" strokeWidth={1.2} />
              <span style={{ fontSize: 10, color: C.creamMut, fontFamily: FB }}>Sin imagen</span>
            </div>
        }

        {/* Overlay gradient bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(to top, rgba(7,5,18,0.85), transparent)", pointerEvents: "none" }} />

        {/* Estado badge — top right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 100, background: `${estado.color}22`, border: `1px solid ${estado.color}50`, backdropFilter: "blur(8px)" }}>
            <EstadoIcon size={9} color={estado.color} strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 800, color: estado.color, fontFamily: FB }}>{estado.label}</span>
          </div>
        </div>

        {/* Año — bottom left */}
        {obra.anio_creacion && (
          <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "rgba(255,232,200,0.55)", fontFamily: FB }}>{obra.anio_creacion}</div>
        )}

        {/* Vistas — bottom right */}
        <div style={{ position: "absolute", bottom: 8, right: 10, display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "rgba(255,232,200,0.55)", fontFamily: FB }}>
          <Eye size={9} strokeWidth={1.8} /> {obra.vistas ?? 0}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Título */}
        <div style={{ fontSize: 14.5, fontWeight: 800, color: C.cream, fontFamily: FD, lineHeight: 1.25, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {obra.titulo}
        </div>

        {/* Artista */}
        <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 10, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <Star size={8} strokeWidth={2} color={C.gold} fill={C.gold} />
          {obra.artista_alias || obra.artista_nombre || "Sin artista"}
        </div>

        {/* Categoria + Precio */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {obra.categoria_nombre && (
            <span style={{ fontSize: 10.5, padding: "3px 9px", borderRadius: 100, background: "rgba(121,170,245,0.10)", border: `1px solid rgba(121,170,245,0.22)`, color: C.blue, fontWeight: 700, fontFamily: FB }}>
              {obra.categoria_nombre}
            </span>
          )}
          {precio && (
            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: "rgba(255,132,14,0.10)", border: `1px solid rgba(255,132,14,0.22)`, color: C.orange, fontWeight: 700, fontFamily: FB, display: "flex", alignItems: "center", gap: 3 }}>
              <DollarSign size={8} strokeWidth={2.5} />
              {Number(precio).toLocaleString("es-MX")}
            </span>
          )}
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 10 }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
          <button onClick={onCambiarEstado}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 100, background: `${estado.color}12`, border: `1px solid ${estado.color}30`, color: estado.color, fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}24`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}12`}>
            <EstadoIcon size={9} strokeWidth={2.5} /> {estado.label}
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {([
              { icon: Edit2,  color: C.blue, action: onEditar,   title: "Editar"    },
              { icon: Trash2, color: C.pink, action: onEliminar, title: "Eliminar"  },
            ] as const).map(({ icon: Icon, color, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{ width: 30, height: 30, borderRadius: 8, background: `${color}10`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}24`; (e.currentTarget as HTMLElement).style.borderColor = `${color}48`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${color}22`; }}>
                <Icon size={12} color={color} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ObraCard_Props = ObraItem;

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ListaObras() {
  const navigate = useNavigate();

  const [obras,           setObras]           = useState<ObraItem[]>([]);
  const [allObras,        setAllObras]        = useState<ObraItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [filtroEstado,    setFiltroEstado]    = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [categorias,      setCategorias]      = useState<CategoriaItem[]>([]);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [total,           setTotal]           = useState(0);
  const [modalEliminar,   setModalEliminar]   = useState<ObraItem | null>(null);
  const [modalEstado,     setModalEstado]     = useState<ObraItem | null>(null);

  const cargarObras = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "12", solo_publicadas: "false" };
      if (filtroCategoria !== "todas") params.categoria = filtroCategoria;
      const res = await fetch(`${API_URL}/api/obras?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        let data: ObraItem[] = json.data || [];
        setAllObras(data);
        if (filtroEstado !== "todos") data = data.filter(o => o.estado === filtroEstado);
        if (search.trim()) {
          const q = search.toLowerCase();
          data = data.filter(o => o.titulo?.toLowerCase().includes(q) || o.artista_nombre?.toLowerCase().includes(q));
        }
        setObras(data);
        setTotal(json.pagination?.total ?? data.length);
        setTotalPages(json.pagination?.totalPages ?? 1);
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
      setModalEliminar(null);
      cargarObras();
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
      setModalEstado(null);
      cargarObras();
    } catch (err) { console.error(err); }
  };

  const countByEstado = (e: string) => allObras.filter(o => o.estado === e).length;
  const pendientes    = countByEstado("pendiente");

  const STATS = [
    { label: "Total obras",  value: total,                   icon: Layers,      color: C.blue   },
    { label: "Publicadas",   value: countByEstado("publicada"), icon: CheckCircle, color: C.green  },
    { label: "Pendientes",   value: pendientes,              icon: Clock,       color: C.gold   },
    { label: "Rechazadas",   value: countByEstado("rechazada"), icon: XCircle,     color: C.pink   },
  ];

  const FILTROS = [
    { key: "todos",     label: "Todas",      color: C.orange },
    { key: "publicada", label: "Publicadas", color: C.green  },
    { key: "pendiente", label: "Pendientes", color: C.gold   },
    { key: "rechazada", label: "Rechazadas", color: C.pink   },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes modalIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder  { color: rgba(255,232,200,0.20); }
        textarea::placeholder { color: rgba(255,232,200,0.20); }
        select option { background: #100D1C; color: #FFF8EE; }
      `}</style>

      {modalEliminar && <ModalEliminar obra={modalEliminar} onConfirm={handleEliminar}        onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   obra={modalEstado}   onConfirm={handleCambiarEstado}   onCancel={() => setModalEstado(null)}   />}

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 13, color: C.creamSub }}>Obras</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(121,170,245,0.12)", border: `1px solid rgba(121,170,245,0.25)`, color: C.blue, fontWeight: 700 }}>
            {total} obras
          </span>
          {pendientes > 0 && (
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(255,193,16,0.12)", border: `1px solid rgba(255,193,16,0.30)`, color: C.gold, fontWeight: 700 }}>
              ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={cargarObras}
            style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}45`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <main style={{ flex: 1, padding: "24px 28px 32px", overflowY: "auto", fontFamily: FB }}>

        {/* Header */}
        <div style={{ marginBottom: 22, animation: "fadeUp .4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <Star size={10} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em" }}>Catálogo de arte</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
            Gestión de{" "}
            <span style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Obras
            </span>
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20, animation: "fadeUp .4s ease .05s both" }}>
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,${color},${color}40)`, borderRadius: "12px 0 0 12px" }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.cream, fontFamily: FD, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.creamMut, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .4s ease .08s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", transition: "border-color .15s" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <Search size={13} color={C.creamMut} strokeWidth={1.8} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por título o artista…"
              style={{ border: "none", outline: "none", fontSize: 13, color: C.cream, background: "transparent", width: "100%", fontFamily: FB }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} color={C.creamMut} />
              </button>
            )}
          </div>
          <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPage(1); }}
            style={{ padding: "9px 13px", borderRadius: 9, border: `1px solid ${C.border}`, background: "rgba(255,232,200,0.04)", fontSize: 13, color: C.creamSub, cursor: "pointer", fontFamily: FB, outline: "none" }}>
            <option value="todas">Todas las categorías</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {FILTROS.map(({ key, label, color }) => {
              const on = filtroEstado === key;
              return (
                <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }}
                  style={{ padding: "7px 14px", borderRadius: 100, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}14` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 400, fontSize: 12.5, cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, animation: "fadeUp .4s ease .1s both" }}>
            {Array.from({ length: 8 }).map((_, i) => <ObraCardSkeleton key={i} />)}
          </div>
        ) : obras.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, animation: "fadeUp .4s ease both" }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(121,170,245,0.08)", border: `1px solid rgba(121,170,245,0.18)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={26} color={C.blue} strokeWidth={1.4} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontFamily: FD, color: C.creamSub, fontWeight: 700, textAlign: "center", marginBottom: 4 }}>No se encontraron obras</div>
              <div style={{ fontSize: 12, color: C.creamMut, textAlign: "center" }}>Prueba cambiando el filtro o la búsqueda</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, animation: "fadeUp .4s ease .1s both" }}>
            {obras.map(obra => (
              <ObraCard
                key={obra.id_obra}
                obra={obra}
                onEditar={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}
                onEliminar={() => setModalEliminar(obra)}
                onCambiarEstado={() => setModalEstado(obra)}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, animation: "fadeUp .5s ease .15s both" }}>
            <div style={{ fontSize: 12.5, color: C.creamMut }}>
              Página <span style={{ color: C.cream, fontWeight: 700 }}>{page}</span> de <span style={{ color: C.cream, fontWeight: 700 }}>{totalPages}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1 }}>
                <ChevronLeft size={14} color={C.creamMut} strokeWidth={2} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p        = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                const isActive = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isActive ? `${C.blue}55` : C.border}`, background: isActive ? `linear-gradient(135deg, ${C.blue}, ${C.purple})` : "transparent", color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 800 : 400, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: isActive ? `0 4px 14px rgba(121,170,245,0.32)` : "none", transition: "all .15s" }}>
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
    </>
  );
}
