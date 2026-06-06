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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar estados
  useEffect(() => {
    fetch(`${API_URL}/api/estados`)
      .then(r => r.json())
      .then(d => { if (d.success) setEstados(d.data); })
      .catch(err => console.error("Error cargando estados", err));
  }, []);

  // Cargar municipios cuando cambia el estado
  useEffect(() => {
    if (direccion.id_estado > 0) {
      setCargandoMunicipios(true);
      fetch(`${API_URL}/api/municipios/${direccion.id_estado}`)
        .then(r => r.json())
        .then(d => {
          setMunicipios(d.success ? d.data : []);
          setDireccion(prev => ({ ...prev, id_municipio: 0 }));
        })
        .catch(() => setMunicipios([]))
        .finally(() => setCargandoMunicipios(false));
    } else {
      setMunicipios([]);
      setDireccion(prev => ({ ...prev, id_municipio: 0 }));
    }
  }, [direccion.id_estado]);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const validateForm = () => {
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

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setProcesando(true);

    try {
      const res = await fetch(`${API_URL}/api/ventas/checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id_direccion_envio: null }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al procesar el checkout");

      // Redirigir a MercadoPago (sandbox en desarrollo, init_point en producción)
      const urlPago = data.sandbox_init_point || data.init_point;
      if (!urlPago) throw new Error("No se recibió la URL de pago");

      window.location.href = urlPago;
    } catch (error: any) {
      showToast(error.message || "Error de conexión", "err");
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: C.sub }}>
        Cargando...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: SANS }}>
        <div style={{ fontSize: 16, color: C.ink }}>Tu carrito está vacío</div>
        <button
          onClick={() => navigate("/catalogo")}
          style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
        >
          Ir al catálogo
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS, padding: "40px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        input, select, textarea { box-sizing: border-box; }
        .mp-btn { transition: opacity .2s, transform .1s; }
        .mp-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .mp-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Formulario de dirección */}
        <div style={{ background: C.card, borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: NEXA, marginBottom: 6, color: C.ink }}>Dirección de envío</h1>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Ingresa dónde recibirás tu obra</p>

          <form onSubmit={handlePagar}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Calle *</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Insurgentes Sur"
                  value={direccion.calle}
                  onChange={e => setDireccion({ ...direccion, calle: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Número exterior *</label>
                <input
                  type="text"
                  placeholder="Ej: 1234"
                  value={direccion.numero_exterior}
                  onChange={e => setDireccion({ ...direccion, numero_exterior: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Número interior (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Depto 3B"
                  value={direccion.numero_interior}
                  onChange={e => setDireccion({ ...direccion, numero_interior: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Colonia *</label>
                <input
                  type="text"
                  placeholder="Ej: Del Valle"
                  value={direccion.colonia}
                  onChange={e => setDireccion({ ...direccion, colonia: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Código postal *</label>
                <input
                  type="text"
                  placeholder="Ej: 03100"
                  value={direccion.codigo_postal}
                  onChange={e => setDireccion({ ...direccion, codigo_postal: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Estado *</label>
                <select
                  value={direccion.id_estado}
                  onChange={e => setDireccion({ ...direccion, id_estado: Number(e.target.value), id_municipio: 0 })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS, background: "#fff" }}
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
                  onChange={e => setDireccion({ ...direccion, id_municipio: Number(e.target.value) })}
                  disabled={!direccion.id_estado || cargandoMunicipios}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS, background: "#fff", opacity: !direccion.id_estado ? 0.6 : 1 }}
                  required
                >
                  <option value={0}>{cargandoMunicipios ? "Cargando..." : "Selecciona un municipio"}</option>
                  {municipios.map(mun => (
                    <option key={mun.id_municipio} value={mun.id_municipio}>{mun.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.ink }}>Referencias (opcional)</label>
                <textarea
                  placeholder="Ej: Entre calles, color de la fachada, referencia cercana..."
                  value={direccion.referencias}
                  onChange={e => setDireccion({ ...direccion, referencias: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: SANS, resize: "vertical" }}
                />
              </div>
            </div>

            {/* Botón pagar con MercadoPago */}
            <button
              type="submit"
              disabled={procesando}
              className="mp-btn"
              style={{
                width: "100%",
                marginTop: 28,
                padding: "15px",
                background: procesando ? C.sub : "#009EE3",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: procesando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontFamily: SANS,
              }}
            >
              {procesando ? (
                "Preparando pago..."
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="11" fill="#fff" fillOpacity=".2"/>
                    <path d="M6 11.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Pagar con MercadoPago
                </>
              )}
            </button>
            <p style={{ fontSize: 11, color: C.sub, textAlign: "center", marginTop: 12 }}>
              🔒 Serás redirigido a MercadoPago para completar tu pago de forma segura
            </p>
          </form>
        </div>

        {/* Resumen del pedido */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)", position: "sticky", top: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.ink, fontFamily: NEXA }}>Resumen del pedido</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {items.map(item => (
              <div key={item.id_carrito} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <img
                  src={item.imagen_principal}
                  alt={item.titulo}
                  style={{ width: 52, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#ece9e4" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{item.artista_alias}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>x{item.cantidad}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, flexShrink: 0 }}>{fmt(item.subtotal)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `2px solid ${C.orange}` }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: C.orange, fontFamily: NEXA }}>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
