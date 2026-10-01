// src/app/admin/parkout/ambassadors/new/page.tsx
// Admin manually creates an ambassador — no payment required.

import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";
import AddAmbassadorForm from "./add-ambassador-form";

export default async function AdminAddAmbassadorPage() {
  const users = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).orderBy(user.name);
  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
        Add Ambassador Manually
      </h1>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
        Creates an active ambassador record without requiring payment or application.
      </p>
      <AddAmbassadorForm users={users} states={STATE_NAMES} />
    </div>
  );
}