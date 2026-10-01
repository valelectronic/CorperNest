// src/app/(main)/parkout/ambassador/apply/page.tsx
// Ambassador application page — server component.
//
// Two entry points:
// 1. Fresh visit → check existing application → show correct state
// 2. Return from Paystack (?payment=success&ref=xxx) →
//    verify payment directly with Paystack API →
//    update application status to fee_paid if confirmed →
//    show form immediately without waiting for webhook

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassadorApplication, parkoutAmbassador } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AmbassadorApplyClient from "./apply-client";

export const metadata: Metadata = {
  title: "Become a Location Ambassador | CorperNest Park-Out",
  description: "Join CorperNest as a Location Ambassador and earn ₦9,000+ per completed handover in your area.",
};

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// Verify payment directly with Paystack API
// Used when user returns from Paystack with ?payment=success
async function verifyPaystackPayment(reference: string): Promise<boolean> {
  try {
    const res  = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      cache: "no-store",
    });
    const data = await res.json();
    return data.data?.status === "success";
  } catch {
    return false;
  }
}

export default async function AmbassadorApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; ref?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params  = await searchParams;

  // Not logged in → redirect to sign in
  if (!session?.user) {
    redirect("/signin?redirect=/parkout/ambassador/apply");
  }

  // Already an active ambassador → redirect to portal
  const [existingAmbassador] = await db
    .select({ id: parkoutAmbassador.id })
    .from(parkoutAmbassador)
    .where(
      and(
        eq(parkoutAmbassador.userId, session.user.id),
        eq(parkoutAmbassador.status, "active"),
      )
    )
    .limit(1);

  if (existingAmbassador) {
    redirect("/parkout/ambassador");
  }

  // Fetch existing application for this user
  const [existingApplication] = await db
    .select({
      id:           parkoutAmbassadorApplication.id,
      status:       parkoutAmbassadorApplication.status,
      vetFeePaidAt: parkoutAmbassadorApplication.vetFeePaidAt,
      vetFeeRef:    parkoutAmbassadorApplication.vetFeeRef,
    })
    .from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.userId, session.user.id))
    .limit(1);

  // ── Returning from Paystack payment ────────────────────────────────────
  // ?payment=success&ref=amb_xxxx in URL
  // Verify directly with Paystack to avoid webhook timing race condition
  if (params.payment === "success" && params.ref && existingApplication) {
    const isPaid = await verifyPaystackPayment(params.ref);

    if (isPaid && existingApplication.status === "pending_payment") {
      // Update application status immediately
      // Webhook will also fire but this handles the race condition
      await db.update(parkoutAmbassadorApplication)
        .set({
          vetFeeRef:    params.ref,
          vetFeePaidAt: new Date(),
          status:       "fee_paid",
          updatedAt:    new Date(),
        })
        .where(eq(parkoutAmbassadorApplication.id, existingApplication.id));

      // Pass updated application to client — form will unlock immediately
      return (
        <AmbassadorApplyClient
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? ""}
          existingApplication={{
            ...existingApplication,
            status:       "fee_paid",
            vetFeePaidAt: new Date(),
            vetFeeRef:    params.ref,
          }}
        />
      );
    }
  }

  // ── Normal visit ───────────────────────────────────────────────────────
  return (
    <AmbassadorApplyClient
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? ""}
      existingApplication={existingApplication ?? null}
    />
  );
}