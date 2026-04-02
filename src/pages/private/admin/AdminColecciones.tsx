// src/pages/private/admin/AdminColecciones.tsx
import { useEffect, useState } from "react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C", pink: "#A83B90", purple: "#6028AA",
  blue: "#2D6FBE", gold: "#A87006", green: "#0E8A50", red: "#C4304A",
  cream: "#14121E", creamSub: "#5A5870", creamMut: "#9896A8",
  bg: "#F9F8FC", card: "#FFFFFF", border: "#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
  .ac-wrap { padding: 32px 36px; font-family: ${FB}; background: ${C.bg}; min-height: 100vh; }
  .ac-table { width: 100%; border-collapse: collapse; }
  .ac-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: ${C.creamMut}; padding: 10px 14px; text-align: left; border-bottom: 1px solid ${C.border}; background: ${C.card}; white-space: nowrap; }
  .ac-table td { padding: 13px 14px; border-bottom: 1px solid ${C.border}; vertical-align: middle; font-size: 13px; color: ${C.cream}; }
  .ac-table tr:hover td { background: rgba(0,0,0,0.015); }
  .ac-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 700; white-space: nowrap; }
  .ac-badge-publicada { background: #eafaf3; color: #0e8a50; }
  .ac-badge-borrador  { background: #f3f2f8; color: #5a5870; }
  .ac-select { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 5px 10px; color: ${C.cream}; font-family: ${FB}; font-size: 12.5px; cursor: pointer; outline: none; }
  .ac-select:focus { border-color: ${C.orange}; }
  .ac-btn-star { background: none; border: none; cursor: pointer; font-size: 18px; padding: 2px 6px; border-radius: 6px; transition: background .15s; }
  .ac-btn-star:hover { background: rgba(0,0,0,0.06); }
  .ac-filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .ac-filter-select { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 9px; padding: 8px 12px; color: ${C.cream}; font-family: ${FB}; font-size: 13px; outline: none; box-shadow: ${CS}; }
  .ac-filter-select:focus { border-color: ${C.orange}; }
  .ac-pagination { display: flex; align-items: center; gap: 8px; }
  .ac-page-btn { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-family: ${FB}; cursor: pointer; color: ${C.cream}; transition: background .15s; }
  .ac-page-btn:hover:not(:disabled) { background: ${C.bg}; }
  .ac-page-btn:disabled { color: ${C.creamMut}; cursor: not-allowed; }
  .ac-spinner { width: 28px; height: 28px; border: 3px solid ${C.border}; border-top-color: ${C.orange}; border-radius: 50%; animation: ac-spin .8s linear infinite; }
  @keyframes ac-spin { to { transform: rotate(360deg); } }
  .ac-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid ${C.border}; }
  .ac-thumb-placeholder { width: 40px; height: 40px; border-radius: 8px; background: ${C.bg}; border: 1px solid ${C.border}; display: flex; align-items: center; justify-content: center; font-size: 16px; color: ${C.creamMut}; }
`;

interface Coleccion {
  id_coleccion: number;
  nombre: string;
  slug: string;
  estado: string;
  destacada: boolean;
  imagen_portada: string | null;
  fecha_creacion: string;
  activa: boolean;
  id_artista: number;
  artista_alias: string;
  artista_nombre: string;
  total_obras: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminColecciones() {
  const { showToast } = useToast();

  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [pagination,  setPagination]  = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [filterEstado, setFilterEstado] = useState("");
  const [updating,    setUpdating]    = useState<number | null>(null);

  const cargar = async (page = 1) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterEstado) params.set("estado", filterEstado);

      const res  = await fetch(`${API}/api/admin/colecciones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al cargar", "err"); return; }
      setColecciones(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(1); }, [filterEstado]);

  const patchColeccion = async (id: number, body: Partial<{ estado: string; destacada: boolean }>) => {
    setUpdating(id);
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API}/api/admin/colecciones/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al actualizar", "err"); return; }

      setColecciones(prev => prev.map(c =>
        c.id_coleccion === id ? { ...c, ...body } : c
      ));
      showToast("Colección actualizada", "ok");
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setUpdating(null);
    }
  };

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <style>{css}</style>
      <div className="ac-wrap">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: C.cream, fontFamily: FB }}>
              Colecciones
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.creamSub }}>
              Gestiona el estado y visibilidad de todas las colecciones de artistas
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FM, fontSize: 13, color: C.creamSub }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: FM }}>{pagination.total}</span>
            <span>colecciones totales</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="ac-filter-row" style={{ marginBottom: 20 }}>
          <select
            className="ac-filter-select"
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="publicada">Publicada</option>
            <option value="borrador">Borrador</option>
          </select>
        </div>

        {/* Tabla */}
        <div style={{ background: C.card, borderRadius: 12, boxShadow: CS, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <div className="ac-spinner" />
            </div>
          ) : colecciones.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.creamMut, fontSize: 14 }}>
              No hay colecciones con los filtros seleccionados
            </div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}></th>
                  <th>Colección</th>
                  <th>Artista</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "center" }}>Obras</th>
                  <th style={{ textAlign: "center" }}>Destacada</th>
                  <th>Creada</th>
                </tr>
              </thead>
              <tbody>
                {colecciones.map(col => (
                  <tr key={col.id_coleccion}>
                    {/* Portada */}
                    <td>
                      {col.imagen_portada
                        ? <img src={col.imagen_portada} alt="" className="ac-thumb" />
                        : <div className="ac-thumb-placeholder">🖼</div>
                      }
                    </td>

                    {/* Nombre */}
                    <td>
                      <div style={{ fontWeight: 600, color: C.cream, fontSize: 13.5 }}>{col.nombre}</div>
                    </td>

                    {/* Artista */}
                    <td>
                      <div style={{ fontWeight: 500 }}>{col.artista_alias}</div>
                      <div style={{ fontSize: 11, color: C.creamMut }}>{col.artista_nombre}</div>
                    </td>

                    {/* Estado editable */}
                    <td>
                      <select
                        className="ac-select"
                        value={col.estado}
                        disabled={updating === col.id_coleccion}
                        onChange={e => patchColeccion(col.id_coleccion, { estado: e.target.value })}
                      >
                        <option value="borrador">Borrador</option>
                        <option value="publicada">Publicada</option>
                      </select>
                    </td>

                    {/* Total obras */}
                    <td style={{ textAlign: "center", fontFamily: FM, fontWeight: 600 }}>
                      {col.total_obras}
                    </td>

                    {/* Destacada toggle */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="ac-btn-star"
                        title={col.destacada ? "Quitar destacada" : "Marcar como destacada"}
                        disabled={updating === col.id_coleccion}
                        onClick={() => patchColeccion(col.id_coleccion, { destacada: !col.destacada })}
                      >
                        {col.destacada ? "⭐" : "☆"}
                      </button>
                    </td>

                    {/* Fecha */}
                    <td style={{ color: C.creamSub, fontSize: 12.5, fontFamily: FM, whiteSpace: "nowrap" }}>
                      {formatFecha(col.fecha_creacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FM }}>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="ac-pagination">
              <button
                className="ac-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => cargar(pagination.page - 1)}
              >
                ← Anterior
              </button>
              <button
                className="ac-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => cargar(pagination.page + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
