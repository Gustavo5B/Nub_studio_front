// src/pages/private/artista/MiPerfilPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../services/authService";
import MiPerfil, { type ArtistaInfo } from "./MiPerfil";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const C   = { orange: "#FF840E", muted: "rgba(245,240,255,0.45)" };

export default function MiPerfilPage() {
  const navigate          = useNavigate();
  const token             = authService.getToken() ?? "";
  const [artista, setArtista] = useState<ArtistaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/artista-portal/mi-perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setArtista(data); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleActualizar = (nuevaFoto?: string) => {
    if (nuevaFoto) localStorage.setItem("artistaFoto", nuevaFoto);
    setArtista(prev => prev ? { ...prev, foto_perfil: nuevaFoto ?? prev.foto_perfil } : prev);
    navigate("/artista/dashboard");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.orange}20` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.orange, animation: "spin .8s linear infinite" }} />
      </div>
      <p style={{ color: C.muted, fontSize: 14 }}>Cargando perfil...</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (!artista) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
      <p style={{ color: C.muted }}>No se pudo cargar el perfil.</p>
    </div>
  );

  return (
    <div style={{ padding: "32px 36px" }} className="artista-main-pad">
      <MiPerfil artista={artista} token={token} onActualizar={handleActualizar} />
    </div>
  );
}