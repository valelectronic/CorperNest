// src/app/(main)/profile/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role?: string | null;
    state?: string | null;
    callUpNumber?: string | null;
    emailVerified?: boolean;
  };

  return <ProfileClient user={user} />;
}