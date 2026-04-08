// src/pages/cliente/MiCuenta.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, LogOut, User } from "lucide-react";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", ink: "#14121E", sub: "#9896A8",
  bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const SANS  = "'Outfit', sans-serif";
const SERIF = "'SolveraLorvane', serif";

export default function MiCuenta() {
  const navigate = useNavigate();
  const [cartCount,   setCartCount]   = useState(0);
  const [orderCount,  setOrderCount]  = useState(0);

  const nombre = localStorage.getItem("userName") || "Cliente";
  const correo = localStorage.getItem("userEmail") || "";

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    fetch(`${API_URL}/api/carrito`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCartCount(d.data.length); })
      .catch(() => {});

    fetch(`${API_URL}/api/ventas/mis-pedidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrderCount(d.data.length); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const cards = [
    {
      icon:    <ShoppingCart size={24} color={C.orange} strokeWidth={1.5} />,
      label:   "Mi Carrito",
      value:   cartCount,
      sub:     cartCount === 1 ? "obra" : "obras",
      onClick: () => navigate("/mi-cuenta/carrito"),
      accent:  C.orange,
    },
    {
      icon:    <Package size={24} color="#2D6FBE" strokeWidth={1.5} />,
      label:   "Mis Pedidos",
      value:   orderCount,
      sub:     orderCount === 1 ? "orden" : "órdenes",
      onClick: () => navigate("/mi-cuenta/pedidos"),
      accent:  "#2D6FBE",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        .mc-card { transition: box-shadow .22s, transform .22s; cursor: pointer; }
        .mc-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.10); transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: C.ink, letterSpacing: "-.02em" }}>
          NU★B
        </button>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 100, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: C.sub, fontFamily: SANS, transition: "all .22s" }}>
          <LogOut size={13} strokeWidth={2} />
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

        {/* Perfil */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.orange}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={26} color={C.orange} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{nombre}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{correo}</div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
          {cards.map(card => (
            <div
              key={card.label}
              className="mc-card"
              onClick={card.onClick}
              style={{ background: C.card, borderRadius: 12, padding: "28px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.055)", borderTop: `3px solid ${card.accent}` }}
            >
              <div style={{ marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600 }}>{card.sub}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 12 }}>{card.label} →</div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/catalogo")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 100, padding: "10px 22px", fontSize: 12, fontWeight: 600, color: C.sub, cursor: "pointer", fontFamily: SANS, transition: "all .22s" }}>
          ← Explorar catálogo
        </button>
      </main>
    </div>
  );
}
