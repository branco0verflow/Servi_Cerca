"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSavedTheme } from "@/hooks/use-saved-theme";
import { AdminSesion, adminActual, logoutAdmin } from "@/lib/admin-api";

export const ADMIN_LOGIN_PATH = "/login/maite";

export function AdminPanel() {
  const router = useRouter();
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
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Image
            src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
            alt="Servi Cerca"
            width={2172}
            height={724}
            priority
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{sesion.username}</span>
            <Button variant="outline" size="sm" onClick={cerrarSesion} disabled={saliendo}>
              {saliendo ? <Spinner /> : <LogOut />}
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <p className="mt-2 text-muted-foreground">
          Sesión iniciada como <strong className="text-foreground">{sesion.username}</strong>. La sesión se cierra
          sola tras {Math.round(sesion.duracionSesionMinutos / 60)} horas sin actividad.
        </p>
      </main>
    </div>
  );
}
