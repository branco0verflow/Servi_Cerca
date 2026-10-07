// Solo para el servidor de Next (metadatos e imágenes para compartir). El navegador usa lib/public-api.ts.
import { cache } from "react";

import type { OperadorPublico } from "@/lib/public-api";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * Dirección pública del sitio. WhatsApp y las redes necesitan direcciones completas para mostrar la
 * imagen de un enlace: en producción hay que definir SITE_URL (por ejemplo https://servicerca.uy).
 */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const NOMBRE_SITIO = "Servi Cerca";

/** Perfil público de un operador, o null si no existe o no está visible. Una sola consulta por solicitud. */
export const obtenerOperadorServidor = cache(async (id: number): Promise<OperadorPublico | null> => {
  try {
    const respuesta = await fetch(`${BACKEND_URL}/api/public/operators/${id}`, { cache: "no-store" });
    if (!respuesta.ok) return null;
    return (await respuesta.json()) as OperadorPublico;
  } catch {
    return null;
  }
});

/** "Carpintero, Herrero y 2 más": los trabajos de un operador en una línea corta. */
export function resumenTrabajos(operador: OperadorPublico, maximo = 3): string {
  const nombres = operador.oficios.map((o) => o.nombre);
  if (nombres.length <= maximo) return nombres.join(", ");
  return `${nombres.slice(0, maximo).join(", ")} y ${nombres.length - maximo} más`;
}
