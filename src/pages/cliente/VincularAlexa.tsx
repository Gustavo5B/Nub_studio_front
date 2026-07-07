// src/pages/cliente/VincularAlexa.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  pink:   "#A83B90",
  blue:   "#2D6FBE",
  ink:    "#14121E",
  sub:    "#9896A8",
  bg:     "#FAFAF9",
  card:   "#FFFFFF",
  border: "#E6E4EF",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA  = "'Nexa-Heavy', sans-serif";

interface CodigoVinculacion {
  codigo: string;
  expira_en: string;
}

export default function VincularAlexa() {
  const navigate = useNavigate();
  const [data, setData] = useState<CodigoVinculacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  const generarCodigo = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) {
        setError("Debes iniciar sesión de nuevo.");
        return;
      }

      const response = await fetch(`${API_URL}/api/codigo-vinculacion`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || "Error al generar el código");
      }
      setData(json as CodigoVinculacion);
    } catch (err) {
      setError("No se pudo generar el código. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) return;
    const actualizar = () => {
      const restante = Math.max(
        0,
        Math.floor((new Date(data.expira_en).getTime() - Date.now()) / 1000)
      );
      setSegundosRestantes(restante);
    };
    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const codigoExpirado = data && segundosRestantes <= 0;

  const formatearTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS }}>
      <style>{`
        @font-face { font-family:'SolveraLorvane'; src:url('/fonts/SolveraLorvane.ttf') format('truetype'); font-display:swap; }
        @font-face { font-family:'Nexa-Heavy'; src:url('/fonts/Nexa-Heavy.ttf') format('truetype'); font-display:swap; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .va-back-btn {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid ${C.border}; border-radius:100px;
          padding:8px 16px; cursor:pointer;
          font-size:11.5px; font-weight:600; color:${C.sub}; font-family:${SANS};
          transition: all .18s; letter-spacing:.04em;
        }
        .va-back-btn:hover { border-color:${C.ink}; color:${C.ink}; background:#fff; }

        .va-generate-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:14px 30px; border-radius:100px; border:none; cursor:pointer;
          background:${C.blue}; color:#fff;
          font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
          font-family:${SANS}; transition: all .2s;
        }
        .va-generate-btn:hover:not(:disabled) { background:#245a9e; transform:translateY(-2px); box-shadow:0 8px 24px rgba(45,111,190,.3); }
        .va-generate-btn:disabled { opacity:.6; cursor:not-allowed; }

        .va-secondary-btn {
          display:flex; align-items:center; justify-content:center; gap:6px;
          padding:10px 20px; border-radius:100px;
          background:none; border:1.5px solid ${C.border}; cursor:pointer;
          font-size:11px; font-weight:600; color:${C.sub}; font-family:${SANS};
          letter-spacing:.06em; text-transform:uppercase;
          transition: all .18s;
        }
        .va-secondary-btn:hover { border-color:${C.ink}; color:${C.ink}; }

        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:.6; }
        }
        .va-mic-pulse { animation: pulse 2.2s ease-in-out infinite; }
        .va-spin { animation: spin .9s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @keyframes fadeUp {
          from{opacity:0; transform:translateY(16px)}
          to{opacity:1; transform:translateY(0)}
        }
        .va-reveal { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both; }

        .va-step {
          display:flex; gap:14px; padding:16px 0;
        }
      `}</style>

      {/* ── Main ── */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 100px" }}>

        {/* Icon + title */}
        <div className="va-reveal" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 22px",
            background: `linear-gradient(135deg, ${C.blue}22, ${C.blue}08)`,
            border: `1px solid ${C.blue}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mic size={30} strokeWidth={1.5} color={C.blue} className={data && !codigoExpirado ? "va-mic-pulse" : ""}/>
          </div>

          <h1 translate="no" style={{
            margin: "0 0 10px", fontFamily: SERIF,
            fontSize: "clamp(26px,4vw,36px)", fontWeight: 900, fontStyle: "italic",
            color: C.ink, letterSpacing: "-.03em",
          }}>
            Vincular con Alexa
          </h1>
          <p style={{ margin: "0 auto", maxWidth: 420, fontSize: 13.5, color: C.sub, lineHeight: 1.6 }}>
            Conecta tu cuenta de NU★B Studio con tu dispositivo Echo para buscar
            obras, artistas y gestionar tu carrito por voz.
          </p>
        </div>

        {/* Card principal */}
        <div className="va-reveal" style={{
          background: C.card, borderRadius: 24, overflow: "hidden",
          boxShadow: "0 2px 16px rgba(20,18,30,.07), 0 0 0 1px rgba(20,18,30,.055)",
          animationDelay: "80ms",
        }}>
          <div style={{ height: 3.5, background: `linear-gradient(90deg, ${C.blue}, ${C.blue}55)` }}/>

          <div style={{ padding: "40px 36px", textAlign: "center" }}>

            {!data || codigoExpirado ? (
              <>
                {codigoExpirado && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    background: "#FFF5F5", border: "1px solid #C4304A30",
                    borderRadius: 100, padding: "6px 14px", marginBottom: 24,
                    fontSize: 11.5, fontWeight: 600, color: "#C4304A",
                  }}>
                    Tu código anterior expiró
                  </div>
                )}

                {/*
                  IMPORTANTE: el botón mantiene siempre el mismo esqueleto de
                  nodos (icon-wrapper + span de texto). Antes se alternaba entre
                  fragmentos <>...</> completamente distintos según `loading`,
                  lo cual obliga a React a desmontar/montar nodos en cada clic.
                  Si algo externo (traductor de Chrome, Grammarly, extensiones
                  que tocan el DOM) ya modificó esos nodos, React pierde la
                  referencia y truena con "insertBefore" al hacer commit.
                  Mantener el mismo esqueleto y solo intercambiar el ícono +
                  actualizar el texto de un único <span> reduce drásticamente
                  ese riesgo.
                */}
                <button
                  className="va-generate-btn"
                  onClick={generarCodigo}
                  disabled={loading}
                  style={{ margin: "0 auto" }}
                  translate="no"
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                    aria-hidden="true"
                  >
                    {loading
                      ? <RefreshCw size={14} className="va-spin" />
                      : <Mic size={14} />
                    }
                  </span>
                  <span translate="no">
                    {loading ? "Generando..." : "Generar código"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: ".28em",
                  textTransform: "uppercase", color: C.sub, marginBottom: 18,
                }}>
                  Tu código de vinculación
                </div>

                {/*
                  El código y el contador cambian solos (por el setInterval),
                  independientemente de la interacción del usuario. Si el
                  traductor reescribe estos nodos de texto mientras React
                  también los actualiza cada segundo, es el escenario más
                  propenso al choque. translate="no" le indica a Chrome que
                  no debe tocar este contenido.
                */}
                <div
                  translate="no"
                  style={{
                    fontFamily: NEXA, fontSize: 64, fontWeight: 900,
                    color: C.blue, letterSpacing: "0.14em", lineHeight: 1,
                    marginBottom: 22,
                  }}
                >
                  {data.codigo}
                </div>

                <div
                  translate="no"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    background: `${C.orange}10`, border: `1px solid ${C.orange}25`,
                    borderRadius: 100, padding: "6px 16px", marginBottom: 28,
                    fontSize: 12, fontWeight: 700, color: C.orange,
                  }}
                >
                  <Clock size={12} strokeWidth={2.5}/>
                  <span>Expira en {formatearTiempo(segundosRestantes)}</span>
                </div>

                <div>
                  <button className="va-secondary-btn" onClick={generarCodigo} translate="no">
                    <RefreshCw size={12}/> <span>Generar otro código</span>
                  </button>
                </div>
              </>
            )}

            {error && (
              <p style={{ marginTop: 20, fontSize: 12.5, color: "#C4304A" }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* ── Pasos ── */}
        <div style={{ marginTop: 44 }} className="va-reveal">
          <div style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: ".28em",
            textTransform: "uppercase", color: C.sub, marginBottom: 14,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span>Cómo vincular</span>
            <div style={{ flex: 1, height: 1, background: C.border }}/>
          </div>

          <div style={{
            background: C.card, borderRadius: 20, padding: "6px 24px",
            boxShadow: "0 2px 16px rgba(20,18,30,.07), 0 0 0 1px rgba(20,18,30,.055)",
          }}>
            {[
              "Genera tu código de 4 dígitos aquí arriba.",
              'Dile a tu Echo: "Alexa, abre Explorador de Arte Huasteco".',
              'Cuando te lo pida, di: "vincula mi cuenta con el código" seguido de tus 4 dígitos.',
            ].map((texto, i, arr) => (
              <div key={i} className="va-step" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: `${C.blue}12`, color: C.blue,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11.5, fontWeight: 800, fontFamily: SANS,
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.ink, lineHeight: 1.6, paddingTop: 2 }}>
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmación de cuenta vinculada (placeholder, opcional) */}
        <div style={{
          marginTop: 28, display: "flex", alignItems: "center", gap: 8,
          justifyContent: "center", fontSize: 11.5, color: C.sub,
        }}>
          <CheckCircle2 size={13} color={C.sub}/>
          El código expira a los 10 minutos por seguridad.
        </div>

      </main>
    </div>
  );
}