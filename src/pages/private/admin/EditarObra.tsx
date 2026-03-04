// src/pages/private/admin/EditarObra.tsx
// Estado se maneja via PATCH /api/obras/:id/estado — endpoint dedicado, protegido por requireRole('admin')
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Image as ImageIcon,
  CheckCircle2, Loader2, Users, Tag,
  Ruler, DollarSign, Frame, Award, Calendar,
  Link as LinkIcon, Type, FileText,
  LayoutDashboard, ShoppingBag, BarChart2, Settings, LogOut,
  Layers, Star, UploadCloud, X, FileImage,
  CheckCircle, XCircle, Clock, Package, ShieldCheck, MessageSquare,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { obraService } from "../../../services/obraService";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const C = {
  orange:"#FF840E", pink:"#CC59AD", magenta:"#CC4EA1", purple:"#8D4CCD", blue:"#79AAF5",
  gold:"#FFC110", green:"#22C97A", cream:"#FFF8EE", creamSub:"#D8CABC",
  creamMut:"rgba(255,232,200,0.38)", bg:"#0C0812", bgDeep:"#070510", panel:"#100D1C",
  card:"rgba(20,15,34,0.90)", border:"rgba(255,200,150,0.09)", borderBr:"rgba(118,78,49,0.24)",
  borderHi:"rgba(255,200,150,0.20)", input:"rgba(255,232,200,0.04)",
  inputBorder:"rgba(255,200,150,0.14)", inputFocus:"rgba(255,132,14,0.08)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:LayoutDashboard, color:C.orange, path:"/admin"          },
  { id:"obras",     label:"Obras",     icon:Layers,          color:C.blue,   path:"/admin/obras"    },
  { id:"artistas",  label:"Artistas",  icon:Users,           color:C.pink,   path:"/admin/artistas" },
  { id:"ventas",    label:"Ventas",    icon:ShoppingBag,     color:C.gold,   path:"/admin"          },
  { id:"reportes",  label:"Reportes",  icon:BarChart2,       color:C.purple, path:"/admin"          },
];

const ESTADOS: Record<string, { label:string; color:string; icon:React.ElementType; desc:string }> = {
  pendiente:{ label:"Pendiente", color:C.gold,    icon:Clock,       desc:"En revisión"           },
  publicada:{ label:"Publicada", color:C.green,   icon:CheckCircle, desc:"Visible en catálogo"   },
  rechazada:{ label:"Rechazada", color:C.pink,    icon:XCircle,     desc:"Requiere correcciones" },
  agotada:  { label:"Agotada",   color:C.creamMut,icon:Package,     desc:"Sin disponibilidad"    },
};

interface Categoria { id_categoria:number; nombre:string; }
interface Tecnica   { id_tecnica:number;   nombre:string; }
interface Artista   { id_artista:number;   nombre_completo:string; nombre_artistico?:string; }

// ── Logo ──────────────────────────────────────────────────────
function LogoMark({ size=38 }: { size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs><linearGradient id="lgEO3" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor={C.orange}/>
        <stop offset="55%"  stopColor={C.magenta}/>
        <stop offset="100%" stopColor={C.purple}/>
      </linearGradient></defs>
      <circle cx="20" cy="20" r="19" stroke="url(#lgEO3)" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M11 28V12L20 24V12M20 12V28" stroke="url(#lgEO3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 12h5a3 3 0 010 6h-5v0h5a3 3 0 010 6h-5V12z" stroke="url(#lgEO3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="33" cy="8" r="2.5" fill={C.gold}/>
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ navigate }: { navigate:(p:string) => void }) {
  const active   = "obras";
  const userName = authService.getUserName?.() || "Admin";
  return (
    <div style={{width:240,minHeight:"100vh",background:`linear-gradient(180deg,${C.panel} 0%,${C.bgDeep} 100%)`,borderRight:`1px solid ${C.borderBr}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0,zIndex:40}}>
      <div style={{height:3,background:`linear-gradient(90deg,${C.orange},${C.gold},${C.pink},${C.purple},${C.blue})`}}/>
      <div style={{padding:"22px 22px 18px",borderBottom:`1px solid ${C.borderBr}`}}>
        <div onClick={()=>navigate("/")} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:20}}>
          <LogoMark size={40}/>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:C.cream,fontFamily:FD}}>Nu-B Studio</div>
            <div style={{fontSize:10,color:C.orange,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:FB,fontWeight:700}}>Panel Admin</div>
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,rgba(118,78,49,0.20),rgba(255,132,14,0.08))`,border:`1px solid ${C.borderBr}`,borderRadius:14,padding:"13px 14px",display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"white",fontFamily:FB}}>{userName?.[0]?.toUpperCase()||"A"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.cream,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FB}}>{userName}</div>
            <div style={{fontSize:11,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:FB}}>Administrador</div>
          </div>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,boxShadow:`0 0 7px ${C.green}`}}/>
        </div>
      </div>
      <div style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
        <div style={{fontSize:10.5,fontWeight:800,color:C.creamMut,letterSpacing:"0.16em",textTransform:"uppercase",padding:"0 10px 12px",fontFamily:FB}}>Navegación</div>
        {NAV.map(({id,label,icon:Icon,color,path})=>{
          const on=active===id;
          return (
            <button key={id} onClick={()=>navigate(path)} style={{width:"100%",border:on?`1px solid ${color}30`:"1px solid transparent",cursor:"pointer",background:on?`linear-gradient(135deg,${color}18,${color}08)`:"transparent",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,transition:"all .18s",position:"relative",fontFamily:FB}}
              onMouseEnter={e=>{if(!on){(e.currentTarget as HTMLElement).style.background="rgba(255,232,200,0.05)";(e.currentTarget as HTMLElement).style.borderColor=C.borderHi;}}}
              onMouseLeave={e=>{if(!on){(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.borderColor="transparent";}}}>
              {on&&<div style={{position:"absolute",left:0,top:"18%",bottom:"18%",width:3,borderRadius:"0 3px 3px 0",background:`linear-gradient(180deg,${color},${color}70)`,boxShadow:`0 0 10px ${color}60`}}/>}
              <div style={{width:36,height:36,borderRadius:10,background:on?`${color}22`:"rgba(255,232,200,0.06)",border:on?`1px solid ${color}30`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={17} color={on?color:C.creamMut} strokeWidth={on?2.2:1.8}/>
              </div>
              <span style={{fontSize:14.5,fontWeight:on?700:500,color:on?C.cream:C.creamSub,fontFamily:FB}}>{label}</span>
              {on&&<div style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 9px ${color}`}}/>}
            </button>
          );
        })}
      </div>
      <div style={{padding:"14px 12px 20px",borderTop:`1px solid ${C.borderBr}`}}>
        <div style={{display:"flex",gap:6}}>
          <button style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:"rgba(255,232,200,0.03)",cursor:"pointer",fontSize:12.5,color:C.creamSub,fontWeight:600,fontFamily:FB,transition:"all .15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.borderHi;(e.currentTarget as HTMLElement).style.color=C.cream;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.creamSub;}}
          ><Settings size={14} strokeWidth={1.8}/> Config</button>
          <button onClick={()=>{authService.logout();navigate("/login");}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:10,border:`1px solid ${C.pink}30`,background:`${C.pink}08`,cursor:"pointer",fontSize:12.5,color:C.pink,fontWeight:600,fontFamily:FB,transition:"all .15s"}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}18`}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`${C.pink}08`}
          ><LogOut size={14} strokeWidth={1.8}/> Salir</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function IS(focused:boolean, disabled:boolean): React.CSSProperties {
  return {width:"100%",padding:"11px 14px",boxSizing:"border-box",background:focused?C.inputFocus:C.input,border:`1.5px solid ${focused?C.orange:C.inputBorder}`,borderRadius:10,fontSize:13.5,color:C.cream,outline:"none",transition:"border-color .15s, background .15s",fontFamily:FB,opacity:disabled?0.5:1};
}
function Lbl({children,req}:{children:React.ReactNode;req?:boolean}) {
  return <div style={{fontSize:11,fontWeight:700,color:C.creamMut,marginBottom:7,display:"flex",alignItems:"center",gap:5,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:FB}}>{children}{req&&<span style={{color:C.orange}}>*</span>}</div>;
}
function Card({accent,icon:Icon,title,children,delay=0}:{accent:string;icon:React.ElementType;title:string;children:React.ReactNode;delay?:number}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden",marginBottom:14,backdropFilter:"blur(20px)",position:"relative",animation:`fadeUp .5s ease ${delay}s both`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${accent},${accent}50,transparent)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{width:30,height:30,borderRadius:9,background:`${accent}20`,border:`1px solid ${accent}35`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${accent}25`}}>
          <Icon size={14} color={accent} strokeWidth={2.2}/>
        </div>
        <span style={{fontSize:13.5,fontWeight:800,color:C.cream,fontFamily:FD}}>{title}</span>
        <div style={{height:1,flex:1,background:`linear-gradient(90deg,${accent}20,transparent)`}}/>
      </div>
      <div style={{padding:"18px 20px"}}>{children}</div>
    </div>
  );
}
function Toggle({label,name,checked,onChange,disabled,icon:Icon,accent}:{
  label:string; name:string; checked:boolean;
  onChange:(e:ChangeEvent<HTMLInputElement>)=>void;
  disabled:boolean; icon:React.ElementType; accent:string;
}) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",borderRadius:12,cursor:disabled?"not-allowed":"pointer",border:`1.5px solid ${checked?`${accent}55`:C.border}`,background:checked?`${accent}12`:"rgba(255,232,200,0.02)",transition:"all .15s",userSelect:"none" as const}}>
      <div style={{width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${checked?accent:C.creamMut}`,background:checked?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",boxShadow:checked?`0 0 8px ${accent}40`:"none"}}>
        {checked&&<CheckCircle2 size={11} color="white" strokeWidth={3}/>}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{display:"none"}}/>
      <Icon size={14} color={checked?accent:C.creamMut} strokeWidth={2}/>
      <span style={{fontSize:13,fontWeight:checked?700:400,color:checked?C.cream:C.creamSub,fontFamily:FB}}>{label}</span>
    </label>
  );
}

// ── Tipo para acceso dinámico de dimensiones ──────────────────
type FormState = {
  titulo:string; descripcion:string; id_categoria:number; id_tecnica:number; id_artista:number;
  precio_base:number; anio_creacion:number;
  dimensiones_alto:string; dimensiones_ancho:string; dimensiones_profundidad:string;
  permite_marco:boolean; con_certificado:boolean; imagen_principal:string;
};

// ─── MAIN ─────────────────────────────────────────────────────
export default function EditarObra() {
  const navigate      = useNavigate();
  const { id }        = useParams<{ id:string }>();
  const fileRef       = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading,       setLoading]       = useState(false);
  const [loadingData,   setLoadingData]   = useState(true);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [focused,       setFocused]       = useState<string|null>(null);
  const [imgFile,       setImgFile]       = useState<File|null>(null);
  const [imgPreview,    setImgPreview]    = useState<string>("");
  const [imgMode,       setImgMode]       = useState<"upload"|"url">("upload");
  const [dragOver,      setDragOver]      = useState(false);

  const [estadoActual,   setEstadoActual]   = useState("pendiente");
  const [estadoSelected, setEstadoSelected] = useState("pendiente");
  const [motivoRechazo,  setMotivoRechazo]  = useState("");
  const [showMotivo,     setShowMotivo]     = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tecnicas,   setTecnicas]   = useState<Tecnica[]>([]);
  const [artistas,   setArtistas]   = useState<Artista[]>([]);

  const [form, setForm] = useState<FormState>({
    titulo:"", descripcion:"", id_categoria:0, id_tecnica:0, id_artista:0,
    precio_base:0, anio_creacion:new Date().getFullYear(),
    dimensiones_alto:"", dimensiones_ancho:"", dimensiones_profundidad:"",
    permite_marco:true, con_certificado:false, imagen_principal:"",
  });

  useEffect(()=>{
    (async()=>{
      try {
        const [cR,tR,aR] = await Promise.all([
          obraService.getCategorias(), obraService.getTecnicas(), obraService.getArtistas(),
        ]);
        setCategorias(cR.categorias||[]);
        setTecnicas(tR.tecnicas||[]);
        setArtistas(aR.artistas||[]);

        const res = await fetch(`${API_URL}/api/obras/${id}`,{headers:{Authorization:`Bearer ${authService.getToken()}`}});
        if (!res.ok) { showToast(await handleApiError(res),"warn"); return; }
        const json = await res.json();
        if (json.success && json.data) {
          const o = json.data;
          setForm({
            titulo:o.titulo||"", descripcion:o.descripcion||"",
            id_categoria:o.id_categoria||0, id_tecnica:o.id_tecnica||0,
            id_artista:o.id_artista||0, precio_base:o.precio_base||0,
            anio_creacion:o.anio_creacion||new Date().getFullYear(),
            dimensiones_alto:o.dimensiones_alto||"", dimensiones_ancho:o.dimensiones_ancho||"",
            dimensiones_profundidad:o.dimensiones_profundidad||"",
            permite_marco:o.permite_marco??true, con_certificado:o.con_certificado??false,
            imagen_principal:o.imagen_principal||"",
          });
          setEstadoActual(o.estado||"pendiente");
          setEstadoSelected(o.estado||"pendiente");
          if (o.imagen_principal) setImgMode("url");
        } else {
          showToast("No se encontró la obra","warn");
        }
      } catch(err) {
        showToast(handleNetworkError(err),"err");
      } finally { setLoadingData(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[id]);

  const onChange = (e:ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>{
    const {name,value,type}=e.target;
    if (type==="checkbox") setForm(p=>({...p,[name]:(e.target as HTMLInputElement).checked}));
    else if (type==="number") setForm(p=>({...p,[name]:value===""?0:Number(value)}));
    else setForm(p=>({...p,[name]:value}));
  };

  const handleFile = (file:File)=>{
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes","warn"); return; }
    if (file.size>10*1024*1024) { showToast("La imagen no puede superar 10 MB","warn"); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setForm(p=>({...p,imagen_principal:""}));
  };

  const clearFile = ()=>{
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(null); setImgPreview("");
    if (fileRef.current) fileRef.current.value="";
  };

  const onDrop = (e:React.DragEvent)=>{
    e.preventDefault(); setDragOver(false);
    const f=e.dataTransfer.files[0]; if(f) handleFile(f);
  };

  // ── PUT: solo datos de la obra, SIN estado ───────────────────
  const onSubmit = async (e:FormEvent)=>{
    e.preventDefault();
    if (!form.titulo||!form.descripcion) { showToast("Completa título y descripción","warn"); return; }
    if (!form.id_categoria) { showToast("Selecciona una categoría","warn"); return; }
    if (!form.id_artista)   { showToast("Selecciona un artista","warn"); return; }
    setLoading(true);
    try {
      let res:Response;
      if (imgFile) {
        const fd=new FormData();
        Object.entries(form).forEach(([k,v])=>{ if(v!==""&&v!==null&&v!==undefined) fd.append(k,String(v)); });
        fd.append("imagen",imgFile);
        res=await fetch(`${API_URL}/api/obras/${id}`,{method:"PUT",headers:{Authorization:`Bearer ${authService.getToken()}`},body:fd});
      } else {
        res=await fetch(`${API_URL}/api/obras/${id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${authService.getToken()}`},body:JSON.stringify(form)});
      }
      if (!res.ok) { showToast(await handleApiError(res),"err"); return; }
      const json=await res.json();
      if (!json.success) { showToast(json.message||"Error al actualizar","err"); return; }
      showToast("¡Obra actualizada correctamente!","ok");
    } catch(err){
      showToast(handleNetworkError(err),"err");
    } finally { setLoading(false); }
  };

  // ── PATCH /api/obras/:id/estado ───────────────────────────────
  const handleCambiarEstado = async ()=>{
    if (estadoSelected==="rechazada"&&!motivoRechazo.trim()){ setShowMotivo(true); showToast("Escribe el motivo del rechazo","warn"); return; }
    setLoadingEstado(true);
    try {
      const res=await fetch(`${API_URL}/api/obras/${id}/estado`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${authService.getToken()}`},
        body:JSON.stringify({estado:estadoSelected,motivo_rechazo:motivoRechazo||null}),
      });
      if (!res.ok) { showToast(await handleApiError(res),"err"); return; }
      const json=await res.json();
      if (!json.success) { showToast(json.message||"Error al cambiar estado","err"); return; }
      setEstadoActual(estadoSelected);
      setShowMotivo(false);
      showToast(json.message||`Estado actualizado a "${estadoSelected}"`,"ok");
    } catch(err){
      showToast(handleNetworkError(err),"err");
    } finally { setLoadingEstado(false); }
  };

  const fi = (n:string)=>({onFocus:()=>setFocused(n),onBlur:()=>setFocused(null)});
  const previewSrc = imgPreview||form.imagen_principal||"";
  const currentCat = categorias.find(c=>c.id_categoria===Number(form.id_categoria));
  const currentArt = artistas.find(a=>a.id_artista===Number(form.id_artista));
  const estadoInfo = ESTADOS[estadoActual]||ESTADOS.pendiente;
  const EIcon      = estadoInfo.icon;

  if (loadingData) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.bg,fontFamily:FB,flexDirection:"column",gap:16}}>
      <LogoMark size={52}/>
      <div style={{display:"flex",alignItems:"center",gap:10,color:C.creamSub,fontSize:14}}>
        <Loader2 size={18} style={{animation:"spin 1s linear infinite",color:C.orange}}/> Cargando obra…
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:FB,color:C.cream,position:"relative"}}>
      <div style={{position:"fixed",top:-160,right:-120,width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,${C.pink}09,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-100,left:200,width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${C.purple}08,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"45%",right:"30%",width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,${C.orange}05,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      <Sidebar navigate={navigate}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,position:"relative",zIndex:1}}>

        {/* TOPBAR */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:64,background:"rgba(10,7,20,0.90)",borderBottom:`1px solid ${C.borderBr}`,backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:30}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>navigate("/admin/obras")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,232,200,0.04)",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 14px",cursor:"pointer",color:C.creamMut,fontSize:13,fontWeight:600,fontFamily:FB,transition:"all .15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${C.orange}50`;(e.currentTarget as HTMLElement).style.color=C.orange;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.creamMut;}}
            ><ArrowLeft size={14} strokeWidth={2}/> Obras</button>
            <div style={{width:1,height:22,background:C.borderBr}}/>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <span style={{fontSize:17,fontWeight:900,color:C.cream,fontFamily:FD}}>Editar Obra</span>
                <span style={{display:"flex",alignItems:"center",gap:5,padding:"3px 11px",borderRadius:20,background:`${estadoInfo.color}18`,border:`1px solid ${estadoInfo.color}40`,color:estadoInfo.color,fontSize:11.5,fontWeight:800,fontFamily:FB,boxShadow:estadoActual==="publicada"?`0 0 10px ${C.green}30`:"none"}}>
                  <EIcon size={11} strokeWidth={2.5}/> {estadoInfo.label}
                </span>
              </div>
              <div style={{fontSize:11.5,color:C.creamMut,marginTop:2,fontFamily:FB}}>ID <span style={{color:C.orange,fontWeight:700}}>#{id}</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>navigate("/admin/obras")} style={{padding:"9px 18px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.creamSub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FB,transition:"all .15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.borderHi;(e.currentTarget as HTMLElement).style.color=C.cream;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.creamSub;}}
            >Cancelar</button>
            <button form="editar-obra-form" type="submit" disabled={loading} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 22px",borderRadius:9,border:"none",background:loading?`${C.orange}40`:`linear-gradient(135deg,${C.orange},${C.magenta})`,color:"white",fontSize:13.5,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:FB,boxShadow:loading?"none":`0 6px 24px ${C.orange}45`,transition:"transform .15s, box-shadow .15s"}}
              onMouseEnter={e=>{if(!loading){(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 10px 32px ${C.orange}60`;}}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow=loading?"none":`0 6px 24px ${C.orange}45`;}}
            >{loading?<><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> Guardando…</>:<><Save size={15} strokeWidth={2.5}/> Guardar Cambios</>}</button>
          </div>
        </div>

        <main style={{flex:1,padding:"28px 32px",overflowY:"auto"}}>
          <div style={{marginBottom:24,animation:"fadeUp .4s ease both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <Star size={12} color={C.gold} fill={C.gold}/>
              <span style={{fontSize:10.5,fontWeight:700,color:C.creamMut,textTransform:"uppercase",letterSpacing:"0.14em",fontFamily:FB}}>Catálogo · Edición</span>
            </div>
            <h1 style={{fontSize:26,fontWeight:900,margin:0,fontFamily:FD,color:C.cream}}>
              Editar{" "}
              <span style={{background:`linear-gradient(90deg,${C.orange},${C.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                {form.titulo||"Obra"}
              </span>
            </h1>
          </div>

          <form id="editar-obra-form" onSubmit={onSubmit}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>

              {/* IZQUIERDA */}
              <div>
                <Card accent={C.orange} icon={Type} title="Información básica" delay={0.05}>
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div>
                      <Lbl req>Título de la obra</Lbl>
                      <input name="titulo" value={form.titulo} onChange={onChange} required disabled={loading} style={IS(focused==="titulo",loading)} placeholder="Ej: Amanecer en la Huasteca" {...fi("titulo")}/>
                    </div>
                    <div>
                      <Lbl req><FileText size={10}/> Descripción</Lbl>
                      <textarea name="descripcion" value={form.descripcion} onChange={onChange} rows={4} required disabled={loading} placeholder="Describe la obra, técnica, inspiración…" style={{...IS(focused==="desc",loading),resize:"vertical" as const}} {...fi("desc")}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div>
                        <Lbl req><Tag size={10}/> Categoría</Lbl>
                        <select name="id_categoria" value={form.id_categoria} onChange={onChange} required disabled={loading} style={IS(focused==="cat",loading)} {...fi("cat")}>
                          <option value="0">Seleccionar…</option>
                          {categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl><Layers size={10}/> Técnica</Lbl>
                        <select name="id_tecnica" value={form.id_tecnica||""} onChange={onChange} disabled={loading} style={IS(focused==="tec",loading)} {...fi("tec")}>
                          <option value="">Sin técnica</option>
                          {tecnicas.map(t=><option key={t.id_tecnica} value={t.id_tecnica}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl req><Users size={10}/> Artista</Lbl>
                        <select name="id_artista" value={form.id_artista} onChange={onChange} required disabled={loading} style={IS(focused==="art",loading)} {...fi("art")}>
                          <option value="0">Seleccionar…</option>
                          {artistas.map(a=><option key={a.id_artista} value={a.id_artista}>{a.nombre_artistico||a.nombre_completo}</option>)}
                        </select>
                      </div>
                      <div>
                        <Lbl><Calendar size={10}/> Año de creación</Lbl>
                        <input type="number" name="anio_creacion" value={form.anio_creacion||""} onChange={onChange} min="1900" max={new Date().getFullYear()} disabled={loading} style={IS(focused==="anio",loading)} {...fi("anio")}/>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card accent={C.blue} icon={Ruler} title="Dimensiones (cm)" delay={0.1}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {([
                      {name:"dimensiones_alto",       label:"Alto",       ph:"50"},
                      {name:"dimensiones_ancho",      label:"Ancho",      ph:"70"},
                      {name:"dimensiones_profundidad",label:"Profundidad",ph:"5" },
                    ] as const).map(({name,label,ph})=>(
                      <div key={name}>
                        <Lbl>{label}</Lbl>
                        <input type="number" name={name} value={form[name]||""} onChange={onChange} placeholder={ph} step="0.01" min="0" disabled={loading} style={IS(focused===name,loading)} {...fi(name)}/>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card accent={C.purple} icon={Award} title="Opciones adicionales" delay={0.15}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <Toggle label="Permite marco personalizado"         name="permite_marco"   checked={form.permite_marco}   onChange={onChange} disabled={loading} icon={Frame} accent={C.purple}/>
                    <Toggle label="Incluye certificado de autenticidad" name="con_certificado" checked={form.con_certificado} onChange={onChange} disabled={loading} icon={Award} accent={C.gold}/>
                  </div>
                </Card>

                {/* Panel de revisión */}
                <div style={{background:C.card,border:`1px solid ${C.green}28`,borderRadius:18,overflow:"hidden",marginBottom:14,backdropFilter:"blur(20px)",position:"relative",animation:"fadeUp .5s ease .2s both"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.green},${C.blue}50,transparent)`}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{width:30,height:30,borderRadius:9,background:`${C.green}20`,border:`1px solid ${C.green}35`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${C.green}25`}}>
                      <ShieldCheck size={14} color={C.green} strokeWidth={2.2}/>
                    </div>
                    <span style={{fontSize:13.5,fontWeight:800,color:C.cream,fontFamily:FD}}>Panel de revisión</span>
                    <div style={{height:1,flex:1,background:`linear-gradient(90deg,${C.green}20,transparent)`}}/>
                    <span style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:`${estadoInfo.color}15`,border:`1px solid ${estadoInfo.color}40`,color:estadoInfo.color,fontSize:11.5,fontWeight:800,fontFamily:FB}}>
                      <EIcon size={11}/> {estadoInfo.label}
                    </span>
                  </div>
                  <div style={{padding:"18px 20px"}}>
                    <div style={{fontSize:12,color:C.creamMut,marginBottom:14,fontFamily:FB,display:"flex",alignItems:"center",gap:7,padding:"10px 14px",borderRadius:10,background:"rgba(255,200,150,0.04)",border:`1px solid ${C.border}`}}>
                      <ShieldCheck size={13} color={C.green} strokeWidth={2}/>
                      El cambio de estado usa un endpoint dedicado y seguro, independiente de la edición.
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                      {Object.entries(ESTADOS).map(([key,{label,color,icon:Icon,desc}])=>{
                        const on=estadoSelected===key;
                        return (
                          <button key={key} type="button" onClick={()=>{ setEstadoSelected(key); setShowMotivo(key==="rechazada"); }}
                            style={{padding:"13px 8px",borderRadius:12,border:`1.5px solid ${on?`${color}65`:C.border}`,background:on?`${color}18`:"rgba(255,232,200,0.02)",color:on?color:C.creamSub,fontWeight:on?800:400,fontSize:12,cursor:"pointer",fontFamily:FB,transition:"all .15s",boxShadow:on?`0 4px 18px ${color}28`:"none",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}
                            onMouseEnter={e=>{if(!on)(e.currentTarget as HTMLElement).style.borderColor=`${color}40`;}}
                            onMouseLeave={e=>{if(!on)(e.currentTarget as HTMLElement).style.borderColor=C.border;}}
                          >
                            {on&&<div style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:color,boxShadow:`0 0 6px ${color}`}}/>}
                            <Icon size={16} color={on?color:C.creamMut} strokeWidth={on?2.2:1.8}/>
                            <span style={{fontWeight:on?800:500}}>{label}</span>
                            <span style={{fontSize:10,color:on?`${color}90`:C.creamMut,fontWeight:400}}>{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showMotivo&&(
                      <div style={{marginBottom:14,animation:"fadeUp .2s ease both"}}>
                        <Lbl><MessageSquare size={10}/> Motivo del rechazo</Lbl>
                        <textarea value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)}
                          placeholder="Explica al artista qué debe corregir para que su obra sea aprobada…"
                          rows={3} style={{...IS(focused==="motivo",false),resize:"vertical" as const,borderColor:`${C.pink}50`}} {...fi("motivo")}/>
                      </div>
                    )}
                    <button type="button" onClick={handleCambiarEstado} disabled={loadingEstado||estadoSelected===estadoActual}
                      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:12,border:"none",
                        background:(loadingEstado||estadoSelected===estadoActual)?"rgba(255,232,200,0.06)":
                          estadoSelected==="publicada"?`linear-gradient(135deg,${C.green},${C.blue}80)`:
                          estadoSelected==="rechazada"?`linear-gradient(135deg,${C.pink},${C.purple}80)`:
                          `linear-gradient(135deg,${C.gold}90,${C.orange}80)`,
                        color:(loadingEstado||estadoSelected===estadoActual)?C.creamMut:"white",
                        fontSize:13.5,fontWeight:800,cursor:(loadingEstado||estadoSelected===estadoActual)?"not-allowed":"pointer",
                        fontFamily:FB,transition:"all .15s",
                        boxShadow:(loadingEstado||estadoSelected===estadoActual)?"none":
                          estadoSelected==="publicada"?`0 6px 22px ${C.green}40`:
                          estadoSelected==="rechazada"?`0 6px 22px ${C.pink}40`:`0 6px 22px ${C.gold}35`}}
                    >
                      {loadingEstado?<><Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> Aplicando…</>:
                       estadoSelected===estadoActual?<><CheckCircle2 size={15}/> Estado actual sin cambios</>:
                       estadoSelected==="publicada"?<><CheckCircle size={15}/> Aprobar y publicar obra</>:
                       estadoSelected==="rechazada"?<><XCircle size={15}/> Rechazar obra</>:
                       <><Clock size={15}/> Cambiar a {ESTADOS[estadoSelected]?.label}</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* DERECHA */}
              <div>
                {/* Preview */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",marginBottom:14,backdropFilter:"blur(20px)",position:"relative",animation:"fadeUp .5s ease .05s both"}}>
                  <div style={{height:140,background:previewSrc?"transparent":`linear-gradient(135deg,${C.orange}20,${C.gold}12,${C.pink}10)`,position:"relative",overflow:"hidden"}}>
                    {previewSrc&&<img src={previewSrc} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>}
                    {!previewSrc&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}><ImageIcon size={28} strokeWidth={1} color={`${C.cream}18`}/><span style={{fontSize:11,color:C.creamMut,fontFamily:FB}}>Vista previa</span></div>}
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:50,background:`linear-gradient(transparent,${C.card})`}}/>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.orange},${C.gold},${C.pink})`}}/>
                  </div>
                  <div style={{padding:"14px 18px 18px"}}>
                    <div style={{fontSize:15,fontWeight:900,color:form.titulo?C.cream:C.creamMut,fontFamily:form.titulo?FD:FB,marginBottom:6}}>{form.titulo||"Título de la obra"}</div>
                    {currentArt&&<div style={{fontSize:12,color:C.creamSub,marginBottom:10,fontFamily:FB,display:"flex",alignItems:"center",gap:5}}><Star size={9} color={C.gold} fill={C.gold}/>{currentArt.nombre_artistico||currentArt.nombre_completo}</div>}
                    <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.borderBr},transparent)`,marginBottom:12}}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:`${C.gold}10`,border:`1px solid ${C.gold}22`,borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:C.creamMut,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:FB,marginBottom:3}}>Precio</div>
                        <div style={{fontSize:13,fontWeight:900,color:form.precio_base?C.gold:C.creamMut,fontFamily:FD}}>{form.precio_base?`$${Number(form.precio_base).toLocaleString("es-MX")}`:"—"}</div>
                      </div>
                      <div style={{background:`${C.blue}10`,border:`1px solid ${C.blue}20`,borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:C.creamMut,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:FB,marginBottom:3}}>Categoría</div>
                        <div style={{fontSize:12.5,fontWeight:700,color:currentCat?C.blue:C.creamMut,fontFamily:FB}}>{currentCat?.nombre||"—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precio */}
                <Card accent={C.gold} icon={DollarSign} title="Precio" delay={0.1}>
                  <Lbl req>Precio base (MXN)</Lbl>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,fontWeight:900,color:C.gold,pointerEvents:"none",fontFamily:FD}}>$</span>
                    <input type="number" name="precio_base" value={form.precio_base||""} onChange={onChange} placeholder="2,500" step="0.01" min="0" required disabled={loading} style={{...IS(focused==="precio",loading),paddingLeft:30}} {...fi("precio")}/>
                  </div>
                  {Number(form.precio_base)>0&&(
                    <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:`${C.gold}10`,border:`1px solid ${C.gold}25`,display:"flex",justifyContent:"space-between",fontSize:13.5,color:C.gold,fontWeight:800,fontFamily:FD}}>
                      <span>Total</span><span>${Number(form.precio_base).toLocaleString("es-MX")} MXN</span>
                    </div>
                  )}
                </Card>

                {/* Imagen */}
                <Card accent={C.pink} icon={ImageIcon} title="Imagen principal" delay={0.15}>
                  <div style={{display:"flex",marginBottom:14,borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`,background:C.input}}>
                    {(["upload","url"] as const).map(tab=>(
                      <button key={tab} type="button" onClick={()=>setImgMode(tab)} style={{flex:1,padding:"9px",border:"none",cursor:"pointer",fontFamily:FB,fontSize:12.5,fontWeight:imgMode===tab?800:500,background:imgMode===tab?`linear-gradient(135deg,${C.pink}25,${C.purple}15)`:"transparent",color:imgMode===tab?C.cream:C.creamMut,borderRight:tab==="upload"?`1px solid ${C.border}`:"none",transition:"all .15s"}}>
                        {tab==="upload"?<><UploadCloud size={12} style={{marginRight:5,verticalAlign:"middle"}}/>Subir archivo</>:<><LinkIcon size={12} style={{marginRight:5,verticalAlign:"middle"}}/>URL externa</>}
                      </button>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
                  {imgMode==="upload"?(
                    imgFile?(
                      <div style={{borderRadius:12,overflow:"hidden",position:"relative",border:`1.5px solid ${C.pink}50`}}>
                        <img src={imgPreview} alt="preview" style={{width:"100%",height:150,objectFit:"cover",display:"block"}}/>
                        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"8px 12px",background:"linear-gradient(transparent,rgba(10,7,20,0.92))",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <FileImage size={12} color={C.pink}/>
                            <span style={{fontSize:11.5,color:C.creamSub,fontFamily:FB,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}}>{imgFile.name}</span>
                          </div>
                          <span style={{fontSize:11,color:C.creamMut,fontFamily:FB}}>{(imgFile.size/1024/1024).toFixed(1)} MB</span>
                        </div>
                        <button type="button" onClick={clearFile} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(10,7,20,0.80)",border:`1px solid ${C.pink}50`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                          <X size={12} color={C.pink}/>
                        </button>
                      </div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {form.imagen_principal&&(
                          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:`${C.purple}10`,border:`1px solid ${C.purple}25`,marginBottom:4}}>
                            <img src={form.imagen_principal} alt="actual" style={{width:36,height:36,borderRadius:8,objectFit:"cover",border:`1px solid ${C.purple}40`}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                            <div>
                              <div style={{fontSize:11.5,fontWeight:600,color:C.creamSub,fontFamily:FB}}>Imagen actual</div>
                              <div style={{fontSize:10.5,color:C.creamMut,fontFamily:FB}}>Sube una nueva para reemplazarla</div>
                            </div>
                          </div>
                        )}
                        <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
                          style={{borderRadius:12,border:`2px dashed ${dragOver?C.pink:C.inputBorder}`,height:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",background:dragOver?`${C.pink}08`:C.input,transition:"all .2s"}}>
                          <UploadCloud size={22} color={dragOver?C.pink:C.creamMut} strokeWidth={1.5}/>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:12.5,fontWeight:700,color:dragOver?C.pink:C.creamSub,fontFamily:FB}}>{dragOver?"Suelta aquí":"Arrastra o haz clic"}</div>
                            <div style={{fontSize:11,color:C.creamMut,fontFamily:FB}}>JPG, PNG, WEBP · Máx 10 MB</div>
                          </div>
                        </div>
                      </div>
                    )
                  ):(
                    <>
                      <Lbl><LinkIcon size={10}/> URL de imagen</Lbl>
                      <input type="url" name="imagen_principal" value={form.imagen_principal||""} onChange={e=>{onChange(e);clearFile();}} placeholder="https://res.cloudinary.com/…/imagen.jpg" disabled={loading} style={IS(focused==="img",loading)} {...fi("img")}/>
                      <div style={{fontSize:11.5,color:C.creamMut,marginTop:6,fontFamily:FB}}>Cloudinary, Imgur u otro servicio público.</div>
                      {form.imagen_principal&&(
                        <div style={{marginTop:12,borderRadius:10,overflow:"hidden",border:`1.5px solid ${C.pink}40`,height:120}}>
                          <img src={form.imagen_principal} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.3";}}/>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </div>
            </div>
          </form>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,232,200,0.18); font-family: ${FB}; }
        select option { background: #100D1C; color: ${C.cream}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,150,0.12); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.22); }
      `}</style>
    </div>
  );
}