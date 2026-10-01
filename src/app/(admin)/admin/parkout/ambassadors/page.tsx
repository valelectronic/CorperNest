// src/app/admin/parkout/ambassadors/page.tsx
import { db } from "@/lib/db";
import { parkoutAmbassador, user, parkoutAmbassadorApplication } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import AmbassadorCard from "./ambassador-card";

export const dynamic = "force-dynamic";

export default async function AdminParkOutAmbassadorsPage() {
  const ambassadors = await db
    .select({
      id:          parkoutAmbassador.id,
      userId:      parkoutAmbassador.userId,
      lga:         parkoutAmbassador.lga,
      state:       parkoutAmbassador.state,
      totalDeals:  parkoutAmbassador.totalDeals,
      totalEarned: parkoutAmbassador.totalEarned,
      isActive:    parkoutAmbassador.isActive,
    })
    .from(parkoutAmbassador)
    .orderBy(parkoutAmbassador.createdAt);

  // Attach user info + whatsapp number from application
  const withDetails = await Promise.all(
    ambassadors.map(async (a) => {
      const [u] = await db
        .select({ name: user.name, email: user.email })
        .from(user).where(eq(user.id, a.userId)).limit(1);

      const [app] = await db
        .select({ whatsappNumber: parkoutAmbassadorApplication.whatsappNumber })
        .from(parkoutAmbassadorApplication)
        .where(eq(parkoutAmbassadorApplication.userId, a.userId))
        .limit(1);

      return {
        ...a,
        name:          u?.name          ?? "Unknown",
        email:         u?.email         ?? "—",
        whatsappNumber: app?.whatsappNumber ?? undefined,
      };
    })
  );

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
            Location Ambassadors
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            {ambassadors.length} ambassador{ambassadors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/parkout/ambassadors/new"
          style={{ padding: "10px 16px", borderRadius: 10, backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          + Add manually
        </Link>
      </div>

      {ambassadors.length === 0 ? (
        <div style={{ borderRadius: 14, padding: "40px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>👤</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>No ambassadors yet</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            Approve applications or add one manually
          </p>
          <Link href="/admin/parkout/ambassadors/new"
            style={{ padding: "10px 20px", borderRadius: 10, backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Add ambassador manually
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {withDetails.map((amb) => (
            <AmbassadorCard
              key={amb.id}
              id={amb.id}
              name={amb.name}
              email={amb.email}
              lga={amb.lga}
              state={amb.state}
              whatsappNumber={amb.whatsappNumber}
              totalDeals={amb.totalDeals ?? 0}
              totalEarned={amb.totalEarned ?? 0}
              isActive={amb.isActive ?? true}
            />
          ))}
        </div>
      )}
    </div>
  );
}