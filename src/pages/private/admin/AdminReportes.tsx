// src/pages/private/admin/AdminReportes.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, Download, RefreshCw, ChevronRight,
  TrendingUp, DollarSign, ShoppingBag, Activity,
  Clock, Users, Layers,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart as RBarChart, Bar,
} from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  red:      "#F04E6B",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.35)",
  bgDeep:   "#070510",
  bg:       "#0C0812",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FB = "'DM Sans', sans-serif";
const FD = "'Playfair Display', serif";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmt  = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const fmtM = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// ── Types ─────────────────────────────────────────────────────────────────────
interface KPIData {
  ingresos_totales: number; obras_vendidas: number; ticket_promedio: number;
  comisiones_pendientes: number; artistas_activos: number; obras_activas: number;
}

interface VentaMes {
  mes: string; mes_num: number; cantidad: number; total: number;
}

interface IngresoComision {
  mes: string; ingresos: number; comision_plataforma: number;
  neto_artistas: number; monto_comision: number;
}

interface TooltipPayloadItem {
  color: string; name: string; value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize: 13, color: C.creamSub }}>Reportes</span>
      </div>
      <button onClick={() => navigate("/admin")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 14px", color: C.creamMut, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.cream; el.style.borderColor = C.borderHi; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.creamMut; el.style.borderColor = C.border; }}>
        <BarChart2 size={13} strokeWidth={1.8} /> Dashboard
      </button>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────
function KPIStrip({ kpis, loading }: { kpis: KPIData | null; loading: boolean }) {
  const items = [
    { label: "Ingresos totales",      value: fmtM(kpis?.ingresos_totales ?? 0),     icon: DollarSign,  accent: C.orange },
    { label: "Obras vendidas",        value: fmt(kpis?.obras_vendidas ?? 0),         icon: ShoppingBag, accent: C.green  },
    { label: "Ticket promedio",       value: fmtM(kpis?.ticket_promedio ?? 0),       icon: TrendingUp,  accent: C.blue   },
    { label: "Comisiones pendientes", value: fmtM(kpis?.comisiones_pendientes ?? 0), icon: Clock,       accent: C.gold   },
    { label: "Artistas activos",      value: fmt(kpis?.artistas_activos ?? 0),       icon: Users,       accent: C.pink   },
    { label: "Obras publicadas",      value: fmt(kpis?.obras_activas ?? 0),          icon: Layers,      accent: C.purple },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20 }}>
      {items.map(({ label, value, icon: Icon, accent }, i) => (
        <div key={label}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden", transition: "border-color .2s, transform .2s", cursor: "default", animation: `fadeUp .4s ease ${i * 0.05}s both` }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}35`; el.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = "translateY(0)"; }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},transparent)` }} />
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}14`, border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Icon size={13} color={accent} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: loading ? C.creamMut : C.cream, fontFamily: FD, letterSpacing: "-0.5px", marginBottom: 3 }}>{loading ? "—" : value}</div>
          <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── CustomTooltip — fuera del componente para evitar recreación en cada render ─
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,7,20,0.98)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "10px 14px", fontFamily: FB }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.creamSub, marginBottom: 3 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: C.creamMut }}>{p.name}:</span>
          <strong style={{ color: C.cream }}>{fmtM(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function Charts({ ventasMes, ingresosComisiones }: { ventasMes: VentaMes[]; ingresosComisiones: IngresoComision[] }) {

  const grid = <CartesianGrid stroke="rgba(255,232,200,0.05)" strokeDasharray="3 3" vertical={false} />;
  const axisProps = { stroke: "transparent" as const, tick: { fill: C.creamMut, fontSize: 10, fontFamily: FB } };

  const empty = (
    <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.4 }}>
      <Activity size={22} color={C.creamMut} />
      <span style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>Sin datos aún</span>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 18px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 2 }}>Ventas por mes</div>
        <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 14 }}>Año 2026 · en MXN</div>
        {ventasMes.length === 0 ? empty : (
          <ResponsiveContainer width="100%" height={160}>
            <RBarChart data={ventasMes} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              {grid}
              <XAxis dataKey="mes" {...axisProps} />
              <YAxis {...axisProps} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill={C.orange} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </RBarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 18px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 2 }}>Ingresos vs Comisiones</div>
        <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 14 }}>Plataforma vs neto artistas · MXN</div>
        {ingresosComisiones.length === 0 ? empty : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ingresosComisiones} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="gO2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.22} /><stop offset="100%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
                <linearGradient id="gP2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.14} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient>
              </defs>
              {grid}
              <XAxis dataKey="mes" {...axisProps} />
              <YAxis {...axisProps} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos"      name="Ingresos"      stroke={C.orange} strokeWidth={2}   fill="url(#gO2)" dot={false} />
              <Area type="monotone" dataKey="neto_artistas" name="Neto artistas" stroke={C.purple} strokeWidth={1.8} fill="url(#gP2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── ExportCards ───────────────────────────────────────────────────────────────
function ExportCards({ onExport, exporting }: { onExport: (t: string) => void; exporting: string | null }) {
  const cards = [
    { id: "ventas",     label: "Ventas",         desc: "Fecha · obra · artista · cliente · totales",     accent: C.orange, icon: ShoppingBag },
    { id: "financiero", label: "Financiero",     desc: "Ingresos brutos · comisiones · neto artistas",   accent: C.purple, icon: TrendingUp  },
    { id: "artistas",   label: "Artistas",       desc: "Nombre · obras · ventas · comisiones",           accent: C.pink,   icon: Users       },
    { id: "catalogo",   label: "Catálogo obras", desc: "Título · artista · precio · categoría · estado", accent: C.blue,   icon: Layers      },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, fontFamily: FD }}>Exportar reportes</div>
          <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Descarga datos en formato .xlsx</div>
        </div>
        <Download size={16} color={C.creamMut} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {cards.map(({ id, label, desc, accent, icon: Icon }) => {
          const busy = exporting === id;
          return (
            <div key={id}
              style={{ background: "rgba(255,232,200,0.02)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "14px 16px", transition: "all .2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}35`; el.style.background = `${accent}06`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.background = "rgba(255,232,200,0.02)"; }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}14`, border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={14} color={accent} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FB, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginBottom: 12, lineHeight: 1.5 }}>{desc}</div>
              <button onClick={() => onExport(id)} disabled={!!exporting}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", borderRadius: 8, border: `1px solid ${accent}35`, background: busy ? `${accent}10` : "transparent", color: busy ? C.creamMut : accent, fontSize: 12, fontWeight: 700, cursor: exporting ? "wait" : "pointer", fontFamily: FB, transition: "all .15s" }}
                onMouseEnter={e => { if (exporting) return; (e.currentTarget as HTMLElement).style.background = `${accent}18`; }}
                onMouseLeave={e => { if (exporting) return; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {busy ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Exportando...</> : <><Download size={12} /> Exportar</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminReportes() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [kpis,               setKpis]              = useState<KPIData | null>(null);
  const [ventasMes,          setVentasMes]          = useState<VentaMes[]>([]);
  const [ingresosComisiones, setIngresosComisiones] = useState<IngresoComision[]>([]);
  const [loadingKpis,        setLoadingKpis]        = useState(true);
  const [exporting,          setExporting]          = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingKpis(true);
      try {
        const [kR, vR, iR] = await Promise.all([
          fetch(`${API}/api/reportes/kpis`,                   { headers: authH() }),
          fetch(`${API}/api/reportes/ventas-por-mes`,         { headers: authH() }),
          fetch(`${API}/api/reportes/ingresos-vs-comisiones`, { headers: authH() }),
        ]);
        const [kJ, vJ, iJ] = await Promise.all([kR.json(), vR.json(), iR.json()]);
        if (kJ.success) setKpis(kJ.data as KPIData);
        if (vJ.success) setVentasMes(vJ.data as VentaMes[]);
        if (iJ.success) setIngresosComisiones(iJ.data as IngresoComision[]);
      } catch { /* silencioso */ }
      finally { setLoadingKpis(false); }
    };
    load();
  }, []);

  const handleExport = async (tipo: string) => {
    setExporting(tipo);
    try {
      const url = tipo === "catalogo"
        ? `${API}/api/reportes/exportar/catalogo-obras`
        : `${API}/api/reportes/exportar/${tipo}`;
      const res = await fetch(url, { headers: authH() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      const cd   = res.headers.get("Content-Disposition") || "";
      const m    = cd.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] || `reporte-${tipo}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast("Reporte descargado correctamente", "ok");
    } catch { showToast("Error al exportar", "err"); }
    finally { setExporting(null); }
  };

  return (
    <>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <Topbar navigate={navigate} />
      <main style={{ flex: 1, padding: "22px 26px 32px", overflowY: "auto", backgroundColor: C.bg, backgroundImage: `radial-gradient(circle at 80% 5%,rgba(141,76,205,0.08) 0%,transparent 35%),radial-gradient(circle at 5% 90%,rgba(255,132,14,0.06) 0%,transparent 30%)`, fontFamily: FB }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 100, background: "rgba(255,248,238,0.04)", border: `1px solid ${C.borderBr}`, fontSize: 11, color: C.creamMut, marginBottom: 10 }}>
            <BarChart2 size={9} color={C.orange} /> Panel de Reportes
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 4px" }}>
            Análisis &amp; <span style={{ color: C.orange }}>Reportes</span>
          </h1>
          <p style={{ fontSize: 13, color: C.creamMut, margin: 0 }}>2026 · datos en tiempo real</p>
        </div>

        <KPIStrip kpis={kpis} loading={loadingKpis} />
        <Charts ventasMes={ventasMes} ingresosComisiones={ingresosComisiones} />
        <ExportCards onExport={handleExport} exporting={exporting} />
      </main>
    </>
  );
}