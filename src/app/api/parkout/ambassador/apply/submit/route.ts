// src/app/api/parkout/ambassador/apply/submit/route.ts
// Step 2 of ambassador application — saves form data after fee is confirmed.
//
// Guards:
// 1. User must be logged in
// 2. Application must exist and fee must be paid (vetFeePaidAt set by webhook)
// 3. All required fields must be present
//
// On success:
// → Saves all form fields to application row
// → Sets status: pending_review
// → Sends admin push notification + email
// → Client redirects to /parkout/ambassador/apply/success

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassadorApplication, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await req.json();
  const {
    applicationId,
    fullName,
    phone,
    whatsappNumber,
    territoryState,
    territoryLga,
    idType,
    idNumber,
    idDocumentUrl,
    bankCode,
    accountNumber,
    accountName,
  } = body;

  // ── Validate required fields ───────────────────────────────────────────────
  if (!fullName?.trim())    return NextResponse.json({ error: "Full name is required."        }, { status: 400 });
  if (!phone?.trim())       return NextResponse.json({ error: "Phone number is required."     }, { status: 400 });
  if (!territoryLga)        return NextResponse.json({ error: "Territory selection required." }, { status: 400 });
  if (!idType)              return NextResponse.json({ error: "ID type is required."          }, { status: 400 });
  if (!idNumber?.trim())    return NextResponse.json({ error: "ID number is required."        }, { status: 400 });
  if (!idDocumentUrl)       return NextResponse.json({ error: "ID photo upload is required."  }, { status: 400 });
  if (!accountNumber)       return NextResponse.json({ error: "Verify your bank account."     }, { status: 400 });
  if (!accountName)         return NextResponse.json({ error: "Verify your bank account."     }, { status: 400 });

  // ── Fetch application — must belong to this user and fee must be paid ──────
  const [application] = await db
    .select({
      id:           parkoutAmbassadorApplication.id,
      status:       parkoutAmbassadorApplication.status,
      vetFeePaidAt: parkoutAmbassadorApplication.vetFeePaidAt,
    })
    .from(parkoutAmbassadorApplication)
    .where(and(
      eq(parkoutAmbassadorApplication.id, applicationId),
      eq(parkoutAmbassadorApplication.userId, session.user.id),
    ))
    .limit(1);

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // Fee must be confirmed by webhook before form can be submitted
  if (!application.vetFeePaidAt) {
    return NextResponse.json(
      { error: "Payment not yet confirmed. Please wait a moment and try again." },
      { status: 400 }
    );
  }

  // Prevent re-submission
  if (application.status === "pending_review" || application.status === "approved") {
    return NextResponse.json(
      { error: "Application already submitted." },
      { status: 400 }
    );
  }

  // ── Save form data + set status to pending_review ─────────────────────────
  await db.update(parkoutAmbassadorApplication)
    .set({
      fullName:       fullName.trim(),
      phone:          phone.trim(),
      whatsappNumber: whatsappNumber?.trim() || phone.trim(),
      territoryState: territoryState || "Akwa Ibom",
      territoryLga,
      idType,
      idNumber:       idNumber.trim(),
      idDocumentUrl,
      bankCode,
      accountNumber,
      accountName,
      status:         "pending_review",
      updatedAt:      new Date(),
    })
    .where(eq(parkoutAmbassadorApplication.id, applicationId));

  // ── Notify admin — in-app push ────────────────────────────────────────────
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com"))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "parkout-ambassador-application",
      title:   `🧑 New Ambassador Application — ${territoryLga}`,
      message: `${fullName} has applied to be an ambassador in ${territoryLga}. Review and assign territory in admin panel.`,
      link:    "/admin/parkout/ambassadors",
    }).catch(() => {});
  }

  // ── Email admin — backup to push ──────────────────────────────────────────
  await sendAdminEmail(
    `🧑 New Ambassador Application — ${territoryLga}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#15803D;margin:0 0 4px">New Ambassador Application</h2>
        <p style="color:#6B7280;margin:0 0 20px;font-size:13px">
          Review and approve or decline in the admin panel
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280;width:140px">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600">${fullName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${phone}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">WhatsApp</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${whatsappNumber || phone}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Territory</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600;color:#15803D">${territoryLga}, ${territoryState || "Akwa Ibom"}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">ID Type</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${idType} — ${idNumber}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Bank</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${accountName} — ${accountNumber}</td></tr>
          <tr><td style="padding:10px 0;color:#6B7280">ID Document</td>
              <td style="padding:10px 0"><a href="${idDocumentUrl}" target="_blank" style="color:#15803D">View ID Photo →</a></td></tr>
        </table>
        <a href="https://www.corpernest.com.ng/admin/parkout/ambassadors"
           style="display:inline-block;padding:12px 24px;background:#15803D;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
          Review in Admin Panel →
        </a>
      </div>
    `
  ).catch(() => {});

  return NextResponse.json({ success: true });
}