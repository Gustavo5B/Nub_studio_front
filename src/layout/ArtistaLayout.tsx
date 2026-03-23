// src/layout/ArtistaLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import ArtistaSidebar from "../components/artista/ArtistaSidebar";
import logoImg from "../assets/images/logo.png";

const C = {
  bg: "#080612", border: "rgba(255,255,255,0.07)", text: "#f5f0ff",
};

export default function ArtistaLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text,
    }}>
      {/* Sidebar desktop */}
      <div className="artista-sidebar-desktop" style={{ width: 260, flexShrink: 0 }}>
        <ArtistaSidebar />
      </div>

      {/* Sidebar móvil overlay */}
      {sidebarOpen && (
        <>
          <button
            aria-label="Cerrar menú"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 49, border: "none", cursor: "default", padding: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: "fixed", left: 0, top: 0, zIndex: 50 }}>
            <ArtistaSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar móvil */}
        <div className="artista-topbar-mobile" style={{
          display: "none", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
          background: C.bg, position: "sticky", top: 0, zIndex: 40,
        }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", color: C.text, cursor: "pointer" }}>
            <Menu size={22} />
          </button>
          <img src={logoImg} alt="Nu-B Studio" style={{ height: 30 }} />
          <div style={{ width: 22 }} />
        </div>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 8px; }
        @media (max-width: 900px) {
          .artista-sidebar-desktop { display: none !important; }
          .artista-topbar-mobile   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}