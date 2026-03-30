// src/pages/public/Blog.tsx
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { BookOpen, Clock, ArrowRight, Star, Mail, Rss } from "lucide-react";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  magenta:  "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  cream:    "#14121E",
  creamSub: "#5A5870",
  creamMut: "#9896A8",
  bg:       "#F9F8FC",
  bgDeep:   "#FFFFFF",
  panel:    "#FFFFFF",
  border:   "#E6E4EF",
  borderBr: "rgba(0,0,0,0.05)",
};

const FD = "'Outfit', sans-serif";
const FB = "'Outfit', sans-serif";

interface Post {
  id:       number;
  cat:      string;
  catLabel: string;
  color:    string;
  titulo:   string;
  excerpt:  string;
  autor:    string;
  fecha:    string;
  lectura:  string;
  img:      string;
}

const CATS = [
  { key: "todos",    label: "Todos",     color: C.orange },
  { key: "arte",     label: "Arte",      color: C.pink   },
  { key: "cultura",  label: "Cultura",   color: C.gold   },
  { key: "tecnicas", label: "Técnicas",  color: C.blue   },
  { key: "artistas", label: "Artistas",  color: C.purple },
  { key: "eventos",  label: "Eventos",   color: C.green  },
];

const POSTS: Post[] = [
  {
    id: 1, cat: "arte", catLabel: "Arte", color: C.pink,
    titulo:  "El alma de la Huasteca en cada trazo",
    excerpt: "Descubre cómo los artistas de la región traducen siglos de historia en colores, formas y texturas que hablan al mundo entero.",
    autor: "Equipo NUB", fecha: "15 Mar 2025", lectura: "8 min",
    img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1400&q=80",
  },
  {
    id: 2, cat: "cultura", catLabel: "Cultura", color: C.gold,
    titulo:  "Los colores que nos definen",
    excerpt: "Una exploración visual de la paleta cromática Huasteca y su profundo significado cultural a través del tiempo.",
    autor: "María Sánchez", fecha: "10 Mar 2025", lectura: "5 min",
    img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=80",
  },
  {
    id: 3, cat: "tecnicas", catLabel: "Técnicas", color: C.blue,
    titulo:  "Tejidos que resisten el tiempo",
    excerpt: "Las técnicas ancestrales de bordado Huasteco que sobreviven de generación en generación.",
    autor: "Carlos Mendoza", fecha: "5 Mar 2025", lectura: "6 min",
    img: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=900&q=80",
  },
  {
    id: 4, cat: "artistas", catLabel: "Artistas", color: C.purple,
    titulo:  "Voces emergentes de la región",
    excerpt: "Nuevos talentos que están redefiniendo el arte contemporáneo desde la Huasteca Hidalguense.",
    autor: "Lucía Torres", fecha: "28 Feb 2025", lectura: "7 min",
    img: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&q=80",
  },
  {
    id: 5, cat: "arte", catLabel: "Arte", color: C.orange,
    titulo:  "La arcilla como lenguaje universal",
    excerpt: "Del barro al arte: la cerámica Huasteca como puente entre lo sagrado y lo cotidiano.",
    autor: "Ana García", fecha: "20 Feb 2025", lectura: "4 min",
    img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=900&q=80",
  },
  {
    id: 6, cat: "eventos", catLabel: "Eventos", color: C.green,
    titulo:  "Exposiciones que marcaron el año",
    excerpt: "Un recorrido por las exhibiciones más importantes que reunieron lo mejor del arte Huasteco.",
    autor: "Equipo NUB", fecha: "15 Feb 2025", lectura: "5 min",
    img: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=900&q=80",
  },
];

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, delay, onLeer }: { readonly post: Post; readonly delay: number; readonly onLeer: () => void }) {
  return (
    <article
      onClick={onLeer}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onLeer(); }}
      role="button"
      tabIndex={0}
      style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20,
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        transition: "all .25s", animation: `fadeUp .55s ease ${delay}s both`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform    = "translateY(-5px)";
        el.style.boxShadow    = "0 8px 24px rgba(0,0,0,0.10)";
        el.style.borderColor  = `${post.color}32`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform   = "translateY(0)";
        el.style.boxShadow   = "none";
        el.style.borderColor = C.border;
      }}
    >
      {/* Imagen */}
      <div style={{ height: 200, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        <img
          src={post.img} alt={post.titulo}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s ease" }}
          onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.07)"}
          onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.panel} 0%, transparent 55%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: post.color, fontFamily: FB,
            padding: "4px 11px", borderRadius: 100,
            background: `${post.color}22`, border: `1px solid ${post.color}44`,
            backdropFilter: "blur(8px)",
          }}>{post.catLabel}</span>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: "20px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 2, width: 32, background: `linear-gradient(90deg, ${post.color}, transparent)`, borderRadius: 1, marginBottom: 14 }} />
        <h3 style={{ fontSize: 17.5, fontWeight: 800, fontFamily: FD, color: C.cream, margin: "0 0 10px", lineHeight: 1.3 }}>
          {post.titulo}
        </h3>
        <p style={{ fontSize: 13.5, color: C.creamMut, lineHeight: 1.8, margin: "0 0 auto", fontFamily: FB }}>
          {post.excerpt}
        </p>
        <div style={{ height: 1, background: C.border, margin: "18px 0 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${post.color}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "white", fontFamily: FB }}>{post.autor[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>{post.autor}</div>
              <div style={{ fontSize: 11, color: C.creamMut, fontFamily: FB }}>{post.fecha}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.creamMut, fontFamily: FB }}>
            <Clock size={11} strokeWidth={1.8} /> {post.lectura}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Blog() {
  const [filtro, setFiltro] = useState("todos");
  const [email,  setEmail]  = useState("");
  const { showToast } = useToast();

  const postsFiltrados = filtro === "todos" ? POSTS : POSTS.filter(p => p.cat === filtro);
  const featured = postsFiltrados[0] ?? null;
  const rest      = postsFiltrados.slice(1);

  const handleLeer      = () => showToast("Este artículo estará disponible próximamente", "warn");
  const handleSubscribe = () => {
    if (!email.trim()) { showToast("Ingresa tu correo electrónico", "warn"); return; }
    showToast("¡Pronto recibirás nuestras historias en tu correo!", "ok");
    setEmail("");
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px)   rotate(0deg);  }
          50%       { transform: translateY(-22px) rotate(4deg);  }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px);               }
          50%       { transform: translateY(14px) rotate(-3deg); }
        }
        @keyframes gradShift {
          0%, 100% { background-position: 0%   50%; }
          50%       { background-position: 100% 50%; }
        }
        input::placeholder { color: #9896A8; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", background: C.bgDeep, padding: "72px 6vw 60px", overflow: "hidden" }}>

        {/* Orbes decorativos */}
        <div style={{ position: "absolute", top: 30,  left: "5%",  width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}18,   transparent 68%)`, animation: "float1 8s ease-in-out infinite",       pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 10,  right: "8%", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.blue}16,   transparent 68%)`, animation: "float2 10s ease-in-out infinite",      pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: "42%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}12, transparent 68%)`, animation: "float1 9s ease-in-out infinite 1s",  pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 55,  left: "58%", width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}26,   transparent 70%)`, animation: "float2 6s ease-in-out infinite .5s",  pointerEvents: "none" }} />

        {/* Texto fantasma de fondo */}
        <div style={{
          position: "absolute", bottom: -10, right: "1%",
          fontSize: "clamp(120px, 22vw, 260px)", fontWeight: 900, fontFamily: FD,
          color: "rgba(0,0,0,0.03)", lineHeight: 1, pointerEvents: "none",
          userSelect: "none", letterSpacing: "-0.04em",
        }}>
          BLOG
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px 5px 8px", borderRadius: 100,
          background: "rgba(0,0,0,0.02)", border: `1px solid ${C.borderBr}`,
          marginBottom: 22, animation: "fadeUp .4s ease both",
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Rss size={11} color="white" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.creamMut, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FB }}>
            NU★B Studio · Blog
          </span>
        </div>

        {/* Título */}
        <h1 style={{ fontSize: "clamp(44px, 9vw, 100px)", fontWeight: 900, fontFamily: FD, margin: "0 0 6px", lineHeight: 0.92, color: C.cream, letterSpacing: "-0.025em", animation: "fadeUp .45s ease .1s both" }}>
          Historias{" "}
          <span style={{
            background: `linear-gradient(90deg, ${C.pink}, ${C.orange}, ${C.gold}, ${C.blue}, ${C.purple})`,
            backgroundSize: "300% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradShift 6s ease infinite",
          }}>
            de Arte
          </span>
        </h1>
        <h1 style={{ fontSize: "clamp(44px, 9vw, 100px)", fontWeight: 900, fontFamily: FD, margin: "0 0 24px", lineHeight: 0.92, color: C.cream, letterSpacing: "-0.025em", animation: "fadeUp .45s ease .15s both" }}>
          y Cultura
        </h1>

        <p style={{ fontSize: "clamp(14px, 1.6vw, 17px)", color: C.creamMut, maxWidth: 500, lineHeight: 1.75, fontFamily: FB, margin: 0, animation: "fadeUp .45s ease .2s both" }}>
          Relatos, técnicas y voces del arte Huasteco. Una ventana a la creatividad que nace en la sierra y llega al mundo.
        </p>

        {/* Barra de color */}
        <div style={{ marginTop: 36, display: "flex", gap: 5, animation: "fadeUp .45s ease .28s both" }}>
          {([C.pink, C.orange, C.gold, C.green, C.blue, C.purple] as string[]).map((c, i) => (
            <div key={c} style={{ height: 4, width: i === 0 ? 52 : 14, borderRadius: 2, background: c, opacity: i === 0 ? 1 : 0.55 }} />
          ))}
        </div>
      </section>

      {/* ── FILTRO ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        padding: "0 6vw", position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
          {CATS.map(({ key, label, color }) => {
            const on = filtro === key;
            return (
              <button key={key} onClick={() => setFiltro(key)}
                style={{
                  padding: "7px 18px", borderRadius: 100, flexShrink: 0,
                  border: `1.5px solid ${on ? color : "#E6E4EF"}`,
                  background: on ? `${color}16` : "transparent",
                  color: on ? color : C.creamMut,
                  fontWeight: on ? 700 : 400,
                  fontSize: 13, cursor: "pointer", fontFamily: FB,
                  transition: "all .2s",
                  boxShadow: on ? `0 0 22px ${color}22` : "none",
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENIDO ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.bg, padding: "40px 6vw 80px" }}>
        {postsFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", fontFamily: FB }}>
            <BookOpen size={36} color={C.creamMut} style={{ marginBottom: 14, opacity: 0.3 }} />
            <div style={{ fontSize: 16, color: C.creamSub, marginBottom: 6 }}>Sin artículos en esta categoría</div>
            <div style={{ fontSize: 13, color: C.creamMut }}>Vuelve pronto, estamos trabajando en ello</div>
          </div>
        ) : (
          <>
            {/* Artículo destacado */}
            {featured && (
              <article
                onClick={handleLeer}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleLeer(); }}
                role="button"
                tabIndex={0}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  borderRadius: 24, overflow: "hidden",
                  background: C.panel, border: `1px solid ${featured.color}20`,
                  cursor: "pointer", marginBottom: 24,
                  transition: "all .25s", animation: "fadeUp .5s ease both",
                  position: "relative",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform  = "translateY(-4px)";
                  el.style.boxShadow  = `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${featured.color}30`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Imagen */}
                <div style={{ position: "relative", minHeight: 420, overflow: "hidden" }}>
                  <img
                    src={featured.img} alt={featured.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s ease" }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
                  />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent 50%, ${C.panel})`, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(7,5,16,0.2)", pointerEvents: "none" }} />
                  {/* Badge destacado */}
                  <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 100, background: "rgba(7,5,16,0.82)", border: `1px solid ${C.borderBr}`, backdropFilter: "blur(10px)" }}>
                    <Star size={9} color={C.gold} fill={C.gold} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.gold, fontFamily: FB, letterSpacing: "0.06em" }}>DESTACADO</span>
                  </div>
                </div>

                {/* Texto */}
                <div style={{ padding: "44px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{
                    alignSelf: "flex-start", fontSize: 11, fontWeight: 700, color: featured.color,
                    padding: "4px 12px", borderRadius: 100,
                    background: `${featured.color}14`, border: `1px solid ${featured.color}30`,
                    marginBottom: 18, fontFamily: FB,
                  }}>{featured.catLabel}</span>

                  <h2 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 900, fontFamily: FD, color: C.cream, margin: "0 0 14px", lineHeight: 1.25 }}>
                    {featured.titulo}
                  </h2>
                  <p style={{ fontSize: 14.5, color: C.creamMut, lineHeight: 1.85, margin: "0 0 26px", fontFamily: FB }}>
                    {featured.excerpt}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${featured.color}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "white", fontFamily: FB }}>{featured.autor[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.creamSub, fontFamily: FB }}>{featured.autor}</div>
                      <div style={{ fontSize: 12, color: C.creamMut, fontFamily: FB, display: "flex", alignItems: "center", gap: 5 }}>
                        {featured.fecha}
                        <span style={{ opacity: .4 }}>·</span>
                        <Clock size={10} strokeWidth={1.8} /> {featured.lectura}
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "12px 24px", borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg, ${featured.color}, ${C.purple})`,
                      color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FB,
                      boxShadow: `0 8px 26px ${featured.color}35`, transition: "transform .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                  >
                    Leer artículo <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            )}

            {/* Grid de artículos */}
            {rest.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
                {rest.map((post, i) => (
                  <PostCard key={post.id} post={post} delay={i * 0.08} onLeer={handleLeer} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDeep, borderTop: `1px solid ${C.border}`, padding: "72px 6vw" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 22px", boxShadow: `0 12px 36px ${C.pink}30`,
          }}>
            <Mail size={24} color="white" strokeWidth={1.8} />
          </div>

          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 900, fontFamily: FD, color: C.cream, margin: "0 0 12px" }}>
            Sé el primero en leer
          </h2>
          <p style={{ fontSize: 15, color: C.creamMut, fontFamily: FB, lineHeight: 1.75, margin: "0 0 30px" }}>
            Nuevos relatos, técnicas y noticias del arte Huasteco directamente a tu correo. Sin spam, sólo arte.
          </p>

          <div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto 14px" }}>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubscribe()}
              placeholder="tu@correo.com"
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 12,
                border: `1.5px solid ${C.border}`, background: "#FFFFFF",
                color: C.cream, fontSize: 14, fontFamily: FB, outline: "none",
                transition: "border-color .2s",
              }}
              onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor  = `${C.pink}55`}
              onBlur={e  => (e.currentTarget as HTMLInputElement).style.borderColor  = C.border}
            />
            <button
              onClick={handleSubscribe}
              style={{
                padding: "12px 20px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
                color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                fontFamily: FB, boxShadow: `0 6px 22px ${C.pink}30`,
                transition: "transform .15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
            >
              Suscribirme
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Star size={10} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 12, color: C.creamMut, fontFamily: FB }}>Más de 200 lectores cada semana</span>
          </div>
        </div>
      </section>
    </>
  );
}
