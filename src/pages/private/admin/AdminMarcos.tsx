import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, RefreshCw, Frame } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", green:"#0E8A50", red:"#C4304A", gold:"#A87006",
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
const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

interface Marco {
  id_tipo_marco: number; nombre: string; descripcion: string | null;
  material: string | null; color: string | null;
  precio_adicional: string; ancho_cm: string | null; alto_cm: string | null;
  imagen: string | null; activo: boolean;
}
interface Form {
  nombre: string; descripcion: string; material: string;
  color: string; precio_adicional: string; ancho_cm: string; alto_cm: string;
  activo: boolean;
}
const EMPTY: Form = {
  nombre: "", descripcion: "", material: "Madera",
  color: "", precio_adicional: "", ancho_cm: "", alto_cm: "", activo: true,
};
const MATERIALES = ["Madera", "Aluminio", "MDF", "Plástico", "Metal", "Otro"];

export default function AdminMarcos() {
  const { showToast } = useToast();
  const [marcos,   setMarcos]  = useState<Marco[]>([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState<"crear" | "editar" | null>(null);
  const [saving,   setSaving]  = useState(false);
  const [deleting, setDeleting]= useState<number | null>(null);
  const [editId,   setEditId]  = useState<number | null>(null);
  const [form,     setForm]    = useState<Form>(EMPTY);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/marcos`, { headers: authH() });
      const d = await r.json();
      if (d.success) setMarcos(d.data);
    } catch { showToast("Error al cargar marcos", "err"); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => { setForm(EMPTY); setEditId(null); setModal("crear"); };
  const abrirEditar = (m: Marco) => {
    setForm({
      nombre: m.nombre, descripcion: m.descripcion ?? "",
      material: m.material ?? "Madera", color: m.color ?? "",
      precio_adicional: m.precio_adicional,
      ancho_cm: m.ancho_cm ?? "", alto_cm: m.alto_cm ?? "", activo: m.activo,
    });
    setEditId(m.id_tipo_marco); setModal("editar");
  };
  const cerrar = () => { setModal(null); setEditId(null); setForm(EMPTY); };

  const guardar = async () => {
    if (!form.nombre.trim() || form.precio_adicional === "")
      return showToast("Nombre y precio son requeridos", "err");
    setSaving(true);
    try {
      const url  = modal === "crear" ? `${API}/api/admin/marcos` : `${API}/api/admin/marcos/${editId}`;
      const meth = modal === "crear" ? "POST" : "PUT";
      const body = {
        nombre: form.nombre.trim(), descripcion: form.descripcion || null,
        material: form.material || null, color: form.color || null,
        precio_adicional: Number(form.precio_adicional),
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
    if (!confirm("¿Eliminar este tipo de marco? Solo es posible si no está asignado a obras activas.")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API}/api/admin/marcos/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (d.success) { showToast(d.message, "ok"); cargar(); }
      else showToast(d.message, "err");
    } catch { showToast("Error al eliminar", "err"); }
    finally { setDeleting(null); }
  };

  const activos   = marcos.filter(m => m.activo).length;
  const inactivos = marcos.filter(m => !m.activo).length;
  const promedio  = marcos.length ? marcos.reduce((s, m) => s + Number(m.precio_adicional), 0) / marcos.length : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .admin-marcos { font-family: ${FB}; background: ${C.bg}; min-height: 100vh; padding: 28px 24px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .kpi { background: ${C.card}; border-radius: 10px; padding: 16px; box-shadow: ${CS}; }
        .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: ${C.creamMut}; margin-bottom: 6px; }
        .kpi-val { font-family: ${FM}; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
        .table-card { background: ${C.card}; border-radius: 12px; box-shadow: ${CS}; overflow: hidden; }
        .table-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid ${C.border}; }
        .btn-primary { background: ${C.orange}; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: ${FB}; }
        .btn-primary:hover { opacity: .9; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: ${C.creamMut}; padding: 10px 16px; text-align: left; background: ${C.bg}; border-bottom: 1px solid ${C.border}; }
        td { padding: 12px 16px; font-size: 13px; color: ${C.cream}; border-bottom: 1px solid ${C.border}; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(0,0,0,0.012); }
        .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
        .precio { font-family: ${FM}; font-size: 13px; font-weight: 600; color: ${C.cream}; }
        .dim { font-family: ${FM}; font-size: 11px; color: ${C.creamSub}; }
        .icon-btn { background: none; border: 1px solid ${C.border}; border-radius: 6px; padding: 5px 8px; cursor: pointer; display: flex; align-items: center; color: ${C.creamSub}; }
        .icon-btn:hover { border-color: ${C.orange}; color: ${C.orange}; }
        .icon-btn.del:hover { border-color: ${C.red}; color: ${C.red}; }
        /* Modal */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 20px; }
        .modal { background: ${C.card}; border-radius: 14px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
        .modal-header { padding: 20px 24px 16px; border-bottom: 1px solid ${C.border}; display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-size: 15px; font-weight: 700; color: ${C.cream}; }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid ${C.border}; display: flex; gap: 8px; justify-content: flex-end; }
        .field label { font-size: 11px; font-weight: 600; color: ${C.creamSub}; text-transform: uppercase; letter-spacing: .04em; display: block; margin-bottom: 5px; }
        .field input, .field select, .field textarea { width: 100%; border: 1px solid ${C.border}; border-radius: 7px; padding: 8px 10px; font-size: 13px; font-family: ${FB}; color: ${C.cream}; background: ${C.bg}; outline: none; box-sizing: border-box; }
        .field input:focus, .field select:focus, .field textarea:focus { border-color: ${C.orange}; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-cancel { background: none; border: 1px solid ${C.border}; border-radius: 8px; padding: 8px 16px; font-size: 13px; color: ${C.creamSub}; cursor: pointer; font-family: ${FB}; }
        .toggle-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: ${C.cream}; }
        .material-tag { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: #EEF2FF; color: #4338CA; }
      `}</style>

      <div className="admin-marcos">
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:C.cream, margin:0 }}>Tipos de Marco</h1>
            <p style={{ fontSize:13, color:C.creamSub, margin:"4px 0 0" }}>Catálogo de marcos disponibles para las obras</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="icon-btn" onClick={cargar} title="Recargar"><RefreshCw size={14}/></button>
            <button className="btn-primary" onClick={abrirCrear}><Plus size={14}/>Nuevo marco</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Total marcos</div>
            <div className="kpi-val" style={{ color:C.cream }}>{marcos.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Activos</div>
            <div className="kpi-val" style={{ color:C.green }}>{activos}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Inactivos</div>
            <div className="kpi-val" style={{ color:C.creamMut }}>{inactivos}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Precio promedio</div>
            <div className="kpi-val" style={{ color:C.orange, fontSize:22 }}>{fmtMXN(promedio)}</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-card">
          <div className="table-head">
            <span style={{ fontSize:14, fontWeight:700, color:C.cream }}>
              {marcos.length} {marcos.length === 1 ? "tipo de marco" : "tipos de marco"}
            </span>
          </div>
          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:C.creamMut }}>Cargando...</div>
          ) : marcos.length === 0 ? (
            <div style={{ padding:40, textAlign:"center" }}>
              <Frame size={32} color={C.creamMut} style={{ marginBottom:8 }}/>
              <p style={{ color:C.creamMut, fontSize:13 }}>No hay tipos de marco. Crea el primero.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Material</th>
                    <th>Dimensiones</th>
                    <th>Precio adicional</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {marcos.map(m => (
                    <tr key={m.id_tipo_marco}>
                      <td>
                        <div style={{ fontWeight:600, color:C.cream }}>{m.nombre}</div>
                        {m.descripcion && <div style={{ fontSize:11, color:C.creamSub, marginTop:2 }}>{m.descripcion}</div>}
                        {m.color && <div style={{ fontSize:11, color:C.creamMut, marginTop:1 }}>Color: {m.color}</div>}
                      </td>
                      <td>
                        {m.material
                          ? <span className="material-tag">{m.material}</span>
                          : <span style={{ color:C.creamMut }}>—</span>}
                      </td>
                      <td>
                        {m.ancho_cm && m.alto_cm
                          ? <span className="dim">{m.ancho_cm} × {m.alto_cm} cm</span>
                          : <span style={{ color:C.creamMut, fontSize:11 }}>Sin especificar</span>}
                      </td>
                      <td>
                        <span className="precio">{fmtMXN(Number(m.precio_adicional))}</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: m.activo ? "#D1FAE5" : "#F3F4F6", color: m.activo ? "#065F46" : "#6B7280" }}>
                          {m.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="icon-btn" onClick={() => abrirEditar(m)} title="Editar"><Edit2 size={13}/></button>
                          <button className="icon-btn del" onClick={() => eliminar(m.id_tipo_marco)} disabled={deleting === m.id_tipo_marco} title="Eliminar">
                            <Trash2 size={13}/>
                          </button>
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

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && cerrar()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === "crear" ? "Nuevo tipo de marco" : "Editar marco"}</span>
              <button className="icon-btn" onClick={cerrar}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Nombre *</label>
                <input placeholder="ej. Marco madera natural, 30x40 cm"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Descripción</label>
                <input placeholder="Descripción breve (opcional)"
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}/>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Material</label>
                  <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}>
                    {MATERIALES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Color</label>
                  <input placeholder="ej. Negro, Natural, Dorado"
                    value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}/>
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Ancho obra (cm)</label>
                  <input type="number" min="0" placeholder="ej. 30"
                    value={form.ancho_cm} onChange={e => setForm(f => ({ ...f, ancho_cm: e.target.value }))}/>
                </div>
                <div className="field">
                  <label>Alto obra (cm)</label>
                  <input type="number" min="0" placeholder="ej. 40"
                    value={form.alto_cm} onChange={e => setForm(f => ({ ...f, alto_cm: e.target.value }))}/>
                </div>
              </div>
              <div className="field">
                <label>Precio adicional (MXN) *</label>
                <input type="number" min="0" placeholder="ej. 320"
                  value={form.precio_adicional} onChange={e => setForm(f => ({ ...f, precio_adicional: e.target.value }))}/>
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}/>
                Marco activo (visible para clientes)
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrar}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : modal === "crear" ? "Crear marco" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
