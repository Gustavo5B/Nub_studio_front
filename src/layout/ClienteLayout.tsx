// src/layout/ClienteLayout.tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "../context/CartContext";

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
  const path   = location.pathname;

  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const linkStyle = (active: boolean): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", padding: "6px 0",
    fontFamily: SANS, fontSize: 12, fontWeight: 600,
    color: active ? C.ink : C.sub,
    letterSpacing: ".05em", transition: "color .15s",
    display: "flex", alignItems: "center", gap: 6,
    borderBottom: active ? `2px solid ${C.orange}` : "2px solid transparent",
    paddingBottom: active ? 2 : 2,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS }}>
      <style>{`
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
          <nav style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, justifyContent: "center" }}>
            <button className="cl-link" style={linkStyle(false)} onClick={() => navigate("/catalogo")}>
              Galería
            </button>
            <button className="cl-link" style={linkStyle(isActive("/mi-cuenta/pedidos"))} onClick={() => navigate("/mi-cuenta/pedidos")}>
              Mis Pedidos
            </button>
            <button className="cl-link" style={linkStyle(isActive("/mi-cuenta/favoritos"))} onClick={() => navigate("/mi-cuenta/favoritos")}>
              <Heart size={12} strokeWidth={2} /> Favoritos
            </button>
            <button className="cl-link" style={{ ...linkStyle(isActive("/mi-cuenta/carrito") || isActive("/checkout")), position: "relative" }} onClick={() => navigate("/mi-cuenta/carrito")}>
              <ShoppingBag size={12} strokeWidth={2} /> Carrito
              {cartCount > 0 && (
                <span className="cl-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
              )}
            </button>
          </nav>

          {/* Avatar + nombre */}
          <button className="cl-link" style={{ ...linkStyle(isActive("/mi-cuenta") && !isActive("/mi-cuenta/pedidos") && !isActive("/mi-cuenta/favoritos") && !isActive("/mi-cuenta/carrito")), gap: 7 }} onClick={() => navigate("/mi-cuenta")}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: C.ink,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <User size={13} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ color: C.ink, fontSize: 12.5, fontWeight: 700 }}>
              {nombre.split(" ")[0]}
            </span>
          </button>
        </div>
      </header>

      {/* Contenido de la página */}
      <Outlet />
    </div>
  );
}
