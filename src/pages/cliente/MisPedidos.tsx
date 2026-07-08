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
  pendiente:  { bg:"#FFFBEB", color:"#92400E", border:"#FDE68A", dot:"#F59E0B", label:"Pendiente"  },
  pagado:     { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Pagado"     },
  procesando: { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Procesando" },
  enviado:    { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Enviado"    },
  entregado:  { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Entregado"  },
  cancelado:  { bg:"#FEF2F2", color:"#991B1B", border:"#FCA5A5", dot:"#EF4444", label:"Cancelado"  },
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

export default function MisPedidos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [pedidos,     setPedidos]     = useState<Pedido[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [banner,      setBanner]      = useState<string|null>(null);

  const nombre = localStorage.getItem("userName") || "Cliente";

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && STATUS_BANNER[status]) {
      setBanner(status);
      window.history.replaceState({}, "", "/mi-cuenta/pedidos");
    }
  }, []); // eslint-disable-line

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

        .mp-nav-cta { background:${C.ink}; border:none; border-radius:100px;
          padding:9px 20px; cursor:pointer; font-family:${SANS};
          font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          color:#fff; transition:background .18s, transform .18s; }
        .mp-nav-cta:hover { background:${C.orange}; transform:translateY(-1px); }

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

        .banner-close { background:none; border:none; cursor:pointer;
          opacity:.5; font-size:17px; padding:3px 5px; border-radius:4px; transition:opacity .15s; }
        .banner-close:hover { opacity:1; }

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}
        }
        .reveal { animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }

        @keyframes shimmer {
          0%{background-position:200% 0} 100%{background-position:-200% 0}
        }
        .skeleton {
          background:linear-gradient(90deg,#ece9f0 25%,#f5f3f8 50%,#ece9f0 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px;
        }
      `}</style>


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

        {/* Banner */}
        {banner && STATUS_BANNER[banner] && (() => {
          const b = STATUS_BANNER[banner];
          return (
            <div style={{
              background:b.bg, border:`1px solid ${b.border}`, borderRadius:14,
              padding:"16px 20px", marginBottom:28,
              display:"flex", alignItems:"flex-start", gap:14, color:b.color,
              animation:"fadeUp .3s ease both",
            }}>
              <span style={{flexShrink:0, marginTop:1}}>{b.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800, fontSize:15, marginBottom:3}}>{b.title}</div>
                <div style={{fontSize:13, opacity:.85, lineHeight:1.5}}>{b.msg}</div>
              </div>
              <button className="banner-close" onClick={() => setBanner(null)}>✕</button>
            </div>
          );
        })()}

        {/* Skeleton */}
        {loading ? (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {[1,2,3].map(n => <div key={n} className="skeleton" style={{height:80}}/>)}
          </div>

        ) : ordenes.length === 0 ? (
          <div style={{textAlign:"center", padding:"100px 32px"}}>
            <div style={{
              width:80, height:80, borderRadius:"50%", background:"#F3F0F8",
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px",
            }}>
              <Package size={32} color={C.subLight} strokeWidth={1.5}/>
            </div>
            <div style={{fontFamily:SERIF, fontStyle:"italic", fontSize:26, fontWeight:900, color:C.ink, marginBottom:10}}>
              Aún no tienes pedidos
            </div>
            <div style={{fontSize:14, color:C.sub, marginBottom:36, lineHeight:1.7}}>
              Cuando confirmes una compra, tus órdenes aparecerán aquí
            </div>
            <button onClick={() => navigate("/catalogo")} className="mp-nav-cta">
              Explorar catálogo
            </button>
          </div>

        ) : (
          <>
            {/* Encabezado de tabla */}
            <div className="table-head" style={{marginBottom:0}}>
              <span style={{fontSize:10.5, fontWeight:700, color:C.subLight, textTransform:"uppercase", letterSpacing:".15em"}}>Obra</span>
              <span style={{fontSize:10.5, fontWeight:700, color:C.subLight, textTransform:"uppercase", letterSpacing:".15em"}}>Artista</span>
              <span style={{fontSize:10.5, fontWeight:700, color:C.subLight, textTransform:"uppercase", letterSpacing:".15em", textAlign:"center"}}>Cant.</span>
              <span style={{fontSize:10.5, fontWeight:700, color:C.subLight, textTransform:"uppercase", letterSpacing:".15em", textAlign:"right"}}>Precio</span>
            </div>

            {/* Lista de órdenes */}
            <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:8}}>
              {ordenes.map((orden, idx) => {
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
                  <div key={orden.id_pedido} className="orden-card reveal" style={{animationDelay:`${idx*50}ms`}}>

                    {/* Franja de estado */}
                    <div style={{height:3, background:
                      orden.estado==="pagado"||orden.estado==="entregado"
                        ? `linear-gradient(90deg,${C.green},#16A34A)`
                        : orden.estado==="cancelado"
                        ? `linear-gradient(90deg,#EF4444,#DC2626)`
                        : `linear-gradient(90deg,${C.orange},${C.pink})`
                    }}/>

                    <div style={{padding:"18px 24px"}}>

                      {/* Fila superior: badge + código + total */}
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8}}>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            background:est.bg, border:`1px solid ${est.border}`,
                            borderRadius:100, padding:"3px 10px",
                            fontSize:9.5, fontWeight:700, color:est.color, letterSpacing:".1em", textTransform:"uppercase",
                          }}>
                            <span style={{width:5,height:5,borderRadius:"50%",background:est.dot}}/>
                            {est.label}
                          </span>
                          <span style={{fontSize:10.5, color:C.subLight, fontFamily:MONO, letterSpacing:".06em"}}>
                            {codigo}
                          </span>
                          <span style={{fontSize:11.5, color:C.subLight}}>·</span>
                          <span style={{fontSize:11.5, color:C.sub}}>{rel}</span>
                        </div>
                        <div style={{fontFamily:NEXA, fontSize:22, fontWeight:900, color:C.orange, letterSpacing:"-.02em"}}>
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
                          <div style={{fontSize:11, color:C.subLight, marginTop:6}}>
                            {fecha} · {hora}
                          </div>
                        </div>

                        {/* Botón ver detalle */}
                        <button
                          onClick={() => navigate(`/mi-cuenta/pedidos/${orden.id_pedido}`)}
                          className="ver-detalle-btn"
                          style={{
                            display:"flex", alignItems:"center", gap:6,
                            background:"none", border:`1.5px solid ${C.border}`,
                            borderRadius:100, padding:"9px 20px", cursor:"pointer",
                            fontSize:11, fontWeight:700, color:C.ink, fontFamily:SANS,
                            letterSpacing:".08em", textTransform:"uppercase",
                            transition:"all .2s", flexShrink:0,
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=C.orange; (e.currentTarget as HTMLElement).style.color=C.orange; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.color=C.ink; }}
                        >
                          Ver detalle
                          <ChevronDown size={13} strokeWidth={2.5} style={{transform:"rotate(-90deg)"}}/>
                        </button>
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
