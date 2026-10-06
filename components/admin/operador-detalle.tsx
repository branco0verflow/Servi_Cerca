"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ImageOff, Link2, MessageCircle, Star, X } from "lucide-react";
import { toast } from "sonner";

import { useAdminError } from "@/components/admin/admin-shell";
import { SuscripcionTarjeta } from "@/components/admin/suscripcion-tarjeta";
import { EstadoOperadorBadge, fecha } from "@/components/admin/operadores-section";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminApiError,
  Diferencias,
  EnlaceEdicion,
  OperadorDetalle,
  VersionDetalle,
  VersionRevision,
  aprobarVersion,
  obtenerOperador,
  obtenerRevision,
  generarEnlaceEdicion,
  reactivarOperador,
  rechazarVersion,
  suspenderOperador,
} from "@/lib/admin-api";

// Nombres legibles de los campos que informa el backend al comparar versiones.
const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  nombreComercial: "Nombre comercial",
  descripcion: "Descripción",
  email: "Email",
  telefono: "Teléfono",
  whatsapp: "WhatsApp",
  fotoPerfil: "Foto de perfil",
};

const TIPO_PUBLICACION = {
  TRABAJO_REALIZADO: "Trabajo realizado",
  SERVICIO_DESTACADO: "Servicio destacado",
  PRODUCTO: "Producto",
} as const;

type Confirmacion = "aprobar" | "suspender" | null;

type DatosOperador = { operador: OperadorDetalle; revision: VersionRevision | null };

/** El operador y la versión a mostrar: la pendiente o, si no tiene nada publicado, la última enviada. */
async function obtenerDatos(id: number): Promise<DatosOperador> {
  const operador = await obtenerOperador(id);
  const pendiente = operador.versiones.find((v) => v.estadoVersion === "PENDIENTE_REVISION");
  const ultima = [...operador.versiones].sort((a, b) => b.numeroVersion - a.numeroVersion)[0];
  const aMostrar = pendiente ?? (operador.versionPublicada ? undefined : ultima);
  return { operador, revision: aMostrar ? await obtenerRevision(aMostrar.versionId) : null };
}

export function OperadorDetalleSection({ id }: { id: number }) {
  const manejarError = useAdminError();
  const [detalle, setDetalle] = useState<OperadorDetalle | null>(null);
  // Revisión de la versión pendiente; si no hay ni versión publicada, la última versión enviada.
  const [revision, setRevision] = useState<VersionRevision | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [confirmando, setConfirmando] = useState<Confirmacion>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);

  const aplicar = useCallback((datos: DatosOperador) => {
    setRevision(datos.revision);
    setDetalle(datos.operador);
  }, []);

  useEffect(() => {
    let vigente = true;
    obtenerDatos(id)
      .then((datos) => vigente && aplicar(datos))
      .catch((e) => {
        if (e instanceof AdminApiError && e.status === 404) setNoEncontrado(true);
        else manejarError(e);
      });
    return () => {
      vigente = false;
    };
  }, [id, aplicar, manejarError]);

  async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
    setProcesando(true);
    try {
      await accion();
      toast.success(mensaje);
      setConfirmando(null);
      setRechazando(false);
      setMotivo("");
      aplicar(await obtenerDatos(id));
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(false);
    }
  }

  if (noEncontrado) {
    return (
      <div>
        <Volver />
        <p className="mt-6 text-muted-foreground">El operador no existe.</p>
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pendiente = revision?.versionSolicitada.estadoVersion === "PENDIENTE_REVISION" ? revision : null;
  const datos: VersionDetalle | null = revision?.versionSolicitada ?? detalle.versionPublicada;
  // Los avisos van siempre al número ya aprobado, no al que figure en cambios todavía sin revisar.
  const contacto = detalle.versionPublicada ?? datos;
  const porNumero = [...detalle.versiones].sort((a, b) => b.numeroVersion - a.numeroVersion);
  const ultimaVersion = porNumero[0];
  const ultimoRechazo = porNumero.find((v) => v.estadoVersion === "RECHAZADA" && v.motivoRechazo);
  const cambiosRechazados = ultimaVersion?.estadoVersion === "RECHAZADA" && ultimaVersion.numeroVersion > 1;
  const cambiosAprobados = !cambiosRechazados && (detalle.versionPublicada?.numeroVersion ?? 1) > 1;
  // El registro inicial no se puede aprobar sin una suscripción vigente (el backend también lo exige).
  const faltaSuscripcion = pendiente?.esRegistroInicial === true && detalle.suscripcion.estado !== "ACTIVA";

  return (
    <section>
      <Volver />

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{contacto ? `${contacto.nombre} ${contacto.apellido}` : `Operador ${id}`}</h1>
            <EstadoOperadorBadge estado={detalle.estado} />
          </div>
          {contacto?.nombreComercial && <p className="mt-1 text-muted-foreground">{contacto.nombreComercial}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            Registrado el {fecha(detalle.fechaCreacion)}
            {detalle.fechaActivacion && ` · Activo desde el ${fecha(detalle.fechaActivacion)}`}
            {detalle.calificaciones.cantidad > 0 && (
              <span className="ml-2 inline-flex items-center gap-1">
                · <Star className="size-3.5" /> {detalle.calificaciones.promedio} ({detalle.calificaciones.cantidad})
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {detalle.terminosVersion
              ? `Aceptó los Términos y la Política de privacidad (versión ${detalle.terminosVersion}) el ${fecha(detalle.terminosAceptadosEn)}`
              : "Sin constancia de aceptación de los Términos (se registró antes de que se pidiera)."}
          </p>
        </div>
        {detalle.estado === "ACTIVO" && (
          <Button variant="outline" onClick={() => setConfirmando("suspender")} disabled={procesando}>
            Suspender
          </Button>
        )}
        {detalle.estado === "SUSPENDIDO" && (
          <Button
            variant="outline"
            onClick={() => ejecutar(() => reactivarOperador(id), "El operador volvió a estar activo.")}
            disabled={procesando}
          >
            {procesando && <Spinner />} Reactivar
          </Button>
        )}
      </div>

      <SuscripcionTarjeta
        operadorId={id}
        suscripcion={detalle.suscripcion}
        nombre={contacto?.nombre ?? ""}
        whatsapp={detalle.versionPublicada?.whatsapp ?? null}
        aprobado={detalle.estado === "ACTIVO" || detalle.estado === "SUSPENDIDO"}
        onCambio={async () => aplicar(await obtenerDatos(id))}
      />

      {pendiente && (
        <Tarjeta className="mb-6 border-primary/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {pendiente.esRegistroInicial ? "Registro nuevo pendiente de revisión" : "Cambios pendientes de revisión"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enviado el {fecha(pendiente.versionSolicitada.fechaEnvioRevision)}: revisá los datos de abajo antes de
                decidir.
                {!pendiente.esRegistroInicial &&
                  " Mientras tanto el sitio sigue mostrando su perfil aprobado; si aprobás, se reemplaza por estos datos."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRechazando(true)} disabled={procesando}>
                <X /> Rechazar
              </Button>
              <Button onClick={() => setConfirmando("aprobar")} disabled={procesando || faltaSuscripcion}>
                <Check /> Aprobar
              </Button>
            </div>
          </div>
          {faltaSuscripcion && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Para aprobar el registro, primero definí el vencimiento de la suscripción (arriba).
            </p>
          )}
          {!pendiente.esRegistroInicial && pendiente.diferencias && (
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <Cambios diferencias={pendiente.diferencias} />
            </div>
          )}
        </Tarjeta>
      )}

      {contacto && (
        <Tarjeta className="mb-6">
          <h2 className="mb-3 font-semibold">Avisar por WhatsApp</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Se abre el chat con el número registrado (+{contacto.whatsapp}) y el mensaje ya escrito. Solo tenés que
            enviarlo.
          </p>
          <div className="flex flex-wrap gap-2">
            {detalle.estado === "ACTIVO" && !pendiente && cambiosRechazados && (
              <BotonWhatsapp
                principal
                whatsapp={contacto.whatsapp}
                etiqueta="Avisar que sus cambios no fueron aprobados"
                mensaje={`Hola ${contacto.nombre}, te escribimos de Servi Cerca. Revisamos los cambios que enviaste y por ahora no pudimos aprobarlos.${ultimoRechazo?.motivoRechazo ? ` Motivo: ${ultimoRechazo.motivoRechazo}` : ""} Tu perfil sigue visible con los datos anteriores. Si querés corregirlos, pedinos un nuevo enlace respondiendo a este contacto.`}
              />
            )}
            {detalle.estado === "ACTIVO" && !pendiente && cambiosAprobados && (
              <BotonWhatsapp
                principal
                whatsapp={contacto.whatsapp}
                etiqueta="Avisar que sus cambios fueron aprobados"
                mensaje={`Hola ${contacto.nombre}, te escribimos de Servi Cerca. Aprobamos los cambios que enviaste y tu perfil ya se muestra actualizado. Si más adelante querés modificar tus datos, pedilo respondiendo a este contacto.`}
              />
            )}
            {detalle.estado === "ACTIVO" && !cambiosRechazados && !cambiosAprobados && (
              <BotonWhatsapp
                principal
                whatsapp={contacto.whatsapp}
                etiqueta="Avisar que su perfil está activo"
                mensaje={`Hola ${contacto.nombre}, te escribimos de Servi Cerca. Tu registro fue aprobado y tu perfil ya está activo. Si más adelante querés modificar tus datos, pedilo respondiendo a este contacto.`}
              />
            )}
            {detalle.estado === "RECHAZADO" && (
              <BotonWhatsapp
                principal
                whatsapp={contacto.whatsapp}
                etiqueta="Avisar del rechazo"
                mensaje={`Hola ${contacto.nombre}, te escribimos de Servi Cerca. Revisamos tu solicitud y por ahora no pudimos aprobarla.${ultimoRechazo?.motivoRechazo ? ` Motivo: ${ultimoRechazo.motivoRechazo}` : ""}`}
              />
            )}
            <BotonWhatsapp
              whatsapp={contacto.whatsapp}
              etiqueta="Escribirle"
              mensaje={`Hola ${contacto.nombre}, te escribimos de Servi Cerca.`}
            />
          </div>
        </Tarjeta>
      )}

      {contacto && detalle.versionPublicada && (detalle.estado === "ACTIVO" || detalle.estado === "SUSPENDIDO") && (
        <EnlaceEdicionTarjeta
          operadorId={id}
          nombre={contacto.nombre}
          whatsapp={contacto.whatsapp}
          enRevision={pendiente !== null}
        />
      )}

      {datos ? (
        <DatosVersion datos={datos} />
      ) : (
        <p className="text-muted-foreground">Este operador no tiene datos para mostrar.</p>
      )}

      {detalle.versiones.length > 1 && (
        <Tarjeta className="mt-6">
          <h2 className="mb-3 font-semibold">Historial</h2>
          <ul className="space-y-2 text-sm">
            {detalle.versiones.map((v) => (
              <li key={v.versionId} className="flex flex-wrap gap-x-3 text-muted-foreground">
                <span className="text-foreground">Versión {v.numeroVersion}</span>
                <span>{v.estadoVersion.replace("_", " ").toLowerCase()}</span>
                {v.publicada && <Badge variant="secondary">publicada</Badge>}
                <span>{fecha(v.fechaRevision ?? v.fechaCreacion)}</span>
                {v.motivoRechazo && <span>· Motivo: {v.motivoRechazo}</span>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <AlertDialog open={confirmando !== null} onOpenChange={(open) => !open && !procesando && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmando === "suspender" ? "¿Suspender al operador?" : "¿Aprobar y publicar?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmando === "suspender"
                ? "Su perfil deja de mostrarse en el sitio. Podés reactivarlo cuando quieras."
                : "El perfil pasa a mostrarse en el sitio con estos datos. Después avisale por WhatsApp."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={procesando}
              onClick={(e) => {
                e.preventDefault();
                if (confirmando === "suspender") {
                  ejecutar(() => suspenderOperador(id), "El operador quedó suspendido.");
                } else if (pendiente) {
                  ejecutar(
                    () => aprobarVersion(pendiente.versionSolicitada.versionId),
                    "Aprobado. Avisale por WhatsApp que su perfil está activo.",
                  );
                }
              }}
            >
              {procesando && <Spinner />} {confirmando === "suspender" ? "Suspender" : "Aprobar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rechazando} onOpenChange={(open) => !open && !procesando && setRechazando(false)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pendiente && motivo.trim()) {
                ejecutar(() => rechazarVersion(pendiente.versionSolicitada.versionId, motivo.trim()), "Solicitud rechazada.");
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Rechazar solicitud</DialogTitle>
              <DialogDescription>
                El motivo queda guardado y se incluye en el mensaje de WhatsApp para avisarle.
              </DialogDescription>
            </DialogHeader>
            <Field className="my-6">
              <FieldLabel htmlFor="motivo-rechazo">Motivo</FieldLabel>
              <Textarea
                id="motivo-rechazo"
                required
                maxLength={500}
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Faltan datos de contacto o las imágenes no corresponden al servicio."
                disabled={procesando}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRechazando(false)} disabled={procesando}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={procesando || !motivo.trim()}>
                {procesando && <Spinner />} Rechazar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DatosVersion({ datos }: { datos: VersionDetalle }) {
  return (
    <div className="space-y-6">
      <Tarjeta>
        <div className="flex flex-col gap-6 sm:flex-row">
          <Imagen url={datos.fotoPerfilUrl} alt={`Foto de ${datos.nombre}`} className="size-24 rounded-full" />
          <dl className="grid flex-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Dato etiqueta="Email" valor={datos.email} />
            <Dato etiqueta="Teléfono" valor={datos.telefono} />
            <Dato etiqueta="WhatsApp" valor={`+${datos.whatsapp}`} />
            <Dato etiqueta="Localidades" valor={datos.localidades.map((l) => l.nombre).join(", ") || "—"} />
            <div className="sm:col-span-2">
              <Dato etiqueta="Descripción" valor={datos.descripcion || "—"} />
            </div>
          </dl>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Trabajos que ofrece</h2>
        <ul className="divide-y divide-border text-sm">
          {datos.oficios.map((o) => (
            <li key={o.oficioId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
              <div>
                <span className="font-medium">{o.nombre}</span>
                <span className="ml-2 text-muted-foreground">{o.categoria}</span>
                {!o.activo && (
                  <Badge variant="outline" className="ml-2 text-muted-foreground">
                    inactivo
                  </Badge>
                )}
                {o.descripcionServicio && <p className="mt-0.5 text-muted-foreground">{o.descripcionServicio}</p>}
              </div>
              <span className="tabular-nums">{o.precioDesde !== null ? `Desde ${precio(o.precioDesde, o.moneda)}` : "Sin precio"}</span>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Publicaciones</h2>
        {datos.publicaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cargó publicaciones.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {datos.publicaciones.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-md border border-border">
                <Imagen url={p.imagenUrl} alt={p.titulo} className="aspect-video w-full" />
                <div className="p-3 text-sm">
                  <p className="font-medium">{p.titulo}</p>
                  <p className="text-muted-foreground">
                    {TIPO_PUBLICACION[p.tipo]}
                    {p.precio !== null && ` · ${precio(p.precio, p.moneda)}`}
                  </p>
                  {p.descripcion && <p className="mt-1 text-muted-foreground">{p.descripcion}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </div>
  );
}

/** Resumen de lo que cambia entre el perfil publicado y la versión enviada a revisión. */
function Cambios({ diferencias }: { diferencias: Diferencias }) {
  const listas: { titulo: string; items: string[] }[] = [
    { titulo: "Trabajos agregados", items: diferencias.oficiosAgregados.map((o) => o.nombre) },
    { titulo: "Trabajos quitados", items: diferencias.oficiosEliminados.map((o) => o.nombre) },
    { titulo: "Trabajos modificados", items: diferencias.oficiosModificados.map((o) => o.nombre) },
    { titulo: "Localidades agregadas", items: diferencias.localidadesAgregadas.map((l) => l.nombre) },
    { titulo: "Localidades quitadas", items: diferencias.localidadesEliminadas.map((l) => l.nombre) },
    { titulo: "Publicaciones agregadas", items: diferencias.publicacionesAgregadas.map((p) => p.titulo) },
    { titulo: "Publicaciones modificadas", items: diferencias.publicacionesModificadas.map((p) => p.nueva.titulo) },
    { titulo: "Publicaciones quitadas", items: diferencias.publicacionesEliminadas.map((p) => p.titulo) },
  ].filter((lista) => lista.items.length > 0);

  if (diferencias.camposModificados.length === 0 && listas.length === 0) {
    return <p className="text-muted-foreground">No se detectaron cambios respecto del perfil publicado.</p>;
  }

  return (
    <>
      <p className="mb-2 font-medium">Qué cambia respecto del perfil publicado:</p>
      <ul className="space-y-1 text-muted-foreground">
        {diferencias.camposModificados.map((c) => (
          <li key={c.campo}>
            <span className="text-foreground">{ETIQUETAS_CAMPO[c.campo] ?? c.campo}:</span> {c.campo === "fotoPerfil" ? "cambió (mirá la nueva abajo)" : `${c.anterior || "—"} → ${c.nuevo || "—"}`}
          </li>
        ))}
        {listas.map((lista) => (
          <li key={lista.titulo}>
            <span className="text-foreground">{lista.titulo}:</span> {lista.items.join(", ")}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Genera el enlace de edición de un solo uso. La URL se muestra una única vez (el backend solo guarda
 * su hash) y se envía al WhatsApp registrado, nunca al número desde el que se pidió el cambio.
 */
function EnlaceEdicionTarjeta({
  operadorId,
  nombre,
  whatsapp,
  enRevision,
}: {
  operadorId: number;
  nombre: string;
  whatsapp: string;
  enRevision: boolean;
}) {
  const manejarError = useAdminError();
  const [enlace, setEnlace] = useState<EnlaceEdicion | null>(null);
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      setEnlace(await generarEnlaceEdicion(operadorId));
    } catch (e) {
      manejarError(e);
    } finally {
      setGenerando(false);
    }
  }

  async function copiar() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace.url);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar. Seleccioná el enlace y copialo a mano.");
    }
  }

  return (
    <Tarjeta className="mb-6">
      <h2 className="mb-3 font-semibold">Enlace para editar sus datos</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {enRevision
          ? "Tiene cambios esperando revisión: no puede volver a editar hasta que los apruebes o rechaces."
          : "Sirve una sola vez y vence a las 24 horas. Lo que edite queda pendiente de tu revisión; mientras tanto se sigue mostrando su perfil actual. Generar uno nuevo anula los anteriores."}
      </p>

      {enlace ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={enlace.url} aria-label="Enlace de edición" onFocus={(e) => e.target.select()} />
            <Button variant="outline" onClick={copiar}>
              <Copy /> Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No se vuelve a mostrar: enviáselo ahora. Vence el {fecha(enlace.fechaExpiracion)}
          </p>
          <BotonWhatsapp
            principal
            whatsapp={whatsapp}
            etiqueta={`Enviar al +${whatsapp}`}
            mensaje={`Hola ${nombre}, te escribimos de Servi Cerca. Con este enlace podés editar los datos de tu perfil: ${enlace.url}\n\nSirve una sola vez. Los cambios se publican después de que los revisemos. Vence el ${fecha(enlace.fechaExpiracion)}`}
          />
        </div>
      ) : (
        <Button variant="outline" onClick={generar} disabled={generando || enRevision}>
          {generando ? <Spinner /> : <Link2 />} Generar enlace de edición
        </Button>
      )}
    </Tarjeta>
  );
}

function Volver() {
  return (
    <Link href="/maite/operadores" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft size={16} /> Operadores
    </Link>
  );
}

function Tarjeta({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-(--radius) border border-border bg-card p-5 ${className}`}>{children}</div>;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 break-words whitespace-pre-line">{valor}</dd>
    </div>
  );
}

function Imagen({ url, alt, className }: { url: string | null; alt: string; className: string }) {
  const [rota, setRota] = useState(false);
  if (!url || rota) {
    return (
      <div className={`grid shrink-0 place-items-center bg-secondary text-muted-foreground ${className}`} title="Sin imagen">
        <ImageOff className="size-6" />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`block shrink-0 overflow-hidden bg-secondary ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de S3 con vencimiento, no pasa por next/image */}
      <img src={url} alt={alt} className="size-full object-cover" onError={() => setRota(true)} />
    </a>
  );
}

function BotonWhatsapp({
  whatsapp,
  mensaje,
  etiqueta,
  principal = false,
}: {
  whatsapp: string;
  mensaje: string;
  etiqueta: string;
  principal?: boolean;
}) {
  return (
    <Button asChild variant={principal ? "default" : "outline"}>
      <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer">
        <MessageCircle /> {etiqueta}
      </a>
    </Button>
  );
}

function precio(valor: number, moneda: "UYU" | "USD" | null) {
  return `${moneda === "USD" ? "US$" : "$U"} ${new Intl.NumberFormat("es-UY").format(valor)}`;
}
