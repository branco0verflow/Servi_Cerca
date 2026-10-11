"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "servi-cerca-theme";

function leerTema(): "dark" | "light" {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    // Sin acceso a localStorage: tema claro por defecto.
    return "light";
  }
}

const sinSuscripcion = () => () => {};

/** Aplica el tema guardado por la landing (localStorage "servi-cerca-theme"). */
export function useSavedTheme(): "dark" | "light" {
  const theme = useSyncExternalStore(sinSuscripcion, leerTema, () => "light" as const);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return theme;
}
