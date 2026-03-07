// src/pages/private/admin/AdminReportes.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell, Search, TrendingUp, ChevronRight, BarChart2,
  Layers, RefreshCw, Download,
  DollarSign, ShoppingCart, Activity, Clock,
  Trophy, Star, FileSpreadsheet, FileText,
  ArrowUpRight, ArrowDownRight, Users,
  Upload, CheckCircle2, AlertCircle, FileCheck2,
  LayoutDashboard,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart as RBarChart, Bar, Legend,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

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
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);
const fmtNum = (n: number) => new Intl.NumberFormat("es-MX").format(n ?? 0);

interface KPIData {
  ingresos_totales:      number;
  obras_vendidas:        number;
  ticket_promedio:       number;
  comisiones_pendientes: number;
  artistas_activos:      number;
  obras_activas:         number;
}
interface MesData {
  mes:                  string;
  total?:               number;
  ingresos?:            number;
  comision_plataforma?: number;
  neto_artistas?:       number;
}
interface ObraTop {
  id_obra:  number;
  titulo:   string;
  artista:  string;
  ingresos: number;
}
interface ArtistaTop {
  id_artista:            number;
  nombre_completo:       string;
  nombre_artistico:      string;
  foto_perfil?:          string;
  ventas_totales:        number;
  comisiones_generadas:  number;
  comisiones_pagadas:    number;
  comisiones_pendientes: number;
}
interface ImportRow {
  fila:     number;
  titulo:   string;
  accion:   "insertada" | "actualizada" | "error" | null;
  id_obra?: number;
  errores:  string[];
}
interface ImportResult {
  resumen: { total: number; insertadas: number; actualizadas: number; errores: number };
  detalle: ImportRow[];
}
interface TooltipProps {
  active?:  boolean;
  payload?: { color: string; name: string; value: number }[];
  label?:   string;
}

type ImportTipo = "obras" | "artistas";

const IMPORTADOR_CONFIG: Record<ImportTipo, {
  color: string; label: string; plantillaEndpoint: string;
  importEndpoint: string; campos: string[]; nota: string;
}> = {
  obras: {
    color: C.orange, label: "obras",
    plantillaEndpoint: "exportar/obras-plantilla",
    importEndpoint:    "importar/obras",
    campos: ["id_obra (vacío = nueva)", "titulo*", "artista*", "categoria*", "tecnica", "año", "descripcion", "precio_base", "alto/ancho_cm", "estado", "destacada"],
    nota:   "La hoja 'Obras' acepta altas nuevas (id_obra vacío) y ediciones (id_obra relleno). La hoja 'Catálogos' lista los valores válidos de artista, categoría y técnica.",
  },
  artistas: {
    color: C.pink, label: "artistas",
    plantillaEndpoint: "exportar/artistas-plantilla",
    importEndpoint:    "importar/artistas",
    campos: ["id_artista (vacío = nuevo)", "nombre_completo*", "nombre_artistico", "correo*", "telefono", "ciudad", "pais", "porcentaje_comision", "estado", "activo (Sí/No)", "biografia"],
    nota:   "La hoja 'Artistas' acepta altas nuevas (id_artista vacío) y actualizaciones (id_artista relleno). La hoja 'Referencia' lista los valores válidos.",
  },
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,7,20,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "10px 14px", fontFamily: FB }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: C.creamMut }}>{p.name}:</span>
          <strong style={{ color: C.cream }}>{fmtMXN(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ loading, onRefresh, navigate }: { loading: boolean; onRefresh: () => void; navigate: (p: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize: 13, color: C.creamSub }}>Reportes</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,232,200,0.03)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 16px", width: 240 }}>
          <Search size={14} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ fontSize: 13, color: C.creamMut, userSelect: "none" }}>Buscar obras, artistas...</span>
        </div>
        <button onClick={onRefresh} style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button style={{ position: "relative", width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={13} color={C.creamMut} strokeWidth={1.8} />
          <span style={{ position: "absolute", top: 8, right: 8, width: 5, height: 5, background: C.orange, borderRadius: "50%", border: `1.5px solid ${C.bgDeep}` }} />
        </button>
        <button onClick={() => navigate("/admin")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,200,150,0.05)", border: `1px solid ${C.borderBr}`, color: C.creamSub, padding: "7px 14px", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FB }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderBr}>
          <LayoutDashboard size={14} strokeWidth={1.8} /> Dashboard
        </button>
      </div>
    </div>
  );
}

// ── KpiSection ────────────────────────────────────────────────────────────────
function KpiSection({ kpis, loading }: { kpis: KPIData | null; loading: boolean }) {
  const cards = [
    { value: kpis?.ingresos_totales      ?? 0, label: "Ingresos Totales",     sub: "todas las ventas",   accent: C.green,  Icon: DollarSign,   fmt: fmtMXN },
    { value: kpis?.obras_vendidas        ?? 0, label: "Obras Vendidas",        sub: "estado entregada",   accent: C.orange, Icon: ShoppingCart,  fmt: fmtNum },
    { value: kpis?.ticket_promedio       ?? 0, label: "Ticket Promedio",       sub: "por transacción",    accent: C.blue,   Icon: Activity,      fmt: fmtMXN },
    { value: kpis?.comisiones_pendientes ?? 0, label: "Comisiones Pendientes", sub: "por liquidar",       accent: C.gold,   Icon: Clock,         fmt: fmtMXN },
    { value: kpis?.artistas_activos      ?? 0, label: "Artistas Activos",      sub: "en la plataforma",   accent: C.pink,   Icon: Users,         fmt: fmtNum },
    { value: kpis?.obras_activas         ?? 0, label: "Obras Publicadas",      sub: "en catálogo activo", accent: C.purple, Icon: Layers,        fmt: fmtNum },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 18 }}>
      {cards.map(({ value, label, sub, accent, Icon, fmt }, i) => (
        <div key={label}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 14px 12px", position: "relative", overflow: "hidden", transition: "border-color .2s, transform .2s", cursor: "default", animation: `fadeUp .4s ease ${i * 0.05}s both` }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}30`; el.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = "translateY(0)"; }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Icon size={13} color={accent} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: loading ? C.creamMut : C.cream, letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 4, fontFamily: FD }}>
            {loading ? "—" : fmt(value)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.creamSub, fontFamily: FB, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── ExportBtn ─────────────────────────────────────────────────────────────────
function ExportBtn({ label, endpoint, color, icon: Icon }: { label: string; endpoint: string; color: string; icon: React.ElementType }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reportes/${endpoint}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url;
      const cd   = res.headers.get("Content-Disposition") || "";
      const m    = cd.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] || `reporte-${Date.now()}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`${label} exportado correctamente`, "ok");
    } catch { showToast(`Error al exportar ${label}`, "err"); }
    finally { setLoading(false); }
  };
  return (
    <button onClick={handleExport} disabled={loading}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: `${color}0D`, border: `1px solid ${color}25`, color: loading ? C.creamMut : C.cream, padding: "11px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: FB, transition: "all .15s", opacity: loading ? 0.7 : 1, width: "100%" }}
      onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = `${color}1C`; (e.currentTarget as HTMLElement).style.borderColor = `${color}45`; } }}
      onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = `${color}0D`; (e.currentTarget as HTMLElement).style.borderColor = `${color}25`; } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} color={loading ? C.creamMut : color} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none", flexShrink: 0 }} />
        <span>{loading ? "Exportando..." : label}</span>
      </div>
      {!loading && <Download size={12} color={color} style={{ opacity: 0.55, flexShrink: 0 }} />}
    </button>
  );
}

// ── ImportadorExcel ───────────────────────────────────────────────────────────
function ImportadorExcel({ tipo }: { tipo: ImportTipo }) {
  const cfg = IMPORTADOR_CONFIG[tipo];
  const { showToast }             = useToast();
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultado, setResultado] = useState<ImportResult | null>(null);
  const [plantLoad, setPlantLoad] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const procesar = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) { showToast("Solo se aceptan archivos .xlsx", "err"); return; }
    setUploading(true); setResultado(null);
    try {
      const form = new FormData(); form.append("archivo", file);
      const res  = await fetch(`${API_URL}/api/reportes/${cfg.importEndpoint}`, { method: "POST", headers: { Authorization: `Bearer ${authService.getToken()}` }, body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setResultado(json);
      showToast(`Importación completa · ${json.resumen.insertadas} nuevos · ${json.resumen.actualizadas} actualizados`, "ok");
    } catch (err) {
  const msg = err instanceof Error ? err.message : "Error al importar";
  showToast(msg, "err");
}
    finally { setUploading(false); }
  };

  const handlePlantilla = async () => {
    setPlantLoad(true);
    try {
      const res = await fetch(`${API_URL}/api/reportes/${cfg.plantillaEndpoint}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      const m = (res.headers.get("Content-Disposition") || "").match(/filename="?([^"]+)"?/);
      a.download = m?.[1] || `${tipo}-plantilla.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url); showToast("Plantilla descargada", "ok");
    } catch { showToast("Error al descargar plantilla", "err"); }
    finally { setPlantLoad(false); }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {/* Paso 1 */}
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: cfg.color, flexShrink: 0, fontFamily: FD }}>1</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.cream, fontFamily: FB }}>Descarga la plantilla</span>
          </div>
          <p style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, lineHeight: 1.55, margin: 0 }}>{cfg.nota}</p>
          <button onClick={handlePlantilla} disabled={plantLoad}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, color: plantLoad ? C.creamMut : cfg.color, padding: "9px 14px", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: plantLoad ? "wait" : "pointer", fontFamily: FB, opacity: plantLoad ? 0.7 : 1, transition: "all .15s", marginTop: "auto" }}
            onMouseEnter={e => { if (!plantLoad) (e.currentTarget as HTMLElement).style.background = `${cfg.color}22`; }}
            onMouseLeave={e => { if (!plantLoad) (e.currentTarget as HTMLElement).style.background = `${cfg.color}12`; }}>
            <Download size={13} strokeWidth={1.8} style={{ animation: plantLoad ? "spin 1s linear infinite" : "none" }} />
            {plantLoad ? "Descargando..." : "Descargar plantilla .xlsx"}
          </button>
        </div>
        {/* Paso 2 */}
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: cfg.color, flexShrink: 0, fontFamily: FD }}>2</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.cream, fontFamily: FB }}>Edita el archivo</span>
          </div>
          <p style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, lineHeight: 1.55, margin: 0 }}>Campos disponibles en la hoja principal:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {cfg.campos.map(c => <span key={c} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${cfg.color}0D`, border: `1px solid ${cfg.color}20`, color: C.creamSub, fontFamily: FB }}>{c}</span>)}
          </div>
        </div>
        {/* Paso 3 */}
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: cfg.color, flexShrink: 0, fontFamily: FD }}>3</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.cream, fontFamily: FB }}>Sube y revisa</span>
          </div>
          <p style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, lineHeight: 1.55, margin: "0 0 auto" }}>
            Arrastra el archivo al área de abajo o haz clic para seleccionarlo. Recibirás un reporte fila por fila.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ label: "Nueva", color: C.green }, { label: "Editada", color: C.orange }, { label: "Error", color: C.pink }].map(({ label, color }) => (
              <span key={label} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${color}12`, border: `1px solid ${color}25`, color, fontWeight: 700, fontFamily: FB }}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) procesar(f); }}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? cfg.color : uploading ? C.purple : C.borderBr}`, borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: uploading ? "wait" : "pointer", background: dragging ? `${cfg.color}06` : "transparent", transition: "all .2s", marginBottom: resultado ? 16 : 0 }}>
        <input ref={inputRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) procesar(f); e.target.value = ""; }} />
        {uploading ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${C.purple}30`, borderTopColor: C.purple, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>Procesando archivo...</div>
            <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 4 }}>Esto puede tardar unos segundos</div>
          </>
        ) : (
          <>
            <Upload size={26} color={dragging ? cfg.color : C.creamMut} strokeWidth={1.5} style={{ marginBottom: 10, opacity: dragging ? 1 : 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.creamSub, fontFamily: FB, marginBottom: 4 }}>
              {dragging ? "Suelta el archivo aquí" : "Arrastra tu .xlsx aquí o haz clic para seleccionar"}
            </div>
            <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>Solo archivos .xlsx · máx. 10 MB</div>
          </>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Total filas",  value: resultado.resumen.total,        color: C.blue   },
              { label: "Insertados",   value: resultado.resumen.insertadas,   color: C.green  },
              { label: "Actualizados", value: resultado.resumen.actualizadas, color: C.orange },
              { label: "Con errores",  value: resultado.resumen.errores,      color: C.pink   },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10, background: `${color}0A`, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: FD, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: C.creamMut, fontFamily: FB, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "28px 46px 1fr 80px 80px", gap: 10, padding: "8px 14px", background: "rgba(255,232,200,0.04)", borderBottom: `1px solid ${C.border}` }}>
              {["", "Fila", "Nombre", "ID", "Estado"].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
              ))}
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {resultado.detalle.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 46px 1fr 80px 80px", gap: 10, alignItems: "center", padding: "9px 14px", borderBottom: i < resultado.detalle.length - 1 ? `1px solid rgba(255,232,200,0.04)` : "none", background: r.accion === "error" ? `${C.pink}06` : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {r.accion === "insertada"   && <CheckCircle2 size={14} color={C.green}  strokeWidth={2} />}
                    {r.accion === "actualizada" && <FileCheck2   size={14} color={C.orange} strokeWidth={2} />}
                    {r.accion === "error"       && <AlertCircle  size={14} color={C.pink}   strokeWidth={2} />}
                  </div>
                  <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>F{r.fila}</span>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, color: C.cream, fontFamily: FB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{r.titulo}</span>
                    {r.accion === "error" && <span style={{ fontSize: 10, color: C.pink, fontFamily: FB, display: "block", marginTop: 1 }}>{r.errores.join(" · ")}</span>}
                  </div>
                  <span style={{ fontSize: 10, color: C.creamMut, fontFamily: FB }}>{r.id_obra ? `#${r.id_obra}` : "—"}</span>
                  <div>
                    {r.accion === "insertada"   && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 100, background: `${C.green}14`,  color: C.green,  fontWeight: 700, fontFamily: FB }}>Nueva</span>}
                    {r.accion === "actualizada" && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 100, background: `${C.orange}14`, color: C.orange, fontWeight: 700, fontFamily: FB }}>Editada</span>}
                    {r.accion === "error"       && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 100, background: `${C.pink}14`,   color: C.pink,   fontWeight: 700, fontFamily: FB }}>Error</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 10 }}>
            <button onClick={() => setResultado(null)} style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Limpiar resultado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GestionDatos ──────────────────────────────────────────────────────────────
function GestionDatos() {
  const [mainTab,   setMainTab]   = useState<"exportar" | "importar">("exportar");
  const [importTab, setImportTab] = useState<ImportTipo>("obras");

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, fontFamily: FD }}>Gestión de datos</div>
          <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 3 }}>Exporta reportes en Excel o importa registros masivamente</div>
        </div>
        <div style={{ display: "flex", gap: 3, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.borderBr}`, borderRadius: 11, padding: 3 }}>
          {([
            { id: "exportar", label: "Exportar", Icon: Download },
            { id: "importar", label: "Importar", Icon: Upload   },
          ] as const).map(({ id, label, Icon }) => {
            const active = mainTab === id;
            return (
              <button key={id} onClick={() => setMainTab(id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 8, background: active ? "rgba(255,132,14,0.14)" : "transparent", border: active ? `1px solid rgba(255,132,14,0.28)` : "1px solid transparent", color: active ? C.orange : C.creamMut, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}>
                <Icon size={13} strokeWidth={1.8} />{label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ height: 1, background: C.border, margin: "18px 0 0" }} />
      <div style={{ padding: "22px 24px 26px" }}>
        {mainTab === "exportar" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Reportes disponibles · formato .xlsx</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Ventas",         endpoint: "exportar/ventas",        color: C.orange, icon: FileText, desc: "Fecha · obra · artista · cliente · totales · estado · método de pago" },
                { label: "Financiero",     endpoint: "exportar/financiero",     color: C.purple, icon: Activity, desc: "Ingresos brutos · comisiones de plataforma · neto artistas por mes"   },
                { label: "Artistas",       endpoint: "exportar/artistas",       color: C.pink,   icon: Users,   desc: "Nombre · obras activas · ventas · comisiones pagadas y pendientes"    },
                { label: "Catálogo obras", endpoint: "exportar/catalogo-obras", color: C.blue,   icon: Layers,  desc: "Título · artista · precio · categoría · técnica · estado de cada obra" },
              ].map(({ label, endpoint, color, icon: Icon, desc }) => (
                <div key={label} style={{ padding: 16, borderRadius: 12, background: `${color}04`, border: `1px solid ${color}12` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} color={color} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FB }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, lineHeight: 1.5, margin: "0 0 12px" }}>{desc}</p>
                  <ExportBtn label={`Exportar ${label.toLowerCase()}`} endpoint={endpoint} color={color} icon={Icon} />
                </div>
              ))}
            </div>
          </div>
        )}

        {mainTab === "importar" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.12em", marginRight: 4 }}>Tipo de registro:</span>
              {([
                { id: "obras",    label: "Obras",    Icon: Layers, color: C.orange },
                { id: "artistas", label: "Artistas", Icon: Users,  color: C.pink   },
              ] as const).map(({ id, label, Icon, color }) => {
                const active = importTab === id;
                return (
                  <button key={id} onClick={() => setImportTab(id)}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 18px", borderRadius: 9, background: active ? `${color}12` : "rgba(255,232,200,0.03)", border: `1px solid ${active ? `${color}35` : C.borderBr}`, color: active ? color : C.creamSub, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}>
                    <Icon size={13} strokeWidth={active ? 2.2 : 1.8} />{label}
                  </button>
                );
              })}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${IMPORTADOR_CONFIG[importTab].color}0D`, border: `1px solid ${IMPORTADOR_CONFIG[importTab].color}25` }}>
                <FileSpreadsheet size={11} color={IMPORTADOR_CONFIG[importTab].color} strokeWidth={2} />
                <span style={{ fontSize: 11, color: IMPORTADOR_CONFIG[importTab].color, fontWeight: 700, fontFamily: FB }}>Importar {importTab}</span>
              </div>
            </div>
            <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
            <ImportadorExcel key={importTab} tipo={importTab} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminReportes() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [loading,     setLoading]     = useState(true);
  const [kpis,        setKpis]        = useState<KPIData | null>(null);
  const [ventasMes,   setVentasMes]   = useState<MesData[]>([]);
  const [ivsMes,      setIvsMes]      = useState<MesData[]>([]);
  const [topObras,    setTopObras]    = useState<ObraTop[]>([]);
  const [topArtistas, setTopArtistas] = useState<ArtistaTop[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${authService.getToken()}` };
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch(`${API_URL}/api/reportes/kpis`,                   { headers }),
        fetch(`${API_URL}/api/reportes/ventas-por-mes`,         { headers }),
        fetch(`${API_URL}/api/reportes/ingresos-vs-comisiones`, { headers }),
        fetch(`${API_URL}/api/reportes/top-obras`,              { headers }),
        fetch(`${API_URL}/api/reportes/top-artistas`,           { headers }),
      ]);
      const [d1, d2, d3, d4, d5] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json()]);
      if (d1.success) setKpis(d1.data);
      if (d2.success) setVentasMes(d2.data);
      if (d3.success) setIvsMes(d3.data);
      if (d4.success) setTopObras(d4.data);
      if (d5.success) setTopArtistas(d5.data);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const maxIngresos = Math.max(...topObras.map(o => Number(o.ingresos)), 1);

  // ✅ Sin wrapper externo, sin Sidebar, sin userName state, sin auth check, sin <style>
  return (
    <>
      <Topbar loading={loading} onRefresh={fetchAll} navigate={navigate} />

      <main style={{ flex: 1, padding: "24px 28px 36px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: "rgba(255,248,238,0.05)", border: `1px solid ${C.borderBr}`, fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 8 }}>
              <BarChart2 size={9} color={C.orange} /> Panel de Reportes
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, fontFamily: FD, color: C.cream }}>
              Análisis &{" "}
              <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reportes</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.creamMut, fontFamily: FB }}>{new Date().getFullYear()} · datos en tiempo real</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100, background: `${C.green}0D`, border: `1px solid ${C.green}25` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700, fontFamily: FB }}>Datos actualizados</span>
          </div>
        </div>

        <KpiSection kpis={kpis} loading={loading} />

        {/* Gráficas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 18px 12px" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD }}>Ventas por mes</div>
              <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Año {new Date().getFullYear()} · en MXN</div>
            </div>
            {ventasMes.length === 0 && !loading ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.creamMut, fontSize: 13, fontFamily: FB, flexDirection: "column", gap: 8 }}>
                <TrendingUp size={28} color={C.creamMut} style={{ opacity: .2 }} /> Sin ventas registradas aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RBarChart data={ventasMes} margin={{ top: 4, right: 4, bottom: 4, left: -14 }}>
                  <CartesianGrid stroke="rgba(255,232,200,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="transparent" tick={{ fill: C.creamMut, fontSize: 10, fontFamily: FB }} />
                  <YAxis stroke="transparent" tick={{ fill: C.creamMut, fontSize: 9, fontFamily: FB }} width={40} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="total" name="Total MXN" fill={C.orange} radius={[5, 5, 0, 0]} fillOpacity={0.85} />
                </RBarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 18px 12px" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD }}>Ingresos vs Comisiones</div>
              <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Plataforma vs neto artistas · MXN</div>
            </div>
            {ivsMes.length === 0 && !loading ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.creamMut, fontSize: 13, fontFamily: FB, flexDirection: "column", gap: 8 }}>
                <Activity size={28} color={C.creamMut} style={{ opacity: .2 }} /> Sin datos disponibles aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={ivsMes} margin={{ top: 4, right: 4, bottom: 4, left: -14 }}>
                  <defs>
                    <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.25} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gNeto"     x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.20} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gCom"      x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.pink}   stopOpacity={0.15} /><stop offset="100%" stopColor={C.pink}   stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,232,200,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="transparent" tick={{ fill: C.creamMut, fontSize: 10, fontFamily: FB }} />
                  <YAxis stroke="transparent" tick={{ fill: C.creamMut, fontSize: 9, fontFamily: FB }} width={40} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: C.creamMut, fontFamily: FB, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="ingresos"            name="Ingresos"     stroke={C.orange} strokeWidth={2}   fill="url(#gIngresos)" dot={false} />
                  <Area type="monotone" dataKey="neto_artistas"       name="Neto artista" stroke={C.purple} strokeWidth={2}   fill="url(#gNeto)"     dot={false} />
                  <Area type="monotone" dataKey="comision_plataforma" name="Comisión"     stroke={C.pink}   strokeWidth={1.5} fill="url(#gCom)"      dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Obras + Top Artistas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD }}>Top obras</div>
                <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Por ingresos generados</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.gold}12`, border: `1px solid ${C.gold}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trophy size={13} color={C.gold} strokeWidth={2} />
              </div>
            </div>
            <div style={{ height: 1, background: C.border, marginBottom: 12 }} />
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid rgba(255,232,200,0.04)` }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(255,232,200,0.05)" }} />
                <div style={{ flex: 1, height: 10, background: "rgba(255,232,200,0.05)", borderRadius: 3 }} />
                <div style={{ width: 60, height: 10, background: "rgba(255,232,200,0.05)", borderRadius: 3 }} />
              </div>
            )) : topObras.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.creamMut, fontSize: 13, fontFamily: FB }}>
                <Trophy size={24} color={C.creamMut} style={{ marginBottom: 8, opacity: .2 }} /><div>Sin ventas aún</div>
              </div>
            ) : topObras.map((obra, i) => {
              const pct   = (Number(obra.ingresos) / maxIngresos) * 100;
              const medal = i === 0 ? C.gold : i === 1 ? C.creamSub : i === 2 ? C.orange : C.creamMut;
              return (
                <div key={obra.id_obra} style={{ padding: "9px 0", borderBottom: i < topObras.length - 1 ? `1px solid rgba(255,232,200,0.04)` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: medal, width: 18, textAlign: "center", fontFamily: FD, flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: C.cream, fontFamily: FB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{obra.titulo}</span>
                    <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, flexShrink: 0 }}>{obra.artista}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: FB, flexShrink: 0 }}>{fmtMXN(Number(obra.ingresos))}</span>
                  </div>
                  <div style={{ marginLeft: 28, height: 3, borderRadius: 10, background: "rgba(255,232,200,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 10, background: `linear-gradient(90deg, ${C.orange}, ${C.gold})` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD }}>Top artistas</div>
                <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Por comisiones generadas</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.pink}12`, border: `1px solid ${C.pink}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={13} color={C.pink} strokeWidth={2} />
              </div>
            </div>
            <div style={{ height: 1, background: C.border, marginBottom: 12 }} />
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid rgba(255,232,200,0.04)` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,232,200,0.05)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 10, background: "rgba(255,232,200,0.05)", borderRadius: 3, marginBottom: 4, width: "60%" }} />
                  <div style={{ height: 8, background: "rgba(255,232,200,0.04)", borderRadius: 3, width: "40%" }} />
                </div>
                <div style={{ width: 70, height: 10, background: "rgba(255,232,200,0.05)", borderRadius: 3 }} />
              </div>
            )) : topArtistas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.creamMut, fontSize: 13, fontFamily: FB }}>
                <Users size={24} color={C.creamMut} style={{ marginBottom: 8, opacity: .2 }} /><div>Sin comisiones aún</div>
              </div>
            ) : topArtistas.map((a, i) => (
              <div key={a.id_artista}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topArtistas.length - 1 ? `1px solid rgba(255,232,200,0.04)` : "none", cursor: "pointer", borderRadius: 6, transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                onClick={() => navigate(`/admin/artistas/${a.id_artista}`)}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white" }}>
                  {a.foto_perfil ? <img src={a.foto_perfil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (a.nombre_artistico || a.nombre_completo)?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.nombre_artistico || a.nombre_completo}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB, marginTop: 1 }}>{a.ventas_totales} {a.ventas_totales === 1 ? "venta" : "ventas"}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: FB }}>{fmtMXN(Number(a.comisiones_generadas))}</div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", marginTop: 3 }}>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: `${C.green}12`, color: C.green, fontWeight: 700, fontFamily: FB }}>
                      <ArrowUpRight size={7} style={{ display: "inline", marginRight: 1 }} />{fmtMXN(Number(a.comisiones_pagadas))}
                    </span>
                    {Number(a.comisiones_pendientes) > 0 && (
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: `${C.gold}12`, color: C.gold, fontWeight: 700, fontFamily: FB }}>
                        <ArrowDownRight size={7} style={{ display: "inline", marginRight: 1 }} />{fmtMXN(Number(a.comisiones_pendientes))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <GestionDatos />
      </main>
    </>
  );
}