// Cliente de la API pública (vía el proxy /api de next.config.ts): catálogo y registro de operadores.

export type Localidad = { id: number; nombre: string; departamento: string };

export type Oficio = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  categoria: { id: number; nombre: string };
  iconoUrl: string | null;
};

export type Moneda = "UYU" | "USD";
export type TipoPublicacion = "TRABAJO_REALIZADO" | "PRODUCTO" | "SERVICIO_DESTACADO";

export type OficioOfrecido = {
  oficioId: number;
  descripcionServicio: string | null;
  precioDesde: number | null;
  moneda: Moneda | null;
};

export type PublicacionDatos = {
  titulo: string;
  descripcion: string | null;
  tipo: TipoPublicacion;
  precio: number | null;
  moneda: Moneda | null;
};

export type RegistroDatos = {
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  descripcion: string | null;
  email: string;
  telefono: string;
  whatsapp: string;
  localidadIds: number[];
  oficios: OficioOfrecido[];
  publicaciones: PublicacionDatos[];
};

export type ImagenResultado = { indice: number | null; titulo: string; subida: boolean; error: string | null };

export type RegistroRespuesta = {
  operadorId: number;
  estado: string;
  mensaje: string;
  fotoPerfil: ImagenResultado | null;
  publicaciones: ImagenResultado[];
  todasLasImagenesSubidas: boolean;
};

export type ErrorCampo = { campo: string; mensaje: string };

export class PublicApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fieldErrors: ErrorCampo[] = [],
  ) {
    super(message);
  }
}

async function aError(respuesta: Response): Promise<PublicApiError> {
  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    fieldErrors?: ErrorCampo[] | null;
  };
  const mensaje =
    respuesta.status === 429
      ? "Hiciste demasiados envíos. Esperá un rato antes de volver a intentar."
      : respuesta.status === 413
        ? "Las imágenes pesan demasiado. Cada una puede pesar hasta 5 MB."
        : (cuerpo.message ?? "Ocurrió un error inesperado. Intentá de nuevo.");
  return new PublicApiError(mensaje, respuesta.status, cuerpo.code, cuerpo.fieldErrors ?? []);
}

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(ruta, { cache: "no-store" });
  if (!respuesta.ok) throw await aError(respuesta);
  return (await respuesta.json()) as T;
}

export const listarLocalidades = () => obtener<Localidad[]>("/api/public/locations");
export const listarOficios = () => obtener<Oficio[]>("/api/public/trades");

/**
 * Envía el registro completo en una sola solicitud: recién acá se suben la foto y las imágenes.
 * {@code imagenes} va en el mismo orden que {@code datos.publicaciones}.
 */
export async function registrarOperador(
  datos: RegistroDatos,
  fotoPerfil: File | null,
  imagenes: File[],
): Promise<RegistroRespuesta> {
  const cuerpo = new FormData();
  cuerpo.append("data", new Blob([JSON.stringify(datos)], { type: "application/json" }));
  if (fotoPerfil) cuerpo.append("fotoPerfil", fotoPerfil);
  for (const imagen of imagenes) cuerpo.append("imagenesPublicaciones", imagen);

  const respuesta = await fetch("/api/public/operators/register", { method: "POST", body: cuerpo });
  if (!respuesta.ok) throw await aError(respuesta);
  return (await respuesta.json()) as RegistroRespuesta;
}
