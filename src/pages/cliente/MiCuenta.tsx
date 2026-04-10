// src/pages/cliente/MiCuenta.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Package, Heart, LogOut,
  ArrowLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  blue:   "#2D6FBE",
  gold:   "#A87006",
  ink:    "#14121E",
  sub:    "#9896A8",
  muted:  "#C4C2CF",
  bg:     "#FAFAF9",
  card:   "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  borderHi: "rgba(0,0,0,0.12)",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

export default function MiCuenta() {
  const navigate = useNavigate();
  const [cartCount,  setCartCount]  = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [favCount,   setFavCount]   = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  const nombre   = localStorage.getItem("userName")  || "Cliente";
  const correo   = localStorage.getItem("userEmail") || "";
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    Promise.allSettled([
      fetch(`${API_URL}/api/carrito`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.success) setCartCount(d.data?.length ?? 0); }),
      fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.success) setOrderCount(d.data?.length ?? 0); }),
      fetch(`${API_URL}/api/favoritos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.success) setFavCount(d.data?.length ?? 0); }),
    ]).finally(() => setLoadingCounts(false));
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const sections = [
    {
      icon:     <ShoppingCart size={22} strokeWidth={1.6} />,
      label:    "Mi Carrito",
      desc:     "Obras seleccionadas",
      count:    cartCount,
      unit:     cartCount === 1 ? "obra" : "obras",
      accent:   C.orange,
      onClick:  () => navigate("/mi-cuenta/carrito"),
      active:   true,
    },
    {
      icon:     <Package size={22} strokeWidth={1.6} />,
      label:    "Mis Pedidos",
      desc:     "Historial de compras",
      count:    orderCount,
      unit:     orderCount === 1 ? "orden" : "órdenes",
      accent:   C.blue,
      onClick:  () => navigate("/mi-cuenta/pedidos"),
      active:   true,
    },
    {
      icon:     <Heart size={22} strokeWidth={1.6} />,
      label:    "Favoritos",
      desc:     "Obras guardadas",
      count:    favCount,
      unit:     favCount === 1 ? "obra" : "obras",
      accent:   C.pink,
      onClick:  () => {},
      active:   true,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>

      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .mc-card-active {
          cursor: pointer;
          transition: box-shadow .22s, transform .22s, border-color .22s;
        }
        .mc-card-active:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(0,0,0,.10) !important;
        }
        .mc-action-link {
          transition: color .18s, gap .18s;
        }
        .mc-action-link:hover { color: ${C.ink} !important; }
        .mc-logout:hover { color: ${C.ink} !important; border-color: ${C.borderHi} !important; }

        @media (max-width: 640px) {
          .mc-cards { grid-template-columns: 1fr !important; }
          .mc-hero  { padding: 40px 20px 32px !important; }
          .mc-body  { padding: 0 20px 60px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,249,0.96)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 40px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: SERIF, fontSize: 19, fontWeight: 900,
          color: C.ink, letterSpacing: "-.02em", padding: 0,
        }}>
          ALTAR
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".18em",
            textTransform: "uppercase", color: C.sub, fontFamily: SANS,
          }}>Mi cuenta</span>

          <span style={{ color: C.muted, fontSize: 13 }}>·</span>

          <button onClick={handleLogout} className="mc-logout" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: `1px solid ${C.border}`, borderRadius: 100,
            padding: "5px 13px", cursor: "pointer",
            fontSize: 11, fontWeight: 600, color: C.sub, fontFamily: SANS,
            transition: "all .2s",
          }}>
            <LogOut size={12} strokeWidth={2} />
            Salir
          </button>
        </div>
      </header>

      {/* ── Hero / Perfil ── */}
      <section className="mc-hero" style={{
        maxWidth: 860, margin: "0 auto",
        padding: "56px 40px 40px",
      }}>

        {/* Volver */}
        <button onClick={() => navigate(-1 as any)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 700, color: C.sub, fontFamily: SANS,
          letterSpacing: ".12em", textTransform: "uppercase",
          padding: 0, marginBottom: 36, transition: "color .18s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
        >
          <ArrowLeft size={13} strokeWidth={2.5} /> Volver
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>

          {/* Avatar con iniciales */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 12px 40px ${C.orange}35`,
          }}>
            <span style={{
              fontFamily: NEXA, fontSize: 26, fontWeight: 900,
              color: "#fff", letterSpacing: "-.01em",
            }}>{iniciales}</span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: "0 0 6px",
              fontSize: 10, fontWeight: 700, letterSpacing: ".22em",
              textTransform: "uppercase", color: C.orange, fontFamily: SANS,
            }}>Coleccionista</p>
            <h1 style={{
              margin: "0 0 6px",
              fontFamily: SERIF, fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 900, color: C.ink, letterSpacing: "-.025em", lineHeight: 1.1,
            }}>{nombre}</h1>
            <p style={{
              margin: 0,
              fontSize: 13, color: C.sub, fontFamily: SANS,
            }}>{correo}</p>
          </div>

          {/* Explorar */}
          <button onClick={() => navigate("/catalogo")} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 100,
            background: "none", border: `1px solid ${C.border}`,
            fontSize: 10.5, fontWeight: 700, color: C.sub,
            letterSpacing: ".14em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: SANS, transition: "all .2s",
          }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.borderHi; el.style.color=C.ink; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=C.border; el.style.color=C.sub; }}
          >
            <Sparkles size={12} strokeWidth={2} />
            Explorar galería
          </button>
        </div>

        {/* Separador */}
        <div style={{
          height: 1, marginTop: 40,
          background: `linear-gradient(90deg, ${C.orange}40, ${C.pink}30, transparent)`,
        }} />
      </section>

      {/* ── Cards ── */}
      <section className="mc-body" style={{
        maxWidth: 860, margin: "0 auto",
        padding: "0 40px 80px",
      }}>

        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: ".22em",
          textTransform: "uppercase", color: C.muted, fontFamily: SANS,
          marginBottom: 20,
        }}>Resumen</p>

        <div className="mc-cards" style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16,
          marginBottom: 48,
        }}>
          {sections.map(s => (
            <div
              key={s.label}
              className={s.active ? "mc-card-active" : ""}
              onClick={s.onClick}
              style={{
                background: C.card,
                borderRadius: 18,
                padding: "28px 24px",
                boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)",
                border: `1px solid ${C.border}`,
                position: "relative",
                overflow: "hidden",
                opacity: s.active ? 1 : 0.6,
              }}
            >
              {/* Tira de color superior */}
              <div style={{
                position: "absolute", top: 0, left: 24, right: 24, height: 2,
                borderRadius: "0 0 2px 2px",
                background: s.active
                  ? s.accent
                  : `linear-gradient(90deg, ${s.accent}55, transparent)`,
              }} />

              {/* Ícono */}
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${s.accent}14`, border: `1px solid ${s.accent}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.accent, marginBottom: 18,
              }}>
                {s.icon}
              </div>

              {/* Número */}
              {s.active && !loadingCounts ? (
                <div style={{
                  fontFamily: NEXA, fontSize: 36, fontWeight: 900,
                  color: C.ink, lineHeight: 1, marginBottom: 4,
                }}>{s.count}</div>
              ) : s.active ? (
                <div style={{
                  width: 48, height: 36, borderRadius: 8,
                  background: "rgba(0,0,0,0.05)", marginBottom: 4,
                }} />
              ) : (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: ".14em",
                  textTransform: "uppercase", color: s.accent,
                  fontFamily: SANS, marginBottom: 4, paddingTop: 6,
                }}>Próximamente</div>
              )}

              {s.active && (
                <div style={{
                  fontSize: 10.5, color: C.sub, fontFamily: SANS,
                  fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: ".1em", marginBottom: 16,
                }}>{s.unit}</div>
              )}

              {/* Label + flecha */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: s.active ? 0 : 12,
              }}>
                <div>
                  <div style={{
                    fontSize: 13.5, fontWeight: 800, color: C.ink, fontFamily: SANS,
                  }}>{s.label}</div>
                  <div style={{
                    fontSize: 11.5, color: C.sub, fontFamily: SANS, marginTop: 2,
                  }}>{s.desc}</div>
                </div>
                {s.active && (
                  <ChevronRight size={16} color={C.muted} strokeWidth={2} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info cuenta */}
        <div style={{
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          overflow: "hidden",
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg,${C.ink}18,transparent)` }} />
          <div style={{ padding: "22px 26px" }}>
            <p style={{
              margin: "0 0 16px",
              fontSize: 10, fontWeight: 700, letterSpacing: ".2em",
              textTransform: "uppercase", color: C.muted, fontFamily: SANS,
            }}>Datos de la cuenta</p>

            {[
              { label: "Nombre",  value: nombre },
              { label: "Correo",  value: correo },
              { label: "Rol",     value: "Coleccionista / Cliente" },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 12, color: C.sub, fontFamily: SANS, fontWeight: 600 }}>
                  {row.label}
                </span>
                <span style={{ fontSize: 13, color: C.ink, fontFamily: SANS, fontWeight: 600 }}>
                  {row.value}
                </span>
              </div>
            ))}

            <div style={{ paddingTop: 16 }}>
              <span style={{
                fontSize: 11, color: C.muted, fontFamily: SANS, fontStyle: "italic",
              }}>
                Para modificar tus datos contacta a la galería.
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
