// src/pages/private/admin/Backups.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2, Layers,
  Settings, LogOut, Database, Download, CheckCircle,
  AlertCircle, Clock, RefreshCw, Shield, HardDrive,
  FileText, ChevronRight, Trash2, Star, Info, ExternalLink,
} from "lucide-react";
import logoImg from "../../../assets/images/logo.png";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#FF840E", pink:"#CC59AD", magenta:"#CC4EA1", purple:"#8D4CCD",
  blue:"#79AAF5", gold:"#FFC110", green:"#22C97A", cream:"#FFF8EE",
  creamSub:"#D8CABC", creamMut:"rgba(255,232,200,0.35)", bg:"#0C0812",
  bgDeep:"#070510", panel:"#100D1C", card:"rgba(18,13,30,0.95)",
  border:"rgba(255,200,150,0.08)", borderBr:"rgba(118,78,49,0.20)",
  borderHi:"rgba(255,200,150,0.18)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface BackupEntry {
  id:          string;
  filename:    string;
  fecha:       Date;
  filas:       number;
  tablas:      number;
  duracion:    string;
  checksum:    string;
  tamaño:      number;
  estado:      "ok" | "error";
  url_archivo: string | null;
}

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, path:"/admin"           },
  { id:"obras",     label:"Obras",     icon:Layers,          path:"/admin/obras"     },
  { id:"artistas",  label:"Artistas",  icon:Users,           path:"/admin/artistas"  },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     path:"/admin"           },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       path:"/admin"           },
  { id:"backups",   label:"Backups",   icon:Database,        path:"/admin/backups"   },
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(2)} MB`;
}
function formatFecha(d: Date) {
  return d.toLocaleString("es-MX", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function tiempoRelativo(d: Date) {
  const diff = Date.now() - d.getTime(), min = Math.floor(diff/60000);
  if (min < 1)  return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min/60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs/24)} d`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(e: any): BackupEntry {
  return {
    id:          String(e.id),
    filename:    e.nombre_archivo,
    fecha:       new Date(e.fecha),
    tamaño:      e.tamanio_bytes  ?? 0,
    filas:       e.filas_total    ?? 0,
    tablas:      e.tablas         ?? 0,
    duracion:    e.duracion_ms    ? `${(e.duracion_ms/1000).toFixed(2)}s` : "—",
    checksum:    e.checksum_md5   ?? "—",
    estado:      "ok" as const,
    url_archivo: e.url_archivo    ?? null,
  };
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ userName, onLogout, navigate }: { userName:string; onLogout:()=>void; navigate:(p:string)=>void }) {
  return (
    <div style={{ width:220, minHeight:"100vh", background:C.bgDeep, borderRight:`1px solid ${C.borderBr}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0, zIndex:40 }}>
      <div style={{ height:2, background:`linear-gradient(90deg,${C.orange},${C.gold},${C.pink},${C.purple},${C.blue})` }} />
      <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, overflow:"hidden", flexShrink:0, border:`1px solid ${C.borderBr}` }}>
            <img src={logoImg} alt="Galería" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:C.cream, lineHeight:1.1, fontFamily:FD, letterSpacing:"-0.01em" }}>Galería</div>
            <div style={{ fontSize:9, color:C.orange, marginTop:2, letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:FB, fontWeight:700 }}>Panel Admin</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.borderBr}` }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", fontFamily:FB }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:FB }}>{userName}</div>
            <div style={{ fontSize:10, color:C.orange, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB }}>Admin</div>
          </div>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}`, flexShrink:0 }} />
        </div>
      </div>
      <div style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.creamMut, letterSpacing:"0.16em", textTransform:"uppercase", padding:"0 8px 10px", fontFamily:FB }}>Navegación</div>
        {NAV.map(({ id, label, icon:Icon, path }) => {
          const on = id === "backups";
          return (
            <button key={id} onClick={() => navigate(path)}
              style={{ width:"100%", cursor:"pointer", background: on ? "rgba(141,76,205,0.12)" : "transparent", border: on ? "1px solid rgba(141,76,205,0.28)" : "1px solid transparent", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, transition:"all .15s", position:"relative", fontFamily:FB }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {on && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:2.5, borderRadius:"0 3px 3px 0", background:C.purple }} />}
              <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, background: on ? "rgba(141,76,205,0.18)" : "rgba(255,232,200,0.05)", display:"flex", alignItems:"center", justifyContent:"center", border: on ? "1px solid rgba(141,76,205,0.35)" : "1px solid transparent" }}>
                <Icon size={15} color={on ? C.purple : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize:13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily:FB }}>{label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ padding:"12px 10px 18px", borderTop:`1px solid ${C.borderBr}` }}>
        <div style={{ display:"flex", gap:6 }}>
          <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", fontSize:12, color:C.creamMut, fontWeight:600, fontFamily:FB }}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={onLogout} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px", borderRadius:9, border:`1px solid rgba(204,89,173,0.25)`, background:"rgba(204,89,173,0.06)", cursor:"pointer", fontSize:12, color:C.pink, fontWeight:600, fontFamily:FB }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}

function Topbar({ navigate }: { navigate:(p:string)=>void }) {
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

// ── Fila de historial ─────────────────────────────────────────────────────────
function BackupRow({ entry, onDelete, deleting }: {
  entry:    BackupEntry;
  onDelete: (id:string) => void;
  deleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"grid", gridTemplateColumns:"1fr 90px 80px 70px 60px 80px",
        alignItems:"center", gap:12, padding:"13px 18px", borderRadius:10,
        background: hovered ? "rgba(141,76,205,0.06)" : "transparent",
        border:`1px solid ${hovered ? "rgba(141,76,205,0.20)" : "transparent"}`,
        transition:"all .15s", opacity: deleting ? 0.5 : 1,
      }}
    >
      {/* Nombre */}
      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:"rgba(34,201,122,0.10)", border:"1px solid rgba(34,201,122,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <CheckCircle size={15} color={C.green} strokeWidth={2} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.cream, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.filename}</div>
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

      {/* Acciones */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
        <a
          href={entry.url_archivo!}
          download={entry.filename}
          title="Descargar desde Supabase Storage"
          style={{ width:30, height:30, borderRadius:7, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.25)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", textDecoration:"none", transition:"all .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(121,170,245,0.22)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(121,170,245,0.10)"}
        >
          <Download size={13} color={C.blue} strokeWidth={2} />
        </a>

        <button
          onClick={() => onDelete(entry.id)}
          disabled={deleting}
          title="Eliminar de Storage y BD"
          style={{ width:30, height:30, borderRadius:7, background:"rgba(204,89,173,0.06)", border:"1px solid rgba(204,89,173,0.18)", display:"flex", alignItems:"center", justifyContent:"center", cursor: deleting ? "wait" : "pointer", transition:"all .15s" }}
          onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.18)"; }}
          onMouseLeave={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"; }}
        >
          {deleting
            ? <RefreshCw size={11} color={C.pink} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} />
            : <Trash2 size={13} color={C.pink} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function Backups() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [userName,   setUserName]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [historial,  setHistorial]  = useState<BackupEntry[]>([]);
  const [selected,   setSelected]   = useState<BackupEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/historial`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (json.success) setHistorial((json.data || []).map(mapEntry));
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login"); return; }
    setUserName(authService.getUserName() || "Admin");
    cargarHistorial();
  }, [navigate, cargarHistorial]);

  // ── Generar nuevo respaldo ─────────────────────────────────────────────────
  const handleGenerarBackup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (!res.ok) throw new Error("Error al generar el respaldo");

      const blob     = await res.blob();
      const filename = (() => {
        const cd    = res.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="?([^"]+)"?/);
        return match?.[1] || `nub-studio-backup-${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.sql`;
      })();

      // Descarga automática
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);

      // Recargar historial desde BD (ya tiene el nuevo y eliminó el más viejo si había >3)
      await cargarHistorial();
      showToast("Respaldo generado y descargado ✓", "ok");
    } catch (err) {
      console.error(err);
      showToast("Error al generar el respaldo", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast, cargarHistorial]);

  // ── Eliminar backup: Storage + BD ─────────────────────────────────────────
  const handleEliminar = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res  = await fetch(`${API_URL}/api/admin/backups/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setHistorial(prev => prev.filter(e => e.id !== id));
      setSelected(prev => prev?.id === id ? null : prev);
      showToast("Backup eliminado de Storage y BD ✓", "ok");
    } catch (err) {
      console.error(err);
      showToast("Error al eliminar el backup", "err");
    } finally {
      setDeletingId(null);
    }
  }, [showToast]);

  const handleLogout = () => { authService.logout(); navigate("/login"); };

  const ultimoBackup  = historial[0];
  const totalFilas    = historial.reduce((s, e) => s + e.filas, 0);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:FB, color:C.cream }}>
      <Sidebar userName={userName} onLogout={handleLogout} navigate={navigate} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <Topbar navigate={navigate} />

        <main style={{ flex:1, padding:"24px 28px 32px", overflowY:"auto" }}>

          {/* ── Banner ───────────────────────────────────────────────────── */}
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
                Exporta un respaldo completo · se conservan los últimos 3 en Supabase Storage automáticamente.
              </p>
            </div>
            <button
              onClick={handleGenerarBackup} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:8, background: loading ? "rgba(141,76,205,0.08)" : `linear-gradient(135deg,${C.purple},#6B35A8)`, border:`1px solid rgba(141,76,205,${loading ? "0.20" : "0.50"})`, color: loading ? C.creamMut : "white", padding:"12px 22px", borderRadius:11, fontWeight:700, fontSize:14, cursor: loading ? "wait" : "pointer", fontFamily:FB, boxShadow: loading ? "none" : `0 6px 20px rgba(141,76,205,0.30)`, transition:"all .2s", opacity: loading ? 0.7 : 1, flexShrink:0 }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px rgba(141,76,205,0.45)`; } }}
              onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(141,76,205,0.30)`; } }}
            >
              <Database size={16} strokeWidth={2} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} color={loading ? C.creamMut : "white"} />
              {loading ? "Generando respaldo..." : "Generar respaldo ahora"}
            </button>
          </div>

          {/* ── KPIs ─────────────────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
            <MiniKpi label="Respaldos en Storage" value={historial.length}                              icon={Database}    accent={C.purple} />
            <MiniKpi label="Exitosos"              value={historial.length}                              icon={CheckCircle} accent={C.green}  />
            <MiniKpi label="Total filas exportadas" value={totalFilas.toLocaleString("es-MX")}          icon={HardDrive}   accent={C.blue}   />
            <MiniKpi label="Último respaldo"        value={ultimoBackup ? tiempoRelativo(ultimoBackup.fecha) : "—"} icon={Clock} accent={C.gold} />
          </div>

          {/* ── Layout ───────────────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>

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
                  {["Archivo","Tamaño","Filas","Tablas","Tiempo",""].map((h,i) => (
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
                ) : (
                  historial.map(entry => (
                    <div key={entry.id} onClick={() => setSelected(entry)} style={{ cursor:"pointer" }}>
                      <BackupRow
                        entry={entry}
                        onDelete={handleEliminar}
                        deleting={deletingId === entry.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel derecho */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:C.card, border:`1px solid ${selected ? "rgba(141,76,205,0.25)" : C.border}`, borderRadius:14, padding:"18px", transition:"border-color .2s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.borderBr}` }}>
                  <Info size={14} color={C.purple} strokeWidth={2} />
                  <span style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FD }}>Detalle</span>
                </div>
                {selected ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      { label:"Archivo",  value:selected.filename,                        mono:true  },
                      { label:"Fecha",    value:formatFecha(selected.fecha),              mono:false },
                      { label:"Tamaño",   value:formatBytes(selected.tamaño),             mono:false },
                      { label:"Filas",    value:selected.filas > 0 ? selected.filas.toLocaleString("es-MX") : "—", mono:false },
                      { label:"Tablas",   value:selected.tablas > 0 ? String(selected.tablas) : "—", mono:false },
                      { label:"Duración", value:selected.duracion,                        mono:false },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:FB, marginBottom:3 }}>{label}</div>
                        <div style={{ fontSize:12, color:C.creamSub, fontFamily: mono ? "monospace" : FB, wordBreak:"break-all", background: mono ? "rgba(255,255,255,0.03)" : "transparent", padding: mono ? "4px 8px" : "0", borderRadius: mono ? 6 : 0 }}>{value}</div>
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:FB, marginBottom:3, display:"flex", alignItems:"center", gap:4 }}>
                        <Shield size={9} color={C.creamMut} /> MD5
                      </div>
                      <div style={{ fontSize:10, color:C.creamMut, fontFamily:"monospace", wordBreak:"break-all", background:"rgba(255,255,255,0.03)", padding:"6px 8px", borderRadius:6, lineHeight:1.5 }}>{selected.checksum}</div>
                    </div>
                    <a
                      href={selected.url_archivo!}
                      download={selected.filename}
                      style={{ marginTop:6, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(121,170,245,0.10)", border:"1px solid rgba(121,170,245,0.28)", color:C.blue, padding:"9px", borderRadius:9, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FB, textDecoration:"none", transition:"all .15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(121,170,245,0.20)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(121,170,245,0.10)"}
                    >
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
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.10); border-radius:8px; }
      `}</style>
    </div>
  );
}