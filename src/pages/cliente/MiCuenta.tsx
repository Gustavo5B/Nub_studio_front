// src/pages/cliente/MiCuenta.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, Heart, LogOut, ArrowUpRight, Sparkles, Mic } from "lucide-react";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  blue:   "#2D6FBE",
  ink:    "#14121E",
  sub:    "#9896A8",
  bg:     "#FAFAF9",
  card:   "#FFFFFF",
  border: "#E6E4EF",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

export default function MiCuenta() {
  const navigate = useNavigate();
  const [cartCount,  setCartCount]  = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [favCount,   setFavCount]   = useState(0);
  const [loading,    setLoading]    = useState(true);

  const nombre   = localStorage.getItem("userName")  || "Coleccionista";
  const correo   = localStorage.getItem("userEmail") || "";
  const iniciales = nombre.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;
    Promise.allSettled([
      fetch(`${API_URL}/api/carrito`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setCartCount(d.data?.length ?? 0); }),
      fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
          if (d.success) {
            const ids = new Set(d.data.map((v: any) => v.id_pedido));
            setOrderCount(ids.size);
          }
        }),
      fetch(`${API_URL}/api/favoritos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setFavCount(d.data?.length ?? 0); }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { authService.logout(); navigate("/"); };

  const cards = [
    {
      icon: <ShoppingCart size={20} strokeWidth={1.5}/>,
      label: "Mi Carrito",
      desc: "Obras seleccionadas",
      count: cartCount,
      unit: cartCount === 1 ? "obra" : "obras",
      accent: C.orange,
      path: "/mi-cuenta/carrito",
      gradient: `linear-gradient(135deg, #E8640C22, #E8640C08)`,
    },
    {
      icon: <Package size={20} strokeWidth={1.5}/>,
      label: "Mis Pedidos",
      desc: "Historial de compras",
      count: orderCount,
      unit: orderCount === 1 ? "orden" : "órdenes",
      accent: C.blue,
      path: "/mi-cuenta/pedidos",
      gradient: `linear-gradient(135deg, #2D6FBE22, #2D6FBE08)`,
    },
    {
      icon: <Heart size={20} strokeWidth={1.5}/>,
      label: "Mis Favoritos",
      desc: "Obras que te inspiran",
      count: favCount,
      unit: favCount === 1 ? "obra" : "obras",
      accent: C.pink,
      path: "/mi-cuenta/favoritos",
      gradient: `linear-gradient(135deg, #A83B9022, #A83B9008)`,
    },
    {
      icon: <Mic size={20} strokeWidth={1.5}/>,
      label: "Vincular Alexa",
      desc: "Conecta tu Echo",
      count: 0,
      unit: "",
      accent: C.blue,
      path: "/mi-cuenta/vincular-alexa",
      gradient: `linear-gradient(135deg, #2D6FBE22, #2D6FBE08)`,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        /* Grain texture overlay */
        .mc-grain {
          position:fixed; inset:0; pointer-events:none; z-index:1;
          opacity:.022;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size:160px;
          mix-blend-mode:multiply;
        }

        /* Nav */
        .mc-logo-btn {
          background:none; border:none; cursor:pointer; padding:0;
          font-family:${SERIF}; font-size:22px; font-weight:900;
          color:${C.ink}; letter-spacing:-.02em; line-height:1;
          transition: opacity .18s;
        }
        .mc-logo-btn:hover { opacity:.7; }

        .mc-pill-btn {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid ${C.border}; border-radius:100px;
          padding:8px 18px; cursor:pointer;
          font-size:11.5px; font-weight:600; color:${C.sub}; font-family:${SANS};
          transition: all .18s; letter-spacing:.04em;
        }
        .mc-pill-btn:hover { border-color:${C.ink}; color:${C.ink}; background:#fff; }
        .logout-btn {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid ${C.border}; border-radius:100px;
          padding:8px 18px; cursor:pointer;
          font-size:11.5px; font-weight:600; color:${C.sub}; font-family:${SANS};
          transition: all .18s; letter-spacing:.04em;
        }
        .logout-btn:hover { border-color:#C4304A55; color:#C4304A; background:#FFF5F5; }

        /* Cards */
        .mc-card {
          cursor:pointer; position:relative; overflow:hidden;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
        }
        .mc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 64px rgba(20,18,30,.13), 0 0 0 1px rgba(20,18,30,.07) !important;
        }
        .mc-card:hover .card-arrow { opacity:1; transform:translateX(0); }
        .card-arrow {
          opacity:0; transform:translateX(-4px);
          transition: opacity .22s, transform .22s;
        }

        /* Shimmer */
        .num-shimmer {
          width:70px; height:58px; border-radius:12px;
          background: linear-gradient(90deg,#ece9f0 25%,#f5f3f8 50%,#ece9f0 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite;
          margin-bottom:8px;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Reveal */
        @keyframes fadeUp {
          from{opacity:0; transform:translateY(20px)}
          to{opacity:1; transform:translateY(0)}
        }
        .reveal { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both; }

        /* Hero marquee */
        @keyframes marquee {
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        .mc-marquee {
          display:flex; gap:48px; white-space:nowrap;
          animation: marquee 22s linear infinite;
          width:max-content;
        }

        /* Account rows */
        .acct-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:15px 26px; transition: background .16s;
        }
        .acct-row:hover { background:#FAFAFD; }
      `}</style>

      {/* Grain */}
      <div className="mc-grain"/>

      {/* ── Navbar ── */}
      <header style={{
        position:"sticky", top:0, zIndex:200,
        background:"rgba(255,255,255,.92)", backdropFilter:"blur(14px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"0 40px", height:62,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <button className="mc-logo-btn" onClick={() => navigate("/")}>
          NU<span style={{color:C.orange}}>★</span>B
        </button>

        <div style={{
          position:"absolute", left:"50%", transform:"translateX(-50%)",
          fontSize:11, fontWeight:700, letterSpacing:".2em",
          textTransform:"uppercase", color:C.sub,
        }}>
          Mi Cuenta
        </div>

        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <button className="mc-pill-btn" onClick={() => navigate("/catalogo")}>
            <Sparkles size={12} strokeWidth={2}/> Galería
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={12} strokeWidth={2}/> Salir
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>

        {/* Rainbow top line */}
        <div style={{height:2.5, background:`linear-gradient(90deg,${C.orange},${C.pink},${C.blue},${C.orange})`}}/>

        {/* Decorative letterform */}
        <div style={{
          position:"absolute", right:-40, top:"50%", transform:"translateY(-52%)",
          fontFamily:SERIF, fontSize:"clamp(240px,32vw,380px)", fontWeight:900, fontStyle:"italic",
          color:"rgba(20,18,30,.028)", lineHeight:1, userSelect:"none", pointerEvents:"none",
          letterSpacing:"-.04em",
        }}>N</div>

        {/* Content */}
        <div style={{maxWidth:1040, margin:"0 auto", padding:"52px 40px 0", position:"relative", zIndex:2}}>
          <div style={{display:"flex", alignItems:"center", gap:32, flexWrap:"wrap"}}>

            {/* Avatar */}
            <div style={{position:"relative", flexShrink:0}}>
              <div style={{
                width:88, height:88, borderRadius:24,
                background:C.ink,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 8px 32px rgba(20,18,30,.18)`,
              }}>
                <span style={{fontFamily:NEXA, fontSize:30, color:"#fff", letterSpacing:"-.02em"}}>
                  {iniciales}
                </span>
              </div>
              <div style={{
                position:"absolute", bottom:5, right:5,
                width:14, height:14, borderRadius:"50%",
                background:"#22C55E", border:`3px solid #fff`,
                boxShadow:"0 0 8px rgba(34,197,94,.5)",
              }}/>
            </div>

            {/* Name + badge */}
            <div style={{flex:1, minWidth:0}}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:7,
                background:`${C.orange}12`, border:`1px solid ${C.orange}30`,
                borderRadius:100, padding:"4px 13px 4px 10px", marginBottom:14,
              }}>
                <div style={{width:5, height:5, borderRadius:"50%", background:C.orange}}/>
                <span style={{
                  fontSize:9.5, fontWeight:800, letterSpacing:".22em",
                  textTransform:"uppercase", color:C.orange, fontFamily:SANS,
                }}>Coleccionista</span>
              </div>

              <h1 style={{
                margin:"0 0 8px", fontFamily:SERIF,
                fontSize:"clamp(28px,4.5vw,48px)", fontWeight:900, fontStyle:"italic",
                color:C.ink, letterSpacing:"-.035em", lineHeight:.95,
              }}>
                {nombre}
              </h1>
              <p style={{margin:0, fontSize:13, color:C.sub, fontFamily:SANS}}>
                {correo}
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/catalogo")}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"11px 22px", borderRadius:100,
                background:"transparent", border:`1.5px solid ${C.border}`,
                fontSize:11, fontWeight:700, color:C.sub,
                letterSpacing:".14em", textTransform:"uppercase",
                cursor:"pointer", fontFamily:SANS, flexShrink:0,
                transition:"all .2s",
              }}
              onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=C.ink; el.style.color=C.ink; }}
              onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.color=C.sub; }}
            >
              Ver galería <ArrowUpRight size={13} strokeWidth={2.5}/>
            </button>
          </div>

          {/* ── Stats strip ── */}
          <div style={{
            display:"flex", marginTop:40,
            borderTop:`1px solid ${C.border}`,
          }}>
            {[
              { val: loading ? null : cartCount,  label: "en carrito", accent: C.orange },
              { val: loading ? null : orderCount, label: "órdenes",    accent: C.blue   },
              { val: loading ? null : favCount,   label: "favoritas",  accent: C.pink   },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex:1, paddingTop:20, paddingBottom:26,
                paddingLeft: i > 0 ? 28 : 0,
                paddingRight: 28,
                borderRight: i < 2 ? `1px solid ${C.border}` : "none",
              }}>
                {s.val === null
                  ? <div style={{width:48,height:38,borderRadius:8,background:C.border,marginBottom:8}}/>
                  : <div style={{
                      fontFamily:NEXA, fontSize:40, fontWeight:900,
                      color:s.accent, lineHeight:1, marginBottom:5,
                      letterSpacing:"-.03em",
                    }}>{s.val}</div>
                }
                <div style={{
                  fontSize:10.5, color:C.sub, fontFamily:SANS,
                  fontWeight:600, textTransform:"uppercase", letterSpacing:".12em",
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrolling marquee */}
        <div style={{overflow:"hidden", borderTop:`1px solid ${C.border}`, padding:"11px 0"}}>
          <div className="mc-marquee">
            {Array.from({length:2}).map((_, ri) =>
              ["Arte Digital","Huasteca Hidalguense","Colección","NU★B Studio","Galería","Arte Contemporáneo","Edición Limitada","Obra Original"].map((t,i) => (
                <span key={`${ri}-${i}`} style={{
                  fontSize:9.5, fontWeight:700, letterSpacing:".25em",
                  textTransform:"uppercase", color:C.sub, fontFamily:SANS,
                }}>
                  {t} <span style={{color:C.orange, marginLeft:24}}>✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main style={{maxWidth:1040, margin:"0 auto", padding:"44px 40px 100px", position:"relative", zIndex:2}}>

        {/* Section label */}
        <div style={{
          display:"flex", alignItems:"center", gap:12, marginBottom:22,
        }}>
          <span style={{
            fontSize:9.5, fontWeight:800, letterSpacing:".28em",
            textTransform:"uppercase", color:C.sub, fontFamily:SANS,
          }}>Acceso rápido</span>
          <div style={{flex:1, height:1, background:C.border}}/>
        </div>

        {/* ── Cards ── */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18, marginBottom:40}}>
          {cards.map((card, idx) => (
            <div
              key={card.label}
              className="mc-card reveal"
              onClick={() => navigate(card.path)}
              style={{
                background:C.card, borderRadius:24,
                boxShadow:"0 2px 16px rgba(20,18,30,.07), 0 0 0 1px rgba(20,18,30,.055)",
                animationDelay:`${idx*90}ms`,
              }}
            >
              {/* Top gradient bar */}
              <div style={{
                height:3.5, borderRadius:"24px 24px 0 0",
                background:`linear-gradient(90deg, ${card.accent}, ${card.accent}55)`,
              }}/>

              <div style={{padding:"26px 26px 24px"}}>

                {/* Icon circle */}
                <div style={{
                  width:48, height:48, borderRadius:14,
                  background:card.gradient,
                  border:`1px solid ${card.accent}20`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:card.accent, marginBottom:20,
                }}>
                  {card.icon}
                </div>

                {/* Divider */}
                <div style={{height:1, background:C.border, marginBottom:18}}/>

                {/* Footer row */}
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:14, fontWeight:800, color:C.ink, marginBottom:2}}>{card.label}</div>
                    <div style={{fontSize:11.5, color:C.sub}}>{card.desc}</div>
                  </div>
                  <div
                    className="card-arrow"
                    style={{
                      width:34, height:34, borderRadius:"50%",
                      background:`${card.accent}16`,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }}
                  >
                    <ArrowUpRight size={15} color={card.accent} strokeWidth={2.5}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Account Info Card ── */}
        <div style={{
          fontSize:9.5, fontWeight:800, letterSpacing:".28em",
          textTransform:"uppercase", color:C.sub, fontFamily:SANS,
          marginBottom:16, display:"flex", alignItems:"center", gap:12,
        }}>
          <span>Datos de la cuenta</span>
          <div style={{flex:1, height:1, background:C.border}}/>
        </div>

        <div style={{
          background:C.card, borderRadius:20, overflow:"hidden",
          boxShadow:"0 2px 16px rgba(20,18,30,.07), 0 0 0 1px rgba(20,18,30,.055)",
        }} className="reveal">

          {/* Accent bar */}
          <div style={{height:3, background:`linear-gradient(90deg,${C.orange},${C.pink})`}}/>

          {[
            { label:"Nombre completo",    value:nombre },
            { label:"Correo electrónico", value:correo },
            { label:"Tipo de cuenta",     value:"Coleccionista · NU★B Studio" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="acct-row"
              style={{borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none"}}
            >
              <span style={{
                fontSize:12, color:C.sub, fontWeight:600,
                fontFamily:SANS, letterSpacing:".02em",
              }}>{row.label}</span>
              <span style={{
                fontSize:13.5, color:C.ink, fontWeight:700,
                maxWidth:"55%", textAlign:"right",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>{row.value}</span>
            </div>
          ))}

          <div style={{
            padding:"13px 26px",
            background:"#FAFAF8",
            borderTop:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{
              width:5, height:5, borderRadius:"50%",
              background:C.orange, flexShrink:0,
            }}/>
            <span style={{fontSize:11.5, color:C.sub}}>
              Para modificar tus datos, contacta a la galería.
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}