// src/components/ProtectedImage.tsx
// Protección visual de obras de arte NU★B Studio
import React, { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  alt?: string;
  imgStyle?: React.CSSProperties;
  wrapStyle?: React.CSSProperties;
  className?: string;
  /** En true usa canvas (sin <img> en DOM). Requiere CORS en el server. */
  useCanvas?: boolean;
}

// ── Marca de agua ───────────────────────────────────────────────
// mix-blend-mode: difference garantiza visibilidad en CUALQUIER fondo:
// resultado = |255 - pixel|  →  oscuro sobre claro, claro sobre oscuro

const WM = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">` +
  `<text transform="rotate(-38,90,90)" x="-50" y="55"  font-size="11" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.55)" font-weight="700" letter-spacing="5">NU&#9733;B STUDIO</text>` +
  `<text transform="rotate(-38,90,90)" x="-50" y="118" font-size="11" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.55)" font-weight="700" letter-spacing="5">NU&#9733;B STUDIO</text>` +
  `<text transform="rotate(-38,90,90)" x="-50" y="181" font-size="11" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.55)" font-weight="700" letter-spacing="5">NU&#9733;B STUDIO</text>` +
  `</svg>`
);

const prevent = (e: React.MouseEvent | React.DragEvent | React.TouchEvent) =>
  e.preventDefault();

// ── Versión Canvas (sin <img> en el DOM) ─────────────────────────
function CanvasImage({ src, wrapStyle, imgStyle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Marca de agua en canvas (baked-in, no removible con DevTools)
      ctx.save();
      ctx.rotate(-0.66); // ~-38 grados
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.letterSpacing = "6px";
      const step = 220;
      for (let y = -canvas.width; y < canvas.width + canvas.height; y += step) {
        for (let x = -canvas.height; x < canvas.width + canvas.height; x += step * 1.6) {
          ctx.fillText("NU★B STUDIO", x, y);
        }
      }
      ctx.restore();
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error) {
    return (
      <div style={{ ...wrapStyle, background: "#ece9e4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#9896A8" }}>Imagen no disponible</span>
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", overflow: "hidden", ...wrapStyle }}
      onContextMenu={prevent}
      onDragStart={prevent}
    >
      <canvas
        ref={canvasRef}
        style={{ ...imgStyle, display: "block" }}
      />
      {/* Capa extra de protección sobre el canvas */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4, userSelect: "none" }} />
    </div>
  );
}

// ── Versión estándar con overlay dual ────────────────────────────
export default function ProtectedImage({ src, alt = "", imgStyle, wrapStyle, className, useCanvas = false }: Props) {
  const [blurred, setBlurred] = useState(false);

  // Detectar PrintScreen y mostrar advertencia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        setBlurred(true);
        setTimeout(() => setBlurred(false), 1800);
      }
    };
    // Detectar captura de pantalla (Android/iOS parcialmente)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setBlurred(true);
        setTimeout(() => setBlurred(false), 1200);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (useCanvas) {
    return <CanvasImage src={src} wrapStyle={wrapStyle} imgStyle={imgStyle} />;
  }

  return (
    <div
      style={{ position: "relative", overflow: "hidden", ...wrapStyle }}
      onContextMenu={prevent}
      onDragStart={prevent}
      onTouchStart={prevent}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={className}
        style={{
          ...imgStyle,
          pointerEvents: "none",
          userSelect: "none",
          filter: blurred
            ? `${(imgStyle?.filter ?? "")} blur(18px)`
            : (imgStyle?.filter ?? undefined),
          transition: "filter .25s",
        }}
      />

      {/* Marca de agua — difference garantiza visibilidad en cualquier imagen */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
        backgroundImage: `url("data:image/svg+xml,${WM}")`,
        backgroundRepeat: "repeat",
        mixBlendMode: "difference",
      }} />

      {/* Capa 3 — bloquea selección e interacción */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        userSelect: "none",
        WebkitUserSelect: "none",
      }} onContextMenu={prevent} onDragStart={prevent} />
    </div>
  );
}
