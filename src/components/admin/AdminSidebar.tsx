// src/components/admin/AdminSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  LogOut, Layers, Database, Upload, Activity, Settings,
} from "lucide-react";
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

const NAV = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard, path: "/admin"               },
  { id: "obras",        label: "Obras",         icon: Layers,          path: "/admin/obras"         },
  { id: "artistas",     label: "Artistas",      icon: Users,           path: "/admin/artistas"      },
  { id: "ventas",       label: "Ventas",        icon: ShoppingBag,     path: "/admin/ventas"        },
  { id: "reportes",     label: "Reportes",      icon: BarChart2,       path: "/admin/reportes"      },
  { id: "estadisticas", label: "Estadísticas",  icon: Activity,        path: "/admin/estadisticas"  },
  { id: "importar",     label: "Importar",      icon: Upload,          path: "/admin/importar"      },
  { id: "monitoreo",    label: "Monitoreo",     icon: Activity,        path: "/admin/monitoreo"     },
  { id: "backups",      label: "Backups",       icon: Database,        path: "/admin/backups"       },
];

export default function AdminSidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userName  = authService.getUserName?.() || "Admin";

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
        {NAV.map(({ id, label, icon: Icon, path }) => {
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
                <Icon size={17} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.2 : 1.7} />
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
          <Settings size={15} color={C.creamMut} strokeWidth={1.7} />
        </button>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid rgba(204,89,173,0.20)`, background: "rgba(204,89,173,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.16)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"; }}
        >
          <LogOut size={15} color={C.pink} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
