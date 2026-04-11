// src/pages/private/admin/EditarObra.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  Layers, Star, UploadCloud, X, FileImage,
  CheckCircle, XCircle, Clock, Package, ShieldCheck, MessageSquare,
  ChevronRight, Home, Edit2, AlertTriangle,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

// ========== PALETA CLARA ==========
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
  purple: "#6028AA",
  blue: "#2D6FBE",
  gold: "#A87006",
  pink: "#A83B90",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const FM = "'JetBrains Mono', 'Fira Code', monospace";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

// ========== ESTADOS DE LA OBRA ==========
const ESTADOS: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  pendiente: { label: "Pendiente", color: C.gold, icon: Clock, desc: "En revisión" },
  publicada: { label: "Publicada", color: C.success, icon: CheckCircle, desc: "Visible en catálogo" },
  rechazada: { label: "Rechazada", color: C.error, icon: XCircle, desc: "Requiere correcciones" },
  agotada: { label: "Agotada", color: C.muted, icon: Package, desc: "Sin disponibilidad" },
};

// ========== VALIDACIONES ==========
const xssPattern = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);

const validarObra = (form: { titulo: string; descripcion: string; historia?: string }): string | null => {
  if (!form.titulo.trim()) return "El título es obligatorio";
  if (hasSuspiciousContent(form.titulo)) return "El título contiene contenido no permitido";
  if (form.titulo.trim().length < 3) return "El título debe tener mínimo 3 caracteres";
  if (!form.descripcion.trim()) return "La descripción es obligatoria";
  if (hasSuspiciousContent(form.descripcion)) return "La descripción contiene contenido no permitido";
  if (form.descripcion.trim().length < 10) return "La descripción debe tener mínimo 10 caracteres";
  if (form.historia && hasSuspiciousContent(form.historia)) return "La historia contiene contenido no permitido";
  return null;
};

function validateFieldInline(name: string, value: string): string | null {
  if (name === "titulo") {
    if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
    if (value && value.trim().length < 3) return "Mínimo 3 caracteres";
  }
  if (name === "descripcion") {
    if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
    if (value && value.trim().length < 10) return "Mínimo 10 caracteres";
  }
  if (name === "historia") {
    if (value && hasSuspiciousContent(value)) return "Contenido no permitido";
  }
  return null;
}

// ========== TIPOS ==========
interface Categoria { id_categoria: number; nombre: string; }
interface Tecnica { id_tecnica: number; nombre: string; }
interface Artista { id_artista: number; nombre_completo: string; nombre_artistico?: string; }

type FormState = {
  titulo: string; descripcion: string; historia: string;
  id_categoria: number; id_tecnica: number; id_artista: number;
  precio_base: number; anio_creacion: number; dimensiones_alto: string; dimensiones_ancho: string;
  dimensiones_profundidad: string; permite_marco: boolean; con_certificado: boolean; imagen_principal: string;
  estado: string;
};

// ========== MODAL DE CONFIRMACIÓN (reutilizable) ==========
const ConfirmModal = ({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, accent = C.error }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }} onClick={onCancel}>
      <div style={{ background: C.bgCard, borderRadius: 24, padding: "24px 28px", maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, animation: "scaleIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `1px solid ${accent}30` }}>
          {accent === C.error ? <AlertTriangle size={24} color={accent} strokeWidth={1.8} /> : <CheckCircle2 size={24} color={accent} strokeWidth={1.8} />}
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: 0, color: C.ink }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.muted, margin: "12px 0 24px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 40, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: SANS }}>
            {cancelText || "Cancelar"}
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 20px", borderRadius: 40, border: "none", background: accent, color: "white", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: SANS }}>
            {confirmText || "Confirmar"}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// ========== COMPONENTES UI REUTILIZABLES ==========
const Card = ({ accent, icon: Icon, title, children }: { accent: string; icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="admin-card" style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}`, transition: "all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)" }}>
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(to right, ${C.bgCard}, ${C.inputBg})` }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}>
        <Icon size={14} color={accent} strokeWidth={1.8} />
      </div>
      <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: SANS }}>
    {children}
    {required && <span style={{ color: C.orange }}>*</span>}
  </div>
);

const FieldError = ({ msg }: { msg?: string }) => {
  if (!msg) return null;
  return <div style={{ fontSize: 11.5, color: C.error, fontWeight: 600, marginTop: 5, fontFamily: SANS }}>⚠ {msg}</div>;
};

const InputStyle = (focused: boolean, disabled: boolean, error?: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 14px",
  boxSizing: "border-box",
  background: error ? `${C.error}05` : focused ? C.inputBg : C.inputBg,
  border: `1.5px solid ${error ? C.error : focused ? C.orange : C.border}`,
  borderRadius: 12,
  fontSize: 13.5,
  color: C.ink,
  outline: "none",
  transition: "border-color 0.2s, background 0.2s",
  fontFamily: SANS,
  opacity: disabled ? 0.5 : 1,
});

const Toggle = ({ label, name, checked, onChange, disabled, icon: Icon, accent }: any) => (
  <label className="admin-toggle" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", border: `1.5px solid ${checked ? `${accent}50` : C.border}`, background: checked ? `${accent}10` : "transparent", transition: "all 0.2s", userSelect: "none" }}>
    <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? accent : C.muted}`, background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
      {checked && <CheckCircle2 size={10} color="white" strokeWidth={3} />}
    </div>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display: "none" }} />
    <Icon size={14} color={checked ? accent : C.muted} strokeWidth={2} />
    <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? C.ink : C.muted, fontFamily: SANS }}>{label}</span>
  </label>
);

// ========== TOPBAR CON BREADCRUMB ==========
function Topbar({ navigate, loading, estadoInfo, id, cursorOn, cursorOff, onCancel, onSaveClick }: any) {
  const EIcon = estadoInfo.icon;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60, background: C.bgCard, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 30, fontFamily: SANS, boxShadow: `0 1px 3px ${C.shadow}`, animation: "fadeDown 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate("/admin/dashboard")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500, transition: "color 0.2s" }}>
          <Home size={14} /> Inicio
        </button>
        <ChevronRight size={12} color={C.muted} />
        <button onClick={() => navigate("/admin/obras")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500, transition: "color 0.2s" }}>
          <ImageIcon size={14} /> Obras
        </button>
        <ChevronRight size={12} color={C.muted} />
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.orange, fontSize: 12, fontWeight: 700 }}>
          <Edit2 size={14} /> Editar obra
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 40, background: `${estadoInfo.color}10`, border: `1px solid ${estadoInfo.color}20`, color: estadoInfo.color, fontSize: 11, fontWeight: 600 }}>
          <EIcon size={10} /> {estadoInfo.label}
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>ID <span style={{ color: C.orange, fontWeight: 600 }}>#{id}</span></span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onCancel} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ padding: "7px 20px", borderRadius: 40, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS, transition: "all 0.2s" }}>
          Cancelar
        </button>
        <button onClick={onSaveClick} disabled={loading} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 24px", borderRadius: 40, border: "none", background: loading ? `${C.orange}60` : C.orange, color: "white", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: SANS, boxShadow: loading ? "none" : `0 2px 6px ${C.orange}40`, transition: "all 0.2s" }}>
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</> : <><Save size={14} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

// ========== PREVIEW CARD ==========
function ObraPreviewCard({ form, previewSrc, currentArt, currentCat }: any) {
  return (
    <div className="preview-card" style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden", boxShadow: `0 2px 8px ${C.shadow}`, transition: "all 0.3s" }}>
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12, background: C.inputBg, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {previewSrc ? (
          <img src={previewSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
        ) : (
          <ImageIcon size={32} color={C.muted} strokeWidth={1} />
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: SERIF, color: C.ink, marginBottom: 4 }}>{form.titulo || "Título de la obra"}</div>
        {currentArt && (
          <div style={{ fontSize: 12, color: C.gold, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={10} color={C.gold} fill={C.gold} /> {currentArt.nombre_artistico || currentArt.nombre_completo}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <div style={{ background: C.inputBg, borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Precio</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.orange }}>{form.precio_base ? `$${fmt(form.precio_base)}` : "—"}</div>
          </div>
          <div style={{ background: C.inputBg, borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Categoría</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{currentCat?.nombre || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== PRECIO CARD ==========
function PrecioCard({ form, onChange, focused, loading, fi }: any) {
  return (
    <Card accent={C.gold} icon={DollarSign} title="Precio">
      <Label required>Precio base (MXN)</Label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: SERIF }}>$</span>
        <input
          type="number"
          name="precio_base"
          value={form.precio_base || ""}
          onChange={onChange}
          placeholder="2500"
          step="1"
          min="0"
          required
          disabled={loading}
          style={{ ...InputStyle(focused === "precio", loading), paddingLeft: 28 }}
          {...fi("precio")}
        />
      </div>
      {form.precio_base > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: C.inputBg, borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: C.muted }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.gold, fontFamily: SERIF }}>${fmt(form.precio_base)} MXN</span>
        </div>
      )}
    </Card>
  );
}

// ========== IMAGEN CARD ==========
function ImagenCard({ form, imgMode, setImgMode, imgFile, imgPreview, fileRef, clearFile, dragOver, setDragOver, onDrop, onChange, focused, loading, fi }: any) {
  return (
    <Card accent={C.pink} icon={ImageIcon} title="Imagen principal">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {(["upload", "url"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setImgMode(tab)}
            style={{ padding: "6px 0", background: "none", border: "none", fontSize: 12, fontWeight: imgMode === tab ? 700 : 500, color: imgMode === tab ? C.orange : C.muted, cursor: "pointer", borderBottom: imgMode === tab ? `2px solid ${C.orange}` : "2px solid transparent", transition: "all 0.2s" }}>
            {tab === "upload" ? "Subir archivo" : "URL externa"}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} />
      {imgMode === "upload" ? (
        <div>
          {imgFile ? (
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
              <img src={imgPreview} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 10px", background: `linear-gradient(transparent, rgba(0,0,0,0.7))`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "white" }}>{imgFile.name}</span>
                <button type="button" onClick={clearFile} style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}><X size={14} /></button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{ border: `2px dashed ${dragOver ? C.orange : C.border}`, borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: dragOver ? `${C.orange}05` : C.inputBg, transition: "all 0.2s" }}>
              <UploadCloud size={28} color={C.muted} strokeWidth={1.5} />
              <div style={{ fontSize: 12, marginTop: 8 }}>Arrastra o haz clic</div>
              <div style={{ fontSize: 11, color: C.muted }}>JPG, PNG, WEBP · Max 10 MB</div>
            </div>
          )}
          {form.imagen_principal && !imgFile && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: C.inputBg, borderRadius: 10, fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
              <ImageIcon size={14} /> Imagen actual: <span style={{ color: C.ink }}>{form.imagen_principal.split("/").pop()}</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <Label>URL de la imagen</Label>
          <input
            type="url"
            name="imagen_principal"
            value={form.imagen_principal || ""}
            onChange={onChange}
            placeholder="https://res.cloudinary.com/..."
            disabled={loading}
            style={InputStyle(focused === "img", loading)}
            {...fi("img")}
          />
          {form.imagen_principal && (
            <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, height: 100 }}>
              <img src={form.imagen_principal} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ========== PANEL DE REVISIÓN (estado) ==========
function RevisionPanel({ estadoActual, estadoSelected, setEstadoSelected, showMotivo, setShowMotivo, motivoRechazo, setMotivoRechazo, onCambiarEstado, loadingEstado, focused, fi }: any) {
  const estadoInfo = ESTADOS[estadoActual] || ESTADOS.pendiente;
  const EIcon = estadoInfo.icon;
  const isRechazo = estadoSelected === "rechazada";
  const isSame = estadoSelected === estadoActual;

  return (
    <Card accent={C.success} icon={ShieldCheck} title="Panel de revisión">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: C.inputBg, borderRadius: 10 }}>
        <EIcon size={14} color={estadoInfo.color} />
        <span style={{ fontSize: 12, color: C.muted }}>Estado actual: <strong style={{ color: estadoInfo.color }}>{estadoInfo.label}</strong></span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {Object.entries(ESTADOS).map(([key, { label, color, icon: Icon, desc }]) => {
          const on = estadoSelected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setEstadoSelected(key); setShowMotivo(key === "rechazada"); }}
              className="estado-btn"
              style={{ padding: "8px 4px", borderRadius: 40, border: `1.5px solid ${on ? color : C.border}`, background: on ? `${color}10` : "transparent", color: on ? color : C.muted, fontWeight: on ? 700 : 500, fontSize: 11, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Icon size={14} color={on ? color : C.muted} />
              <span>{label}</span>
              <span style={{ fontSize: 9, color: on ? color : C.muted }}>{desc}</span>
            </button>
          );
        })}
      </div>
      {isRechazo && showMotivo && (
        <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
          <Label>Motivo del rechazo</Label>
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Explica al artista qué debe corregir…"
            rows={3}
            style={{ ...InputStyle(focused === "motivo", false), width: "100%" }}
            {...fi("motivo")}
          />
        </div>
      )}
      <button
        type="button"
        onClick={onCambiarEstado}
        disabled={loadingEstado || isSame}
        style={{ width: "100%", padding: "10px", borderRadius: 40, border: "none", background: isSame ? C.muted : C.orange, color: "white", fontWeight: 700, fontSize: 12, cursor: loadingEstado || isSame ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}>
        {loadingEstado ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={14} />}
        {loadingEstado ? "Actualizando..." : isSame ? "Sin cambios" : `Cambiar a ${ESTADOS[estadoSelected]?.label}`}
      </button>
    </Card>
  );
}

// ========== CURSOR PERSONALIZADO ==========
function useCustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) { dotRef.current.style.left = `${mx}px`; dotRef.current.style.top = `${my}px`; }
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
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
  return { dotRef, ringRef, cursorOn, cursorOff };
}

async function submitEditObra(id: string, form: FormState, imgFile: File | null): Promise<Response> {
  const headers = { Authorization: `Bearer ${authService.getToken()}` };
  const { estado, ...formData } = form;
  if (imgFile) {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined) fd.append(k, String(v)); });
    fd.append("imagen", imgFile);
    return fetch(`${API_URL}/api/obras/${id}`, { method: "PUT", headers, body: fd });
  }
  return fetch(`${API_URL}/api/obras/${id}`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(formData) });
}

// ========== COMPONENTE PRINCIPAL ==========
export default function EditarObra() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { dotRef, ringRef, cursorOn, cursorOff } = useCustomCursor();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [imgMode, setImgMode] = useState<"upload" | "url">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [estadoActual, setEstadoActual] = useState("pendiente");
  const [estadoSelected, setEstadoSelected] = useState("pendiente");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showMotivo, setShowMotivo] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [originalForm, setOriginalForm] = useState<FormState | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [form, setForm] = useState<FormState>({
    titulo: "", descripcion: "", historia: "",
    id_categoria: 0, id_tecnica: 0, id_artista: 0,
    precio_base: 0, anio_creacion: new Date().getFullYear(),
    dimensiones_alto: "", dimensiones_ancho: "", dimensiones_profundidad: "",
    permite_marco: true, con_certificado: false, imagen_principal: "",
    estado: "pendiente",
  });

  const hasChanges = () => {
    if (!originalForm) return false;
    const fieldsToCompare: (keyof FormState)[] = [
      "titulo", "descripcion", "historia", "id_categoria", "id_tecnica", "id_artista",
      "precio_base", "anio_creacion", "dimensiones_alto", "dimensiones_ancho", "dimensiones_profundidad",
      "permite_marco", "con_certificado", "estado"
    ];
    for (const field of fieldsToCompare) {
      if (form[field] !== originalForm[field]) return true;
    }
    if (imgFile !== null) return true;
    if (form.imagen_principal !== originalForm.imagen_principal) return true;
    return false;
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowCancelConfirm(true);
    } else {
      navigate("/admin/obras");
    }
  };

  const confirmDiscard = () => {
    setShowCancelConfirm(false);
    navigate("/admin/obras");
  };

  const handleSaveClick = () => {
    // Validar antes de abrir confirmación
    const error = validarObra(form);
    if (error) { showToast(error, "err"); return; }
    if (!form.id_categoria) { showToast("Selecciona una categoría", "warn"); return; }
    if (!form.id_artista) { showToast("Selecciona un artista", "warn"); return; }
    setShowSaveConfirm(true);
  };

  const performSave = async () => {
    setShowSaveConfirm(false);
    setLoading(true);
    try {
      const res = await submitEditObra(id!, form, imgFile);
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al actualizar", "err"); return; }
      showToast("¡Obra actualizada correctamente!", "ok");
      setOriginalForm(form);
      setImgFile(null);
      setImgPreview("");
      setTimeout(() => navigate("/admin/obras"), 1500);
    } catch (err) { showToast(handleNetworkError(err), "err"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const [cR, tR, aR] = await Promise.all([obraService.getCategorias(), obraService.getTecnicas(), obraService.getArtistas()]);
        setCategorias(cR.categorias || []);
        setTecnicas(tR.tecnicas || []);
        setArtistas(aR.artistas || []);
        const res = await fetch(`${API_URL}/api/obras/admin/${id}`, {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        });
        if (!res.ok) { showToast(await handleApiError(res), "warn"); return; }
        const json = await res.json();
        if (json.success && json.data) {
          const o = json.data;
          const loadedForm = {
            titulo: o.titulo || "", descripcion: o.descripcion || "", historia: o.historia || "",
            id_categoria: o.id_categoria || 0, id_tecnica: o.id_tecnica || 0, id_artista: o.id_artista || 0,
            precio_base: o.precio_base || 0, anio_creacion: o.anio_creacion || new Date().getFullYear(),
            dimensiones_alto: o.dimensiones_alto || "", dimensiones_ancho: o.dimensiones_ancho || "",
            dimensiones_profundidad: o.dimensiones_profundidad || "", permite_marco: o.permite_marco ?? true,
            con_certificado: o.con_certificado ?? false, imagen_principal: o.imagen_principal || "",
            estado: o.estado || "pendiente",
          };
          setForm(loadedForm);
          setOriginalForm(loadedForm);
          setEstadoActual(o.estado || "pendiente");
          setEstadoSelected(o.estado || "pendiente");
          if (o.imagen_principal) setImgMode("url");
        } else { showToast("No se encontró la obra", "warn"); }
      } catch (err) { showToast(handleNetworkError(err), "err"); }
      finally { setLoadingData(false); }
    })();
  }, [id, showToast]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === "number") setForm(p => ({ ...p, [name]: value === "" ? 0 : Number(value) }));
    else setForm(p => ({ ...p, [name]: value }));
    const err = validateFieldInline(name, value);
    if (err) setFieldErrors(p => ({ ...p, [name]: err }));
    else setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes", "warn"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("La imagen no puede superar 10 MB", "warn"); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setForm(p => ({ ...p, imagen_principal: "" }));
  };
  const clearFile = () => { if (imgPreview) URL.revokeObjectURL(imgPreview); setImgFile(null); setImgPreview(""); if (fileRef.current) fileRef.current.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const handler = () => { const f = input.files?.[0]; if (f) handleFile(f); };
    input.addEventListener("change", handler);
    return () => input.removeEventListener("change", handler);
  }, []);

  const handleCambiarEstado = async () => {
    if (estadoSelected === "rechazada" && !motivoRechazo.trim()) { setShowMotivo(true); showToast("Escribe el motivo del rechazo", "warn"); return; }
    setLoadingEstado(true);
    try {
      const res = await fetch(`${API_URL}/api/obras/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ estado: estadoSelected, motivo_rechazo: motivoRechazo || null }),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al cambiar estado", "err"); return; }
      setEstadoActual(estadoSelected);
      setForm(prev => ({ ...prev, estado: estadoSelected }));
      if (originalForm) setOriginalForm({ ...originalForm, estado: estadoSelected });
      setShowMotivo(false);
      showToast(json.message || `Estado actualizado a "${estadoSelected}"`, "ok");
    } catch (err) { showToast(handleNetworkError(err), "err"); }
    finally { setLoadingEstado(false); }
  };

  const fi = (n: string) => ({ onFocus: () => setFocused(n), onBlur: () => setFocused(null) });
  const previewSrc = imgPreview || form.imagen_principal || "";
  const currentCat = categorias.find(c => c.id_categoria === Number(form.id_categoria));
  const currentArt = artistas.find(a => a.id_artista === Number(form.id_artista));
  const estadoInfo = ESTADOS[estadoActual] || ESTADOS.pendiente;

  if (loadingData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bgPage, fontFamily: SANS, flexDirection: "column", gap: 16 }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: C.orange }} />
        <span style={{ fontSize: 14, color: C.muted }}>Cargando obra...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

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

        .admin-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: ${C.orange}30; }
        .admin-card:hover .admin-card-icon { transform: scale(1.05); }
        .preview-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .estado-btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
        .admin-toggle:hover { border-color: ${C.orange}40; background: ${C.orange}05; }
      `}</style>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />

      {/* Confirmación de cancelar */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Descartar cambios"
        message="¿Estás seguro de que quieres cancelar la edición? Los cambios no guardados se perderán."
        confirmText="Sí, descartar"
        cancelText="Seguir editando"
        onConfirm={confirmDiscard}
        onCancel={() => setShowCancelConfirm(false)}
        accent={C.error}
      />

      {/* Confirmación de guardar */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        title="Guardar cambios"
        message="¿Estás seguro de que quieres guardar los cambios realizados en esta obra?"
        confirmText="Sí, guardar"
        cancelText="Revisar"
        onConfirm={performSave}
        onCancel={() => setShowSaveConfirm(false)}
        accent={C.orange}
      />

      <Topbar
        navigate={navigate}
        loading={loading}
        estadoInfo={estadoInfo}
        id={id}
        cursorOn={cursorOn}
        cursorOff={cursorOff}
        onCancel={handleCancel}
        onSaveClick={handleSaveClick}
      />
      <main style={{ flex: 1, padding: "24px 28px 40px", background: C.bgPage, fontFamily: SANS, animation: "fadeUp 0.4s ease" }}>
        <div style={{ marginBottom: 24, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Star size={9} color={C.orange} fill={C.orange} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Catálogo · Edición</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: SERIF, color: C.ink, margin: 0 }}>Editar <span style={{ color: C.orange }}>{form.titulo || "Obra"}</span></h1>
        </div>

        <form id="editar-obra-form" onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
            {/* Columna izquierda */}
            <div style={{ animation: "fadeUp 0.5s ease both" }}>
              <Card accent={C.orange} icon={Type} title="Información básica">
                <div style={{ marginBottom: 16 }}>
                  <Label required>Título</Label>
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={onChange}
                    required
                    disabled={loading}
                    style={InputStyle(focused === "titulo", loading, !!fieldErrors.titulo)}
                    {...fi("titulo")}
                  />
                  <FieldError msg={fieldErrors.titulo} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Label required>Descripción</Label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={onChange}
                    rows={4}
                    required
                    disabled={loading}
                    style={{ ...InputStyle(focused === "desc", loading, !!fieldErrors.descripcion), resize: "vertical" }}
                    {...fi("desc")}
                  />
                  <FieldError msg={fieldErrors.descripcion} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Label>Historia de la obra</Label>
                  <textarea
                    name="historia"
                    value={form.historia}
                    onChange={onChange}
                    rows={4}
                    disabled={loading}
                    placeholder="Cuenta la historia detrás de esta obra, su inspiración o contexto cultural…"
                    style={{ ...InputStyle(focused === "historia", loading, !!fieldErrors.historia), resize: "vertical" }}
                    {...fi("historia")}
                  />
                  <FieldError msg={fieldErrors.historia} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Opcional: Comparte el contexto, inspiración o anécdotas de la obra.</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <Label required>Categoría</Label>
                    <select
                      name="id_categoria"
                      value={form.id_categoria}
                      onChange={onChange}
                      required
                      disabled={loading}
                      style={InputStyle(focused === "cat", loading)}
                      {...fi("cat")}
                    >
                      <option value="0">Seleccionar…</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Técnica</Label>
                    <select
                      name="id_tecnica"
                      value={form.id_tecnica || ""}
                      onChange={onChange}
                      disabled={loading}
                      style={InputStyle(focused === "tec", loading)}
                      {...fi("tec")}
                    >
                      <option value="">Sin técnica</option>
                      {tecnicas.map(t => <option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label required>Artista</Label>
                    <select
                      name="id_artista"
                      value={form.id_artista}
                      onChange={onChange}
                      required
                      disabled={loading}
                      style={InputStyle(focused === "art", loading)}
                      {...fi("art")}
                    >
                      <option value="0">Seleccionar…</option>
                      {artistas.map(a => <option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico || a.nombre_completo}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Año</Label>
                    <input
                      type="number"
                      name="anio_creacion"
                      value={form.anio_creacion || ""}
                      onChange={onChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      disabled={loading}
                      style={InputStyle(focused === "anio", loading)}
                      {...fi("anio")}
                    />
                  </div>
                </div>
              </Card>

              <Card accent={C.blue} icon={Ruler} title="Dimensiones (cm)">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <Label>Alto</Label>
                    <input
                      type="number"
                      name="dimensiones_alto"
                      value={form.dimensiones_alto}
                      onChange={onChange}
                      placeholder="50"
                      step="0.01"
                      min="0"
                      disabled={loading}
                      style={InputStyle(focused === "dimensiones_alto", loading)}
                      {...fi("dimensiones_alto")}
                    />
                  </div>
                  <div>
                    <Label>Ancho</Label>
                    <input
                      type="number"
                      name="dimensiones_ancho"
                      value={form.dimensiones_ancho}
                      onChange={onChange}
                      placeholder="70"
                      step="0.01"
                      min="0"
                      disabled={loading}
                      style={InputStyle(focused === "dimensiones_ancho", loading)}
                      {...fi("dimensiones_ancho")}
                    />
                  </div>
                  <div>
                    <Label>Profundidad</Label>
                    <input
                      type="number"
                      name="dimensiones_profundidad"
                      value={form.dimensiones_profundidad}
                      onChange={onChange}
                      placeholder="5"
                      step="0.01"
                      min="0"
                      disabled={loading}
                      style={InputStyle(focused === "dimensiones_profundidad", loading)}
                      {...fi("dimensiones_profundidad")}
                    />
                  </div>
                </div>
              </Card>

              <Card accent={C.purple} icon={Award} title="Opciones adicionales">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Toggle
                    label="Permite marco personalizado"
                    name="permite_marco"
                    checked={form.permite_marco}
                    onChange={onChange}
                    disabled={loading}
                    icon={Frame}
                    accent={C.purple}
                  />
                  <Toggle
                    label="Incluye certificado"
                    name="con_certificado"
                    checked={form.con_certificado}
                    onChange={onChange}
                    disabled={loading}
                    icon={Award}
                    accent={C.gold}
                  />
                </div>
              </Card>

              <RevisionPanel
                estadoActual={estadoActual}
                estadoSelected={estadoSelected}
                setEstadoSelected={setEstadoSelected}
                showMotivo={showMotivo}
                setShowMotivo={setShowMotivo}
                motivoRechazo={motivoRechazo}
                setMotivoRechazo={setMotivoRechazo}
                onCambiarEstado={handleCambiarEstado}
                loadingEstado={loadingEstado}
                focused={focused}
                fi={fi}
              />
            </div>

            {/* Columna derecha */}
            <div style={{ animation: "fadeUp 0.5s ease both", animationDelay: "0.1s" }}>
              <ObraPreviewCard form={form} previewSrc={previewSrc} currentArt={currentArt} currentCat={currentCat} />
              <PrecioCard form={form} onChange={onChange} focused={focused} loading={loading} fi={fi} />
              <ImagenCard
                form={form}
                imgMode={imgMode}
                setImgMode={setImgMode}
                imgFile={imgFile}
                imgPreview={imgPreview}
                fileRef={fileRef}
                clearFile={clearFile}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onDrop={onDrop}
                onChange={onChange}
                focused={focused}
                loading={loading}
                fi={fi}
              />
            </div>
          </div>
        </form>
      </main>
    </>
  );
}