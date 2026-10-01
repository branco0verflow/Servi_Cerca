"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  nombre: string;
  /** Motivo por el que no se puede eliminar (en uso). Si existe, se ofrece desactivar en su lugar. */
  bloqueo: string | null;
  activo: boolean;
  procesando: boolean;
  onEliminar: () => void;
  onDesactivar: () => void;
};

export function ConfirmarEliminar({
  abierto,
  onCerrar,
  nombre,
  bloqueo,
  activo,
  procesando,
  onEliminar,
  onDesactivar,
}: Props) {
  return (
    <AlertDialog open={abierto} onOpenChange={(open) => !open && !procesando && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{bloqueo ? `No se puede eliminar “${nombre}”` : `¿Eliminar “${nombre}”?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {bloqueo
              ? `${bloqueo} ${activo ? "Podés desactivarlo para que deje de mostrarse en el sitio." : "Ya está desactivado."}`
              : "Se elimina definitivamente. Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={procesando}>{bloqueo ? "Cerrar" : "Cancelar"}</AlertDialogCancel>
          {bloqueo ? (
            activo && (
              <AlertDialogAction
                disabled={procesando}
                onClick={(e) => {
                  e.preventDefault();
                  onDesactivar();
                }}
              >
                {procesando && <Spinner />} Desactivar
              </AlertDialogAction>
            )
          ) : (
            <AlertDialogAction
              variant="destructive"
              disabled={procesando}
              onClick={(e) => {
                e.preventDefault();
                onEliminar();
              }}
            >
              {procesando && <Spinner />} Eliminar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
