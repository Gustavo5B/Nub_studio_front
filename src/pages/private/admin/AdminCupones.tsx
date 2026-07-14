// src/pages/private/admin/AdminCupones.tsx
import { useState, useEffect, useRef } from "react";
import { Plus, RefreshCw, Trash2, Edit2, Tag, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
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

function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` };
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

interface Cupon {
  id_cupon: number; codigo: string; descripcion: string | null;
  tipo: "porcentaje" | "monto"; valor: string;
  monto_minimo: string; fecha_inicio: string;
  fecha_fin: string | null; usos_max: number | null;
  usos_actuales: number; activo: boolean; creado_en: string;
  estado_real: "activo" | "inactivo" | "expirado" | "agotado";
}

interface FormData {
  codigo: string; descripcion: string; tipo: "porcentaje" | "monto";
  valor: string; monto_minimo: string; fecha_fin: string;
  usos_max: string; activo: boolean;
}

const EMPTY_FORM: FormData = {
  codigo: "", descripcion: "", tipo: "porcentaje",
  valor: "", monto_minimo: "", fecha_fin: "", usos_max: "", activo: true,
};

const ESTADO_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  activo:   { bg:"#D1FAE5", color:"#065F46", icon:<CheckCircle size={11} strokeWidth={2}/>, label:"Activo"   },
  inactivo: { bg:"#F3F4F6", color:"#6B7280", icon:<XCircle     size={11} strokeWidth={2}/>, label:"Inactivo" },
  expirado: { bg:"#FEE2E2", color:"#991B1B", icon:<AlertCircle size={11} strokeWidth={2}/>, label:"Expirado" },
  agotado:  { bg:"#FEF3C7", color:"#92400E", icon:<Clock       size={11} strokeWidth={2}/>, label:"Agotado"  },
};

export default function AdminCupones() {
  const { showToast } = useToast();
  const [cupones,  setCupones]  = useState<Cupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<"crear" | "editar" | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [form,     setForm]     = useState<FormData>(EMPTY_FORM);
  const codigoRef = useRef<HTMLInputElement>(null);

  const fetchCupones = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/cupones`, { headers: authH() });
      const data = await res.json();
      if (data.success) setCupones(data.data);
    } catch { showToast("Sin conexión", "err"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCupones(); }, []);

  const openCrear = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal("crear");
    setTimeout(() => codigoRef.current?.focus(), 80);
  };

  const openEditar = (c: Cupon) => {
    setForm({
      codigo: c.codigo, descripcion: c.descripcion || "",
      tipo: c.tipo, valor: c.valor,
      monto_minimo: c.monto_minimo || "",
      fecha_fin: c.fecha_fin ? c.fecha_fin.slice(0, 16) : "",
      usos_max: c.usos_max?.toString() || "",
      activo: c.activo,
    });
    setEditId(c.id_cupon);
    setModal("editar");
  };

  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.valor) {
      showToast("Código y valor son requeridos", "err"); return;
    }
    setSaving(true);
    try {
      const isEdit = modal === "editar";
      const url    = isEdit ? `${API}/api/admin/cupones/${editId}` : `${API}/api/admin/cupones`;
      const method = isEdit ? "PUT" : "POST";
      const body   = {
        codigo: form.codigo.trim().toUpperCase(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo, valor: Number(form.valor),
        monto_minimo: form.monto_minimo ? Number(form.monto_minimo) : 0,
        fecha_fin: form.fecha_fin || null,
        usos_max: form.usos_max ? Number(form.usos_max) : null,
        activo: form.activo,
      };
      const res  = await fetch(url, { method, headers: authH(), body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "ok");
        closeModal();
        fetchCupones();
      } else {
        showToast(data.message || "Error", "err");
      }
    } catch { showToast("Sin conexión", "err"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, codigo: string) => {
    if (!confirm(`¿Eliminar el cupón ${codigo}?`)) return;
    setDeleting(id);
    try {
      const res  = await fetch(`${API}/api/admin/cupones/${id}`, { method: "DELETE", headers: authH() });
      const data = await res.json();
      if (res.ok) { showToast(data.message, "ok"); fetchCupones(); }
      else showToast(data.message || "Error", "err");
    } catch { showToast("Sin conexión", "err"); }
    finally { setDeleting(null); }
  };

  const toggleActivo = async (c: Cupon) => {
    try {
      const res  = await fetch(`${API}/api/admin/cupones/${c.id_cupon}`, {
        method: "PUT", headers: authH(),
        body: JSON.stringify({
          descripcion: c.descripcion, tipo: c.tipo, valor: c.valor,
          monto_minimo: c.monto_minimo, fecha_fin: c.fecha_fin,
          usos_max: c.usos_max, activo: !c.activo,
        }),
      });
      const data = await res.json();
      if (res.ok) { showToast(data.message, "ok"); fetchCupones(); }
      else showToast(data.message || "Error", "err");
    } catch { showToast("Sin conexión", "err"); }
  };

  const inputS: React.CSSProperties = {
    width:"100%", boxSizing:"border-box",
    border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", fontSize:13, fontFamily:FB,
    color:C.cream, background:"#FAFAF9", outline:"none",
    transition:"border-color .15s",
  };
  const labelS: React.CSSProperties = {
    display:"block", fontSize:10, fontWeight:700,
    color:C.creamSub, textTransform:"uppercase",
    letterSpacing:".1em", marginBottom:5,
  };

  const totalActivos = cupones.filter(c => c.estado_real === "activo").length;
  const totalUsos    = cupones.reduce((s, c) => s + c.usos_actuales, 0);

  return (
    <div style={{ padding:"28px 32px", background:C.bg, minHeight:"100vh", fontFamily:FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        .cu-row { transition:background .15s; }
        .cu-row:hover { background:rgba(0,0,0,.018) !important; }
        .cu-toggle { border:1px solid; border-radius:100px; padding:3px 10px; font-size:10px; font-weight:700; cursor:pointer; font-family:${FB}; transition:all .15s; }
        .cu-input:focus { border-color:${C.orange} !important; background:#fff !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.cream, margin:0, lineHeight:1.2 }}>Cupones</h1>
          <p style={{ fontSize:13, color:C.creamSub, margin:"4px 0 0", fontWeight:500 }}>
            Códigos de descuento para clientes
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={fetchCupones} style={{ display:"flex", alignItems:"center", gap:6, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:600, color:C.creamSub, boxShadow:CS }}>
            <RefreshCw size={13} strokeWidth={2} /> Actualizar
          </button>
          <button onClick={openCrear} style={{ display:"flex", alignItems:"center", gap:6, background:C.orange, border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, color:"#fff", boxShadow:`0 4px 14px ${C.orange}35` }}>
            <Plus size={14} strokeWidth={2.5} /> Nuevo cupón
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Total cupones",  value:String(cupones.length),  accent:C.purple, icon:<Tag size={17} color={C.purple} strokeWidth={1.8}/> },
          { label:"Activos",        value:String(totalActivos),    accent:C.green,  icon:<CheckCircle size={17} color={C.green} strokeWidth={1.8}/> },
          { label:"Usos totales",   value:String(totalUsos),       accent:C.blue,   icon:<RefreshCw size={17} color={C.blue} strokeWidth={1.8}/> },
          { label:"Expirados",      value:String(cupones.filter(c=>c.estado_real==="expirado").length), accent:C.red, icon:<AlertCircle size={17} color={C.red} strokeWidth={1.8}/> },
        ].map(k => (
          <div key={k.label} style={{ background:C.card, borderRadius:10, padding:"14px 18px", boxShadow:CS, borderLeft:`3px solid ${k.accent}`, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:`${k.accent}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:C.cream, lineHeight:1, fontFamily:FM }}>{k.value}</div>
              <div style={{ fontSize:10, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:".1em", marginTop:3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background:C.card, borderRadius:12, boxShadow:CS, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Código","Descripción","Tipo / Valor","Mínimo","Usos","Válido hasta","Estado","Acciones"].map(h => (
                <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:".1em", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:"center", padding:48, color:C.creamMut, fontSize:13 }}>Cargando...</td></tr>
            ) : cupones.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign:"center", padding:56 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:`${C.purple}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Tag size={22} color={C.purple} strokeWidth={1.5}/>
                    </div>
                    <div style={{ fontSize:13, color:C.creamMut }}>No hay cupones aún</div>
                    <button onClick={openCrear} style={{ background:C.orange, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:FB }}>
                      Crear el primero
                    </button>
                  </div>
                </td>
              </tr>
            ) : cupones.map(c => {
              const est = ESTADO_STYLE[c.estado_real] ?? ESTADO_STYLE.inactivo;
              return (
                <tr key={c.id_cupon} className="cu-row" style={{ borderBottom:`1px solid ${C.border}` }}>
                  {/* Código */}
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ fontFamily:FM, fontSize:13, fontWeight:700, color:C.cream, background:`${C.orange}10`, border:`1px solid ${C.orange}22`, borderRadius:6, padding:"3px 8px" }}>
                      {c.codigo}
                    </span>
                  </td>
                  {/* Descripción */}
                  <td style={{ padding:"12px 14px", fontSize:12, color:C.creamSub, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.descripcion || <span style={{ color:C.creamMut, fontStyle:"italic" }}>Sin descripción</span>}
                  </td>
                  {/* Tipo / Valor */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:C.green, fontFamily:FM }}>
                      {c.tipo === "porcentaje" ? `${c.valor}%` : fmtMXN(Number(c.valor))}
                    </div>
                    <div style={{ fontSize:10, color:C.creamMut, textTransform:"uppercase", letterSpacing:".08em" }}>
                      {c.tipo === "porcentaje" ? "descuento %" : "monto fijo"}
                    </div>
                  </td>
                  {/* Mínimo */}
                  <td style={{ padding:"12px 14px", fontSize:12, color:C.creamSub, fontFamily:FM }}>
                    {Number(c.monto_minimo) > 0 ? fmtMXN(Number(c.monto_minimo)) : <span style={{ color:C.creamMut }}>Sin mínimo</span>}
                  </td>
                  {/* Usos */}
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontFamily:FM, fontSize:13, fontWeight:700, color:C.cream }}>
                      {c.usos_actuales}{c.usos_max ? `/${c.usos_max}` : ""}
                    </span>
                  </td>
                  {/* Válido hasta */}
                  <td style={{ padding:"12px 14px", fontSize:11, color:C.creamMut, whiteSpace:"nowrap" }}>
                    {c.fecha_fin
                      ? new Date(c.fecha_fin).toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"numeric" })
                      : <span style={{ color:C.green }}>Sin expiración</span>}
                  </td>
                  {/* Estado */}
                  <td style={{ padding:"12px 14px" }}>
                    <button
                      className="cu-toggle"
                      onClick={() => toggleActivo(c)}
                      style={{ background:est.bg, color:est.color, borderColor:`${est.color}44`, display:"flex", alignItems:"center", gap:4 }}
                    >
                      {est.icon} {est.label}
                    </button>
                  </td>
                  {/* Acciones */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => openEditar(c)} title="Editar" style={{ background:`${C.blue}12`, border:`1px solid ${C.blue}30`, borderRadius:7, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                        <Edit2 size={13} color={C.blue} strokeWidth={2}/>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id_cupon, c.codigo)}
                        disabled={deleting === c.id_cupon}
                        title="Eliminar"
                        style={{ background:`${C.red}12`, border:`1px solid ${C.red}30`, borderRadius:7, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center", opacity:deleting===c.id_cupon?.4:1 }}
                      >
                        <Trash2 size={13} color={C.red} strokeWidth={2}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div
          onClick={closeModal}
          style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(13,11,20,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background:C.card, borderRadius:18, padding:"32px 32px 28px", width:520, maxWidth:"92vw", boxShadow:"0 24px 64px rgba(0,0,0,.22)", fontFamily:FB }}>
            {/* Header modal */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${C.orange}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Tag size={18} color={C.orange} strokeWidth={2}/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.cream }}>
                  {modal === "crear" ? "Nuevo cupón" : "Editar cupón"}
                </div>
                <div style={{ fontSize:12, color:C.creamSub, marginTop:2 }}>
                  {modal === "crear" ? "Configura el descuento para clientes" : `Editando: ${form.codigo}`}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Código */}
              <div style={{ gridColumn:"span 2" }}>
                <label style={labelS}>Código del cupón *</label>
                <input
                  ref={codigoRef}
                  className="cu-input"
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  disabled={modal === "editar"}
                  placeholder="Ej. VERANO25"
                  style={{ ...inputS, fontFamily:FM, fontWeight:700, letterSpacing:".06em", opacity:modal==="editar"?.65:1 }}
                />
              </div>

              {/* Tipo */}
              <div>
                <label style={labelS}>Tipo de descuento *</label>
                <select
                  className="cu-input"
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as "porcentaje"|"monto" }))}
                  style={{ ...inputS, cursor:"pointer" }}
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="monto">Monto fijo (MXN)</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label style={labelS}>
                  {form.tipo === "porcentaje" ? "Porcentaje (1-100) *" : "Monto en MXN *"}
                </label>
                <input
                  className="cu-input"
                  type="number"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  min={form.tipo==="porcentaje"?"1":"1"}
                  max={form.tipo==="porcentaje"?"100":undefined}
                  placeholder={form.tipo==="porcentaje"?"25":"200"}
                  style={{ ...inputS, fontFamily:FM }}
                />
              </div>

              {/* Descripción */}
              <div style={{ gridColumn:"span 2" }}>
                <label style={labelS}>Descripción <span style={{ fontWeight:400, textTransform:"none" }}>(visible para el cliente)</span></label>
                <input
                  className="cu-input"
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej. Descuento de bienvenida"
                  style={inputS}
                />
              </div>

              {/* Mínimo de compra */}
              <div>
                <label style={labelS}>Mínimo de compra (MXN)</label>
                <input
                  className="cu-input"
                  type="number"
                  value={form.monto_minimo}
                  onChange={e => setForm(f => ({ ...f, monto_minimo: e.target.value }))}
                  placeholder="0 = sin mínimo"
                  min={0}
                  style={{ ...inputS, fontFamily:FM }}
                />
              </div>

              {/* Límite de usos */}
              <div>
                <label style={labelS}>Límite de usos</label>
                <input
                  className="cu-input"
                  type="number"
                  value={form.usos_max}
                  onChange={e => setForm(f => ({ ...f, usos_max: e.target.value }))}
                  placeholder="Vacío = ilimitado"
                  min={1}
                  style={{ ...inputS, fontFamily:FM }}
                />
              </div>

              {/* Fecha expiración */}
              <div style={{ gridColumn:"span 2" }}>
                <label style={labelS}>Fecha de expiración</label>
                <input
                  className="cu-input"
                  type="datetime-local"
                  value={form.fecha_fin}
                  onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                  style={{ ...inputS, fontFamily:FM }}
                />
              </div>

              {/* Activo */}
              <div style={{ gridColumn:"span 2", display:"flex", alignItems:"center", gap:10 }}>
                <button
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  style={{
                    width:40, height:22, borderRadius:100, border:"none", cursor:"pointer", position:"relative", transition:"background .2s",
                    background: form.activo ? C.green : C.creamMut,
                  }}
                >
                  <div style={{ position:"absolute", top:3, left:form.activo?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
                </button>
                <span style={{ fontSize:12, fontWeight:600, color:C.creamSub }}>
                  {form.activo ? "Cupón activo" : "Cupón inactivo"}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:24 }}>
              <button onClick={closeModal} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, fontSize:12, fontWeight:600, color:C.creamSub, cursor:"pointer", fontFamily:FB }}>
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding:"9px 22px", borderRadius:8, border:"none", background:C.orange, fontSize:12, fontWeight:700, color:"#fff", cursor:saving?"not-allowed":"pointer", fontFamily:FB, display:"flex", alignItems:"center", gap:6, opacity:saving?.65:1 }}
              >
                <Tag size={13} strokeWidth={2}/>
                {saving ? "Guardando..." : modal==="crear" ? "Crear cupón" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
