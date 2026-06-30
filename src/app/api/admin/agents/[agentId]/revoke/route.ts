// src/app/api/admin/agents/[agentId]/revoke/route.ts
//
// Admin-only. Removes agent status from a previously approved agent —
// flips agentVerified back to false, and marks their KYC request as
// "revoked" so the history is preserved rather than silently erased.
//
// This does NOT delete or hide their existing listings automatically —
// that's a separate, deliberate decision (see note below) so a revoke
// doesn't accidentally yank live bookings out from under renters mid-flow.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, agentKycRequest } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { agentId } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const reason = body.reason?.trim();

  const targetUser = await db
    .select({ id: user.id, name: user.name, email: user.email, agentVerified: user.agentVerified })
    .from(user)
    .where(eq(user.id, agentId))
    .limit(1);

  if (targetUser.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!targetUser[0].agentVerified) {
    return NextResponse.json({ error: "This user is not currently a verified agent" }, { status: 400 });
  }

  // ── Flip the actual flag agent-gated pages and routes check ─────────────
  await db
    .update(user)
    .set({ agentVerified: false })
    .where(eq(user.id, agentId));

  // ── Keep the KYC history intact, marked as revoked rather than deleted —
  // so /agent/kyc shows a real status if they ever try to reapply, instead
  // of looking like they never applied at all
  await db
    .update(agentKycRequest)
    .set({
      status: "revoked",
      adminNote: reason || "Agent status revoked by admin",
      reviewedAt: new Date(),
    })
    .where(eq(agentKycRequest.agentId, agentId));

  // ── Notify the agent directly — silently revoking with no explanation
  // would be confusing and unfair
  await createNotification({
    userId: agentId,
    type: "agent-revoked",
    title: "Your agent status has been removed",
    message: reason
      ? `Your verified agent status has been revoked: ${reason}`
      : "Your verified agent status has been revoked. Contact support if you believe this is a mistake.",
    link: "/profile",
  });

  sendAdminEmail(
    `Agent Status Revoked — ${targetUser[0].name}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#C62828;margin:0 0 4px">Agent status revoked</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
          <tr><td style="padding:8px 0;color:#7A9A7A;width:140px">Agent</td><td style="padding:8px 0">${targetUser[0].name} (${targetUser[0].email})</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Reason</td><td style="padding:8px 0">${reason || "Not specified"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Revoked by</td><td style="padding:8px 0">${session.user.email}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Time</td><td style="padding:8px 0">${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
        </table>
        <p style="margin-top:16px;color:#92400E"><i>Their existing listings remain live but unmanaged. Consider reviewing them manually.</i></p>
      </div>
    `
  ).catch((err) => console.error("[revoke-agent] Admin email failed:", err));

  return NextResponse.json({ success: true });
}