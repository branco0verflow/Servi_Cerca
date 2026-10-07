import type { NextConfig } from "next";

// URL del backend Spring Boot. El navegador nunca la llama directo: todo pasa por /api/* del front,
// así las cookies de sesión (SC_SESSION) y CSRF (XSRF-TOKEN) quedan en el mismo origen y no hace falta CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  experimental: {
    // Al existir proxy.ts, Next guarda en memoria el cuerpo de cada solicitud y lo recorta a los 10 MB.
    // El registro sube imágenes: se deja por encima del máximo que acepta el backend (32 MB).
    proxyClientMaxBodySize: "40mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
