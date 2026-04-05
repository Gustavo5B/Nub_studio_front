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
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  red:      "#C4304A",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  card:     "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};

const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
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
  pendiente: { label: "Pendiente", color: C.gold,  icon: Clock        },
  publicada: { label: "Publicada", color: C.green, icon: CheckCircle  },
  rechazada: { label: "Rechazada", color: C.red,   icon: XCircle      },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
function ObraCardSkeleton() {
  return (
    <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: CS }}>
      <div style={{ height: 152, background: "#F3F2F8", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)", animation: "shimmer 1.6s infinite" }} />
      </div>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ height: 14, borderRadius: 5, background: "#EEEDF5", marginBottom: 8, width: "70%" }} />
        <div style={{ height: 10, borderRadius: 4, background: "#F3F2F8", marginBottom: 12, width: "45%" }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div style={{ height: 20, borderRadius: 100, background: "#F3F2F8", width: 75 }} />
          <div style={{ height: 20, borderRadius: 100, background: "#F3F2F8", width: 65 }} />
        </div>
        <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 24, borderRadius: 100, background: "#F3F2F8", width: 75 }} />
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F2F8" }} />
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F2F8" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Eliminar ────────────────────────────────────────────────────────────
function ModalEliminar({ obra, onConfirm, onCancel }: {
  obra: ObraItem; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,18,30,0.45)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: C.card, borderRadius: 18, padding: "28px", maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: `${C.red}12`, border: `1px solid ${C.red}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertTriangle size={20} color={C.red} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.cream, marginBottom: 7 }}>¿Eliminar obra?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 5, lineHeight: 1.65 }}>
          Vas a eliminar <strong style={{ color: C.cream }}>"{obra.titulo}"</strong>.
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 22 }}>Esta acción no se puede deshacer.</div>
        <div style={{ height: 1, background: C.border, marginBottom: 18 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FB }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.creamMut; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px ${C.red}30` }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,18,30,0.45)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: C.card, borderRadius: 18, padding: "26px", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.cream }}>Cambiar estado</div>
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F2F8", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} color={C.creamMut} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 16 }}>
          Obra: <span style={{ color: C.creamSub, fontWeight: 600 }}>{obra.titulo}</span>
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 14 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
          {Object.entries(ESTADOS).map(([key, { label, color, icon: Icon }]) => {
            const on = selected === key;
            return (
              <button key={key} onClick={() => setSelected(key)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${on ? color : C.border}`, background: on ? `${color}08` : C.bg, cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? C.cream : C.creamSub, fontFamily: FB, flex: 1 }}>{label}</span>
                {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />}
              </button>
            );
          })}
        </div>
        {selected === "rechazada" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Motivo de rechazo
            </label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza la obra…" rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.cream, fontSize: 13, fontFamily: FB, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        )}
        <button onClick={() => onConfirm(selected, selected === "rechazada" ? motivo : undefined)}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: C.orange, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px ${C.orange}30` }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          Guardar cambio
        </button>
      </div>
    </div>
  );
}

// ── Obra Card ─────────────────────────────────────────────────────────────────
type ObraCard_Props = ObraItem;

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
    <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: isPend ? `0 1px 4px rgba(0,0,0,0.05), 0 0 0 1.5px ${C.gold}55` : CS, transition: "all .2s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = isPend ? `0 8px 24px rgba(0,0,0,0.10), 0 0 0 1.5px ${C.gold}70` : "0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.07)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = isPend ? `0 1px 4px rgba(0,0,0,0.05), 0 0 0 1.5px ${C.gold}55` : CS; }}>

      {/* Image */}
      <div style={{ height: 152, background: "#F3F2F8", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        {obra.imagen_principal
          ? <img src={obra.imagen_principal} alt={obra.titulo}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <ImageIcon size={26} color={C.creamMut} strokeWidth={1.2} />
              <span style={{ fontSize: 10, color: C.creamMut, fontFamily: FB }}>Sin imagen</span>
            </div>
        }

        {/* Estado badge */}
        <div style={{ position: "absolute", top: 9, right: 9 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, background: "rgba(255,255,255,0.92)", border: `1px solid ${estado.color}35`, backdropFilter: "blur(6px)" }}>
            <EstadoIcon size={9} color={estado.color} strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 700, color: estado.color, fontFamily: FB }}>{estado.label}</span>
          </div>
        </div>

        {/* Año */}
        {obra.anio_creacion && (
          <div style={{ position: "absolute", bottom: 8, left: 9, fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: FM, background: "rgba(0,0,0,0.28)", padding: "1px 6px", borderRadius: 4 }}>{obra.anio_creacion}</div>
        )}

        {/* Vistas */}
        <div style={{ position: "absolute", bottom: 8, right: 9, display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: FM, background: "rgba(0,0,0,0.28)", padding: "1px 6px", borderRadius: 4 }}>
          <Eye size={8} strokeWidth={1.8} /> {obra.vistas ?? 0}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 13px 13px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: FB, lineHeight: 1.25, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {obra.titulo}
        </div>

        <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 10, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <Star size={8} strokeWidth={2} color={C.gold} fill={C.gold} />
          {obra.artista_alias || obra.artista_nombre || "Sin artista"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 11, flexWrap: "wrap" }}>
          {obra.categoria_nombre && (
            <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 100, background: `${C.blue}0F`, border: `1px solid ${C.blue}28`, color: C.blue, fontWeight: 700, fontFamily: FB }}>
              {obra.categoria_nombre}
            </span>
          )}
          {precio && (
            <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 100, background: `${C.orange}0F`, border: `1px solid ${C.orange}28`, color: C.orange, fontWeight: 700, fontFamily: FM, display: "flex", alignItems: "center", gap: 3 }}>
              <DollarSign size={8} strokeWidth={2.5} />
              {Number(precio).toLocaleString("es-MX")}
            </span>
          )}
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 10 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
          <button onClick={onCambiarEstado}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 100, background: `${estado.color}0F`, border: `1px solid ${estado.color}30`, color: estado.color, fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}20`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}0F`}>
            <EstadoIcon size={9} strokeWidth={2.5} /> {estado.label}
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {([
              { icon: Edit2,  color: C.blue, action: onEditar,   title: "Editar"   },
              { icon: Trash2, color: C.red,  action: onEliminar, title: "Eliminar" },
            ] as const).map(({ icon: Icon, color, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{ width: 28, height: 28, borderRadius: 7, background: `${color}0F`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}22`; (e.currentTarget as HTMLElement).style.borderColor = `${color}44`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}0F`; (e.currentTarget as HTMLElement).style.borderColor = `${color}22`; }}>
                <Icon size={11} color={color} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      const params: Record<string, string> = { page: String(page), limit: "12", solo_publicadas: "false", ordenar: "admin" };
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
    { label: "Total obras",  value: total,                      icon: Layers,      color: C.blue  },
    { label: "Publicadas",   value: countByEstado("publicada"), icon: CheckCircle, color: C.green },
    { label: "Pendientes",   value: pendientes,                 icon: Clock,       color: C.gold  },
    { label: "Rechazadas",   value: countByEstado("rechazada"), icon: XCircle,     color: C.red   },
  ];

  const FILTROS = [
    { key: "todos",     label: "Todas",      color: C.orange },
    { key: "publicada", label: "Publicadas", color: C.green  },
    { key: "pendiente", label: "Pendientes", color: C.gold   },
    { key: "rechazada", label: "Rechazadas", color: C.red    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes modalIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder  { color: #B8B6C8; }
        textarea::placeholder { color: #B8B6C8; }
        select option { background: #FFFFFF; color: #14121E; }
      `}</style>

      {modalEliminar && <ModalEliminar obra={modalEliminar} onConfirm={handleEliminar}       onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   obra={modalEstado}   onConfirm={handleCambiarEstado}  onCancel={() => setModalEstado(null)}   />}

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>Obras</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: `${C.blue}10`, border: `1px solid ${C.blue}28`, color: C.blue, fontWeight: 700, fontFamily: FM }}>
            {total}
          </span>
          {pendientes > 0 && (
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: `${C.gold}10`, border: `1px solid ${C.gold}35`, color: C.gold, fontWeight: 700 }}>
              ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button onClick={cargarObras}
          style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.creamMut}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      <main style={{ flex: 1, padding: "24px 28px 32px", overflowY: "auto", fontFamily: FB, background: C.bg }}>

        {/* Header */}
        <div style={{ marginBottom: 20, animation: "fadeUp .4s ease both" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.cream }}>Gestión de Obras</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.creamMut }}>Catálogo completo de arte digital</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20, animation: "fadeUp .4s ease .05s both" }}>
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: C.card, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: CS, borderLeft: `3px solid ${color}`, position: "relative", overflow: "hidden" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: FM, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: CS, animation: "fadeUp .4s ease .08s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 200, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", transition: "border-color .15s" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.orange}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <Search size={12} color={C.creamMut} strokeWidth={1.8} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por título o artista…"
              style={{ border: "none", outline: "none", fontSize: 13, color: C.cream, background: "transparent", width: "100%", fontFamily: FB }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={11} color={C.creamMut} />
              </button>
            )}
          </div>
          <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.creamSub, cursor: "pointer", fontFamily: FB, outline: "none" }}>
            <option value="todas">Todas las categorías</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {FILTROS.map(({ key, label, color }) => {
              const on = filtroEstado === key;
              return (
                <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }}
                  style={{ padding: "6px 13px", borderRadius: 100, border: `1.5px solid ${on ? color : C.border}`, background: on ? `${color}10` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 500, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.creamMut; }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, animation: "fadeUp .4s ease .1s both" }}>
            {Array.from({ length: 8 }).map((_, i) => <ObraCardSkeleton key={`sk-${i}`} />)}
          </div>
        ) : obras.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 14, background: C.card, borderRadius: 14, boxShadow: CS, animation: "fadeUp .4s ease both" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${C.blue}10`, border: `1px solid ${C.blue}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={24} color={C.blue} strokeWidth={1.4} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.creamSub, textAlign: "center", marginBottom: 4 }}>No se encontraron obras</div>
              <div style={{ fontSize: 12.5, color: C.creamMut, textAlign: "center" }}>Prueba cambiando el filtro o la búsqueda</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, animation: "fadeUp .4s ease .1s both" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, animation: "fadeUp .5s ease .15s both" }}>
            <div style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FM }}>
              Página <span style={{ color: C.cream, fontWeight: 700 }}>{page}</span> de <span style={{ color: C.cream, fontWeight: 700 }}>{totalPages}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1, boxShadow: CS }}>
                <ChevronLeft size={13} color={C.creamSub} strokeWidth={2} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p        = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                const isActive = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${isActive ? C.orange : C.border}`, background: isActive ? C.orange : C.card, color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FM, boxShadow: isActive ? `0 2px 8px ${C.orange}30` : CS, transition: "all .15s" }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1, boxShadow: CS }}>
                <ChevronRight size={13} color={C.creamSub} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
