// src/pages/public/legal/terminosData.ts
import { type LegalDoc, RFC, EMAIL, DOMICILIO } from "./legalTypes";

export const TERMINOS: LegalDoc = {
  title: "Términos y Condiciones",
  subtitle: "NU★B Studio — Marketplace de Arte de la Huasteca",
  version: "1.0",
  updated: "17 de noviembre de 2025",
  sections: [
    {
      id: "responsable",
      title: "1. Información del responsable",
      blocks: [
        { t: "p", x: "**Razón Social:** NU★B Studio" },
        { t: "p", x: `**RFC:** ${RFC}` },
        { t: "p", x: `**Domicilio:** ${DOMICILIO}` },
        { t: "p", x: `**Correo electrónico:** ${EMAIL}` },
      ],
    },
    {
      id: "aceptacion",
      title: "2. Aceptación de los términos",
      blocks: [
        { t: "p", x: "Al registrarse, acceder o utilizar los servicios de NU★B Studio, usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, **NO debe utilizar nuestros servicios**." },
        { t: "box", k: "important", x: "**IMPORTANTE:** El uso continuado de nuestra plataforma constituye la aceptación de cualquier modificación a estos términos." },
      ],
    },
    {
      id: "definiciones",
      title: "3. Definiciones",
      blocks: [
        {
          t: "ul",
          x: [
            "**Plataforma:** El sitio web y aplicaciones de NU★B Studio.",
            "**Usuario:** Cualquier persona que acceda a la plataforma.",
            "**Artista:** Usuario que publica obras de arte para venta.",
            "**Comprador:** Usuario que adquiere obras de arte.",
            "**Obra:** Cualquier pieza de arte publicada en la plataforma (fotografías, pinturas, esculturas, etc.).",
            "**Transacción:** Proceso de compra-venta realizado a través de la plataforma.",
          ],
        },
      ],
    },
    {
      id: "requisitos",
      title: "4. Requisitos para uso del servicio",
      blocks: [
        { t: "h3", x: "4.1 Capacidad legal" },
        { t: "p", x: "Para utilizar nuestros servicios, usted debe:" },
        {
          t: "ul",
          x: [
            "Ser mayor de 18 años o tener autorización de un tutor legal",
            "Tener capacidad legal para celebrar contratos vinculantes",
            "No estar prohibido de utilizar servicios de comercio electrónico bajo las leyes de México",
          ],
        },
        { t: "h3", x: "4.2 Registro de cuenta" },
        { t: "p", x: "Para utilizar ciertas funciones, debe crear una cuenta proporcionando:" },
        {
          t: "ul",
          x: ["Información veraz, precisa y actualizada", "Un correo electrónico válido", "Una contraseña segura"],
        },
        { t: "box", k: "warning", x: "**RESPONSABILIDAD:** Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Notifique inmediatamente cualquier uso no autorizado." },
      ],
    },
    {
      id: "roles",
      title: "5. Roles y responsabilidades",
      blocks: [
        { t: "h3", x: "5.1 Obligaciones de los artistas" },
        { t: "p", x: "Los artistas que publiquen obras en la plataforma **DECLARAN BAJO PROTESTA DE DECIR VERDAD** que:" },
        {
          t: "ol",
          x: [
            "**Autoría:** Son los legítimos propietarios de los derechos patrimoniales de la obra o cuentan con autorización expresa del autor.",
            "**Originalidad:** Las obras no infringen derechos de terceros (derechos de autor, marcas, patentes).",
            "**Calidad:** Las imágenes publicadas representan fielmente la obra física.",
            "**Disponibilidad:** Las obras publicadas están disponibles para venta inmediata.",
            "**Precio:** Los precios indicados incluyen impuestos aplicables.",
            "**Descripción veraz:** Toda la información proporcionada (materiales, dimensiones, técnica) es precisa.",
          ],
        },
        { t: "box", k: "important", x: "**PROPIEDAD INTELECTUAL:** El artista conserva todos los derechos de autor sobre sus obras. Al publicar en NU★B Studio, otorga una licencia no exclusiva para mostrar las obras en la plataforma con fines de comercialización." },
        { t: "h3", x: "5.2 Obligaciones de los compradores" },
        { t: "p", x: "Los compradores se comprometen a:" },
        {
          t: "ol",
          x: [
            "Proporcionar información de pago válida y autorizada",
            "Completar las transacciones iniciadas",
            "Recibir las obras en el domicilio indicado",
            "Respetar los derechos de autor de las obras adquiridas",
            "No reproducir, copiar o distribuir las obras sin autorización del artista",
          ],
        },
      ],
    },
    {
      id: "compraventa",
      title: "6. Proceso de compra-venta",
      blocks: [
        { t: "h3", x: "6.1 Publicación de obras" },
        {
          t: "ul",
          x: [
            "NU★B Studio se reserva el derecho de rechazar o eliminar obras que violen estos términos",
            "Las obras deben cumplir con estándares de calidad de imagen establecidos",
            "No se permiten obras con contenido ilegal, ofensivo o que violen derechos de terceros",
          ],
        },
        { t: "h3", x: "6.2 Precio y comisiones" },
        {
          t: "ul",
          x: [
            "Los precios se muestran en pesos mexicanos (MXN)",
            "NU★B Studio cobra una comisión del [X]% por cada venta exitosa",
            "Los precios incluyen IVA (16%) según legislación mexicana",
            "El artista recibirá el pago dentro de [X] días hábiles después de la entrega confirmada",
          ],
        },
        { t: "h3", x: "6.3 Proceso de compra" },
        {
          t: "ol",
          x: [
            "El comprador selecciona la obra y procede al pago",
            "El pago se procesa a través de pasarelas seguras autorizadas",
            "Se notifica al artista para preparar el envío",
            "El artista envía la obra con número de rastreo",
            "El comprador confirma la recepción",
            "Se libera el pago al artista",
          ],
        },
        { t: "h3", x: "6.4 Envío y entrega" },
        {
          t: "ul",
          x: [
            "El tiempo de envío varía según la ubicación (5-15 días hábiles)",
            "Los costos de envío se calculan según peso y destino",
            "El artista es responsable del empaque seguro de la obra",
            "NU★B Studio no se hace responsable por daños durante el envío si el empaque es inadecuado",
          ],
        },
      ],
    },
    {
      id: "devoluciones",
      title: "7. Política de devoluciones y reembolsos",
      blocks: [
        { t: "h3", x: "7.1 Derecho de desistimiento" },
        { t: "p", x: "Conforme a la Ley Federal de Protección al Consumidor, el comprador tiene derecho a desistir de la compra dentro de los **5 días hábiles** posteriores a la recepción, siempre que:" },
        {
          t: "ul",
          x: [
            "La obra se encuentre en las mismas condiciones en que fue entregada",
            "Se incluya el empaque original y documentación",
            "No haya sido dañada por uso inadecuado",
          ],
        },
        { t: "h3", x: "7.2 Casos de devolución aceptados" },
        { t: "ul", x: ["Obra dañada durante el envío", "Obra significativamente diferente a la descripción", "Obra equivocada enviada"] },
        { t: "h3", x: "7.3 Casos NO elegibles para devolución" },
        {
          t: "ul",
          x: [
            "Arrepentimiento del comprador después de 5 días hábiles",
            "Daños causados por el comprador",
            "Diferencias subjetivas de percepción de color o estilo",
            "Obras personalizadas bajo pedido",
          ],
        },
      ],
    },
    {
      id: "propiedad-intelectual",
      title: "8. Propiedad intelectual",
      blocks: [
        { t: "h3", x: "8.1 Derechos de las obras" },
        { t: "p", x: "La compra de una obra física **NO** transfiere los derechos de autor al comprador. El artista conserva:" },
        {
          t: "ul",
          x: ["Derechos de reproducción", "Derechos de distribución", "Derechos de exhibición pública", "Derechos morales (paternidad e integridad)"],
        },
        { t: "h3", x: "8.2 Uso permitido por el comprador" },
        { t: "p", x: "El comprador puede:" },
        { t: "ul", x: ["Exhibir la obra en espacios privados", "Revender la obra física (derecho de primera venta)"] },
        { t: "h3", x: "8.3 Uso NO permitido" },
        { t: "p", x: "El comprador NO puede:" },
        {
          t: "ul",
          x: [
            "Reproducir la obra en cualquier formato",
            "Crear obras derivadas",
            "Usar la obra con fines comerciales sin autorización",
            "Eliminar firmas, marcas de agua o créditos del artista",
          ],
        },
        { t: "h3", x: "8.4 Contenido de la plataforma" },
        { t: "p", x: "Todo el contenido de NU★B Studio (diseño, código, textos, logos) está protegido por derechos de autor y no puede ser reproducido sin autorización." },
      ],
    },
    {
      id: "conducta",
      title: "9. Conducta prohibida",
      blocks: [
        { t: "p", x: "Queda estrictamente prohibido:" },
        {
          t: "ul",
          x: [
            "Publicar contenido ilegal, difamatorio, obsceno o discriminatorio",
            "Infringir derechos de propiedad intelectual de terceros",
            "Realizar fraudes, estafas o transacciones falsas",
            "Utilizar la plataforma para actividades ilegales",
            "Intentar acceder sin autorización a cuentas de otros usuarios",
            "Realizar ingeniería inversa, descompilar o modificar la plataforma",
            "Enviar spam, malware o contenido malicioso",
            "Manipular precios o realizar ofertas falsas",
          ],
        },
        { t: "box", k: "warning", x: "**CONSECUENCIAS:** Cualquier violación a estas prohibiciones resultará en la **suspensión inmediata de la cuenta** y posibles acciones legales." },
      ],
    },
    {
      id: "responsabilidad",
      title: "10. Limitación de responsabilidad",
      blocks: [
        { t: "h3", x: "10.1 Rol de NU★B Studio" },
        { t: "p", x: "NU★B Studio actúa como **intermediario** entre artistas y compradores. No somos responsables de:" },
        {
          t: "ul",
          x: [
            "La calidad, legalidad o autenticidad de las obras publicadas",
            "La capacidad de los artistas para cumplir con las ventas",
            "Disputas entre compradores y artistas",
            "Daños o pérdidas durante el envío (salvo negligencia comprobable)",
            "El valor de inversión futuro de las obras adquiridas",
          ],
        },
        { t: "h3", x: "10.2 Exclusión de garantías" },
        { t: "p", x: "La plataforma se proporciona \"TAL CUAL\" sin garantías de ningún tipo, incluyendo:" },
        {
          t: "ul",
          x: ["Disponibilidad ininterrumpida del servicio", "Ausencia de errores o bugs", "Seguridad absoluta contra ciberataques"],
        },
        { t: "h3", x: "10.3 Límite de indemnización" },
        { t: "p", x: "En caso de disputas, la responsabilidad de NU★B Studio se limita al monto de la comisión cobrada en la transacción específica en controversia." },
      ],
    },
    {
      id: "datos-personales",
      title: "11. Protección de datos personales",
      blocks: [
        { t: "p", x: "El tratamiento de sus datos personales se rige por nuestro **Aviso de Privacidad**, disponible en /privacidad. Al aceptar estos Términos, también acepta dicho Aviso." },
        { t: "box", k: "info", x: `**Derechos ARCO:** Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición contactando a ${EMAIL}.` },
      ],
    },
    {
      id: "modificaciones",
      title: "12. Modificaciones a los términos",
      blocks: [
        { t: "p", x: "NU★B Studio se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán notificadas mediante:" },
        { t: "ul", x: ["Correo electrónico a usuarios registrados", "Aviso visible en la plataforma", "Notificación al iniciar sesión"] },
        { t: "p", x: "El uso continuado de la plataforma después de las modificaciones constituye su aceptación." },
      ],
    },
    {
      id: "suspension",
      title: "13. Suspensión y terminación",
      blocks: [
        { t: "h3", x: "13.1 Suspensión de cuenta" },
        { t: "p", x: "NU★B Studio puede suspender o cancelar cuentas que:" },
        {
          t: "ul",
          x: [
            "Violen estos Términos y Condiciones",
            "Realicen actividades fraudulentas",
            "Reciban múltiples quejas justificadas",
            "Permanezcan inactivas por más de 2 años",
          ],
        },
        { t: "h3", x: "13.2 Terminación voluntaria" },
        { t: "p", x: "Los usuarios pueden eliminar su cuenta en cualquier momento desde la configuración. Los datos se eliminarán conforme al Aviso de Privacidad." },
      ],
    },
    {
      id: "disputas",
      title: "14. Resolución de disputas",
      blocks: [
        { t: "h3", x: "14.1 Mediación interna" },
        { t: "p", x: "En caso de conflictos, las partes se comprometen a intentar resolverlos mediante mediación facilitada por NU★B Studio antes de acudir a instancias legales." },
        { t: "h3", x: "14.2 Jurisdicción" },
        { t: "p", x: "Para cualquier controversia derivada de estos Términos, las partes se someten a la jurisdicción de los tribunales de **Hidalgo, México**, renunciando a cualquier otra que pudiera corresponderles." },
        { t: "h3", x: "14.3 Ley aplicable" },
        { t: "p", x: "Estos Términos se rigen por las leyes de México, incluyendo:" },
        {
          t: "ul",
          x: [
            "Código Civil Federal",
            "Código de Comercio",
            "Ley Federal de Protección al Consumidor",
            "Ley Federal del Derecho de Autor",
            "Ley Federal de Protección de Datos Personales",
          ],
        },
      ],
    },
    {
      id: "generales",
      title: "15. Disposiciones generales",
      blocks: [
        {
          t: "ul",
          x: [
            "**Divisibilidad:** Si alguna disposición es declarada inválida, las demás seguirán vigentes.",
            "**Renuncia:** La falta de ejercicio de un derecho no constituye renuncia al mismo.",
            "**Cesión:** Los usuarios no pueden ceder estos Términos sin consentimiento de NU★B Studio.",
            "**Acuerdo completo:** Estos Términos constituyen el acuerdo completo entre las partes.",
          ],
        },
      ],
    },
    {
      id: "contacto",
      title: "16. Contacto y soporte",
      blocks: [
        {
          t: "contact",
          title: "¿Dudas o consultas?",
          lines: [
            `**Email:** ${EMAIL}`,
            "**Horario de atención:** Lunes a Viernes, 9:00 - 18:00 hrs (Hora del Centro)",
            "**Domicilio:** Carretera México Laredo, Chapulhuacán Hidalgo #2, Barrio la Estación",
          ],
        },
      ],
    },
    {
      id: "consentimiento",
      title: "17. Consentimiento",
      blocks: [
        { t: "p", x: "Al registrarse, hacer clic en \"Acepto los Términos y Condiciones\" o utilizar nuestros servicios, usted confirma que:" },
        {
          t: "ul",
          x: [
            "Ha leído y comprendido estos Términos en su totalidad",
            "Acepta cumplir con todas las disposiciones aquí establecidas",
            "Tiene capacidad legal para celebrar este acuerdo",
          ],
        },
      ],
    },
  ],
};
