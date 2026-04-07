// src/pages/public/DetalleArtistaPublico.tsx
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
  const [visible, setVisible]               = useState(false);
  const [fotosPersonales, setFotosPersonales] = useState<FotoPersonal[]>([]);
  const [accordionOpen, setAccordionOpen]   = useState(false);
  const [colecciones, setColecciones]       = useState<any[]>([]);
  const [recomendados, setRecomendados]     = useState<any[]>([]);
  const [doorOpen, setDoorOpen]             = useState(false);
  const [doorGone, setDoorGone]             = useState(false);

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Cursor custom
  useEffect(() => {
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) { dotRef.current.style.left = `${mx}px`; dotRef.current.style.top = `${my}px`; }
      const animate = () => {
        rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
        if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => { document.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId); document.body.style.cursor = ""; };
  }, []);

  const cursorOn  = useCallback(() => { dotRef.current?.classList.add("cur-over"); ringRef.current?.classList.add("cur-over"); }, []);
  const cursorOff = useCallback(() => { dotRef.current?.classList.remove("cur-over"); ringRef.current?.classList.remove("cur-over"); }, []);

  useEffect(() => {
    globalThis.scrollTo(0, 0);
    setVisible(false);
    setDoorOpen(false);
    setDoorGone(false);
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/api/artistas/matricula/${encodeURIComponent(matricula ?? "")}`);
        const json = await res.json();
        if (json.success) {
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

  // Cortina: timing idéntico al Home
  useEffect(() => {
    if (!loading) {
      const t1 = setTimeout(() => setDoorOpen(true),  1400);
      const t2 = setTimeout(() => setVisible(true),   1600);
      const t3 = setTimeout(() => setDoorGone(true),  2700);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [loading]);

  // IntersectionObserver para animaciones al scroll
  const pageRef = useRef<HTMLDivElement>(null);
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
    }, { threshold: 0 });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [artista, visible]);

  // ── PANTALLA DE CARGA: cortina cerrada
  if (loading) return (
    <>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); }
        .home-door-wrap { position:fixed; inset:0; z-index:99990; display:flex; pointer-events:none; }
        .home-door { flex:1; background:#0D0B14; }
        .home-door-line { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99991; width:1px; height:60px; background:#E8640C; pointer-events:none; }
      `}</style>
      <div className="home-door-wrap"><div className="home-door"/><div className="home-door"/></div>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:99991, fontFamily:SERIF, fontSize:"clamp(64px,10vw,130px)", fontWeight:900, color:"white", letterSpacing:"-.03em", pointerEvents:"none" }}>ALTAR</div>
      <div style={{ position:"fixed", top:"calc(50% + clamp(48px,8vw,104px))", left:"50%", transform:"translateX(-50%)", zIndex:99991, fontSize:9, fontWeight:700, letterSpacing:".44em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", pointerEvents:"none", fontFamily:NEXA_HEAVY }}>Galería de Arte</div>
      <div className="home-door-line"/>
    </>
  );

  if (!artista) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:"white" }}>
      <div style={{ fontSize:24, fontWeight:900, color:C.ink, fontFamily:SERIF }}>Artista no encontrado</div>
      <button onClick={() => navigate("/artistas")} style={{ padding:"12px 28px", borderRadius:100, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:NEXA_HEAVY, fontSize:11, letterSpacing:".15em", textTransform:"uppercase" }}>Ver artistas</button>
    </div>
  );

  const color      = PALETTE[artista.id_artista % PALETTE.length];
  const obras      = (artista.obras || []) as any[];
  const publicadas = obras.filter((o: any) => o.estado === "publicada" && o.activa === true);

  const heroBg = artista.foto_portada
    ? `url(${artista.foto_portada}) center/cover no-repeat`
    : `radial-gradient(ellipse 80% 60% at 65% 50%, ${color}22 0%, transparent 65%), linear-gradient(135deg, ${C.dark} 0%, #1a1830 100%)`;

  return (
    <div ref={pageRef} style={{ minHeight:"100vh", background:"#fff", fontFamily:SANS, overflowX:"hidden" }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

        /* ── Grain ── */
        .det-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px 160px; mix-blend-mode:multiply; }

        /* ── Cursor ── */
        .det-cursor-dot { position:fixed; width:6px; height:6px; border-radius:50%; background:${C.ink}; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
        .det-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
        .det-cursor-dot.cur-over { width:4px; height:4px; background:${C.orange}; }
        .det-cursor-ring.cur-over { width:52px; height:52px; border-color:${C.orange}; }
        .det-cursor-dot.cur-dark { background:#fff; }
        .det-cursor-ring.cur-dark { border-color:rgba(255,255,255,.3); }

        /* ── Cortina — idéntica al Home ── */
        .home-door-wrap { position:fixed; inset:0; z-index:99990; display:flex; pointer-events:none; }
        .home-door { flex:1; background:#0D0B14; transition:transform 1.2s cubic-bezier(.76,0,.24,1); }
        .home-door.izq { transform-origin:left center; }
        .home-door.der { transform-origin:right center; }
        .home-door-wrap.open .home-door.izq { transform:translateX(-100%); }
        .home-door-wrap.open .home-door.der { transform:translateX(100%); }
        .home-door-logo { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99991; font-family:'SolveraLorvane',serif; font-size:clamp(64px,10vw,130px); font-weight:900; color:#fff; letter-spacing:-.03em; pointer-events:none; transition:opacity .35s ease .8s; }
        .home-door-logo.open { opacity:0; }
        .home-door-sub { position:fixed; top:calc(50% + clamp(48px,8vw,104px)); left:50%; transform:translateX(-50%); z-index:99991; font-size:9px; font-weight:700; letter-spacing:.44em; text-transform:uppercase; color:rgba(255,255,255,.35); pointer-events:none; transition:opacity .3s ease .7s; font-family:'Nexa-Heavy',sans-serif; }
        .home-door-sub.open { opacity:0; }
        .home-door-line { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99991; width:1px; height:60px; background:#E8640C; pointer-events:none; transition:opacity .25s ease .75s; }
        .home-door-line.open { opacity:0; }

        /* ── Nav links ── */
        .det-nav-link { display:flex; align-items:center; gap:9px; font-size:9.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.5); text-decoration:none; transition:color .25s; border:none; background:none; cursor:pointer; font-family:'Nexa-Heavy',sans-serif; }
        .det-nav-link::before { content:''; display:block; width:12px; height:1px; background:currentColor; flex-shrink:0; transition:width .28s; }
        .det-nav-link:hover { color:white; }
        .det-nav-link:hover::before { width:22px; }

        /* ── Reveal scroll ── */
        [data-rv] { opacity:0; transform:translateY(24px); transition:opacity .9s ease, transform .9s ease; }
        [data-rv].rv-in { opacity:1; transform:translateY(0); }
        [data-rv][data-d="1"] { transition-delay:.08s; }
        [data-rv][data-d="2"] { transition-delay:.16s; }
        [data-rv][data-d="3"] { transition-delay:.24s; }
        [data-rv][data-d="4"] { transition-delay:.32s; }

        /* ── Section divider ── */
        .det-section-label { display:flex; align-items:center; gap:14px; margin-bottom:48px; }
        .det-section-label span { font-size:8.5px; font-weight:800; letter-spacing:.3em; text-transform:uppercase; color:rgba(0,0,0,.16); white-space:nowrap; font-family:'Nexa-Heavy',sans-serif; }
        .det-section-label::before, .det-section-label::after { content:''; flex:1; height:1px; background:rgba(0,0,0,.05); }

        /* ── Obra cards ── */
        .det-obra-card { cursor:pointer; transition:transform .55s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden; }
        .det-obra-card:hover { transform:scale(1.32); z-index:20; }
        .det-obra-card img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .7s cubic-bezier(.2,0,0,1); }
        .det-obra-card:hover img { transform:scale(1); }

        /* ── Colección card ── */
        .det-col-card { position:relative; border-radius:2px; overflow:hidden; cursor:pointer; transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s; }
        .det-col-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,.13); }
        .det-col-card:hover .det-col-img { transform:scale(1.05); }
        .det-col-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

        /* ── Acordeón ── */
        .det-accord-panel { max-height:0; overflow:hidden; transition:max-height .5s cubic-bezier(.16,1,.3,1); }
        .det-accord-panel.open { max-height:600px; }

        /* ── Rec card ── */
        .det-rec-card { cursor:pointer; transition:transform .4s cubic-bezier(.16,1,.3,1); overflow:hidden; position:relative; }
        .det-rec-card:hover { transform:translateY(-5px); }
        .det-rec-card:hover .det-rec-img { transform:scale(1.05); }
        .det-rec-img { transition:transform .6s cubic-bezier(.2,0,0,1); width:100%; height:100%; object-fit:cover; display:block; }

        @keyframes fadeI { from{opacity:0} to{opacity:1} }
        @keyframes barIn { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
      `}</style>

      {/* ── Grain ── */}
      <div className="det-grain"/>

      {/* ── Cursor ── */}
      <div ref={dotRef}  className="det-cursor-dot"/>
      <div ref={ringRef} className="det-cursor-ring"/>

      {/* ── Cortina — igual que Home ── */}
      {!doorGone && (
        <>
          <div className={`home-door-wrap${doorOpen ? " open" : ""}`}>
            <div className="home-door izq"/>
            <div className="home-door der"/>
          </div>
          <div className={`home-door-logo${doorOpen ? " open" : ""}`}>ALTAR</div>
          <div className={`home-door-sub${doorOpen ? " open" : ""}`}>Galería de Arte</div>
          <div className={`home-door-line${doorOpen ? " open" : ""}`}/>
        </>
      )}

      {/* ══════════════════════════════════════
           HERO — foto portada, pantalla completa
      ══════════════════════════════════════ */}
      <section style={{ position:"relative", height:"100vh", minHeight:600, background:heroBg, overflow:"hidden" }}>
        {/* Overlay si hay foto */}
        {artista.foto_portada && (
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.92) 0%, rgba(13,11,20,.25) 50%, rgba(13,11,20,.10) 100%)" }}/>
        )}

        {/* Línea de color acento arriba */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${color} 25%, ${color} 75%, transparent)`, animation:"barIn 1.8s cubic-bezier(.16,1,.3,1) both", zIndex:2 }}/>

        {/* Nav izquierda */}
        <nav style={{ position:"absolute", top:30, left:52, display:"flex", flexDirection:"column", gap:10, zIndex:10, animation:"fadeI 1s ease .5s both" }}>
          {[{ l:"Galería", to:"/catalogo" }, { l:"Artistas", to:"/artistas" }, { l:"Blog", to:"/blog" }, { l:"Contacto", to:"/contacto" }].map(({ l, to }) => (
            <Link key={l} to={to} className="det-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>{l}</Link>
          ))}
        </nav>

        {/* Auth derecha */}
        <div style={{ position:"absolute", top:30, right:52, display:"flex", alignItems:"center", gap:12, zIndex:10, animation:"fadeI 1s ease .5s both" }}>
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

        {/* Logo badge arriba derecha (si tiene logo) */}
        {artista.foto_logo && (
          <div style={{ position:"absolute", top:24, right:160, zIndex:10, width:44, height:44, borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,.18)", animation:"fadeI 1s ease .6s both" }}>
            <img src={artista.foto_logo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
        )}

        {/* Contenido inferior */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          padding:"0 72px 60px",
          display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:40,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition:"opacity .9s, transform .9s",
          zIndex:5,
        }}>
          {/* Izquierda: nombre */}
          <div style={{ flex:1 }}>
            {artista.categoria_nombre && (
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, marginBottom:16, fontFamily:NEXA_HEAVY }}>
                {artista.categoria_nombre}
              </div>
            )}
            <h1 style={{ fontFamily:SERIF, fontSize:"clamp(42px,7vw,96px)", fontWeight:900, color:"white", lineHeight:.9, letterSpacing:"-.03em", margin:0 }}>
              {artista.nombre_completo}
            </h1>
            {artista.nombre_artistico && (
              <div style={{ fontSize:"clamp(12px,1.6vw,15px)", color:"rgba(255,255,255,.38)", fontFamily:NEXA_HEAVY, letterSpacing:".06em", marginTop:14, fontStyle:"italic" }}>
                "{artista.nombre_artistico}"
              </div>
            )}
          </div>

          {/* Derecha: stats + avatar */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:20, flexShrink:0 }}>
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
              <div style={{ width:68, height:68, borderRadius:"50%", overflow:"hidden", border:`2px solid ${color}`, boxShadow:`0 0 0 4px rgba(255,255,255,.06)`, flexShrink:0 }}>
                <img src={artista.foto_perfil} alt={artista.nombre_completo} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
            ) : (
              <div style={{ width:68, height:68, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:900, color:"white", fontFamily:SERIF, flexShrink:0 }}>
                {artista.nombre_completo?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Línea scroll */}
        <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:1, height:40, background:"linear-gradient(to bottom, transparent, rgba(255,255,255,.15))", pointerEvents:"none" }}/>
      </section>

      {/* ══════════════════════════════════════
           I · BIO
      ══════════════════════════════════════ */}
      <section style={{ padding:"100px 72px 90px", borderTop:"1px solid rgba(0,0,0,.05)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", fontFamily:SERIF, fontSize:280, fontWeight:900, fontStyle:"italic", color:"rgba(0,0,0,.022)", lineHeight:1, userSelect:"none", pointerEvents:"none" }}>I</div>

        <div className="det-section-label"><span>I · Sobre el artista</span></div>

        <div style={{ display:"flex", gap:"clamp(48px,8vw,96px)", flexWrap:"wrap", maxWidth:1000 }}>
          {artista.biografia ? (
            <div style={{ flex:"2 1 280px" }}>
              <p style={{ fontFamily:SERIF, fontSize:"clamp(18px,2.4vw,26px)", fontStyle:"italic", fontWeight:400, color:C.ink, lineHeight:1.6, letterSpacing:"-.01em", margin:0 }}>
                "{artista.biografia}"
              </p>
            </div>
          ) : null}
          <div style={{ flex:"1 1 160px", display:"flex", flexDirection:"column", gap:24, justifyContent:"center" }}>
            {artista.correo && (
              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.18)", fontFamily:NEXA_HEAVY, marginBottom:6 }}>Correo</div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:SANS }}>{artista.correo}</div>
              </div>
            )}
            {artista.telefono && (
              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.18)", fontFamily:NEXA_HEAVY, marginBottom:6 }}>Teléfono</div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:SANS }}>{artista.telefono}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.18)", fontFamily:NEXA_HEAVY, marginBottom:6 }}>Región</div>
              <div style={{ fontSize:13, color:C.ink, fontFamily:SANS }}>Huasteca Hidalguense</div>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:`${color}10`, border:`1px solid ${color}25` }}>
              <span style={{ fontSize:8, fontWeight:800, color:color, letterSpacing:".16em", textTransform:"uppercase", fontFamily:NEXA_HEAVY }}>✓ Certificado NUB</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           II · FOTOS PERSONALES
      ══════════════════════════════════════ */}
      <section style={{ padding:"80px 0 90px", background:"#fafaf9", borderTop:"1px solid rgba(0,0,0,.04)" }}>
        {/* Encabezado de sección */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom: fotosPersonales.length > 0 ? 48 : 0, padding:"0 72px" }} data-rv>
          <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
          <button
            onClick={() => fotosPersonales.length > 0 && setAccordionOpen(o => !o)}
            onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ fontSize:8.5, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color: fotosPersonales.length === 0 ? "rgba(0,0,0,.12)" : accordionOpen ? C.orange : "rgba(0,0,0,.28)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY, background:"none", border:"none", cursor: fotosPersonales.length === 0 ? "default" : "pointer", transition:"color .25s", display:"flex", alignItems:"center", gap:10 }}
          >
            II · Galería personal
            {fotosPersonales.length > 0 && (
              <span style={{ fontSize:7, color:"inherit", display:"inline-block", transform: accordionOpen ? "rotate(180deg)" : "none", transition:"transform .4s cubic-bezier(.16,1,.3,1)" }}>▾</span>
            )}
            {fotosPersonales.length === 0 && <span style={{ fontSize:7, color:"rgba(0,0,0,.15)" }}>— sin fotos</span>}
          </button>
          <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
          {fotosPersonales.length > 0 && (
            <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.20)", whiteSpace:"nowrap", fontFamily:SANS }}>
              {fotosPersonales.length} foto{fotosPersonales.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Fotos: scroll horizontal estilo Home */}
        <div className={`det-accord-panel${accordionOpen ? " open" : ""}`}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 72px 40px", scrollSnapType:"x mandatory", scrollbarWidth:"thin", scrollbarColor:"rgba(0,0,0,.12) transparent", alignItems:"stretch" }}>
            {fotosPersonales.map((f, i) => {
              const w = i === 0 && fotosPersonales.length >= 3 ? 360 : 260;
              const h = 340;
              return (
                <div key={f.id_foto}
                  style={{ flexShrink:0, width:w, height:h, scrollSnapAlign:"start", overflow:"hidden", position:"relative", cursor:"pointer", transition:"transform .55s cubic-bezier(.16,1,.3,1)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; cursorOn(); }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; cursorOff(); }}
                >
                  <img src={f.url_foto} alt=""
                    style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", display:"block", filter:"saturate(.85) brightness(.97)", transition:"filter .4s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.filter = "saturate(1) brightness(1)"}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.filter = "saturate(.85) brightness(.97)"}
                  />
                  <div style={{ position:"absolute", bottom:10, right:12, fontSize:8, fontWeight:800, color:"rgba(255,255,255,.4)", letterSpacing:".1em", fontFamily:NEXA_HEAVY }}>
                    {String(i+1).padStart(2,"0")}/{String(fotosPersonales.length).padStart(2,"0")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           III · COLECCIONES
      ══════════════════════════════════════ */}
      {colecciones.length > 0 && (
        <section style={{ padding:"80px 72px 90px", borderTop:"1px solid rgba(0,0,0,.04)" }}>
          <div className="det-section-label"><span>III · Colecciones</span></div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
            {colecciones.map((col: any) => (
              <div key={col.id_coleccion} className="det-col-card"
                onClick={() => navigate(`/colecciones/${col.slug}`)}
                style={{ height:300, position:"relative" }}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
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
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 20px 20px" }}>
                  <div style={{ fontSize:17, fontWeight:900, color:"white", fontFamily:SERIF, lineHeight:1.1, marginBottom:5 }}>{col.nombre}</div>
                  {col.historia && <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:SANS, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>{col.historia}</div>}
                  <div style={{ marginTop:8, fontSize:9, fontWeight:700, color:"rgba(255,255,255,.35)", fontFamily:NEXA_HEAVY, letterSpacing:".08em" }}>
                    {Number(col.total_obras) || 0} {Number(col.total_obras) === 1 ? "obra" : "obras"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
           IV · OBRAS
      ══════════════════════════════════════ */}
      {publicadas.length > 0 && (
        <section style={{ padding:"80px 0 0", background:"#fafaf9", borderTop:"1px solid rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:32, padding:"0 72px" }}>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            <div style={{ fontSize:8.5, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:"rgba(0,0,0,.16)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>
              {colecciones.length > 0 ? "IV" : "III"} · Obras de arte
            </div>
            <div style={{ height:1, flex:1, background:"rgba(0,0,0,.05)" }}/>
            <Link to="/catalogo" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ fontSize:8.5, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:C.orange, whiteSpace:"nowrap", textDecoration:"none", fontFamily:SANS }}>
              Ver galería →
            </Link>
          </div>

          {/* Scroll horizontal estilo Home */}
          <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"40px 72px 60px", scrollSnapType:"x mandatory", scrollbarWidth:"thin", scrollbarColor:"rgba(0,0,0,.15) rgba(0,0,0,.05)", alignItems:"center" }}>
            {publicadas.map((obra: any) => (
              <div key={obra.id_obra} className="det-obra-card"
                style={{ flexShrink:0, width:220, height:280, scrollSnapAlign:"start", position:"relative" }}
                onClick={() => navigate(`/catalogo/${obra.slug || obra.id_obra}`)}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              >
                {obra.imagen_principal ? (
                  <img src={obra.imagen_principal} alt={obra.titulo}/>
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
            {recomendados.map((rec: any, i) => {
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

      {/* ── Footer mínimo ── */}
      <div style={{ padding:"22px 72px", borderTop:"1px solid rgba(0,0,0,.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:11, fontWeight:900, color:"rgba(0,0,0,.14)", fontFamily:NEXA_HEAVY, letterSpacing:".1em" }}>NU★B STUDIO</div>
        <button onClick={() => navigate("/artistas")}
          onMouseEnter={e => { cursorOn(); (e.currentTarget as HTMLElement).style.color = C.ink; }}
          onMouseLeave={e => { cursorOff(); (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,.25)"; }}
          style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", border:"none", background:"none", cursor:"pointer", fontFamily:NEXA_HEAVY, transition:"color .2s" }}
        >← Ver todos los artistas</button>
      </div>
    </div>
  );
}
