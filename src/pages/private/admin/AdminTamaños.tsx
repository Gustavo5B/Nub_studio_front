import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, RefreshCw, Ruler } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", green:"#0E8A50", red:"#C4304A",
  cream:"#14121E", creamSub:"#5A5870", creamMut:"#9896A8",
  bg:"#F9F8FC", card:"#FFFFFF", border:"#E6E4EF",
};
const CS  = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB  = "'Outfit', sans-serif";
const FM  = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` };
}

interface Tamano {
  id_tamaño: number; nombre: string; descripcion: string | null;
  ancho_cm: string | null; alto_cm: string | null; activo: boolean;
}
interface Form { nombre: string; descripcion: string; ancho_cm: string; alto_cm: string; activo: boolean; }
const EMPTY: Form = { nombre: "", descripcion: "", ancho_cm: "", alto_cm: "", activo: true };

export default function AdminTamanos() {
  const { showToast } = useToast();
  const [tamanos,  setTamanos]  = useState<Tamano[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<"crear" | "editar" | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [form,     setForm]     = useState<Form>(EMPTY);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/tamanos`, { headers: authH() });
      const d = await r.json();
      if (d.success) setTamanos(d.data);
    } catch { showToast("Error al cargar tamaños", "err"); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => { setForm(EMPTY); setEditId(null); setModal("crear"); };
  const abrirEditar = (t: Tamano) => {
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "", ancho_cm: t.ancho_cm ?? "", alto_cm: t.alto_cm ?? "", activo: t.activo });
    setEditId(t.id_tamaño); setModal("editar");
  };
  const cerrar = () => { setModal(null); setEditId(null); setForm(EMPTY); };

  const guardar = async () => {
    if (!form.nombre.trim()) return showToast("El nombre es requerido", "err");
    setSaving(true);
    try {
      const url  = modal === "crear" ? `${API}/api/admin/tamanos` : `${API}/api/admin/tamanos/${editId}`;
      const meth = modal === "crear" ? "POST" : "PUT";
      const body = {
        nombre: form.nombre.trim(), descripcion: form.descripcion || null,
        ancho_cm: form.ancho_cm ? Number(form.ancho_cm) : null,
        alto_cm:  form.alto_cm  ? Number(form.alto_cm)  : null,
        activo: form.activo,
      };
      const r = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { showToast(d.message, "ok"); cerrar(); cargar(); }
      else showToast(d.message, "err");
    } catch { showToast("Error al guardar", "err"); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este tamaño? Solo es posible si no está asignado a obras activas.")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API}/api/admin/tamanos/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (d.success) { showToast(d.message, "ok"); cargar(); }
      else showToast(d.message, "err");
    } catch { showToast("Error al eliminar", "err"); }
    finally { setDeleting(null); }
  };

  const activos = tamanos.filter(t => t.activo).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .admin-tam { font-family: ${FB}; background: ${C.bg}; min-height: 100vh; padding: 28px 24px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 12px; margin-bottom: 24px; }
        .kpi { background:${C.card}; border-radius:10px; padding:16px; box-shadow:${CS}; }
        .kpi-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:${C.creamMut}; margin-bottom:6px; }
        .kpi-val { font-family:${FM}; font-size:28px; font-weight:700; letter-spacing:-0.02em; }
        .table-card { background:${C.card}; border-radius:12px; box-shadow:${CS}; overflow:hidden; }
        .table-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid ${C.border}; }
        .btn-primary { background:${C.orange}; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:${FB}; }
        .btn-primary:hover { opacity:.9; }
        table { width:100%; border-collapse:collapse; }
        th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:${C.creamMut}; padding:10px 16px; text-align:left; background:${C.bg}; border-bottom:1px solid ${C.border}; }
        td { padding:12px 16px; font-size:13px; color:${C.cream}; border-bottom:1px solid ${C.border}; vertical-align:middle; }
        tr:last-child td { border-bottom:none; }
        tr:hover td { background:rgba(0,0,0,0.012); }
        .badge { display:inline-flex; font-size:10px; font-weight:600; padding:3px 8px; border-radius:4px; }
        .dim-chip { font-family:${FM}; font-size:12px; background:#F3F2F8; border:1px solid ${C.border}; border-radius:5px; padding:3px 8px; color:${C.cream}; display:inline-block; }
        .icon-btn { background:none; border:1px solid ${C.border}; border-radius:6px; padding:5px 8px; cursor:pointer; display:flex; align-items:center; color:${C.creamSub}; }
        .icon-btn:hover { border-color:${C.orange}; color:${C.orange}; }
        .icon-btn.del:hover { border-color:${C.red}; color:${C.red}; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:9000; padding:20px; }
        .modal { background:${C.card}; border-radius:14px; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(0,0,0,0.18); }
        .modal-header { padding:20px 24px 16px; border-bottom:1px solid ${C.border}; display:flex; align-items:center; justify-content:space-between; }
        .modal-title { font-size:15px; font-weight:700; color:${C.cream}; }
        .modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
        .modal-footer { padding:16px 24px; border-top:1px solid ${C.border}; display:flex; gap:8px; justify-content:flex-end; }
        .field label { font-size:11px; font-weight:600; color:${C.creamSub}; text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:5px; }
        .field input, .field textarea { width:100%; border:1px solid ${C.border}; border-radius:7px; padding:8px 10px; font-size:13px; font-family:${FB}; color:${C.cream}; background:${C.bg}; outline:none; box-sizing:border-box; }
        .field input:focus { border-color:${C.orange}; }
        .row2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .btn-cancel { background:none; border:1px solid ${C.border}; border-radius:8px; padding:8px 16px; font-size:13px; color:${C.creamSub}; cursor:pointer; font-family:${FB}; }
        .toggle-row { display:flex; align-items:center; gap:10px; font-size:13px; color:${C.cream}; }
        .hint { font-size:11px; color:${C.creamMut}; margin-top:3px; }
      `}</style>

      <div className="admin-tam">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:C.cream, margin:0 }}>Tamaños Disponibles</h1>
            <p style={{ fontSize:13, color:C.creamSub, margin:"4px 0 0" }}>Catálogo de tallas que los artistas asignan a sus obras</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="icon-btn" onClick={cargar}><RefreshCw size={14}/></button>
            <button className="btn-primary" onClick={abrirCrear}><Plus size={14}/>Nuevo tamaño</button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Total tamaños</div>
            <div className="kpi-val" style={{ color:C.cream }}>{tamanos.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Activos</div>
            <div className="kpi-val" style={{ color:C.green }}>{activos}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Inactivos</div>
            <div className="kpi-val" style={{ color:C.creamMut }}>{tamanos.length - activos}</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-head">
            <span style={{ fontSize:14, fontWeight:700, color:C.cream }}>
              {tamanos.length} {tamanos.length === 1 ? "tamaño" : "tamaños"}
            </span>
          </div>
          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>Cargando...</div>
          ) : tamanos.length === 0 ? (
            <div style={{ padding:40, textAlign:"center" }}>
              <Ruler size={32} color={C.creamMut} style={{ marginBottom:8 }}/>
              <p style={{ color:C.creamMut, fontSize:13 }}>No hay tamaños. Crea el primero.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dimensiones</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tamanos.map(t => (
                    <tr key={t.id_tamaño}>
                      <td style={{ fontWeight:600 }}>{t.nombre}</td>
                      <td>
                        {t.ancho_cm && t.alto_cm
                          ? <span className="dim-chip">{t.ancho_cm} × {t.alto_cm} cm</span>
                          : <span style={{ color:C.creamMut, fontSize:11 }}>Sin dimensiones</span>}
                      </td>
                      <td style={{ color:C.creamSub, fontSize:12 }}>{t.descripcion ?? "—"}</td>
                      <td>
                        <span className="badge" style={{ background: t.activo ? "#D1FAE5":"#F3F4F6", color: t.activo ? "#065F46":"#6B7280" }}>
                          {t.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="icon-btn" onClick={() => abrirEditar(t)}><Edit2 size={13}/></button>
                          <button className="icon-btn del" onClick={() => eliminar(t.id_tamaño)} disabled={deleting === t.id_tamaño}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && cerrar()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === "crear" ? "Nuevo tamaño" : "Editar tamaño"}</span>
              <button className="icon-btn" onClick={cerrar}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Nombre *</label>
                <input placeholder='ej. Pequeño, Mediano, "30×40 cm", A3'
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}/>
                <p className="hint">Este nombre lo verá el artista y el cliente</p>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Ancho (cm)</label>
                  <input type="number" min="0" placeholder="ej. 30"
                    value={form.ancho_cm} onChange={e => setForm(f => ({ ...f, ancho_cm: e.target.value }))}/>
                </div>
                <div className="field">
                  <label>Alto (cm)</label>
                  <input type="number" min="0" placeholder="ej. 40"
                    value={form.alto_cm} onChange={e => setForm(f => ({ ...f, alto_cm: e.target.value }))}/>
                </div>
              </div>
              <div className="field">
                <label>Descripción</label>
                <input placeholder="Descripción adicional (opcional)"
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}/>
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}/>
                Tamaño activo
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrar}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : modal === "crear" ? "Crear tamaño" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
