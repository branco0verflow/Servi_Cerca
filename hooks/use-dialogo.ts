"use client";

import { useState } from "react";

/**
 * Estado de un diálogo que edita o confirma sobre un elemento. Al cerrar se conserva el elemento,
 * así el contenido no cambia durante la animación de salida. {@code clave} cambia en cada apertura
 * para remontar el formulario con valores limpios.
 */
export function useDialogo<T>() {
  const [estado, setEstado] = useState<{ item: T | null; abierto: boolean; clave: number }>({
    item: null,
    abierto: false,
    clave: 0,
  });

  return {
    ...estado,
    abrir: (item: T) => setEstado((e) => ({ item, abierto: true, clave: e.clave + 1 })),
    cerrar: () => setEstado((e) => ({ ...e, abierto: false })),
  };
}
