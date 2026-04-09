// src/pages/private/admin/Backups.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Database, Download, CheckCircle, Clock, RefreshCw, Shield,
  HardDrive, FileText, ChevronRight, Trash2, Star, Info,
  ExternalLink, Table2, Activity, Calendar, ToggleLeft,
  ToggleRight, ChevronDown, ChevronUp, Zap, AlertCircle,
  Home, Check,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

// ========== PALETA CLARA ==========
const C = {
  orange: "#E8640C",
  orangeDark: "#D45A0A",
  orangeLight: "#FEE9E0",
  ink: "#14121E",
  muted: "#8A8A8A",
  border: "#EDEDE9",
  bgCard: "#FFFFFF",
  bgPage: "#F8F8F6",
  inputBg: "#F5F5F2",
  error: "#C4304A",
  success: "#1A7A45",
  successLight: "rgba(26,122,69,0.1)",
  shadow: "rgba(0,0,0,0.04)",
  purple: "#6028AA",
  blue: "#2D6FBE",
  gold: "#A87006",
  pink: "#A83B90",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BackupEntry {
  id: string; filename: string; fecha: Date; filas: number; tablas: number;
  duracion: string; checksum: string; tamaño: number; estado: "ok" | "error";
  url_archivo: string | null;
}
interface TablaInfo { nombre: string; filas: number; bytes: number; }
interface CronConfig {
  id: number; activo: boolean; frecuencia: "diario" | "semanal" | "mensual";
  hora: number; minuto: number; dia_semana: number;
  ultima_ejecucion: string | null; proxima_ejecucion: string | null;
}
interface BackupRaw {
  id: number | string; nombre_archivo: string; fecha: string;
  tamanio_bytes?: number; filas_total?: number; tablas?: number;
  duracion_ms?: number; checksum_md5?: string; url_archivo?: string | null;
}
interface TablaRaw { tabla?: string; nombre?: string; filas?: number; bytes?: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (b: number) => {
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
};
const formatFechaCompleta = (d: Date) =>
  d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatFechaCorta = (d: Date) =>
  d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const tiempoRelativo = (d: Date) => {
  const diff = Date.now() - d.getTime(), min = Math.floor(diff / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
};
const mapEntry = (e: BackupRaw): BackupEntry => ({
  id: String(e.id), filename: e.nombre_archivo, fecha: new Date(e.fecha),
  tamaño: e.tamanio_bytes ?? 0, filas: e.filas_total ?? 0, tablas: e.tablas ?? 0,
  duracion: e.duracion_ms ? `${(e.duracion_ms / 1000).toFixed(2)}s` : "—",
  checksum: e.checksum_md5 ?? "—", estado: "ok", url_archivo: e.url_archivo ?? null,
});
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function authHeaders() { return { Authorization: `Bearer ${authService.getToken()}` }; }
function authHeadersJson() { return { Authorization: `Bearer ${authService.getToken()}`, "Content-Type": "application/json" }; }

// ========== COMPONENTES UI REDISEÑADOS ==========

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate, cursorOn, cursorOff }: { navigate: (p: string) => void; cursorOn: () => void; cursorOff: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56, background: C.bgCard, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate("/admin/dashboard")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500 }}>
          <Home size={14} /> Inicio
        </button>
        <ChevronRight size={12} color={C.muted} />
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.orange, fontSize: 12, fontWeight: 700 }}>
          <Database size={14} /> Backups
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: "4px 12px", borderRadius: 40, background: `${C.orange}10`, border: `1px solid ${C.orange}20` }}>
          <span style={{ fontSize: 10.5, color: C.orange, fontWeight: 600 }}>SHA-256</span>
        </div>
        <div style={{ padding: "4px 12px", borderRadius: 40, background: `${C.success}10`, border: `1px solid ${C.success}20` }}>
          <span style={{ fontSize: 10.5, color: C.success, fontWeight: 600 }}>Activo</span>
        </div>
      </div>
    </div>
  );
}

// ── KPI Strip (compacto pero con info completa) ──────────────────────────────
function KpiStrip({ historial, tablasSalud }: { historial: BackupEntry[]; tablasSalud: TablaInfo[] }) {
  const ultimoBackup = historial[0];
  const totalFilas = historial.reduce((s, e) => s + e.filas, 0);
  const items = [
    { label: "Respaldos", value: historial.length, icon: Database, color: C.orange },
    { label: "Filas", value: totalFilas.toLocaleString("es-MX"), icon: HardDrive, color: C.blue },
    { label: "Último", value: ultimoBackup ? tiempoRelativo(ultimoBackup.fecha) : "—", icon: Clock, color: C.gold },
    { label: "Tablas", value: tablasSalud.length, icon: CheckCircle, color: C.success },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 1px 2px ${C.shadow}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: SERIF, color: C.ink, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BackupRow (con fecha completa y hora) ─────────────────────────────────────
function BackupRow({ entry, onDelete, deleting, isSelected, cursorOn, cursorOff }: {
  entry: BackupEntry; onDelete: (id: string) => void; deleting: boolean; isSelected: boolean;
  cursorOn: () => void; cursorOff: () => void;
}) {
  const esSelectivo = entry.filename.includes("selectivo");
  const esAuto = entry.filename.includes("auto");
  return (
    <div
      onClick={() => {}} // la selección se maneja en el padre
      onMouseEnter={cursorOn}
      onMouseLeave={cursorOff}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        marginBottom: 6,
        background: isSelected ? `${C.orange}08` : "transparent",
        border: `1px solid ${isSelected ? `${C.orange}30` : C.border}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            {esAuto && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 40, background: `${C.purple}10`, border: `1px solid ${C.purple}20`, color: C.purple, fontWeight: 700 }}>Auto</span>}
            {esSelectivo && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 40, background: `${C.gold}10`, border: `1px solid ${C.gold}20`, color: C.gold, fontWeight: 700 }}>Selectivo</span>}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FM, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.filename}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 10.5, color: C.muted, flexWrap: "wrap" }}>
            <span>{tiempoRelativo(entry.fecha)}</span>
            <span>•</span>
            <span>{formatFechaCompleta(entry.fecha)}</span>
            <span>•</span>
            <span>{formatBytes(entry.tamaño)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {entry.url_archivo && (
            <a href={entry.url_archivo} download={entry.filename} onClick={e => e.stopPropagation()} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ width: 28, height: 28, borderRadius: 7, background: `${C.blue}08`, border: `1px solid ${C.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Download size={12} color={C.blue} />
            </a>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} disabled={deleting} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ width: 28, height: 28, borderRadius: 7, background: `${C.error}08`, border: `1px solid ${C.error}20`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {deleting ? <RefreshCw size={11} color={C.error} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} color={C.error} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HistorialPanel ───────────────────────────────────────────────────────────
function HistorialPanel({ historial, selected, setSelected, onDelete, deletingId, cursorOn, cursorOff }: {
  historial: BackupEntry[]; selected: BackupEntry | null; setSelected: (e: BackupEntry) => void;
  onDelete: (id: string) => void; deletingId: string | null; cursorOn: () => void; cursorOff: () => void;
}) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.inputBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={14} color={C.orange} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Historial</span>
          {historial.length > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 40, background: `${C.orange}10`, color: C.orange, fontWeight: 600 }}>{historial.length}</span>}
        </div>
        <div style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
          <ExternalLink size={10} /> Supabase
        </div>
      </div>
      <div style={{ padding: "8px", maxHeight: 320, overflowY: "auto" }}>
        {historial.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <Database size={24} color={C.muted} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: C.muted }}>Sin respaldos</div>
          </div>
        ) : (
          historial.map(entry => (
            <div key={entry.id} onClick={() => setSelected(entry)}>
              <BackupRow entry={entry} onDelete={onDelete} deleting={deletingId === entry.id} isSelected={selected?.id === entry.id} cursorOn={cursorOn} cursorOff={cursorOff} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── DetallePanel (con checksum) ──────────────────────────────────────────────
function DetallePanel({ selected, cursorOn, cursorOff }: { selected: BackupEntry | null; cursorOn: () => void; cursorOff: () => void }) {
  if (!selected) {
    return (
      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px 16px", textAlign: "center", marginBottom: 20 }}>
        <Info size={24} color={C.muted} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: C.muted }}>Selecciona un respaldo</div>
      </div>
    );
  }
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Detalle</span>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ marginBottom: 12, fontSize: 11, fontFamily: FM, color: C.muted, wordBreak: "break-all", background: C.inputBg, padding: "8px 10px", borderRadius: 8 }}>
          {selected.filename}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div><div style={{ fontSize: 9, color: C.muted }}>Fecha</div><div style={{ fontSize: 12, fontWeight: 500 }}>{formatFechaCompleta(selected.fecha)}</div></div>
          <div><div style={{ fontSize: 9, color: C.muted }}>Tamaño</div><div style={{ fontSize: 12, fontWeight: 500 }}>{formatBytes(selected.tamaño)}</div></div>
          <div><div style={{ fontSize: 9, color: C.muted }}>Filas</div><div style={{ fontSize: 12, fontWeight: 500 }}>{selected.filas.toLocaleString("es-MX")}</div></div>
          <div><div style={{ fontSize: 9, color: C.muted }}>Tablas</div><div style={{ fontSize: 12, fontWeight: 500 }}>{selected.tablas}</div></div>
          <div><div style={{ fontSize: 9, color: C.muted }}>Duración</div><div style={{ fontSize: 12, fontWeight: 500 }}>{selected.duracion}</div></div>
          <div><div style={{ fontSize: 9, color: C.muted }}>Estado</div><div style={{ fontSize: 12, fontWeight: 500, color: C.success }}>Exitoso</div></div>
        </div>
        <div style={{ marginBottom: 12, padding: "8px 10px", background: C.inputBg, borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: C.muted }}>Checksum MD5</div>
          <div style={{ fontSize: 10, fontFamily: FM, color: C.ink, wordBreak: "break-all" }}>{selected.checksum}</div>
        </div>
        {selected.url_archivo && (
          <a href={selected.url_archivo} download={selected.filename} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.orange, color: "white", padding: "8px", borderRadius: 40, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
            <Download size={12} /> Descargar
          </a>
        )}
      </div>
    </div>
  );
}

// ── EstadoTablas (con barras de progreso) ────────────────────────────────────
function EstadoTablas({ tablas, loading, onRefresh, cursorOn, cursorOff }: {
  tablas: TablaInfo[]; loading: boolean; onRefresh: () => void; cursorOn: () => void; cursorOff: () => void;
}) {
  const totalBytes = tablas.reduce((s, t) => s + t.bytes, 0);
  const maxFilas = Math.max(...tablas.map(t => t.filas), 1);
  const colors = [C.orange, C.purple, C.blue, C.pink, C.gold, C.success];
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.inputBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={14} color={C.success} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Tablas</span>
          <span style={{ fontSize: 11, color: C.muted }}>{tablas.length} · {formatBytes(totalBytes)}</span>
        </div>
        <button onClick={onRefresh} disabled={loading} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ width: 28, height: 28, borderRadius: 8, background: C.inputBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={12} color={C.muted} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>
      <div style={{ padding: "12px", maxHeight: 280, overflowY: "auto" }}>
        {loading && tablas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: C.muted }}>Cargando...</div>
        ) : (
          tablas.map((t, idx) => {
            const pct = Math.round((t.filas / maxFilas) * 100);
            const color = colors[idx % colors.length];
            return (
              <div key={t.nombre} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, fontFamily: FM, color: C.ink }}>{t.nombre}</span>
                  <span style={{ color: C.muted }}>{t.filas.toLocaleString("es-MX")} filas · {formatBytes(t.bytes)}</span>
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── SelectorTablas (con palomita cuando todas incluidas) ─────────────────────
function SelectorTablas({ tablas, excluidas, onChange, cursorOn, cursorOff }: {
  tablas: string[]; excluidas: string[]; onChange: (e: string[]) => void; cursorOn: () => void; cursorOff: () => void;
}) {
  const toggle = (t: string) => onChange(excluidas.includes(t) ? excluidas.filter(x => x !== t) : [...excluidas, t]);
  const todasIncluidas = excluidas.length === 0;
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "12px 16px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Table2 size={14} color={C.orange} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Tablas a respaldar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {todasIncluidas && <CheckCircle size={12} color={C.success} />}
          <span style={{ fontSize: 11, color: todasIncluidas ? C.muted : C.orange }}>{tablas.length - excluidas.length} de {tablas.length}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6, maxHeight: 200, overflowY: "auto" }}>
        {tablas.map(t => {
          const excluida = excluidas.includes(t);
          return (
            <button key={t} onClick={() => toggle(t)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 8, background: excluida ? `${C.error}05` : `${C.success}05`, border: `1px solid ${excluida ? C.error : C.success}20`, cursor: "pointer", fontSize: 11, fontFamily: FM, color: excluida ? C.error : C.success, textDecoration: excluida ? "line-through" : "none" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: excluida ? "transparent" : C.success, border: `1px solid ${excluida ? C.error : C.success}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!excluida && <Check size={8} color="white" />}
              </div>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ConfigCron (con minutos y AM/PM) ─────────────────────────────────────────
function ConfigCron({ config, onSave, saving, cursorOn, cursorOff }: {
  config: CronConfig | null; onSave: (c: Partial<CronConfig>) => void; saving: boolean; cursorOn: () => void; cursorOff: () => void;
}) {
  const [activo, setActivo] = useState(config?.activo ?? false);
  const [frecuencia, setFrecuencia] = useState<"diario" | "semanal" | "mensual">(config?.frecuencia ?? "diario");
  const [hora12, setHora12] = useState(() => {
    const h = config?.hora ?? 2;
    return h % 12 === 0 ? 12 : h % 12;
  });
  const [minuto, setMinuto] = useState(config?.minuto ?? 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(() => (config?.hora ?? 2) >= 12 ? "PM" : "AM");
  const [diaSemana, setDiaSemana] = useState(config?.dia_semana ?? 1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (config) {
      setActivo(config.activo);
      setFrecuencia(config.frecuencia);
      const h = config.hora;
      setHora12(h % 12 === 0 ? 12 : h % 12);
      setAmpm(h >= 12 ? "PM" : "AM");
      setMinuto(config.minuto ?? 0);
      setDiaSemana(config.dia_semana);
    }
  }, [config]);

  const getHora24 = () => {
    let h = hora12 % 12;
    if (ampm === "PM") h += 12;
    return h;
  };

  const descProxima = () => {
    if (!activo) return "Desactivado";
    const h = hora12.toString().padStart(2, "0");
    const m = minuto.toString().padStart(2, "0");
    if (frecuencia === "diario") return `Diario ${h}:${m} ${ampm}`;
    if (frecuencia === "semanal") return `${DIAS[diaSemana]} ${h}:${m} ${ampm}`;
    return `Día 1, ${h}:${m} ${ampm}`;
  };

  const handleSave = () => {
    const hora24 = getHora24();
    onSave({ activo, frecuencia, hora: hora24, minuto, dia_semana: diaSemana });
  };

  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.inputBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={activo ? C.success : C.orange} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Backup automático</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 40, background: activo ? `${C.success}10` : `${C.muted}10`, color: activo ? C.success : C.muted }}>{activo ? "Activo" : "Inactivo"}</span>
        </div>
        <ChevronDown size={14} color={C.muted} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </div>
      {expanded && (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: C.muted }}>{descProxima()}</span>
            <button onClick={() => setActivo(!activo)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ background: "none", border: "none", cursor: "pointer" }}>
              {activo ? <ToggleRight size={24} color={C.success} /> : <ToggleLeft size={24} color={C.muted} />}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <select value={frecuencia} onChange={e => setFrecuencia(e.target.value as any)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 12 }}>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
            {frecuencia === "semanal" && (
              <select value={diaSemana} onChange={e => setDiaSemana(parseInt(e.target.value))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 12 }}>
                {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select value={hora12} onChange={e => setHora12(parseInt(e.target.value))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 12, flex: 1 }}>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{(i + 1).toString().padStart(2, "0")}</option>)}
            </select>
            <select value={minuto} onChange={e => setMinuto(parseInt(e.target.value))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 12, flex: 1 }}>
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>)}
            </select>
            <select value={ampm} onChange={e => setAmpm(e.target.value as "AM" | "PM")} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 12, width: 70 }}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ width: "100%", padding: "8px", borderRadius: 40, border: "none", background: C.orange, color: "white", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {saving ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={12} />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── QueIncluye (compacto) ─────────────────────────────────────────────────────
function QueIncluye() {
  const items = [
    "Esquema completo", "Datos completos", "Reset de secuencias",
    "Verificación MD5", "Supabase Storage", "Máx. 3 backups",
    "Backup selectivo", "Cron automático",
  ];
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Shield size={14} color={C.orange} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>¿Qué incluye?</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {items.map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
            <CheckCircle size={10} color={C.success} /> {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Banner principal ─────────────────────────────────────────────────────────
function BackupBanner({ loading, esSelectivo, tablasIncluidas, tablasNames, showSelector, setShowSelector, onGenerar, cursorOn, cursorOff }: {
  loading: boolean; esSelectivo: boolean; tablasIncluidas: string[]; tablasNames: string[];
  showSelector: boolean; setShowSelector: (fn: (v: boolean) => boolean) => void; onGenerar: () => void;
  cursorOn: () => void; cursorOff: () => void;
}) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.orangeLight}, ${C.bgCard})`, borderRadius: 20, padding: "20px 24px", marginBottom: 24, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Star size={12} color={C.orange} fill={C.orange} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, textTransform: "uppercase" }}>Gestión de datos</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: SERIF, color: C.ink, margin: 0 }}>Centro de Respaldos</h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Completo o selectivo · Supabase Storage</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {tablasNames.length > 0 && (
            <button onClick={() => setShowSelector(s => !s)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 40, padding: "6px 14px", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              <Table2 size={12} />
              {esSelectivo ? `Selectivo (${tablasIncluidas.length})` : "Completo"}
              {showSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button onClick={onGenerar} disabled={loading} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ display: "flex", alignItems: "center", gap: 8, background: C.orange, border: "none", borderRadius: 40, padding: "8px 20px", color: "white", fontWeight: 600, fontSize: 12, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            <Database size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Generando..." : (esSelectivo ? `Backup (${tablasIncluidas.length})` : "Backup completo")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
export default function Backups() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<BackupEntry[]>([]);
  const [selected, setSelected] = useState<BackupEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tablasSalud, setTablasSalud] = useState<TablaInfo[]>([]);
  const [loadingTablas, setLoadingTablas] = useState(false);
  const [cronConfig, setCronConfig] = useState<CronConfig | null>(null);
  const [savingCron, setSavingCron] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [tablasNames, setTablasNames] = useState<string[]>([]);
  const [tablasExcluidas, setTablasExcluidas] = useState<string[]>([]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) { dotRef.current.style.left = `${mx}px`; dotRef.current.style.top = `${my}px`; }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/backups/historial`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setHistorial((json.data || []).map(mapEntry));
    } catch { /* ignore */ }
  }, []);

  const cargarTablasSalud = useCallback(async () => {
    setLoadingTablas(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/backups/tablas`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const raw: TablaRaw[] = json.data?.tablas || json.data || [];
        const tablas = raw.map(t => ({ nombre: t.tabla ?? t.nombre ?? "—", filas: t.filas ?? 0, bytes: t.bytes ?? 0 }));
        setTablasSalud(tablas);
        setTablasNames(tablas.map(t => t.nombre));
      }
    } catch { /* ignore */ }
    finally { setLoadingTablas(false); }
  }, []);

  const cargarCron = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/backups/cron`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setCronConfig(json.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    cargarHistorial();
    cargarTablasSalud();
    cargarCron();
  }, [cargarHistorial, cargarTablasSalud, cargarCron]);

  const handleGenerarBackup = useCallback(async () => {
    setLoading(true);
    const tablasIncluidas = tablasNames.filter(t => !tablasExcluidas.includes(t));
    const tablasAEnviar = tablasExcluidas.length > 0 ? tablasIncluidas : null;
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, { method: "POST", headers: authHeadersJson(), body: JSON.stringify({ tablas: tablasAEnviar }) });
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al generar el respaldo", "err"); return; }
      await cargarHistorial();
      await cargarTablasSalud();
      showToast(json.message, "ok");
    } catch { showToast("Error de conexión", "err"); }
    finally { setLoading(false); }
  }, [tablasNames, tablasExcluidas, cargarHistorial, cargarTablasSalud, showToast]);

  const handleEliminar = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/backups/${id}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHistorial(prev => prev.filter(e => e.id !== id));
      setSelected(prev => prev?.id === id ? null : prev);
      showToast("Backup eliminado", "ok");
    } catch { showToast("Error al eliminar", "err"); }
    finally { setDeletingId(null); }
  }, [showToast]);

  const handleSaveCron = useCallback(async (data: Partial<CronConfig>) => {
    setSavingCron(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/backups/cron`, { method: "POST", headers: authHeadersJson(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setCronConfig(json.data);
      showToast(json.message ?? "Configuración guardada", "ok");
    } catch { showToast("Error al guardar configuración", "err"); }
    finally { setSavingCron(false); }
  }, [showToast]);

  const esSelectivo = tablasExcluidas.length > 0;
  const tablasIncluidas = tablasNames.filter(t => !tablasExcluidas.includes(t));

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cur-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width .22s, height .22s, background .22s;
        }
        .cur-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .cur-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .cur-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
      `}</style>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />

      <Topbar navigate={navigate} cursorOn={cursorOn} cursorOff={cursorOff} />
      <main style={{ padding: "24px 24px 40px", background: C.bgPage, minHeight: "100vh", fontFamily: SANS }}>
        <BackupBanner
          loading={loading}
          esSelectivo={esSelectivo}
          tablasIncluidas={tablasIncluidas}
          tablasNames={tablasNames}
          showSelector={showSelector}
          setShowSelector={setShowSelector}
          onGenerar={handleGenerarBackup}
          cursorOn={cursorOn}
          cursorOff={cursorOff}
        />
        {showSelector && tablasNames.length > 0 && (
          <SelectorTablas tablas={tablasNames} excluidas={tablasExcluidas} onChange={setTablasExcluidas} cursorOn={cursorOn} cursorOff={cursorOff} />
        )}
        <KpiStrip historial={historial} tablasSalud={tablasSalud} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          <div>
            <HistorialPanel
              historial={historial}
              selected={selected}
              setSelected={setSelected}
              onDelete={handleEliminar}
              deletingId={deletingId}
              cursorOn={cursorOn}
              cursorOff={cursorOff}
            />
            <EstadoTablas tablas={tablasSalud} loading={loadingTablas} onRefresh={cargarTablasSalud} cursorOn={cursorOn} cursorOff={cursorOff} />
          </div>
          <div>
            <DetallePanel selected={selected} cursorOn={cursorOn} cursorOff={cursorOff} />
            <ConfigCron config={cronConfig} onSave={handleSaveCron} saving={savingCron} cursorOn={cursorOn} cursorOff={cursorOff} />
            <QueIncluye />
          </div>
        </div>
      </main>
    </>
  );
}