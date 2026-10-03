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
  /** Aceptación de los Términos y la Política de privacidad; el backend la exige en el registro. */
  aceptaTerminos: boolean;
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

// ---------- Búsqueda pública de operadores ----------

export type OperadorResumen = {
  id: number;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  descripcionBreve: string | null;
  fotoPerfilUrl: string | null;
  whatsapp: string;
  oficio: {
    oficioId: number;
    nombre: string;
    descripcionServicio: string | null;
    precioDesde: number | null;
    moneda: Moneda | null;
  };
  calificacionPromedio: number | null;
  cantidadCalificaciones: number;
};

export type ResultadoBusqueda = { content: OperadorResumen[]; totalElements: number };

/** Operadores aprobados que ofrecen ese trabajo en esa localidad, mejor calificados primero. */
export const buscarOperadores = (localidadId: number, oficioId: number) =>
  obtener<ResultadoBusqueda>(`/api/public/operators/search?locationId=${localidadId}&tradeId=${oficioId}&size=24`);

// ---------- Ficha pública de un operador ----------

export type OficioPublico = {
  oficioId: number;
  nombre: string;
  categoria: string;
  descripcionServicio: string | null;
  precioDesde: number | null;
  moneda: Moneda | null;
};

export type PublicacionPublica = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoPublicacion;
  precio: number | null;
  moneda: Moneda | null;
  imagenUrl: string | null;
};

export type OperadorPublico = {
  id: number;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  descripcion: string | null;
  fotoPerfilUrl: string | null;
  telefono: string;
  whatsapp: string;
  oficios: OficioPublico[];
  localidades: Localidad[];
  publicaciones: PublicacionPublica[];
  calificacionPromedio: number | null;
  cantidadCalificaciones: number;
  activoDesde: string | null;
};

export type Calificacion = {
  id: number;
  puntaje: number;
  comentario: string | null;
  nombreCliente: string | null;
  fecha: string;
};

export type PaginaCalificaciones = { content: Calificacion[]; page: number; totalPages: number; totalElements: number };

/** Lanza PublicApiError con status 404 si el operador no existe o no está activo. */
export const obtenerOperadorPublico = (id: number) => obtener<OperadorPublico>(`/api/public/operators/${id}`);
export const listarCalificaciones = (id: number, page: number) =>
  obtener<PaginaCalificaciones>(`/api/public/operators/${id}/ratings?page=${page}&size=10`);

/** Lo que envía el formulario para calificar. `sitioWeb` es el campo trampa: una persona lo deja vacío. */
export type CalificacionNueva = {
  puntaje: number;
  comentario: string | null;
  nombreCliente: string | null;
  confirmaServicio: boolean;
  sitioWeb: string;
};

/** Queda pendiente de revisión. Lanza 409 CALIFICACION_DUPLICADA si ya calificó a este operador hace poco. */
export async function calificarOperador(id: number, datos: CalificacionNueva): Promise<{ mensaje: string }> {
  const respuesta = await fetch(`/api/public/operators/${id}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!respuesta.ok) throw await aError(respuesta);
  return (await respuesta.json()) as { mensaje: string };
}
