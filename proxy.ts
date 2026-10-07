import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// El backend ve como origen al servidor del front, no al visitante. En las rutas que limitan por IP
// se le pasa la IP real en un encabezado propio, junto con una clave compartida (PROXY_SECRET) para
// que el backend solo la acepte si viene de este front. El resto de /api/* sigue por next.config.ts.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const PROXY_SECRET = process.env.PROXY_SECRET ?? "";

const ENCABEZADO_IP = "x-servicerca-client-ip";
const ENCABEZADO_CLAVE = "x-servicerca-proxy-secret";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Nunca se reenvía lo que haya mandado el navegador en estos encabezados.
  headers.delete(ENCABEZADO_IP);
  headers.delete(ENCABEZADO_CLAVE);

  // En Vercel, x-forwarded-for lo escribe la plataforma y su primer valor es la IP del visitante.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (PROXY_SECRET && ip) {
    headers.set(ENCABEZADO_IP, ip);
    headers.set(ENCABEZADO_CLAVE, PROXY_SECRET);
  }

  const destino = new URL(request.nextUrl.pathname + request.nextUrl.search, BACKEND_URL);
  return NextResponse.rewrite(destino, { request: { headers } });
}

// Solo las rutas donde el backend limita por IP. El registro también limita por IP, pero sube
// imágenes y queda afuera para que esas subidas no dependan de este paso.
export const config = {
  matcher: ["/api/public/operators/:id/ratings", "/api/admin/auth/login", "/api/operator-access/redeem"],
};
