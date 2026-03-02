// src/pages/private/artista/MiPerfil.tsx
import { useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#FF840E", pink: "#CC59AD", purple: "#8D4CCD",
  gold: "#FFC110", bg: "#080612", panel: "#0d0b1a",
  card: "rgba(255,255,255,0.028)", border: "rgba(255,255,255,0.07)",
  text: "#f5f0ff", muted: "rgba(245,240,255,0.45)",
  green: "#3DDB85",
};

export interface ArtistaInfo {
  id_artista: number; nombre_completo: string; nombre_artistico?: string;
  biografia?: string; estado: string; porcentaje_comision: number;
  correo?: string; telefono?: string; matricula?: string; categoria_nombre?: string;
  foto_perfil?: string; ciudad?: string; direccion_taller?: string; codigo_postal?: string;
  acepta_envios?: boolean; solo_entrega_personal?: boolean;
  politica_envios?: string; politica_devoluciones?: string;
  email_usuario?: string;
}

interface Props {
  artista: ArtistaInfo;
  token: string;
  onActualizar: (nuevaFoto?: string) => void;
}

// ── Helpers UI ────────────────────────────────────────────────
const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 5,
      fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, readOnly = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean;
}) => (
  <input
    value={value} readOnly={readOnly} placeholder={placeholder}
    onChange={e => onChange?.(e.target.value)}
    style={{
      width: "100%",
      background: readOnly ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${readOnly ? "rgba(255,255,255,0.04)" : C.border}`,
      borderRadius: 8, padding: "9px 13px",
      color: readOnly ? C.muted : C.text,
      fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: "none",
      boxSizing: "border-box" as const, cursor: readOnly ? "default" : "text",
    }}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) => (
  <textarea
    value={value} rows={rows} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    style={{
      width: "100%", background: "rgba(255,255,255,0.05)",
      border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px",
      color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
      resize: "vertical", outline: "none", lineHeight: 1.6,
      boxSizing: "border-box" as const,
    }}
  />
);

const Toggle = ({ value, onChange, label }: {
  value: boolean; onChange: (v: boolean) => void; label: string;
}) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
    <div onClick={() => onChange(!value)} style={{
      width: 42, height: 22, borderRadius: 11,
      background: value ? C.orange : "rgba(255,255,255,0.1)",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 22 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
      }} />
    </div>
    <span style={{ fontSize: 13.5, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
  </label>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: "20px 24px", marginBottom: 18,
  }}>
    <h3 style={{
      margin: "0 0 16px", fontFamily: "'Playfair Display', serif",
      fontSize: 14, color: C.text,
      borderBottom: `1px solid ${C.border}`, paddingBottom: 10,
    }}>
      {title}
    </h3>
    {children}
  </div>
);

// ============================================================
// COMPONENTE
// ============================================================
export default function MiPerfil({ artista, token, onActualizar }: Props) {
  const fotoRef = useRef<HTMLInputElement>(null);

  const [fotoFile, setFotoFile]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>(artista.foto_perfil ?? "");
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

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

      const res  = await fetch(`${API}/api/artista-portal/mi-perfil`, { method: "PUT", headers, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al guardar");

      if (data.foto_perfil) setFotoPreview(data.foto_perfil);
      setFotoFile(null);
      setMsg({ type: "ok", text: "✓ Perfil actualizado correctamente" });
      onActualizar(data.foto_perfil);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inicial = (artista.nombre_artistico || artista.nombre_completo).charAt(0).toUpperCase();

  return (
    <div style={{ animation: "fadeUp .5s ease both", maxWidth: 700 }}>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.orange, textTransform: "uppercase",
            letterSpacing: 1.5, margin: "0 0 6px" }}>✦ Portal del Artista</p>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: 0,
            fontFamily: "'Playfair Display', serif" }}>Mi perfil</h2>
        </div>
        {artista.matricula && (
          <span style={{ fontSize: 12, fontWeight: 800, color: C.gold,
            background: `${C.gold}12`, border: `1px solid ${C.gold}30`,
            borderRadius: 20, padding: "4px 14px", letterSpacing: 1 }}>
            {artista.matricula}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>

        {/* Foto */}
        <Section title="📷 Foto de perfil">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div onClick={() => fotoRef.current?.click()} style={{
              width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
              background: fotoPreview ? "transparent" : "rgba(255,255,255,0.05)",
              border: `2px dashed ${C.border}`, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {fotoPreview
                ? <img src={fotoPreview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 28, opacity: 0.3 }}>👤</span>
              }
            </div>
            <div>
              <button type="button" onClick={() => fotoRef.current?.click()} style={{
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "7px 16px", color: C.text, cursor: "pointer",
                fontSize: 13, display: "block", marginBottom: 6, fontFamily: "'DM Sans', sans-serif",
              }}>
                {fotoPreview ? "Cambiar foto" : "Subir foto"}
              </button>
              {fotoFile && (
                <p style={{ margin: 0, fontSize: 11.5, color: C.green }}>✓ {fotoFile.name}</p>
              )}
              <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>JPG o PNG · máx. 10 MB</p>
            </div>
            <input ref={fotoRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)); }
              }}
            />
          </div>
        </Section>

        {/* Información artística */}
        <Section title="🎨 Información artística">
          <Field label="Nombre artístico">
            <Input value={form.nombre_artistico} onChange={v => set("nombre_artistico", v)}
              placeholder="Como aparecerás en el catálogo" />
          </Field>
          <Field label="Biografía" hint="Aparece en tu perfil público">
            <Textarea value={form.biografia} onChange={v => set("biografia", v)}
              placeholder="Cuéntanos sobre ti, tu técnica y tu obra…" rows={4} />
          </Field>
        </Section>

        {/* Contacto */}
        <Section title="📞 Datos de contacto">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Teléfono">
              <Input value={form.telefono} onChange={v => set("telefono", v)} placeholder="10 dígitos" />
            </Field>
            <Field label="Ciudad">
              <Input value={form.ciudad} onChange={v => set("ciudad", v)} placeholder="Ciudad, Estado" />
            </Field>
            <Field label="Dirección del taller">
              <Input value={form.direccion_taller} onChange={v => set("direccion_taller", v)} placeholder="Opcional" />
            </Field>
            <Field label="Código postal">
              <Input value={form.codigo_postal} onChange={v => set("codigo_postal", v)} placeholder="CP" />
            </Field>
          </div>
        </Section>

        {/* Envíos */}
        <Section title="📦 Política de envíos">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
            <Toggle value={form.acepta_envios} onChange={v => set("acepta_envios", v)}
              label="Acepto envíos a domicilio" />
            <Toggle value={form.solo_entrega_personal} onChange={v => set("solo_entrega_personal", v)}
              label="Solo entrega personal / en taller" />
          </div>
          <Field label="Política de envíos" hint="Tiempos, costos, cobertura">
            <Textarea value={form.politica_envios} onChange={v => set("politica_envios", v)}
              placeholder="Ej: Envíos en 3–5 días hábiles…" />
          </Field>
          <Field label="Política de devoluciones">
            <Textarea value={form.politica_devoluciones} onChange={v => set("politica_devoluciones", v)}
              placeholder="Ej: No se aceptan devoluciones…" />
          </Field>
        </Section>

        {/* Solo lectura */}
        <Section title="🔒 Datos de cuenta (solo lectura)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Correo">
              <Input value={artista.email_usuario ?? ""} readOnly />
            </Field>
            <Field label="Nombre completo">
              <Input value={artista.nombre_completo ?? ""} readOnly />
            </Field>
            <Field label="Matrícula">
              <Input value={artista.matricula ?? "—"} readOnly />
            </Field>
            <Field label="Comisión">
              <Input value={artista.porcentaje_comision ? `${artista.porcentaje_comision}%` : "—"} readOnly />
            </Field>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: C.muted }}>
            Para cambiar correo, contraseña o matrícula contacta a Nu-B Studio.
          </p>
        </Section>

        {/* Mensaje */}
        {msg && (
          <div style={{
            padding: "11px 15px", borderRadius: 8, marginBottom: 14,
            background: msg.type === "ok" ? `${C.green}15` : `${C.pink}15`,
            border: `1px solid ${msg.type === "ok" ? C.green : C.pink}44`,
            color: msg.type === "ok" ? C.green : C.pink, fontSize: 13.5,
          }}>
            {msg.text}
          </div>
        )}

        {/* Botón guardar */}
        <button type="submit" disabled={saving} style={{
          width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
          background: saving ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
          color: saving ? C.muted : "#fff", fontSize: 15, fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: saving ? "none" : `0 6px 20px ${C.orange}35`,
        }}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>

      </form>
    </div>
  );
}