// src/pages/public/legal/legalTypes.ts
// Estructura de los documentos legales. El texto de **negritas** se escribe con doble asterisco.

export type LegalBlock =
  | { t: "p"; x: string }
  | { t: "h3"; x: string }
  | { t: "ul"; x: string[] }
  | { t: "ol"; x: string[] }
  | { t: "box"; k: "important" | "info" | "warning" | "success"; x: string; list?: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "contact"; title: string; lines: string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  subtitle: string;
  version: string;
  updated: string;
  intro?: LegalBlock;
  sections: LegalSection[];
}

// Datos pendientes de completar (aparecen tal cual en las páginas)
export const RFC = "[INSERTAR RFC]";
export const EMAIL = "[INSERTAR EMAIL DE CONTACTO]";
export const DOMICILIO =
  "Carretera México Laredo, Chapulhuacán Hidalgo #2, Barrio la Estación, Hidalgo, México";
