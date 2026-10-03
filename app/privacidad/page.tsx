import type { Metadata } from "next";

import { PrivacidadContenido } from "@/components/legal/privacidad-contenido";

export const metadata: Metadata = {
  title: "Política de privacidad | Servi Cerca",
  description: "Cómo Servi Cerca trata los datos personales de profesionales y de quienes califican.",
};

export default function PrivacidadPage() {
  return <PrivacidadContenido />;
}
