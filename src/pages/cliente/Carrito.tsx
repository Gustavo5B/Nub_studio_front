// src/pages/cliente/Carrito.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import { emitCartUpdate } from "../../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  ink: "#14121E",
  sub: "#9896A8",
  subLight: "#C4C2D0",
  bg: "#F9F8FC",
  card: "#FFFFFF",
  border: "#E6E4EF",
  red: "#C4304A",
  redBg: "#FEF2F2",
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
  stock_disponible: number;
}

function StockBadge({ stock, cantidad }: { stock: number; cantidad: number }) {
  const libre = Math.max(0, stock - cantidad);
  if (stock <= 0) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
        color: C.red, background: "#FEF2F2", borderRadius: 4, padding: "2px 7px",
      }}>
        Sin stock
      </span>
    );
  }
  if (libre <= 3) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
        color: "#92400E", background: "#FFF7ED", borderRadius: 4, padding: "2px 7px",
      }}>
        ¡Últimas {stock}!
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color: C.sub, letterSpacing: ".04em",
    }}>
      {stock} disponibles
    </span>
  );
}

export default function Carrito() {
  const navigate   = useNavigate();
  const { showToast } = useToast();
  const [items, setItems]       = useState<ItemCarrito[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch]     = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const token   = authService.getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchCarrito = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/carrito`, { headers });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        setSelected(new Set(data.data.map((i: ItemCarrito) => i.id_carrito)));
        emitCartUpdate();
      }
    } catch {
      showToast("Error al cargar el carrito", "err");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCarrito(); }, [fetchCarrito]);

  const actualizarCantidad = (id_carrito: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const item = items.find(i => i.id_carrito === id_carrito);
    if (!item) return;
    if (nuevaCantidad > item.stock_disponible) {
      showToast(`Solo quedan ${item.stock_disponible} unidades disponibles`, "err");
      return;
    }
    const cantidadAnterior = item.cantidad;
    // Actualiza la UI de inmediato (optimistic update)
    setItems(prev => prev.map(i => i.id_carrito === id_carrito ? { ...i, cantidad: nuevaCantidad } : i));
    // Manda al servidor en segundo plano
    fetch(`${API_URL}/api/carrito/${id_carrito}`, {
      method: "PUT", headers,
      body: JSON.stringify({ cantidad: nuevaCantidad }),
    }).then(res => {
      if (!res.ok) throw new Error();
    }).catch(() => {
      // Si falla, revierte al número anterior
      setItems(prev => prev.map(i => i.id_carrito === id_carrito ? { ...i, cantidad: cantidadAnterior } : i));
      showToast("Error al actualizar cantidad", "err");
    });
  };

  const eliminar = async (id_carrito: number) => {
    setDeletingId(id_carrito);
    try {
      const res = await fetch(`${API_URL}/api/carrito/${id_carrito}`, { method: "DELETE", headers });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id_carrito !== id_carrito));
        setSelected(prev => { const s = new Set(prev); s.delete(id_carrito); return s; });
        showToast("Obra eliminada del carrito", "ok");
        emitCartUpdate();
      }
    } catch {
      showToast("Error al eliminar", "err");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleItem = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    const visible = filteredItems.map(i => i.id_carrito);
    const allVisibleSelected = visible.every(id => selected.has(id));
    if (allVisibleSelected) {
      setSelected(prev => { const s = new Set(prev); visible.forEach(id => s.delete(id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); visible.forEach(id => s.add(id)); return s; });
    }
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      i.titulo.toLowerCase().includes(q) ||
      i.artista_alias.toLowerCase().includes(q)
    );
  }, [items, search]);

  const allChecked  = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.id_carrito));
  const someChecked = filteredItems.some(i => selected.has(i.id_carrito)) && !allChecked;

  const itemsSeleccionados = useMemo(
    () => items.filter(i => selected.has(i.id_carrito)),
    [items, selected]
  );

  const totalSeleccionado = itemsSeleccionados.reduce(
    (sum, i) => sum + Number(i.precio_base) * i.cantidad, 0
  );

  const handleCheckout = () => {
    if (selected.size === 0) {
      showToast("Selecciona al menos una obra para continuar", "err");
      return;
    }
    sessionStorage.setItem("ids_carrito_checkout", JSON.stringify([...selected]));
    navigate("/checkout");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }

        .car-item {
          transition: box-shadow .25s ease, opacity .2s ease, background .18s ease;
        }
        .car-item:hover {
          box-shadow: 0 4px 20px rgba(20,18,30,.07);
          z-index: 1;
          position: relative;
        }
        .car-item.deselected { opacity: .5; }

        .car-checkbox {
          width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
          border: 2px solid ${C.border}; background: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s ease;
        }
        .car-checkbox.checked { background: ${C.orange}; border-color: ${C.orange}; }
        .car-checkbox.indeterminate { background: #fff; border-color: ${C.orange}; }
        .car-checkbox:hover { border-color: ${C.orange}; }

        .car-qty-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1.5px solid ${C.border};
          background: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s ease; color: ${C.ink};
        }
        .car-qty-btn:hover:not(:disabled) { border-color: ${C.orange}; color: ${C.orange}; background: #FFF4ED; }
        .car-qty-btn:disabled { opacity: .3; cursor: not-allowed; }

        .car-del-btn {
          width: 34px; height: 34px; border-radius: 8px;
          background: none; border: none; cursor: pointer; color: ${C.subLight};
          display: flex; align-items: center; justify-content: center;
          transition: color .18s, background .18s;
        }
        .car-del-btn:hover { color: ${C.red}; background: ${C.redBg}; }
        .car-del-btn:disabled { opacity: .4; cursor: not-allowed; }

        .checkout-btn {
          transition: background .22s ease, transform .15s ease, box-shadow .22s ease;
        }
        .checkout-btn:hover:not(:disabled) {
          background: #D4570A !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,100,12,.38);
        }
        .checkout-btn:disabled { opacity: .5; cursor: not-allowed; }
        .checkout-btn:active:not(:disabled) { transform: translateY(0); }

        .back-btn {
          display: flex; align-items: center; gap: 7px;
          background: none; border: none; cursor: pointer;
          font-family: ${SANS}; font-size: 13px; font-weight: 600;
          color: ${C.sub}; transition: color .18s;
        }
        .back-btn:hover { color: ${C.ink}; }

        .search-input {
          border: none; outline: none; background: transparent;
          font-family: ${SANS}; font-size: 13px; color: ${C.ink};
          width: 100%; min-width: 0;
        }
        .search-input::placeholder { color: ${C.subLight}; }

        .img-thumb { transition: transform .3s ease; }
        .car-item:hover .img-thumb { transform: scale(1.04); }

        .select-all-row {
          display: flex; align-items: center; gap: 14px;
          transition: background .18s;
          padding: 11px 20px;
          cursor: pointer;
          border-bottom: 1px solid ${C.border};
        }
        .select-all-row:hover { background: #FAFAFD; }

        .summary-item-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #F2F0F8;
        }
        .summary-item-row:last-child { border-bottom: none; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .car-item { animation: fadeSlideIn .28s ease both; }

        @keyframes shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>


      <main style={{
        maxWidth: 1020,
        margin: "0 auto",
        padding: "36px 24px",
        display: "grid",
        gridTemplateColumns: items.length > 0 ? "1fr 308px" : "1fr",
        gap: 24,
        alignItems: "start",
      }}>

        {/* ── Lista ── */}
        <div>

          {/* Título de sección */}
          {!loading && items.length > 0 && (
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 26, fontWeight: 900, color: C.ink, margin: 0, letterSpacing: "-.02em" }}>
                  Mi carrito
                </h1>
                {search && (
                  <p style={{ fontSize: 12, color: C.sub, margin: "4px 0 0", fontWeight: 500 }}>
                    {filteredItems.length} resultado{filteredItems.length !== 1 ? "s" : ""} para «{search}»
                  </p>
                )}
              </div>
              {selected.size > 0 && (
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                  {selected.size} de {items.length} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{
                  height: 108, borderRadius: 16,
                  background: `linear-gradient(90deg, #ece9f0 25%, #f5f3f8 50%, #ece9f0 75%)`,
                  backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                }} />
              ))}
            </div>

          ) : items.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: "55vh", textAlign: "center", padding: "40px 32px",
            }}>
              <div style={{ position: "relative", marginBottom: 24 }}>
                <div style={{
                  width: 84, height: 84, borderRadius: "50%",
                  background: "linear-gradient(135deg,#FDF3EC,#F9E8D8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(20,18,30,.08)",
                }}>
                  <ShoppingBag size={34} color={C.orange} strokeWidth={1.2} />
                </div>
                <div style={{
                  position: "absolute", top: -5, right: -5,
                  width: 20, height: 20, borderRadius: "50%",
                  background: C.orange, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", fontWeight: 900,
                }}>★</div>
              </div>

              <div style={{
                fontFamily: SERIF, fontStyle: "italic",
                fontSize: "clamp(26px,4vw,38px)", fontWeight: 900,
                color: C.ink, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 12,
              }}>
                Tu carrito está vacío
              </div>

              <div style={{
                width: 36, height: 2, borderRadius: 2,
                background: `linear-gradient(90deg,${C.orange},#A83B90)`,
                margin: "0 auto 16px",
              }} />

              <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 28, lineHeight: 1.75, maxWidth: 340 }}>
                Descubre obras únicas de artistas de la Huasteca Hidalguense
              </div>

              <button
                onClick={() => navigate("/catalogo")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: C.orange, color: "#fff", border: "none",
                  borderRadius: 100, padding: "13px 28px",
                  fontSize: 11, fontWeight: 700, letterSpacing: ".14em",
                  textTransform: "uppercase", cursor: "pointer", fontFamily: SANS,
                  boxShadow: `0 8px 24px ${C.orange}35`, transition: "background .18s, transform .18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d45a0a"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.orange; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
              >
                Explorar catálogo <ArrowRight size={13} strokeWidth={2.5} />
              </button>

              <div style={{ marginTop: 20, fontSize: 11, color: C.subLight, letterSpacing: ".04em", fontStyle: "italic" }}>
                Arte auténtico de la Huasteca Hidalguense
              </div>
            </div>

          ) : filteredItems.length === 0 ? (
            <div style={{
              background: C.card, borderRadius: 20, padding: "48px 32px", textAlign: "center",
              boxShadow: "0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055)",
            }}>
              <div style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>
                Sin resultados para «{search}»
              </div>
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "none", border: `1.5px solid ${C.border}`, borderRadius: 100,
                  padding: "8px 20px", fontSize: 12, fontWeight: 600, color: C.ink,
                  cursor: "pointer", fontFamily: SANS,
                }}
              >
                Limpiar búsqueda
              </button>
            </div>

          ) : (
            <div style={{
              background: C.card, borderRadius: 20,
              boxShadow: "0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055)",
              overflow: "hidden",
            }}>
              {/* ── Column headers ── */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "0 20px", height: 40,
                borderBottom: `1px solid ${C.border}`,
                background: "#FAFAFD",
              }}>
                {/* Checkbox select-all */}
                <div
                  className={`car-checkbox ${allChecked ? "checked" : someChecked ? "indeterminate" : ""}`}
                  onClick={toggleAll}
                  style={{ cursor: "pointer" }}
                >
                  {allChecked && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {someChecked && !allChecked && (
                    <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                      <rect y=".5" width="10" height="1" rx=".5" fill={C.orange}/>
                    </svg>
                  )}
                </div>
                {/* Producto col (thumbnail + info) */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 96, flexShrink: 0 }} /> {/* imagen placeholder */}
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sub }}>
                    Producto
                  </span>
                </div>
                <div style={{ minWidth: 86, textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sub }}>Precio</div>
                <div style={{ minWidth: 110, textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sub }}>Cant.</div>
                <div style={{ minWidth: 88, textAlign: "right", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sub }}>Total</div>
                <div style={{ width: 34, flexShrink: 0 }} />
              </div>

              {/* Items */}
              {filteredItems.map((item, idx) => {
                const isSelected = selected.has(item.id_carrito);
                const stock = Number(item.stock_disponible);
                const atLimit = item.cantidad >= stock;

                return (
                  <div
                    key={item.id_carrito}
                    className={`car-item${isSelected ? "" : " deselected"}`}
                    style={{
                      padding: "16px 20px",
                      display: "flex", gap: 14, alignItems: "center",
                      borderBottom: idx < filteredItems.length - 1 ? `1px solid ${C.border}` : "none",
                      animationDelay: `${idx * 55}ms`,
                      background: isSelected ? "#fff" : "#FAFAFD",
                    }}
                  >
                    {/* Checkbox */}
                    <div className={`car-checkbox${isSelected ? " checked" : ""}`} onClick={() => toggleItem(item.id_carrito)}>
                      {isSelected && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Thumbnail — más grande */}
                    <div
                      style={{
                        width: 96, height: 116, borderRadius: 12, overflow: "hidden",
                        flexShrink: 0, background: "#EDE9E3", cursor: "pointer",
                      }}
                      onClick={() => navigate(`/obras/${item.slug}`)}
                    >
                      {item.imagen_principal
                        ? <img className="img-thumb" src={item.imagen_principal} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingBag size={24} color={C.subLight} strokeWidth={1.5} />
                          </div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => navigate(`/obras/${item.slug}`)}
                        style={{
                          fontSize: 14, fontWeight: 700, color: C.ink,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          cursor: "pointer", marginBottom: 3,
                        }}
                      >
                        {item.titulo}
                      </div>
                      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8, fontWeight: 500 }}>
                        {item.artista_alias}
                      </div>
                      <StockBadge stock={stock} cantidad={item.cantidad} />
                    </div>

                    {/* Precio */}
                    <div style={{ textAlign: "center", flexShrink: 0, minWidth: 86 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: NEXA }}>
                        {fmt(Number(item.precio_base))}
                      </div>
                    </div>

                    {/* Cantidad */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 110, justifyContent: "center" }}>
                      <button className="car-qty-btn" onClick={() => actualizarCantidad(item.id_carrito, item.cantidad - 1)} disabled={item.cantidad <= 1} aria-label="Reducir">
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 22, textAlign: "center", color: C.ink }}>
                        {item.cantidad}
                      </span>
                      <button className="car-qty-btn" onClick={() => actualizarCantidad(item.id_carrito, item.cantidad + 1)} disabled={atLimit} aria-label="Aumentar">
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Total */}
                    <div style={{ minWidth: 88, textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>
                        {fmt(Number(item.precio_base) * item.cantidad)}
                      </div>
                    </div>

                    {/* Eliminar */}
                    <button
                      className="car-del-btn"
                      onClick={() => eliminar(item.id_carrito)}
                      disabled={deletingId === item.id_carrito}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Panel resumen ── */}
        {items.length > 0 && (
          <div style={{ position: "sticky", top: 80 }}>
            {/* Resumen card */}
            <div style={{
              background: C.card, borderRadius: 20, overflow: "hidden",
              boxShadow: "0 4px 24px rgba(20,18,30,.07), 0 0 0 1px rgba(20,18,30,.055)",
            }}>
              {/* Header del resumen */}
              <div style={{
                background: C.ink, padding: "18px 22px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{
                  fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: "#fff",
                  letterSpacing: "-.01em",
                }}>
                  Resumen de compra
                </span>
                {selected.size > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
                    color: C.orange, background: "rgba(232,100,12,.15)", borderRadius: 4, padding: "3px 8px",
                  }}>
                    {selected.size} {selected.size === 1 ? "obra" : "obras"}
                  </span>
                )}
              </div>

              <div style={{ padding: "20px 22px" }}>
                {/* Mini-lista seleccionados */}
                {itemsSeleccionados.length > 0 ? (
                  <div style={{ marginBottom: 18 }}>
                    {itemsSeleccionados.map(item => (
                      <div key={item.id_carrito} className="summary-item-row">
                        {/* Thumb mini */}
                        <div style={{
                          width: 36, height: 44, borderRadius: 6, overflow: "hidden",
                          flexShrink: 0, background: "#F0EDE8",
                        }}>
                          {item.imagen_principal && (
                            <img src={item.imagen_principal} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 600, color: C.ink,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            marginBottom: 2,
                          }}>
                            {item.titulo}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            {item.artista_alias}
                            {item.cantidad > 1 && <span style={{ color: C.subLight }}> ×{item.cantidad}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, flexShrink: 0 }}>
                          {fmt(Number(item.precio_base) * item.cantidad)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "20px 0 24px", marginBottom: 18,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "#F3F0F8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShoppingBag size={18} color={C.subLight} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, textAlign: "center", lineHeight: 1.5 }}>
                      Selecciona obras del carrito<br/>para ver el resumen
                    </div>
                  </div>
                )}

                {/* Totales */}
                <div style={{ borderTop: `1.5px solid ${C.border}`, paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{fmt(totalSeleccionado)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>Envío</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                      color: "#15803D", background: "#F0FDF4", borderRadius: 4, padding: "2px 7px",
                    }}>
                      A coordinar
                    </span>
                  </div>

                  {/* Total grande */}
                  <div style={{
                    background: C.bg, borderRadius: 12, padding: "14px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 18,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: ".08em" }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: C.orange, fontFamily: NEXA }}>
                      {fmt(totalSeleccionado)}
                    </span>
                  </div>

                  {/* CTA */}
                  <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={selected.size === 0}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 100,
                      background: selected.size === 0 ? C.border : C.orange,
                      color: selected.size === 0 ? C.sub : "#fff",
                      border: "none",
                      fontSize: 11, fontWeight: 800, letterSpacing: ".18em",
                      textTransform: "uppercase", cursor: selected.size === 0 ? "not-allowed" : "pointer",
                      fontFamily: SANS, display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8,
                    }}
                  >
                    {selected.size === 0
                      ? "Selecciona obras"
                      : `Pagar ${selected.size} ${selected.size === 1 ? "obra" : "obras"}`
                    }
                    {selected.size > 0 && <ArrowRight size={14} strokeWidth={2.5} />}
                  </button>

                  {/* Métodos de pago */}
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.subLight, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
                      Métodos aceptados
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* MercadoPago */}
                      <div style={{ background: "#009EE3", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <svg width="56" height="13" viewBox="0 0 112 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <text x="0" y="20" fill="white" fontFamily="Arial" fontWeight="700" fontSize="17">Mercado Pago</text>
                        </svg>
                      </div>
                      {/* OXXO */}
                      <div style={{ background: "#E8131A", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: ".06em", fontFamily: NEXA }}>OXXO</span>
                      </div>
                      {/* Visa */}
                      <div style={{ background: "#1A1F71", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: ".04em", fontStyle: "italic", fontFamily: NEXA }}>VISA</span>
                      </div>
                      {/* MC */}
                      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 9px", display: "flex", alignItems: "center", gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#EB001B" }} />
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F79E1B", marginLeft: -6 }} />
                      </div>
                    </div>
                  </div>

                  {/* Seguridad */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                      <path d="M6 1L1 3v4c0 2.761 2.239 5 5 5s5-2.239 5-5V3L6 1z" stroke={C.subLight} strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
                      <path d="M4 7l1.5 1.5L8 5.5" stroke={C.subLight} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 11, color: C.subLight, fontWeight: 500 }}>Pago seguro · 256-bit SSL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seguir explorando */}
            <button
              onClick={() => navigate("/catalogo")}
              style={{
                marginTop: 12, width: "100%", background: "none",
                border: `1.5px solid ${C.border}`, borderRadius: 100,
                padding: "11px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em",
                textTransform: "uppercase", color: C.sub, cursor: "pointer",
                fontFamily: SANS, transition: "border-color .18s, color .18s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ink; (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.sub; }}
            >
              Seguir explorando
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
