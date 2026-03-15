// src/pages/private/admin/AdminImportar.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileSpreadsheet, X, CheckCircle, AlertCircle,
  RefreshCw, AlertTriangle, Eye, EyeOff,
  ChevronRight, Download, Layers, Users, ChevronDown,
 CloudUpload, Zap, TableProperties,
  FilePlus2, FileCheck2, FolderOpen, MousePointerClick,
  UploadCloud, ShieldCheck, FileWarning,
} from "lucide-react";
import * as XLSX from "xlsx";
import { authService } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  red:      "#F04E6B",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.35)",
  bgDeep:   "#070510",
  bg:       "#0C0812",
  card:     "rgba(18,13,30,0.95)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.20)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FB = "'DM Sans', sans-serif";
const FD = "'Playfair Display', serif";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fmtB = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

type TipoReg    = "obras" | "artistas";
type FilaAccion = "insertada" | "actualizada" | "error";
interface FilaRes  { fila: number; titulo: string; accion: FilaAccion; errores?: string[] }
interface Resumen  { total: number; insertadas: number; actualizadas: number; errores: number }
interface ExcelPreview {
  headers: string[]; rows: Record<string, unknown>[]; allRows: Record<string, unknown>[];
  totalFilas: number; nuevas: number; actualizaciones: number;
}

function authH() { return { Authorization: `Bearer ${authService.getToken()}` }; }

function parseExcelPreview(file: File, tipo: TipoReg): Promise<ExcelPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb     = XLSX.read(e.target?.result, { type: "array" });
        const shName = tipo === "obras" ? "Obras" : "Artistas";
        const ws     = wb.Sheets[shName] || wb.Sheets[wb.SheetNames[0]];
        const allRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        const firstRowValues = allRaw.length > 0 ? Object.values(allRaw[0]).map(v => String(v)) : [];
        const isHintRow = firstRowValues.some(v => v.includes("←") || v.includes("Ej:") || v.includes("Vacío="));
        const all     = isHintRow ? allRaw.slice(1) : allRaw;
        const idField = tipo === "obras" ? "ID Obra" : "ID Artista";
        const nuevas  = all.filter(r => !r[idField] || String(r[idField]).trim() === "").length;
        const updates = all.filter(r =>  r[idField] && String(r[idField]).trim() !== "").length;
        const headers = all.length > 0 ? Object.keys(all[0]) : [];
        resolve({ headers, rows: all.slice(0, 5), allRows: all, totalFilas: all.length, nuevas, actualizaciones: updates });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, background: C.bgDeep, borderBottom: `1px solid ${C.borderBr}`, position: "sticky", top: 0, zIndex: 30, fontFamily: FB }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</span>
        <ChevronRight size={12} color={C.creamMut} />
        <span style={{ fontSize: 13, color: C.creamSub }}>Importar</span>
      </div>
      <button onClick={() => navigate("/admin")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 14px", color: C.creamMut, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.cream; el.style.borderColor = C.borderHi; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.creamMut; el.style.borderColor = C.border; }}>
        <Upload size={13} strokeWidth={1.8} /> Dashboard
      </button>
    </div>
  );
}

// ── DropZone ──────────────────────────────────────────────────────────────────
function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean; accent: string }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = useCallback((f: File | null | undefined) => {
    if (!f || !f.name.endsWith(".xlsx")) return;
    onFile(f);
  }, [onFile]);

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        position: "relative", overflow: "hidden",
        border: `2px dashed ${drag ? C.orange : C.borderBr}`,
        borderRadius: 16, padding: "52px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        background: drag ? "rgba(255,132,14,0.06)" : "rgba(255,232,200,0.015)",
        transition: "all .25s", opacity: disabled ? 0.5 : 1,
      }}>
      <div style={{ position: "absolute", inset: 0, background: drag ? "radial-gradient(ellipse at 50% 0%, rgba(255,132,14,0.12) 0%, transparent 65%)" : "none", transition: "all .3s", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: drag ? "rgba(255,132,14,0.15)" : "rgba(255,232,200,0.05)", border: `1.5px solid ${drag ? C.orange + "55" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .25s", transform: drag ? "scale(1.08) translateY(-3px)" : "scale(1)", boxShadow: drag ? `0 12px 32px rgba(255,132,14,0.25)` : "none" }}>
          <CloudUpload size={28} color={drag ? C.orange : C.creamMut} strokeWidth={1.5} style={{ transition: "all .25s" }} />
        </div>
        {drag && (
          <div style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", animation: "popIn .2s ease", boxShadow: `0 2px 8px rgba(255,132,14,0.6)` }}>
            <Zap size={10} color="white" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: drag ? C.cream : C.creamSub, fontFamily: FB, marginBottom: 6, transition: "color .2s" }}>
          {drag ? "¡Suelta el archivo!" : <>Arrastra tu <span style={{ color: C.orange, fontWeight: 800 }}>.xlsx</span> aquí</>}
        </div>
        <div style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB }}>o haz clic para seleccionar · máx. 10 MB</div>
      </div>
      <div style={{ display: "flex", gap: 8, zIndex: 1 }}>
        {["Excel 2007+", ".xlsx", "Hasta 10 MB"].map(tag => (
          <span key={tag} style={{ fontSize: 10.5, padding: "3px 10px", borderRadius: 20, background: "rgba(255,232,200,0.05)", border: `1px solid ${C.border}`, color: C.creamMut, fontFamily: FB, fontWeight: 600 }}>{tag}</span>
        ))}
      </div>
      <input ref={ref} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => handle(e.target.files?.[0])} />
    </div>
  );
}

// ── FilePreview ───────────────────────────────────────────────────────────────
function FilePreview({ file, tipo, onCancel, onConfirm, loading }: {
  file: File; tipo: TipoReg; onCancel: () => void; onConfirm: () => void; loading: boolean;
}) {
  const [result, setResult] = useState<{ file: File | null; preview: ExcelPreview | null; parseErr: boolean }>({ file: null, preview: null, parseErr: false });
  const parsing  = result.file !== file;
  const preview  = result.file === file ? result.preview  : null;
  const parseErr = result.file === file ? result.parseErr : false;
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    parseExcelPreview(file, tipo)
      .then(p  => { if (!cancelled) setResult({ file, preview: p,    parseErr: false }); })
      .catch(() => { if (!cancelled) setResult({ file, preview: null, parseErr: true  }); });
    return () => { cancelled = true; };
  }, [file, tipo]);

  const colsObras    = ["ID Obra",    "Título",          "Artista",        "Categoría",  "Estado",  "Precio Base (MXN)"];
  const colsArtistas = ["ID Artista", "Nombre Completo", "Nombre Artístico","Correo",    "Ciudad",  "Estado"];
  const priorCols    = tipo === "obras" ? colsObras : colsArtistas;
  const normalizedHeaders = preview ? preview.headers.map(h => h.replace(/\s*\*+\s*/g, "").trim()) : [];
  const matchedCols = preview ? priorCols.filter(c => preview.headers.includes(c) || normalizedHeaders.includes(c.replace(/\s*\*+\s*/g, "").trim())) : [];
  const visibleCols = preview
    ? (matchedCols.length > 0
        ? matchedCols.map(c => { const idx = normalizedHeaders.indexOf(c.replace(/\s*\*+\s*/g, "").trim()); return idx >= 0 ? preview.headers[idx] : c; }).slice(0, 6)
        : preview.headers.slice(0, 6))
    : [];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: C.card, border: `1px solid rgba(255,132,14,0.20)`, boxShadow: `0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,200,150,0.06)` }}>
      {/* Header archivo */}
      <div style={{ padding: "18px 22px", background: `linear-gradient(135deg, rgba(255,132,14,0.08) 0%, rgba(18,13,30,0) 60%)`, borderBottom: `1px solid rgba(255,132,14,0.12)`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: "rgba(34,201,122,0.12)", border: `1px solid rgba(34,201,122,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(34,201,122,0.15)` }}>
          <FileSpreadsheet size={20} color={C.green} strokeWidth={1.7} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: FB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{file.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>{fmtB(file.size)}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.borderBr, display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>{new Date(file.lastModified).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(34,201,122,0.12)", color: C.green, fontWeight: 700, fontFamily: FB, border: `1px solid rgba(34,201,122,0.2)` }}>XLSX</span>
          </div>
        </div>
        <button onClick={onCancel}
          style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.border}`, background: "rgba(255,232,200,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(240,78,107,0.15)"; el.style.borderColor = "rgba(240,78,107,0.3)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,232,200,0.04)"; el.style.borderColor = C.border; }}>
          <X size={13} color={C.creamMut} />
        </button>
      </div>

      <div style={{ padding: "20px 22px" }}>
        {/* Stat cards */}
        {preview && !parsing && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total filas",     value: preview.totalFilas,      color: C.blue,  bg: "rgba(121,170,245,0.08)",  bd: "rgba(121,170,245,0.18)" },
              { label: "Nuevas entradas", value: preview.nuevas,          color: C.green, bg: "rgba(34,201,122,0.08)",   bd: "rgba(34,201,122,0.18)"  },
              { label: "Actualizaciones", value: preview.actualizaciones, color: C.gold,  bg: "rgba(255,193,16,0.08)",   bd: "rgba(255,193,16,0.18)"  },
            ].map(({ label, value, color, bg, bd }) => (
              <div key={label} style={{ padding: "16px 18px", borderRadius: 12, background: bg, border: `1px solid ${bd}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <span style={{ fontSize: 28, fontWeight: 900, color, fontFamily: FD, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 10.5, color: C.creamMut, fontFamily: FB, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabla preview */}
        {parsing ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "36px 0", color: C.creamMut, fontFamily: FB, fontSize: 13 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,132,14,0.08)", border: `1px solid rgba(255,132,14,0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={14} color={C.orange} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            Leyendo archivo...
          </div>
        ) : parseErr ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, background: "rgba(240,78,107,0.07)", border: `1px solid rgba(240,78,107,0.2)`, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(240,78,107,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertCircle size={15} color={C.red} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, fontFamily: FB, marginBottom: 2 }}>Archivo no válido</div>
              <div style={{ fontSize: 12, color: "rgba(240,78,107,0.7)", fontFamily: FB }}>Verifica que sea una plantilla correcta (.xlsx)</div>
            </div>
          </div>
        ) : preview && visibleCols.length > 0 ? (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: C.orange }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Vista previa · {showAll ? `${preview.totalFilas} filas` : `${Math.min(5, preview.rows.length)} de ${preview.totalFilas}`}
                </span>
              </div>
              {preview.totalFilas > 5 && (
                <button onClick={() => setShowAll(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,232,200,0.03)", color: C.creamMut, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.orange; el.style.borderColor = `${C.orange}35`; el.style.background = "rgba(255,132,14,0.06)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.creamMut; el.style.borderColor = C.border; el.style.background = "rgba(255,232,200,0.03)"; }}>
                  {showAll ? <><EyeOff size={11} /> Mostrar menos</> : <><Eye size={11} /> Ver todas ({preview.totalFilas})</>}
                </button>
              )}
            </div>
            <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}`, maxHeight: showAll ? 340 : "none", overflowY: showAll ? "auto" : "visible" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FB }}>
                <thead style={{ position: showAll ? "sticky" : "static", top: 0, zIndex: 2 }}>
                  <tr style={{ background: "rgba(7,5,16,0.98)" }}>
                    {visibleCols.map((col, i) => (
                      <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 800, color: C.orange, whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}`, letterSpacing: "0.06em", textTransform: "uppercase", borderRight: i < visibleCols.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        {col.replace(/\s*\*+\s*/g, "").trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAll ? preview.allRows : preview.rows).map((row, i) => {
                    const idField = tipo === "obras" ? "ID Obra" : "ID Artista";
                    const esNueva = !row[idField] || String(row[idField]).trim() === "";
                    return (
                      <tr key={i}
                        style={{ borderBottom: `1px solid rgba(255,200,150,0.04)`, background: i % 2 === 0 ? "rgba(255,232,200,0.01)" : "transparent", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,132,14,0.04)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "rgba(255,232,200,0.01)" : "transparent"}>
                        {visibleCols.map((col, j) => (
                          <td key={col} style={{ padding: "9px 14px", fontSize: 12.5, color: C.creamSub, whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", borderRight: j < visibleCols.length - 1 ? `1px solid rgba(255,200,150,0.04)` : "none" }}>
                            {col === idField
                              ? esNueva
                                ? <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "rgba(34,201,122,0.14)", color: C.green, fontWeight: 800, border: `1px solid rgba(34,201,122,0.22)` }}>NUEVA</span>
                                : <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "rgba(121,170,245,0.14)", color: C.blue, fontWeight: 800, border: `1px solid rgba(121,170,245,0.22)` }}>{String(row[col])}</span>
                              : String(row[col] || "—")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Aviso */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(255,193,16,0.05)", border: `1px solid rgba(255,193,16,0.16)`, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,193,16,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={13} color={C.gold} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 12.5, color: C.creamSub, fontFamily: FB, lineHeight: 1.6 }}>
            <strong style={{ color: C.green }}>Verde</strong> = nueva entrada &nbsp;·&nbsp; <strong style={{ color: C.blue }}>Azul</strong> = actualización.
            <span style={{ color: C.creamMut }}> Esta acción no se puede deshacer.</span>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ padding: "9px 20px", borderRadius: 9, background: "transparent", border: `1px solid ${C.borderBr}`, color: C.creamMut, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.color = C.creamSub; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderBr; (e.currentTarget as HTMLElement).style.color = C.creamMut; }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading || parsing}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 24px", borderRadius: 9, background: (loading || parsing) ? "rgba(255,132,14,0.08)" : `linear-gradient(135deg, ${C.orange}, ${C.magenta})`, border: "none", color: (loading || parsing) ? C.creamMut : "white", fontSize: 13, fontWeight: 700, cursor: (loading || parsing) ? "wait" : "pointer", fontFamily: FB, boxShadow: (loading || parsing) ? "none" : `0 6px 20px ${C.orange}40`, transition: "all .2s", opacity: (loading || parsing) ? 0.6 : 1 }}>
            {loading
              ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Procesando...</>
              : <><Zap size={13} strokeWidth={2.5} /> Confirmar importación ({preview?.totalFilas ?? "—"} filas)</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ResultadoPanel ────────────────────────────────────────────────────────────
function ResultadoPanel({ resumen, detalle, onReset }: { resumen: Resumen; detalle: FilaRes[]; onReset: () => void }) {
  const [show, setShow] = useState(false);
  const exitoso = resumen.errores === 0;
  const kpis = [
    { label: "Total",        value: resumen.total,        color: C.blue,  bg: "rgba(121,170,245,0.08)",  bd: "rgba(121,170,245,0.18)" },
    { label: "Insertadas",   value: resumen.insertadas,   color: C.green, bg: "rgba(34,201,122,0.08)",   bd: "rgba(34,201,122,0.18)"  },
    { label: "Actualizadas", value: resumen.actualizadas, color: C.gold,  bg: "rgba(255,193,16,0.08)",   bd: "rgba(255,193,16,0.18)"  },
    { label: "Errores",      value: resumen.errores,      color: C.red,   bg: "rgba(240,78,107,0.08)",   bd: "rgba(240,78,107,0.18)"  },
  ];
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: C.card, border: `1px solid ${exitoso ? "rgba(34,201,122,0.25)" : "rgba(240,78,107,0.25)"}`, boxShadow: `0 8px 40px rgba(0,0,0,0.4)` }}>
      <div style={{ padding: "20px 24px", background: exitoso ? `linear-gradient(135deg, rgba(34,201,122,0.10) 0%, rgba(18,13,30,0) 60%)` : `linear-gradient(135deg, rgba(240,78,107,0.09) 0%, rgba(18,13,30,0) 60%)`, borderBottom: `1px solid ${exitoso ? "rgba(34,201,122,0.12)" : "rgba(240,78,107,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: exitoso ? "rgba(34,201,122,0.14)" : "rgba(240,78,107,0.14)", border: `1px solid ${exitoso ? "rgba(34,201,122,0.25)" : "rgba(240,78,107,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {exitoso ? <CheckCircle size={20} color={C.green} strokeWidth={2} /> : <AlertCircle size={20} color={C.red} strokeWidth={2} />}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 3 }}>{exitoso ? "Importación completada" : "Importación con errores"}</div>
            <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>{resumen.total} registros procesados · {resumen.insertadas} nuevos · {resumen.actualizadas} actualizados</div>
          </div>
        </div>
        <button onClick={onReset}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(255,132,14,0.08)", border: `1px solid rgba(255,132,14,0.25)`, color: C.orange, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,132,14,0.16)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,132,14,0.08)"; }}>
          <RefreshCw size={12} /> Nueva importación
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: "20px 22px" }}>
        {kpis.map(({ label, value, color, bg, bd }) => (
          <div key={label} style={{ padding: "18px 16px", borderRadius: 12, background: bg, border: `1px solid ${bd}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <div style={{ fontSize: 34, fontWeight: 900, color, fontFamily: FD, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.creamMut, fontFamily: FB, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
          </div>
        ))}
      </div>
      {detalle.length > 0 && (
        <div style={{ padding: "0 22px 20px" }}>
          <button onClick={() => setShow(v => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", borderRadius: 10, background: "rgba(255,232,200,0.03)", border: `1px solid ${C.border}`, color: C.creamMut, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = "rgba(255,232,200,0.03)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
              {show ? "Ocultar" : "Ver"} detalle fila por fila
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,200,150,0.07)", border: `1px solid ${C.border}`, color: C.creamMut }}>{detalle.length} registros</span>
            </div>
            <ChevronDown size={13} style={{ transform: show ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
          </button>
          {show && (
            <div style={{ marginTop: 10, maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {detalle.map((r, i) => {
                const isErr  = r.accion === "error";
                const isNew  = r.accion === "insertada";
                const color  = isErr ? C.red : isNew ? C.green : C.gold;
                const bg     = isErr ? "rgba(240,78,107,0.05)" : isNew ? "rgba(34,201,122,0.04)" : "rgba(255,193,16,0.04)";
                const border = isErr ? "rgba(240,78,107,0.15)" : isNew ? "rgba(34,201,122,0.12)" : "rgba(255,193,16,0.12)";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 14px", borderRadius: 9, background: bg, border: `1px solid ${border}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {isErr ? <AlertCircle size={11} color={color} /> : isNew ? <CheckCircle size={11} color={color} /> : <RefreshCw size={11} color={color} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, fontFamily: FB }}>{r.titulo}</span>
                      <span style={{ fontSize: 11, color: C.creamMut, fontFamily: FB, marginLeft: 8 }}>fila {r.fila}</span>
                      {r.errores?.map((e, j) => <div key={j} style={{ fontSize: 11.5, color: C.red, fontFamily: FB, marginTop: 3 }}>· {e}</div>)}
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 800, background: `${color}14`, color, flexShrink: 0, fontFamily: FB, border: `1px solid ${color}22` }}>{r.accion}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PasoCard ──────────────────────────────────────────────────────────────────
function PasoCard({ n, title, desc, endpoint, endpointVacio, onDownload, index }: {
  n: string; title: string; desc: string;
  endpoint: string | null; endpointVacio: string | null;
  accent: string; onDownload: (e: string) => void; index: number;
}) {
  const steps = [
    { MainIcon: TableProperties, SubIcon: FilePlus2,   from: "#FF840E", to: "#D06500", hint: null },
    { MainIcon: FileCheck2,      SubIcon: FileWarning, from: "#22C97A", to: "#16A35E", hint: "Edita libremente el Excel" },
    { MainIcon: UploadCloud,     SubIcon: ShieldCheck, from: "#8D4CCD", to: "#6B35A8", hint: "Arrastra el archivo abajo" },
  ];
  const { MainIcon, SubIcon, from, to, hint } = steps[index] || steps[0];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", animation: `fadeUp .4s ease ${index * 0.09}s both`, transition: "border-color .2s, transform .2s, box-shadow .2s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${from}40`; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px ${from}18`; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>

      {/* Barra top degradada */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${from}, ${to}, transparent 80%)` }} />

      {/* Hero */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        {/* Ícono principal con número */}
        <div style={{ position: "relative" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${from}20, ${to}10)`, border: `1px solid ${from}28`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 18px ${from}18` }}>
            <MainIcon size={28} color={from} strokeWidth={1.4} />
          </div>
          <div style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${from}, ${to})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", fontFamily: FB, boxShadow: `0 2px 10px ${from}55, 0 0 0 2px ${C.card}` }}>{n}</div>
        </div>
        {/* Ícono sub decorativo */}
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,232,200,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SubIcon size={15} color={C.creamMut} strokeWidth={1.5} />
        </div>
      </div>

      {/* Texto */}
      <div style={{ padding: "14px 20px 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.cream, fontFamily: FB, marginBottom: 8, lineHeight: 1.2 }}>{title}</div>
        <p style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB, margin: "0 0 16px", lineHeight: 1.75 }}>{desc}</p>

        {/* Botones de descarga */}
        {(endpoint || endpointVacio) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {endpointVacio && (
              <button onClick={() => onDownload(endpointVacio)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${from}, ${to})`, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FB, width: "100%", justifyContent: "center", transition: "all .18s", boxShadow: `0 4px 16px ${from}35` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = `0 8px 24px ${from}55`; el.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = `0 4px 16px ${from}35`; el.style.transform = "translateY(0)"; }}>
                <Download size={14} strokeWidth={2.5} />
                Plantilla vacía
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(255,255,255,0.22)", padding: "2px 8px", borderRadius: 20 }}>recomendada</span>
              </button>
            )}
            {endpoint && (
              <button onClick={() => onDownload(endpoint)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${from}35`, background: `${from}08`, color: from, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FB, width: "100%", justifyContent: "center", transition: "all .18s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${from}18`; el.style.borderColor = `${from}55`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${from}08`; el.style.borderColor = `${from}35`; }}>
                <FolderOpen size={13} strokeWidth={2} />
                Con datos actuales
                <span style={{ fontSize: 10, color: C.creamMut, fontWeight: 400 }}>· para editar</span>
              </button>
            )}
          </div>
        )}

        {/* Indicador para pasos sin botón */}
        {!endpoint && !endpointVacio && hint && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 9, background: `${from}08`, border: `1px solid ${from}20` }}>
            <MousePointerClick size={13} color={from} strokeWidth={2} />
            <span style={{ fontSize: 12, color: from, fontWeight: 600, fontFamily: FB }}>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminImportar() {
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [tipo,      setTipo]      = useState<TipoReg>("obras");
  const [file,      setFile]      = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [resumen,   setResumen]   = useState<Resumen | null>(null);
  const [detalle,   setDetalle]   = useState<FilaRes[]>([]);

  const handleExportPlantilla = async (endpoint: string) => {
    try {
      const res  = await fetch(`${API}/api/reportes/exportar/${endpoint}`, { headers: authH() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      const cd   = res.headers.get("Content-Disposition") || "";
      const m    = cd.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] || `plantilla-${endpoint}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast("Plantilla descargada", "ok");
    } catch { showToast("Error al descargar plantilla", "err"); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const fd  = new FormData(); fd.append("archivo", file);
      const url = tipo === "obras" ? `${API}/api/reportes/importar/obras` : `${API}/api/reportes/importar/artistas`;
      const res  = await fetch(url, { method: "POST", headers: authH(), body: fd });
      const json = await res.json();
      if (!json.success) { showToast(json.message || "Error al importar", "err"); return; }
      setResumen(json.resumen); setDetalle(json.detalle); setFile(null);
      const { insertadas, actualizadas, errores } = json.resumen;
      showToast(`${insertadas} insertadas · ${actualizadas} actualizadas · ${errores} errores`, errores > 0 ? "warn" : "ok");
    } catch { showToast("Error de conexión", "err"); }
    finally { setImporting(false); }
  };

  const accentTipo = tipo === "obras" ? C.blue : C.pink;

  const pasos = [
    {
      n: "1", title: "Descarga la plantilla",
      desc: `Usa la plantilla vacía para registros nuevos. Usa "con datos actuales" si quieres editar registros existentes. Los catálogos siempre se generan frescos desde la BD.`,
      endpoint:      tipo === "obras" ? "obras-plantilla"       : "artistas-plantilla",
      endpointVacio: tipo === "obras" ? "obras-plantilla-vacia" : "artistas-plantilla-vacia",
    },
    {
      n: "2", title: "Edita el archivo",
      desc: "Rellena los campos obligatorios (*). Usa los desplegables para categorías, técnicas y artistas. La hoja Referencia/Catálogos explica los valores permitidos.",
      endpoint: null, endpointVacio: null,
    },
    {
      n: "3", title: "Sube y confirma",
      desc: "Arrastra el archivo. Verás un preview con columnas y conteo de filas antes de confirmar. ID vacío = nuevo · ID con valor = actualización.",
      endpoint: null, endpointVacio: null,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
      `}</style>
      <Topbar navigate={navigate} />

      <main style={{ flex: 1, padding: "26px 28px 40px", overflowY: "auto", backgroundColor: C.bg, backgroundImage: `radial-gradient(ellipse at 75% 0%, rgba(255,132,14,0.08) 0%, transparent 40%), radial-gradient(ellipse at 10% 90%, rgba(204,89,173,0.06) 0%, transparent 35%)`, fontFamily: FB }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(255,132,14,0.08)", border: `1px solid rgba(255,132,14,0.20)`, fontSize: 11, color: C.orange, marginBottom: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
              <CloudUpload size={10} color={C.orange} /> IMPORTACIÓN MASIVA
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.cream, fontFamily: FD, margin: "0 0 6px", lineHeight: 1.15 }}>
              Importar <span style={{ color: C.orange, fontStyle: "italic" }}>Datos</span>
            </h1>
            <p style={{ fontSize: 13.5, color: C.creamMut, margin: 0 }}>
              Inserta o actualiza registros en bloque desde un archivo Excel
            </p>
          </div>

          {/* Selector tipo */}
          <div style={{ display: "flex", gap: 6, background: "rgba(255,232,200,0.03)", padding: 4, borderRadius: 12, border: `1px solid ${C.border}` }}>
            {(["obras", "artistas"] as TipoReg[]).map(t => {
              const accent = t === "obras" ? C.blue : C.pink;
              const on     = tipo === t;
              return (
                <button key={t} onClick={() => { setTipo(t); setFile(null); setResumen(null); setDetalle([]); }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 9, border: on ? `1px solid ${accent}45` : "1px solid transparent", background: on ? `${accent}12` : "transparent", color: on ? accent : C.creamMut, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: FB, transition: "all .2s", boxShadow: on ? `0 2px 10px ${accent}20` : "none" }}>
                  {t === "obras" ? <Layers size={13} /> : <Users size={13} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        {resumen ? (
          <ResultadoPanel resumen={resumen} detalle={detalle} onReset={() => { setResumen(null); setDetalle([]); }} />
        ) : file ? (
          <FilePreview file={file} tipo={tipo} onCancel={() => setFile(null)} onConfirm={handleImport} loading={importing} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {pasos.map((p, i) => (
                <PasoCard key={p.n} {...p} accent={accentTipo} onDownload={handleExportPlantilla} index={i} />
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid rgba(255,132,14,0.15)`, borderRadius: 16, padding: "22px 24px", animation: `fadeUp .4s ease .28s both`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, ${C.magenta}, transparent 70%)` }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,132,14,0.12)", border: `1px solid rgba(255,132,14,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UploadCloud size={19} color={C.orange} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.cream, fontFamily: FD, marginBottom: 2 }}>Subir archivo</div>
                    <div style={{ fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>Solo archivos .xlsx · plantilla oficial</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${accentTipo}10`, border: `1px solid ${accentTipo}30` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentTipo, boxShadow: `0 0 6px ${accentTipo}` }} />
                  <span style={{ fontSize: 11, color: accentTipo, fontWeight: 700, fontFamily: FB }}>{tipo === "obras" ? "Modo: Obras" : "Modo: Artistas"}</span>
                </div>
              </div>
              <DropZone onFile={setFile} accent={accentTipo} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}