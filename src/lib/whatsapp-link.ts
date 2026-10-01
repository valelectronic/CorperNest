// src/lib/whatsapp-link.ts
// Generates wa.me deep links for WhatsApp communication.
// Zero cost — opens WhatsApp on user device with pre-filled message.
// No API, no Twilio, no recurring cost.

// ── Park-Out WhatsApp ────────────────────────────────────────────────────────
// Dedicated WhatsApp number for Park-Out & Earn inspection support.
// Stored without +, spaces or dashes because wa.me expects the international
// number in digits-only format.
export const PARKOUT_WHATSAPP_NUMBER = "2349035583824";

// ── WhatsApp link generator ─────────────────────────────────────────────────
export function generateWaLink(phone: string, message: string): string {
  // Remove +, spaces, dashes from phone number
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  const encoded = encodeURIComponent(message.trim());

  return `https://wa.me/${cleaned}?text=${encoded}`;
}

// ── Pre-built message generators ────────────────────────────────────────────

export function ambassadorAssignedMessage({
  ambassadorName,
  listingTitle,
  lga,
  outgoingTenantName,
  outgoingTenantPhone,
  moveOutDate,
  listingId,
}: {
  ambassadorName: string;
  listingTitle: string;
  lga: string;
  outgoingTenantName: string;
  outgoingTenantPhone: string;
  moveOutDate: string;
  listingId: string;
}): string {
  return (
    `Hi ${ambassadorName},

` +
    `You have been assigned a new Park-Out & Earn listing on CorperNest.

` +
    `*Listing:* ${listingTitle}
` +
    `*Area:* ${lga}
` +
    `*Move-out date:* ${moveOutDate}
` +
    `*Listing reference:* ${listingId}

` +
    `*Outgoing tenant:* ${outgoingTenantName}
` +
    `*Tenant phone:* ${outgoingTenantPhone}

` +
    `Please contact the tenant to verify the listing details and arrange the inspection.

` +
    `You can view the full listing details from your CorperNest ambassador portal:
` +
    `https://corpernest.com.ng/parkout/ambassador`
  );
}

export function inspectionBookedMessage({
  tenantName,
  listingTitle,
  lga,
  listingId,
}: {
  tenantName: string;
  listingTitle: string;
  lga: string;
  listingId: string;
}): string {
  return (
    `Hi CorperNest, I just paid the inspection fee for a listing.\n\n` +
    `*My name:* ${tenantName}\n` +
    `*Listing:* ${listingTitle}\n` +
    `*Area:* ${lga}\n` +
    `*Reference:* ${listingId}\n\n` +
    `Please connect me with the ambassador for this area.`
  );
}
