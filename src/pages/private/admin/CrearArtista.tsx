import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  Loader2, Tag,
  DollarSign, Award, Type,
  FileText, Phone, Mail, Hash,
  Star, Palette, Percent,
  UploadCloud, X, FileImage, ChevronRight, Sparkles, Shield, AlertCircle,
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
  errorDark: "#A8233A",
  success: "#1A7A45",
  successLight: "rgba(26,122,69,0.1)",
  shadow: "rgba(0,0,0,0.04)",
  purple: "#8B5CF6",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ========== VALIDACIONES ==========
const xssPattern = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const soloLetrasEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const soloNumeros = /^\d+$/;

const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);

// Validación completa del formulario
const validarCamposCompletos = async (
  form: ArtistaForm,
  fotoFile: File | null,
  checkEmailDuplicate: boolean = true
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Validación de foto (obligatoria)
  if (!fotoFile) {
    errors.push("La foto de perfil es obligatoria");
  } else {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(fotoFile.type)) {
      errors.push("Solo se permiten imágenes JPG, PNG o WEBP");
    }
    if (fotoFile.size > 10 * 1024 * 1024) {
      errors.push("La foto no puede superar los 10 MB");
    }
  }

  // Validación de categoría (obligatoria)
  if (!form.id_categoria_principal || form.id_categoria_principal === "") {
    errors.push("La categoría o disciplina principal es obligatoria");
  }

  // Nombre completo
  if (!form.nombre_completo.trim()) {
    errors.push("El nombre completo es obligatorio");
  } else if (hasSuspiciousContent(form.nombre_completo)) {
    errors.push("El nombre contiene contenido no permitido");
  } else if (!soloLetrasEspacios.test(form.nombre_completo.trim())) {
    errors.push("El nombre solo debe contener letras y espacios");
  } else if (form.nombre_completo.trim().length < 3) {
    errors.push("El nombre debe tener mínimo 3 caracteres");
  } else if (form.nombre_completo.trim().length > 100) {
    errors.push("El nombre no puede exceder los 100 caracteres");
  }

  // Nombre artístico (opcional)
  if (form.nombre_artistico && form.nombre_artistico.trim()) {
    if (hasSuspiciousContent(form.nombre_artistico)) {
      errors.push("El nombre artístico contiene contenido no permitido");
    } else if (form.nombre_artistico.trim().length < 2) {
      errors.push("El nombre artístico debe tener mínimo 2 caracteres");
    } else if (form.nombre_artistico.trim().length > 50) {
      errors.push("El nombre artístico no puede exceder los 50 caracteres");
    }
  }

  // Biografía (opcional)
  if (form.biografia && form.biografia.trim()) {
    if (hasSuspiciousContent(form.biografia)) {
      errors.push("La biografía contiene contenido no permitido");
    } else if (form.biografia.trim().length < 10) {
      errors.push("La biografía debe tener mínimo 10 caracteres");
    } else if (form.biografia.trim().length > 2000) {
      errors.push("La biografía no puede exceder los 2000 caracteres");
    }
  }

  // Correo electrónico (opcional)
  if (form.correo && form.correo.trim()) {
    if (!emailPattern.test(form.correo.trim())) {
      errors.push("El correo electrónico no tiene un formato válido");
    } else if (form.correo.trim().length > 100) {
      errors.push("El correo no puede exceder los 100 caracteres");
    } else if (checkEmailDuplicate) {
      try {
        const existe = await verificarEmailExistente(form.correo.trim());
        if (existe) {
          errors.push("Este correo electrónico ya está registrado");
        }
      } catch (error) {
        console.error("Error verificando email:", error);
      }
    }
  }

  // Teléfono (opcional)
  if (form.telefono && form.telefono.trim()) {
    const digits = form.telefono.replace(/[\s\-()]/g, "");
    if (!soloNumeros.test(digits)) {
      errors.push("El teléfono solo debe contener números");
    } else if (digits.length !== 10) {
      errors.push("El teléfono debe tener exactamente 10 dígitos");
    }
  }

  // Comisión
  if (isNaN(form.porcentaje_comision) || form.porcentaje_comision < 0 || form.porcentaje_comision > 100) {
    errors.push("El porcentaje de comisión debe estar entre 0 y 100");
  }

  return { isValid: errors.length === 0, errors };
};

// Validación en tiempo real por campo
function validateNombreCompleto(value: string): string | null {
  if (!value.trim()) return "El nombre es obligatorio";
  if (hasSuspiciousContent(value)) return "Contenido no permitido";
  if (!soloLetrasEspacios.test(value)) return "Solo letras y espacios";
  if (value.trim().length < 3) return "Mínimo 3 caracteres";
  if (value.trim().length > 100) return "Máximo 100 caracteres";
  return null;
}

function validateNombreArtistico(value: string): string | null {
  if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  if (value && value.trim().length < 2) return "Mínimo 2 caracteres";
  if (value && value.trim().length > 50) return "Máximo 50 caracteres";
  return null;
}

function validateBiografia(value: string): string | null {
  if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  if (value && value.trim().length < 10) return "Mínimo 10 caracteres";
  if (value && value.trim().length > 2000) return "Máximo 2000 caracteres";
  return null;
}

function validateTelefono(value: string): string | null {
  const digits = value.replace(/[\s\-()]/g, "");
  if (value && !soloNumeros.test(digits)) return "Solo números";
  if (value && digits.length > 10) return "Máximo 10 dígitos";
  if (value && digits.length < 10) return "Debe tener 10 dígitos";
  return null;
}

function validateEmail(value: string): string | null {
  if (value && !emailPattern.test(value)) return "Formato de correo inválido";
  if (value && value.length > 100) return "Máximo 100 caracteres";
  return null;
}

async function verificarEmailExistente(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/artistas/check-email?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    return false;
  }
}

const FIELD_VALIDATORS: Record<string, (v: string) => string | null> = {
  nombre_completo: validateNombreCompleto,
  nombre_artistico: validateNombreArtistico,
  biografia: validateBiografia,
  telefono: validateTelefono,
  correo: validateEmail,
};

function validateField(name: string, value: string): string | null {
  const validator = FIELD_VALIDATORS[name];
  return validator ? validator(value) : null;
}

// ========== TIPOS ==========
interface Categoria { id_categoria: number; nombre: string; }
interface ArtistaForm {
  nombre_completo: string; nombre_artistico: string; biografia: string;
  foto_perfil: string; correo: string; telefono: string;
  id_categoria_principal: string; porcentaje_comision: number; estado: string;
}

const ESTADOS = [
  { val: "activo", label: "Activo", color: C.success },
  { val: "pendiente", label: "Pendiente", color: C.orange },
  { val: "inactivo", label: "Inactivo", color: C.muted },
  { val: "suspendido", label: "Suspendido", color: C.error },
];

// ========== MODAL DE ERRORES ==========
function ErrorModal({ errors, onClose }: { errors: string[]; onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }} onClick={handleClose}>
      <div style={{
        background: C.bgCard,
        borderRadius: 20,
        padding: "24px",
        maxWidth: 450,
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        animation: "scaleIn 0.25s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: `${C.error}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <AlertCircle size={22} color={C.error} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: C.ink, margin: 0 }}>Errores en el formulario</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.error }}>
          {errors.map((error, idx) => (
            <li key={idx} style={{ marginBottom: 8, fontSize: 13, fontFamily: SANS }}>{error}</li>
          ))}
        </ul>
        <button onClick={handleClose} style={{
          marginTop: 20,
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          border: "none",
          background: C.orange,
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: SANS,
          transition: "background 0.2s",
        }} onMouseEnter={e => (e.currentTarget.style.background = C.orangeDark)} onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
          Entendido
        </button>
      </div>
    </div>
  );
}

// ========== COMPONENTES UI ==========
function inputStyle(focused: boolean, disabled: boolean, error?: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "12px 16px", boxSizing: "border-box",
    background: error ? `${C.error}05` : focused ? C.inputBg : C.inputBg,
    border: `1.5px solid ${error ? C.error : focused ? C.orange : C.border}`,
    borderRadius: 12, fontSize: 14, color: C.ink, outline: "none",
    transition: "all 0.2s ease",
    fontFamily: SANS, opacity: disabled ? 0.6 : 1,
  };
}

function Label({ children, req, optional }: { children: React.ReactNode; req?: boolean; optional?: boolean }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: SANS }}>
      {children}
      {req && <span style={{ color: C.orange, fontSize: 14 }}>*</span>}
      {optional && <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>(opcional)</span>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 12, color: C.error, fontWeight: 500, marginTop: 6, fontFamily: SANS }}>{msg}</div>;
}

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: `0 1px 3px ${C.shadow}`,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.bgPage,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: `${C.orange}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={16} color={C.orange} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, fontFamily: SERIF }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ========== TOPBAR ==========
function CrearArtistaTopbar({ navigate, loading }: { navigate: (p: string) => void; loading: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      height: 64,
      background: C.bgCard,
      borderBottom: `1px solid ${C.border}`,
      position: "sticky",
      top: 0,
      zIndex: 30,
      fontFamily: SANS,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate("/admin/artistas")}
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
            fontFamily: SANS,
            padding: "6px 12px",
            borderRadius: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.inputBg; (e.currentTarget as HTMLElement).style.color = C.orange; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.muted; }}>
          <ArrowLeft size={14} /> Volver
        </button>
        <span style={{ color: C.border }}>|</span>
        <span style={{ fontSize: 12, color: C.muted }}>Artistas</span>
        <ChevronRight size={12} color={C.muted} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>Nuevo Artista</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => navigate("/admin/artistas")} disabled={loading}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: `1.5px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: SANS,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.orange; (e.currentTarget as HTMLElement).style.color = C.orange; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}>
          Cancelar
        </button>
        <button form="form-crear-artista" type="submit" disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 24px",
            borderRadius: 10,
            border: "none",
            background: loading ? `${C.orange}60` : C.orange,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: SANS,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = C.orangeDark; }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = C.orange; }}>
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creando...</> : <><Sparkles size={14} /> Crear Artista</>}
        </button>
      </div>
    </div>
  );
}

// ========== PREVIEW CARD ==========
function PreviewCard({ form, fotoSrc, categorias }: { form: ArtistaForm; fotoSrc: string; categorias: Categoria[] }) {
  const initials = form.nombre_completo.split(" ").slice(0, 2).map((n: string) => n[0] || "").join("").toUpperCase() || "?";
  const cat = categorias.find(c => String(c.id_categoria) === String(form.id_categoria_principal));
  const est = ESTADOS.find(e => e.val === form.estado);

  return (
    <Card icon={Star} title="Vista previa">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 70,
          height: 70,
          borderRadius: 20,
          background: fotoSrc ? "transparent" : `linear-gradient(135deg, ${C.orange}20, ${C.purple}20)`,
          border: `2px solid ${est?.color || C.border}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {fotoSrc ? <img src={fotoSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : 
            <span style={{ fontSize: 24, fontWeight: 700, color: C.muted }}>{initials}</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: C.ink, marginBottom: 4 }}>{form.nombre_completo || "Nombre completo"}</div>
          {form.nombre_artistico && <div style={{ fontSize: 13, color: C.orange, fontFamily: SANS }}>{form.nombre_artistico}</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: C.inputBg, borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Disciplina</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{cat?.nombre || "—"}</div>
        </div>
        <div style={{ background: C.inputBg, borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Comisión</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>{form.porcentaje_comision}%</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.muted }}>Estado inicial</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: est?.color, background: `${est?.color}10`, padding: "4px 14px", borderRadius: 20 }}>{est?.label}</span>
      </div>
    </Card>
  );
}

// ========== FOTO UPLOAD ==========
function FotoUploadArea({ fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop }: {
  fotoFile: File | null; fotoPreview: string; fileRef: React.RefObject<HTMLInputElement>;
  clearFoto: () => void; dragOver: boolean; setDragOver: (v: boolean) => void; onDrop: (e: React.DragEvent) => void;
}) {
  if (fotoFile) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px", borderRadius: 12, border: `1.5px solid ${C.orange}30`, background: `${C.orange}05` }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: `1.5px solid ${C.orange}` }}>
          <img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{fotoFile.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{(fotoFile.size / 1024 / 1024).toFixed(1)} MB</div>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ fontSize: 12, color: C.orange, background: "none", border: "none", cursor: "pointer", marginTop: 6, fontWeight: 500 }}>Cambiar</button>
        </div>
        <button type="button" onClick={clearFoto} style={{ width: 28, height: 28, borderRadius: "50%", background: C.inputBg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={14} color={C.muted} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{
        borderRadius: 12,
        border: `2px dashed ${dragOver ? C.orange : C.border}`,
        height: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        background: dragOver ? `${C.orange}05` : C.inputBg,
        transition: "all 0.2s",
      }}>
      <UploadCloud size={28} color={dragOver ? C.orange : C.muted} strokeWidth={1.5} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: dragOver ? C.orange : C.muted }}>{dragOver ? "Suelta aquí" : "Arrastra o haz clic"}</div>
        <div style={{ fontSize: 11, color: C.muted }}>JPG, PNG, WEBP · Max 10 MB</div>
      </div>
    </div>
  );
}

function FotoCard({ form, fotoFile, fotoPreview, fileRef, clearFoto, dragOver, setDragOver, onDrop }: {
  form: ArtistaForm; fotoFile: File | null; fotoPreview: string; fileRef: React.RefObject<HTMLInputElement>;
  clearFoto: () => void; dragOver: boolean; setDragOver: (v: boolean) => void; onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <Card icon={ImageIcon} title="Foto de perfil">
      <Label req>Imagen del artista</Label>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" style={{ display: "none" }} />
      <FotoUploadArea 
        fotoFile={fotoFile} 
        fotoPreview={fotoPreview} 
        fileRef={fileRef} 
        clearFoto={clearFoto} 
        dragOver={dragOver} 
        setDragOver={setDragOver} 
        onDrop={onDrop} 
      />
    </Card>
  );
}

// ========== COMISION CARD ==========
function ComisionCard({ form, onChange, focused, loading, fi }: {
  form: ArtistaForm; onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  focused: string | null; loading: boolean; fi: (n: string) => { onFocus: () => void; onBlur: () => void };
}) {
  const comision = 10000 * Number(form.porcentaje_comision) / 100;
  const comisionError = isNaN(form.porcentaje_comision) || form.porcentaje_comision < 0 || form.porcentaje_comision > 100;
  
  return (
    <Card icon={DollarSign} title="Comisión">
      <Label req><Percent size={14} /> Porcentaje sobre venta</Label>
      <div style={{ position: "relative" }}>
        <input type="number" name="porcentaje_comision" value={form.porcentaje_comision} onChange={onChange} min="0" max="100" step="1" disabled={loading} style={{ ...inputStyle(focused === "com", loading, comisionError), paddingRight: 40 }} {...fi("com")} />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 700, color: C.orange, pointerEvents: "none" }}>%</span>
      </div>
      {comisionError && <FieldError msg="La comisión debe estar entre 0% y 100%" />}
      {!comisionError && Number(form.porcentaje_comision) > 0 && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: C.inputBg, border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 13, color: C.muted }}>Comisión por venta de $10,000</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.orange }}>${new Intl.NumberFormat("es-MX").format(comision)} MXN</span>
        </div>
      )}
    </Card>
  );
}

// ========== ESTADO CARD ==========
function EstadoCard({ form, setForm }: { form: ArtistaForm; setForm: (fn: (p: ArtistaForm) => ArtistaForm) => void }) {
  return (
    <Card icon={Shield} title="Estado de la cuenta">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {ESTADOS.map(({ val, label, color }) => {
          const on = form.estado === val;
          return (
            <button key={val} type="button" onClick={() => setForm(p => ({ ...p, estado: val }))}
              style={{
                padding: "10px",
                borderRadius: 10,
                border: `1.5px solid ${on ? color : C.border}`,
                background: on ? `${color}10` : "transparent",
                color: on ? color : C.muted,
                fontWeight: on ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: SANS,
                transition: "all 0.2s",
              }}>
              {label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ========== SUBMIT HELPER ==========
async function submitArtista(form: ArtistaForm, fotoFile: File | null): Promise<Response> {
  const headers = { Authorization: `Bearer ${authService.getToken()}` };
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
  if (fotoFile) {
    fd.append("foto", fotoFile);
  }
  return fetch(`${API_URL}/api/artistas`, { method: "POST", headers, body: fd });
}

// ========== COMPONENTE PRINCIPAL ==========
export default function CrearArtista() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [form, setForm] = useState<ArtistaForm>({
    nombre_completo: "", nombre_artistico: "", biografia: "",
    foto_perfil: "", correo: "", telefono: "",
    id_categoria_principal: "", porcentaje_comision: 15, estado: "pendiente",
  });

  useEffect(() => {
    obraService.getCategorias()
      .then(r => setCategorias(r.categorias || []))
      .catch(() => {});
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newVal = type === "number" ? (value === "" ? "" : Number(value)) : value;
    const error = validateField(name, value);
    if (error) {
      setFieldErrors(p => ({ ...p, [name]: error }));
    } else {
      setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
    }
    setForm(p => ({ ...p, [name]: newVal } as ArtistaForm));
  };

  const handleFoto = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Solo se permiten imágenes JPG, PNG o WEBP", "warn");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("La foto no puede superar los 10 MB", "warn");
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const clearFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null);
    setFotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFoto(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const { isValid, errors } = await validarCamposCompletos(form, fotoFile, true);
    
    if (!isValid) {
      setValidationErrors(errors);
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await submitArtista(form, fotoFile);
      if (!res.ok) {
        const errorMsg = await handleApiError(res);
        showToast(errorMsg, "err");
        return;
      }
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || "Error al crear", "err");
        return;
      }
      showToast("Artista creado exitosamente", "ok");
      setTimeout(() => navigate("/admin/artistas"), 1500);
    } catch (err) {
      showToast(handleNetworkError(err), "err");
    } finally {
      setLoading(false);
    }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });
  const fotoSrc = fotoPreview || "";

  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const handler = () => {
      const f = input.files?.[0];
      if (f) handleFoto(f);
    };
    input.addEventListener("change", handler);
    return () => input.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {showErrorModal && (
        <ErrorModal errors={validationErrors} onClose={() => setShowErrorModal(false)} />
      )}

      <CrearArtistaTopbar navigate={navigate} loading={loading} />

      <main style={{ flex: 1, padding: "24px 28px 32px", overflowY: "auto", background: C.bgPage }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 4, height: 20, background: C.orange, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: SANS }}>Formulario de registro</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, fontFamily: SERIF, color: C.ink }}>
            Nuevo Artista
          </h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontFamily: SANS }}>Completa los datos para agregar un nuevo artista a la galería</p>
        </div>

        <form id="form-crear-artista" onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            {/* Columna izquierda */}
            <div>
              <Card icon={Type} title="Informacion personal">
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <Label req>Nombre completo</Label>
                      <input 
                        name="nombre_completo" 
                        value={form.nombre_completo} 
                        onChange={onChange} 
                        required 
                        disabled={loading} 
                        placeholder="Ej: Maria Lopez Martinez" 
                        style={inputStyle(focused === "nc", loading, !!fieldErrors.nombre_completo)} 
                        {...fi("nc")} 
                      />
                      <FieldError msg={fieldErrors.nombre_completo} />
                    </div>
                    <div>
                      <Label optional>Nombre artistico</Label>
                      <input 
                        name="nombre_artistico" 
                        value={form.nombre_artistico} 
                        onChange={onChange} 
                        disabled={loading} 
                        placeholder="Alias o seudonimo" 
                        style={inputStyle(focused === "na", loading, !!fieldErrors.nombre_artistico)} 
                        {...fi("na")} 
                      />
                      <FieldError msg={fieldErrors.nombre_artistico} />
                    </div>
                  </div>
                  <div>
                    <Label optional><FileText size={14} /> Biografia</Label>
                    <textarea 
                      name="biografia" 
                      value={form.biografia} 
                      onChange={onChange} 
                      rows={4} 
                      disabled={loading} 
                      placeholder="Cuentanos sobre el artista... (minimo 10 caracteres)" 
                      style={{ ...inputStyle(focused === "bio", loading, !!fieldErrors.biografia), resize: "vertical" as const }} 
                      {...fi("bio")} 
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <FieldError msg={fieldErrors.biografia} />
                      <span style={{ fontSize: 11, color: C.muted }}>{form.biografia.length} / 2000 caracteres</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card icon={Mail} title="Contacto">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <Label optional><Mail size={14} /> Correo electronico</Label>
                    <input 
                      type="email" 
                      name="correo" 
                      value={form.correo} 
                      onChange={onChange} 
                      disabled={loading} 
                      placeholder="artista@correo.com" 
                      style={inputStyle(focused === "correo", loading, !!fieldErrors.correo)} 
                      {...fi("correo")} 
                    />
                    <FieldError msg={fieldErrors.correo} />
                  </div>
                  <div>
                    <Label optional><Phone size={14} /> Telefono <span style={{ color: C.muted, fontWeight: 400 }}>(10 digitos)</span></Label>
                    <input 
                      name="telefono" 
                      value={form.telefono} 
                      onChange={onChange} 
                      disabled={loading} 
                      placeholder="7711234567" 
                      maxLength={10} 
                      inputMode="numeric" 
                      style={inputStyle(focused === "tel", loading, !!fieldErrors.telefono)} 
                      {...fi("tel")} 
                    />
                    <FieldError msg={fieldErrors.telefono} />
                  </div>
                </div>
              </Card>

              <Card icon={Tag} title="Categoria">
                <div>
                  <Label req><Palette size={14} /> Disciplina principal</Label>
                  <select 
                    name="id_categoria_principal" 
                    value={form.id_categoria_principal} 
                    onChange={onChange} 
                    disabled={loading} 
                    style={inputStyle(focused === "cat", loading)} 
                    {...fi("cat")}
                  >
                    <option value="">Seleccionar categoria</option>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>
              </Card>

              <EstadoCard form={form} setForm={setForm} />
            </div>

            {/* Columna derecha */}
            <div>
              <PreviewCard form={form} fotoSrc={fotoSrc} categorias={categorias} />
              <FotoCard
                form={form}
                fotoFile={fotoFile}
                fotoPreview={fotoPreview}
                fileRef={fileRef as React.RefObject<HTMLInputElement>}
                clearFoto={clearFoto}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onDrop={onDrop}
              />
              <ComisionCard form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} />
            </div>
          </div>
        </form>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}