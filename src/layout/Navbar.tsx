// src/layout/Navbar.tsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users, BookOpen, Info, Mail, LogIn, Menu, X,
  User, ShoppingBag, Heart, Settings, LogOut,
  ChevronDown, Sparkles, LayoutDashboard, Palette,
} from "lucide-react";
import logoImg from "../assets/images/logo.png";
import { authService } from "../services/authService";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.20)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const LINKS = [
  { to: "/catalogo",       icon: Palette,   label: "Galería"        },
  { to: "/artistas",       icon: Users,     label: "Artistas"       },
  { to: "/blog",           icon: BookOpen,  label: "Blog"           },
  { to: "/sobre-nosotros", icon: Info,      label: "Sobre nosotros" },
  { to: "/contacto",       icon: Mail,      label: "Contacto"       },
];

export default function Navbar() {
  const [open,       setOpen]       = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  
  const location  = useLocation();
  const navigate  = useNavigate();
  const dropRef   = useRef<HTMLDivElement>(null);

  const isLoggedIn = authService.isAuthenticated();
  const userName   = authService.getUserName() || "Mi cuenta";
  const userEmail  = authService.getUserEmail() || "";
  const userRol    = localStorage.getItem("userRol") || "cliente";

  // Detectar scroll para cambiar fondo del navbar
  useEffect(() => {
    
    
    
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setDropOpen(false);
    setOpen(false);
    navigate("/");
    globalThis.location.reload();
  };

  const initials = userName
    .split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* ── NAVBAR DESKTOP ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 68,
        background: "rgba(7,5,16,0.97)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderBottom: `1px solid ${C.borderBr}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        
        fontFamily: FB,
      }}>
        {/* Línea superior de color */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px", height: "100%", display: "flex", alignItems: "center", gap: 0 }}>

        {/* ── Logo ── */}
<Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0, marginRight: 40 }}>
  
  {/* 🔹 LOGO MÁS GRANDE CON OVERLAY */}
  <div style={{ 
    width: 48,  // Antes 38
    height: 48, // Antes 38
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
    background: C.bgDeep,
    border: `1px solid ${C.orange}30`
  }}>
    <img 
      src={logoImg} 
      alt="Galeria Altar" 
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "contain",
        opacity: 0.95
      }} 
    />
    
    {/* 🔹 OVERLAY PARA OCULTAR EL FONDO BLANCO */}
    <div style={{
      position: "absolute",
      inset: 0,
      background: `linear-gradient(135deg, ${C.orange}40, ${C.purple}40)`,
      mixBlendMode: "multiply",
      pointerEvents: "none"
    }} />
  </div>
  
  <div>
    <div style={{ 
      fontSize: 18,  // Antes 15
      fontWeight: 900, 
      color: C.cream, 
      lineHeight: 1.2, 
      fontFamily: FD, 
      letterSpacing: "-0.01em" 
    }}>
      Galeria<span style={{ color: C.orange }}>Altar</span>
    </div>
    <div style={{ 
      fontSize: 10.5,  // Antes 9.5
      color: C.orange, 
      fontWeight: 700, 
      letterSpacing: "0.18em", 
      textTransform: "uppercase", 
      fontFamily: FB 
    }}>
      Arte Huasteco
    </div>
  </div>
</Link>

          {/* ── Links ── */}
          <ul style={{ display: "flex", alignItems: "center", gap: 2, listStyle: "none", margin: 0, padding: 0, flex: 1 }}>
            {LINKS.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <li key={to}>
                  <Link to={to} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    color: active ? C.cream : C.creamSub,
                    textDecoration: "none",
                    background: active ? `rgba(255,200,150,0.07)` : "transparent",
                    border: `1px solid ${active ? C.borderHi : "transparent"}`,
                    transition: "all .15s",
                    fontFamily: FB,
                  }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = C.cream;
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,200,150,0.05)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = C.creamSub;
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, boxShadow: `0 0 6px ${C.orange}` }} />}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Acciones ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

            {/* No logueado */}
            {!isLoggedIn && (
              <>
                <Link to="/registro-artista" style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 10,
                  background: "rgba(255,200,150,0.05)",
                  border: `1px solid ${C.borderHi}`,
                  color: C.creamSub, fontSize: 13.5, fontWeight: 600,
                  textDecoration: "none", fontFamily: FB,
                  transition: "all .15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.cream; (e.currentTarget as HTMLElement).style.background = "rgba(255,200,150,0.09)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamSub; (e.currentTarget as HTMLElement).style.background = "rgba(255,200,150,0.05)"; }}
                >
                  <Sparkles size={14} color={C.gold} strokeWidth={2} />
                  Ser artista
                </Link>

                <Link to="/login" style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 20px", borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
                  color: "white", fontSize: 13.5, fontWeight: 700,
                  textDecoration: "none", fontFamily: FB,
                  boxShadow: `0 6px 20px ${C.orange}40`,
                  transition: "transform .15s, box-shadow .15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px ${C.orange}55`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.orange}40`; }}
                >
                  <LogIn size={14} strokeWidth={2.5} />
                  Iniciar sesión
                </Link>
              </>
            )}

            {/* Logueado: dropdown */}
            {isLoggedIn && (
              <div style={{ position: "relative" }} ref={dropRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    background: dropOpen ? "rgba(255,200,150,0.10)" : "rgba(255,200,150,0.05)",
                    border: `1px solid ${dropOpen ? C.borderHi : C.borderBr}`,
                    borderRadius: 12, padding: "7px 12px 7px 8px",
                    cursor: "pointer", fontFamily: FB, transition: "all .2s",
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", flexShrink: 0, boxShadow: `0 3px 10px ${C.pink}40` }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.cream, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userName.split(" ")[0]}
                  </span>
                  <ChevronDown size={13} color={C.creamMut} style={{ transition: "transform .2s", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    width: 230, borderRadius: 16,
                    background: "rgba(10,7,20,0.98)",
                    border: `1px solid ${C.borderBr}`,
                    backdropFilter: "blur(32px)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
                    zIndex: 200, overflow: "hidden",
                    animation: "dropIn .2s cubic-bezier(0.16,1,0.3,1)",
                  }}>
                    {/* Header */}
                    <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white", flexShrink: 0 }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userName}</div>
                          <div style={{ fontSize: 11, color: C.creamMut, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userEmail}</div>
                        </div>
                      </div>
                      {userRol === "admin" && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, padding: "3px 10px", borderRadius: 20, background: `linear-gradient(135deg, ${C.orange}25, ${C.pink}15)`, border: `1px solid ${C.orange}40`, fontSize: 10, fontWeight: 800, color: C.orange, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FB }}>
                          <Sparkles size={9} /> Administrador
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div style={{ padding: "8px 0" }}>
                      {userRol === "admin" && (
                        <DropItem icon={<LayoutDashboard size={14} />} label="Panel Admin" onClick={() => { navigate("/admin"); setDropOpen(false); }} color={C.orange} />
                      )}
                      {userRol === "artista" && (
                        <DropItem icon={<Palette size={14} />} label="Mi portal" onClick={() => { navigate("/artista/dashboard"); setDropOpen(false); }} color={C.pink} />
                      )}
                      <DropItem icon={<User size={14} />}        label="Mi perfil"      onClick={() => { navigate("/mi-cuenta"); setDropOpen(false); }} />
                      <DropItem icon={<ShoppingBag size={14} />} label="Mis pedidos"    onClick={() => { navigate("/mi-cuenta/pedidos"); setDropOpen(false); }} />
                      <DropItem icon={<Heart size={14} />}       label="Mis favoritos"  onClick={() => { navigate("/mi-cuenta/favoritos"); setDropOpen(false); }} />
                      <DropItem icon={<Settings size={14} />}    label="Configuración"  onClick={() => { navigate("/mi-cuenta/seguridad"); setDropOpen(false); }} />
                    </div>

                    <div style={{ padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                      <DropItem icon={<LogOut size={14} />} label="Cerrar sesión" onClick={handleLogout} color="#f87171" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Hamburguesa ── */}
          <button
            onClick={() => setOpen(!open)}
            className="nav-hamburger"
            style={{ display: "none", background: "rgba(255,200,150,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: C.creamSub, marginLeft: 12, transition: "all .15s" }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Espaciador para que el contenido no quede detrás del navbar fixed */}
      <div style={{ height: 68 }} />

      {/* ── MENÚ MÓVIL ── */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
          aria-label="Cerrar menú"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(6px)", border: "none", padding: 0, cursor: "default", display: "block", width: "100%" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: "absolute", top: 0, right: 0, width: 290, height: "100%", background: "rgba(10,7,20,0.98)", borderLeft: `1px solid ${C.borderBr}`, backdropFilter: "blur(40px)", display: "flex", flexDirection: "column", animation: "slideIn .25s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Header mobile */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px", borderBottom: `1px solid ${C.borderBr}` }}>
              <img src={logoImg} alt="Nu-B Studio" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.borderBr}` }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.cream, fontFamily: FD }}>Nu-B Studio</div>
                <div style={{ fontSize: 9, color: C.orange, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FB }}>Arte Huasteco</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "rgba(255,200,150,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: C.creamMut }}>
                <X size={18} />
              </button>
            </div>

            {/* User info mobile */}
            {isLoggedIn && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white", flexShrink: 0 }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.cream, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
                  <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
                </div>
              </div>
            )}

            {/* Links mobile */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
              {LINKS.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12, marginBottom: 3,
                    color: active ? C.cream : C.creamSub,
                    background: active ? `rgba(255,200,150,0.07)` : "transparent",
                    border: `1px solid ${active ? C.borderHi : "transparent"}`,
                    textDecoration: "none", fontSize: 14.5, fontWeight: active ? 700 : 500,
                    fontFamily: FB, transition: "all .15s",
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: active ? `${C.orange}20` : "rgba(255,200,150,0.06)", border: `1px solid ${active ? C.orange + "35" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={active ? C.orange : C.creamMut} strokeWidth={active ? 2.2 : 1.8} />
                    </div>
                    {label}
                  </Link>
                );
              })}

              {isLoggedIn && (
                <>
                  <div style={{ height: 1, background: `linear-gradient(90deg, ${C.borderBr}, transparent)`, margin: "10px 0" }} />
                  {userRol === "admin" && (
                    <MobileItem icon={<LayoutDashboard size={16} />} label="Panel Admin" color={C.orange} onClick={() => { navigate("/admin"); setOpen(false); }} />
                  )}
                  {userRol === "artista" && (
                    <MobileItem icon={<Palette size={16} />} label="Mi portal" color={C.pink} onClick={() => { navigate("/artista/dashboard"); setOpen(false); }} />
                  )}
                  <MobileItem icon={<User size={16} />}        label="Mi perfil"      onClick={() => { navigate("/mi-cuenta"); setOpen(false); }} />
                  <MobileItem icon={<ShoppingBag size={16} />} label="Mis pedidos"    onClick={() => { navigate("/mi-cuenta/pedidos"); setOpen(false); }} />
                  <MobileItem icon={<Heart size={16} />}       label="Mis favoritos"  onClick={() => { navigate("/mi-cuenta/favoritos"); setOpen(false); }} />
                  <div style={{ height: 1, background: `linear-gradient(90deg, ${C.borderBr}, transparent)`, margin: "10px 0" }} />
                  <MobileItem icon={<LogOut size={16} />} label="Cerrar sesión" color="#f87171" onClick={handleLogout} />
                </>
              )}

              {!isLoggedIn && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link to="/registro-artista" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, background: "rgba(255,200,150,0.05)", border: `1px solid ${C.borderHi}`, color: C.creamSub, textDecoration: "none", fontSize: 14, fontWeight: 600, fontFamily: FB }}>
                    <Sparkles size={15} color={C.gold} /> Ser artista
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, color: "white", textDecoration: "none", fontSize: 14, fontWeight: 800, fontFamily: FB, boxShadow: `0 6px 20px ${C.orange}40` }}>
                    <LogIn size={15} strokeWidth={2.5} /> Iniciar sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        </button>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes dropIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .nav-hamburger { display: none !important; }
        @media (max-width: 900px) {
          .nav-hamburger { display: flex !important; }
          .nav-links-hide { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────
function DropItem({ icon, label, onClick, color = "" }: {
  readonly icon: React.ReactNode; readonly label: string; readonly onClick: () => void; readonly color?: string;
}) {
  const [hov, setHov] = useState(false);
  const C2 = { cream: "#FFF8EE", creamSub: "#D8CABC", border: "rgba(255,200,150,0.09)" };
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 18px", background: hov ? "rgba(255,232,200,0.05)" : "none", border: "none", cursor: "pointer", color: color || (hov ? C2.cream : C2.creamSub), fontSize: 13.5, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: "all .15s", textAlign: "left" }}>
      {icon}{label}
    </button>
  );
}

function MobileItem({ icon, label, onClick, color = "" }: {
  readonly icon: React.ReactNode; readonly label: string; readonly onClick: () => void; readonly color?: string;
}) {
  const C2 = { creamSub: "#D8CABC" };
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: color || C2.creamSub, fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left", transition: "all .15s" }}>
      {icon}{label}
    </button>
  );
}