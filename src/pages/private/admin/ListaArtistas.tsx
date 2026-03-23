// src/pages/private/admin/ListaArtistas.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Search, RefreshCw, X, Eye, Edit2, Trash2,
  CheckCircle, Clock, XCircle, UserPlus, Phone, Mail,
  ChevronLeft, ChevronRight, AlertTriangle,
  Star, Check, Ban, Bell, ShieldOff, UserCheck, Users,
  Sparkles,
} from "lucide-react";
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

// ── Tipos ─────────────────────────────────────────────────────────────────────
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

// ── Constantes ────────────────────────────────────────────────────────────────
const ESTADOS: Record<string, EstadoConfig> = {
  activo:     { label: "Activo",     color: C.green,    icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: C.gold,     icon: Clock       },
  inactivo:   { label: "Inactivo",   color: "#7B8FA1",  icon: XCircle     },
  rechazado:  { label: "Rechazado",  color: C.pink,     icon: Ban         },
  suspendido: { label: "Suspendido", color: C.magenta,  icon: XCircle     },
};

const OPCIONES_POR_ESTADO: Record<string, OpcionEstado[]> = {
  pendiente:  [
    { estado: "activo",    label: "Aprobar",              color: C.green,   icon: Check,     fill: true },
    { estado: "rechazado", label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  activo: [
    { estado: "inactivo",   label: "Desactivar",           color: "#7B8FA1", icon: XCircle               },
    { estado: "suspendido", label: "Suspender",            color: C.magenta, icon: ShieldOff             },
    { estado: "rechazado",  label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  inactivo: [
    { estado: "activo",    label: "Reactivar",            color: C.green,   icon: UserCheck, fill: true },
    { estado: "rechazado", label: "Rechazar",             color: C.pink,    icon: Ban                   },
  ],
  rechazado: [
    { estado: "pendiente", label: "Volver a revisar",     color: C.gold,    icon: Clock                 },
    { estado: "activo",    label: "Aprobar directamente", color: C.green,   icon: Check,     fill: true },
  ],
  suspendido: [
    { estado: "activo",   label: "Reactivar",             color: C.green,   icon: UserCheck, fill: true },
    { estado: "inactivo", label: "Desactivar",            color: "#7B8FA1", icon: XCircle               },
  ],
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 72, background: "rgba(255,232,200,0.04)", position: "relative" }}>
        <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,232,200,0.06)", border: `2px solid rgba(255,232,200,0.06)` }} />
      </div>
      <div style={{ padding: "36px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: "55%", height: 16, borderRadius: 6, background: "rgba(255,232,200,0.06)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,200,150,0.08),transparent)", animation: "shimmer 1.5s infinite" }} />
        </div>
        <div style={{ width: "35%", height: 12, borderRadius: 6, background: "rgba(255,232,200,0.04)" }} />
        <div style={{ width: "45%", height: 22, borderRadius: 100, background: "rgba(255,232,200,0.04)", marginTop: 4 }} />
        <div style={{ height: 1, width: "100%", background: C.border, margin: "8px 0" }} />
        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "center" }}>
          <div style={{ width: 80, height: 28, borderRadius: 8, background: "rgba(255,232,200,0.04)" }} />
          <div style={{ width: 80, height: 28, borderRadius: 8, background: "rgba(255,232,200,0.04)" }} />
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 400, width: "90%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(204,89,173,0.14)", border: `1px solid rgba(204,89,173,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <AlertTriangle size={22} color={C.pink} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.cream, marginBottom: 8, fontFamily: FD }}>¿Eliminar artista?</div>
        <div style={{ fontSize: 13.5, color: C.creamSub, marginBottom: 6, lineHeight: 1.7 }}>
          Vas a eliminar a <strong style={{ color: C.cream }}>{artista.nombre_completo}</strong>.
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, marginBottom: 24 }}>Sus obras seguirán en el sistema.</div>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,5,16,0.85)", backdropFilter: "blur(12px)" }}>
      <div style={{ background: "rgba(16,13,28,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 20, padding: "32px", maxWidth: 480, width: "92%", boxShadow: "0 32px 70px rgba(0,0,0,0.7)", animation: "modalIn .22s cubic-bezier(0.16,1,0.3,1)", fontFamily: FB }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${estadoActual.color}16`, border: `1px solid ${estadoActual.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EstadoActualIcon size={22} color={estadoActual.color} strokeWidth={2} />
          </div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,232,200,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color={C.creamMut} />
          </button>
        </div>

        <div style={{ fontSize: 18, fontWeight: 900, color: C.cream, marginBottom: 4, fontFamily: FD }}>
          {esPendiente ? "Revisar solicitud" : "Cambiar estado del artista"}
        </div>
        <div style={{ fontSize: 13, color: C.creamSub, marginBottom: 6, lineHeight: 1.6 }}>
          <strong style={{ color: C.cream }}>{artista.nombre_completo}</strong>
          {artista.nombre_artistico && <span style={{ color: C.gold }}> · ✦ {artista.nombre_artistico}</span>}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 100, background: `${estadoActual.color}13`, border: `1px solid ${estadoActual.color}32`, marginBottom: 18 }}>
          <EstadoActualIcon size={10} color={estadoActual.color} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 700, color: estadoActual.color, fontFamily: FB }}>Estado actual: {estadoActual.label}</span>
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

        {esPendiente && (
          <div style={{ background: "rgba(255,232,200,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", marginBottom: 18 }}>
            {[
              { label: "Correo",    value: artista.correo,                  icon: Mail,  color: C.blue   },
              { label: "Teléfono",  value: artista.telefono || "—",         icon: Phone, color: C.purple },
              { label: "Categoría", value: artista.categoria_nombre || "—", icon: Star,  color: C.gold   },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ display: "flex", gap: 10, marginBottom: 7, fontSize: 12.5, alignItems: "flex-start" }}>
                <span style={{ color: C.creamMut, minWidth: 80, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Icon size={10} color={color} strokeWidth={2} />{label}:
                </span>
                <span style={{ color: C.creamSub }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: FB }}>Cambiar a:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {opciones.map(({ estado, label, color, icon: Icon }) => {
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

        {requiereMotivo && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7, fontFamily: FB }}>Motivo del rechazo (opcional)</div>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Explica al artista por qué se rechaza su solicitud..." rows={3}
              style={{ width: "100%", borderRadius: 9, padding: "11px 13px", background: "rgba(204,89,173,0.05)", border: `1px solid rgba(204,89,173,0.30)`, color: C.cream, fontSize: 13, fontFamily: FB, resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.creamSub, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.cream; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamSub; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
            Cancelar
          </button>
          <button
            onClick={() => { if (!seleccionado) return; onConfirm(seleccionado, requiereMotivo ? motivo : undefined); }}
            disabled={!seleccionado}
            style={{
              flex: 1.5, padding: "11px", borderRadius: 10, fontWeight: 800, fontSize: 13.5,
              cursor: seleccionado ? "pointer" : "not-allowed", fontFamily: FB, transition: "all .15s",
              background: seleccionado && opcionSel
                ? (opcionSel.fill ? `linear-gradient(135deg, ${opcionSel.color}, ${opcionSel.color}cc)` : `${opcionSel.color}20`)
                : "rgba(255,232,200,0.05)",
              color: seleccionado && opcionSel
                ? (opcionSel.fill ? "#000" : opcionSel.color)
                : C.creamMut,
              border: seleccionado && opcionSel
                ? `1px solid ${opcionSel.color}45`
                : `1px solid ${C.border}`,
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

// ── Artista Card ──────────────────────────────────────────────────────────────
function ArtistaCard({ artista, avatarColor, onVerDetalle, onEditar, onEliminar, onCambiarEstado }: {
  artista: ArtistaItem;
  avatarColor: string;
  onVerDetalle: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  onCambiarEstado: () => void;
}) {
  const estado     = ESTADOS[artista.estado] || ESTADOS.pendiente;
  const EstadoIcon = estado.icon;
  const esPend     = artista.estado === "pendiente";
  const initials   = artista.nombre_completo?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div style={{ background: C.card, border: `1px solid ${esPend ? "rgba(255,193,16,0.25)" : C.border}`, borderRadius: 16, overflow: "hidden", transition: "all .2s", cursor: "default", display: "flex", flexDirection: "column", position: "relative" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = esPend ? "rgba(255,193,16,0.45)" : `${avatarColor}40`; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = esPend ? "rgba(255,193,16,0.25)" : C.border; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>

      {/* Pending ribbon */}
      {esPend && (
        <div style={{ position: "absolute", top: 12, right: -28, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 36px", transform: "rotate(45deg)", letterSpacing: "0.08em", zIndex: 2, fontFamily: FB }}>
          PENDIENTE
        </div>
      )}

      {/* Header gradient */}
      <div style={{ height: 68, background: `linear-gradient(135deg, ${avatarColor}22 0%, ${C.purple}18 50%, ${C.pink}14 100%)`, position: "relative", borderBottom: `1px solid ${avatarColor}18` }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${avatarColor}15, transparent 70%)` }} />
        {/* Avatar */}
        <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", width: 52, height: 52, borderRadius: "50%", border: `2.5px solid ${esPend ? C.gold : avatarColor}50`, background: artista.foto_perfil ? "transparent" : `linear-gradient(135deg, ${avatarColor}28, ${C.purple}22)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px rgba(0,0,0,0.5)`, zIndex: 1 }}>
          {artista.foto_perfil
            ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <span style={{ fontSize: 18, fontWeight: 900, color: avatarColor, fontFamily: FB }}>{initials}</span>
          }
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "32px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        {/* Name */}
        <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, fontFamily: FD, textAlign: "center", lineHeight: 1.2, marginBottom: 2 }}>
          {artista.nombre_completo}
        </div>
        {artista.nombre_artistico && (
          <div style={{ fontSize: 11, color: C.gold, display: "flex", alignItems: "center", gap: 3, marginBottom: 4, fontFamily: FB }}>
            <Sparkles size={9} strokeWidth={2} color={C.gold} /> {artista.nombre_artistico}
          </div>
        )}
        {artista.matricula && (
          <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB, marginBottom: 4 }}>{artista.matricula}</div>
        )}

        {/* Categoria */}
        {artista.categoria_nombre
          ? <span style={{ fontSize: 10.5, padding: "3px 10px", borderRadius: 100, background: "rgba(121,170,245,0.10)", border: `1px solid rgba(121,170,245,0.22)`, color: C.blue, fontWeight: 700, fontFamily: FB, marginBottom: 10 }}>{artista.categoria_nombre}</span>
          : <div style={{ marginBottom: 10 }} />
        }

        {/* Stats row */}
        <div style={{ display: "flex", gap: 6, width: "100%", marginBottom: 12 }}>
          <div style={{ flex: 1, background: "rgba(255,132,14,0.08)", border: `1px solid rgba(255,132,14,0.16)`, borderRadius: 9, padding: "7px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, fontFamily: FD, lineHeight: 1 }}>{artista.porcentaje_comision ?? 15}%</div>
            <div style={{ fontSize: 9.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Comisión</div>
          </div>
          <div style={{ flex: 1, background: `${avatarColor}08`, border: `1px solid ${avatarColor}18`, borderRadius: 9, padding: "7px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: avatarColor, fontFamily: FD, lineHeight: 1 }}>{artista.total_obras ?? 0}</div>
            <div style={{ fontSize: 9.5, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Obras</div>
          </div>
        </div>

        {/* Contact */}
        {(artista.correo || artista.telefono) && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, marginBottom: 12, padding: "8px 10px", background: "rgba(255,232,200,0.03)", borderRadius: 9, border: `1px solid ${C.border}` }}>
            {artista.correo && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.creamSub, fontFamily: FB }}>
                <Mail size={9} strokeWidth={1.8} color={C.blue} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{artista.correo}</span>
              </div>
            )}
            {artista.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.creamSub, fontFamily: FB }}>
                <Phone size={9} strokeWidth={1.8} color={C.purple} />{artista.telefono}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, width: "100%", background: C.border, marginBottom: 12 }} />

        {/* Footer: estado + acciones */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
          <button onClick={onCambiarEstado}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 100, background: `${estado.color}12`, border: `1px solid ${estado.color}30`, color: estado.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}24`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${estado.color}12`}>
            <EstadoIcon size={10} strokeWidth={2.5} />{estado.label}
          </button>

          <div style={{ display: "flex", gap: 4 }}>
            {esPend && (
              <button onClick={onCambiarEstado} title="Revisar solicitud"
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 8px", borderRadius: 7, background: "rgba(255,193,16,0.14)", border: `1px solid rgba(255,193,16,0.32)`, color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FB, transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.28)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.14)"}>
                <Bell size={9} /> Revisar
              </button>
            )}
            {([
              { icon: Eye,    color: C.purple, action: onVerDetalle, title: "Ver detalle" },
              { icon: Edit2,  color: C.blue,   action: onEditar,     title: "Editar"      },
              { icon: Trash2, color: C.pink,   action: onEliminar,   title: "Eliminar"    },
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

  const countByEstado = (e: string) => allArtistas.filter(a => a.estado === e).length;

  const STATS = [
    { label: "Total artistas", value: total,                icon: Users,       color: C.orange  },
    { label: "Activos",        value: countByEstado("activo"),    icon: CheckCircle, color: C.green   },
    { label: "Pendientes",     value: pendientes,           icon: Clock,       color: C.gold    },
    { label: "Inactivos",      value: countByEstado("inactivo") + countByEstado("rechazado"), icon: XCircle, color: "#7B8FA1" },
  ];

  const FILTROS = [
    { key: "todos",     label: "Todos",      color: C.orange  },
    { key: "activo",    label: "Activos",    color: C.green   },
    { key: "pendiente", label: "Pendientes", color: C.gold    },
    { key: "inactivo",  label: "Inactivos",  color: "#7B8FA1" },
    { key: "rechazado", label: "Rechazados", color: C.pink    },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,232,200,0.20); }
        textarea::placeholder { color: rgba(255,232,200,0.20); }
      `}</style>

      {modalEliminar && <ModalEliminar artista={modalEliminar} onConfirm={handleEliminar} onCancel={() => setModalEliminar(null)} />}
      {modalEstado   && <ModalEstado   artista={modalEstado}   onConfirm={handleCambiarEstado} onCancel={() => setModalEstado(null)} />}

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 13, color: C.creamSub }}>Artistas</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(204,89,173,0.12)", border: `1px solid rgba(204,89,173,0.25)`, color: C.pink, fontWeight: 700 }}>
            {total} artistas
          </span>
          {pendientes > 0 && (
            <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 100, background: "rgba(255,193,16,0.12)", border: `1px solid rgba(255,193,16,0.30)`, color: C.gold, fontWeight: 700 }}>
              ⚡ {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={cargarArtistas}
            style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button onClick={() => navigate("/admin/artistas/crear")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, border: "none", color: "white", padding: "7px 16px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: `0 4px 14px rgba(204,89,173,0.30)`, transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px rgba(204,89,173,0.45)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px rgba(204,89,173,0.30)`; }}>
            <UserPlus size={14} strokeWidth={2.5} /> Nuevo artista
          </button>
        </div>
      </div>

      <main style={{ flex: 1, padding: "24px 28px 32px", overflowY: "auto", fontFamily: FB }}>

        {/* Header */}
        <div style={{ marginBottom: 22, animation: "fadeUp .4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <Star size={10} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.12em" }}>Comunidad creativa</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream, letterSpacing: "-0.02em" }}>
            Gestión de{" "}
            <span style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Artistas
            </span>
          </h1>
        </div>

        {/* Stats row */}
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

        {/* Banner pendientes */}
        {pendientes > 0 && filtroEstado === "todos" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 18, background: `linear-gradient(135deg, rgba(255,193,16,0.08), rgba(255,132,14,0.05))`, border: `1px solid rgba(255,193,16,0.28)`, borderRadius: 14, animation: "fadeUp .4s ease .08s both" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,193,16,0.16)", border: `1px solid rgba(255,193,16,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={17} color={C.gold} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.gold, fontFamily: FD, marginBottom: 2 }}>{pendientes} solicitud{pendientes > 1 ? "es" : ""} pendiente{pendientes > 1 ? "s" : ""} de aprobación</div>
              <div style={{ fontSize: 12, color: C.creamMut }}>Haz clic en el badge de estado de cada artista para aprobar o rechazar</div>
            </div>
            <button onClick={() => setFiltroEstado("pendiente")}
              style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(255,193,16,0.16)", border: `1px solid rgba(255,193,16,0.38)`, color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.28)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,193,16,0.16)"}>
              Ver pendientes →
            </button>
          </div>
        )}

        {/* Search + Filtros */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .4s ease .10s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px" }}>
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
                  style={{ padding: "7px 14px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5, border: `1.5px solid ${on ? `${color}50` : C.border}`, background: on ? `${color}14` : "transparent", color: on ? color : C.creamSub, fontWeight: on ? 700 : 400, fontSize: 12.5, cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  {label}
                  {cnt > 0 && (
                    <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: "#000", borderRadius: 9, padding: "0 5px", fontSize: 10, fontWeight: 900 }}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de cards */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, animation: "fadeUp .4s ease .12s both" }}>
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)}
          </div>
        ) : artistas.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, animation: "fadeUp .4s ease both" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(204,89,173,0.10)", border: `1px solid rgba(204,89,173,0.20)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color={C.pink} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 16, fontFamily: FD, color: C.creamSub, fontWeight: 700 }}>No se encontraron artistas</div>
            <div style={{ fontSize: 12, color: C.creamMut }}>Prueba cambiando el filtro o la búsqueda</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, animation: "fadeUp .4s ease .12s both" }}>
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
                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isActive ? `${C.pink}55` : C.border}`, background: isActive ? `linear-gradient(135deg, ${C.pink}, ${C.purple})` : "transparent", color: isActive ? "white" : C.creamSub, fontWeight: isActive ? 800 : 400, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: isActive ? `0 4px 14px rgba(204,89,173,0.35)` : "none", transition: "all .15s" }}>
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
