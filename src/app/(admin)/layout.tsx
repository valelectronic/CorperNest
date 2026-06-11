// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    redirect("/home");
  }

  return <AdminShell>{children}</AdminShell>;
}