import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", ink: "#14121E", sub: "#9896A8",
  subLight: "#C4C2D0", bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const SANS = "'Outfit', sans-serif";
const NEXA = "'Nexa-Heavy', sans-serif";
const fmt  = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface ItemCarrito {
  id_carrito: number; id_obra: number; titulo: string; slug: string;
  imagen_principal: string; precio_base: string; cantidad: number;
  artista_alias: string; precio_unitario: number; subtotal: number;
}

// ── Íconos SVG de métodos de pago ──────────────────────────────
const IconMP = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
    <rect width="48" height="48" rx="10" fill="#009EE3"/>
    <path d="M8 24c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16S8 32.837 8 24z" fill="#009EE3"/>
    <path d="M24 13c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11z" fill="white" fillOpacity=".25"/>
    <text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">MP</text>
  </svg>
);

const IconVisa = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="6" fill="#1A1F71"/>
    <text x="24" y="22" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="1">VISA</text>
  </svg>
);

const IconMC = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="6" fill="#252525"/>
    <circle cx="19" cy="16" r="9" fill="#EB001B"/>
    <circle cx="29" cy="16" r="9" fill="#F79E1B"/>
    <path d="M24 9.3a9 9 0 010 13.4A9 9 0 0124 9.3z" fill="#FF5F00"/>
  </svg>
);

const IconOXXO = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="6" fill="#DA0303"/>
    <text x="24" y="21" textAnchor="middle" fontSize="11" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="0.5">OXXO</text>
  </svg>
);

const IconAmex = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="6" fill="#007BC1"/>
    <text x="24" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="white" fontFamily="Arial">AMERICAN</text>
    <text x="24" y="30" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial">EXPRESS</text>
  </svg>
);

const IconSpei = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="6" fill="#0F4C81"/>
    <text x="24" y="21" textAnchor="middle" fontSize="11" fontWeight="900" fill="white" fontFamily="Arial">SPEI</text>
  </svg>
);

export default function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems]         = useState<ItemCarrito[]>([]);
  const [loading, setLoading]     = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [direccion, setDireccion] = useState({
    calle: "", numero_exterior: "", numero_interior: "",
    colonia: "", codigo_postal: "", id_estado: 0, id_municipio: 0, referencias: "",
  });

  const [estados, setEstados]       = useState<{ id_estado: number; nombre: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ id_municipio: number; nombre: string }[]>([]);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const token   = authService.getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchCarrito = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/carrito`, { headers });
        const data = await res.json();
        if (data.success) {
          const idsRaw = sessionStorage.getItem("ids_carrito_checkout");
          const idsSeleccionados: number[] | null = idsRaw ? JSON.parse(idsRaw) : null;
          const todos = data.data.map((item: ItemCarrito) => ({
            ...item,
            precio_unitario: Number(item.precio_base),
            subtotal: Number(item.precio_base) * item.cantidad,
          }));
          const filtrados = idsSeleccionados
            ? todos.filter((i: ItemCarrito) => idsSeleccionados.includes(i.id_carrito))
            : todos;
          setItems(filtrados.length > 0 ? filtrados : todos);
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

  useEffect(() => {
    fetch(`${API_URL}/api/estados`).then(r => r.json())
      .then(d => { if (d.success) setEstados(d.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (direccion.id_estado > 0) {
      setCargandoMunicipios(true);
      fetch(`${API_URL}/api/municipios/${direccion.id_estado}`).then(r => r.json())
        .then(d => { setMunicipios(d.success ? d.data : []); setDireccion(p => ({ ...p, id_municipio: 0 })); })
        .catch(() => setMunicipios([]))
        .finally(() => setCargandoMunicipios(false));
    } else {
      setMunicipios([]); setDireccion(p => ({ ...p, id_municipio: 0 }));
    }
  }, [direccion.id_estado]);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const validateForm = () => {
    if (!direccion.calle.trim() || !direccion.numero_exterior.trim() || !direccion.colonia.trim() || !direccion.codigo_postal.trim()) {
      showToast("Completa los campos obligatorios de la dirección", "err"); return false;
    }
    if (!direccion.id_estado) { showToast("Selecciona un estado", "err"); return false; }
    if (!direccion.id_municipio) { showToast("Selecciona un municipio", "err"); return false; }
    return true;
  };

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setProcesando(true);
    try {
      const dirRes = await fetch(`${API_URL}/api/direcciones`, {
        method: "POST", headers,
        body: JSON.stringify({
          calle: direccion.calle.trim(), numero_exterior: direccion.numero_exterior.trim(),
          numero_interior: direccion.numero_interior.trim() || null,
          colonia: direccion.colonia.trim(), codigo_postal: direccion.codigo_postal.trim(),
          id_estado: direccion.id_estado, id_municipio: direccion.id_municipio,
          referencias: direccion.referencias.trim() || null,
        }),
      });
      const dirData = await dirRes.json();
      if (!dirRes.ok || !dirData.success) throw new Error(dirData.message || "Error al guardar la dirección");

      const idsRaw     = sessionStorage.getItem("ids_carrito_checkout");
      const ids_carrito = idsRaw ? JSON.parse(idsRaw) : null;
      sessionStorage.removeItem("ids_carrito_checkout");

      const res  = await fetch(`${API_URL}/api/ventas/checkout`, {
        method: "POST", headers,
        body: JSON.stringify({ id_direccion_envio: dirData.id_direccion, ...(ids_carrito ? { ids_carrito } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al procesar el checkout");
      const urlPago = data.sandbox_init_point || data.init_point;
      if (!urlPago) throw new Error("No se recibió la URL de pago");
      window.location.href = urlPago;
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Error de conexión", "err");
      setProcesando(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", padding: "13px 14px", borderRadius: 12, boxSizing: "border-box",
    border: `1.5px solid ${focusedField === field ? C.orange : C.border}`,
    fontSize: 14, fontFamily: SANS, outline: "none", background: "#fff",
    transition: "border-color .18s",
    color: C.ink,
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6,
    color: C.sub, letterSpacing: ".06em", textTransform: "uppercase",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: C.sub, fontSize: 14 }}>
      Cargando...
    </div>
  );

  if (items.length === 0) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: SANS }}>
      <div style={{ fontSize: 16, color: C.ink }}>Tu carrito está vacío</div>
      <button onClick={() => navigate("/catalogo")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 100, padding: "11px 24px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: SANS }}>
        Ir al catálogo
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'Nexa-Heavy'; src: url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        input, select, textarea { box-sizing: border-box; }
        .pay-btn { transition: background .2s, transform .15s, box-shadow .2s; }
        .pay-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,158,227,.4); }
        .pay-btn:active:not(:disabled) { transform: translateY(0); }
        .pay-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ck-grid { max-width: 1040px; margin: 0 auto; display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; padding: 36px 24px 60px; }
        .ck-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 780px) {
          .ck-grid { grid-template-columns: 1fr; padding: 20px 16px 48px; }
          .ck-summary { order: -1; }
          .ck-cols { grid-template-columns: 1fr; }
        }
        .method-icon { transition: transform .15s, box-shadow .15s; border-radius: 8px; }
        .method-icon:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
      `}</style>


      <div className="ck-grid">

        {/* ── Columna izquierda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Tarjeta: Dirección */}
          <div style={{ background: C.card, borderRadius: 20, padding: "28px 28px 32px", boxShadow: "0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF1E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color={C.orange} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: NEXA }}>Dirección de envío</div>
                <div style={{ fontSize: 12, color: C.sub }}>Ingresa dónde recibirás tu obra</div>
              </div>
            </div>

            <form onSubmit={handlePagar}>
              <div className="ck-cols">
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Calle *</label>
                  <input type="text" placeholder="Ej: Av. Insurgentes Sur" value={direccion.calle}
                    onChange={e => setDireccion({ ...direccion, calle: e.target.value })}
                    onFocus={() => setFocusedField("calle")} onBlur={() => setFocusedField(null)}
                    style={inputStyle("calle")} required />
                </div>
                <div>
                  <label style={labelStyle}>Número exterior *</label>
                  <input type="text" placeholder="Ej: 1234" value={direccion.numero_exterior}
                    onChange={e => setDireccion({ ...direccion, numero_exterior: e.target.value })}
                    onFocus={() => setFocusedField("num_ext")} onBlur={() => setFocusedField(null)}
                    style={inputStyle("num_ext")} required />
                </div>
                <div>
                  <label style={labelStyle}>Número interior <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
                  <input type="text" placeholder="Ej: Depto 3B" value={direccion.numero_interior}
                    onChange={e => setDireccion({ ...direccion, numero_interior: e.target.value })}
                    onFocus={() => setFocusedField("num_int")} onBlur={() => setFocusedField(null)}
                    style={inputStyle("num_int")} />
                </div>
                <div>
                  <label style={labelStyle}>Colonia *</label>
                  <input type="text" placeholder="Ej: Del Valle" value={direccion.colonia}
                    onChange={e => setDireccion({ ...direccion, colonia: e.target.value })}
                    onFocus={() => setFocusedField("colonia")} onBlur={() => setFocusedField(null)}
                    style={inputStyle("colonia")} required />
                </div>
                <div>
                  <label style={labelStyle}>Código postal *</label>
                  <input type="text" placeholder="Ej: 03100" value={direccion.codigo_postal}
                    onChange={e => setDireccion({ ...direccion, codigo_postal: e.target.value })}
                    onFocus={() => setFocusedField("cp")} onBlur={() => setFocusedField(null)}
                    style={inputStyle("cp")} required />
                </div>
                <div>
                  <label style={labelStyle}>Estado *</label>
                  <select value={direccion.id_estado}
                    onChange={e => setDireccion({ ...direccion, id_estado: Number(e.target.value), id_municipio: 0 })}
                    onFocus={() => setFocusedField("estado")} onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle("estado"), background: "#fff" }} required>
                    <option value={0}>Selecciona un estado</option>
                    {estados.map(est => <option key={est.id_estado} value={est.id_estado}>{est.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Municipio *</label>
                  <select value={direccion.id_municipio}
                    onChange={e => setDireccion({ ...direccion, id_municipio: Number(e.target.value) })}
                    disabled={!direccion.id_estado || cargandoMunicipios}
                    onFocus={() => setFocusedField("municipio")} onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle("municipio"), background: "#fff", opacity: !direccion.id_estado ? 0.5 : 1 }} required>
                    <option value={0}>{cargandoMunicipios ? "Cargando..." : "Selecciona un municipio"}</option>
                    {municipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Referencias <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
                  <textarea placeholder="Ej: Entre calles, color de la fachada, referencia cercana..."
                    value={direccion.referencias} rows={3}
                    onChange={e => setDireccion({ ...direccion, referencias: e.target.value })}
                    onFocus={() => setFocusedField("ref")} onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle("ref"), resize: "vertical" }} />
                </div>
              </div>

              {/* ── Métodos de pago aceptados ── */}
              <div style={{ marginTop: 28, padding: "20px", background: "#F9F8FC", borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>
                  Métodos de pago aceptados vía MercadoPago
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div className="method-icon"><IconMP /></div>
                  <div className="method-icon"><IconVisa /></div>
                  <div className="method-icon"><IconMC /></div>
                  <div className="method-icon"><IconAmex /></div>
                  <div className="method-icon"><IconOXXO /></div>
                  <div className="method-icon"><IconSpei /></div>
                </div>
                <div style={{ fontSize: 11, color: C.subLight, marginTop: 10, lineHeight: 1.5 }}>
                  Tarjetas de crédito/débito, transferencia bancaria, efectivo en OXXO y más.
                </div>
              </div>

              {/* ── Botón pagar ── */}
              <button type="submit" disabled={procesando} className="pay-btn"
                style={{
                  width: "100%", marginTop: 20, padding: "16px",
                  background: "#009EE3", color: "#fff", border: "none",
                  borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10, fontFamily: SANS,
                }}>
                {procesando ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Preparando pago...
                  </>
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="24" fill="white" fillOpacity=".2"/>
                      <text x="24" y="29" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white" fontFamily="Arial">MP</text>
                    </svg>
                    Continuar con MercadoPago
                  </>
                )}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
                <ShieldCheck size={13} color={C.subLight} strokeWidth={1.8} />
                <span style={{ fontSize: 11, color: C.subLight }}>
                  Pago 100% seguro · Tus datos están protegidos
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* ── Columna derecha: resumen ── */}
        <div className="ck-summary" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>

          {/* Obras */}
          <div style={{ background: C.card, borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 16 }}>
              Resumen del pedido
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {items.map(item => (
                <div key={item.id_carrito} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 52, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#EDE9E3", position: "relative" }}>
                    <img src={item.imagen_principal} alt={item.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {item.cantidad > 1 && (
                      <div style={{
                        position: "absolute", top: 2, right: 2,
                        background: C.ink, color: "#fff",
                        fontSize: 9, fontWeight: 700, borderRadius: 100,
                        padding: "1px 5px",
                      }}>×{item.cantidad}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{item.artista_alias}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, flexShrink: 0 }}>{fmt(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: C.sub }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: C.ink }}>{fmt(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>Envío</span>
                <span style={{ color: C.subLight, fontSize: 12 }}>A coordinar</span>
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${C.orange}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.orange, fontFamily: NEXA }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Envío info */}
          <div style={{ background: C.card, borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(20,18,30,.05), 0 0 0 1px rgba(20,18,30,.055)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Truck size={18} color={C.orange} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 3 }}>Envío personalizado</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                  El costo y tiempo de envío se coordinará directamente con el artista una vez confirmado tu pago.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
