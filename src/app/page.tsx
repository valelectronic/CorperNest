import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingPageClient from "./landing-client";

export default async function LandingPage() {
  // If user already has a valid session, send them straight to /home
  // No reason for a logged-in corper to see the marketing page
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/home");

  return <LandingPageClient />;
}