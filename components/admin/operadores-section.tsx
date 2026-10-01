"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

import { useAdminError } from "@/components/admin/admin-shell";
import { TablaCargando } from "@/components/admin/tipos-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EstadoOperador,
  OperadorResumen,
  Pagina,
  VersionPendiente,
  listarOperadores,
  listarVersionesPendientes,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const ESTADOS: { valor: EstadoOperador; etiqueta: string }[] = [
  { valor: "ACTIVO", etiqueta: "Activos" },
  { valor: "PENDIENTE_REVISION", etiqueta: "Pendientes de revisión" },
  { valor: "SUSPENDIDO", etiqueta: "Suspendidos" },
  { valor: "RECHAZADO", etiqueta: "Rechazados" },
];

export function OperadoresSection() {
  const manejarError = useAdminError();
  const [vista, setVista] = useState<"pendientes" | "todos">("pendientes");
  const [pendientes, setPendientes] = useState<VersionPendiente[] | null>(null);
  const [estado, setEstado] = useState<EstadoOperador | null>(null);
  const [pagina, setPagina] = useState(0);
  const [operadores, setOperadores] = useState<Pagina<OperadorResumen> | null>(null);

  useEffect(() => {
    listarVersionesPendientes()
      .then((respuesta) => setPendientes(respuesta.content))
      .catch(manejarError);
  }, [manejarError]);

  useEffect(() => {
    if (vista !== "todos") return;
    let vigente = true;
    listarOperadores(estado, pagina)
      .then((respuesta) => vigente && setOperadores(respuesta))
      .catch(manejarError);
    return () => {
      vigente = false;
    };
  }, [vista, estado, pagina, manejarError]);

  return (
    <section aria-labelledby="titulo-operadores">
      <div className="mb-6">
        <h1 id="titulo-operadores" className="text-2xl font-semibold">
          Operadores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá las solicitudes de registro y administrá los perfiles publicados.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md bg-secondary p-1" role="tablist">
          <Pestana activa={vista === "pendientes"} onClick={() => setVista("pendientes")}>
            Pendientes de revisión
            {pendientes !== null && pendientes.length > 0 && <Badge className="ml-2">{pendientes.length}</Badge>}
          </Pestana>
          <Pestana activa={vista === "todos"} onClick={() => setVista("todos")}>
            Todos
          </Pestana>
        </div>
        {vista === "todos" && (
          <NativeSelect
            aria-label="Filtrar por estado"
            className="py-0"
            value={estado ?? ""}
            onChange={(e) => {
              setOperadores(null);
              setPagina(0);
              setEstado((e.target.value || null) as EstadoOperador | null);
            }}
          >
            <NativeSelectOption value="">Todos los estados</NativeSelectOption>
            {ESTADOS.map((e) => (
              <NativeSelectOption key={e.valor} value={e.valor}>
                {e.etiqueta}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>

      {vista === "pendientes" ? (
        pendientes === null ? (
          <TablaCargando />
        ) : pendientes.length === 0 ? (
          <Vacio titulo="No hay solicitudes pendientes" descripcion="Cuando alguien se registre o pida cambios, aparece acá." />
        ) : (
          <div className="overflow-x-auto rounded-(--radius) border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Solicitud</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendientes.map((p) => (
                  <TableRow key={p.versionId}>
                    <TableCell className="whitespace-normal">
                      <NombreOperador nombre={p.nombre} apellido={p.apellido} nombreComercial={p.nombreComercial} />
                    </TableCell>
                    <TableCell>{p.esRegistroInicial ? "Registro nuevo" : "Cambio de datos"}</TableCell>
                    <TableCell className="text-muted-foreground">{fecha(p.fechaEnvioRevision ?? p.fechaCreacion)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/maite/operadores/${p.operadorId}`}>Revisar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : operadores === null ? (
        <TablaCargando />
      ) : operadores.content.length === 0 ? (
        <Vacio titulo="No hay operadores" descripcion="No se encontraron operadores con ese estado." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-(--radius) border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {operadores.content.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-normal">
                      <NombreOperador nombre={o.nombre} apellido={o.apellido} nombreComercial={o.nombreComercial} />
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">+{o.whatsapp}</TableCell>
                    <TableCell>
                      <EstadoOperadorBadge estado={o.estado} />
                      {o.tieneVersionPendiente && o.estado !== "PENDIENTE_REVISION" && (
                        <Badge variant="outline" className="ml-2">
                          cambios pendientes
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/maite/operadores/${o.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {operadores.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
              Página {operadores.page + 1} de {operadores.totalPages}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Página anterior"
                disabled={pagina === 0}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Página siguiente"
                disabled={pagina >= operadores.totalPages - 1}
                onClick={() => setPagina((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Pestana({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={cn(
        "flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors",
        activa ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Vacio({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Empty className="rounded-(--radius) border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NombreOperador({
  nombre,
  apellido,
  nombreComercial,
}: {
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
}) {
  return (
    <>
      <div className="font-medium">
        {nombre} {apellido}
      </div>
      {nombreComercial && <div className="text-sm text-muted-foreground">{nombreComercial}</div>}
    </>
  );
}

export function EstadoOperadorBadge({ estado }: { estado: EstadoOperador }) {
  switch (estado) {
    case "ACTIVO":
      return <Badge variant="secondary">Activo</Badge>;
    case "PENDIENTE_REVISION":
      return <Badge>Pendiente</Badge>;
    case "SUSPENDIDO":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Suspendido
        </Badge>
      );
    case "RECHAZADO":
      return <Badge variant="destructive">Rechazado</Badge>;
  }
}

export function fecha(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
