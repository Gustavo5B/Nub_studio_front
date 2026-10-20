// src/pages/public/legal/LegalPage.tsx
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, CloudOff, Info, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import type { LegalBlock, LegalDoc } from "./legalTypes";

const C = {
  orange: "#E8640C",
  pink: "#A83B90",
  ink: "#14121E",
  inkSub: "#5A5870",
  sub: "#9896A8",
  border: "#E6E4EF",
  bg: "#FAFAF9",
  code: "#F3F2F8",
  green: "#0E8A50",
  red: "#C4304A",
  gold: "#A87006",
  blue: "#2D6FBE",
};
const SERIF = "'SolveraLorvane', serif";
const SANS = "'Outfit', sans-serif";

const BOX = {
  important: { color: C.gold, bg: "#FFF8E6", Icon: Star },
  info: { color: C.blue, bg: "#EEF4FC", Icon: Info },
  warning: { color: C.red, bg: "#FCEEF1", Icon: AlertTriangle },
  success: { color: C.green, bg: "#EAF6F0", Icon: CheckCircle2 },
} as const;

// Convierte **texto** en <strong>
function rich(text: string): ReactNode {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

function Block({ b }: { b: LegalBlock }) {
  switch (b.t) {
    case "p":
      return <p className="lg-p">{rich(b.x)}</p>;
    case "h3":
      return <h3 className="lg-h3">{b.x}</h3>;
    case "ul":
      return (
        <ul className="lg-list">
          {b.x.map((li, i) => <li key={i}>{rich(li)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="lg-list">
          {b.x.map((li, i) => <li key={i}>{rich(li)}</li>)}
        </ol>
      );
    case "box": {
      const { color, bg, Icon } = BOX[b.k];
      return (
        <div className="lg-box" style={{ background: bg, borderLeftColor: color }}>
          <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 3 }} />
          <div>
            <div>{rich(b.x)}</div>
            {b.list && (
              <ul className="lg-list" style={{ margin: "8px 0 0" }}>
                {b.list.map((li, i) => <li key={i}>{rich(li)}</li>)}
              </ul>
            )}
          </div>
        </div>
      );
    }
    case "table":
      return (
        <div className="lg-table-wrap">
          <table className="lg-table">
            <thead>
              <tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{rich(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "contact":
      return (
        <div className="lg-contact">
          <div className="lg-contact-title">{b.title}</div>
          {b.lines.map((l, i) => <p key={i}>{rich(l)}</p>)}
        </div>
      );
  }
}

export default function LegalPage({ doc, other }: { doc: LegalDoc; other: { to: string; label: string } }) {
  const { hash } = useLocation();
  const [cached] = useState(() => "serviceWorker" in navigator && !!navigator.serviceWorker.controller);

  // Ir a la sección del hash (#cookies) o al inicio
  useEffect(() => {
    document.title = `${doc.title} — NU★B Studio`;
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, doc.title]);

  return (
    <>
      <style>{`
        @font-face { font-family: 'SolveraLorvane'; src: url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display: swap; }
        .lg-root { min-height: 100vh; background: ${C.bg}; font-family: ${SANS}; color: ${C.ink}; }
        .lg-top { border-bottom: 1px solid ${C.border}; background: #fff; }
        .lg-top-in { max-width: 1080px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .lg-back { display: inline-flex; align-items: center; gap: 8px; color: ${C.ink}; text-decoration: none; font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; transition: color .2s; }
        .lg-back:hover { color: ${C.orange}; }
        .lg-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: ${C.green}; }
        .lg-wrap { max-width: 1080px; margin: 0 auto; padding: 48px 24px 80px; display: grid; grid-template-columns: 240px minmax(0,1fr); gap: 56px; }
        .lg-toc { position: sticky; top: 24px; align-self: start; max-height: calc(100vh - 48px); overflow-y: auto; }
        .lg-toc-t { font-size: 10px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: ${C.pink}; margin-bottom: 14px; }
        .lg-toc a { display: block; padding: 6px 0; font-size: 12.5px; line-height: 1.4; color: ${C.inkSub}; text-decoration: none; transition: color .15s; }
        .lg-toc a:hover { color: ${C.orange}; }
        .lg-kicker { font-size: 10px; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; color: ${C.orange}; margin-bottom: 14px; }
        .lg-title { font-family: ${SERIF}, serif; font-size: clamp(34px, 6vw, 56px); line-height: 1.05; margin: 0 0 12px; font-weight: 400; }
        .lg-sub { font-size: 15px; color: ${C.inkSub}; margin: 0 0 24px; }
        .lg-meta { display: inline-flex; gap: 18px; flex-wrap: wrap; padding: 10px 18px; border: 1px solid ${C.border}; border-radius: 100px; background: #fff; font-size: 11.5px; font-weight: 600; color: ${C.inkSub}; margin-bottom: 36px; }
        .lg-sec { scroll-margin-top: 24px; padding-top: 32px; margin-top: 8px; border-top: 1px solid ${C.border}; }
        .lg-h2 { font-size: 20px; font-weight: 700; margin: 0 0 16px; letter-spacing: -.01em; }
        .lg-h3 { font-size: 14px; font-weight: 700; margin: 22px 0 8px; color: ${C.ink}; }
        .lg-p { font-size: 14.5px; line-height: 1.75; color: ${C.inkSub}; margin: 0 0 12px; }
        .lg-p strong, .lg-list strong, .lg-box strong, .lg-table strong { color: ${C.ink}; font-weight: 600; }
        .lg-list { margin: 0 0 14px; padding-left: 22px; font-size: 14.5px; line-height: 1.75; color: ${C.inkSub}; }
        .lg-list li { margin-bottom: 6px; }
        .lg-box { display: flex; gap: 12px; border-left: 3px solid; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 14px; line-height: 1.7; color: ${C.inkSub}; }
        .lg-table-wrap { overflow-x: auto; margin: 16px 0 20px; border: 1px solid ${C.border}; border-radius: 10px; background: #fff; }
        .lg-table { width: 100%; border-collapse: collapse; font-size: 13.5px; line-height: 1.6; color: ${C.inkSub}; }
        .lg-table th { text-align: left; background: ${C.code}; color: ${C.ink}; font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; padding: 12px 14px; }
        .lg-table td { padding: 12px 14px; border-top: 1px solid ${C.border}; vertical-align: top; }
        .lg-contact { background: ${C.ink}; color: #fff; border-radius: 12px; padding: 24px 28px; margin: 18px 0; }
        .lg-contact-title { font-family: ${SERIF}, serif; font-size: 24px; margin-bottom: 12px; }
        .lg-contact p { margin: 0 0 6px; font-size: 13.5px; line-height: 1.7; color: rgba(255,255,255,.78); }
        .lg-contact strong { color: #fff; }
        .lg-foot { margin-top: 48px; padding-top: 28px; border-top: 1px solid ${C.border}; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 12px; color: ${C.sub}; }
        .lg-foot a { color: ${C.ink}; font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; text-decoration: none; border: 1px solid ${C.border}; border-radius: 100px; padding: 10px 20px; transition: border-color .2s, color .2s; }
        .lg-foot a:hover { border-color: ${C.orange}; color: ${C.orange}; }
        @media (max-width: 860px) {
          .lg-wrap { grid-template-columns: 1fr; gap: 28px; padding-top: 32px; }
          .lg-toc { position: static; max-height: none; border: 1px solid ${C.border}; border-radius: 12px; background: #fff; padding: 16px 18px; }
        }
      `}</style>

      <div className="lg-root">
        <header className="lg-top">
          <div className="lg-top-in">
            <Link to="/" className="lg-back"><ArrowLeft size={13} /> Volver al inicio</Link>
            {cached && (
              <span className="lg-badge"><CloudOff size={13} /> Disponible sin conexión</span>
            )}
          </div>
        </header>

        <div className="lg-wrap">
          <nav className="lg-toc" aria-label="Contenido del documento">
            <div className="lg-toc-t">Contenido</div>
            {doc.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>{s.title}</a>
            ))}
          </nav>

          <main>
            <div className="lg-kicker">Documento legal</div>
            <h1 className="lg-title">{doc.title}</h1>
            <p className="lg-sub">{doc.subtitle}</p>
            <div className="lg-meta">
              <span>Última actualización: {doc.updated}</span>
              <span>Versión {doc.version}</span>
            </div>

            {doc.intro && <Block b={doc.intro} />}

            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="lg-sec">
                <h2 className="lg-h2">{s.title}</h2>
                {s.blocks.map((b, i) => <Block key={i} b={b} />)}
              </section>
            ))}

            <div className="lg-foot">
              <span>© 2026 NU★B Studio · Versión {doc.version}</span>
              <Link to={other.to}>{other.label}</Link>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
