// src/pages/private/admin/Backups.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  Database, Download, CheckCircle, Clock, RefreshCw, Shield,
  HardDrive, FileText, ChevronRight, Trash2, Star, Info,
  ExternalLink, Table2, Activity, Calendar, ToggleLeft,
  ToggleRight, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast }    from "../../../context/ToastContext";

const C = {
  orange:"#FF840E", pink:"#CC59AD", purple:"#8D4CCD",
  blue:"#79AAF5",   gold:"#FFC110", green:"#22C97A",
  cream:"#FFF8EE",  creamSub:"#D8CABC",
  creamMut:"rgba(255,232,200,0.35)",
  bgDeep:"#070510", card:"rgba(18,13,30,0.95)",
  border:"rgba(255,200,150,0.08)", borderBr:"rgba(118,78,49,0.20)",
  red:"#F87171",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BackupEntry {
  id: string; filename: string; fecha: Date; filas: number; tablas: number;
  duracion: string; checksum: string; tamaño: number; estado: "ok" | "error";
  url_archivo: string | null; tablas_incluidas: string[] | null;
}
interface TablaInfo {
  nombre: string; filas: number; bytes: number; en_ultimo_backup: boolean; error?: boolean;
}
interface CronConfig {
  id: number; activo: boolean; frecuencia: "diario" | "semanal" | "mensual";
  hora: number; dia_semana: number; tablas: string[] | null;
  ultima_ejecucion: string | null; proxima_ejecucion: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}
function formatFecha(d: Date) {
  return d.toLocaleString("es-MX", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function tiempoRelativo(d: Date) {
  const diff = Date.now() - d.getTime(), min = Math.floor(diff / 60000);
  if (min < 1)  return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(e: any): BackupEntry {
  return {
    id: String(e.id), filename: e.nombre_archivo, fecha: new Date(e.fecha),
    tamaño: e.tamanio_bytes ?? 0, filas: e.filas_total ?? 0, tablas: e.tablas ?? 0,
    duracion: e.duracion_ms ? `${(e.duracion_ms / 1000).toFixed(2)}s` : "—",
    checksum: e.checksum_md5 ?? "—", estado: "ok",
    url_archivo: e.url_archivo ?? null,
    tablas_incluidas: e.tablas_incluidas ?? null,
  };
}
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:C.purple, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }} onClick={() => navigate("/admin")}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize:13, color:C.creamSub }}>Backups</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:100, background:"rgba(141,76,205,0.08)", border:`1px solid rgba(141,76,205,0.20)` }}>
          <Shield size={11} color={C.purple} strokeWidth={2} />
          <span style={{ fontSize:11, color:C.creamMut }}>Datos cifrados</span>
          <span style={{ fontSize:11, color:C.purple, fontWeight:700 }}>SHA-256</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:100, background:"rgba(34,201,122,0.06)", border:`1px solid rgba(34,201,122,0.18)` }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:C.green }} />
          <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>Sistema activo</span>
        </div>
      </div>
    </div>
  );
}

// ── MiniKpi ───────────────────────────────────────────────────────────────────
function MiniKpi({ label, value, icon:Icon, accent }: { label:string; value:string|number; icon:React.ElementType; accent:string }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:40, height:40, borderRadius:10, background:`${accent}12`, border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={18} color={accent} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, marginTop:3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── BackupRow ─────────────────────────────────────────────────────────────────
function BackupRow({ entry, onDelete, deleting }: { entry:BackupEntry; onDelete:(id:string)=>void; deleting:boolean }) {
  const [hovered, setHovered] = useState(false);
  const esSelectivo = entry.tablas_incluidas && entry.tablas_incluidas.length > 0;
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:"grid", gridTemplateColumns:"1fr 90px 80px 70px 60px 80px", alignItems:"center", gap:12, padding:"13px 18px", borderRadius:10,
        background: hovered ? "rgba(141,76,205,0.06)" : "transparent",
        border:`1px solid ${hovered ? "rgba(141,76,205,0.20)" : "transparent"}`,
        transition:"all .15s", opacity: deleting ? 0.5 : 1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:"rgba(34,201,122,0.10)", border:"1px solid rgba(34,201,122,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <CheckCircle size={15} color={C.green} strokeWidth={2} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.cream, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.filename}</span>
            {esSelectivo && (
              <span style={{ fontSize:10, padding:"1px 6px", borderRadius:100, background:"rgba(255,193,16,0.12)", border:"1px solid rgba(255,193,16,0.28)", color:C.gold, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
                Selectivo
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:1 }}>
            <Clock size={9} color={C.creamMut} style={{ verticalAlign:"middle", marginRight:4 }} />
            {tiempoRelativo(entry.fecha)} · {formatFecha(entry.fecha)}
          </div>
        </div>
      </div>
      <div style={{ fontSize:12.5, color:C.creamSub, fontFamily:FB, textAlign:"right" }}>{formatBytes(entry.tamaño)}</div>
      <div style={{ fontSize:12.5, color:C.creamSub, fontFamily:FB, textAlign:"right" }}>{entry.filas > 0 ? `${entry.filas.toLocaleString("es-MX")} filas` : "—"}</div>
      <div style={{ fontSize:12.5, color:C.creamMut, fontFamily:FB, textAlign:"right" }}>{entry.tablas > 0 ? `${entry.tablas} tablas` : "—"}</div>
      <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB, textAlign:"right" }}>{entry.duracion}</div>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
        <a href={entry.url_archivo!} download={entry.filename}
          style={{ width:30, height:30, borderRadius:7, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.25)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", textDecoration:"none" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(121,170,245,0.22)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(121,170,245,0.10)"}>
          <Download size={13} color={C.blue} strokeWidth={2} />
        </a>
        <button onClick={() => onDelete(entry.id)} disabled={deleting}
          style={{ width:30, height:30, borderRadius:7, background:"rgba(204,89,173,0.06)", border:"1px solid rgba(204,89,173,0.18)", display:"flex", alignItems:"center", justifyContent:"center", cursor: deleting ? "wait" : "pointer" }}
          onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background="rgba(204,89,173,0.18)"; }}
          onMouseLeave={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background="rgba(204,89,173,0.06)"; }}>
          {deleting
            ? <RefreshCw size={11} color={C.pink} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} />
            : <Trash2 size={13} color={C.pink} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

// ── SelectorTablas ────────────────────────────────────────────────────────────
function SelectorTablas({
  tablas, seleccionadas, onChange, accent = C.orange, columns = 2,
}: {
  tablas: string[]; seleccionadas: string[]; onChange: (t: string[]) => void;
  accent?: string; columns?: number;
}) {
  const todas = seleccionadas.length === tablas.length;
  const toggle = (t: string) => {
    onChange(seleccionadas.includes(t) ? seleccionadas.filter(x => x !== t) : [...seleccionadas, t]);
  };
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.creamMut, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB }}>
          Tablas a incluir
        </span>
        <button onClick={() => onChange(todas ? [] : [...tablas])}
          style={{ fontSize:11, color:accent, background:"transparent", border:"none", cursor:"pointer", fontFamily:FB, fontWeight:700 }}>
          {todas ? "Deseleccionar todas" : "Seleccionar todas"}
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${columns},1fr)`, gap:5, maxHeight:200, overflowY:"auto", paddingRight:4 }}>
        {tablas.map(t => {
          const sel = seleccionadas.includes(t);
          return (
            <div key={t} onClick={() => toggle(t)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", borderRadius:8, cursor:"pointer",
                background: sel ? `${accent}10` : "rgba(255,255,255,0.02)",
                border:`1px solid ${sel ? `${accent}30` : "rgba(255,255,255,0.06)"}`,
                transition:"all .12s" }}>
              <div style={{ width:14, height:14, borderRadius:4, border:`1.5px solid ${sel ? accent : "rgba(255,255,255,0.20)"}`,
                background: sel ? accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {sel && <CheckCircle size={9} color="#000" strokeWidth={3} />}
              </div>
              <span style={{ fontSize:12, color: sel ? C.cream : C.creamMut, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:8, fontSize:11, color:C.creamMut, fontFamily:FB }}>
        {seleccionadas.length === 0 ? (
          <span style={{ color:C.red }}>⚠ Selecciona al menos una tabla (0 = backup completo)</span>
        ) : seleccionadas.length === tablas.length ? (
          <span style={{ color:C.green }}>✓ Backup completo — todas las tablas</span>
        ) : (
          <span>{seleccionadas.length} de {tablas.length} tablas seleccionadas</span>
        )}
      </div>
    </div>
  );
}

// ── EstadoTablas ──────────────────────────────────────────────────────────────
function EstadoTablas({ tablas, loading, onRefresh }: { tablas: TablaInfo[]; loading: boolean; onRefresh: () => void }) {
  const totalFilas = tablas.reduce((s, t) => s + t.filas, 0);
  const totalBytes = tablas.reduce((s, t) => s + t.bytes, 0);
  const maxFilas   = Math.max(...tablas.map(t => t.filas), 1);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Activity size={15} color={C.green} strokeWidth={2} />
          <span style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FD }}>Estado de salud</span>
          <span style={{ padding:"2px 8px", borderRadius:100, background:"rgba(34,201,122,0.10)", border:"1px solid rgba(34,201,122,0.22)", fontSize:11, color:C.green, fontWeight:700 }}>
            {tablas.length} tablas
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{formatBytes(totalBytes)} · {totalFilas.toLocaleString("es-MX")} filas</span>
          <button onClick={onRefresh} disabled={loading}
            style={{ width:28, height:28, borderRadius:7, background:"rgba(34,201,122,0.08)", border:"1px solid rgba(34,201,122,0.20)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <RefreshCw size={12} color={C.green} strokeWidth={2} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>
      <div style={{ padding:"6px 8px", maxHeight:320, overflowY:"auto" }}>
        {loading && tablas.length === 0 ? (
          <div style={{ padding:"32px", textAlign:"center", color:C.creamMut, fontSize:13, fontFamily:FB }}>Cargando...</div>
        ) : tablas.map((t, i) => {
          const pct      = Math.round((t.filas / maxFilas) * 100);
          const noBackup = !t.en_ultimo_backup;
          return (
            <div key={`${t.nombre}-${i}`} style={{ padding:"10px 10px", borderRadius:8, marginBottom:3,
              background: noBackup ? "rgba(255,193,16,0.03)" : "transparent",
              border:`1px solid ${noBackup ? "rgba(255,193,16,0.12)" : "transparent"}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <Table2 size={12} color={noBackup ? C.gold : C.creamMut} strokeWidth={2} />
                  <span style={{ fontSize:12.5, fontWeight:600, color:C.cream, fontFamily:"monospace" }}>{t.nombre}</span>
                  {noBackup && (
                    <span style={{ fontSize:10, padding:"1px 6px", borderRadius:100, background:"rgba(255,193,16,0.10)", border:"1px solid rgba(255,193,16,0.25)", color:C.gold }}>
                      Sin backup
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>{formatBytes(t.bytes)}</span>
                  <span style={{ fontSize:12, color:C.creamSub, fontFamily:"monospace", fontWeight:700, minWidth:60, textAlign:"right" }}>
                    {t.filas.toLocaleString("es-MX")}
                    <span style={{ fontSize:10, color:C.creamMut, fontWeight:400 }}> filas</span>
                  </span>
                </div>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${C.purple},${C.blue})`, borderRadius:99, transition:"width .4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ConfigCron ────────────────────────────────────────────────────────────────
function ConfigCron({ config, tablas, onSave, saving }:
  { config: CronConfig | null; tablas: string[]; onSave: (c: Partial<CronConfig>) => void; saving: boolean }) {
  const [activo,     setActivo]     = useState(config?.activo ?? false);
  const [frecuencia, setFrecuencia] = useState<"diario"|"semanal"|"mensual">(config?.frecuencia ?? "diario");
  const [hora,       setHora]       = useState(config?.hora ?? 2);
  const [diaSemana,  setDiaSemana]  = useState(config?.dia_semana ?? 1);
  const [usarTablas, setUsarTablas] = useState(false);
  const [tablasSelC, setTablasSelC] = useState<string[]>(config?.tablas ?? []);
  const [expanded,   setExpanded]   = useState(false);

  useEffect(() => {
    if (!config) return;
    setActivo(config.activo);
    setFrecuencia(config.frecuencia);
    setHora(config.hora);
    setDiaSemana(config.dia_semana);
    setUsarTablas(!!config.tablas && config.tablas.length > 0);
    setTablasSelC(config.tablas ?? []);
  }, [config]);

  const handleSave = () => {
    onSave({
      activo, frecuencia, hora, dia_semana: diaSemana,
      tablas: usarTablas && tablasSelC.length > 0 ? tablasSelC : null,
    });
  };

  const descProxima = () => {
    if (!activo) return "Cron desactivado";
    const h = hora.toString().padStart(2, "0");
    if (frecuencia === "diario")  return `Todos los días a las ${h}:00`;
    if (frecuencia === "semanal") return `Cada ${DIAS[diaSemana]} a las ${h}:00`;
    return `El día 1 de cada mes a las ${h}:00`;
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${activo ? "rgba(34,201,122,0.22)" : C.border}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
      <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Calendar size={15} color={activo ? C.green : C.purple} strokeWidth={2} />
          <span style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FD }}>Backup automático</span>
          <span style={{ padding:"2px 8px", borderRadius:100,
            background: activo ? "rgba(34,201,122,0.10)" : "rgba(255,255,255,0.04)",
            border:`1px solid ${activo ? "rgba(34,201,122,0.25)" : "rgba(255,255,255,0.08)"}`,
            fontSize:11, color: activo ? C.green : C.creamMut, fontWeight:700 }}>
            {activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        {expanded ? <ChevronUp size={14} color={C.creamMut} /> : <ChevronDown size={14} color={C.creamMut} />}
      </div>

      {expanded && (
        <div style={{ padding:"18px" }}>
          {/* Toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:`1px solid rgba(255,255,255,0.06)` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.cream, fontFamily:FB }}>Activar backup automático</div>
              <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{descProxima()}</div>
            </div>
            <button onClick={() => setActivo(a => !a)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:0 }}>
              {activo
                ? <ToggleRight size={32} color={C.green}    strokeWidth={1.8} />
                : <ToggleLeft  size={32} color={C.creamMut} strokeWidth={1.8} />}
            </button>
          </div>

          {/* Frecuencia */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.creamMut, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:6 }}>Frecuencia</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
              {(["diario","semanal","mensual"] as const).map(f => (
                <button key={f} onClick={() => setFrecuencia(f)}
                  style={{ padding:"9px", borderRadius:9,
                    border:`1px solid ${frecuencia === f ? `${C.purple}50` : "rgba(255,255,255,0.08)"}`,
                    background: frecuencia === f ? "rgba(141,76,205,0.12)" : "rgba(255,255,255,0.02)",
                    color: frecuencia === f ? C.cream : C.creamMut,
                    fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FB, textTransform:"capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Hora / Día semana */}
          <div style={{ marginBottom:14, display:"grid", gridTemplateColumns: frecuencia === "semanal" ? "1fr 1fr" : "1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.creamMut, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:6 }}>Hora del día</label>
              <select value={hora} onChange={e => setHora(parseInt(e.target.value))}
                style={{ width:"100%", padding:"8px 12px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", color:C.cream, fontSize:13, fontFamily:FB, cursor:"pointer" }}>
                {Array.from({ length:24 }, (_, i) => (
                  <option key={i} value={i} style={{ background:"#0C0812" }}>{String(i).padStart(2,"0")}:00</option>
                ))}
              </select>
            </div>
            {frecuencia === "semanal" && (
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.creamMut, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:6 }}>Día de la semana</label>
                <select value={diaSemana} onChange={e => setDiaSemana(parseInt(e.target.value))}
                  style={{ width:"100%", padding:"8px 12px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", color:C.cream, fontSize:13, fontFamily:FB, cursor:"pointer" }}>
                  {DIAS.map((d, i) => <option key={i} value={i} style={{ background:"#0C0812" }}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Tablas específicas — 1 columna (panel angosto) */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:C.creamMut, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB }}>Tablas específicas</label>
              <button onClick={() => setUsarTablas(u => !u)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:0 }}>
                {usarTablas
                  ? <ToggleRight size={22} color={C.orange}  strokeWidth={1.8} />
                  : <ToggleLeft  size={22} color={C.creamMut} strokeWidth={1.8} />}
              </button>
            </div>
            {usarTablas && tablas.length > 0 && (
              <SelectorTablas
                tablas={tablas}
                seleccionadas={tablasSelC}
                onChange={setTablasSelC}
                accent={C.purple}
                columns={1}
              />
            )}
            {!usarTablas && (
              <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>El cron hará backup completo (todas las tablas)</div>
            )}
          </div>

          {/* Última / próxima */}
          {config && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {[
                { label:"Última ejecución",  val: config.ultima_ejecucion  ? new Date(config.ultima_ejecucion).toLocaleString("es-MX")                        : "Nunca", color: C.creamMut },
                { label:"Próxima ejecución", val: config.proxima_ejecucion && activo ? new Date(config.proxima_ejecucion).toLocaleString("es-MX") : "—", color: activo ? C.green : C.creamMut },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.10em", textTransform:"uppercase", fontFamily:FB, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:12, color, fontFamily:FB }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{ width:"100%", padding:"11px", borderRadius:10,
              background: saving ? "rgba(141,76,205,0.08)" : `linear-gradient(135deg,${C.purple},#6B35A8)`,
              border:`1px solid rgba(141,76,205,0.40)`,
              color: saving ? C.creamMut : "white", fontWeight:700, fontSize:13,
              cursor: saving ? "wait" : "pointer", fontFamily:FB,
              display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            {saving ? <RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Zap size={14} />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}

      {!expanded && config?.activo && config.proxima_ejecucion && (
        <div style={{ padding:"10px 18px", display:"flex", alignItems:"center", gap:6 }}>
          <Zap size={11} color={C.green} />
          <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>
            Próximo: <span style={{ color:C.green }}>{new Date(config.proxima_ejecucion).toLocaleString("es-MX")}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function Backups() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [loading,       setLoading]       = useState(false);
  const [historial,     setHistorial]     = useState<BackupEntry[]>([]);
  const [selected,      setSelected]      = useState<BackupEntry | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  const [tablasSalud,   setTablasSalud]   = useState<TablaInfo[]>([]);
  const [loadingTablas, setLoadingTablas] = useState(false);

  const [cronConfig,  setCronConfig]  = useState<CronConfig | null>(null);
  const [savingCron,  setSavingCron]  = useState(false);

  const [showSelector, setShowSelector] = useState(false);
  const [tablasNames,  setTablasNames]  = useState<string[]>([]);
  const [tablasManual, setTablasManual] = useState<string[]>([]);

  const cargarHistorial = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/historial`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) setHistorial((json.data || []).map(mapEntry));
    } catch { /* silencioso */ }
  }, []);

  const cargarTablasSalud = useCallback(async () => {
    setLoadingTablas(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/tablas`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        const raw = json.data?.tablas || json.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tablas: TablaInfo[] = (raw as any[]).map(t => ({
          nombre:           t.tabla       ?? t.nombre      ?? t.table_name ?? t.relname ?? "—",
          filas:            t.filas       ?? t.n_live_tup  ?? t.row_count  ?? t.rows    ?? 0,
          bytes:            t.bytes       ?? t.total_bytes ?? t.size_bytes ?? 0,
          en_ultimo_backup: t.en_ultimo_backup ?? false,
        }));
        setTablasSalud(tablas);
        setTablasNames(tablas.map(t => t.nombre));
        if (tablasManual.length === 0)
          setTablasManual(tablas.map(t => t.nombre));
      }
    } catch { /* silencioso */ }
    finally { setLoadingTablas(false); }
  }, [tablasManual.length]);

  const cargarCron = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/cron`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) setCronConfig(json.data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargarHistorial();
    cargarTablasSalud();
    cargarCron();
  }, [cargarHistorial, cargarTablasSalud, cargarCron]);

  const handleGenerarBackup = useCallback(async () => {
    setLoading(true);
    const tablasAEnviar = (tablasManual.length > 0 && tablasManual.length < tablasNames.length)
      ? tablasManual : null;
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authService.getToken()}`, "Content-Type":"application/json" },
        body: JSON.stringify({ tablas: tablasAEnviar }),
      });
      if (!res.ok) throw new Error("Error al generar el respaldo");
      const blob     = await res.blob();
      const filename = (() => {
        const cd    = res.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="?([^"]+)"?/);
        return match?.[1] || `backup-${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.sql`;
      })();
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
      await cargarHistorial();
      await cargarTablasSalud();
      showToast(tablasAEnviar ? `Respaldo selectivo generado (${tablasAEnviar.length} tablas) ✓` : "Respaldo completo generado ✓", "ok");
    } catch (err) {
      console.error(err);
      showToast("Error al generar el respaldo", "err");
    } finally {
      setLoading(false);
    }
  }, [tablasManual, tablasNames.length, cargarHistorial, cargarTablasSalud, showToast]);

  const handleEliminar = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHistorial(prev => prev.filter(e => e.id !== id));
      setSelected(prev => prev?.id === id ? null : prev);
      showToast("Backup eliminado ✓", "ok");
    } catch { showToast("Error al eliminar el backup", "err"); }
    finally   { setDeletingId(null); }
  }, [showToast]);

  const handleSaveCron = useCallback(async (data: Partial<CronConfig>) => {
    setSavingCron(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/cron`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authService.getToken()}`, "Content-Type":"application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setCronConfig(json.data);
      showToast(json.message ?? "Configuración guardada ✓", "ok");
    } catch { showToast("Error al guardar configuración", "err"); }
    finally   { setSavingCron(false); }
  }, [showToast]);

  const ultimoBackup = historial[0];
  const totalFilas   = historial.reduce((s, e) => s + e.filas, 0);
  const esSelectivo  = tablasManual.length > 0 && tablasManual.length < tablasNames.length;

  return (
    <>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      <Topbar navigate={navigate} />

      <main style={{ flex:1, padding:"24px 28px 32px", overflowY:"auto" }}>

        {/* Banner */}
        <div style={{ borderRadius:14, padding:"22px 26px", background:`linear-gradient(135deg,rgba(141,76,205,0.10),rgba(255,132,14,0.04))`, border:`1px solid rgba(141,76,205,0.16)`, marginBottom:22, display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}12,transparent 70%)`, pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:"rgba(141,76,205,0.08)", border:`1px solid rgba(141,76,205,0.20)`, fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:10 }}>
              <Star size={9} color={C.purple} fill={C.purple} /> Gestión de datos
            </div>
            <h1 style={{ fontSize:22, fontWeight:900, margin:"0 0 4px", fontFamily:FD, color:C.cream }}>
              Centro de{" "}
              <span style={{ background:`linear-gradient(90deg,${C.purple},${C.blue})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Respaldos</span>
            </h1>
            <p style={{ fontSize:13, color:C.creamMut, margin:0, fontFamily:FB }}>
              Exporta un respaldo completo o selectivo · Supabase Storage · máx. 3 backups
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
            {tablasNames.length > 0 && (
              <button onClick={() => setShowSelector(s => !s)}
                style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.22)`, color:C.orange, padding:"8px 14px", borderRadius:9, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:FB }}>
                <Table2 size={13} strokeWidth={2} />
                {showSelector ? "Ocultar selección" : (esSelectivo ? `${tablasManual.length} tablas seleccionadas` : "Backup completo")}
                {showSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            <button onClick={handleGenerarBackup} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:8,
                background: loading ? "rgba(141,76,205,0.08)" : `linear-gradient(135deg,${C.purple},#6B35A8)`,
                border:`1px solid rgba(141,76,205,${loading ? "0.20" : "0.50"})`,
                color: loading ? C.creamMut : "white", padding:"12px 22px", borderRadius:11,
                fontWeight:700, fontSize:14, cursor: loading ? "wait" : "pointer", fontFamily:FB,
                boxShadow: loading ? "none" : `0 6px 20px rgba(141,76,205,0.30)`, transition:"all .2s", opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow=`0 10px 28px rgba(141,76,205,0.45)`; } }}
              onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform="translateY(0)";   (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 20px rgba(141,76,205,0.30)`; } }}>
              <Database size={16} strokeWidth={2} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} color={loading ? C.creamMut : "white"} />
              {loading ? "Generando..." : esSelectivo ? `Generar backup selectivo` : "Generar backup completo"}
            </button>
          </div>
        </div>

        {/* Selector de tablas (área amplia → 2 columnas) */}
        {showSelector && tablasNames.length > 0 && (
          <div style={{ background:C.card, border:`1px solid rgba(255,132,14,0.18)`, borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
            <SelectorTablas tablas={tablasNames} seleccionadas={tablasManual} onChange={setTablasManual} accent={C.orange} columns={2} />
          </div>
        )}

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
          <MiniKpi label="Respaldos en Storage"  value={historial.length}                                         icon={Database}    accent={C.purple} />
          <MiniKpi label="Exitosos"               value={historial.length}                                         icon={CheckCircle} accent={C.green}  />
          <MiniKpi label="Total filas exportadas" value={totalFilas.toLocaleString("es-MX")}                      icon={HardDrive}   accent={C.blue}   />
          <MiniKpi label="Último respaldo"        value={ultimoBackup ? tiempoRelativo(ultimoBackup.fecha) : "—"} icon={Clock}       accent={C.gold}   />
        </div>

        {/* Layout principal */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>

          {/* Columna izquierda */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Historial */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${C.borderBr}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FileText size={15} color={C.purple} strokeWidth={2} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FD }}>Historial de respaldos</span>
                  {historial.length > 0 && (
                    <span style={{ padding:"2px 8px", borderRadius:100, background:"rgba(141,76,205,0.12)", border:"1px solid rgba(141,76,205,0.25)", fontSize:11, color:C.purple, fontWeight:700 }}>
                      {historial.length}
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <ExternalLink size={11} color={C.creamMut} />
                  <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>Últimos 3 · Supabase Storage</span>
                </div>
              </div>
              {historial.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 80px 70px 60px 80px", gap:12, padding:"8px 18px", borderBottom:`1px solid ${C.borderBr}` }}>
                  {["Archivo","Tamaño","Filas","Tablas","Tiempo",""].map((h, i) => (
                    <div key={i} style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, letterSpacing:"0.10em", textTransform:"uppercase", fontFamily:FB, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                  ))}
                </div>
              )}
              <div style={{ padding:"8px 10px" }}>
                {historial.length === 0 ? (
                  <div style={{ padding:"48px 20px", textAlign:"center" }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:"rgba(141,76,205,0.08)", border:"1px solid rgba(141,76,205,0.16)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                      <Database size={24} color={C.purple} strokeWidth={1.5} style={{ opacity:0.5 }} />
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.creamSub, fontFamily:FB, marginBottom:6 }}>Sin respaldos aún</div>
                    <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>Genera tu primer respaldo con el botón de arriba</div>
                  </div>
                ) : historial.map(entry => (
                  <div key={entry.id} onClick={() => setSelected(entry)} style={{ cursor:"pointer" }}>
                    <BackupRow entry={entry} onDelete={handleEliminar} deleting={deletingId === entry.id} />
                  </div>
                ))}
              </div>
            </div>

            {/* Estado de salud */}
            <EstadoTablas tablas={tablasSalud} loading={loadingTablas} onRefresh={cargarTablasSalud} />
          </div>

          {/* Columna derecha */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Detalle */}
            <div style={{ background:C.card, border:`1px solid ${selected ? "rgba(141,76,205,0.25)" : C.border}`, borderRadius:14, padding:18, transition:"border-color .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.borderBr}` }}>
                <Info size={14} color={C.purple} strokeWidth={2} />
                <span style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FD }}>Detalle</span>
              </div>
              {selected ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { label:"Archivo",  value:selected.filename,           mono:true  },
                    { label:"Fecha",    value:formatFecha(selected.fecha),  mono:false },
                    { label:"Tamaño",   value:formatBytes(selected.tamaño), mono:false },
                    { label:"Filas",    value:selected.filas  > 0 ? selected.filas.toLocaleString("es-MX")  : "—", mono:false },
                    { label:"Tablas",   value:selected.tablas > 0 ? String(selected.tablas) : "—",           mono:false },
                    { label:"Duración", value:selected.duracion,            mono:false },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:FB, marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:12, color:C.creamSub, fontFamily: mono ? "monospace" : FB, wordBreak:"break-all", background: mono ? "rgba(255,255,255,0.03)" : "transparent", padding: mono ? "4px 8px" : "0", borderRadius: mono ? 6 : 0 }}>{value}</div>
                    </div>
                  ))}
                  {selected.tablas_incluidas && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:FB, marginBottom:5 }}>Tablas incluidas</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {selected.tablas_incluidas.map(t => (
                          <span key={t} style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:"rgba(255,193,16,0.10)", border:"1px solid rgba(255,193,16,0.22)", color:C.gold, fontFamily:"monospace" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!selected.tablas_incluidas && (
                    <div style={{ padding:"6px 10px", borderRadius:8, background:"rgba(34,201,122,0.06)", border:"1px solid rgba(34,201,122,0.18)" }}>
                      <span style={{ fontSize:11, color:C.green, fontFamily:FB }}>✓ Backup completo — todas las tablas</span>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:FB, marginBottom:3, display:"flex", alignItems:"center", gap:4 }}>
                      <Shield size={9} color={C.creamMut} /> MD5
                    </div>
                    <div style={{ fontSize:10, color:C.creamMut, fontFamily:"monospace", wordBreak:"break-all", background:"rgba(255,255,255,0.03)", padding:"6px 8px", borderRadius:6, lineHeight:1.5 }}>{selected.checksum}</div>
                  </div>
                  <a href={selected.url_archivo!} download={selected.filename}
                    style={{ marginTop:6, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.28)", color:C.blue, padding:"9px", borderRadius:9, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB, textDecoration:"none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(121,170,245,0.20)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(121,170,245,0.10)"}>
                    <Download size={14} strokeWidth={2} /> Descargar desde Storage
                  </a>
                </div>
              ) : (
                <div style={{ padding:"24px 0", textAlign:"center" }}>
                  <RefreshCw size={22} color={C.creamMut} strokeWidth={1.5} style={{ opacity:0.35, marginBottom:10 }} />
                  <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>Selecciona un respaldo para ver su detalle</div>
                </div>
              )}
            </div>

            {/* Cron */}
            <ConfigCron config={cronConfig} tablas={tablasNames} onSave={handleSaveCron} saving={savingCron} />

            {/* Info */}
            <div style={{ background:"rgba(141,76,205,0.05)", border:"1px solid rgba(141,76,205,0.14)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <Shield size={13} color={C.purple} strokeWidth={2} />
                <span style={{ fontSize:12.5, fontWeight:700, color:C.cream, fontFamily:FD }}>¿Qué incluye el respaldo?</span>
              </div>
              {[
                [C.green, "Esquema completo (CREATE TABLE, índices, FK)"],
                [C.green, "Datos de todas las tablas (INSERT INTO)"],
                [C.green, "Reset de secuencias automático"],
                [C.green, "Verificación MD5 de integridad"],
                [C.green, "Guardado en Supabase Storage (7 días)"],
                [C.green, "Se conservan solo los últimos 3 automáticamente"],
                [C.gold,  "Backup selectivo: elige qué tablas incluir"],
                [C.gold,  "No incluye contraseñas en texto claro"],
              ].map(([color, text], i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                  <CheckCircle size={12} color={color} strokeWidth={2} style={{ marginTop:1.5, flexShrink:0 }} />
                  <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, lineHeight:1.4 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}