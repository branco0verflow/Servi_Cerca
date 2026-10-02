import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfesionalPagina } from "@/components/profesional/profesional-pagina";

export const metadata: Metadata = { title: "Perfil profesional | Servi Cerca" };

export default async function ProfesionalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servicio?: string; localidad?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { servicio, localidad } = await searchParams;
  return <ProfesionalPagina id={id} servicio={servicio?.slice(0, 80) || null} localidad={localidad?.slice(0, 120) || null} />;
}
