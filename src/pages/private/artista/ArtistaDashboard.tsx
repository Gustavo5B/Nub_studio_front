// src/pages/private/artista/ArtistaDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Image, User, LogOut, Plus, Eye, Edit3,
  Clock, CheckCircle, XCircle, Menu,
  Palette, ChevronRight, AlertCircle, Sparkles, TrendingUp,
  Star, ArrowUpRight, Package
} from "lucide-react";
import { authService } from "../../../services/authService";
import logoImg from "../../../assets/images/logo.png";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#080612", panel: "#0d0b1a",
  card: "rgba(255,255,255,0.028)", border: "rgba(255,255,255,0.07)",
  text: "#f5f0ff", muted: "rgba(245,240,255,0.45)",
  green: "#3DDB85",
};

interface Obra {
  id_obra: number; titulo: string; precio: number; estado: string;
  imagen_principal?: string; slug?: string; fecha_creacion?: string; categoria?: string;
}
interface ArtistaInfo {
  id_artista: number; nombre_completo: string; nombre_artistico?: string;
  biografia?: string; estado: string; porcentaje_comision: number;
  correo?: string; telefono?: string; matricula?: string; categoria_nombre?: string;
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
  }, [to]);
  return <>{val}</>;
}

export default function ArtistaDashboard() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("userName") || "Artista";
  const token = authService.getToken();

  const [seccion, setSeccion] = useState<"dashboard" | "obras" | "perfil">("dashboard");
  const [obras, setObras] = useState<Obra[]>([]);
  const [artista, setArtista] = useState<ArtistaInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, publicadas: 0, pendientes: 0, rechazadas: 0, borradores: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { cargarDatos(); setTimeout(() => setMounted(true), 100); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resArtista, resObras] = await Promise.all([
        fetch(`${API}/api/artista-portal/mi-perfil`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/artista-portal/mis-obras`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resArtista.ok) setArtista(await resArtista.json());
      if (resObras.ok) {
        const data = await resObras.json();
        setObras(data.obras || []);
        setStats(data.stats || { total: 0, publicadas: 0, pendientes: 0, rechazadas: 0, borradores: 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { authService.logout(); navigate("/login"); };
  const obrasFiltradas = filtro === "todas" ? obras : obras.filter(o => o.estado === filtro);
  const inicial = nombre.charAt(0).toUpperCase();

  const Badge = ({ estado }: { estado: string }) => {
    const map: Record<string, { c: string; bg: string; label: string }> = {
      publicada: { c: C.green, bg: `${C.green}15`, label: "Publicada" },
      pendiente: { c: C.gold, bg: `${C.gold}15`, label: "En revisión" },
      rechazada: { c: C.pink, bg: `${C.pink}15`, label: "Rechazada" },
      borrador:  { c: C.muted, bg: "rgba(255,255,255,0.06)", label: "Borrador" },
    };
    const s = map[estado] || map.borrador;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 11px", borderRadius: 100, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, color: s.c, background: s.bg, border: `1px solid ${s.c}35`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {estado === "publicada" && <CheckCircle size={10} />}
        {estado === "pendiente" && <Clock size={10} />}
        {estado === "rechazada" && <XCircle size={10} />}
        {s.label}
      </span>
    );
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "obras", label: "Mis obras", icon: Image },
    { id: "perfil", label: "Mi perfil", icon: User },
  ];

  const Sidebar = () => (
    <aside style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", backdropFilter: "blur(30px)" }}>
      <div style={{ padding: "28px 24px 20px" }}>
        <img src={logoImg} alt="Nu-B Studio" style={{ height: 34, marginBottom: 28 }} />
        <div style={{ background: `linear-gradient(135deg, ${C.orange}18, ${C.pink}10)`, border: `1px solid ${C.orange}25`, borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white", boxShadow: `0 4px 16px ${C.orange}40` }}>{inicial}</div>
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
            <button key={id} onClick={() => { setSeccion(id as any); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 4, background: active ? `linear-gradient(135deg, ${C.orange}22, ${C.pink}12)` : "transparent", border: active ? `1px solid ${C.orange}35` : "1px solid transparent", color: active ? C.orange : C.muted, fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .18s ease", textAlign: "left" }}>
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}
        <div style={{ height: 1, background: C.border, margin: "16px 0 12px" }} />
        <button onClick={() => navigate("/artista/nueva-obra")}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 20px ${C.orange}35`, transition: "all .2s" }}>
          <Plus size={16} /> Subir nueva obra
        </button>
      </nav>

      <div style={{ padding: "16px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid transparent", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.pink; el.style.background = `${C.pink}10`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.background = "transparent"; }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );

  const SeccionDashboard = () => (
    <div style={{ animation: mounted ? "fadeUp .5s ease both" : "none" }}>
      {/* Hero */}
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total obras", value: stats.total, icon: <Package size={22} />, grad: `${C.orange}, ${C.pink}`, shadow: C.orange },
          { label: "Publicadas", value: stats.publicadas, icon: <CheckCircle size={22} />, grad: `${C.green}, #00b894`, shadow: C.green },
          { label: "En revisión", value: stats.pendientes, icon: <Clock size={22} />, grad: `${C.gold}, #e07b00`, shadow: C.gold },
          { label: "Comisión %", value: artista?.porcentaje_comision || 15, icon: <TrendingUp size={22} />, grad: `${C.purple}, ${C.pink}`, shadow: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px", position: "relative", overflow: "hidden", animation: `fadeUp .5s ease ${i * 0.08}s both`, transition: "transform .2s, box-shadow .2s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 16px 40px ${s.shadow}20`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.grad})` }} />
            <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: `linear-gradient(135deg, ${s.grad})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 6px 16px ${s.shadow}35` }}>{s.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: C.text, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              <Counter to={s.value} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Obras recientes + sidebar info */}
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
          ) : obras.slice(0, 6).map((obra, i) => (
            <div key={obra.id_obra} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < Math.min(obras.length, 6) - 1 ? `1px solid ${C.border}` : "none", transition: "background .15s", cursor: "default" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                {obra.imagen_principal ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Palette size={18} color="rgba(255,255,255,0.15)" /></div>}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{obra.titulo}</div>
                <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>${obra.precio?.toLocaleString("es-MX")} MXN</div>
              </div>
              <Badge estado={obra.estado} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "20px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 14px" }}>Mi perfil</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white" }}>{inicial}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{artista?.nombre_artistico || nombre}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{artista?.categoria_nombre || "—"}</div>
              </div>
            </div>
            <button onClick={() => setSeccion("perfil")} style={{ width: "100%", padding: "8px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Ver perfil completo
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

  const SeccionObras = () => (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>Mis obras</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{obras.length} obra{obras.length !== 1 ? "s" : ""} registradas</p>
        </div>
        <button onClick={() => navigate("/artista/nueva-obra")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 20px ${C.orange}35` }}>
          <Plus size={15} /> Nueva obra
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "todas", label: "Todas", count: stats.total },
          { id: "publicada", label: "Publicadas", count: stats.publicadas },
          { id: "pendiente", label: "En revisión", count: stats.pendientes },
          { id: "rechazada", label: "Rechazadas", count: stats.rechazadas },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: "8px 18px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7, background: filtro === f.id ? `linear-gradient(135deg, ${C.orange}30, ${C.pink}20)` : "rgba(255,255,255,0.04)", border: filtro === f.id ? `1px solid ${C.orange}50` : `1px solid ${C.border}`, color: filtro === f.id ? C.orange : C.muted, transition: "all .15s" }}>
            {f.label}
            {f.count > 0 && <span style={{ background: filtro === f.id ? C.orange : "rgba(255,255,255,0.08)", borderRadius: 100, padding: "1px 8px", fontSize: 10.5, color: filtro === f.id ? "white" : C.muted, fontWeight: 800 }}>{f.count}</span>}
          </button>
        ))}
      </div>

      {obrasFiltradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
          <Image size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 14, color: C.muted }}>No hay obras en esta categoría</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
          {obrasFiltradas.map((obra, i) => (
            <div key={obra.id_obra} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", animation: `fadeUp .4s ease ${i * 0.06}s both`, transition: "transform .22s, box-shadow .22s, border-color .22s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = "0 20px 48px rgba(0,0,0,0.4)"; el.style.borderColor = `${C.orange}30`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = C.border; }}
            >
              <div style={{ height: 175, background: "rgba(255,255,255,0.04)", position: "relative", overflow: "hidden" }}>
                {obra.imagen_principal
                  ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}><Palette size={30} color="rgba(255,255,255,0.1)" /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>Sin imagen</span></div>
                }
                <div style={{ position: "absolute", top: 10, left: 10 }}><Badge estado={obra.estado} /></div>
              </div>
              <div style={{ padding: "16px" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: "0 0 2px", fontFamily: "'Playfair Display', serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.titulo}</h4>
                {obra.categoria && <p style={{ fontSize: 10.5, color: C.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{obra.categoria}</p>}
                <p style={{ fontSize: 16, color: C.orange, fontWeight: 900, margin: "0 0 14px", fontFamily: "'Playfair Display', serif" }}>${obra.precio?.toLocaleString("es-MX")} <span style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>MXN</span></p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}>
                    <Edit3 size={13} /> Editar
                  </button>
                  {obra.slug && (
                    <button onClick={() => navigate(`/obras/${obra.slug}`)} style={{ padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SeccionPerfil = () => (
    <div style={{ animation: "fadeUp .5s ease both", maxWidth: 680 }}>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "0 0 24px", fontFamily: "'Playfair Display', serif" }}>Mi perfil</h2>
      {!artista ? <p style={{ color: C.muted }}>Cargando...</p> : (
        <>
          <div style={{ background: `linear-gradient(135deg, ${C.orange}12, ${C.purple}10)`, border: `1px solid ${C.orange}20`, borderRadius: 20, padding: "28px", marginBottom: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, color: "white", flexShrink: 0, boxShadow: `0 8px 28px ${C.orange}40` }}>{inicial}</div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>{artista.nombre_artistico || artista.nombre_completo}</h3>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 10px" }}>{artista.correo}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${C.green}15`, color: C.green, border: `1px solid ${C.green}30` }}>✓ Artista activo</span>
                {artista.categoria_nombre && <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${C.orange}12`, color: C.orange, border: `1px solid ${C.orange}30` }}>{artista.categoria_nombre}</span>}
              </div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 20px" }}>Información</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px" }}>
              {[
                { label: "Nombre completo", value: artista.nombre_completo },
                { label: "Nombre artístico", value: artista.nombre_artistico || "—" },
                { label: "Correo", value: artista.correo || "—" },
                { label: "Teléfono", value: artista.telefono || "—" },
                { label: "Comisión", value: `${artista.porcentaje_comision}%` },
                { label: "Matrícula", value: artista.matricula || "—" },
              ].map((campo, i) => (
                <div key={i}>
                  <p style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 5px" }}>{campo.label}</p>
                  <p style={{ fontSize: 14, color: C.text, margin: 0, fontWeight: 600 }}>{campo.value}</p>
                </div>
              ))}
            </div>
            {artista.biografia && (
              <div style={{ marginTop: 22, paddingTop: 22, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 10px" }}>Biografía</p>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{artista.biografia}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

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
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
              </div>
              <p style={{ color: C.muted, fontSize: 14 }}>Cargando tu estudio...</p>
            </div>
          ) : (
            <>
              {seccion === "dashboard" && <SeccionDashboard />}
              {seccion === "obras" && <SeccionObras />}
              {seccion === "perfil" && <SeccionPerfil />}
            </>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .sidebar-desktop { display: block; }
        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile { display: flex !important; }
          .main-pad { padding: 20px !important; }
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) { .main-pad { padding: 16px !important; } }
      `}</style>
    </div>
  );
}