"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff, MapPin, MessageCircle, Phone, ShieldCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useSavedTheme } from "@/hooks/use-saved-theme";
import {
  Calificacion,
  Moneda,
  OperadorPublico,
  PublicApiError,
  PublicacionPublica,
  listarCalificaciones,
  obtenerOperadorPublico,
} from "@/lib/public-api";

const TIPO_PUBLICACION = {
  TRABAJO_REALIZADO: "Trabajo realizado",
  SERVICIO_DESTACADO: "Servicio destacado",
  PRODUCTO: "Producto",
} as const;

type Props = {
  id: number;
  /** Servicio y localidad de la búsqueda de origen, para armar el mensaje de WhatsApp. */
  servicio: string | null;
  localidad: string | null;
};

export function ProfesionalPagina({ id, servicio, localidad }: Props) {
  const theme = useSavedTheme();
  const [operador, setOperador] = useState<OperadorPublico | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-encontrado" | "error">("cargando");
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [paginaCalificaciones, setPaginaCalificaciones] = useState({ actual: 0, total: 0 });
  const [cargandoMas, setCargandoMas] = useState(false);
  const [ampliada, setAmpliada] = useState<PublicacionPublica | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerOperadorPublico(id)
      .then((datos) => {
        if (!vigente) return;
        setOperador(datos);
        setEstado("listo");
      })
      .catch((e) => vigente && setEstado(e instanceof PublicApiError && e.status === 404 ? "no-encontrado" : "error"));
    listarCalificaciones(id, 0)
      .then((pagina) => {
        if (!vigente) return;
        setCalificaciones(pagina.content);
        setPaginaCalificaciones({ actual: pagina.page, total: pagina.totalPages });
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [id]);

  async function verMasCalificaciones() {
    setCargandoMas(true);
    try {
      const pagina = await listarCalificaciones(id, paginaCalificaciones.actual + 1);
      setCalificaciones((actuales) => [...actuales, ...pagina.content]);
      setPaginaCalificaciones({ actual: pagina.page, total: pagina.totalPages });
    } catch {
      // Si falla, el botón queda disponible para reintentar.
    } finally {
      setCargandoMas(false);
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
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
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Volver a buscar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8 pb-28 sm:py-10">
        {estado === "cargando" && (
          <div className="space-y-6" aria-busy="true" aria-label="Cargando">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {(estado === "no-encontrado" || estado === "error") && (
          <div className="rounded-(--radius) border border-border bg-card p-10 text-center">
            <h1 className="text-xl font-semibold">
              {estado === "no-encontrado" ? "Este perfil no está disponible" : "No pudimos cargar el perfil"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {estado === "no-encontrado"
                ? "Puede que el profesional ya no esté publicado."
                : "Revisá tu conexión y volvé a intentar en un momento."}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/">Buscar profesionales</Link>
            </Button>
          </div>
        )}

        {estado === "listo" && operador && (
          <div className="space-y-6">
            <Encabezado operador={operador} servicio={servicio} localidad={localidad} />

            <Seccion titulo="Servicios que ofrece">
              <ul className="divide-y divide-border">
                {operador.oficios.map((oficio) => (
                  <li key={oficio.oficioId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                    <div className="min-w-0">
                      <span className="font-medium">{oficio.nombre}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{oficio.categoria}</span>
                      {oficio.descripcionServicio && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{oficio.descripcionServicio}</p>
                      )}
                    </div>
                    {oficio.precioDesde !== null && (
                      <span className="text-sm font-medium tabular-nums">Desde {precio(oficio.precioDesde, oficio.moneda)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Seccion>

            {operador.publicaciones.length > 0 && (
              <Seccion titulo="Trabajos y publicaciones">
                <div className="grid gap-4 sm:grid-cols-2">
                  {operador.publicaciones.map((publicacion) => (
                    <button
                      key={publicacion.id}
                      type="button"
                      onClick={() => setAmpliada(publicacion)}
                      className="overflow-hidden rounded-md border border-border text-left transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <ImagenPublicacion publicacion={publicacion} className="aspect-video w-full" />
                      <div className="p-3">
                        <p className="font-medium">{publicacion.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {TIPO_PUBLICACION[publicacion.tipo]}
                          {publicacion.precio !== null && ` · ${precio(publicacion.precio, publicacion.moneda)}`}
                        </p>
                        {publicacion.descripcion && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{publicacion.descripcion}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Seccion>
            )}

            <Seccion titulo="Calificaciones">
              {calificaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no tiene calificaciones.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border">
                    {calificaciones.map((calificacion) => (
                      <li key={calificacion.id} className="py-4 first:pt-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Estrellas puntaje={calificacion.puntaje} />
                          <span className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(new Date(calificacion.fecha))}
                          </span>
                        </div>
                        {calificacion.comentario && <p className="mt-2 text-sm">{calificacion.comentario}</p>}
                        {calificacion.nombreCliente && (
                          <p className="mt-1 text-sm text-muted-foreground">{calificacion.nombreCliente}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {paginaCalificaciones.actual < paginaCalificaciones.total - 1 && (
                    <Button variant="outline" className="mt-2" onClick={verMasCalificaciones} disabled={cargandoMas}>
                      {cargandoMas && <Spinner />} Ver más calificaciones
                    </Button>
                  )}
                </>
              )}
            </Seccion>
          </div>
        )}
      </main>

      <Dialog open={ampliada !== null} onOpenChange={(open) => !open && setAmpliada(null)}>
        <DialogContent className="sm:max-w-2xl">
          {ampliada && (
            <>
              <DialogHeader>
                <DialogTitle>{ampliada.titulo}</DialogTitle>
                <DialogDescription>
                  {TIPO_PUBLICACION[ampliada.tipo]}
                  {ampliada.precio !== null && ` · ${precio(ampliada.precio, ampliada.moneda)}`}
                </DialogDescription>
              </DialogHeader>
              <ImagenPublicacion publicacion={ampliada} className="max-h-[60vh] w-full rounded-md" contener />
              {ampliada.descripcion && <p className="text-sm whitespace-pre-line text-muted-foreground">{ampliada.descripcion}</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Encabezado({
  operador,
  servicio,
  localidad,
}: {
  operador: OperadorPublico;
  servicio: string | null;
  localidad: string | null;
}) {
  const [fotoRota, setFotoRota] = useState(false);
  const pedido = servicio && localidad ? ` Necesito ${servicio.toLowerCase()} en ${localidad}.` : "";
  const mensaje = encodeURIComponent(
    `Hola ${operador.nombre}, te encontré en Servi Cerca.${pedido} ¿Podemos coordinar?`,
  );

  return (
    <section className="rounded-(--radius) border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-3xl font-bold text-muted-foreground">
          {operador.fotoPerfilUrl && !fotoRota ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada de S3 con vencimiento, no pasa por next/image
            <img
              src={operador.fotoPerfilUrl}
              alt={`Foto de ${operador.nombre} ${operador.apellido}`}
              className="size-full object-cover"
              onError={() => setFotoRota(true)}
            />
          ) : (
            <span aria-hidden="true">
              {operador.nombre.charAt(0)}
              {operador.apellido.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {operador.nombre} {operador.apellido}
            </h1>
            <span className="verified-badge">
              <ShieldCheck className="size-3.5" /> Verificado
            </span>
          </div>
          {operador.nombreComercial && <p className="mt-1 text-muted-foreground">{operador.nombreComercial}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {operador.cantidadCalificaciones > 0 && operador.calificacionPromedio !== null ? (
                <>
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <strong className="text-foreground">{operador.calificacionPromedio.toFixed(1)}</strong>(
                  {operador.cantidadCalificaciones} {operador.cantidadCalificaciones === 1 ? "reseña" : "reseñas"})
                </>
              ) : (
                "Sin reseñas todavía"
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {operador.localidades.map((l) => l.nombre).join(", ")}
            </span>
          </div>

          {operador.descripcion && <p className="mt-4 leading-6 whitespace-pre-line">{operador.descripcion}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="contact-button w-full px-5 sm:w-auto"
              href={`https://wa.me/${operador.whatsapp}?text=${mensaje}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" />
              Contactar por WhatsApp
            </a>
            <Button asChild variant="outline" className="h-11 w-full rounded-xl sm:w-auto">
              <a href={`tel:${operador.telefono.replace(/[^\d+]/g, "")}`}>
                <Phone /> {operador.telefono}
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* En el celular el botón de contacto queda siempre a mano, aunque se baje a ver publicaciones o reseñas. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <a
          className="contact-button w-full"
          href={`https://wa.me/${operador.whatsapp}?text=${mensaje}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="size-4" />
          Contactar a {operador.nombre} por WhatsApp
        </a>
      </div>
    </section>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-(--radius) border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function ImagenPublicacion({
  publicacion,
  className,
  contener = false,
}: {
  publicacion: PublicacionPublica;
  className: string;
  contener?: boolean;
}) {
  const [rota, setRota] = useState(false);
  if (!publicacion.imagenUrl || rota) {
    return (
      <div className={`grid aspect-video place-items-center bg-secondary text-muted-foreground ${className}`}>
        <ImageOff className="size-6" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada de S3 con vencimiento, no pasa por next/image
    <img
      src={publicacion.imagenUrl}
      alt={publicacion.titulo}
      className={`bg-secondary ${contener ? "object-contain" : "object-cover"} ${className}`}
      onError={() => setRota(true)}
    />
  );
}

function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${puntaje} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < puntaje ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-border"} />
      ))}
    </span>
  );
}

function precio(valor: number, moneda: Moneda | null) {
  return `${moneda === "USD" ? "US$" : "$U"} ${new Intl.NumberFormat("es-UY").format(valor)}`;
}
