// src/app/admin/parkout/listings/[id]/page.tsx
// Full listing detail for admin — sees ALL fields including private.

import { db } from "@/lib/db";
import { parkoutListing, parkoutAmbassador, parkoutAmbassadorApplication, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminListingActions from "./listing-actions";

type Props = { params: Promise<{ id: string }> };

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? "var(--color-primary)" : "var(--color-text)", flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

export default async function AdminParkOutListingDetailPage({ params }: Props) {
  const { id } = await params;

  const [listing] = await db
    .select({
      id:                    parkoutListing.id,
      outgoingUserId:        parkoutListing.outgoingUserId,
      ambassadorId:          parkoutListing.ambassadorId,
      title:                 parkoutListing.title,
      roomType:              parkoutListing.roomType,
      state:                 parkoutListing.state,
      lga:                   parkoutListing.lga,
      neighbourhood:         parkoutListing.neighbourhood,
      annualRent:            parkoutListing.annualRent,
      facilitationFee:       parkoutListing.facilitationFee,
      moveOutDate:           parkoutListing.moveOutDate,
      images:                parkoutListing.images,
      description:           parkoutListing.description,
      landlordRules:         parkoutListing.landlordRules,
      hasLandlordAgent:      parkoutListing.hasLandlordAgent,
      exactAddress:          parkoutListing.exactAddress,
      landlordName:          parkoutListing.landlordName,
      landlordPhone:         parkoutListing.landlordPhone,
      occupancyProofUrl:     parkoutListing.occupancyProofUrl,
      transportEstimates:    parkoutListing.transportEstimates,
      moveInFees:            parkoutListing.moveInFees,
      status:                parkoutListing.status,
      verifiedByAmbassador:  parkoutListing.verifiedByAmbassador,
      verifiedAt:            parkoutListing.verifiedAt,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, id))
    .limit(1);

  if (!listing) notFound();

  // Fetch outgoing tenant
  const [tenant] = listing.outgoingUserId
    ? await db.select({ name: user.name, email: user.email }).from(user)
        .where(eq(user.id, listing.outgoingUserId)).limit(1)
    : [null];

  // Fetch active ambassadors for assign dropdown — use correct column names
  const ambassadors = await db
    .select({
      id:     parkoutAmbassador.id,
      userId: parkoutAmbassador.userId,
      lga:    parkoutAmbassador.lga,         // ← correct column name
      state:  parkoutAmbassador.state,
    })
    .from(parkoutAmbassador)
    .where(eq(parkoutAmbassador.isActive, true));

  // Attach names — map lga to territoryLga for the actions component
  const ambassadorUsers = await Promise.all(
    ambassadors.map(async (a) => {
      const [u] = await db
        .select({
          name: user.name,
          phoneNumber: user.phoneNumber,
          phone: user.phone,
        })
        .from(user)
        .where(eq(user.id, a.userId))
        .limit(1);
      const [app] = await db
        .select({ whatsappNumber: parkoutAmbassadorApplication.whatsappNumber })
        .from(parkoutAmbassadorApplication)
        .where(eq(parkoutAmbassadorApplication.userId, a.userId))
        .limit(1);
      return {
        id:             a.id,
        name:           u?.name ?? "Unknown",
        territoryLga:   a.lga,
        whatsappNumber: app?.whatsappNumber ?? u?.phoneNumber ?? u?.phone ?? undefined,
      };
    })
  );

  const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
    pending_approval: { color: "#F59E0B", bg: "#FFF8E1" },
    active:           { color: "#15803D", bg: "#E8F5E9" },
    completed:        { color: "#3949AB", bg: "#E8EAF6" },
    rejected:         { color: "#C62828", bg: "#FFEBEE" },
  };
  const sc = STATUS_COLOR[listing.status] ?? { color: "var(--color-text-muted)", bg: "var(--color-light)" };

  const moveInFees   = listing.moveInFees as { cautionFee: number; agreementFee: number; extraFees: Array<{ name: string; amount: number }> } | null;
  const transport    = listing.transportEstimates as Array<{ name: string; bikeCost: number; kekeCost: number }> | null;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>

      <Link href="/admin/parkout/listings" style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
        ← Back to listings
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0, flex: 1 }}>
          {listing.title}
        </h1>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backgroundColor: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
          {listing.status.replace("_", " ")}
        </span>
      </div>

      {/* Photos */}
      {listing.images && listing.images.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16 }}>
          {listing.images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt={`Photo ${i + 1}`} style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <AdminListingActions
        listingId={listing.id}
        status={listing.status}
        ambassadors={ambassadorUsers}
        currentAmbassadorId={listing.ambassadorId}
        listingTitle={listing.title}
        lga={listing.lga}
        moveOutDate={listing.moveOutDate ? new Date(listing.moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        outgoingTenantName={tenant?.name ?? "—"}
        outgoingTenantPhone={listing.landlordPhone ?? "—"}
        currentMoveOutDate={listing.moveOutDate ? new Date(listing.moveOutDate).toISOString().split("T")[0] : ""}
        currentAnnualRent={(listing.annualRent ?? 0) / 100}
      />

      {/* Public details */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Public details</p>
        <Row label="Room type"      value={listing.roomType} />
        <Row label="Annual rent"    value={formatNaira(listing.annualRent ?? 0)} highlight />
        <Row label="Facilitation"   value={formatNaira(listing.facilitationFee ?? 0)} />
        <Row label="Move-out date"  value={listing.moveOutDate ? new Date(listing.moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
        <Row label="Location"       value={`${listing.neighbourhood}, ${listing.lga}, ${listing.state}`} />
        <Row label="Landlord agent" value={listing.hasLandlordAgent ? "Yes" : "No"} />
        <Row label="Ambassador verified" value={listing.verifiedByAmbassador ? `✓ Yes — ${listing.verifiedAt ? new Date(listing.verifiedAt).toLocaleDateString("en-NG") : ""}` : "Not yet"} />
        {listing.description  && <Row label="Description"    value={listing.description} />}
        {listing.landlordRules && <Row label="Landlord rules" value={listing.landlordRules} />}
      </div>

      {/* Private details */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>🔒 Private details</p>
        <Row label="Exact address"   value={listing.exactAddress ?? "—"} />
        <Row label="Caretaker name"  value={listing.landlordName ?? "—"} />
        <Row label="Caretaker phone" value={listing.landlordPhone ?? "—"} />
        <Row label="Proof of occ."   value={listing.occupancyProofUrl
          ? <a href={listing.occupancyProofUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>View document →</a>
          : "—"} />
      </div>

      {/* Outgoing tenant */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Outgoing tenant</p>
        <Row label="Name"  value={tenant?.name ?? "—"} />
        <Row label="Email" value={tenant?.email ?? "—"} />
      </div>

      {/* Move-in fees */}
      {moveInFees && (
        <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Move-in fees</p>
          <Row label="Caution deposit" value={moveInFees.cautionFee   > 0 ? `₦${moveInFees.cautionFee.toLocaleString("en-NG")}`   : "None"} />
          <Row label="Agreement fee"   value={moveInFees.agreementFee > 0 ? `₦${moveInFees.agreementFee.toLocaleString("en-NG")}` : "None"} />
          {(moveInFees.extraFees ?? []).map((f, i) => (
            <Row key={i} label={f.name} value={`₦${f.amount.toLocaleString("en-NG")}`} />
          ))}
        </div>
      )}

      {/* Transport estimates */}
      {transport && transport.length > 0 && (
        <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Transport estimates</p>
          {transport.map((t, i) => (
            <Row key={i} label={t.name} value={`🚲 ₦${t.bikeCost} · 🛺 ₦${t.kekeCost}`} />
          ))}
        </div>
      )}

    </div>
  );
}