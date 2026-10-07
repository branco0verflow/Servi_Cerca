"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, LinkIcon, TriangleAlert } from "lucide-react";

import { PieLegal } from "@/components/legal/documento-legal";
import { OperadorFormulario, ValoresFormulario, ValoresIniciales } from "@/components/registro/registro-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedTheme } from "@/hooks/use-saved-theme";
import {
  Borrador,
  OperadorMe,
  actualizarBorrador,
  actualizarPublicacion,
  agregarPublicacion,
  cambiarFoto,
  canjearEnlace,
  cerrarSesionOperador,
  eliminarPublicacion,
  enviarARevision,
  obtenerBorrador,
  obtenerMe,
  quitarFoto,
} from "@/lib/operator-api";
import { RUTA_PRIVACIDAD, RUTA_TERMINOS } from "@/lib/legal";
import { PublicApiError } from "@/lib/public-api";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "enlace-invalido" }
  | { tipo: "no-editable"; mensaje: string }
  | { tipo: "en-revision" }
  | { tipo: "editando"; borrador: Borrador; motivoRechazo: string | null }
  | { tipo: "enviado" }
  | { tipo: "error" };

/** Con sesión abierta: decide si el operador puede editar o si ya tiene cambios en revisión. */
async function cargarEstado(): Promise<Estado> {
  const me: OperadorMe = await obtenerMe();
  if (me.versionEnCurso?.estadoVersion === "PENDIENTE_REVISION") return { tipo: "en-revision" };
  const borrador = await obtenerBorrador();
  if (borrador.estadoVersion === "PENDIENTE_REVISION") return { tipo: "en-revision" };
  return { tipo: "editando", borrador, motivoRechazo: me.ultimoRechazo?.motivoRechazo ?? null };
}

function aEstadoDeError(e: unknown): Estado {
  if (e instanceof PublicApiError) {
    if (e.status === 401 || e.status === 403) return { tipo: "enlace-invalido" };
    if (e.code === "OPERADOR_NO_EDITABLE") return { tipo: "no-editable", mensaje: e.message };
    if (e.code === "VERSION_EN_REVISION") return { tipo: "en-revision" };
  }
  return { tipo: "error" };
}

export function OperadorAcceso() {
  const theme = useSavedTheme();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [aviso, setAviso] = useState<string | null>(null);
  // Cambia para volver a montar el formulario con los datos actuales del servidor.
  const [version, setVersion] = useState(0);
  const iniciado = useRef(false);

  useEffect(() => {
    // En desarrollo React ejecuta los efectos dos veces y el token es de un solo uso.
    if (iniciado.current) return;
    iniciado.current = true;

    // El token viaja en el fragmento (#token=…), que el navegador nunca envía al servidor.
    // Se quita de la barra de direcciones antes de usarlo y no se guarda en ningún lado.
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    (token ? canjearEnlace(token) : Promise.resolve())
      .then(cargarEstado)
      .then(setEstado)
      .catch((e) => setEstado(aEstadoDeError(e)));
  }, []);

  async function enviar(valores: ValoresFormulario) {
    setAviso(null);
    try {
      await actualizarBorrador(valores.datos);
      if (valores.fotoPerfil) await cambiarFoto(valores.fotoPerfil);
      else if (valores.fotoQuitada) await quitarFoto();
      // Primero se quitan publicaciones, para no superar el máximo al agregar las nuevas.
      for (const id of valores.publicacionesQuitadas) await eliminarPublicacion(id);
      for (const p of valores.publicaciones) {
        if (p.id !== undefined) await actualizarPublicacion(p.id, p.datos, p.imagen);
      }
      for (const p of valores.publicaciones) {
        if (p.id === undefined) await agregarPublicacion(p.datos, p.imagen as File);
      }
      await enviarARevision();
    } catch (e) {
      const nuevoEstado = aEstadoDeError(e);
      if (nuevoEstado.tipo !== "error") {
        setEstado(nuevoEstado);
        return;
      }
      // Parte de los cambios pudo haberse guardado: se recarga el borrador para mostrar lo que quedó.
      const mensaje = e instanceof PublicApiError ? e.message : "No se pudo conectar con el servidor.";
      try {
        setEstado(await cargarEstado());
        setVersion((v) => v + 1);
        setAviso(`${mensaje} No se envió a revisión. Revisá los datos (puede que falte alguna imagen) y volvé a enviar.`);
      } catch (otro) {
        setEstado(aEstadoDeError(otro));
      }
      return;
    }
    // El enlace es de un solo uso: al enviar se cierra la sesión.
    await cerrarSesionOperador().catch(() => {});
    setEstado({ tipo: "enviado" });
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <Link href="/" aria-label="Servi Cerca, inicio">
            <Image
              src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
              alt="Servi Cerca"
              width={2172}
              height={724}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {estado.tipo === "cargando" && (
          <div className="space-y-6" aria-busy="true" aria-label="Cargando">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {estado.tipo === "enlace-invalido" && (
          <Mensaje
            icono={<LinkIcon className="size-8" />}
            titulo="Este enlace ya no es válido"
            texto="Los enlaces de edición sirven una sola vez y vencen a las 24 horas. Pedinos uno nuevo por WhatsApp, respondiendo al contacto de Servi Cerca."
          />
        )}

        {estado.tipo === "no-editable" && (
          <Mensaje icono={<TriangleAlert className="size-8" />} titulo="Tu perfil no se puede editar ahora" texto={estado.mensaje} />
        )}

        {estado.tipo === "error" && (
          <Mensaje
            icono={<TriangleAlert className="size-8" />}
            titulo="No pudimos cargar tus datos"
            texto="Revisá tu conexión y recargá la página. Si el problema sigue, pedinos un enlace nuevo por WhatsApp."
          />
        )}

        {estado.tipo === "en-revision" && (
          <Mensaje
            icono={<Clock3 className="size-8" />}
            titulo="Tus cambios están en revisión"
            texto="La revisión puede tardar hasta 24 horas. Mientras tanto, tu perfil se sigue mostrando con los datos anteriores. Te avisamos por WhatsApp cuando esté resuelto."
          />
        )}

        {estado.tipo === "enviado" && (
          <Mensaje
            icono={<Check className="size-8" />}
            exito
            titulo="¡Enviamos tus cambios a revisión!"
            texto="La revisión puede tardar hasta 24 horas. Mientras tanto, tu perfil se sigue mostrando con los datos anteriores. Cuando los aprobemos te avisamos por WhatsApp. Para volver a editar, pedinos un enlace nuevo."
          />
        )}

        {estado.tipo === "editando" && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Editá tu perfil</h1>
            <p className="mt-2 mb-8 text-muted-foreground">
              Cambiá lo que necesites y envialo a revisión. Tu perfil actual sigue visible hasta que aprobemos los
              cambios.
            </p>

            {estado.motivoRechazo && !aviso && (
              <Banner>
                <strong>Tu envío anterior no fue aprobado.</strong> Motivo: {estado.motivoRechazo}
              </Banner>
            )}
            {aviso && <Banner>{aviso}</Banner>}

            <OperadorFormulario
              key={version}
              inicial={aValoresIniciales(estado.borrador)}
              avisoTitulo="La revisión puede tardar hasta 24 horas."
              avisoTexto="Las imágenes nuevas se suben recién cuando enviás los cambios. Hasta que los aprobemos, tu perfil se sigue mostrando como está ahora."
              textoBoton="Enviar cambios a revisión"
              enviar={enviar}
            />
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Tus datos se tratan según la{" "}
              <Link href={RUTA_PRIVACIDAD} target="_blank" className="underline">
                Política de privacidad
              </Link>{" "}
              y los{" "}
              <Link href={RUTA_TERMINOS} target="_blank" className="underline">
                Términos y condiciones
              </Link>{" "}
              que aceptaste al registrarte.
            </p>
          </>
        )}
        <PieLegal className="mt-12" />
      </main>
    </div>
  );
}

function aValoresIniciales(borrador: Borrador): ValoresIniciales {
  return {
    nombre: borrador.nombre,
    apellido: borrador.apellido,
    nombreComercial: borrador.nombreComercial,
    descripcion: borrador.descripcion,
    email: borrador.email,
    telefono: borrador.telefono,
    // El backend guarda 598XXXXXXXX; se muestra con + para que se lea como número internacional.
    whatsapp: `+${borrador.whatsapp}`,
    trabajoRemoto: borrador.trabajoRemoto,
    localidadIds: borrador.localidades.map((l) => l.id),
    oficios: borrador.oficios,
    trabajoNoEncontrado: borrador.trabajoNoEncontrado,
    fotoPerfilUrl: borrador.fotoPerfilUrl,
    publicaciones: borrador.publicaciones,
  };
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mb-6 flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p>{children}</p>
    </div>
  );
}

function Mensaje({
  icono,
  titulo,
  texto,
  exito = false,
}: {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
  exito?: boolean;
}) {
  return (
    <div className="rounded-(--radius) border border-border bg-card p-8 text-center sm:p-12">
      <span
        className={`mx-auto mb-5 grid size-16 place-items-center rounded-full ${exito ? "bg-emerald-500/15 text-emerald-500" : "bg-secondary text-muted-foreground"}`}
      >
        {icono}
      </span>
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">{texto}</p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Ir al inicio</Link>
      </Button>
    </div>
  );
}
