import type { Metadata } from "next";

import { TerminosContenido } from "@/components/legal/terminos-contenido";

export const metadata: Metadata = {
  title: "Términos y condiciones | Servi Cerca",
  description: "Condiciones de uso de Servi Cerca para quienes buscan un servicio y para los profesionales.",
};

export default function TerminosPage() {
  return <TerminosContenido />;
}
