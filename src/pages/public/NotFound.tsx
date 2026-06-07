// src/pages/public/NotFound.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  blue:   "#2D6FBE",
  ink:    "#14121E",
  sub:    "#9896A8",
  border: "#E6E4EF",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

export default function NotFound() {
  const navigate = useNavigate();
  const [mouse,  setMouse]  = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      setCursor(prev => ({ x: lerp(prev.x, mouse.x, 0.15), y: lerp(prev.y, mouse.y, 0.15) }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mouse]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 280);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#FFFFFF", fontFamily:SANS, overflow:"hidden", position:"relative" }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .nf-grain {
          position:fixed; inset:0; pointer-events:none; z-index:1;
          opacity:.022; mix-blend-mode:multiply;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px;
        }
        .nf-cursor-dot {
          position:fixed; pointer-events:none; z-index:9999;
          width:6px; height:6px; border-radius:50%;
          background:${C.orange}; transform:translate(-50%,-50%);
        }
        .nf-cursor-ring {
          position:fixed; pointer-events:none; z-index:9998;
          width:32px; height:32px; border-radius:50%;
          border:1.5px solid rgba(232,100,12,.4);
          transform:translate(-50%,-50%);
        }

        @keyframes g1 {
          0%  {clip-path:inset(20% 0 60% 0);transform:translate(-6px,2px)}
          40% {clip-path:inset(55% 0 12% 0);transform:translate(5px,-1px)}
          80% {clip-path:inset(8% 0 78% 0); transform:translate(-3px,3px)}
          100%{clip-path:inset(40% 0 32% 0);transform:translate(0,0)}
        }
        @keyframes g2 {
          0%  {clip-path:inset(48% 0 28% 0);transform:translate(5px,-2px)}
          40% {clip-path:inset(12% 0 63% 0);transform:translate(-5px,2px)}
          80% {clip-path:inset(68% 0 6% 0); transform:translate(3px,-3px)}
          100%{clip-path:inset(30% 0 48% 0);transform:translate(0,0)}
        }
        .glitch-1 { animation:g1 .28s steps(1) forwards; }
        .glitch-2 { animation:g2 .28s steps(1) forwards; }

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
        }
        .reveal { animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both; }

        @keyframes marquee {
          from{transform:translateX(0)} to{transform:translateX(-50%)}
        }
        .nf-marquee {
          display:flex; gap:44px; white-space:nowrap;
          animation:marquee 22s linear infinite; width:max-content;
        }

        @keyframes orbFloat {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)}
        }

        .nf-btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 28px; border-radius:100px;
          border:1.5px solid ${C.border}; background:transparent;
          font-family:${SANS}; font-size:11px; font-weight:700;
          letter-spacing:.2em; text-transform:uppercase;
          color:${C.sub}; cursor:pointer; transition:all .22s;
        }
        .nf-btn-outline:hover { border-color:${C.ink}; color:${C.ink}; }

        .nf-btn-solid {
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 28px; border-radius:100px;
          border:none; background:${C.orange};
          font-family:${SANS}; font-size:11px; font-weight:700;
          letter-spacing:.2em; text-transform:uppercase;
          color:#fff; cursor:pointer;
          box-shadow:0 8px 28px rgba(232,100,12,.28);
          transition:all .22s;
        }
        .nf-btn-solid:hover { background:#D4580A; transform:translateY(-2px); box-shadow:0 12px 36px rgba(232,100,12,.38); }

        .nf-logo { background:none; border:none; cursor:pointer; padding:0;
          font-family:${SERIF}; font-size:21px; font-weight:900; color:${C.ink};
          letter-spacing:-.02em; transition:opacity .18s; }
        .nf-logo:hover { opacity:.6; }

        .nf-nav-link { background:none; border:none; cursor:pointer;
          font-family:${SANS}; font-size:11.5px; font-weight:600;
          color:${C.sub}; letter-spacing:.05em; transition:color .15s; padding:0; }
        .nf-nav-link:hover { color:${C.ink}; }
      `}</style>

      {/* Cursor */}
      <div className="nf-cursor-dot"  style={{ left:mouse.x,  top:mouse.y  }}/>
      <div className="nf-cursor-ring" style={{ left:cursor.x, top:cursor.y }}/>

      {/* Grain */}
      <div className="nf-grain"/>

      {/* Orbes de fondo — sutiles sobre blanco */}
      <div style={{
        position:"absolute", top:"-8%", right:"-4%",
        width:520, height:520, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.orange}0C 0%, transparent 65%)`,
        animation:"orbFloat 10s ease-in-out infinite",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:"-6%", left:"-4%",
        width:420, height:420, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.pink}0A 0%, transparent 65%)`,
        animation:"orbFloat 13s ease-in-out infinite reverse",
        pointerEvents:"none",
      }}/>

      {/* ── Navbar ── */}
      <nav style={{
        position:"absolute", top:0, left:0, right:0, zIndex:10,
        padding:"22px 48px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:`1px solid ${C.border}`,
        background:"rgba(255,255,255,.85)", backdropFilter:"blur(12px)",
      }}>
        <button className="nf-logo" onClick={() => navigate("/")}>
          NU<span style={{color:C.orange}}>★</span>B
        </button>
        <div style={{display:"flex", gap:28}}>
          <button className="nf-nav-link" onClick={() => navigate("/catalogo")}>Galería</button>
          <button className="nf-nav-link" onClick={() => navigate("/artistas")}>Artistas</button>
          <button className="nf-nav-link" onClick={() => navigate("/")}>Inicio</button>
        </div>
      </nav>

      {/* ── Contenido central ── */}
      <div style={{
        minHeight:"100vh",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        position:"relative", zIndex:2,
        padding:"100px 32px 80px",
        textAlign:"center",
      }}>

        {/* 404 decorativo de fondo */}
        <div style={{
          position:"absolute",
          fontFamily:NEXA,
          fontSize:"clamp(200px,28vw,360px)",
          fontWeight:900, color:"rgba(20,18,30,.025)",
          letterSpacing:"-.06em", userSelect:"none", pointerEvents:"none",
          lineHeight:1, top:"50%", left:"50%",
          transform:"translate(-50%,-52%)",
        }}>404</div>

        {/* Chip */}
        <div className="reveal" style={{
          display:"inline-flex", alignItems:"center", gap:7,
          background:`${C.orange}12`, border:`1px solid ${C.orange}28`,
          borderRadius:100, padding:"5px 14px", marginBottom:28,
        }}>
          <div style={{width:6, height:6, borderRadius:"50%", background:C.orange}}/>
          <span style={{fontSize:9.5, fontWeight:800, letterSpacing:".22em", textTransform:"uppercase", color:C.orange, fontFamily:SANS}}>
            Error 404
          </span>
        </div>

        {/* Título con glitch */}
        <div className="reveal" style={{animationDelay:"80ms", position:"relative"}}>
          <h1 style={{
            margin:"0 0 6px", fontFamily:SERIF, fontStyle:"italic",
            fontSize:"clamp(50px,9vw,108px)", fontWeight:900,
            color:C.ink, letterSpacing:"-.04em", lineHeight:.92,
            position:"relative", zIndex:1,
          }}>
            {glitch && (
              <span className="glitch-1" style={{
                position:"absolute", top:0, left:0, width:"100%",
                color:C.blue, opacity:.5,
                fontFamily:SERIF, fontStyle:"italic",
                fontSize:"clamp(50px,9vw,108px)", fontWeight:900, letterSpacing:"-.04em",
              }}>Página perdida</span>
            )}
            {glitch && (
              <span className="glitch-2" style={{
                position:"absolute", top:0, left:0, width:"100%",
                color:C.orange, opacity:.4,
                fontFamily:SERIF, fontStyle:"italic",
                fontSize:"clamp(50px,9vw,108px)", fontWeight:900, letterSpacing:"-.04em",
              }}>Página perdida</span>
            )}
            Página perdida
          </h1>
        </div>

        {/* Subtítulo */}
        <p className="reveal" style={{
          animationDelay:"160ms",
          margin:"26px 0 44px", fontSize:"clamp(14px,2vw,16px)",
          color:C.sub, fontFamily:SANS, fontWeight:400,
          maxWidth:420, lineHeight:1.75,
        }}>
          La obra que buscas no existe, fue movida o nunca estuvo aquí.
          Explora la galería para descubrir arte auténtico.
        </p>

        {/* Botones */}
        <div className="reveal" style={{display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", animationDelay:"240ms"}}>
          <button className="nf-btn-outline" onClick={() => navigate(-1)}>
            ← Volver atrás
          </button>
          <button className="nf-btn-solid" onClick={() => navigate("/catalogo")}>
            Explorar galería →
          </button>
        </div>

        {/* Divisor */}
        <div className="reveal" style={{marginTop:60, display:"flex", alignItems:"center", gap:16, animationDelay:"320ms"}}>
          <div style={{width:44, height:1, background:C.border}}/>
          <span style={{fontFamily:SERIF, fontSize:12, color:C.sub, letterSpacing:".15em", textTransform:"uppercase", opacity:.6}}>
            NU<span style={{color:C.orange}}>★</span>B Studio
          </span>
          <div style={{width:44, height:1, background:C.border}}/>
        </div>
      </div>

      {/* ── Marquee inferior ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:3,
        borderTop:`1px solid ${C.border}`,
        padding:"11px 0", overflow:"hidden", background:"#fff",
      }}>
        <div className="nf-marquee">
          {Array.from({length:2}).map((_,ri) =>
            ["Arte Digital","NU★B Studio","Huasteca Hidalguense","Galería","Colección","Obra Original","Edición Limitada","Arte Contemporáneo"].map((t,i) => (
              <span key={`${ri}-${i}`} style={{
                fontSize:9.5, fontWeight:700, letterSpacing:".25em",
                textTransform:"uppercase", color:C.sub, fontFamily:SANS, opacity:.5,
              }}>
                {t} <span style={{color:C.orange, marginLeft:20}}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
