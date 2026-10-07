// Cliente de autenticación del administrador contra el backend (vía el proxy /api de next.config.ts).

export type AdminSesion = {
  username: string;
  rol: "ADMIN";
  duracionSesionMinutos: number;
};

type ApiErrorBody = {
  status?: number;
  code?: string;
  message?: string;
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

// Spring Security cambia el token CSRF al iniciar sesión, así que se pide uno nuevo antes de cada escritura.
async function obtenerCsrf(): Promise<string> {
  const respuesta = await fetch("/api/csrf", { credentials: "include", cache: "no-store" });
  if (!respuesta.ok) {
    throw new AdminApiError("No se pudo conectar con el servidor.", respuesta.status);
  }
  const { token } = (await respuesta.json()) as { token: string };
  return token;
}

async function aError(respuesta: Response): Promise<AdminApiError> {
  const cuerpo = (await respuesta.json().catch(() => ({}))) as ApiErrorBody;
  const retryAfter = Number(respuesta.headers.get("Retry-After")) || undefined;
  const mensaje =
    respuesta.status === 401
      ? "Usuario o contraseña incorrectos."
      : respuesta.status === 429
        ? "Demasiados intentos. Esperá unos minutos antes de volver a intentar."
        : (cuerpo.message ?? "Ocurrió un error inesperado. Intentá de nuevo.");
  return new AdminApiError(mensaje, respuesta.status, cuerpo.code, retryAfter);
}

export async function loginAdmin(username: string, password: string): Promise<AdminSesion> {
  const token = await obtenerCsrf();
  const respuesta = await fetch("/api/admin/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
    body: JSON.stringify({ username, password }),
  });
  if (!respuesta.ok) {
    throw await aError(respuesta);
  }
  return (await respuesta.json()) as AdminSesion;
}

/** Devuelve la sesión actual del administrador, o null si no hay sesión. */
export async function adminActual(): Promise<AdminSesion | null> {
  const respuesta = await fetch("/api/admin/auth/me", { credentials: "include", cache: "no-store" });
  if (respuesta.status === 401 || respuesta.status === 403) {
    return null;
  }
  if (!respuesta.ok) {
    throw await aError(respuesta);
  }
  return (await respuesta.json()) as AdminSesion;
}

export async function logoutAdmin(): Promise<void> {
  const token = await obtenerCsrf();
  await fetch("/api/admin/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: { "X-XSRF-TOKEN": token },
  });
}

// ---------- Catálogo: Tipos (categorías) y Trabajos (oficios) ----------

export type Tipo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidadOficios: number;
};

export type TipoDatos = {
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export type Trabajo = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activo: boolean;
  categoria: { id: number; nombre: string };
  categoriaActiva: boolean;
  /** Lo usa algún operador o trabajo registrado: no se puede eliminar, solo desactivar. */
  enUso: boolean;
};

export type TrabajoDatos = {
  nombre: string;
  descripcion: string | null;
  categoriaId: number;
  activo: boolean;
};

async function pedir<T>(metodo: "GET" | "POST" | "PUT" | "DELETE", ruta: string, cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (metodo !== "GET") headers["X-XSRF-TOKEN"] = await obtenerCsrf();
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  const respuesta = await fetch(ruta, {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new AdminApiError("Tu sesión expiró. Volvé a ingresar.", 401, "NO_AUTENTICADO");
    }
    throw await aError(respuesta);
  }
  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
}

export const listarTipos = () => pedir<Tipo[]>("GET", "/api/admin/categories");
export const crearTipo = (datos: TipoDatos) => pedir<Tipo>("POST", "/api/admin/categories", datos);
export const actualizarTipo = (id: number, datos: TipoDatos) =>
  pedir<Tipo>("PUT", `/api/admin/categories/${id}`, datos);
export const eliminarTipo = (id: number) => pedir<void>("DELETE", `/api/admin/categories/${id}`);

export const listarTrabajos = () => pedir<Trabajo[]>("GET", "/api/admin/trades");
export const crearTrabajo = (datos: TrabajoDatos) => pedir<Trabajo>("POST", "/api/admin/trades", datos);
export const actualizarTrabajo = (id: number, datos: TrabajoDatos) =>
  pedir<Trabajo>("PUT", `/api/admin/trades/${id}`, datos);
export const eliminarTrabajo = (id: number) => pedir<void>("DELETE", `/api/admin/trades/${id}`);

// ---------- Operadores: listado, revisión y estado ----------

export type EstadoOperador = "PENDIENTE_REVISION" | "ACTIVO" | "RECHAZADO" | "SUSPENDIDO";
export type EstadoVersion = "BORRADOR" | "PENDIENTE_REVISION" | "APROBADA" | "RECHAZADA" | "ARCHIVADA";

export type Pagina<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

export type VersionPendiente = {
  versionId: number;
  operadorId: number;
  estadoOperador: EstadoOperador;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  fechaEnvioRevision: string | null;
  fechaCreacion: string;
  esRegistroInicial: boolean;
};

export type OperadorResumen = {
  id: number;
  estado: EstadoOperador;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  email: string;
  whatsapp: string;
  tieneVersionPendiente: boolean;
  fechaCreacion: string;
  suscripcion: Suscripcion | null;
};

export type OficioOfrecido = {
  oficioId: number;
  nombre: string;
  categoria: string;
  descripcionServicio: string | null;
  precioDesde: number | null;
  moneda: "UYU" | "USD" | null;
  activo: boolean;
};

export type Publicacion = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: "TRABAJO_REALIZADO" | "PRODUCTO" | "SERVICIO_DESTACADO";
  precio: number | null;
  moneda: "UYU" | "USD" | null;
  imagenUrl: string | null;
};

export type VersionDetalle = {
  versionId: number;
  operadorId: number;
  numeroVersion: number;
  estadoVersion: EstadoVersion;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  descripcion: string | null;
  email: string;
  telefono: string;
  whatsapp: string;
  fotoPerfilUrl: string | null;
  trabajoRemoto: boolean;
  localidades: { id: number; nombre: string; departamento: string }[];
  oficios: OficioOfrecido[];
  /** "No encuentro mi trabajo": lo que el operador contó que hace. */
  trabajoNoEncontrado: string | null;
  publicaciones: Publicacion[];
  fechaEnvioRevision: string | null;
};

export type VersionRevision = {
  operadorId: number;
  estadoOperador: EstadoOperador;
  esRegistroInicial: boolean;
  versionSolicitada: VersionDetalle;
  versionPublicada: VersionDetalle | null;
  diferencias: Diferencias | null;
};

export type VersionResumen = {
  versionId: number;
  numeroVersion: number;
  estadoVersion: EstadoVersion;
  publicada: boolean;
  fechaCreacion: string;
  fechaRevision: string | null;
  revisadoPor: string | null;
  motivoRechazo: string | null;
};

export type OperadorDetalle = {
  id: number;
  estado: EstadoOperador;
  fechaCreacion: string;
  fechaActivacion: string | null;
  versionPublicada: VersionDetalle | null;
  versiones: VersionResumen[];
  calificaciones: { promedio: number | null; cantidad: number };
  /** Versión de los Términos y la Política de privacidad aceptada al registrarse (null: registrado antes). */
  terminosVersion: string | null;
  terminosAceptadosEn: string | null;
  suscripcion: Suscripcion;
};

export const listarVersionesPendientes = (page: number) =>
  pedir<Pagina<VersionPendiente>>("GET", `/api/admin/operator-versions?estado=PENDIENTE_REVISION&size=20&page=${page}`);
/** `busqueda` filtra por nombre y apellido, nombre comercial o número de WhatsApp. */
export const listarOperadores = (estado: EstadoOperador | null, page: number, busqueda = "") => {
  const parametros = new URLSearchParams({ size: "20", page: String(page) });
  if (estado) parametros.set("estado", estado);
  if (busqueda) parametros.set("q", busqueda);
  return pedir<Pagina<OperadorResumen>>("GET", `/api/admin/operators?${parametros}`);
};
export const obtenerOperador = (id: number) => pedir<OperadorDetalle>("GET", `/api/admin/operators/${id}`);
export const obtenerRevision = (versionId: number) =>
  pedir<VersionRevision>("GET", `/api/admin/operator-versions/${versionId}`);
export const aprobarVersion = (versionId: number) =>
  pedir<VersionRevision>("POST", `/api/admin/operator-versions/${versionId}/approve`);
export const rechazarVersion = (versionId: number, motivo: string) =>
  pedir<VersionRevision>("POST", `/api/admin/operator-versions/${versionId}/reject`, { motivo });
/** Agrega un trabajo a una versión pendiente (para quien no encontró el suyo al registrarse). */
export const asignarTrabajo = (versionId: number, oficioId: number) =>
  pedir<VersionRevision>("POST", `/api/admin/operator-versions/${versionId}/trades`, { oficioId });
export const suspenderOperador = (id: number) => pedir<OperadorDetalle>("POST", `/api/admin/operators/${id}/suspend`);
export const reactivarOperador = (id: number) =>
  pedir<OperadorDetalle>("POST", `/api/admin/operators/${id}/reactivate`);

// ---------- Enlaces de edición del operador ----------

/** La URL se muestra una sola vez: el backend solo guarda el hash del token. */
export type EnlaceEdicion = { url: string; fechaExpiracion: string };

/** Genera un enlace de un solo uso (24 h) y revoca los anteriores. */
export const generarEnlaceEdicion = (id: number) =>
  pedir<EnlaceEdicion>("POST", `/api/admin/operators/${id}/edit-links`);

/** Diferencias entre la versión publicada y la enviada a revisión. */
export type Diferencias = {
  hayCambios: boolean;
  camposModificados: { campo: string; anterior: string | null; nuevo: string | null }[];
  oficiosAgregados: { nombre: string }[];
  oficiosEliminados: { nombre: string }[];
  oficiosModificados: { nombre: string }[];
  localidadesAgregadas: { nombre: string }[];
  localidadesEliminadas: { nombre: string }[];
  publicacionesAgregadas: { titulo: string }[];
  publicacionesModificadas: { nueva: { titulo: string } }[];
  publicacionesEliminadas: { titulo: string }[];
};

// ---------- Calificaciones: moderación ----------

export type EstadoCalificacion = "PENDIENTE_REVISION" | "APROBADA" | "RECHAZADA";

export type CalificacionAdmin = {
  id: number;
  operadorId: number;
  operadorNombre: string | null;
  puntaje: number;
  comentario: string | null;
  nombreCliente: string | null;
  estado: EstadoCalificacion;
  origen: "FORMULARIO_PUBLICO" | "ADMIN";
  fechaCreacion: string;
  fechaRevision: string | null;
  revisadoPor: string | null;
  motivoRechazo: string | null;
  /** Otras calificaciones enviadas desde la misma IP (a cualquier operador): posible envío repetido. */
  otrasDesdeMismoOrigen: number;
};

export const listarCalificacionesAdmin = (estado: EstadoCalificacion | null, page: number) =>
  pedir<Pagina<CalificacionAdmin>>("GET", `/api/admin/ratings?size=20&page=${page}${estado ? `&estado=${estado}` : ""}`);
export const aprobarCalificacion = (id: number) => pedir<CalificacionAdmin>("POST", `/api/admin/ratings/${id}/approve`);
export const rechazarCalificacion = (id: number, motivo: string | null) =>
  pedir<CalificacionAdmin>("POST", `/api/admin/ratings/${id}/reject`, { motivo });

// ---------- Suscripciones ----------

/**
 * Suscripción de un operador. El estado lo calcula el backend a partir de la fecha:
 * sin fecha es PENDIENTE; con la suscripción VENCIDA el operador no se muestra en el sitio.
 */
export type Suscripcion = {
  /** Primer día en que deja de estar vigente, como AAAA-MM-DD; null si todavía no se definió. */
  fechaVencimiento: string | null;
  estado: "PENDIENTE" | "ACTIVA" | "VENCIDA";
  /** Días hasta el vencimiento (0 o negativo si ya venció); null si no tiene fecha. */
  diasRestantes: number | null;
  /** Vigente, pero vence en 30 días o menos. */
  porVencer: boolean;
  /** Cuándo se le avisó que está por vencer; se reinicia al renovar. */
  fechaAvisoEnviado: string | null;
};

export type SuscripcionOperador = {
  operadorId: number;
  estadoOperador: EstadoOperador;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  whatsapp: string;
  suscripcion: Suscripcion;
};

/** Define o renueva el vencimiento (AAAA-MM-DD, posterior a hoy). */
export const definirVencimiento = (operadorId: number, fechaVencimiento: string) =>
  pedir<Suscripcion>("PUT", `/api/admin/operators/${operadorId}/subscription`, { fechaVencimiento });
/** Deja constancia de que se avisó al operador que su suscripción está por vencer o venció. */
export const registrarAvisoSuscripcion = (operadorId: number) =>
  pedir<Suscripcion>("POST", `/api/admin/operators/${operadorId}/subscription/notice`);
/** Operadores aprobados cuya suscripción sigue vigente pero vence en 30 días o menos; primero las que vencen antes. */
export const listarSuscripcionesPorVencer = (page: number) =>
  pedir<Pagina<SuscripcionOperador>>("GET", `/api/admin/subscriptions/expiring?size=20&page=${page}`);
/** Operadores aprobados con la suscripción vencida (no se muestran en el sitio); primero las vencidas más recientes. */
export const listarSuscripcionesVencidas = (page: number) =>
  pedir<Pagina<SuscripcionOperador>>("GET", `/api/admin/subscriptions/expired?size=20&page=${page}`);

// ---------- Eliminación definitiva de un operador ----------

export type OperadorEliminado = {
  operadorId: number;
  versiones: number;
  publicaciones: number;
  calificaciones: number;
  enlacesEdicion: number;
  /** Imágenes que tenía en S3 y cuántas se borraron en el momento; el resto se reintenta solo. */
  archivos: number;
  archivosEliminados: number;
};

/** Irreversible: borra al operador con sus versiones, publicaciones, imágenes, calificaciones, enlaces y suscripción. */
export const eliminarOperador = (id: number) => pedir<OperadorEliminado>("DELETE", `/api/admin/operators/${id}`);
