import type { Metadata } from "next";

import { RegistroPagina } from "@/components/registro/registro-pagina";

export const metadata: Metadata = {
  title: "Registrate como profesional | Servi Cerca",
  description: "Creá tu perfil en Servi Cerca y conectá con personas de tu zona que necesitan tus servicios.",
};

export default function RegistroPage() {
  return <RegistroPagina />;
}
