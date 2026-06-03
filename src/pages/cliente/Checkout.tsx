import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  ink: "#14121E",
  sub: "#9896A8",
  bg: "#F9F8FC",
  card: "#FFFFFF",
  border: "#E6E4EF",
};

const SANS = "'Outfit', sans-serif";
const NEXA = "'Nexa-Heavy', sans-serif";

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
  precio_unitario: number;
  subtotal: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Datos de tarjeta (simulación)
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Dirección de envío
  const [direccion, setDireccion] = useState({
    calle: "",
    numero_exterior: "",
    numero_interior: "",
    colonia: "",
    codigo_postal: "",
    id_estado: 0,
    id_municipio: 0,
    referencias: "",
  });

  // Catálogos
  const [estados, setEstados] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);

  const token = authService.getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Cargar carrito
  useEffect(() => {
    const fetchCarrito = async () => {
      try {
        const res = await fetch(`${API_URL}/api/carrito`, { headers });
        const data = await res.json();
        if (data.success) {
          const itemsConPrecio = data.data.map((item: any) => ({
            ...item,
            precio_unitario: Number(item.precio_base),
            subtotal: Number(item.precio_base) * item.cantidad,
          }));
          setItems(itemsConPrecio);
        } else {
          showToast("Error al cargar el carrito", "err");
          navigate("/mi-cuenta/carrito");
        }
      } catch {
        showToast("Error de conexión", "err");
        navigate("/mi-cuenta/carrito");
      } finally {
        setLoading(false);
      }
    };
    fetchCarrito();
  }, []);

  // Cargar estados
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch(`${API_URL}/api/estados`);
        const data = await res.json();
        if (data.success) setEstados(data.data);
      } catch (error) {
        console.error("Error cargando estados", error);
      }
    };
    fetchEstados();
  }, []);

  // Cargar municipios cuando cambia el estado
  useEffect(() => {
    if (direccion.id_estado > 0) {
      const fetchMunicipios = async () => {
        setCargandoMunicipios(true);
        try {
          const res = await fetch(`${API_URL}/api/municipios/${direccion.id_estado}`);
          const data = await res.json();
          if (data.success) {
            setMunicipios(data.data);
            setDireccion(prev => ({ ...prev, id_municipio: 0 }));
          } else {
            setMunicipios([]);
          }
        } catch (error) {
          console.error("Error cargando municipios", error);
          setMunicipios([]);
        } finally {
          setCargandoMunicipios(false);
        }
      };
      fetchMunicipios();
    } else {
      setMunicipios([]);
      setDireccion(prev => ({ ...prev, id_municipio: 0 }));
    }
  }, [direccion.id_estado]);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const validateForm = () => {
    const cardRegex = /^\d{16}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/(2[3-9]|[3-9][0-9])$/;
    const cvvRegex = /^\d{3,4}$/;
    if (!cardRegex.test(cardNumber.replace(/\s/g, ""))) {
      showToast("Número de tarjeta inválido (16 dígitos)", "err");
      return false;
    }
    if (!expiryRegex.test(expiry)) {
      showToast("Fecha de expiración inválida (MM/AA)", "err");
      return false;
    }
    if (!cvvRegex.test(cvv)) {
      showToast("CVV inválido (3 o 4 dígitos)", "err");
      return false;
    }
    if (cardName.trim().length < 3) {
      showToast("Nombre del titular es requerido", "err");
      return false;
    }
    if (!direccion.calle.trim() || !direccion.numero_exterior.trim() || !direccion.colonia.trim() || !direccion.codigo_postal.trim()) {
      showToast("Completa los campos obligatorios de la dirección", "err");
      return false;
    }
    if (direccion.id_estado === 0) {
      showToast("Selecciona un estado", "err");
      return false;
    }
    if (direccion.id_municipio === 0) {
      showToast("Selecciona un municipio", "err");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setProcesando(true);

    try {
      // Guardar dirección
      const dirRes = await fetch(`${API_URL}/api/direcciones`, {
        method: "POST",
        headers,
        body: JSON.stringify(direccion),
      });
      const dirData = await dirRes.json();
      if (!dirRes.ok) throw new Error(dirData.message || "Error al guardar dirección");
      const id_direccion_envio = dirData.id_direccion;

      // Simular pago
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Crear orden
      const res = await fetch(`${API_URL}/api/ventas`, {
        method: "POST",
        headers,
        body: JSON.stringify({ items, id_direccion_envio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear la orden");

      showToast("¡Pago exitoso! Tu pedido ha sido registrado.", "ok");
      navigate("/mi-cuenta/pedidos");
    } catch (error: any) {
      showToast(error.message || "Error de conexión", "err");
    } finally {
      setProcesando(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    setCardNumber(value.replace(/(\d{4})(?=\d)/g, "$1 "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2, 4);
    setExpiry(value.slice(0, 5));
  };

  if (loading) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando...</div>;
  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div>Tu carrito está vacío</div>
        <button onClick={() => navigate("/catalogo")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "10px 20px", cursor: "pointer" }}>Ir al catálogo</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* Formulario de pago y dirección */}
        <div style={{ background: C.card, borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: NEXA, marginBottom: 24 }}>Detalles de pago</h1>
          <form onSubmit={handleSubmit}>
            {/* Datos de la tarjeta */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Número de tarjeta</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                required
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Fecha expiración</label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Nombre del titular</label>
              <input
                type="text"
                placeholder="Como aparece en la tarjeta"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                required
              />
            </div>

            <hr style={{ margin: "20px 0", border: `1px solid ${C.border}` }} />

            {/* Dirección de envío mejorada */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: C.ink }}>Dirección de envío</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Calle *</label>
                  <input
                    type="text"
                    placeholder="Ej: Carretera Huejutla-Chalahuiyapa"
                    value={direccion.calle}
                    onChange={e => setDireccion({...direccion, calle: e.target.value})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Número exterior *</label>
                  <input
                    type="text"
                    placeholder="Ej: 12"
                    value={direccion.numero_exterior}
                    onChange={e => setDireccion({...direccion, numero_exterior: e.target.value})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Número interior (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 1B"
                    value={direccion.numero_interior}
                    onChange={e => setDireccion({...direccion, numero_interior: e.target.value})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Colonia *</label>
                  <input
                    type="text"
                    placeholder="Ej: Centro"
                    value={direccion.colonia}
                    onChange={e => setDireccion({...direccion, colonia: e.target.value})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Código postal *</label>
                  <input
                    type="text"
                    placeholder="Ej: 43000"
                    value={direccion.codigo_postal}
                    onChange={e => setDireccion({...direccion, codigo_postal: e.target.value})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Estado *</label>
                  <select
                    value={direccion.id_estado}
                    onChange={e => setDireccion({...direccion, id_estado: Number(e.target.value), id_municipio: 0})}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, background: "white" }}
                    required
                  >
                    <option value={0}>Selecciona un estado</option>
                    {estados.map(est => (
                      <option key={est.id_estado} value={est.id_estado}>{est.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Municipio *</label>
                  <select
                    value={direccion.id_municipio}
                    onChange={e => setDireccion({...direccion, id_municipio: Number(e.target.value)})}
                    disabled={!direccion.id_estado || cargandoMunicipios}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      background: "white",
                      opacity: !direccion.id_estado ? 0.6 : 1
                    }}
                    required
                  >
                    <option value={0}>{cargandoMunicipios ? "Cargando municipios..." : "Selecciona un municipio"}</option>
                    {municipios.map(mun => (
                      <option key={mun.id_municipio} value={mun.id_municipio}>{mun.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Referencias (opcional)</label>
                  <textarea
                    placeholder="Ej: Entre calles, cerca de un parque, referencia de domicilio..."
                    value={direccion.referencias}
                    onChange={e => setDireccion({...direccion, referencias: e.target.value})}
                    rows={3}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={procesando}
              style={{
                width: "100%",
                padding: "14px",
                background: procesando ? C.sub : C.orange,
                color: "#fff",
                border: "none",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                cursor: procesando ? "not-allowed" : "pointer",
                transition: "background .2s",
              }}
            >
              {procesando ? "Procesando pago..." : "Pagar ahora"}
            </button>
            <p style={{ fontSize: 11, color: C.sub, textAlign: "center", marginTop: 16 }}>🔒 Pago 100% seguro (simulación). Tus datos no se almacenan.</p>
          </form>
        </div>

        {/* Resumen del pedido (sticky) */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, height: "fit-content", position: "sticky", top: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Resumen del pedido</h2>
          {items.map(item => (
            <div key={item.id_carrito} style={{ display: "flex", gap: 12, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
              <img src={item.imagen_principal} alt={item.titulo} style={{ width: 50, height: 60, objectFit: "cover", borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.titulo}</div>
                <div style={{ fontSize: 11, color: C.sub }}>x{item.cantidad}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{fmt(item.precio_unitario)}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</div>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${C.orange}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
              <span>Total</span>
              <span style={{ color: C.orange }}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}