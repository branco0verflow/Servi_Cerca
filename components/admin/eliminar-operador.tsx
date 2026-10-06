"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminError } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { eliminarOperador } from "@/lib/admin-api";

const PALABRA = "ELIMINAR";

/**
 * Eliminación definitiva de un operador con todos sus datos. Es irreversible, así que pide escribir
 * una palabra de confirmación: un clic de más no alcanza para borrar a alguien por error.
 */
export function EliminarOperador({ operadorId, nombre }: { operadorId: number; nombre: string }) {
  const router = useRouter();
  const manejarError = useAdminError();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [eliminando, setEliminando] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmacion.trim().toUpperCase() !== PALABRA) return;
    setEliminando(true);
    try {
      const resultado = await eliminarOperador(operadorId);
      const pendientes = resultado.archivos - resultado.archivosEliminados;
      toast.success(
        pendientes > 0
          ? `Se eliminó a ${nombre}. ${pendientes} de sus imágenes se terminan de borrar en los próximos minutos.`
          : `Se eliminó a ${nombre} con todos sus datos.`,
      );
      router.replace("/maite/operadores");
    } catch (e) {
      manejarError(e);
      setEliminando(false);
    }
  }

  return (
    <div className="mt-6 rounded-(--radius) border border-destructive/40 bg-card p-5">
      <h2 className="font-semibold">Eliminar operador</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Borra definitivamente a este operador y todos sus datos. Usalo, por ejemplo, cuando pide que se eliminen sus
        datos personales. Si solo querés que deje de mostrarse, suspendelo.
      </p>
      <Button
        variant="destructive"
        className="mt-4"
        onClick={() => {
          setConfirmacion("");
          setAbierto(true);
        }}
      >
        <Trash2 /> Eliminar operador
      </Button>

      <Dialog open={abierto} onOpenChange={(open) => !open && !eliminando && setAbierto(false)}>
        <DialogContent>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer. Se borra de forma permanente:</DialogDescription>
            </DialogHeader>
            <ul className="my-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Sus datos personales y de contacto.</li>
              <li>Todas las versiones de su perfil y el historial de revisiones.</li>
              <li>Sus publicaciones, su foto y todas sus imágenes.</li>
              <li>Las calificaciones que recibió.</li>
              <li>Sus enlaces de edición y su suscripción.</li>
            </ul>
            <label htmlFor="confirmar-eliminacion" className="mb-1.5 block text-sm font-medium">
              Para confirmar, escribí {PALABRA}
            </label>
            <Input
              id="confirmar-eliminacion"
              autoComplete="off"
              spellCheck={false}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              disabled={eliminando}
              autoFocus
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)} disabled={eliminando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={eliminando || confirmacion.trim().toUpperCase() !== PALABRA}
              >
                {eliminando && <Spinner />} Eliminar definitivamente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
