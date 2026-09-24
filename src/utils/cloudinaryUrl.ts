/**
 * Optimiza URLs de Cloudinary añadiendo transformaciones automáticas.
 *
 * Sin esto, se descarga la imagen original (puede ser 4-8 MB).
 * Con esto, Cloudinary sirve WebP/AVIF al tamaño exacto de display (~90% menos peso).
 *
 * Uso:
 *   clImg(url, { w: 400 })           → thumbnail de catálogo
 *   clImg(url, { w: 800 })           → detalle de obra
 *   clImg(url, { w: 60, h: 60 })     → avatar cuadrado
 *   clImg(url)                        → solo f_auto + q_auto, sin resize
 */

interface CloudinaryOptions {
  w?: number;   // ancho en px (Cloudinary escala manteniendo proporción)
  h?: number;   // alto en px (opcional, para recortes)
  q?: number | "auto";  // calidad 1-100 o "auto"
  crop?: "fill" | "fit" | "scale" | "thumb";
}

export function clImg(url: string | null | undefined, opts: CloudinaryOptions = {}): string {
  if (!url) return "";

  // Solo procesar URLs de Cloudinary
  if (!url.includes("res.cloudinary.com")) return url;

  const { w, h, q = "auto", crop = "fill" } = opts;

  // Construir string de transformaciones
  const parts: string[] = ["f_auto", `q_${q}`];
  if (w) parts.push(`w_${w}`);
  if (h) parts.push(`h_${h}`);
  if ((w || h) && crop) parts.push(`c_${crop}`);

  const transform = parts.join(",");

  // Insertar transformaciones después de /upload/
  // Antes: .../image/upload/v1234/nub-studio/obra.jpg
  // Después: .../image/upload/f_auto,q_auto,w_400,c_fill/v1234/nub-studio/obra.jpg
  return url.replace("/upload/", `/upload/${transform}/`);
}
