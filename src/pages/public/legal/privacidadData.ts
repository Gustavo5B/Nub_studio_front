// src/pages/public/legal/privacidadData.ts
import { type LegalDoc, RFC, EMAIL, DOMICILIO } from "./legalTypes";

export const PRIVACIDAD: LegalDoc = {
  title: "Aviso de Privacidad",
  subtitle: "NU★B Studio — Protección de Datos Personales",
  version: "1.0",
  updated: "17 de noviembre de 2025",
  intro: {
    t: "box",
    k: "important",
    x: "**IMPORTANTE:** Este Aviso de Privacidad cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento vigente en México.",
  },
  sections: [
    {
      id: "responsable",
      title: "1. Información del responsable",
      blocks: [
        { t: "p", x: "**Razón Social:** NU★B Studio" },
        { t: "p", x: `**RFC:** ${RFC}` },
        { t: "p", x: `**Domicilio:** ${DOMICILIO}` },
        { t: "p", x: `**Correo electrónico para consultas de privacidad:** ${EMAIL}` },
      ],
    },
    {
      id: "marco-legal",
      title: "2. Marco legal",
      blocks: [
        { t: "p", x: "Esta Política de Privacidad se rige por:" },
        {
          t: "ul",
          x: [
            "Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)",
            "Reglamento de la LFPDPPP",
            "Lineamientos del Aviso de Privacidad emitidos por el INAI",
            "Ley Federal del Derecho de Autor (en materia de obras de arte)",
          ],
        },
      ],
    },
    {
      id: "datos",
      title: "3. Tipos de usuarios y datos recolectados",
      blocks: [
        { t: "h3", x: "3.1 Categorías de usuarios" },
        { t: "p", x: "Nuestra plataforma atiende a:" },
        {
          t: "ul",
          x: [
            "**Artistas:** Creadores que ofertan sus obras de arte",
            "**Compradores:** Personas físicas que adquieren obras de arte",
            "**Visitantes:** Usuarios que navegan sin registrarse",
          ],
        },
        { t: "h3", x: "3.2 Datos personales recolectados" },
        {
          t: "table",
          head: ["Categoría", "Datos específicos", "Obligatorio"],
          rows: [
            ["**Identificación**", "Nombre completo · Correo electrónico · Número de teléfono · Dirección completa · Documento de identificación oficial (artistas)", "Sí"],
            ["**Financieros**", "Información de tarjetas (procesada por terceros) · Datos bancarios para transferencias · Historial de transacciones", "Para compras"],
            ["**Obras de arte**", "Imágenes y fotografías de obras · Información de autoría · Certificados de autenticidad · Historial de propiedad", "Para artistas"],
            ["**Navegación**", "Dirección IP · Tipo de navegador · Páginas visitadas · Tiempo de permanencia", "Automático"],
          ],
        },
        { t: "h3", x: "3.3 Datos sensibles (Artículo 3, fracción VI LFPDPPP)" },
        {
          t: "box",
          k: "warning",
          x: "**CONSENTIMIENTO EXPRESO REQUERIDO:** Solo con su autorización explícita podremos recabar:",
          list: ["Origen étnico (para arte con relevancia cultural)", "Información sobre discapacidades (para accesibilidad)"],
        },
      ],
    },
    {
      id: "finalidades",
      title: "4. Finalidades del tratamiento",
      blocks: [
        { t: "h3", x: "4.1 Finalidades primarias (Artículo 12 LFPDPPP)" },
        { t: "p", x: "Estas finalidades NO requieren consentimiento adicional, ya que son necesarias para la relación jurídica:" },
        {
          t: "ol",
          x: [
            "Gestión de cuentas de usuario en la plataforma",
            "Procesamiento de transacciones de compra-venta",
            "Verificación de identidad de usuarios",
            "Comunicación relacionada con servicios contratados",
            "Cumplimiento de obligaciones fiscales (emisión de facturas, CFDI)",
            "Cumplimiento de obligaciones legales",
            "Atención a quejas y reclamaciones",
            "Entrega de obras adquiridas",
          ],
        },
        { t: "h3", x: "4.2 Finalidades secundarias" },
        { t: "p", x: "Para estas finalidades, PUEDE OPONERSE en cualquier momento:" },
        {
          t: "ul",
          x: [
            "Mejora de servicios mediante análisis de navegación",
            "Estudios estadísticos y de mercado",
            "Marketing directo (previa autorización)",
            "Envío de boletines y promociones",
            "Personalización de experiencia de usuario",
          ],
        },
        { t: "box", k: "info", x: `**¿No desea recibir comunicaciones de marketing?** Puede darse de baja en cualquier momento enviando un correo a ${EMAIL} o usando el enlace en nuestros correos.` },
      ],
    },
    {
      id: "obras",
      title: "5. Derechos intelectuales y obras de arte",
      blocks: [
        { t: "h3", x: "5.1 Declaración de autoría" },
        { t: "p", x: "Al subir una obra de arte a nuestra plataforma, el artista **DECLARA BAJO PROTESTA DE DECIR VERDAD** que:" },
        {
          t: "ul",
          x: [
            "Es el legítimo propietario de los derechos patrimoniales de la obra",
            "Cuenta con autorización expresa del autor en caso de no ser el creador original",
            "La obra no infringe derechos de terceros",
            "Asume toda responsabilidad legal derivada de posibles conflictos de autoría",
          ],
        },
        { t: "h3", x: "5.2 Licencia de uso" },
        { t: "p", x: "El artista otorga a NU★B Studio una licencia **no exclusiva, limitada y revocable** para:" },
        {
          t: "ul",
          x: [
            "Mostrar las imágenes de las obras en la plataforma",
            "Realizar las reproducciones necesarias para el funcionamiento del servicio",
            "Crear miniaturas y versiones optimizadas para visualización web",
            "Utilizar las obras en materiales promocionales de la plataforma",
          ],
        },
        { t: "box", k: "success", x: "**Importante:** Esta licencia NO constituye cesión de derechos patrimoniales. El artista conserva todos sus derechos de autor." },
      ],
    },
    {
      id: "transferencias",
      title: "6. Transferencias de datos",
      blocks: [
        { t: "p", x: "Conforme al artículo 37 de la LFPDPPP, sus datos podrán ser transferidos a:" },
        { t: "h3", x: "6.1 Transferencias nacionales" },
        {
          t: "ul",
          x: [
            "**Instituciones financieras:** Para procesamiento de pagos (ej. Stripe, PayPal, Mercado Pago)",
            "**Empresas de mensajería:** Para entrega de obras (ej. Estafeta, DHL, FedEx)",
            "**Autoridades fiscales:** SAT, para cumplimiento de obligaciones tributarias",
            "**Autoridades judiciales:** Solo cuando sea legalmente requerido por orden judicial",
          ],
        },
        { t: "h3", x: "6.2 Transferencias internacionales" },
        {
          t: "box",
          k: "info",
          x: "Algunos servicios que utilizamos están alojados en servidores fuera de México:",
          list: [
            "**Amazon Web Services (AWS):** Hosting de la plataforma (Estados Unidos)",
            "**Cloudflare:** Seguridad y CDN (Estados Unidos)",
          ],
        },
        { t: "p", x: "**Estas empresas cumplen con estándares de protección equivalentes a la legislación mexicana.**" },
      ],
    },
    {
      id: "cookies",
      title: "7. Uso de cookies y tecnologías similares",
      blocks: [
        { t: "h3", x: "7.1 ¿Qué son las cookies?" },
        { t: "p", x: "Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web." },
        { t: "h3", x: "7.2 Tipos de cookies que utilizamos" },
        {
          t: "table",
          head: ["Tipo", "Propósito", "Duración"],
          rows: [
            ["**Esenciales**", "Mantener sesiones de usuario, seguridad", "Sesión"],
            ["**Funcionales**", "Recordar preferencias, idioma", "1 año"],
            ["**Analíticas**", "Estadísticas de uso (Google Analytics)", "2 años"],
            ["**Marketing**", "Publicidad personalizada (opcional)", "1 año"],
          ],
        },
        { t: "h3", x: "7.3 Administración de cookies" },
        { t: "p", x: "Puede configurar su navegador para:" },
        {
          t: "ul",
          x: ["Rechazar todas las cookies", "Aceptar solo cookies esenciales", "Recibir notificaciones antes de aceptar cookies"],
        },
        { t: "p", x: "**Nota:** Rechazar cookies puede limitar algunas funcionalidades de la plataforma." },
      ],
    },
    {
      id: "seguridad",
      title: "8. Medidas de seguridad",
      blocks: [
        { t: "p", x: "Implementamos medidas de seguridad **administrativas, técnicas y físicas** conforme al artículo 19 de la LFPDPPP:" },
        { t: "h3", x: "8.1 Medidas técnicas" },
        {
          t: "ul",
          x: [
            "Encriptación SSL/TLS en todas las comunicaciones",
            "Hashing de contraseñas con bcrypt (12 rounds)",
            "Firewall y protección contra ataques DDoS",
            "Monitoreo continuo de vulnerabilidades",
            "Respaldos automáticos diarios",
          ],
        },
        { t: "h3", x: "8.2 Medidas administrativas" },
        {
          t: "ul",
          x: [
            "Capacitación continua del personal en protección de datos",
            "Políticas internas de manejo de información",
            "Acuerdos de confidencialidad con empleados",
            "Auditorías periódicas de seguridad",
          ],
        },
        { t: "h3", x: "8.3 Medidas físicas" },
        {
          t: "ul",
          x: [
            "Servidores en centros de datos certificados (ISO 27001)",
            "Control de acceso físico restringido",
            "Sistemas de respaldo de energía",
          ],
        },
      ],
    },
    {
      id: "derechos-arco",
      title: "9. Derechos ARCO (Artículos 22-25 LFPDPPP)",
      blocks: [
        { t: "p", x: "Usted tiene derecho a:" },
        { t: "h3", x: "9.1 Acceso" },
        { t: "p", x: "Conocer qué datos personales tenemos sobre usted, para qué los usamos y las condiciones de uso." },
        { t: "h3", x: "9.2 Rectificación" },
        { t: "p", x: "Solicitar la corrección de datos personales inexactos o incompletos." },
        { t: "h3", x: "9.3 Cancelación" },
        { t: "p", x: "Solicitar la eliminación de sus datos cuando considere que no se requieren para alguna finalidad establecida." },
        { t: "h3", x: "9.4 Oposición" },
        { t: "p", x: "Oponerse al tratamiento de sus datos personales para finalidades específicas." },
        { t: "h3", x: "9.5 Revocación del consentimiento" },
        { t: "p", x: "Retirar su consentimiento para el tratamiento de datos, sin que esto afecte tratamientos realizados previamente." },
        { t: "h3", x: "9.6 Limitación de uso y divulgación" },
        { t: "p", x: "Limitar el uso o divulgación de sus datos personales." },
      ],
    },
    {
      id: "procedimiento-arco",
      title: "10. Procedimiento para ejercer derechos ARCO",
      blocks: [
        { t: "h3", x: "10.1 Solicitud" },
        { t: "p", x: "Para ejercer sus derechos ARCO, envíe una solicitud a:" },
        {
          t: "contact",
          title: "Contacto de privacidad",
          lines: [`**Email:** ${EMAIL}`, "**Asunto:** \"Solicitud de Derechos ARCO - [Su Nombre]\""],
        },
        { t: "h3", x: "10.2 Requisitos de la solicitud" },
        { t: "p", x: "La solicitud debe incluir:" },
        {
          t: "ol",
          x: [
            "Nombre completo del titular",
            "Domicilio u otro medio para recibir notificaciones",
            "Documentos que acrediten su identidad (INE, pasaporte)",
            "Descripción clara de los datos sobre los que ejerce el derecho",
            "Cualquier documento que facilite la localización de sus datos",
          ],
        },
        { t: "h3", x: "10.3 Plazos de respuesta" },
        {
          t: "ul",
          x: [
            "**20 días hábiles:** Para dar respuesta a su solicitud",
            "**15 días hábiles:** Para hacer efectiva la respuesta (desde la aceptación)",
            "Los plazos pueden extenderse por 20 días más en casos justificados",
          ],
        },
      ],
    },
    {
      id: "conservacion",
      title: "11. Conservación de datos",
      blocks: [
        { t: "p", x: "Los datos personales serán conservados durante:" },
        {
          t: "table",
          head: ["Tipo de dato", "Periodo de conservación"],
          rows: [
            ["Datos de cuenta activa", "Mientras la cuenta esté activa"],
            ["Historial de transacciones", "5 años (obligación fiscal - SAT)"],
            ["Datos de usuarios inactivos", "2 años desde última actividad"],
            ["Cookies analíticas", "2 años"],
            ["Datos eliminados por el usuario", "30 días (respaldo de seguridad)"],
          ],
        },
      ],
    },
    {
      id: "menores",
      title: "12. Datos de menores de edad",
      blocks: [
        { t: "box", k: "warning", x: "**IMPORTANTE:** No recolectamos intencionalmente datos de menores de 18 años. Si identificamos que un menor proporcionó datos sin consentimiento de sus padres o tutores, procederemos a la eliminación inmediata de la información." },
      ],
    },
    {
      id: "modificaciones",
      title: "13. Modificaciones al aviso de privacidad",
      blocks: [
        { t: "p", x: "Cualquier modificación a este Aviso será notificada mediante:" },
        {
          t: "ul",
          x: [
            "Correo electrónico a usuarios registrados",
            "Aviso visible en nuestro sitio web (7 días previos)",
            "Notificación al iniciar sesión",
          ],
        },
        { t: "p", x: "El uso continuado de la plataforma después de las modificaciones constituye su aceptación." },
      ],
    },
    {
      id: "autoridad",
      title: "14. Autoridad de control",
      blocks: [
        {
          t: "box",
          k: "info",
          x: "**Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).** Para cualquier inconformidad relacionada con el tratamiento de datos personales, puede dirigirse al INAI:",
          list: [
            "**Sitio web:** https://home.inai.org.mx",
            "**Teléfono:** 800 835 4324",
            "**Plataforma SIDEEC:** Para iniciar procedimientos de protección de derechos",
          ],
        },
      ],
    },
    {
      id: "consentimiento",
      title: "15. Consentimiento",
      blocks: [
        { t: "p", x: "Al utilizar nuestros servicios, registrarse en la plataforma o proporcionar sus datos personales, usted otorga su **consentimiento expreso** para el tratamiento de los mismos conforme a este Aviso de Privacidad." },
        { t: "box", k: "success", x: "**Consentimiento informado:** Confirmo que he leído y comprendido este Aviso de Privacidad y acepto el tratamiento de mis datos personales conforme a lo establecido." },
      ],
    },
    {
      id: "contacto",
      title: "16. Contacto",
      blocks: [
        {
          t: "contact",
          title: "¿Dudas sobre privacidad?",
          lines: [
            "**Responsable de Protección de Datos:** NU★B Studio",
            `**Email:** ${EMAIL}`,
            "**Horario:** Lunes a Viernes, 9:00 - 18:00 hrs (Hora del Centro)",
            `**Domicilio:** ${DOMICILIO}`,
          ],
        },
      ],
    },
  ],
};
