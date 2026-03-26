// src/components/admin/AdminSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bgDeep:   "#FFFFFF",
  bg:       "#F9F8FC",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};

const FB = "'Outfit', sans-serif";

// ─── SVG Icons con color propio ────────────────────────────────────────────────

type IP = { size?: number; active?: boolean };

const IcoDashboard = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2"  y="2"  width="8" height="11" rx="1.5" fill={active ? "#E8640C" : "#6028AA"} fillOpacity={active ? 1 : 0.75}/>
    <rect x="12" y="2"  width="6" height="5"  rx="1.5" fill={active ? "#E8640C" : "#A83B90"} fillOpacity={active ? 1 : 0.7}/>
    <rect x="12" y="9"  width="6" height="4"  rx="1.5" fill={active ? "#E8640C" : "#2D6FBE"} fillOpacity={active ? 1 : 0.7}/>
    <rect x="2"  y="15" width="16" height="3" rx="1.5" fill={active ? "#E8640C" : "#A87006"} fillOpacity={active ? 1 : 0.65}/>
  </svg>
);

const IcoObras = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="16" height="16" rx="2"
      fill={active ? "#E8640C" : "#2D6FBE"} fillOpacity={active ? 0.15 : 0.12}
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.4"/>
    <path d="M5 15 L8 10 L11 13 L13.5 8.5 L16 13"
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6.5" cy="6.5" r="1.5" fill={active ? "#E8640C" : "#A87006"}/>
  </svg>
);

const IcoArtistas = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="8" cy="5.5" r="3"
      fill={active ? "#E8640C" : "#A83B90"} fillOpacity={active ? 0.2 : 0.15}
      stroke={active ? "#E8640C" : "#A83B90"} strokeWidth="1.4"/>
    <path d="M2.5 17.5 C2.5 13.5 5 11.5 8 11.5 C11 11.5 13.5 13.5 13.5 17.5"
      stroke={active ? "#E8640C" : "#A83B90"} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    <circle cx="15.5" cy="10" r="3"
      fill={active ? "#E8640C" : "#0E8A50"} fillOpacity={active ? 0.2 : 0.12}
      stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.2"/>
    <line x1="15.5" y1="7.5" x2="15.5" y2="12.5"
      stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="13" y1="10" x2="18" y2="10"
      stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IcoVentas = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10.5 2.5 L17 9 C17.4 9.4 17.4 10 17 10.4 L10.4 17 C10 17.4 9.4 17.4 9 17 L2.5 10.5 C2.2 10.2 2 9.8 2 9.4 L2 4 C2 3.2 2.7 2.5 3.5 2.5 Z"
      fill={active ? "#E8640C" : "#A87006"} fillOpacity={active ? 0.18 : 0.14}
      stroke={active ? "#E8640C" : "#A87006"} strokeWidth="1.4"/>
    <circle cx="5.5" cy="5.5" r="1.2" fill={active ? "#E8640C" : "#A87006"}/>
    <line x1="8.5" y1="12" x2="12" y2="8.5"
      stroke={active ? "#E8640C" : "#A87006"} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="12" cy="8.5" r="1" fill={active ? "#E8640C" : "#A87006"}/>
    <circle cx="8.5" cy="12" r="1" fill={active ? "#E8640C" : "#A87006"}/>
  </svg>
);

const IcoReportes = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M4 2 H13 L16 5 V18 H4 Z"
      fill={active ? "#E8640C" : "#6028AA"} fillOpacity={active ? 0.12 : 0.1}
      stroke={active ? "#E8640C" : "#6028AA"} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M13 2 V5 H16" stroke={active ? "#E8640C" : "#6028AA"} strokeWidth="1.2" fill="none"/>
    <line x1="7" y1="8.5"  x2="13" y2="8.5"  stroke={active ? "#E8640C" : "#6028AA"} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="11.5" x2="13" y2="11.5" stroke={active ? "#E8640C" : "#6028AA"} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="14.5" x2="10.5" y2="14.5" stroke={active ? "#E8640C" : "#A83B90"} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IcoEstadisticas = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <polyline points="3,14 6.5,9 10,12 13.5,5 17,7.5"
      stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6.5"  cy="9"   r="1.8" fill={active ? "#E8640C" : "#0E8A50"}/>
    <circle cx="13.5" cy="5"   r="1.8" fill={active ? "#E8640C" : "#2D6FBE"}/>
    <circle cx="10"   cy="12"  r="1.4" fill={active ? "#E8640C" : "#A87006"}/>
    <line x1="2" y1="16.5" x2="18" y2="16.5"
      stroke={active ? "#E8640C" : C.creamMut} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IcoImportar = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 13.5 V16 C3 17.1 3.9 18 5 18 H15 C16.1 18 17 17.1 17 16 V13.5"
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    <line x1="10" y1="3" x2="10" y2="13"
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.4" strokeLinecap="round"/>
    <polyline points="6.5,9 10,13 13.5,9"
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="4" y="13" width="12" height="4" rx="1"
      fill={active ? "#E8640C" : "#2D6FBE"} fillOpacity="0.1"/>
  </svg>
);

const IcoMonitoreo = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2" y="3" width="16" height="11" rx="2"
      fill={active ? "#E8640C" : "#A83B90"} fillOpacity={active ? 0.12 : 0.1}
      stroke={active ? "#E8640C" : "#A83B90"} strokeWidth="1.4"/>
    <line x1="7"  y1="18" x2="13" y2="18" stroke={active ? "#E8640C" : C.creamMut} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="10" y1="14" x2="10" y2="18" stroke={active ? "#E8640C" : C.creamMut} strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="3.5,9 5.5,9 7,6.5 9,11.5 11,7 12.5,9 15.5,9"
      stroke={active ? "#E8640C" : "#A83B90"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IcoBackups = ({ size = 20, active }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <ellipse cx="10" cy="5.5"  rx="7" ry="2.5"
      fill={active ? "#E8640C" : "#A87006"} fillOpacity={active ? 0.18 : 0.14}
      stroke={active ? "#E8640C" : "#A87006"} strokeWidth="1.4"/>
    <path d="M3 5.5  V10.5" stroke={active ? "#E8640C" : "#A87006"} strokeWidth="1.4"/>
    <path d="M17 5.5 V10.5" stroke={active ? "#E8640C" : "#A87006"} strokeWidth="1.4"/>
    <ellipse cx="10" cy="10.5" rx="7" ry="2.5"
      fill={active ? "#E8640C" : "#0E8A50"} fillOpacity={active ? 0.15 : 0.1}
      stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.4"/>
    <path d="M3 10.5 V15" stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.4"/>
    <path d="M17 10.5 V15" stroke={active ? "#E8640C" : "#0E8A50"} strokeWidth="1.4"/>
    <ellipse cx="10" cy="15"   rx="7" ry="2.5"
      fill={active ? "#E8640C" : "#2D6FBE"} fillOpacity={active ? 0.15 : 0.1}
      stroke={active ? "#E8640C" : "#2D6FBE"} strokeWidth="1.4"/>
  </svg>
);

const IcoSettings = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={C.creamSub} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="2.5"/>
    <path d="M10 2 V4 M10 16 V18 M2 10 H4 M16 10 H18
             M4.93 4.93 L6.34 6.34 M13.66 13.66 L15.07 15.07
             M15.07 4.93 L13.66 6.34 M6.34 13.66 L4.93 15.07"/>
  </svg>
);

const IcoLogout = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={C.pink} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
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
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "sticky",
      top: 0,
      height: "100vh",
      flexShrink: 0,
      zIndex: 40,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {/* ❌ Línea degradada eliminada */}

      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        title="Ir al sitio"
        style={{
          padding: "14px 0 10px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${C.border}`, background: C.bg, flexShrink: 0,
        }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.85 }} />
        </div>
      </div>

      {/* Avatar */}
      <div style={{
        padding: "10px 0 8px",
        borderBottom: `1px solid ${C.border}`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}>
        <div title={userName} style={{
          width: 34, height: 34, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "white", fontFamily: FB, cursor: "default",
          position: "relative",
          boxShadow: "0 2px 8px rgba(160, 59, 144, 0.25)",
        }}>
          {userName?.[0]?.toUpperCase() || "A"}
          <span style={{
            position: "absolute", bottom: 0, right: 0,
            width: 8, height: 8, borderRadius: "50%",
            background: C.green, border: `2px solid ${C.bgDeep}`,
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "8px 0",
        width: "100%",
        overflowY: "auto",
      }}>
        {NAV.map(({ id, label, Icon, path }) => {
          const on = active === id;
          return (
            <div key={id} style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}>
              <button
                onClick={() => navigate(path)}
                title={label}
                style={{
                  width: 54,
                  height: 52,
                  borderRadius: 10,
                  border: on ? `1px solid ${C.border}` : `1px solid transparent`,
                  background: on ? `${C.orange}12` : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  transition: "all .15s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {on && (
                  <div style={{
                    position: "absolute", left: -2, top: "20%", bottom: "20%",
                    width: 2.5, borderRadius: "0 2px 2px 0", background: C.orange,
                  }} />
                )}

                {/* Icono con color */}
                <Icon size={22} active={on} />

                {/* Label negro, más grande */}
                <span style={{
                  fontSize: 10,
                  fontWeight: on ? 700 : 500,
                  color: on ? C.orange : "#14121E",   // ← negro en lugar de gris
                  fontFamily: FB,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                }}>
                  {label.length > 9 ? label.slice(0, 8) + "…" : label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "8px 0 14px",
        borderTop: `1px solid ${C.border}`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}>
        <button
          onClick={() => navigate("/admin/config")}
          title="Configuración"
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(0,0,0,0.04)"; el.style.borderColor = C.creamSub; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = C.border; }}
        >
          <IcoSettings />
        </button>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${C.pink}12`; el.style.borderColor = C.pink; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = C.border; }}
        >
          <IcoLogout />
        </button>
      </div>
    </div>
  );
}