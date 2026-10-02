"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Star, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { useAdminError } from "@/components/admin/admin-shell";
import { fecha } from "@/components/admin/operadores-section";
import { TablaCargando } from "@/components/admin/tipos-section";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  CalificacionAdmin,
  EstadoCalificacion,
  Pagina,
  aprobarCalificacion,
  listarCalificacionesAdmin,
  rechazarCalificacion,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const FILTROS: { valor: EstadoCalificacion | null; etiqueta: string }[] = [
  { valor: "PENDIENTE_REVISION", etiqueta: "Pendientes" },
  { valor: "APROBADA", etiqueta: "Aprobadas" },
  { valor: "RECHAZADA", etiqueta: "Rechazadas" },
  { valor: null, etiqueta: "Todas" },
];

export function CalificacionesSection() {
  const manejarError = useAdminError();
  const [estado, setEstado] = useState<EstadoCalificacion | null>("PENDIENTE_REVISION");
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState<Pagina<CalificacionAdmin> | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<CalificacionAdmin | null>(null);
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(
    () => listarCalificacionesAdmin(estado, pagina).then(setDatos).catch(manejarError),
    [estado, pagina, manejarError],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function aprobar(calificacion: CalificacionAdmin) {
    setProcesando(calificacion.id);
    try {
      await aprobarCalificacion(calificacion.id);
      toast.success("Calificación aprobada: ya se muestra en el perfil.");
      await cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(null);
    }
  }

  async function confirmarRechazo() {
    if (!rechazando) return;
    setProcesando(rechazando.id);
    try {
      await rechazarCalificacion(rechazando.id, motivo.trim() || null);
      toast.success("Calificación rechazada.");
      setRechazando(null);
      setMotivo("");
      await cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <section aria-labelledby="titulo-calificaciones">
      <div className="mb-6">
        <h1 id="titulo-calificaciones" className="text-2xl font-semibold">
          Calificaciones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las calificaciones se publican recién cuando las aprobás. Rechazá las que no correspondan a un servicio real.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-md bg-secondary p-1" role="tablist">
        {FILTROS.map((filtro) => (
          <button
            key={filtro.etiqueta}
            type="button"
            role="tab"
            aria-selected={estado === filtro.valor}
            onClick={() => {
              setDatos(null);
              setPagina(0);
              setEstado(filtro.valor);
            }}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              estado === filtro.valor ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {filtro.etiqueta}
            {estado === filtro.valor && datos && <span className="ml-1.5 text-muted-foreground">({datos.totalElements})</span>}
          </button>
        ))}
      </div>

      {datos === null ? (
        <TablaCargando />
      ) : datos.content.length === 0 ? (
        <Empty className="rounded-(--radius) border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Star />
            </EmptyMedia>
            <EmptyTitle>{estado === "PENDIENTE_REVISION" ? "No hay calificaciones para revisar" : "No hay calificaciones"}</EmptyTitle>
            <EmptyDescription>
              {estado === "PENDIENTE_REVISION"
                ? "Cuando alguien califique a un profesional, aparece acá."
                : "No hay calificaciones con este estado."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {datos.content.map((c) => (
            <li key={c.id} className="rounded-(--radius) border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Estrellas puntaje={c.puntaje} />
                    <EstadoBadge estado={c.estado} />
                  </div>
                  <p className="mt-2 text-sm">
                    Para{" "}
                    <Link href={`/maite/operadores/${c.operadorId}`} className="font-medium text-primary hover:underline">
                      {c.operadorNombre ?? `Operador ${c.operadorId}`}
                    </Link>
                    <span className="text-muted-foreground">
                      {" · "}
                      {c.nombreCliente || "Sin nombre"} · {fecha(c.fechaCreacion)}
                      {c.origen === "ADMIN" && " · cargada por administración"}
                    </span>
                  </p>
                </div>
                {c.estado === "PENDIENTE_REVISION" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRechazando(c)}
                      disabled={procesando !== null}
                    >
                      <X /> Rechazar
                    </Button>
                    <Button size="sm" onClick={() => aprobar(c)} disabled={procesando !== null}>
                      {procesando === c.id ? <Spinner /> : <Check />} Aprobar
                    </Button>
                  </div>
                )}
              </div>

              {c.comentario ? (
                <p className="mt-3 text-sm whitespace-pre-line">{c.comentario}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground italic">Sin comentario.</p>
              )}

              {c.otrasDesdeMismoOrigen > 0 && (
                <p className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <TriangleAlert className="size-4 shrink-0" />
                  Hay {c.otrasDesdeMismoOrigen} {c.otrasDesdeMismoOrigen === 1 ? "calificación más" : "calificaciones más"}{" "}
                  enviadas desde la misma conexión. Revisá si no son de la misma persona.
                </p>
              )}
              {c.estado === "RECHAZADA" && c.motivoRechazo && (
                <p className="mt-3 text-sm text-muted-foreground">Motivo del rechazo: {c.motivoRechazo}</p>
              )}
              {c.estado !== "PENDIENTE_REVISION" && c.revisadoPor && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Revisada por {c.revisadoPor} el {fecha(c.fechaRevision)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {datos && datos.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
          Página {datos.page + 1} de {datos.totalPages}
          <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página siguiente"
            disabled={pagina >= datos.totalPages - 1}
            onClick={() => setPagina((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      <Dialog open={rechazando !== null} onOpenChange={(open) => !open && procesando === null && setRechazando(null)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmarRechazo();
            }}
          >
            <DialogHeader>
              <DialogTitle>Rechazar calificación</DialogTitle>
              <DialogDescription>No se publica ni cuenta para el promedio. El motivo es solo para registro interno.</DialogDescription>
            </DialogHeader>
            <Field className="my-6">
              <FieldLabel htmlFor="motivo-calificacion">Motivo (opcional)</FieldLabel>
              <Textarea
                id="motivo-calificacion"
                maxLength={500}
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. No corresponde a un servicio realizado."
                disabled={procesando !== null}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRechazando(null)} disabled={procesando !== null}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={procesando !== null}>
                {procesando !== null && <Spinner />} Rechazar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
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

function EstadoBadge({ estado }: { estado: EstadoCalificacion }) {
  if (estado === "APROBADA") return <Badge variant="secondary">Aprobada</Badge>;
  if (estado === "RECHAZADA") return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge>Pendiente</Badge>;
}
