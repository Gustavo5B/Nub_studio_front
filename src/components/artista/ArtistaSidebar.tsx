// src/components/artista/ArtistaSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Image, User, LogOut, Plus, ChevronRight, FolderOpen } from "lucide-react";
import { authService } from "../../services/authService";
import logoImg from "../../assets/images/logo.png";

const C = {
  orange: "#E8640C", pink: "#A83B90",
  panel: "#FFFFFF", border: "#E6E4EF",
  text: "#14121E", muted: "#9896A8",
  green: "#0E8A50",
};

const NAV = [
  { id: "dashboard",   label: "Overview",        icon: LayoutDashboard, path: "/artista/dashboard"   },
  { id: "obras",       label: "Mis obras",        icon: Image,           path: "/artista/mis-obras"   },
  { id: "colecciones", label: "Mis colecciones",  icon: FolderOpen,      path: "/artista/colecciones" },
  { id: "perfil",      label: "Mi perfil",        icon: User,            path: "/artista/perfil"      },
];

interface Props {
  readonly onClose?: () => void;
}

export default function ArtistaSidebar({ onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const nombre   = authService.getUserName?.() || "Artista";
  const foto     = localStorage.getItem("artistaFoto") || "";
  const inicial  = nombre.charAt(0).toUpperCase();

  const getActive = () => {
    const path = location.pathname;
    if (path === "/artista/dashboard") return "dashboard";
    const match = NAV.find(n => n.id !== "dashboard" && path.startsWith(n.path));
    return match?.id || "dashboard";
  };
  const active = getActive();

  const go = (path: string) => { navigate(path); onClose?.(); };

  const handleLogout = () => { authService.logout(); navigate("/login"); };

  return (
    <aside style={{
      width: 260, height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 50,
      background: C.panel, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px" }}>
        <img src={logoImg} alt="Nu-B Studio" style={{ height: 34, marginBottom: 28, cursor: "pointer" }}
          onClick={() => go("/")} />

        {/* Chip usuario */}
        <div style={{
          background: "#F9F8FC",
          border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "16px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            background: `linear-gradient(135deg,${C.orange},${C.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "white",
            boxShadow: `0 4px 16px ${C.orange}40`,
          }}>
            {foto
              ? <img src={foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : inicial
            }
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nombre}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
              Artista activo
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 16px" }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, padding: "0 8px", marginBottom: 10 }}>
          Navegación
        </p>
        {NAV.map(({ id, label, icon: Icon, path }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => go(path)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 4,
                background: on ? `${C.orange}10` : "transparent",
                border: on ? `1px solid ${C.orange}30` : "1px solid transparent",
                color: on ? C.orange : C.muted,
                fontSize: 13.5, fontWeight: on ? 700 : 500,
                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                transition: "all .18s ease", textAlign: "left",
              }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "#F3F2F8"; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Icon size={17} strokeWidth={on ? 2.5 : 1.8} />
              {label}
              {on && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}

        <div style={{ height: 1, background: C.border, margin: "16px 0 12px" }} />

        <button onClick={() => go("/artista/nueva-obra")}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "12px 14px", borderRadius: 12,
            background: C.orange,
            border: "none", color: "white",
            fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: `0 4px 14px ${C.orange}35`,
          }}>
          <Plus size={16} /> Subir nueva obra
        </button>
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "10px 14px", borderRadius: 10,
            background: "transparent", border: "1px solid transparent",
            color: C.muted, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            transition: "all .15s",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.pink; el.style.background = `${C.pink}10`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.background = "transparent"; }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}