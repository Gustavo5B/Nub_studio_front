// src/pages/public/Catalogo.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, X, Image as ImageIcon, Eye, ArrowRight, ShoppingCart } from "lucide-react";
import { authService } from "../../services/authService";
import { prefetchObra } from "../../utils/apiCache";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── misma paleta que Home ────────────────────────────────────────────────────
const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  ink:    "#14121E",
  sub:    "#9896A8",
  dark:   "#0D0B14",
  green:  "#0E8A50",
};

const SERIF      = "'SolveraLorvane', serif";
const SANS       = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";

interface Obra {
  id_obra: number; titulo: string; slug: string;
  imagen_principal: string; precio_base: number; precio_minimo: number;
  categoria_nombre: string; artista_nombre: string; artista_alias: string;
  anio_creacion: number; vistas: number; estado: string;
}
interface Categoria { id_categoria: number; nombre: string; slug: string; }
interface Coleccion {
  id_coleccion: number; nombre: string; slug: string;
  historia: string; imagen_portada: string;
  destacada: boolean; artista_alias: string; artista_foto: string;
  total_obras: number;
}

const CAT_IMAGES: Record<string, string> = {
  pintura:    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=80",
  artesania:  "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300&q=80",
  fotografia: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&q=80",
  escultura:  "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=300&q=80",
};

const ORDENAR = [
  { val: "recientes",   label: "Más recientes"         },
  { val: "antiguos",    label: "Más antiguos"           },
  { val: "nombre",      label: "A → Z"                 },
  { val: "precio_asc",  label: "Precio ↑"              },
  { val: "precio_desc", label: "Precio ↓"              },
];

// ─── idéntico al de Home ──────────────────────────────────────────────────────
function useReveal(threshold = 0.10) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const targets = container.querySelectorAll<HTMLElement>(
      "[data-rv],[data-clip],[data-clip-h],[data-num]"
    );
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add("rv-in");
        if (el.dataset.num) {
          const raw    = el.dataset.num;
          const suffix = raw.replace(/[\d.]/g, "");
          const target = Number.parseFloat(raw);
          const dur = 1200; const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = raw;
          };
          requestAnimationFrame(tick);
        }
        io.unobserve(el);
      });
    }, { threshold });
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

// ─── Panel lateral ────────────────────────────────────────────────────────────
function DetallePanel({
  obra, onClose, navigate,
}: {
  readonly obra: Obra | null;
  readonly onClose: () => void;
  readonly navigate: ReturnType<typeof useNavigate>;
}) {
  if (!obra) return null;
  const precio = obra.precio_minimo || obra.precio_base;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(13,11,20,.45)",
        zIndex: 999, backdropFilter: "blur(3px)",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "#fff", zIndex: 1000,
        display: "flex", flexDirection: "column", overflowY: "auto",
        borderLeft: "1px solid rgba(0,0,0,.06)",
      }}>
        {/* Imagen */}
        <div style={{ height: 320, position: "relative", flexShrink: 0, background: "#f7f5f2" }}>
          {obra.imagen_principal && (
            <img src={obra.imagen_principal} alt={obra.titulo} style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "saturate(.82) brightness(.94)",
            }} />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(255,255,255,.97) 100%)",
          }} />
          {/* Accent top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${C.orange}, ${C.pink})`,
          }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,.08)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, color: C.ink, fontFamily: SANS,
          }}>×</button>
        </div>

        {/* Info */}
        <div style={{ padding: "28px 32px 48px", flex: 1 }}>
          {/* Categoría */}
          <div style={{
            fontSize: 8, fontWeight: 800, letterSpacing: ".28em", textTransform: "uppercase",
            color: "rgba(0,0,0,.25)", fontFamily: SANS, marginBottom: 10,
          }}>
            {obra.categoria_nombre}
          </div>

          {/* Título */}
          <h2 style={{
            fontFamily: SERIF, fontSize: 28, fontWeight: 900, color: C.ink,
            margin: "0 0 6px", letterSpacing: "-.025em", lineHeight: 1.1,
          }}>
            {obra.titulo}
          </h2>

          {/* Artista */}
          <div style={{ fontSize: 12.5, color: C.sub, fontFamily: SANS, marginBottom: 28 }}>
            por{" "}
            <span style={{ color: C.orange, fontWeight: 700 }}>
              {obra.artista_alias || obra.artista_nombre}
            </span>
            {obra.anio_creacion && (
              <span style={{ color: "rgba(0,0,0,.20)" }}> · {obra.anio_creacion}</span>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(0,0,0,.05)", marginBottom: 24 }} />

          {/* Precio */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase",
              color: "rgba(0,0,0,.22)", fontFamily: SANS, marginBottom: 6,
            }}>Precio base</div>
            <div style={{
              fontFamily: SERIF, fontSize: 32, fontWeight: 900, color: C.ink,
              letterSpacing: "-.025em", lineHeight: 1,
            }}>
              <span style={{ color: C.orange }}>$</span>
              {Number(precio || 0).toLocaleString("es-MX")}
              <span style={{ fontSize: 12, fontWeight: 400, color: C.sub, fontFamily: SANS, marginLeft: 6 }}>MXN</span>
            </div>
          </div>

          {/* Estado */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 8, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase",
            color: obra.estado === "publicada" ? C.green : C.orange,
            fontFamily: SANS, marginBottom: 32,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: obra.estado === "publicada" ? C.green : C.orange,
            }} />
            {obra.estado === "publicada" ? "Disponible" : "No disponible"}
          </div>

          {obra.vistas > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: "rgba(0,0,0,.28)", fontFamily: SANS, marginBottom: 32,
            }}>
              <Eye size={12} strokeWidth={1.8} /> {obra.vistas.toLocaleString()} visualizaciones
            </div>
          )}

          {/* CTA */}
          <button onClick={() => navigate(`/obras/${obra.slug}`)} style={{
            width: "100%", padding: "14px",
            border: "1px solid rgba(0,0,0,.12)", borderRadius: 2,
            background: "transparent",
            color: C.ink, fontSize: 9, fontWeight: 700,
            letterSpacing: ".22em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all .25s",
          }}>
            Ver obra completa <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [obras,       setObras]       = useState<Obra[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  const [search,    setSearch]    = useState(searchParams.get("q") || "");
  const [catActiva, setCatActiva] = useState<number | null>(
    searchParams.get("categoria") ? Number(searchParams.get("categoria")) : null
  );
  const [ordenar, setOrdenar] = useState(searchParams.get("ordenar") || "recientes");
  const [page,    setPage]    = useState(Number(searchParams.get("page")) || 1);
  const [searchOpen, setSearchOpen] = useState(false);

  const isLoggedIn = authService.isAuthenticated();
  const userRol    = localStorage.getItem("userRol") || "";
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || userRol !== "cliente") return;
    const token = authService.getToken();
    fetch(`${API_URL}/api/carrito`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCartCount(d.data.length); })
      .catch(() => {});
  }, [isLoggedIn, userRol]);
  const [hovCat, setHovCat] = useState<number | null>(null);

  const [doorOpen, setDoorOpen] = useState(false);
  const [doorGone, setDoorGone] = useState(false);

  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pageRef = useReveal(0.10);

  // ─── Door (idéntico al Home) ─────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setDoorOpen(true), 1400);
    const t2 = setTimeout(() => setDoorGone(true), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ─── Cursor (idéntico al Home) ────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top  = `${my}px`;
      }
      cancelAnimationFrame(rafId);
      const animate = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        if (ringRef.current) {
          ringRef.current.style.left = `${rx}px`;
          ringRef.current.style.top  = `${ry}px`;
        }
        rafId = requestAnimationFrame(animate);
      };
      animate();
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
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
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(j => setCategorias(j.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/colecciones?limit=20`)
      .then(r => r.json())
      .then(j => setColecciones(j.data || []))
      .catch(() => {});
  }, []);

  const cargarObras = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim().length >= 2) {
        const res  = await fetch(`${API_URL}/api/obras/buscar?q=${encodeURIComponent(search)}&page=${page}&limit=12`);
        const json = await res.json();
        setObras(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      } else {
        const params = new URLSearchParams({ page: String(page), limit: "12", ordenar });
        if (catActiva) params.set("categoria", String(catActiva));
        const res  = await fetch(`${API_URL}/api/obras?${params}`);
        const json = await res.json();
        setObras(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch { setObras([]); }
    finally { setLoading(false); }
  }, [search, catActiva, ordenar, page]);

  useEffect(() => { cargarObras(); }, [cargarObras]);

  const handleCat    = (id: number | null) => { setCatActiva(id); setPage(1); };
  const handleSearch = (val: string)       => { setSearch(val);   setPage(1); };
  const handleOrden  = (val: string)       => { setOrdenar(val);  setPage(1); };

  const catNombre = catActiva ? categorias.find(c => c.id_categoria === catActiva)?.nombre : null;
  const titleLetters = "CATÁLOGO".split("");

  return (
    <div ref={pageRef} style={{ fontFamily: SANS, overflowX: "hidden", background: "#fff", minHeight: "100vh" }}>

      {/* ─── Cursor (igual que Home) ──────────────────────────────────────── */}
      <div ref={dotRef}  className="home-cursor-dot"  />
      <div ref={ringRef} className="home-cursor-ring" />

      {/* ─── Grain (igual que Home) ───────────────────────────────────────── */}
      <div className="home-grain" />

      {/* ─── Door (idéntico al Home) ─────────────────────────────────────── */}
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');

        @font-face {
          font-family: 'SolveraLorvane';
          src: url('/fonts/SolveraLorvane.ttf') format('truetype');
          font-weight: 400 900; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: 'Nexa-Heavy';
          src: url('/fonts/Nexa-Heavy.ttf') format('truetype');
          font-weight: 900; font-style: normal; font-display: swap;
        }

        /* ── Grain ── */
        .home-grain {
          position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: .026;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px; mix-blend-mode: multiply;
        }

        /* ── Cursor ── */
        .home-cursor-dot {
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          background: #14121E; pointer-events: none; z-index: 99999;
          transform: translate(-50%,-50%);
          transition: width .22s, height .22s, background .22s;
        }
        .home-cursor-ring {
          position: fixed; width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(20,18,30,.22); pointer-events: none; z-index: 99998;
          transform: translate(-50%,-50%);
          transition: width .3s, height .3s, border-color .25s;
        }
        .home-cursor-dot.cur-over  { width: 4px; height: 4px; background: #E8640C; }
        .home-cursor-ring.cur-over { width: 52px; height: 52px; border-color: #E8640C; }
        .home-cursor-dot.cur-dark  { background: rgba(255,255,255,.85); }
        .home-cursor-ring.cur-dark { border-color: rgba(255,255,255,.35); }

        /* ── Door (idéntico al Home) ── */
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
          position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
          z-index: 99991; font-family: 'SolveraLorvane', serif;
          font-size: clamp(64px,10vw,130px); font-weight: 900; color: #fff;
          letter-spacing: -.03em; pointer-events: none;
          transition: opacity .35s ease .8s;
        }
        .home-door-logo.open { opacity: 0; }
        .home-door-sub {
          position: fixed; top: calc(50% + clamp(48px,8vw,104px)); left: 50%;
          transform: translateX(-50%); z-index: 99991;
          font-size: 9px; font-weight: 700; letter-spacing: .44em;
          text-transform: uppercase; color: rgba(255,255,255,.35);
          pointer-events: none; transition: opacity .3s ease .7s;
        }
        .home-door-sub.open { opacity: 0; }
        .home-door-line {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
          z-index: 99991; width: 1px; height: 60px; background: #E8640C;
          pointer-events: none; transition: opacity .25s ease .75s;
        }
        .home-door-line.open { opacity: 0; }

        /* ── Hero corners ── */
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

        /* ── Keyframes (mismos que Home) ── */
        @keyframes barIn   { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        @keyframes fadeL   { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeR   { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeI   { from{opacity:0} to{opacity:1} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* ── Altar letters (mismo que Home) ── */
        .altar-letter {
          display: inline-block; opacity: 0;
          transform: translateY(60px) skewY(4deg);
          animation: letterUp 1.1s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes letterUp { to{opacity:1;transform:translateY(0) skewY(0)} }

        /* ── Scroll reveal (mismo que Home) ── */
        [data-rv]     { opacity:0; transform:translateY(26px); transition:opacity .9s ease, transform .9s ease; }
        [data-clip]   { clip-path:inset(100% 0 0 0); transition:clip-path 1.3s cubic-bezier(.16,1,.3,1); }
        [data-clip-h] { clip-path:inset(0 100% 0 0); transition:clip-path 1.5s cubic-bezier(.16,1,.3,1); }
        [data-rv].rv-in   { opacity:1; transform:translateY(0); }
        [data-clip].rv-in { clip-path:inset(0% 0 0 0); }
        [data-clip-h].rv-in { clip-path:inset(0 0% 0 0); }
        [data-rv][data-d="1"]{transition-delay:.06s}
        [data-rv][data-d="2"]{transition-delay:.14s}
        [data-rv][data-d="3"]{transition-delay:.22s}
        [data-rv][data-d="4"]{transition-delay:.30s}
        [data-rv][data-d="5"]{transition-delay:.38s}
        [data-clip][data-d="1"]{transition-delay:.05s}
        [data-clip][data-d="2"]{transition-delay:.20s}
        [data-clip][data-d="3"]{transition-delay:.35s}

        /* ── Expo frame (igual que Home) ── */
        .cat-expo-frame {
          position: relative; border-radius: 2px; overflow: hidden;
          transform: perspective(1200px) rotateX(1.5deg) rotateY(1.8deg);
          transition: transform 1s cubic-bezier(.16,1,.3,1), box-shadow 1s;
          box-shadow: 0 0 0 1px rgba(255,255,255,.06), -4px 8px 24px rgba(0,0,0,.50),
            4px 20px 56px rgba(0,0,0,.55), 0 40px 90px rgba(0,0,0,.60);
        }
        .cat-expo-frame-wrap:hover .cat-expo-frame {
          transform: perspective(1200px) rotateX(0) rotateY(0) translateY(-8px);
        }
        .cat-expo-frame img { filter: saturate(.75) contrast(1.05) brightness(.95); transition: filter .8s; }
        .cat-expo-frame-wrap:hover .cat-expo-frame img { filter: saturate(.92) contrast(1.06) brightness(1.0); }

        /* ── Categorías (igual que Home) ── */
        .home-cat-item { transition: padding-left .4s cubic-bezier(.16,1,.3,1); }
        .home-cat-item:hover { padding-left: 10px; }
        .home-cat-name  { transition: color .28s, letter-spacing .4s cubic-bezier(.16,1,.3,1); }
        .home-cat-item:hover .home-cat-name { color: #E8640C !important; letter-spacing: .005em !important; }
        .home-cat-count { transition: color .25s; }
        .home-cat-item:hover .home-cat-count { color: #E8640C !important; }
        .home-cat-arrow { transition: transform .32s, color .25s; }
        .home-cat-item:hover .home-cat-arrow { transform: translateX(8px); color: #E8640C !important; }

        /* ── Grid editorial (estilo galería) ── */
        .cat-obras-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px 24px;
          padding: 0 72px 100px;
        }
        .cat-obra-card { cursor: pointer; position: relative; }
        .cat-obra-card-img {
          overflow: hidden; aspect-ratio: 3/4;
          position: relative; background: #ece9e4;
        }
        .cat-obra-card-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          filter: saturate(0.78);
          transition: transform 0.65s cubic-bezier(0.2,0,0,1), filter 0.5s;
        }
        .cat-obra-card:hover .cat-obra-card-img img {
          transform: scale(1.05); filter: saturate(0.94);
        }
        .cat-obra-card-info { padding: 14px 0 0; }
        .cat-obra-card-desc {
          font-size: 11.5px; color: rgba(0,0,0,.45); font-family: 'Outfit', sans-serif;
          line-height: 1.45; margin-bottom: 10px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cat-obra-card-link {
          display: flex; align-items: center; gap: 10px;
          font-size: 8px; font-weight: 700; letter-spacing: .24em;
          text-transform: uppercase; color: rgba(0,0,0,.25);
          font-family: 'Outfit', sans-serif; transition: color .25s;
        }
        .cat-obra-card-link-line {
          display: block; width: 20px; height: 1px;
          background: currentColor; flex-shrink: 0; transition: width .28s;
        }
        .cat-obra-card:hover .cat-obra-card-link { color: #E8640C; }
        .cat-obra-card:hover .cat-obra-card-link-line { width: 34px; }

        /* ── Featured obra ── */
        .cat-featured-img {
          overflow: hidden; aspect-ratio: 4/5;
          position: relative; background: #ece9e4;
        }
        .cat-featured-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          filter: saturate(0.82) brightness(0.95);
          transition: transform .9s cubic-bezier(0.2,0,0,1), filter .6s;
        }
        .cat-featured-wrap:hover .cat-featured-img img {
          transform: scale(1.04); filter: saturate(0.94) brightness(0.98);
        }
        .cat-featured-cta {
          display: inline-flex; align-items: center; gap: 12px;
          font-size: 9px; font-weight: 700; letter-spacing: .22em;
          text-transform: uppercase; color: #14121E;
          background: none; border: 1px solid rgba(0,0,0,.14);
          padding: 11px 24px; cursor: pointer; font-family: 'Outfit', sans-serif;
          transition: all .25s;
        }
        .cat-featured-cta:hover { background: #14121E; color: #fff; border-color: #14121E; }
        .cat-featured-cta-line {
          display: block; width: 18px; height: 1px;
          background: currentColor; flex-shrink: 0; transition: width .28s;
        }
        .cat-featured-cta:hover .cat-featured-cta-line { width: 28px; }

        /* ── Categorías (texto minimal) ── */
        .cat-filter-btn {
          padding: 10px 0; border: none; background: none;
          font-family: 'Outfit', sans-serif; font-size: 9px; font-weight: 700;
          letter-spacing: .24em; text-transform: uppercase;
          cursor: pointer; transition: color .22s;
          border-bottom: 1.5px solid transparent;
          white-space: nowrap;
        }
        .cat-filter-btn.active {
          color: #E8640C;
          border-bottom-color: #E8640C;
        }
        .cat-filter-btn:not(.active) { color: rgba(0,0,0,.30); }
        .cat-filter-btn:not(.active):hover { color: #14121E; }

        /* ── Marquee ── */
        .cat-marquee-track { display: inline-flex; animation: marquee 28s linear infinite; }
        .cat-marquee-wrap:hover .cat-marquee-track { animation-play-state: paused; }

        /* ── Nav links (igual que Home) ── */
        .home-nav-link { display: flex; align-items: center; gap: 9px; font-size: 9.5px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #9896A8; text-decoration: none; transition: color .25s; }
        .home-nav-link::before { content: ''; display: block; width: 12px; height: 1px; background: currentColor; flex-shrink: 0; transition: width .28s; }
        .home-nav-link:hover { color: #14121E; }
        .home-nav-link:hover::before { width: 22px; }

        /* ── Loading skeleton ── */
        @keyframes shimmer { 0%,100%{opacity:.25} 50%{opacity:.50} }
        .cat-skeleton { animation: shimmer 1.5s ease-in-out infinite; }

        /* ── Scrollbar global ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.10); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.20); }

        input::placeholder { color: rgba(0,0,0,.25); }

        @media (max-width: 768px) {
          .scroll-horizontal { padding: 24px 24px 40px; gap: 28px; }
          .cat-filter-row { overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
          .cat-filter-row::-webkit-scrollbar { display: none; }
          .cat-filter-btn { flex-shrink: 0; }
        }
      `}</style>

      {/* ═══ I · HERO ═══ */}
      <section style={{
        position: "relative",
        height: "85vh", minHeight: 560,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#fff", overflow: "hidden",
      }}>
        {/* Barra superior (idéntica a Home) */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${C.orange} 25%, ${C.pink} 75%, transparent)`,
          animation: "barIn 2s cubic-bezier(.16,1,.3,1) both",
        }} />

        {/* Nav izquierda — idéntica a Home */}
        <nav style={{
          position: "absolute", top: 30, left: 52,
          display: "flex", flexDirection: "column", gap: 10,
          animation: "fadeL 1.1s ease .4s both",
        }}>
          <Link to="/catalogo"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Galería</Link>
          <Link to="/artistas"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Artistas</Link>
          <Link to="/blog"           className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Blog</Link>
          <Link to="/sobre-nosotros" className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Sobre nosotros</Link>
          <Link to="/contacto"       className="home-nav-link" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>Contacto</Link>
        </nav>

        {/* Auth derecha — idéntica a Home */}
        <div style={{
          position: "absolute", top: 30, right: 52,
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeR 1.1s ease .4s both",
        }}>
          {!isLoggedIn ? (
            <>
              <Link to="/login" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{
                fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: C.sub, textDecoration: "none",
                padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)",
                transition: "all .22s",
              }}>Ingresar</Link>
              <Link to="/register" onMouseEnter={cursorOn} onMouseLeave={cursorOff} style={{
                fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "#fff", textDecoration: "none",
                padding: "7px 16px", borderRadius: 100, background: C.orange,
                boxShadow: "0 4px 16px rgba(232,100,12,.30)", transition: "all .22s",
              }}>Ser artista</Link>
            </>
          ) : (
            <>
              <Link
                to={userRol === "admin" ? "/admin" : userRol === "artista" ? "/artista/dashboard" : "/mi-cuenta"}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{
                  fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em",
                  textTransform: "uppercase", color: C.sub, textDecoration: "none",
                  padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)",
                }}
              >Mi cuenta</Link>

              {userRol === "cliente" && (
                <Link
                  to="/mi-cuenta/carrito"
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(0,0,0,.10)", textDecoration: "none", color: C.ink, transition: "all .22s" }}
                >
                  <ShoppingCart size={14} strokeWidth={2} />
                  {cartCount > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.orange, color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          )}
        </div>

        {/* Corner decorators */}
        <div className="hero-corner tl" />
        <div className="hero-corner tr" />
        <div className="hero-corner bl" />
        <div className="hero-corner br" />

        {/* Watermark */}
        <div style={{
          position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)",
          fontFamily: SERIF, fontStyle: "italic",
          fontSize: "clamp(60px, 10vw, 130px)", fontWeight: 900,
          color: "rgba(0,0,0,.018)", whiteSpace: "nowrap", letterSpacing: "-.02em",
          userSelect: "none", pointerEvents: "none",
          animation: "fadeI 2s ease 2s both",
        }}>
          colección
        </div>

        {/* Contenido central */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

          {/* Título con animación letra por letra */}
          <h1 style={{
            fontFamily: SERIF,
            fontSize: "clamp(76px, 12vw, 160px)",
            fontWeight: 900, color: C.ink,
            letterSpacing: "-.03em", lineHeight: .9,
            display: "flex", userSelect: "none", margin: 0,
          }}>
            {titleLetters.map((l, i) => (
              <span
                key={i}
                className="altar-letter"
                style={{ animationDelay: `${0.18 + i * 0.07}s` }}
              >
                {l}
              </span>
            ))}
          </h1>

          {/* Separador + dot */}
          <div style={{
            display: "flex", alignItems: "center", gap: 18,
            margin: "22px 0 18px",
            animation: "fadeI 1s ease .8s both",
          }}>
            <div style={{ width: 52, height: 1, background: "rgba(0,0,0,.08)" }} />
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: C.orange,
            }} />
            <div style={{ width: 52, height: 1, background: "rgba(0,0,0,.08)" }} />
          </div>

          {/* Subtítulo */}
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: ".44em",
            textTransform: "uppercase", color: C.sub,
            fontFamily: SANS, margin: "0 0 36px",
            animation: "fadeI 1s ease 1s both",
          }}>
            Arte Huasteca
          </p>

          {/* Buscador minimal */}
          <div style={{ animation: "fadeI .9s ease 1.2s both" }}>
            {searchOpen ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid rgba(0,0,0,.14)", borderRadius: 2,
                padding: "10px 16px", background: "#fff", minWidth: 320,
              }}>
                <Search size={13} color="rgba(0,0,0,.35)" strokeWidth={1.8} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Buscar obra, artista..."
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    color: C.ink, fontSize: 12, flex: 1, fontFamily: SANS,
                  }}
                />
                <button onClick={() => { handleSearch(""); setSearchOpen(false); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,.30)", display: "flex" }}>
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  fontSize: 9, fontWeight: 700, letterSpacing: ".22em",
                  textTransform: "uppercase", color: C.sub,
                  background: "none", border: "1px solid rgba(0,0,0,.10)",
                  borderRadius: 2, padding: "10px 22px", cursor: "pointer",
                  fontFamily: SANS, transition: "all .22s",
                }}>
                <Search size={11} strokeWidth={2} />
                Buscar obra
              </button>
            )}
          </div>
        </div>

        {/* Stats bottom */}
        <div style={{
          position: "absolute", bottom: 32, left: 52,
          fontFamily: SERIF, fontSize: 10.5, fontStyle: "italic",
          color: "rgba(0,0,0,.14)", letterSpacing: ".05em",
          display: "flex", alignItems: "center", gap: 10,
          animation: "fadeI 1.5s ease 1.4s both",
        }}>
          <span style={{ display: "block", width: 22, height: 1, background: "rgba(0,0,0,.08)" }} />
          {total > 0 ? `${total} · obras` : "galería"}
        </div>
        <div style={{
          position: "absolute", bottom: 32, right: 52,
          fontFamily: SERIF, fontSize: 10.5, fontStyle: "italic",
          color: "rgba(0,0,0,.14)", letterSpacing: ".05em",
          display: "flex", alignItems: "center", gap: 10, flexDirection: "row-reverse",
          animation: "fadeI 1.5s ease 1.4s both",
        }}>
          <span style={{ display: "block", width: 22, height: 1, background: "rgba(0,0,0,.08)" }} />
          Huasteca
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: "fadeI 1s ease 1.8s both",
        }}>
          <div style={{
            fontSize: 7.5, fontWeight: 700, letterSpacing: ".32em",
            textTransform: "uppercase", color: "rgba(0,0,0,.14)", fontFamily: SANS,
          }}>Explorar</div>
          <div style={{
            width: 1, height: 32,
            background: "linear-gradient(to bottom, rgba(0,0,0,.12), transparent)",
          }} />
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="cat-marquee-wrap" style={{
        borderTop: "1px solid rgba(0,0,0,.05)",
        borderBottom: "1px solid rgba(0,0,0,.05)",
        padding: "14px 0", overflow: "hidden", whiteSpace: "nowrap",
        background: "#fafafa",
      }}>
        <div className="cat-marquee-track">
          {["Pintura", "Fotografía", "Cerámica", "Escultura", "Artesanía",
            "Pintura", "Fotografía", "Cerámica", "Escultura", "Artesanía"].map((item, i) => (
            <div key={i} style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: ".3em",
              textTransform: "uppercase", color: "rgba(0,0,0,.18)",
              padding: "0 28px", display: "inline-flex", alignItems: "center", gap: 28,
              fontFamily: SANS,
            }}>
              {item}<span style={{ fontSize: 7, color: C.orange, opacity: .7 }}>★</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ II · COLECCIÓN DESTACADA ═══ */}
      {colecciones.length > 0 && (() => {
        const col = colecciones.find(c => c.destacada) || colecciones[0];
        return (
          <section className="cat-expo" style={{
            background: C.dark,
            display: "grid", gridTemplateColumns: "1fr 1fr",
            minHeight: "80vh", position: "relative", overflow: "hidden",
            borderTop: "1px solid rgba(255,255,255,.04)",
          }}
            onMouseEnter={() => { dotRef.current?.classList.add("cur-dark"); ringRef.current?.classList.add("cur-dark"); }}
            onMouseLeave={() => { dotRef.current?.classList.remove("cur-dark"); ringRef.current?.classList.remove("cur-dark"); }}
          >
            {/* grain */}
            <div style={{
              position: "absolute", inset: 0,
              background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px", opacity: .04, pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: -20, left: 40,
              fontFamily: SERIF, fontSize: 280, fontWeight: 900, fontStyle: "italic",
              color: "rgba(255,255,255,.025)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
            }}>II</div>

            {/* Izquierda — texto */}
            <div style={{
              padding: "80px 64px", display: "flex", flexDirection: "column",
              justifyContent: "center", position: "relative", zIndex: 1,
              borderRight: "1px solid rgba(255,255,255,.05)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                fontSize: 8, fontWeight: 800, letterSpacing: ".35em",
                textTransform: "uppercase", color: C.orange, marginBottom: 40, fontFamily: SANS,
                animation: "fadeL .9s ease .2s both",
              }}>
                <span style={{ display: "block", width: 32, height: 1, background: C.orange }} />
                Colección destacada
              </div>

              <h2 style={{
                fontFamily: SERIF, fontSize: "clamp(32px, 4.5vw, 68px)",
                fontWeight: 900, color: "#fff", letterSpacing: "-.03em", lineHeight: 1.0, margin: "0 0 20px",
                animation: "fadeL 1s ease .35s both",
              }}>
                <span style={{
                  display: "block", fontStyle: "italic", fontWeight: 400,
                  fontSize: ".5em", color: "rgba(255,255,255,.38)", marginBottom: 10,
                }}>por {col.artista_alias}</span>
                {col.nombre}
              </h2>

              {col.historia && (
                <p style={{
                  fontSize: 13, color: "rgba(255,255,255,.38)", lineHeight: 1.8,
                  maxWidth: 380, marginBottom: 36, fontFamily: SANS,
                  animation: "fadeL 1s ease .5s both",
                }}>
                  {col.historia.length > 180 ? col.historia.slice(0, 180) + "…" : col.historia}
                </p>
              )}

              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 8, fontWeight: 700, letterSpacing: ".22em",
                textTransform: "uppercase", color: "rgba(255,255,255,.30)",
                fontFamily: SANS, marginBottom: 44,
                animation: "fadeL 1s ease .65s both",
              }}>
                <span style={{ width: 24, height: 1, background: "rgba(255,255,255,.20)", display: "block" }} />
                {col.total_obras} obras en esta colección
              </div>

              <button
                onClick={() => navigate(`/colecciones/${col.slug}`)}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  fontSize: 9, fontWeight: 700, letterSpacing: ".22em",
                  textTransform: "uppercase", color: "#fff",
                  background: "transparent", border: "1px solid rgba(255,255,255,.18)",
                  borderRadius: 100, padding: "11px 22px", cursor: "pointer",
                  fontFamily: SANS, transition: "all .28s", alignSelf: "flex-start",
                  animation: "fadeL 1s ease .8s both",
                }}
              >
                Ver colección completa →
              </button>
            </div>

            {/* Derecha — imagen portada */}
            <div style={{
              position: "relative", display: "flex", alignItems: "center",
              justifyContent: "center", padding: "60px 64px", zIndex: 1, overflow: "hidden",
            }}>
              {col.imagen_portada ? (
                <div className="cat-expo-frame-wrap" onMouseEnter={cursorOn} onMouseLeave={cursorOff}>
                  <div className="cat-expo-frame">
                    <img
                      src={col.imagen_portada}
                      alt={col.nombre}
                      style={{ display: "block", width: 300, maxWidth: "100%", height: "auto" }}
                    />
                  </div>
                  <div style={{
                    height: 18,
                    background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,0,0,.55) 0%, transparent 70%)",
                    filter: "blur(6px)", transform: "scaleY(.35)",
                  }} />
                  <div style={{ marginTop: 14, paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,.10)" }}>
                    <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,.45)" }}>
                      {col.nombre}
                    </div>
                    <div style={{
                      fontSize: 7, fontWeight: 600, letterSpacing: ".18em",
                      textTransform: "uppercase", color: "rgba(255,255,255,.22)", marginTop: 3, fontFamily: SANS,
                    }}>
                      {col.artista_alias} · {col.total_obras} obras
                    </div>
                  </div>
                </div>
              ) : (
                <div className="cat-skeleton" style={{ width: 300, aspectRatio: "4/5", background: "rgba(255,255,255,.06)" }} />
              )}
            </div>
          </section>
        );
      })()}

      {/* ═══ III · COLECCIONES ═══ */}
      {colecciones.length > 0 && (
        <section style={{ padding: "0 72px 120px", borderTop: "1px solid rgba(0,0,0,.05)" }}>
          <div style={{ padding: "80px 0 60px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 8.5, fontWeight: 800, letterSpacing: ".3em",
                textTransform: "uppercase", color: "rgba(0,0,0,.18)",
                marginBottom: 14, fontFamily: SANS,
              }}>III · Colecciones</div>
              <div style={{
                fontFamily: NEXA_HEAVY, fontSize: "clamp(26px, 3vw, 38px)",
                fontWeight: 900, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1,
              }}>Explora por<br />colección</div>
            </div>
            <div style={{
              fontSize: 12, color: C.sub, maxWidth: 270,
              lineHeight: 1.75, textAlign: "right", fontFamily: SANS,
            }}>
              Cada colección es una historia única. Descubre el universo de cada artista.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {colecciones.map((col, i) => (
              <div
                key={col.id_coleccion}
                className="home-cat-item"
                onClick={() => navigate(`/colecciones/${col.slug}`)}
                onMouseEnter={() => { setHovCat(i); cursorOn(); }}
                onMouseLeave={() => { setHovCat(null); cursorOff(); }}
                style={{
                  position: "relative", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "26px 0", cursor: "pointer", overflow: "hidden",
                  borderBottom: "1px solid rgba(0,0,0,.05)",
                  borderTop: i === 0 ? "1px solid rgba(0,0,0,.05)" : undefined,
                }}
              >
                {/* Thumbnail de portada en hover */}
                {col.imagen_portada && (
                  <div style={{
                    position: "absolute", right: 200, top: "50%",
                    width: 130, height: 96, borderRadius: 2, overflow: "hidden",
                    boxShadow: "0 8px 28px rgba(0,0,0,.18)", pointerEvents: "none",
                    opacity: hovCat === i ? 1 : 0,
                    transform: hovCat === i
                      ? "translateY(-50%) translateX(0) scale(1)"
                      : "translateY(-50%) translateX(14px) scale(.94)",
                    transition: "opacity .38s, transform .48s cubic-bezier(.16,1,.3,1)",
                  }}>
                    <img src={col.imagen_portada} alt={col.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.82)" }} />
                  </div>
                )}

                {/* Número + nombre */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 22, zIndex: 1 }}>
                  <span style={{
                    fontFamily: SERIF, fontSize: 11, fontStyle: "italic",
                    color: "rgba(0,0,0,.14)", minWidth: 22,
                  }}>0{i + 1}</span>
                  <span className="home-cat-name" style={{
                    fontFamily: NEXA_HEAVY, fontSize: "clamp(28px, 4vw, 50px)",
                    fontWeight: 900, color: C.ink, letterSpacing: "-.025em", lineHeight: 1,
                  }}>{col.nombre}</span>
                </div>

                {/* Count + artista + flecha */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
                  <span className="home-cat-count" style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: ".2em",
                    textTransform: "uppercase", color: "rgba(0,0,0,.18)", fontFamily: SANS,
                  }}>{col.total_obras} obras</span>
                  <span className="home-cat-arrow" style={{ fontSize: 18, color: "rgba(0,0,0,.10)" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

           {/* ═══ IV · OBRAS ═══ */}
      <section id="obras-section" style={{ padding: "60px 0 80px", borderTop: "1px solid rgba(0,0,0,.04)" }}>

        {/* Section header más compacto */}
        <div data-rv style={{
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 32, padding: "0 72px",
        }}>
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
          <div style={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: ".3em",
            textTransform: "uppercase", color: "rgba(0,0,0,.18)",
            whiteSpace: "nowrap", fontFamily: SANS,
          }}>IV · Obras</div>
          <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,.05)" }} />
        </div>

        {/* Título sección + filtros - más compacto */}
        <div style={{ padding: "0 72px", marginBottom: 28 }}>
          <div data-rv style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{
                fontFamily: NEXA_HEAVY, fontSize: "clamp(22px, 2.8vw, 34px)",
                fontWeight: 900, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1,
              }}>
                {loading ? "Cargando obras…" : (
                  catNombre
                    ? <><span style={{ color: C.orange }}>{catNombre}</span></>
                    : search
                    ? <>"{search}"</>
                    : <>Todas las obras</>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {(catActiva || search) && (
                <button onClick={() => { handleCat(null); handleSearch(""); setSearchOpen(false); }}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 8.5, fontWeight: 700, letterSpacing: ".18em",
                    textTransform: "uppercase", color: C.sub,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: SANS, transition: "color .2s",
                  }}>
                  <X size={11} strokeWidth={2} /> Limpiar
                </button>
              )}
              <select
                value={ordenar}
                onChange={e => handleOrden(e.target.value)}
                onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                style={{
                  background: "none", border: "none",
                  borderBottom: "1px solid rgba(0,0,0,.12)",
                  color: "rgba(0,0,0,.40)", fontSize: 9,
                  padding: "6px 22px 6px 0",
                  fontFamily: SANS, fontWeight: 700,
                  letterSpacing: ".14em", textTransform: "uppercase",
                  cursor: "pointer", outline: "none",
                  appearance: "none", WebkitAppearance: "none",
                }}>
                {ORDENAR.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{
            fontSize: 11, color: C.sub, fontFamily: SANS,
            marginTop: 6, fontStyle: "italic",
          }}>
            {!loading && <>{total} {total === 1 ? "obra" : "obras"} encontradas</>}
          </div>
        </div>

        {/* Filtros categorías — texto minimal */}
        <div data-rv data-d="1" className="cat-filter-row" style={{
          display: "flex", gap: 32, padding: "0 72px", marginBottom: 32,
          borderBottom: "1px solid rgba(0,0,0,.05)", paddingBottom: 16,
        }}>
          <button
            className={`cat-filter-btn${catActiva === null ? " active" : ""}`}
            onClick={() => handleCat(null)}
            onMouseEnter={cursorOn} onMouseLeave={cursorOff}
          >
            Todas
          </button>
          {categorias.map(c => (
            <button
              key={c.id_categoria}
              className={`cat-filter-btn${catActiva === c.id_categoria ? " active" : ""}`}
              onClick={() => handleCat(c.id_categoria)}
              onMouseEnter={cursorOn} onMouseLeave={cursorOff}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* ── Obras ── */}
        {loading ? (
          <div className="cat-obras-grid" style={{ paddingTop: 32 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="cat-skeleton" style={{
                aspectRatio: "3/4", background: "#ece9e4",
                opacity: 0.55 - (i % 4) * 0.06,
              }} />
            ))}
          </div>
        ) : obras.length === 0 ? (
          <div data-rv style={{ textAlign: "center", padding: "80px 72px", fontFamily: SANS }}>
            <div style={{
              fontFamily: SERIF, fontSize: 20, fontStyle: "italic",
              color: "rgba(0,0,0,.18)", marginBottom: 12,
            }}>Sin obras para mostrar</div>
            <div style={{ fontSize: 10.5, color: C.sub, letterSpacing: ".1em" }}>
              Intenta con otro término o categoría
            </div>
          </div>
        ) : (
          <>
            {/* ── Grid de obras SIN destacada separada ── */}
            <div className="cat-obras-grid" style={{ paddingTop: 32 }}>
              {obras.map(obra => {
                const precio = obra.precio_minimo || obra.precio_base;
                return (
                  <div
                    key={obra.id_obra}
                    className="cat-obra-card"
                    onClick={() => setSelectedObra(prev =>
                      prev?.id_obra === obra.id_obra ? null : obra
                    )}
                    onMouseEnter={() => { cursorOn(); prefetchObra(obra.slug || obra.id_obra); }}
                    onMouseLeave={cursorOff}
                  >
                    <div className="cat-obra-card-img">
                      {obra.imagen_principal ? (
                        <img src={obra.imagen_principal} alt={obra.titulo} />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%", background: "#ece9e4",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <ImageIcon size={28} strokeWidth={1} color="rgba(0,0,0,.12)" />
                        </div>
                      )}
                    </div>
                    <div className="cat-obra-card-info">
                      <div className="cat-obra-card-desc">{obra.titulo}</div>
                      <div className="cat-obra-card-link">
                        <span className="cat-obra-card-link-line" />
                        {obra.categoria_nombre || "Ver obra"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Paginación minimal */}
        {totalPages > 1 && !loading && (
          <div data-rv style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "0 72px", marginTop: 48,
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{
                width: 38, height: 38, border: "1px solid rgba(0,0,0,.10)",
                background: "none", cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.25 : 1, color: C.sub,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all .18s", borderRadius: 2,
              }}>
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  onMouseEnter={cursorOn} onMouseLeave={cursorOff}
                  style={{
                    width: 38, height: 38, borderRadius: 2,
                    border: `1px solid ${p === page ? C.orange : "rgba(0,0,0,.10)"}`,
                    background: p === page ? C.orange : "none",
                    color: p === page ? "white" : "rgba(0,0,0,.35)",
                    fontWeight: p === page ? 800 : 500,
                    fontSize: 11, cursor: "pointer", fontFamily: SANS,
                    letterSpacing: ".08em", transition: "all .18s",
                  }}>
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              onMouseEnter={cursorOn} onMouseLeave={cursorOff}
              style={{
                width: 38, height: 38, border: "1px solid rgba(0,0,0,.10)",
                background: "none", cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.25 : 1, color: C.sub,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all .18s", borderRadius: 2,
              }}>
              ›
            </button>
          </div>
        )}
      </section>
      {/* Panel detalle */}
      {selectedObra && (
        <DetallePanel
          obra={selectedObra}
          onClose={() => setSelectedObra(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
}
