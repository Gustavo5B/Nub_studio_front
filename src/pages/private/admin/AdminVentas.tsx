// src/pages/private/admin/AdminVentas.tsx
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ShoppingBag, Clock, Truck, CheckCircle, XCircle, Package } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", pink:"#A83B90", purple:"#6028AA",
  blue:"#2D6FBE",   gold:"#A87006", green:"#0E8A50",
  cream:"#14121E",  creamSub:"#5A5870", creamMut:"#9896A8",
  bg:"#F9F8FC", card:"#FFFFFF", border:"#E6E4EF", red:"#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

function authH() { return { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` }; }

const ESTADOS = [
  { value: "",           label: "Todos",       color: C.creamMut,  bg: "#F3F2F8" },
  { value: "pendiente",  label: "Pendiente",   color: "#92400E",   bg: "#FEF3C7" },
  { value: "procesando", label: "Procesando",  color: "#1E40AF",   bg: "#DBEAFE" },
  { value: "enviado",    label: "Enviado",      color: "#065F46",   bg: "#D1FAE5" },
  { value: "entregado",  label: "Entregado",   color: "#065F46",   bg: "#D1FAE5" },
  { value: "cancelado",  label: "Cancelado",   color: "#991B1B",   bg: "#FEE2E2" },
];

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  pendiente:  <Clock     size={13} strokeWidth={2}/>,
  procesando: <Package   size={13} strokeWidth={2}/>,
  enviado:    <Truck     size={13} strokeWidth={2}/>,
  entregado:  <CheckCircle size={13} strokeWidth={2}/>,
  cancelado:  <XCircle   size={13} strokeWidth={2}/>,
};

interface Venta {
  id_venta: number;
  cliente_nombre: string;
  cliente_correo: string;
  obra_titulo: string;
  imagen_principal: string;
  artista_alias: string;
  cantidad: number;
  precio_unitario: string;
  total: string;
  estado: string;
  fecha_creacion: string;
}

export default function AdminVentas() {
  const { showToast } = useToast();
  const [ventas,     setVentas]     = useState<Venta[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [updating,   setUpdating]   = useState<number | null>(null);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15", ...(filtro ? { estado: filtro } : {}) });
      const res  = await fetch(`${API}/api/admin/ventas-admin?${params}`, { headers: authH() });
      const data = await res.json();
      if (data.success) {
        setVentas(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch {
      showToast("Error al cargar ventas", "err");
    } finally {
      setLoading(false);
    }
  }, [filtro, page]);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  const cambiarEstado = async (id_venta: number, nuevoEstado: string) => {
    setUpdating(id_venta);
    try {
      const res  = await fetch(`${API}/api/admin/ventas-admin/${id_venta}/estado`, {
        method: "PUT", headers: authH(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "ok");
        setVentas(prev => prev.map(v => v.id_venta === id_venta ? { ...v, estado: nuevoEstado } : v));
      } else {
        showToast(data.message || "Error", "err");
      }
    } catch {
      showToast("Sin conexión", "err");
    } finally {
      setUpdating(null);
    }
  };

  // ── Totales por estado (en la página actual) ─────────────────
  const totalMonto = ventas.reduce((sum, v) => sum + Number(v.total), 0);

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        .av-row { transition: background .15s; }
        .av-row:hover { background: rgba(0,0,0,.018) !important; }
        .av-select { border: 1px solid ${C.border}; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-family: ${FB}; font-weight: 600; cursor: pointer; outline: none; background: ${C.card}; color: ${C.cream}; }
        .av-select:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.cream, margin: 0, lineHeight: 1.2 }}>Ventas</h1>
          <p style={{ fontSize: 13, color: C.creamSub, margin: "4px 0 0", fontWeight: 500 }}>
            Administración de órdenes y seguimiento de pedidos
          </p>
        </div>
        <button onClick={fetchVentas} style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.creamSub, boxShadow: CS }}>
          <RefreshCw size={13} strokeWidth={2} />
          Actualizar
        </button>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total órdenes",  value: String(total),         accent: C.purple,  icon: <ShoppingBag size={17} color={C.purple} strokeWidth={1.8}/> },
          { label: "Monto en vista", value: fmtMXN(totalMonto),    accent: C.green,   icon: <CheckCircle size={17} color={C.green} strokeWidth={1.8}/> },
          { label: "Pendientes",     value: String(ventas.filter(v=>v.estado==="pendiente").length),   accent: C.gold,    icon: <Clock size={17} color={C.gold} strokeWidth={1.8}/> },
          { label: "Enviados",       value: String(ventas.filter(v=>v.estado==="enviado").length),     accent: C.blue,    icon: <Truck size={17} color={C.blue} strokeWidth={1.8}/> },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, borderRadius: 10, padding: "14px 18px", boxShadow: CS, borderLeft: `3px solid ${k.accent}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${k.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.cream, lineHeight: 1, fontFamily: FM }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros de estado */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => { setFiltro(e.value); setPage(1); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FB, border: "1px solid transparent", transition: "all .15s",
              background: filtro === e.value ? e.bg : C.card,
              color: filtro === e.value ? e.color : C.creamSub,
              borderColor: filtro === e.value ? e.color + "44" : C.border,
              boxShadow: filtro === e.value ? CS : "none",
            }}
          >
            {e.value && ESTADO_ICONS[e.value]}
            {e.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, borderRadius: 12, boxShadow: CS, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["#", "Obra", "Cliente", "Artista", "Cant.", "Total", "Fecha", "Estado"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: C.creamMut, fontSize: 13 }}>Cargando...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: C.creamMut, fontSize: 13 }}>Sin órdenes{filtro ? ` con estado "${filtro}"` : ""}</td></tr>
            ) : ventas.map(v => {
              const est = ESTADOS.find(e => e.value === v.estado) ?? ESTADOS[1];
              return (
                <tr key={v.id_venta} className="av-row" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: FM, color: C.creamMut }}>#{v.id_venta}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#ece9e4" }}>
                        {v.imagen_principal
                          ? <img src={v.imagen_principal} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.creamMut }}>🖼</div>
                        }
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.cream, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.obra_titulo}</div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.cream }}>{v.cliente_nombre}</div>
                    <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FM }}>{v.cliente_correo}</div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.creamSub }}>{v.artista_alias}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FM, textAlign: "center" }}>{v.cantidad}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.green, fontFamily: FM, whiteSpace: "nowrap" }}>{fmtMXN(Number(v.total))}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: C.creamMut, whiteSpace: "nowrap" }}>
                    {new Date(v.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <select
                      className="av-select"
                      value={v.estado}
                      disabled={updating === v.id_venta}
                      onChange={e => cambiarEstado(v.id_venta, e.target.value)}
                      style={{ background: est.bg, color: est.color, borderColor: est.color + "44" }}
                    >
                      {ESTADOS.filter(e => e.value).map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.creamMut }}>Página {page} de {totalPages} · {total} órdenes</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, cursor: "pointer", color: C.creamSub, fontFamily: FB, opacity: page === 1 ? .4 : 1 }}>← Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, cursor: "pointer", color: C.creamSub, fontFamily: FB, opacity: page === totalPages ? .4 : 1 }}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
