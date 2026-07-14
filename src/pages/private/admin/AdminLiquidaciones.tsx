import { useState, useEffect } from "react";
import { DollarSign, Clock, CheckCircle, ChevronRight, X, RefreshCw, ArrowLeft } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", green:"#0E8A50", red:"#C4304A", gold:"#A87006", blue:"#2D6FBE",
  cream:"#14121E", creamSub:"#5A5870", creamMut:"#9896A8",
  bg:"#F9F8FC", card:"#FFFFFF", border:"#E6E4EF",
};
const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` };
}
const fmtMXN = (n: number | string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(Number(n) ?? 0);
const fmtDate = (s: string) => new Date(s).toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"numeric" });

interface Pendiente {
  id_artista: number; nombre: string; correo: string;
  porcentaje_comision: number; ventas_pendientes: number;
  monto_pendiente: string; venta_mas_antigua: string;
}
interface Liquidacion {
  id_liquidacion: number; monto_total: string; fecha_liquidacion: string;
  notas: string|null; comprobante_url: string|null;
  artista_nombre: string; artista_correo: string;
  admin_nombre: string; ventas_incluidas: number;
}
interface DetalleVenta {
  id_venta: number; fecha_venta: string; subtotal: string;
  monto_artista: string; estado: string; obra_titulo: string;
}

type Vista = "pendientes" | "historial" | "detalle";

export default function AdminLiquidaciones() {
  const { showToast } = useToast();
  const [vista,      setVista]      = useState<Vista>("pendientes");
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [historial,  setHistorial]  = useState<Liquidacion[]>([]);
  const [loading,    setLoading]    = useState(true);

  const [detalleArtista, setDetalleArtista] = useState<Pendiente | null>(null);
  const [detalleVentas,  setDetalleVentas]  = useState<DetalleVenta[]>([]);
  const [detalleTotal,   setDetalleTotal]   = useState(0);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [modalLiq,   setModalLiq]   = useState(false);
  const [notasLiq,   setNotasLiq]   = useState("");
  const [compLiq,    setCompLiq]    = useState("");
  const [saving,     setSaving]     = useState(false);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/liquidaciones/pendientes`, { headers: authH() });
      const d = await r.json();
      if (d.success) setPendientes(d.data);
    } catch { showToast("Error al cargar pendientes", "err"); }
    finally { setLoading(false); }
  };

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/liquidaciones/historial`, { headers: authH() });
      const d = await r.json();
      if (d.success) setHistorial(d.data);
    } catch { showToast("Error al cargar historial", "err"); }
    finally { setLoading(false); }
  };

  const verDetalle = async (p: Pendiente) => {
    setDetalleArtista(p);
    setVista("detalle");
    setLoadingDetalle(true);
    try {
      const r = await fetch(`${API}/api/admin/liquidaciones/artista/${p.id_artista}`, { headers: authH() });
      const d = await r.json();
      if (d.success) {
        setDetalleVentas(d.data.pendientes);
        setDetalleTotal(d.data.total_pendiente);
      }
    } catch { showToast("Error al cargar detalle", "err"); }
    finally { setLoadingDetalle(false); }
  };

  const liquidar = async () => {
    if (!detalleArtista) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/liquidaciones`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({
          id_artista: detalleArtista.id_artista,
          notas: notasLiq || null,
          comprobante_url: compLiq || null,
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(d.message, "ok");
        setModalLiq(false); setNotasLiq(""); setCompLiq("");
        setVista("pendientes"); cargarPendientes();
      } else showToast(d.message, "err");
    } catch { showToast("Error al registrar liquidacion", "err"); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (vista === "pendientes") cargarPendientes();
    if (vista === "historial")  cargarHistorial();
  }, [vista]);

  const totalPendiente = pendientes.reduce((s, p) => s + Number(p.monto_pendiente), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .adm-liq { font-family:${FB}; background:${C.bg}; min-height:100vh; padding:28px 24px; }
        .tabs { display:flex; gap:4px; margin-bottom:24px; background:${C.card}; border:1px solid ${C.border}; border-radius:10px; padding:4px; width:fit-content; }
        .tab { padding:7px 16px; border-radius:7px; font-size:13px; font-weight:500; cursor:pointer; border:none; background:none; color:${C.creamSub}; font-family:${FB}; }
        .tab.active { background:${C.orange}; color:#fff; font-weight:600; }
        .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:24px; }
        .kpi { background:${C.card}; border-radius:10px; padding:16px; box-shadow:${CS}; }
        .kpi-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:${C.creamMut}; margin-bottom:6px; }
        .kpi-val { font-family:${FM}; font-size:26px; font-weight:700; letter-spacing:-0.02em; }
        .table-card { background:${C.card}; border-radius:12px; box-shadow:${CS}; overflow:hidden; }
        table { width:100%; border-collapse:collapse; }
        th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:${C.creamMut}; padding:10px 16px; text-align:left; background:${C.bg}; border-bottom:1px solid ${C.border}; }
        td { padding:13px 16px; font-size:13px; color:${C.cream}; border-bottom:1px solid ${C.border}; vertical-align:middle; }
        tr:last-child td { border-bottom:none; }
        tr:hover td { background:rgba(0,0,0,0.012); }
        .monto-pend { font-family:${FM}; font-size:15px; font-weight:700; color:${C.orange}; }
        .btn-liq { background:${C.green}; color:#fff; border:none; border-radius:7px; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; font-family:${FB}; }
        .btn-liq:hover { opacity:.9; }
        .btn-ver { background:none; border:1px solid ${C.border}; border-radius:7px; padding:6px 12px; font-size:12px; color:${C.creamSub}; cursor:pointer; display:flex; align-items:center; gap:4px; font-family:${FB}; }
        .btn-ver:hover { border-color:${C.orange}; color:${C.orange}; }
        .icon-btn { background:none; border:1px solid ${C.border}; border-radius:6px; padding:5px 8px; cursor:pointer; display:flex; align-items:center; color:${C.creamSub}; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:9000; padding:20px; }
        .modal { background:${C.card}; border-radius:14px; width:100%; max-width:460px; box-shadow:0 20px 60px rgba(0,0,0,0.18); }
        .modal-header { padding:20px 24px 16px; border-bottom:1px solid ${C.border}; display:flex; align-items:center; justify-content:space-between; }
        .modal-title { font-size:15px; font-weight:700; color:${C.cream}; }
        .modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
        .modal-footer { padding:16px 24px; border-top:1px solid ${C.border}; display:flex; gap:8px; justify-content:flex-end; }
        .field label { font-size:11px; font-weight:600; color:${C.creamSub}; text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:5px; }
        .field input, .field textarea { width:100%; border:1px solid ${C.border}; border-radius:7px; padding:8px 10px; font-size:13px; font-family:${FB}; color:${C.cream}; background:${C.bg}; outline:none; box-sizing:border-box; }
        .field input:focus, .field textarea:focus { border-color:${C.green}; }
        .btn-cancel { background:none; border:1px solid ${C.border}; border-radius:8px; padding:8px 16px; font-size:13px; color:${C.creamSub}; cursor:pointer; font-family:${FB}; }
        .btn-confirm { background:${C.green}; color:#fff; border:none; border-radius:8px; padding:8px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:${FB}; }
        .monto-box { background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; }
      `}</style>

      <div className="adm-liq">
        {vista === "detalle" && detalleArtista ? (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <button className="icon-btn" onClick={() => setVista("pendientes")}><ArrowLeft size={14}/></button>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:C.cream, margin:0 }}>{detalleArtista.nombre}</h1>
                <p style={{ fontSize:12, color:C.creamSub, margin:0 }}>{detalleArtista.correo} &middot; Comision {detalleArtista.porcentaje_comision}%</p>
              </div>
            </div>

            <div className="monto-box" style={{ marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:"#166534", marginBottom:4 }}>Total pendiente</div>
                <div style={{ fontFamily:FM, fontSize:28, fontWeight:700, color:C.green }}>{fmtMXN(detalleTotal)}</div>
                <div style={{ fontSize:11, color:"#166534" }}>{detalleVentas.length} ventas sin liquidar</div>
              </div>
              <button className="btn-liq" style={{ padding:"10px 20px", fontSize:13 }} onClick={() => setModalLiq(true)} disabled={detalleVentas.length === 0}>
                <CheckCircle size={14}/>Registrar pago
              </button>
            </div>

            <div className="table-card">
              {loadingDetalle ? (
                <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>Cargando ventas...</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Obra</th>
                        <th>Fecha venta</th>
                        <th>Subtotal</th>
                        <th>Le corresponde</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVentas.map(v => (
                        <tr key={v.id_venta}>
                          <td style={{ fontWeight:500 }}>{v.obra_titulo}</td>
                          <td style={{ color:C.creamSub, fontSize:12 }}>{fmtDate(v.fecha_venta)}</td>
                          <td style={{ fontFamily:FM, fontSize:13 }}>{fmtMXN(v.subtotal)}</td>
                          <td><span style={{ fontFamily:FM, fontSize:14, fontWeight:700, color:C.green }}>{fmtMXN(v.monto_artista)}</span></td>
                          <td><span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:4, background:"#D1FAE5", color:"#065F46" }}>{v.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h1 style={{ fontSize:24, fontWeight:700, color:C.cream, margin:0 }}>Liquidaciones</h1>
              <button className="icon-btn" onClick={() => vista === "pendientes" ? cargarPendientes() : cargarHistorial()}><RefreshCw size={14}/></button>
            </div>

            <div className="tabs">
              <button className={`tab ${vista === "pendientes" ? "active" : ""}`} onClick={() => setVista("pendientes")}>Pendientes</button>
              <button className={`tab ${vista === "historial"  ? "active" : ""}`} onClick={() => setVista("historial")}>Historial</button>
            </div>

            {vista === "pendientes" && (
              <>
                <div className="kpi-grid">
                  <div className="kpi">
                    <div className="kpi-label">Artistas con saldo</div>
                    <div className="kpi-val" style={{ color:C.cream }}>{pendientes.length}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Total a liquidar</div>
                    <div className="kpi-val" style={{ color:C.orange, fontSize:22 }}>{fmtMXN(totalPendiente)}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Ventas incluidas</div>
                    <div className="kpi-val" style={{ color:C.cream }}>{pendientes.reduce((s,p) => s + Number(p.ventas_pendientes), 0)}</div>
                  </div>
                </div>

                <div className="table-card">
                  {loading ? (
                    <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>Cargando...</div>
                  ) : pendientes.length === 0 ? (
                    <div style={{ padding:48, textAlign:"center" }}>
                      <CheckCircle size={36} color={C.green} style={{ marginBottom:10 }}/>
                      <p style={{ color:C.creamSub, fontSize:14, fontWeight:500 }}>Todo liquidado. No hay saldos pendientes.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX:"auto" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Artista</th>
                            <th>Ventas</th>
                            <th>Venta mas antigua</th>
                            <th>Monto pendiente</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendientes.map(p => (
                            <tr key={p.id_artista}>
                              <td>
                                <div style={{ fontWeight:600 }}>{p.nombre}</div>
                                <div style={{ fontSize:11, color:C.creamSub }}>{p.correo}</div>
                              </td>
                              <td style={{ fontFamily:FM, fontWeight:600 }}>{p.ventas_pendientes}</td>
                              <td style={{ fontSize:12, color:C.creamSub }}>{p.venta_mas_antigua ? fmtDate(p.venta_mas_antigua) : "N/A"}</td>
                              <td><span className="monto-pend">{fmtMXN(p.monto_pendiente)}</span></td>
                              <td>
                                <button className="btn-ver" onClick={() => verDetalle(p)}>
                                  Ver detalle <ChevronRight size={12}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {vista === "historial" && (
              <div className="table-card">
                {loading ? (
                  <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>Cargando...</div>
                ) : historial.length === 0 ? (
                  <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>No hay liquidaciones registradas.</div>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Artista</th>
                          <th>Fecha</th>
                          <th>Ventas</th>
                          <th>Monto liquidado</th>
                          <th>Registrado por</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map(l => (
                          <tr key={l.id_liquidacion}>
                            <td>
                              <div style={{ fontWeight:600 }}>{l.artista_nombre}</div>
                              <div style={{ fontSize:11, color:C.creamSub }}>{l.artista_correo}</div>
                            </td>
                            <td style={{ fontSize:12, color:C.creamSub }}>{fmtDate(l.fecha_liquidacion)}</td>
                            <td style={{ fontFamily:FM, fontWeight:600 }}>{l.ventas_incluidas}</td>
                            <td><span style={{ fontFamily:FM, fontSize:14, fontWeight:700, color:C.green }}>{fmtMXN(l.monto_total)}</span></td>
                            <td style={{ fontSize:12, color:C.creamSub }}>{l.admin_nombre}</td>
                            <td style={{ fontSize:12, color:C.creamSub }}>{l.notas ?? "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal confirmar liquidacion */}
      {modalLiq && detalleArtista && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModalLiq(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Registrar pago a {detalleArtista.nombre}</span>
              <button className="icon-btn" onClick={() => setModalLiq(false)}><X size={14}/></button>
            </div>
            <div className="modal-body">
              <div className="monto-box">
                <div>
                  <div style={{ fontSize:11, color:"#166534", fontWeight:600, marginBottom:2 }}>Monto a pagar</div>
                  <div style={{ fontFamily:FM, fontSize:24, fontWeight:700, color:C.green }}>{fmtMXN(detalleTotal)}</div>
                </div>
                <DollarSign size={28} color={C.green}/>
              </div>
              <div className="field">
                <label>Notas (opcional)</label>
                <textarea rows={2} placeholder="ej. Transferencia SPEI, numero de operacion..."
                  value={notasLiq} onChange={e => setNotasLiq(e.target.value)} style={{ resize:"none" }}/>
              </div>
              <div className="field">
                <label>URL comprobante (opcional)</label>
                <input placeholder="https://..."
                  value={compLiq} onChange={e => setCompLiq(e.target.value)}/>
              </div>
              <p style={{ fontSize:12, color:C.creamSub, margin:0 }}>
                Se marcaran <strong>{detalleVentas.length} ventas</strong> como liquidadas y no apareceran mas en pendientes.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModalLiq(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={liquidar} disabled={saving}>
                {saving ? "Registrando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
