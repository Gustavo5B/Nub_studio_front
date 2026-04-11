// src/pages/public/DetalleObra.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Heart, Share2, ZoomIn, CheckCircle, Award, ShoppingCart } from "lucide-react";
import { cacheGet, cacheSet } from "../../utils/apiCache";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  ink:      "#14121E",
  sub:      "#9896A8",
  dark:     "#0D0B14",
  offWhite: "#FAFAF9",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";
const CORMORANT  = "'Cormorant Garamond', serif";
const PALETTE    = [C.orange, C.pink, C.purple, C.blue, C.gold];
const NEXA_REGULAR = "'Nexa-Regular', sans-serif";
const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 }).format(p);

function obraUrl(identifier: string): string {
  return /^\d+$/.test(identifier)
    ? `${API_URL}/api/obras/${identifier}`
    : `${API_URL}/api/obras/slug/${identifier}`;
}

export default function DetalleObra() {
  const navigate  = useNavigate();
  const { slug }  = useParams<{ slug: string }>();

  const [obra,      setObra]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [imgActiva, setImgActiva] = useState<string | null>(null);
  const [tamSel,    setTamSel]    = useState<any>(null);
  const [liked,       setLiked]       = useState(false);
  const [likingObra,  setLikingObra]  = useState(false);
  const [zoomed,     setZoomed]     = useState(false);
  const [agregando,  setAgregando]  = useState(false);
  const [enCarrito,  setEnCarrito]  = useState(false);
  const [cantidad,   setCantidad]   = useState(1);
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);

  const { showToast } = useToast();
  const isLoggedIn = authService.isAuthenticated();
  const userRol    = localStorage.getItem("userRol") || "";

  const handleAgregarCarrito = async () => {
    if (!isLoggedIn || userRol !== "cliente") {
      navigate(`/login?redirect=${encodeURIComponent(`/obras/${slug}`)}`);
      return;
    }
    if (stockDisponible !== null && stockDisponible <= 0) {
      showToast("Esta obra está agotada", "warn");
      return;
    }
    setAgregando(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/api/carrito`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_obra: obra?.id_obra, cantidad }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al agregar al carrito", "err"); return; }
      setEnCarrito(true);
      showToast(`${cantidad > 1 ? `${cantidad} piezas agregadas` : "Obra agregada"} al carrito`, "ok");
    } catch {
      showToast("Sin conexión con el servidor", "err");
    } finally {
      setAgregando(false);
    }
  };

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════
  // ═══ CURSOR PERSONALIZADO
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    document.body.style.cursor = "none";
    
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
    
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.style.cursor = "auto";
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
  // ═══ FETCH DE OBRA (MEJORADO)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    globalThis.scrollTo(0, 0);
    if (!slug) { setLoading(false); return; }

    const url = obraUrl(slug);
    const cached = cacheGet(url);
    if (cached) {
      const obraData = cached as any;
      setObra(obraData);
      setImgActiva(obraData.imagen_principal);
      if (obraData.tamaños?.length > 0) setTamSel(obraData.tamaños[0]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(url)
      .then(r => r.json())
      .then(j => {
        let obraData: any = null;
        if (j.success && j.data) obraData = j.data;
        else if (j.id_obra) obraData = j;
        else if (j.data?.id_obra) obraData = j.data;
        if (obraData) {
          cacheSet(url, obraData);
          setObra(obraData);
          setImgActiva(obraData.imagen_principal);
          if (obraData.tamaños?.length > 0) setTamSel(obraData.tamaños[0]);
          const disp = typeof obraData.stock_disponible === "number" ? obraData.stock_disponible : null;
          setStockDisponible(disp);
          setCantidad(disp !== null && disp > 0 ? 1 : 1);
        } else {
          setError("Obra no encontrada");
        }
      })
      .catch(() => setError("Error al cargar la obra"))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Cargar estado de favorito al tener la obra
  useEffect(() => {
    if (!obra?.id_obra || !isLoggedIn || userRol !== "cliente") return;
    const token = authService.getToken();
    fetch(`${API_URL}/api/favoritos/check/${obra.id_obra}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setLiked(d.esFavorito); })
      .catch(() => {});
  }, [obra?.id_obra, isLoggedIn, userRol]);

  const handleToggleFavorito = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/obras/${slug}`)}`);
      return;
    }
    if (userRol !== "cliente" || likingObra) return;
    setLikingObra(true);
    try {
      const token = authService.getToken();
      const res   = await fetch(`${API_URL}/api/favoritos/${obra?.id_obra}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.accion === "agregado");
        showToast(data.accion === "agregado" ? "Agregada a favoritos" : "Eliminada de favoritos", "success");
      }
    } catch { /* silent */ }
    setLikingObra(false);
  };

  // ── PANTALLA DE CARGA
  if (loading) return <div style={{ minHeight:"100vh", background:"#fff" }}/>;

  // ── ERROR
  if (error || !obra) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:C.dark }}>
      <style>{`@font-face{font-family:'SolveraLorvane';src:url('/fonts/SolveraLorvane.ttf') format('truetype');}@font-face{font-family:'Nexa-Heavy';src:url('/fonts/Nexa-Heavy.ttf') format('truetype');}@font-face{font-family:'Nexa-Regular';src:url('/fonts/Nexa-ExtraLight.ttf') format('truetype');}`}</style>
      <div style={{ fontFamily:SERIF, fontSize:24, fontWeight:900, color:"white" }}>{error || "Obra no encontrada"}</div>
      <button onClick={() => navigate("/catalogo")} style={{ padding:"12px 28px", borderRadius:100, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"'Nexa-Heavy',sans-serif", fontSize:11, letterSpacing:".15em", textTransform:"uppercase" }}>Ver catálogo</button>
    </div>
  );

  const precio         = tamSel?.precio_base || obra.precio_base;
  const obraPublicada  = obra.estado === "publicada" && obra.activa === true;
  const todasImg = [
    ...(obra.imagen_principal ? [{ url_imagen:obra.imagen_principal, id_imagen:"main" }] : []),
    ...(obra.imagenes || []),
  ];
  const color = PALETTE[(obra.id_artista || 0) % PALETTE.length];

  return (
    <>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
        * { box-sizing:border-box; }

        .ob-grain { position:fixed; inset:0; z-index:9997; pointer-events:none; opacity:.026;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px 160px; mix-blend-mode:multiply; }

        .ob-cursor-dot  { position:fixed; width:6px;  height:6px;  border-radius:50%; background:${C.ink}; pointer-events:none; z-index:99999; transform:translate(-50%,-50%); transition:width .22s,height .22s,background .22s; }
        .ob-cursor-ring { position:fixed; width:32px; height:32px; border-radius:50%; border:1px solid rgba(20,18,30,.22); pointer-events:none; z-index:99998; transform:translate(-50%,-50%); transition:width .3s,height .3s,border-color .25s; }
        .ob-cursor-dot.cur-over  { width:4px;  height:4px;  background:${C.orange}; }
        .ob-cursor-ring.cur-over { width:52px; height:52px; border-color:${C.orange}; }
        .ob-cursor-dot.cur-light  { background:#fff; }
        .ob-cursor-ring.cur-light { border-color:rgba(255,255,255,.3); }

        @keyframes barIn { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        @keyframes fadeI { from{opacity:0} to{opacity:1} }
        @keyframes museumIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        @keyframes heroImgReveal {
          0%   { opacity:0; transform:scale(1.09); filter:blur(18px) saturate(0.1) brightness(0.55); }
          60%  { filter:blur(3px) saturate(0.8) brightness(0.9); }
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
        @keyframes slideUp {
          0%   { opacity:0; transform:translateY(28px); }
          60%  { opacity:1; transform:translateY(-5px); }
          100% { opacity:1; transform:translateY(0); }
        }

        .ob-nav-link { display:inline-flex; align-items:center; gap:8px; font-size:9px; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:white; text-decoration:none; transition:all .25s; border:none; cursor:pointer; font-family:'Nexa-Heavy',sans-serif; background:rgba(13,11,20,.52); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:7px 14px 7px 12px; border-radius:100px; border:1px solid rgba(255,255,255,.12); }
        .ob-nav-link::before { content:''; display:block; width:10px; height:1px; background:rgba(255,255,255,.5); flex-shrink:0; transition:width .28s; }
        .ob-nav-link:hover { background:rgba(13,11,20,.78); border-color:rgba(255,255,255,.25); color:white; }
        .ob-nav-link:hover::before { width:16px; background:white; }

        .ob-thumb { flex-shrink:0; border-radius:3px; overflow:hidden; cursor:pointer; transition:all .2s; }
        .ob-thumb.active { box-shadow:0 0 0 2px ${C.orange}; opacity:1; }
        .ob-thumb:not(.active) { opacity:.38; }
        .ob-thumb:hover:not(.active) { opacity:.7; }

        .ob-tam-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:11px 16px; border-radius:100px; border:1px solid rgba(0,0,0,.1); background:transparent; color:rgba(0,0,0,.55); font-family:'Outfit',sans-serif; font-size:13px; cursor:pointer; transition:all .22s; text-align:left; }
        .ob-tam-btn.sel { border-color:${C.orange}88; background:${C.orange}10; color:${C.ink}; }
        .ob-tam-btn:hover:not(.sel) { border-color:rgba(0,0,0,.22); color:${C.ink}; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:4px; }
      `}</style>

      {/* Grain + cursor */}
      <div className="ob-grain"/>
      <div ref={dotRef}  className="ob-cursor-dot"/>
      <div ref={ringRef} className="ob-cursor-ring"/>

      {/* ── BANNER PREVISUALIZACIÓN (solo para artistas) ── */}
      {userRol === "artista" && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:99996, display:"flex", alignItems:"center", gap:14, padding:"12px 20px 12px 16px", borderRadius:100, background:"rgba(20,18,30,.92)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,.12)", boxShadow:"0 8px 32px rgba(0,0,0,.35)", whiteSpace:"nowrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#E8640C", flexShrink:0, boxShadow:"0 0 6px #E8640C" }}/>
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", fontFamily:"'Nexa-Heavy',sans-serif", letterSpacing:".12em", textTransform:"uppercase" }}>
              Vista pública
            </span>
          </div>
          <div style={{ width:1, height:16, background:"rgba(255,255,255,.15)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontFamily:"'Outfit',sans-serif" }}>
            Así ve el cliente tu obra
          </span>
          <button
            onClick={() => {
              if (obra?.id_obra) navigate(`/artista/obra/${obra.id_obra}`);
              else navigate("/artista/mis-obras");
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,100,12,.2)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,100,12,.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.15)"; }}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 16px", borderRadius:100, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", color:"white", fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", fontFamily:"'Nexa-Heavy',sans-serif", transition:"all .2s" }}
          >
            ← Volver al portal
          </button>
        </div>
      )}

      <div style={{ minHeight:"100vh", background:"#fff", fontFamily:SANS, animation:"museumIn .45s ease both" }}>

        {/* ════════════════════════════════════
             HERO SPLIT — imagen izq | detalles der
        ════════════════════════════════════ */}
        <section style={{ display:"grid", gridTemplateColumns:"55fr 45fr", height:"100vh", minHeight:600 }}>

          {/* ── PANEL IZQUIERDO: imagen ── */}
          <div
            style={{ position:"relative", overflow:"hidden", background:"#0a0910", cursor:"zoom-in" }}
            onClick={() => setZoomed(true)}
            onMouseEnter={() => { cursorOn(); dotRef.current?.classList.add("cur-light"); ringRef.current?.classList.add("cur-light"); }}
            onMouseLeave={() => { cursorOff(); dotRef.current?.classList.remove("cur-light"); ringRef.current?.classList.remove("cur-light"); }}
          >
            {(imgActiva || obra.imagen_principal) ? (
              <img
                src={imgActiva || obra.imagen_principal}
                alt={obra.titulo}
                style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .6s cubic-bezier(.2,0,0,1)", animation:"heroImgReveal 1.9s cubic-bezier(.16,1,.3,1) both" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
              />
            ) : (
              <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}18, #1a1830)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:SERIF, fontSize:120, fontWeight:900, color:`${color}30`, fontStyle:"italic" }}>A</span>
              </div>
            )}

            {/* Línea de color */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${color} 25%, ${color} 75%, transparent)`, animation:"barIn 1.8s cubic-bezier(.16,1,.3,1) both" }}/>


            {/* Zoom hint */}
            <div style={{ position:"absolute", bottom:20, left:20, display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:100, background:"rgba(13,11,20,.75)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.1)", fontSize:9, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,.45)", fontFamily:NEXA_HEAVY, pointerEvents:"none" }}>
              <ZoomIn size={10} strokeWidth={2}/> Ampliar
            </div>

            {/* Like + Share */}
            <div style={{ position:"absolute", top:20, right:20, display:"flex", flexDirection:"column", gap:8, animation:"fadeI 1s ease .4s both" }}>
              <button onClick={handleToggleFavorito}
                title={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
                style={{ width:38, height:38, borderRadius:"50%", background: liked ? `${C.pink}22` : "rgba(13,11,20,.75)", border:`1px solid ${liked ? C.pink+"55" : "rgba(255,255,255,.15)"}`, backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s", opacity: likingObra ? 0.6 : 1 }}>
                <Heart size={14} color={liked ? C.pink : "rgba(255,255,255,.5)"} fill={liked ? C.pink : "none"} strokeWidth={2}/>
              </button>
              <button onClick={e => { e.stopPropagation(); navigator.share?.({ title:obra.titulo, url:globalThis.location.href }); }}
                style={{ width:38, height:38, borderRadius:"50%", background:"rgba(13,11,20,.75)", border:"1px solid rgba(255,255,255,.15)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Share2 size={14} color="rgba(255,255,255,.5)" strokeWidth={2}/>
              </button>
            </div>

            {/* Thumbnails verticales */}
            {todasImg.length > 1 && (
              <div style={{ position:"absolute", bottom:20, right:20, display:"flex", flexDirection:"column", gap:8 }}>
                {todasImg.slice(0, 5).map((img: any) => (
                  <div key={img.id_imagen}
                    className={`ob-thumb${imgActiva === img.url_imagen ? " active" : ""}`}
                    style={{ width:52, height:52 }}
                    onClick={e => { e.stopPropagation(); setImgActiva(img.url_imagen); }}
                  >
                    <img src={img.url_imagen} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PANEL DERECHO: detalles ── */}
          <div style={{ background:"#fff", overflowY:"auto", overflowX:"hidden", padding:"40px 48px 48px", display:"flex", flexDirection:"column", gap:24, borderLeft:`3px solid ${color}` }}>

            {/* Auth */}
            <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:10 }}>
              {!isLoggedIn ? (
                <>
                  <Link to="/login" style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", textDecoration:"none", padding:"5px 13px", borderRadius:100, border:"1px solid rgba(0,0,0,.1)", transition:"all .22s", fontFamily:"'Nexa-Heavy',sans-serif" }}>Ingresar</Link>
                  <Link to="/register" style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"white", textDecoration:"none", padding:"5px 13px", borderRadius:100, background:color, fontFamily:"'Nexa-Heavy',sans-serif" }}>Ser artista</Link>
                </>
              ) : (
                <>
                  <Link to={userRol==="admin"?"/admin":userRol==="artista"?"/artista/dashboard":"/mi-cuenta"} style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", textDecoration:"none", padding:"5px 13px", borderRadius:100, border:"1px solid rgba(0,0,0,.1)", fontFamily:"'Nexa-Heavy',sans-serif" }}>Mi cuenta</Link>
                  <button onClick={() => { authService.logout(); navigate("/"); }} style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"#fff", background:C.ink, border:"none", padding:"5px 13px", borderRadius:100, cursor:"pointer", fontFamily:"'Nexa-Heavy',sans-serif", transition:"all .22s" }}>Salir</button>
                </>
              )}
            </div>

            {/* Volver */}
            <button onClick={() => navigate(-1 as any)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:8, background:"none", border:`1px solid rgba(0,0,0,.14)`, borderRadius:100, color:C.ink, fontSize:9, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .2s", padding:"6px 14px" }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(0,0,0,.35)"; (e.currentTarget as HTMLElement).style.background="rgba(0,0,0,.04)"; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(0,0,0,.14)"; (e.currentTarget as HTMLElement).style.background="none"; }}
            >← Volver</button>

            {/* Badges */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", animation:"popIn .6s cubic-bezier(.16,1,.3,1) .2s both" }}>
              {obra.categoria_nombre && (
                <span style={{ fontSize:8, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:color, fontFamily:NEXA_HEAVY, padding:"4px 12px", borderRadius:100, background:`${color}18`, border:`1px solid ${color}30` }}>{obra.categoria_nombre}</span>
              )}
              {obra.con_certificado && (
                <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:8, fontWeight:800, letterSpacing:".16em", textTransform:"uppercase", color:C.gold, fontFamily:NEXA_HEAVY, padding:"4px 12px", borderRadius:100, background:`${C.gold}14`, border:`1px solid ${C.gold}28` }}>
                  <Award size={9} strokeWidth={2}/> Certificado
                </span>
              )}
            </div>

            {/* Título + artista */}
            <div>
             <h1 style={{ fontFamily:NEXA_HEAVY, fontWeight:900, color:C.ink, lineHeight:1.0, letterSpacing:"-0.02em", margin:"0 0 18px", animation:"bounceUp .95s cubic-bezier(.16,1,.3,1) .3s both", wordBreak:"break-word", overflowWrap:"break-word", textTransform:"uppercase" }}>
  {(() => {
    const words = obra.titulo.split(" ");
    const mid   = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");
    return <>
      <span style={{ display:"block", fontSize:"clamp(42px,5.5vw,82px)" }}>{line1}</span>
      {line2 && <span style={{ display:"block", fontSize:"clamp(24px,3vw,48px)", opacity:.85 }}>{line2}</span>}
    </>;
  })()}
</h1>
              <button onClick={() => navigate(`/artistas/${obra.id_artista}`)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:0, animation:"slideLeft .65s cubic-bezier(.16,1,.3,1) .45s both" }}
              >
                <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:`2px solid ${C.pink}44`, flexShrink:0 }}>
                  {obra.artista_foto
                    ? <img src={obra.artista_foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ width:"100%", height:"100%", background:`${C.pink}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:C.pink, fontFamily:SERIF }}>{obra.artista_nombre?.[0]}</div>
                  }
                </div>
                <span style={{ fontSize:13, color:C.pink, fontWeight:700, fontFamily:SANS, transition:"color .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=C.ink}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=C.pink}
                >{obra.artista_alias || obra.artista_nombre}</span>
              </button>
            </div>

            <div style={{ height:1, background:"rgba(0,0,0,.07)" }}/>

            {/* Precio */}
            <div style={{ animation:"bounceUp .8s cubic-bezier(.16,1,.3,1) .5s both" }}>
              <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", fontFamily:NEXA_HEAVY, marginBottom:6 }}>
                {tamSel ? tamSel.tamaño_nombre : "Precio base"}
              </div>
              <div style={{ fontSize:38, fontWeight:900, color:C.orange, fontFamily:NEXA_HEAVY, letterSpacing:"-.01em" }}>
                {fmt(Number(precio || 0))}
              </div>
              <div style={{ fontSize:11, color:"rgba(0,0,0,.3)", fontFamily:SANS, marginTop:4 }}>IVA incluido · Envío a calcular</div>

              {/* Badge de stock */}
              {stockDisponible !== null && (
                <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:7,
                  padding:"5px 14px", borderRadius:100,
                  background: stockDisponible === 0 ? "rgba(196,48,74,0.08)" : stockDisponible <= 3 ? "rgba(168,112,6,0.10)" : "rgba(14,138,80,0.08)",
                  border: `1px solid ${stockDisponible === 0 ? "rgba(196,48,74,0.25)" : stockDisponible <= 3 ? "rgba(168,112,6,0.25)" : "rgba(14,138,80,0.22)"}`,
                }}>
                  <div style={{ width:6, height:6, borderRadius:"50%",
                    background: stockDisponible === 0 ? "#C4304A" : stockDisponible <= 3 ? "#A87006" : "#0E8A50",
                    flexShrink:0,
                  }}/>
                  <span style={{ fontFamily:NEXA_HEAVY, fontSize:9, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase",
                    color: stockDisponible === 0 ? "#C4304A" : stockDisponible <= 3 ? "#A87006" : "#0E8A50",
                  }}>
                    {stockDisponible === 0 ? "Agotada" : stockDisponible === 1 ? "Última pieza" : `${stockDisponible} disponibles`}
                  </span>
                </div>
              )}
            </div>

            {/* Tamaños */}
            {obra.tamaños && obra.tamaños.length > 0 && (
              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", fontFamily:NEXA_HEAVY, marginBottom:10 }}>Selecciona un tamaño</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {obra.tamaños.map((t: any) => {
                    const sel = tamSel?.id_obra_tamaño === t.id_obra_tamaño;
                    return (
                      <button key={t.id_obra_tamaño} onClick={() => setTamSel(t)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                        className={`ob-tam-btn${sel ? " sel" : ""}`}
                      >
                        <div>
                          <div style={{ fontSize:13, fontWeight:700 }}>{t.tamaño_nombre}</div>
                          {t.ancho_cm && <div style={{ fontSize:11, opacity:.5, marginTop:1 }}>{t.ancho_cm} × {t.alto_cm} cm</div>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:14, fontWeight:700 }}>{fmt(Number(t.precio_base))}</span>
                          {sel && <CheckCircle size={14} color={C.orange} strokeWidth={2.5}/>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ height:1, background:"rgba(0,0,0,.07)" }}/>

            {/* Selector de cantidad — solo si obra publicada, stock > 1 y cliente */}
            {obraPublicada && userRol === "cliente" && stockDisponible !== null && stockDisponible > 1 && !enCarrito && (
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", fontFamily:NEXA_HEAVY }}>Cantidad</div>
                <div style={{ display:"flex", alignItems:"center", gap:0, border:"1px solid rgba(0,0,0,.12)", borderRadius:100, overflow:"hidden" }}>
                  <button
                    type="button"
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ width:34, height:34, border:"none", background:"transparent", fontSize:16, color:cantidad <= 1 ? "rgba(0,0,0,.18)" : C.ink, cursor:cantidad <= 1 ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}
                    onMouseOver={e => { if (cantidad > 1) (e.currentTarget as HTMLElement).style.background="rgba(0,0,0,.05)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}
                  >−</button>
                  <span style={{ minWidth:28, textAlign:"center", fontFamily:NEXA_HEAVY, fontSize:14, fontWeight:800, color:C.ink }}>{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad(c => Math.min(stockDisponible, c + 1))}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ width:34, height:34, border:"none", background:"transparent", fontSize:16, color:cantidad >= stockDisponible ? "rgba(0,0,0,.18)" : C.ink, cursor:cantidad >= stockDisponible ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}
                    onMouseOver={e => { if (cantidad < stockDisponible) (e.currentTarget as HTMLElement).style.background="rgba(0,0,0,.05)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}
                  >+</button>
                </div>
                <span style={{ fontSize:11, color:"rgba(0,0,0,.28)", fontFamily:SANS }}>máx. {stockDisponible}</span>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"slideUp .7s cubic-bezier(.16,1,.3,1) .65s both" }}>

              {/* Obra NO publicada — aviso de revisión */}
              {!obraPublicada ? (
                <div style={{ width:"100%", padding:"14px 20px", borderRadius:14,
                  background:"rgba(168,112,6,0.07)", border:"1px solid rgba(168,112,6,0.22)",
                  display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>🕐</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:".16em", textTransform:"uppercase", color:"#A87006", fontFamily:NEXA_HEAVY, marginBottom:3 }}>
                      Obra en revisión
                    </div>
                    <div style={{ fontSize:11.5, color:"rgba(0,0,0,.45)", fontFamily:SANS, lineHeight:1.5 }}>
                      Esta obra está pendiente de aprobación y aún no está disponible para adquirir.
                    </div>
                  </div>
                </div>

              ) : userRol === "cliente" ? (
                /* Botón carrito — obra publicada + rol cliente */
                <>
                  <button
                    onClick={handleAgregarCarrito}
                    disabled={agregando || (stockDisponible !== null && stockDisponible <= 0)}
                    onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ width:"100%", padding:"14px 24px", borderRadius:100,
                      background: (stockDisponible !== null && stockDisponible <= 0) ? "rgba(0,0,0,.12)" : enCarrito ? "#0E8A50" : color,
                      color:"white", border:"none", fontSize:10, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", fontFamily:NEXA_HEAVY,
                      cursor: (agregando || (stockDisponible !== null && stockDisponible <= 0)) ? "not-allowed" : "pointer",
                      transition:"opacity .22s, transform .22s, background .3s", opacity: agregando ? 0.7 : 1,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                    onMouseOver={e => { if (!agregando && !(stockDisponible !== null && stockDisponible <= 0)) (e.currentTarget as HTMLElement).style.opacity=".85"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity="1"; }}
                  >
                    <ShoppingCart size={13} strokeWidth={2.5} />
                    {agregando ? "Agregando..." : (stockDisponible !== null && stockDisponible <= 0) ? "Agotada" : enCarrito ? "✓ En tu carrito" : "Agregar al carrito"}
                  </button>
                  {enCarrito && (
                    <button
                      onClick={() => navigate("/mi-cuenta/carrito")}
                      onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                      style={{ width:"100%", padding:"11px 24px", borderRadius:100, background:"transparent", color:"#0E8A50", border:"1px solid #0E8A50", fontSize:10, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .22s" }}
                    >Ver carrito →</button>
                  )}
                </>
              ) : (
                /* Botón adquirir — obra publicada + no autenticado o rol distinto */
                <button
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/obras/${slug}`)}`)}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ width:"100%", padding:"14px 24px", borderRadius:100, background:color, color:"white", border:"none", fontSize:10, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"opacity .22s, transform .22s" }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.opacity=".85"; (e.currentTarget as HTMLElement).style.transform="scale(1.015)"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity="1"; (e.currentTarget as HTMLElement).style.transform="scale(1)"; }}
                >Adquirir esta obra →</button>
              )}

              <button onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ width:"100%", padding:"12px 24px", borderRadius:100, background:"transparent", color:"rgba(0,0,0,.4)", border:"1px solid rgba(0,0,0,.12)", fontSize:10, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .22s" }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(0,0,0,.3)"; (e.currentTarget as HTMLElement).style.color=C.ink; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(0,0,0,.12)"; (e.currentTarget as HTMLElement).style.color="rgba(0,0,0,.4)"; }}
              >Solicitar información</button>
            </div>

            {/* Garantías */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { text:"Certificado de autenticidad incluido", c:C.gold },
                { text:"Obra verificada por Galería Altar",   c:C.orange },
                { text:"Artista certificado y reconocido",    c:C.pink },
              ].map(({ text, c }) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:11.5, color:"rgba(0,0,0,.38)", fontFamily:SANS }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
             SECCIÓN II — Descripción + Técnicos
        ════════════════════════════════════ */}
        <section style={{ background:"#fff", borderTop:`3px solid ${color}`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", left:-4, top:"50%", transform:"translateY(-50%)", fontFamily:SERIF, fontSize:200, fontWeight:900, fontStyle:"italic", color:`${color}05`, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>II</div>

          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", padding:"72px", gap:72 }}>
            {/* Izquierda */}
            <div>
              {obra.descripcion && (
                <div style={{ marginBottom:40 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, fontFamily:NEXA_HEAVY, marginBottom:18 }}>I · Descripción</div>
                  <p style={{ fontFamily:SANS, fontSize:"clamp(14px,1.1vw,16px)", color:C.ink, lineHeight:1.8, margin:0, overflowWrap:"break-word", wordBreak:"break-word" }}>
                    {obra.descripcion}
                  </p>
                </div>
              )}

              {obra.historia && (
                <div style={{ marginBottom:52, paddingLeft:20, borderLeft:`3px solid ${color}` }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, fontFamily:NEXA_HEAVY, marginBottom:14 }}>II · Historia de la obra</div>
                  <p style={{ fontFamily:SANS, fontSize:"clamp(13px,1.1vw,15px)", color:C.ink, lineHeight:1.8, margin:0, overflowWrap:"break-word", wordBreak:"break-word" }}>
                    {obra.historia}
                  </p>
                </div>
              )}

              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:color, fontFamily:NEXA_HEAVY, marginBottom:22 }}>{obra.historia ? "III" : "II"} · Detalles técnicos</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {[
                    { label:"Categoría",   value:obra.categoria_nombre },
                    { label:"Año",         value:obra.anio_creacion || "—" },
                    { label:"Dimensiones", value:obra.dimensiones_alto && obra.dimensiones_ancho ? `${obra.dimensiones_alto} × ${obra.dimensiones_ancho} cm` : "—" },
                    { label:"Técnica",     value:obra.tecnica_nombre || "—" },
                    { label:"Marco",       value:obra.permite_marco ? "Disponible" : "No disponible" },
                    { label:"Certificado", value:obra.con_certificado ? "Incluido" : "No incluido" },
                    ...(stockDisponible !== null ? [{ label:"Stock", value: stockDisponible === 0 ? "Agotada" : stockDisponible === 1 ? "Última pieza" : `${stockDisponible} disponibles` }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} style={{ borderBottom:"1px solid rgba(0,0,0,.07)", paddingBottom:16 }}>
                      <div style={{ fontSize:8, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:14, color:C.ink, fontFamily:SANS, fontWeight:600 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {obra.etiquetas && obra.etiquetas.length > 0 && (
                  <div style={{ marginTop:24 }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(0,0,0,.25)", fontFamily:NEXA_HEAVY, marginBottom:10 }}>Etiquetas</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {obra.etiquetas.map((e: any) => (
                        <span key={e.id_etiqueta} style={{ fontSize:11, padding:"5px 14px", borderRadius:100, background:`${C.purple}10`, border:`1px solid ${C.purple}22`, color:C.purple, fontWeight:700, fontFamily:SANS }}>{e.nombre}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Derecha: artista + certificado */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {obra.artista_nombre && (
                <div style={{ background:"#fff", borderRadius:2, padding:"28px 32px", border:`1px solid rgba(0,0,0,.07)`, boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:".28em", textTransform:"uppercase", color:C.pink, fontFamily:NEXA_HEAVY, marginBottom:18 }}>Sobre el artista</div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden", border:`2px solid ${C.pink}44`, flexShrink:0 }}>
                      {obra.artista_foto
                        ? <img src={obra.artista_foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        : <div style={{ width:"100%", height:"100%", background:`${C.pink}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:C.pink, fontFamily:SERIF }}>{obra.artista_nombre?.[0]}</div>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:C.ink, fontFamily:NEXA_HEAVY }}>{obra.artista_alias || obra.artista_nombre}</div>
                      {obra.artista_alias && <div style={{ fontSize:11, color:C.sub, fontFamily:SANS, marginTop:3 }}>{obra.artista_nombre}</div>}
                    </div>
                  </div>
                  {obra.artista_biografia && (
                    <p style={{ fontSize:12.5, color:C.sub, lineHeight:1.65, margin:"0 0 16px", fontFamily:SANS }}>
                      {obra.artista_biografia}
                    </p>
                  )}
                  <button onClick={() => navigate(`/artistas/${obra.id_artista}`)} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                    style={{ width:"100%", padding:"10px 20px", borderRadius:100, background:"transparent", border:`1px solid ${C.pink}44`, color:C.pink, fontSize:9, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", fontFamily:NEXA_HEAVY, cursor:"pointer", transition:"all .22s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background=`${C.pink}10`; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}
                  >Ver perfil del artista →</button>
                </div>
              )}

              {/* Certificado */}
              <div style={{ background:`linear-gradient(135deg, rgba(168,112,6,.06), rgba(232,100,12,.03))`, borderRadius:2, padding:"24px 28px", border:`1px solid ${C.gold}28` }}>
                <div style={{ height:1, background:`linear-gradient(90deg,${C.gold},transparent)`, marginBottom:18 }}/>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <Award size={18} color={C.gold} strokeWidth={1.8}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:".12em", fontFamily:NEXA_HEAVY }}>Certificado de Autenticidad</div>
                    <div style={{ fontSize:11, color:"rgba(0,0,0,.4)", fontFamily:SANS, marginTop:2 }}>Emitido por NU★B Studio</div>
                  </div>
                  <div style={{ padding:"3px 10px", borderRadius:100, background:`${C.gold}15`, border:`1px solid ${C.gold}30`, fontSize:8, fontWeight:800, color:C.gold, fontFamily:NEXA_HEAVY, flexShrink:0 }}>Verificado ✓</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { label:"Registro", value:`NUB-${obra.id_obra?.toString().padStart(5,"0") || "00001"}` },
                    { label:"Artista",  value:obra.artista_alias || obra.artista_nombre || "—" },
                    { label:"Técnica",  value:obra.tecnica_nombre || "Arte original" },
                    { label:"Galería",  value:"NU★B — Huasteca" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background:"rgba(168,112,6,.04)", borderRadius:2, padding:"8px 10px", border:`1px solid ${C.gold}12` }}>
                      <div style={{ fontSize:8, color:"rgba(0,0,0,.3)", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", marginBottom:3, fontFamily:NEXA_HEAVY }}>{label}</div>
                      <div style={{ fontSize:12, color:C.ink, fontWeight:600, fontFamily:SANS, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
             RELACIONADAS
        ════════════════════════════════════ */}
        {obra.obras_relacionadas && obra.obras_relacionadas.length > 0 && (
          <section style={{ background:"#fff", padding:"72px", borderTop:`1px solid rgba(0,0,0,.06)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:48 }}>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(0,0,0,.5)", whiteSpace:"nowrap", fontFamily:NEXA_HEAVY }}>Puede interesarte · Obras relacionadas</div>
              <div style={{ height:1, flex:1, background:"rgba(0,0,0,.06)" }}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {obra.obras_relacionadas.map((rel: any) => (
                <div key={rel.id_obra}
                  onClick={() => { navigate(`/obras/${rel.slug || rel.id_obra}`); globalThis.scrollTo(0,0); }}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ height:280, position:"relative", overflow:"hidden", cursor:"pointer", borderRadius:2 }}
                >
                  {rel.imagen_principal
                    ? <img src={rel.imagen_principal} alt={rel.titulo} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .55s cubic-bezier(.16,1,.3,1)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform="scale(1.08)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform="scale(1)"}
                      />
                    : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${color}14, #1a1830)` }}/>
                  }
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,11,20,.92) 0%, transparent 55%)" }}/>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 18px" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"white", fontFamily:NEXA_HEAVY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rel.titulo}</div>
                    {rel.precio_minimo && (
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", fontFamily:SANS, marginTop:4 }}>{fmt(Number(rel.precio_minimo))}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ padding:"22px 72px", borderTop:"1px solid rgba(0,0,0,.06)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff" }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(0,0,0,.12)", fontFamily:NEXA_HEAVY, letterSpacing:".1em" }}>NU★B STUDIO</div>
          <button onClick={() => navigate("/catalogo")} onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            style={{ fontSize:10, fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(0,0,0,.3)", border:"none", background:"none", cursor:"pointer", fontFamily:NEXA_HEAVY, transition:"color .2s" }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.color=C.ink}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.color="rgba(0,0,0,.3)"}
          >← Ver catálogo completo</button>
        </div>
      </div>

      {/* Lightbox */}
      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.96)", zIndex:100000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out", backdropFilter:"blur(16px)", animation:"fadeI .25s ease" }}>
          <img src={imgActiva || obra.imagen_principal} alt={obra.titulo}
            style={{ maxWidth:"88vw", maxHeight:"88vh", objectFit:"contain", borderRadius:2, boxShadow:"0 40px 100px rgba(0,0,0,.8)" }}
          />
          <div style={{ position:"absolute", top:20, right:20, width:36, height:36, borderRadius:"50%", border:"1px solid rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.5)", fontSize:18, cursor:"pointer" }}>✕</div>
        </div>
      )}
    </>
  );
}