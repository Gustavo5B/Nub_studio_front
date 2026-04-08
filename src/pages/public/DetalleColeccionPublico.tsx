// src/pages/public/DetalleColeccionPublico.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { authService } from "../../services/authService";

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
  offWhite: "#FAFAF9",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 }).format(p);

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
  artista_nombre: string;
  artista_alias?: string;
  artista_foto?: string;
  id_artista?: number;
  obras: Obra[];
}

export default function DetalleColeccionPublico() {
  const navigate      = useNavigate();
  const { slug }      = useParams<{ slug: string }>();
  const isLoggedIn    = authService.isAuthenticated();
  const userRol       = localStorage.getItem("userRol") || "";

  const [coleccion, setColeccion] = useState<Coleccion | null>(null);
  const [loading, setLoading]     = useState(true);
  const [obrasVisibles, setObrasVisibles] = useState(12);
  const [coleccionesRecomendadas, setColeccionesRecomendadas] = useState<any[]>([]);

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // ═══ CURSOR PERSONALIZADO — FUNCIONA EN TODA LA PÁGINA ═══
  useEffect(() => {
    document.body.style.cursor = "none";
    document.documentElement.style.cursor = "none";
    
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;
    let isAnimating = false;
    
    // Loop de animación continuo — se ejecuta SIEMPRE
    const animate = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      
      if (ringRef.current) {
        ringRef.current.style.left = `${rx}px`;
        ringRef.current.style.top = `${ry}px`;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    // Al mover el mouse, solo actualiza coordenadas
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      
      // Detección de fondo oscuro para cambiar color del cursor
      const el     = document.elementFromPoint(mx, my);
      const inDark = el?.closest("section:first-child") !== null || el?.closest(".col-grain") !== null;
      dotRef.current?.classList.toggle("cur-light", inDark);
      ringRef.current?.classList.toggle("cur-light", inDark);
      
      // Inicia el loop si no está corriendo
      if (!isAnimating) {
        isAnimating = true;
        animate();
      }
    };
    
    document.addEventListener("mousemove", onMove, { passive: true });
    
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.cursor = "auto";
      document.documentElement.style.cursor = "auto";
    };
  }, []);

  const cursorOn  = useCallback(() => { dotRef.current?.classList.add("cur-over");    ringRef.current?.classList.add("cur-over");    }, []);
  const cursorOff = useCallback(() => { dotRef.current?.classList.remove("cur-over"); ringRef.current?.classList.remove("cur-over"); }, []);

  // ═══ CARGAR COLECCIÓN + OBRAS ═══
  useEffect(() => {
    globalThis.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      try {
        // 1. Cargar colección
        const res  = await fetch(`${API_URL}/api/colecciones/slug/${slug}`);
        const json = await res.json();
        if (json.success) {
          const colData = json.data;
          setColeccion(colData);
          
          // 2. Cargar obras de la colección por separado
          if (colData.id_coleccion) {
            try {
              const obrasRes = await fetch(`${API_URL}/api/obras?id_coleccion=${colData.id_coleccion}&limit=100`);
              const obrasJson = await obrasRes.json();
              if (obrasJson.success && obrasJson.data) {
                // Actualizar colección con las obras cargadas
                setColeccion(prev => prev ? { ...prev, obras: obrasJson.data } : null);
              }
            } catch (e) {
              console.log("Error cargando obras:", e);
            }
          }
          
          // 3. Cargar colecciones recomendadas
          if (colData.id_artista) {
            const recRes  = await fetch(`${API_URL}/api/colecciones?id_artista=${colData.id_artista}&limit=4`);
            const recJson = await recRes.json();
            if (recJson.success) setColeccionesRecomendadas(recJson.data.filter((c: any) => c.slug !== slug).slice(0, 4));
          }
        } else { setColeccion(null); }
      } catch { setColeccion(null); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  // Reveal on scroll
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    const targets = container.querySelectorAll<HTMLElement>("[data-rv]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { (entry.target as HTMLElement).classList.add("rv-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [coleccion]);

  if (loading) return <div style={{ minHeight:"100vh", background:"#fff" }}/>;

  if (!coleccion) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:C.dark }}>
      <style>{`@font-face{font-family:'SolveraLorvane';src:url('/fonts/SolveraLorvane.ttf') format('truetype');}@font-face{font-family:'Nexa-Heavy';src:url('/fonts/Nexa-Heavy.ttf') format('truetype');}`}</style>
      <div style={{ fontFamily:SERIF, fontSize:24, fontWeight:900, color:"white" }}>Colección no encontrada</div>
      <button onClick={() => navigate("/catalogo")} style={{ padding:"12px 28px", borderRadius:100, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"'Nexa-Heavy',sans-serif", fontSize:11, letterSpacing:".15em", textTransform:"uppercase" }}>Ver catálogo</button>
    </div>
  );

  const palette    = [C.orange, C.pink, C.purple, C.blue, C.gold];
  const color      = palette[(coleccion.id_artista || 0) % palette.length] || C.orange;
  const obrasActivas  = coleccion.obras?.filter(o => o.estado === "publicada" && o.activa === true) || [];
  const obrasMostradas = obrasActivas.slice(0, obrasVisibles);
  const hasMore    = obrasVisibles < obrasActivas.length;
  const artistaNombre = coleccion.artista_nombre || "";
  const artistaAlias  = coleccion.artista_alias;
  const artistaFoto   = coleccion.artista_foto;

  return (
    <>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
        * { box-sizing:border-box; }

        .col-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px 160px; mix-blend-mode:multiply; }

        .col-cursor-dot  { position:fixed; width:6px;  height:6px;  border-radius:50%; background:${C.ink}; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
        .col-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
        .col-cursor-dot.cur-over  { width:4px;  height:4px;  background:${C.orange}; }
        .col-cursor-ring.cur-over { width:52px; height:52px; border-color:${C.orange}; }
        .col-cursor-dot.cur-light  { background:#fff; }
        .col-cursor-ring.cur-light { border-color:rgba(255,255,255,.3); }

        @keyframes barIn { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        @keyframes fadeI { from{opacity:0} to{opacity:1} }

        .col-nav-link { display:inline-flex; align-items:center; gap:8px; font-size:9px; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:white; text-decoration:none; transition:all .25s; border:none; cursor:pointer; font-family:'Nexa-Heavy',sans-serif; background:rgba(13,11,20,.52); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:7px 14px 7px 12px; border-radius:100px; border:1px solid rgba(255,255,255,.12); }
        .col-nav-link::before { content:''; display:block; width:10px; height:1px; background:rgba(255,255,255,.5); flex-shrink:0; transition:width .28s; }
        .col-nav-link:hover { background:rgba(13,11,20,.78); border-color:rgba(255,255,255,.25); color:white; }
        .col-nav-link:hover::before { width:16px; background:white; }

        [data-rv] { opacity:0; transform:translateY(24px); transition:opacity .9s ease, transform .9s ease; }
        [data-rv].rv-in { opacity:1; transform:translateY(0); }
        [data-rv][data-d="1"] { transition-delay:.08s; }
        [data-rv][data-d="2"] { transition-delay:.16s; }
        [data-rv][data-d="3"] { transition-delay:.24s; }

        .col-obra-card { cursor:pointer; position:relative; overflow:hidden; background:#fff; transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s; }
        .col-obra-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.14); }
        .col-obra-card img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .6s cubic-bezier(.2,0,0,1); }
        .col-obra-card:hover img { transform:scale(1.04); }
        .col-obra-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(13,11,20,.9) 0%, transparent 55%); transition:opacity .3s; }
        .col-obra-cta { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(.88); opacity:0; transition:all .3s cubic-bezier(.16,1,.3,1); font-size:9px; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:white; font-family:'Nexa-Heavy',sans-serif; padding:9px 20px; border-radius:100px; border:1.5px solid rgba(255,255,255,.55); background:rgba(255,255,255,.08); backdrop-filter:blur(6px); cursor:pointer; white-space:nowrap; }
        .col-obra-card:hover .col-obra-cta { opacity:1; transform:translate(-50%,-50%) scale(1); }

        .col-rec-card { cursor:pointer; transition:transform .4s cubic-bezier(.16,1,.3,1); overflow:hidden; position:relative; border-radius:2px; }
        .col-rec-card:hover { transform:translateY(-5px); }
        .col-rec-card:hover .col-rec-img { transform:scale(1.05); }
        .col-rec-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(0,0,0,.1); border-radius:4px; }
      `}</style>

      {/* Grain + cursor fuera del wrapper animado */}
      <div className="col-grain"/>
      <div ref={dotRef}  className="col-cursor-dot"/>
      <div ref={ringRef} className="col-cursor-ring"/>

      <div ref={pageRef} style={{ minHeight:"100vh", background:"#fff", fontFamily:SANS, overflowX:"hidden" }}>

        {/* ════════════════════════════════════
             HERO SPLIT — imagen+nav+título | historia blanca
        ════════════════════════════════════ */}
        <section style={{ display:"grid", gridTemplateColumns:"55fr 45fr", height:"100vh", minHeight:600, position:"relative" }}>

          {/* ── PANEL IZQUIERDO: imagen + nav + título ── */}
          <div style={{ position:"relative", overflow:"hidden", background:"#0a0910" }}>
            {coleccion.imagen_portada ? (
              <img
                src={coleccion.imagen_portada}
                alt={coleccion.nombre}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform .8s cubic-bezier(.2,0,0,1)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform="scale(1.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform="scale(1)"}
              />
            ) : (
              <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}22, #1a1830)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:SERIF, fontSize:160, fontWeight:900, color:`${color}20`, fontStyle:"italic" }}>{coleccion.nombre?.[0]}</span>
              </div>
            )}


            {/* Línea de color superior */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${color} 50%, transparent)`, animation:"barIn 1.8s cubic-bezier(.16,1,.3,1) both", zIndex:2 }}/>

            {/* NAV izquierda */}
            <nav style={{ position:"absolute", top:30, left:44, display:"flex", flexDirection:"column", gap:10, zIndex:10, animation:"fadeI 1s ease .5s both" }}>
              {[{ l:"Galería", to:"/catalogo" }, { l:"Artistas", to:"/artistas" }, { l:"Blog", to:"/blog" }, { l:"Contacto", to:"/contacto" }].map(({ l, to }) => (
                <Link key={l} to={to} className="col-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>{l}</Link>
              ))}
            </nav>

            {/* Título + artista — abajo izquierda */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0, padding:"80px 44px 48px",
              background:"linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.45) 55%, transparent 100%)",
              zIndex:5,
            }}>
              {coleccion.destacada && (
                <div style={{ display:"inline-block", fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, marginBottom:16, fontFamily:NEXA_HEAVY, background:`${color}22`, padding:"4px 12px", borderRadius:100 }}>
                  ★ Colección destacada
                </div>
              )}

              <h1 style={{ fontFamily:SERIF, fontSize:"clamp(40px,5.5vw,88px)", fontWeight:900, color:"white", lineHeight:.88, letterSpacing:"-.03em", margin:"0 0 22px", textShadow:"0 2px 32px rgba(0,0,0,.9), 0 1px 6px rgba(0,0,0,.8), 0 8px 48px rgba(0,0,0,.7)" }}>
                {coleccion.nombre}
              </h1>

              {/* Artista pill */}
              <Link
                to={coleccion.id_artista ? `/artistas/${coleccion.id_artista}` : "/artistas"}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", background:"rgba(255,255,255,.1)", backdropFilter:"blur(8px)", padding:"7px 18px 7px 9px", borderRadius:100, border:"1px solid rgba(255,255,255,.18)", transition:"all .25s" }}
                onMouseOver={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.18)"}
                onMouseOut={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.1)"}
              >
                <div style={{ width:28, height:28, borderRadius:"50%", overflow:"hidden", border:`1.5px solid ${color}`, flexShrink:0 }}>
                  {artistaFoto
                    ? <img src={artistaFoto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ width:"100%", height:"100%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"white", fontFamily:SERIF }}>{artistaNombre?.charAt(0) || "A"}</div>
                  }
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:"white", fontFamily:NEXA_HEAVY, letterSpacing:".06em" }}>
                  {artistaNombre}{artistaAlias && ` · ${artistaAlias}`}
                </span>
              </Link>
            </div>
          </div>

          {/* ── PANEL DERECHO: historia + stats — fondo BLANCO ── */}
          <div style={{ background:"#fff", overflowY:"auto", display:"flex", flexDirection:"column", justifyContent:"center", padding:"52px 64px 52px 56px", position:"relative", borderLeft:`3px solid ${color}` }}>

            {/* Nav derecha (cuenta) */}
            <div style={{ position:"absolute", top:28, right:32, display:"flex", alignItems:"center", gap:12, animation:"fadeI 1s ease .5s both" }}>
              {!isLoggedIn ? (
                <>
                  <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", textDecoration:"none", padding:"6px 14px", borderRadius:100, border:"1px solid rgba(0,0,0,.1)", transition:"all .22s", fontFamily:NEXA_HEAVY }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.color=C.ink}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.color="rgba(0,0,0,.3)"}
                  >Ingresar</Link>
                  <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"white", textDecoration:"none", padding:"6px 14px", borderRadius:100, background:color, fontFamily:NEXA_HEAVY }}>Ser artista</Link>
                </>
              ) : (
                <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", textDecoration:"none", padding:"6px 14px", borderRadius:100, border:"1px solid rgba(0,0,0,.1)", fontFamily:NEXA_HEAVY }}>Mi cuenta</Link>
              )}
            </div>

            {/* Volver */}
            <button onClick={() => navigate(-1 as any)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ alignSelf:"flex-start", background:"none", border:"none", color:"rgba(0,0,0,.25)", fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", padding:0, marginBottom:40, transition:"color .2s" }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.color=C.ink}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.color="rgba(0,0,0,.25)"}
            >← Volver</button>

            {/* Decorativo tipográfico */}
            <div style={{ position:"absolute", right:-6, top:"40%", fontFamily:SERIF, fontSize:220, fontWeight:900, fontStyle:"italic", color:`${color}05`, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>"</div>

            <div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:color, marginBottom:20, fontFamily:NEXA_HEAVY }}>
                I · Historia de la colección
              </div>

              <p style={{ fontFamily:SERIF, fontSize:"clamp(17px,1.8vw,26px)", fontStyle:"italic", fontWeight:400, color:coleccion.historia ? C.ink : "rgba(0,0,0,.18)", lineHeight:1.55, letterSpacing:"-.01em", margin:"0 0 44px", maxWidth:500 }}>
                "{coleccion.historia || "El artista aún no ha compartido la historia detrás de esta colección."}"
              </p>

              {/* Stats */}
              <div style={{ display:"flex", alignItems:"center", gap:28 }}>
                <div>
                  <div style={{ fontSize:36, fontWeight:900, color:color, fontFamily:NEXA_HEAVY, lineHeight:1 }}>{obrasActivas.length}</div>
                  <div style={{ fontSize:8, fontWeight:800, color:"rgba(0,0,0,.28)", letterSpacing:".2em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, marginTop:5 }}>obras</div>
                </div>
                {coleccion.fecha_creacion && (
                  <>
                    <div style={{ width:1, height:38, background:"rgba(0,0,0,.1)" }}/>
                    <div>
                      <div style={{ fontSize:36, fontWeight:900, color:C.ink, fontFamily:NEXA_HEAVY, lineHeight:1 }}>{new Date(coleccion.fecha_creacion).getFullYear()}</div>
                      <div style={{ fontSize:8, fontWeight:800, color:"rgba(0,0,0,.28)", letterSpacing:".2em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, marginTop:5 }}>año</div>
                    </div>
                  </>
                )}
              </div>

              {/* CTA scroll a obras */}
              {obrasActivas.length > 0 && (
                <button
                  onClick={() => document.getElementById("sec-obras")?.scrollIntoView({ behavior:"smooth" })}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ marginTop:44, display:"inline-flex", alignItems:"center", gap:10, padding:"11px 24px", borderRadius:100, background:"transparent", border:`1px solid ${color}`, color:color, fontSize:9, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .28s" }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background=color; (e.currentTarget as HTMLElement).style.color="white"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color=color; }}
                >Ver obras de la colección ↓</button>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
             II · OBRAS DE LA COLECCIÓN
        ════════════════════════════════════ */}
        <section id="sec-obras" style={{ padding:"80px 0 90px", background:"#fff", borderTop:"1px solid rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:48, padding:"0 72px" }} data-rv>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.7)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
              II · Obras en la colección
            </div>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
            {obrasActivas.length > 0 && (
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.22)", whiteSpace:"nowrap", fontFamily:SANS }}>
                {obrasActivas.length} obra{obrasActivas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {obrasActivas.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, fontFamily:SANS }}>
              <div style={{ fontFamily:SERIF, fontSize:48, color:"rgba(0,0,0,.06)", fontWeight:900, marginBottom:12 }}>∅</div>
              <div style={{ fontSize:14 }}>Esta colección aún no tiene obras publicadas.</div>
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12, padding:"0 72px" }}>
                {obrasMostradas.map((obra, idx) => (
                  <div
                    key={obra.id_obra}
                    className="col-obra-card"
                    data-rv
                    data-d={Math.min(idx % 3, 3) as any}
                    onClick={() => navigate(`/obras/${obra.slug || obra.id_obra}`)}
                    onMouseEnter={cursorOn}
                    onMouseLeave={cursorOff}
                    style={{ height:360 }}
                  >
                    {obra.imagen_principal ? (
                      <img src={obra.imagen_principal} alt={obra.titulo}/>
                    ) : (
                      <div style={{ width:"100%", height:"100%", background:`${color}10`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontFamily:SERIF, fontSize:56, color:`${color}30`, fontWeight:900 }}>A</span>
                      </div>
                    )}

                    <div className="col-obra-overlay"/>

                    <div className="col-obra-cta">Ver obra →</div>

                    {/* Info abajo */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 18px" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"white", fontFamily:NEXA_HEAVY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{obra.titulo}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", fontFamily:SANS, marginTop:4 }}>
                        {fmt(Number(obra.precio_base) || Number(obra.precio_minimo) || 0)}
                      </div>
                      {obra.tecnica && (
                        <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontFamily:SANS, marginTop:2 }}>{obra.tecnica}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign:"center", marginTop:52 }}>
                  <button
                    onClick={() => setObrasVisibles(prev => prev + 12)}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ padding:"12px 36px", borderRadius:100, background:"transparent", border:`1px solid ${color}`, color:color, fontSize:10, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .25s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = color; (e.currentTarget as HTMLElement).style.color = "white"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = color; }}
                  >
                    Cargar más ({obrasActivas.length - obrasVisibles} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ════════════════════════════════════
             III · OTRAS COLECCIONES
        ════════════════════════════════════ */}
        {coleccionesRecomendadas.length > 0 && (
          <section style={{ padding:"80px 72px 90px", background:C.offWhite, borderTop:"1px solid rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:48 }} data-rv>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
              <div style={{ fontSize:13, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.7)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
                III · Más colecciones del artista
              </div>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
              {coleccionesRecomendadas.map((col: any) => (
                <div
                  key={col.id_coleccion}
                  className="col-rec-card"
                  onClick={() => navigate(`/colecciones/${col.slug}`)}
                  style={{ height:300, position:"relative", background:`${color}08` }}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                >
                  {col.imagen_portada ? (
                    <img className="col-rec-img" src={col.imagen_portada} alt={col.nombre}/>
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}12, #f5f4f0)` }}/>
                  )}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.88) 0%, rgba(13,11,20,.05) 55%)" }}/>
                  {col.destacada && (
                    <div style={{ position:"absolute", top:14, left:14, fontSize:8, fontWeight:800, color:"white", letterSpacing:".16em", textTransform:"uppercase", background:color, padding:"4px 10px", borderRadius:100, fontFamily:NEXA_HEAVY }}>★ Destacada</div>
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

        {/* Footer */}
        <div style={{ padding:"22px 72px", borderTop:"1px solid rgba(0,0,0,.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(0,0,0,.12)", fontFamily:NEXA_HEAVY, letterSpacing:".1em" }}>NU★B STUDIO</div>
          <button
            onClick={() => navigate("/catalogo")}
            onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ fontSize:11, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:C.ink, border:"none", background:"none", cursor:"pointer", fontFamily:NEXA_HEAVY, transition:"color .2s" }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.color = C.orange}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          >← Ver catálogo completo</button>
        </div>
      </div>
    </>
  );
}