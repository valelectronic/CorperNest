// src/app/(main)/parkout/booking/[listingId]/success/page.tsx
// Shown after Paystack redirects back after ₦3,000 inspection fee payment.
// Verifies payment directly with Paystack API.
// Updates inspection record to paid status.
// Shows success state + wa.me button to contact admin on WhatsApp.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parkoutInspection, parkoutListing } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { inspectionBookedMessage } from "@/lib/whatsapp-link";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params:       Promise<{ listingId: string }>;
  searchParams: Promise<{ reference?: string }>;
};

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const ADMIN_WHATSAPP  = process.env.ADMIN_WHATSAPP_NUMBER!;

const INSPECTION_FEE_KOBO = 300000;
const INSPECTION_CURRENCY = "NGN";

type PaystackVerification = {
  status?: string;
  amount?: number;
  currency?: string;
  reference?: string;
};

async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerification | null> {
  if (!PAYSTACK_SECRET) {
    console.error("[booking/success] Missing Paystack secret key.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        "[booking/success] Paystack verification failed:",
        res.status
      );
      return null;
    }

    const data = await res.json();

    if (!data?.status || !data?.data) {
      return null;
    }

    return {
      status: data.data.status,
      amount: data.data.amount,
      currency: data.data.currency,
      reference: data.data.reference,
    };
  } catch (err) {
    console.error(
      "[booking/success] Paystack verification error:",
      err
    );

    return null;
  }
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: Props) {
  const { listingId } = await params;
  const { reference } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  // ── Reference is required ─────────────────────────────────────────────────
  if (!reference) {
    redirect(`/parkout/listing/${listingId}`);
  }

  // ── Fetch listing ─────────────────────────────────────────────────────────
  const [listing] = await db
    .select({
      id:    parkoutListing.id,
      title: parkoutListing.title,
      lga:   parkoutListing.lga,
      state: parkoutListing.state,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, listingId))
    .limit(1);

  if (!listing) {
    redirect("/parkout");
  }

  // ── Fetch this tenant's inspection ────────────────────────────────────────
  const [inspection] = await db
    .select({
      id:          parkoutInspection.id,
      status:      parkoutInspection.status,
      paidAt:      parkoutInspection.paidAt,
      paystackRef: parkoutInspection.paystackRef,
    })
    .from(parkoutInspection)
    .where(
      and(
        eq(parkoutInspection.listingId, listingId),
        eq(parkoutInspection.incomingUserId, session.user.id)
      )
    )
    .limit(1);

  // ── Verify payment ────────────────────────────────────────────────────────
  //
  // A successful redirect alone is not proof of payment.
  // We verify the transaction directly with Paystack.
  let paymentConfirmed = inspection?.paidAt != null;

  if (!paymentConfirmed && inspection) {
    const payment = await verifyPaystackPayment(reference);

    const referenceMatches =
      payment?.reference === reference &&
      (
        !inspection.paystackRef ||
        inspection.paystackRef === reference
      );

    const paymentMatches =
      payment?.status === "success" &&
      payment?.amount === INSPECTION_FEE_KOBO &&
      payment?.currency === INSPECTION_CURRENCY;

    if (referenceMatches && paymentMatches) {
      // ── Mark inspection as paid ───────────────────────────────────────────
      //
      // The payment has now been verified.
      // The inspection remains pending until the physical inspection occurs.
      await db
        .update(parkoutInspection)
        .set({
          paystackRef: reference,
          paidAt: new Date(),
          status: "pending",
          lockExpiresAt: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ),
          updatedAt: new Date(),
        })
        .where(eq(parkoutInspection.id, inspection.id));

      paymentConfirmed = true;
    } else {
      console.error(
        "[booking/success] Payment verification mismatch:",
        {
          listingId,
          inspectionId: inspection.id,
          reference,
          storedReference: inspection.paystackRef,
          paystackStatus: payment?.status,
          paystackAmount: payment?.amount,
          paystackCurrency: payment?.currency,
        }
      );
    }
  }

  // ── Build WhatsApp link ───────────────────────────────────────────────────
  const waMessage = inspectionBookedMessage({
    tenantName:   session.user.name ?? "Incoming tenant",
    listingTitle: listing.title,
    lga:          listing.lga,
    listingId:    listing.id,
  });

  const waLink = ADMIN_WHATSAPP
    ? `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(waMessage)}`
    : "#";

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* Header */}
      <div
        style={{
          padding: "16px 16px 14px",
          backgroundColor: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-primary)",
            margin: "0 0 2px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Park-Out & Earn
        </p>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 18,
            fontWeight: 800,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Inspection Booking
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 560,
          margin: "0 auto",
          padding: "24px 16px",
          width: "100%",
        }}
      >

        {paymentConfirmed ? (
          // ── SUCCESS STATE ──────────────────────────────────────────────────
          <>
            {/* Success icon */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#E8F5E9",
                  border: "2px solid #A5D6A7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#15803D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  margin: "0 0 6px",
                }}
              >
                Inspection booked! 🎉
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  margin: 0,
                }}
              >
                Your ₦3,000 payment has been confirmed
              </p>
            </div>

            {/* Listing name */}
            <div
              style={{
                borderRadius: 12,
                padding: "12px 14px",
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  margin: "0 0 2px",
                }}
              >
                You booked an inspection for
              </p>

              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                {listing.title}
              </p>
            </div>

            {/* What happens next */}
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "var(--color-primary)",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  What happens next
                </p>
              </div>

              {[
                {
                  icon: "💬",
                  step: "Message CorperNest on WhatsApp below to confirm your booking. An ambassador in your area will be assigned to you.",
                },
                {
                  icon: "📞",
                  step: "The ambassador will call or WhatsApp you within 24 hours to arrange a convenient date for the inspection.",
                },
                {
                  icon: "🏠",
                  step: "On inspection day, the ambassador escorts you to the property. They will call the outgoing tenant or caretaker.",
                },
                {
                  icon: "✅",
                  step: "If the room matches the listing and you want to proceed, you will pay the facilitation fee to secure the room.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 14px",
                    borderBottom:
                      i < 3
                        ? "1px solid var(--color-border)"
                        : "none",
                    backgroundColor:
                      i % 2 === 0
                        ? "var(--color-card)"
                        : "var(--color-bg)",
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {item.icon}
                  </span>

                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.step}
                  </p>
                </div>
              ))}
            </div>

            {/* WhatsApp button — main CTA */}
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: "15px",
                borderRadius: 14,
                backgroundColor: "#25D366",
                textDecoration: "none",
                marginBottom: 12,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.198.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
              </svg>

              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Message CorperNest on WhatsApp
              </span>
            </a>

            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center",
                margin: "0 0 20px",
                lineHeight: 1.6,
              }}
            >
              Tap above to open WhatsApp with a pre-filled message. Press Send to notify us of your booking.
            </p>

            {/* Back to listings */}
            <Link
              href="/parkout"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 13,
                color: "var(--color-text-muted)",
                textDecoration: "none",
              }}
            >
              ← Back to listings
            </Link>
          </>
        ) : (
          // ── PAYMENT NOT CONFIRMED STATE ────────────────────────────────────
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#FFF8E1",
                  border: "2px solid #FAC775",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="#F59E0B"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 9v4M12 17h.01"
                    stroke="#F59E0B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  margin: "0 0 6px",
                }}
              >
                Payment not confirmed
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  margin: "0 0 20px",
                  lineHeight: 1.6,
                }}
              >
                We could not confirm your payment. If you completed payment on Paystack, please wait a few minutes and refresh this page.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href={`/parkout/inspection-terms/${listingId}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px",
                  borderRadius: 14,
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Try payment again
              </Link>

              <Link
                href="/parkout"
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  textDecoration: "none",
                }}
              >
                ← Back to listings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}