import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servi Cerca | Profesionales cerca tuyo",
  description:
    "Encontrá carpinteros, electricistas, jardineros y otros profesionales de tu zona y contactalos directamente por WhatsApp.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
