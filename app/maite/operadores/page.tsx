import type { Metadata } from "next";

import { OperadoresSection } from "@/components/admin/operadores-section";

export const metadata: Metadata = { title: "Operadores | Servi Cerca" };

export default function OperadoresPage() {
  return <OperadoresSection />;
}
