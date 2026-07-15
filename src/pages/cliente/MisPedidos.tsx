import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:  "#E8640C",
  pink:    "#A83B90",
  blue:    "#2D6FBE",
  green:   "#0E8A50",
  ink:     "#14121E",
  sub:     "#9896A8",
  subLight:"#C4C2D0",
  bg:      "#FFFFFF",
  card:    "#FFFFFF",
  border:  "#E6E4EF",
  bgOff:   "#FAFAF9",
};

const SANS  = "'Outfit', sans-serif";
const SERIF = "'SolveraLorvane', serif";
const NEXA  = "'Nexa-Heavy', sans-serif";
const MONO  = "'JetBrains Mono', monospace";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 }).format(p);

const ESTADO_CONFIG: Record<string, { bg:string; color:string; border:string; dot:string; label:string }> = {
  pendiente:      { bg:"#FFFBEB", color:"#92400E", border:"#FDE68A", dot:"#F59E0B", label:"Pendiente"          },
  pagado:         { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Pagado"             },
  procesando:     { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Procesando"         },
  enviado:        { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Enviado"            },
  listo_recoger:  { bg:"#F5F3FF", color:"#5B21B6", border:"#C4B5FD", dot:"#7C3AED", label:"Listo para recoger" },
  entregado:      { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Entregado"          },
  cancelado:      { bg:"#FEF2F2", color:"#991B1B", border:"#FCA5A5", dot:"#EF4444", label:"Cancelado"          },
};

interface Pedido {
  id_pedido:number; id_venta:number; titulo:string;
  imagen_principal:string; slug:string; artista_alias:string;
  cantidad:number; precio_unitario:string; subtotal:string;
  total:string; estado_pedido:string; estado_venta:string;
  fecha_pedido:string; total_pedido:string;
}
interface OrdenGroup {
  id_pedido:number; fecha:string; items:Pedido[];
  totalGrupo:number; estado:string;
}

const STATUS_BANNER: Record<string, { bg:string; border:string; color:string; icon:React.ReactNode; title:string; msg:string }> = {
  success: { bg:"#F0FDF4", border:"#86EFAC", color:"#166534", icon:<CheckCircle size={20} strokeWidth={2}/>, title:"¡Pago confirmado!", msg:"Tu orden fue procesada exitosamente. Te notificaremos cuando sea enviada." },
  failure: { bg:"#FEF2F2", border:"#FCA5A5", color:"#991B1B", icon:<XCircle    size={20} strokeWidth={2}/>, title:"Pago rechazado",    msg:"No pudimos procesar tu pago. Intenta de nuevo o usa otro método." },
  pending: { bg:"#FFFBEB", border:"#FCD34D", color:"#92400E", icon:<Clock       size={20} strokeWidth={2}/>, title:"Pago en revisión", msg:"Tu pago está siendo verificado. Te notificaremos cuando se confirme." },
};

type FiltroEstado = "todos" | "activos" | "completados" | "cancelados";

const FILTROS: { key: FiltroEstado; label: string }[] = [
  { key: "todos",       label: "Todos"       },
  { key: "activos",     label: "En proceso"  },
  { key: "completados", label: "Completados" },
  { key: "cancelados",  label: "Cancelados"  },
];

export default function MisPedidos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [pedidos,     setPedidos]     = useState<Pedido[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [banner,      setBanner]      = useState<string|null>(null);
  const [countdown,   setCountdown]   = useState(5);
  const [filtro,      setFiltro]      = useState<FiltroEstado>("todos");

  const nombre = localStorage.getItem("userName") || "Cliente";

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && STATUS_BANNER[status]) {
      setBanner(status);
      window.history.replaceState({}, "", "/mi-cuenta/pedidos");
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!banner) return;
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(iv); setBanner(null); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [banner]);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setPedidos(d.data); })
      .catch(() => showToast("Error al cargar pedidos", "err"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const ordenes = useMemo<OrdenGroup[]>(() => {
    const map = new Map<number, OrdenGroup>();
    const result: OrdenGroup[] = [];
    for (const p of pedidos) {
      if (!map.has(p.id_pedido)) {
        const g: OrdenGroup = { id_pedido:p.id_pedido, fecha:p.fecha_pedido, items:[], totalGrupo:Number(p.total_pedido), estado:p.estado_pedido };
        map.set(p.id_pedido, g);
        result.push(g);
      }
      map.get(p.id_pedido)!.items.push(p);
    }
    return result;
  }, [pedidos]);

  const totalGastado = ordenes
    .filter(o => o.estado === "pagado" || o.estado === "entregado")
    .reduce((s, o) => s + o.totalGrupo, 0);

  const isActivo = (estado: string) =>
    ["pendiente", "procesando", "enviado", "listo_recoger"].includes(estado);

  const conteos = useMemo(() => ({
    todos:       ordenes.length,
    activos:     ordenes.filter(o => isActivo(o.estado)).length,
    completados: ordenes.filter(o => o.estado === "pagado" || o.estado === "entregado").length,
    cancelados:  ordenes.filter(o => o.estado === "cancelado").length,
  }), [ordenes]);

  const ordenesFiltradas = useMemo(() => {
    if (filtro === "todos")       return ordenes;
    if (filtro === "activos")     return ordenes.filter(o => isActivo(o.estado));
    if (filtro === "completados") return ordenes.filter(o => o.estado === "pagado" || o.estado === "entregado");
    if (filtro === "cancelados")  return ordenes.filter(o => o.estado === "cancelado");
    return ordenes;
  }, [ordenes, filtro]);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:SANS, display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }


        /* Navbar */
        .mp-nav-logo { background:none; border:none; cursor:pointer; padding:0;
          font-family:${SERIF}; font-size:22px; font-weight:900; letter-spacing:-.02em;
          color:${C.ink}; transition:opacity .18s; }
        .mp-nav-logo:hover { opacity:.65; }

        .mp-nav-link { background:none; border:none; cursor:pointer; padding:6px 0;
          font-family:${SANS}; font-size:12px; font-weight:600; color:${C.sub};
          letter-spacing:.05em; transition:color .15s; display:flex; align-items:center; gap:6px; }
        .mp-nav-link:hover { color:${C.ink}; }
        .mp-nav-link.active { color:${C.ink}; }

        .mp-nav-cta { background:${C.orange}; border:none; border-radius:100px;
          padding:13px 28px; cursor:pointer; font-family:${SANS};
          font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          color:#fff; transition:background .18s, transform .18s;
          box-shadow:0 8px 24px ${C.orange}35; }
        .mp-nav-cta:hover { background:#d45a0a; transform:translateY(-1px); }

        /* Cards */
        .orden-card {
          background:${C.card}; border:1px solid ${C.border}; border-radius:16px;
          overflow:hidden; transition:box-shadow .25s, transform .25s;
        }
        .orden-card:hover {
          box-shadow:0 8px 32px rgba(20,18,30,.08);
          transform:translateY(-2px);
        }
        .orden-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 24px; cursor:pointer; gap:16px; transition:background .15s;
        }
        .orden-header:hover { background:${C.bgOff}; }

        .item-row { display:flex; align-items:center; gap:16px; padding:16px 24px;
          transition:background .15s; cursor:default; }
        .item-row:hover { background:${C.bgOff}; }
        .img-thumb { transition:transform .3s; }
        .item-row:hover .img-thumb { transform:scale(1.06); }
        .obra-link { cursor:pointer; }
        .obra-link:hover { opacity:.7; }

        /* Table header */
        .table-head {
          display:grid; grid-template-columns:1fr 100px 80px 100px;
          padding:10px 24px; gap:12px;
          border-bottom:1px solid ${C.border};
        }
        .table-row {
          display:grid; grid-template-columns:1fr 100px 80px 100px;
          padding:16px 24px; gap:12px; align-items:center;
          border-bottom:1px solid ${C.border};
          transition:background .15s;
        }
        .table-row:hover { background:${C.bgOff}; }
        .table-row:last-child { border-bottom:none; }

        /* Footer row */
        .order-footer {
          display:flex; justify-content:flex-end; align-items:center;
          padding:14px 24px; gap:16px; background:${C.bgOff};
          border-top:1px solid ${C.border};
        }

        /* Filtros */
        .filtro-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 100px; cursor: pointer;
          font-family: ${SANS}; font-size: 12px; font-weight: 600;
          border: 1.5px solid ${C.border}; background: #fff;
          color: ${C.sub}; transition: all .18s ease; white-space: nowrap;
        }
        .filtro-tab:hover { border-color: ${C.ink}; color: ${C.ink}; }
        .filtro-tab.active { background: ${C.ink}; border-color: ${C.ink}; color: #fff; }
        .filtro-tab .badge {
          font-size: 10px; font-weight: 800; font-family: ${MONO};
          background: rgba(255,255,255,.18); border-radius: 100px;
          padding: 1px 6px; min-width: 18px; text-align: center;
        }
        .filtro-tab:not(.active) .badge { background: ${C.bg}; color: ${C.sub}; }

        /* Card cancelada */
        .orden-card.cancelada { opacity: .62; }
        .orden-card.cancelada:hover { opacity: 1; }

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}
        }
        .reveal { animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }

        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        .overlay-btn { transition:all .18s; }
        .overlay-btn:hover { transform:translateY(-1px); }

        @keyframes shimmer {
          0%{background-position:200% 0} 100%{background-position:-200% 0}
        }
        .skeleton {
          background:linear-gradient(90deg,#ece9f0 25%,#f5f3f8 50%,#ece9f0 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px;
        }
      `}</style>


      {/* ══════════════════════════════
          PAYMENT RESULT OVERLAY
      ══════════════════════════════ */}
      {banner && STATUS_BANNER[banner] && (() => {
        const isSuccess = banner === "success";
        const isFailure = banner === "failure";
        const accent = isSuccess ? "#16A34A" : isFailure ? "#DC2626" : "#D97706";
        const bg     = isSuccess ? "#DCFCE7"  : isFailure ? "#FEE2E2"  : "#FEF3C7";
        const icon   = isSuccess
          ? <CheckCircle size={44} strokeWidth={1.6} color={accent}/>
          : isFailure
          ? <XCircle    size={44} strokeWidth={1.6} color={accent}/>
          : <Clock      size={44} strokeWidth={1.6} color={accent}/>;
        const title = isSuccess ? "¡Pago exitoso!" : isFailure ? "Pago rechazado" : "Pago en revisión";
        const msg   = isSuccess
          ? "Tu compra fue procesada con éxito. Recibirás confirmación por correo y nos contactaremos contigo para coordinar el envío de tu obra."
          : isFailure
          ? "No pudimos procesar tu pago. Puedes intentarlo de nuevo o elegir otro método de pago."
          : "Tu pago está siendo verificado. Te notificaremos en cuanto la institución bancaria lo confirme.";
        const recentOrder = ordenes[0];
        const codigo = recentOrder ? `NUB-${String(recentOrder.id_pedido).padStart(5,"0")}` : null;

        return (
          <div
            style={{
              position:"fixed", inset:0, zIndex:2000,
              background:"rgba(20,18,30,.82)",
              backdropFilter:"blur(10px)",
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:24, animation:"fadeIn .25s ease both",
            }}
            onClick={() => setBanner(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background:"#fff", borderRadius:28, padding:"52px 44px 44px",
                maxWidth:480, width:"100%",
                boxShadow:"0 32px 80px rgba(20,18,30,.32), 0 0 0 1px rgba(20,18,30,.06)",
                textAlign:"center",
                animation:"scaleIn .38s cubic-bezier(.34,1.56,.64,1) both",
              }}
            >
              {/* Ícono */}
              <div style={{
                width:96, height:96, borderRadius:"50%",
                background:bg, display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 28px",
              }}>{icon}</div>

              {/* Título */}
              <h2 style={{
                fontFamily:SERIF, fontStyle:"italic", fontSize:"clamp(30px,5vw,40px)", fontWeight:900,
                color:C.ink, letterSpacing:"-.03em", margin:"0 0 12px", lineHeight:1,
              }}>{title}</h2>

              {/* Mensaje */}
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75, margin:"0 0 28px", maxWidth:360, marginInline:"auto" }}>
                {msg}
              </p>

              {/* Código de orden (solo éxito) */}
              {isSuccess && (
                <div style={{
                  background:"#F9F8FC", border:`1px solid ${C.border}`, borderRadius:14,
                  padding:"14px 24px", marginBottom:28,
                  display:"inline-flex", alignItems:"center", gap:12,
                }}>
                  <Package size={15} color={C.sub} strokeWidth={1.8}/>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:9.5, fontWeight:700, color:C.sub, letterSpacing:".15em", textTransform:"uppercase"}}>
                      {codigo ? "Número de orden" : "Estado"}
                    </div>
                    <div style={{fontFamily:MONO, fontSize:17, fontWeight:700, color:C.ink, letterSpacing:".04em"}}>
                      {codigo || "Confirmado ✓"}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                {isFailure && (
                  <button className="overlay-btn" onClick={() => { setBanner(null); navigate("/mi-cuenta/carrito"); }} style={{
                    background:accent, color:"#fff", border:"none", borderRadius:100,
                    padding:"14px 28px", fontSize:12, fontWeight:700, cursor:"pointer",
                    fontFamily:SANS, letterSpacing:".1em", textTransform:"uppercase",
                  }}>
                    Reintentar pago
                  </button>
                )}
                <button className="overlay-btn" onClick={() => setBanner(null)} style={{
                  background:"none", border:`1.5px solid ${C.border}`, borderRadius:100,
                  padding:"13px 28px", fontSize:11.5, fontWeight:600, cursor:"pointer",
                  fontFamily:SANS, color:C.sub, letterSpacing:".04em",
                  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  {isFailure ? `Cerrar (${countdown}s)` : `Ver mis pedidos (${countdown}s)`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════
          HERO / PAGE TITLE
      ══════════════════════════════ */}
      <div style={{borderBottom:`1px solid ${C.border}`, background:"#fff"}}>
        <div style={{maxWidth:1100, margin:"0 auto", padding:"40px 40px 32px"}}>
          <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16}}>
            <div>
              <div style={{
                fontSize:10, fontWeight:700, letterSpacing:".25em",
                textTransform:"uppercase", color:C.sub, marginBottom:10,
              }}>
                Mi cuenta · Historial
              </div>
              <h1 style={{
                margin:0, fontFamily:SERIF, fontStyle:"italic",
                fontSize:"clamp(32px,5vw,52px)", fontWeight:900,
                color:C.ink, letterSpacing:"-.03em", lineHeight:.95,
              }}>
                Mis Pedidos
              </h1>
            </div>

            {/* Stats rápidos */}
            {!loading && ordenes.length > 0 && (
              <div style={{display:"flex", gap:32, alignItems:"flex-end"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:NEXA, fontSize:32, fontWeight:900, color:C.ink, lineHeight:1, letterSpacing:"-.03em"}}>
                    {ordenes.length}
                  </div>
                  <div style={{fontSize:10.5, color:C.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:".12em", marginTop:4}}>
                    {ordenes.length===1?"orden":"órdenes"}
                  </div>
                </div>
                {totalGastado > 0 && (
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:NEXA, fontSize:32, fontWeight:900, color:C.orange, lineHeight:1, letterSpacing:"-.03em"}}>
                      {fmt(totalGastado)}
                    </div>
                    <div style={{fontSize:10.5, color:C.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:".12em", marginTop:4}}>
                      total invertido
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          MAIN
      ══════════════════════════════ */}
      <main style={{flex:1, maxWidth:1100, width:"100%", margin:"0 auto", padding:"40px 40px 80px"}}>

        {/* Skeleton */}
        {loading ? (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {[1,2,3].map(n => <div key={n} className="skeleton" style={{height:80}}/>)}
          </div>

        ) : ordenes.length === 0 ? (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            minHeight:"55vh", textAlign:"center", padding:"40px 32px",
          }}>
            {/* Ícono decorativo */}
            <div style={{position:"relative", marginBottom:24}}>
              <div style={{
                width:84, height:84, borderRadius:"50%",
                background:"linear-gradient(135deg,#F3F0F8,#EDE9F4)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 8px 32px rgba(20,18,30,.08)",
              }}>
                <Package size={34} color={C.subLight} strokeWidth={1.2}/>
              </div>
              <div style={{
                position:"absolute", top:-5, right:-5,
                width:20, height:20, borderRadius:"50%",
                background:C.orange, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, color:"#fff", fontWeight:900,
              }}>★</div>
            </div>

            {/* Texto principal */}
            <div style={{
              fontFamily:SERIF, fontStyle:"italic",
              fontSize:"clamp(26px,4vw,38px)", fontWeight:900,
              color:C.ink, letterSpacing:"-.03em", lineHeight:1, marginBottom:12,
            }}>
              Aún no tienes pedidos
            </div>

            {/* Línea decorativa */}
            <div style={{
              width:36, height:2, borderRadius:2,
              background:`linear-gradient(90deg,${C.orange},${C.pink})`,
              margin:"0 auto 16px",
            }}/>

            <div style={{fontSize:13.5, color:C.sub, marginBottom:28, lineHeight:1.75, maxWidth:340}}>
              Cuando confirmes una compra, tus órdenes aparecerán aquí con todo el detalle de tu inversión en arte.
            </div>

            <button onClick={() => navigate("/catalogo")} className="mp-nav-cta">
              Explorar catálogo
            </button>

            <div style={{marginTop:20, fontSize:11, color:C.subLight, letterSpacing:".04em", fontStyle:"italic"}}>
              Arte auténtico de la Huasteca Hidalguense
            </div>
          </div>

        ) : (
          <>
            {/* ── Tabs de filtro ── */}
            <div style={{
              display:"flex", gap:8, marginBottom:20, flexWrap:"wrap",
              overflowX:"auto", paddingBottom:2,
            }}>
              {FILTROS.map(f => (
                <button
                  key={f.key}
                  className={`filtro-tab${filtro === f.key ? " active" : ""}`}
                  onClick={() => setFiltro(f.key)}
                >
                  {f.label}
                  {conteos[f.key] > 0 && (
                    <span className="badge">{conteos[f.key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sin resultados para el filtro */}
            {ordenesFiltradas.length === 0 && (
              <div style={{
                textAlign:"center", padding:"48px 32px",
                background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
              }}>
                <div style={{fontSize:13, color:C.sub, marginBottom:12}}>
                  No tienes órdenes en esta categoría
                </div>
                <button
                  onClick={() => setFiltro("todos")}
                  style={{
                    background:"none", border:`1.5px solid ${C.border}`, borderRadius:100,
                    padding:"8px 20px", fontSize:12, fontWeight:600, color:C.ink,
                    cursor:"pointer", fontFamily:SANS,
                  }}
                >
                  Ver todas las órdenes
                </button>
              </div>
            )}

            {/* Lista de órdenes */}
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {ordenesFiltradas.map((orden, idx) => {
                const est    = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;
                const fechaObj = new Date(orden.fecha);
                const fecha = fechaObj.toLocaleDateString("es-MX", { year:"numeric", month:"short", day:"numeric" });
                const hora  = fechaObj.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", hour12:true });
                const codigo = `NUB-${String(orden.id_pedido).padStart(5,"0")}`;
                const diffMin = Math.floor((Date.now() - fechaObj.getTime()) / 60000);
                const rel = diffMin < 60 ? `Hace ${Math.max(1,diffMin)} min`
                          : diffMin < 1440 ? `Hace ${Math.floor(diffMin/60)}h`
                          : diffMin < 2880 ? "Ayer" : fecha;

                const THUMBS   = orden.items.slice(0, 3);
                const extraCount = orden.items.length - 3;

                return (
                  <div
                    key={orden.id_pedido}
                    className={`orden-card reveal${orden.estado === "cancelado" ? " cancelada" : ""}`}
                    style={{animationDelay:`${idx*50}ms`}}
                  >
                    {/* Franja de estado */}
                    <div style={{height:3, background:
                      orden.estado==="pagado"||orden.estado==="entregado"
                        ? `linear-gradient(90deg,${C.green},#16A34A)`
                        : orden.estado==="cancelado"
                        ? `linear-gradient(90deg,#9CA3AF,#6B7280)`
                        : orden.estado==="listo_recoger"
                        ? `linear-gradient(90deg,#7C3AED,#5B21B6)`
                        : `linear-gradient(90deg,${C.orange},${C.pink})`
                    }}/>

                    <div style={{padding:"18px 24px"}}>

                      {/* Fila superior: badge + código + total */}
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8}}>
                        <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            background:est.bg, border:`1px solid ${est.border}`,
                            borderRadius:100, padding:"4px 12px",
                            fontSize:10.5, fontWeight:700, color:est.color, letterSpacing:".1em", textTransform:"uppercase",
                          }}>
                            <span style={{width:6,height:6,borderRadius:"50%",background:est.dot}}/>
                            {est.label}
                          </span>
                          <span style={{fontSize:13, fontWeight:700, color:C.ink, fontFamily:MONO, letterSpacing:".04em"}}>
                            {codigo}
                          </span>
                          <span style={{fontSize:12, color:C.subLight}}>·</span>
                          <span style={{fontSize:12.5, color:C.sub, fontWeight:500}}>{rel}</span>
                        </div>
                        <div style={{fontFamily:NEXA, fontSize:24, fontWeight:900, color:C.orange, letterSpacing:"-.02em"}}>
                          {fmt(orden.totalGrupo)}
                        </div>
                      </div>

                      {/* Fila de obras: thumbnails + info + botón */}
                      <div style={{display:"flex", alignItems:"center", gap:16}}>

                        {/* Thumbnails */}
                        <div style={{display:"flex", gap:8, flexShrink:0}}>
                          {THUMBS.map((item, i) => (
                            <div key={i} style={{
                              width:68, height:84, borderRadius:10, overflow:"hidden",
                              background:"#EDE9E3", flexShrink:0, position:"relative",
                            }}>
                              {item.imagen_principal
                                ? <img src={item.imagen_principal} alt={item.titulo}
                                    style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}/>
                                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                    <Package size={20} color={C.subLight} strokeWidth={1.5}/>
                                  </div>
                              }
                              {/* overlay +N en el último thumb si hay más */}
                              {i===2 && extraCount>0 && (
                                <div style={{
                                  position:"absolute", inset:0,
                                  background:"rgba(20,18,30,.55)",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  borderRadius:10,
                                }}>
                                  <span style={{color:"#fff", fontSize:13, fontWeight:800, fontFamily:NEXA}}>+{extraCount}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Info de obras */}
                        <div style={{flex:1, minWidth:0}}>
                          {orden.items.slice(0,2).map(item => (
                            <div key={item.id_venta} style={{
                              display:"flex", alignItems:"baseline", gap:6, marginBottom:4,
                            }}>
                              <span style={{
                                fontSize:13.5, fontWeight:700, color:C.ink,
                                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:220,
                              }}>{item.titulo}</span>
                              <span style={{fontSize:11, color:C.subLight, flexShrink:0}}>· {item.artista_alias}</span>
                              {item.cantidad>1 && (
                                <span style={{fontSize:10.5, color:C.sub, flexShrink:0}}>×{item.cantidad}</span>
                              )}
                            </div>
                          ))}
                          {orden.items.length>2 && (
                            <div style={{fontSize:11.5, color:C.sub, marginTop:2}}>
                              +{orden.items.length-2} obra{orden.items.length-2>1?"s":""} más
                            </div>
                          )}
                          <div style={{fontSize:12, color:C.sub, fontWeight:500, marginTop:6}}>
                            {fecha} · {hora}
                          </div>
                        </div>

                        {/* Botones */}
                        <div style={{display:"flex", flexDirection:"column", gap:8, flexShrink:0, alignItems:"flex-end"}}>
                          {orden.estado === "cancelado" ? (
                            <div style={{
                              fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase",
                              color:"#6B7280", background:"#F3F4F6", border:"1px solid #E5E7EB",
                              borderRadius:100, padding:"4px 12px",
                            }}>
                              Orden cancelada
                            </div>
                          ) : (
                            <>
                              {orden.estado === "pendiente" && (
                                <div style={{
                                  fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase",
                                  color:"#92400E", background:"#FFFBEB", border:"1px solid #FDE68A",
                                  borderRadius:100, padding:"4px 12px",
                                }}>
                                  ⏳ En espera de confirmación
                                </div>
                              )}
                              <button
                                onClick={() => navigate(`/mi-cuenta/pedidos/${orden.id_pedido}`)}
                                className="ver-detalle-btn"
                                style={{
                                  display:"flex", alignItems:"center", gap:6,
                                  background: orden.estado === "pendiente" ? C.orange : "none",
                                  border: orden.estado === "pendiente" ? "none" : `1.5px solid ${C.border}`,
                                  borderRadius:100, padding:"9px 20px", cursor:"pointer",
                                  fontSize:11, fontWeight:700,
                                  color: orden.estado === "pendiente" ? "#fff" : C.ink,
                                  fontFamily:SANS, letterSpacing:".08em", textTransform:"uppercase",
                                  transition:"all .2s",
                                  boxShadow: orden.estado === "pendiente" ? `0 4px 14px ${C.orange}35` : "none",
                                }}
                                onMouseEnter={e => {
                                  const el = e.currentTarget as HTMLElement;
                                  if (orden.estado === "pendiente") { el.style.background="#d45a0a"; }
                                  else { el.style.borderColor=C.orange; el.style.color=C.orange; }
                                }}
                                onMouseLeave={e => {
                                  const el = e.currentTarget as HTMLElement;
                                  if (orden.estado === "pendiente") { el.style.background=C.orange; }
                                  else { el.style.borderColor=C.border; el.style.color=C.ink; }
                                }}
                              >
                                {orden.estado === "pendiente" ? "Ver estado del pago" : "Ver detalle"}
                                <ChevronDown size={13} strokeWidth={2.5} style={{transform:"rotate(-90deg)"}}/>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

    </div>
  );
}
