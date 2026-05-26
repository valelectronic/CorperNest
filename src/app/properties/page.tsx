import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PropertiesClient from "./properties-client";

// Public page — no redirect if not logged in
// But we check session to pass isLoggedIn to cards
export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <PropertiesClient isLoggedIn={!!session} />;
}