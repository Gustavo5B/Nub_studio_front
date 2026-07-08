// src/pages/private/artista/ArtistaVentas.tsx
import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, TrendingUp } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", pink: "#A83B90", green: "#0E8A50",
  blue:   "#2D6FBE", gold: "#A87006", red: "#C4304A",
  ink:    "#14121E", sub: "#5A5870", muted: "#9896A8",
  bg:     "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono', 'Fira Code', monospace";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

type EstadoFiltro = "" | "pendiente" | "pagado" | "procesando" | "enviado" | "entregado" | "cancelado";

const FILTROS: { key: EstadoFiltro; label: string; color: string; bg: string }[] = [
  { key: "",           label: "Todos",       color: C.muted,  bg: "#F3F2F8"  },
  { key: "pendiente",  label: "Pendiente",   color: "#92400E", bg: "#FEF3C7" },
  { key: "pagado",     label: "Pagado",      color: "#166534", bg: "#D1FAE5" },
  { key: "procesando", label: "Procesando",  color: "#1E40AF", bg: "#DBEAFE" },
  { key: "enviado",    label: "Enviado",     color: "#065F46", bg: "#D1FAE5" },
  { key: "entregado",  label: "Entregado",   color: "#166534", bg: "#D1FAE5" },
  { key: "cancelado",  label: "Cancelado",   color: "#991B1B", bg: "#FEE2E2" },
];

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  pendiente:  <Clock      size={11} strokeWidth={2}/>,
  pagado:     <CheckCircle size={11} strokeWidth={2}/>,
  procesando: <ShoppingBag size={11} strokeWidth={2}/>,
  enviado:    <Truck      size={11} strokeWidth={2}/>,
  entregado:  <CheckCircle size={11} strokeWidth={2}/>,
  cancelado:  <XCircle    size={11} strokeWidth={2}/>,
};

interface Venta {
  id_venta:         number;
  id_pedido:        number;
  obra_titulo:      string;
  imagen_principal: string;
  comprador_nombre: string;
  cantidad:         number;
  precio_unitario:  string;
  total:            string;
  estado:           string;
  fecha_venta:      string;
}

export default function ArtistaVentas() {
  const { showToast } = useToast();
  const [ventas,  setVentas]  = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState<EstadoFiltro>("");

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API}/api/artista-portal/mis-ventas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setVentas(d.data);
        else showToast("Error al cargar ventas", "err");
      })
      .catch(() => showToast("Sin conexión", "err"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const filtradas = useMemo(() =>
    filtro ? ventas.filter(v => v.estado === filtro) : ventas,
  [ventas, filtro]);

  // KPIs
  const totalVentas   = ventas.filter(v => v.estado !== "cancelado").length;
  const montoTotal    = ventas.filter(v => ["pagado","procesando","enviado","entregado"].includes(v.estado))
                              .reduce((s, v) => s + Number(v.total), 0);
  const pendientes    = ventas.filter(v => v.estado === "pendiente").length;
  const entregados    = ventas.filter(v => v.estado === "entregado").length;

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        .av-row { transition: background .15s; }
        .av-row:hover { background: rgba(0,0,0,.018) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>
          Mis ventas
        </h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0", fontWeight: 500 }}>
          Historial de compras de tus obras
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Ventas totales",  value: String(totalVentas), accent: C.orange, icon: <ShoppingBag size={17} color={C.orange} strokeWidth={1.8}/> },
          { label: "Monto cobrado",   value: fmt(montoTotal),     accent: C.green,  icon: <TrendingUp  size={17} color={C.green}  strokeWidth={1.8}/> },
          { label: "Pendientes",      value: String(pendientes),  accent: C.gold,   icon: <Clock       size={17} color={C.gold}   strokeWidth={1.8}/> },
          { label: "Entregados",      value: String(entregados),  accent: C.blue,   icon: <CheckCircle size={17} color={C.blue}   strokeWidth={1.8}/> },
        ].map(k => (
          <div key={k.label} style={{
            background: C.card, borderRadius: 10, padding: "14px 18px",
            boxShadow: CS, borderLeft: `3px solid ${k.accent}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: `${k.accent}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontFamily: FM }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 100, fontSize: 11,
              fontWeight: 700, cursor: "pointer", fontFamily: FB,
              border: "1px solid transparent", transition: "all .15s",
              background: filtro === f.key ? f.bg    : C.card,
              color:      filtro === f.key ? f.color : C.sub,
              borderColor: filtro === f.key ? f.color + "44" : C.border,
              boxShadow:   filtro === f.key ? CS : "none",
            }}
          >
            {f.key && ESTADO_ICONS[f.key]}
            {f.label}
            {f.key && (
              <span style={{
                background: filtro === f.key ? f.color + "22" : "#0001",
                color: filtro === f.key ? f.color : C.muted,
                borderRadius: 100, padding: "0 6px",
                fontSize: 10, fontFamily: FM, fontWeight: 700,
              }}>
                {ventas.filter(v => v.estado === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, borderRadius: 12, boxShadow: CS, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["#", "Obra", "Comprador", "Cant.", "Total", "Fecha", "Estado"].map(h => (
                <th key={h} style={{
                  padding: "12px 14px", textAlign: "left",
                  fontSize: 10, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted, fontSize: 13 }}>
                  Cargando...
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "64px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.orange}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={22} color={C.orange} strokeWidth={1.5}/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                      {filtro ? `Sin ventas con estado "${FILTROS.find(f=>f.key===filtro)?.label}"` : "Aún no tienes ventas"}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 280, textAlign: "center", lineHeight: 1.6 }}>
                      {filtro ? "Prueba con otro filtro." : "Cuando alguien compre una de tus obras, aparecerá aquí."}
                    </div>
                  </div>
                </td>
              </tr>
            ) : filtradas.map(v => {
              const est = FILTROS.find(f => f.key === v.estado) ?? FILTROS[1];
              const fecha = new Date(v.fecha_venta).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
              const cancelada = v.estado === "cancelado";
              return (
                <tr key={v.id_venta} className="av-row" style={{
                  borderBottom: `1px solid ${C.border}`,
                  opacity: cancelada ? .55 : 1,
                }}>
                  {/* # */}
                  <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: FM, color: C.muted }}>
                    #{v.id_venta}
                  </td>

                  {/* Obra */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#ece9e4" }}>
                        {v.imagen_principal
                          ? <img src={v.imagen_principal} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 16 }}>🖼</div>
                        }
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.obra_titulo}
                      </div>
                    </div>
                  </td>

                  {/* Comprador */}
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.sub, fontWeight: 500 }}>
                    {v.comprador_nombre}
                  </td>

                  {/* Cantidad */}
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: FM, textAlign: "center" }}>
                    {v.cantidad}
                  </td>

                  {/* Total */}
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: cancelada ? C.muted : C.green, fontFamily: FM, whiteSpace: "nowrap" }}>
                    {cancelada ? <s>{fmt(Number(v.total))}</s> : fmt(Number(v.total))}
                  </td>

                  {/* Fecha */}
                  <td style={{ padding: "10px 14px", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
                    {fecha}
                  </td>

                  {/* Estado — solo visual, sin dropdown */}
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 100,
                      fontSize: 10, fontWeight: 700,
                      background: est.bg, color: est.color,
                      border: `1px solid ${est.color}33`,
                    }}>
                      {ESTADO_ICONS[v.estado]}
                      {est.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtradas.length > 0 && (
          <div style={{
            padding: "12px 16px", borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: C.muted }}>
              {filtradas.length} {filtradas.length === 1 ? "venta" : "ventas"}
              {filtro ? ` con estado "${FILTROS.find(f=>f.key===filtro)?.label}"` : " en total"}
            </span>
            <span style={{ fontSize: 12, fontFamily: FM, fontWeight: 700, color: C.green }}>
              {fmt(filtradas.filter(v => !["cancelado","pendiente"].includes(v.estado)).reduce((s,v) => s + Number(v.total), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
