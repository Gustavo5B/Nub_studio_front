// src/pages/public/DetalleArtistaPublico.tsx (CORREGIDO)
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mail, Phone, MapPin, Award, X
} from "lucide-react";
import { authService } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange:   "#E8640C",
  pink:     "#A83B90",
  purple:   "#6028AA",
  blue:     "#2D6FBE",
  gold:     "#A87006",
  green:    "#0E8A50",
  ink:      "#14121E",
  sub:      "#9896A8",
  dark:     "#0D0B14",
  bg:       "#FAFAF8",
  panel:    "#FFFFFF",
  card:     "#FFFFFF",
  border:   "#E6E4EF",
};

const SERIF = "'SolveraLorvane', serif";
const SANS  = "'Outfit', sans-serif";
const NEXA_HEAVY = "'Nexa-Heavy', sans-serif";
const PALETTE = [C.orange, C.pink, C.purple, C.blue, C.gold];

const fmt = (p: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(p);

interface FotoPersonal {
  id_foto: number;
  url_foto: string;
  es_principal: boolean;
  orden: number;
}

export default function DetalleArtistaPublico() {
  const navigate        = useNavigate();
  const { id }          = useParams<{ id: string }>();
  const [artista, setArtista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [fotosPersonales, setFotosPersonales] = useState<FotoPersonal[]>([]);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'obras' | 'personal'>('obras');
  const [selectedPhoto, setSelectedPhoto] = useState<FotoPersonal | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev === 0 ? fotosPersonales.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev === fotosPersonales.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    globalThis.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/api/artistas/${id}`);
        const json = await res.json();
        if (json.success) { 
          setArtista(json.data); 
          setTimeout(() => setVisible(true), 100);
          if (json.data.fotos_personales && Array.isArray(json.data.fotos_personales)) {
            setFotosPersonales(json.data.fotos_personales);
          }
        }
      } catch (error) {
        console.error("Error cargando artista:", error);
      } finally { 
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:12, color:C.sub, fontFamily:SANS, background:C.bg }}>
      <div style={{ animation:"spin 1s linear infinite", color: C.orange }}>⟳</div>
      <span style={{ fontSize:14 }}>Cargando…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!artista) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, fontFamily:SANS, background:C.bg }}>
      <div style={{ fontSize:24, fontWeight:900, color:C.ink, fontFamily:SERIF }}>Artista no encontrado</div>
      <button onClick={() => navigate("/artistas")} style={{ padding:"12px 28px", borderRadius:6, background:C.orange, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:NEXA_HEAVY, fontSize:14 }}>
        Ver artistas
      </button>
    </div>
  );

  const color    = PALETTE[artista.id_artista % PALETTE.length];
  const obras    = artista.obras || [];
  const publicadas = obras.filter((o:any) => o.estado === "publicada" && o.activa === true);
  
  // FIX: Contar correctamente las obras públicas
  const totalObrasPublicas = publicadas.length;
  const totalObrasArtista = obras.length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:SANS }}>

      {/* ── NAVEGACIÓN COMO HOME ── */}
      <nav style={{ position: "fixed", top: 30, left: 52, display: "flex", flexDirection: "column", gap: 10, zIndex: 50 }}>
        <button onClick={() => navigate("/catalogo")} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", border: "none", background: "none", cursor: "pointer", transition: "color .25s", fontFamily: NEXA_HEAVY }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = C.ink;
            const before = e.currentTarget.querySelector("::before") as HTMLElement;
            if (before) before.style.width = "22px";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = C.sub;
          }}
        >
          <span style={{ display: "block", width: "12px", height: "1px", background: "currentColor", transition: "width .28s" }}>
          </span>Galería
        </button>
        <button onClick={() => navigate("/artistas")} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", border: "none", background: "none", cursor: "pointer", transition: "color .25s", fontFamily: NEXA_HEAVY }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
        >
          <span style={{ display: "block", width: "12px", height: "1px", background: "currentColor", transition: "width .28s" }}>
          </span>Artistas
        </button>
        <button onClick={() => navigate("/blog")} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", border: "none", background: "none", cursor: "pointer", transition: "color .25s", fontFamily: NEXA_HEAVY }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
        >
          <span style={{ display: "block", width: "12px", height: "1px", background: "currentColor", transition: "width .28s" }}>
          </span>Blog
        </button>
        <button onClick={() => navigate("/contacto")} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.sub, textDecoration: "none", border: "none", background: "none", cursor: "pointer", transition: "color .25s", fontFamily: NEXA_HEAVY }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.sub}
        >
          <span style={{ display: "block", width: "12px", height: "1px", background: "currentColor", transition: "width .28s" }}>
          </span>Contacto
        </button>
      </nav>

      {/* ── BOTONES DE AUTENTICACIÓN - DERECHA ── */}
      <div style={{ position: "fixed", top: 30, right: 52, display: "flex", alignItems: "center", gap: 12, zIndex: 50 }}>
        {authService.isAuthenticated() ? (
          <button onClick={() => navigate(localStorage.getItem("userRol") === "admin" ? "/admin" : localStorage.getItem("userRol") === "artista" ? "/artista/dashboard" : "/mi-cuenta")} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", transition: "all .22s", background: "none", cursor: "pointer", fontFamily: NEXA_HEAVY }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = C.ink;
              (e.currentTarget as HTMLElement).style.borderColor = C.ink;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = C.sub;
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,.10)";
            }}
          >Mi cuenta</button>
        ) : (
          <>
            <button onClick={() => navigate("/login")} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.sub, textDecoration: "none", padding: "7px 14px", borderRadius: 100, border: "1px solid rgba(0,0,0,.10)", transition: "all .22s", background: "none", cursor: "pointer", fontFamily: NEXA_HEAVY }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = C.ink;
                (e.currentTarget as HTMLElement).style.borderColor = C.ink;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = C.sub;
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,.10)";
              }}
            >Ingresar</button>
            <button onClick={() => navigate("/register")} style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", textDecoration: "none", padding: "7px 16px", borderRadius: 100, background: color, boxShadow: `0 4px 16px ${color}30`, transition: "all .22s", border: "none", cursor: "pointer", fontFamily: NEXA_HEAVY }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.opacity = "0.88";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >Ser artista</button>
          </>
        )}
      </div>

      {/* ── GALERÍA PRINCIPAL ── */}
      <div style={{
        background: C.bg,
        padding: "clamp(40px, 8vh, 80px) clamp(20px, 5vw, 60px)",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%"
        }}>
          {/* NOMBRE SUPERPUESTO */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s 0.1s, transform 0.8s 0.1s",
            marginBottom: "clamp(40px, 8vh, 80px)",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "clamp(32px, 7vw, 80px)",
              fontWeight: 900,
              color: C.ink,
              margin: 0,
              fontFamily: SERIF,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              wordBreak: "break-word"
            }}>
              {artista.nombre_completo}
            </div>
            {artista.nombre_artistico && (
              <div style={{
                fontSize: "clamp(14px, 3vw, 18px)",
                color,
                fontWeight: 700,
                marginTop: "clamp(8px, 2vh, 16px)",
                fontFamily: NEXA_HEAVY,
                letterSpacing: "0.05em"
              }}>
                "{artista.nombre_artistico}"
              </div>
            )}

            {/* TAGS */}
            <div style={{ display: "flex", gap: "clamp(8px, 2vw, 12px)", justifyContent: "center", marginTop: "clamp(16px, 3vh, 24px)", flexWrap: "wrap" }}>
              {artista.categoria_nombre && (
                <span style={{
                  fontSize: "clamp(9px, 2vw, 11px)",
                  padding: "clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)",
                  borderRadius: 4,
                  background: color,
                  color: "white",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontFamily: NEXA_HEAVY,
                  letterSpacing: "0.08em"
                }}>
                  {artista.categoria_nombre}
                </span>
              )}
              {artista.matricula && (
                <span style={{
                  fontSize: "clamp(9px, 2vw, 11px)",
                  padding: "clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)",
                  borderRadius: 4,
                  background: C.gold,
                  color: "white",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontFamily: NEXA_HEAVY
                }}>
                  ✓ Certificado
                </span>
              )}
            </div>
          </div>

          {/* ═══ GALERÍA CAROUSEL MEJORADA ═══ */}
          {fotosPersonales.length > 0 ? (
            <div style={{
              position: "relative",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.95)",
              transition: "opacity 0.8s 0.3s, transform 0.8s 0.3s"
            }}>
              
              {/* CARRUSEL CON EFECTO VISUAL ATRACTIVO */}
              <div style={{
                position: "relative",
                height: "clamp(300px, 50vh, 600px)",
                background: C.panel,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 24,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {/* CONTENEDOR DE IMÁGENES CON EFECTO SUPERPUESTO */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  perspective: "1200px"
                }}>
                  {fotosPersonales.map((foto, idx) => {
                    const totalFotos = fotosPersonales.length;
                    const isActive = idx === activePhotoIndex;
                    const isBefore = (idx - activePhotoIndex + totalFotos) % totalFotos;
                    const scale = isActive ? 1 : 0.75 + (0.25 * (1 - Math.min(isBefore, totalFotos - 1) / 3));
                    const zIndex = isActive ? 10 : 10 - isBefore;
                    const opacity = isActive ? 1 : 0.4 + (0.6 * (1 - Math.min(isBefore, totalFotos - 1) / 3));
                    const offsetX = isActive ? 0 : (isBefore > totalFotos / 2 ? -40 : 40) * isBefore;
                    const offsetY = isActive ? 0 : 20 * isBefore;

                    return (
                      <div
                        key={foto.id_foto}
                        onClick={() => setSelectedPhoto(foto)}
                        onMouseEnter={(e) => {
                          if (isActive) {
                            const container = e.currentTarget as HTMLElement;
                            container.style.zIndex = "20";
                            container.style.transform = `scale(1.32) translateX(${offsetX}px) translateY(${offsetY}px)`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isActive) {
                            const container = e.currentTarget as HTMLElement;
                            container.style.zIndex = String(zIndex);
                            container.style.transform = `scale(${scale}) translateX(${offsetX}px) translateY(${offsetY}px)`;
                          }
                        }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex,
                          transform: `scale(${scale}) translateX(${offsetX}px) translateY(${offsetY}px)`,
                          opacity,
                          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                          cursor: "pointer",
                          borderRadius: 8,
                          overflow: "hidden"
                        }}
                      >
                        {/* VELO NARANJA - APARECE EN HOVER */}
                        <div 
                          className="carousel-velo"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(160deg, rgba(${parseInt(color.slice(1,3), 16)},${parseInt(color.slice(3,5), 16)},${parseInt(color.slice(5,7), 16)},0) 0%, rgba(${parseInt(color.slice(1,3), 16)},${parseInt(color.slice(3,5), 16)},${parseInt(color.slice(5,7), 16)},0.12) 100%)`,
                            opacity: 0,
                            transition: "opacity 0.5s",
                            pointerEvents: "none",
                            zIndex: 2
                          }}
                        />
                        
                        {/* IMAGEN CON EFECTO FILTRO */}
                        <img
                          src={foto.url_foto}
                          alt={artista.nombre_completo}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            backgroundColor: C.bg,
                            transition: "transform 0.7s cubic-bezier(0.2, 0, 0, 1), filter 0.5s",
                            transform: "scale(1)",
                            filter: "saturate(0.7) brightness(0.96)",
                            position: "relative",
                            zIndex: 1
                          }}
                          onMouseEnter={(e) => {
                            if (isActive) {
                              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                              (e.currentTarget as HTMLElement).style.filter = "saturate(0.95) brightness(1)";
                              const velo = (e.currentTarget as HTMLElement).parentElement?.querySelector(".carousel-velo") as HTMLElement;
                              if (velo) velo.style.opacity = "1";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isActive) {
                              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                              (e.currentTarget as HTMLElement).style.filter = "saturate(0.7) brightness(0.96)";
                              const velo = (e.currentTarget as HTMLElement).parentElement?.querySelector(".carousel-velo") as HTMLElement;
                              if (velo) velo.style.opacity = "0";
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* FLECHAS EN LOS LADOS */}
                {fotosPersonales.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      style={{
                        position: "absolute",
                        left: "clamp(16px, 3vw, 32px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "clamp(48px, 6vw, 64px)",
                        height: "clamp(48px, 6vw, 64px)",
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.9)",
                        border: `2px solid ${color}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color,
                        fontWeight: 900,
                        fontSize: "clamp(24px, 4vw, 32px)",
                        transition: "all 0.2s",
                        zIndex: 20,
                        backdropFilter: "blur(8px)",
                        boxShadow: `0 4px 16px ${color}20`
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = color;
                        (e.currentTarget as HTMLElement).style.color = "white";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1.1)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}40`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.9)";
                        (e.currentTarget as HTMLElement).style.color = color;
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}20`;
                      }}
                    >
                      ‹
                    </button>

                    <button
                      onClick={handleNextPhoto}
                      style={{
                        position: "absolute",
                        right: "clamp(16px, 3vw, 32px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "clamp(48px, 6vw, 64px)",
                        height: "clamp(48px, 6vw, 64px)",
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.9)",
                        border: `2px solid ${color}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color,
                        fontWeight: 900,
                        fontSize: "clamp(24px, 4vw, 32px)",
                        transition: "all 0.2s",
                        zIndex: 20,
                        backdropFilter: "blur(8px)",
                        boxShadow: `0 4px 16px ${color}20`
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = color;
                        (e.currentTarget as HTMLElement).style.color = "white";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1.1)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}40`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.9)";
                        (e.currentTarget as HTMLElement).style.color = color;
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}20`;
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* INDICADORES - DOTS MEJORADOS */}
              {fotosPersonales.length > 1 && (
                <div style={{
                  display: "flex",
                  gap: "clamp(8px, 2vw, 16px)",
                  overflowX: "auto",
                  paddingBottom: 12,
                  marginBottom: 0,
                  justifyContent: "center"
                }}>
                  {fotosPersonales.map((foto, idx) => (
                    <button
                      key={foto.id_foto}
                      onClick={() => setActivePhotoIndex(idx)}
                      style={{
                        width: activePhotoIndex === idx ? "clamp(32px, 5vw, 48px)" : "clamp(8px, 1.5vw, 10px)",
                        height: "clamp(8px, 1.5vw, 10px)",
                        borderRadius: 4,
                        background: activePhotoIndex === idx ? color : C.border,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        opacity: activePhotoIndex === idx ? 1 : 0.5,
                        boxShadow: activePhotoIndex === idx ? `0 4px 12px ${color}40` : "none"
                      }}
                      onMouseEnter={e => {
                        if (activePhotoIndex !== idx) {
                          (e.currentTarget as HTMLElement).style.opacity = "0.7";
                        }
                      }}
                      onMouseLeave={e => {
                        if (activePhotoIndex !== idx) {
                          (e.currentTarget as HTMLElement).style.opacity = "0.5";
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: 400,
              background: C.panel,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16
            }}>
              <div style={{ fontSize: 50 }}>📸</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: SERIF }}>
                Sin fotos aún
              </div>
            </div>
          )}

          {/* STATS - SOLO OBRAS PUBLICADAS */}
          <div style={{
            display: "flex",
            gap: "clamp(40px, 8vw, 60px)",
            justifyContent: "center",
            marginTop: "clamp(60px, 10vh, 80px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s 0.4s, transform 0.8s 0.4s",
            flexWrap: "wrap"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(32px, 6vw, 44px)", fontWeight: 900, color: totalObrasPublicas > 0 ? C.gold : C.sub, fontFamily: NEXA_HEAVY }}>
                {totalObrasPublicas}
              </div>
              <div style={{ fontSize: "clamp(9px, 2vw, 11px)", color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "clamp(4px, 1vh, 8px)", fontFamily: NEXA_HEAVY }}>
                Obras Publicadas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIONES DE OBRAS ── */}
      <div style={{
        background: C.panel,
        padding: "clamp(60px, 10vh, 100px) clamp(16px, 4vw, 60px)",
        borderTop: `1px solid ${C.border}`
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* TABS */}
          <div style={{
            display: "flex",
            gap: 12,
            borderBottom: `2px solid ${C.border}`,
            marginBottom: 60,
            paddingBottom: 20
          }}>
            <button
              onClick={() => setActiveGalleryTab('obras')}
              style={{
                padding: "12px 24px",
                borderBottom: activeGalleryTab === 'obras' ? `2px solid ${color}` : "none",
                background: "transparent",
                border: "none",
                color: activeGalleryTab === 'obras' ? C.ink : C.sub,
                fontWeight: activeGalleryTab === 'obras' ? 800 : 600,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: activeGalleryTab === 'obras' ? NEXA_HEAVY : SANS,
                transition: "all 0.2s",
                marginBottom: -22
              }}
            >
              Obras de Arte ({totalObrasPublicas})
            </button>
            <button
              onClick={() => setActiveGalleryTab('personal')}
              style={{
                padding: "12px 24px",
                borderBottom: activeGalleryTab === 'personal' ? `2px solid ${color}` : "none",
                background: "transparent",
                border: "none",
                color: activeGalleryTab === 'personal' ? C.ink : C.sub,
                fontWeight: activeGalleryTab === 'personal' ? 800 : 600,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: activeGalleryTab === 'personal' ? NEXA_HEAVY : SANS,
                transition: "all 0.2s",
                marginBottom: -22
              }}
            >
              Galería Personal ({fotosPersonales.length})
            </button>
          </div>

          {/* OBRAS */}
          {activeGalleryTab === 'obras' && (
            <div>
              {publicadas.length === 0 ? (
                <div style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "80px 40px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`
                }}>
                  <div style={{ fontSize: 50, marginBottom: 16 }}>🎨</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, fontFamily: SERIF }}>
                    Sin obras publicadas
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(160px, 30vw, 240px), 1fr))", gap: "clamp(16px, 3vw, 24px)" }}>
                  {publicadas.map((obra: any) => {
                    const disponible = obra.estado === "publicada" && obra.activa === true;
                    return (
                      <div
                        key={obra.id_obra}
                        onClick={() => obra.slug && navigate(`/obras/${obra.slug}`)}
                        style={{
                          background: C.bg,
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          overflow: "hidden",
                          cursor: obra.slug ? "pointer" : "default",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={e => {
                          if (obra.slug) {
                            (e.currentTarget as HTMLElement).style.borderColor = color;
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = C.border;
                        }}
                      >
                        <div style={{ height: "clamp(120px, 25vw, 160px)", background: C.panel, overflow: "hidden", position: "relative" }}>
                          {obra.imagen_principal ? (
                            <img
                              src={obra.imagen_principal}
                              alt={obra.titulo}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform .4s"
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 30 }}>
                              🎨
                            </div>
                          )}
                          <div style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            fontSize: 10,
                            padding: "4px 10px",
                            borderRadius: 4,
                            background: disponible ? C.orange : C.sub,
                            color: "white",
                            fontWeight: 700
                          }}>
                            {disponible ? "Disponible" : "Próximamente"}
                          </div>
                        </div>
                        <div style={{ padding: "14px" }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: C.ink,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: 8
                          }}>
                            {obra.titulo}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: C.sub }}>
                              {obra.categoria_nombre}
                            </span>
                            {obra.precio_base && (
                              <span style={{ fontSize: 14, fontWeight: 900, color: C.orange, fontFamily: NEXA_HEAVY }}>
                                {fmt(Number(obra.precio_base))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* GALERÍA PERSONAL */}
          {activeGalleryTab === 'personal' && (
            <div>
              {fotosPersonales.length === 0 ? (
                <div style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "80px 40px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`
                }}>
                  <div style={{ fontSize: 50, marginBottom: 16 }}>📸</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, fontFamily: SERIF }}>
                    Próximamente
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(160px, 30vw, 260px), 1fr))", gap: "clamp(16px, 3vw, 24px)" }}>
                  {fotosPersonales.map((foto) => (
                    <div
                      key={foto.id_foto}
                      onClick={() => setSelectedPhoto(foto)}
                      style={{
                        background: C.bg,
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = color;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = C.border;
                      }}
                    >
                      <div style={{ height: "clamp(140px, 30vw, 200px)", overflow: "hidden" }}>
                        <img
                          src={foto.url_foto}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.4s"
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                        />
                      </div>
                      <div style={{ padding: "14px" }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: C.ink,
                          marginBottom: 6
                        }}>
                          {foto.es_principal ? "Estudio" : "Detrás del Arte"}
                        </div>
                        <p style={{
                          fontSize: 12,
                          color: C.sub,
                          margin: 0
                        }}>
                          {foto.es_principal ? "Espacio creativo" : "Proceso creativo"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL FULLSCREEN ── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            backdropFilter: "blur(20px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            cursor: "pointer",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: C.card,
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              cursor: "default",
              animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 50px 100px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ position: "relative", background: C.panel, flex: 1 }}>
              <img
                src={selectedPhoto.url_foto}
                alt="Foto"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block"
                }}
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(10px)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .2s",
                  fontWeight: 700,
                  fontSize: 18
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = color;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.6)";
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "40px 48px", background: C.panel }}>
              <h3 style={{
                fontSize: 28,
                fontWeight: 900,
                color: C.ink,
                marginBottom: 12,
                margin: 0,
                fontFamily: SERIF
              }}>
                {selectedPhoto.es_principal ? "Estudio del Artista" : "Detrás de la Obra"}
              </h3>
              <p style={{
                fontSize: 16,
                color: C.ink,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 20
              }}>
                {selectedPhoto.es_principal
                  ? "Descubre el espacio donde la creatividad cobra vida."
                  : "Un vistazo exclusivo al proceso creativo."}
              </p>
              <div style={{ display: "flex", gap: 20, fontSize: 13, color: C.sub }}>
                <span>👤 {artista.nombre_artistico || artista.nombre_completo}</span>
                <span>🎨 {artista.categoria_nombre}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${color}; }
      `}</style>
    </div>
  );
}