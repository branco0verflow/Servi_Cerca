"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, LogOut, Users, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/sonner";
import { useSavedTheme } from "@/hooks/use-saved-theme";
import { AdminApiError, AdminSesion, adminActual, logoutAdmin } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const ADMIN_LOGIN_PATH = "/login/maite";

const SECCIONES = [
  { href: "/maite/operadores", etiqueta: "Operadores", icono: Users },
  { href: "/maite/tipos", etiqueta: "Tipos", icono: Layers },
  { href: "/maite/trabajos", etiqueta: "Trabajos", icono: Wrench },
];

const ErrorContext = createContext<(error: unknown) => void>(() => {});

/** Muestra el error en un aviso; si la sesión expiró, vuelve al login. */
export function useAdminError() {
  return useContext(ErrorContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useSavedTheme();
  const [sesion, setSesion] = useState<AdminSesion | null>(null);
  const [saliendo, setSaliendo] = useState(false);

  // Sin sesión de administrador, vuelve al login. La protección real la hace el backend en /api/admin/**.
  useEffect(() => {
    adminActual()
      .then((actual) => {
        if (actual) setSesion(actual);
        else router.replace(ADMIN_LOGIN_PATH);
      })
      .catch(() => router.replace(ADMIN_LOGIN_PATH));
  }, [router]);

  const manejarError = useCallback(
    (error: unknown) => {
      if (error instanceof AdminApiError && error.status === 401) {
        toast.error(error.message);
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }
      toast.error(error instanceof AdminApiError ? error.message : "No se pudo conectar con el servidor.");
    },
    [router],
  );

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await logoutAdmin();
    } finally {
      router.replace(ADMIN_LOGIN_PATH);
    }
  }

  if (!sesion) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        <Spinner className="size-6" />
      </main>
    );
  }

  return (
    <ErrorContext.Provider value={manejarError}>
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/maite" aria-label="Panel de administración">
              <Image
                src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
                alt="Servi Cerca"
                width={2172}
                height={724}
                priority
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">{sesion.username}</span>
              <Button variant="outline" size="sm" onClick={cerrarSesion} disabled={saliendo}>
                {saliendo ? <Spinner /> : <LogOut />}
                Cerrar sesión
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] md:py-8">
          <nav aria-label="Secciones" className="flex gap-2 md:flex-col">
            {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
              const activa = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:flex-none",
                    activa
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icono size={16} />
                  {etiqueta}
                </Link>
              );
            })}
          </nav>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Toaster theme={theme} position="top-center" richColors />
    </ErrorContext.Provider>
  );
}
