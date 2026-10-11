
"use client";

import { useEffect, useState } from "react";

const FRASES = [
  "profesionales para tu hogar",
  "profesionales para tu negocio",
  "profesionales para tus proyectos",
  "especialistas en tecnología",
  "especialistas en asesoramiento",
  "especialistas en instalaciones",
  "servicios de mantenimiento",
  "servicios de diseño",
  "servicios de consultoría",
];

// Conserva solamente palabras completas compartidas.
function prefijoComun(actual: string, siguiente: string) {
  const palabrasA = actual.split(" ");
  const palabrasB = siguiente.split(" ");

  let i = 0;

  while (
    i < palabrasA.length &&
    i < palabrasB.length &&
    palabrasA[i] === palabrasB[i]
  ) {
    i++;
  }

  const prefijo = palabrasA.slice(0, i).join(" ");

  return prefijo ? prefijo + " " : "";
}

export function AnimatedHeroTitle() {
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState(FRASES[0]);
  const [fase, setFase] = useState<
    "pausa" | "borrar" | "escribir"
  >("pausa");

  const [reducirMovimiento, setReducirMovimiento] =
    useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const actualizar = () =>
      setReducirMovimiento(media.matches);

    actualizar();

    media.addEventListener("change", actualizar);

    return () =>
      media.removeEventListener("change", actualizar);
  }, []);

  useEffect(() => {
    if (reducirMovimiento) return;

    const siguienteIndice = (indice + 1) % FRASES.length;
    const siguienteFrase = FRASES[siguienteIndice];
    const prefijo = prefijoComun(
      FRASES[indice],
      siguienteFrase
    );

    const tiempo =
      fase === "pausa"
        ? 2200
        : fase === "borrar"
          ? 35
          : 65;

    const timeout = window.setTimeout(() => {
      if (fase === "pausa") {
        setFase("borrar");
        return;
      }

      if (fase === "borrar") {
        if (texto.length > prefijo.length) {
          setTexto((actual) => actual.slice(0, -1));
        } else {
          setIndice(siguienteIndice);
          setFase("escribir");
        }

        return;
      }

      if (fase === "escribir") {
        const frase = FRASES[indice];

        if (texto.length < frase.length) {
          setTexto(frase.slice(0, texto.length + 1));
        } else {
          setFase("pausa");
        }
      }
    }, tiempo);

    return () => window.clearTimeout(timeout);
  }, [indice, texto, fase, reducirMovimiento]);

  return (
    <h1
      data-animate="intro"
      className="
        hero-title
        !text-[1.5rem] sm:!text-[2rem] lg:!text-[2.5rem]
        !leading-tight
        h-[120px] sm:h-[110px] lg:h-[120px]
        flex flex-col items-center justify-center
        text-center
      "
      aria-label="Encontrá profesionales y servicios cerca tuyo"
    >
      <span>Encontrá cerca</span>

      <span
        className="inline-block max-w-full wrap-break-words"
        aria-hidden="true"
      >
        <em>
          {reducirMovimiento ? FRASES[0] : texto}
        </em>

        {!reducirMovimiento && (
          <span
            className="
              ml-0.5 inline-block
              animate-pulse not-italic opacity-60
            "
          >
            |
          </span>
        )}
      </span>
    </h1>
  );
}
