import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", ink: "#14121E", sub: "#9896A8",
  bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const SANS  = "'Outfit', sans-serif";
const SERIF = "'SolveraLorvane', serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:  { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
  pagado:     { bg: "#D1FAE5", color: "#065F46", label: "Pagado" },
  procesando: { bg: "#DBEAFE", color: "#1E40AF", label: "Procesando" },
  enviado:    { bg: "#DBEAFE", color: "#1E40AF", label: "Enviado" },
  entregado:  { bg: "#D1FAE5", color: "#065F46", label: "Entregado" },
  cancelado:  { bg: "#FEE2E2", color: "#991B1B", label: "Cancelado" },
};

interface Pedido {
  id_venta: number;
  titulo: string;
  imagen_principal: string;
  slug: string;
  artista_alias: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  total: string;
  estado: string;
  fecha_venta: string;
}

interface OrdenGroup {
  key: string;
  fecha: string;
  items: Pedido[];
  totalGrupo: number;
  estado: string;
}

const STATUS_BANNER: Record<string, { bg: string; border: string; color: string; icon: React.ReactNode; title: string; msg: string }> = {
  success: {
    bg: "#F0FDF4", border: "#86EFAC", color: "#166534",
    icon: <CheckCircle size={22} strokeWidth={2} />,
    title: "¡Pago confirmado!",
    msg: "Tu orden fue procesada exitosamente. Te avisaremos cuando sea enviada.",
  },
  failure: {
    bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B",
    icon: <XCircle size={22} strokeWidth={2} />,
    title: "Pago rechazado",
    msg: "No pudimos procesar tu pago. Intenta de nuevo o usa otro método.",
  },
  pending: {
    bg: "#FFFBEB", border: "#FCD34D", color: "#92400E",
    icon: <Clock size={22} strokeWidth={2} />,
    title: "Pago en revisión",
    msg: "Tu pago está siendo verificado. Te notificaremos cuando se confirme.",
  },
};

export default function MisPedidos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && STATUS_BANNER[status]) {
      setBanner(status);
      window.history.replaceState({}, "", "/mi-cuenta/pedidos");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setPedidos(d.data); })
      .catch(() => showToast("Error al cargar pedidos", "err"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Agrupa ventas por minuto de creación — items del mismo checkout comparten timestamp
  const ordenes = useMemo<OrdenGroup[]>(() => {
    const map = new Map<string, OrdenGroup>();
    const result: OrdenGroup[] = [];

    for (const p of pedidos) {
      const key = p.fecha_venta.slice(0, 16); // YYYY-MM-DDTHH:mm
      if (!map.has(key)) {
        const grupo: OrdenGroup = { key, fecha: p.fecha_venta, items: [], totalGrupo: 0, estado: p.estado };
        map.set(key, grupo);
        result.push(grupo);
      }
      const g = map.get(key)!;
      g.items.push(p);
      g.totalGrupo += Number(p.total);
    }

    return result;
  }, [pedidos]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        .ped-card { transition: box-shadow .2s; }
        .ped-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.09); }
        .ped-item-link { cursor: pointer; transition: opacity .15s; }
        .ped-item-link:hover { opacity: .8; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/mi-cuenta")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: SERIF, fontSize: 18, fontWeight: 900, color: C.ink }}>
          <ArrowLeft size={18} strokeWidth={2} />
          Mis Pedidos
        </button>
        <span style={{ fontSize: 13, color: C.sub }}>
          {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
        </span>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>

        {/* Banner de estado de pago */}
        {banner && STATUS_BANNER[banner] && (() => {
          const b = STATUS_BANNER[banner];
          return (
            <div style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 14, color: b.color }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{b.title}</div>
                <div style={{ fontSize: 13, opacity: .85 }}>{b.msg}</div>
              </div>
              <button
                onClick={() => setBanner(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: b.color, opacity: 0.6, fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
                aria-label="Cerrar"
              >✕</button>
            </div>
          );
        })()}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.sub, fontSize: 14 }}>Cargando pedidos...</div>
        ) : ordenes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Package size={48} color={C.border} strokeWidth={1} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Aún no tienes pedidos</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Cuando confirmes una orden aparecerá aquí</div>
            <button
              onClick={() => navigate("/catalogo")}
              style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", fontFamily: SANS }}
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ordenes.map((orden, idx) => {
              const estadoStyle = ESTADO_STYLES[orden.estado] ?? ESTADO_STYLES.pendiente;
              const fecha = new Date(orden.fecha).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
              const numOrden = ordenes.length - idx;

              return (
                <div
                  key={orden.key}
                  className="ped-card"
                  style={{ background: C.card, borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)", overflow: "hidden" }}
                >
                  {/* Cabecera de la orden */}
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>Orden #{numOrden}</span>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.border, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: C.sub }}>{fecha}</span>
                    </div>
                    <span style={{
                      background: estadoStyle.bg,
                      color: estadoStyle.color,
                      borderRadius: 100,
                      padding: "3px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>
                      {estadoStyle.label}
                    </span>
                  </div>

                  {/* Items de la orden */}
                  <div style={{ padding: "4px 0" }}>
                    {orden.items.map((p, iIdx) => (
                      <div
                        key={p.id_venta}
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: "14px 20px",
                          borderBottom: iIdx < orden.items.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div
                          className="ped-item-link"
                          style={{ width: 52, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#ece9e4" }}
                          onClick={() => navigate(`/obras/${p.slug}`)}
                        >
                          {p.imagen_principal
                            ? <img src={p.imagen_principal} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontSize: 18 }}>▪</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="ped-item-link"
                            style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            onClick={() => navigate(`/obras/${p.slug}`)}
                          >
                            {p.titulo}
                          </div>
                          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{p.artista_alias}</div>
                          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{p.cantidad} {p.cantidad === 1 ? "pieza" : "piezas"}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, flexShrink: 0 }}>
                          {fmt(Number(p.total))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total de la orden */}
                  <div style={{ padding: "12px 20px", borderTop: `2px solid ${C.orange}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>
                      {orden.items.length} {orden.items.length === 1 ? "obra" : "obras"}
                    </span>
                    <span style={{ fontSize: 11, color: C.border }}>|</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Total:</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>
                      {fmt(orden.totalGrupo)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
