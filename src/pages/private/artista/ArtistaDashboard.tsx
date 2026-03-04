// src/pages/private/artista/ArtistaDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Image, User, LogOut, Plus, Eye, Edit3,
  Clock, CheckCircle, XCircle, Menu,
  Palette, ChevronRight, AlertCircle, Sparkles, TrendingUp,
  Star, ArrowUpRight, Package
} from "lucide-react";
import { authService } from "../../../services/authService";
import logoImg from "../../../assets/images/logo.png";
import MiPerfil, { type ArtistaInfo } from "./MiPerfil";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#080612", panel: "#0d0b1a",
  card: "rgba(255,255,255,0.028)", border: "rgba(255,255,255,0.07)",
  text: "#f5f0ff", muted: "rgba(245,240,255,0.45)",
  green: "#3DDB85",
};

interface Obra {
  id_obra: number; titulo: string; precio_base?: number; estado: string;
  imagen_principal?: string; slug?: string; fecha_creacion?: string;
  categoria?: string; tecnica?: string; activa?: boolean;
  vistas?: number; permite_marco?: boolean; con_certificado?: boolean;
  motivo_rechazo?: string | null; destacada?: boolean;
}
interface Stats { total: number; publicadas: number; pendientes: number; rechazadas: number; borradores: number; }

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Counter({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(p * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <>{val}</>;
}

const getBadge = (estado: string, activa?: boolean) => {
  if (estado === "aprobada"  && activa)  return { label: "Publicada",   color: C.green };
  if (estado === "aprobada"  && !activa) return { label: "Inactiva",    color: C.muted };
  if (estado === "publicada")            return { label: "Publicada",   color: C.green };
  if (estado === "pendiente")            return { label: "En revisión", color: C.gold  };
  if (estado === "rechazada")            return { label: "Rechazada",   color: C.pink  };
  return { label: estado, color: C.muted };
};

type Seccion = "dashboard" | "obras" | "perfil";

const navItems: { id: Seccion; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Overview",  icon: LayoutDashboard },
  { id: "obras",     label: "Mis obras", icon: Image },
  { id: "perfil",    label: "Mi perfil", icon: User },
];

export default function ArtistaDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const nombre    = localStorage.getItem("userName") || "Artista";
  const token     = authService.getToken() ?? "";

  const [seccion, setSeccion]     = useState<Seccion>("dashboard");
  const [obras,   setObras]       = useState<Obra[]>([]);
  const [artista, setArtista]     = useState<ArtistaInfo | null>(null);
  const [stats,   setStats]       = useState<Stats>({ total: 0, publicadas: 0, pendientes: 0, rechazadas: 0, borradores: 0 });
  const [loading, setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtro,  setFiltro]      = useState("todas");
  const [mounted, setMounted]     = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>("");

  useEffect(() => {
    if (location.pathname === "/artista/perfil") setSeccion("perfil");
  }, [location.pathname]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); setTimeout(() => setMounted(true), 100); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resArtista, resObras] = await Promise.all([
        fetch(`${API}/api/artista-portal/mi-perfil`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/artista-portal/mis-obras`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resArtista.ok) {
        const data = await resArtista.json();
        setArtista(data);
        setFotoPreview(data.foto_perfil ?? "");
      }
      if (resObras.ok) {
        const data = await resObras.json();
        setObras(data.obras || []);
        const s = data.stats || {};
        setStats({
          total:      s.total      || 0,
          publicadas: s.publicadas || 0,
          pendientes: s.pendientes ?? s.en_revision ?? 0,
          rechazadas: s.rechazadas || 0,
          borradores: s.borradores || 0,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePerfilActualizado = (nuevaFoto?: string) => {
    if (nuevaFoto) setFotoPreview(nuevaFoto);
    setArtista(prev => prev ? { ...prev, foto_perfil: nuevaFoto ?? prev.foto_perfil } : prev);
  };

  const handleLogout   = () => { authService.logout(); navigate("/login"); };
  const obrasFiltradas = filtro === "todas" ? obras : obras.filter(o => o.estado === filtro);
  const inicial        = (artista?.nombre_artistico || nombre).charAt(0).toUpperCase();

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  // ── SIDEBAR ──────────────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", backdropFilter: "blur(30px)" }}>
      <div style={{ padding: "28px 24px 20px" }}>
        <img src={logoImg} alt="Nu-B Studio" style={{ height: 34, marginBottom: 28 }} />
        <div style={{ background: `linear-gradient(135deg, ${C.orange}18, ${C.pink}10)`, border: `1px solid ${C.orange}25`, borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white", boxShadow: `0 4px 16px ${C.orange}40` }}>
            {fotoPreview
              ? <img src={fotoPreview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : inicial
            }
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{artista?.nombre_artistico || nombre}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} /> Artista activo
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 16px" }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, padding: "0 8px", marginBottom: 10 }}>Navegación</p>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = seccion === id;
          return (
            <button key={id} onClick={() => { setSeccion(id); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 4, background: active ? `linear-gradient(135deg, ${C.orange}22, ${C.pink}12)` : "transparent", border: active ? `1px solid ${C.orange}35` : "1px solid transparent", color: active ? C.orange : C.muted, fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .18s ease", textAlign: "left" }}>
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}
        <div style={{ height: 1, background: C.border, margin: "16px 0 12px" }} />
        <button onClick={() => navigate("/artista/nueva-obra")}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 20px ${C.orange}35` }}>
          <Plus size={16} /> Subir nueva obra
        </button>
      </nav>

      <div style={{ padding: "16px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid transparent", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.pink; el.style.background = `${C.pink}10`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.background = "transparent"; }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );

  // ── SECCIÓN DASHBOARD ─────────────────────────────────────────
  const SeccionDashboard = () => (
    <div style={{ animation: mounted ? "fadeUp .5s ease both" : "none" }}>
      <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", background: `linear-gradient(135deg, ${C.orange}18 0%, ${C.purple}15 50%, ${C.pink}12 100%)`, border: `1px solid ${C.orange}25`, marginBottom: 28, padding: "36px" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}20, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles size={16} color={C.gold} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5 }}>Portal del artista</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: "0 0 8px", lineHeight: 1.1, fontFamily: "'Playfair Display', serif" }}>
              Hola, {artista?.nombre_artistico || nombre} ✦
            </h1>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
              Comisión: <strong style={{ color: C.gold }}>{artista?.porcentaje_comision || 15}%</strong>
              {artista?.categoria_nombre && <> · {artista.categoria_nombre}</>}
            </p>
          </div>
          <button onClick={() => navigate("/artista/nueva-obra")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 8px 24px ${C.orange}40` }}>
            <Plus size={16} /> Nueva obra
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total obras", value: stats.total,      icon: <Package size={22} />,     grad: `${C.orange}, ${C.pink}`,  shadow: C.orange },
          { label: "Publicadas",  value: stats.publicadas, icon: <CheckCircle size={22} />, grad: `${C.green}, #00b894`,     shadow: C.green  },
          { label: "En revisión", value: stats.pendientes, icon: <Clock size={22} />,       grad: `${C.gold}, #e07b00`,      shadow: C.gold   },
          { label: "Comisión %",  value: artista?.porcentaje_comision || 15, icon: <TrendingUp size={22} />, grad: `${C.purple}, ${C.pink}`, shadow: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px", position: "relative", overflow: "hidden", animation: `fadeUp .5s ease ${i * 0.08}s both`, transition: "transform .2s, box-shadow .2s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 16px 40px ${s.shadow}20`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.grad})` }} />
            <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: `linear-gradient(135deg, ${s.grad})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 6px 16px ${s.shadow}35` }}>{s.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: C.text, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}><Counter to={s.value} /></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }} className="dashboard-grid">
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 2px", fontFamily: "'Playfair Display', serif" }}>Obras recientes</h3>
              <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>{obras.length} en total</p>
            </div>
            <button onClick={() => setSeccion("obras")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px", fontFamily: "'DM Sans', sans-serif" }}>
              Ver todas <ArrowUpRight size={13} />
            </button>
          </div>
          {obras.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Palette size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 14 }} />
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>Aún no tienes obras</p>
              <button onClick={() => navigate("/artista/nueva-obra")} style={{ padding: "9px 20px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Subir primera obra
              </button>
            </div>
          ) : obras.slice(0, 6).map((obra, i) => {
            const bdg = getBadge(obra.estado, obra.activa);
            return (
              <div key={obra.id_obra} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < Math.min(obras.length, 6) - 1 ? `1px solid ${C.border}` : "none", transition: "background .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                  {obra.imagen_principal
                    ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Palette size={18} color="rgba(255,255,255,0.15)" /></div>
                  }
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{obra.titulo}</div>
                  <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{obra.precio_base ? `$${Number(obra.precio_base).toLocaleString("es-MX")} MXN` : "Sin precio"}</div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, fontSize: 10.5, fontWeight: 800, color: bdg.color, background: "rgba(8,6,18,0.82)", border: `1px solid ${bdg.color}60`, textTransform: "uppercase", whiteSpace: "nowrap", backdropFilter: "blur(8px)" }}>
                  {obra.estado === "publicada" && <CheckCircle size={10} />}
                  {obra.estado === "pendiente" && <Clock size={10} />}
                  {obra.estado === "rechazada" && <XCircle size={10} />}
                  {bdg.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "20px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 14px" }}>Mi perfil</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white" }}>
                {fotoPreview ? <img src={fotoPreview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : inicial}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{artista?.nombre_artistico || nombre}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{artista?.categoria_nombre || "—"}</div>
              </div>
            </div>
            <button onClick={() => setSeccion("perfil")} style={{ width: "100%", padding: "8px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Editar perfil
            </button>
          </div>

          {stats.rechazadas > 0 && (
            <div style={{ background: `${C.pink}10`, border: `1px solid ${C.pink}30`, borderRadius: 16, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertCircle size={15} color={C.pink} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.pink }}>Atención</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.6 }}>Tienes <strong style={{ color: C.pink }}>{stats.rechazadas} obra{stats.rechazadas > 1 ? "s" : ""}</strong> rechazadas.</p>
              <button onClick={() => { setSeccion("obras"); setFiltro("rechazada"); }} style={{ width: "100%", padding: "7px", borderRadius: 8, background: `${C.pink}20`, border: `1px solid ${C.pink}40`, color: C.pink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Revisar ahora
              </button>
            </div>
          )}

          <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25`, borderRadius: 16, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Star size={14} color={C.gold} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.gold }}>Consejo</span>
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.7 }}>
              Las obras con buenas fotos y descripción detallada se venden <strong style={{ color: "rgba(255,255,255,0.6)" }}>3x más rápido</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── SECCIÓN OBRAS ─────────────────────────────────────────────
  const SeccionObras = () => (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 6px" }}>✦ Portal del Artista</p>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>Mis obras</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{obras.length} obra{obras.length !== 1 ? "s" : ""} registradas</p>
        </div>
        <button onClick={() => navigate("/artista/nueva-obra")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 20px ${C.orange}35` }}>
          <Plus size={15} /> Nueva obra
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "TOTAL OBRAS",  value: stats.total,      color: C.orange },
          { label: "PUBLICADAS",   value: stats.publicadas, color: C.green  },
          { label: "EN REVISIÓN",  value: stats.pendientes, color: C.gold   },
          { label: "RECHAZADAS",   value: stats.rechazadas, color: C.pink   },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
            <div style={{ fontSize: 30, fontWeight: 900, color: C.text, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "todas",     label: "Todas",       count: stats.total      },
          { id: "aprobada",  label: "Publicadas",  count: stats.publicadas },
          { id: "pendiente", label: "En revisión", count: stats.pendientes },
          { id: "rechazada", label: "Rechazadas",  count: stats.rechazadas },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: "8px 18px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7, background: filtro === f.id ? `linear-gradient(135deg, ${C.orange}30, ${C.pink}20)` : "rgba(255,255,255,0.04)", border: filtro === f.id ? `1px solid ${C.orange}50` : `1px solid ${C.border}`, color: filtro === f.id ? C.orange : C.muted }}>
            {f.label}
            <span style={{ background: filtro === f.id ? C.orange : "rgba(255,255,255,0.08)", borderRadius: 100, padding: "1px 8px", fontSize: 10.5, color: filtro === f.id ? "white" : C.muted, fontWeight: 800 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {obrasFiltradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h3 style={{ fontSize: 16, color: C.text, margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>
            {filtro === "todas" ? "Aún no tienes obras" : "No hay obras en esta categoría"}
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
            {filtro === "todas" ? "¡Sube tu primera obra y empieza a vender!" : "Cambia el filtro para ver otras obras"}
          </p>
          {filtro === "todas" && (
            <button onClick={() => navigate("/artista/nueva-obra")} style={{ padding: "10px 24px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              + Subir primera obra
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {obrasFiltradas.map((obra) => {
            const bdg = getBadge(obra.estado, obra.activa);
            return (
              <div key={obra.id_obra}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", transition: "transform .22s, box-shadow .22s, border-color .22s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = "0 20px 48px rgba(0,0,0,0.4)"; el.style.borderColor = `${C.orange}30`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = C.border; }}>
                <div style={{ height: 180, background: "rgba(255,255,255,0.04)", position: "relative", overflow: "hidden" }}>
                  {obra.imagen_principal
                    ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🖼️</div>
                  }
                  <span style={{ position: "absolute", bottom: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, fontSize: 10.5, fontWeight: 800, color: bdg.color, background: "rgba(8,6,18,0.85)", border: `1px solid ${bdg.color}60`, backdropFilter: "blur(8px)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {bdg.label}
                  </span>
                  {obra.destacada && (
                    <span style={{ position: "absolute", top: 10, right: 10, background: `${C.gold}20`, border: `1px solid ${C.gold}50`, color: C.gold, fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 100 }}>⭐ Destacada</span>
                  )}
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {obra.categoria && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.orange, background: `${C.orange}12`, border: `1px solid ${C.orange}25`, padding: "2px 8px", borderRadius: 100 }}>{obra.categoria}</span>}
                    {obra.tecnica   && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 100 }}>{obra.tecnica}</span>}
                  </div>
                  <h4 style={{ fontSize: 14.5, fontWeight: 800, color: C.text, margin: "0 0 6px", fontFamily: "'Playfair Display', serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.titulo}</h4>
                  <p style={{ fontSize: 16, color: C.orange, fontWeight: 900, margin: "0 0 10px", fontFamily: "'Playfair Display', serif" }}>
                    {obra.precio_base ? formatPrecio(obra.precio_base) : "—"}
                  </p>
                  {obra.fecha_creacion && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.muted, marginBottom: 10 }}>
                      <span>👁 {obra.vistas || 0} vistas</span>
                      <span>📅 {formatFecha(obra.fecha_creacion)}</span>
                    </div>
                  )}
                  {obra.estado === "rechazada" && obra.motivo_rechazo && (
                    <div style={{ background: `${C.pink}10`, border: `1px solid ${C.pink}25`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
                      <strong style={{ color: C.pink }}>Motivo: </strong>{obra.motivo_rechazo}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {obra.permite_marco   && <span style={{ fontSize: 10.5, color: C.muted }}>🖼 Enmarcable</span>}
                    {obra.con_certificado && <span style={{ fontSize: 10.5, color: C.muted }}>📜 Certificado</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate(`/artista/editar-obra/${obra.id_obra}`)}
                      style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.orange; el.style.borderColor = `${C.orange}40`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.borderColor = C.border; }}>
                      <Edit3 size={13} /> Editar
                    </button>
                    {obra.slug && (
                      <button onClick={() => navigate(`/obras/${obra.slug}`)}
                        style={{ padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── ROOT RENDER ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <div style={{ width: 260, flexShrink: 0 }} className="sidebar-desktop"><Sidebar /></div>

      {sidebarOpen && <>
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 49 }} onClick={() => setSidebarOpen(false)} />
        <div style={{ position: "fixed", left: 0, top: 0, zIndex: 50 }}><Sidebar /></div>
      </>}

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="topbar-mobile" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 40 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.text, cursor: "pointer" }}><Menu size={22} /></button>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 30 }} />
          <div style={{ width: 22 }} />
        </div>

        <main style={{ flex: 1, padding: "32px 36px" }} className="main-pad">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 20 }}>
              <div style={{ position: "relative", width: 56, height: 56 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.orange}20` }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
              </div>
              <p style={{ color: C.muted, fontSize: 14 }}>Cargando tu estudio...</p>
            </div>
          ) : (
            <>
              {seccion === "dashboard" && <SeccionDashboard />}
              {seccion === "obras"     && <SeccionObras />}
              {seccion === "perfil"    && artista && (
                <MiPerfil
                  artista={artista}
                  token={token}
                  onActualizar={handlePerfilActualizado}
                />
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .sidebar-desktop { display: block; }
        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile   { display: flex !important; }
          .main-pad        { padding: 20px !important; }
          .dashboard-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) { .main-pad { padding: 16px !important; } }
      `}</style>
    </div>
  );
}