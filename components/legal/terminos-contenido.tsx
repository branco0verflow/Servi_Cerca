"use client";

import Link from "next/link";

import { DocumentoLegal, Pendiente, SeccionLegal } from "@/components/legal/documento-legal";
import { RUTA_PRIVACIDAD } from "@/lib/legal";

const SECCIONES: SeccionLegal[] = [
  {
    id: "titular",
    titulo: "Quién presta el servicio",
    contenido: (
      <>
        <p>
          El sitio Servi Cerca (en adelante, &quot;el Sitio&quot; o &quot;Servi Cerca&quot;) es administrado por{" "}
          <Pendiente>nombre o razón social del titular</Pendiente>, RUT <Pendiente>número de RUT</Pendiente>, con
          domicilio en <Pendiente>domicilio</Pendiente>, Uruguay.
        </p>
        <p>
          Para cualquier consulta sobre estos Términos podés escribir a <Pendiente>email de contacto</Pendiente>.
        </p>
      </>
    ),
  },
  {
    id: "que-es",
    titulo: "Qué es Servi Cerca",
    contenido: (
      <>
        <p>
          Servi Cerca es un directorio que permite encontrar profesionales y trabajadores independientes (en adelante,
          &quot;Profesionales&quot;) que ofrecen sus servicios en distintas localidades, y contactarlos directamente por
          WhatsApp o teléfono.
        </p>
        <p>
          Servi Cerca <strong>no presta los servicios publicados</strong>, no es empleador ni representante de los
          Profesionales y <strong>no es parte de los acuerdos</strong> que las personas que buscan un servicio (en
          adelante, &quot;Usuarios&quot;) celebren con ellos. El precio, la forma de pago, los plazos, la calidad y
          cualquier otra condición del servicio se acuerdan directamente entre el Usuario y el Profesional.
        </p>
        <p>
          El contacto ocurre fuera del Sitio, a través de WhatsApp u otros medios, que se rigen por sus propios términos.
          Servi Cerca no tiene acceso a esas conversaciones.
        </p>
      </>
    ),
  },
  {
    id: "aceptacion",
    titulo: "Aceptación de estos Términos",
    contenido: (
      <>
        <p>
          Al usar el Sitio aceptás estos Términos y condiciones y la{" "}
          <Link href={RUTA_PRIVACIDAD} className="text-primary underline">
            Política de privacidad
          </Link>
          . Los Profesionales los aceptan de forma expresa al registrarse. Si no estás de acuerdo, no uses el Sitio.
        </p>
        <p>El Sitio está dirigido a personas mayores de 18 años.</p>
      </>
    ),
  },
  {
    id: "usuarios",
    titulo: "Uso del Sitio por quienes buscan un servicio",
    contenido: (
      <>
        <p>La búsqueda y el contacto con los Profesionales son gratuitos para los Usuarios.</p>
        <p>
          La información de cada perfil (servicios, precios de referencia, localidades, descripción e imágenes) la
          proporciona el propio Profesional. Los precios publicados son orientativos (&quot;desde&quot;) y el precio
          final se acuerda con el Profesional.
        </p>
        <p>
          Antes de contratar, te recomendamos confirmar con el Profesional el alcance del trabajo, el precio y, cuando
          corresponda, las habilitaciones o permisos que exija la actividad.
        </p>
      </>
    ),
  },
  {
    id: "profesionales",
    titulo: "Registro y perfil de los Profesionales",
    contenido: (
      <>
        <p>Para publicar un perfil, el Profesional debe:</p>
        <ul>
          <li>Ser mayor de 18 años y tener capacidad legal para contratar.</li>
          <li>
            Brindar datos verdaderos, completos y actualizados, y contar con las habilitaciones, permisos o seguros que
            su actividad requiera.
          </li>
          <li>
            Publicar solo imágenes y textos propios o sobre los que tenga derechos, que correspondan a su trabajo, y no
            incluir datos o imágenes de terceros sin su autorización.
          </li>
        </ul>
        <p>
          <strong>Revisión.</strong> Cada registro y cada cambio se revisa antes de publicarse; la revisión puede tardar
          hasta 24 horas. Servi Cerca puede aprobar o rechazar un perfil o un cambio, indicando el motivo, e informa el
          resultado al WhatsApp registrado.
        </p>
        <p>
          <strong>Distintivo &quot;Verificado&quot;.</strong> Indica que Servi Cerca revisó la información enviada por el
          Profesional antes de publicarla. <strong>No certifica</strong> su idoneidad, títulos, habilitaciones,
          antecedentes ni la calidad de sus servicios.
        </p>
        <p>
          <strong>Modificaciones.</strong> Para cambiar sus datos, el Profesional lo solicita por WhatsApp al contacto de
          Servi Cerca. Se le envía al WhatsApp registrado un enlace personal de un solo uso, válido por 24 horas. Los
          cambios vuelven a revisarse y, mientras tanto, se sigue mostrando el perfil anterior. El enlace es personal y
          no debe compartirse.
        </p>
        <p>
          <strong>Costo.</strong> Actualmente publicar un perfil es gratuito. Si en el futuro se establecen costos, se
          informarán con anticipación y requerirán la aceptación del Profesional. <Pendiente>confirmar</Pendiente>
        </p>
      </>
    ),
  },
  {
    id: "calificaciones",
    titulo: "Calificaciones",
    contenido: (
      <>
        <p>
          Los Usuarios pueden calificar a un Profesional con un puntaje de 1 a 5, un comentario y, si lo desean, su
          nombre. Al calificar, el Usuario declara que contrató o recibió un servicio de ese Profesional.
        </p>
        <ul>
          <li>Las calificaciones deben basarse en una experiencia real y ser respetuosas.</li>
          <li>
            Todas se revisan antes de publicarse. Servi Cerca puede rechazar las que no correspondan a un servicio
            realizado, contengan insultos, datos personales de terceros, publicidad o contenido ilícito, o parezcan
            enviadas varias veces por la misma persona.
          </li>
          <li>Se admite una calificación por persona y Profesional cada 30 días.</li>
          <li>Solo las calificaciones aprobadas se muestran y se tienen en cuenta en el promedio.</li>
          <li>Las calificaciones expresan la opinión de quien las escribe, no la de Servi Cerca.</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibido",
    titulo: "Usos no permitidos",
    contenido: (
      <>
        <p>No está permitido:</p>
        <ul>
          <li>Publicar información falsa, engañosa o que suplante a otra persona.</li>
          <li>Ofrecer servicios ilícitos o que requieran habilitaciones que no se tienen.</li>
          <li>Publicar contenido ofensivo, discriminatorio, violento, sexual o que infrinja derechos de terceros.</li>
          <li>Usar el Sitio para enviar publicidad no solicitada o recolectar datos de otras personas.</li>
          <li>
            Intentar acceder sin autorización, interferir con el funcionamiento del Sitio o usar programas automáticos
            para extraer información o enviar calificaciones.
          </li>
        </ul>
        <p>
          Ante un incumplimiento, Servi Cerca puede rechazar o retirar contenido, y suspender o dar de baja un perfil.
        </p>
      </>
    ),
  },
  {
    id: "contenido",
    titulo: "Contenido publicado y propiedad intelectual",
    contenido: (
      <>
        <p>
          El Profesional conserva los derechos sobre los textos e imágenes que publica y autoriza a Servi Cerca, sin
          costo, a almacenarlos, adaptarlos al formato del Sitio y mostrarlos en él mientras el perfil esté publicado.
        </p>
        <p>
          La marca, el diseño y el software de Servi Cerca pertenecen a su titular y no pueden usarse sin autorización.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidad",
    titulo: "Responsabilidad",
    contenido: (
      <>
        <p>
          Servi Cerca actúa como intermediario de información. En la medida permitida por la ley, no es responsable por:
        </p>
        <ul>
          <li>La ejecución, calidad, seguridad, precio o resultado de los servicios contratados con los Profesionales.</li>
          <li>Los acuerdos, pagos, daños o reclamos que surjan entre Usuarios y Profesionales.</li>
          <li>La veracidad de la información que cada Profesional publica sobre sí mismo.</li>
          <li>Las opiniones expresadas en las calificaciones.</li>
        </ul>
        <p>
          Si detectás un perfil falso, contenido inapropiado o un problema con un Profesional, escribinos a{" "}
          <Pendiente>email de contacto</Pendiente> para que podamos revisarlo.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidad",
    titulo: "Disponibilidad del Sitio",
    contenido: (
      <p>
        Procuramos que el Sitio funcione de forma continua, pero puede haber interrupciones por mantenimiento, fallas
        técnicas o causas ajenas. Servi Cerca puede modificar, suspender o discontinuar funciones del Sitio.
      </p>
    ),
  },
  {
    id: "cambios",
    titulo: "Cambios en estos Términos",
    contenido: (
      <p>
        Podemos actualizar estos Términos. La versión y la fecha de vigencia figuran al comienzo de este documento. Si los
        cambios son importantes, se informará a los Profesionales por WhatsApp o email antes de que entren en vigencia.
      </p>
    ),
  },
  {
    id: "ley",
    titulo: "Ley aplicable y jurisdicción",
    contenido: (
      <p>
        Estos Términos se rigen por las leyes de la República Oriental del Uruguay. Ante cualquier controversia serán
        competentes los tribunales de <Pendiente>ciudad / departamento</Pendiente>, sin perjuicio de los derechos que
        la ley de relaciones de consumo (Ley N.º 17.250) reconozca a los consumidores.
      </p>
    ),
  },
];

export function TerminosContenido() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      intro={
        <p>
          Estos Términos regulan el uso de Servi Cerca por parte de quienes buscan un servicio y de los Profesionales que
          publican su perfil. Te pedimos que los leas con atención.
        </p>
      }
      secciones={SECCIONES}
    />
  );
}
