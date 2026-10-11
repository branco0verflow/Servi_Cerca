import type { Metadata } from "next";
import "./globals.css";

import { NOMBRE_SITIO, SITE_URL } from "@/lib/servidor";

const TITULO = "Servi Cerca | Profesionales cerca tuyo";
const DESCRIPCION =
  "Encontrá carpinteros, electricistas, jardineros y otros profesionales de tu zona y contactalos directamente por WhatsApp.";

// Imagen que muestran WhatsApp y las redes al compartir el enlace del sitio (public/images).
const IMAGEN_COMPARTIR = {
  url: "/images/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Servi Cerca: conectamos a quienes necesitan resolver algo con quienes saben hacerlo",
};

export const metadata: Metadata = {
  // Base para las direcciones completas que exigen WhatsApp y las redes (imagen y enlace al compartir).
  metadataBase: new URL(SITE_URL),
  title: TITULO,
  description: DESCRIPCION,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: NOMBRE_SITIO,
    locale: "es_UY",
    url: "/",
    title: TITULO,
    description: DESCRIPCION,
    images: [IMAGEN_COMPARTIR],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION, images: [IMAGEN_COMPARTIR] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el tema guardado y las extensiones del navegador cambian atributos de <html>.
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
