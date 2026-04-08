// src/pages/cliente/Carrito.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", ink: "#14121E", sub: "#9896A8",
  bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF", red: "#C4304A",
};
const SANS  = "'Outfit', sans-serif";
const SERIF = "'SolveraLorvane', serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface ItemCarrito {
  id_carrito: number;
  id_obra: number;
  titulo: string;
  slug: string;
  imagen_principal: string;
  precio_base: string;
  cantidad: number;
  artista_alias: string;
}

export default function Carrito() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items,        setItems]        = useState<ItemCarrito[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [creandoOrden, setCreandoOrden] = useState(false);

  const token   = authService.getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchCarrito = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/carrito`, { headers });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {
      showToast("Error al cargar el carrito", "err");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCarrito(); }, [fetchCarrito]);

  const actualizarCantidad = async (id_carrito: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    try {
      const res = await fetch(`${API_URL}/api/carrito/${id_carrito}`, {
        method: "PUT", headers,
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });
      if (res.ok) setItems(prev => prev.map(i => i.id_carrito === id_carrito ? { ...i, cantidad: nuevaCantidad } : i));
    } catch {
      showToast("Error al actualizar cantidad", "err");
    }
  };

  const eliminar = async (id_carrito: number) => {
    try {
      const res = await fetch(`${API_URL}/api/carrito/${id_carrito}`, { method: "DELETE", headers });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id_carrito !== id_carrito));
        showToast("Obra eliminada del carrito", "ok");
      }
    } catch {
      showToast("Error al eliminar", "err");
    }
  };

  const crearOrden = async () => {
    setCreandoOrden(true);
    try {
      const res  = await fetch(`${API_URL}/api/ventas`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "ok");
        setItems([]);
        navigate("/mi-cuenta/pedidos");
      } else {
        showToast(data.message || "Error al crear la orden", "err");
      }
    } catch {
      showToast("Sin conexión con el servidor", "err");
    } finally {
      setCreandoOrden(false);
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.precio_base) * i.cantidad, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        .car-item { transition: box-shadow .2s; }
        .car-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .car-qty-btn { width:28px; height:28px; border-radius:50%; border:1px solid ${C.border}; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .18s; }
        .car-qty-btn:hover:not(:disabled) { border-color:${C.orange}; color:${C.orange}; }
        .car-qty-btn:disabled { opacity:.35; cursor:not-allowed; }
        .car-del-btn { background:none; border:none; cursor:pointer; color:${C.sub}; display:flex; align-items:center; padding:6px; border-radius:6px; transition:color .18s, background .18s; }
        .car-del-btn:hover { color:${C.red}; background:#FEF2F2; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/mi-cuenta")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: SERIF, fontSize: 18, fontWeight: 900, color: C.ink }}>
          <ArrowLeft size={18} strokeWidth={2} />
          Mi Carrito
        </button>
        <span style={{ fontSize: 13, color: C.sub }}>{items.length} {items.length === 1 ? "obra" : "obras"}</span>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: items.length > 0 ? "1fr 300px" : "1fr", gap: 24, alignItems: "start" }}>

        {/* Lista de items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: C.sub, fontSize: 14 }}>Cargando carrito...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80 }}>
              <ShoppingCart size={48} color={C.border} strokeWidth={1} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Tu carrito está vacío</div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Explora el catálogo y agrega obras</div>
              <button onClick={() => navigate("/catalogo")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", fontFamily: SANS }}>
                Explorar catálogo
              </button>
            </div>
          ) : items.map(item => (
            <div key={item.id_carrito} className="car-item" style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)", display: "flex", gap: 16, alignItems: "center" }}>
              {/* Imagen */}
              <div style={{ width: 72, height: 90, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#ece9e4", cursor: "pointer" }} onClick={() => navigate(`/obras/${item.slug}`)}>
                {item.imagen_principal
                  ? <img src={item.imagen_principal} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.sub }}>🖼</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.titulo}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{item.artista_alias}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.orange, marginTop: 8, fontFamily: NEXA }}>{fmt(Number(item.precio_base))}</div>
              </div>

              {/* Cantidad */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button className="car-qty-btn" onClick={() => actualizarCantidad(item.id_carrito, item.cantidad - 1)} disabled={item.cantidad <= 1}>
                  <Minus size={11} strokeWidth={2.5} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.cantidad}</span>
                <button className="car-qty-btn" onClick={() => actualizarCantidad(item.id_carrito, item.cantidad + 1)} disabled={item.cantidad >= 10}>
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>

              {/* Subtotal */}
              <div style={{ minWidth: 80, textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{fmt(Number(item.precio_base) * item.cantidad)}</div>
              </div>

              {/* Eliminar */}
              <button className="car-del-btn" onClick={() => eliminar(item.id_carrito)}>
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>

        {/* Resumen */}
        {items.length > 0 && (
          <div style={{ background: C.card, borderRadius: 12, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)", position: "sticky", top: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>Resumen del pedido</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>Subtotal ({items.length} {items.length === 1 ? "obra" : "obras"})</span>
                <span style={{ fontWeight: 600, color: C.ink }}>{fmt(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>Envío</span>
                <span style={{ color: C.sub, fontSize: 11 }}>A coordinar</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 20, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <span>Total</span>
              <span style={{ color: C.orange, fontFamily: NEXA }}>{fmt(total)}</span>
            </div>

            <button
              onClick={crearOrden}
              disabled={creandoOrden}
              style={{ width: "100%", padding: "14px", borderRadius: 100, background: creandoOrden ? C.sub : C.orange, color: "#fff", border: "none", fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", cursor: creandoOrden ? "not-allowed" : "pointer", fontFamily: SANS, transition: "background .22s" }}
            >
              {creandoOrden ? "Procesando..." : "Confirmar orden →"}
            </button>

            <p style={{ fontSize: 10, color: C.sub, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              Al confirmar, te contactaremos para coordinar el pago y envío.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
