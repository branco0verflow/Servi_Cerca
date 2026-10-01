"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "servi-cerca-theme";

function leerTema(): "dark" | "light" {
  try {
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    // Sin acceso a localStorage: tema oscuro por defecto.
    return "dark";
  }
}

const sinSuscripcion = () => () => {};

/** Aplica el tema guardado por la landing (localStorage "servi-cerca-theme"). */
export function useSavedTheme(): "dark" | "light" {
  const theme = useSyncExternalStore(sinSuscripcion, leerTema, () => "dark" as const);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return theme;
}
