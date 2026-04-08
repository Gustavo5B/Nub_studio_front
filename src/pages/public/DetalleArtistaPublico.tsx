// src/pages/public/DetalleArtistaPublico.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { createPortal } from "react-dom";
import { cacheGet, cacheSet, prefetchObra, prefetchColeccion } from "../../utils/apiCache";

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
const PALETTE    = [C.orange, C.pink, C.purple, C.blue, C.gold];

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface FotoPersonal {
  id_foto: number;
  url_foto: string;
  es_principal: boolean;
  orden: number;
}

export default function DetalleArtistaPublico() {
  const navigate      = useNavigate();
  const { matricula } = useParams<{ matricula: string }>();
  const isLoggedIn    = authService.isAuthenticated();
  const userRol       = localStorage.getItem("userRol") || "";

  const [artista, setArtista]               = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [fotosPersonales, setFotosPersonales] = useState<FotoPersonal[]>([]);
  const [accordionOpen, setAccordionOpen]   = useState(true);
  const [fotoIdx, setFotoIdx]               = useState(0);
  const [colecciones, setColecciones]       = useState<any[]>([]);
  const [recomendados, setRecomendados]     = useState<any[]>([]);

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    globalThis.scrollTo(0, 0);
    const url = `${API_URL}/api/artistas/matricula/${encodeURIComponent(matricula ?? "")}`;
    const cached = cacheGet(url);
    if (cached) {
      const data = cached as any;
      setArtista(data);
      if (data.fotos_personales && Array.isArray(data.fotos_personales)) setFotosPersonales(data.fotos_personales);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(url);
        const json = await res.json();
        if (json.success) {
          cacheSet(url, json.data);
          setArtista(json.data);
          if (json.data.fotos_personales && Array.isArray(json.data.fotos_personales)) {
            setFotosPersonales(json.data.fotos_personales);
          }
          try {
            const colRes  = await fetch(`${API_URL}/api/colecciones?id_artista=${json.data.id_artista}&limit=20`);
            const colJson = await colRes.json();
            if (colJson.success) setColecciones(colJson.data);
          } catch (_) { /* no-op */ }
        }
      } catch (error) {
        console.error("Error cargando artista:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [matricula]);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/api/artistas`);
        const json = await res.json();
        if (json.success) setRecomendados(json.data.filter((a: any) => a.matricula !== matricula).slice(0, 4));
      } catch (_) { /* no-op */ }
    })();
  }, [matricula]);

  useEffect(() => {
    if (fotosPersonales.length <= 1) return;
    const id = setInterval(() => setFotoIdx(i => (i + 1) % fotosPersonales.length), 3000);
    return () => clearInterval(id);
  }, [fotosPersonales.length]);

  // ── PANTALLA DE CARGA
  if (loading) return <div style={{ minHeight:"100vh", background:"#fff" }}/>;

  if (!artista) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:"white" }}>
      <div style={{ fontSize:24, fontWeight:900, color:C.ink, fontFamily:SERIF }}>Artista no encontrado</div>
      <button onClick={() => navigate("/artistas")} style={{ padding:"12px 28px", borderRadius:100, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:NEXA_HEAVY, fontSize:11, letterSpacing:".15em", textTransform:"uppercase" }}>Ver artistas</button>
    </div>
  );

  const color      = PALETTE[artista.id_artista % PALETTE.length];
  const obras      = (artista.obras || []) as any[];
  const publicadas = obras.filter((o: any) => o.estado === "publicada" && o.activa !== false);

  const heroBg = artista.foto_portada
    ? `url(${artista.foto_portada}) center/cover no-repeat`
    : `radial-gradient(ellipse 80% 60% at 65% 50%, ${color}22 0%, transparent 65%), linear-gradient(135deg, ${C.dark} 0%, #1a1830 100%)`;

  return (
    <>
      <div style={{ minHeight:"100vh", background:"#fff", fontFamily:SANS, overflowX:"hidden", animation:"museumIn .45s ease both" }}>
        <style>{`
          @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
          @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

          .det-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            background-size:160px 160px; mix-blend-mode:multiply; }

          .det-cursor-dot { position:fixed; width:6px; height:6px; border-radius:50%; background:${C.ink}; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
          .det-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
          .det-cursor-dot.cur-over { width:4px; height:4px; background:${C.orange}; }
          .det-cursor-ring.cur-over { width:52px; height:52px; border-color:${C.orange}; }

          .det-nav-link { display:flex; align-items:center; gap:9px; font-size:9.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.5); text-decoration:none; transition:color .25s; border:none; background:none; cursor:pointer; font-family:'Nexa-Heavy',sans-serif; }
          .det-nav-link::before { content:''; display:block; width:12px; height:1px; background:currentColor; flex-shrink:0; transition:width .28s; }
          .det-nav-link:hover { color:white; }
          .det-nav-link:hover::before { width:22px; }

          .det-section-label { display:flex; align-items:center; gap:14px; margin-bottom:48px; }
          .det-section-label span { font-size:11px; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:rgba(0,0,0,.55); white-space:nowrap; font-family:'Nexa-Heavy',sans-serif; }
          .det-section-label::before, .det-section-label::after { content:''; flex:1; height:1px; background:rgba(0,0,0,.08); }

          .det-obra-card { cursor:pointer; transition:transform .55s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden; }
          .det-obra-card:hover { transform:scale(1.32); z-index:20; }
          .det-obra-card img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .7s cubic-bezier(.2,0,0,1); }
          .det-obra-card:hover img { transform:scale(1); }

          .det-col-card { position:relative; border-radius:2px; overflow:hidden; cursor:pointer; transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s; }
          .det-col-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,.13); }
          .det-col-card:hover .det-col-img { transform:scale(1.05); }
          .det-col-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

          .det-accord-panel { max-height:0; overflow:hidden; transition:max-height .7s cubic-bezier(.16,1,.3,1); }
          .det-accord-panel.open { max-height:1200px; }

          .det-col-cta { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .35s; background:rgba(13,11,20,.45); }
          .det-col-card:hover .det-col-cta { opacity:1; }
          .det-col-cta-btn { font-size:9px; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:white; font-family:'Nexa-Heavy',sans-serif; padding:9px 20px; border-radius:100px; border:1.5px solid rgba(255,255,255,.55); background:rgba(255,255,255,.08); backdrop-filter:blur(6px); cursor:pointer; }

          .det-rec-card { cursor:pointer; transition:transform .4s cubic-bezier(.16,1,.3,1); overflow:hidden; position:relative; }
          .det-rec-card:hover { transform:translateY(-5px); }
          .det-rec-card:hover .det-rec-img { transform:scale(1.05); }
          .det-rec-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

          @keyframes slideCarousel { from{opacity:0;transform:translateX(32px) scale(.97)} to{opacity:1;transform:translateX(0) scale(1)} }
          @keyframes fadeI { from{opacity:0} to{opacity:1} }
          @keyframes barIn { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
          @keyframes museumIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

          @keyframes heroImgReveal {
            0%   { opacity:0; transform:scale(1.09); filter:blur(18px) saturate(0.1) brightness(0.6); }
            60%  { filter:blur(3px) saturate(0.75) brightness(0.9); }
            100% { opacity:1; transform:scale(1); filter:blur(0) saturate(1) brightness(1); }
          }
          @keyframes bounceUp {
            0%   { opacity:0; transform:translateY(52px) scale(0.92); }
            55%  { opacity:1; transform:translateY(-13px) scale(1.035); }
            75%  { transform:translateY(6px) scale(0.988); }
            100% { opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes popIn {
            0%   { opacity:0; transform:scale(0.78) translateY(22px); }
            58%  { opacity:1; transform:scale(1.08) translateY(-6px); }
            78%  { transform:scale(0.965) translateY(3px); }
            100% { opacity:1; transform:scale(1) translateY(0); }
          }
          @keyframes slideLeft {
            0%   { opacity:0; transform:translateX(-36px); }
            55%  { opacity:1; transform:translateX(7px); }
            100% { opacity:1; transform:translateX(0); }
          }
          @keyframes slideRightIn {
            0%   { opacity:0; transform:translateX(36px); }
            55%  { opacity:1; transform:translateX(-7px); }
            100% { opacity:1; transform:translateX(0); }
          }
        `}</style>

        <div className="det-grain"/>

        {/* ══════════════════════════════════════
             HERO
        ══════════════════════════════════════ */}
        <section className="det-hero" style={{ position:"relative", height:"100vh", minHeight:600, background: artista.foto_portada ? C.dark : heroBg, overflow:"hidden" }}>
          {artista.foto_portada && (
            <div style={{
              position:"absolute", inset:0, zIndex:0,
              backgroundImage:`url(${artista.foto_portada})`,
              backgroundSize:"cover", backgroundPosition:"center",
              animation:"heroImgReveal 1.9s cubic-bezier(.16,1,.3,1) both",
            }}/>
          )}
          {artista.foto_portada && (
            <div style={{
              position:"absolute",
              inset:0,
              zIndex:1,
              background:"linear-gradient(to top, rgba(13,11,20,.92) 0%, rgba(13,11,20,.25) 50%, rgba(13,11,20,.10) 100%)",
              pointerEvents: "none"
            }}/>
          )}

          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${color} 25%, ${color} 75%, transparent)`, animation:"barIn 1.8s cubic-bezier(.16,1,.3,1) both", zIndex:10 }}/>

          <nav style={{ position:"absolute", top:30, left:52, display:"flex", flexDirection:"column", gap:10, zIndex:10, animation:"fadeI 1s ease .5s both" }}>
            {[{ l:"Inicio", to:"/" }, { l:"Galería", to:"/catalogo" }, { l:"Artistas", to:"/artistas" }, { l:"Blog", to:"/blog" }, { l:"Nosotros", to:"/sobre-nosotros" }, { l:"Contacto", to:"/contacto" }].map(({ l, to }) => (
              <Link key={l} to={to} className="det-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>{l}</Link>
            ))}
          </nav>

          <div style={{ position:"absolute", top:30, right:52, display:"flex", alignItems:"center", gap:12, zIndex:10, animation:"fadeI 1s ease .5s both" }}>
            {!isLoggedIn ? (
              <>
                <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textDecoration:"none", padding:"7px 14px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)", transition:"all .22s" }}>Ingresar</Link>
                <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"white", textDecoration:"none", padding:"7px 16px", borderRadius:100, background:color, boxShadow:`0 4px 16px ${color}40`, transition:"all .22s" }}>Ser artista</Link>
              </>
            ) : (
              <>
                <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textDecoration:"none", padding:"7px 14px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)" }}>Mi cuenta</Link>
                <button onClick={() => { authService.logout(); navigate("/"); }} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"#fff", background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)", padding:"7px 14px", borderRadius:100, cursor:"pointer", transition:"all .22s" }}>Salir</button>
              </>
            )}
          </div>

          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"0 72px 60px",
            display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:40,
            zIndex:5,
          }}>
            <div style={{ flex:1 }}>
              {artista.foto_logo && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginBottom:20, background:"rgba(255,255,255,.09)", backdropFilter:"blur(10px)", padding:"7px 18px 7px 7px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)", animation:"popIn .65s cubic-bezier(.16,1,.3,1) .25s both" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", flexShrink:0, boxShadow:`0 0 0 2px ${color}66` }}>
                    <img src={artista.foto_logo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.7)", letterSpacing:".1em", fontFamily:NEXA_HEAVY, textTransform:"uppercase" }}>
                    {artista.nombre_artistico || artista.nombre_completo?.split(" ")[0]}
                  </span>
                </div>
              )}
              {artista.categoria_nombre && (
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, marginBottom:16, fontFamily:NEXA_HEAVY, animation:"slideLeft .6s cubic-bezier(.16,1,.3,1) .4s both" }}>
                  {artista.categoria_nombre}
                </div>
              )}
              <h1 style={{ fontFamily:SERIF, fontSize:"clamp(42px,7vw,96px)", fontWeight:900, color:"white", lineHeight:.9, letterSpacing:"-.03em", margin:0, animation:"bounceUp .95s cubic-bezier(.16,1,.3,1) .55s both" }}>
                {artista.nombre_completo}
              </h1>
              {artista.nombre_artistico && (
                <div style={{ fontSize:"clamp(12px,1.6vw,15px)", color:"rgba(255,255,255,.38)", fontFamily:NEXA_HEAVY, letterSpacing:".06em", marginTop:14, fontStyle:"italic", animation:"bounceUp .7s cubic-bezier(.16,1,.3,1) .72s both" }}>
                  "{artista.nombre_artistico}"
                </div>
              )}
            </div>

            <div style={{ display:"flex", alignItems:"flex-end", gap:20, flexShrink:0, animation:"slideRightIn .85s cubic-bezier(.16,1,.3,1) .65s both" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"white", fontFamily:NEXA_HEAVY, lineHeight:1 }}>
                  {publicadas.length}
                </div>
                <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.35)", letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, marginTop:2 }}>
                  {publicadas.length === 1 ? "Obra" : "Obras"}
                </div>
                <div style={{ height:1, background:"rgba(255,255,255,.08)", margin:"8px 0" }}/>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.25)", letterSpacing:".06em", fontFamily:SANS }}>{artista.matricula}</div>
              </div>
              {artista.foto_perfil ? (
                <div style={{ width:114, height:114, borderRadius:"50%", overflow:"hidden", border:`3px solid ${color}`, boxShadow:`0 0 0 6px rgba(255,255,255,.08), 0 10px 28px rgba(0,0,0,.4)`, flexShrink:0 }}>
                  <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                </div>
              ) : (
                <div style={{ width:114, height:114, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:42, fontWeight:900, color:"white", fontFamily:SERIF, flexShrink:0, boxShadow:`0 0 0 6px rgba(255,255,255,.08)` }}>
                  {artista.nombre_completo?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:1, height:40, background:"linear-gradient(to bottom, transparent, rgba(255,255,255,.15))", pointerEvents:"none" }}/>
        </section>

        {/* ══════════════════════════════════════
             I · BIO
        ══════════════════════════════════════ */}
        <section style={{ borderTop:`3px solid ${color}`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"100%", background:`linear-gradient(135deg, ${color}08 0%, transparent 65%)`, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", left:-4, top:"50%", transform:"translateY(-50%)", fontFamily:SERIF, fontSize:240, fontWeight:900, fontStyle:"italic", color:`${color}07`, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>I</div>

          <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr" }}>
            
            {/* COLUMNA IZQUIERDA */}
            <div style={{ padding:"64px 72px 56px", borderRight:"1px solid rgba(0,0,0,.05)" }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:color, marginBottom:22, fontFamily:NEXA_HEAVY }}>
                I · Sobre el artista
              </div>
              
              <p style={{ 
                fontFamily:SERIF, 
                fontSize:"clamp(24px,3vw,36px)",
                fontStyle:"italic", 
                fontWeight:400, 
                color: artista.biografia ? C.ink : "rgba(0,0,0,.18)", 
                lineHeight:1.4, 
                letterSpacing:"-.01em", 
                margin:"0 0 32px",
                maxWidth:680 
              }}>
                "{artista.biografia || "El arte habla donde las palabras no alcanzan."}"
              </p>
              
              {artista.biografia_larga && (
                <div style={{ marginTop:24 }}>
                  <div style={{ 
                    fontSize:11, 
                    fontWeight:700, 
                    letterSpacing:".12em", 
                    textTransform:"uppercase", 
                    color:color, 
                    marginBottom:12,
                    fontFamily:NEXA_HEAVY 
                  }}>
                    Trayectoria
                  </div>
                  <p style={{ 
                    fontSize:14, 
                    lineHeight:1.6, 
                    color:C.sub, 
                    fontFamily:SANS,
                    marginBottom:24 
                  }}>
                    {artista.biografia_larga}
                  </p>
                </div>
              )}
              
              {artista.especialidad && (
                <div style={{ 
                  display:"flex", 
                  flexWrap:"wrap", 
                  gap:10, 
                  marginTop: artista.biografia_larga ? 0 : 24 
                }}>
                  {artista.especialidad.split(',').map((esp: string, idx: number) => (
                    <span key={idx} style={{
                      fontSize:11,
                      fontWeight:600,
                      padding:"6px 14px",
                      background:`${color}12`,
                      color:color,
                      borderRadius:100,
                      fontFamily:SANS,
                      letterSpacing:".02em"
                    }}>
                      {esp.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA */}
            <div style={{
              padding:"64px 44px 56px",
              display:"flex", 
              flexDirection:"column", 
              gap:28, 
              justifyContent:"center",
              background:`linear-gradient(135deg, ${color}04 0%, transparent 100%)`
            }}>
              
              {artista.correo && (
                <div>
                  <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:8 }}>Correo</div>
                  <a href={`mailto:${artista.correo}`} 
                     style={{ fontSize:13, color:C.ink, fontFamily:SANS, wordBreak:"break-all", textDecoration:"none", transition:"color .2s" }}
                     onMouseEnter={e => { cursorOn(); (e.target as HTMLElement).style.color = C.orange; }}
                     onMouseLeave={e => { cursorOff(); (e.target as HTMLElement).style.color = C.ink; }}>
                    {artista.correo}
                  </a>
                </div>
              )}
              
              {artista.telefono && (
                <div>
                  <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:8 }}>Teléfono</div>
                  <a href={`tel:${artista.telefono}`} 
                     style={{ fontSize:13, color:C.ink, fontFamily:SANS, textDecoration:"none", transition:"color .2s" }}
                     onMouseEnter={e => { cursorOn(); (e.target as HTMLElement).style.color = C.orange; }}
                     onMouseLeave={e => { cursorOff(); (e.target as HTMLElement).style.color = C.ink; }}>
                    {artista.telefono}
                  </a>
                </div>
              )}
              
              <div>
                <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:8 }}>Región</div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:SANS }}>Huasteca Hidalguense</div>
              </div>
              
              {(artista.instagram || artista.facebook || artista.twitter) && (
                <div>
                  <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:12 }}>Redes</div>
                  <div style={{ display:"flex", gap:16, flexDirection:"column" }}>
                    {artista.instagram && (
                      <a href={artista.instagram} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize:12, color:C.sub, textDecoration:"none", transition:"color .2s" }}
                         onMouseEnter={e => { cursorOn(); (e.currentTarget).style.color = C.orange; }}
                         onMouseLeave={e => { cursorOff(); (e.currentTarget).style.color = C.sub; }}>
                        Instagram
                      </a>
                    )}
                    {artista.facebook && (
                      <a href={artista.facebook} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize:12, color:C.sub, textDecoration:"none", transition:"color .2s" }}
                         onMouseEnter={e => { cursorOn(); (e.currentTarget).style.color = C.orange; }}
                         onMouseLeave={e => { cursorOff(); (e.currentTarget).style.color = C.sub; }}>
                        Facebook
                      </a>
                    )}
                    {artista.twitter && (
                      <a href={artista.twitter} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize:12, color:C.sub, textDecoration:"none", transition:"color .2s" }}
                         onMouseEnter={e => { cursorOn(); (e.currentTarget).style.color = C.orange; }}
                         onMouseLeave={e => { cursorOff(); (e.currentTarget).style.color = C.sub; }}>
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div style={{ 
                display:"inline-flex", 
                alignItems:"center", 
                gap:10, 
                padding:"10px 20px", 
                borderRadius:100, 
                background:`${color}12`,
                border:`1px solid ${color}25`,
                marginTop:8,
                width:"fit-content"
              }}>
                <span style={{ fontSize:9, fontWeight:800, color:color, letterSpacing:".12em", textTransform:"uppercase", fontFamily:NEXA_HEAVY }}>
                  ✓ Certificado NUB
                </span>
              </div>
            </div>
          </div>

          {/* STATS BAR */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:48, padding:"20px 72px", background:"rgba(0,0,0,.025)", borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <button onClick={() => document.getElementById("sec-obras")?.scrollIntoView({ behavior:"smooth" })} onMouseEnter={e => { cursorOn(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = C.orange; }} onMouseLeave={e => { cursorOff(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = color; }}
              style={{ display:"flex", alignItems:"baseline", gap:8, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              <span className="stat-num" style={{ fontFamily:NEXA_HEAVY, fontSize:28, fontWeight:900, color:color, lineHeight:1, transition:"color .2s" }}>{publicadas.length}</span>
              <span style={{ fontSize:9, fontWeight:800, color:C.ink, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY }}>obras</span>
            </button>
            {colecciones.length > 0 && <>
              <div style={{ width:1, height:26, background:"rgba(0,0,0,.12)" }}/>
              <button onClick={() => document.getElementById("sec-colecciones")?.scrollIntoView({ behavior:"smooth" })} onMouseEnter={e => { cursorOn(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = C.orange; }} onMouseLeave={e => { cursorOff(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = C.ink; }}
                style={{ display:"flex", alignItems:"baseline", gap:8, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <span className="stat-num" style={{ fontFamily:NEXA_HEAVY, fontSize:28, fontWeight:900, color:C.ink, lineHeight:1, transition:"color .2s" }}>{colecciones.length}</span>
                <span style={{ fontSize:9, fontWeight:800, color:C.ink, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY }}>colecciones</span>
              </button>
            </>}
            {fotosPersonales.length > 0 && <>
              <div style={{ width:1, height:26, background:"rgba(0,0,0,.12)" }}/>
              <button onClick={() => document.getElementById("sec-fotos")?.scrollIntoView({ behavior:"smooth" })} onMouseEnter={e => { cursorOn(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = C.orange; }} onMouseLeave={e => { cursorOff(); (e.currentTarget.querySelector(".stat-num") as HTMLElement).style.color = C.ink; }}
                style={{ display:"flex", alignItems:"baseline", gap:8, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <span className="stat-num" style={{ fontFamily:NEXA_HEAVY, fontSize:28, fontWeight:900, color:C.ink, lineHeight:1, transition:"color .2s" }}>{fotosPersonales.length}</span>
                <span style={{ fontSize:9, fontWeight:800, color:C.ink, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY }}>fotos</span>
              </button>
            </>}
          </div>
        </section>

        {/* ══════════════════════════════════════
             II · FOTOS PERSONALES
        ══════════════════════════════════════ */}
        <section id="sec-fotos" style={{ padding:"80px 0 90px", background:"#fafaf9", borderTop:"1px solid rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom: fotosPersonales.length > 0 ? 48 : 0, padding:"0 72px" }}>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            <button
              onClick={() => fotosPersonales.length > 0 && setAccordionOpen(o => !o)}
              onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ fontSize:11, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color: fotosPersonales.length === 0 ? "rgba(0,0,0,.18)" : accordionOpen ? C.orange : "rgba(0,0,0,.55)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY, background:"none", border:"none", cursor: fotosPersonales.length === 0 ? "default" : "pointer", transition:"color .25s", display:"flex", alignItems:"center", gap:10 }}
            >
              II · Galería personal
              {fotosPersonales.length > 0 && <span style={{ fontSize:7, color:"inherit", display:"inline-block", transform: accordionOpen ? "rotate(180deg)" : "none", transition:"transform .4s cubic-bezier(.16,1,.3,1)" }}>▾</span>}
            </button>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
          </div>

          <div className={`det-accord-panel${accordionOpen ? " open" : ""}`}>
            {fotosPersonales.length > 0 && (
              <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 0 48px", gap:0 }}>
                {fotosPersonales.length > 1 && (
                  <button onClick={() => setFotoIdx(i => (i - 1 + fotosPersonales.length) % fotosPersonales.length)}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ position:"absolute", left:32, zIndex:10, width:48, height:48, borderRadius:"50%", background:"rgba(0,0,0,.07)", border:"1px solid rgba(0,0,0,.10)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.ink }}>
                    ←
                  </button>
                )}

                <div key={fotoIdx} style={{ width:"min(480px, 70vw)", height:520, overflow:"hidden", position:"relative", borderRadius:4, boxShadow:"0 20px 60px rgba(0,0,0,.14)", animation:"slideCarousel .45s cubic-bezier(.16,1,.3,1) both" }}>
                  <img src={fotosPersonales[fotoIdx].url_foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", display:"block" }}/>
                </div>

                {fotosPersonales.length > 1 && (
                  <button onClick={() => setFotoIdx(i => (i + 1) % fotosPersonales.length)}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ position:"absolute", right:32, zIndex:10, width:48, height:48, borderRadius:"50%", background:"rgba(0,0,0,.07)", border:"1px solid rgba(0,0,0,.10)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.ink }}>
                    →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════
             III · COLECCIONES
        ══════════════════════════════════════ */}
        {colecciones.length > 0 && (
          <section id="sec-colecciones" style={{ padding:"80px 72px 90px", borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <div className="det-section-label"><span>III · Colecciones</span></div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
              {colecciones.map((col: any) => (
                <div key={col.id_coleccion} className="det-col-card"
                  onClick={() => navigate(`/colecciones/${col.slug}`)}
                  style={{ height:300, position:"relative" }}
                  onMouseEnter={() => { cursorOn(); prefetchColeccion(col.slug); }} onMouseLeave={cursorOff}
                >
                  {col.imagen_portada ? (
                    <img className="det-col-img" src={col.imagen_portada} alt={col.nombre}/>
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}12, #f5f4f0)` }}/>
                  )}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.88) 0%, rgba(13,11,20,.05) 55%)" }}/>
                  {col.destacada && (
                    <div style={{ position:"absolute", top:14, left:14, fontSize:8, fontWeight:800, color:"white", letterSpacing:".16em", textTransform:"uppercase", background:color, padding:"4px 10px", borderRadius:100, fontFamily:NEXA_HEAVY }}>Destacada</div>
                  )}
                  <div className="det-col-cta">
                    <span className="det-col-cta-btn">Ver colección →</span>
                  </div>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 20px 20px" }}>
                    <div style={{ fontSize:17, fontWeight:900, color:"white", fontFamily:SERIF, lineHeight:1.1, marginBottom:5 }}>{col.nombre}</div>
                    {col.historia && <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:SANS, lineHeight:1.5 }}>{col.historia}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════
             IV · OBRAS - CORREGIDO ✅
        ══════════════════════════════════════ */}
        {publicadas.length > 0 && (
          <section id="sec-obras" style={{ padding:"80px 0 0", background:"#fafaf9", borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:32, padding:"0 72px" }}>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
              <div style={{ fontSize:13, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:C.ink, whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
                {colecciones.length > 0 ? "IV" : "III"} · Obras de arte
              </div>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
              <Link to="/catalogo" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ fontSize:8.5, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:C.orange, whiteSpace:"nowrap", textDecoration:"none", fontFamily:SANS }}>
                Ver galería →
              </Link>
            </div>

            <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"40px 72px 60px", scrollSnapType:"x mandatory", scrollbarWidth:"thin", alignItems:"center" }}>
              {publicadas.map((obra: any) => (
                <div key={obra.id_obra} className="det-obra-card"
                  style={{ flexShrink:0, width:220, height:280, scrollSnapAlign:"start", position:"relative" }}
                  onClick={() => {
                    // ✅ CORREGIDO: Usar SIEMPRE el ID numérico de la obra
                    navigate(`/obras/${obra.id_obra}`);
                  }}
                  onMouseEnter={() => { cursorOn(); prefetchObra(obra.slug || obra.id_obra); }} onMouseLeave={cursorOff}
                >
                  {obra.imagen_principal ? (
                    <img src={obra.imagen_principal} alt={obra.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎨</div>
                  )}
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 14px", background:"linear-gradient(to top, rgba(13,11,20,.8), transparent)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"white", fontFamily:NEXA_HEAVY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{obra.titulo}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", fontFamily:SANS, marginTop:2 }}>{fmt(Number(obra.precio_base) || 0)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height:60 }}/>
          </section>
        )}

        {/* ══════════════════════════════════════
             ARTISTAS RECOMENDADOS
        ══════════════════════════════════════ */}
        {recomendados.length > 0 && (
          <section style={{ padding:"80px 72px 90px", borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <div className="det-section-label"><span>Descubre más · Otros artistas</span></div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
              {recomendados.map((rec: any) => {
                const rc = PALETTE[rec.id_artista % PALETTE.length];
                return (
                  <div key={rec.id_artista} className="det-rec-card"
                    onClick={() => navigate(`/artistas/${rec.matricula}`)}
                    style={{ height:260, borderRadius:2, border:"1px solid rgba(0,0,0,.06)", position:"relative" }}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  >
                    {rec.foto_portada ? (
                      <img className="det-rec-img" src={rec.foto_portada} alt={rec.nombre_completo}/>
                    ) : (
                      <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, ${rc}15, #f5f4f0)` }}/>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.85) 0%, rgba(13,11,20,.0) 55%)" }}/>
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 16px 18px" }}>
                      {rec.foto_perfil && (
                        <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:`1.5px solid ${rc}`, marginBottom:8 }}>
                          <img src={rec.foto_perfil} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        </div>
                      )}
                      <div style={{ fontSize:14, fontWeight:900, color:"white", fontFamily:SERIF, lineHeight:1.1 }}>{rec.nombre_completo}</div>
                      {rec.categoria_nombre && <div style={{ fontSize:8, fontWeight:800, color:rc, letterSpacing:".14em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, marginTop:4 }}>{rec.categoria_nombre}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ padding:"22px 72px", borderTop:"1px solid rgba(0,0,0,.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(0,0,0,.14)", fontFamily:NEXA_HEAVY, letterSpacing:".1em" }}>NU★B STUDIO</div>
          <button onClick={() => navigate("/artistas")}
            onMouseEnter={e => { cursorOn(); (e.currentTarget as HTMLElement).style.color = C.orange; }}
            onMouseLeave={e => { cursorOff(); (e.currentTarget as HTMLElement).style.color = C.ink; }}
            style={{ fontSize:11, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:C.ink, border:"none", background:"none", cursor:"pointer", fontFamily:NEXA_HEAVY, transition:"color .2s" }}
          >← Ver todos los artistas</button>
        </div>
      </div>

      {/* CURSOR CON PORTAL */}
      {createPortal(
        <>
          <div ref={dotRef} className="det-cursor-dot"/>
          <div ref={ringRef} className="det-cursor-ring"/>
        </>,
        document.body
      )}
    </>
  );
}