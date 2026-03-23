// src/pages/public/DetalleArtistaPublico.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Palette, Mail, Phone, Award,
  ImageIcon, ChevronRight, RefreshCw,
  MapPin, Sparkles
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
  panel:    "#100D1C",
  card:     "rgba(16,13,28,0.92)",
  border:   "rgba(255,200,150,0.08)",
  borderBr: "rgba(118,78,49,0.22)",
  borderHi: "rgba(255,200,150,0.18)",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const PALETTE = [C.orange, C.pink, C.purple, C.blue, C.gold];

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

export default function DetalleArtistaPublico() {
  const navigate        = useNavigate();
  const { id }          = useParams<{ id: string }>();
  const [artista, setArtista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/api/artistas/${id}`);
        const json = await res.json();
        if (json.success) { setArtista(json.data); setTimeout(() => setVisible(true), 80); }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:12, color:C.creamMut, fontFamily:FB, background:C.bg }}>
      <RefreshCw size={18} color={C.orange} style={{ animation:"spin 1s linear infinite" }} />
      <span style={{ fontSize:14 }}>Cargando…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!artista) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:20, fontFamily:FB, background:C.bg }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.cream, fontFamily:FD }}>Artista no encontrado</div>
      <button onClick={() => navigate("/artistas")} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:12, background:`linear-gradient(135deg,${C.orange},${C.magenta})`, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:FB, fontSize:14 }}>
        Ver artistas
      </button>
    </div>
  );

  const color    = PALETTE[artista.id_artista % PALETTE.length];
  const initials = artista.nombre_completo?.split(" ").slice(0,2).map((n:string)=>n[0]).join("").toUpperCase() || "?";
  const obras    = artista.obras || [];
  const publicadas = obras.filter((o:any) => o.estado === "publicada");

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FB }}>

      {/* ── Breadcrumb ── */}
      <div style={{ background:"rgba(7,5,16,0.85)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.borderBr}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"12px 48px", display:"flex", alignItems:"center", gap:6, fontSize:12.5, color:C.creamMut }}>
          {[{ label:"Inicio", action:() => navigate("/") }, { label:"Artistas", action:() => navigate("/artistas") }].map((item) => (
            <span key={item.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={item.action} style={{ background:"none", border:"none", cursor:"pointer", color:C.creamMut, fontFamily:FB, fontSize:12.5, padding:0, transition:"color .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=C.creamSub}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=C.creamMut}
              >{item.label}</button>
              <ChevronRight size={11} strokeWidth={1.8} style={{ opacity:.45 }} />
            </span>
          ))}
          <span style={{ color:C.creamSub, fontWeight:600 }}>{artista.nombre_artistico || artista.nombre_completo}</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ position:"relative", overflow:"hidden", borderBottom:`1px solid ${C.borderBr}` }}>
        {/* Fondos atmosféricos */}
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 70% 100% at 0% 50%, ${color}10, transparent)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 50% 80% at 100% 30%, ${C.purple}10, transparent)`, pointerEvents:"none" }} />

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"40px 48px 36px" }}>

          {/* Volver */}
          <button onClick={() => navigate("/artistas")} style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:28, padding:"7px 16px", borderRadius:10, background:"rgba(255,200,150,0.04)", border:`1px solid ${C.borderBr}`, color:C.creamMut, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FB, transition:"all .15s" }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamSub; el.style.borderColor=C.borderHi; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=C.creamMut; el.style.borderColor=C.borderBr; }}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Artistas
          </button>

          {/* Fila principal */}
          <div className="artista-hero-row" style={{ display:"flex", alignItems:"center", gap:28, flexWrap:"wrap" }}>

            {/* Avatar */}
            <div style={{ width:100, height:100, borderRadius:26, border:`3px solid ${color}40`, overflow:"hidden", background:`${color}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 12px 40px ${color}35`, opacity:visible?1:0, transform:visible?"scale(1)":"scale(0.9)", transition:"opacity .6s, transform .6s" }}>
              {artista.foto_perfil
                ? <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:36, fontWeight:900, color, fontFamily:FD }}>{initials}</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:220, opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(16px)", transition:"opacity .7s .1s, transform .7s .1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                <Sparkles size={12} color={C.gold} strokeWidth={2} />
                <span style={{ fontSize:11, fontWeight:800, color:C.gold, letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:FB }}>Artista certificado</span>
              </div>
              <h1 style={{ fontSize:"clamp(24px, 3vw, 36px)", fontWeight:900, color:C.cream, margin:"0 0 6px", lineHeight:1.1, fontFamily:FD, letterSpacing:"-0.02em" }}>
                {artista.nombre_completo}
              </h1>
              {artista.nombre_artistico && (
                <div style={{ fontSize:15, color, fontWeight:700, marginBottom:12, fontFamily:FB }}>✦ {artista.nombre_artistico}</div>
              )}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {artista.categoria_nombre && (
                  <span style={{ fontSize:11.5, padding:"4px 13px", borderRadius:100, background:`${color}15`, border:`1px solid ${color}30`, color, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:FB }}>
                    {artista.categoria_nombre}
                  </span>
                )}
                {artista.matricula && (
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, padding:"4px 13px", borderRadius:100, background:`${C.gold}12`, border:`1px solid ${C.gold}28`, color:C.gold, fontWeight:700, fontFamily:FB }}>
                    <Award size={11} strokeWidth={2} /> Matrícula certificada
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:0, background:C.card, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", flexShrink:0, backdropFilter:"blur(16px)", opacity:visible?1:0, transition:"opacity .7s .2s" }}>
              {[
                { label:"Obras",    value:artista.total_obras || 0, color:C.orange },
                { label:"Públicas", value:publicadas.length,        color:C.gold   },
              ].map(({ label, value, color:sc }, i) => (
                <div key={label} style={{ padding:"20px 28px", textAlign:"center", borderRight: i===0 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize:30, fontWeight:900, color:sc, fontFamily:FD, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:10.5, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:5, fontFamily:FB }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px 48px 80px" }}>
        <div className="artista-content-grid" style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>

          {/* ── Sidebar ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Biografía */}
            {artista.biografia && (
              <div style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", backdropFilter:"blur(16px)" }}>
                <div style={{ height:2, background:`linear-gradient(90deg,${color},transparent)` }} />
                <div style={{ padding:"20px 22px" }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14, fontFamily:FB }}>Acerca del artista</div>
                  <p style={{ fontSize:13.5, color:C.creamSub, lineHeight:1.85, margin:0, fontFamily:FB }}>{artista.biografia}</p>
                </div>
              </div>
            )}

            {/* Contacto */}
            <div style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", backdropFilter:"blur(16px)" }}>
              <div style={{ height:2, background:`linear-gradient(90deg,${C.pink},transparent)` }} />
              <div style={{ padding:"20px 22px" }}>
                <div style={{ fontSize:10.5, fontWeight:800, color:C.pink, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:16, fontFamily:FB }}>Contacto</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { icon:Mail,   value:artista.correo,    label:"Correo"    },
                    { icon:Phone,  value:artista.telefono,  label:"Teléfono"  },
                    { icon:MapPin, value:"Hidalgo, México", label:"Ubicación" },
                  ].map(({ icon:Icon, value, label }) => value && (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:9, background:`${C.pink}12`, border:`1px solid ${C.pink}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={13} color={C.pink} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ fontSize:10.5, color:C.creamMut, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB }}>{label}</div>
                        <div style={{ fontSize:13, color:C.creamSub, marginTop:2, fontFamily:FB }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/contacto")} style={{ width:"100%", marginTop:18, padding:"12px", borderRadius:12, background:`linear-gradient(135deg,${C.pink},${C.purple})`, border:"none", color:"white", fontWeight:700, fontSize:13.5, cursor:"pointer", fontFamily:FB, boxShadow:`0 6px 20px ${C.pink}35`, transition:"transform .15s, box-shadow .15s" }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow=`0 10px 28px ${C.pink}45`; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="translateY(0)"; el.style.boxShadow=`0 6px 20px ${C.pink}35`; }}
                >
                  <Mail size={14} style={{ verticalAlign:"middle", marginRight:6 }} strokeWidth={2.5} />
                  Contactar artista
                </button>
              </div>
            </div>
          </div>

          {/* ── Obras ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:`${C.orange}14`, border:`1px solid ${C.orange}25`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Palette size={15} color={C.orange} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize:17, fontWeight:800, color:C.cream, fontFamily:FB }}>Obras disponibles</span>
                <span style={{ fontSize:11.5, padding:"3px 11px", borderRadius:100, background:`${C.orange}14`, border:`1px solid ${C.orange}28`, color:C.orange, fontWeight:800, fontFamily:FB }}>{publicadas.length}</span>
              </div>
              {publicadas.length > 0 && (
                <button onClick={() => navigate(`/catalogo?artista=${artista.id_artista}`)} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.creamMut, background:"transparent", border:"none", cursor:"pointer", fontWeight:600, fontFamily:FB, transition:"color .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=C.orange}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=C.creamMut}
                >
                  Ver en catálogo <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {obras.length === 0 ? (
              <div style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:"60px 20px", textAlign:"center", backdropFilter:"blur(16px)" }}>
                <ImageIcon size={44} color={C.creamMut} strokeWidth={1} style={{ opacity:.2, marginBottom:16 }} />
                <div style={{ fontSize:16, fontWeight:800, color:C.cream, fontFamily:FD, marginBottom:8 }}>Sin obras publicadas aún</div>
                <div style={{ fontSize:13, color:C.creamSub, fontFamily:FB }}>Este artista pronto tendrá obras disponibles</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16 }}>
                {obras.map((obra:any) => {
                  const disponible = obra.estado === "publicada";
                  return (
                    <div key={obra.id_obra}
                      role={obra.slug ? "button" : undefined}
                      tabIndex={obra.slug ? 0 : undefined}
                      onClick={() => obra.slug && navigate(`/obras/${obra.slug}`)}
                      onKeyDown={e => { if (e.key === "Enter" && obra.slug) navigate(`/obras/${obra.slug}`); }}
                      style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", cursor: obra.slug ? "pointer" : "default", transition:"all .22s", backdropFilter:"blur(12px)" }}
                      onMouseEnter={e => { if(obra.slug){ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-5px)"; el.style.borderColor=C.borderHi; el.style.boxShadow=`0 20px 50px rgba(0,0,0,0.45)`; } }}
                      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform="none"; el.style.borderColor=C.border; el.style.boxShadow="none"; }}
                    >
                      <div style={{ height:148, background:C.panel, overflow:"hidden", position:"relative" }}>
                        {obra.imagen_principal
                          ? <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform="scale(1.06)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform="scale(1)"}
                            />
                          : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}><ImageIcon size={28} color={C.creamMut} strokeWidth={1.2} style={{ opacity:.3 }} /></div>
                        }
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 55%,rgba(7,5,16,0.55) 100%)", pointerEvents:"none" }} />
                        <div style={{ position:"absolute", top:10, right:10 }}>
                          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:100, background: disponible ? "rgba(34,201,122,0.15)" : "rgba(255,200,150,0.1)", border:`1px solid ${disponible ? "rgba(34,201,122,0.35)" : C.borderBr}`, color: disponible ? C.green : C.creamMut, fontWeight:700, fontFamily:FB }}>
                            {disponible ? "Disponible" : "Próximamente"}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding:"13px 16px 16px" }}>
                        <div style={{ fontSize:13.5, fontWeight:700, color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:FB, marginBottom:4 }}>{obra.titulo}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11.5, color:C.creamMut, fontFamily:FB }}>{obra.categoria_nombre}</span>
                          {obra.precio_base && (
                            <span style={{ fontSize:14, fontWeight:700, color:C.cream, fontFamily:FD }}>{fmt(Number(obra.precio_base))}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,200,150,0.12); border-radius:10px; }
        @media (max-width: 900px) {
          .artista-hero-row { flex-direction: column !important; align-items: flex-start !important; }
          .artista-content-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}