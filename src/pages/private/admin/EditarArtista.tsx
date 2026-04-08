// src/pages/admin/artistas/EditarArtista.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  Loader2, Tag,
  DollarSign, Award, Link as LinkIcon, Type,
  FileText, Phone, Mail, Hash,
  Star, Palette, Percent,
  UploadCloud, X, FileImage, ChevronRight, AlertCircle,
  Home, Users, Edit2,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

// ========== PALETA DE COLORES ==========
const C = {
  orange: "#E8640C",
  orangeDark: "#D45A0A",
  orangeLight: "#FEE9E0",
  ink: "#14121E",
  muted: "#8A8A8A",
  border: "#EDEDE9",
  bgCard: "#FFFFFF",
  bgPage: "#F8F8F6",
  inputBg: "#F5F5F2",
  error: "#C4304A",
  success: "#1A7A45",
  successLight: "rgba(26,122,69,0.1)",
  shadow: "rgba(0,0,0,0.04)",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ========== VALIDACIONES ==========
const xssPattern = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const soloLetrasEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;
const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);

const validarCampos = (form: { nombre_completo: string; nombre_artistico: string; biografia: string; telefono: string }): string | null => {
  if (!form.nombre_completo.trim()) return "El nombre completo es obligatorio";
  if (form.nombre_completo.trim().length < 3) return "El nombre debe tener mínimo 3 caracteres";
  if (!soloLetrasEspacios.test(form.nombre_completo.trim())) return "El nombre solo debe contener letras y espacios";
  if (hasSuspiciousContent(form.nombre_completo)) return "El nombre contiene contenido no permitido";
  if (form.nombre_artistico && form.nombre_artistico.trim().length < 2) return "El nombre artístico debe tener mínimo 2 caracteres";
  if (form.nombre_artistico && hasSuspiciousContent(form.nombre_artistico)) return "El nombre artístico contiene contenido no permitido";
  if (form.biografia && form.biografia.trim().length < 10) return "La biografía debe tener mínimo 10 caracteres";
  if (form.biografia && hasSuspiciousContent(form.biografia)) return "La biografía contiene contenido no permitido";
  if (form.telefono && !/^\d{10}$/.test(form.telefono.replace(/[\s\-()]/g, ""))) return "El teléfono debe tener exactamente 10 dígitos";
  return null;
};

function validateNombreCompleto(v: string): string | null {
  if (v && hasSuspiciousContent(v)) return "Contenido no permitido";
  if (v && !soloLetrasEspacios.test(v)) return "Solo letras y espacios — sin números";
  if (v && v.trim().length < 3) return "Mínimo 3 caracteres";
  return null;
}
function validateNombreArtistico(v: string): string | null {
  if (v && hasSuspiciousContent(v)) return "Contenido no permitido";
  if (v && v.trim().length < 2) return "Mínimo 2 caracteres";
  return null;
}
function validateBiografia(v: string): string | null {
  if (v && hasSuspiciousContent(v)) return "Contenido no permitido";
  if (v && v.trim().length < 10) return "Mínimo 10 caracteres";
  return null;
}
function validateTelefono(v: string): string | null {
  const digits = v.replace(/[\s\-()]/g, "");
  if (v && !/^\d*$/.test(digits)) return "Solo se permiten números";
  if (v && digits.length > 10) return "Máximo 10 dígitos";
  if (v && digits.length < 10) return "Mínimo 10 dígitos";
  return null;
}

const FIELD_VALIDATORS: Record<string, (v: string) => string | null> = {
  nombre_completo: validateNombreCompleto,
  nombre_artistico: validateNombreArtistico,
  biografia: validateBiografia,
  telefono: validateTelefono,
};

function validateField(name: string, value: string): string | null {
  const fn = FIELD_VALIDATORS[name];
  return fn ? fn(value) : null;
}

// ========== TIPOS ==========
interface Categoria { id_categoria: number; nombre: string; }
interface ArtistaForm {
  nombre_completo: string; nombre_artistico: string; biografia: string;
  foto_perfil: string; correo: string; telefono: string; matricula: string;
  id_categoria_principal: string; porcentaje_comision: number; estado: string;
}

const ESTADOS = [
  { val: "activo", label: "Activo", color: C.success },
  { val: "pendiente", label: "Pendiente", color: C.orange },
  { val: "inactivo", label: "Inactivo", color: C.muted },
  { val: "suspendido", label: "Suspendido", color: C.error },
];

// ========== MODAL DE CONFIRMACIÓN ==========
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }} onClick={onCancel}>
      <div style={{
        background: C.bgCard,
        borderRadius: 28,
        padding: "28px 32px",
        maxWidth: 400,
        width: "90%",
        textAlign: "center",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
        border: `1px solid ${C.border}`,
        animation: "scaleIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: `${C.error}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          border: `1px solid ${C.error}30`,
        }}>
          <AlertCircle size={28} color={C.error} strokeWidth={1.8} />
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, margin: "0 0 12px", color: C.ink }}>{title}</h3>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} style={{
            padding: "10px 28px",
            borderRadius: 40,
            border: `1.5px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 13,
            transition: "all 0.2s",
          }} onMouseEnter={e => (e.currentTarget.style.background = C.inputBg)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            padding: "10px 28px",
            borderRadius: 40,
            border: "none",
            background: C.error,
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 13,
            transition: "all 0.2s",
            boxShadow: `0 2px 8px ${C.error}40`,
          }} onMouseEnter={e => (e.currentTarget.style.background = "#a8233a")} onMouseLeave={e => (e.currentTarget.style.background = C.error)}>
            Confirmar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

// ========== COMPONENTES UI ==========
function inputStyle(focused: boolean, disabled: boolean, error?: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 14px",
    boxSizing: "border-box",
    background: error ? `${C.error}05` : focused ? C.inputBg : C.inputBg,
    border: `1.5px solid ${error ? C.error : focused ? C.orange : C.border}`,
    borderRadius: 12,
    fontSize: 13.5,
    color: C.ink,
    outline: "none",
    transition: "border-color .15s, background .15s",
    fontFamily: SANS,
    opacity: disabled ? 0.5 : 1,
  };
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 7, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: SANS }}>
      {children}
      {req && <span style={{ color: C.orange }}>*</span>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11.5, color: C.error, fontWeight: 600, marginTop: 5, fontFamily: SANS }}>⚠ {msg}</div>;
}

function Card({ accent, icon: Icon, title, children }: { accent: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: `0 2px 8px ${C.shadow}`,
    }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},${accent}50,transparent)` }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={accent} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: SERIF }}>{title}</span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,${accent}18,transparent)` }} />
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

// ========== TOPBAR CON BREADCRUMB E ICONOS ==========
function EditarArtistaTopbar({ navigate, loading, cursorOn, cursorOff }: { navigate: (p: string) => void; loading: boolean; cursorOn: () => void; cursorOff: () => void }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      height: 60,
      background: C.bgCard,
      borderBottom: `1px solid ${C.border}`,
      position: "sticky",
      top: 0,
      zIndex: 30,
      fontFamily: SANS,
      boxShadow: `0 1px 3px ${C.shadow}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => navigate("/admin/dashboard")}
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontSize: 12,
            fontWeight: 500,
            transition: "color 0.2s",
          }}
        >
          <Home size={14} strokeWidth={1.8} />
          Inicio
        </button>
        <ChevronRight size={12} color={C.muted} />
        <button
          onClick={() => navigate("/admin/artistas")}
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontSize: 12,
            fontWeight: 500,
            transition: "color 0.2s",
          }}
        >
          <Users size={14} strokeWidth={1.8} />
          Artistas
        </button>
        <ChevronRight size={12} color={C.muted} />
        <span style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: C.orange,
          fontSize: 12,
          fontWeight: 700,
        }}>
          <Edit2 size={14} strokeWidth={1.8} />
          Editar artista
        </span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => navigate("/admin/artistas")}
          disabled={loading}
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
          style={{
            padding: "7px 20px",
            borderRadius: 40,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: SANS,
            transition: "all 0.2s",
          }}
        >
          Cancelar
        </button>
        <button
          form="form-editar-artista"
          type="submit"
          disabled={loading}
          onMouseEnter={cursorOn}
          onMouseLeave={cursorOff}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 24px",
            borderRadius: 40,
            border: "none",
            background: loading ? `${C.orange}60` : C.orange,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: SANS,
            boxShadow: loading ? "none" : `0 2px 6px ${C.orange}40`,
            transition: "all 0.2s",
          }}
        >
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</> : <><Save size={14} strokeWidth={2.5} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

// ========== PREVIEW CARD ==========
function getAvatarGrad(estado: string): string {
  if (estado === "activo") return `linear-gradient(135deg,${C.success}20,${C.orange}20)`;
  if (estado === "pendiente") return `linear-gradient(135deg,${C.orange}20,${C.orange}10)`;
  return `linear-gradient(135deg,${C.error}20,${C.muted}20)`;
}

function PreviewCard({ form, fotoSrc, categorias, cursorOn, cursorOff }: { form: ArtistaForm; fotoSrc: string; categorias: Categoria[]; cursorOn: () => void; cursorOff: () => void }) {
  const initials = form.nombre_completo.split(" ").slice(0, 2).map((n: string) => n[0] || "").join("").toUpperCase() || "?";
  const cat = categorias.find(c => String(c.id_categoria) === String(form.id_categoria_principal));
  const est = ESTADOS.find(e => e.val === form.estado);
  const avatarGrad = getAvatarGrad(form.estado);

  return (
    <Card accent={C.orange} icon={Star} title="Vista previa">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: fotoSrc ? "transparent" : avatarGrad,
          border: `2px solid ${est?.color || C.border}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {fotoSrc ? <img src={fotoSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22, fontWeight: 700, color: C.muted }}>{initials}</span>}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: SERIF, color: C.ink }}>{form.nombre_completo || "Nombre completo"}</div>
          {form.nombre_artistico && <div style={{ fontSize: 12, color: C.orange, fontFamily: SANS }}>"{form.nombre_artistico}"</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: C.inputBg, borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 9.5, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Disciplina</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{cat?.nombre || "—"}</div>
        </div>
        <div style={{ background: C.inputBg, borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 9.5, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Comisión</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.orange }}>{form.porcentaje_comision}%</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.muted }}>Estado</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: est?.color, background: `${est?.color}10`, padding: "4px 12px", borderRadius: 40 }}>{est?.label}</span>
      </div>
    </Card>
  );
}

// ========== FOTO CARD ==========
function FotoUploadArea({ fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop, cursorOn, cursorOff }: {
  fotoFile: File | null; fotoPreview: string; fileRef: React.RefObject<HTMLInputElement>; clearFoto: () => void; dragOver: boolean; setDragOver: (v: boolean) => void; onDrop: (e: React.DragEvent) => void; cursorOn: () => void; cursorOff: () => void;
}) {
  if (fotoFile) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px", borderRadius: 14, border: `1.5px solid ${C.orange}30`, background: `${C.orange}05`, position: "relative" }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: `1.5px solid ${C.orange}45` }}><img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><FileImage size={11} color={C.orange} /><span style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fotoFile.name}</span></div>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: SANS }}>{(fotoFile.size / 1024 / 1024).toFixed(1)} MB</span>
          <button type="button" onClick={() => fileRef.current?.click()} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ display: "block", marginTop: 4, fontSize: 11, color: C.orange, fontFamily: SANS, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Cambiar</button>
        </div>
        <button type="button" onClick={clearFoto} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: C.bgCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={10} color={C.muted} /></button>
      </div>
    );
  }
  return (
    <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={e => { if (e.key === "Enter") fileRef.current?.click(); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
      onMouseEnter={cursorOn}
      onMouseLeave={cursorOff}
      style={{ borderRadius: 14, border: `2px dashed ${dragOver ? C.orange : C.border}`, height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", background: dragOver ? `${C.orange}05` : C.inputBg, transition: "all .2s" }}>
      <UploadCloud size={24} color={dragOver ? C.orange : C.muted} strokeWidth={1.5} />
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 700, color: dragOver ? C.orange : C.muted, fontFamily: SANS }}>{dragOver ? "Suelta aquí" : "Arrastra o haz clic"}</div><div style={{ fontSize: 10.5, color: C.muted, fontFamily: SANS }}>JPG, PNG, WEBP · Máx 10 MB</div></div>
    </div>
  );
}

function FotoUrlInput({ form, onChange, focused, loading, fi, clearFoto, cursorOn, cursorOff }: { form: ArtistaForm; onChange: (e: ChangeEvent<HTMLInputElement>) => void; focused: string | null; loading: boolean; fi: (n: string) => { onFocus: () => void; onBlur: () => void }; clearFoto: () => void; cursorOn: () => void; cursorOff: () => void }) {
  return (<>
    <Label><LinkIcon size={10} /> URL de imagen</Label>
    <input type="url" name="foto_perfil" value={form.foto_perfil} onChange={e => { onChange(e); clearFoto(); }} placeholder="https://res.cloudinary.com/…" disabled={loading} style={inputStyle(focused === "foto", loading)} {...fi("foto")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontFamily: SANS }}>Cloudinary, Imgur u otro servicio público.</div>
  </>);
}

function FotoCard({ form, fotoMode, setFotoMode, fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop, onChange, focused, loading, fi, cursorOn, cursorOff }: {
  form: ArtistaForm; fotoMode: "upload" | "url"; setFotoMode: (m: "upload" | "url") => void; fotoFile: File | null; fotoPreview: string; fileRef: React.RefObject<HTMLInputElement>; clearFoto: () => void; dragOver: boolean; setDragOver: (v: boolean) => void; onDrop: (e: React.DragEvent) => void; onChange: (e: ChangeEvent<HTMLInputElement>) => void; focused: string | null; loading: boolean; fi: (n: string) => { onFocus: () => void; onBlur: () => void }; cursorOn: () => void; cursorOff: () => void;
}) {
  return (
    <Card accent={C.orange} icon={ImageIcon} title="Foto de perfil">
      <div style={{ display: "flex", marginBottom: 14, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, background: C.inputBg }}>
        {(["upload", "url"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setFotoMode(tab)} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{
            flex: 1,
            padding: "8px",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: fotoMode === tab ? 700 : 500,
            background: fotoMode === tab ? `${C.orange}10` : "transparent",
            color: fotoMode === tab ? C.orange : C.muted,
            borderRight: tab === "upload" ? `1px solid ${C.border}` : "none",
            transition: "all 0.2s",
          }}>{tab === "upload" ? <><UploadCloud size={11} style={{ marginRight: 4, verticalAlign: "middle" }} /> Subir</> : <><LinkIcon size={11} style={{ marginRight: 4, verticalAlign: "middle" }} /> URL</>}</button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} />
      {fotoMode === "upload" ? <FotoUploadArea fotoFile={fotoFile} fotoPreview={fotoPreview} fileRef={fileRef} clearFoto={clearFoto} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} cursorOn={cursorOn} cursorOff={cursorOff} /> : <FotoUrlInput form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} clearFoto={clearFoto} cursorOn={cursorOn} cursorOff={cursorOff} />}
    </Card>
  );
}

// ========== COMISION CARD ==========
function ComisionCard({ form, onChange, focused, loading, fi, cursorOn, cursorOff }: { form: ArtistaForm; onChange: (e: ChangeEvent<HTMLInputElement>) => void; focused: string | null; loading: boolean; fi: (n: string) => { onFocus: () => void; onBlur: () => void }; cursorOn: () => void; cursorOff: () => void }) {
  const comision = 10000 * Number(form.porcentaje_comision) / 100;
  return (
    <Card accent={C.orange} icon={DollarSign} title="Comisión">
      <Label><Percent size={10} /> Porcentaje sobre venta</Label>
      <div style={{ position: "relative" }}>
        <input type="number" name="porcentaje_comision" value={form.porcentaje_comision} onChange={onChange} min="0" max="100" step="1" disabled={loading} style={{ ...inputStyle(focused === "com", loading), paddingRight: 36 }} {...fi("com")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
        <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 900, color: C.orange, pointerEvents: "none", fontFamily: SERIF }}>%</span>
      </div>
      {Number(form.porcentaje_comision) > 0 && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: C.inputBg, border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: SANS }}>Por venta de $10,000</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.orange, fontFamily: SERIF }}>${new Intl.NumberFormat("es-MX").format(comision)} MXN</span>
        </div>
      )}
    </Card>
  );
}

// ========== ESTADO CARD ==========
function EstadoCard({ form, setForm, cursorOn, cursorOff }: { form: ArtistaForm; setForm: (fn: (p: ArtistaForm) => ArtistaForm) => void; cursorOn: () => void; cursorOff: () => void }) {
  return (
    <Card accent={C.orange} icon={Award} title="Estado de la cuenta">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {ESTADOS.map(({ val, label, color }) => {
          const on = form.estado === val;
          return (
            <button key={val} type="button" onClick={() => setForm(p => ({ ...p, estado: val }))} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{
              padding: "10px 6px",
              borderRadius: 40,
              border: `1.5px solid ${on ? color : C.border}`,
              background: on ? `${color}10` : "transparent",
              color: on ? color : C.muted,
              fontWeight: on ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: SANS,
              transition: "all .15s",
            }}>{label}</button>
          );
        })}
      </div>
    </Card>
  );
}

// ========== SUBMIT HELPER ==========
async function submitEditArtista(id: string, form: ArtistaForm, fotoFile: File | null): Promise<Response> {
  const headers = { Authorization: `Bearer ${authService.getToken()}` };
  const { matricula, ...formData } = form;
  if (fotoFile) {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("foto", fotoFile);
    return fetch(`${API_URL}/api/artistas/${id}`, { method: "PUT", headers, body: fd });
  }
  return fetch(`${API_URL}/api/artistas/${id}`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(formData) });
}

// ========== COMPONENTE PRINCIPAL ==========
export default function EditarArtista() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Cursor personalizado
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [focused, setFocused] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [fotoMode, setFotoMode] = useState<"upload" | "url">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<ArtistaForm>({
    nombre_completo: "", nombre_artistico: "", biografia: "",
    foto_perfil: "", correo: "", telefono: "", matricula: "",
    id_categoria_principal: "", porcentaje_comision: 15, estado: "pendiente",
  });

  // ========== CURSOR LOGIC (extraído de Contact.tsx) ==========
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) {
          ringRef.current.style.left = `${rx}px`;
          ringRef.current.style.top = `${ry}px`;
        }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  // ========== HANDLERS ==========
  const handleFoto = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("La foto no puede superar 10 MB", "warn"); return; }
    setFotoFile(file); setFotoPreview(URL.createObjectURL(file)); setForm(p => ({ ...p, foto_perfil: "" }));
  };

  useEffect(() => {
    (async () => {
      try {
        const [cR, res] = await Promise.all([
          obraService.getCategorias(),
          fetch(`${API_URL}/api/artistas/${id}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } }),
        ]);
        setCategorias(cR.categorias || []);
        if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
        const json = await res.json();
        if (json.success && json.data) {
          const a = json.data;
          setForm({
            nombre_completo: a.nombre_completo || "", nombre_artistico: a.nombre_artistico || "",
            biografia: a.biografia || "", foto_perfil: a.foto_perfil || "",
            correo: a.correo || "", telefono: a.telefono || "", matricula: a.matricula || "",
            id_categoria_principal: a.id_categoria_principal || "",
            porcentaje_comision: a.porcentaje_comision || 15, estado: a.estado || "pendiente",
          });
          if (a.foto_perfil) setFotoPreview(a.foto_perfil);
        } else { showToast("No se encontró el artista", "warn"); }
      } catch (err) { showToast(handleNetworkError(err), "err"); }
      finally { setLoadingData(false); }
    })();
  }, [id, showToast]);

  useEffect(() => {
    const input = fileRef.current; if (!input) return;
    const handler = () => { const f = input.files?.[0]; if (f) handleFoto(f); };
    input.addEventListener("change", handler);
    return () => input.removeEventListener("change", handler);
  });

  if (loadingData) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: SANS, background: C.bgPage, minHeight: "100vh" }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
      <span style={{ fontSize: 14, color: C.muted }}>Cargando artista…</span>
    </div>
  );

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newVal = type === "number" ? (value === "" ? "" : Number(value)) : value;
    const error = validateField(name, value);
    if (error) { setFieldErrors(p => ({ ...p, [name]: error })); }
    else { setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; }); }
    setForm(p => ({ ...p, [name]: newVal } as ArtistaForm));
  };

  const clearFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null); setFotoPreview(""); if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFoto(file); };

  const handleSubmitWithConfirm = (e: FormEvent) => {
    e.preventDefault();
    const error = validarCampos(form);
    if (error) { showToast(error, "err"); return; }
    setShowConfirm(true);
  };

  const onSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await submitEditArtista(id!, form, fotoFile);
      if (!res.ok) {
        showToast(await handleApiError(res), "err");
        return;
      }
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || "Error al actualizar", "err");
        return;
      }
      showToast("Artista actualizado correctamente", "ok");
      setTimeout(() => navigate("/admin/artistas"), 1500);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });
  const fotoSrc = fotoPreview || form.foto_perfil || "";
  const anio = new Date().getFullYear();

  return (
    <>
      {/* Estilos del cursor */}
      <style>{`
        .cur-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width .22s, height .22s, background .22s;
        }
        .cur-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .cur-dot.cur-over { width: 4px; height: 4px; background: #E8640C; }
        .cur-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirmar cambios"
        message="¿Estás seguro de guardar los cambios realizados en este artista?"
        onConfirm={onSubmit}
        onCancel={() => setShowConfirm(false)}
      />
      <EditarArtistaTopbar navigate={navigate} loading={loading} cursorOn={cursorOn} cursorOff={cursorOff} />
      <main style={{ flex: 1, padding: "22px 26px 28px", overflowY: "auto", background: C.bgPage }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Star size={9} color={C.orange} fill={C.orange} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: SANS }}>Administración · Edición</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, fontFamily: SERIF, color: C.ink }}>Editar <span style={{ color: C.orange }}>{form.nombre_completo || "Artista"}</span></h1>
        </div>

        <form id="form-editar-artista" onSubmit={handleSubmitWithConfirm}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            {/* Columna izquierda */}
            <div>
              <Card accent={C.orange} icon={Type} title="Información personal">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label req>Nombre completo</Label>
                      <input name="nombre_completo" value={form.nombre_completo} onChange={onChange} required disabled={loading} style={inputStyle(focused === "nc", loading, !!fieldErrors.nombre_completo)} {...fi("nc")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
                      <FieldError msg={fieldErrors.nombre_completo} />
                    </div>
                    <div>
                      <Label>Nombre artístico</Label>
                      <input name="nombre_artistico" value={form.nombre_artistico} onChange={onChange} disabled={loading} style={inputStyle(focused === "na", loading, !!fieldErrors.nombre_artistico)} {...fi("na")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
                      <FieldError msg={fieldErrors.nombre_artistico} />
                    </div>
                  </div>
                  <div>
                    <Label><FileText size={10} /> Biografía</Label>
                    <textarea name="biografia" value={form.biografia} onChange={onChange} rows={4} disabled={loading} style={{ ...inputStyle(focused === "bio", loading, !!fieldErrors.biografia), resize: "vertical" as const }} {...fi("bio")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <FieldError msg={fieldErrors.biografia} />
                      <span style={{ fontSize: 10.5, color: C.muted, fontFamily: SANS }}>{form.biografia.length} caracteres</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card accent={C.orange} icon={Mail} title="Contacto">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Label><Mail size={10} /> Correo electrónico</Label>
                    <input type="email" name="correo" value={form.correo} onChange={onChange} disabled={loading} style={inputStyle(focused === "correo", loading)} {...fi("correo")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
                  </div>
                  <div>
                    <Label><Phone size={10} /> Teléfono <span style={{ color: C.muted, fontWeight: 400, textTransform: "none" }}>(10 dígitos)</span></Label>
                    <input name="telefono" value={form.telefono} onChange={onChange} disabled={loading} placeholder="7711234567" maxLength={10} inputMode="numeric" style={inputStyle(focused === "tel", loading, !!fieldErrors.telefono)} {...fi("tel")} onMouseEnter={cursorOn} onMouseLeave={cursorOff} />
                    <FieldError msg={fieldErrors.telefono} />
                  </div>
                </div>
              </Card>

              <Card accent={C.orange} icon={Tag} title="Categoría y matrícula">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Label><Palette size={10} /> Disciplina principal</Label>
                    <select name="id_categoria_principal" value={form.id_categoria_principal} onChange={onChange} disabled={loading} style={inputStyle(focused === "cat", loading)} {...fi("cat")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label><Hash size={10} /> Matrícula</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: C.inputBg, border: `1.5px dashed ${C.border}`, minHeight: 44 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: SANS, letterSpacing: 1 }}>{form.matricula || `GAL-${anio}-XXXX`}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontFamily: SANS, marginTop: 1 }}>No editable</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <EstadoCard form={form} setForm={setForm} cursorOn={cursorOn} cursorOff={cursorOff} />
            </div>

            {/* Columna derecha */}
            <div>
              <PreviewCard form={form} fotoSrc={fotoSrc} categorias={categorias} cursorOn={cursorOn} cursorOff={cursorOff} />
              <FotoCard
                form={form}
                fotoMode={fotoMode}
                setFotoMode={setFotoMode}
                fotoFile={fotoFile}
                fotoPreview={fotoPreview}
                fileRef={fileRef}
                clearFoto={clearFoto}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onDrop={onDrop}
                onChange={onChange}
                focused={focused}
                loading={loading}
                fi={fi}
                cursorOn={cursorOn}
                cursorOff={cursorOff}
              />
              <ComisionCard form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} cursorOn={cursorOn} cursorOff={cursorOff} />
            </div>
          </div>
        </form>
      </main>
    </>
  );
}