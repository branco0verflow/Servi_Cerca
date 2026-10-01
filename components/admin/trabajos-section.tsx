"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { ConfirmarEliminar } from "@/components/admin/confirmar-eliminar";
import { useAdminError } from "@/components/admin/admin-shell";
import { useDialogo } from "@/hooks/use-dialogo";
import { EstadoBadge, TablaCargando, normalizar } from "@/components/admin/tipos-section";
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
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tipo,
  Trabajo,
  TrabajoDatos,
  actualizarTrabajo,
  crearTrabajo,
  eliminarTrabajo,
  listarTipos,
  listarTrabajos,
} from "@/lib/admin-api";

// El NativeSelect envuelve el <select> en un div de ancho ajustado: esto lo estira al ancho del contenedor.
const SELECT_ANCHO_COMPLETO = "[&>[data-slot=native-select-wrapper]]:w-full";

export function TrabajosSection({ tipoInicial }: { tipoInicial: number | null }) {
  const manejarError = useAdminError();
  const [trabajos, setTrabajos] = useState<Trabajo[] | null>(null);
  const [tipos, setTipos] = useState<Tipo[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<number | null>(tipoInicial);
  const formulario = useDialogo<Trabajo | "nuevo">();
  const editando = formulario.item;
  const confirmacion = useDialogo<Trabajo>();
  const eliminando = confirmacion.item;
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(() => {
    Promise.all([listarTrabajos(), listarTipos()])
      .then(([listaTrabajos, listaTipos]) => {
        setTrabajos(listaTrabajos);
        setTipos(listaTipos);
      })
      .catch(manejarError);
  }, [manejarError]);

  useEffect(cargar, [cargar]);

  const visibles = useMemo(() => {
    const texto = normalizar(busqueda);
    return (trabajos ?? []).filter(
      (t) =>
        (filtroTipo === null || t.categoria.id === filtroTipo) &&
        (normalizar(t.nombre).includes(texto) || normalizar(t.categoria.nombre).includes(texto)),
    );
  }, [trabajos, busqueda, filtroTipo]);

  const sinTipos = tipos !== null && tipos.length === 0;

  async function guardar(datos: TrabajoDatos) {
    setProcesando(true);
    try {
      if (editando === "nuevo") {
        await crearTrabajo(datos);
        toast.success(`Se creó el trabajo “${datos.nombre}”.`);
      } else if (editando) {
        await actualizarTrabajo(editando.id, datos);
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
      await eliminarTrabajo(eliminando.id);
      toast.success(`Se eliminó el trabajo “${eliminando.nombre}”.`);
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
      await actualizarTrabajo(eliminando.id, {
        nombre: eliminando.nombre,
        descripcion: eliminando.descripcion,
        categoriaId: eliminando.categoria.id,
        activo: false,
      });
      toast.success(`Se desactivó el trabajo “${eliminando.nombre}”.`);
      confirmacion.cerrar();
      cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-trabajos">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="titulo-trabajos" className="text-2xl font-semibold">
            Trabajos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada trabajo pertenece a un tipo. Por ejemplo: Electricista, Cerrajero, Sanitario.
          </p>
        </div>
        <Button onClick={() => formulario.abrir("nuevo")} disabled={tipos === null || sinTipos}>
          <Plus /> Nuevo trabajo
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar trabajo…"
            aria-label="Buscar trabajo"
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className={`sm:w-64 ${SELECT_ANCHO_COMPLETO}`}>
          <NativeSelect
            className="py-0"
            aria-label="Filtrar por tipo"
            value={filtroTipo ?? ""}
            onChange={(e) => setFiltroTipo(e.target.value ? Number(e.target.value) : null)}
          >
            <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
            {(tipos ?? []).map((tipo) => (
              <NativeSelectOption key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {trabajos === null ? (
        <TablaCargando />
      ) : sinTipos ? (
        <Empty className="rounded-(--radius) border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench />
            </EmptyMedia>
            <EmptyTitle>Primero creá un tipo</EmptyTitle>
            <EmptyDescription>Cada trabajo tiene que pertenecer a un tipo.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/maite/tipos">Ir a Tipos</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : visibles.length === 0 ? (
        <Empty className="rounded-(--radius) border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench />
            </EmptyMedia>
            <EmptyTitle>{trabajos.length === 0 ? "Todavía no hay trabajos" : "Sin resultados"}</EmptyTitle>
            <EmptyDescription>
              {trabajos.length === 0 ? "Creá el primero con “Nuevo trabajo”." : "Probá con otra búsqueda o tipo."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-(--radius) border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((trabajo) => (
                <TableRow key={trabajo.id}>
                  <TableCell className="max-w-sm whitespace-normal">
                    <div className="font-medium">{trabajo.nombre}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">{trabajo.categoria.nombre}</div>
                    {trabajo.descripcion && (
                      <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{trabajo.descripcion}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-normal sm:table-cell">
                    <span>{trabajo.categoria.nombre}</span>
                    {!trabajo.categoriaActiva && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-muted-foreground"
                        title="El tipo está inactivo: este trabajo no se muestra en el sitio."
                      >
                        tipo inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge activo={trabajo.activo} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${trabajo.nombre}`}
                      onClick={() => formulario.abrir(trabajo)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar ${trabajo.nombre}`}
                      onClick={() => confirmacion.abrir(trabajo)}
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

      <TrabajoDialog
        key={formulario.clave}
        abierto={formulario.abierto}
        trabajo={editando}
        tipos={tipos ?? []}
        tipoSugerido={filtroTipo}
        procesando={procesando}
        onCerrar={formulario.cerrar}
        onGuardar={guardar}
      />

      <ConfirmarEliminar
        abierto={confirmacion.abierto}
        onCerrar={confirmacion.cerrar}
        nombre={eliminando?.nombre ?? ""}
        bloqueo={
          eliminando?.enUso
            ? "Está asociado a operadores o a trabajos registrados, y se conserva para no perder ese historial."
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

function TrabajoDialog({
  abierto,
  trabajo,
  tipos,
  tipoSugerido,
  procesando,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean;
  trabajo: Trabajo | "nuevo" | null;
  tipos: Tipo[];
  tipoSugerido: number | null;
  procesando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: TrabajoDatos) => void;
}) {
  const existente = trabajo && trabajo !== "nuevo" ? trabajo : null;
  const [nombre, setNombre] = useState(existente?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? "");
  const [categoriaId, setCategoriaId] = useState<number | null>(existente?.categoria.id ?? tipoSugerido);
  const [activo, setActivo] = useState(existente?.activo ?? true);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const tipoElegido = tipos.find((t) => t.id === categoriaId);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIntentoGuardar(true);
    if (!nombre.trim() || categoriaId === null) return;
    onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, categoriaId, activo });
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && !procesando && onCerrar()}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{trabajo === "nuevo" ? "Nuevo trabajo" : "Editar trabajo"}</DialogTitle>
            <DialogDescription>Elegí el tipo al que pertenece.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-6">
            <Field data-invalid={intentoGuardar && !nombre.trim() ? true : undefined}>
              <FieldLabel htmlFor="trabajo-nombre">Nombre</FieldLabel>
              <Input
                id="trabajo-nombre"
                required
                maxLength={80}
                placeholder="Electricista"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={procesando}
                aria-invalid={intentoGuardar && !nombre.trim() ? true : undefined}
                autoFocus
              />
            </Field>
            <Field
              data-invalid={intentoGuardar && categoriaId === null ? true : undefined}
              className={SELECT_ANCHO_COMPLETO}
            >
              <FieldLabel htmlFor="trabajo-tipo">Tipo</FieldLabel>
              <NativeSelect
                className="py-0"
                id="trabajo-tipo"
                required
                value={categoriaId ?? ""}
                onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : null)}
                disabled={procesando}
                aria-invalid={intentoGuardar && categoriaId === null ? true : undefined}
              >
                <NativeSelectOption value="" disabled>
                  Elegí un tipo…
                </NativeSelectOption>
                {tipos.map((tipo) => (
                  <NativeSelectOption key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                    {tipo.activo ? "" : " (inactivo)"}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {intentoGuardar && categoriaId === null ? (
                <FieldDescription className="text-destructive">Elegí un tipo para el trabajo.</FieldDescription>
              ) : (
                tipoElegido &&
                !tipoElegido.activo && (
                  <FieldDescription>
                    Este tipo está inactivo: el trabajo no se mostrará en el sitio hasta que lo actives.
                  </FieldDescription>
                )
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="trabajo-descripcion">Descripción (opcional)</FieldLabel>
              <Textarea
                id="trabajo-descripcion"
                maxLength={500}
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={procesando}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch id="trabajo-activo" checked={activo} onCheckedChange={setActivo} disabled={procesando} />
              <div>
                <FieldLabel htmlFor="trabajo-activo">Activo</FieldLabel>
                <FieldDescription>Si está inactivo, no se muestra en el sitio.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} disabled={procesando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={procesando}>
              {procesando && <Spinner />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
