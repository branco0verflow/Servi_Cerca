"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSavedTheme } from "@/hooks/use-saved-theme";
import { AdminApiError, adminActual, loginAdmin } from "@/lib/admin-api";

export const ADMIN_PANEL_PATH = "/maite";

export function AdminLoginForm() {
  const router = useRouter();
  const theme = useSavedTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión abierta, se va directo al panel.
  useEffect(() => {
    adminActual()
      .then((sesion) => {
        if (sesion) router.replace(ADMIN_PANEL_PATH);
      })
      .catch(() => {});
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await loginAdmin(username.trim(), password);
      router.replace(ADMIN_PANEL_PATH);
    } catch (e) {
      setPassword("");
      setError(e instanceof AdminApiError ? e.message : "No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
            alt="Servi Cerca"
            width={2172}
            height={724}
            priority
            className="h-10 w-auto"
          />
        </div>

        <div className="rounded-(--radius) border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
              <LockKeyhole size={18} />
            </span>
            <div>
              <h1 className="text-lg font-semibold">Administración</h1>
              <p className="text-sm text-muted-foreground">Ingresá con tu usuario y contraseña.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-username">Usuario</FieldLabel>
                <Input
                  id="admin-username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={80}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={enviando}
                  aria-invalid={error ? true : undefined}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-password">Contraseña</FieldLabel>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={enviando}
                  aria-invalid={error ? true : undefined}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={enviando || !username.trim() || !password}
              >
                {enviando ? (
                  <>
                    <Spinner /> Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </div>
    </main>
  );
}
