// src/pages/public/Home.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Paleta ────────────────────────────────────────────────────────────────
const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  ink:    "#14121E",
  sub:    "#9896A8",
  dark:   "#0D0B14",
};

// ── Tipografías ───────────────────────────────────────────────────────────
const SERIF = "'Playfair Display', serif";
const SANS  = "'Outfit', sans-serif";

// ── Categorías (estático — datos editoriales fijos) ───────────────────────
const CATS = [
  { slug: "pintura",    label: "Pintura",    count: "120", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=80" },
  { slug: "artesania",  label: "Artesanía",  count: "200", img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300&q=80" },
  { slug: "fotografia", label: "Fotografía", count: "85",  img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&q=80" },
  { slug: "escultura",  label: "Escultura",  count: "60",  img: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=300&q=80" },
];

// ── Stats (estático) ──────────────────────────────────────────────────────
const STATS = [
  { val: "500+", label: "Obras en galería" },
  { val: "50+",  label: "Artistas activos"  },
  { val: "5",    label: "Disciplinas"       },
  { val: "98%",  label: "Satisfacción"      },
];

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Obra {
  id_obra:          number;
  titulo:           string;
  slug:             string;
  imagen_principal: string;
  categoria_nombre: string;
  artista_nombre:   string;
  artista_alias?:   string;
}

interface Artista {
  id_artista:     number;
  nombre_completo:string;
  alias?:         string;
  especialidad?:  string;
  foto_perfil?:   string;
}

// ── Hook IntersectionObserver ─────────────────────────────────────────────
function useReveal(threshold = 0.10) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>("[data-rv],[data-clip],[data-clip-h],[data-num]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add("rv-in");

          // Contador animado para data-num
          if (el.dataset.num) {
            const raw    = el.dataset.num;
            const suffix = raw.replace(/[\d.]/g, "");
            const target = Number.parseFloat(raw);
            const dur    = 1200;
            const start  = performance.now();
            const tick = (now: number) => {
              const p    = Math.min((now - start) / dur, 1);
              const ease = 1 - Math.pow(1 - p, 4);
              el.textContent = Math.round(ease * target) + suffix;
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = raw;
            };
            requestAnimationFrame(tick);
          }

          io.unobserve(el);
        }
      });
    }, { threshold });

    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);

  return containerRef;
}

// ── Componente principal ──────────────────────────────────────────────────
export default function Home() {
  const navigate   = useNavigate();
  const isLoggedIn = authService.isAuthenticated();
  const userRol    = localStorage.getItem("userRol") || "";

  // Estado de puertas de entrada
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorGone, setDoorGone] = useState(false);

  // Datos de API
  const [obras,    setObras]    = useState<Obra[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);

  // Refs cursor
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Ref parallax expo
  const expoFrameRef   = useRef<HTMLDivElement>(null);
  const expoSectionRef = useRef<HTMLElement>(null);

  // Ref hover categorías
  const [hovCat, setHovCat] = useState<number | null>(null);

  // Reveal hook — aplica IntersectionObserver a todos los elementos animados
  const pageRef = useReveal(0.10);

  // ── Efecto puertas ────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setDoorOpen(true),  1400);
    const t2 = setTimeout(() => setDoorGone(true),  2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Cursor personalizado ──────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = "none";
    let rx = 0, ry = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top  = `${my}px`;
      }
      // Detectar sección oscura (expo)
      const el     = document.elementFromPoint(mx, my);
      const inDark = el?.closest(".home-expo") !== null;
      dotRef.current?.classList.toggle("cur-dark", inDark);
      ringRef.current?.classList.toggle("cur-dark", inDark);
      // Animar ring con lag
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) {
          ringRef.current.style.left = `${rx}px`;
          ringRef.current.style.top  = `${ry}px`;
        }
        rafId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(rafId);
      animate();
    };

    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  // ── Cursor hover en interactivos ──────────────────────────────────────
  const cursorOn  = useCallback(() => {
    dotRef.current?.classList.add("cur-over");
    ringRef.current?.classList.add("cur-over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("cur-over");
    ringRef.current?.classList.remove("cur-over");
  }, []);

  // ── Parallax expo ─────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const sec = expoSectionRef.current;
      const frm = expoFrameRef.current;
      if (!sec || !frm) return;
      const rect     = sec.getBoundingClientRect();
      const vh       = window.innerHeight;
      const progress = 1 - (rect.top + rect.height / 2) / (vh / 2 + rect.height / 2);
      frm.style.transform = `translateY(${progress * 38}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Fetch obras ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/obras?limit=6&ordenar=recientes`)
      .then(r => r.json())
      .then(j => setObras(j.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch artistas ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/artistas?limit=5`)
      .then(r => r.json())
      .then(j => setArtistas(j.data || j || []))
      .catch(() => {});
  }, []);

  // ── Tamaños de retrato (cíclico) ──────────────────────────────────────
  const portraitSizes: { w: number; h: number; cls: string }[] = [
    { w: 210, h: 290, cls: "grande"  },
    { w: 165, h: 230, cls: "mediano" },
    { w: 142, h: 192, cls: "chico"   },
    { w: 210, h: 290, cls: "grande"  },
    { w: 165, h: 230, cls: "mediano" },
  ];

  return (
    <div ref={pageRef} style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>

      {/* ═══════════════════════════════════
          CSS GLOBAL DEL COMPONENTE
      ═══════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap');

        /* ── Grano de película ── */
        .home-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        /* ── Cursor ── */
        .home-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width .22s, height .22s, background .22s;
        }
        .home-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .home-cursor-dot.cur-over  { width: 4px; height: 4px; background: #E8640C; }
        .home-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
        .home-cursor-dot.cur-dark  { background: #fff; }
        .home-cursor-ring.cur-dark { border-color: rgba(255,255,255,.3); }

        /* ── Puertas ── */
        .home-door-wrap {
          position: fixed; inset: 0; z-index: 99990;
          display: flex; pointer-events: none;
        }
        .home-door {
          flex: 1; background: #0D0B14;
          transition: transform 1.2s cubic-bezier(.76,0,.24,1);
        }
        .home-door.izq  { transform-origin: left  center; }
        .home-door.der  { transform-origin: right center; }
        .home-door-wrap.open .home-door.izq { transform: translateX(-100%); }
        .home-door-wrap.open .home-door.der { transform: translateX(100%);  }
        .home-door-logo {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 99991; font-family: 'Playfair Display', serif;
          font-size: clamp(64px, 10vw, 130px); font-weight: 900; color: #fff;
          letter-spacing: -.03em; pointer-events: none;
          transition: opacity .35s ease .8s;
        }
        .home-door-logo.open { opacity: 0; }
        .home-door-sub {
          position: fixed; top: calc(50% + clamp(48px, 8vw, 104px)); left: 50%;
          transform: translateX(-50%);
          z-index: 99991; font-size: 9px; font-weight: 700; letter-spacing: .44em;
          text-transform: uppercase; color: rgba(255,255,255,.35);
          pointer-events: none; transition: opacity .3s ease .7s;
        }
        .home-door-sub.open { opacity: 0; }
        .home-door-line {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 99991; width: 1px; height: 60px; background: #E8640C;
          pointer-events: none; transition: opacity .25s ease .75s;
        }
        .home-door-line.open { opacity: 0; }

        /* ── Animaciones hero ── */
        @keyframes barIn    { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        @keyframes fadeL    { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeR    { from{opacity:0;transform:translateX(16px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fadeI    { from{opacity:0} to{opacity:1} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 10px rgba(232,100,12,.5);transform:scale(1)} 50%{box-shadow:0 0 22px rgba(232,100,12,.85);transform:scale(1.38)} }
        @keyframes scrollDn { from{top:-100%} to{top:200%} }
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .altar-letter {
          display: inline-block; opacity: 0;
          transform: translateY(60px) skewY(4deg);
          animation: letterUp 1.1s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes letterUp { to{opacity:1;transform:translateY(0) skewY(0)} }
        .altar-letter:nth-child(1){animation-delay:.18s}
        .altar-letter:nth-child(2){animation-delay:.26s}
        .altar-letter:nth-child(3){animation-delay:.34s}
        .altar-letter:nth-child(4){animation-delay:.42s}
        .altar-letter:nth-child(5){animation-delay:.50s}

        .hero-corner { position: absolute; width: 38px; height: 38px; pointer-events: none; opacity: 0; animation: fadeI 1s ease 1.1s both; }
        .hero-corner::before, .hero-corner::after { content: ''; position: absolute; background: rgba(0,0,0,.09); }
        .hero-corner::before { width: 1px; height: 38px; }
        .hero-corner::after  { width: 38px; height: 1px; }
        .hero-corner.tl { top:22px; left:26px; }
        .hero-corner.tr { top:22px; right:26px; }
        .hero-corner.tr::before { right:0; left:auto; }
        .hero-corner.tr::after  { right:0; left:auto; }
        .hero-corner.bl { bottom:22px; left:26px; }
        .hero-corner.bl::before { bottom:0; top:auto; }
        .hero-corner.bl::after  { bottom:0; top:auto; }
        .hero-corner.br { bottom:22px; right:26px; }
        .hero-corner.br::before { right:0; left:auto; bottom:0; top:auto; }
        .hero-corner.br::after  { right:0; left:auto; bottom:0; top:auto; }

        /* ── Scroll reveals ── */
        [data-rv]   { opacity:0; transform:translateY(26px); transition:opacity .9s ease, transform .9s ease; }
        [data-clip] { clip-path:inset(100% 0 0 0); transition:clip-path 1.3s cubic-bezier(.16,1,.3,1); }
        [data-clip-h] { clip-path:inset(0 100% 0 0); transition:clip-path 1.5s cubic-bezier(.16,1,.3,1); }
        [data-rv].rv-in   { opacity:1; transform:translateY(0); }
        [data-clip].rv-in { clip-path:inset(0% 0 0 0); }
        [data-clip-h].rv-in { clip-path:inset(0 0% 0 0); }

        /* delays para grupos */
        [data-rv][data-d="1"]{transition-delay:.06s}
        [data-rv][data-d="2"]{transition-delay:.14s}
        [data-rv][data-d="3"]{transition-delay:.22s}
        [data-rv][data-d="4"]{transition-delay:.30s}
        [data-rv][data-d="5"]{transition-delay:.38s}
        [data-clip][data-d="1"]{transition-delay:.05s}
        [data-clip][data-d="2"]{transition-delay:.20s}
        [data-clip][data-d="3"]{transition-delay:.35s}
        [data-clip][data-d="4"]{transition-delay:.50s}
        [data-clip][data-d="5"]{transition-delay:.65s}

        /* ── Marco de obra ── */
        .home-marco {
          position: relative; border-radius: 2px; overflow: hidden;
          transform: perspective(1000px) rotateX(2deg) rotateY(-1.2deg);
          transition: transform .9s cubic-bezier(.16,1,.3,1), box-shadow .9s;
          box-shadow: 0 0 0 1px rgba(0,0,0,.06), -2px 4px 12px rgba(0,0,0,.07),
            2px 12px 32px rgba(0,0,0,.09), 0 28px 60px rgba(0,0,0,.08);
        }
        .home-marco::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), inset 0 2px 8px rgba(255,255,255,.06);
        }
        .home-pieza:hover .home-marco {
          transform: perspective(1000px) rotateX(0) rotateY(0) translateY(-10px);
          box-shadow: 0 0 0 1px rgba(0,0,0,.08), -1px 8px 22px rgba(0,0,0,.10),
            1px 20px 50px rgba(0,0,0,.14), 0 40px 80px rgba(0,0,0,.12);
        }
        .home-marco img { width: 100%; display: block; height: auto; filter: saturate(.80) contrast(1.01); transition: filter .8s, transform 1s; }
        .home-pieza:hover .home-marco img { filter: saturate(.98) contrast(1.02); transform: scale(1.03); }

        /* ── Categorías ── */
        .home-cat-item { transition: padding-left .4s cubic-bezier(.16,1,.3,1); }
        .home-cat-item:hover { padding-left: 10px; }
        .home-cat-name  { transition: color .28s, letter-spacing .4s cubic-bezier(.16,1,.3,1); }
        .home-cat-item:hover .home-cat-name { color: #E8640C !important; letter-spacing: .005em !important; }
        .home-cat-img   { opacity: 0; transform: translateY(-50%) translateX(14px) scale(.94); transition: opacity .38s, transform .48s cubic-bezier(.16,1,.3,1); }
        .home-cat-item:hover .home-cat-img { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
        .home-cat-count { transition: color .25s; }
        .home-cat-item:hover .home-cat-count { color: #E8640C !important; }
        .home-cat-arrow { transition: transform .32s, color .25s; }
        .home-cat-item:hover .home-cat-arrow { transform: translateX(8px); color: #E8640C !important; }

        /* ── Artistas ── */
        .home-retrato { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .home-retrato:hover { transform: translateY(-10px); }
        .home-retrato-foto { border-radius: 2px; overflow: hidden; position: relative;
          box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 6px 18px rgba(0,0,0,.08), 0 18px 50px rgba(0,0,0,.08);
          transition: box-shadow .55s;
        }
        .home-retrato:hover .home-retrato-foto { box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 12px 30px rgba(0,0,0,.12), 0 30px 70px rgba(0,0,0,.12); }
        .home-retrato-foto img { display: block; object-fit: cover; filter: saturate(.65) contrast(1.02); transition: filter .65s, transform .8s; }
        .home-retrato:hover .home-retrato-foto img { filter: saturate(.90) contrast(1.03); transform: scale(1.04); }
        .home-retrato-foto::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(232,100,12,.12) 0%, transparent 50%); opacity: 0; transition: opacity .45s; pointer-events: none; }
        .home-retrato:hover .home-retrato-foto::after { opacity: 1; }
        .home-retrato-nombre { transition: color .28s; }
        .home-retrato:hover .home-retrato-nombre { color: #14121E !important; }

        /* ── Expo destacada ── */
        .home-expo-frame {
          position: relative; border-radius: 2px; overflow: hidden;
          transform: perspective(1200px) rotateX(1.5deg) rotateY(1.8deg);
          transition: transform 1s cubic-bezier(.16,1,.3,1), box-shadow 1s;
          box-shadow: 0 0 0 1px rgba(255,255,255,.06), -4px 8px 24px rgba(0,0,0,.50),
            4px 20px 56px rgba(0,0,0,.55), 0 40px 90px rgba(0,0,0,.60),
            0 70px 140px rgba(0,0,0,.40);
        }
        .home-expo-frame::after { content: ''; position: absolute; inset: 0; pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.10), inset 0 3px 12px rgba(255,255,255,.04);
        }
        .home-expo-frame-wrap:hover .home-expo-frame {
          transform: perspective(1200px) rotateX(0) rotateY(0) translateY(-8px);
          box-shadow: 0 0 0 1px rgba(255,255,255,.08), -2px 14px 36px rgba(0,0,0,.55),
            2px 28px 70px rgba(0,0,0,.60), 0 56px 110px rgba(0,0,0,.65);
        }
        .home-expo-frame img { display: block; width: 340px; height: auto; filter: saturate(.75) contrast(1.05) brightness(.95); transition: filter .8s, transform 1s; }
        .home-expo-frame-wrap:hover .home-expo-frame img { filter: saturate(.92) contrast(1.06) brightness(1.0); transform: scale(1.02); }

        /* ── CTA obras ── */
        .home-cta-obra { position: absolute; border-radius: 2px; overflow: hidden; transition: box-shadow .5s, transform .5s; }
        .home-cta-obra img { display: block; object-fit: cover; filter: saturate(.80); transition: filter .5s; }
        .home-cta-obra:hover img { filter: saturate(.96); }

        /* ── Footer links ── */
        .home-footer-link { font-size: 13px; color: rgba(0,0,0,.42); text-decoration: none; transition: color .2s; }
        .home-footer-link:hover { color: #14121E; }
        .home-footer-social { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(0,0,0,.09); display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,.30); font-size: 11px; text-decoration: none; transition: all .2s; }
        .home-footer-social:hover { border-color: #E8640C; color: #E8640C; }

        /* ── Nav links hero ── */
        .home-nav-link { display: flex; align-items: center; gap: 9px; font-size: 9.5px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #9896A8; text-decoration: none; transition: color .25s; }
        .home-nav-link::before { content: ''; display: block; width: 12px; height: 1px; background: currentColor; flex-shrink: 0; transition: width .28s; }
        .home-nav-link:hover { color: #14121E; }
        .home-nav-link:hover::before { width: 22px; }

        /* ── Marquee ── */
        .home-marquee-track { display: inline-flex; animation: marquee 28s linear infinite; }
        .home-marquee-wrap:hover .home-marquee-track { animation-play-state: paused; }

        /* ── Scroll indicator ── */
        .home-scroll-ln::after { content: ''; position: absolute; top: -100%; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, transparent, #E8640C, transparent); animation: scrollDn 2.4s ease-in-out 2.2s infinite; }
      `}</style>

      {/* Grano */}
      <div className="home-grain" />

      {/* Cursor */}
      <div ref={dotRef}  className="home-cursor-dot"  />
      <div ref={ringRef} className="home-cursor-ring" />

      {/* ═══ PUERTAS DE ENTRADA ═══ */}
      {!doorGone && (
        <>
          <div className={`home-door-wrap${doorOpen ? " open" : ""}`}>
            <div className="home-door izq" />
            <div className="home-door der" />
          </div>
          <div className={`home-door-logo${doorOpen ? " open" : ""}`}>ALTAR</div>
          <div className={`home-door-sub${doorOpen  ? " open" : ""}`}>Galería de Arte</div>
          <div className={`home-door-line${doorOpen ? " open" : ""}`} />
        </>
      )}

      {/* ═══════════════════════════════════
          I · HERO
      ═══════════════════════════════════ */}
      <section style={{ position: "relative", height: "100vh", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", overflow: "hidden" }}>

        {/* Barra superior */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.orange} 25%, ${C.pink} 75%, transparent)`, animation: "barIn 2s cubic-bezier(.16,1,.3,1) both" }} />

        {/* Esquinas decorativas */}
        <div className="hero-corner tl" />
        <div className="hero-corner tr" />
        <div className="hero-corner bl" />
        <div className="hero-corner br" />

        {/* Texto ambiental */}
        <div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(60px,8vw,110px)", fontWeight: 900, color: "rgba(0,0,0,.020)", whiteSpace: "nowrap", letterSpacing: "-.02em", userSelect: "none", pointerEvents: "none", animation: "fadeI 2s ease 2s both" }}>galería</div>

        {/* Nav top-left */}
        <nav style={{ position: "absolute", top: 30, left: 52, display: "flex", flexDirection: "column", gap: 10, animation: "fadeL 1.1s ease .4s both" }}>
          <Link to="/catalogo"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Galería</Link>
          <Link to="/artistas"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Artistas</Link>
          <Link to="/blog"           className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Blog</Link>
          <Link to="/contacto"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Contacto</Link>
        </nav>

        {/* Nav top-right */}
        <div style={{ position: "absolute", top: 30, right: 52, display: "flex", alignItems: "center", gap: 12, animation: "fadeR 1.1s ease .4s both" }}>
          {!isLoggedIn ? (
            <>
              <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", transition: "all .22s" }}>Ingresar</Link>
              <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", textDecoration: "none", padding: "7px 16px", borderRadius: 100, background: C.orange, boxShadow: "0 4px 16px rgba(232,100,12,.30)", transition: "all .22s" }}>Ser artista</Link>
            </>
          ) : (
            <Link to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"} onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)" }}>Mi cuenta</Link>
          )}
        </div>

        {/* Centro — ALTAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(96px,14vw,180px)", fontWeight: 900, color: C.ink, letterSpacing: "-.03em", lineHeight: .88, display: "flex", userSelect: "none", margin: 0 }}>
            {"ALTAR".split("").map((l, i) => <span key={i} className="altar-letter">{l}</span>)}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "26px 0 20px", animation: "fadeI 1s ease .8s both" }}>
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, boxShadow: "0 0 10px rgba(232,100,12,.5)", animation: "pulse 3.2s ease-in-out 1.5s infinite" }} />
            <div style={{ width: 56, height: 1, background: "rgba(0,0,0,.08)" }} />
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".44em", textTransform: "uppercase", color: C.sub, fontFamily: SANS, margin: 0, animation: "fadeI 1s ease 1s both" }}>Galería de Arte</p>
        </div>

        {/* Stats laterales */}
        <div style={{ position: "absolute", bottom: 44, left: 52, fontFamily: SERIF, fontSize: 10.5, fontStyle: "italic", color: "rgba(0,0,0,.12)", letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 10, animation: "fadeI 1.5s ease 1.4s both" }}>
          <span style={{ display: "block", width: 22, height: 1, background: "rgba(0,0,0,.08)" }} />
          500 · obras
        </div>
        <div style={{ position: "absolute", bottom: 44, right: 52, fontFamily: SERIF, fontSize: 10.5, fontStyle: "italic", color: "rgba(0,0,0,.12)", letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 10, flexDirection: "row-reverse", animation: "fadeI 1.5s ease 1.4s both" }}>
          <span style={{ display: "block", width: 22, height: 1, background: "rgba(0,0,0,.08)" }} />
          50 · artistas
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 34, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "fadeI 1s ease 1.8s both" }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: ".32em", textTransform: "uppercase", color: "rgba(0,0,0,.14)", fontFamily: SANS }}>Explorar</div>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, rgba(0,0,0,.12), transparent)", position: "relative", overflow: "hidden" }} className="home-scroll-ln" />
        </div>
      </section>

      {/* ═══════════════════════════════════
          MANIFIESTO
      ═══════════════════════════════════ */}
      <section style={{ padding: "80px 72px 90px", borderTop: "1px solid rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: 72, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", fontFamily: SERIF, fontSize: 280, fontWeight: 900, fontStyle: "italic", color: "rgba(0,0,0,.025)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>I</div>
        <div data-rv style={{ fontFamily: SERIF, fontSize: 10, fontStyle: "italic", color: "rgba(0,0,0,.18)", letterSpacing: ".04em", writingMode: "vertical-rl", transform: "rotate(180deg)", flexShrink: 0 }}>Manifiesto</div>
        <div data-rv data-d="1" style={{ fontFamily: SERIF, fontSize: "clamp(20px,2.8vw,34px)", fontStyle: "italic", fontWeight: 400, color: C.ink, lineHeight: 1.5, letterSpacing: "-.01em", maxWidth: 680 }}>
          "El arte de la Huasteca no se <em style={{ fontStyle: "normal", fontWeight: 700, color: C.orange }}>exhibe</em> —<br />
          se <em style={{ fontStyle: "normal", fontWeight: 700, color: C.orange }}>encuentra</em>."
        </div>
        <div data-rv data-d="2" style={{ flex: 1, height: 1, background: "rgba(0,0,0,.05)", flexShrink: 0 }} />
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="home-marquee-wrap" style={{ borderTop: "1px solid rgba(0,0,0,.05)", borderBottom: "1px solid rgba(0,0,0,.05)", padding: "16px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div className="home-marquee-track">
          {["Pintura", "Fotografía", "Cerámica", "Escultura", "Artesanía", "Arte Digital", "Grabado", "Textil",
            "Pintura", "Fotografía", "Cerámica", "Escultura", "Artesanía", "Arte Digital", "Grabado", "Textil"].map((item, i) => (
            <div key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.20)", padding: "0 28px", display: "inline-flex", alignItems: "center", gap: 28, fontFamily: SANS }}>
              {item}
              <span style={{ fontSize: 7, color: C.orange, opacity: .7 }}>★</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════
          II · COLECCIÓN (masonry — API)
      ═══════════════════════════════════ */}
      <section style={{ padding: "80px 72px 100px" }}>
        {/* Etiqueta de sala */}
        <div data-rv style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 64 }}>
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
          <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.16)", whiteSpace: "nowrap", fontFamily: SANS }}>I · Colección</div>
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
          <Link to="/catalogo" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.orange, whiteSpace: "nowrap", textDecoration: "none", fontFamily: SANS }}>
            Ver todo →
          </Link>
        </div>

        {/* Masonry 3 columnas */}
        <div style={{ columnCount: 3, columnGap: 36 }}>
          {obras.slice(0, 6).map((obra, i) => (
            <div
              key={obra.id_obra}
              className="home-pieza"
              style={{ breakInside: "avoid", marginBottom: 44, display: "block", cursor: "pointer" }}
              onClick={() => navigate(`/obras/${obra.slug}`)}
              onMouseEnter={cursorOn}
              onMouseLeave={cursorOff}
            >
              <div style={{ position: "relative" }}>
                {/* Haz de luz de techo */}
                <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: "75%", height: "calc(100% + 60px)", background: "linear-gradient(to bottom, rgba(255,252,246,.72) 0%, rgba(255,252,246,.18) 35%, transparent 65%)", pointerEvents: "none", zIndex: 1 }} />
                <div data-clip data-d={String((i % 3) + 1)} className="home-marco">
                  <img
                    src={obra.imagen_principal}
                    alt={obra.titulo}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80"; }}
                  />
                </div>
              </div>
              {/* Sombra suelo */}
              <div style={{ height: 18, background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,0,0,.13) 0%, transparent 70%)", filter: "blur(5px)", transform: "scaleY(.45)" }} />
              {/* Cédula */}
              <div data-rv data-d={String((i % 3) + 1)} style={{ marginTop: 13, paddingLeft: 8, borderLeft: "1.5px solid rgba(0,0,0,.06)" }}>
                <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: "rgba(0,0,0,.55)" }}>{obra.titulo}</div>
                <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(0,0,0,.20)", marginTop: 3, fontFamily: SANS }}>{obra.categoria_nombre} · {obra.artista_alias || obra.artista_nombre}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          EXPOSICIÓN DESTACADA (estático)
          ──────────────────────────────────
          NOTA: Esta sección es contenido
          estático. Requiere un endpoint
          /api/obras/destacada en el futuro.
      ═══════════════════════════════════ */}
      <section ref={expoSectionRef} className="home-expo" style={{ background: C.dark, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "90vh", position: "relative", overflow: "hidden" }}>
        {/* Textura pared */}
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px", opacity: .04, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, left: 50, fontFamily: SERIF, fontSize: 280, fontWeight: 900, fontStyle: "italic", color: "rgba(255,255,255,.028)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>II</div>

        {/* Texto izquierdo */}
        <div style={{ padding: "80px 64px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, borderRight: "1px solid rgba(255,255,255,.05)" }}>
          <div data-rv style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 8, fontWeight: 800, letterSpacing: ".35em", textTransform: "uppercase", color: C.orange, marginBottom: 40, fontFamily: SANS }}>
            <span style={{ display: "block", width: 32, height: 1, background: C.orange }} />
            Ahora en sala
          </div>
          <h2 data-rv data-d="1" style={{ fontFamily: SERIF, fontSize: "clamp(36px,5vw,72px)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", lineHeight: 1, marginBottom: 28, margin: "0 0 28px" }}>
            <span style={{ display: "block", fontStyle: "italic", fontWeight: 400, fontSize: ".55em", color: "rgba(255,255,255,.45)", marginBottom: 10 }}>Obra destacada</span>
            Tierra y color
          </h2>
          <p data-rv data-d="2" style={{ fontSize: 13.5, color: "rgba(255,255,255,.40)", lineHeight: 1.8, maxWidth: 360, marginBottom: 44, fontFamily: SANS }}>
            Una exploración de los pigmentos naturales de la Sierra Huasteca. Cada pincelada nace de la tierra que habitamos, del barro que da forma a nuestra identidad.
          </p>
          <div data-rv data-d="3" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
            {[["Artista", "María Luisa Castillo"], ["Técnica", "Óleo sobre tela · 120×90 cm"], ["Año", "2024"], ["Sala", "Colección permanente"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", minWidth: 70, fontFamily: SANS }}>{k}</span>
                <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,.65)" }}>{v}</span>
              </div>
            ))}
          </div>
          <Link data-rv data-d="4" to="/catalogo" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 9, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "#fff", textDecoration: "none", padding: "11px 22px", border: "1px solid rgba(255,255,255,.18)", borderRadius: 100, alignSelf: "flex-start", fontFamily: SANS, transition: "all .28s" }}>
            Ver obra completa →
          </Link>
        </div>

        {/* Imagen derecha */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 64px", zIndex: 1, overflow: "hidden" }}>
          {/* Haz de luz doble */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "55%", height: "85%", background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(255,248,235,.13) 0%, rgba(255,248,235,.05) 35%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "25%", height: "65%", background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(255,248,235,.10) 0%, transparent 60%)", pointerEvents: "none" }} />

          <div ref={expoFrameRef} className="home-expo-frame-wrap" style={{ position: "relative", zIndex: 1, willChange: "transform" }}
            onMouseEnter={cursorOn} onMouseLeave={cursorOff}>
            <div data-clip-h className="home-expo-frame">
              <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=90" alt="Tierra y color" />
            </div>
            {/* Sombra suelo */}
            <div style={{ height: 24, background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,0,0,.60) 0%, transparent 70%)", filter: "blur(8px)", transform: "scaleY(.4)", position: "relative", zIndex: 1 }} />
            {/* Cédula oscura */}
            <div data-rv data-d="3" style={{ marginTop: 18, paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,.10)" }}>
              <div style={{ fontFamily: SERIF, fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,.50)" }}>Tierra y color, 2024</div>
              <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", marginTop: 4, fontFamily: SANS }}>María Luisa Castillo · Óleo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          III · CATEGORÍAS (editorial)
      ═══════════════════════════════════ */}
      <section style={{ padding: "0 72px 120px", borderTop: "1px solid rgba(0,0,0,.05)" }}>
        <div style={{ padding: "80px 0 60px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div data-rv>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.18)", marginBottom: 14, fontFamily: SANS }}>III · Explorar</div>
            <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1 }}>¿Qué quieres<br />descubrir hoy?</div>
          </div>
          <div data-rv data-d="1" style={{ fontSize: 12, color: C.sub, maxWidth: 270, lineHeight: 1.75, textAlign: "right", fontFamily: SANS }}>Cada disciplina es un mundo. Navega por la colección y encuentra la obra que te habla.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {CATS.map((cat, i) => (
            <div
              key={cat.slug}
              data-rv data-d={String(i + 1)}
              className="home-cat-item"
              onClick={() => navigate(`/catalogo?categoria=${cat.slug}`)}
              onMouseEnter={() => { setHovCat(i); cursorOn(); }}
              onMouseLeave={() => { setHovCat(null); cursorOff(); }}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 0", borderBottom: "1px solid rgba(0,0,0,.05)", cursor: "pointer", overflow: "hidden", borderTop: i === 0 ? "1px solid rgba(0,0,0,.05)" : undefined }}
            >
              {/* Imagen hover */}
              <div className="home-cat-img" style={{ position: "absolute", right: 200, top: "50%", width: 130, height: 96, borderRadius: 2, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.18)", pointerEvents: "none", opacity: hovCat === i ? 1 : 0, transform: hovCat === i ? "translateY(-50%) translateX(0) scale(1)" : "translateY(-50%) translateX(14px) scale(.94)", transition: "opacity .38s, transform .48s cubic-bezier(.16,1,.3,1)" }}>
                <img src={cat.img} alt={cat.label} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.82)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 22, zIndex: 1 }}>
                <span style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: "rgba(0,0,0,.14)", minWidth: 22 }}>0{i + 1}</span>
                <span className="home-cat-name" style={{ fontFamily: SERIF, fontSize: "clamp(30px,4vw,50px)", fontWeight: 900, color: C.ink, letterSpacing: "-.025em", lineHeight: 1 }}>{cat.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
                <span className="home-cat-count" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(0,0,0,.18)", fontFamily: SANS }}>{cat.count} obras</span>
                <span className="home-cat-arrow" style={{ fontSize: 18, color: "rgba(0,0,0,.10)" }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          IV · ARTISTAS (API)
      ═══════════════════════════════════ */}
      <section style={{ padding: "100px 72px", background: "#fff" }}>
        <div data-rv style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56 }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(0,0,0,.18)", marginBottom: 10, fontFamily: SANS }}>IV · Voces</div>
            <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, color: C.ink, letterSpacing: "-.02em" }}>Los artistas</div>
          </div>
          <Link to="/artistas" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.orange, textDecoration: "none", fontFamily: SANS }}>Ver todos →</Link>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
          {artistas.slice(0, 5).map((artista, i) => {
            const size = portraitSizes[i % portraitSizes.length];
            return (
              <div
                key={artista.id_artista}
                data-rv data-d={String(i + 1)}
                className="home-retrato"
                onClick={() => navigate(`/artistas/${artista.id_artista}`)}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{ flexShrink: 0, cursor: "pointer" }}
              >
                <div className="home-retrato-foto">
                  <img
                    src={artista.foto_perfil || `https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85`}
                    alt={artista.nombre_completo}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85"; }}
                    style={{ width: size.w, height: size.h }}
                  />
                </div>
                <div style={{ padding: "12px 4px 0" }}>
                  <div className="home-retrato-nombre" style={{ fontFamily: SERIF, fontSize: 12, fontStyle: "italic", color: "rgba(0,0,0,.55)", marginBottom: 3 }}>{artista.alias || artista.nombre_completo}</div>
                  <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(0,0,0,.20)", fontFamily: SANS }}>{artista.especialidad || "Artista"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════
          V · NÚMEROS (estático, contador animado)
      ═══════════════════════════════════ */}
      <section style={{ padding: "90px 72px", borderTop: "1px solid rgba(0,0,0,.05)", borderBottom: "1px solid rgba(0,0,0,.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {STATS.map((stat, i) => (
            <div key={stat.label} data-rv data-d={String(i + 1)} style={{ padding: "36px 0", textAlign: "center", position: "relative", borderLeft: i > 0 ? "none" : undefined }}>
              {i > 0 && <div style={{ position: "absolute", left: 0, top: "22%", height: "56%", width: 1, background: "rgba(0,0,0,.055)" }} />}
              <div data-num={stat.val} style={{ fontFamily: SERIF, fontSize: "clamp(46px,6vw,78px)", fontWeight: 900, fontStyle: "italic", color: C.ink, letterSpacing: "-.03em", lineHeight: 1, display: "inline-block" }}>{stat.val}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(0,0,0,.20)", marginTop: 12, fontFamily: SANS }}>{stat.label}</div>
              <span style={{ display: "block", width: 14, height: 1, background: C.orange, margin: "12px auto 0" }} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          VI · CTA
      ═══════════════════════════════════ */}
      <section style={{ padding: "120px 72px", display: "flex", alignItems: "center", gap: 88, borderTop: "1px solid rgba(0,0,0,.05)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", fontFamily: SERIF, fontSize: 280, fontWeight: 900, fontStyle: "italic", color: "rgba(0,0,0,.022)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>VI</div>
        <div data-rv style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: C.orange, display: "flex", alignItems: "center", gap: 12, marginBottom: 22, fontFamily: SANS }}>
            <span style={{ display: "block", width: 18, height: 1, background: C.orange }} />
            Para artistas
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(30px,4vw,50px)", fontWeight: 900, color: C.ink, lineHeight: 1.08, letterSpacing: "-.025em", marginBottom: 18, margin: "0 0 18px" }}>
            ¿Tu obra merece<br />un lugar aquí?
          </h2>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8, maxWidth: 440, fontFamily: SANS }}>Únete a los artistas de la Huasteca. Tu trabajo, certificado y visible para coleccionistas de todo el país.</p>
          <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap", alignItems: "center" }}>
            <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 100, background: C.orange, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", textDecoration: "none", boxShadow: "0 6px 20px rgba(232,100,12,.28)", fontFamily: SANS, transition: "all .25s" }}>
              Solicitar ingreso
            </Link>
            <Link to="/sobre-nosotros" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 100, border: "1px solid rgba(0,0,0,.11)", color: C.sub, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", textDecoration: "none", fontFamily: SANS, transition: "all .25s" }}>
              Saber más
            </Link>
          </div>
        </div>

        {/* Collage de obras */}
        <div data-rv data-d="2" style={{ flexShrink: 0, width: 300, position: "relative", height: 400 }}>
          {obras.slice(0, 3).map((obra, i) => {
            const configs = [
              { top: 0,    left: 0,  width: 162, height: 210, rotate: -2.5 },
              { top: 30,   right: 0, width: 126, height: 156, rotate:  3.5 },
              { bottom: 0, left: 28, width: 144, height: 174, rotate:  1   },
            ] as const;
            const conf = configs[i];
            return (
              <div key={obra.id_obra} className="home-cta-obra" onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{ ...conf, transform: `rotate(${conf.rotate}deg)`, boxShadow: "0 10px 30px rgba(0,0,0,.13), 0 30px 70px rgba(0,0,0,.10)" }}>
                <img src={obra.imagen_principal} alt={obra.titulo} style={{ width: conf.width, height: conf.height }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80"; }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER
      ═══════════════════════════════════ */}
      <footer style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,.07)", padding: "60px 72px 40px", fontFamily: SANS }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 48, marginBottom: 52 }}>
          {/* Brand */}
          <div data-rv>
            <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 14 }}>
              ALTAR<span style={{ color: C.orange }}>★</span>
            </div>
            <p style={{ fontSize: 11, color: C.sub, lineHeight: 1.7, maxWidth: 220, marginBottom: 22 }}>Galería de arte digital de la Huasteca Hidalguense. Arte que nace de la tierra.</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["✦", "◈", "◉"].map(s => (
                <a key={s} href="#" className="home-footer-social">{s}</a>
              ))}
            </div>
          </div>

          {/* Galería */}
          <div data-rv data-d="1">
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.22)", marginBottom: 18 }}>Galería</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/catalogo"      className="home-footer-link">Colección</Link>
              <Link to="/catalogo"      className="home-footer-link">Exposición destacada</Link>
              <Link to="/catalogo"      className="home-footer-link">Categorías</Link>
              <Link to="/blog"          className="home-footer-link">Blog</Link>
            </div>
          </div>

          {/* Artistas */}
          <div data-rv data-d="2">
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.22)", marginBottom: 18 }}>Artistas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/artistas"  className="home-footer-link">Directorio</Link>
              <Link to="/register"  className="home-footer-link">Solicitar ingreso</Link>
              <Link to="/artista/dashboard" className="home-footer-link">Panel de artista</Link>
            </div>
          </div>

          {/* Plataforma */}
          <div data-rv data-d="3">
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(0,0,0,.22)", marginBottom: 18 }}>Plataforma</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/sobre-nosotros" className="home-footer-link">Acerca de ALTAR</Link>
              <Link to="/contacto"       className="home-footer-link">Contacto</Link>
            </div>
          </div>
        </div>

        <div data-rv style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid rgba(0,0,0,.05)" }}>
          <span style={{ fontSize: 10, color: "rgba(0,0,0,.22)", letterSpacing: ".04em" }}>© 2025 ALTAR — Todos los derechos reservados</span>
          <span style={{ fontFamily: SERIF, fontSize: 10, fontStyle: "italic", color: "rgba(0,0,0,.16)" }}>Huasteca Hidalguense, México</span>
        </div>
      </footer>

    </div>
  );
}
