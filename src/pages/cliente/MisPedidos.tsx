import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  ink: "#14121E",
  sub: "#9896A8",
  subLight: "#C4C2D0",
  bg: "#F9F8FC",
  card: "#FFFFFF",
  border: "#E6E4EF",
};

const SANS  = "'Outfit', sans-serif";
const SERIF = "'SolveraLorvane', serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

const ESTADO_CONFIG: Record<string, {
  bg: string; color: string; border: string; dot: string; label: string;
}> = {
  pendiente:  { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", dot: "#F59E0B", label: "Pendiente" },
  pagado:     { bg: "#F0FDF4", color: "#166534", border: "#86EFAC", dot: "#22C55E", label: "Pagado"    },
  procesando: { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6", label: "Procesando"},
  enviado:    { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6", label: "Enviado"   },
  entregado:  { bg: "#F0FDF4", color: "#166534", border: "#86EFAC", dot: "#22C55E", label: "Entregado" },
  cancelado:  { bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5", dot: "#EF4444", label: "Cancelado" },
};

interface Pedido {
  id_pedido: number;
  id_venta: number;
  titulo: string;
  imagen_principal: string;
  slug: string;
  artista_alias: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  total: string;
  estado_pedido: string;
  estado_venta: string;
  fecha_pedido: string;
  total_pedido: string;
}

interface OrdenGroup {
  id_pedido: number;
  fecha: string;
  items: Pedido[];
  totalGrupo: number;
  estado: string;
}

const STATUS_BANNER: Record<string, {
  bg: string; border: string; color: string;
  icon: React.ReactNode; title: string; msg: string;
}> = {
  success: {
    bg: "#F0FDF4", border: "#86EFAC", color: "#166534",
    icon: <CheckCircle size={20} strokeWidth={2} />,
    title: "¡Pago confirmado!",
    msg: "Tu orden fue procesada exitosamente. Te notificaremos cuando sea enviada.",
  },
  failure: {
    bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B",
    icon: <XCircle size={20} strokeWidth={2} />,
    title: "Pago rechazado",
    msg: "No pudimos procesar tu pago. Intenta de nuevo o usa otro método de pago.",
  },
  pending: {
    bg: "#FFFBEB", border: "#FCD34D", color: "#92400E",
    icon: <Clock size={20} strokeWidth={2} />,
    title: "Pago en revisión",
    msg: "Tu pago está siendo verificado. Te notificaremos cuando se confirme.",
  },
};

export default function MisPedidos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [pedidos, setPedidos]   = useState<Pedido[]>([]);
  const [loading, setLoading]   = useState(true);
  const [banner, setBanner]     = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0); // primera orden abierta por defecto

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && STATUS_BANNER[status]) {
      setBanner(status);
      window.history.replaceState({}, "", "/mi-cuenta/pedidos");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_URL}/api/ventas/mis-pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setPedidos(d.data); })
      .catch(() => showToast("Error al cargar pedidos", "err"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Agrupa ventas por id_pedido real
  const ordenes = useMemo<OrdenGroup[]>(() => {
    const map = new Map<number, OrdenGroup>();
    const result: OrdenGroup[] = [];
    for (const p of pedidos) {
      if (!map.has(p.id_pedido)) {
        const grupo: OrdenGroup = {
          id_pedido: p.id_pedido,
          fecha: p.fecha_pedido,
          items: [],
          totalGrupo: Number(p.total_pedido),
          estado: p.estado_pedido,
        };
        map.set(p.id_pedido, grupo);
        result.push(grupo);
      }
      map.get(p.id_pedido)!.items.push(p);
    }
    return result;
  }, [pedidos]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }

        .back-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          font-family: ${SERIF}; font-size: 18px; font-weight: 900;
          color: ${C.ink}; transition: color .18s;
        }
        .back-btn:hover { color: ${C.orange}; }

        .orden-card {
          background: ${C.card};
          border-radius: 20px;
          box-shadow: 0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055);
          overflow: hidden;
          transition: box-shadow .25s ease;
        }
        .orden-card:hover {
          box-shadow: 0 6px 28px rgba(20,18,30,.09), 0 0 0 1px rgba(20,18,30,.07);
        }

        .orden-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; cursor: pointer;
          transition: background .18s;
          gap: 16px;
        }
        .orden-header:hover { background: #FAFAFC; }

        .item-link { cursor: pointer; transition: opacity .15s; }
        .item-link:hover { opacity: .75; }

        .img-thumb { transition: transform .3s ease; }
        .item-row:hover .img-thumb { transform: scale(1.05); }

        .banner-close {
          background: none; border: none; cursor: pointer;
          opacity: .55; font-size: 18px; line-height: 1;
          padding: 2px 4px; transition: opacity .15s;
          border-radius: 4px;
        }
        .banner-close:hover { opacity: 1; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orden-card { animation: fadeSlideIn .35s ease both; }

        @keyframes shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #ece9f0 25%, #f5f3f8 50%, #ece9f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 20px;
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: "#fff",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <button className="back-btn" onClick={() => navigate("/mi-cuenta")}>
          <ArrowLeft size={16} strokeWidth={2.5} />
          Mis Pedidos
        </button>
        {!loading && ordenes.length > 0 && (
          <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
            {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
          </span>
        )}
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>

        {/* ── Banner de estado de pago ── */}
        {banner && STATUS_BANNER[banner] && (() => {
          const b = STATUS_BANNER[banner];
          return (
            <div style={{
              background: b.bg,
              border: `1px solid ${b.border}`,
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              color: b.color,
              animation: "fadeSlideIn .3s ease both",
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 13, opacity: .85, lineHeight: 1.5 }}>{b.msg}</div>
              </div>
              <button className="banner-close" onClick={() => setBanner(null)} aria-label="Cerrar">✕</button>
            </div>
          );
        })()}

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton" style={{ height: 96 }} />
            ))}
          </div>

        ) : ordenes.length === 0 ? (
          /* ── Estado vacío ── */
          <div style={{ textAlign: "center", padding: "96px 32px" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#F3F0F8",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <Package size={32} color={C.subLight} strokeWidth={1.5} />
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color: C.ink,
              fontFamily: SERIF, marginBottom: 10,
            }}>
              Aún no tienes pedidos
            </div>
            <div style={{ fontSize: 14, color: C.sub, marginBottom: 32, lineHeight: 1.6 }}>
              Cuando confirmes una compra, tus órdenes aparecerán aquí
            </div>
            <button
              onClick={() => navigate("/catalogo")}
              style={{
                background: C.orange, color: "#fff", border: "none",
                borderRadius: 100, padding: "13px 28px",
                fontSize: 11, fontWeight: 700, letterSpacing: ".16em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: SANS,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              Explorar catálogo <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>

        ) : (
          /* ── Lista de órdenes ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ordenes.map((orden, idx) => {
              const est    = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;
              const isOpen = expandedIdx === idx;
              const fechaObj = new Date(orden.fecha);
              const fecha = fechaObj.toLocaleDateString("es-MX", {
                year: "numeric", month: "long", day: "numeric",
              });
              const hora = fechaObj.toLocaleTimeString("es-MX", {
                hour: "2-digit", minute: "2-digit", hour12: true,
              });
              const codigoOrden = `NUB-${String(orden.id_pedido).padStart(5, "0")}`;

              // Tiempo relativo
              const ahoraMs   = Date.now();
              const pedidoMs  = fechaObj.getTime();
              const diffMin   = Math.floor((ahoraMs - pedidoMs) / 60000);
              const tiempoRel = diffMin < 1    ? "Ahora mismo"
                              : diffMin < 60   ? `Hace ${diffMin} min`
                              : diffMin < 1440 ? `Hace ${Math.floor(diffMin / 60)}h`
                              : diffMin < 2880 ? "Ayer"
                              : `${fecha}`;

              return (
                <div
                  key={orden.id_pedido}
                  className="orden-card"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Cabecera clickeable */}
                  <div
                    className="orden-header"
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && setExpandedIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>

                      {/* Fila 1: fecha principal + estado */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
                          {tiempoRel === "Ayer" || tiempoRel === fecha ? fecha : `${tiempoRel} — ${fecha}`}
                        </span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: est.bg, border: `1px solid ${est.border}`,
                          borderRadius: 100, padding: "3px 10px",
                          fontSize: 10, fontWeight: 700, color: est.color,
                          letterSpacing: ".1em", textTransform: "uppercase",
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: est.dot }} />
                          {est.label}
                        </span>
                      </div>

                      {/* Fila 2: hora · obras · ref */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: C.sub }}>{hora}</span>
                        <span style={{ color: C.border }}>·</span>
                        <span style={{ fontSize: 12, color: C.sub }}>
                          {orden.items.length} {orden.items.length === 1 ? "obra" : "obras"}
                        </span>
                        <span style={{ color: C.border }}>·</span>
                        <span style={{
                          fontSize: 11, color: C.subLight,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: ".06em",
                          userSelect: "all",
                        }}>
                          {codigoOrden}
                        </span>
                      </div>
                    </div>

                    {/* Total + chevron */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>
                          {fmt(orden.totalGrupo)}
                        </div>
                      </div>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        border: `1.5px solid ${C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ChevronRight size={14} strokeWidth={2.5} color={C.sub}
                          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .2s ease" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items — expandible */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${C.border}` }}>
                      {orden.items.map((p, iIdx) => (
                        <div
                          key={p.id_venta}
                          className="item-row"
                          style={{
                            display: "flex",
                            gap: 16,
                            alignItems: "center",
                            padding: "16px 24px",
                            borderBottom: iIdx < orden.items.length - 1 ? `1px solid ${C.border}` : "none",
                          }}
                        >
                          {/* Thumbnail */}
                          <div
                            className="item-link"
                            style={{
                              width: 56, height: 70,
                              borderRadius: 10, overflow: "hidden",
                              flexShrink: 0, background: "#EDE9E3",
                            }}
                            onClick={() => navigate(`/obras/${p.slug}`)}
                          >
                            {p.imagen_principal
                              ? <img className="img-thumb" src={p.imagen_principal} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Package size={16} color={C.subLight} strokeWidth={1.5} />
                                </div>
                            }
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="item-link"
                              style={{
                                fontSize: 14, fontWeight: 700, color: C.ink,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                marginBottom: 3,
                              }}
                              onClick={() => navigate(`/obras/${p.slug}`)}
                            >
                              {p.titulo}
                            </div>
                            <div style={{ fontSize: 12, color: C.sub, marginBottom: 2 }}>{p.artista_alias}</div>
                            <div style={{ fontSize: 11, color: C.subLight }}>
                              {p.cantidad} {p.cantidad === 1 ? "pieza" : "piezas"} × {fmt(Number(p.precio_unitario))}
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div style={{
                            fontSize: 15, fontWeight: 800,
                            color: C.ink, fontFamily: NEXA, flexShrink: 0,
                          }}>
                            {fmt(Number(p.total))}
                          </div>
                        </div>
                      ))}

                      {/* Footer de la orden */}
                      <div style={{
                        padding: "14px 24px",
                        background: "#FAFAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: `2px solid ${C.orange}`,
                      }}>
                        <span style={{ fontSize: 12, color: C.sub }}>
                          {orden.items.length} {orden.items.length === 1 ? "obra" : "obras"}
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Total:</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>
                            {fmt(orden.totalGrupo)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
