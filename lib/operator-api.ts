// Cliente de la sesión del operador (enlace de edición de un solo uso) y de su borrador.
// El id del operador nunca se envía: el backend lo toma de la sesión.

import { ErrorCampo, Moneda, PublicApiError, PublicacionDatos, RegistroDatos, TipoPublicacion } from "@/lib/public-api";

export type EstadoVersion = "BORRADOR" | "PENDIENTE_REVISION" | "APROBADA" | "RECHAZADA" | "ARCHIVADA";

export type BorradorPublicacion = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoPublicacion;
  precio: number | null;
  moneda: Moneda | null;
  imagenUrl: string | null;
};

export type Borrador = {
  versionId: number;
  estadoVersion: EstadoVersion;
  nombre: string;
  apellido: string;
  nombreComercial: string | null;
  descripcion: string | null;
  email: string;
  telefono: string;
  whatsapp: string;
  fotoPerfilUrl: string | null;
  localidades: { id: number; nombre: string }[];
  oficios: {
    oficioId: number;
    descripcionServicio: string | null;
    precioDesde: number | null;
    moneda: Moneda | null;
  }[];
  publicaciones: BorradorPublicacion[];
};

export type OperadorMe = {
  operadorId: number;
  estado: "PENDIENTE_REVISION" | "ACTIVO" | "RECHAZADO" | "SUSPENDIDO";
  versionPublicada: Borrador | null;
  versionEnCurso: { versionId: number; estadoVersion: EstadoVersion; fechaEnvioRevision: string | null } | null;
  ultimoRechazo: { fechaRevision: string; motivoRechazo: string | null } | null;
};

async function csrf(): Promise<string> {
  const respuesta = await fetch("/api/csrf", { credentials: "include", cache: "no-store" });
  if (!respuesta.ok) throw new PublicApiError("No se pudo conectar con el servidor.", respuesta.status);
  return ((await respuesta.json()) as { token: string }).token;
}

async function pedir<T>(metodo: "GET" | "POST" | "PUT" | "DELETE", ruta: string, cuerpo?: unknown | FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (metodo !== "GET") headers["X-XSRF-TOKEN"] = await csrf();
  const esFormulario = cuerpo instanceof FormData;
  if (cuerpo !== undefined && !esFormulario) headers["Content-Type"] = "application/json";
  const respuesta = await fetch(ruta, {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers,
    body: cuerpo === undefined ? undefined : esFormulario ? cuerpo : JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    const error = (await respuesta.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
      fieldErrors?: ErrorCampo[] | null;
    };
    const mensaje =
      respuesta.status === 429
        ? "Hiciste demasiados intentos. Esperá unos minutos antes de volver a probar."
        : (error.message ?? "Ocurrió un error inesperado. Intentá de nuevo.");
    throw new PublicApiError(mensaje, respuesta.status, error.code, error.fieldErrors ?? []);
  }
  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
}

function conImagen(datos: PublicacionDatos, imagen: File | null): FormData {
  const cuerpo = new FormData();
  cuerpo.append("data", new Blob([JSON.stringify(datos)], { type: "application/json" }));
  if (imagen) cuerpo.append("imagen", imagen);
  return cuerpo;
}

/** Canjea el token del enlace (un solo uso) por una sesión. Lanza 401 si el enlace no es válido. */
export const canjearEnlace = (token: string) => pedir<unknown>("POST", "/api/operator-access/redeem", { token });
export const obtenerMe = () => pedir<OperadorMe>("GET", "/api/operator-access/me");
/** Devuelve el borrador; si no hay una versión abierta, el backend lo crea copiando la versión aprobada. */
export const obtenerBorrador = () => pedir<Borrador>("GET", "/api/operator-access/draft");
export const actualizarBorrador = (datos: Omit<RegistroDatos, "publicaciones" | "aceptaTerminos">) =>
  pedir<Borrador>("PUT", "/api/operator-access/draft", datos);

export function cambiarFoto(imagen: File) {
  const cuerpo = new FormData();
  cuerpo.append("imagen", imagen);
  return pedir<Borrador>("PUT", "/api/operator-access/draft/profile-photo", cuerpo);
}
export const quitarFoto = () => pedir<Borrador>("DELETE", "/api/operator-access/draft/profile-photo");

export const agregarPublicacion = (datos: PublicacionDatos, imagen: File) =>
  pedir<BorradorPublicacion>("POST", "/api/operator-access/draft/publications", conImagen(datos, imagen));
export const actualizarPublicacion = (id: number, datos: PublicacionDatos, imagen: File | null) =>
  pedir<BorradorPublicacion>("PUT", `/api/operator-access/draft/publications/${id}`, conImagen(datos, imagen));
export const eliminarPublicacion = (id: number) =>
  pedir<void>("DELETE", `/api/operator-access/draft/publications/${id}`);

export const enviarARevision = () => pedir<Borrador>("POST", "/api/operator-access/draft/submit");
export const cerrarSesionOperador = () => pedir<void>("POST", "/api/operator-access/logout");
