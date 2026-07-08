// Sanitizador de HTML para contenido que se renderiza con
// dangerouslySetInnerHTML (posts del blog/foro). Defensa en
// profundidad: el backend ya rechaza patrones XSS al crear el
// post, pero el HTML almacenado nunca debe confiarse tal cual.
const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed", "form", "link", "meta", "base", "style"];
const URL_ATTRS = ["href", "src", "xlink:href", "formaction", "action"];

const isDangerousUrl = (value: string): boolean => {
  // Elimina espacios/control chars que se usan para evadir (jav\tascript:)
  const limpio = value.replace(/[\s\u0000-\u001f]/g, "").toLowerCase();
  return (
    limpio.startsWith("javascript:") ||
    limpio.startsWith("vbscript:") ||
    limpio.startsWith("data:text/html")
  );
};

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll(FORBIDDEN_TAGS.join(",")).forEach((el) => el.remove());

  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      } else if (URL_ATTRS.includes(name) && isDangerousUrl(attr.value)) {
        el.removeAttribute(attr.name);
      } else if (name === "style" && /expression\s*\(|javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}
