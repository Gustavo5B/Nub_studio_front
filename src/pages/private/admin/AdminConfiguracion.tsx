import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:"#E8640C", green:"#0E8A50", blue:"#2D6FBE",
  cream:"#14121E", creamSub:"#5A5870", creamMut:"#9896A8",
  bg:"#F9F8FC", card:"#FFFFFF", border:"#E6E4EF",
};
const CS = "0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.055)";
const FB = "'Outfit', sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` };
}
const fmtMXN = (n: string | number) =>
  new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN" }).format(Number(n));

interface ConfigItem { id_configuracion: number; clave: string; valor: string; tipo: string; descripcion: string; activo: boolean; }

const LABELS: Record<string, { label: string; desc: string; prefix?: string; suffix?: string }> = {
  precio_empaque_reforzado: { label: "Precio empaque reforzado",  desc: "Cargo adicional por empaque de seguridad en envíos. El cliente puede elegirlo en el checkout.", prefix: "$", suffix: "MXN" },
};

export default function AdminConfiguracion() {
  const { showToast } = useToast();
  const [items,   setItems]   = useState<ConfigItem[]>([]);
  const [edits,   setEdits]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/configuracion`, { headers: authH() });
      const d = await r.json();
      if (d.success) {
        setItems(d.data);
        const map: Record<string, string> = {};
        d.data.forEach((c: ConfigItem) => { map[c.clave] = c.valor; });
        setEdits(map);
      }
    } catch { showToast("Error al cargar configuración", "err"); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const guardar = async (clave: string) => {
    const valor = edits[clave];
    if (!valor && valor !== "0") return showToast("El valor no puede estar vacío", "err");
    setSaving(clave);
    try {
      const r = await fetch(`${API}/api/admin/configuracion/${clave}`, {
        method: "PATCH", headers: authH(), body: JSON.stringify({ valor }),
      });
      const d = await r.json();
      if (d.success) { showToast("Configuración actualizada", "ok"); cargar(); }
      else showToast(d.message, "err");
    } catch { showToast("Error al guardar", "err"); }
    finally { setSaving(null); }
  };

  const changed = (clave: string) => {
    const original = items.find(i => i.clave === clave);
    return original?.valor !== edits[clave];
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .adm-cfg { font-family:${FB}; background:${C.bg}; min-height:100vh; padding:28px 24px; }
        .cfg-card { background:${C.card}; border-radius:12px; box-shadow:${CS}; margin-bottom:16px; overflow:hidden; }
        .cfg-card-header { padding:16px 20px; border-bottom:1px solid ${C.border}; display:flex; align-items:center; gap:10px; }
        .cfg-card-body { padding:20px; display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; }
        .field { display:flex; flex-direction:column; gap:5px; }
        .field label { font-size:11px; font-weight:600; color:${C.creamSub}; text-transform:uppercase; letter-spacing:.04em; }
        .input-wrap { display:flex; align-items:center; border:1px solid ${C.border}; border-radius:8px; background:${C.bg}; overflow:hidden; }
        .input-wrap:focus-within { border-color:${C.orange}; }
        .input-affix { padding:0 10px; font-size:12px; color:${C.creamMut}; font-family:${FB}; user-select:none; }
        .input-wrap input { border:none; background:none; padding:8px 4px; font-size:14px; font-family:${FM}; font-weight:600; color:${C.cream}; outline:none; width:120px; }
        .btn-save { background:${C.green}; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:${FB}; white-space:nowrap; }
        .btn-save:disabled { opacity:.6; cursor:default; }
        .btn-save:not(:disabled):hover { opacity:.9; }
        .preview-val { font-family:${FM}; font-size:13px; color:${C.creamSub}; }
        .icon-btn { background:none; border:1px solid ${C.border}; border-radius:6px; padding:5px 8px; cursor:pointer; display:flex; align-items:center; color:${C.creamSub}; }
        .raw-section { background:${C.card}; border-radius:12px; box-shadow:${CS}; overflow:hidden; }
        .raw-row { display:flex; align-items:center; padding:12px 20px; border-bottom:1px solid ${C.border}; gap:12px; flex-wrap:wrap; }
        .raw-row:last-child { border-bottom:none; }
        .raw-clave { font-family:${FM}; font-size:12px; color:${C.blue}; background:#F0F4FF; border:1px solid #C7D9F8; border-radius:4px; padding:2px 7px; }
        .raw-input { border:1px solid ${C.border}; border-radius:6px; padding:6px 10px; font-size:13px; font-family:${FM}; color:${C.cream}; background:${C.bg}; outline:none; width:160px; }
        .raw-input:focus { border-color:${C.orange}; }
        .raw-desc { font-size:12px; color:${C.creamSub}; flex:1; }
        .tipo-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:4px; background:#F3F2F8; color:${C.creamSub}; }
        .section-title { font-size:13px; font-weight:700; color:${C.creamSub}; text-transform:uppercase; letter-spacing:.05em; margin:24px 0 10px; }
      `}</style>

      <div className="adm-cfg">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:C.cream, margin:0 }}>Configuración</h1>
            <p style={{ fontSize:13, color:C.creamSub, margin:"4px 0 0" }}>Parámetros globales de la plataforma</p>
          </div>
          <button className="icon-btn" onClick={cargar}><RefreshCw size={14}/></button>
        </div>

        {loading ? (
          <div style={{ padding:48, textAlign:"center", color:C.creamMut }}>Cargando configuración...</div>
        ) : (
          <>
            {/* Claves conocidas con UI amigable */}
            {items.filter(i => LABELS[i.clave]).map(item => {
              const meta = LABELS[item.clave];
              return (
                <div className="cfg-card" key={item.clave}>
                  <div className="cfg-card-header">
                    <Settings size={16} color={C.orange}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.cream }}>{meta.label}</div>
                      <div style={{ fontSize:12, color:C.creamSub, marginTop:2 }}>{meta.desc}</div>
                    </div>
                  </div>
                  <div className="cfg-card-body">
                    <div className="field">
                      <label>Valor actual</label>
                      <div className="input-wrap">
                        {meta.prefix && <span className="input-affix">{meta.prefix}</span>}
                        <input
                          type="number" min="0" step="0.01"
                          value={edits[item.clave] ?? item.valor}
                          onChange={e => setEdits(d => ({ ...d, [item.clave]: e.target.value }))}
                        />
                        {meta.suffix && <span className="input-affix">{meta.suffix}</span>}
                      </div>
                    </div>
                    {item.tipo === "numero" && (
                      <div style={{ marginBottom:2 }}>
                        <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", color:C.creamMut, marginBottom:4 }}>Vista previa</div>
                        <span className="preview-val">{fmtMXN(edits[item.clave] ?? item.valor)}</span>
                      </div>
                    )}
                    <button className="btn-save" onClick={() => guardar(item.clave)}
                      disabled={saving === item.clave || !changed(item.clave)}>
                      <Save size={13}/>
                      {saving === item.clave ? "Guardando..." : changed(item.clave) ? "Guardar" : "Sin cambios"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Resto de claves sin UI especial */}
            {items.filter(i => !LABELS[i.clave]).length > 0 && (
              <>
                <div className="section-title">Otras configuraciones</div>
                <div className="raw-section">
                  {items.filter(i => !LABELS[i.clave]).map(item => (
                    <div className="raw-row" key={item.clave}>
                      <span className="raw-clave">{item.clave}</span>
                      <span className="tipo-badge">{item.tipo}</span>
                      <span className="raw-desc">{item.descripcion}</span>
                      <input className="raw-input"
                        value={edits[item.clave] ?? item.valor}
                        onChange={e => setEdits(d => ({ ...d, [item.clave]: e.target.value }))}
                      />
                      <button className="btn-save" style={{ fontSize:12, padding:"6px 12px" }}
                        onClick={() => guardar(item.clave)}
                        disabled={saving === item.clave || !changed(item.clave)}>
                        <Save size={12}/>{saving === item.clave ? "..." : "Guardar"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
