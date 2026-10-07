import type { Metadata } from "next";
import "./globals.css";

import { NOMBRE_SITIO, SITE_URL } from "@/lib/servidor";

const TITULO = "Servi Cerca | Profesionales cerca tuyo";
const DESCRIPCION =
  "Encontrá carpinteros, electricistas, jardineros y otros profesionales de tu zona y contactalos directamente por WhatsApp.";

export const metadata: Metadata = {
  // Base para las direcciones completas que exigen WhatsApp y las redes (imagen y enlace al compartir).
  metadataBase: new URL(SITE_URL),
  title: TITULO,
  description: DESCRIPCION,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  // La imagen sale de app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: NOMBRE_SITIO,
    locale: "es_UY",
    url: "/",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
