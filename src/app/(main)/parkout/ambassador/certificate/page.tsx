// src/app/(main)/parkout/ambassador/certificate/page.tsx
// Ambassador certificate page — server component.
// Fetches ambassador details then passes to client for rendering + download.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parkoutAmbassador, parkoutAmbassadorApplication } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import CertificateClient from "./certificate-client";

export const dynamic = "force-dynamic";

export default async function AmbassadorCertificatePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  // Must be an active ambassador
  const [ambassador] = await db
    .select({
      id:          parkoutAmbassador.id,
      lga:         parkoutAmbassador.lga,
      state:       parkoutAmbassador.state,
      totalDeals:  parkoutAmbassador.totalDeals,
      approvedAt:  parkoutAmbassador.approvedAt,
      createdAt:   parkoutAmbassador.createdAt,
      isActive:    parkoutAmbassador.isActive,
    })
    .from(parkoutAmbassador)
    .where(and(
      eq(parkoutAmbassador.userId, session.user.id),
      eq(parkoutAmbassador.isActive, true),
    ))
    .limit(1);

  if (!ambassador) redirect("/parkout/ambassador/apply");

  // Get whatsapp number from application if exists
  const [application] = await db
    .select({ whatsappNumber: parkoutAmbassadorApplication.whatsappNumber })
    .from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.userId, session.user.id))
    .limit(1);

  const approvedDate = ambassador.approvedAt ?? ambassador.createdAt;

  return (
    <CertificateClient
      name={session.user.name ?? "Ambassador"}
      ambassadorId={ambassador.id}
      lga={ambassador.lga}
      state={ambassador.state}
      totalDeals={ambassador.totalDeals ?? 0}
      approvedAt={approvedDate ? new Date(approvedDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"}
    />
  );
}