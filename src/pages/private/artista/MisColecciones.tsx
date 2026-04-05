// src/pages/private/artista/MisColecciones.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

interface Coleccion {
  id_coleccion: number;
  nombre: string;
  slug: string;
  historia: string | null;
  imagen_portada: string | null;
  estado: string;
  destacada: boolean;
  fecha_creacion: string;
  total_obras: number;
}

interface ObraResumen {
  id_obra: number;
  titulo: string;
  imagen_principal: string | null;
  id_coleccion: number | null;
  estado: string;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
  .mc-wrap { padding: 36px 40px; max-width: 900px; font-family: 'Outfit', sans-serif; }
  .mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
  .mc-title { font-size: 22px; font-weight: 700; color: #1a1830; margin: 0; }
  .mc-subtitle { font-size: 13px; color: #7c7a8e; margin: 4px 0 0; }
  .mc-btn-new { background: #E8640C; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .2s; }
  .mc-btn-new:hover { background: #e07200; }
  .mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
  .mc-card { background: #fff; border: 1px solid #e8e6f0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: box-shadow .2s; }
  .mc-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
  .mc-card-img { width: 100%; height: 150px; object-fit: cover; display: block; background: #f3f2f8; }
  .mc-card-img-placeholder { width: 100%; height: 150px; background: #f3f2f8; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #c5c3d4; }
  .mc-card-body { padding: 14px 16px; }
  .mc-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .mc-card-nombre { font-size: 15px; font-weight: 700; color: #1a1830; margin: 0; }
  .mc-badge { font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .mc-badge-borrador { background: #f3f2f8; color: #7c7a8e; }
  .mc-badge-publicada { background: #eafaf3; color: #0e8a50; }
  .mc-card-obras { font-size: 12px; color: #9896a8; margin-bottom: 10px; }
  .mc-card-historia { font-size: 12.5px; color: #5a5870; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mc-card-actions { display: flex; gap: 8px; }
  .mc-btn-edit { flex: 1; background: #f3f2f8; color: #1a1830; border: none; padding: 7px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .2s; }
  .mc-btn-edit:hover { background: #e8e6f0; }
  .mc-btn-del { background: #fff0f2; color: #c4304a; border: 1px solid #f5c6cc; padding: 7px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .2s; }
  .mc-btn-del:hover { background: #fde8eb; }
  .mc-empty { text-align: center; padding: 60px 20px; color: #9896a8; }
  .mc-empty-icon { font-size: 42px; margin-bottom: 12px; }
  .mc-empty-title { font-size: 16px; font-weight: 700; color: #5a5870; margin: 0 0 6px; }
  .mc-empty-sub { font-size: 13px; margin: 0 0 20px; }
  .mc-spinner { display: flex; align-items: center; justify-content: center; height: 200px; }
  .mc-spin { width: 32px; height: 32px; border: 3px solid #e8e6f0; border-top-color: #E8640C; border-radius: 50%; animation: mc-rotate .8s linear infinite; }
  @keyframes mc-rotate { to { transform: rotate(360deg); } }
  .mc-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .mc-confirm-box { background: #fff; border-radius: 14px; padding: 28px 32px; max-width: 380px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.15); font-family: 'Outfit', sans-serif; }
  .mc-confirm-title { font-size: 16px; font-weight: 700; color: #1a1830; margin: 0 0 8px; }
  .mc-confirm-msg { font-size: 13px; color: #5a5870; margin: 0 0 20px; }
  .mc-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .mc-confirm-cancel { background: #f3f2f8; color: #5a5870; border: none; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; }
  .mc-confirm-del { background: #c4304a; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; }
  @media (max-width: 600px) { .mc-wrap { padding: 20px 16px; } }
`;

export default function MisColecciones() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [colecciones,   setColecciones]   = useState<Coleccion[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Coleccion | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [expandedId,    setExpandedId]    = useState<number | null>(null);
  const [todasObras,    setTodasObras]    = useState<ObraResumen[] | null>(null);
  const [loadingObras,  setLoadingObras]  = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/colecciones/mis-colecciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al cargar colecciones", "err"); return; }
      setColecciones(data.data || []);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/colecciones/${confirmDelete.id_coleccion}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al eliminar", "err"); return; }
      setColecciones(prev => prev.filter(c => c.id_coleccion !== confirmDelete.id_coleccion));
      showToast("Colección eliminada", "ok");
      setConfirmDelete(null);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setDeleting(false);
    }
  };

  const toggleObras = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (todasObras !== null) return;
    setLoadingObras(true);
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/artista-portal/mis-obras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTodasObras(data.obras || []);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoadingObras(false);
    }
  };

  return (
    <>
      <style>{css}</style>

      <div className="mc-wrap">
        <div className="mc-header">
          <div>
            <h1 className="mc-title">Mis Colecciones</h1>
            <p className="mc-subtitle">{colecciones.length} colección{colecciones.length !== 1 ? "es" : ""}</p>
          </div>
          <button className="mc-btn-new" onClick={() => navigate("/artista/colecciones/nueva")}>
            + Nueva colección
          </button>
        </div>

        {loading ? (
          <div className="mc-spinner"><div className="mc-spin" /></div>
        ) : colecciones.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">🗂</div>
            <p className="mc-empty-title">Aún no tienes colecciones</p>
            <p className="mc-empty-sub">Agrupa tus obras en colecciones para darles más contexto</p>
            <button className="mc-btn-new" onClick={() => navigate("/artista/colecciones/nueva")}>
              Crear mi primera colección
            </button>
          </div>
        ) : (
          <div className="mc-grid">
            {colecciones.map(col => (
              <div key={col.id_coleccion} className="mc-card">
                {col.imagen_portada
                  ? <img src={col.imagen_portada} alt={col.nombre} className="mc-card-img" />
                  : <div className="mc-card-img-placeholder">🖼</div>
                }
                <div className="mc-card-body">
                  <div className="mc-card-top">
                    <p className="mc-card-nombre">{col.nombre}</p>
                    <span className={`mc-badge mc-badge-${col.estado}`}>{col.estado}</span>
                  </div>
                  <p className="mc-card-obras">{col.total_obras} obra{Number(col.total_obras) !== 1 ? "s" : ""}</p>
                  {col.historia && <p className="mc-card-historia">{col.historia}</p>}
                  <div className="mc-card-actions">
                    <button className="mc-btn-edit" onClick={() => navigate(`/artista/colecciones/${col.id_coleccion}/editar`)}>
                      Editar
                    </button>
                    <button className="mc-btn-edit" style={{ background: expandedId === col.id_coleccion ? "#eafaf3" : undefined, color: expandedId === col.id_coleccion ? "#0e8a50" : undefined }}
                      onClick={() => toggleObras(col.id_coleccion)}>
                      {expandedId === col.id_coleccion ? "▲ Ocultar" : "▼ Ver obras"}
                    </button>
                    <button className="mc-btn-del" onClick={() => setConfirmDelete(col)}>
                      Eliminar
                    </button>
                  </div>

                  {/* Panel de obras */}
                  {expandedId === col.id_coleccion && (
                    <div style={{ marginTop: 12, borderTop: "1px solid #e8e6f0", paddingTop: 12 }}>
                      {loadingObras ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                          <div className="mc-spin" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        </div>
                      ) : (() => {
                        const obras = (todasObras || []).filter(o => o.id_coleccion === col.id_coleccion);
                        if (obras.length === 0) return (
                          <p style={{ fontSize: 12, color: "#9896a8", margin: 0, textAlign: "center", padding: "8px 0" }}>
                            Sin obras asignadas
                          </p>
                        );
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {obras.map(o => (
                              <div key={o.id_obra} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {o.imagen_principal
                                  ? <img src={o.imagen_principal} alt={o.titulo} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #e8e6f0" }} />
                                  : <div style={{ width: 36, height: 36, borderRadius: 6, background: "#f3f2f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🖼</div>
                                }
                                <span style={{ fontSize: 12.5, color: "#1a1830", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {o.titulo}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap",
                                  background: o.estado === "publicada" ? "#eafaf3" : o.estado === "pendiente" ? "#fff8e6" : "#f3f2f8",
                                  color:      o.estado === "publicada" ? "#0e8a50" : o.estado === "pendiente" ? "#a87006" : "#7c7a8e",
                                }}>
                                  {o.estado}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="mc-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="mc-confirm-box" onClick={e => e.stopPropagation()}>
            <p className="mc-confirm-title">¿Eliminar colección?</p>
            <p className="mc-confirm-msg">
              Se eliminará <strong>"{confirmDelete.nombre}"</strong>. Las obras que pertenecían a ella quedarán sin colección asignada.
            </p>
            <div className="mc-confirm-actions">
              <button className="mc-confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="mc-confirm-del" onClick={eliminar} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
