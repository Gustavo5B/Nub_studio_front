// src/pages/public/Contact.tsx
import {
  Mail, Phone, MapPin, Clock, Send, Star, Users,
  User, MessageSquare, CheckCircle, Palette, ArrowLeft,
  Instagram, Facebook, Sparkles
} from "lucide-react";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  orange: "#FF840E",
  pink: "#CC59AD",
  purple: "#8D4CCD",
  gold: "#FFC110",
  bg: "#0f0c1a",
  border: "rgba(255,255,255,0.1)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  card: "rgba(255,255,255,0.03)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color .2s, background .2s",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.75)",
  marginBottom: 8,
};

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "", email: "", telefono: "", asunto: "", mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
        setFormData({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
      }, 3500);
    }, 1200);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = C.orange;
    e.currentTarget.style.background = "rgba(255,132,14,0.06)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Outfit', sans-serif",
      color: C.text,
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* ── Rainbow line top ── */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#FF840E,#CC59AD,#8D4CCD,#FFC110)", zIndex:200, pointerEvents:"none" }} />

      {/* ── Grid texture overlay ── */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.4'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/svg%3E\")", opacity:0.04, pointerEvents:"none", zIndex:0 }} />

      {/* ── Orbs de fondo ── */}
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}18, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}15, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", left: "50%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}08, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* ── Back button ── */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100,
          background: "rgba(15,12,26,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all .22s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,132,14,0.15)";
          el.style.borderColor = `${C.orange}50`;
          el.style.color = C.orange;
          el.style.transform = "translateX(-2px)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(15,12,26,0.85)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
          el.style.color = "rgba(255,255,255,0.7)";
          el.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Volver al inicio
      </button>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* ── Hero header ── */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 18px", borderRadius: 100,
            background: `linear-gradient(135deg, ${C.orange}18, ${C.pink}18)`,
            border: `1px solid ${C.orange}30`,
            fontSize: 13, fontWeight: 600, color: C.orange,
            marginBottom: 20,
          }}>
            <Sparkles size={14} />
            Galería certificada #1 en Hidalgo
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 900,
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}>
            Conecta con el{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Arte Huasteco
            </span>
          </h1>

          <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Transforma tus espacios con obras auténticas de artistas locales. Estamos aquí para ayudarte.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "100% Auténtico", icon: <CheckCircle size={14} /> },
              { label: "50+ Artistas", icon: <Users size={14} /> },
              { label: "1,000+ Obras", icon: <Palette size={14} /> },
              { label: "Calificación 5.0", icon: <Star size={14} /> },
            ].map(({ label, icon }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 100,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              }}>
                <span style={{ color: C.orange }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="contact-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 28,
          alignItems: "start",
        }}>

          {/* ── Left column: info cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Contact info cards */}
            {[
              {
                icon: <MapPin size={20} color={C.orange} />,
                title: "Ubicación",
                line1: "Universidad Tecnológica",
                line2: "Huasteca Hidalguense",
                color: C.orange,
              },
              {
                icon: <Phone size={20} color={C.pink} />,
                title: "Llámanos",
                line1: "+52 771 234 5678",
                line2: "Respuesta en minutos",
                color: C.pink,
              },
              {
                icon: <Mail size={20} color={C.purple} />,
                title: "Escríbenos",
                line1: "contacto@altarstudio.com",
                line2: "Te respondemos hoy",
                color: C.purple,
              },
              {
                icon: <Clock size={20} color={C.gold} />,
                title: "Horario",
                line1: "Lun – Vie: 9AM – 6PM",
                line2: "Sábado: 10AM – 2PM",
                color: C.gold,
              },
            ].map(({ icon, title, line1, line2, color }) => (
              <div key={title} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "18px 20px", borderRadius: 16,
                background: C.card,
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                transition: "border-color .2s, background .2s",
                cursor: "default",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                  (e.currentTarget as HTMLElement).style.background = `${color}08`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.background = C.card;
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: color, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{line1}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{line2}</div>
                </div>
              </div>
            ))}

            {/* Artist CTA banner */}
            <div style={{
              padding: "24px 22px",
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.orange}20, ${C.pink}15)`,
              border: `1px solid ${C.orange}30`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}25, transparent 70%)`, pointerEvents: "none" }} />
              <Palette size={24} color={C.orange} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>¿Eres artista?</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                Únete a nuestra galería certificada y alcanza nuevos clientes en toda la región.
              </div>
              <button
                onClick={() => navigate("/registro-artista")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                  border: "none", color: "white",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: `0 8px 24px ${C.orange}35`,
                  transition: "transform .15s, box-shadow .15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${C.orange}50`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${C.orange}35`;
                }}
              >
                <Palette size={14} />
                Aplica ahora
              </button>
            </div>

            {/* Social links */}
            <div style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: C.card,
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>Síguenos</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { icon: <Instagram size={16} />, label: "@altarstudio" },
                  { icon: <Facebook size={16} />, label: "Altar Studio" },
                ].map(({ icon, label }) => (
                  <button key={label} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    transition: "all .15s",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${C.orange}50`;
                      (e.currentTarget as HTMLElement).style.color = C.orange;
                      (e.currentTarget as HTMLElement).style.background = `${C.orange}10`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: form + map ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Form card */}
            <div style={{
              background: "rgba(18,12,32,0.97)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: "36px 32px",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Card ambient glows */}
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.pink}12, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}10, transparent 70%)`, pointerEvents: "none" }} />

              <div style={{ position: "relative" }}>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Envíanos un mensaje</h2>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Te responderemos en menos de 24 horas</p>
                </div>

                {/* Success state */}
                {enviado && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "16px 18px", borderRadius: 14,
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    marginBottom: 24,
                    animation: "msgIn .25s ease",
                  }}>
                    <CheckCircle size={20} color="#4ADE80" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>¡Mensaje enviado!</div>
                      <div style={{ fontSize: 12, color: "rgba(74,222,128,0.7)" }}>Nos pondremos en contacto contigo pronto.</div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Row: nombre + email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}><User size={13} /> Nombre *</label>
                      <input
                        type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                        placeholder="Tu nombre" required
                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}><Mail size={13} /> Email *</label>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="tu@correo.com" required
                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  {/* Row: telefono + asunto */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}><Phone size={13} /> Teléfono</label>
                      <input
                        type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                        placeholder="+52 771 000 0000"
                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}><MessageSquare size={13} /> Asunto *</label>
                      <select
                        name="asunto" value={formData.asunto} onChange={handleChange} required
                        style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
                        onFocus={handleFocus} onBlur={handleBlur}
                      >
                        <option value="" disabled>Selecciona...</option>
                        <option value="compra">Compra de obra</option>
                        <option value="info">Información general</option>
                        <option value="artista">Ser artista en Altar Studio</option>
                        <option value="empresa">Colaboración empresarial</option>
                        <option value="otro">Otro tema</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}><MessageSquare size={13} /> Mensaje *</label>
                    <textarea
                      name="mensaje" value={formData.mensaje} onChange={handleChange}
                      placeholder="Cuéntanos en qué podemos ayudarte..." required
                      rows={5}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: 120,
                        lineHeight: 1.6,
                      }}
                      onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || enviado}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", padding: "13px 20px", borderRadius: 12, marginTop: 4,
                      background: enviado
                        ? "linear-gradient(135deg, #4ADE80, #22c55e)"
                        : `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                      border: "none", color: "white",
                      fontSize: 15, fontWeight: 700, cursor: (isLoading || enviado) ? "not-allowed" : "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: `0 8px 24px ${C.orange}30`,
                      opacity: isLoading ? 0.8 : 1,
                      transition: "transform .15s, box-shadow .15s, background .3s",
                    }}
                    onMouseEnter={e => {
                      if (!isLoading && !enviado) {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${C.orange}45`;
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${C.orange}30`;
                    }}
                  >
                    {isLoading ? (
                      <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} /> Enviando...</>
                    ) : enviado ? (
                      <><CheckCircle size={16} /> ¡Enviado!</>
                    ) : (
                      <><Send size={16} /> Enviar mensaje</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Map card */}
            <div style={{
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(18,12,32,0.97)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              position: "relative",
            }}>
              {/* Map header */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${C.orange}15`,
                  border: `1px solid ${C.orange}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <MapPin size={20} color={C.orange} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Visítanos</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Universidad Tecnológica Huasteca Hidalguense</div>
                </div>
                <a
                  href="https://www.google.com/maps/search/Universidad+Tecnol%C3%B3gica+de+la+Huasteca+Hidalguense"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto",
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                    color: "white", fontSize: 12, fontWeight: 700,
                    textDecoration: "none", fontFamily: "'Outfit', sans-serif",
                    whiteSpace: "nowrap" as const,
                    boxShadow: `0 4px 16px ${C.orange}30`,
                    transition: "transform .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                >
                  <MapPin size={12} /> Cómo llegar
                </a>
              </div>

              {/* Iframe */}
              <div style={{ position: "relative", height: 320 }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3722.8974536185797!2d-98.38544492494915!3d21.099338180562694!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d72d6af3e1e5e7%3A0x9d8e5f5e5e5e5e5e!2sUniversidad%20Tecnol%C3%B3gica%20de%20la%20Huasteca%20Hidalguense!5e0!3m2!1ses-419!2smx!4v1234567890123!5m2!1ses-419!2smx"
                  width="100%" height="100%"
                  style={{ border: 0, display: "block", filter: "grayscale(30%) brightness(0.9)" }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación"
                />
                {/* Gradient vignette over map */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: `linear-gradient(to bottom, rgba(18,12,32,0.15), transparent 30%, transparent 70%, rgba(18,12,32,0.3))`,
                }} />
              </div>

              {/* Quick info row */}
              <div style={{
                display: "flex",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}>
                {[
                  { icon: <Clock size={14} />, text: "Abierto ahora" },
                  { icon: <Star size={14} />, text: "5.0 estrellas" },
                  { icon: <CheckCircle size={14} />, text: "Verificado" },
                ].map(({ icon, text }, i) => (
                  <div key={text} style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "14px 8px",
                    fontSize: 12, fontWeight: 600,
                    color: "rgba(255,255,255,0.6)",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}>
                    <span style={{ color: C.orange }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ Section (estática) ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px 80px", position:"relative", zIndex:1 }}>
        <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,200,150,0.18),transparent)", marginBottom:64 }} />
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.orange, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12, fontFamily:"'Outfit',sans-serif" }}>Preguntas frecuentes</div>
          <h2 style={{ fontSize:"clamp(24px,3vw,38px)", fontWeight:900, color:C.text, margin:0, fontFamily:"'Outfit',sans-serif" }}>
            ¿Tienes dudas?{" "}
            <span style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Aquí las resolvemos
            </span>
          </h2>
        </div>
        <div className="faq-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {[
            {
              q:"¿Cómo compro una obra?",
              a:"Explora nuestro catálogo, selecciona la obra que te guste y contáctanos. Te asesoramos en todo el proceso de compra y envío a tu domicilio.",
              color:C.orange,
            },
            {
              q:"¿Cómo me registro como artista?",
              a:"Completa el formulario de registro de artista, sube tu portafolio y el equipo de NU★B Studio revisará tu solicitud en 3-5 días hábiles.",
              color:C.pink,
            },
            {
              q:"¿Las obras tienen garantía de autenticidad?",
              a:"Sí. Cada obra vendida en NU★B Studio incluye un certificado de autenticidad firmado por el artista y avalado por nuestra galería.",
              color:C.purple,
            },
            {
              q:"¿Puedo devolver una obra?",
              a:"Aceptamos devoluciones dentro de los 15 días posteriores a la entrega si la obra llega dañada o no coincide con la descripción.",
              color:C.gold,
            },
            {
              q:"¿Hacen envíos fuera de Hidalgo?",
              a:"Sí, enviamos a todo México. El costo de envío se calcula según el destino y el tamaño de la obra al momento de la compra.",
              color:C.orange,
            },
            {
              q:"¿Puedo solicitar una obra personalizada?",
              a:"Muchos de nuestros artistas aceptan encargos personalizados. Contáctanos y te ponemos en contacto directo con el artista ideal.",
              color:C.pink,
            },
          ].map(({ q, a, color }, i) => (
            <div key={i} style={{
              background:"rgba(255,255,255,0.025)",
              border:`1px solid rgba(255,255,255,0.07)`,
              borderRadius:18,
              padding:"24px 22px",
              backdropFilter:"blur(20px)",
              transition:"border-color .2s, transform .2s",
              cursor:"default",
            }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=`${color}40`; el.style.transform="translateY(-3px)"; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.07)"; el.style.transform="translateY(0)"; }}
            >
              <div style={{ width:8, height:8, borderRadius:"50%", background:color, marginBottom:14, boxShadow:`0 0 12px ${color}60` }} />
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:10, lineHeight:1.35, fontFamily:"'Outfit',sans-serif" }}>{q}</div>
              <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.75, fontFamily:"'Outfit',sans-serif" }}>{a}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.2)", fontStyle:"italic", textAlign:"center", marginTop:28, fontFamily:"'Outfit',sans-serif" }}>
          (FAQ estático — hacer dinámico desde /api/faq)
        </div>
      </div>

      {/* ── Footer note ── */}
      <div style={{
        textAlign: "center",
        padding: "24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative", zIndex: 1,
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
          © {new Date().getFullYear()} Altar Studio. Todos los derechos reservados.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes msgIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        select option { background: #1a1030; color: #ffffff; }
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .faq-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 620px) {
          .faq-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}