import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, CheckCircle, XCircle, Clock, ChevronDown, ShoppingBag, Heart, User } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:  "#E8640C",
  pink:    "#A83B90",
  blue:    "#2D6FBE",
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
          NAVBAR
      ══════════════════════════════ */}
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(255,255,255,.95)", backdropFilter:"blur(14px)",
        borderBottom:`1px solid ${C.border}`,
      }}>
        {/* Línea arcoiris */}
        <div style={{height:2.5, background:`linear-gradient(90deg,${C.orange},${C.pink},${C.blue},${C.orange})`}}/>

        <div style={{
          maxWidth:1100, margin:"0 auto",
          padding:"0 40px", height:62,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:40,
        }}>
          {/* Logo */}
          <button className="mp-nav-logo" onClick={() => navigate("/")}>
            NU<span style={{color:C.orange}}>★</span>B
          </button>

          {/* Nav links */}
          <nav style={{display:"flex", alignItems:"center", gap:28, flex:1, justifyContent:"center"}}>
            <button className="mp-nav-link" onClick={() => navigate("/catalogo")}>
              Galería
            </button>
            <button className="mp-nav-link active" onClick={() => navigate("/mi-cuenta/pedidos")}
              style={{color:C.ink, borderBottom:`2px solid ${C.orange}`, paddingBottom:2}}>
              Mis Pedidos
            </button>
            <button className="mp-nav-link" onClick={() => navigate("/mi-cuenta/favoritos")}>
              <Heart size={12} strokeWidth={2}/> Favoritos
            </button>
            <button className="mp-nav-link" onClick={() => navigate("/mi-cuenta/carrito")}>
              <ShoppingBag size={12} strokeWidth={2}/> Carrito
            </button>
          </nav>

          {/* Cuenta */}
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <button className="mp-nav-link" onClick={() => navigate("/mi-cuenta")}
              style={{gap:7}}>
              <div style={{
                width:28, height:28, borderRadius:"50%", background:C.ink,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <User size={13} color="#fff" strokeWidth={2}/>
              </div>
              <span style={{color:C.ink, fontSize:12.5, fontWeight:700}}>{nombre.split(" ")[0]}</span>
            </button>
          </div>
        </div>
      </header>

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

                return (
                  <div key={orden.id_pedido} className="orden-card reveal" style={{animationDelay:`${idx*50}ms`}}>

                    {/* Header */}
                    <div
                      className="orden-header"
                      onClick={() => navigate(`/mi-cuenta/pedidos/${orden.id_pedido}`)}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key==="Enter" && navigate(`/mi-cuenta/pedidos/${orden.id_pedido}`)}
                    >
                      {/* Left */}
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:5, flexWrap:"wrap"}}>
                          <span style={{fontSize:14.5, fontWeight:700, color:C.ink}}>{rel}</span>
                          <span style={{fontSize:12, color:C.subLight}}>—</span>
                          <span style={{fontSize:12.5, color:C.sub}}>{fecha} · {hora}</span>
                          {/* Estado badge */}
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            background:est.bg, border:`1px solid ${est.border}`,
                            borderRadius:100, padding:"2px 9px",
                            fontSize:9.5, fontWeight:700, color:est.color, letterSpacing:".1em", textTransform:"uppercase",
                          }}>
                            <span style={{width:5,height:5,borderRadius:"50%",background:est.dot}}/>
                            {est.label}
                          </span>
                        </div>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <span style={{fontSize:11.5, color:C.sub}}>
                            {orden.items.length} {orden.items.length===1?"obra":"obras"}
                          </span>
                          <span style={{color:C.border}}>·</span>
                          <span style={{fontSize:11, color:C.subLight, fontFamily:MONO, letterSpacing:".06em", userSelect:"all"}}>
                            {codigo}
                          </span>
                        </div>
                      </div>

                      {/* Right */}
                      <div style={{display:"flex", alignItems:"center", gap:16, flexShrink:0}}>
                        <div style={{fontFamily:NEXA, fontSize:22, fontWeight:900, color:C.orange, letterSpacing:"-.02em"}}>
                          {fmt(orden.totalGrupo)}
                        </div>
                        <div style={{
                          width:32, height:32, borderRadius:"50%",
                          border:`1.5px solid ${C.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"all .2s",
                        }}>
                          <ChevronDown size={15} strokeWidth={2.5} color={C.sub}
                            style={{transform:"rotate(-90deg)"}}
                          />
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

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer style={{borderTop:`1px solid ${C.border}`, background:"#fff", marginTop:"auto"}}>
        <div style={{maxWidth:1100, margin:"0 auto", padding:"32px 40px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24}}>

            {/* Logo + tagline */}
            <div>
              <div style={{fontFamily:SERIF, fontSize:20, fontWeight:900, color:C.ink, letterSpacing:"-.02em", marginBottom:5}}>
                NU<span style={{color:C.orange}}>★</span>B <span style={{fontFamily:SANS, fontSize:11, fontWeight:600, letterSpacing:".15em", color:C.sub, textTransform:"uppercase"}}>Studio</span>
              </div>
              <div style={{fontSize:11.5, color:C.subLight}}>
                Galería de arte digital · Huasteca Hidalguense
              </div>
            </div>

            {/* Nav footer */}
            <nav style={{display:"flex", gap:24, alignItems:"center", flexWrap:"wrap"}}>
              {[
                { label:"Galería",      path:"/catalogo" },
                { label:"Artistas",     path:"/artistas" },
                { label:"Mi carrito",   path:"/mi-cuenta/carrito" },
                { label:"Favoritos",    path:"/mi-cuenta/favoritos" },
                { label:"Mi cuenta",    path:"/mi-cuenta" },
              ].map(link => (
                <button key={link.label}
                  onClick={() => navigate(link.path)}
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:12, fontWeight:500, color:C.sub, fontFamily:SANS,
                    padding:0, transition:"color .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom bar */}
          <div style={{
            marginTop:24, paddingTop:20, borderTop:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:12,
          }}>
            <span style={{fontSize:11.5, color:C.subLight}}>
              © {new Date().getFullYear()} NU★B Studio · Todos los derechos reservados
            </span>
            <div style={{display:"flex", gap:6}}>
              {["MercadoPago","OXXO","Visa","Mastercard"].map(m => (
                <span key={m} style={{
                  fontSize:9.5, fontWeight:700, letterSpacing:".08em",
                  color:C.subLight, background:C.bgOff,
                  border:`1px solid ${C.border}`, borderRadius:6,
                  padding:"3px 8px", fontFamily:SANS,
                }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
