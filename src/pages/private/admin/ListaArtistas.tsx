// src/pages/private/admin/ListaArtistas.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Search, RefreshCw, X, Eye, Edit2, Trash2,
  CheckCircle, Clock, XCircle, UserPlus, Phone, Mail,
  ChevronLeft, ChevronRight, AlertTriangle,
  Star, Check, Ban, Bell, ShieldOff, UserCheck, Users,
} from "lucide-react";
import { authService } from "../../../services/authService";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  red:      "#C4304A",
  gray:     "#5A7A8A",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  card:     "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};

const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono', 'Fira Code', monospace";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface ArtistaItem {
  id_artista:           number;
  nombre_completo:      string;
  nombre_artistico?:    string;
  foto_perfil?:         string;
  correo?:              string;
  telefono?:            string;
  matricula?:           string;
  estado:               string;
  categoria_nombre?:    string;
  porcentaje_comision?: number;
  total_obras?:         number;
}

interface EstadoConfig { label: string; color: string; icon: LucideIcon }
interface OpcionEstado { estado: string; label: string; color: string; icon: LucideIcon; fill?: boolean }

const ESTADOS: Record<string, EstadoConfig> = {
  activo:     { label: "Activo",     color: C.green,   icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: C.gold,    icon: Clock       },
  inactivo:   { label: "Inactivo",   color: C.gray,    icon: XCircle     },
  rechazado:  { label: "Rechazado",  color: C.red,     icon: Ban         },
  suspendido: { label: "Suspendido", color: C.pink,    icon: XCircle     },
};

const OPCIONES_POR_ESTADO: Record<string, OpcionEstado[]> = {
  pendiente:  [
    { estado: "activo",    label: "Aprobar",              color: C.green, icon: Check,     fill: true },
    { estado: "rechazado", label: "Rechazar",             color: C.red,   icon: Ban                   },
  ],
  activo: [
    { estado: "inactivo",   label: "Desactivar",          color: C.gray,  icon: XCircle               },
    { estado: "suspendido", label: "Suspender",           color: C.pink,  icon: ShieldOff             },
    { estado: "rechazado",  label: "Rechazar",            color: C.red,   icon: Ban                   },
  ],
  inactivo: [
    { estado: "activo",    label: "Reactivar",            color: C.green, icon: UserCheck, fill: true },
    { estado: "rechazado", label: "Rechazar",             color: C.red,   icon: Ban                   },
  ],
  rechazado: [
    { estado: "pendiente", label: "Volver a revisar",     color: C.gold,  icon: Clock                 },
    { estado: "activo",    label: "Aprobar directamente", color: C.green, icon: Check,     fill: true },
  ],
  suspendido: [
    { estado: "activo",   label: "Reactivar",             color: C.green, icon: UserCheck, fill: true },
    { estado: "inactivo", label: "Desactivar",            color: C.gray,  icon: XCircle               },
  ],
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ background: C.card, borderRadius: 14, boxShadow: CS, overflow: "hidden" }}>
      <div style={{ height: 60, background: C.bg, position: "relative" }}>
        <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", width: 44, height: 44, borderRadius: "50%", background: C.border }} />
      </div>
      <div style={{ padding: "32px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: "55%", height: 14, borderRadius: 6, background: C.bg, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(0,0,0,0.04),transparent)", animation: "shimmer 1.5s infinite" }} />
        </div>
        <div style={{ width: "35%", height: 10, borderRadius: 6, background: C.bg }} />
        <div style={{ width: "45%", height: 20, borderRadius: 100, background: C.bg, marginTop: 4 }} />
        <div style={{ height: 1, width: "100%", background: C.border, margin: "6px 0" }} />
        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "center" }}>
          <div style={{ width: 80, height: 26, borderRadius: 8, background: C.bg }} />
          <div style={{ width: 80, height: 26, borderRadius: 8, background: C.bg }} />
        </div>
      </div>
    </div>
  );
}

// ── Modal Eliminar ────────────────────────────────────────────────────────────
function ModalEliminar({ artista, onConfirm, onCancel }: {
  artista: ArtistaItem; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,18,30,0.45)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: C.card, borderRadius: 18, padding: "30px", maxWidth: 400, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,0.14)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.red}10`, border: `1px solid ${C.red}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertTriangle size={20} color={C.red} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, marginBottom: 6 }}>¿Eliminar artista?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 4, lineHeight: 1.7 }}>
          Vas a eliminar a <strong style={{ color: C.cream }}>{artista.nombre_completo}</strong>.
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 22 }}>Sus obras seguirán en el sistema.</div>
        <div style={{ height: 1, background: C.border, marginBottom: 18 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.creamSub, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Estado ──────────────────────────────────────────────────────────────
function ModalEstado({ artista, onConfirm, onCancel }: {
  artista: ArtistaItem; onConfirm: (estado: string, motivo?: string) => void; onCancel: () => void;
}) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const estadoActual     = ESTADOS[artista.estado] || ESTADOS.pendiente;
  const EstadoActualIcon = estadoActual.icon;
  const opciones         = OPCIONES_POR_ESTADO[artista.estado] || [];
  const esPendiente      = artista.estado === "pendiente";
  const opcionSel        = opciones.find(o => o.estado === seleccionado);
  const requiereMotivo   = seleccionado === "rechazado";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,18,30,0.45)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: C.card, borderRadius: 18, padding: "30px", maxWidth: 480, width: "92%", boxShadow: "0 24px 60px rgba(0,0,0,0.14)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${estadoActual.color}12`, border: `1px solid ${estadoActual.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EstadoActualIcon size={20} color={estadoActual.color} strokeWidth={2} />
          </div>
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} color={C.creamMut} />
          </button>
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, marginBottom: 3 }}>
          {esPendiente ? "Revisar solicitud" : "Cambiar estado del artista"}
        </div>
        <div style={{ fontSize: 13, color: C.creamSub, marginBottom: 6, lineHeight: 1.6 }}>
          <strong style={{ color: C.cream }}>{artista.nombre_completo}</strong>
          {artista.nombre_artistico && <span style={{ color: C.gold }}> · ✦ {artista.nombre_artistico}</span>}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: `${estadoActual.color}10`, border: `1px solid ${estadoActual.color}28`, marginBottom: 16 }}>
          <EstadoActualIcon size={10} color={estadoActual.color} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 700, color: estadoActual.color, fontFamily: FB }}>Estado actual: {estadoActual.label}</span>
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 14 }} />

        {esPendiente && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            {[
              { label: "Correo",    value: artista.correo,                  icon: Mail,  color: C.blue   },
              { label: "Teléfono",  value: artista.telefono || "—",         icon: Phone, color: C.purple },
              { label: "Categoría", value: artista.categoria_nombre || "—", icon: Star,  color: C.gold   },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 12.5, alignItems: "flex-start" }}>
                <span style={{ color: C.creamMut, minWidth: 80, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Icon size={10} color={color} strokeWidth={2} />{label}:
                </span>
                <span style={{ color: C.cream }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: FB }}>Cambiar a:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {opciones.map(({ estado, label, color, icon: Icon }) => {
              const sel = seleccionado === estado;
              return (
                <button key={estado} onClick={() => { setSeleccionado(estado); setMotivo(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${sel ? `${color}45` : C.border}`, background: sel ? `${color}10` : C.bg, transition: "all .15s", textAlign: "left" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: sel ? 700 : 400, color: sel ? color : C.creamSub, fontFamily: FB, flex: 1 }}>{label}</span>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {requiereMotivo && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: FB }}>Motivo del rechazo (opcional)</div>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza su solicitud..." rows={3}
              style={{ width: "100%", borderRadius: 8, padding: "10px 12px", background: C.bg, border: `1px solid ${C.border}`, color: C.cream, fontSize: 13, fontFamily: FB, resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.creamSub, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB }}>
            Cancelar
          </button>
          <button
            onClick={() => { if (!seleccionado) return; onConfirm(seleccionado, requiereMotivo ? motivo : undefined); }}
            disabled={!seleccionado}
            style={{
              flex: 1.5, padding: "10px", borderRadius: 9, fontWeight: 700, fontSize: 13,
              cursor: seleccionado ? "pointer" : "not-allowed", fontFamily: FB, transition: "all .15s",
              background: seleccionado && opcionSel ? (opcionSel.fill ? opcionSel.color : `${opcionSel.color}15`) : C.bg,
              color: seleccionado && opcionSel ? (opcionSel.fill ? "white" : opcionSel.color) : C.creamMut,
              border: `1px solid ${seleccionado && opcionSel ? `${opcionSel.color}40` : C.border}`,
              opacity: seleccionado ? 1 : 0.5,
            }}>
            {seleccionado && opcionSel ? `${opcionSel.label} →` : "Selecciona una opción"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Artista Card ──────────────────────────────────────────────────────────────
function ArtistaCard({ artista, avatarColor, onVerDetalle, onEditar, onEliminar, onCambiarEstado }: {
  artista: ArtistaItem; avatarColor: string;
  onVerDetalle: () => void; onEditar: () => void; onEliminar: () => void; onCambiarEstado: () => void;
}) {
  const estado     = ESTADOS[artista.estado] || ESTADOS.pendiente;
  const EstadoIcon = estado.icon;
  const esPend     = artista.estado === "pendiente";
  const initials   = artista.nombre_completo?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div style={{ background: C.card, borderRadius: 14, boxShadow: esPend ? `0 0 0 1.5px ${C.gold}40, ${CS}` : CS, overflow: "hidden", transition: "all .18s", cursor: "default", display: "flex", flexDirection: "column", position: "relative" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = esPend ? `0 0 0 1.5px ${C.gold}40, ${CS}` : CS; }}>

      {esPend && (
        <div style={{ position: "absolute", top: 10, right: -24, background: C.gold, color: "#fff", fontSize: 8.5, fontWeight: 800, padding: "3px 32px", transform: "rotate(45deg)", letterSpacing: "0.1em", zIndex: 2, fontFamily: FB }}>
          PENDIENTE
        </div>
      )}

      {/* Header */}
      <div style={{ height: 60, background: `linear-gradient(135deg, ${avatarColor}18, ${avatarColor}08)`, position: "relative", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", width: 44, height: 44, borderRadius: "50%", border: `2.5px solid ${C.card}`, background: artista.foto_perfil ? "transparent" : `${avatarColor}18`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: CS, zIndex: 1 }}>
          {artista.foto_perfil
            ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <span style={{ fontSize: 16, fontWeight: 800, color: avatarColor, fontFamily: FB }}>{initials}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "30px 16px 14px", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: FB, textAlign: "center", lineHeight: 1.2, marginBottom: 2 }}>
          {artista.nombre_completo}
        </div>
        {artista.nombre_artistico && (
          <div style={{ fontSize: 11, color: C.gold, display: "flex", alignItems: "center", gap: 3, marginBottom: 4, fontFamily: FB }}>
            <Star size={8} strokeWidth={2} color={C.gold} fill={C.gold} /> {artista.nombre_artistico}
          </div>
        )}
        {artista.matricula && (
          <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FM, marginBottom: 4 }}>{artista.matricula}</div>
        )}

        {artista.categoria_nombre
          ? <span style={{ fontSize: 10.5, padding: "3px 10px", borderRadius: 100, background: `${C.blue}10`, border: `1px solid ${C.blue}22`, color: C.blue, fontWeight: 600, fontFamily: FB, marginBottom: 10 }}>{artista.categoria_nombre}</span>
          : <div style={{ marginBottom: 10 }} />
        }

        {/* Stats */}
        <div style={{ display: "flex", gap: 6, width: "100%", marginBottom: 10 }}>
          <div style={{ flex: 1, background: `${C.orange}08`, border: `1px solid ${C.orange}18`, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.orange, fontFamily: FM, lineHeight: 1 }}>{artista.porcentaje_comision ?? 15}%</div>
            <div style={{ fontSize: 9.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Comisión</div>
          </div>
          <div style={{ flex: 1, background: `${avatarColor}08`, border: `1px solid ${avatarColor}18`, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: avatarColor, fontFamily: FM, lineHeight: 1 }}>{artista.total_obras ?? 0}</div>
            <div style={{ fontSize: 9.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Obras</div>
          </div>
        </div>

        {/* Contacto */}
        {(artista.correo || artista.telefono) && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, marginBottom: 10, padding: "7px 9px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            {artista.correo && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.creamSub, fontFamily: FB }}>
                <Mail size={9} strokeWidth={1.8} color={C.blue} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artista.correo}</span>
              </div>
            )}
            {artista.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.creamSub, fontFamily: FB }}>
                <Phone size={9} strokeWidth={1.8} color={C.purple} />{artista.telefono}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, width: "100%", background: C.border, marginBottom: 10 }} />

        {/* Footer: estado + acciones */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 6 }}>
          <button onClick={onCambiarEstado}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 100, background: `${estado.color}10`, border: `1px solid ${estado.color}28`, color: estado.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FB }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}20`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}10`}>
            <EstadoIcon size={10} strokeWidth={2.5} />{estado.label}
          </button>

          <div style={{ display: "flex", gap: 4 }}>
            {esPend && (
              <button onClick={onCambiarEstado} title="Revisar solicitud"
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 7, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FB }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.gold}20`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.gold}10`}>
                <Bell size={9} /> Revisar
              </button>
            )}
            {([
              { icon: Eye,    color: C.purple, action: onVerDetalle, title: "Ver detalle" },
              { icon: Edit2,  color: C.blue,   action: onEditar,     title: "Editar"      },
              { icon: Trash2, color: C.red,    action: onEliminar,   title: "Eliminar"    },
            ] as const).map(({ icon: Icon, color, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{ width: 28, height: 28, borderRadius: 7, background: `${color}08`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}18`; (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}08`; (e.currentTarget as HTMLElement).style.borderColor = `${color}20`; }}>
                <Icon size={12} color={color} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ListaArtistas() {
  const navigate = useNavigate();

  const [artistas,      setArtistas]      = useState<ArtistaItem[]>([]);
  const [allArtistas,   setAllArtistas]   = useState<ArtistaItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filtroEstado,  setFiltroEstado]  = useState("todos");
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [pendientes,    setPendientes]    = useState(0);
  const [modalEliminar, setModalEliminar] = useState<ArtistaItem | null>(null);
  const [modalEstado,   setModalEstado]   = useState<ArtistaItem | null>(null);

  const cargarArtistas = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/artistas?page=${page}&limit=12`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        let data: ArtistaItem[] = json.data || [];
        setAllArtistas(data);
        setPendientes(data.filter(a => a.estado === "pendiente").length);
        if (filtroEstado !== "todos") data = data.filter(a => a.estado === filtroEstado);
        if (search.trim()) {
          const q = search.toLowerCase();
          data = data.filter(a =>
            a.nombre_completo?.toLowerCase().includes(q) ||
            a.nombre_artistico?.toLowerCase().includes(q) ||
            a.correo?.toLowerCase().includes(q)
          );
        }
        setArtistas(data);
        setTotal(json.pagination?.total ?? data.length);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filtroEstado, search]);

  useEffect(() => { cargarArtistas(); }, [cargarArtistas]);

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await fetch(`${API_URL}/api/artistas/${modalEliminar.id_artista}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      setModalEliminar(null);
      cargarArtistas();
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
      setModalEstado(null);
      cargarArtistas();
    } catch (err) { console.error(err); }
  };

  const avatarColors   = [C.orange, C.blue, C.pink, C.purple, C.gold, C.green];
  const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];
  const countByEstado  = (e: string) => allArtistas.filter(a => a.estado === e).length;

  const STATS = [
    { label: "Total artistas", value: total,                                                              color: C.orange },
    { label: "Activos",        value: countByEstado("activo"),                                            color: C.green  },
    { label: "Pendientes",     value: pendientes,                                                         color: C.gold   },
    { label: "Inactivos",      value: countByEstado("inactivo") + countByEstado("rechazado"),             color: C.gray   },
  ];

  const FILTROS = [
    { key: "todos",     label: "Todos",      color: C.orange },
    { key: "activo",    label: "Activos",    color: C.green  },
    { key: "pendiente", label: "Pendientes", color: C.gold   },
    { key: "inactivo",  label: "Inactivos",  color: C.gray   },
    { key: "rechazado", label: "Rechazados", color: C.red    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        input::placeholder { color: #C4C2D0; }
        textarea::placeholder { color: #C4C2D0; }
      `}</style>

      {modalEliminar && <ModalEliminar artista={modalEliminar} onConfirm={handleEliminar} onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   artista={modalEstado}   onConfirm={handleCambiarEstado} onCancel={() => setModalEstado(null)} />}

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>Artistas</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: `${C.pink}10`, border: `1px solid ${C.pink}22`, color: C.pink, fontWeight: 700, fontFamily: FM }}>
            {total}
          </span>
          {pendientes > 0 && (
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: `${C.gold}12`, border: `1px solid ${C.gold}30`, color: C.gold, fontWeight: 700 }}>
              ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={cargarArtistas}
            style={{ width: 34, height: 34, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button onClick={() => navigate("/admin/artistas/crear")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.purple, border: "none", color: "white", padding: "7px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: `0 2px 8px ${C.purple}30` }}>
            <UserPlus size={14} strokeWidth={2} /> Nuevo artista
          </button>
        </div>
      </div>

      <main style={{ flex: 1, padding: "24px 28px 32px", background: C.bg, overflowY: "auto", fontFamily: FB }}>

        {/* Header */}
        <div style={{ marginBottom: 20, animation: "fadeUp .35s ease both" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.cream }}>
            Gestión de artistas
          </h1>
          <p style={{ fontSize: 13, color: C.creamMut, margin: "3px 0 0", fontFamily: FB }}>
            Administra el directorio de artistas de la galería
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18, animation: "fadeUp .35s ease .04s both" }}>
          {STATS.map(({ label, value, color }) => (
            <div key={label} style={{ background: C.card, borderRadius: 10, boxShadow: CS, padding: "14px 16px", borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: FM, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: C.creamMut, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4, fontFamily: FB }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Banner pendientes */}
        {pendientes > 0 && filtroEstado === "todos" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", marginBottom: 16, background: `${C.gold}0C`, border: `1px solid ${C.gold}30`, borderRadius: 12, animation: "fadeUp .35s ease .06s both" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.gold}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={16} color={C.gold} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.gold, marginBottom: 1 }}>{pendientes} solicitud{pendientes > 1 ? "es" : ""} pendiente{pendientes > 1 ? "s" : ""} de aprobación</div>
              <div style={{ fontSize: 12, color: C.creamSub }}>Haz clic en el badge de estado para aprobar o rechazar</div>
            </div>
            <button onClick={() => setFiltroEstado("pendiente")}
              style={{ padding: "6px 14px", borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.gold}35`, color: C.gold, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              Ver pendientes →
            </button>
          </div>
        )}

        {/* Search + Filtros */}
        <div style={{ background: C.card, borderRadius: 12, boxShadow: CS, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .35s ease .08s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
            <Search size={13} color={C.creamMut} strokeWidth={1.8} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, alias o correo…"
              style={{ border: "none", outline: "none", fontSize: 13, color: C.cream, background: "transparent", width: "100%", fontFamily: FB }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} color={C.creamMut} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {FILTROS.map(({ key, label, color }) => {
              const on  = filtroEstado === key;
              const cnt = key === "pendiente" ? pendientes : 0;
              return (
                <button key={key} onClick={() => { setFiltroEstado(key); setPage(1); }}
                  style={{ padding: "6px 13px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5, border: `1.5px solid ${on ? `${color}45` : C.border}`, background: on ? `${color}10` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 500, fontSize: 12.5, cursor: "pointer", transition: "all .15s" }}>
                  {label}
                  {cnt > 0 && (
                    <span style={{ background: C.gold, color: "white", borderRadius: 9, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)}
          </div>
        ) : artistas.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 260, gap: 10, background: C.card, borderRadius: 14, boxShadow: CS, animation: "fadeUp .35s ease both" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.pink}10`, border: `1px solid ${C.pink}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={22} color={C.pink} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, color: C.cream, fontWeight: 700 }}>No se encontraron artistas</div>
            <div style={{ fontSize: 12.5, color: C.creamMut }}>Prueba cambiando el filtro o la búsqueda</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, animation: "fadeUp .35s ease .10s both" }}>
            {artistas.map(artista => (
              <ArtistaCard
                key={artista.id_artista}
                artista={artista}
                avatarColor={getAvatarColor(artista.id_artista)}
                onVerDetalle={() => navigate(`/admin/artistas/${artista.id_artista}`)}
                onEditar={() => navigate(`/admin/artistas/editar/${artista.id_artista}`)}
                onEliminar={() => setModalEliminar(artista)}
                onCambiarEstado={() => setModalEstado(artista)}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, animation: "fadeUp .4s ease .12s both" }}>
            <div style={{ fontSize: 12.5, color: C.creamMut }}>
              Página <span style={{ color: C.cream, fontWeight: 700 }}>{page}</span> de <span style={{ color: C.cream, fontWeight: 700 }}>{totalPages}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1 }}>
                <ChevronLeft size={13} color={C.creamMut} strokeWidth={2} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p        = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                const isActive = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${isActive ? C.purple : C.border}`, background: isActive ? C.purple : C.card, color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1 }}>
                <ChevronRight size={13} color={C.creamMut} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
