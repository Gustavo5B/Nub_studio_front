// src/layout/Footer.tsx
import { Link } from "react-router-dom";
import { Globe, Share2, X, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import logoImg from "../assets/images/logo.png";

const C = {
  orange:   "#FF840E",
  pink:     "#CC59AD",
  magenta:  "#CC4EA1",
  purple:   "#8D4CCD",
  blue:     "#79AAF5",
  gold:     "#FFC110",
  cream:    "#FFF8EE",
  creamSub: "#D8CABC",
  creamMut: "rgba(255,232,200,0.38)",
  bg:       "#0C0812",
  bgDeep:   "#070510",
  border:   "rgba(255,200,150,0.09)",
  borderBr: "rgba(118,78,49,0.24)",
  borderHi: "rgba(255,200,150,0.18)",
};

const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const CATALOGO = [
  { label: "Artesanía",  to: "/catalogo?categoria=artesania"  },
  { label: "Pintura",    to: "/catalogo?categoria=pintura"    },
  { label: "Fotografía", to: "/catalogo?categoria=fotografia" },
  { label: "Escultura",  to: "/catalogo?categoria=escultura"  },
];

const ESTUDIO = [
  { label: "Sobre nosotros", to: "/sobre-nosotros" },
  { label: "Artistas",       to: "/artistas"        },
  { label: "Blog",           to: "/blog"            },
  { label: "Contacto",       to: "/contacto"        },
];

const SOCIAL = [
  { Icon: Globe,  href: "#", color: C.pink,  label: "Instagram" },
  { Icon: Share2, href: "#", color: C.blue,  label: "Facebook"  },
  { Icon: X,      href: "#", color: C.blue,  label: "Twitter"   },
];

const CONTACTO = [
  { Icon: MapPin, text: "Huejutla de Reyes, Hidalgo, México" },
  { Icon: Phone,  text: "+52 789 000 0000"                    },
  { Icon: Mail,   text: "hola@nubstudio.mx"                   },
];

export default function Footer() {
  return (
    <footer style={{
      background: C.bgDeep,
      fontFamily: FB,
      borderTop: `1px solid ${C.borderBr}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.pink}, ${C.purple}, ${C.blue})` }} />
      <div style={{ position: "absolute", bottom: -120, left: -120, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}08, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 40px 48px", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr", gap: 48 }} className="footer-grid">

          {/* ── Marca ── */}
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.borderBr}`, flexShrink: 0 }}>
                <img src={logoImg} alt="Nu-B Studio" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.cream, lineHeight: 1.1, fontFamily: FD, letterSpacing: "-0.01em" }}>Nu-B Studio</div>
                <div style={{ fontSize: 9.5, color: C.orange, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FB }}>Arte Huasteco</div>
              </div>
            </Link>

            <p style={{ fontSize: 13.5, lineHeight: 1.85, color: C.creamMut, marginBottom: 24, maxWidth: 280, fontFamily: FB }}>
              Galería de arte huasteco que preserva y promueve la cultura regional. Conectamos artistas locales con coleccionistas de todo México.
            </p>

            <Link to="/registro-artista" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 10, marginBottom: 24,
              background: `linear-gradient(135deg, ${C.orange}15, ${C.gold}08)`,
              border: `1px solid ${C.orange}35`,
              fontSize: 12.5, fontWeight: 700, color: C.orange,
              textDecoration: "none", fontFamily: FB, transition: "all .15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.orange}22`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${C.orange}15, ${C.gold}08)`; }}
            >
              <Sparkles size={13} /> Únete como artista
            </Link>

            <div style={{ display: "flex", gap: 8 }}>
              {SOCIAL.map(({ Icon, href, color, label }) => (
                <a key={label} href={href} aria-label={label} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,200,150,0.04)",
                  border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color, textDecoration: "none", transition: "all .15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}15`; (e.currentTarget as HTMLElement).style.borderColor = `${color}50`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,200,150,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Catálogo ── */}
          <div>
            <Link to="/catalogo" style={{ display: "block", fontSize: 10, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20, fontFamily: FB, textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.gold; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.orange; }}
            >
              Catálogo ↗
            </Link>
            {CATALOGO.map(({ label, to }) => (
              <Link key={to} to={to} style={{
                display: "block", fontSize: 13.5, color: C.creamMut,
                textDecoration: "none", marginBottom: 11,
                fontFamily: FB, transition: "color .15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.cream; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
              >{label}</Link>
            ))}
          </div>

          {/* ── Estudio ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.purple, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20, fontFamily: FB }}>Estudio</div>
            {ESTUDIO.map(({ label, to }) => (
              <Link key={to} to={to} style={{
                display: "block", fontSize: 13.5, color: C.creamMut,
                textDecoration: "none", marginBottom: 11,
                fontFamily: FB, transition: "color .15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.cream; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
              >{label}</Link>
            ))}
          </div>

          {/* ── Contacto ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.pink, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20, fontFamily: FB }}>Contacto</div>
            {CONTACTO.map(({ Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.orange}12`, border: `1px solid ${C.orange}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <Icon size={13} color={C.orange} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 13, color: C.creamMut, lineHeight: 1.6, fontFamily: FB }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderBr}, transparent)`, margin: "40px 0 28px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12.5, color: C.creamMut, fontFamily: FB }}>
            © 2026 Nu-B Studio. Todos los derechos reservados.
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            {["Términos", "Privacidad", "Cookies"].map(t => (
              <a key={t} href="#" style={{ fontSize: 12.5, color: C.creamMut, textDecoration: "none", fontFamily: FB, transition: "color .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.orange; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.creamMut; }}
              >{t}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </footer>
  );
}