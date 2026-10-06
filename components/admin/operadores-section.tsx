"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

import { useAdminError } from "@/components/admin/admin-shell";
import {
  BotonAvisoSuscripcion,
  SuscripcionBadge,
  fechaCorta,
  plazoSuscripcion,
} from "@/components/admin/suscripcion-tarjeta";
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
  SuscripcionOperador,
  VersionPendiente,
  listarOperadores,
  listarSuscripcionesPorVencer,
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
  const [vista, setVista] = useState<"pendientes" | "suscripciones" | "todos">("pendientes");
  const [pendientes, setPendientes] = useState<VersionPendiente[] | null>(null);
  // Suscripciones vencidas o que vencen en 30 días o menos.
  const [porVencer, setPorVencer] = useState<SuscripcionOperador[] | null>(null);
  const [estado, setEstado] = useState<EstadoOperador | null>(null);
  const [pagina, setPagina] = useState(0);
  const [operadores, setOperadores] = useState<Pagina<OperadorResumen> | null>(null);

  const cargarPorVencer = useCallback(
    () => listarSuscripcionesPorVencer().then(setPorVencer).catch(manejarError),
    [manejarError],
  );

  useEffect(() => {
    listarVersionesPendientes()
      .then((respuesta) => setPendientes(respuesta.content))
      .catch(manejarError);
    cargarPorVencer();
  }, [manejarError, cargarPorVencer]);

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
          <Pestana activa={vista === "suscripciones"} onClick={() => setVista("suscripciones")}>
            Suscripciones por vencer
            {porVencer !== null && porVencer.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-black">{porVencer.length}</Badge>
            )}
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
      ) : vista === "suscripciones" ? (
        porVencer === null ? (
          <TablaCargando />
        ) : porVencer.length === 0 ? (
          <Vacio
            titulo="No hay suscripciones por vencer"
            descripcion="Acá aparecen las que vencen en 30 días o menos y las que ya vencieron."
          />
        ) : (
          <div className="overflow-x-auto rounded-(--radius) border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Aviso</TableHead>
                  <TableHead className="w-64" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {porVencer.map((s) => (
                  <TableRow key={s.operadorId}>
                    <TableCell className="whitespace-normal">
                      <NombreOperador nombre={s.nombre} apellido={s.apellido} nombreComercial={s.nombreComercial} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <SuscripcionBadge suscripcion={s.suscripcion} />
                        {s.suscripcion.fechaVencimiento && fechaCorta(s.suscripcion.fechaVencimiento)}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">{plazoSuscripcion(s.suscripcion)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.suscripcion.fechaAvisoEnviado ? `Avisado el ${fecha(s.suscripcion.fechaAvisoEnviado)}` : "Sin avisar"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <BotonAvisoSuscripcion
                          compacto
                          operadorId={s.operadorId}
                          nombre={s.nombre}
                          whatsapp={s.whatsapp}
                          suscripcion={s.suscripcion}
                          onAvisado={cargarPorVencer}
                        />
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/maite/operadores/${s.operadorId}`}>Renovar</Link>
                        </Button>
                      </div>
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
                      {/* En activos y suspendidos se avisa solo lo que requiere atención: vencida, por vencer o sin fecha. */}
                      {o.suscripcion &&
                        (o.estado === "ACTIVO" || o.estado === "SUSPENDIDO") &&
                        (o.suscripcion.estado !== "ACTIVA" || o.suscripcion.porVencer) && (
                          <span className="ml-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            suscripción <SuscripcionBadge suscripcion={o.suscripcion} />
                          </span>
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
