// src/pages/public/Privacidad.tsx
import LegalPage from "./legal/LegalPage";
import { PRIVACIDAD } from "./legal/privacidadData";

export default function Privacidad() {
  return <LegalPage doc={PRIVACIDAD} other={{ to: "/terminos", label: "Ver Términos y Condiciones" }} />;
}
