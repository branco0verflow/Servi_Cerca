import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OperadorDetalleSection } from "@/components/admin/operador-detalle";

export const metadata: Metadata = { title: "Operador | Servi Cerca" };

export default async function OperadorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <OperadorDetalleSection id={id} />;
}
