// src/pages/public/DetalleColeccionPublico.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  purple: "#6028AA",
  blue:   "#2D6FBE",
  gold:   "#A87006",
  ink:    "#14121E",
  sub:    "#9896A8",
  dark:   "#0D0B14",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface Obra {
  id_obra: number;
  titulo: string;
  slug?: string;
  imagen_principal: string;
  precio_base: number;
  precio_minimo?: number;
  tecnica?: string;
  dimensiones?: string;
  anio?: number;
  estado: string;
  activa: boolean;
}

interface Coleccion {
  id_coleccion: number;
  nombre: string;
  slug: string;
  historia: string;
  imagen_portada: string;
  destacada: boolean;
  fecha_creacion: string;
  estado?: string;
  // Datos del artista (como vienen del backend actual)
  artista_nombre: string;
  artista_alias?: string;
  artista_foto?: string;
  id_artista?: number;  // Si viene en la respuesta
  obras: Obra[];
}

export default function DetalleColeccionPublico() {
  const navigate      = useNavigate();
  const { slug }      = useParams<{ slug: string }>();
  const isLoggedIn    = authService.isAuthenticated();
  const userRol       = localStorage.getItem("userRol") || "";

  const [coleccion, setColeccion] = useState<Coleccion | null>(null);
  const [loading, setLoading]     = useState(true);
  const [visible, setVisible]     = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [obrasVisibles, setObrasVisibles] = useState(12);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [coleccionesRecomendadas, setColeccionesRecomendadas] = useState<any[]>([]);

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pageRef  = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════
  // ═══ CURSOR PERSONALIZADO
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    document.body.style.cursor = "none";
    document.documentElement.style.cursor = "none";
    
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number | null = null;
    
    const animate = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      
      if (ringRef.current) {
        ringRef.current.style.left = `${rx}px`;
        ringRef.current.style.top = `${ry}px`;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      
      if (rafId === null) {
        rafId = requestAnimationFrame(animate);
      }
    };
    
    document.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    
    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.style.cursor = "auto";
      document.documentElement.style.cursor = "auto";
    };
  }, []);

  const cursorOn  = useCallback(() => { 
    dotRef.current?.classList.add("cur-over"); 
    ringRef.current?.classList.add("cur-over"); 
  }, []);
  
  const cursorOff = useCallback(() => { 
    dotRef.current?.classList.remove("cur-over"); 
    ringRef.current?.classList.remove("cur-over"); 
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ═══ CARGA DE DATOS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    globalThis.scrollTo(0, 0);
    setVisible(false);
    setPageReady(false);
    
    (async () => {
      setLoading(true);
      try {
        // Usar la ruta que ya existe en tu backend
        const res = await fetch(`${API_URL}/api/colecciones/slug/${slug}`);
        const json = await res.json();
        
        if (json.success) {
          setColeccion(json.data);
          
          // Cargar colecciones recomendadas del mismo artista
          if (json.data.id_artista) {
            const recRes = await fetch(`${API_URL}/api/colecciones?id_artista=${json.data.id_artista}&limit=4`);
            const recJson = await recRes.json();
            if (recJson.success) {
              // Filtrar la colección actual
              const filtered = recJson.data.filter((c: any) => c.slug !== slug).slice(0, 4);
              setColeccionesRecomendadas(filtered);
            }
          }
        } else {
          setColeccion(null);
        }
      } catch (error) {
        console.error("Error cargando colección:", error);
        setColeccion(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!loading) {
      const t1 = setTimeout(() => setPageReady(true), 80);
      const t2 = setTimeout(() => setVisible(true),   180);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [loading]);

  // Animaciones de scroll
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    const targets = container.querySelectorAll<HTMLElement>("[data-rv]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("rv-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [coleccion, visible]);

  const obrasActivas = coleccion?.obras?.filter(o => o.estado === "publicada" && o.activa === true) || [];
  const obrasMostradas = obrasActivas.slice(0, obrasVisibles);
  const hasMore = obrasVisibles < obrasActivas.length;

  // Determinar color basado en ID del artista (si existe)
  const palette = [C.orange, C.pink, C.purple, C.blue, C.gold];
  const color = palette[(coleccion?.id_artista || 0) % palette.length] || C.orange;

  // ═══════════════════════════════════════════════════════════════
  // ═══ PANTALLA DE CARGA
  // ═══════════════════════════════════════════════════════════════
  if (loading) return (
    <div style={{ position:"fixed", inset:0, background:C.dark, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        @keyframes loadPulse { 0%,100%{opacity:.15} 50%{opacity:.5} }
        @keyframes loadLine  { from{width:0} to{width:64px} }
      `}</style>
      <div style={{ fontFamily:SERIF, fontSize:"clamp(52px,8vw,96px)", fontWeight:900, color:"white", letterSpacing:"-.03em", animation:"loadPulse 1.4s ease infinite" }}>COLECCIÓN</div>
      <div style={{ height:1, background:C.orange, animation:"loadLine .8s cubic-bezier(.16,1,.3,1) forwards" }}/>
      <div style={{ fontSize:8, fontWeight:700, letterSpacing:".44em", textTransform:"uppercase", color:"rgba(255,255,255,.2)", fontFamily:NEXA_HEAVY, marginTop:4 }}>Cargando</div>
    </div>
  );

  if (!coleccion) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:"white" }}>
      <div style={{ fontSize:24, fontWeight:900, color:C.ink, fontFamily:SERIF }}>Colección no encontrada</div>
      <button onClick={() => navigate("/catalogo")} style={{ padding:"12px 28px", borderRadius:100, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:NEXA_HEAVY, fontSize:11, letterSpacing:".15em", textTransform:"uppercase" }}>Ver catálogo</button>
    </div>
  );

  // Obtener el nombre del artista (usando los campos que vienen del backend)
  const artistaNombre = coleccion.artista_nombre || "";
  const artistaAlias = coleccion.artista_alias;
  const artistaFoto = coleccion.artista_foto;

  return (
    <>
      <div ref={pageRef} className={pageReady ? "page-enter" : ""} style={{ minHeight:"100vh", background:"#fff", fontFamily:SANS, overflowX:"hidden" }}>
        <style>{`
          @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
          @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

          .col-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            background-size:160px 160px; mix-blend-mode:multiply; }

          .col-cursor-dot { position:fixed; width:6px; height:6px; border-radius:50%; background:${C.ink}; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
          .col-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
          .col-cursor-dot.cur-over { width:4px; height:4px; background:${C.orange}; }
          .col-cursor-ring.cur-over { width:52px; height:52px; border-color:${C.orange}; }

          @keyframes pageIn { from{opacity:0;transform:translateY(22px) scale(.985)} to{opacity:1;transform:translateY(0) scale(1)} }
          .page-enter { animation:pageIn .55s cubic-bezier(.16,1,.3,1) both; }

          .col-nav-link { display:flex; align-items:center; gap:9px; font-size:9.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.5); text-decoration:none; transition:color .25s; border:none; background:none; cursor:pointer; font-family:'Nexa-Heavy',sans-serif; }
          .col-nav-link::before { content:''; display:block; width:12px; height:1px; background:currentColor; flex-shrink:0; transition:width .28s; }
          .col-nav-link:hover { color:white; }
          .col-nav-link:hover::before { width:22px; }

          [data-rv] { opacity:0; transform:translateY(24px); transition:opacity .9s ease, transform .9s ease; }
          [data-rv].rv-in { opacity:1; transform:translateY(0); }
          [data-rv][data-d="1"] { transition-delay:.08s; }
          [data-rv][data-d="2"] { transition-delay:.16s; }
          [data-rv][data-d="3"] { transition-delay:.24s; }

          .col-obra-card { cursor:pointer; transition:transform .55s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden; background:#fff; border-radius:2px; }
          .col-obra-card:hover { transform:scale(1.32); z-index:20; box-shadow:0 20px 40px rgba(0,0,0,.15); }
          .col-obra-card img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .7s cubic-bezier(.2,0,0,1); }
          .col-obra-card:hover img { transform:scale(1); }

          .col-modal { position:fixed; inset:0; z-index:100000; background:rgba(13,11,20,.98); backdrop-filter:blur(20px); display:flex; align-items:center; justify-content:center; animation:fadeIn .3s ease; }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes modalSlide { from{opacity:0;transform:scale(.96) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }

          .col-rec-card { cursor:pointer; transition:transform .4s cubic-bezier(.16,1,.3,1); overflow:hidden; position:relative; border-radius:2px; }
          .col-rec-card:hover { transform:translateY(-5px); }
          .col-rec-card:hover .col-rec-img { transform:scale(1.05); }
          .col-rec-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

          @keyframes barIn { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        `}</style>

        <div className="col-grain"/>

        {/* ══════════════════════════════════════
             HERO
        ══════════════════════════════════════ */}
        <section style={{ 
          position:"relative", 
          height:"70vh", 
          minHeight:500, 
          background: coleccion.imagen_portada 
            ? `url(${coleccion.imagen_portada}) center/cover no-repeat`
            : `radial-gradient(ellipse 80% 60% at 65% 50%, ${color}22 0%, transparent 65%), linear-gradient(135deg, ${C.dark} 0%, #1a1830 100%)`,
          overflow:"hidden"
        }}>
          {coleccion.imagen_portada && (
            <div style={{ 
              position:"absolute", 
              inset:0, 
              background:"linear-gradient(to top, rgba(13,11,20,.92) 0%, rgba(13,11,20,.25) 50%, rgba(13,11,20,.10) 100%)",
              pointerEvents: "none"
            }}/>
          )}

          <div style={{ 
            position:"absolute", 
            top:0, 
            left:0, 
            right:0, 
            height:1, 
            background:`linear-gradient(90deg, transparent, ${color} 25%, ${color} 75%, transparent)`, 
            animation:"barIn 1.8s cubic-bezier(.16,1,.3,1) both", 
            zIndex:2 
          }}/>

          <nav style={{ 
            position:"absolute", 
            top:30, 
            left:52, 
            display:"flex", 
            flexDirection:"column", 
            gap:10, 
            zIndex:10, 
            animation:"fadeIn 1s ease .5s both" 
          }}>
            {[{ l:"Galería", to:"/catalogo" }, { l:"Artistas", to:"/artistas" }, { l:"Blog", to:"/blog" }, { l:"Contacto", to:"/contacto" }].map(({ l, to }) => (
              <Link key={l} to={to} className="col-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>{l}</Link>
            ))}
          </nav>

          <div style={{ 
            position:"absolute", 
            top:30, 
            right:52, 
            display:"flex", 
            alignItems:"center", 
            gap:12, 
            zIndex:10, 
            animation:"fadeIn 1s ease .5s both" 
          }}>
            {!isLoggedIn ? (
              <>
                <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textDecoration:"none", padding:"7px 14px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)", transition:"all .22s" }}>Ingresar</Link>
                <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"white", textDecoration:"none", padding:"7px 16px", borderRadius:100, background:color, boxShadow:`0 4px 16px ${color}40`, transition:"all .22s" }}>Ser artista</Link>
              </>
            ) : (
              <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textDecoration:"none", padding:"7px 14px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)" }}>Mi cuenta</Link>
            )}
          </div>

          <div style={{
            position:"absolute",
            bottom:0,
            left:0,
            right:0,
            padding:"0 72px 60px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(32px)",
            transition:"opacity .9s, transform .9s",
            zIndex:5,
          }}>
            {coleccion.destacada && (
              <div style={{ 
                display:"inline-block",
                fontSize:8, 
                fontWeight:800, 
                letterSpacing:".28em", 
                textTransform:"uppercase", 
                color:color, 
                marginBottom:20, 
                fontFamily:NEXA_HEAVY,
                background:`${color}20`,
                padding:"5px 14px",
                borderRadius:100,
                backdropFilter:"blur(4px)"
              }}>
                Colección destacada
              </div>
            )}
            <h1 style={{ 
              fontFamily:SERIF, 
              fontSize:"clamp(42px,7vw,96px)", 
              fontWeight:900, 
              color:"white", 
              lineHeight:.9, 
              letterSpacing:"-.03em", 
              margin:0,
              maxWidth:"80%"
            }}>
              {coleccion.nombre}
            </h1>
            
            {/* Link al artista - usando los campos del backend actual */}
            <Link 
              to={`/artistas/${coleccion.id_artista ? coleccion.id_artista : artistaNombre.toLowerCase().replace(/\s+/g, '-')}`}
              onMouseEnter={cursorOn} 
              onMouseLeave={cursorOff}
              style={{
                display:"inline-flex",
                alignItems:"center",
                gap:12,
                marginTop:24,
                textDecoration:"none",
                background:"rgba(255,255,255,.1)",
                backdropFilter:"blur(8px)",
                padding:"8px 20px 8px 12px",
                borderRadius:100,
                border:"1px solid rgba(255,255,255,.2)",
                transition:"all .25s"
              }}
            >
              {artistaFoto ? (
                <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:`1px solid ${color}` }}>
                  <img src={artistaFoto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                </div>
              ) : (
                <div style={{ width:32, height:32, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"white" }}>
                  {artistaNombre?.charAt(0) || "A"}
                </div>
              )}
              <span style={{ fontSize:11, fontWeight:700, color:"white", fontFamily:NEXA_HEAVY, letterSpacing:".08em" }}>
                {artistaNombre}
                {artistaAlias && ` (${artistaAlias})`}
              </span>
            </Link>
          </div>

          <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:1, height:40, background:"linear-gradient(to bottom, transparent, rgba(255,255,255,.15))", pointerEvents:"none" }}/>
        </section>

        {/* ══════════════════════════════════════
             I · HISTORIA DE LA COLECCIÓN
        ══════════════════════════════════════ */}
        <section style={{ borderTop:`3px solid ${color}`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"100%", background:`linear-gradient(135deg, ${color}08 0%, transparent 65%)`, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", left:-4, top:"50%", transform:"translateY(-50%)", fontFamily:SERIF, fontSize:200, fontWeight:900, fontStyle:"italic", color:`${color}06`, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>“</div>

          <div style={{ padding:"72px", maxWidth:900, margin:"0 auto", textAlign:"center" }} data-rv>
            <div style={{ 
              fontSize:8, 
              fontWeight:800, 
              letterSpacing:".3em", 
              textTransform:"uppercase", 
              color:color, 
              marginBottom:32,
              fontFamily:NEXA_HEAVY 
            }}>
              I · Sobre esta colección
            </div>
            
            <p style={{ 
              fontFamily:SERIF, 
              fontSize:"clamp(20px,2.8vw,32px)",
              fontStyle:"italic", 
              fontWeight:400, 
              color: coleccion.historia ? C.ink : "rgba(0,0,0,.18)", 
              lineHeight:1.5, 
              letterSpacing:"-.01em", 
              margin:"0 auto",
              maxWidth:720 
            }}>
              "{coleccion.historia || "El artista aún no ha compartido la historia detrás de esta colección."}"
            </p>
            
            <div style={{ 
              marginTop:48,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              gap:16,
              flexWrap:"wrap"
            }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:900, color:C.ink, fontFamily:NEXA_HEAVY }}>{obrasActivas.length}</div>
                <div style={{ fontSize:9, fontWeight:800, color:C.sub, letterSpacing:".12em", textTransform:"uppercase" }}>Obras</div>
              </div>
              {coleccion.fecha_creacion && (
                <>
                  <div style={{ width:1, height:30, background:"rgba(0,0,0,.1)" }}/>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:900, color:C.ink, fontFamily:NEXA_HEAVY }}>
                      {new Date(coleccion.fecha_creacion).getFullYear()}
                    </div>
                    <div style={{ fontSize:9, fontWeight:800, color:C.sub, letterSpacing:".12em", textTransform:"uppercase" }}>Año</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
             II · OBRAS DE LA COLECCIÓN
        ══════════════════════════════════════ */}
        <section style={{ padding:"80px 0 90px", background:"#fafaf9", borderTop:"1px solid rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:48, padding:"0 72px" }} data-rv>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:C.ink, whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
              II · Obras en la colección
            </div>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            {obrasActivas.length > 0 && (
              <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.20)", whiteSpace:"nowrap", fontFamily:SANS }}>
                {obrasActivas.length} obra{obrasActivas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {obrasActivas.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, fontFamily:SANS }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🖼️</div>
              <div style={{ fontSize:14 }}>Esta colección aún no tiene obras publicadas.</div>
            </div>
          ) : (
            <>
              <div style={{ 
                display:"grid", 
                gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", 
                gap:12, 
                padding:"0 72px"
              }}>
                {obrasMostradas.map((obra, idx) => (
                  <div 
                    key={obra.id_obra} 
                    className="col-obra-card"
                    data-rv
                    data-d={Math.min(idx % 3, 3)}
                    onClick={() => setSelectedObra(obra)}
                    onMouseEnter={cursorOn} 
                    onMouseLeave={cursorOff}
                    style={{ 
                      height:340, 
                      position:"relative",
                      background:"white",
                      boxShadow:"0 2px 8px rgba(0,0,0,.04)"
                    }}
                  >
                    {obra.imagen_principal ? (
                      <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : (
                      <div style={{ width:"100%", height:"100%", background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>🎨</div>
                    )}
                    <div style={{ 
                      position:"absolute", 
                      bottom:0, 
                      left:0, 
                      right:0, 
                      padding:"14px 16px", 
                      background:"linear-gradient(to top, rgba(0,0,0,.85), transparent)",
                      textAlign:"left"
                    }}>
                      <div style={{ fontSize:13, fontWeight:800, color:"white", fontFamily:NEXA_HEAVY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {obra.titulo}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", fontFamily:SANS, marginTop:4 }}>
                        {fmt(Number(obra.precio_base) || Number(obra.precio_minimo) || 0)}
                      </div>
                      {obra.tecnica && (
                        <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", fontFamily:SANS, marginTop:2 }}>
                          {obra.tecnica}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign:"center", marginTop:48 }}>
                  <button
                    onClick={() => setObrasVisibles(prev => prev + 12)}
                    onMouseEnter={cursorOn}
                    onMouseLeave={cursorOff}
                    style={{
                      padding:"12px 32px",
                      borderRadius:100,
                      background:"transparent",
                      border:`1px solid ${color}`,
                      color:color,
                      fontSize:10,
                      fontWeight:800,
                      letterSpacing:".18em",
                      textTransform:"uppercase",
                      fontFamily:NEXA_HEAVY,
                      cursor:"pointer",
                      transition:"all .25s"
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "white"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; }}
                  >
                    Cargar más obras ({obrasActivas.length - obrasVisibles} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ══════════════════════════════════════
             III · OTRAS COLECCIONES DEL ARTISTA
        ══════════════════════════════════════ */}
        {coleccionesRecomendadas.length > 0 && (
          <section style={{ padding:"80px 72px 90px", borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:48 }} data-rv>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(0,0,0,.55)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
                III · Más colecciones del artista
              </div>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            </div>

            <div style={{ 
              display:"grid", 
              gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", 
              gap:12
            }}>
              {coleccionesRecomendadas.map((col: any) => (
                <div 
                  key={col.id_coleccion} 
                  className="col-rec-card"
                  onClick={() => navigate(`/colecciones/${col.slug}`)}
                  style={{ height:300, position:"relative", background:`${color}08` }}
                  onMouseEnter={cursorOn} 
                  onMouseLeave={cursorOff}
                >
                  {col.imagen_portada ? (
                    <img className="col-rec-img" src={col.imagen_portada} alt={col.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}12, #f5f4f0)` }}/>
                  )}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.88) 0%, rgba(13,11,20,.05) 55%)" }}/>
                  {col.destacada && (
                    <div style={{ position:"absolute", top:14, left:14, fontSize:8, fontWeight:800, color:"white", letterSpacing:".16em", textTransform:"uppercase", background:color, padding:"4px 10px", borderRadius:100, fontFamily:NEXA_HEAVY }}>Destacada</div>
                  )}
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 20px 20px" }}>
                    <div style={{ fontSize:17, fontWeight:900, color:"white", fontFamily:SERIF, lineHeight:1.1, marginBottom:5 }}>{col.nombre}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.35)", fontFamily:NEXA_HEAVY, letterSpacing:".08em" }}>
                      {Number(col.total_obras) || 0} {Number(col.total_obras) === 1 ? "obra" : "obras"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════
             FOOTER
        ══════════════════════════════════════ */}
        <div style={{ padding:"22px 72px", borderTop:"1px solid rgba(0,0,0,.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(0,0,0,.14)", fontFamily:NEXA_HEAVY, letterSpacing:".1em" }}>NU★B STUDIO</div>
          <button 
            onClick={() => navigate("/catalogo")}
            onMouseEnter={e => { cursorOn(); (e.currentTarget as HTMLElement).style.color = C.orange; }}
            onMouseLeave={e => { cursorOff(); (e.currentTarget as HTMLElement).style.color = C.ink; }}
            style={{ fontSize:11, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:C.ink, border:"none", background:"none", cursor:"pointer", fontFamily:NEXA_HEAVY, transition:"color .2s" }}
          >
            ← Ver catálogo completo
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
           MODAL DE OBRA (Lightbox)
      ══════════════════════════════════════ */}
      {selectedObra && createPortal(
        <div className="col-modal" onClick={() => setSelectedObra(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth:"90vw",
              maxHeight:"90vh",
              background:"white",
              borderRadius:8,
              overflow:"hidden",
              display:"flex",
              flexDirection:"column",
              animation:"modalSlide .45s cubic-bezier(.16,1,.3,1) both"
            }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:"1px solid rgba(0,0,0,.05)" }}>
              <div>
                <h3 style={{ fontFamily:SERIF, fontSize:20, fontWeight:900, color:C.ink, margin:0 }}>{selectedObra.titulo}</h3>
                {selectedObra.tecnica && (
                  <div style={{ fontSize:11, color:C.sub, marginTop:4, fontFamily:SANS }}>{selectedObra.tecnica}</div>
                )}
              </div>
              <button 
                onClick={() => setSelectedObra(null)}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  width:36,
                  height:36,
                  borderRadius:"50%",
                  border:"none",
                  background:"rgba(0,0,0,.05)",
                  cursor:"pointer",
                  fontSize:20,
                  transition:"all .2s"
                }}
                onMouseOver={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.color = "white"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,.05)"; e.currentTarget.style.color = C.ink; }}
              >
                ✕
              </button>
            </div>
            <div style={{ display:"flex", flexDirection: window.innerWidth < 768 ? "column" : "row", gap:24, padding:24 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {selectedObra.imagen_principal ? (
                  <img 
                    src={selectedObra.imagen_principal} 
                    alt={selectedObra.titulo}
                    style={{ width:"100%", height:"auto", maxHeight:"55vh", objectFit:"contain", borderRadius:4 }}
                  />
                ) : (
                  <div style={{ width:"100%", height:300, background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:64, borderRadius:4 }}>🎨</div>
                )}
              </div>
              <div style={{ flex:0.8, minWidth:220 }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:color, marginBottom:8, fontFamily:NEXA_HEAVY }}>Precio</div>
                  <div style={{ fontSize:28, fontWeight:900, color:C.ink, fontFamily:NEXA_HEAVY }}>
                    {fmt(Number(selectedObra.precio_base) || Number(selectedObra.precio_minimo) || 0)}
                  </div>
                </div>
                {selectedObra.dimensiones && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:".16em", textTransform:"uppercase", color:C.sub, marginBottom:4, fontFamily:NEXA_HEAVY }}>Dimensiones</div>
                    <div style={{ fontSize:13, color:C.ink }}>{selectedObra.dimensiones}</div>
                  </div>
                )}
                {selectedObra.anio && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:".16em", textTransform:"uppercase", color:C.sub, marginBottom:4, fontFamily:NEXA_HEAVY }}>Año</div>
                    <div style={{ fontSize:13, color:C.ink }}>{selectedObra.anio}</div>
                  </div>
                )}
                <button
                  onClick={() => {
                    navigate(`/obras/${selectedObra.slug || selectedObra.id_obra}`);
                    setSelectedObra(null);
                  }}
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                  style={{
                    width:"100%",
                    padding:"12px 20px",
                    marginTop:24,
                    borderRadius:100,
                    background:color,
                    color:"white",
                    border:"none",
                    fontSize:11,
                    fontWeight:800,
                    letterSpacing:".15em",
                    textTransform:"uppercase",
                    fontFamily:NEXA_HEAVY,
                    cursor:"pointer",
                    transition:"all .25s"
                  }}
                  onMouseOver={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  Ver detalles de la obra →
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CURSOR PERSONALIZADO */}
      {createPortal(
        <>
          <div ref={dotRef} className="col-cursor-dot"/>
          <div ref={ringRef} className="col-cursor-ring"/>
        </>,
        document.body
      )}
    </>
  );
}