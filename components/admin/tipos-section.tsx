"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmarEliminar } from "@/components/admin/confirmar-eliminar";
import { useAdminError } from "@/components/admin/admin-shell";
import { useDialogo } from "@/hooks/use-dialogo";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tipo, TipoDatos, actualizarTipo, crearTipo, eliminarTipo, listarTipos } from "@/lib/admin-api";

const VACIO: TipoDatos = { nombre: "", descripcion: "", activo: true };

export function TiposSection() {
  const manejarError = useAdminError();
  const [tipos, setTipos] = useState<Tipo[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const formulario = useDialogo<Tipo | "nuevo">();
  const editando = formulario.item;
  const confirmacion = useDialogo<Tipo>();
  const eliminando = confirmacion.item;
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(() => {
    listarTipos().then(setTipos).catch(manejarError);
  }, [manejarError]);

  useEffect(cargar, [cargar]);

  const visibles = useMemo(() => {
    const texto = normalizar(busqueda);
    return (tipos ?? []).filter((t) => normalizar(t.nombre).includes(texto));
  }, [tipos, busqueda]);

  async function guardar(datos: TipoDatos) {
    setProcesando(true);
    try {
      if (editando === "nuevo") {
        await crearTipo(datos);
        toast.success(`Se creó el tipo “${datos.nombre}”.`);
      } else if (editando) {
        await actualizarTipo(editando.id, datos);
        toast.success(`Se guardaron los cambios de “${datos.nombre}”.`);
      }
      formulario.cerrar();
      cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    setProcesando(true);
    try {
      await eliminarTipo(eliminando.id);
      toast.success(`Se eliminó el tipo “${eliminando.nombre}”.`);
      confirmacion.cerrar();
      cargar();
    } catch (e) {
      manejarError(e);
      cargar();
    } finally {
      setProcesando(false);
    }
  }

  async function desactivar() {
    if (!eliminando) return;
    setProcesando(true);
    try {
      await actualizarTipo(eliminando.id, {
        nombre: eliminando.nombre,
        descripcion: eliminando.descripcion,
        activo: false,
      });
      toast.success(`Se desactivó el tipo “${eliminando.nombre}”.`);
      confirmacion.cerrar();
      cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-tipos">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="titulo-tipos" className="text-2xl font-semibold">
            Tipos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrupan los trabajos. Por ejemplo: “Instalaciones y reparaciones”.
          </p>
        </div>
        <Button onClick={() => formulario.abrir("nuevo")}>
          <Plus /> Nuevo tipo
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar tipo…"
          aria-label="Buscar tipo"
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {tipos === null ? (
        <TablaCargando />
      ) : visibles.length === 0 ? (
        <Empty className="rounded-(--radius) border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers />
            </EmptyMedia>
            <EmptyTitle>{tipos.length === 0 ? "Todavía no hay tipos" : "Sin resultados"}</EmptyTitle>
            <EmptyDescription>
              {tipos.length === 0 ? "Creá el primero con “Nuevo tipo”." : "Probá con otra búsqueda."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-(--radius) border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-20 text-right">Trabajos</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <div className="font-medium">{tipo.nombre}</div>
                    {tipo.descripcion && (
                      <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{tipo.descripcion}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tipo.cantidadOficios > 0 ? (
                      <Link
                        href={`/maite/trabajos?tipo=${tipo.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                        title={`Ver los trabajos de ${tipo.nombre}`}
                      >
                        {tipo.cantidadOficios}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge activo={tipo.activo} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${tipo.nombre}`}
                      onClick={() => formulario.abrir(tipo)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar ${tipo.nombre}`}
                      onClick={() => confirmacion.abrir(tipo)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TipoDialog
        key={formulario.clave}
        abierto={formulario.abierto}
        tipo={editando}
        procesando={procesando}
        onCerrar={formulario.cerrar}
        onGuardar={guardar}
      />

      <ConfirmarEliminar
        abierto={confirmacion.abierto}
        onCerrar={confirmacion.cerrar}
        nombre={eliminando?.nombre ?? ""}
        bloqueo={
          eliminando && eliminando.cantidadOficios > 0
            ? `Tiene ${eliminando.cantidadOficios} ${eliminando.cantidadOficios === 1 ? "trabajo asociado" : "trabajos asociados"}. Para eliminarlo, primero movelos a otro tipo o eliminalos.`
            : null
        }
        activo={eliminando?.activo ?? false}
        procesando={procesando}
        onEliminar={confirmarEliminar}
        onDesactivar={desactivar}
      />
    </section>
  );
}

function TipoDialog({
  abierto,
  tipo,
  procesando,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean;
  tipo: Tipo | "nuevo" | null;
  procesando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: TipoDatos) => void;
}) {
  const inicial = tipo && tipo !== "nuevo" ? tipo : VACIO;
  const [nombre, setNombre] = useState(inicial.nombre);
  const [descripcion, setDescripcion] = useState(inicial.descripcion ?? "");
  const [activo, setActivo] = useState(inicial.activo);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, activo });
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && !procesando && onCerrar()}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{tipo === "nuevo" ? "Nuevo tipo" : "Editar tipo"}</DialogTitle>
            <DialogDescription>Los trabajos se agrupan dentro de un tipo.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-6">
            <Field>
              <FieldLabel htmlFor="tipo-nombre">Nombre</FieldLabel>
              <Input
                id="tipo-nombre"
                required
                maxLength={80}
                placeholder="Instalaciones y reparaciones"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={procesando}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tipo-descripcion">Descripción (opcional)</FieldLabel>
              <Textarea
                id="tipo-descripcion"
                maxLength={500}
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={procesando}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch id="tipo-activo" checked={activo} onCheckedChange={setActivo} disabled={procesando} />
              <div>
                <FieldLabel htmlFor="tipo-activo">Activo</FieldLabel>
                <FieldDescription>Si está inactivo, sus trabajos no se muestran en el sitio.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} disabled={procesando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={procesando || !nombre.trim()}>
              {procesando && <Spinner />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge variant="secondary">Activo</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Inactivo
    </Badge>
  );
}

export function TablaCargando() {
  return (
    <div className="space-y-2 rounded-(--radius) border border-border p-4" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Para buscar sin distinguir mayúsculas ni tildes. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}
