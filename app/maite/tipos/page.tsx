import type { Metadata } from "next";

import { TiposSection } from "@/components/admin/tipos-section";

export const metadata: Metadata = { title: "Tipos | Servi Cerca" };

export default function TiposPage() {
  return <TiposSection />;
}
