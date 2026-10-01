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
