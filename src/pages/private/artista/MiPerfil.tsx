// src/pages/private/artista/MiPerfil.tsx
import { useState, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", text: "#f5f0ff", muted: "rgba(245,240,255,0.45)", green: "#3DDB85",
};

export interface ArtistaInfo {
  id_artista: number; nombre_completo: string; nombre_artistico?: string;
  biografia?: string; estado: string; porcentaje_comision: number;
  correo?: string; telefono?: string; matricula?: string; categoria_nombre?: string;
  foto_perfil?: string; ciudad?: string; direccion_taller?: string; codigo_postal?: string;
  acepta_envios?: boolean; solo_entrega_personal?: boolean;
  politica_envios?: string; politica_devoluciones?: string; email_usuario?: string;
}

interface Props { artista: ArtistaInfo; token: string; onActualizar: (nuevaFoto?: string) => void; }

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .mp-input,.mp-textarea{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 14px;color:#f5f0ff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;transition:all 0.2s ease;line-height:1.5}
  .mp-input::placeholder,.mp-textarea::placeholder{color:rgba(245,240,255,0.2)}
  .mp-input:focus,.mp-textarea:focus{border-color:rgba(255,132,14,0.55);background:rgba(255,132,14,0.05);box-shadow:0 0 0 3px rgba(255,132,14,0.08)}
  .mp-input-ro{width:100%;background:rgba(255,255,255,0.02);border:1.5px solid rgba(255,255,255,0.05);border-radius:10px;padding:11px 14px;color:rgba(245,240,255,0.35);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;cursor:default}
  .mp-textarea{resize:vertical}
  .mp-section{background:rgba(255,255,255,0.025);border:1.5px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px 28px 28px;margin-bottom:18px}
  .mp-toggle-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.2s ease;user-select:none}
  .mp-toggle-row:hover{border-color:rgba(255,132,14,0.25);background:rgba(255,132,14,0.04)}
  .mp-toggle-row.active{border-color:rgba(255,132,14,0.3);background:rgba(255,132,14,0.07)}
  .mp-save-btn{width:100%;padding:15px 0;border-radius:14px;border:none;background:linear-gradient(135deg,#FF840E 0%,#CC59AD 100%);color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 8px 28px rgba(255,132,14,0.28);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);display:flex;align-items:center;justify-content:center;gap:8px}
  .mp-save-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(255,132,14,0.4)}
  .mp-save-btn:active:not(:disabled){transform:translateY(0)}
  .mp-save-btn:disabled{background:rgba(255,255,255,0.06);color:rgba(245,240,255,0.3);box-shadow:none;cursor:not-allowed}
  .mp-foto-wrap{width:100px;height:100px;border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.25s ease;position:relative}
  .mp-foto-wrap:hover{transform:scale(1.04)}
  .mp-foto-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(0,0,0,0.5);border-radius:50%;opacity:0;transition:opacity 0.2s}
  .mp-foto-wrap:hover .mp-foto-overlay{opacity:1}
  .mp-btn-foto{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 20px;color:#f5f0ff;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;transition:all 0.2s}
  .mp-btn-foto:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.18)}
`;

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid rgba(255,255,255,0.07)" }}>
    <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:"linear-gradient(135deg,rgba(255,132,14,0.18),rgba(204,89,173,0.18))", border:"1.5px solid rgba(255,132,14,0.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{icon}</div>
    <h3 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:15.5, fontWeight:700, color:C.text }}>{title}</h3>
  </div>
);

const Field = ({ label, hint, children, full }: { label:string; hint?:string; children:React.ReactNode; full?:boolean }) => (
  <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
    <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase" as const, letterSpacing:1.3, marginBottom:7, fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
    {children}
    {hint && <p style={{ margin:"6px 0 0", fontSize:11.5, color:"rgba(245,240,255,0.28)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{hint}</p>}
  </div>
);

const Toggle = ({ value, onChange, label }: { value:boolean; onChange:(v:boolean)=>void; label:string }) => (
  <div className={`mp-toggle-row${value?" active":""}`} onClick={() => onChange(!value)}>
    <div style={{ width:46, height:26, borderRadius:13, flexShrink:0, position:"relative", background:value?"linear-gradient(135deg,#FF840E,#CC59AD)":"rgba(255,255,255,0.1)", boxShadow:value?"0 0 14px rgba(255,132,14,0.4)":"none", transition:"all 0.25s ease" }}>
      <div style={{ position:"absolute", top:4, left:value?24:4, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 2px 6px rgba(0,0,0,0.3)", transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
    <span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:value?C.text:C.muted, fontWeight:value?500:400, transition:"color 0.2s" }}>{label}</span>
  </div>
);

export default function MiPerfil({ artista, token, onActualizar }: Props) {
  const { showToast } = useToast();
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoFile, setFotoFile]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>(artista.foto_perfil ?? "");
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    nombre_artistico:      artista.nombre_artistico      ?? "",
    biografia:             artista.biografia             ?? "",
    telefono:              artista.telefono              ?? "",
    ciudad:                artista.ciudad                ?? "",
    direccion_taller:      artista.direccion_taller      ?? "",
    codigo_postal:         artista.codigo_postal         ?? "",
    acepta_envios:         artista.acepta_envios         ?? false,
    solo_entrega_personal: artista.solo_entrega_personal ?? false,
    politica_envios:       artista.politica_envios       ?? "",
    politica_devoluciones: artista.politica_devoluciones ?? "",
  });
  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let body: BodyInit;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (fotoFile) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(form);
      }

      const res = await fetch(`${API}/api/artista-portal/mi-perfil`, { method: "PUT", headers, body });

      if (!res.ok) {
        const message = await handleApiError(res);
        showToast(message, "err");
        if (res.status === 401) setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      const data = await res.json();
      if (data.foto_perfil) setFotoPreview(data.foto_perfil);
      setFotoFile(null);
      showToast("Perfil actualizado correctamente", "ok");
      onActualizar(data.foto_perfil);

    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ animation:"fadeUp .4s ease both", maxWidth:"100%", fontFamily:"'DM Sans',sans-serif" }}>

        <div style={{ marginBottom:34 }}>
          <p style={{ margin:"0 0 10px", fontSize:10.5, fontWeight:800, color:C.orange, textTransform:"uppercase", letterSpacing:2.5 }}>✦ Portal del Artista</p>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ margin:"0 0 5px", fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:C.text, letterSpacing:-0.8, lineHeight:1 }}>Mi perfil</h2>
              <p style={{ margin:0, fontSize:13.5, color:C.muted }}>Edita tu información pública y configuración</p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {artista.categoria_nombre && <span style={{ fontSize:11.5, color:C.purple, fontWeight:700, background:"rgba(141,76,205,0.15)", border:"1.5px solid rgba(141,76,205,0.28)", borderRadius:20, padding:"5px 15px" }}>{artista.categoria_nombre}</span>}
              {artista.matricula && <span style={{ fontSize:11.5, fontWeight:800, color:C.gold, background:"rgba(255,193,16,0.1)", border:"1.5px solid rgba(255,193,16,0.3)", borderRadius:20, padding:"5px 15px", letterSpacing:1 }}>{artista.matricula}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Foto */}
          <div className="mp-section">
            <SectionHeader icon="📷" title="Foto de perfil" />
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>
              <div className="mp-foto-wrap" onClick={() => fotoRef.current?.click()} style={{ border:fotoPreview?"2.5px solid rgba(255,132,14,0.5)":"2px dashed rgba(255,255,255,0.15)", background:fotoPreview?"transparent":"rgba(255,255,255,0.03)", boxShadow:fotoPreview?"0 0 0 5px rgba(255,132,14,0.08)":"none" }}>
                {fotoPreview ? <img src={fotoPreview} alt="Foto" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:30, opacity:0.2 }}>👤</span>}
                <div className="mp-foto-overlay">📷</div>
              </div>
              <div>
                <button type="button" className="mp-btn-foto" onClick={() => fotoRef.current?.click()}>{fotoPreview?"Cambiar foto":"Subir foto"}</button>
                {fotoFile && <p style={{ margin:"8px 0 0", fontSize:12, color:C.green, fontWeight:600 }}>✓ {fotoFile.name}</p>}
                <p style={{ margin:"8px 0 0", fontSize:11.5, color:C.muted }}>JPG o PNG · máx. 10 MB</p>
              </div>
              <input ref={fotoRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!["image/jpeg","image/png","image/webp"].includes(f.type)) { showToast("Solo se permiten imágenes JPG, PNG o WebP","warn"); return; }
                  if (f.size > 10 * 1024 * 1024) { showToast("La imagen no puede superar los 10 MB","warn"); return; }
                  setFotoFile(f); setFotoPreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          {/* Info artística */}
          <div className="mp-section">
            <SectionHeader icon="🎨" title="Información artística" />
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Nombre artístico"><input className="mp-input" value={form.nombre_artistico} onChange={e => set("nombre_artistico",e.target.value)} placeholder="Como aparecerás en el catálogo" /></Field>
              <Field label="Biografía" hint="Aparece en tu perfil público"><textarea className="mp-textarea" rows={4} value={form.biografia} onChange={e => set("biografia",e.target.value)} placeholder="Cuéntanos sobre ti, tu técnica y tu obra…" /></Field>
            </div>
          </div>

          {/* Contacto */}
          <div className="mp-section">
            <SectionHeader icon="📞" title="Datos de contacto" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Teléfono"><input className="mp-input" value={form.telefono} onChange={e => set("telefono",e.target.value)} placeholder="10 dígitos" /></Field>
              <Field label="Ciudad"><input className="mp-input" value={form.ciudad} onChange={e => set("ciudad",e.target.value)} placeholder="Ciudad, Estado" /></Field>
              <Field label="Dirección del taller"><input className="mp-input" value={form.direccion_taller} onChange={e => set("direccion_taller",e.target.value)} placeholder="Opcional" /></Field>
              <Field label="Código postal"><input className="mp-input" value={form.codigo_postal} onChange={e => set("codigo_postal",e.target.value)} placeholder="CP" /></Field>
            </div>
          </div>

          {/* Envíos */}
          <div className="mp-section">
            <SectionHeader icon="📦" title="Política de envíos" />
            <div style={{ display:"grid", gap:10, marginBottom:22 }}>
              <Toggle value={form.acepta_envios} onChange={v => set("acepta_envios",v)} label="Acepto envíos a domicilio" />
              <Toggle value={form.solo_entrega_personal} onChange={v => set("solo_entrega_personal",v)} label="Solo entrega personal / en taller" />
            </div>
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Política de envíos" hint="Tiempos, costos, cobertura"><textarea className="mp-textarea" rows={3} value={form.politica_envios} onChange={e => set("politica_envios",e.target.value)} placeholder="Ej: Envíos en 3–5 días hábiles…" /></Field>
              <Field label="Política de devoluciones"><textarea className="mp-textarea" rows={3} value={form.politica_devoluciones} onChange={e => set("politica_devoluciones",e.target.value)} placeholder="Ej: No se aceptan devoluciones…" /></Field>
            </div>
          </div>

          {/* Cuenta */}
          <div className="mp-section">
            <SectionHeader icon="🔒" title="Datos de cuenta" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <Field label="Correo"><input className="mp-input-ro" value={artista.email_usuario??""} readOnly /></Field>
              <Field label="Nombre completo"><input className="mp-input-ro" value={artista.nombre_completo??""} readOnly /></Field>
              <Field label="Matrícula"><input className="mp-input-ro" value={artista.matricula??"—"} readOnly /></Field>
              <Field label="Comisión"><input className="mp-input-ro" value={artista.porcentaje_comision?`${artista.porcentaje_comision}%`:"—"} readOnly /></Field>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 15px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1.5px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize:14, flexShrink:0 }}>ℹ️</span>
              <p style={{ margin:0, fontSize:12, color:C.muted, lineHeight:1.6 }}>Para cambiar correo, contraseña o matrícula contacta a Nu-B Studio.</p>
            </div>
          </div>

          <button type="submit" disabled={saving} className="mp-save-btn">
            {saving ? (
              <><span style={{ width:17, height:17, border:"2.5px solid rgba(245,240,255,0.25)", borderTopColor:"rgba(245,240,255,0.7)", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />Guardando…</>
            ) : "Guardar cambios"}
          </button>

        </form>
        <div style={{ height:48 }} />
      </div>
    </>
  );
}