import type { Metadata } from "next";

import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = {
  title: "Administración | Servi Cerca",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
