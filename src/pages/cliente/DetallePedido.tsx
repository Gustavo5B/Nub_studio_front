// src/pages/cliente/DetallePedido.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, MapPin, CheckCircle, Clock, Truck, Star, ShoppingBag } from "lucide-react";
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
  bgOff:   "#FAFAF9",
  card:    "#FFFFFF",
  border:  "#E6E4EF",
  green:   "#22C55E",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";
const MONO  = "'JetBrains Mono', monospace";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 }).format(p);

interface VentaItem {
  id_venta:        number;
  titulo:          string;
  slug:            string;
  imagen_principal:string;
  artista_alias:   string;
  cantidad:        number;
  precio_unitario: string;
  subtotal:        string;
  total:           string;
  estado_venta:    string;
}

interface PedidoDetalle {
  id_pedido:    number;
  estado:       string;
  total:        number;
  fecha_pedido: string;
  items:        VentaItem[];
}

const ESTADO_CONFIG: Record<string, { bg:string; color:string; border:string; dot:string; label:string }> = {
  pendiente:  { bg:"#FFFBEB", color:"#92400E", border:"#FDE68A", dot:"#F59E0B", label:"Pendiente"  },
  pagado:     { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Pagado"     },
  procesando: { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Procesando" },
  enviado:    { bg:"#EFF6FF", color:"#1E40AF", border:"#BFDBFE", dot:"#3B82F6", label:"Enviado"    },
  entregado:  { bg:"#F0FDF4", color:"#166534", border:"#86EFAC", dot:"#22C55E", label:"Entregado"  },
  cancelado:  { bg:"#FEF2F2", color:"#991B1B", border:"#FCA5A5", dot:"#EF4444", label:"Cancelado"  },
};

// Pasos del timeline según estado
const TIMELINE_STEPS = [
  { key:"pendiente",  icon:<Clock      size={16} strokeWidth={2}/>, label:"Pedido recibido",   desc:"Tu orden fue registrada" },
  { key:"pagado",     icon:<CheckCircle size={16} strokeWidth={2}/>, label:"Pago confirmado",  desc:"El pago fue procesado"   },
  { key:"procesando", icon:<Package    size={16} strokeWidth={2}/>, label:"En preparación",   desc:"Preparando tu pedido"    },
  { key:"enviado",    icon:<Truck      size={16} strokeWidth={2}/>, label:"En camino",         desc:"Tu pedido fue enviado"   },
  { key:"entregado",  icon:<Star       size={16} strokeWidth={2}/>, label:"Entregado",         desc:"¡Disfruta tu obra!"      },
];

const ESTADO_STEP: Record<string, number> = {
  pendiente: 0, pagado: 1, procesando: 2, enviado: 3, entregado: 4, cancelado: -1,
};

export default function DetallePedido() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [pedido,  setPedido]  = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        // Filtra y agrupa por id_pedido
        const idNum = Number(id);
        const rows = d.data.filter((r: any) => r.id_pedido === idNum);
        if (rows.length === 0) { showToast("Pedido no encontrado", "err"); navigate("/mi-cuenta/pedidos"); return; }
        const p: PedidoDetalle = {
          id_pedido:    rows[0].id_pedido,
          estado:       rows[0].estado_pedido,
          total:        Number(rows[0].total_pedido),
          fecha_pedido: rows[0].fecha_pedido,
          items: rows.map((r: any) => ({
            id_venta:         r.id_venta,
            titulo:           r.titulo,
            slug:             r.slug,
            imagen_principal: r.imagen_principal,
            artista_alias:    r.artista_alias,
            cantidad:         r.cantidad,
            precio_unitario:  r.precio_unitario,
            subtotal:         r.subtotal,
            total:            r.total,
            estado_venta:     r.estado_venta,
          })),
        };
        setPedido(p);
      })
      .catch(() => showToast("Error al cargar el pedido", "err"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12, width:640, padding:"0 32px" }}>
        {[1,2,3].map(n => (
          <div key={n} style={{
            height:80, borderRadius:14,
            background:"linear-gradient(90deg,#ece9f0 25%,#f5f3f8 50%,#ece9f0 75%)",
            backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite",
          }}/>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  if (!pedido) return null;

  const est       = ESTADO_CONFIG[pedido.estado] ?? ESTADO_CONFIG.pendiente;
  const stepIdx   = ESTADO_STEP[pedido.estado] ?? 0;
  const cancelado = pedido.estado === "cancelado";
  const codigo    = `NUB-${String(pedido.id_pedido).padStart(5,"0")}`;
  const fechaObj  = new Date(pedido.fecha_pedido);
  const fecha     = fechaObj.toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const hora      = fechaObj.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", hour12:true });

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:SANS }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');

        .dp-back { display:flex; align-items:center; gap:7px;
          background:none; border:1.5px solid ${C.border}; border-radius:100px;
          padding:7px 16px; cursor:pointer;
          font-size:11.5px; font-weight:600; color:${C.sub}; font-family:${SANS};
          transition:all .18s; }
        .dp-back:hover { border-color:${C.ink}; color:${C.ink}; }

        .dp-logo { background:none; border:none; cursor:pointer; padding:0;
          font-family:${SERIF}; font-size:22px; font-weight:900; color:${C.ink};
          letter-spacing:-.02em; transition:opacity .18s; }
        .dp-logo:hover { opacity:.65; }

        .obra-link { cursor:pointer; transition:opacity .15s; }
        .obra-link:hover { opacity:.72; }
        .img-thumb { transition:transform .3s; }
        .item-row:hover .img-thumb { transform:scale(1.05); }
        .item-row { transition:background .15s; }
        .item-row:hover { background:${C.bgOff}; }

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)}
        }
        .reveal { animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both; }

        @keyframes shimmer {
          0%{background-position:200% 0} 100%{background-position:-200% 0}
        }

        @keyframes marquee {
          from{transform:translateX(0)} to{transform:translateX(-50%)}
        }
        .dp-marquee {
          display:flex; gap:40px; white-space:nowrap;
          animation:marquee 22s linear infinite; width:max-content;
        }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(255,255,255,.95)", backdropFilter:"blur(14px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"0 40px", height:62,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <button className="dp-logo" onClick={() => navigate("/")}>
          NU<span style={{color:C.orange}}>★</span>B
        </button>

        <div style={{
          position:"absolute", left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <span style={{fontSize:10, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:C.sub}}>
            Detalle de pedido
          </span>
          <span style={{fontSize:11, fontFamily:MONO, color:C.subLight, letterSpacing:".06em"}}>
            {codigo}
          </span>
        </div>

        <button className="dp-back" onClick={() => navigate("/mi-cuenta/pedidos")}>
          <ArrowLeft size={12} strokeWidth={2.5}/> Mis pedidos
        </button>
      </header>

      {/* Línea arcoíris */}
      <div style={{height:2.5, background:`linear-gradient(90deg,${C.orange},${C.pink},${C.blue},${C.orange})`}}/>

      <main style={{maxWidth:860, margin:"0 auto", padding:"44px 32px 100px"}}>

        {/* ── Hero del pedido ── */}
        <div className="reveal" style={{
          background:C.card, borderRadius:22, overflow:"hidden",
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 20px rgba(20,18,30,.06)",
          marginBottom:24,
        }}>
          {/* Barra de acento */}
          <div style={{
            height:3.5,
            background: cancelado
              ? `linear-gradient(90deg,#EF4444,#DC2626)`
              : pedido.estado==="pagado"||pedido.estado==="entregado"
              ? `linear-gradient(90deg,${C.green},#16A34A)`
              : `linear-gradient(90deg,${C.orange},${C.pink})`,
          }}/>

          <div style={{padding:"28px 32px"}}>
            <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:20}}>
              <div>
                {/* Badge estado */}
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  background:est.bg, border:`1px solid ${est.border}`,
                  borderRadius:100, padding:"4px 12px", marginBottom:16,
                  fontSize:10, fontWeight:700, color:est.color, letterSpacing:".12em", textTransform:"uppercase",
                }}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:est.dot}}/>
                  {est.label}
                </span>

                <h1 style={{
                  margin:"0 0 6px", fontFamily:SERIF, fontStyle:"italic",
                  fontSize:"clamp(26px,4vw,38px)", fontWeight:900,
                  color:C.ink, letterSpacing:"-.03em", lineHeight:.95,
                }}>
                  Pedido {codigo}
                </h1>
                <p style={{margin:0, fontSize:13, color:C.sub, textTransform:"capitalize"}}>
                  {fecha} · {hora}
                </p>
              </div>

              {/* Total */}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11, color:C.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6}}>
                  Total del pedido
                </div>
                <div style={{fontFamily:NEXA, fontSize:36, fontWeight:900, color:C.orange, letterSpacing:"-.03em", lineHeight:1}}>
                  {fmt(pedido.total)}
                </div>
                <div style={{fontSize:12, color:C.sub, marginTop:4}}>
                  {pedido.items.length} {pedido.items.length===1?"obra":"obras"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Timeline de estado ── */}
        {!cancelado && (
          <div className="reveal" style={{
            background:C.card, border:`1px solid ${C.border}`, borderRadius:22,
            padding:"28px 32px", marginBottom:24,
            boxShadow:"0 2px 16px rgba(20,18,30,.05)",
            animationDelay:"60ms",
          }}>
            <div style={{
              fontSize:9.5, fontWeight:800, letterSpacing:".25em",
              textTransform:"uppercase", color:C.subLight, marginBottom:24,
            }}>
              Estado del envío
            </div>

            <div style={{display:"flex", alignItems:"flex-start", gap:0, position:"relative"}}>
              {/* Línea de fondo */}
              <div style={{
                position:"absolute", top:20, left:20, right:20,
                height:2, background:C.border, zIndex:0,
              }}/>
              {/* Línea de progreso */}
              <div style={{
                position:"absolute", top:20, left:20,
                height:2, zIndex:1, transition:"width .4s ease",
                background:`linear-gradient(90deg,${C.orange},${C.pink})`,
                width: stepIdx === 0 ? "0%" : `${(stepIdx / (TIMELINE_STEPS.length-1)) * (100 - (40/860*100))}%`,
              }}/>

              {TIMELINE_STEPS.map((step, i) => {
                const done   = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={step.key} style={{
                    flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    gap:10, position:"relative", zIndex:2,
                  }}>
                    {/* Círculo */}
                    <div style={{
                      width:40, height:40, borderRadius:"50%",
                      background: done ? (active ? C.orange : C.green) : "#fff",
                      border: done ? "none" : `2px solid ${C.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color: done ? "#fff" : C.subLight,
                      boxShadow: active ? `0 0 0 4px ${C.orange}22` : "none",
                      transition:"all .3s",
                    }}>
                      {step.icon}
                    </div>
                    {/* Texto */}
                    <div style={{textAlign:"center"}}>
                      <div style={{
                        fontSize:11, fontWeight:700,
                        color: done ? C.ink : C.subLight,
                        marginBottom:2,
                      }}>{step.label}</div>
                      <div style={{fontSize:10, color:C.subLight, lineHeight:1.4}}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelado notice */}
        {cancelado && (
          <div className="reveal" style={{
            background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:16,
            padding:"18px 24px", marginBottom:24,
            display:"flex", alignItems:"center", gap:14,
            animationDelay:"60ms",
          }}>
            <div style={{
              width:40, height:40, borderRadius:"50%", background:"#FEE2E2",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <Package size={18} color="#EF4444" strokeWidth={2}/>
            </div>
            <div>
              <div style={{fontSize:14, fontWeight:700, color:"#991B1B", marginBottom:3}}>Pedido cancelado</div>
              <div style={{fontSize:12.5, color:"#B91C1C", opacity:.8}}>
                Este pedido fue cancelado. Si tienes dudas, contacta a la galería.
              </div>
            </div>
          </div>
        )}

        {/* ── Items del pedido ── */}
        <div className="reveal" style={{
          background:C.card, border:`1px solid ${C.border}`, borderRadius:22,
          overflow:"hidden", marginBottom:24,
          boxShadow:"0 2px 16px rgba(20,18,30,.05)",
          animationDelay:"120ms",
        }}>
          {/* Header tabla */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 110px 60px 110px",
            padding:"12px 26px", gap:12,
            background:C.bgOff, borderBottom:`1px solid ${C.border}`,
          }}>
            {["Obra","Artista","Cant.","Precio"].map(h => (
              <span key={h} style={{
                fontSize:9.5, fontWeight:700, color:C.subLight,
                textTransform:"uppercase", letterSpacing:".15em",
                textAlign: h==="Precio"||h==="Cant." ? "right" : "left",
              }}>{h}</span>
            ))}
          </div>

          {/* Filas */}
          {pedido.items.map((item) => (
            <div key={item.id_venta} className="item-row" style={{
              display:"grid", gridTemplateColumns:"1fr 110px 60px 110px",
              padding:"16px 26px", gap:12, alignItems:"center",
              borderBottom:`1px solid ${C.border}`,
            }}>
              {/* Obra */}
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div
                  className="obra-link"
                  style={{width:56, height:70, borderRadius:12, overflow:"hidden", flexShrink:0, background:"#EDE9E3"}}
                  onClick={() => navigate(`/obras/${item.slug}`)}
                >
                  {item.imagen_principal
                    ? <img className="img-thumb" src={item.imagen_principal} alt={item.titulo}
                        style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Package size={18} color={C.subLight} strokeWidth={1.5}/>
                      </div>
                  }
                </div>
                <div style={{minWidth:0}}>
                  <div className="obra-link"
                    style={{fontSize:14,fontWeight:700,color:C.ink,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:4}}
                    onClick={() => navigate(`/obras/${item.slug}`)}>
                    {item.titulo}
                  </div>
                  <div style={{fontSize:11,color:C.subLight}}>
                    {fmt(Number(item.precio_unitario))} c/u
                  </div>
                </div>
              </div>

              {/* Artista */}
              <div style={{fontSize:12.5,color:C.sub,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {item.artista_alias}
              </div>

              {/* Cantidad */}
              <div style={{textAlign:"right",fontSize:14,fontWeight:700,color:C.ink}}>
                {item.cantidad}
              </div>

              {/* Total */}
              <div style={{textAlign:"right",fontFamily:NEXA,fontSize:16,fontWeight:900,color:C.ink}}>
                {fmt(Number(item.total))}
              </div>
            </div>
          ))}

          {/* Footer total */}
          <div style={{
            display:"flex", justifyContent:"flex-end", alignItems:"baseline",
            gap:16, padding:"18px 26px",
            background:C.bgOff, borderTop:`1px solid ${C.border}`,
          }}>
            <span style={{fontSize:12,color:C.sub,fontWeight:600}}>Total del pedido</span>
            <span style={{fontFamily:NEXA,fontSize:26,fontWeight:900,color:C.orange,letterSpacing:"-.02em"}}>
              {fmt(pedido.total)}
            </span>
          </div>
        </div>

        {/* ── Info adicional ── */}
        <div className="reveal" style={{
          background:C.card, border:`1px solid ${C.border}`, borderRadius:22,
          overflow:"hidden", boxShadow:"0 2px 16px rgba(20,18,30,.05)",
          animationDelay:"180ms",
        }}>
          <div style={{padding:"20px 26px", borderBottom:`1px solid ${C.border}`}}>
            <div style={{
              fontSize:9.5, fontWeight:800, letterSpacing:".25em",
              textTransform:"uppercase", color:C.subLight, marginBottom:16,
            }}>Información del pedido</div>

            {[
              { label:"Código de referencia", value:codigo, mono:true },
              { label:"Fecha de pedido",       value:`${fecha} · ${hora}`, mono:false },
              { label:"Estado actual",          value:est.label, mono:false },
              { label:"Método de pago",         value:"MercadoPago", mono:false },
            ].map((row,i,arr) => (
              <div key={row.label} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 0",
                borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none",
              }}>
                <span style={{fontSize:12.5, color:C.sub, fontWeight:500}}>{row.label}</span>
                <span style={{
                  fontSize:13, color:C.ink, fontWeight:700,
                  fontFamily: row.mono ? MONO : SANS,
                  letterSpacing: row.mono ? ".05em" : undefined,
                }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Envío */}
          <div style={{padding:"20px 26px", background:C.bgOff}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:`${C.orange}12`, border:`1px solid ${C.orange}20`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <MapPin size={16} color={C.orange} strokeWidth={2}/>
              </div>
              <div>
                <div style={{fontSize:12, fontWeight:700, color:C.ink, marginBottom:2}}>Envío</div>
                <div style={{fontSize:12, color:C.sub}}>
                  El envío se coordina directamente con la galería después del pago.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="reveal" style={{
          display:"flex", gap:12, marginTop:24, flexWrap:"wrap",
          animationDelay:"240ms",
        }}>
          <button
            onClick={() => navigate("/mi-cuenta/pedidos")}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"12px 24px", borderRadius:100,
              border:`1.5px solid ${C.border}`, background:"transparent",
              fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase",
              color:C.sub, cursor:"pointer", fontFamily:SANS, transition:"all .2s",
            }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=C.ink; el.style.color=C.ink; }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.color=C.sub; }}
          >
            <ArrowLeft size={12} strokeWidth={2.5}/> Ver todos mis pedidos
          </button>
          <button
            onClick={() => navigate("/catalogo")}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"12px 24px", borderRadius:100,
              border:"none", background:C.orange,
              fontSize:11, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase",
              color:"#fff", cursor:"pointer", fontFamily:SANS,
              boxShadow:"0 6px 24px rgba(232,100,12,.28)", transition:"all .2s",
            }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.background="#D4580A"; el.style.transform="translateY(-1px)"; }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=C.orange; el.style.transform="translateY(0)"; }}
          >
            <ShoppingBag size={12} strokeWidth={2}/> Seguir explorando
          </button>
        </div>
      </main>
    </div>
  );
}
