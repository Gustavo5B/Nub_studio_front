// src/pages/private/admin/AdminSobreNosotros.tsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ChevronRight, AlertTriangle } from "lucide-react";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  purple:   "#8D4CCD",
  gold:     "#FFC110",
  green:    "#22C97A",
  blue:     "#79AAF5",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.35)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
};

const FD = "'Cormorant Garamond', serif";
const FB = "'Outfit', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TRAYECTORIA_COLORS = [C.orange, C.gold, C.pink, C.purple, C.green];

interface SobreNosotrosData {
  mision: string; vision: string; historia: string;
  logros: string; valores: string; descripcion_region: string;
}
interface TrayectoriaItem {
  id?: number; año: string; titulo: string; descripcion: string;
}

// ── Modal confirmación ────────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#100D1C", border: `1px solid ${C.borderBr}`, borderRadius: 16, padding: "32px 36px", maxWidth: 420, width: "90%", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.gold}14`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <AlertTriangle size={24} color={C.gold} strokeWidth={1.8} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 10px" }}>
          ¿Confirmar actualización?
        </h3>
        <p style={{ fontSize: 13.5, color: C.creamSub, fontFamily: FB, lineHeight: 1.7, margin: "0 0 28px" }}>
          Estás a punto de actualizar los datos que se muestran públicamente en la sección <strong style={{ color: C.cream }}>Sobre nosotros</strong>. ¿Estás seguro?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel}
            style={{ padding: "10px 24px", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamSub, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: FB }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ padding: "10px 24px", borderRadius: 10, background: C.orange, border: "none", color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FB }}>
            Sí, actualizar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field textarea ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, rows = 3, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.creamMut, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB, marginBottom: hint ? 4 : 8 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB, margin: "0 0 8px", lineHeight: 1.5 }}>{hint}</p>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ width: "100%", background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "12px 14px", color: C.cream, fontSize: 14, fontFamily: FB, lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
        onFocus={e => (e.target as HTMLElement).style.borderColor = `${C.orange}55`}
        onBlur={e => (e.target as HTMLElement).style.borderColor = C.borderBr}
      />
    </div>
  );
}

export default function AdminSobreNosotros() {
  const { showToast } = useToast();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState<null | "info" | "trayectoria">(null);
  const [info, setInfo] = useState<SobreNosotrosData>({
    mision: "", vision: "", historia: "", logros: "", valores: "", descripcion_region: "",
  });
  const [trayectoria, setTrayectoria] = useState<TrayectoriaItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/sobre-nosotros`).then(r => r.json()),
      fetch(`${API_URL}/api/sobre-nosotros/trayectoria`).then(r => r.json()),
    ])
      .then(([sn, tray]) => {
        if (sn.data)   setInfo(sn.data);
        if (tray.data) setTrayectoria(tray.data);
      })
      .catch(() => showToast("Error al cargar los datos", "err"))
      .finally(() => setLoading(false));
  }, []);

  const saveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/sobre-nosotros`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify(info),
      });
      if (!res.ok) throw new Error();
      showToast("Información actualizada correctamente", "ok");
    } catch {
      showToast("Error al guardar los datos", "err");
    } finally { setSaving(false); setConfirm(null); }
  };

  const saveTrayectoria = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/sobre-nosotros/trayectoria`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ items: trayectoria }),
      });
      if (!res.ok) throw new Error();
      showToast("Trayectoria actualizada correctamente", "ok");
    } catch {
      showToast("Error al guardar la trayectoria", "err");
    } finally { setSaving(false); setConfirm(null); }
  };

  const addItem    = () => setTrayectoria(p => [...p, { año: "", titulo: "", descripcion: "" }]);
  const removeItem = (i: number) => setTrayectoria(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof TrayectoriaItem, val: string) =>
    setTrayectoria(p => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <p style={{ color: C.creamMut, fontFamily: FB, fontSize: 14 }}>Cargando...</p>
    </div>
  );

  return (
    <>
      {confirm && (
        <ConfirmModal
          onConfirm={confirm === "info" ? saveInfo : saveTrayectoria}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{ padding: "24px 28px", fontFamily: FB, maxWidth: 860 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
          <ChevronRight size={12} color={C.creamMut} />
          <span style={{ fontSize: 13, color: C.creamSub }}>Sobre nosotros</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 28px", letterSpacing: "-0.02em" }}>
          Editar <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sobre nosotros</span>
        </h1>

        {/* ── BLOQUE 1: Info general ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.pink}, ${C.purple})` }} />
          <div style={{ padding: "28px 28px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: C.cream, fontFamily: FD, margin: 0 }}>Información general</h2>
                <p style={{ fontSize: 12, color: C.creamMut, fontFamily: FB, margin: "4px 0 0" }}>Misión, visión, historia, logros, valores y región</p>
              </div>
            </div>

            {/* Grid misión / visión */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 4 }}>
              <Field label="Misión" value={info.mision} onChange={v => setInfo(p => ({ ...p, mision: v }))} rows={5} />
              <Field label="Visión" value={info.vision} onChange={v => setInfo(p => ({ ...p, vision: v }))} rows={5} />
            </div>

            <Field label="Historia" value={info.historia} onChange={v => setInfo(p => ({ ...p, historia: v }))} rows={3} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Logros" value={info.logros} onChange={v => setInfo(p => ({ ...p, logros: v }))} rows={4}
                hint="Separa cada logro con un punto. Ej: 500 obras.50 artistas activos." />
              <Field label="Valores" value={info.valores} onChange={v => setInfo(p => ({ ...p, valores: v }))} rows={4}
                hint="Separa cada valor con un punto. Ej: Autenticidad.Compromiso.Cultura." />
            </div>

            <Field label="Descripción de la región" value={info.descripcion_region} onChange={v => setInfo(p => ({ ...p, descripcion_region: v }))} rows={4} />
          </div>

          <div style={{ padding: "0 28px 24px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirm("info")} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 28px", borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: FB, opacity: saving ? 0.7 : 1, boxShadow: `0 4px 16px ${C.orange}30` }}>
              <Save size={15} strokeWidth={2.5} /> Guardar información
            </button>
          </div>
        </div>

        {/* ── BLOQUE 2: Trayectoria ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.pink}, ${C.purple}, ${C.blue})` }} />
          <div style={{ padding: "28px 28px 8px" }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.cream, fontFamily: FD, margin: 0 }}>Trayectoria</h2>
              <p style={{ fontSize: 12, color: C.creamMut, fontFamily: FB, margin: "4px 0 0" }}>Hitos históricos que se muestran en la línea de tiempo</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {trayectoria.map((item, i) => {
                const color = TRAYECTORIA_COLORS[i % TRAYECTORIA_COLORS.length];
                return (
                  <div key={`tray-${i}`} style={{ background: "rgba(255,232,200,0.02)", border: `1px solid ${color}22`, borderRadius: 12, padding: "16px 18px", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color, borderRadius: "12px 0 0 12px" }} />
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                      <div style={{ flex: "0 0 100px" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.creamMut, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB, marginBottom: 6 }}>Año</label>
                        <input value={item.año} onChange={e => updateItem(i, "año", e.target.value)} placeholder="2024"
                          style={{ width: "100%", background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "10px 14px", color: C.cream, fontSize: 14, fontFamily: FB, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => (e.target as HTMLElement).style.borderColor = `${color}55`}
                          onBlur={e => (e.target as HTMLElement).style.borderColor = C.borderBr}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.creamMut, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB, marginBottom: 6 }}>Título</label>
                        <input value={item.titulo} onChange={e => updateItem(i, "titulo", e.target.value)} placeholder="Nombre del hito"
                          style={{ width: "100%", background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "10px 14px", color: C.cream, fontSize: 14, fontFamily: FB, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => (e.target as HTMLElement).style.borderColor = `${color}55`}
                          onBlur={e => (e.target as HTMLElement).style.borderColor = C.borderBr}
                        />
                      </div>
                      <button onClick={() => removeItem(i)}
                        style={{ width: 38, height: 38, borderRadius: 9, background: `${C.pink}12`, border: `1px solid ${C.pink}28`, color: C.pink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.creamMut, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FB, marginBottom: 6 }}>Descripción</label>
                      <textarea value={item.descripcion} onChange={e => updateItem(i, "descripcion", e.target.value)} rows={2}
                        style={{ width: "100%", background: "rgba(255,232,200,0.03)", border: `1px solid ${C.borderBr}`, borderRadius: 10, padding: "10px 14px", color: C.cream, fontSize: 14, fontFamily: FB, lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                        onFocus={e => (e.target as HTMLElement).style.borderColor = `${color}55`}
                        onBlur={e => (e.target as HTMLElement).style.borderColor = C.borderBr}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={addItem}
              style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 18px", borderRadius: 10, background: "transparent", border: `1px dashed ${C.borderBr}`, color: C.creamMut, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, width: "100%", justifyContent: "center", transition: "all .15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${C.orange}55`; el.style.color = C.orange; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderBr; el.style.color = C.creamMut; }}>
              <Plus size={15} strokeWidth={2.5} /> Agregar hito
            </button>
          </div>

          <div style={{ padding: "0 28px 24px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirm("trayectoria")} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 28px", borderRadius: 10, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: FB, opacity: saving ? 0.7 : 1, boxShadow: `0 4px 16px ${C.pink}30` }}>
              <Save size={15} strokeWidth={2.5} /> Guardar trayectoria
            </button>
          </div>
        </div>

      </div>
    </>
  );
}