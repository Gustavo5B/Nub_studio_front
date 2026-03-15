// src/components/admin/AdminSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Settings, LogOut, Layers, Database, Upload, Activity,
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
  creamMut: "rgba(255,232,200,0.35)",
  bgDeep:   "#070510",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const NAV = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard, path: "/admin"             },
  { id: "obras",      label: "Obras",      icon: Layers,          path: "/admin/obras"       },
  { id: "artistas",   label: "Artistas",   icon: Users,           path: "/admin/artistas"    },
  { id: "ventas",     label: "Ventas",     icon: ShoppingBag,     path: "/admin/ventas"      },
  { id: "reportes",   label: "Reportes",   icon: BarChart2,       path: "/admin/reportes"    },
  { id: "importar",   label: "Importar",   icon: Upload,          path: "/admin/importar"    },
  { id: "monitoreo",  label: "Monitoreo",  icon: Activity,        path: "/admin/monitoreo"   },
  { id: "backups",    label: "Backups",    icon: Database,        path: "/admin/backups"     },
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
      width: 220, minHeight: "100vh",
      background: C.bgDeep,
      borderRight: `1px solid ${C.borderBr}`,
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh",
      flexShrink: 0, zIndex: 40,
    }}>
      {/* Línea degradada superior */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />

      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.borderBr}` }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 11, overflow: "hidden",
            flexShrink: 0, background: C.bgDeep,
            border: `1px solid ${C.orange}30`, position: "relative",
          }}>
            <img src={logoImg} alt="Galería Altar" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.95 }} />
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${C.orange}30, ${C.purple}30)`,
              mixBlendMode: "multiply", pointerEvents: "none",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, lineHeight: 1.2, fontFamily: FD, letterSpacing: "-0.01em" }}>
              Galería<span style={{ color: C.orange }}>Altar</span>
            </div>
            <div style={{ fontSize: 9, color: C.orange, marginTop: 2, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: FB, fontWeight: 700 }}>
              Panel Admin
            </div>
          </div>
        </div>

        {/* Usuario */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,200,150,0.04)", border: `1px solid ${C.borderBr}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", fontFamily: FB }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FB }}>{userName}</div>
            <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FB }}>Admin</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.creamMut, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 8px 10px", fontFamily: FB }}>
          Navegación
        </div>
        {NAV.map(({ id, label, icon: Icon, path }) => {
          const on = active === id;
          const showDivider = id === "importar";

          return (
            <div key={id}>
              {showDivider && (
                <div style={{ margin: "6px 8px", borderTop: `1px solid ${C.borderBr}` }} />
              )}
              <button onClick={() => navigate(path)}
                style={{ width: "100%", cursor: "pointer", background: on ? "rgba(255,132,14,0.10)" : "transparent", border: on ? "1px solid rgba(255,132,14,0.22)" : "1px solid transparent", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", position: "relative", fontFamily: FB }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.04)"; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {on && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2.5, borderRadius: "0 3px 3px 0", background: C.orange }} />}
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: on ? "rgba(255,132,14,0.15)" : "rgba(255,232,200,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: on ? "1px solid rgba(255,132,14,0.25)" : "1px solid transparent", transition: "all .15s" }}>
                  <Icon size={15} color={on ? C.orange : C.creamMut} strokeWidth={on ? 2.2 : 1.8} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 400, color: on ? C.cream : C.creamSub, fontFamily: FB }}>{label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px 18px", borderTop: `1px solid ${C.borderBr}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => navigate("/admin/config")}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 12, color: C.creamMut, fontWeight: 600, fontFamily: FB, transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.creamSub}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}>
            <Settings size={13} strokeWidth={1.8} /> Config
          </button>
          <button onClick={handleLogout}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, border: `1px solid rgba(204,89,173,0.25)`, background: "rgba(204,89,173,0.06)", cursor: "pointer", fontSize: 12, color: C.pink, fontWeight: 600, fontFamily: FB, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(204,89,173,0.06)"}>
            <LogOut size={13} strokeWidth={1.8} /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}