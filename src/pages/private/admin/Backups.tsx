// src/pages/private/admin/Backups.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  Database, Download, CheckCircle, Clock, RefreshCw, Shield,
  HardDrive, FileText, ChevronRight, Trash2, Star, Info,
  ExternalLink, Table2, Activity, Calendar, ToggleLeft,
  ToggleRight, ChevronDown, ChevronUp, Zap, AlertCircle,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast }    from "../../../context/ToastContext";

const C = {
  orange:"#FF840E", pink:"#CC59AD", purple:"#8D4CCD",
  blue:"#79AAF5",   gold:"#FFC110", green:"#22C97A",
  cream:"#FFF8EE",  creamSub:"#D8CABC",
  creamMut:"rgba(255,232,200,0.35)",
  bgDeep:"#070510", bg:"#0C0812",
  card:"rgba(14,10,24,0.98)",
  cardHi:"rgba(20,14,34,0.98)",
  border:"rgba(255,200,150,0.07)",
  borderBr:"rgba(118,78,49,0.18)",
  borderHi:"rgba(255,200,150,0.18)",
  red:"#F04E6B",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BackupEntry {
  id:string; filename:string; fecha:Date; filas:number; tablas:number;
  duracion:string; checksum:string; tamaño:number; estado:"ok"|"error";
  url_archivo:string|null;
}
interface TablaInfo  { nombre:string; filas:number; bytes:number; }
interface CronConfig {
  id:number; activo:boolean; frecuencia:"diario"|"semanal"|"mensual";
  hora:number; dia_semana:number;
  ultima_ejecucion:string|null; proxima_ejecucion:string|null;
}
interface BackupRaw {
  id:number|string; nombre_archivo:string; fecha:string;
  tamanio_bytes?:number; filas_total?:number; tablas?:number;
  duracion_ms?:number; checksum_md5?:string; url_archivo?:string|null;
}
interface TablaRaw { tabla?:string; nombre?:string; filas?:number; bytes?:number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (b:number) => {
  if (!b) return "0 B";
  if (b<1024) return `${b} B`;
  if (b<1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(2)} MB`;
};
const formatFecha = (d:Date) =>
  d.toLocaleString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const tiempoRelativo = (d:Date) => {
  const diff=Date.now()-d.getTime(), min=Math.floor(diff/60000);
  if (min<1)  return "Hace un momento";
  if (min<60) return `Hace ${min} min`;
  const hrs=Math.floor(min/60);
  if (hrs<24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs/24)} d`;
};
const mapEntry = (e:BackupRaw):BackupEntry => ({
  id:String(e.id), filename:e.nombre_archivo, fecha:new Date(e.fecha),
  tamaño:e.tamanio_bytes??0, filas:e.filas_total??0, tablas:e.tablas??0,
  duracion:e.duracion_ms?`${(e.duracion_ms/1000).toFixed(2)}s`:"—",
  checksum:e.checksum_md5??"—", estado:"ok", url_archivo:e.url_archivo??null,
});
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate }:{ navigate:(p:string)=>void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:52, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span role="button" tabIndex={0} style={{ fontSize:11, fontWeight:700, color:C.orange, letterSpacing:"0.10em", textTransform:"uppercase", cursor:"pointer" }} onClick={() => navigate("/admin")} onKeyDown={e => { if (e.key === "Enter") navigate("/admin"); }}>Admin</span>
        <ChevronRight size={11} color={C.creamMut} />
        <span style={{ fontSize:12.5, color:C.creamSub, fontWeight:500 }}>Backups</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 11px", borderRadius:100, background:"rgba(255,132,14,0.06)", border:`1px solid rgba(255,132,14,0.16)` }}>
          <Shield size={9} color={C.orange} strokeWidth={2.5} />
          <span style={{ fontSize:10.5, color:C.creamMut }}>Cifrado</span>
          <span style={{ fontSize:10.5, color:C.orange, fontWeight:800, fontFamily:FM }}>SHA-256</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 11px", borderRadius:100, background:"rgba(34,201,122,0.05)", border:`1px solid rgba(34,201,122,0.16)` }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}`, display:"inline-block" }} />
          <span style={{ fontSize:10.5, color:C.green, fontWeight:700 }}>Sistema activo</span>
        </div>
      </div>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────
function KpiStrip({ historial, tablasSalud }:{ historial:BackupEntry[]; tablasSalud:TablaInfo[] }) {
  const ultimoBackup = historial[0];
  const totalFilas   = historial.reduce((s,e) => s+e.filas, 0);
  const items = [
    { label:"En Storage",      value:String(historial.length),                                   accent:C.orange, icon:Database,  sub:"respaldos guardados" },
    { label:"Total filas",     value:totalFilas>0?totalFilas.toLocaleString("es-MX"):"—",        accent:C.blue,   icon:HardDrive, sub:"registros respaldados" },
    { label:"Último respaldo", value:ultimoBackup?tiempoRelativo(ultimoBackup.fecha):"—",        accent:C.gold,   icon:Clock,     sub:ultimoBackup?formatFecha(ultimoBackup.fecha):"sin respaldo" },
    { label:"Tablas en BD",    value:String(tablasSalud.length),                                 accent:C.green,  icon:Activity,  sub:"tablas monitoreadas" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
      {items.map(({ label, value, accent, icon:Icon, sub }, i) => (
        <div key={label}
          style={{ background:C.card, borderRadius:14, padding:"20px 20px 18px", position:"relative", overflow:"hidden",
            border:`1px solid ${C.border}`, transition:"border-color .2s, transform .2s",
            animation:`fadeUp .4s ease ${i*0.07}s both`, cursor:"default" }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${accent}30`; el.style.transform="translateY(-3px)"; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.transform="translateY(0)"; }}>

          {/* Glow top accent */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${accent}00)`, borderRadius:"14px 14px 0 0" }} />

          {/* Watermark icon */}
          <div style={{ position:"absolute", bottom:-6, right:-4, opacity:0.04 }}>
            <Icon size={72} color={accent} strokeWidth={1} />
          </div>

          {/* Icon chip */}
          <div style={{ width:34, height:34, borderRadius:10, background:`${accent}14`, border:`1px solid ${accent}20`,
            display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <Icon size={15} color={accent} strokeWidth={1.8} />
          </div>

          {/* Value */}
          <div style={{ fontSize:38, fontWeight:900, color:C.cream, fontFamily:FD, lineHeight:1, marginBottom:5, letterSpacing:"-0.02em" }}>
            {value}
          </div>

          {/* Label */}
          <div style={{ fontSize:11, fontWeight:700, color:accent, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:FB, marginBottom:3 }}>
            {label}
          </div>

          {/* Sub */}
          <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB, lineHeight:1.3 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── BackupRow ─────────────────────────────────────────────────────────────────
function BackupRow({ entry, onDelete, deleting, isSelected }:{ entry:BackupEntry; onDelete:(id:string)=>void; deleting:boolean; isSelected:boolean }) {
  const [hovered, setHovered] = useState(false);
  const esSelectivo = entry.filename.includes("selectivo");
  const esAuto      = entry.filename.includes("auto");
  const active      = isSelected || hovered;

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding:"14px 16px 12px", borderRadius:11, marginBottom:6, position:"relative",
        background: isSelected ? "rgba(255,132,14,0.06)" : hovered ? "rgba(255,200,150,0.025)" : "transparent",
        border:`1px solid ${isSelected ? "rgba(255,132,14,0.30)" : hovered ? "rgba(255,200,150,0.12)" : "rgba(255,200,150,0.05)"}`,
        transition:"all .18s", opacity:deleting?0.4:1 }}>

      {/* Left status bar */}
      <div style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3,
        background:isSelected?`linear-gradient(180deg,${C.orange},${C.gold})`:`linear-gradient(180deg,${C.green},${C.green}80)`,
        borderRadius:"0 3px 3px 0", opacity:active?1:0.4, transition:"opacity .18s" }} />

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, paddingLeft:10 }}>

        {/* Filename block */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Tags */}
          {(esSelectivo || esAuto) && (
            <div style={{ display:"flex", gap:5, marginBottom:6 }}>
              {esAuto && (
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:100,
                  background:"rgba(141,76,205,0.14)", border:"1px solid rgba(141,76,205,0.30)",
                  color:C.purple, fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  Auto
                </span>
              )}
              {esSelectivo && (
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:100,
                  background:"rgba(255,193,16,0.12)", border:"1px solid rgba(255,193,16,0.28)",
                  color:C.gold, fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  Selectivo
                </span>
              )}
            </div>
          )}

          {/* Filename */}
          <div style={{ fontSize:12, color:isSelected?C.cream:C.creamSub, fontFamily:FM,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            lineHeight:1.4, fontWeight:500, transition:"color .18s" }}>
            {entry.filename}
          </div>

          {/* Meta */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <Clock size={9} color={C.creamMut} />
              <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>
                {tiempoRelativo(entry.fecha)}
              </span>
            </div>
            <span style={{ width:2, height:2, borderRadius:"50%", background:C.creamMut, opacity:0.4, display:"inline-block" }} />
            <span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>
              {formatFecha(entry.fecha)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          {entry.url_archivo && (
            <a href={entry.url_archivo} download={entry.filename}
              onClick={e => e.stopPropagation()}
              style={{ width:30, height:30, borderRadius:8, background:"rgba(121,170,245,0.08)",
                border:"1px solid rgba(121,170,245,0.20)", display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", textDecoration:"none", transition:"all .15s" }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(121,170,245,0.22)"; el.style.borderColor="rgba(121,170,245,0.45)"; el.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(121,170,245,0.08)"; el.style.borderColor="rgba(121,170,245,0.20)"; el.style.transform="translateY(0)"; }}>
              <Download size={12} color={C.blue} strokeWidth={2} />
            </a>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} disabled={deleting}
            style={{ width:30, height:30, borderRadius:8, background:"rgba(240,78,107,0.06)",
              border:"1px solid rgba(240,78,107,0.16)", display:"flex", alignItems:"center",
              justifyContent:"center", cursor:deleting?"wait":"pointer", transition:"all .15s" }}
            onMouseEnter={e => { if(!deleting){ const el=e.currentTarget as HTMLElement; el.style.background="rgba(240,78,107,0.18)"; el.style.borderColor="rgba(240,78,107,0.40)"; el.style.transform="translateY(-1px)"; } }}
            onMouseLeave={e => { if(!deleting){ const el=e.currentTarget as HTMLElement; el.style.background="rgba(240,78,107,0.06)"; el.style.borderColor="rgba(240,78,107,0.16)"; el.style.transform="translateY(0)"; } }}>
            {deleting
              ? <RefreshCw size={11} color={C.red} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} />
              : <Trash2    size={11} color={C.red} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Footer chip */}
      <div style={{ paddingLeft:10, marginTop:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:7,
          padding:"4px 10px", borderRadius:6,
          background:"rgba(255,232,200,0.025)", border:`1px solid ${isSelected?"rgba(255,132,14,0.18)":C.border}` }}>
          <span style={{ fontSize:9, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.10em", fontFamily:FB }}>Tamaño</span>
          <span style={{ fontSize:12.5, color:isSelected?C.orange:C.creamSub, fontFamily:FM, fontWeight:700 }}>{formatBytes(entry.tamaño)}</span>
        </span>
      </div>
    </div>
  );
}

// ── Panel Detalle ─────────────────────────────────────────────────────────────
function DetallePanel({ selected }:{ selected:BackupEntry|null }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${selected?`rgba(255,132,14,0.25)`:C.border}`,
      borderRadius:14, overflow:"hidden", transition:"all .3s",
      boxShadow:selected?`0 0 40px rgba(255,132,14,0.06)`:"none" }}>

      {/* Header */}
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.borderBr}`,
        display:"flex", alignItems:"center", gap:8,
        background:selected?"linear-gradient(135deg,rgba(255,132,14,0.07),transparent)":"transparent" }}>
        <div style={{ width:28, height:28, borderRadius:8,
          background:selected?"rgba(255,132,14,0.14)":"rgba(255,200,150,0.05)",
          border:`1px solid ${selected?"rgba(255,132,14,0.28)":C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>
          <Info size={12} color={selected?C.orange:C.creamMut} strokeWidth={2} />
        </div>
        <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Detalle</span>
        {selected && (
          <span style={{ fontSize:9.5, padding:"2px 8px", borderRadius:100,
            background:"rgba(255,132,14,0.12)", border:"1px solid rgba(255,132,14,0.28)",
            color:C.orange, fontWeight:800, marginLeft:"auto", letterSpacing:"0.04em" }}>
            Seleccionado
          </span>
        )}
      </div>

      {selected ? (
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>

          {/* Nombre archivo — terminal block */}
          <div style={{ padding:"10px 13px", borderRadius:10,
            background:"rgba(255,132,14,0.04)", border:`1px solid rgba(255,132,14,0.14)`,
            position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, width:"100%", height:2,
              background:`linear-gradient(90deg,${C.orange}50,transparent)` }} />
            <div style={{ fontSize:9, fontWeight:800, color:C.orange, letterSpacing:"0.14em",
              textTransform:"uppercase", fontFamily:FB, marginBottom:5 }}>Archivo</div>
            <div style={{ fontSize:10.5, color:C.cream, fontFamily:FM, wordBreak:"break-all", lineHeight:1.7 }}>
              {selected.filename}
            </div>
          </div>

          {/* Stats grid 2x3 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {([
              { label:"Fecha",    value:formatFecha(selected.fecha),  accent:C.blue   },
              { label:"Tamaño",   value:formatBytes(selected.tamaño), accent:C.purple },
              { label:"Filas",    value:selected.filas>0?selected.filas.toLocaleString("es-MX"):"—",      accent:C.green },
              { label:"Tablas",   value:selected.tablas>0?`${selected.tablas} tablas`:"—",                accent:C.gold  },
              { label:"Duración", value:selected.duracion,            accent:C.pink   },
              { label:"Estado",   value:"✓ Exitoso",                  accent:C.green  },
            ] as {label:string;value:string;accent:string}[]).map(({ label, value, accent }) => (
              <div key={label} style={{ padding:"9px 11px", borderRadius:9,
                background:`${accent}07`, border:`1px solid ${accent}18`,
                position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                  background:`linear-gradient(90deg,${accent},transparent)` }} />
                <div style={{ fontSize:8.5, fontWeight:800, color:`${accent}cc`, letterSpacing:"0.12em",
                  textTransform:"uppercase", fontFamily:FB, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:11.5, color:C.cream, fontFamily:FB, fontWeight:600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Checksum — code block */}
          <div style={{ padding:"10px 13px", borderRadius:10,
            background:"rgba(141,76,205,0.05)", border:`1px solid rgba(141,76,205,0.18)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <Shield size={9} color={C.purple} strokeWidth={2.5} />
              <span style={{ fontSize:9, fontWeight:800, color:C.purple, letterSpacing:"0.12em",
                textTransform:"uppercase", fontFamily:FB }}>Checksum MD5</span>
            </div>
            <div style={{ fontSize:10, color:C.creamMut, fontFamily:FM, wordBreak:"break-all",
              lineHeight:1.7, padding:"6px 9px", borderRadius:6,
              background:"rgba(0,0,0,0.25)", border:"1px solid rgba(141,76,205,0.12)" }}>
              {selected.checksum}
            </div>
          </div>

          {/* Descargar */}
          {selected.url_archivo && (
            <a href={selected.url_archivo} download={selected.filename}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                background:`linear-gradient(135deg,rgba(121,170,245,0.14),rgba(121,170,245,0.07))`,
                border:`1px solid rgba(121,170,245,0.28)`, color:C.blue,
                padding:"11px", borderRadius:10, fontWeight:700, fontSize:12.5,
                cursor:"pointer", fontFamily:FB, textDecoration:"none", transition:"all .18s" }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background=`linear-gradient(135deg,rgba(121,170,245,0.24),rgba(121,170,245,0.14))`; el.style.boxShadow=`0 6px 20px rgba(121,170,245,0.2)`; el.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background=`linear-gradient(135deg,rgba(121,170,245,0.14),rgba(121,170,245,0.07))`; el.style.boxShadow="none"; el.style.transform="translateY(0)"; }}>
              <Download size={14} strokeWidth={2.5} /> Descargar desde Storage
            </a>
          )}
        </div>
      ) : (
        <div style={{ padding:"40px 20px", textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,200,150,0.04)",
            border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
            justifyContent:"center", margin:"0 auto 12px" }}>
            <AlertCircle size={20} color={C.creamMut} strokeWidth={1.5} style={{ opacity:0.3 }} />
          </div>
          <div style={{ fontSize:12.5, fontWeight:600, color:C.creamSub, fontFamily:FB, marginBottom:5 }}>Sin selección</div>
          <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, lineHeight:1.6, maxWidth:160, margin:"0 auto" }}>
            Haz clic en un respaldo para ver sus detalles
          </div>
        </div>
      )}
    </div>
  );
}

// ── SelectorTablas ────────────────────────────────────────────────────────────
function SelectorTablas({ tablas, excluidas, onChange }:{ tablas:string[]; excluidas:string[]; onChange:(e:string[])=>void }) {
  const toggle = (t:string) => onChange(excluidas.includes(t)?excluidas.filter(x=>x!==t):[...excluidas,t]);
  const incluidasCount = tablas.length - excluidas.length;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:11.5, fontFamily:FB }}>
          {excluidas.length===0
            ? <span style={{ color:C.green, fontWeight:700 }}>✓ Backup completo — {tablas.length} tablas</span>
            : <span style={{ color:C.orange, fontWeight:700 }}>{incluidasCount} de {tablas.length} tablas incluidas</span>}
        </div>
        {excluidas.length>0 && (
          <button onClick={() => onChange([])}
            style={{ fontSize:11, color:C.green, background:"transparent", border:`1px solid rgba(34,201,122,0.25)`,
              borderRadius:6, padding:"3px 10px", cursor:"pointer", fontFamily:FB, fontWeight:700 }}>
            Incluir todas
          </button>
        )}
      </div>
      <div style={{ fontSize:11, color:C.creamMut, fontFamily:FB, marginBottom:10, padding:"6px 10px",
        borderRadius:7, background:"rgba(255,132,14,0.04)", border:`1px solid rgba(255,132,14,0.12)` }}>
        Clic en tabla para <span style={{ color:C.orange, fontWeight:700 }}>excluirla</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5, maxHeight:180, overflowY:"auto" }}>
        {tablas.map(t => {
          const excluida = excluidas.includes(t);
          return (
            <div key={t} role="button" tabIndex={0} onClick={() => toggle(t)} onKeyDown={e => { if (e.key === "Enter") toggle(t); }}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", borderRadius:7, cursor:"pointer",
                background:excluida?"rgba(240,78,107,0.05)":"rgba(34,201,122,0.04)",
                border:`1px solid ${excluida?"rgba(240,78,107,0.22)":"rgba(34,201,122,0.14)"}`,
                transition:"all .12s", opacity:excluida?0.5:1 }}>
              <div style={{ width:10, height:10, borderRadius:3, flexShrink:0,
                background:excluida?"transparent":C.green, border:`1.5px solid ${excluida?C.red:C.green}`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {!excluida && <CheckCircle size={6} color="#000" strokeWidth={3} />}
              </div>
              <span style={{ fontSize:10.5, fontFamily:FM, color:excluida?C.creamMut:C.cream,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                textDecoration:excluida?"line-through":"none" }}>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Estado Salud ──────────────────────────────────────────────────────────────
const TABLE_COLORS = [C.orange, C.purple, C.blue, C.pink, C.gold, C.green];

function EstadoTablas({ tablas, loading, onRefresh }:{ tablas:TablaInfo[]; loading:boolean; onRefresh:()=>void }) {
  const [expanded, setExpanded] = useState(false);
  const totalBytes = tablas.reduce((s,t) => s+t.bytes, 0);
  const maxFilas   = Math.max(...tablas.map(t=>t.filas), 1);
  const visible    = expanded ? tablas : tablas.slice(0,6);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${C.borderBr}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"rgba(34,201,122,0.12)",
            border:"1px solid rgba(34,201,122,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Activity size={13} color={C.green} strokeWidth={2} />
          </div>
          <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Estado de salud</span>
          <span style={{ padding:"2px 8px", borderRadius:100, background:"rgba(34,201,122,0.10)",
            border:"1px solid rgba(34,201,122,0.22)", fontSize:10, color:C.green, fontWeight:800 }}>
            {tablas.length} tablas
          </span>
          <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>{formatBytes(totalBytes)}</span>
        </div>
        <button onClick={onRefresh} disabled={loading}
          style={{ width:26, height:26, borderRadius:7, background:"rgba(34,201,122,0.08)",
            border:"1px solid rgba(34,201,122,0.18)", display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer", transition:"all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(34,201,122,0.16)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(34,201,122,0.08)"; }}>
          <RefreshCw size={11} color={C.green} strokeWidth={2} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
        </button>
      </div>

      {/* Table rows */}
      <div style={{ padding:"6px 10px" }}>
        {loading && tablas.length===0 ? (
          <div style={{ padding:"24px", textAlign:"center", color:C.creamMut, fontSize:12, fontFamily:FB }}>Cargando...</div>
        ) : visible.map((t,i) => {
          const pct   = Math.round((t.filas/maxFilas)*100);
          const color = TABLE_COLORS[i % TABLE_COLORS.length];
          return (
            <div key={`${t.nombre}-${i}`} style={{ padding:"7px 10px", borderRadius:8, marginBottom:2,
              transition:"background .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,200,150,0.025)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:600, color:C.cream, fontFamily:FM }}>{t.nombre}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:10, color:C.creamMut, fontFamily:FB }}>{formatBytes(t.bytes)}</span>
                  <span style={{ fontSize:11, color:C.creamSub, fontFamily:FM, fontWeight:700 }}>
                    {t.filas.toLocaleString("es-MX")}<span style={{ fontSize:9, color:C.creamMut, fontWeight:400 }}> filas</span>
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height:3, background:"rgba(255,255,255,0.04)", borderRadius:99 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}80)`,
                  borderRadius:99, transition:"width .5s ease", boxShadow:`0 0 6px ${color}40` }} />
              </div>
            </div>
          );
        })}

        {tablas.length>6 && (
          <button onClick={() => setExpanded(v=>!v)}
            style={{ width:"100%", marginTop:6, padding:"7px", borderRadius:8, background:"transparent",
              border:`1px solid ${C.border}`, color:C.creamMut, fontSize:11,
              fontFamily:FB, cursor:"pointer", transition:"all .15s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.orange; el.style.borderColor=`${C.orange}30`; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamMut; el.style.borderColor=C.border; }}>
            {expanded ? <><ChevronUp size={12}/> Ver menos</> : <><ChevronDown size={12}/> Ver {tablas.length-6} más</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ConfigCron ────────────────────────────────────────────────────────────────
function ConfigCron({ config, onSave, saving }:{ config:CronConfig|null; onSave:(c:Partial<CronConfig>)=>void; saving:boolean }) {
  const [activo,     setActivo]     = useState(config?.activo??false);
  const [frecuencia, setFrecuencia] = useState<"diario"|"semanal"|"mensual">(config?.frecuencia??"diario");
  const [hora,       setHora]       = useState(config?.hora??2);
  const [diaSemana,  setDiaSemana]  = useState(config?.dia_semana??1);
  const [expanded,   setExpanded]   = useState(false);

  useEffect(() => {
    if (!config) return;
    setTimeout(() => {
      setActivo(config.activo); setFrecuencia(config.frecuencia);
      setHora(config.hora); setDiaSemana(config.dia_semana);
    }, 0);
  }, [config?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const descProxima = () => {
    if (!activo) return "Desactivado";
    const h = hora.toString().padStart(2,"0");
    if (frecuencia==="diario")  return `Diario ${h}:00`;
    if (frecuencia==="semanal") return `${DIAS[diaSemana]} ${h}:00`;
    return `Día 1 cada mes ${h}:00`;
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${activo?"rgba(34,201,122,0.22)":C.border}`,
      borderRadius:14, overflow:"hidden", transition:"border-color .25s" }}>

      {/* Header — clickable */}
      <div style={{ padding:"13px 16px", borderBottom:expanded?`1px solid ${C.borderBr}`:"none",
        display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer",
        background:activo?"linear-gradient(135deg,rgba(34,201,122,0.05),transparent)":"transparent",
        transition:"background .2s" }}
        onClick={() => setExpanded(e=>!e)}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8,
            background:activo?"rgba(34,201,122,0.12)":"rgba(255,200,150,0.05)",
            border:`1px solid ${activo?"rgba(34,201,122,0.25)":C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>
            <Calendar size={12} color={activo?C.green:C.creamMut} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13, fontWeight:800, color:C.cream, fontFamily:FD }}>Backup automático</span>
              <span style={{ padding:"2px 8px", borderRadius:100,
                background:activo?"rgba(34,201,122,0.12)":"rgba(255,255,255,0.04)",
                border:`1px solid ${activo?"rgba(34,201,122,0.28)":"rgba(255,255,255,0.08)"}`,
                fontSize:9.5, color:activo?C.green:C.creamMut, fontWeight:800, letterSpacing:"0.04em" }}>
                {activo?"Activo":"Inactivo"}
              </span>
            </div>
            {activo && (
              <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{descProxima()}</div>
            )}
          </div>
        </div>
        <div style={{ color:C.creamMut, transition:"transform .2s", transform:expanded?"rotate(180deg)":"rotate(0)" }}>
          <ChevronDown size={14} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding:"14px 16px" }}>
          {/* Toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14,
            padding:"10px 13px", borderRadius:10, background:"rgba(255,255,255,0.02)",
            border:`1px solid ${activo?"rgba(34,201,122,0.15)":"rgba(255,255,255,0.06)"}` }}>
            <div>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.cream, fontFamily:FB }}>Activar backup automático</div>
              <div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB, marginTop:2 }}>{descProxima()}</div>
            </div>
            <button onClick={() => setActivo(a=>!a)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:0 }}>
              {activo
                ? <ToggleRight size={32} color={C.green}   strokeWidth={1.8}/>
                : <ToggleLeft  size={32} color={C.creamMut} strokeWidth={1.8}/>}
            </button>
          </div>

          {/* Frecuencia */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:9.5, fontWeight:800, color:C.creamMut, letterSpacing:"0.10em",
              textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:7 }}>Frecuencia</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
              {(["diario","semanal","mensual"] as const).map(f => (
                <button key={f} onClick={() => setFrecuencia(f)}
                  style={{ padding:"8px 4px", borderRadius:9,
                    border:`1px solid ${frecuencia===f?`${C.orange}50`:"rgba(255,255,255,0.07)"}`,
                    background:frecuencia===f?"rgba(255,132,14,0.12)":"rgba(255,255,255,0.02)",
                    color:frecuencia===f?C.orange:C.creamMut,
                    fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:FB,
                    textTransform:"capitalize", transition:"all .15s" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Hora / Día */}
          <div style={{ marginBottom:12, display:"grid", gridTemplateColumns:frecuencia==="semanal"?"1fr 1fr":"1fr", gap:8 }}>
            <div>
              <label style={{ fontSize:9.5, fontWeight:800, color:C.creamMut, letterSpacing:"0.10em",
                textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:5 }}>Hora</label>
              <select value={hora} onChange={e => setHora(parseInt(e.target.value))}
                style={{ width:"100%", padding:"8px 11px", borderRadius:8, background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.09)", color:C.cream, fontSize:12.5,
                  fontFamily:FM, cursor:"pointer", outline:"none" }}>
                {Array.from({length:24},(_,i) => <option key={`h-${i}`} value={i} style={{ background:"#0C0812" }}>{String(i).padStart(2,"0")}:00</option>)}
              </select>
            </div>
            {frecuencia==="semanal" && (
              <div>
                <label style={{ fontSize:9.5, fontWeight:800, color:C.creamMut, letterSpacing:"0.10em",
                  textTransform:"uppercase", fontFamily:FB, display:"block", marginBottom:5 }}>Día</label>
                <select value={diaSemana} onChange={e => setDiaSemana(parseInt(e.target.value))}
                  style={{ width:"100%", padding:"8px 11px", borderRadius:8, background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(255,255,255,0.09)", color:C.cream, fontSize:12.5,
                    fontFamily:FM, cursor:"pointer", outline:"none" }}>
                  {DIAS.map((d,i) => <option key={d} value={i} style={{ background:"#0C0812" }}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Última / próxima */}
          {config && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
              {([
                { label:"Última",  val:config.ultima_ejecucion?new Date(config.ultima_ejecucion).toLocaleString("es-MX"):"Nunca", color:C.creamMut },
                { label:"Próxima", val:config.proxima_ejecucion&&activo?new Date(config.proxima_ejecucion).toLocaleString("es-MX"):"—", color:activo?C.green:C.creamMut },
              ]).map(({ label, val, color }) => (
                <div key={label} style={{ padding:"8px 10px", borderRadius:8,
                  background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize:9, fontWeight:800, color:C.creamMut, textTransform:"uppercase",
                    letterSpacing:"0.08em", fontFamily:FB, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:10.5, color, fontFamily:FB }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Guardar */}
          <button onClick={() => onSave({ activo, frecuencia, hora, dia_semana:diaSemana })} disabled={saving}
            style={{ width:"100%", padding:"11px", borderRadius:10,
              background:saving?"rgba(255,132,14,0.08)":`linear-gradient(135deg,${C.orange},${C.pink})`,
              border:"none", color:saving?C.creamMut:"white", fontWeight:700, fontSize:13,
              cursor:saving?"wait":"pointer", fontFamily:FB,
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              boxShadow:saving?"none":`0 6px 20px ${C.orange}35`, transition:"all .2s" }}
            onMouseEnter={e => { if(!saving){ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-1px)"; el.style.boxShadow=`0 10px 28px ${C.orange}45`; } }}
            onMouseLeave={e => { if(!saving){ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(0)"; el.style.boxShadow=`0 6px 20px ${C.orange}35`; } }}>
            {saving ? <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Zap size={13}/>}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}

      {/* Collapsed next run hint */}
      {!expanded && config?.activo && config.proxima_ejecucion && (
        <div style={{ padding:"7px 16px 10px", display:"flex", alignItems:"center", gap:6 }}>
          <Zap size={9} color={C.green} fill={C.green} />
          <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>
            Próximo: <span style={{ color:C.green, fontWeight:600 }}>{new Date(config.proxima_ejecucion).toLocaleString("es-MX")}</span>
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

  const [loading,         setLoading]         = useState(false);
  const [historial,       setHistorial]       = useState<BackupEntry[]>([]);
  const [selected,        setSelected]        = useState<BackupEntry|null>(null);
  const [deletingId,      setDeletingId]      = useState<string|null>(null);
  const [tablasSalud,     setTablasSalud]     = useState<TablaInfo[]>([]);
  const [loadingTablas,   setLoadingTablas]   = useState(false);
  const [cronConfig,      setCronConfig]      = useState<CronConfig|null>(null);
  const [savingCron,      setSavingCron]      = useState(false);
  const [showSelector,    setShowSelector]    = useState(false);
  const [tablasNames,     setTablasNames]     = useState<string[]>([]);
  const [tablasExcluidas, setTablasExcluidas] = useState<string[]>([]);

  const cargarHistorial = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/historial`,{ headers:{ Authorization:`Bearer ${authService.getToken()}` } });
      const json = await res.json();
      if (json.success) setHistorial((json.data||[]).map(mapEntry));
    } catch { /**/ }
  }, []);

  const cargarTablasSalud = useCallback(async () => {
    setLoadingTablas(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/tablas`,{ headers:{ Authorization:`Bearer ${authService.getToken()}` } });
      const json = await res.json();
      if (json.success) {
        const raw:TablaRaw[] = json.data?.tablas||json.data||[];
        const tablas:TablaInfo[] = raw.map(t => ({ nombre:t.tabla??t.nombre??"—", filas:t.filas??0, bytes:t.bytes??0 }));
        setTablasSalud(tablas); setTablasNames(tablas.map(t=>t.nombre));
      }
    } catch { /**/ }
    finally { setLoadingTablas(false); }
  }, []);

  const cargarCron = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/cron`,{ headers:{ Authorization:`Bearer ${authService.getToken()}` } });
      const json = await res.json();
      if (json.success) setCronConfig(json.data);
    } catch { /**/ }
  }, []);

  useEffect(() => {
    cargarHistorial(); cargarTablasSalud(); cargarCron();
  }, [cargarHistorial, cargarTablasSalud, cargarCron]);

  const handleGenerarBackup = useCallback(async () => {
    setLoading(true);
    const tablasIncluidas = tablasNames.filter(t => !tablasExcluidas.includes(t));
    const tablasAEnviar   = tablasExcluidas.length>0 ? tablasIncluidas : null;
    try {
      const res  = await fetch(`${API_URL}/api/admin/backup`,{
        method:"POST",
        headers:{ Authorization:`Bearer ${authService.getToken()}`, "Content-Type":"application/json" },
        body:JSON.stringify({ tablas:tablasAEnviar }),
      });
      const json = await res.json();
      if (!json.success) { showToast(json.message||"Error al generar el respaldo","err"); return; }
      await cargarHistorial(); await cargarTablasSalud();
      showToast(json.message,"ok");
    } catch (err) { console.error(err); showToast("Error de conexión","err"); }
    finally { setLoading(false); }
  }, [tablasNames, tablasExcluidas, cargarHistorial, cargarTablasSalud, showToast]);

  const handleEliminar = useCallback(async (id:string) => {
    setDeletingId(id);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/${id}`,{ method:"DELETE", headers:{ Authorization:`Bearer ${authService.getToken()}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHistorial(prev => prev.filter(e=>e.id!==id));
      setSelected(prev => prev?.id===id?null:prev);
      showToast("Backup eliminado ✓","ok");
    } catch { showToast("Error al eliminar","err"); }
    finally { setDeletingId(null); }
  }, [showToast]);

  const handleSaveCron = useCallback(async (data:Partial<CronConfig>) => {
    setSavingCron(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/cron`,{
        method:"POST",
        headers:{ Authorization:`Bearer ${authService.getToken()}`, "Content-Type":"application/json" },
        body:JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setCronConfig(json.data);
      showToast(json.message??"Configuración guardada ✓","ok");
    } catch { showToast("Error al guardar configuración","err"); }
    finally { setSavingCron(false); }
  }, [showToast]);

  const esSelectivo     = tablasExcluidas.length>0;
  const tablasIncluidas = tablasNames.filter(t => !tablasExcluidas.includes(t));

  return (
    <>
      <style>{`
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
      <Topbar navigate={navigate} />

      <main style={{
        flex:1, padding:"24px 28px 40px", overflowY:"auto",
        backgroundColor:C.bg,
        backgroundImage:`
          radial-gradient(ellipse 70% 40% at 90% -5%,  rgba(255,132,14,0.09) 0%,transparent 60%),
          radial-gradient(ellipse 50% 50% at -5% 95%, rgba(141,76,205,0.07) 0%,transparent 55%)
        `,
        fontFamily:FB,
      }}>

        {/* ── Banner ─────────────────────────────────────────────────────── */}
        <div style={{
          borderRadius:18, padding:"26px 30px",
          background:`linear-gradient(135deg,rgba(255,132,14,0.10) 0%,rgba(14,10,24,0.98) 60%)`,
          border:`1px solid rgba(255,132,14,0.20)`,
          marginBottom:20, display:"flex", alignItems:"center",
          justifyContent:"space-between", position:"relative", overflow:"hidden",
          boxShadow:`0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,200,150,0.07)`,
          animation:"fadeUp .5s ease both",
        }}>
          {/* Decorative orb */}
          <div style={{ position:"absolute", top:-80, right:-30, width:260, height:260, borderRadius:"50%",
            background:`radial-gradient(circle,${C.orange}12,transparent 65%)`, pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-40, right:180, width:140, height:140, borderRadius:"50%",
            background:`radial-gradient(circle,${C.purple}10,transparent 65%)`, pointerEvents:"none" }} />

          {/* Left content */}
          <div style={{ position:"relative" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:100,
              background:"rgba(255,132,14,0.11)", border:`1px solid rgba(255,132,14,0.25)`,
              fontSize:10, color:C.orange, fontFamily:FB, marginBottom:12,
              fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase" }}>
              <Star size={8} color={C.orange} fill={C.orange} />
              Gestión de datos
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, margin:"0 0 6px", fontFamily:FD, color:C.cream, lineHeight:1.1 }}>
              Centro de <span style={{ color:C.orange, fontStyle:"italic" }}>Respaldos</span>
            </h1>
            <p style={{ fontSize:12.5, color:C.creamMut, margin:0, fontFamily:FB, lineHeight:1.5 }}>
              Completo o selectivo · Supabase Storage · máx. 3 backups
            </p>
          </div>

          {/* Right actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", position:"relative" }}>
            {tablasNames.length>0 && (
              <button onClick={() => setShowSelector(s=>!s)}
                style={{ display:"flex", alignItems:"center", gap:7,
                  background:esSelectivo?"rgba(255,132,14,0.12)":"rgba(255,255,255,0.05)",
                  border:`1px solid ${esSelectivo?"rgba(255,132,14,0.36)":"rgba(255,255,255,0.10)"}`,
                  color:esSelectivo?C.orange:C.creamMut,
                  padding:"8px 15px", borderRadius:10, fontWeight:600,
                  fontSize:12, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background=esSelectivo?"rgba(255,132,14,0.18)":"rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background=esSelectivo?"rgba(255,132,14,0.12)":"rgba(255,255,255,0.05)"; }}>
                <Table2 size={12} strokeWidth={2} />
                {esSelectivo?`Selectivo: ${tablasIncluidas.length} tablas`:"Completo — todas las tablas"}
                {showSelector?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
              </button>
            )}
            <button onClick={handleGenerarBackup} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:9,
                background:loading?"rgba(255,132,14,0.09)":`linear-gradient(135deg,${C.orange},#D06500)`,
                border:`1px solid ${loading?"rgba(255,132,14,0.22)":"rgba(255,160,60,0.55)"}`,
                color:loading?C.creamMut:"white", padding:"12px 24px", borderRadius:12,
                fontWeight:800, fontSize:13.5, cursor:loading?"wait":"pointer", fontFamily:FB,
                boxShadow:loading?"none":`0 8px 26px rgba(255,132,14,0.42)`,
                transition:"all .2s", opacity:loading?0.7:1 }}
              onMouseEnter={e => { if(!loading){ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow=`0 14px 36px rgba(255,132,14,0.56)`; } }}
              onMouseLeave={e => { if(!loading){ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(0)"; el.style.boxShadow=`0 8px 26px rgba(255,132,14,0.42)`; } }}>
              <Database size={16} strokeWidth={2} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
              {loading?"Generando respaldo...":esSelectivo?`Backup selectivo (${tablasIncluidas.length} tablas)`:"Generar backup completo"}
            </button>
          </div>
        </div>

        {/* Selector de tablas expandible */}
        {showSelector && tablasNames.length>0 && (
          <div style={{ background:C.card, border:`1px solid rgba(255,132,14,0.20)`,
            borderRadius:13, padding:"16px 20px", marginBottom:16, animation:"fadeUp .2s ease" }}>
            <SelectorTablas tablas={tablasNames} excluidas={tablasExcluidas} onChange={setTablasExcluidas} />
          </div>
        )}

        {/* KPIs */}
        <KpiStrip historial={historial} tablasSalud={tablasSalud} />

        {/* Layout 2 columnas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 308px", gap:16 }}>

          {/* ── Izquierda ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Historial de respaldos */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.borderBr}`,
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:`linear-gradient(135deg,rgba(255,132,14,0.04),transparent)` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:"rgba(255,132,14,0.12)",
                    border:"1px solid rgba(255,132,14,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FileText size={14} color={C.orange} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize:14.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Historial de respaldos</span>
                  {historial.length>0 && (
                    <span style={{ padding:"2px 9px", borderRadius:100, background:"rgba(255,132,14,0.12)",
                      border:"1px solid rgba(255,132,14,0.26)", fontSize:10.5, color:C.orange, fontWeight:800 }}>
                      {historial.length}
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, opacity:0.7 }}>
                  <ExternalLink size={10} color={C.creamMut} />
                  <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>Últimos 3 · Supabase Storage</span>
                </div>
              </div>

              <div style={{ padding:"10px 12px" }}>
                {historial.length===0 ? (
                  <div style={{ padding:"56px 20px", textAlign:"center" }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:"rgba(255,132,14,0.07)",
                      border:`1px solid rgba(255,132,14,0.14)`, display:"flex", alignItems:"center",
                      justifyContent:"center", margin:"0 auto 14px" }}>
                      <Database size={24} color={C.orange} strokeWidth={1.5} style={{ opacity:0.6 }} />
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.creamSub, fontFamily:FD, marginBottom:6 }}>Sin respaldos aún</div>
                    <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>
                      Genera tu primer respaldo con el botón naranja de arriba
                    </div>
                  </div>
                ) : historial.map(entry => (
                  <div key={entry.id} role="button" tabIndex={0} onClick={() => setSelected(entry)} onKeyDown={e => { if (e.key === "Enter") setSelected(entry); }} style={{ cursor:"pointer" }}>
                    <BackupRow
                      entry={entry}
                      onDelete={handleEliminar}
                      deleting={deletingId===entry.id}
                      isSelected={selected?.id===entry.id}
                    />
                  </div>
                ))}
              </div>
            </div>

            <EstadoTablas tablas={tablasSalud} loading={loadingTablas} onRefresh={cargarTablasSalud} />
          </div>

          {/* ── Derecha ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <DetallePanel selected={selected} />
            <ConfigCron config={cronConfig} onSave={handleSaveCron} saving={savingCron} />

            {/* ¿Qué incluye? */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"15px 17px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                <Shield size={12} color={C.orange} strokeWidth={2} />
                <span style={{ fontSize:13, fontWeight:800, color:C.cream, fontFamily:FD }}>¿Qué incluye?</span>
              </div>
              {([
                [C.green,  "Esquema completo (tablas, índices, FK)"],
                [C.green,  "Datos completos (INSERT INTO)"],
                [C.green,  "Reset de secuencias automático"],
                [C.green,  "Verificación MD5 de integridad"],
                [C.orange, "Guardado en Supabase Storage"],
                [C.orange, "Máximo 3 backups en Storage"],
                [C.gold,   "Backup selectivo disponible"],
                [C.blue,   "Cron automático configurable"],
              ] as [string,string][]).map(([color, text]) => (
                <div key={text} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:7 }}>
                  <div style={{ width:14, height:14, borderRadius:"50%", background:`${color}18`,
                    border:`1px solid ${color}35`, display:"flex", alignItems:"center",
                    justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <CheckCircle size={8} color={color} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB, lineHeight:1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
