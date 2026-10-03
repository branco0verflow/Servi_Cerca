"use client";

import Link from "next/link";

import { DocumentoLegal, Pendiente, SeccionLegal } from "@/components/legal/documento-legal";
import { RUTA_TERMINOS } from "@/lib/legal";

const SECCIONES: SeccionLegal[] = [
  {
    id: "responsable",
    titulo: "Responsable de los datos",
    contenido: (
      <>
        <p>
          El responsable de la base de datos es <Pendiente>nombre o razón social del titular</Pendiente>, RUT{" "}
          <Pendiente>número de RUT</Pendiente>, con domicilio en <Pendiente>domicilio</Pendiente>, Uruguay. Contacto
          para temas de datos personales: <Pendiente>email de contacto</Pendiente>.
        </p>
        <p>
          Tratamos los datos conforme a la Ley N.º 18.331 de Protección de Datos Personales y su Decreto reglamentario N.º
          414/009. La base de datos se encuentra inscripta ante la Unidad Reguladora y de Control de Datos Personales
          (URCDP) con el número <Pendiente>número de inscripción</Pendiente>.
        </p>
      </>
    ),
  },
  {
    id: "datos-profesionales",
    titulo: "Datos de los Profesionales",
    contenido: (
      <>
        <p>Al registrarse o modificar su perfil, el Profesional nos brinda:</p>
        <ul>
          <li>Nombre, apellido y, si tiene, nombre comercial.</li>
          <li>Email, teléfono y número de WhatsApp.</li>
          <li>Localidades donde trabaja, servicios que ofrece, descripciones y precios de referencia.</li>
          <li>Foto de perfil y publicaciones con imágenes, títulos y descripciones.</li>
        </ul>
        <p>
          También registramos la fecha de registro, la versión de estos documentos que aceptó, el historial de
          revisiones de su perfil (fechas, resultado y motivo de rechazo, si lo hubo) y los enlaces de edición
          generados.
        </p>
        <p>
          <strong>Qué se publica.</strong> Una vez aprobado, el perfil muestra públicamente nombre, apellido, nombre
          comercial, descripción, foto, teléfono, WhatsApp, localidades, servicios, precios de referencia, publicaciones
          y las calificaciones aprobadas. <strong>El email no se publica</strong>: lo usamos solo para comunicarnos con
          el Profesional. Al publicar su perfil, el Profesional consiente que estos datos sean visibles para cualquier
          persona que visite el Sitio.
        </p>
      </>
    ),
  },
  {
    id: "datos-calificaciones",
    titulo: "Datos de quienes califican",
    contenido: (
      <>
        <p>Cuando alguien califica a un Profesional, guardamos:</p>
        <ul>
          <li>El puntaje, el comentario y, si lo indica, su nombre.</li>
          <li>La fecha de envío y el resultado de la revisión.</li>
          <li>
            Un código derivado de su dirección IP mediante una función criptográfica con clave secreta (hash). La IP
            no se guarda: el código solo sirve para aplicar el límite de una calificación por persona y Profesional
            cada 30 días y detectar envíos repetidos. No se muestra públicamente ni se usa para identificar a la
            persona.
          </li>
        </ul>
        <p>
          <strong>Qué se publica.</strong> Si la calificación se aprueba, se muestran el puntaje, el comentario, el nombre
          indicado y la fecha. No pidas ni incluyas en el comentario datos personales tuyos o de terceros que no quieras
          que se publiquen.
        </p>
      </>
    ),
  },
  {
    id: "datos-navegacion",
    titulo: "Datos de navegación, cookies y almacenamiento local",
    contenido: (
      <>
        <p>
          Para que el Sitio funcione de forma segura, el servidor procesa la dirección IP de cada solicitud para limitar
          intentos abusivos (por ejemplo, demasiados envíos seguidos). Ese control se hace en memoria y no se guarda;
          los registros técnicos del servidor pueden incluir la IP de intentos fallidos de acceso al panel de
          administración, que se conservan por <Pendiente>plazo</Pendiente> con fines de seguridad.
        </p>
        <p>Usamos solo cookies y almacenamiento técnicos, necesarios para el funcionamiento:</p>
        <ul>
          <li>
            <code>XSRF-TOKEN</code>: cookie de seguridad que protege los formularios contra falsificación de
            solicitudes.
          </li>
          <li>
            <code>SC_SESSION</code>: cookie de sesión, solo para el administrador y para el Profesional mientras edita su
            perfil con un enlace.
          </li>
          <li>
            Almacenamiento del navegador: el tema claro u oscuro elegido y la última búsqueda (esta última se borra al
            cerrar la pestaña).
          </li>
        </ul>
        <p>
          No usamos cookies de publicidad ni de seguimiento de terceros. Si en el futuro incorporamos herramientas de
          medición, actualizaremos esta Política.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para qué usamos los datos",
    contenido: (
      <ul>
        <li>Publicar los perfiles de los Profesionales y permitir que los Usuarios los encuentren y contacten.</li>
        <li>Revisar registros, cambios y calificaciones antes de publicarlos.</li>
        <li>
          Comunicarnos con los Profesionales sobre el estado de su perfil y enviarles los enlaces de edición que
          soliciten.
        </li>
        <li>Prevenir fraudes, abusos y calificaciones falsas, y mantener la seguridad del Sitio.</li>
        <li>Cumplir obligaciones legales.</li>
      </ul>
    ),
  },
  {
    id: "base-legal",
    titulo: "Base legal",
    contenido: (
      <p>
        Tratamos los datos con el consentimiento de sus titulares, que el Profesional otorga al registrarse y aceptar
        estos documentos, y quien califica al enviar su calificación. El consentimiento puede revocarse en cualquier
        momento, sin efecto retroactivo, solicitando la baja del perfil o la eliminación de la calificación.
      </p>
    ),
  },
  {
    id: "terceros",
    titulo: "Con quién compartimos los datos",
    contenido: (
      <>
        <p>No vendemos ni cedemos datos personales. Los datos se tratan con estos proveedores, que actúan por cuenta nuestra:</p>
        <ul>
          <li>
            <strong>Amazon Web Services (AWS)</strong>: almacena las fotos e imágenes en servidores ubicados en São Paulo,
            Brasil. Las imágenes son privadas y se muestran mediante enlaces temporales.
          </li>
          <li>
            <Pendiente>proveedor de alojamiento del sitio y la base de datos, y país</Pendiente>.
          </li>
        </ul>
        <p>
          Algunos de estos proveedores están fuera de Uruguay, por lo que existe una transferencia internacional de
          datos, que se realiza con las garantías exigidas por la normativa vigente.
        </p>
        <p>
          Cuando un Usuario contacta a un Profesional, lo hace por WhatsApp (servicio de Meta Platforms) o por teléfono,
          fuera del Sitio. Esa comunicación se rige por las políticas de esos servicios.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    titulo: "Cuánto tiempo conservamos los datos",
    contenido: (
      <ul>
        <li>
          <strong>Perfiles publicados</strong>: mientras el perfil exista. Las versiones anteriores se conservan como
          historial de revisiones.
        </li>
        <li>
          <strong>Registros rechazados o perfiles dados de baja</strong>: <Pendiente>plazo</Pendiente> desde el rechazo o
          la baja, y luego se eliminan.
        </li>
        <li>
          <strong>Calificaciones</strong>: mientras exista el perfil del Profesional. Las rechazadas se conservan{" "}
          <Pendiente>plazo</Pendiente> para prevenir abusos.
        </li>
        <li>
          <strong>Imágenes reemplazadas o descartadas</strong>: se eliminan automáticamente del almacenamiento.
        </li>
      </ul>
    ),
  },
  {
    id: "derechos",
    titulo: "Tus derechos",
    contenido: (
      <>
        <p>
          Como titular de los datos tenés derecho a acceder a ellos y a solicitar su rectificación, actualización,
          inclusión o supresión (artículos 14 y 15 de la Ley N.º 18.331).
        </p>
        <p>
          Para ejercerlos escribí a <Pendiente>email de contacto</Pendiente> indicando qué solicitás y un dato que nos
          permita verificar que sos el titular (por ejemplo, escribiendo desde el WhatsApp o email registrados). Responderemos
          dentro de los 5 días hábiles previstos por la ley.
        </p>
        <p>
          Los Profesionales también pueden modificar sus datos solicitando un enlace de edición. Si considerás que tus
          derechos no fueron atendidos, podés presentar una denuncia ante la Unidad Reguladora y de Control de Datos
          Personales (URCDP).
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    titulo: "Seguridad",
    contenido: (
      <p>
        Aplicamos medidas técnicas y organizativas para proteger los datos: conexiones cifradas, imágenes privadas con
        acceso temporal, enlaces de edición de un solo uso de los que solo guardamos un código cifrado, contraseña de
        administración guardada con cifrado irreversible y límites contra intentos abusivos. Ningún sistema es
        completamente infalible; si detectamos un incidente que afecte tus datos, te lo informaremos según la normativa.
      </p>
    ),
  },
  {
    id: "menores",
    titulo: "Menores de edad",
    contenido: <p>El Sitio no está dirigido a menores de 18 años y no recolectamos sus datos a sabiendas.</p>,
  },
  {
    id: "cambios",
    titulo: "Cambios en esta Política",
    contenido: (
      <p>
        Podemos actualizar esta Política. La versión y la fecha de vigencia figuran al comienzo. Si los cambios son
        importantes, se informará a los Profesionales antes de que entren en vigencia. Ver también los{" "}
        <Link href={RUTA_TERMINOS} className="text-primary underline">
          Términos y condiciones
        </Link>
        .
      </p>
    ),
  },
];

export function PrivacidadContenido() {
  return (
    <DocumentoLegal
      titulo="Política de privacidad"
      intro={
        <p>
          En esta Política explicamos qué datos personales tratamos en Servi Cerca, para qué los usamos, con quién los
          compartimos y cómo podés ejercer tus derechos, tanto si sos un Profesional que publica su perfil como si
          buscás un servicio o dejás una calificación.
        </p>
      }
      secciones={SECCIONES}
    />
  );
}
