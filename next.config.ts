import type { NextConfig } from "next";

// URL del backend Spring Boot. El navegador nunca la llama directo: todo pasa por /api/* del front,
// así las cookies de sesión (SC_SESSION) y CSRF (XSRF-TOKEN) quedan en el mismo origen y no hace falta CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
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
