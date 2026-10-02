import type { Metadata } from "next";

import { CalificacionesSection } from "@/components/admin/calificaciones-section";

export const metadata: Metadata = { title: "Calificaciones | Servi Cerca" };

export default function CalificacionesPage() {
  return <CalificacionesSection />;
}
