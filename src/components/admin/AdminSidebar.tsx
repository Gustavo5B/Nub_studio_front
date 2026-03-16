// src/components/admin/AdminSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.30)",
  bgDeep:   "#070510",
  border:   "rgba(255,200,150,0.07)",
  borderBr: "rgba(118,78,49,0.18)",
};

const FB = "'Outfit', sans-serif";

// ─── SVG Icons artesanales ─────────────────────────────────────────────────────

type IP = { color: string; size?: number; sw?: number };

/** Panel bento asimétrico */
const IcoDashboard = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2"  y="2"  width="8" height="11" rx="1.5"/>
    <rect x="12" y="2"  width="6" height="5"  rx="1.5"/>
    <rect x="12" y="9"  width="6" height="4"  rx="1.5"/>
    <rect x="2"  y="15" width="16" height="3" rx="1.5"/>
  </svg>
);

/** Marco de cuadro con paisaje + sol — galería */
const IcoObras = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="16" height="16" rx="2"/>
    <path d="M5 15 L8 10 L11 13 L13.5 8.5 L16 13"/>
    <circle cx="6.5" cy="6.5" r="1.5"/>
  </svg>
);

/** Persona + pincel artístico */
const IcoArtistas = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8.5" cy="6" r="3"/>
    <path d="M3 17.5 C3 13.5 5.5 11.5 8.5 11.5 C11.5 11.5 14 13.5 14 17.5"/>
    {/* Pincel */}
    <line x1="15" y1="3" x2="17.5" y2="5.5" strokeWidth="1.8"/>
    <path d="M15 3 L14 4 L16 6 L17 5 Z" fill={color} stroke="none"/>
    <path d="M13.5 5.5 Q12.5 8 14 9" strokeWidth="1.3"/>
  </svg>
);

/** Etiqueta de precio con diagonal de valor */
const IcoVentas = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 2.5 L17 9 C17.4 9.4 17.4 10 17 10.4 L10.4 17 C10 17.4 9.4 17.4 9 17 L2.5 10.5 C2.2 10.2 2 9.8 2 9.4 L2 4 C2 3.2 2.7 2.5 3.5 2.5 Z"/>
    <circle cx="5.5" cy="5.5" r="1.2"/>
    <line x1="8.5" y1="12" x2="12" y2="8.5" strokeWidth="1.4"/>
  </svg>
);

/** Documento con líneas de datos */
const IcoReportes = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2 H13 L16 5 V18 H4 Z"/>
    <path d="M13 2 V5 H16" strokeWidth="1.2"/>
    <line x1="7" y1="8.5"  x2="13" y2="8.5"/>
    <line x1="7" y1="11.5" x2="13" y2="11.5"/>
    <line x1="7" y1="14.5" x2="10.5" y2="14.5"/>
  </svg>
);

/** Línea de tendencia con puntos de inflexión */
const IcoEstadisticas = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,14 6.5,9 10,12 13.5,5 17,7.5"/>
    <circle cx="6.5"  cy="9" r="1.4" fill={color} stroke="none"/>
    <circle cx="13.5" cy="5" r="1.4" fill={color} stroke="none"/>
    <line x1="2" y1="16.5" x2="18" y2="16.5" strokeWidth="1.2"/>
  </svg>
);

/** Bandeja de entrada con flecha descendente */
const IcoImportar = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13.5 V16 C3 17.1 3.9 18 5 18 H15 C16.1 18 17 17.1 17 16 V13.5"/>
    <line x1="10" y1="3" x2="10" y2="13.5"/>
    <polyline points="6.5,9.5 10,13.5 13.5,9.5"/>
  </svg>
);

/** Monitor con ECG */
const IcoMonitoreo = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="16" height="11" rx="2"/>
    <line x1="7"  y1="18" x2="13" y2="18"/>
    <line x1="10" y1="14" x2="10" y2="18"/>
    <polyline points="4.5,9 6.5,9 8,6.5 10,11.5 12,7 13.5,9 15.5,9" strokeWidth="1.5"/>
  </svg>
);

/** Cilindros apilados — servidor */
const IcoBackups = ({ color, size = 18, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="10" cy="5.5"  rx="7" ry="2.5"/>
    <path d="M3 5.5  V10.5"/>
    <path d="M17 5.5 V10.5"/>
    <ellipse cx="10" cy="10.5" rx="7" ry="2.5"/>
    <path d="M3 10.5 V15"/>
    <path d="M17 10.5 V15"/>
    <ellipse cx="10" cy="15"   rx="7" ry="2.5"/>
  </svg>
);

/** Engranaje refinado con 8 rayos */
const IcoSettings = ({ color, size = 16, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="2.5"/>
    <path d="M10 2 V4 M10 16 V18 M2 10 H4 M16 10 H18
             M4.93 4.93 L6.34 6.34 M13.66 13.66 L15.07 15.07
             M15.07 4.93 L13.66 6.34 M6.34 13.66 L4.93 15.07"/>
  </svg>
);

/** Flecha saliendo de caja */
const IcoLogout = ({ color, size = 16, sw = 1.65 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3 H5 C3.9 3 3 3.9 3 5 V15 C3 16.1 3.9 17 5 17 H8"/>
    <polyline points="13,7 17,10 13,13"/>
    <line x1="17" y1="10" x2="8" y2="10"/>
  </svg>
);

// ─── Nav config ────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",    label: "Dashboard",   Icon: IcoDashboard,    path: "/admin"              },
  { id: "obras",        label: "Obras",        Icon: IcoObras,        path: "/admin/obras"        },
  { id: "artistas",     label: "Artistas",     Icon: IcoArtistas,     path: "/admin/artistas"     },
  { id: "ventas",       label: "Ventas",       Icon: IcoVentas,       path: "/admin/ventas"       },
  { id: "reportes",     label: "Reportes",     Icon: IcoReportes,     path: "/admin/reportes"     },
  { id: "estadisticas", label: "Estadísticas", Icon: IcoEstadisticas, path: "/admin/estadisticas" },
  { id: "importar",     label: "Importar",     Icon: IcoImportar,     path: "/admin/importar"     },
  { id: "monitoreo",    label: "Monitoreo",    Icon: IcoMonitoreo,    path: "/admin/monitoreo"    },
  { id: "backups",      label: "Backups",      Icon: IcoBackups,      path: "/admin/backups"      },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = authService.getUserName?.() || "Admin";

  const getActive = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "dashboard";
    const match = NAV.find(n => n.id !== "dashboard" && path.startsWith(n.path));
    return match?.id || "dashboard";
  };
  const active = getActive();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div style={{
      width: 72,
      minHeight: "100vh",
      background: C.bgDeep,
      borderRight: `1px solid ${C.borderBr}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "sticky",
      top: 0,
      height: "100vh",
      flexShrink: 0,
      zIndex: 40,
    }}>
      {/* Línea degradada superior */}
      <div style={{ height: 2, width: "100%", background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        title="Ir al sitio"
        style={{ padding: "16px 0 12px", cursor: "pointer", display: "flex", justifyContent: "center", width: "100%", borderBottom: `1px solid ${C.borderBr}` }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${C.orange}28`, background: C.bgDeep, flexShrink: 0,
        }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.92 }} />
        </div>
      </div>

      {/* Avatar */}
      <div style={{ padding: "12px 0 10px", borderBottom: `1px solid ${C.borderBr}`, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div title={userName} style={{
          width: 34, height: 34, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "white", fontFamily: FB, cursor: "default",
          position: "relative",
        }}>
          {userName?.[0]?.toUpperCase() || "A"}
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 8, height: 8, borderRadius: "50%",
            background: C.green, border: `1.5px solid ${C.bgDeep}`,
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0", width: "100%", overflowY: "auto" }}>
        {NAV.map(({ id, label, Icon, path }) => {
          const on = active === id;
          return (
            <div key={id} style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}>
              <button
                onClick={() => navigate(path)}
                title={label}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: on ? `1px solid rgba(255,132,14,0.28)` : "1px solid transparent",
                  background: on ? "rgba(255,132,14,0.12)" : "transparent",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  transition: "all .15s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.05)"; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {on && (
                  <div style={{ position: "absolute", left: -1, top: "20%", bottom: "20%", width: 2.5, borderRadius: "0 3px 3px 0", background: C.orange }} />
                )}
                <Icon color={on ? C.orange : C.creamMut} size={18} sw={on ? 2.0 : 1.6} />
                <span style={{ fontSize: 8.5, fontWeight: on ? 700 : 500, color: on ? C.orange : C.creamMut, fontFamily: FB, lineHeight: 1, letterSpacing: "0.02em" }}>
                  {label.length > 8 ? label.slice(0, 7) + "…" : label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 0 16px", borderTop: `1px solid ${C.borderBr}`, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => navigate("/admin/config")}
          title="Configuración"
          style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,232,200,0.05)"; el.style.borderColor = C.borderBr; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = C.border; }}
        >
          <IcoSettings color={C.creamMut} />
        </button>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid rgba(204,89,173,0.20)`, background: "rgba(204,89,173,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.16)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"; }}
        >
          <IcoLogout color={C.pink} />
        </button>
      </div>
    </div>
  );
}
