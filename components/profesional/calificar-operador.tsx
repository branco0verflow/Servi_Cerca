"use client";

import { FormEvent, useState } from "react";
import { Check, Star, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PublicApiError, calificarOperador } from "@/lib/public-api";

const ETIQUETAS_PUNTAJE = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

/** Botón "Calificar" y formulario. La calificación queda pendiente hasta que el administrador la revise. */
export function CalificarOperador({ operadorId, nombre }: { operadorId: number; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState(0);

  return (
    <>
      <Button
        variant="outline"
        className="h-11 w-full rounded-xl sm:w-auto"
        onClick={() => {
          setClave((c) => c + 1);
          setAbierto(true);
        }}
      >
        <Star /> Calificar a {nombre}
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <FormularioCalificacion key={clave} operadorId={operadorId} nombre={nombre} onCerrar={() => setAbierto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormularioCalificacion({
  operadorId,
  nombre,
  onCerrar,
}: {
  operadorId: number;
  nombre: string;
  onCerrar: () => void;
}) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [confirma, setConfirma] = useState(false);
  const [trampa, setTrampa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!puntaje) return setError("Elegí de 1 a 5 estrellas.");
    if (!confirma) return setError("Confirmá que contrataste o recibiste un servicio de este profesional.");
    setError(null);
    setEnviando(true);
    try {
      await calificarOperador(operadorId, {
        puntaje,
        comentario: comentario.trim() || null,
        nombreCliente: nombreCliente.trim() || null,
        confirmaServicio: confirma,
        sitioWeb: trampa,
      });
      setEnviada(true);
    } catch (e) {
      setError(e instanceof PublicApiError ? e.message : "No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
          <Check className="size-7" />
        </span>
        <DialogTitle className="text-xl">¡Gracias por tu calificación!</DialogTitle>
        <DialogDescription className="mt-2">
          La vamos a revisar y, si corresponde, se publicará en el perfil de {nombre}.
        </DialogDescription>
        <Button className="mt-6 w-full sm:w-auto" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Calificar a {nombre}</DialogTitle>
        <DialogDescription>Tu opinión ayuda a otras personas a elegir.</DialogDescription>
      </DialogHeader>

      <div className="my-5 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-semibold">Calificá únicamente si contrataste sus servicios</p>
        <p className="mt-1 text-muted-foreground">
          Las calificaciones deben basarse en una experiencia real con este profesional. Los comentarios que no
          correspondan a un servicio realizado podrán ser rechazados durante la revisión.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <p id="puntaje-etiqueta" className="mb-2 text-sm font-medium">
            ¿Cómo fue tu experiencia?
          </p>
          <div role="radiogroup" aria-labelledby="puntaje-etiqueta" className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((valor) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={puntaje === valor}
                aria-label={`${valor} ${valor === 1 ? "estrella" : "estrellas"}: ${ETIQUETAS_PUNTAJE[valor]}`}
                onClick={() => setPuntaje(valor)}
                disabled={enviando}
                className="grid size-11 place-items-center rounded-md transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Star
                  className={valor <= puntaje ? "size-8 fill-amber-400 text-amber-400" : "size-8 text-muted-foreground/50"}
                />
              </button>
            ))}
            {puntaje > 0 && <span className="ml-2 text-sm text-muted-foreground">{ETIQUETAS_PUNTAJE[puntaje]}</span>}
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="calificacion-comentario">Comentario (opcional)</FieldLabel>
          <Textarea
            id="calificacion-comentario"
            rows={4}
            maxLength={1000}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Qué trabajo te hizo? ¿Cómo fue la atención?"
            disabled={enviando}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="calificacion-nombre">Tu nombre (opcional)</FieldLabel>
          <Input
            id="calificacion-nombre"
            className="h-11 sm:h-9"
            maxLength={120}
            autoComplete="given-name"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            placeholder="Se muestra junto a tu calificación"
            disabled={enviando}
          />
        </Field>

        {/* Campo trampa: invisible, oculto a lectores de pantalla y fuera del orden de tabulación. Solo lo completan los bots. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="calificacion-sitio">Sitio web</label>
          <input
            id="calificacion-sitio"
            name="sitioWeb"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trampa}
            onChange={(e) => setTrampa(e.target.value)}
          />
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={confirma}
            onCheckedChange={(valor) => setConfirma(valor === true)}
            disabled={enviando}
          />
          <span>Confirmo que contraté o recibí un servicio de este profesional.</span>
        </label>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 sm:h-9" disabled={enviando || !puntaje || !confirma}>
          {enviando && <Spinner />} Enviar calificación
        </Button>
      </DialogFooter>
    </form>
  );
}
