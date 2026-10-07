import { ImageResponse } from "next/og";

import {
  COLOR_SECUNDARIO,
  FONDO_IMAGEN,
  TAMANO_IMAGEN,
  fotoIncrustada,
  logoIncrustado,
} from "@/lib/imagen-compartir";
import { obtenerOperadorServidor, resumenTrabajos } from "@/lib/servidor";

// Imagen que muestran WhatsApp y las redes al compartir un perfil: foto, nombre y trabajos.
export const alt = "Perfil profesional en Servi Cerca";
export const size = TAMANO_IMAGEN;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const operador = Number.isInteger(id) && id > 0 ? await obtenerOperadorServidor(id) : null;
  const logo = await logoIncrustado();

  // Perfil inexistente o no visible: solo la marca.
  if (!operador) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: FONDO_IMAGEN,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- se dibuja en una imagen, no en el DOM */}
          <img src={logo} width={720} height={240} />
        </div>
      ),
      size,
    );
  }

  const foto = await fotoIncrustada(operador.fotoPerfilUrl);
  const nombre = `${operador.nombre} ${operador.apellido}`;
  const trabajos = resumenTrabajos(operador);
  const zona = operador.trabajoRemoto
    ? "Trabajo remoto"
    : operador.localidades
        .slice(0, 3)
        .map((l) => l.nombre)
        .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: FONDO_IMAGEN,
          color: "#ffffff",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- se dibuja en una imagen, no en el DOM
            <img
              src={foto}
              width={300}
              height={300}
              style={{ borderRadius: 150, objectFit: "cover", border: "6px solid #4f7cff" }}
            />
          ) : (
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 150,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #4f7cff 0%, #2ac779 100%)",
                fontSize: 120,
                fontWeight: 700,
              }}
            >
              {`${operador.nombre.charAt(0)}${operador.apellido.charAt(0)}`.toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 56, flex: 1 }}>
            <div style={{ fontSize: nombre.length > 22 ? 58 : 72, fontWeight: 700, lineHeight: 1.1 }}>{nombre}</div>
            {operador.nombreComercial ? (
              <div style={{ marginTop: 10, fontSize: 34, color: COLOR_SECUNDARIO }}>{operador.nombreComercial}</div>
            ) : null}
            <div style={{ marginTop: 24, fontSize: 42, fontWeight: 600, color: "#8fb0ff" }}>{trabajos}</div>
            {zona ? <div style={{ marginTop: 14, fontSize: 30, color: COLOR_SECUNDARIO }}>{zona}</div> : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- se dibuja en una imagen, no en el DOM */}
          <img src={logo} width={270} height={90} />
          <div style={{ fontSize: 28, color: COLOR_SECUNDARIO }}>Contactalo por WhatsApp</div>
        </div>
      </div>
    ),
    size,
  );
}
