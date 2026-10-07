"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";

import { useAdminError } from "@/components/admin/admin-shell";
import { Paginador } from "@/components/admin/paginador";
import {
  BotonAvisoSuscripcion,
  SuscripcionBadge,
  fechaCorta,
  plazoSuscripcion,
} from "@/components/admin/suscripcion-tarjeta";
import { TablaCargando } from "@/components/admin/tipos-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  listarSuscripcionesVencidas,
  listarVersionesPendientes,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const ESTADOS: { valor: EstadoOperador; etiqueta: string }[] = [
  { valor: "ACTIVO", etiqueta: "Activos" },
  { valor: "PENDIENTE_REVISION", etiqueta: "Pendientes de revisión" },
  { valor: "SUSPENDIDO", etiqueta: "Suspendidos" },
  { valor: "RECHAZADO", etiqueta: "Rechazados" },
];

type Vista = "pendientes" | "suscripciones" | "todos";

/** Una página que quedó sin filas (por ejemplo, tras renovar la última): hay que volver a la anterior. */
function paginaVacia(pagina: Pagina<unknown>) {
  return pagina.content.length === 0 && pagina.page > 0;
}

// Todas las listas se piden de a una página (20 filas): ninguna crece con la cantidad de operadores.
export function OperadoresSection() {
  const manejarError = useAdminError();
  const [vista, setVista] = useState<Vista>("pendientes");

  const [paginaPendientes, setPaginaPendientes] = useState(0);
  const [pendientes, setPendientes] = useState<Pagina<VersionPendiente> | null>(null);

  // Suscripciones: las que vencen en 30 días o menos y, aparte, las ya vencidas (que pueden acumularse).
  const [tipoSuscripcion, setTipoSuscripcion] = useState<"porVencer" | "vencidas">("porVencer");
  const [paginaPorVencer, setPaginaPorVencer] = useState(0);
  const [porVencer, setPorVencer] = useState<Pagina<SuscripcionOperador> | null>(null);
  const [paginaVencidas, setPaginaVencidas] = useState(0);
  const [vencidas, setVencidas] = useState<Pagina<SuscripcionOperador> | null>(null);
  // Cambia para volver a pedir las suscripciones (por ejemplo, después de registrar un aviso).
  const [recarga, setRecarga] = useState(0);

  const [estado, setEstado] = useState<EstadoOperador | null>(null);
  const [pagina, setPagina] = useState(0);
  const [operadores, setOperadores] = useState<Pagina<OperadorResumen> | null>(null);
  // Lo que está escrito en el buscador y, con una pausa para no consultar en cada tecla, lo que se busca.
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const limpio = texto.trim();
    const espera = setTimeout(() => {
      if (limpio === busqueda) return;
      setOperadores(null);
      setPagina(0);
      setBusqueda(limpio);
    }, 300);
    return () => clearTimeout(espera);
  }, [texto, busqueda]);

  useEffect(() => {
    let vigente = true;
    listarVersionesPendientes(paginaPendientes)
      .then((respuesta) => vigente && (paginaVacia(respuesta) ? setPaginaPendientes(respuesta.page - 1) : setPendientes(respuesta)))
      .catch(manejarError);
    return () => {
      vigente = false;
    };
  }, [paginaPendientes, manejarError]);

  // Las dos se piden desde el inicio para mostrar sus cantidades en las pestañas.
  useEffect(() => {
    let vigente = true;
    listarSuscripcionesPorVencer(paginaPorVencer)
      .then((respuesta) => vigente && (paginaVacia(respuesta) ? setPaginaPorVencer(respuesta.page - 1) : setPorVencer(respuesta)))
      .catch(manejarError);
    return () => {
      vigente = false;
    };
  }, [paginaPorVencer, recarga, manejarError]);

  useEffect(() => {
    let vigente = true;
    listarSuscripcionesVencidas(paginaVencidas)
      .then((respuesta) => vigente && (paginaVacia(respuesta) ? setPaginaVencidas(respuesta.page - 1) : setVencidas(respuesta)))
      .catch(manejarError);
    return () => {
      vigente = false;
    };
  }, [paginaVencidas, recarga, manejarError]);

  useEffect(() => {
    if (vista !== "todos") return;
    let vigente = true;
    listarOperadores(estado, pagina, busqueda)
      .then((respuesta) => vigente && setOperadores(respuesta))
      .catch(manejarError);
    return () => {
      vigente = false;
    };
  }, [vista, estado, pagina, busqueda, manejarError]);

  const totalSuscripciones = (porVencer?.totalElements ?? 0) + (vencidas?.totalElements ?? 0);
  const suscripciones = tipoSuscripcion === "porVencer" ? porVencer : vencidas;

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

      {/* Buscar lleva a "Todos": se busca entre todos los operadores, sin importar su estado. */}
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre y apellido o WhatsApp…"
          aria-label="Buscar operador por nombre y apellido o WhatsApp"
          className="pl-9"
          maxLength={80}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (e.target.value.trim()) setVista("todos");
          }}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md bg-secondary p-1" role="tablist">
          <Pestana activa={vista === "pendientes"} onClick={() => setVista("pendientes")}>
            Pendientes de revisión
            {pendientes !== null && pendientes.totalElements > 0 && (
              <Badge className="ml-2">{pendientes.totalElements}</Badge>
            )}
          </Pestana>
          <Pestana activa={vista === "suscripciones"} onClick={() => setVista("suscripciones")}>
            Suscripciones
            {totalSuscripciones > 0 && <Badge className="ml-2 bg-amber-500 text-black">{totalSuscripciones}</Badge>}
          </Pestana>
          <Pestana activa={vista === "todos"} onClick={() => setVista("todos")}>
            Todos
          </Pestana>
        </div>

        {vista === "suscripciones" && (
          <NativeSelect
            aria-label="Tipo de suscripciones"
            className="py-0"
            value={tipoSuscripcion}
            onChange={(e) => setTipoSuscripcion(e.target.value as "porVencer" | "vencidas")}
          >
            <NativeSelectOption value="porVencer">
              Por vencer en 30 días{porVencer ? ` (${porVencer.totalElements})` : ""}
            </NativeSelectOption>
            <NativeSelectOption value="vencidas">Vencidas{vencidas ? ` (${vencidas.totalElements})` : ""}</NativeSelectOption>
          </NativeSelect>
        )}
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

      {vista === "pendientes" &&
        (pendientes === null ? (
          <TablaCargando />
        ) : pendientes.content.length === 0 ? (
          <Vacio titulo="No hay solicitudes pendientes" descripcion="Cuando alguien se registre o pida cambios, aparece acá." />
        ) : (
          <>
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
                  {pendientes.content.map((p) => (
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
            <Paginador
              pagina={pendientes.page}
              totalPaginas={pendientes.totalPages}
              total={pendientes.totalElements}
              onCambio={setPaginaPendientes}
            />
          </>
        ))}

      {vista === "suscripciones" &&
        (suscripciones === null ? (
          <TablaCargando />
        ) : suscripciones.content.length === 0 ? (
          <Vacio
            titulo={tipoSuscripcion === "porVencer" ? "No hay suscripciones por vencer" : "No hay suscripciones vencidas"}
            descripcion={
              tipoSuscripcion === "porVencer"
                ? "Acá aparecen las que vencen en 30 días o menos."
                : "Acá aparecen los operadores que dejaron de mostrarse porque su suscripción venció."
            }
          />
        ) : (
          <>
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
                  {suscripciones.content.map((s) => (
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
                            onAvisado={() => setRecarga((r) => r + 1)}
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
            <Paginador
              pagina={suscripciones.page}
              totalPaginas={suscripciones.totalPages}
              total={suscripciones.totalElements}
              onCambio={tipoSuscripcion === "porVencer" ? setPaginaPorVencer : setPaginaVencidas}
            />
          </>
        ))}

      {vista === "todos" &&
        (operadores === null ? (
          <TablaCargando />
        ) : operadores.content.length === 0 ? (
          <Vacio
            titulo={busqueda ? "Sin resultados" : "No hay operadores"}
            descripcion={
              busqueda
                ? `No se encontró ningún operador que coincida con "${busqueda}"${estado ? " en ese estado" : ""}.`
                : "No se encontraron operadores con ese estado."
            }
          />
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
            <Paginador
              pagina={operadores.page}
              totalPaginas={operadores.totalPages}
              total={operadores.totalElements}
              onCambio={setPagina}
            />
          </>
        ))}
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
