// src/pages/private/artista/ArtistaDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Clock, CheckCircle, XCircle,
  Palette, AlertCircle, Sparkles, TrendingUp,
  Star, ArrowUpRight, Package,
} from "lucide-react";
import { authService }      from "../../../services/authService";
import { type ArtistaInfo } from "./MiPerfil";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  gold: "#A87006", bg: "#F9F8FC",
  card: "#FFFFFF", border: "#E6E4EF",
  text: "#14121E", muted: "#9896A8",
  green: "#0E8A50",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";

interface Obra {
  id_obra: number; titulo: string; precio_base?: number; estado: string;
  imagen_principal?: string; slug?: string; fecha_creacion?: string;
  categoria?: string; tecnica?: string; activa?: boolean;
  vistas?: number; permite_marco?: boolean; con_certificado?: boolean;
  motivo_rechazo?: string | null; destacada?: boolean;
}
interface Stats {
  total: number; publicadas: number; pendientes: number;
  rechazadas: number; borradores: number;
}

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

const getBadge = (estado: string) => {
  if (estado === "publicada") return { label: "Publicada",   color: C.green };
  if (estado === "pendiente") return { label: "En revisión", color: C.gold  };
  if (estado === "rechazada") return { label: "Rechazada",   color: C.pink  };
  if (estado === "agotada")   return { label: "Agotada",     color: C.muted };
  return { label: estado, color: C.muted };
};

export default function ArtistaDashboard() {
  const navigate = useNavigate();
  const nombre   = authService.getUserName?.() || "Artista";
  const token    = authService.getToken() ?? "";

  const [obras,   setObras]   = useState<Obra[]>([]);
  const [artista, setArtista] = useState<ArtistaInfo | null>(null);
  const [stats,   setStats]   = useState<Stats>({ total: 0, publicadas: 0, pendientes: 0, rechazadas: 0, borradores: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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
        if (data.foto_perfil) localStorage.setItem("artistaFoto", data.foto_perfil);
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

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 20 }}>
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.orange}20` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
      </div>
      <p style={{ color: C.muted, fontSize: 14 }}>Cargando tu estudio...</p>
    </div>
  );

  const foto = localStorage.getItem("artistaFoto") || artista?.foto_perfil || "";

  return (
    <div style={{ padding: "32px 36px" }} className="artista-main-pad">
      <div style={{ animation: mounted ? "fadeUp .5s ease both" : "none" }}>

        {/* Hero banner */}
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", background: `linear-gradient(135deg,${C.orange}18 0%,${C.purple}15 50%,${C.pink}12 100%)`, border: `1px solid ${C.orange}25`, marginBottom: 28, padding: "36px" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}20,transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Sparkles size={16} color={C.gold} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5 }}>Portal del artista</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: "0 0 8px", lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
                Hola, {artista?.nombre_artistico || nombre} ✦
              </h1>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                Comisión: <strong style={{ color: C.gold }}>{artista?.porcentaje_comision || 15}%</strong>
                {artista?.categoria_nombre && <> · {artista.categoria_nombre}</>}
              </p>
            </div>
            <button onClick={() => navigate("/artista/nueva-obra")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 12, background: C.orange, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: `0 8px 24px ${C.orange}40` }}>
              <Plus size={16} /> Nueva obra
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total obras",  value: stats.total,      icon: <Package size={22} />,     grad: `${C.orange},${C.pink}`,    shadow: C.orange  },
            { label: "Publicadas",   value: stats.publicadas, icon: <CheckCircle size={22} />, grad: `${C.green},#00b894`,       shadow: C.green   },
            { label: "En revisión",  value: stats.pendientes, icon: <Clock size={22} />,       grad: `${C.gold},#e07b00`,        shadow: C.gold    },
            { label: "Comisión %",   value: artista?.porcentaje_comision || 15, icon: <TrendingUp size={22} />, grad: `${C.purple},${C.pink}`, shadow: C.purple },
          ].map((s, i) => (
            <div key={s.label}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px", position: "relative", overflow: "hidden", animation: `fadeUp .5s ease ${i * 0.08}s both`, transition: "transform .2s,box-shadow .2s", boxShadow: CS }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 16px 40px ${s.shadow}20`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.grad})` }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: `linear-gradient(135deg,${s.grad})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 6px 16px ${s.shadow}35` }}>{s.icon}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}><Counter to={s.value} /></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid obras + lateral */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }} className="artista-dashboard-grid">

          {/* Obras recientes */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: CS }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 2px", fontFamily: "'Outfit',sans-serif" }}>Obras recientes</h3>
                <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>{obras.length} en total</p>
              </div>
              <button onClick={() => navigate("/artista/mis-obras")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px", fontFamily: "'Outfit',sans-serif" }}>
                Ver todas <ArrowUpRight size={13} />
              </button>
            </div>
            {obras.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Palette size={36} color={C.border} style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>Aún no tienes obras</p>
                <button onClick={() => navigate("/artista/nueva-obra")} style={{ padding: "9px 20px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  Subir primera obra
                </button>
              </div>
            ) : obras.slice(0, 6).map((obra, i) => {
              const bdg = getBadge(obra.estado);
              return (
                <div key={obra.id_obra}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < Math.min(obras.length, 6) - 1 ? `1px solid ${C.border}` : "none", transition: "background .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F5F4F8"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F3F2F8" }}>
                    {obra.imagen_principal
                      ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Palette size={18} color={C.muted} /></div>
                    }
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{obra.titulo}</div>
                    <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{obra.precio_base ? `$${Number(obra.precio_base).toLocaleString("es-MX")} MXN` : "Sin precio"}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, fontSize: 10.5, fontWeight: 800, color: bdg.color, background: `${bdg.color}12`, border: `1px solid ${bdg.color}40`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {obra.estado === "publicada" && <CheckCircle size={10} />}
                    {obra.estado === "pendiente" && <Clock size={10} />}
                    {obra.estado === "rechazada" && <XCircle size={10} />}
                    {bdg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Panel lateral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Perfil rápido */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "20px", boxShadow: CS }}>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 14px" }}>Mi perfil</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg,${C.orange},${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white" }}>
                  {foto
                    ? <img src={foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (artista?.nombre_artistico || nombre).charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{artista?.nombre_artistico || nombre}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{artista?.categoria_nombre || "—"}</div>
                </div>
              </div>
              <button onClick={() => navigate("/artista/perfil")}
                style={{ width: "100%", padding: "8px", borderRadius: 9, background: "#F3F2F8", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Editar perfil
              </button>
            </div>

            {/* Alerta rechazadas */}
            {stats.rechazadas > 0 && (
              <div style={{ background: `${C.pink}10`, border: `1px solid ${C.pink}30`, borderRadius: 16, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AlertCircle size={15} color={C.pink} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.pink }}>Atención</span>
                </div>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.6 }}>
                  Tienes <strong style={{ color: C.pink }}>{stats.rechazadas} obra{stats.rechazadas > 1 ? "s" : ""}</strong> rechazadas.
                </p>
                <button onClick={() => navigate("/artista/mis-obras")}
                  style={{ width: "100%", padding: "7px", borderRadius: 8, background: `${C.pink}12`, border: `1px solid ${C.pink}40`, color: C.pink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  Revisar ahora
                </button>
              </div>
            )}

            {/* Consejo */}
            <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25`, borderRadius: 16, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Star size={14} color={C.gold} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.gold }}>Consejo</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.7 }}>
                Las obras con buenas fotos y descripción detallada se venden <strong style={{ color: C.text }}>3x más rápido</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .artista-main-pad       { padding: 20px !important; }
          .artista-dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .artista-main-pad { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}