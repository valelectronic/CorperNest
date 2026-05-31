// src/app/(main)/bookings/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import BookingsClient from "./booking-client";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  return (
    <BookingsClient
      currentUserId={session.user.id}
      currentUserName={session.user.name}
    />
  );
}