// src/pages/private/admin/AdminClientes.tsx
import { useState, useEffect, useCallback } from "react";
import { Search, Users, CheckCircle, RefreshCw } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", pink:"#A83B90", purple:"#6028AA",
  blue:"#2D6FBE",   gold:"#A87006", green:"#0E8A50",
  cream:"#14121E",  creamSub:"#5A5870", creamMut:"#9896A8",
  bg:"#F9F8FC", card:"#FFFFFF", border:"#E6E4EF", red:"#C4304A",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }

interface Cliente {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  fecha_registro: string;
  total_compras: string;
  monto_total: string;
}

export default function AdminClientes() {
  const { showToast } = useToast();
  const [clientes,   setClientes]   = useState<Cliente[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [searchTemp, setSearchTemp] = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [total,            setTotal]            = useState(0);
  const [totalActivos,     setTotalActivos]     = useState(0);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: "15" });
      const res  = await fetch(`${API}/api/admin/clientes?${params}`, { headers: authH() });
      const data = await res.json();
      if (data.success) {
        setClientes(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setTotalActivos(data.pagination.total_activos ?? 0);
      }
    } catch {
      showToast("Error al cargar clientes", "err");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchTemp);
    setPage(1);
  };



  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        .acl-row { transition: background .15s; }
        .acl-row:hover { background: rgba(0,0,0,.018) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.cream, margin: 0, lineHeight: 1.2 }}>Clientes</h1>
          <p style={{ fontSize: 13, color: C.creamSub, margin: "4px 0 0", fontWeight: 500 }}>
            Gestión de usuarios registrados como clientes
          </p>
        </div>
        <button onClick={fetchClientes} title="Actualizar" style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.creamSub, boxShadow: CS }}>
          <RefreshCw size={13} strokeWidth={2} />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total clientes", value: total,        icon: <Users size={18} color={C.purple} strokeWidth={1.8}/>, accent: C.purple },
          { label: "Activos",        value: totalActivos, icon: <CheckCircle size={18} color={C.green} strokeWidth={1.8}/>, accent: C.green },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, borderRadius: 10, padding: "16px 20px", boxShadow: CS, borderLeft: `3px solid ${k.accent}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: `${k.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.cream, lineHeight: 1, fontFamily: FM }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.creamMut }} />
          <input
            value={searchTemp}
            onChange={e => setSearchTemp(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ width: "100%", paddingLeft: 36, paddingRight: 14, height: 38, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FB, color: C.cream, background: C.card, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
          Buscar
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchTemp(""); setPage(1); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 14px", fontSize: 12, color: C.creamSub, cursor: "pointer", fontFamily: FB }}>
            Limpiar
          </button>
        )}
      </form>

      {/* Tabla */}
      <div style={{ background: C.card, borderRadius: 12, boxShadow: CS, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Cliente", "Correo", "Registro", "Compras", "Total gastado"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.creamMut, textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.creamMut, fontSize: 13 }}>Cargando...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: C.creamMut, fontSize: 13 }}>Sin resultados</td></tr>
            ) : clientes.map(c => (
              <tr key={c.id_usuario} className="acl-row" style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.purple}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.purple, flexShrink: 0 }}>
                      {c.nombre_completo?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>{c.nombre_completo || "—"}</div>
                      {c.telefono && <div style={{ fontSize: 11, color: C.creamMut }}>{c.telefono}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.creamSub, fontFamily: FM }}>{c.correo}</td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: C.creamMut, whiteSpace: "nowrap" }}>
                  {new Date(c.fecha_registro).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: FM, textAlign: "center" }}>
                  {c.total_compras}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.green, fontFamily: FM }}>
                  {fmtMXN(Number(c.monto_total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.creamMut }}>Página {page} de {totalPages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, cursor: "pointer", color: C.creamSub, fontFamily: FB, opacity: page === 1 ? .4 : 1 }}>← Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, cursor: "pointer", color: C.creamSub, fontFamily: FB, opacity: page === totalPages ? .4 : 1 }}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
