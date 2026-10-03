"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PieLegal } from "@/components/legal/documento-legal";
import { RegistroForm } from "@/components/registro/registro-form";
import { useSavedTheme } from "@/hooks/use-saved-theme";

export function RegistroPagina() {
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
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Sumate a Servi Cerca</h1>
        <p className="mt-2 mb-8 text-muted-foreground">
          Completá tus datos para crear tu perfil profesional. Lo revisamos antes de publicarlo.
        </p>
        <RegistroForm />
        <PieLegal className="mt-12" />
      </main>
    </div>
  );
}
