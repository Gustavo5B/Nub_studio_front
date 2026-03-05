// src/pages/public/DetalleObra.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Award, Frame, Calendar, Ruler,
  User, Tag, ChevronRight, RefreshCw, ImageIcon,
  ShoppingBag, Heart, Share2, CheckCircle, Sparkles, ZoomIn,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  green:    "#22C97A",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.32)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  panel:    "#100D1C",
  card:     "rgba(16,13,28,0.92)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.22)",
  borderHi: "rgba(255,200,150,0.18)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

export default function DetalleObra() {
  const navigate  = useNavigate();
  const { slug }  = useParams<{ slug: string }>();
  const [obra,      setObra]    = useState<any>(null);
  const [loading,   setLoading] = useState(true);
  const [imgError,  setImgErr]  = useState(false);
  const [tamSel,    setTamSel]  = useState<any>(null);
  const [liked,     setLiked]   = useState(false);
  const [imgActiva, setImg]     = useState<string | null>(null);
  const [zoomed,    setZoomed]  = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/obras/slug/${slug}`);
        const j = await r.json();
        if (j.success) {
          setObra(j.data);
          setImg(j.data.imagen_principal);
          if (j.data.tamaños?.length) setTamSel(j.data.tamaños[0]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:12, color:C.creamMut, fontFamily:FB, background:C.bg }}>
      <RefreshCw size={18} color={C.orange} style={{ animation:"spin 1s linear infinite" }} />
      <span style={{ fontSize:14 }}>Cargando obra…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!obra) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:24, fontFamily:FB, background:C.bg }}>
      <ImageIcon size={56} color={C.creamMut} strokeWidth={1} style={{ opacity:.25 }} />
      <div style={{ fontSize:22, fontWeight:800, color:C.cream, fontFamily:FD }}>Obra no encontrada</div>
      <button onClick={() => navigate("/catalogo")} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:12, background:`linear-gradient(135deg,${C.orange},${C.magenta})`, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:FB, fontSize:14, boxShadow:`0 8px 24px ${C.orange}40` }}>
        Ver catálogo
      </button>
    </div>
  );

  const precio = tamSel?.precio_base || obra.precio_base;
  const todasImg = [
    ...(obra.imagen_principal ? [{ url_imagen: obra.imagen_principal, id_imagen: "main" }] : []),
    ...(obra.imagenes || []),
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FB }}>

      {/* ── Breadcrumb ── */}
      <div style={{ background:"rgba(7,5,16,0.85)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.borderBr}` }}>
        <div style={{ maxWidth:1320, margin:"0 auto", padding:"10px 48px", display:"flex", alignItems:"center", gap:6, fontSize:12.5, color:C.creamMut, flexWrap:"wrap" }}>
          {[
            { label:"Inicio",              action:() => navigate("/")                                         },
            { label:"Catálogo",            action:() => navigate("/catalogo")                                 },
            { label:obra.categoria_nombre, action:() => navigate(`/catalogo?categoria=${obra.id_categoria}`) },
          ].map((item, i) => (
            <span key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={item.action} style={{ background:"none", border:"none", cursor:"pointer", color:C.creamMut, fontFamily:FB, fontSize:12.5, padding:0, transition:"color .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.creamSub}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.creamMut}
              >{item.label}</button>
              <ChevronRight size={11} strokeWidth={1.8} style={{ opacity:.45 }} />
            </span>
          ))}
          <span style={{ color:C.creamSub, fontWeight:600, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{obra.titulo}</span>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div style={{ maxWidth:1320, margin:"0 auto", padding:"40px 48px 100px" }}>

        {/* Volver */}
        <button onClick={() => navigate(-1 as any)} style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, padding:"7px 15px", borderRadius:10, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.borderBr}`, color:C.creamMut, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamSub; el.style.borderColor=C.borderHi; }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamMut; el.style.borderColor=C.borderBr; }}
        >
          <ArrowLeft size={14} strokeWidth={2} /> Volver
        </button>

        {/* ── Grid 2col ── */}
        <div className="detalle-grid" style={{ display:"grid", gridTemplateColumns:"1fr 420px", gap:56, alignItems:"start" }}>

          {/* ══ IZQUIERDA ══ */}
          <div>
            {/* Imagen principal */}
            <div onClick={() => setZoomed(true)} style={{ position:"relative", borderRadius:24, overflow:"hidden", background:C.panel, border:`1px solid ${C.borderBr}`, marginBottom:12, boxShadow:"0 40px 100px rgba(0,0,0,0.55)", cursor:"zoom-in" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:340, overflow:"hidden" }}>
                {(imgActiva || obra.imagen_principal) && !imgError ? (
                  <img src={imgActiva || obra.imagen_principal} alt={obra.titulo}
                    style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <ImageIcon size={64} color={C.creamMut} strokeWidth={1} style={{ opacity:.15 }} />
                )}
              </div>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 60%,rgba(7,5,16,0.45) 100%)", pointerEvents:"none" }} />

              {/* Hint zoom */}
              <div style={{ position:"absolute", bottom:16, right:16, display:"flex", alignItems:"center", gap:6, padding:"6px 13px", borderRadius:100, background:"rgba(7,5,16,0.78)", backdropFilter:"blur(12px)", border:`1px solid ${C.borderBr}`, fontSize:11.5, color:C.creamMut, fontFamily:FB, pointerEvents:"none" }}>
                <ZoomIn size={12} strokeWidth={2} /> Ampliar
              </div>

              {/* Acciones */}
              <div style={{ position:"absolute", top:16, right:16, display:"flex", flexDirection:"column", gap:8 }}>
                <button onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
                  style={{ width:38, height:38, borderRadius:10, background: liked ? `${C.pink}22` : "rgba(7,5,16,0.78)", border:`1px solid ${liked ? C.pink+"44" : C.borderBr}`, backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s" }}>
                  <Heart size={14} color={liked ? C.pink : C.creamMut} fill={liked ? C.pink : "none"} strokeWidth={2} />
                </button>
                <button onClick={e => { e.stopPropagation(); navigator.share?.({ title:obra.titulo, url:window.location.href }); }}
                  style={{ width:38, height:38, borderRadius:10, background:"rgba(7,5,16,0.78)", border:`1px solid ${C.borderBr}`, backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Share2 size={14} color={C.creamMut} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Miniaturas */}
            {todasImg.length > 1 && (
              <div style={{ display:"flex", gap:10, marginBottom:32, flexWrap:"wrap" }}>
                {todasImg.map((img: any) => {
                  const sel = imgActiva === img.url_imagen;
                  return (
                    <div key={img.id_imagen} onClick={() => setImg(img.url_imagen)}
                      style={{ width:76, height:76, borderRadius:13, overflow:"hidden", border:`2px solid ${sel ? C.orange : C.borderBr}`, cursor:"pointer", transition:"all .2s", opacity: sel ? 1 : 0.6, boxShadow: sel ? `0 0 16px ${C.orange}38` : "none" }}>
                      <img src={img.url_imagen} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Descripción */}
            <InfoPanel accentColor={C.orange} label="Descripción">
              <p style={{ fontSize:15, color:C.creamSub, lineHeight:1.9, margin:0, fontFamily:FB }}>
                {obra.descripcion || "Sin descripción disponible."}
              </p>
            </InfoPanel>

            <div style={{ height:14 }} />

            {/* Detalles técnicos */}
            <InfoPanel accentColor={C.blue} label="Detalles técnicos">
              <div className="detalles-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {[
                  { icon:Tag,      label:"Categoría",  value:obra.categoria_nombre },
                  { icon:Calendar, label:"Año",         value:obra.anio_creacion || "—" },
                  { icon:Ruler,    label:"Dimensiones", value: obra.dimensiones_alto && obra.dimensiones_ancho ? `${obra.dimensiones_alto} × ${obra.dimensiones_ancho} cm` : "—" },
                  { icon:Frame,    label:"Marco",       value: obra.permite_marco ? "Disponible" : "No disponible" },
                  { icon:Award,    label:"Certificado", value: obra.con_certificado ? "Incluido" : "No incluido" },
                  { icon:CheckCircle, label:"Disponibilidad", value: obra.estado === 'publicada' ? 'Disponible' : 'No disponible' },
                ].map(({ icon:Icon, label, value }) => (
                  <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${C.blue}10`, border:`1px solid ${C.blue}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={14} color={C.blue} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize:10.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, fontFamily:FB }}>{label}</div>
                      <div style={{ fontSize:14, color:C.cream, fontWeight:600, marginTop:4, fontFamily:FB }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {obra.etiquetas?.length > 0 && (
                <div style={{ marginTop:22, paddingTop:20, borderTop:`1px solid rgba(255,200,150,0.08)` }}>
                  <div style={{ fontSize:10.5, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:10, fontFamily:FB }}>Etiquetas</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {obra.etiquetas.map((e: any) => (
                      <span key={e.id_etiqueta} style={{ fontSize:12, padding:"4px 14px", borderRadius:100, background:`${C.purple}14`, border:`1px solid ${C.purple}28`, color:C.purple, fontWeight:700, fontFamily:FB }}>{e.nombre}</span>
                    ))}
                  </div>
                </div>
              )}
            </InfoPanel>
          </div>

          {/* ══ DERECHA — Panel compra ══ */}
          <div style={{ position:"sticky", top:88, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Título + artista */}
            <div style={{ paddingBottom:24, borderBottom:`1px solid ${C.borderBr}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, padding:"4px 13px", borderRadius:100, background:`${C.orange}14`, border:`1px solid ${C.orange}32`, color:C.orange, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:FB }}>{obra.categoria_nombre}</span>
                {obra.con_certificado && (
                  <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, padding:"4px 13px", borderRadius:100, background:`${C.gold}14`, border:`1px solid ${C.gold}32`, color:C.gold, fontWeight:800, fontFamily:FB }}>
                    <Award size={10} strokeWidth={2.5} /> Certificado
                  </span>
                )}
              </div>

              <h1 style={{ fontSize:"clamp(22px, 2.2vw, 30px)", fontWeight:900, color:C.cream, margin:"0 0 16px", lineHeight:1.15, fontFamily:FD, letterSpacing:"-0.02em" }}>
                {obra.titulo}
              </h1>

              <button onClick={() => navigate(`/artistas/${obra.id_artista}`)}
                style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${C.pink}16`, border:`1px solid ${C.pink}28`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                  {obra.artista_foto
                    ? <img src={obra.artista_foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <User size={13} color={C.pink} strokeWidth={1.8} />
                  }
                </div>
                <span style={{ fontSize:14, color:C.pink, fontWeight:700, fontFamily:FB, transition:"color .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=C.creamSub}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=C.pink}
                >{obra.artista_alias || obra.artista_nombre}</span>
              </button>
            </div>

            {/* Precio */}
            <div style={{ background:`linear-gradient(135deg, rgba(255,132,14,0.07), rgba(255,193,16,0.04))`, borderRadius:18, border:`1px solid ${C.orange}22`, padding:"24px 26px" }}>
              <div style={{ height:2, background:`linear-gradient(90deg, ${C.orange}, ${C.gold}, transparent)`, borderRadius:2, marginBottom:18 }} />
              <div style={{ fontSize:10.5, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10, fontFamily:FB }}>
                {tamSel ? tamSel.tamaño_nombre : "Precio base"}
              </div>
              <div style={{ fontSize:30, fontWeight:700, color:C.cream, letterSpacing:"-0.5px", lineHeight:1, fontFamily:FB, marginBottom:8 }}>
                {fmt(Number(precio || 0))}
              </div>
              <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB }}>IVA incluido · Envío a calcular</div>
            </div>

            {/* Tamaños */}
            {obra.tamaños?.length > 0 && (
              <div>
                <div style={{ fontSize:10.5, fontWeight:800, color:C.creamMut, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10, fontFamily:FB }}>Selecciona un tamaño</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {obra.tamaños.map((t: any) => {
                    const sel = tamSel?.id_obra_tamaño === t.id_obra_tamaño;
                    return (
                      <button key={t.id_obra_tamaño} onClick={() => setTamSel(t)}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", borderRadius:13, border:`1.5px solid ${sel ? C.orange+"55" : C.borderBr}`, background: sel ? "rgba(255,132,14,0.06)" : "rgba(16,13,28,0.7)", cursor:"pointer", fontFamily:FB, transition:"all .18s" }}
                        onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor=C.borderHi; }}
                        onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor=C.borderBr; }}
                      >
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, fontFamily:FB }}>{t.tamaño_nombre}</div>
                          {t.ancho_cm && <div style={{ fontSize:12, color:C.creamMut, marginTop:2, fontFamily:FB }}>{t.ancho_cm} × {t.alto_cm} cm</div>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:15, fontWeight:700, color: sel ? C.cream : C.creamSub, fontFamily:FB }}>{fmt(Number(t.precio_base))}</span>
                          {sel && <CheckCircle size={15} color={C.orange} strokeWidth={2.5} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"15px", borderRadius:14, background:`linear-gradient(135deg,${C.orange},${C.magenta})`, border:"none", color:"white", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FB, boxShadow:`0 10px 32px ${C.orange}45`, transition:"transform .18s, box-shadow .18s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow=`0 16px 44px ${C.orange}55`; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(0)"; el.style.boxShadow=`0 10px 32px ${C.orange}45`; }}
              >
                <ShoppingBag size={17} strokeWidth={2.5} /> Adquirir esta obra
              </button>
              <button style={{ padding:"14px", borderRadius:14, border:`1.5px solid ${C.borderHi}`, background:"rgba(255,232,200,0.03)", color:C.creamSub, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(255,232,200,0.07)"; el.style.color=C.cream; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background="rgba(255,232,200,0.03)"; el.style.color=C.creamSub; }}
              >
                Solicitar información
              </button>
            </div>

            {/* Garantías */}
            <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"18px 20px", backdropFilter:"blur(16px)" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                {[
                  { icon:Award,       color:C.gold,   text:"Certificado de autenticidad incluido" },
                  { icon:CheckCircle, color:C.green,  text:"Obra verificada por Galería Altar"    },
                  { icon:Sparkles,    color:C.orange, text:"Artista certificado y reconocido"     },
                ].map(({ icon:Icon, color, text }) => (
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:30, height:30, borderRadius:9, background:`${color}12`, border:`1px solid ${color}24`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={13} color={color} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize:13, color:C.creamSub, fontFamily:FB }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini artista */}
            {obra.artista_nombre && (
              <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", backdropFilter:"blur(16px)" }}>
                <div style={{ height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},transparent)` }} />
                <div style={{ padding:"20px" }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color:C.pink, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14, fontFamily:FB }}>Sobre el artista</div>
                  <div style={{ display:"flex", alignItems:"center", gap:13 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:`${C.pink}14`, border:`1px solid ${C.pink}22`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {obra.artista_foto
                        ? <img src={obra.artista_foto} alt={obra.artista_nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <span style={{ fontSize:18, fontWeight:900, color:C.pink, fontFamily:FD }}>{obra.artista_nombre?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:800, color:C.cream, fontFamily:FB }}>{obra.artista_alias || obra.artista_nombre}</div>
                      {obra.artista_biografia && (
                        <div style={{ fontSize:12.5, color:C.creamMut, marginTop:5, lineHeight:1.65, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", fontFamily:FB }}>
                          {obra.artista_biografia}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Relacionadas ── */}
        {obra.obras_relacionadas?.length > 0 && (
          <div style={{ marginTop:80 }}>
            <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.borderBr},transparent)`, marginBottom:52 }} />
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:32 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10, fontFamily:FB }}>Puede interesarte</div>
                <h2 style={{ fontSize:"clamp(22px,2.5vw,34px)", fontWeight:900, color:C.cream, margin:0, fontFamily:FD, letterSpacing:"-0.02em" }}>
                  Obras <span style={{ background:`linear-gradient(135deg,${C.gold},${C.orange})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>relacionadas</span>
                </h2>
              </div>
              <button onClick={() => navigate("/catalogo")} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", borderRadius:10, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.borderHi}`, color:C.creamMut, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.cream; el.style.background="rgba(255,200,150,0.08)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamMut; el.style.background="rgba(255,200,150,0.04)"; }}
              >
                Ver todas <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="relacionadas-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18 }}>
              {obra.obras_relacionadas.map((rel: any) => (
                <div key={rel.id_obra} onClick={() => { navigate(`/obras/${rel.slug}`); window.scrollTo(0,0); }}
                  style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", cursor:"pointer", transition:"all .22s", backdropFilter:"blur(12px)" }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-5px)"; el.style.borderColor=C.borderHi; el.style.boxShadow=`0 20px 50px rgba(0,0,0,0.45)`; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="none"; el.style.borderColor=C.border; el.style.boxShadow="none"; }}
                >
                  <div style={{ height:160, background:C.panel, overflow:"hidden", position:"relative" }}>
                    {rel.imagen_principal
                      ? <img src={rel.imagen_principal} alt={rel.titulo} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s" }} />
                      : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}><ImageIcon size={28} color={C.creamMut} strokeWidth={1.2} style={{ opacity:.3 }} /></div>
                    }
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 50%,rgba(7,5,16,0.55) 100%)", pointerEvents:"none" }} />
                  </div>
                  <div style={{ padding:"14px 18px 18px" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:FB, marginBottom:4 }}>{rel.titulo}</div>
                    <div style={{ fontSize:12, color:C.creamMut, fontFamily:FB, marginBottom:10 }}>{rel.artista_alias}</div>
                    {rel.precio_minimo && (
                      <div style={{ fontSize:14, fontWeight:700, color:C.creamSub, fontFamily:FB }}>{fmt(Number(rel.precio_minimo))}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out", backdropFilter:"blur(10px)" }}>
          <img src={imgActiva || obra.imagen_principal} alt={obra.titulo}
            style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:16, boxShadow:"0 40px 100px rgba(0,0,0,0.8)" }}
          />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.12); border-radius:10px; }
        @media (max-width: 960px) {
          .detalle-grid { grid-template-columns:1fr !important; gap:32px !important; }
          .detalle-grid > div:last-child { position:static !important; }
          .relacionadas-grid { grid-template-columns:repeat(2,1fr) !important; }
          .detalles-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width: 520px) {
          .relacionadas-grid { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Componente InfoPanel ──────────────────────────────────
function InfoPanel({ label, accentColor, children }: {
  label: string; accentColor: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background:"rgba(16,13,28,0.92)", borderRadius:20, border:"1px solid rgba(255,200,150,0.08)", overflow:"hidden", backdropFilter:"blur(20px)" }}>
      <div style={{ height:2, background:`linear-gradient(90deg,${accentColor},transparent)` }} />
      <div style={{ padding:"26px 28px" }}>
        <div style={{ fontSize:10.5, fontWeight:800, color:accentColor, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:18, fontFamily:"'DM Sans', sans-serif" }}>{label}</div>
        {children}
      </div>
    </div>
  );
}