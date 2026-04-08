// src/pages/private/artista/MiPerfil.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../../../context/ToastContext";
import { handleApiError, handleNetworkError } from "../../../utils/handleApiError";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const C = {
  orange: "#E8640C",
  orangeDark: "#D45A0A",
  ink: "#14121E",
  muted: "#8A8A8A",
  border: "#EDEDE9",
  bgCard: "#FCFCFA",
  bgPage: "#FFFFFF",
  inputBg: "#F5F5F2",
  error: "#C4304A",
  success: "#1A7A45",
  successLight: "rgba(26,122,69,0.1)",
};

const SERIF = "'SolveraLorvane', 'Playfair Display', Georgia, serif";
const SANS = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

export interface FotoPersonal { id_foto: number; url_foto: string; es_principal: boolean; }
export interface ArtistaInfo {
  id_artista: number; nombre_completo: string; nombre_artistico?: string; biografia?: string; estado: string;
  porcentaje_comision: number; correo?: string; telefono?: string; matricula?: string; categoria_nombre?: string;
  id_categoria_principal?: number; foto_perfil?: string; foto_portada?: string; foto_logo?: string;
  fotos_personales?: FotoPersonal[];
  ciudad?: string; direccion_taller?: string;
  codigo_postal?: string; id_estado_base?: number; nombre_estado?: string; dias_preparacion_default?: number;
  acepta_envios?: boolean; solo_entrega_personal?: boolean; politica_envios?: string; politica_devoluciones?: string;
  email_usuario?: string;
}
interface Estado { id_estado: number; nombre: string; codigo: string; }
interface Categoria { id_categoria: number; nombre: string; }
interface RedSocial { id_red: number; red_social: string; url: string; usuario?: string; }
interface Props { artista: ArtistaInfo; token: string; onActualizar: (nuevaFoto?: string) => void; }

const CAMPOS_REQUERIDOS: { key: keyof ArtistaInfo; label: string }[] = [
  { key: "foto_perfil", label: "Foto de perfil" }, { key: "nombre_artistico", label: "Nombre artístico" },
  { key: "biografia", label: "Biografía" }, { key: "telefono", label: "Teléfono" }, { key: "ciudad", label: "Ciudad" },
  { key: "id_estado_base", label: "Estado" }, { key: "codigo_postal", label: "Código postal" },
  { key: "direccion_taller", label: "Dirección del taller" }, { key: "id_categoria_principal", label: "Categoría principal" },
];

const REDES_OPCIONES = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "twitter", label: "Twitter/X", icon: "🐦" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "otra", label: "Otra", icon: "🔗" },
];

// Iconos SVG
const Icons = {
  Camera: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  Palette: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6a6 6 0 0 1 6 6"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="12" r="1"/></svg>),
  Location: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  Globe: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  Package: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.5 9.4l-9-5.2M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>),
  Lock: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  Check: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>),
  AlertCircle: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>),
  Info: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>),
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  X: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Edit: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20h16"/></svg>),
};

/* ─────────────────────────────────────────────
   VALIDACIONES (sin cambios)
───────────────────────────────────────────── */
const xssPattern = /<script|<iframe|<object|<embed|javascript:|on\w+\s*=|eval\(|vbscript:/i;
const sqliPattern = /'(\s)*(OR|AND)|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|--|\/\*/i;
const hasSuspiciousContent = (v: string) => xssPattern.test(v) || sqliPattern.test(v);
const sanitizeText = (v: string) =>
  v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
   .replace(/<iframe/gi, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").replace(/eval\(/gi, "").trim();

const validaciones: Record<string, (v: string) => string | null> = {
  telefono: v => !v ? null : !/^\d{10}$/.test(v.trim()) ? "Solo 10 dígitos numéricos" : null,
  codigo_postal: v => !v ? null : !/^\d{5}$/.test(v.trim()) ? "Solo 5 dígitos numéricos" : null,
  ciudad: v => !v ? null : v.trim().length < 3 ? "Mínimo 3 caracteres" : !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v.trim()) ? "Solo letras permitidas" : null,
  direccion_taller: v => !v ? null : v.trim().length < 10 ? "Mínimo 10 caracteres" : null,
  nombre_artistico: v => !v ? null : v.trim().length < 3 ? "Mínimo 3 caracteres" : null,
  biografia: v => !v ? null : v.trim().length < 20 ? "Mínimo 20 caracteres" : null,
};
const SECURITY_FIELDS = ["nombre_artistico", "biografia", "ciudad", "direccion_taller", "politica_envios", "politica_devoluciones"];
const CAMPOS_TEXTO_SUBMIT = ["nombre_artistico", "biografia", "telefono", "ciudad", "direccion_taller", "politica_envios", "politica_devoluciones"] as const;

function validateFieldChange(key: string, val: string): string | null {
  if (SECURITY_FIELDS.includes(key) && hasSuspiciousContent(val)) return "Contenido no permitido";
  const validar = validaciones[key];
  return validar ? validar(val) : null;
}
function validateAllFields(form: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  Object.entries(validaciones).forEach(([campo, validar]) => {
    const error = validar(String(form[campo] ?? ""));
    if (error) errors[campo] = error;
  });
  return errors;
}
function checkSecurityFields(form: Record<string, unknown>): string | null {
  for (const campo of CAMPOS_TEXTO_SUBMIT) {
    if (hasSuspiciousContent(String(form[campo]))) return campo;
  }
  return null;
}
function sanitizeForm(form: Record<string, unknown>) {
  return {
    ...form,
    nombre_artistico: sanitizeText(String(form.nombre_artistico ?? "")),
    biografia: sanitizeText(String(form.biografia ?? "")),
    ciudad: sanitizeText(String(form.ciudad ?? "")),
    direccion_taller: sanitizeText(String(form.direccion_taller ?? "")),
    politica_envios: sanitizeText(String(form.politica_envios ?? "")),
    politica_devoluciones: sanitizeText(String(form.politica_devoluciones ?? "")),
  };
}

/* ─────────────────────────────────────────────
   CSS GLOBAL (animaciones mejoradas)
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  @font-face {
    font-family: 'SolveraLorvane';
    src: url('/fonts/SolveraLorvane.ttf') format('truetype');
    font-weight: normal; font-style: normal; font-display: swap;
  }

  /* ── Grain ── */
  .mp-grain {
    position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 160px 160px; mix-blend-mode: multiply;
  }

  /* ── Cursor personalizado ── */
  .mp-cur-dot {
    position: fixed; width: 7px; height: 7px; border-radius: 50%;
    background: ${C.ink}; pointer-events: none; z-index: 99999;
    transform: translate(-50%,-50%); transition: width .2s, height .2s, background .2s;
  }
  .mp-cur-ring {
    position: fixed; width: 34px; height: 34px; border-radius: 50%;
    border: 1.5px solid rgba(20,18,30,.2); pointer-events: none; z-index: 99998;
    transform: translate(-50%,-50%); transition: width .3s, height .3s, border-color .25s;
  }
  .mp-cur-dot.over { width: 5px; height: 5px; background: ${C.orange}; }
  .mp-cur-ring.over { width: 56px; height: 56px; border-color: ${C.orange}; }

  /* ── Keyframes ── */
  @keyframes letterRise {
    0%   { opacity: 0; transform: translateY(70px) skewY(6deg); }
    60%  { opacity: 1; transform: translateY(-8px) skewY(-1deg); }
    100% { opacity: 1; transform: translateY(0) skewY(0); }
  }
  @keyframes fadeSlideUp {
    0%   { opacity: 0; transform: translateY(32px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideRight {
    0%   { opacity: 0; transform: translateX(-24px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    0%   { opacity: 0; transform: scale(0.88); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes progPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,100,12,.35); }
    50%       { box-shadow: 0 0 0 10px rgba(232,100,12,0); }
  }
  @keyframes progPulseGreen {
    0%, 100% { box-shadow: 0 0 0 0 rgba(26,122,69,.35); }
    50%       { box-shadow: 0 0 0 10px rgba(26,122,69,0); }
  }
  @keyframes fillBar {
    from { width: 0%; }
  }
  @keyframes eyebrowSlide {
    0%   { opacity: 0; transform: translateX(-20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes chipPop {
    0%   { opacity: 0; transform: scale(0.7) translateY(8px); }
    70%  { transform: scale(1.06) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes glowLine {
    0%   { transform: scaleX(0); opacity: 0; }
    100% { transform: scaleX(1); opacity: 1; }
  }
  @keyframes numberCount {
    from { opacity: 0; transform: translateY(20px) scale(0.8); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modeSwitch {
    0%   { opacity: 0; transform: scale(0.96) translateY(8px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .mp-au    { opacity: 0; animation: fadeSlideUp .7s cubic-bezier(.2,.9,.4,1.1) forwards; }
  .mp-asr   { opacity: 0; animation: fadeSlideRight .6s cubic-bezier(.2,.9,.4,1.1) forwards; }
  .mp-asi   { opacity: 0; animation: scaleIn .6s cubic-bezier(.2,.9,.4,1.1) forwards; }
  .mp-mode-transition {
    animation: modeSwitch 0.45s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
  }

  /* ── Section cards ── */
  .mp-sec {
    background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 28px;
    padding: 28px 32px; margin-bottom: 22px;
    transition: border-color .3s, box-shadow .3s, transform .3s;
    animation: fadeSlideUp .7s cubic-bezier(.2,.9,.4,1.1) both;
  }
  .mp-sec:hover {
    border-color: ${C.orange}25;
    box-shadow: 0 18px 40px -18px rgba(0,0,0,.09);
    transform: translateY(-2px);
  }

  /* ── Section header ── */
  .mp-sec-hdr {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 24px; padding-bottom: 18px;
    border-bottom: 1px solid ${C.border}; position: relative;
  }
  .mp-sec-hdr::after {
    content: ''; position: absolute; bottom: -1px; left: 0;
    height: 2px; width: 48px; background: ${C.orange};
    border-radius: 2px; transform-origin: left;
    animation: glowLine .6s cubic-bezier(.2,.9,.4,1.1) .4s both;
  }
  .mp-sec-icon {
    width: 38px; height: 38px; border-radius: 14px; flex-shrink: 0;
    background: ${C.orange}10; border: 1px solid ${C.orange}20;
    display: flex; align-items: center; justify-content: center;
    transition: transform .3s, background .3s;
  }
  .mp-sec-icon svg { stroke: ${C.orange}; }
  .mp-sec:hover .mp-sec-icon { transform: scale(1.1) rotate(-4deg); background: ${C.orange}18; }
  .mp-sec-title {
    font-family: ${SERIF}; font-size: 18px; font-weight: 700; color: ${C.ink}; flex: 1;
  }

  /* ── Progress block ── */
  .mp-prog {
    background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 28px;
    padding: 26px 32px; margin-bottom: 30px; display: flex; align-items: center; gap: 36px;
    position: relative; overflow: hidden;
    animation: scaleIn .7s cubic-bezier(.2,.9,.4,1.1) .08s both;
  }
  .mp-prog::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
    background: ${C.orange}; border-radius: 5px 0 0 5px; transition: background .6s;
  }
  .mp-prog.complete::before { background: ${C.success}; }
  .mp-prog-num {
    font-family: ${SERIF}; font-size: 64px; font-weight: 900; line-height: 1;
    flex-shrink: 0; color: ${C.orange}; transition: color .6s;
    animation: numberCount .6s cubic-bezier(.2,.9,.4,1.1) .2s both;
  }
  .mp-prog-num.complete { color: ${C.success}; animation: progPulseGreen 2s ease-in-out infinite; }
  .mp-prog-num.pulse    { animation: progPulse 2s ease-in-out infinite; }
  .mp-prog-info { flex: 1; }
  .mp-prog-label {
    font-size: 12px; font-weight: 700; color: ${C.muted}; text-transform: uppercase;
    letter-spacing: 1.5px; margin-bottom: 10px; font-family: ${SANS};
  }
  .mp-prog-bar {
    height: 8px; border-radius: 6px; background: ${C.border}; overflow: hidden; margin-bottom: 14px;
  }
  .mp-prog-fill {
    height: 100%; border-radius: 6px; background: ${C.orange};
    transition: width .9s cubic-bezier(.34,1.56,.64,1), background .6s;
    animation: fillBar .9s cubic-bezier(.34,1.56,.64,1) .3s both;
  }
  .mp-prog-fill.complete { background: ${C.success}; }
  .mp-prog-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .mp-chip {
    font-size: 11px; font-weight: 600; padding: 4px 13px; border-radius: 40px;
    background: ${C.inputBg}; border: 1px solid ${C.border}; color: ${C.muted};
    font-family: ${SANS}; letter-spacing: .3px;
    animation: chipPop .5s cubic-bezier(.2,.9,.4,1.1) both;
  }
  .mp-chip.done {
    background: ${C.successLight}; border-color: rgba(26,122,69,.28); color: ${C.success};
  }
  .mp-prog-badge {
    flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 8px 18px;
    border-radius: 40px; font-family: ${SANS}; transition: all .6s;
    white-space: nowrap;
  }
  .mp-prog-badge.incomplete { background: ${C.inputBg}; border: 1px solid ${C.border}; color: ${C.muted}; }
  .mp-prog-badge.complete   { background: ${C.successLight}; border: 1px solid rgba(26,122,69,.3); color: ${C.success}; }

  /* ── Hero header ── */
  .mp-hero {
    display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 24px;
    margin-bottom: 48px; padding-bottom: 28px; border-bottom: 2px solid ${C.ink};
    position: relative;
  }
  .mp-hero::after {
    content: ''; position: absolute; bottom: -2px; left: 0;
    height: 2px; width: 72px; background: ${C.orange};
  }
  .mp-eyebrow {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.orange}; font-family: ${SANS};
    animation: eyebrowSlide .7s cubic-bezier(.2,.9,.4,1.1) .05s both;
  }
  .mp-eyebrow::before {
    content: ''; display: inline-block; width: 32px; height: 2px; background: ${C.orange};
  }
  .mp-hero-sub {
    font-size: 15px; color: ${C.muted}; max-width: 420px; line-height: 1.65; margin-top: 14px;
    animation: fadeSlideUp .6s cubic-bezier(.2,.9,.4,1.1) .5s both; opacity: 0;
  }
  .mp-hero-meta {
    text-align: right;
    animation: fadeSlideUp .6s cubic-bezier(.2,.9,.4,1.1) .3s both; opacity: 0;
  }

  /* ── Grid layouts ── */
  .mp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
  @media (max-width: 700px) { .mp-grid-2 { grid-template-columns: 1fr; } }

  /* ── Fields ── */
  .mp-label {
    font-size: 10.5px; font-weight: 700; color: ${C.muted}; text-transform: uppercase;
    letter-spacing: 1.3px; margin-bottom: 6px; font-family: ${SANS};
    display: flex; align-items: center; gap: 6px;
  }
  .mp-req { font-size: 10px; font-weight: 800; }
  .mp-req.empty { color: ${C.error}; }
  .mp-req.ok    { color: ${C.success}; }
  .mp-input, .mp-textarea, .mp-select {
    width: 100%; background: ${C.inputBg}; border: 1px solid ${C.border};
    border-radius: 14px; padding: 12px 16px; color: ${C.ink}; font-family: ${SANS};
    font-size: 14px; outline: none; box-sizing: border-box; transition: all .25s ease;
  }
  .mp-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238A8A8A' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px;
  }
  .mp-input:focus, .mp-textarea:focus, .mp-select:focus {
    border-color: ${C.orange}; background: #fff; box-shadow: 0 0 0 4px rgba(232,100,12,.09);
    transform: translateY(-1px);
  }
  .mp-input.req-empty, .mp-select.req-empty {
    border-color: ${C.error}50; background: rgba(196,48,74,.025);
  }
  .mp-input-ro {
    width: 100%; background: #F9F9F7; border: 1px solid ${C.border}; border-radius: 14px;
    padding: 12px 16px; color: ${C.ink}; font-family: ${SANS}; font-size: 14px; cursor: default;
    box-sizing: border-box;
  }
  .mp-textarea { resize: vertical; }
  .mp-field-error { font-size: 11px; color: ${C.error}; font-weight: 600; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
  .mp-fld { margin-bottom: 18px; }
  .mp-fld:last-child { margin-bottom: 0; }
  .mp-fld-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 500px) { .mp-fld-grid { grid-template-columns: 1fr; } }

  /* ── Divider ── */
  .mp-divider { height: 1px; background: ${C.border}; margin: 20px 0; }

  /* ── Foto circles ── */
  .mp-foto-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .mp-foto-wrap { position: relative; }
  .mp-foto-circle {
    width: 88px; height: 88px; border-radius: 50%; overflow: hidden;
    border: 2px solid ${C.orange}; box-shadow: 0 0 0 4px ${C.orange}18;
    transition: transform .3s, box-shadow .3s;
    animation: scaleIn .6s cubic-bezier(.2,.9,.4,1.1) both;
  }
  .mp-foto-circle:hover { transform: scale(1.06); box-shadow: 0 0 0 6px ${C.orange}25; }
  .mp-foto-badge {
    position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
    font-size: 9px; font-weight: 800; color: ${C.orange}; background: #fff;
    border: 1px solid ${C.orange}35; border-radius: 20px; padding: 2px 9px; white-space: nowrap;
  }
  .mp-foto-del {
    position: absolute; top: -4px; right: -4px; width: 22px; height: 22px;
    border-radius: 50%; background: #fff; border: 1px solid ${C.border};
    color: ${C.error}; font-size: 11px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; padding: 0; line-height: 1;
    transition: all .2s; z-index: 2;
  }
  .mp-foto-del:hover { background: ${C.error}; color: #fff; border-color: ${C.error}; transform: scale(1.15); }
  .mp-foto-add {
    width: 88px; height: 88px; border-radius: 50%;
    border: 1.5px dashed ${C.orange}60; background: ${C.bgCard};
    color: ${C.orange}; cursor: pointer; font-size: 24px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all .25s; animation: floatY 3.5s ease-in-out infinite;
  }
  .mp-foto-add:hover { border-color: ${C.orange}; background: ${C.orange}08; transform: scale(1.08); }
  .mp-foto-add:disabled { opacity: .4; cursor: not-allowed; animation: none; }

  /* ── Portada / logo ── */
  .mp-portada-drop {
    border-radius: 20px; border: 1.5px dashed ${C.border};
    height: 90px; display: flex; align-items: center; justify-content: center;
    gap: 10px; cursor: pointer; color: ${C.muted}; font-size: 13px;
    background: ${C.bgCard}; transition: all .25s; margin-bottom: 10px;
  }
  .mp-portada-drop:hover { border-color: ${C.orange}; color: ${C.orange}; background: ${C.orange}04; }
  .mp-logo-box {
    width: 72px; height: 72px; border-radius: 16px; overflow: hidden;
    border: 1.5px dashed ${C.border}; background: ${C.bgCard};
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: ${C.muted}; flex-shrink: 0; transition: all .25s;
  }
  .mp-logo-box:hover { border-color: ${C.orange}; background: ${C.orange}06; }

  /* ── Toggle ── */
  .mp-tog-row {
    display: flex; align-items: center; gap: 12px; padding: 13px 18px;
    border-radius: 16px; border: 1px solid ${C.border}; background: ${C.inputBg};
    cursor: pointer; transition: all .25s; user-select: none; margin-bottom: 12px;
  }
  .mp-tog-row:hover { border-color: ${C.orange}35; background: ${C.orange}04; }
  .mp-tog-row.on    { border-color: ${C.orange}55; background: ${C.orange}07; }
  .mp-tog-track {
    width: 46px; height: 26px; border-radius: 13px; background: ${C.border};
    position: relative; flex-shrink: 0; transition: background .28s;
  }
  .mp-tog-track.on { background: ${C.orange}; }
  .mp-tog-thumb {
    position: absolute; top: 4px; left: 4px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.2);
    transition: left .28s cubic-bezier(.34,1.56,.64,1);
  }
  .mp-tog-thumb.on { left: 24px; }
  .mp-tog-label { font-size: 14px; color: ${C.muted}; font-weight: 400; transition: color .25s; }
  .mp-tog-label.on { color: ${C.ink}; font-weight: 500; }

  /* ── Redes ── */
  .mp-red-row {
    display: flex; align-items: center; gap: 10px; padding: 12px 16px;
    border-radius: 16px; border: 1px solid ${C.border}; background: ${C.inputBg};
    margin-bottom: 10px; transition: border-color .2s;
    animation: fadeSlideRight .5s cubic-bezier(.2,.9,.4,1.1) both;
  }
  .mp-red-row:hover { border-color: ${C.orange}30; }
  .mp-btn-add-red {
    width: 100%; padding: 11px 0; border-radius: 40px;
    border: 1.5px dashed ${C.orange}55; background: ${C.orange}05;
    color: ${C.orange}; cursor: pointer; font-family: ${SANS}; font-size: 13px;
    font-weight: 600; display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: all .25s;
  }
  .mp-btn-add-red:hover { border-color: ${C.orange}; background: ${C.orange}10; transform: translateY(-1px); }
  .mp-btn-del {
    background: none; border: none; cursor: pointer; color: ${C.muted};
    font-size: 14px; padding: 5px 8px; border-radius: 8px; transition: all .2s; line-height: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-btn-del:hover { color: ${C.error}; background: rgba(196,48,74,.09); }

  /* ── New red form ── */
  .mp-new-red {
    background: ${C.orange}07; border: 1px solid ${C.orange}22;
    border-radius: 22px; padding: 20px 22px; display: grid; gap: 14px;
    animation: scaleIn .4s cubic-bezier(.2,.9,.4,1.1) both;
  }

  /* ── Note box ── */
  .mp-note {
    display: flex; align-items: center; gap: 10px; padding: 14px 18px;
    border-radius: 16px; background: ${C.inputBg}; border: 1px solid ${C.border};
  }

  /* ── Buttons (edit / cancel / save) ── */
  .mp-save-btn {
    width: 100%; padding: 16px 0; border-radius: 50px; border: none;
    background: ${C.orange}; color: #fff; font-size: 15px; font-weight: 700;
    letter-spacing: .4px; cursor: pointer; font-family: ${SANS};
    transition: all .3s; display: flex; align-items: center; justify-content: center; gap: 10px;
    position: relative; overflow: hidden;
  }
  .mp-save-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.15) 50%, transparent 100%);
    transform: translateX(-100%); transition: transform .5s;
  }
  .mp-save-btn:hover::before { transform: translateX(100%); }
  .mp-save-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px -10px ${C.orange}60;
    background: ${C.orangeDark};
  }
  .mp-save-btn:active:not(:disabled) { transform: translateY(0); }
  .mp-save-btn:disabled { background: #E6E4EF; color: #9896A8; cursor: not-allowed; }
  .mp-save-btn.success { background: ${C.success}; box-shadow: 0 16px 36px -10px rgba(26,122,69,.5); }
  .mp-edit-btn {
    background: ${C.ink}; color: white;
  }
  .mp-edit-btn:hover { background: ${C.orange}; box-shadow: 0 16px 36px -10px ${C.orange}60; }
  .mp-cancel-btn {
    background: ${C.muted};
  }
  .mp-cancel-btn:hover { background: #6f6f6f; box-shadow: none; transform: translateY(-2px); }

  /* ── Spinner ── */
  .mp-spin {
    width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: rgba(255,255,255,.9); border-radius: 50%;
    display: inline-block; animation: spin .7s linear infinite;
  }
`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTES (reutilizables)
───────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title }: { icon: () => JSX.Element; title: string }) => (
  <div className="mp-sec-hdr">
    <div className="mp-sec-icon"><Icon /></div>
    <h3 className="mp-sec-title">{title}</h3>
  </div>
);

const Label = ({ text, required, empty }: { text: string; required?: boolean; empty?: boolean }) => (
  <div className="mp-label">
    {text}
    {required && (
      <span className={`mp-req ${empty ? "empty" : "ok"}`}>{empty ? "✕ requerido" : "✓"}</span>
    )}
  </div>
);

const ToggleSwitch = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div
    className={`mp-tog-row${value ? " on" : ""}`}
    role="button" tabIndex={0}
    onClick={() => onChange(!value)}
    onKeyDown={e => e.key === "Enter" && onChange(!value)}
  >
    <div className={`mp-tog-track${value ? " on" : ""}`}>
      <div className={`mp-tog-thumb${value ? " on" : ""}`} />
    </div>
    <span className={`mp-tog-label${value ? " on" : ""}`}>{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   VERSIONES DE SOLO LECTURA
───────────────────────────────────────────── */
function SeccionFotosReadOnly({ fotosPersonales, portadaUrl, logoUrl }: { fotosPersonales: FotoPersonal[]; portadaUrl?: string; logoUrl?: string }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.06s" }}>
      <SectionHeader icon={Icons.Camera} title="Galería de perfil" />
      <div style={{ marginBottom: 22 }}>
        <div className="mp-label">Fotos personales</div>
        <div className="mp-foto-row">
          {fotosPersonales.map((f, idx) => (
            <div key={f.id_foto} className="mp-foto-wrap" style={{ animation: `scaleIn .5s cubic-bezier(.2,.9,.4,1.1) ${idx * 0.1}s both` }}>
              <div className="mp-foto-circle">
                <img src={f.url_foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              {f.es_principal && <span className="mp-foto-badge">PRINCIPAL</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="mp-divider" />
      <div style={{ marginBottom: 22 }}>
        <div className="mp-label">Portada</div>
        {portadaUrl ? (
          <div style={{ borderRadius: 20, overflow: "hidden" }}>
            <img src={portadaUrl} alt="Portada" style={{ width: "100%", height: 130, objectFit: "cover" }} />
          </div>
        ) : <div className="mp-input-ro">Sin portada</div>}
      </div>
      <div className="mp-divider" />
      <div>
        <div className="mp-label">Logo</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="mp-logo-box">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeccionInfoArtisticaReadOnly({ artista }: { artista: ArtistaInfo }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.12s" }}>
      <SectionHeader icon={Icons.Palette} title="Información artística" />
      <div className="mp-fld">
        <div className="mp-label">Nombre artístico</div>
        <div className="mp-input-ro">{artista.nombre_artistico || "—"}</div>
      </div>
      <div className="mp-fld">
        <div className="mp-label">Categoría principal</div>
        <div className="mp-input-ro">{artista.categoria_nombre || "—"}</div>
      </div>
      <div className="mp-fld">
        <div className="mp-label">Biografía</div>
        <div className="mp-input-ro" style={{ whiteSpace: "pre-wrap" }}>{artista.biografia || "—"}</div>
      </div>
    </div>
  );
}

function SeccionContactoReadOnly({ artista }: { artista: ArtistaInfo }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.18s" }}>
      <SectionHeader icon={Icons.Location} title="Contacto y ubicación" />
      <div className="mp-fld-grid">
        <div><div className="mp-label">Teléfono</div><div className="mp-input-ro">{artista.telefono || "—"}</div></div>
        <div><div className="mp-label">Ciudad</div><div className="mp-input-ro">{artista.ciudad || "—"}</div></div>
        <div><div className="mp-label">Estado</div><div className="mp-input-ro">{artista.nombre_estado || "—"}</div></div>
        <div><div className="mp-label">Código postal</div><div className="mp-input-ro">{artista.codigo_postal || "—"}</div></div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="mp-label">Dirección del taller</div>
        <div className="mp-input-ro">{artista.direccion_taller || "—"}</div>
      </div>
    </div>
  );
}

function SeccionRedesReadOnly({ redes }: { redes: RedSocial[] }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.24s" }}>
      <SectionHeader icon={Icons.Globe} title="Redes sociales" />
      {redes.length === 0 ? (
        <div className="mp-input-ro">No hay redes sociales registradas</div>
      ) : (
        redes.map((red, idx) => {
          const opt = REDES_OPCIONES.find(o => o.value === red.red_social);
          return (
            <div key={red.id_red} className="mp-red-row" style={{ animationDelay: `${idx * 0.07}s` }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{opt?.icon ?? "🔗"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.1 }}>{opt?.label ?? red.red_social}</div>
                <div style={{ fontSize: 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{red.url}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SeccionEnviosReadOnly({ artista }: { artista: ArtistaInfo }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.3s" }}>
      <SectionHeader icon={Icons.Package} title="Política de envíos" />
      <div className="mp-tog-row"><div className={`mp-tog-track${artista.acepta_envios ? " on" : ""}`}><div className={`mp-tog-thumb${artista.acepta_envios ? " on" : ""}`} /></div><span className="mp-tog-label">Acepto envíos a domicilio</span></div>
      <div className="mp-tog-row"><div className={`mp-tog-track${artista.solo_entrega_personal ? " on" : ""}`}><div className={`mp-tog-thumb${artista.solo_entrega_personal ? " on" : ""}`} /></div><span className="mp-tog-label">Solo entrega personal / en taller</span></div>
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="mp-label">Días de preparación</div>
        <div className="mp-input-ro">{artista.dias_preparacion_default || "3"}</div>
      </div>
      <div className="mp-fld">
        <div className="mp-label">Política de envíos</div>
        <div className="mp-input-ro" style={{ whiteSpace: "pre-wrap" }}>{artista.politica_envios || "—"}</div>
      </div>
      <div className="mp-fld">
        <div className="mp-label">Política de devoluciones</div>
        <div className="mp-input-ro" style={{ whiteSpace: "pre-wrap" }}>{artista.politica_devoluciones || "—"}</div>
      </div>
    </div>
  );
}

function SeccionCuentaReadOnly({ artista }: { artista: ArtistaInfo }) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.36s" }}>
      <SectionHeader icon={Icons.Lock} title="Datos de cuenta" />
      <div className="mp-fld-grid" style={{ marginBottom: 18 }}>
        <div><div className="mp-label">Correo</div><div className="mp-input-ro">{artista.email_usuario ?? "—"}</div></div>
        <div><div className="mp-label">Nombre completo</div><div className="mp-input-ro">{artista.nombre_completo ?? "—"}</div></div>
        <div><div className="mp-label">Matrícula</div><div className="mp-input-ro">{artista.matricula ?? "—"}</div></div>
        <div><div className="mp-label">Comisión</div><div className="mp-input-ro">{artista.porcentaje_comision ? `${artista.porcentaje_comision}%` : "—"}</div></div>
      </div>
      <div className="mp-note">
        <Icons.Info />
        <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Para cambiar correo, contraseña o matrícula contacta a Nu-B Studio.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECCIONES EDITABLES (las originales, ligeramente adaptadas)
───────────────────────────────────────────── */
function SeccionFotosEditable({
  fotosPersonales, onAgregarFoto, onEliminarFoto, uploadingFoto,
  portadaPreview, portadaRef, onPortadaChange,
  logoPreview, logoRef, onLogoChange,
  hasFoto,
}: {
  fotosPersonales: FotoPersonal[]; onAgregarFoto: (f: File) => Promise<void>;
  onEliminarFoto: (id: number) => Promise<void>; uploadingFoto: boolean;
  portadaPreview: string; portadaRef: React.RefObject<HTMLInputElement>; onPortadaChange: (f: File) => void;
  logoPreview: string; logoRef: React.RefObject<HTMLInputElement>; onLogoChange: (f: File) => void;
  hasFoto: boolean;
}) {
  const fotoPersonalRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mp-sec" style={{ animationDelay: "0.06s" }}>
      <SectionHeader icon={Icons.Camera} title="Galería de perfil" />
      <div style={{ marginBottom: 22 }}>
        <div className="mp-label" style={{ marginBottom: 10 }}>
          Fotos personales
          {!hasFoto && <span className="mp-req empty">⚠ requerida</span>}
        </div>
        <div className="mp-foto-row">
          {fotosPersonales.map((f, idx) => (
            <div key={f.id_foto} className="mp-foto-wrap" style={{ animation: `scaleIn .5s cubic-bezier(.2,.9,.4,1.1) ${idx * 0.1}s both` }}>
              <div className="mp-foto-circle">
                <img src={f.url_foto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              {f.es_principal && <span className="mp-foto-badge">PRINCIPAL</span>}
              {fotosPersonales.length > 1 && (
                <button type="button" className="mp-foto-del" onClick={() => onEliminarFoto(f.id_foto)}><Icons.X /></button>
              )}
            </div>
          ))}
          {fotosPersonales.length < 3 && (
            <button type="button" className="mp-foto-add" disabled={uploadingFoto} onClick={() => fotoPersonalRef.current?.click()}>
              {uploadingFoto ? "…" : <Icons.Plus />}
            </button>
          )}
        </div>
        <input ref={fotoPersonalRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onAgregarFoto(f); e.target.value = ""; }} />
      </div>
      <div className="mp-divider" />
      <div style={{ marginBottom: 22 }}>
        <div className="mp-label" style={{ marginBottom: 8 }}>Portada <span style={{ textTransform: "none", fontWeight: 400, fontSize: 10, letterSpacing: 0 }}>— opcional, banner del perfil</span></div>
        {portadaPreview ? (
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 10 }}>
            <img src={portadaPreview} alt="Portada" style={{ width: "100%", height: 130, objectFit: "cover" }} />
            <button type="button" onClick={() => portadaRef.current?.click()}
              style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 40, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Edit /> Cambiar
            </button>
          </div>
        ) : (
          <div className="mp-portada-drop" onClick={() => portadaRef.current?.click()}>
            <Icons.Plus /> Subir foto de portada
          </div>
        )}
        <input ref={portadaRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onPortadaChange(f); e.target.value = ""; }} />
      </div>
      <div className="mp-divider" />
      <div>
        <div className="mp-label" style={{ marginBottom: 8 }}>Logo <span style={{ textTransform: "none", fontWeight: 400, fontSize: 10, letterSpacing: 0 }}>— opcional, logo o firma</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="mp-logo-box" onClick={() => logoRef.current?.click()}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Icons.Plus />}
          </div>
          <div>
            <button type="button" onClick={() => logoRef.current?.click()}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 40, padding: "8px 18px", fontFamily: C.SANS, fontSize: 13, cursor: "pointer", color: C.ink, transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Edit /> {logoPreview ? "Cambiar logo" : "Subir logo"}
            </button>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>PNG transparente recomendado</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onLogoChange(f); e.target.value = ""; }} />
        </div>
      </div>
    </div>
  );
}

function SeccionInfoArtisticaEditable({ form, set, fieldErrors, categorias }: {
  form: Record<string, any>; set: (k: string, v: string) => void;
  fieldErrors: Record<string, string>; categorias: Categoria[];
}) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.12s" }}>
      <SectionHeader icon={Icons.Palette} title="Información artística" />
      <div className="mp-fld">
        <Label text="Nombre artístico" required empty={!form.nombre_artistico} />
        <input
          className={`mp-input${!form.nombre_artistico ? " req-empty" : ""}${fieldErrors.nombre_artistico ? " field-error" : ""}`}
          value={form.nombre_artistico} onChange={e => set("nombre_artistico", e.target.value)}
          placeholder="Como aparecerás en el catálogo" />
        {fieldErrors.nombre_artistico && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.nombre_artistico}</div>}
      </div>
      <div className="mp-fld">
        <Label text="Categoría principal" required empty={!form.id_categoria_principal} />
        <select
          className={`mp-select${!form.id_categoria_principal ? " req-empty" : ""}`}
          value={form.id_categoria_principal} onChange={e => set("id_categoria_principal", e.target.value)}>
          <option value="">Selecciona una categoría</option>
          {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
        </select>
      </div>
      <div className="mp-fld">
        <Label text={`Biografía — ${form.biografia.length} caracteres`} required empty={!form.biografia} />
        <textarea
          className={`mp-textarea${!form.biografia ? " req-empty" : ""}${fieldErrors.biografia ? " field-error" : ""}`}
          rows={4} value={form.biografia} onChange={e => set("biografia", e.target.value)}
          placeholder="Cuéntanos sobre ti… (mínimo 20 caracteres)" />
        {fieldErrors.biografia && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.biografia}</div>}
      </div>
    </div>
  );
}

function SeccionContactoEditable({ form, set, fieldErrors, estados }: {
  form: Record<string, any>; set: (k: string, v: string) => void;
  fieldErrors: Record<string, string>; estados: Estado[];
}) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.18s" }}>
      <SectionHeader icon={Icons.Location} title="Contacto y ubicación" />
      <div className="mp-fld-grid">
        <div>
          <Label text="Teléfono" required empty={!form.telefono} />
          <input className={`mp-input${!form.telefono ? " req-empty" : ""}${fieldErrors.telefono ? " field-error" : ""}`}
            value={form.telefono} onChange={e => set("telefono", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10 dígitos" maxLength={10} inputMode="numeric" />
          {fieldErrors.telefono && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.telefono}</div>}
        </div>
        <div>
          <Label text="Ciudad" required empty={!form.ciudad} />
          <input className={`mp-input${!form.ciudad ? " req-empty" : ""}${fieldErrors.ciudad ? " field-error" : ""}`}
            value={form.ciudad} onChange={e => set("ciudad", e.target.value)} placeholder="Ciudad" />
          {fieldErrors.ciudad && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.ciudad}</div>}
        </div>
        <div>
          <Label text="Estado" required empty={!form.id_estado_base} />
          <select className={`mp-select${!form.id_estado_base ? " req-empty" : ""}`}
            value={form.id_estado_base} onChange={e => set("id_estado_base", e.target.value)}>
            <option value="">Selecciona un estado</option>
            {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <Label text="Código postal" required empty={!form.codigo_postal} />
          <input className={`mp-input${!form.codigo_postal ? " req-empty" : ""}${fieldErrors.codigo_postal ? " field-error" : ""}`}
            value={form.codigo_postal} onChange={e => set("codigo_postal", e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="5 dígitos" maxLength={5} inputMode="numeric" />
          {fieldErrors.codigo_postal && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.codigo_postal}</div>}
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <Label text="Dirección del taller" required empty={!form.direccion_taller} />
        <input className={`mp-input${!form.direccion_taller ? " req-empty" : ""}${fieldErrors.direccion_taller ? " field-error" : ""}`}
          value={form.direccion_taller} onChange={e => set("direccion_taller", e.target.value)}
          placeholder="Calle, número, colonia (mínimo 10 caracteres)" />
        {fieldErrors.direccion_taller && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.direccion_taller}</div>}
      </div>
    </div>
  );
}

function SeccionRedesEditable({ redes, loadingRedes, token, showToast }: {
  redes: RedSocial[]; loadingRedes: boolean; token: string;
  showToast: (m: string, t: string) => void;
}) {
  const [localRedes, setLocalRedes] = useState(redes);
  const [nuevaRed, setNuevaRed] = useState<{ red_social: string; url: string; usuario: string } | null>(null);
  const [savingRed, setSavingRed] = useState(false);
  useEffect(() => setLocalRedes(redes), [redes]);

  const redesUsadas = localRedes.map(r => r.red_social);
  const redesDisponibles = REDES_OPCIONES.filter(o => !redesUsadas.includes(o.value));

  const handleAgregar = async () => {
    if (!nuevaRed?.red_social || !nuevaRed?.url) { showToast("Selecciona la red y escribe la URL", "warn"); return; }
    if (hasSuspiciousContent(nuevaRed.url)) { showToast("La URL contiene contenido no permitido", "err"); return; }
    setSavingRed(true);
    try {
      const res = await fetch(`${API}/api/artista-portal/redes-sociales`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevaRed),
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      const data = await res.json();
      setLocalRedes(r => [...r, data.data]); setNuevaRed(null); showToast("Red social agregada", "ok");
    } catch (err) { showToast(handleNetworkError(err), "err"); }
    finally { setSavingRed(false); }
  };

  const handleEliminar = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/artista-portal/redes-sociales/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { showToast(await handleApiError(res), "err"); return; }
      setLocalRedes(r => r.filter(x => x.id_red !== id)); showToast("Red social eliminada", "ok");
    } catch (err) { showToast(handleNetworkError(err), "err"); }
  };

  return (
    <div className="mp-sec" style={{ animationDelay: "0.24s" }}>
      <SectionHeader icon={Icons.Globe} title="Redes sociales" />
      {loadingRedes ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <span className="mp-spin" />
        </div>
      ) : (
        <div>
          {localRedes.map((red, idx) => {
            const opt = REDES_OPCIONES.find(o => o.value === red.red_social);
            return (
              <div key={red.id_red} className="mp-red-row" style={{ animationDelay: `${idx * 0.07}s` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{opt?.icon ?? "🔗"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.1 }}>{opt?.label ?? red.red_social}</div>
                  <div style={{ fontSize: 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{red.url}</div>
                </div>
                <button type="button" className="mp-btn-del" onClick={() => handleEliminar(red.id_red)}><Icons.X /></button>
              </div>
            );
          })}
          {nuevaRed ? (
            <div className="mp-new-red">
              <div className="mp-fld-grid">
                <div>
                  <div className="mp-label">Red social</div>
                  <select className="mp-select" value={nuevaRed.red_social}
                    onChange={e => setNuevaRed(n => n ? { ...n, red_social: e.target.value } : n)}>
                    <option value="">Selecciona</option>
                    {redesDisponibles.map(o => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mp-label">Usuario (opcional)</div>
                  <input className="mp-input" value={nuevaRed.usuario}
                    onChange={e => setNuevaRed(n => n ? { ...n, usuario: e.target.value } : n)} placeholder="@usuario" />
                </div>
              </div>
              <div>
                <div className="mp-label">URL del perfil</div>
                <input className="mp-input" value={nuevaRed.url}
                  onChange={e => setNuevaRed(n => n ? { ...n, url: e.target.value } : n)} placeholder="https://..." />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={handleAgregar} disabled={savingRed}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 40, border: "none", background: C.orange, color: "#fff", fontWeight: 700, cursor: savingRed ? "not-allowed" : "pointer", fontFamily: C.SANS, fontSize: 13.5, transition: "all .25s" }}>
                  {savingRed ? <><span className="mp-spin" style={{ width: 14, height: 14, marginRight: 6 }} />Guardando…</> : "Agregar"}
                </button>
                <button type="button" onClick={() => setNuevaRed(null)}
                  style={{ padding: "11px 22px", borderRadius: 40, border: `1px solid ${C.border}`, background: C.inputBg, color: C.muted, cursor: "pointer", fontFamily: C.SANS, fontSize: 13.5 }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : redesDisponibles.length > 0 ? (
            <button type="button" className="mp-btn-add-red" onClick={() => setNuevaRed({ red_social: "", url: "", usuario: "" })}>
              <Icons.Plus /> Agregar red social
            </button>
          ) : (
            <p style={{ margin: 0, fontSize: 12.5, color: C.muted, textAlign: "center", padding: "8px 0" }}>
              Ya tienes todas las redes registradas
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SeccionEnviosEditable({ form, set, fieldErrors }: {
  form: Record<string, any>; set: (k: string, v: string | boolean) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="mp-sec" style={{ animationDelay: "0.3s" }}>
      <SectionHeader icon={Icons.Package} title="Política de envíos" />
      <ToggleSwitch value={form.acepta_envios} onChange={v => set("acepta_envios", v)} label="Acepto envíos a domicilio" />
      <ToggleSwitch value={form.solo_entrega_personal} onChange={v => set("solo_entrega_personal", v)} label="Solo entrega personal / en taller" />
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="mp-label">Días de preparación</div>
        <input className="mp-input" type="number" min="1" max="30" value={form.dias_preparacion_default}
          onChange={e => set("dias_preparacion_default", e.target.value)} style={{ maxWidth: 130 }} />
      </div>
      <div className="mp-fld">
        <div className="mp-label">Política de envíos</div>
        <textarea className={`mp-textarea${fieldErrors.politica_envios ? " field-error" : ""}`} rows={3}
          value={form.politica_envios} onChange={e => set("politica_envios", e.target.value)}
          placeholder="Ej: Envíos en 3–5 días hábiles…" />
        {fieldErrors.politica_envios && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.politica_envios}</div>}
      </div>
      <div className="mp-fld">
        <div className="mp-label">Política de devoluciones</div>
        <textarea className={`mp-textarea${fieldErrors.politica_devoluciones ? " field-error" : ""}`} rows={3}
          value={form.politica_devoluciones} onChange={e => set("politica_devoluciones", e.target.value)}
          placeholder="Ej: No se aceptan devoluciones…" />
        {fieldErrors.politica_devoluciones && <div className="mp-field-error"><Icons.AlertCircle /> {fieldErrors.politica_devoluciones}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BARRA DE PROGRESO (sin cambios)
───────────────────────────────────────────── */
function BarraProgreso({ camposActuales, progreso, perfilCompleto }: {
  camposActuales: ArtistaInfo; progreso: number; perfilCompleto: boolean;
}) {
  return (
    <div className={`mp-prog${perfilCompleto ? " complete" : ""}`}>
      <div className={`mp-prog-num${perfilCompleto ? " complete" : progreso > 0 ? " pulse" : ""}`}>
        {progreso}%
      </div>
      <div className="mp-prog-info">
        <div className="mp-prog-label">Completitud del perfil</div>
        <div className="mp-prog-bar">
          <div
            className={`mp-prog-fill${perfilCompleto ? " complete" : ""}`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="mp-prog-chips">
          {CAMPOS_REQUERIDOS.map((c, i) => {
            const done = !!camposActuales[c.key];
            return (
              <span
                key={c.key}
                className={`mp-chip${done ? " done" : ""}`}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                {done && <Icons.Check />} {c.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className={`mp-prog-badge${perfilCompleto ? " complete" : " incomplete"}`}>
        {perfilCompleto ? "✓ Listo para subir obras" : "Completa para subir obras"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL (con modo lectura/edición)
───────────────────────────────────────────── */
export default function MiPerfil({ artista, token, onActualizar }: Props) {
  const { showToast } = useToast();
  const portadaRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string>(artista.foto_portada ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(artista.foto_logo ?? "");
  const [fotosPersonales, setFotosPersonales] = useState<FotoPersonal[]>(artista.fotos_personales ?? []);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [loadingRedes, setLoadingRedes] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Modo lectura/edición
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState<any>(null);

  const [form, setForm] = useState({
    nombre_artistico: artista.nombre_artistico ?? "",
    biografia: artista.biografia ?? "",
    telefono: artista.telefono ?? "",
    ciudad: artista.ciudad ?? "",
    direccion_taller: artista.direccion_taller ?? "",
    codigo_postal: artista.codigo_postal ?? "",
    id_estado_base: artista.id_estado_base ? String(artista.id_estado_base) : "",
    id_categoria_principal: artista.id_categoria_principal ? String(artista.id_categoria_principal) : "",
    dias_preparacion_default: artista.dias_preparacion_default ? String(artista.dias_preparacion_default) : "3",
    acepta_envios: artista.acepta_envios ?? false,
    solo_entrega_personal: artista.solo_entrega_personal ?? false,
    politica_envios: artista.politica_envios ?? "",
    politica_devoluciones: artista.politica_devoluciones ?? "",
  });

  // Guardar respaldo al entrar en edición
  const handleEdit = () => {
    setOriginalForm({ ...form });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalForm) {
      setForm(originalForm);
      setFieldErrors({});
    }
    setIsEditing(false);
  };

  const set = (key: string, val: string | boolean) => {
    if (typeof val === "string") {
      const error = validateFieldChange(key, val);
      if (error) { setFieldErrors(p => ({ ...p, [key]: error })); setForm(f => ({ ...f, [key]: val })); return; }
      setFieldErrors(p => { const n = { ...p }; delete n[key]; return n; });
    }
    setForm(f => ({ ...f, [key]: val }));
  };

  const camposActuales: ArtistaInfo = {
    ...artista,
    foto_perfil: fotosPersonales.length > 0 ? "ok" : artista.foto_perfil,
    nombre_artistico: form.nombre_artistico,
    biografia: form.biografia,
    telefono: form.telefono,
    ciudad: form.ciudad,
    id_estado_base: form.id_estado_base ? Number(form.id_estado_base) : undefined,
    codigo_postal: form.codigo_postal,
    direccion_taller: form.direccion_taller,
    id_categoria_principal: form.id_categoria_principal ? Number(form.id_categoria_principal) : undefined,
    categoria_nombre: categorias.find(c => c.id_categoria === Number(form.id_categoria_principal))?.nombre,
    nombre_estado: estados.find(e => e.id_estado === Number(form.id_estado_base))?.nombre,
  };
  const completados = CAMPOS_REQUERIDOS.filter(c => !!camposActuales[c.key]).length;
  const progreso = Math.round((completados / CAMPOS_REQUERIDOS.length) * 100);
  const perfilCompleto = completados === CAMPOS_REQUERIDOS.length;

  // Cargar datos iniciales (estados, categorías, redes)
  useEffect(() => {
    fetch(`${API}/api/estados`).then(r => r.json()).then(d => setEstados(d.data || [])).catch(() => {});
    fetch(`${API}/api/categorias`).then(r => r.json()).then(d => setCategorias(d.data || [])).catch(() => {});
    fetch(`${API}/api/artista-portal/redes-sociales`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRedes(d.data || [])).catch(() => {}).finally(() => setLoadingRedes(false));
  }, [token]);

  const validateImgFile = (f: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { showToast("Solo JPG, PNG o WebP", "warn"); return false; }
    if (f.size > 10 * 1024 * 1024) { showToast("Máx 10 MB", "warn"); return false; }
    return true;
  };

  const agregarFotoPersonal = async (f: File) => {
    if (!validateImgFile(f)) return;
    if (fotosPersonales.length >= 3) { showToast("Máximo 3 fotos personales", "warn"); return; }
    setUploadingFoto(true);
    try {
      const fd = new FormData(); fd.append("foto", f);
      const res = await fetch(`${API}/api/artista-portal/fotos-personales`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al subir foto", "err"); return; }
      setFotosPersonales(prev => [...prev, data.data]);
      if (fotosPersonales.length === 0) onActualizar(data.data.url_foto);
      showToast("Foto agregada", "ok");
    } catch (err) { showToast(handleNetworkError(err), "err"); }
    finally { setUploadingFoto(false); }
  };

  const eliminarFotoPersonal = async (id: number) => {
    if (fotosPersonales.length <= 1) { showToast("Debes tener al menos una foto personal", "warn"); return; }
    try {
      const res = await fetch(`${API}/api/artista-portal/fotos-personales/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Error al eliminar", "err"); return; }
      setFotosPersonales(prev => {
        const next = prev.filter(f => f.id_foto !== id);
        if (next.length > 0 && !next[0].es_principal) next[0] = { ...next[0], es_principal: true };
        return next;
      });
      showToast("Foto eliminada", "ok");
    } catch (err) { showToast(handleNetworkError(err), "err"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const erroresFormato = validateAllFields(form);
    if (Object.keys(erroresFormato).length > 0) {
      setFieldErrors(p => ({ ...p, ...erroresFormato }));
      showToast("Corrige los errores antes de guardar", "err");
      return;
    }
    const campoInseguro = checkSecurityFields(form);
    if (campoInseguro) {
      showToast(`El campo "${campoInseguro}" contiene contenido no permitido`, "err");
      setFieldErrors(p => ({ ...p, [campoInseguro]: "Contenido no permitido" }));
      return;
    }
    const formSanitizado = sanitizeForm(form);
    setSaving(true);
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      let body: BodyInit;
      if (portadaFile || logoFile) {
        const fd = new FormData();
        Object.entries(formSanitizado).forEach(([k, v]) => fd.append(k, String(v)));
        if (portadaFile) fd.append("foto_portada", portadaFile);
        if (logoFile) fd.append("foto_logo", logoFile);
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(formSanitizado);
      }
      const res = await fetch(`${API}/api/artista-portal/mi-perfil`, { method: "PUT", headers, body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const isSecurityError = res.status === 400 && (data.code === "XSS_DETECTED" || data.code === "SQL_INJECTION_DETECTED");
        if (isSecurityError) showToast(`Contenido no permitido en "${data.field}"`, "err");
        else {
          showToast(await handleApiError(res), "err");
          if (res.status === 401) setTimeout(() => { globalThis.location.href = "/login"; }, 2000);
        }
        return;
      }
      const data = await res.json();
      if (data.foto_portada) setPortadaPreview(data.foto_portada);
      if (data.foto_logo) setLogoPreview(data.foto_logo);
      setPortadaFile(null); setLogoFile(null); setFieldErrors({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      showToast("Perfil actualizado correctamente", "ok");
      onActualizar(data.foto_perfil);
      // Actualizar form con los datos devueltos (para mantener sincronía)
      setForm({
        nombre_artistico: data.nombre_artistico ?? form.nombre_artistico,
        biografia: data.biografia ?? form.biografia,
        telefono: data.telefono ?? form.telefono,
        ciudad: data.ciudad ?? form.ciudad,
        direccion_taller: data.direccion_taller ?? form.direccion_taller,
        codigo_postal: data.codigo_postal ?? form.codigo_postal,
        id_estado_base: data.id_estado_base ? String(data.id_estado_base) : form.id_estado_base,
        id_categoria_principal: data.id_categoria_principal ? String(data.id_categoria_principal) : form.id_categoria_principal,
        dias_preparacion_default: data.dias_preparacion_default ? String(data.dias_preparacion_default) : form.dias_preparacion_default,
        acepta_envios: data.acepta_envios ?? form.acepta_envios,
        solo_entrega_personal: data.solo_entrega_personal ?? form.solo_entrega_personal,
        politica_envios: data.politica_envios ?? form.politica_envios,
        politica_devoluciones: data.politica_devoluciones ?? form.politica_devoluciones,
      });
      // Salir del modo edición
      setIsEditing(false);
    } catch (err) { showToast(handleNetworkError(err), "err"); }
    finally { setSaving(false); }
  };

  /* Cursor personalizado */
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.style.cursor = "none";
    let rx = 0, ry = 0, rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      const { clientX: mx, clientY: my } = e;
      if (dotRef.current) { dotRef.current.style.left = `${mx}px`; dotRef.current.style.top = `${my}px`; }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
        rafId = null;
      });
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  const cursorOn = useCallback(() => {
    dotRef.current?.classList.add("over");
    ringRef.current?.classList.add("over");
  }, []);
  const cursorOff = useCallback(() => {
    dotRef.current?.classList.remove("over");
    ringRef.current?.classList.remove("over");
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="mp-grain" />
      <div ref={dotRef} className="mp-cur-dot" />
      <div ref={ringRef} className="mp-cur-ring" />

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "clamp(40px,6vw,64px) 24px 80px", fontFamily: SANS, background: C.bgPage, minHeight: "100vh" }}>

        {/* HERO HEADER (sin cambios) */}
        <div className="mp-hero">
          <div>
            <div className="mp-eyebrow">Nu-B Studio · Portal artista</div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(48px,6.5vw,80px)", fontWeight: 900, lineHeight: .95, letterSpacing: "-.03em", color: C.ink, marginBottom: 0 }}>
              {"Mi perfil".split("").map((l, i) => (
                <span key={i} style={{
                  display: "inline-block", opacity: 0,
                  animation: `letterRise .85s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.07}s forwards`,
                }}>
                  {l === " " ? "\u00A0" : l}
                </span>
              ))}
            </h1>
            <p className="mp-hero-sub">Edita tu información pública y configuración del perfil</p>
          </div>
          <div className="mp-hero-meta">
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: .5, marginBottom: 5, textTransform: "uppercase" }}>Estado</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 18px",
              borderRadius: 40, fontSize: 13, fontWeight: 700, fontFamily: SANS,
              background: perfilCompleto ? C.successLight : `${C.orange}10`,
              border: `1px solid ${perfilCompleto ? "rgba(26,122,69,.3)" : `${C.orange}35`}`,
              color: perfilCompleto ? C.success : C.orange,
              transition: "all .6s",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: perfilCompleto ? C.success : C.orange, display: "inline-block", animation: "progPulse 2s ease-in-out infinite" }} />
              {perfilCompleto ? "Perfil completo" : "En progreso"}
            </div>
          </div>
        </div>

        {/* BARRA PROGRESO */}
        <BarraProgreso camposActuales={camposActuales} progreso={progreso} perfilCompleto={perfilCompleto} />

        {/* CONTENIDO CON MODO LECTURA/EDICIÓN */}
        <div key={isEditing ? "edit" : "view"} className="mp-mode-transition">
          {!isEditing ? (
            // MODO LECTURA
            <>
              <div className="mp-grid-2">
                <SeccionFotosReadOnly
                  fotosPersonales={fotosPersonales}
                  portadaUrl={portadaPreview}
                  logoUrl={logoPreview}
                />
                <SeccionInfoArtisticaReadOnly artista={camposActuales} />
              </div>
              <div className="mp-grid-2">
                <SeccionContactoReadOnly artista={camposActuales} />
                <SeccionRedesReadOnly redes={redes} />
              </div>
              <div className="mp-grid-2">
                <SeccionEnviosReadOnly artista={camposActuales} />
                <SeccionCuentaReadOnly artista={artista} />
              </div>
              <button
                type="button"
                onClick={handleEdit}
                className="mp-save-btn mp-edit-btn"
                onMouseEnter={cursorOn}
                onMouseLeave={cursorOff}
              >
                ✏️ Editar perfil
              </button>
            </>
          ) : (
            // MODO EDICIÓN
            <form onSubmit={handleSubmit}>
              <div className="mp-grid-2">
                <SeccionFotosEditable
                  fotosPersonales={fotosPersonales}
                  onAgregarFoto={agregarFotoPersonal}
                  onEliminarFoto={eliminarFotoPersonal}
                  uploadingFoto={uploadingFoto}
                  portadaPreview={portadaPreview}
                  portadaRef={portadaRef}
                  onPortadaChange={f => { if (validateImgFile(f)) { setPortadaFile(f); setPortadaPreview(URL.createObjectURL(f)); } }}
                  logoPreview={logoPreview}
                  logoRef={logoRef}
                  onLogoChange={f => { if (validateImgFile(f)) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }}
                  hasFoto={!!camposActuales.foto_perfil}
                />
                <SeccionInfoArtisticaEditable form={form} set={set} fieldErrors={fieldErrors} categorias={categorias} />
              </div>
              <div className="mp-grid-2">
                <SeccionContactoEditable form={form} set={set} fieldErrors={fieldErrors} estados={estados} />
                <SeccionRedesEditable redes={redes} loadingRedes={loadingRedes} token={token} showToast={showToast} />
              </div>
              <div className="mp-grid-2">
                <SeccionEnviosEditable form={form} set={set} fieldErrors={fieldErrors} />
                <SeccionCuentaReadOnly artista={artista} />
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mp-save-btn mp-cancel-btn"
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`mp-save-btn${saveSuccess ? " success" : ""}`}
                  onMouseEnter={cursorOn}
                  onMouseLeave={cursorOff}
                >
                  {saving ? <><span className="mp-spin" />Guardando…</> : saveSuccess ? "✓ Guardado" : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ height: 48 }} />
      </div>
    </>
  );
}