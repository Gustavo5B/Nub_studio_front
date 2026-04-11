// src/pages/private/admin/AdminDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  Bell, ChevronRight, Clock, CheckCircle, XCircle,
  Layers, Users, Package, Eye, Image, RefreshCw,
  Upload, BarChart2, Activity, FileText, BookOpen, MessageCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const C = {
  orange:"#E8640C", pink:"#A83B90", purple:"#6028AA",
  blue:"#2D6FBE",   gold:"#A87006", green:"#0E8A50",
  cream:"#14121E",  creamSub:"#5A5870",
  creamMut:"#9896A8",
  bgDeep:"#FFFFFF", bg:"#F9F8FC",
  card:"#FFFFFF",
  border:"#E6E4EF",
  borderBr:"rgba(0,0,0,0.05)",
  borderHi:"rgba(0,0,0,0.10)",
  red:"#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";

const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const statusCfg: Record<string, { label: string; color: string }> = {
  publicada: { label: "Publicada", color: C.green  },
  pendiente: { label: "Pendiente", color: C.gold   },
  rechazada: { label: "Rechazada", color: C.red    },
  agotada:   { label: "Agotada",   color: C.creamMut },
};

interface ObraReciente {
  id_obra: number; titulo: string; estado: string;
  imagen_principal?: string; artista_alias?: string; artista_nombre?: string;
}
interface StatsData {
  kpis: Record<string, number>;
  obras_recientes: ObraReciente[];
  strip: Record<string, number>;
}
interface TooltipProps {
  readonly active?: boolean;
  readonly payload?: { color: string; name: string; value: number }[];
  readonly label?: string;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: FB, boxShadow: CS }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: C.creamSub, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: C.creamMut }}>{p.name}:</span>
          <strong style={{ color: C.cream }}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate, onRefresh, loading }: {
  navigate: (p: string) => void; onRefresh: () => void; loading: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize: 13, color: C.creamSub }}>Dashboard</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onRefresh} title="Actualizar datos"
          style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <RefreshCw size={13} color={C.creamMut} strokeWidth={1.8} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button title="Notificaciones"
          style={{ width: 34, height: 34, borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHi}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Bell size={13} color={C.creamMut} strokeWidth={1.8} />
        </button>
        <button onClick={() => navigate("/admin/obras?estado=pendiente")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, border: "none", color: "white", padding: "7px 15px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FB, boxShadow: `0 2px 8px ${C.orange}40`, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          <Clock size={14} strokeWidth={2.5} /> Revisar pendientes
        </button>
      </div>
    </div>
  );
}

// ── WelcomeBanner ─────────────────────────────────────────────────────────────
function WelcomeBanner({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const now = new Date();
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  return (
    <div style={{ borderRadius: 14, padding: "22px 26px", background: "linear-gradient(135deg, rgba(232,100,12,.07), rgba(96,40,170,.04))", border: "1px solid rgba(232,100,12,.15)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,100,12,0.06), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: "rgba(0,0,0,0.03)", border: `1px solid ${C.border}`, fontSize: 13, color: C.creamSub, fontFamily: FB, marginBottom: 10 }}>
          {dateStr}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", fontFamily: FB, color: C.cream }}>
          {greeting},{" "}
          <span style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userName}</span>
        </h1>
        <p style={{ fontSize: 14, color: C.creamSub, margin: "0 0 10px", fontFamily: FB }}>Resumen general de la plataforma.</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: FB, color: C.green, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          Plataforma activa
        </div>
      </div>
    </div>
  );
}

// ── AlertaPendientes ───────────────────────────────────────────────────────────
function AlertaPendientes({ count, navigate }: { count: number; navigate: (p: string) => void }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderRadius: 10, background: `rgba(168,112,6,0.05)`, border: `1px solid rgba(168,112,6,0.25)`, fontFamily: FB, animation: "fadeUp .35s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Clock size={14} color={C.gold} strokeWidth={2} />
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>
            {count === 1 ? "Hay 1 obra pendiente de revisión" : `Hay ${count} obras pendientes de revisión`}
          </span>
          <div style={{ fontSize: 11.5, color: C.creamSub, marginTop: 2 }}>Revísalas para mantener el catálogo actualizado</div>
        </div>
      </div>
      <button onClick={() => navigate("/admin/obras?estado=pendiente")}
        style={{ display: "flex", alignItems: "center", gap: 5, background: `${C.gold}12`, border: `1px solid ${C.gold}35`, color: C.gold, padding: "7px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FB, transition: "all .15s", flexShrink: 0, whiteSpace: "nowrap" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.gold}22`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${C.gold}12`; }}>
        Revisar ahora <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────
function KpiCards({ kpis, loading }: { kpis: Record<string, number> | null; loading: boolean }) {
  const cards = [
    { value: kpis?.total_obras      ?? 0, label: "Total Obras",  sub: "en catálogo",   accent: C.blue,  Icon: Layers      },
    { value: kpis?.obras_publicadas ?? 0, label: "Publicadas",   sub: "activas ahora", accent: C.green, Icon: CheckCircle },
    { value: kpis?.obras_pendientes ?? 0, label: "Pendientes",   sub: "por revisar",   accent: C.gold,  Icon: Clock       },
    { value: kpis?.obras_rechazadas ?? 0, label: "Rechazadas",   sub: "este período",  accent: C.red,   Icon: XCircle     },
  ];
  return (
    <>
      {cards.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background: C.card, borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: CS, transition: "transform .2s, box-shadow .2s", cursor: "default", animation: `fadeUp .45s ease ${i * 0.06}s both`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.08)`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = CS; }}>
          <div style={{ position: "absolute", top: 0, left: 16, right: 16, height: 2.5, background: accent, borderRadius: 2 }} />
          {/* Izquierda: icono + label */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} color={accent} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.creamSub, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>{sub}</div>
            </div>
          </div>
          {/* Derecha: número grande */}
          <div style={{ fontSize: 28, fontWeight: 700, color: loading ? C.creamMut : C.cream, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: FM, transition: "color .3s", textAlign: "right", flexShrink: 0 }}>
            {loading ? "—" : fmt(value)}
          </div>
        </div>
      ))}
    </>
  );
}

// ── BlogWidget ────────────────────────────────────────────────────────────────
function BlogWidget({ navigate }: { navigate: (p: string) => void }) {
  const [data, setData] = useState<{ total_posts: number; comentarios_pendientes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    Promise.all([
      fetch(`${API_URL}/api/blog/admin/posts?limit=1`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/blog/admin/comentarios/pendientes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([postsJson, comentJson]) => {
        setData({
          total_posts: postsJson.pagination?.total ?? 0,
          comentarios_pendientes: Array.isArray(comentJson.data) ? comentJson.data.length : 0,
        });
      })
      .catch(() => setData({ total_posts: 0, comentarios_pendientes: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", boxShadow: CS, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, fontFamily: FB }}>Blog</div>
          <div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Publicaciones y moderación</div>
        </div>
        <button onClick={() => navigate("/admin/blog")}
          style={{ display: "flex", alignItems: "center", gap: 3, background: "transparent", border: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          Ver panel <ChevronRight size={11} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, border: `1px solid ${C.border}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.orange}14`, border: `1px solid ${C.orange}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookOpen size={17} color={C.orange} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: FB }}>Posts</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: loading ? C.creamMut : C.cream, fontFamily: FM, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: 2 }}>
              {loading ? "—" : fmt(data?.total_posts ?? 0)}
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/blog")}
          style={{ background: (data?.comentarios_pendientes ?? 0) > 0 ? `${C.orange}08` : C.bg, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, border: `1px solid ${(data?.comentarios_pendientes ?? 0) > 0 ? `${C.orange}30` : C.border}`, cursor: "pointer", transition: "opacity .2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.pink}14`, border: `1px solid ${C.pink}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MessageCircle size={17} color={C.pink} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: FB }}>Pendientes</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: loading ? C.creamMut : (data?.comentarios_pendientes ?? 0) > 0 ? C.orange : C.cream, fontFamily: FM, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: 2 }}>
              {loading ? "—" : fmt(data?.comentarios_pendientes ?? 0)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigate("/admin/blog")}
          style={{ flex: 1, padding: "9px 0", background: `${C.orange}12`, border: `1px solid ${C.orange}25`, borderRadius: 9, color: C.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FB, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.orange}22`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${C.orange}12`; }}>
          <BookOpen size={13} /> Gestionar posts
        </button>
        <button onClick={() => navigate("/admin/blog/nuevo")}
          style={{ flex: 1, padding: "9px 0", background: C.orange, border: "none", borderRadius: 9, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FB, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          + Nuevo post
        </button>
      </div>
    </div>
  );
}

// ── Acciones Rápidas ──────────────────────────────────────────────────────────
function AccionesRapidas({ navigate }: { navigate: (p: string) => void }) {
  const acciones = [
    { label: "Pendientes",    sub: "Revisar solicitudes",   Icon: Clock,     color: C.gold,   path: "/admin/obras?estado=pendiente" },
    { label: "Artistas",      sub: "Gestionar artistas",    Icon: Users,     color: C.pink,   path: "/admin/artistas" },
    { label: "Reportes",      sub: "Ver métricas",          Icon: BarChart2, color: C.blue,   path: "/admin/reportes" },
    { label: "Importar",      sub: "Cargar datos externos", Icon: Upload,    color: C.purple, path: "/admin/importar" },
    { label: "Estadísticas",  sub: "Análisis completo",     Icon: Activity,  color: C.green,  path: "/admin/estadisticas" },
    { label: "Blog",          sub: "Publicaciones",         Icon: BookOpen,  color: C.orange, path: "/admin/blog" },
    { label: "Sobre nosotros",sub: "Editar contenido",      Icon: FileText,  color: C.green,  path: "/admin/sobre-nosotros" },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.creamMut, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FB, marginBottom: 10 }}>
        Acciones rápidas
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {acciones.map(({ label, sub, Icon, color, path }, i) => (
          <button key={label} onClick={() => navigate(path)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, cursor: "pointer", transition: "all .2s", fontFamily: FB, textAlign: "left", animation: `fadeUp .45s ease ${i * 0.05}s both` }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = `${color}40`;
              el.style.boxShadow = `0 4px 14px ${color}12`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.border;
              el.style.boxShadow = "none";
            }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, marginBottom: 2, lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: C.creamMut }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


// ── DonutChart — Distribución de obras ────────────────────────────────────────
function DonutChart({ kpis, loading }: { kpis: Record<string, number> | null; loading: boolean }) {
  const total    = kpis?.total_obras      ?? 0;
  const pub      = kpis?.obras_publicadas ?? 0;
  const pend     = kpis?.obras_pendientes ?? 0;
  const rech     = kpis?.obras_rechazadas ?? 0;
  const agotadas = Math.max(0, total - pub - pend - rech);

  const segments = [
    { name: "Publicadas", value: pub,      color: C.green,    sub: "activas" },
    { name: "Pendientes", value: pend,     color: C.gold,     sub: "en revisión" },
    { name: "Rechazadas", value: rech,     color: C.red,      sub: "sin publicar" },
    ...(agotadas > 0 ? [{ name: "Agotadas", value: agotadas, color: C.creamMut, sub: "sin stock" }] : []),
  ].filter(s => s.value > 0);

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", boxShadow: CS, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, fontFamily: FB }}>Distribución de obras</div>
        <div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Por estado en el catálogo</div>
      </div>

      {loading || !kpis ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 160, height: 160, borderRadius: "50%", border: `16px solid ${C.border}` }} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
          <div style={{ width: 160, height: 160, flexShrink: 0, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {segments.map((s, i) => (
                    <Cell key={`cell-${i}`} fill={s.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: FM, fontSize: 20, fontWeight: 700, fill: C.cream }}>
                  {fmt(total)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {segments.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.cream, fontFamily: FB }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>{s.sub}</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, fontFamily: FM, letterSpacing: "-0.02em" }}>
                  {fmt(s.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ObrasRecientes ────────────────────────────────────────────────────────────
function ObrasRecientes({ obras, loading, navigate }: { obras: ObraReciente[]; loading: boolean; navigate: (p: string) => void }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", boxShadow: CS }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.cream, fontFamily: FB }}>Obras recientes</div>
          <div style={{ fontSize: 13, color: C.creamMut, fontFamily: FB, marginTop: 2 }}>Últimas subidas al catálogo</div>
        </div>
        <button onClick={() => navigate("/admin/obras")}
          style={{ display: "flex", alignItems: "center", gap: 3, background: "transparent", border: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
          Ver todas <ChevronRight size={11} />
        </button>
      </div>
      <div style={{ height: 1, background: C.border, marginBottom: 10 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 6px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: C.bg, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: C.bg, borderRadius: 3, marginBottom: 5, width: "68%" }} />
                <div style={{ height: 8, background: C.bg, borderRadius: 3, width: "46%" }} />
              </div>
              <div style={{ width: 64, height: 20, background: C.bg, borderRadius: 20 }} />
            </div>
          ))
        ) : obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.creamMut, fontSize: 13, fontFamily: FB }}>
            <Layers size={22} color={C.creamMut} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>Sin obras aún</div>
          </div>
        ) : obras.slice(0, 5).map((obra, i) => {
          const cfg = statusCfg[obra.estado] || statusCfg.pendiente;
          return (
            <div key={obra.id_obra}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 8px", borderRadius: 8, cursor: "pointer", transition: "background .12s", borderBottom: i < Math.min(obras.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              onClick={() => navigate(`/admin/obras/editar/${obra.id_obra}`)}>
              <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: C.bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}` }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <Image size={14} color={C.creamMut} strokeWidth={1.8} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FB }}>{obra.titulo}</div>
                <div style={{ fontSize: 11.5, color: C.creamSub, fontFamily: FB, marginTop: 2 }}>{obra.artista_alias || obra.artista_nombre}</div>
              </div>
              <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, fontWeight: 700, background: `${cfg.color}12`, color: cfg.color, flexShrink: 0, border: `1px solid ${cfg.color}28`, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FB }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StatStrip ─────────────────────────────────────────────────────────────────
function StatStrip({ strip, loading }: { strip: Record<string, number> | null; loading: boolean }) {
  const items = [
    { value: strip?.artistas_activos ?? 0, label: "Artistas activos", sub: "en la plataforma", accent: C.pink,   Icon: Users   },
    { value: strip?.categorias       ?? 0, label: "Categorías",       sub: "tipos de arte",    accent: C.blue,   Icon: Package },
    { value: strip?.visitas_total    ?? 0, label: "Visitas totales",  sub: "a la galería",     accent: C.purple, Icon: Eye     },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {items.map(({ value, label, sub, accent, Icon }, i) => (
        <div key={label}
          style={{ background: C.card, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: CS, transition: "transform .2s", cursor: "default", animation: `fadeUp .5s ease ${0.25 + i * 0.08}s both` }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
          {/* Izquierda: icono + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${accent}14`, border: `1px solid ${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} color={accent} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>{label}</div>
              <div style={{ fontSize: 12.5, color: C.creamSub, fontFamily: FB }}>{sub}</div>
            </div>
          </div>
          {/* Derecha: número grande */}
          <div style={{ fontSize: 28, fontWeight: 700, color: loading ? C.creamMut : C.cream, letterSpacing: "-0.02em", lineHeight: 1, fontFamily: FM, transition: "color .3s", flexShrink: 0 }}>
            {loading ? "—" : fmt(Number(value))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const [userName, setUserName] = useState("");
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState<StatsData | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stats/dashboard`, {
        headers: { Authorization:`Bearer ${authService.getToken()}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
      const json = await res.json();
      if (json.success) setStats(json.data as StatsData);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUserName(authService.getUserName() || "Admin");
    fetchStats();
  }, [fetchStats]);

  return (
    <>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#E6E4EF; border-radius:10px; }
  ::-webkit-scrollbar-thumb:hover { background:#9896A8; }
`}</style>

      <Topbar navigate={navigate} onRefresh={fetchStats} loading={loading} />

      <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto", background: C.bg }}>
        {/* Alerta compacta */}
        {(stats?.kpis?.obras_pendientes ?? 0) > 0 && (
          <div style={{ marginBottom: 14 }}>
            <AlertaPendientes count={stats!.kpis.obras_pendientes} navigate={navigate} />
          </div>
        )}

        {/* Fila 1: WelcomeBanner (2fr) + 4 KPI cards (1fr cada una) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14, alignItems: "stretch" }}>
          <div style={{ animation: "fadeUp .4s ease both" }}>
            <WelcomeBanner userName={userName} />
          </div>
          <KpiCards kpis={stats?.kpis ?? null} loading={loading} />
        </div>

        {/* Fila 2: StatStrip — ancho completo */}
        <div style={{ marginBottom: 14 }}>
          <StatStrip strip={stats?.strip ?? null} loading={loading} />
        </div>

        {/* Fila 3: DonutChart (1fr) + columna derecha: ObrasRecientes + BlogWidget + AccionesRapidas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <DonutChart kpis={stats?.kpis ?? null} loading={loading} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ObrasRecientes obras={stats?.obras_recientes || []} loading={loading} navigate={navigate} />
            <BlogWidget navigate={navigate} />
            <AccionesRapidas navigate={navigate} />
          </div>
        </div>
      </main>
    </>
  );
}
