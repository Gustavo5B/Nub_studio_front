// src/pages/public/Terminos.tsx
import LegalPage from "./legal/LegalPage";
import { TERMINOS } from "./legal/terminosData";

export default function Terminos() {
  return <LegalPage doc={TERMINOS} other={{ to: "/privacidad", label: "Ver Aviso de Privacidad" }} />;
}
