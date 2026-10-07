import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfesionalPagina } from "@/components/profesional/profesional-pagina";
import { NOMBRE_SITIO, obtenerOperadorServidor, resumenTrabajos } from "@/lib/servidor";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servicio?: string; localidad?: string }>;
};

/**
 * Título y descripción con el nombre y los trabajos del profesional: es lo que se ve al compartir el
 * enlace por WhatsApp. La imagen la arma opengraph-image.tsx.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const operador = Number.isInteger(id) && id > 0 ? await obtenerOperadorServidor(id) : null;
  if (!operador) return { title: `Perfil profesional | ${NOMBRE_SITIO}` };

  const nombre = `${operador.nombre} ${operador.apellido}`;
  const trabajos = resumenTrabajos(operador);
  const titulo = trabajos ? `${nombre} · ${trabajos}` : nombre;
  const zona = operador.trabajoRemoto
    ? "Trabaja de forma remota."
    : operador.localidades.length > 0
      ? `Trabaja en ${operador.localidades.map((l) => l.nombre).join(", ")}.`
      : "";
  const presentacion = operador.descripcion?.split(/\s+/).join(" ").trim().slice(0, 140);
  const descripcion = [presentacion, zona, "Contactalo por WhatsApp en Servi Cerca."].filter(Boolean).join(" ");

  return {
    title: `${titulo} | ${NOMBRE_SITIO}`,
    description: descripcion,
    alternates: { canonical: `/profesional/${id}` },
    openGraph: {
      type: "profile",
      siteName: NOMBRE_SITIO,
      locale: "es_UY",
      url: `/profesional/${id}`,
      title: titulo,
      description: descripcion,
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion },
  };
}

export default async function ProfesionalPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { servicio, localidad } = await searchParams;
  return <ProfesionalPagina id={id} servicio={servicio?.slice(0, 80) || null} localidad={localidad?.slice(0, 120) || null} />;
}
