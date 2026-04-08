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
  hora: number; dia_semana: number;
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
const formatFecha = (d: Date) =>
  d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const tiempoRelativo = (d: Date) => {
  const diff = Date.now() - d.getTime(), min = Math.floor(diff / 60000);
  if (min < 1) return "Hace un momento";
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

// ========== COMPONENTES UI ==========

// ── Topbar con breadcrumb ────────────────────────────────────────────────────
function Topbar({ navigate, cursorOn, cursorOff }: { navigate: (p: string) => void; cursorOn: () => void; cursorOff: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 60, background: C.bgCard, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: SANS, boxShadow: `0 1px 3px ${C.shadow}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate("/admin/dashboard")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500, transition: "color 0.2s" }}>
          <Home size={14} strokeWidth={1.8} /> Inicio
        </button>
        <ChevronRight size={12} color={C.muted} />
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.orange, fontSize: 12, fontWeight: 700 }}>
          <Database size={14} strokeWidth={1.8} /> Backups
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: "4px 12px", borderRadius: 40, background: `${C.orange}10`, border: `1px solid ${C.orange}20` }}>
          <span style={{ fontSize: 10.5, color: C.orange, fontWeight: 600 }}>Cifrado SHA-256</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 40, background: `${C.success}10`, border: `1px solid ${C.success}20` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.success, display: "inline-block" }} />
          <span style={{ fontSize: 10.5, color: C.success, fontWeight: 600 }}>Sistema activo</span>
        </div>
      </div>
    </div>
  );
}

// ── KPI Strip (con palomita en la tarjeta de Tablas) ─────────────────────────
function KpiStrip({ historial, tablasSalud }: { historial: BackupEntry[]; tablasSalud: TablaInfo[] }) {
  const ultimoBackup = historial[0];
  const totalFilas = historial.reduce((s, e) => s + e.filas, 0);
  const items = [
    { label: "Respaldos", value: String(historial.length), icon: Database, color: C.orange, sub: "archivos guardados" },
    { label: "Filas", value: totalFilas > 0 ? totalFilas.toLocaleString("es-MX") : "—", icon: HardDrive, color: C.blue, sub: "registros respaldados" },
    { label: "Último", value: ultimoBackup ? tiempoRelativo(ultimoBackup.fecha) : "—", icon: Clock, color: C.gold, sub: ultimoBackup ? formatFecha(ultimoBackup.fecha) : "sin respaldo" },
    { label: "Tablas", value: String(tablasSalud.length), icon: CheckCircle, color: C.success, sub: "monitoreadas" }, // <-- cambiado a CheckCircle
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
      {items.map(({ label, value, icon: Icon, color, sub }) => (
        <div key={label} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px 20px", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: `0 1px 3px ${C.shadow}` }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 1px 3px ${C.shadow}`; }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}10`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: SERIF, color: C.ink, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── BackupRow ────────────────────────────────────────────────────────────────
function BackupRow({ entry, onDelete, deleting, isSelected, cursorOn, cursorOff }: {
  entry: BackupEntry; onDelete: (id: string) => void; deleting: boolean; isSelected: boolean;
  cursorOn: () => void; cursorOff: () => void;
}) {
  const esSelectivo = entry.filename.includes("selectivo");
  const esAuto = entry.filename.includes("auto");
  return (
    <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 8, background: isSelected ? `${C.orange}08` : "transparent", border: `1px solid ${isSelected ? `${C.orange}25` : C.border}`, transition: "all 0.2s", cursor: "pointer" }}
      onMouseEnter={cursorOn} onMouseLeave={cursorOff}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {esAuto && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 40, background: `${C.purple}10`, border: `1px solid ${C.purple}20`, color: C.purple, fontWeight: 700 }}>Auto</span>}
            {esSelectivo && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 40, background: `${C.gold}10`, border: `1px solid ${C.gold}20`, color: C.gold, fontWeight: 700 }}>Selectivo</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FM, color: C.ink, marginBottom: 4 }}>{entry.filename}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: C.muted }}>
            <span>{tiempoRelativo(entry.fecha)}</span>
            <span>•</span>
            <span>{formatFecha(entry.fecha)}</span>
            <span>•</span>
            <span>{formatBytes(entry.tamaño)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {entry.url_archivo && (
            <a href={entry.url_archivo} download={entry.filename} onClick={e => e.stopPropagation()} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ width: 30, height: 30, borderRadius: 8, background: `${C.blue}08`, border: `1px solid ${C.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Download size={12} color={C.blue} strokeWidth={2} />
            </a>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} disabled={deleting} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ width: 30, height: 30, borderRadius: 8, background: `${C.error}08`, border: `1px solid ${C.error}20`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {deleting ? <RefreshCw size={11} color={C.error} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} color={C.error} strokeWidth={2} />}
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
    <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={14} color={C.orange} strokeWidth={1.8} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>Historial de respaldos</span>
          {historial.length > 0 && <span style={{ padding: "2px 9px", borderRadius: 100, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, fontSize: 10.5, color: C.orange, fontWeight: 700 }}>{historial.length}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted }}>
          <ExternalLink size={10} />
          <span style={{ fontSize: 10.5 }}>Últimos 3 · Supabase Storage</span>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        {historial.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Database size={20} color={C.orange} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Sin respaldos aún</div>
            <div style={{ fontSize: 12, color: C.muted }}>Genera tu primer respaldo usando el botón naranja</div>
          </div>
        ) : (
          historial.map(entry => (
            <div key={entry.id} onClick={() => setSelected(entry)} style={{ cursor: "pointer" }}>
              <BackupRow entry={entry} onDelete={onDelete} deleting={deletingId === entry.id} isSelected={selected?.id === entry.id} cursorOn={cursorOn} cursorOff={cursorOff} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── DetallePanel ─────────────────────────────────────────────────────────────
function DetallePanel({ selected, cursorOn, cursorOff }: { selected: BackupEntry | null; cursorOn: () => void; cursorOff: () => void }) {
  if (!selected) {
    return (
      <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}` }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Info size={14} color={C.orange} strokeWidth={1.8} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>Detalle</span>
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <AlertCircle size={24} color={C.muted} strokeWidth={1.5} />
          <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Selecciona un respaldo para ver detalles</div>
        </div>
      </div>
    );
  }
  const stats = [
    { label: "Fecha", value: formatFecha(selected.fecha), color: C.blue },
    { label: "Tamaño", value: formatBytes(selected.tamaño), color: C.purple },
    { label: "Filas", value: selected.filas.toLocaleString("es-MX"), color: C.success },
    { label: "Tablas", value: selected.tablas, color: C.gold },
    { label: "Duración", value: selected.duracion, color: C.pink },
    { label: "Estado", value: "Exitoso", color: C.success },
  ];
  return (
    <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Info size={14} color={C.orange} strokeWidth={1.8} />
        </div>
        <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>Detalle del respaldo</span>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ marginBottom: 16, padding: "12px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>Archivo</div>
          <div style={{ fontSize: 11, fontFamily: FM, color: C.ink, wordBreak: "break-all" }}>{selected.filename}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map(({ label, value, color }) => (
            <div key={label} style={{ padding: "10px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "12px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Shield size={10} color={C.purple} strokeWidth={2} />
            <span style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>Checksum MD5</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: FM, color: C.ink, wordBreak: "break-all" }}>{selected.checksum}</div>
        </div>
        {selected.url_archivo && (
          <a
            href={selected.url_archivo}
            download={selected.filename}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, padding: "10px", borderRadius: 40, background: C.orange, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 12, transition: "background 0.2s" }}
            onMouseEnter={(e) => { cursorOn(); e.currentTarget.style.background = C.orangeDark; }}
            onMouseLeave={(e) => { cursorOff(); e.currentTarget.style.background = C.orange; }}>
            <Download size={14} /> Descargar
          </a>
        )}
      </div>
    </div>
  );
}

// ── EstadoTablas ─────────────────────────────────────────────────────────────
function EstadoTablas({ tablas, loading, onRefresh, cursorOn, cursorOff }: {
  tablas: TablaInfo[]; loading: boolean; onRefresh: () => void; cursorOn: () => void; cursorOff: () => void;
}) {
  const totalBytes = tablas.reduce((s, t) => s + t.bytes, 0);
  const maxFilas = Math.max(...tablas.map(t => t.filas), 1);
  const colors = [C.orange, C.purple, C.blue, C.pink, C.gold, C.success];
  return (
    <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `${C.success}10`, border: `1px solid ${C.success}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={14} color={C.success} strokeWidth={1.8} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>Estado de las tablas</span>
          <span style={{ padding: "2px 8px", borderRadius: 100, background: `${C.success}10`, border: `1px solid ${C.success}20`, fontSize: 10, color: C.success, fontWeight: 700 }}>{tablas.length} tablas</span>
          <span style={{ fontSize: 10.5, color: C.muted }}>{formatBytes(totalBytes)}</span>
        </div>
        <button onClick={onRefresh} disabled={loading} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ width: 28, height: 28, borderRadius: 8, background: C.inputBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={12} color={C.muted} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>
      <div style={{ padding: "16px 20px", maxHeight: 320, overflowY: "auto" }}>
        {loading && tablas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: C.muted }}>Cargando...</div>
        ) : (
          tablas.map((t, idx) => {
            const pct = Math.round((t.filas / maxFilas) * 100);
            const color = colors[idx % colors.length];
            return (
              <div key={t.nombre} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FM, color: C.ink }}>{t.nombre}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{t.filas.toLocaleString("es-MX")} filas · {formatBytes(t.bytes)}</span>
                </div>
                <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── SelectorTablas (MODIFICADO: muestra palomita cuando todas incluidas) ─────
function SelectorTablas({ tablas, excluidas, onChange, cursorOn, cursorOff }: {
  tablas: string[]; excluidas: string[]; onChange: (e: string[]) => void; cursorOn: () => void; cursorOff: () => void;
}) {
  const toggle = (t: string) => onChange(excluidas.includes(t) ? excluidas.filter(x => x !== t) : [...excluidas, t]);
  const incluidasCount = tablas.length - excluidas.length;
  const todasIncluidas = excluidas.length === 0;

  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 20, boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Selección de tablas</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {todasIncluidas && <CheckCircle size={14} color={C.success} />}
          <span style={{ fontSize: 12, color: todasIncluidas ? C.muted : C.orange, fontWeight: 600 }}>
            {incluidasCount} de {tablas.length} incluidas
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {tablas.map(t => {
          const excluida = excluidas.includes(t);
          return (
            <button key={t} onClick={() => toggle(t)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: excluida ? `${C.error}05` : `${C.success}05`, border: `1px solid ${excluida ? C.error : C.success}20`, cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: excluida ? "transparent" : C.success, border: `1px solid ${excluida ? C.error : C.success}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!excluida && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 11, fontFamily: FM, color: excluida ? C.error : C.success, textDecoration: excluida ? "line-through" : "none" }}>{t}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ConfigCron ───────────────────────────────────────────────────────────────
function ConfigCron({ config, onSave, saving, cursorOn, cursorOff }: {
  config: CronConfig | null; onSave: (c: Partial<CronConfig>) => void; saving: boolean; cursorOn: () => void; cursorOff: () => void;
}) {
  const [activo, setActivo] = useState(config?.activo ?? false);
  const [frecuencia, setFrecuencia] = useState<"diario" | "semanal" | "mensual">(config?.frecuencia ?? "diario");
  const [hora, setHora] = useState(config?.hora ?? 2);
  const [diaSemana, setDiaSemana] = useState(config?.dia_semana ?? 1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (config) {
      setActivo(config.activo);
      setFrecuencia(config.frecuencia);
      setHora(config.hora);
      setDiaSemana(config.dia_semana);
    }
  }, [config]);

  const descProxima = () => {
    if (!activo) return "Desactivado";
    const h = hora.toString().padStart(2, "0");
    if (frecuencia === "diario") return `Diario ${h}:00`;
    if (frecuencia === "semanal") return `${DIAS[diaSemana]} ${h}:00`;
    return `Día 1 cada mes ${h}:00`;
  };

  const handleSave = () => onSave({ activo, frecuencia, hora, dia_semana: diaSemana });

  return (
    <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer", padding: "14px 20px", borderBottom: expanded ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: activo ? `${C.success}10` : `${C.orange}10`, border: `1px solid ${activo ? C.success : C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={14} color={activo ? C.success : C.orange} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>Backup automático</span>
              <span style={{ padding: "2px 8px", borderRadius: 100, background: activo ? `${C.success}10` : `${C.muted}10`, border: `1px solid ${activo ? C.success : C.muted}20`, fontSize: 10, color: activo ? C.success : C.muted, fontWeight: 700 }}>{activo ? "Activo" : "Inactivo"}</span>
            </div>
            {activo && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{descProxima()}</div>}
          </div>
        </div>
        <ChevronDown size={16} color={C.muted} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </div>

      {expanded && (
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 14px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Activar backup automático</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{descProxima()}</div>
            </div>
            <button onClick={() => setActivo(!activo)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {activo ? <ToggleRight size={28} color={C.success} /> : <ToggleLeft size={28} color={C.muted} />}
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Frecuencia</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(["diario", "semanal", "mensual"] as const).map(f => (
                <button key={f} onClick={() => setFrecuencia(f)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ padding: "8px 4px", borderRadius: 40, border: `1.5px solid ${frecuencia === f ? C.orange : C.border}`, background: frecuencia === f ? `${C.orange}10` : "transparent", color: frecuencia === f ? C.orange : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: frecuencia === "semanal" ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Hora</label>
              <select value={hora} onChange={e => setHora(parseInt(e.target.value))} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, fontFamily: SANS }}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, "0")}:00</option>)}
              </select>
            </div>
            {frecuencia === "semanal" && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Día</label>
                <select value={diaSemana} onChange={e => setDiaSemana(parseInt(e.target.value))} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg }}>
                  {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {config && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              <div style={{ padding: "8px 12px", background: C.inputBg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>Última ejecución</div>
                <div style={{ fontSize: 11, color: C.ink }}>{config.ultima_ejecucion ? new Date(config.ultima_ejecucion).toLocaleString("es-MX") : "Nunca"}</div>
              </div>
              <div style={{ padding: "8px 12px", background: C.inputBg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>Próxima ejecución</div>
                <div style={{ fontSize: 11, color: activo ? C.success : C.muted }}>{config.proxima_ejecucion && activo ? new Date(config.proxima_ejecucion).toLocaleString("es-MX") : "—"}</div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "10px", borderRadius: 40, border: "none", background: C.orange, color: "white", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
            onMouseEnter={(e) => { cursorOn(); if (!saving) e.currentTarget.style.background = C.orangeDark; }}
            onMouseLeave={(e) => { cursorOff(); if (!saving) e.currentTarget.style.background = C.orange; }}>
            {saving ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── QueIncluye ───────────────────────────────────────────────────────────────
function QueIncluye() {
  const items = [
    { text: "Esquema completo (tablas, índices, FK)", color: C.success },
    { text: "Datos completos (INSERT INTO)", color: C.success },
    { text: "Reset de secuencias automático", color: C.success },
    { text: "Verificación MD5 de integridad", color: C.success },
    { text: "Guardado en Supabase Storage", color: C.orange },
    { text: "Máximo 3 backups en Storage", color: C.orange },
    { text: "Backup selectivo disponible", color: C.gold },
    { text: "Cron automático configurable", color: C.blue },
  ];
  return (
    <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, padding: "16px 20px", boxShadow: `0 2px 8px ${C.shadow}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${C.orange}10`, border: `1px solid ${C.orange}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={14} color={C.orange} strokeWidth={1.8} />
        </div>
        <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>¿Qué incluye?</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        {items.map(({ text, color }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={12} color={color} />
            <span style={{ fontSize: 12, color: C.ink }}>{text}</span>
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
    <div style={{ background: `linear-gradient(135deg, ${C.orangeLight}, ${C.bgCard})`, borderRadius: 24, padding: "28px 32px", marginBottom: 28, border: `1px solid ${C.border}`, boxShadow: `0 4px 12px ${C.shadow}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Star size={14} color={C.orange} fill={C.orange} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gestión de datos</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, fontFamily: SERIF, color: C.ink, margin: 0, lineHeight: 1.2 }}>
            Centro de <span style={{ color: C.orange }}>Respaldos</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Completo o selectivo · Supabase Storage · máx. 3 backups</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {tablasNames.length > 0 && (
            <button onClick={() => setShowSelector(s => !s)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 40, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: SANS }}>
              <Table2 size={12} />
              {esSelectivo ? `Selectivo: ${tablasIncluidas.length} tablas` : "Completo — todas las tablas"}
              {showSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button onClick={onGenerar} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, background: C.orange, border: "none", borderRadius: 40, padding: "10px 24px", color: "white", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "background 0.2s" }}
            onMouseEnter={(e) => { cursorOn(); if (!loading) e.currentTarget.style.background = C.orangeDark; }}
            onMouseLeave={(e) => { cursorOff(); if (!loading) e.currentTarget.style.background = C.orange; }}>
            <Database size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Generando respaldo..." : (esSelectivo ? `Backup selectivo (${tablasIncluidas.length} tablas)` : "Generar backup completo")}
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

  // Cursor personalizado
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

  // Efecto del cursor
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) {
          ringRef.current.style.left = `${rx}px`;
          ringRef.current.style.top = `${ry}px`;
        }
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

  // Funciones de carga (iguales)
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
        const tablas: TablaInfo[] = raw.map(t => ({ nombre: t.tabla ?? t.nombre ?? "—", filas: t.filas ?? 0, bytes: t.bytes ?? 0 }));
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
      <main style={{ flex: 1, padding: "24px 28px 40px", background: C.bgPage, minHeight: "100vh", fontFamily: SANS }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
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