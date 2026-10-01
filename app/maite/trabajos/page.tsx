import type { Metadata } from "next";

import { TrabajosSection } from "@/components/admin/trabajos-section";

export const metadata: Metadata = { title: "Trabajos | Servi Cerca" };

export default async function TrabajosPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const tipoInicial = Number(tipo);
  return <TrabajosSection tipoInicial={Number.isInteger(tipoInicial) && tipoInicial > 0 ? tipoInicial : null} />;
}
