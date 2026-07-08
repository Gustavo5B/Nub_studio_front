// src/layout/ClienteLayout.tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Heart, ShoppingBag, User, LogOut, Palette, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { authService } from "../services/authService";

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
