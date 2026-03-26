// src/pages/private/admin/EditarObra.tsx
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  Layers, Star, UploadCloud, X, FileImage,
  CheckCircle, XCircle, Clock, Package, ShieldCheck, MessageSquare,
  ChevronRight,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";
import logoImg from "../../../assets/images/logo.png";

const C = {
  orange:"#FF840E", pink:"#CC59AD", magenta:"#CC4EA1", purple:"#8D4CCD",
  blue:"#79AAF5", gold:"#FFC110", green:"#22C97A", cream:"#FFF8EE",
  creamSub:"#D8CABC", creamMut:"rgba(255,232,200,0.35)", bg:"#0C0812",
  bgDeep:"#070510", card:"rgba(18,13,30,0.95)", border:"rgba(255,200,150,0.08)",
  borderBr:"rgba(118,78,49,0.20)", borderHi:"rgba(255,200,150,0.18)",
  input:"rgba(255,232,200,0.04)", inputBorder:"rgba(255,200,150,0.14)",
  inputFocus:"rgba(255,132,14,0.08)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const fmt = (n:number) => new Intl.NumberFormat("es-MX").format(n);

/* ═══ Validation ═══ */
const xssPattern = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v:string) => xssPattern.test(v)||sqliPattern.test(v);

const validarObra = (form:{titulo:string;descripcion:string}): string|null => {
  if (!form.titulo.trim()) return "El título es obligatorio";
  if (hasSuspiciousContent(form.titulo)) return "El título contiene contenido no permitido";
  if (form.titulo.trim().length<3) return "El título debe tener mínimo 3 caracteres";
  if (!form.descripcion.trim()) return "La descripción es obligatoria";
  if (hasSuspiciousContent(form.descripcion)) return "La descripción contiene contenido no permitido";
  if (form.descripcion.trim().length<10) return "La descripción debe tener mínimo 10 caracteres";
  return null;
};

function validateFieldInline(name:string, value:string): string|null {
  if (name==="titulo") {
    if (value&&hasSuspiciousContent(value)) return "Contenido no permitido";
    if (value&&value.trim().length<3) return "Mínimo 3 caracteres";
  }
  if (name==="descripcion") {
    if (value&&hasSuspiciousContent(value)) return "Contenido no permitido";
    if (value&&value.trim().length<10) return "Mínimo 10 caracteres";
  }
  return null;
}

/* ═══ Types ═══ */
const ESTADOS: Record<string,{label:string;color:string;icon:React.ElementType;desc:string}> = {
  pendiente:{label:"Pendiente",color:C.gold,icon:Clock,desc:"En revisión"},
  publicada:{label:"Publicada",color:C.green,icon:CheckCircle,desc:"Visible en catálogo"},
  rechazada:{label:"Rechazada",color:C.pink,icon:XCircle,desc:"Requiere correcciones"},
  agotada:{label:"Agotada",color:C.creamMut,icon:Package,desc:"Sin disponibilidad"},
};

interface Categoria { id_categoria:number; nombre:string; }
interface Tecnica { id_tecnica:number; nombre:string; }
interface Artista { id_artista:number; nombre_completo:string; nombre_artistico?:string; }
type FormState = {
  titulo:string; descripcion:string; id_categoria:number; id_tecnica:number; id_artista:number;
  precio_base:number; anio_creacion:number; dimensiones_alto:string; dimensiones_ancho:string;
  dimensiones_profundidad:string; permite_marco:boolean; con_certificado:boolean; imagen_principal:string;
};

/* ═══ Shared UI ═══ */
function IS(focused:boolean,disabled:boolean,error?:boolean): React.CSSProperties {
  return { width:"100%", padding:"11px 14px", boxSizing:"border-box", background:error?"rgba(204,89,173,0.05)":focused?C.inputFocus:C.input, border:`1.5px solid ${error?C.pink:focused?C.orange:C.inputBorder}`, borderRadius:10, fontSize:13.5, color:C.cream, outline:"none", transition:"border-color .15s, background .15s", fontFamily:FB, opacity:disabled?0.5:1 };
}
function Lbl({children,req}:{children:React.ReactNode;req?:boolean}) {
  return <div style={{ fontSize:11, fontWeight:700, color:C.creamMut, marginBottom:7, display:"flex", alignItems:"center", gap:5, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB }}>{children}{req&&<span style={{color:C.orange}}>*</span>}</div>;
}
function FieldError({msg}:{msg?:string}) { if(!msg) return null; return <div style={{ fontSize:11.5, color:C.pink, fontWeight:600, marginTop:5, fontFamily:FB }}>⚠ {msg}</div>; }

function Card({accent,icon:Icon,title,children,delay=0}:{accent:string;icon:React.ElementType;title:string;children:React.ReactNode;delay?:number}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14, position:"relative", animation:`fadeUp .5s ease ${delay}s both` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},${accent}50,transparent)` }}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ width:30, height:30, borderRadius:9, background:`${accent}14`, border:`1px solid ${accent}28`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={14} color={accent} strokeWidth={2.2}/></div>
        <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>{title}</span>
        <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${accent}18,transparent)` }}/>
      </div>
      <div style={{ padding:"18px 20px" }}>{children}</div>
    </div>
  );
}
function Toggle({label,name,checked,onChange,disabled,icon:Icon,accent}:{label:string;name:string;checked:boolean;onChange:(e:ChangeEvent<HTMLInputElement>)=>void;disabled:boolean;icon:React.ElementType;accent:string}) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, cursor:disabled?"not-allowed":"pointer", border:`1.5px solid ${checked?`${accent}50`:C.border}`, background:checked?`${accent}10`:"rgba(255,232,200,0.02)", transition:"all .15s", userSelect:"none" as const }}>
      <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, border:`2px solid ${checked?accent:C.creamMut}`, background:checked?accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{checked&&<CheckCircle2 size={11} color="white" strokeWidth={3}/>}</div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display:"none" }}/>
      <Icon size={14} color={checked?accent:C.creamMut} strokeWidth={2}/><span style={{ fontSize:13, fontWeight:checked?700:400, color:checked?C.cream:C.creamSub, fontFamily:FB }}>{label}</span>
    </label>
  );
}

/* ═══ Topbar ═══ */
function EditarObraTopbar({navigate,loading,estadoInfo,id}:{navigate:(p:string)=>void;loading:boolean;estadoInfo:{label:string;color:string;icon:React.ElementType};id?:string}) {
  const EIcon=estadoInfo.icon;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56, background:C.bgDeep, borderBottom:`1px solid ${C.borderBr}`, position:"sticky", top:0, zIndex:30, fontFamily:FB }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={()=>navigate("/admin/obras")} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:C.creamMut, fontSize:11.5, fontWeight:700, fontFamily:FB, letterSpacing:"0.08em", textTransform:"uppercase" }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.orange} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.creamMut}><ArrowLeft size={13} strokeWidth={2}/> Admin</button>
        <ChevronRight size={12} color={C.creamMut}/><span style={{ fontSize:11.5, fontWeight:700, color:C.orange, letterSpacing:"0.08em", textTransform:"uppercase" }}>Obras</span>
        <ChevronRight size={12} color={C.creamMut}/><span style={{ fontSize:13, color:C.creamSub }}>Editar</span>
        <span style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 10px", borderRadius:100, background:`${estadoInfo.color}14`, border:`1px solid ${estadoInfo.color}38`, color:estadoInfo.color, fontSize:11, fontWeight:700, fontFamily:FB }}><EIcon size={10} strokeWidth={2.5}/> {estadoInfo.label}</span>
        <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>ID <span style={{ color:C.orange, fontWeight:700 }}>#{id}</span></span>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>navigate("/admin/obras")} style={{ padding:"7px 16px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.creamSub, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB }}>Cancelar</button>
        <button form="editar-obra-form" type="submit" disabled={loading} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 18px", borderRadius:9, border:"none", background:loading?`${C.orange}40`:`linear-gradient(135deg,${C.orange},${C.magenta})`, color:"white", fontSize:13, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:FB, boxShadow:loading?"none":`0 4px 14px ${C.orange}30` }}>
          {loading?<><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> Guardando…</>:<><Save size={14} strokeWidth={2.5}/> Guardar Cambios</>}
        </button>
      </div>
    </div>
  );
}

/* ═══ Preview Card ═══ */
function ObraPreviewCard({form,previewSrc,currentArt,currentCat}:{form:FormState;previewSrc:string;currentArt?:Artista;currentCat?:Categoria}) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14, position:"relative", animation:"fadeUp .5s ease .05s both" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.orange},${C.gold},${C.pink})`, zIndex:1 }}/>
      <div style={{ height:130, background:previewSrc?"transparent":`linear-gradient(135deg,${C.orange}18,${C.gold}10,${C.pink}08)`, position:"relative", overflow:"hidden" }}>
        {previewSrc&&<img src={previewSrc} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>}
        {!previewSrc&&<div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}><ImageIcon size={26} strokeWidth={1} color={`${C.cream}14`}/><span style={{ fontSize:11, color:C.creamMut, fontFamily:FB }}>Vista previa</span></div>}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:40, background:`linear-gradient(transparent,${C.card})` }}/>
      </div>
      <div style={{ padding:"12px 16px 16px" }}>
        <div style={{ fontSize:14, fontWeight:900, color:form.titulo?C.cream:C.creamMut, fontFamily:form.titulo?FD:FB, marginBottom:4 }}>{form.titulo||"Título de la obra"}</div>
        {currentArt&&<div style={{ fontSize:12, color:C.creamSub, marginBottom:10, fontFamily:FB, display:"flex", alignItems:"center", gap:4 }}><Star size={8} color={C.gold} fill={C.gold}/>{currentArt.nombre_artistico||currentArt.nombre_completo}</div>}
        <div style={{ height:1, background:C.border, marginBottom:10 }}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          <div style={{ background:`${C.gold}0D`, border:`1px solid ${C.gold}20`, borderRadius:9, padding:"7px 10px" }}><div style={{ fontSize:9.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:3 }}>Precio</div><div style={{ fontSize:13, fontWeight:900, color:form.precio_base?C.gold:C.creamMut, fontFamily:FD }}>{form.precio_base?`$${fmt(form.precio_base)}`:"—"}</div></div>
          <div style={{ background:`${C.blue}0D`, border:`1px solid ${C.blue}20`, borderRadius:9, padding:"7px 10px" }}><div style={{ fontSize:9.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:3 }}>Categoría</div><div style={{ fontSize:12, fontWeight:700, color:currentCat?C.blue:C.creamMut, fontFamily:FB }}>{currentCat?.nombre||"—"}</div></div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Precio Card ═══ */
function PrecioCard({form,onChange,focused,loading,fi}:{form:FormState;onChange:(e:ChangeEvent<HTMLInputElement>)=>void;focused:string|null;loading:boolean;fi:(n:string)=>{onFocus:()=>void;onBlur:()=>void}}) {
  return (
    <Card accent={C.gold} icon={DollarSign} title="Precio" delay={0.08}>
      <Lbl req>Precio base (MXN)</Lbl>
      <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, fontWeight:900, color:C.gold, pointerEvents:"none", fontFamily:FD }}>$</span>
        <input type="number" name="precio_base" value={form.precio_base||""} onChange={onChange} placeholder="2500" step="0.01" min="0" required disabled={loading} style={{ ...IS(focused==="precio",loading), paddingLeft:28 }} {...fi("precio")}/>
      </div>
      {Number(form.precio_base)>0&&<div style={{ marginTop:10, padding:"9px 12px", borderRadius:9, background:`${C.gold}0D`, border:`1px solid ${C.gold}22`, display:"flex", justifyContent:"space-between", fontSize:13, color:C.gold, fontWeight:800, fontFamily:FD }}><span>Total</span><span>${fmt(form.precio_base)} MXN</span></div>}
    </Card>
  );
}

/* ═══ Imagen Card ═══ */
function ImgUploadWithCurrent({imgFile,imgPreview,fileRef,clearFile,dragOver,setDragOver,onDrop,currentImg}:{imgFile:File|null;imgPreview:string;fileRef:React.RefObject<HTMLInputElement>;clearFile:()=>void;dragOver:boolean;setDragOver:(v:boolean)=>void;onDrop:(e:React.DragEvent)=>void;currentImg:string}) {
  if (imgFile) {
    return (
      <div style={{ borderRadius:10, overflow:"hidden", position:"relative", border:`1.5px solid ${C.pink}45` }}>
        <img src={imgPreview} alt="preview" style={{ width:"100%", height:140, objectFit:"cover", display:"block" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"7px 10px", background:"linear-gradient(transparent,rgba(10,7,20,0.90))", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><FileImage size={11} color={C.pink}/><span style={{ fontSize:11, color:C.creamSub, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>{imgFile.name}</span></div>
          <span style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>{(imgFile.size/1024/1024).toFixed(1)} MB</span>
        </div>
        <button type="button" onClick={clearFile} style={{ position:"absolute", top:7, right:7, width:24, height:24, borderRadius:"50%", background:"rgba(10,7,20,0.80)", border:`1px solid ${C.pink}45`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={11} color={C.pink}/></button>
      </div>
    );
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {currentImg&&<div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, background:`${C.purple}0D`, border:`1px solid ${C.purple}22`, marginBottom:2 }}><img src={currentImg} alt="actual" style={{ width:34, height:34, borderRadius:7, objectFit:"cover", border:`1px solid ${C.purple}35` }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/><div><div style={{ fontSize:11.5, fontWeight:600, color:C.creamSub, fontFamily:FB }}>Imagen actual</div><div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>Sube una nueva para reemplazarla</div></div></div>}
      <div role="button" tabIndex={0} onClick={()=>fileRef.current?.click()} onKeyDown={e=>{if(e.key==="Enter")fileRef.current?.click();}}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
        style={{ borderRadius:10, border:`2px dashed ${dragOver?C.pink:C.inputBorder}`, height:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:7, cursor:"pointer", background:dragOver?`${C.pink}07`:C.input, transition:"all .2s" }}>
        <UploadCloud size={20} color={dragOver?C.pink:C.creamMut} strokeWidth={1.5}/><div style={{ textAlign:"center" }}><div style={{ fontSize:12, fontWeight:700, color:dragOver?C.pink:C.creamSub, fontFamily:FB }}>{dragOver?"Suelta aquí":"Arrastra o haz clic"}</div><div style={{ fontSize:10.5, color:C.creamMut, fontFamily:FB }}>JPG, PNG, WEBP · Máx 10 MB</div></div>
      </div>
    </div>
  );
}

function ImgUrlInput({form,onChange,clearFile,focused,loading,fi}:{form:FormState;onChange:(e:ChangeEvent<HTMLInputElement>)=>void;clearFile:()=>void;focused:string|null;loading:boolean;fi:(n:string)=>{onFocus:()=>void;onBlur:()=>void}}) {
  return (<>
    <Lbl><LinkIcon size={10}/> URL de imagen</Lbl>
    <input type="url" name="imagen_principal" value={form.imagen_principal||""} onChange={e=>{onChange(e);clearFile();}} placeholder="https://res.cloudinary.com/…" disabled={loading} style={IS(focused==="img",loading)} {...fi("img")}/>
    <div style={{ fontSize:11, color:C.creamMut, marginTop:6, fontFamily:FB }}>Cloudinary, Imgur u otro servicio público.</div>
    {form.imagen_principal&&<div style={{ marginTop:10, borderRadius:9, overflow:"hidden", border:`1.5px solid ${C.pink}35`, height:110 }}><img src={form.imagen_principal} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.3";}}/></div>}
  </>);
}

function ImagenCard({form,imgMode,setImgMode,imgFile,imgPreview,fileRef,clearFile,dragOver,setDragOver,onDrop,onChange,focused,loading,fi}:{
  form:FormState;imgMode:"upload"|"url";setImgMode:(m:"upload"|"url")=>void;imgFile:File|null;imgPreview:string;fileRef:React.RefObject<HTMLInputElement>;clearFile:()=>void;dragOver:boolean;setDragOver:(v:boolean)=>void;onDrop:(e:React.DragEvent)=>void;onChange:(e:ChangeEvent<HTMLInputElement>)=>void;focused:string|null;loading:boolean;fi:(n:string)=>{onFocus:()=>void;onBlur:()=>void};
}) {
  return (
    <Card accent={C.pink} icon={ImageIcon} title="Imagen principal" delay={0.12}>
      <div style={{ display:"flex", marginBottom:12, borderRadius:9, overflow:"hidden", border:`1px solid ${C.border}`, background:C.input }}>
        {(["upload","url"] as const).map(tab=>(<button key={tab} type="button" onClick={()=>setImgMode(tab)} style={{ flex:1, padding:"8px", border:"none", cursor:"pointer", fontFamily:FB, fontSize:12, fontWeight:imgMode===tab?800:500, background:imgMode===tab?`${C.pink}18`:"transparent", color:imgMode===tab?C.cream:C.creamMut, borderRight:tab==="upload"?`1px solid ${C.border}`:"none" }}>{tab==="upload"?<><UploadCloud size={11} style={{ marginRight:4, verticalAlign:"middle" }}/>Subir</>:<><LinkIcon size={11} style={{ marginRight:4, verticalAlign:"middle" }}/>URL</>}</button>))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}/>
      {imgMode==="upload"
        ? <ImgUploadWithCurrent imgFile={imgFile} imgPreview={imgPreview} fileRef={fileRef} clearFile={clearFile} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} currentImg={form.imagen_principal}/>
        : <ImgUrlInput form={form} onChange={onChange} clearFile={clearFile} focused={focused} loading={loading} fi={fi}/>}
    </Card>
  );
}

/* ═══ Panel de Revisión ═══ */
function getEstadoBtnStyle(key:string, selected:string, actual:string, loadingEstado:boolean) {
  const disabled = loadingEstado||selected===actual;
  if (disabled) return { bg:"rgba(255,232,200,0.06)", color:C.creamMut, shadow:"none" };
  if (key==="publicada"||selected==="publicada") return { bg:`linear-gradient(135deg,${C.green},${C.blue}80)`, color:"white", shadow:`0 4px 16px ${C.green}35` };
  if (key==="rechazada"||selected==="rechazada") return { bg:`linear-gradient(135deg,${C.pink},${C.purple}80)`, color:"white", shadow:`0 4px 16px ${C.pink}35` };
  return { bg:`linear-gradient(135deg,${C.gold}90,${C.orange}80)`, color:"white", shadow:`0 4px 16px ${C.gold}30` };
}

function getEstadoBtnLabel(selected:string, actual:string, loadingEstado:boolean) {
  if (loadingEstado) return { icon:Loader2, text:"Aplicando…" };
  if (selected===actual) return { icon:CheckCircle2, text:"Estado actual sin cambios" };
  if (selected==="publicada") return { icon:CheckCircle, text:"Aprobar y publicar obra" };
  if (selected==="rechazada") return { icon:XCircle, text:"Rechazar obra" };
  return { icon:Clock, text:`Cambiar a ${ESTADOS[selected]?.label}` };
}

function RevisionPanel({estadoActual,estadoSelected,setEstadoSelected,showMotivo,setShowMotivo,motivoRechazo,setMotivoRechazo,onCambiarEstado,loadingEstado,focused,fi}:{
  estadoActual:string;estadoSelected:string;setEstadoSelected:(s:string)=>void;showMotivo:boolean;setShowMotivo:(v:boolean)=>void;motivoRechazo:string;setMotivoRechazo:(v:string)=>void;onCambiarEstado:()=>void;loadingEstado:boolean;focused:string|null;fi:(n:string)=>{onFocus:()=>void;onBlur:()=>void};
}) {
  const estadoInfo = ESTADOS[estadoActual]||ESTADOS.pendiente;
  const EIcon = estadoInfo.icon;
  const btnStyle = getEstadoBtnStyle(estadoSelected, estadoSelected, estadoActual, loadingEstado);
  const btnLabel = getEstadoBtnLabel(estadoSelected, estadoActual, loadingEstado);
  const BtnIcon = btnLabel.icon;
  const disabled = loadingEstado||estadoSelected===estadoActual;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.green}22`, borderRadius:14, overflow:"hidden", marginBottom:14, position:"relative", animation:"fadeUp .5s ease .16s both" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.green},${C.blue}50,transparent)` }}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ width:30, height:30, borderRadius:9, background:`${C.green}14`, border:`1px solid ${C.green}28`, display:"flex", alignItems:"center", justifyContent:"center" }}><ShieldCheck size={14} color={C.green} strokeWidth={2.2}/></div>
        <span style={{ fontSize:13.5, fontWeight:800, color:C.cream, fontFamily:FD }}>Panel de revisión</span>
        <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${C.green}18,transparent)` }}/>
        <span style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:`${estadoInfo.color}14`, border:`1px solid ${estadoInfo.color}35`, color:estadoInfo.color, fontSize:11, fontWeight:700, fontFamily:FB }}><EIcon size={10} strokeWidth={2.5}/> {estadoInfo.label}</span>
      </div>
      <div style={{ padding:"18px 20px" }}>
        <div style={{ fontSize:12, color:C.creamMut, marginBottom:14, fontFamily:FB, display:"flex", alignItems:"center", gap:7, padding:"10px 14px", borderRadius:9, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.border}` }}><ShieldCheck size={12} color={C.green} strokeWidth={2}/>El cambio de estado usa un endpoint dedicado y seguro.</div>
        <EstadoSelector estadoSelected={estadoSelected} setEstadoSelected={setEstadoSelected} setShowMotivo={setShowMotivo}/>
        {showMotivo&&<div style={{ marginBottom:14, animation:"fadeUp .2s ease both" }}><Lbl><MessageSquare size={10}/> Motivo del rechazo</Lbl><textarea value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)} placeholder="Explica al artista qué debe corregir…" rows={3} style={{ ...IS(focused==="motivo",false), borderColor:`${C.pink}45` }} {...fi("motivo")}/></div>}
        <button type="button" onClick={onCambiarEstado} disabled={disabled}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:10, border:"none", background:btnStyle.bg, color:btnStyle.color, fontSize:13, fontWeight:800, cursor:disabled?"not-allowed":"pointer", fontFamily:FB, boxShadow:btnStyle.shadow, transition:"all .15s" }}>
          <BtnIcon size={14} style={loadingEstado?{animation:"spin 1s linear infinite"}:undefined}/> {btnLabel.text}
        </button>
      </div>
    </div>
  );
}

function EstadoSelector({estadoSelected,setEstadoSelected,setShowMotivo}:{estadoSelected:string;setEstadoSelected:(s:string)=>void;setShowMotivo:(v:boolean)=>void}) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
      {Object.entries(ESTADOS).map(([key,{label,color,icon:Icon,desc}])=>{
        const on=estadoSelected===key;
        return (
          <button key={key} type="button" onClick={()=>{setEstadoSelected(key);setShowMotivo(key==="rechazada");}}
            style={{ padding:"12px 8px", borderRadius:10, border:`1.5px solid ${on?`${color}55`:C.border}`, background:on?`${color}14`:"rgba(255,232,200,0.02)", color:on?color:C.creamSub, fontWeight:on?800:400, fontSize:11.5, cursor:"pointer", fontFamily:FB, transition:"all .15s", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            {on&&<div style={{ position:"absolute", top:5, right:5, width:5, height:5, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }}/>}
            <Icon size={15} color={on?color:C.creamMut} strokeWidth={on?2.2:1.8}/><span style={{ fontWeight:on?800:500 }}>{label}</span><span style={{ fontSize:10, color:on?`${color}90`:C.creamMut, fontWeight:400 }}>{desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══ Submit helper ═══ */
async function submitEditObra(id:string, form:FormState, imgFile:File|null): Promise<Response> {
  const headers = { Authorization:`Bearer ${authService.getToken()}` };
  if (imgFile) {
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>{ if(v!==""&&v!==null&&v!==undefined) fd.append(k,String(v)); });
    fd.append("imagen", imgFile);
    return fetch(`${API_URL}/api/obras/${id}`, { method:"PUT", headers, body:fd });
  }
  return fetch(`${API_URL}/api/obras/${id}`, { method:"PUT", headers:{...headers,"Content-Type":"application/json"}, body:JSON.stringify(form) });
}

/* ═══ ROOT ═══ */
export default function EditarObra() {
  const navigate = useNavigate();
  const { id } = useParams<{id:string}>();
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [focused, setFocused] = useState<string|null>(null);
  const [imgFile, setImgFile] = useState<File|null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [imgMode, setImgMode] = useState<"upload"|"url">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const [estadoActual, setEstadoActual] = useState("pendiente");
  const [estadoSelected, setEstadoSelected] = useState("pendiente");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showMotivo, setShowMotivo] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [form, setForm] = useState<FormState>({ titulo:"", descripcion:"", id_categoria:0, id_tecnica:0, id_artista:0, precio_base:0, anio_creacion:new Date().getFullYear(), dimensiones_alto:"", dimensiones_ancho:"", dimensiones_profundidad:"", permite_marco:true, con_certificado:false, imagen_principal:"" });

  useEffect(() => {
    (async () => {
      try {
        const [cR,tR,aR] = await Promise.all([obraService.getCategorias(), obraService.getTecnicas(), obraService.getArtistas()]);
        setCategorias(cR.categorias||[]); setTecnicas(tR.tecnicas||[]); setArtistas(aR.artistas||[]);
        const res = await fetch(`${API_URL}/api/obras/${id}`, { headers:{Authorization:`Bearer ${authService.getToken()}`} });
        if (!res.ok) { showToast(await handleApiError(res),"warn"); return; }
        const json = await res.json();
        if (json.success&&json.data) {
          const o=json.data;
          setForm({ titulo:o.titulo||"", descripcion:o.descripcion||"", id_categoria:o.id_categoria||0, id_tecnica:o.id_tecnica||0, id_artista:o.id_artista||0, precio_base:o.precio_base||0, anio_creacion:o.anio_creacion||new Date().getFullYear(), dimensiones_alto:o.dimensiones_alto||"", dimensiones_ancho:o.dimensiones_ancho||"", dimensiones_profundidad:o.dimensiones_profundidad||"", permite_marco:o.permite_marco??true, con_certificado:o.con_certificado??false, imagen_principal:o.imagen_principal||"" });
          setEstadoActual(o.estado||"pendiente"); setEstadoSelected(o.estado||"pendiente");
          if (o.imagen_principal) setImgMode("url");
        } else { showToast("No se encontró la obra","warn"); }
      } catch (err) { showToast(handleNetworkError(err),"err"); }
      finally { setLoadingData(false); }
    })();
  }, [id, showToast]);

  const onChange = (e:ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type==="checkbox") setForm(p=>({...p,[name]:(e.target as HTMLInputElement).checked}));
    else if (type==="number") setForm(p=>({...p,[name]:value===""?0:Number(value)}));
    else setForm(p=>({...p,[name]:value}));
    const err = validateFieldInline(name, value);
    if (err) setFieldErrors(p=>({...p,[name]:err}));
    else setFieldErrors(p=>{const n={...p}; delete n[name]; return n;});
  };

  const handleFile = (file:File) => {
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes","warn"); return; }
    if (file.size>10*1024*1024) { showToast("La imagen no puede superar 10 MB","warn"); return; }
    setImgFile(file); setImgPreview(URL.createObjectURL(file)); setForm(p=>({...p,imagen_principal:""}));
  };
  const clearFile = () => { if(imgPreview) URL.revokeObjectURL(imgPreview); setImgFile(null); setImgPreview(""); if(fileRef.current) fileRef.current.value=""; };
  const onDrop = (e:React.DragEvent) => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) handleFile(f); };

  useEffect(() => { const input=fileRef.current; if(!input) return; const h=()=>{const f=input.files?.[0]; if(f) handleFile(f);}; input.addEventListener("change",h); return ()=>input.removeEventListener("change",h); });

  const onSubmit = async (e:FormEvent) => {
    e.preventDefault();
    const error = validarObra(form);
    if (error) { showToast(error,"err"); return; }
    if (!form.id_categoria) { showToast("Selecciona una categoría","warn"); return; }
    if (!form.id_artista) { showToast("Selecciona un artista","warn"); return; }
    setLoading(true);
    try {
      const res = await submitEditObra(id!, form, imgFile);
      if (!res.ok) { showToast(await handleApiError(res),"err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message||"Error al actualizar","err"); return; }
      showToast("¡Obra actualizada correctamente!","ok");
    } catch (err) { showToast(handleNetworkError(err),"err"); }
    finally { setLoading(false); }
  };

  const handleCambiarEstado = async () => {
    if (estadoSelected==="rechazada"&&!motivoRechazo.trim()) { setShowMotivo(true); showToast("Escribe el motivo del rechazo","warn"); return; }
    setLoadingEstado(true);
    try {
      const res = await fetch(`${API_URL}/api/obras/${id}/estado`, { method:"PATCH", headers:{"Content-Type":"application/json",Authorization:`Bearer ${authService.getToken()}`}, body:JSON.stringify({estado:estadoSelected,motivo_rechazo:motivoRechazo||null}) });
      if (!res.ok) { showToast(await handleApiError(res),"err"); return; }
      const json = await res.json();
      if (!json.success) { showToast(json.message||"Error al cambiar estado","err"); return; }
      setEstadoActual(estadoSelected); setShowMotivo(false);
      showToast(json.message||`Estado actualizado a "${estadoSelected}"`,"ok");
    } catch (err) { showToast(handleNetworkError(err),"err"); }
    finally { setLoadingEstado(false); }
  };

  const fi = (n:string) => ({ onFocus:()=>setFocused(n), onBlur:()=>setFocused(null) });
  const previewSrc = imgPreview||form.imagen_principal||"";
  const currentCat = categorias.find(c=>c.id_categoria===Number(form.id_categoria));
  const currentArt = artistas.find(a=>a.id_artista===Number(form.id_artista));
  const estadoInfo = ESTADOS[estadoActual]||ESTADOS.pendiente;

  if (loadingData) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:C.bg, fontFamily:FB, flexDirection:"column", gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:10, overflow:"hidden", border:`1px solid ${C.borderBr}` }}><img src={logoImg} alt="Galería" style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>
      <div style={{ display:"flex", alignItems:"center", gap:10, color:C.creamSub, fontSize:14 }}><Loader2 size={16} style={{ animation:"spin 1s linear infinite", color:C.orange }}/> Cargando obra…</div>
    </div>
  );

  return (
    <>
      <EditarObraTopbar navigate={navigate} loading={loading} estadoInfo={estadoInfo} id={id}/>
      <main style={{ flex:1, padding:"22px 26px 28px", overflowY:"auto" }}>
        <div style={{ marginBottom:20, animation:"fadeUp .4s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}><Star size={9} color={C.gold} fill={C.gold}/><span style={{ fontSize:10.5, fontWeight:700, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:FB }}>Catálogo · Edición</span></div>
          <h1 style={{ fontSize:24, fontWeight:900, margin:0, fontFamily:FD, color:C.cream }}>Editar{" "}<span style={{ background:`linear-gradient(90deg,${C.orange},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{form.titulo||"Obra"}</span></h1>
        </div>
        <form id="editar-obra-form" onSubmit={onSubmit}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, alignItems:"start" }}>
            <div>
              <Card accent={C.orange} icon={Type} title="Información básica" delay={0.05}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div><Lbl req>Título</Lbl><input name="titulo" value={form.titulo} onChange={onChange} required disabled={loading} style={IS(focused==="titulo",loading,!!fieldErrors.titulo)} placeholder="Ej: Amanecer en la Huasteca" {...fi("titulo")}/><FieldError msg={fieldErrors.titulo}/></div>
                  <div><Lbl req><FileText size={10}/> Descripción</Lbl><textarea name="descripcion" value={form.descripcion} onChange={onChange} rows={4} required disabled={loading} placeholder="Describe la obra…" style={{ ...IS(focused==="desc",loading,!!fieldErrors.descripcion), resize:"vertical" as const }} {...fi("desc")}/><FieldError msg={fieldErrors.descripcion}/></div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <div><Lbl req><Tag size={10}/> Categoría</Lbl><select name="id_categoria" value={form.id_categoria} onChange={onChange} required disabled={loading} style={IS(focused==="cat",loading)} {...fi("cat")}><option value="0">Seleccionar…</option>{categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}</select></div>
                    <div><Lbl><Layers size={10}/> Técnica</Lbl><select name="id_tecnica" value={form.id_tecnica||""} onChange={onChange} disabled={loading} style={IS(focused==="tec",loading)} {...fi("tec")}><option value="">Sin técnica</option>{tecnicas.map(t=><option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}</select></div>
                    <div><Lbl req><Users size={10}/> Artista</Lbl><select name="id_artista" value={form.id_artista} onChange={onChange} required disabled={loading} style={IS(focused==="art",loading)} {...fi("art")}><option value="0">Seleccionar…</option>{artistas.map(a=><option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico||a.nombre_completo}</option>)}</select></div>
                    <div><Lbl><Calendar size={10}/> Año</Lbl><input type="number" name="anio_creacion" value={form.anio_creacion||""} onChange={onChange} min="1900" max={new Date().getFullYear()} disabled={loading} style={IS(focused==="anio",loading)} {...fi("anio")}/></div>
                  </div>
                </div>
              </Card>
              <Card accent={C.blue} icon={Ruler} title="Dimensiones (cm)" delay={0.08}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                  {([{name:"dimensiones_alto",label:"Alto",ph:"50"},{name:"dimensiones_ancho",label:"Ancho",ph:"70"},{name:"dimensiones_profundidad",label:"Profundidad",ph:"5"}] as const).map(({name,label,ph})=>(<div key={name}><Lbl>{label}</Lbl><input type="number" name={name} value={form[name]||""} onChange={onChange} placeholder={ph} step="0.01" min="0" disabled={loading} style={IS(focused===name,loading)} {...fi(name)}/></div>))}
                </div>
              </Card>
              <Card accent={C.purple} icon={Award} title="Opciones adicionales" delay={0.12}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Toggle label="Permite marco personalizado" name="permite_marco" checked={form.permite_marco} onChange={onChange} disabled={loading} icon={Frame} accent={C.purple}/>
                  <Toggle label="Incluye certificado" name="con_certificado" checked={form.con_certificado} onChange={onChange} disabled={loading} icon={Award} accent={C.gold}/>
                </div>
              </Card>
              <RevisionPanel estadoActual={estadoActual} estadoSelected={estadoSelected} setEstadoSelected={setEstadoSelected} showMotivo={showMotivo} setShowMotivo={setShowMotivo} motivoRechazo={motivoRechazo} setMotivoRechazo={setMotivoRechazo} onCambiarEstado={handleCambiarEstado} loadingEstado={loadingEstado} focused={focused} fi={fi}/>
            </div>
            <div>
              <ObraPreviewCard form={form} previewSrc={previewSrc} currentArt={currentArt} currentCat={currentCat}/>
              <PrecioCard form={form} onChange={onChange} focused={focused} loading={loading} fi={fi}/>
              <ImagenCard form={form} imgMode={imgMode} setImgMode={setImgMode} imgFile={imgFile} imgPreview={imgPreview} fileRef={fileRef as React.RefObject<HTMLInputElement>} clearFile={clearFile} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} onChange={onChange} focused={focused} loading={loading} fi={fi}/>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}