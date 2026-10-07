import { ImageResponse } from "next/og";

import { COLOR_SECUNDARIO, FONDO_IMAGEN, TAMANO_IMAGEN, logoIncrustado } from "@/lib/imagen-compartir";

// Imagen que muestran WhatsApp y las redes al compartir el enlace del sitio.
export const alt = "Servi Cerca: profesionales cerca tuyo";
export const size = TAMANO_IMAGEN;
export const contentType = "image/png";

export default async function Image() {
  const logo = await logoIncrustado();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: FONDO_IMAGEN,
          color: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- se dibuja en una imagen, no en el DOM */}
        <img src={logo} width={720} height={240} />
        <div style={{ marginTop: 8, fontSize: 44, fontWeight: 600 }}>Profesionales cerca tuyo</div>
        <div style={{ marginTop: 20, fontSize: 30, color: COLOR_SECUNDARIO }}>
          Encontralos y contactalos por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
