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
    <>
      <style>{`
        .as-sidebar {
          width: 260px; height: 100vh;
          position: fixed; left: 0; top: 0; z-index: 50;
          background: ${C.panel}; border-right: 1px solid ${C.border};
          display: flex; flex-direction: column;
          box-shadow: 2px 0 8px rgba(0,0,0,0.06);
        }
        .as-header { 
          padding: 24px 20px 16px; 
          flex-shrink: 0; 
        }
        .as-logo { 
          height: 30px; 
          margin-bottom: 20px; 
          cursor: pointer; 
        }

        .as-chip {
          background: #F9F8FC; 
          border: 1px solid ${C.border};
          border-radius: 14px; 
          padding: 12px 14px;
          display: flex; 
          align-items: center; 
          gap: 12px;
        }
        .as-avatar {
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          flex-shrink: 0; 
          overflow: hidden;
          background: linear-gradient(135deg,${C.orange},${C.pink});
          display: flex; 
          align-items: center; 
          justify-content: center;
          font-size: 18px; 
          font-weight: 900; 
          color: white;
          box-shadow: 0 4px 12px ${C.orange}35;
        }
        .as-avatar img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        .as-name { 
          font-size: 13px; 
          font-weight: 800; 
          color: ${C.text}; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }
        .as-status { 
          font-size: 11px; 
          color: ${C.muted}; 
          margin-top: 2px; 
          display: flex; 
          align-items: center; 
          gap: 4px; 
        }
        .as-dot { 
          width: 6px; 
          height: 6px; 
          border-radius: 50%; 
          background: ${C.green}; 
          flex-shrink: 0; 
        }

        .as-nav { 
          flex: 1; 
          overflow-y: auto; 
          padding: 8px 14px; 
          min-height: 0; 
        }
        .as-nav::-webkit-scrollbar { 
          width: 3px; 
        }
        .as-nav::-webkit-scrollbar-thumb { 
          background: ${C.border}; 
          border-radius: 4px; 
        }
        .as-section-label { 
          font-size: 10px; 
          font-weight: 800; 
          color: ${C.muted}; 
          text-transform: uppercase; 
          letter-spacing: 1.5px; 
          padding: 0 8px; 
          margin-bottom: 8px; 
        }

        .as-nav-btn {
          display: flex; 
          align-items: center; 
          gap: 11px;
          width: 100%; 
          padding: 11px 13px; 
          border-radius: 11px; 
          margin-bottom: 3px;
          background: transparent; 
          border: 1px solid transparent;
          color: ${C.muted}; 
          font-size: 13px; 
          font-weight: 500;
          cursor: pointer; 
          font-family: 'Outfit', sans-serif;
          transition: all .18s; 
          text-align: left;
        }
        .as-nav-btn:hover { 
          background: #F3F2F8; 
          color: ${C.text}; 
        }
        .as-nav-btn.active {
          background: ${C.orange}10; 
          border-color: ${C.orange}30;
          color: ${C.orange}; 
          font-weight: 700;
        }
        .as-chevron { 
          margin-left: auto; 
        }

        .as-divider { 
          height: 1px; 
          background: ${C.border}; 
          margin: 12px 0; 
        }

        .as-new-btn {
          display: flex; 
          align-items: center; 
          gap: 10px;
          width: 100%; 
          padding: 11px 14px; 
          border-radius: 11px;
          background: ${C.orange}; 
          border: none; 
          color: white;
          font-size: 13px; 
          font-weight: 700; 
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 14px ${C.orange}35;
          transition: opacity .18s, transform .18s;
        }
        .as-new-btn:hover { 
          opacity: .88; 
          transform: translateY(-1px); 
        }

        /* ─── FOOTER SIEMPRE VISIBLE ─── */
        .as-footer { 
          padding: 12px 14px; 
          border-top: 1px solid ${C.border}; 
          flex-shrink: 0; 
          background: ${C.panel}; /* Fondo sólido para que no se transparente */
          z-index: 1; /* Asegura que esté por encima del contenido scrolleable */
        }
        .as-logout {
          display: flex; 
          align-items: center; 
          gap: 10px;
          width: 100%; 
          padding: 10px 13px; 
          border-radius: 10px;
          background: transparent; 
          border: 1px solid transparent;
          color: ${C.muted}; 
          font-size: 13px; 
          font-weight: 500;
          cursor: pointer; 
          font-family: 'Outfit', sans-serif;
          transition: all .15s;
        }
        .as-logout:hover { 
          color: ${C.pink}; 
          background: ${C.pink}10; 
          border-color: ${C.pink}22; 
        }
        .as-logout-label { 
          flex: 1; 
          text-align: left; 
        }

        /* ─── RESPONSIVE: Mobile / Horizontal ─── */
        @media (max-width: 900px) {
          .as-sidebar { 
            width: 240px; 
          }
          .as-header { 
            padding: 18px 16px 14px; 
          }
          .as-logo { 
            height: 26px; 
            margin-bottom: 16px; 
          }
          .as-nav { 
            padding: 6px 12px; 
          }
          .as-nav-btn { 
            padding: 10px 12px; 
            font-size: 13px; 
          }
          .as-footer { 
            padding: 10px 12px; 
            /* Aseguramos que el footer siempre esté visible incluso en horizontal */
            position: relative;
            bottom: 0;
            width: 100%;
          }
          .as-logout {
            padding: 9px 12px;
          }
        }

        /* ─── AÚN MÁS PEQUEÑO (tablet horizontal / móvil landscape) ─── */
        @media (max-width: 768px) and (orientation: landscape) {
          .as-sidebar {
            width: 220px;
          }
          .as-header {
            padding: 12px 14px 10px;
          }
          .as-chip {
            padding: 8px 10px;
          }
          .as-avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
          .as-name {
            font-size: 11px;
          }
          .as-status {
            font-size: 9px;
          }
          .as-nav {
            padding: 4px 10px;
          }
          .as-nav-btn {
            padding: 8px 10px;
            font-size: 12px;
          }
          .as-new-btn {
            padding: 8px 12px;
            font-size: 12px;
          }
          .as-footer {
            padding: 8px 10px;
          }
          .as-logout {
            padding: 7px 10px;
            font-size: 12px;
          }
        }

        /* ─── GARANTÍA EXTRA: siempre visible en cualquier viewport ─── */
        @media (max-height: 500px) {
          .as-sidebar {
            overflow-y: auto;
          }
          .as-footer {
            position: sticky;
            bottom: 0;
            background: ${C.panel};
            box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
          }
        }
      `}</style>

      <aside className="as-sidebar">

        {/* ── HEADER ── */}
        <div className="as-header">
          <img src={logoImg} alt="Nu-B Studio" className="as-logo" onClick={() => go("/")} />

          <div className="as-chip">
            <div className="as-avatar">
              {foto ? <img src={foto} alt="Foto"/> : inicial}
            </div>
            <div style={{ overflow:"hidden", flex:1, minWidth:0 }}>
              <div className="as-name">{nombre}</div>
              <div className="as-status">
                <div className="as-dot"/>
                Artista activo
              </div>
            </div>
          </div>
        </div>

        {/* ── NAV (scrollable) ── */}
        <nav className="as-nav">
          <p className="as-section-label">Navegación</p>

          {NAV.map(({ id, label, icon: Icon, path }) => {
            const on = active === id;
            return (
              <button key={id} className={`as-nav-btn${on ? " active" : ""}`} onClick={() => go(path)}>
                <Icon size={17} strokeWidth={on ? 2.5 : 1.8}/>
                {label}
                {on && <ChevronRight size={14} className="as-chevron"/>}
              </button>
            );
          })}

          <div className="as-divider"/>

          <button className="as-new-btn" onClick={() => go("/artista/nueva-obra")}>
            <Plus size={16}/> Subir nueva obra
          </button>
        </nav>

        {/* ── FOOTER (SIEMPRE VISIBLE) ── */}
        <div className="as-footer">
          <button className="as-logout" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.8}/>
            <span className="as-logout-label">Cerrar sesión</span>
          </button>
        </div>

      </aside>
    </>
  );
}