// Piezas comunes de las imágenes que muestran WhatsApp y las redes al compartir un enlace (Open Graph).
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const TAMANO_IMAGEN = { width: 1200, height: 630 };
export const FONDO_IMAGEN = "linear-gradient(135deg, #071011 0%, #10233a 100%)";
export const COLOR_SECUNDARIO = "#a9b8c4";

/** El logo para fondo oscuro, incrustado: el generador de imágenes no lee archivos de /public por su ruta. */
export async function logoIncrustado(): Promise<string> {
  const logo = await readFile(join(process.cwd(), "public/images/logo_black.png"));
  return `data:image/png;base64,${logo.toString("base64")}`;
}

// Formatos que el generador de imágenes sabe dibujar.
const FORMATOS_FOTO = ["image/jpeg", "image/png"];
const MAX_FOTO_BYTES = 6 * 1024 * 1024;

/**
 * Una foto remota como data URL, o null si no se puede usar. Se incrusta porque las direcciones de S3
 * vencen: la imagen compartida no puede depender de ellas.
 */
export async function fotoIncrustada(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const respuesta = await fetch(url, { cache: "no-store" });
    const tipo = respuesta.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!respuesta.ok || !FORMATOS_FOTO.includes(tipo)) return null;
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_FOTO_BYTES) return null;
    return `data:${tipo};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
