import type { Metadata } from "next";

import { OperadorAcceso } from "@/components/operador/operador-acceso";

// La ruta la define el backend (app.frontend.operator-access-path) al generar el enlace de edición.
export const metadata: Metadata = {
  title: "Editar mi perfil | Servi Cerca",
  robots: { index: false, follow: false },
  // El token va en el fragmento de la URL: no debe filtrarse a otros sitios como referente.
  referrer: "no-referrer",
};

export default function OperatorAccessPage() {
  return <OperadorAcceso />;
}
