// src/app/agent/kyc/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { agentKycRequest, user as userTable } from "@/db/schema"; // ← add userTable
import { eq } from "drizzle-orm";
import KycClient from "./kyc-client";

export const dynamic = "force-dynamic";

export default async function AgentKYCPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  // ← FIX: read agentVerified from DB directly, never trust session cache
  const dbUser = await db
    .select({
      agentVerified: userTable.agentVerified,
      phone:         userTable.phone,
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (!dbUser[0]) redirect("/signin");

  // Already verified → go straight to dashboard
  if (dbUser[0].agentVerified) redirect("/agent");

  // Check existing KYC submission
  const existing = await db
    .select({
      id:        agentKycRequest.id,
      status:    agentKycRequest.status,
      adminNote: agentKycRequest.adminNote,
    })
    .from(agentKycRequest)
    .where(eq(agentKycRequest.agentId, session.user.id))
    .limit(1);

  const existingRequest = existing[0] ?? null;

  return (
    <KycClient
      agentName={session.user.name}
      agentPhone={dbUser[0].phone ?? ""}
      existingRequest={existingRequest}
    />
  );
}