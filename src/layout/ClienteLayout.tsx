// src/layout/ClienteLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Heart, ShoppingBag, User, LogOut, Palette, Package, Tag, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { authService } from "../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface CuponPublico {
  codigo: string; descripcion: string | null;
  tipo: "porcentaje" | "monto"; valor: string;
  monto_minimo: string; fecha_fin: string | null;
}

const C = {
  orange: "#E8640C", pink: "#A83B90", blue: "#2D6FBE",
  ink: "#14121E", sub: "#9896A8", border: "#E6E4EF",
};
const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";

export default function ClienteLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { cartCount } = useCart();
  const nombre = localStorage.getItem("userName") || "Mi cuenta";

  const [cupones,        setCupones]        = useState<CuponPublico[]>([]);
  const [bannerVisible,  setBannerVisible]  = useState(false);
  const [bannerIdx,      setBannerIdx]      = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;
    fetch(`${API_URL}/api/cupones/publicos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) {
          setCupones(d.data);
          setBannerVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cupones.length <= 1) return;
    const id = setInterval(() => setBannerIdx(i => (i + 1) % cupones.length), 4000);
    return () => clearInterval(id);
  }, [cupones.length]);

  const fmtValor = (c: CuponPublico) =>
    c.tipo === "porcentaje" ? `${c.valor}% OFF` : `$${Number(c.valor).toLocaleString("es-MX")} MXN OFF`;

  const cupon = cupones[bannerIdx] ?? null;

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };
  const path   = location.pathname;

  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const linkStyle = (active: boolean): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", padding: "6px 0",
    fontFamily: SANS, fontSize: 13.5, fontWeight: 600,
    color: active ? C.ink : C.sub,
    letterSpacing: ".04em", transition: "color .15s",
    display: "flex", alignItems: "center", gap: 7,
    borderBottom: active ? `2px solid ${C.orange}` : "2px solid transparent",
    paddingBottom: 2,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS }}>
      {/* Banner flotante de cupones */}
      {bannerVisible && !bannerDismissed && cupon && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 9990, display: "flex", alignItems: "center", gap: 12,
          background: "rgba(14,138,80,.96)", backdropFilter: "blur(12px)",
          borderRadius: 100, padding: "10px 18px 10px 14px",
          boxShadow: "0 8px 32px rgba(14,138,80,.35)",
          border: "1px solid rgba(255,255,255,.18)", whiteSpace: "nowrap",
          animation: "cl-banner-in .4s cubic-bezier(.16,1,.3,1) both",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Tag size={13} color="#fff" strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".04em" }}>
              Código <span style={{ fontFamily: "'Outfit',sans-serif", background: "rgba(255,255,255,.2)", borderRadius: 4, padding: "1px 7px", letterSpacing: ".08em" }}>{cupon.codigo}</span>
              {" — "}<span style={{ color: "#bbf7d0" }}>{fmtValor(cupon)}</span>
            </div>
            {cupon.descripcion && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)", marginTop: 1 }}>{cupon.descripcion}</div>
            )}
          </div>
          {cupones.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {cupones.map((_, i) => (
                <div key={i} style={{ width: i === bannerIdx ? 12 : 5, height: 5, borderRadius: 100, background: i === bannerIdx ? "#fff" : "rgba(255,255,255,.35)", transition: "all .3s" }}/>
              ))}
            </div>
          )}
          <button onClick={() => setBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0 2px 6px", display: "flex", alignItems: "center", opacity: .65 }}>
            <X size={14} color="#fff" strokeWidth={2.5}/>
          </button>
        </div>
      )}

      <style>{`
        @keyframes cl-banner-in {
          from { opacity:0; transform:translateX(-50%) translateY(20px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        .cl-logo { background:none; border:none; cursor:pointer; padding:0;
          font-family:${SERIF}; font-size:22px; font-weight:900; letter-spacing:-.02em;
          color:${C.ink}; transition:opacity .18s; }
        .cl-logo:hover { opacity:.65; }
        .cl-link:hover { color:${C.ink} !important; }
        .cl-cart-badge {
          position:absolute; top:-5px; right:-8px;
          width:16px; height:16px; border-radius:50%;
          background:${C.orange}; color:#fff;
          font-size:9px; font-weight:700; font-family:${SANS};
          display:flex; align-items:center; justify-content:center;
          border:2px solid #fff;
        }
      `}</style>

      {/* Navbar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,.95)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Línea arcoíris */}
        <div style={{ height: 2.5, background: `linear-gradient(90deg,${C.orange},${C.pink},${C.blue},${C.orange})` }} />

        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 40px", height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
        }}>
          {/* Logo */}
          <button className="cl-logo" onClick={() => navigate("/")}>
            NU<span style={{ color: C.orange }}>★</span>B
          </button>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 34, flex: 1, justifyContent: "center" }}>
            <button className="cl-link" style={linkStyle(isActive("/catalogo"))} onClick={() => navigate("/catalogo")}>
              <Palette size={14} strokeWidth={1.8} /> Galería
            </button>
            <button className="cl-link" style={linkStyle(isActive("/mi-cuenta/pedidos"))} onClick={() => navigate("/mi-cuenta/pedidos")}>
              <Package size={14} strokeWidth={1.8} /> Mis Pedidos
            </button>
            <button className="cl-link" style={linkStyle(isActive("/mi-cuenta/favoritos"))} onClick={() => navigate("/mi-cuenta/favoritos")}>
              <Heart size={14} strokeWidth={1.8} /> Favoritos
            </button>
            <button className="cl-link" style={{ ...linkStyle(isActive("/mi-cuenta/carrito") || isActive("/checkout")), position: "relative" }} onClick={() => navigate("/mi-cuenta/carrito")}>
              <ShoppingBag size={14} strokeWidth={1.8} /> Carrito
              {cartCount > 0 && (
                <span className="cl-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
              )}
            </button>
          </nav>

          {/* Avatar + nombre + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="cl-link" style={{ ...linkStyle(isActive("/mi-cuenta") && !isActive("/mi-cuenta/pedidos") && !isActive("/mi-cuenta/favoritos") && !isActive("/mi-cuenta/carrito")), gap: 9 }} onClick={() => navigate("/mi-cuenta")}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.ink} 0%, #2D1A4A 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(20,18,30,.25)",
              }}>
                <User size={16} color="#fff" strokeWidth={1.8} />
              </div>
              <span style={{ color: C.ink, fontSize: 13.5, fontWeight: 700 }}>
                {nombre.split(" ")[0]}
              </span>
            </button>
            <div style={{ width: 1, height: 16, background: C.border }} />
            <button
              title="Cerrar sesión"
              onClick={handleLogout}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "7px 8px", display: "flex", alignItems: "center",
                color: C.sub, transition: "color .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#C4304A")}
              onMouseLeave={e => (e.currentTarget.style.color = C.sub)}
            >
              <LogOut size={18} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido de la página */}
      <Outlet />
    </div>
  );
}
