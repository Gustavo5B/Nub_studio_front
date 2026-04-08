// src/pages/cliente/MisPedidos.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
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
  procesando: { bg: "#DBEAFE", color: "#1E40AF", label: "Procesando" },
  enviado:    { bg: "#D1FAE5", color: "#065F46", label: "Enviado" },
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
  total: string;
  estado: string;
  fecha_creacion: string;
}

export default function MisPedidos() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setPedidos(d.data); })
      .catch(() => showToast("Error al cargar pedidos", "err"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        .ped-item { transition: box-shadow .2s; }
        .ped-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/mi-cuenta")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: SERIF, fontSize: 18, fontWeight: 900, color: C.ink }}>
          <ArrowLeft size={18} strokeWidth={2} />
          Mis Pedidos
        </button>
        <span style={{ fontSize: 13, color: C.sub }}>{pedidos.length} {pedidos.length === 1 ? "orden" : "órdenes"}</span>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.sub, fontSize: 14 }}>Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Package size={48} color={C.border} strokeWidth={1} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Aún no tienes pedidos</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Cuando confirmes una orden aparecerá aquí</div>
            <button onClick={() => navigate("/catalogo")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", fontFamily: SANS }}>
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pedidos.map(p => {
              const estadoStyle = ESTADO_STYLES[p.estado] ?? ESTADO_STYLES.pendiente;
              const fecha = new Date(p.fecha_creacion).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

              return (
                <div key={p.id_venta} className="ped-item" style={{ background: C.card, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)", display: "flex", gap: 16, alignItems: "center" }}>
                  {/* Imagen */}
                  <div style={{ width: 64, height: 80, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#ece9e4", cursor: "pointer" }} onClick={() => navigate(`/obras/${p.slug}`)}>
                    {p.imagen_principal
                      ? <img src={p.imagen_principal} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub }}>🖼</div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{p.titulo}</div>
                        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{p.artista_alias}</div>
                      </div>
                      <span style={{ background: estadoStyle.bg, color: estadoStyle.color, borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {estadoStyle.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ fontSize: 11, color: C.sub }}>Orden #{p.id_venta} · {fecha} · {p.cantidad} {p.cantidad === 1 ? "pieza" : "piezas"}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>{fmt(Number(p.total))}</div>
                    </div>
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
