"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { useSavedTheme } from "@/hooks/use-saved-theme";
import { LEGAL_EN_BORRADOR, RUTA_PRIVACIDAD, RUTA_TERMINOS, VERSION_LEGAL, VIGENCIA_LEGAL } from "@/lib/legal";

export type SeccionLegal = { id: string; titulo: string; contenido: React.ReactNode };

/** Página de un documento legal: encabezado, índice y secciones numeradas. */
export function DocumentoLegal({ titulo, intro, secciones }: { titulo: string; intro: React.ReactNode; secciones: SeccionLegal[] }) {
  const theme = useSavedTheme();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" aria-label="Servi Cerca, inicio">
            <Image
              src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
              alt="Servi Cerca"
              width={2172}
              height={724}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {LEGAL_EN_BORRADOR && (
          <div role="note" className="mb-8 flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p>
              <strong>Borrador en revisión.</strong> Este documento todavía está siendo revisado por un asesor legal y
              puede cambiar. Los datos entre corchetes se completarán antes de su versión definitiva.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versión {VERSION_LEGAL} · Vigente desde el {VIGENCIA_LEGAL}
        </p>
        <div className="mt-6 space-y-4 leading-7">{intro}</div>

        <nav aria-label="Contenido" className="mt-8 rounded-(--radius) border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold">Contenido</p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {secciones.map((seccion, i) => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`} className="text-muted-foreground hover:text-foreground hover:underline">
                  {i + 1}. {seccion.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {secciones.map((seccion, i) => (
            <section key={seccion.id} id={seccion.id} className="scroll-mt-6">
              <h2 className="text-xl font-semibold">
                {i + 1}. {seccion.titulo}
              </h2>
              <div className="mt-3 space-y-3 leading-7 text-foreground/90 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
                {seccion.contenido}
              </div>
            </section>
          ))}
        </div>

        <PieLegal className="mt-14" />
      </main>
    </div>
  );
}

/** Dato que falta completar (titular, RUT, plazos…): se resalta para que se vea en la revisión. */
export function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-500/20 px-1 text-foreground" title="Dato pendiente de completar">
      [{children}]
    </mark>
  );
}

/** Enlaces a los documentos legales, para el pie de las páginas públicas. */
export function PieLegal({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-border pt-6 text-sm text-muted-foreground ${className}`}>
      <nav aria-label="Documentos legales" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href={RUTA_TERMINOS} className="hover:text-foreground hover:underline">
          Términos y condiciones
        </Link>
        <Link href={RUTA_PRIVACIDAD} className="hover:text-foreground hover:underline">
          Política de privacidad
        </Link>
      </nav>
      <p className="mt-3">© 2026 Servi Cerca</p>
    </footer>
  );
}
