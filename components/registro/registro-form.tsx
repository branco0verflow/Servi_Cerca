"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, ImagePlus, Plus, Trash2, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Localidad,
  Moneda,
  Oficio,
  PublicApiError,
  RegistroDatos,
  RegistroRespuesta,
  TipoPublicacion,
  listarLocalidades,
  listarOficios,
  registrarOperador,
} from "@/lib/public-api";

// Límites del backend (RegistroOperadorRequest e ImageValidator).
const MAX_OFICIOS = 10;
const MAX_PUBLICACIONES = 5;
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const ACEPTA_IMAGEN = TIPOS_IMAGEN.join(",");

const TIPOS_PUBLICACION: { valor: TipoPublicacion; etiqueta: string }[] = [
  { valor: "TRABAJO_REALIZADO", etiqueta: "Trabajo realizado" },
  { valor: "SERVICIO_DESTACADO", etiqueta: "Servicio destacado" },
  { valor: "PRODUCTO", etiqueta: "Producto" },
];

const SELECT_ANCHO_COMPLETO = "[&>[data-slot=native-select-wrapper]]:w-full";

type OficioElegido = { descripcionServicio: string; precioDesde: string; moneda: Moneda };

type PublicacionBorrador = {
  clave: number;
  titulo: string;
  tipo: TipoPublicacion;
  descripcion: string;
  precio: string;
  moneda: Moneda;
  imagen: File | null;
};

type Errores = Record<string, string>;

export function RegistroForm() {
  const [localidades, setLocalidades] = useState<Localidad[] | null>(null);
  const [oficios, setOficios] = useState<Oficio[] | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [localidadIds, setLocalidadIds] = useState<number[]>([]);
  const [elegidos, setElegidos] = useState<Record<number, OficioElegido>>({});
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [publicaciones, setPublicaciones] = useState<PublicacionBorrador[]>([]);
  const siguienteClave = useRef(1);

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<RegistroRespuesta | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    Promise.all([listarLocalidades(), listarOficios()])
      .then(([listaLocalidades, listaOficios]) => {
        setLocalidades(listaLocalidades);
        setOficios(listaOficios);
      })
      .catch(() => setErrorCarga(true));
  }, []);

  // Trabajos agrupados por tipo, en orden alfabético.
  const grupos = useMemo(() => {
    const porTipo = new Map<string, Oficio[]>();
    for (const oficio of oficios ?? []) {
      const lista = porTipo.get(oficio.categoria.nombre) ?? [];
      lista.push(oficio);
      porTipo.set(oficio.categoria.nombre, lista);
    }
    return [...porTipo.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [oficios]);

  const cantidadElegidos = Object.keys(elegidos).length;

  function alternarLocalidad(id: number, marcada: boolean) {
    setLocalidadIds((actual) => (marcada ? [...actual, id] : actual.filter((x) => x !== id)));
  }

  function alternarOficio(id: number, marcado: boolean) {
    setElegidos((actual) => {
      const copia = { ...actual };
      if (marcado) copia[id] = { descripcionServicio: "", precioDesde: "", moneda: "UYU" };
      else delete copia[id];
      return copia;
    });
  }

  function editarOficio(id: number, cambios: Partial<OficioElegido>) {
    setElegidos((actual) => ({ ...actual, [id]: { ...actual[id], ...cambios } }));
  }

  function agregarPublicacion() {
    setPublicaciones((actual) => [
      ...actual,
      {
        clave: siguienteClave.current++,
        titulo: "",
        tipo: "TRABAJO_REALIZADO",
        descripcion: "",
        precio: "",
        moneda: "UYU",
        imagen: null,
      },
    ]);
  }

  function editarPublicacion(clave: number, cambios: Partial<PublicacionBorrador>) {
    setPublicaciones((actual) => actual.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)));
  }

  function validar(): Errores {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = "Ingresá tu nombre.";
    if (!apellido.trim()) e.apellido = "Ingresá tu apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Ingresá un email válido.";
    if (!/^[0-9+()\s.-]{6,30}$/.test(telefono.trim())) e.telefono = "Ingresá un teléfono válido.";
    if (!esCelularUruguayo(whatsapp)) e.whatsapp = "Ingresá un celular uruguayo, por ejemplo 099 123 456.";
    if (localidadIds.length === 0) e.localidadIds = "Elegí al menos una localidad.";
    if (cantidadElegidos === 0) e.oficios = "Elegí al menos un trabajo.";
    if (cantidadElegidos > MAX_OFICIOS) e.oficios = `Podés elegir hasta ${MAX_OFICIOS} trabajos.`;
    for (const [id, datos] of Object.entries(elegidos)) {
      if (datos.precioDesde.trim() && aNumero(datos.precioDesde) === null) {
        e[`oficio-${id}`] = "El precio debe ser un número, por ejemplo 1500.";
      }
    }
    if (fotoPerfil) {
      const problema = problemaImagen(fotoPerfil);
      if (problema) e.fotoPerfil = problema;
    }
    for (const p of publicaciones) {
      if (!p.titulo.trim()) e[`publicacion-${p.clave}-titulo`] = "Poné un título.";
      if (!p.imagen) e[`publicacion-${p.clave}-imagen`] = "Cada publicación necesita una imagen.";
      else {
        const problema = problemaImagen(p.imagen);
        if (problema) e[`publicacion-${p.clave}-imagen`] = problema;
      }
      if (p.precio.trim() && aNumero(p.precio) === null) {
        e[`publicacion-${p.clave}-precio`] = "El precio debe ser un número, por ejemplo 1500.";
      }
    }
    return e;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorGeneral(null);
    const encontrados = validar();
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setErrorGeneral("Revisá los campos marcados antes de enviar.");
      // Lleva al primer campo con error.
      requestAnimationFrame(() => {
        formRef.current?.querySelector("[data-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    const datos: RegistroDatos = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      nombreComercial: nombreComercial.trim() || null,
      descripcion: descripcion.trim() || null,
      email: email.trim(),
      telefono: telefono.trim(),
      whatsapp: whatsapp.trim(),
      localidadIds,
      oficios: Object.entries(elegidos).map(([id, o]) => {
        const precio = aNumero(o.precioDesde);
        return {
          oficioId: Number(id),
          descripcionServicio: o.descripcionServicio.trim() || null,
          precioDesde: precio,
          moneda: precio === null ? null : o.moneda,
        };
      }),
      publicaciones: publicaciones.map((p) => {
        const precio = aNumero(p.precio);
        return {
          titulo: p.titulo.trim(),
          descripcion: p.descripcion.trim() || null,
          tipo: p.tipo,
          precio,
          moneda: precio === null ? null : p.moneda,
        };
      }),
    };

    setEnviando(true);
    try {
      const respuesta = await registrarOperador(
        datos,
        fotoPerfil,
        publicaciones.map((p) => p.imagen as File),
      );
      setResultado(respuesta);
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (e instanceof PublicApiError) {
        const detalle = e.fieldErrors.map((f) => `${f.campo}: ${f.mensaje}`).join(" · ");
        setErrorGeneral(detalle ? `${e.message} (${detalle})` : e.message);
      } else {
        setErrorGeneral("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return <RegistroEnviado resultado={resultado} whatsapp={whatsapp.trim()} />;
  }

  if (errorCarga) {
    return (
      <div className="rounded-(--radius) border border-border bg-card p-8 text-center">
        <p className="font-medium">No pudimos cargar el formulario.</p>
        <p className="mt-1 text-sm text-muted-foreground">Revisá tu conexión y volvé a intentar.</p>
        <Button className="mt-5" variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      <Seccion titulo="Tus datos" descripcion="Los usamos para contactarte y armar tu perfil.">
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <CampoTexto id="nombre" etiqueta="Nombre" valor={nombre} onCambio={setNombre} error={errores.nombre} maxLength={80} autoComplete="given-name" disabled={enviando} />
            <CampoTexto id="apellido" etiqueta="Apellido" valor={apellido} onCambio={setApellido} error={errores.apellido} maxLength={80} autoComplete="family-name" disabled={enviando} />
          </div>
          <CampoTexto id="nombreComercial" etiqueta="Nombre comercial (opcional)" valor={nombreComercial} onCambio={setNombreComercial} maxLength={120} placeholder="Ej. Gómez Electricidad" disabled={enviando} />
          <CampoTexto id="email" etiqueta="Email" tipo="email" valor={email} onCambio={setEmail} error={errores.email} maxLength={160} autoComplete="email" disabled={enviando} />
          <div className="grid gap-5 sm:grid-cols-2">
            <CampoTexto id="telefono" etiqueta="Teléfono" tipo="tel" valor={telefono} onCambio={setTelefono} error={errores.telefono} maxLength={30} placeholder="Ej. 099 123 456" autoComplete="tel" disabled={enviando} />
            <CampoTexto id="whatsapp" etiqueta="WhatsApp" tipo="tel" valor={whatsapp} onCambio={setWhatsapp} error={errores.whatsapp} maxLength={25} placeholder="Ej. 099 123 456" ayuda="Por acá te avisamos cuando tu perfil esté aprobado." disabled={enviando} />
          </div>
          <Field>
            <FieldLabel htmlFor="descripcion">Contanos sobre tu trabajo (opcional)</FieldLabel>
            <Textarea id="descripcion" rows={4} maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Experiencia, horarios, zona en la que trabajás…" disabled={enviando} />
          </Field>
        </FieldGroup>
      </Seccion>

      <Seccion titulo="¿Dónde trabajás?" descripcion="Elegí todas las localidades en las que ofrecés tus servicios.">
        <div data-invalid={errores.localidadIds ? true : undefined}>
          {localidades === null ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {localidades.map((localidad) => (
                <label key={localidad.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={localidadIds.includes(localidad.id)}
                    onCheckedChange={(marcada) => alternarLocalidad(localidad.id, marcada === true)}
                    disabled={enviando}
                  />
                  {localidad.nombre}
                </label>
              ))}
            </div>
          )}
          {errores.localidadIds && <FieldError className="mt-3">{errores.localidadIds}</FieldError>}
        </div>
      </Seccion>

      <Seccion
        titulo="¿Qué trabajos ofrecés?"
        descripcion={`Elegí hasta ${MAX_OFICIOS}. En cada uno podés contar qué hacés y desde qué precio.`}
      >
        <div data-invalid={errores.oficios ? true : undefined} className="space-y-6">
          {oficios === null ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            grupos.map(([tipo, lista]) => (
              <fieldset key={tipo}>
                <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{tipo}</legend>
                <div className="space-y-3">
                  {lista.map((oficio) => {
                    const datos = elegidos[oficio.id];
                    const bloqueado = !datos && cantidadElegidos >= MAX_OFICIOS;
                    return (
                      <div key={oficio.id} className={datos ? "rounded-md border border-border bg-secondary/40 p-4" : undefined}>
                        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                          <Checkbox
                            checked={!!datos}
                            onCheckedChange={(marcado) => alternarOficio(oficio.id, marcado === true)}
                            disabled={enviando || bloqueado}
                          />
                          {oficio.nombre}
                        </label>
                        {datos && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]" data-invalid={errores[`oficio-${oficio.id}`] ? true : undefined}>
                            <Field>
                              <FieldLabel htmlFor={`oficio-${oficio.id}-descripcion`}>Qué ofrecés (opcional)</FieldLabel>
                              <Input
                                id={`oficio-${oficio.id}-descripcion`}
                                maxLength={500}
                                value={datos.descripcionServicio}
                                onChange={(e) => editarOficio(oficio.id, { descripcionServicio: e.target.value })}
                                placeholder="Ej. Instalaciones, tableros, urgencias"
                                disabled={enviando}
                              />
                            </Field>
                            <CampoPrecio
                              id={`oficio-${oficio.id}-precio`}
                              etiqueta="Precio desde (opcional)"
                              precio={datos.precioDesde}
                              moneda={datos.moneda}
                              onPrecio={(precioDesde) => editarOficio(oficio.id, { precioDesde })}
                              onMoneda={(moneda) => editarOficio(oficio.id, { moneda })}
                              error={errores[`oficio-${oficio.id}`]}
                              disabled={enviando}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}
          {errores.oficios && <FieldError>{errores.oficios}</FieldError>}
        </div>
      </Seccion>

      <Seccion titulo="Foto de perfil (opcional)" descripcion="JPG, PNG o WebP de hasta 5 MB.">
        <div data-invalid={errores.fotoPerfil ? true : undefined}>
          <SelectorImagen
            id="fotoPerfil"
            archivo={fotoPerfil}
            onCambio={setFotoPerfil}
            redonda
            etiqueta="Elegir foto"
            disabled={enviando}
          />
          {errores.fotoPerfil && <FieldError className="mt-3">{errores.fotoPerfil}</FieldError>}
        </div>
      </Seccion>

      <Seccion
        titulo="Publicaciones (opcional)"
        descripcion={`Mostrá hasta ${MAX_PUBLICACIONES} trabajos realizados, servicios o productos. Cada una lleva una imagen.`}
      >
        <div className="space-y-4">
          {publicaciones.map((p, indice) => (
            <div key={p.clave} className="rounded-md border border-border p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Publicación {indice + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPublicaciones((actual) => actual.filter((x) => x.clave !== p.clave))}
                  disabled={enviando}
                >
                  <Trash2 /> Quitar
                </Button>
              </div>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
                  <CampoTexto
                    id={`publicacion-${p.clave}-titulo`}
                    etiqueta="Título"
                    valor={p.titulo}
                    onCambio={(titulo) => editarPublicacion(p.clave, { titulo })}
                    error={errores[`publicacion-${p.clave}-titulo`]}
                    maxLength={120}
                    placeholder="Ej. Tablero eléctrico nuevo"
                    disabled={enviando}
                  />
                  <Field className={SELECT_ANCHO_COMPLETO}>
                    <FieldLabel htmlFor={`publicacion-${p.clave}-tipo`}>Tipo</FieldLabel>
                    <NativeSelect
                      id={`publicacion-${p.clave}-tipo`}
                      className="py-0"
                      value={p.tipo}
                      onChange={(e) => editarPublicacion(p.clave, { tipo: e.target.value as TipoPublicacion })}
                      disabled={enviando}
                    >
                      {TIPOS_PUBLICACION.map((t) => (
                        <NativeSelectOption key={t.valor} value={t.valor}>
                          {t.etiqueta}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`publicacion-${p.clave}-descripcion`}>Descripción (opcional)</FieldLabel>
                  <Textarea
                    id={`publicacion-${p.clave}-descripcion`}
                    rows={2}
                    maxLength={1000}
                    value={p.descripcion}
                    onChange={(e) => editarPublicacion(p.clave, { descripcion: e.target.value })}
                    disabled={enviando}
                  />
                </Field>
                <div data-invalid={errores[`publicacion-${p.clave}-precio`] ? true : undefined} className="max-w-xs">
                  <CampoPrecio
                    id={`publicacion-${p.clave}-precio`}
                    etiqueta="Precio (opcional)"
                    precio={p.precio}
                    moneda={p.moneda}
                    onPrecio={(precio) => editarPublicacion(p.clave, { precio })}
                    onMoneda={(moneda) => editarPublicacion(p.clave, { moneda })}
                    error={errores[`publicacion-${p.clave}-precio`]}
                    disabled={enviando}
                  />
                </div>
                <div data-invalid={errores[`publicacion-${p.clave}-imagen`] ? true : undefined}>
                  <SelectorImagen
                    id={`publicacion-${p.clave}-imagen`}
                    archivo={p.imagen}
                    onCambio={(imagen) => editarPublicacion(p.clave, { imagen })}
                    etiqueta="Elegir imagen"
                    disabled={enviando}
                  />
                  {errores[`publicacion-${p.clave}-imagen`] && (
                    <FieldError className="mt-3">{errores[`publicacion-${p.clave}-imagen`]}</FieldError>
                  )}
                </div>
              </FieldGroup>
            </div>
          ))}
          {publicaciones.length < MAX_PUBLICACIONES && (
            <Button type="button" variant="outline" onClick={agregarPublicacion} disabled={enviando}>
              <Plus /> Agregar publicación
            </Button>
          )}
        </div>
      </Seccion>

      <div className="rounded-(--radius) border border-border bg-card p-5 sm:p-6">
        <div className="flex gap-3 text-sm">
          <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">La revisión puede tardar hasta 24 horas.</p>
            <p className="mt-1 text-muted-foreground">
              Tus fotos e imágenes se suben recién cuando enviás el formulario. Revisamos la información antes de
              publicar tu perfil y te avisamos por WhatsApp.
            </p>
          </div>
        </div>

        {errorGeneral && (
          <div role="alert" className="mt-5 flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{errorGeneral}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="mt-5 h-12 w-full" disabled={enviando || localidades === null || oficios === null}>
          {enviando ? (
            <>
              <Spinner /> Enviando y subiendo imágenes…
            </>
          ) : (
            <>
              Enviar formulario a revisión <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function RegistroEnviado({ resultado, whatsapp }: { resultado: RegistroRespuesta; whatsapp: string }) {
  const fallidas = [resultado.fotoPerfil, ...resultado.publicaciones].filter(
    (imagen): imagen is NonNullable<typeof imagen> => imagen !== null && !imagen.subida,
  );
  return (
    <div className="rounded-(--radius) border border-border bg-card p-8 text-center sm:p-12">
      <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
        <Check className="size-8" />
      </span>
      <h2 className="text-2xl font-semibold">¡Recibimos tu solicitud!</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        La vamos a revisar en un plazo de hasta 24 horas. Cuando tu perfil esté activo te avisamos por WhatsApp al{" "}
        <strong className="text-foreground">{whatsapp}</strong>.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Si más adelante querés modificar tus datos, pedilo respondiendo a ese mismo contacto.
      </p>
      {fallidas.length > 0 && (
        <div className="mx-auto mt-6 max-w-md rounded-md border border-border bg-secondary/40 p-4 text-left text-sm">
          <p className="font-medium">Tu registro se guardó, pero no pudimos subir:</p>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            {fallidas.map((imagen, i) => (
              <li key={i}>{imagen.titulo}</li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">Podés enviarlas por WhatsApp cuando te contactemos.</p>
        </div>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: React.ReactNode }) {
  return (
    <section className="rounded-(--radius) border border-border bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{descripcion}</p>
      {children}
    </section>
  );
}

function CampoTexto({
  id,
  etiqueta,
  valor,
  onCambio,
  error,
  ayuda,
  tipo = "text",
  ...props
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  ayuda?: string;
  tipo?: "text" | "email" | "tel";
} & Pick<React.ComponentProps<"input">, "maxLength" | "placeholder" | "autoComplete" | "disabled">) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Input id={id} type={tipo} value={valor} onChange={(e) => onCambio(e.target.value)} aria-invalid={error ? true : undefined} {...props} />
      {error ? <FieldError>{error}</FieldError> : ayuda && <FieldDescription>{ayuda}</FieldDescription>}
    </Field>
  );
}

function CampoPrecio({
  id,
  etiqueta,
  precio,
  moneda,
  onPrecio,
  onMoneda,
  error,
  disabled,
}: {
  id: string;
  etiqueta: string;
  precio: string;
  moneda: Moneda;
  onPrecio: (valor: string) => void;
  onMoneda: (valor: Moneda) => void;
  error?: string;
  disabled: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <div className="flex gap-2">
        <NativeSelect aria-label="Moneda" className="py-0" value={moneda} onChange={(e) => onMoneda(e.target.value as Moneda)} disabled={disabled}>
          <NativeSelectOption value="UYU">$U</NativeSelectOption>
          <NativeSelectOption value="USD">US$</NativeSelectOption>
        </NativeSelect>
        <Input id={id} inputMode="decimal" className="w-32" value={precio} onChange={(e) => onPrecio(e.target.value)} placeholder="1500" aria-invalid={error ? true : undefined} disabled={disabled} />
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

/** Selector de imagen con vista previa. El archivo queda en el navegador hasta que se envía el formulario. */
function SelectorImagen({
  id,
  archivo,
  onCambio,
  etiqueta,
  redonda = false,
  disabled,
}: {
  id: string;
  archivo: File | null;
  onCambio: (archivo: File | null) => void;
  etiqueta: string;
  redonda?: boolean;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const urlActual = useRef<string | null>(null);

  function elegir(nuevo: File | null) {
    if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    urlActual.current = nuevo ? URL.createObjectURL(nuevo) : null;
    setVistaPrevia(urlActual.current);
    onCambio(nuevo);
  }

  // Libera la vista previa al desmontar (por ejemplo, al quitar la publicación).
  useEffect(
    () => () => {
      if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    },
    [],
  );

  return (
    <div className="flex items-center gap-4">
      <div
        className={`grid size-20 shrink-0 place-items-center overflow-hidden border border-border bg-secondary text-muted-foreground ${redonda ? "rounded-full" : "rounded-md"}`}
      >
        {vistaPrevia ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por next/image
          <img src={vistaPrevia} alt="Vista previa" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6" />
        )}
      </div>
      <div className="min-w-0">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACEPTA_IMAGEN}
          className="sr-only"
          onChange={(e) => {
            elegir(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
          disabled={disabled}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
            {archivo ? "Cambiar" : etiqueta}
          </Button>
          {archivo && (
            <Button type="button" variant="ghost" size="sm" onClick={() => elegir(null)} disabled={disabled}>
              <X /> Quitar
            </Button>
          )}
        </div>
        {archivo && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {archivo.name} · {(archivo.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>
    </div>
  );
}

function problemaImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return "La imagen tiene que ser JPG, PNG o WebP.";
  if (archivo.size > MAX_IMAGEN_BYTES) return "La imagen pesa más de 5 MB.";
  return null;
}

/**
 * "1500", "1.500", "1.500,50" o "1500.5" → número con hasta 2 decimales; null si está vacío o no es válido.
 * El punto se toma como separador de miles cuando agrupa de a tres dígitos ("1.500" es mil quinientos).
 */
function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, "");
  if (!limpio) return null;
  const normalizado =
    limpio.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(limpio) ? limpio.replace(/\./g, "").replace(",", ".") : limpio;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalizado)) return null;
  return Number(normalizado);
}

/** Misma regla que el backend (WhatsappNormalizer): celular uruguayo 598 9X XXX XXX. */
function esCelularUruguayo(texto: string): boolean {
  if (!/^[0-9+()\s.-]{8,25}$/.test(texto.trim())) return false;
  let digitos = texto.replace(/\D/g, "");
  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  if (digitos.length === 9 && digitos.startsWith("09")) digitos = "598" + digitos.slice(1);
  else if (digitos.length === 8 && digitos.startsWith("9")) digitos = "598" + digitos;
  return /^5989\d{7}$/.test(digitos);
}
