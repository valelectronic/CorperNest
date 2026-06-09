// src/app/agent/kyc/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { agentKycRequest } from "@/db/schema";
import { eq } from "drizzle-orm";
import KycClient from "./kyc-client";

export const dynamic = "force-dynamic";

export default async function AgentKYCPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  const user = session.user as {
    id:             string;
    name:           string;
    phone?:         string | null;
    role?:          string | null;
    agentVerified?: boolean | null;
  };


  // Already verified in session → go straight to dashboard
  if (user.agentVerified) redirect("/agent");

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
      agentName={user.name}
      agentPhone={user.phone ?? ""}
      existingRequest={existingRequest}
    />
  );
}