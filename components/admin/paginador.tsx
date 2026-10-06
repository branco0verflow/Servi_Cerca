"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Controles de página anterior/siguiente. No se muestra si todo entra en una sola página. */
export function Paginador({
  pagina,
  totalPaginas,
  total,
  onCambio,
}: {
  /** Página actual, empezando en 0. */
  pagina: number;
  totalPaginas: number;
  total: number;
  onCambio: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
      <span>
        Página {pagina + 1} de {totalPaginas} · {total} en total
      </span>
      <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={pagina === 0} onClick={() => onCambio(pagina - 1)}>
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Página siguiente"
        disabled={pagina >= totalPaginas - 1}
        onClick={() => onCambio(pagina + 1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
