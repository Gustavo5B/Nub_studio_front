// src/layouts/AdminLayout.tsx
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { authService } from "../services/authService";

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#0C0812",
      fontFamily: "'Outfit', sans-serif",
      color: "#FFF8EE",
    }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Outlet />
      </div>
      <style>{`
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,232,200,0.20); }
        select option { background: #100D1C; color: #FFF8EE; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.10); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.18); }
      `}</style>
    </div>
  );
}