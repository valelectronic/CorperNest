import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  phone: text("phone"),
  role: text("role").default("user"),
  verificationLevel: text("verification_level").default("basic"),
  ninVerified: boolean("nin_verified").default(false),
  state: text("state"),
  callUpNumber: text("call_up_number"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);



export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);



export const listing = pgTable(
  "listing",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    lga: text("lga").notNull(),
    state: text("state").notNull(),
    price: integer("price").notNull(), // annual rent in naira
    type: text("type").notNull(), // self-con | mini-flat | 1-bed | 2-bed | room
    status: text("status").default("available").notNull(), // available | reserved | occupied | temp-unavailable
    landlordName: text("landlord_name"),
    landlordPhone: text("landlord_phone"),
    landlordOtpVerified: boolean("landlord_otp_verified").default(false),
    images: text("images").array().default([]),
    isActive: boolean("is_active").default(true).notNull(),
    lastStatusUpdate: timestamp("last_status_update").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("listing_agentId_idx").on(table.agentId),
    index("listing_status_idx").on(table.status),
    index("listing_state_idx").on(table.state),
  ],
);


export const visitVerification = pgTable(
  "visit_verification",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // e.g. CNV-4F8K2M
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("visit_verification_bookingId_idx").on(table.bookingId),
    index("visit_verification_code_idx").on(table.code),
  ],
);


export const booking = pgTable(
  "booking",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    renterId: text("renter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookingCode: text("booking_code").notNull().unique(),
    // Add to booking table
renterContact: text("renter_contact"),      // phone or email used at payment
renterContactType: text("renter_contact_type"), // "email" | "phone"
    status: text("status").default("pending").notNull(), // pending | verified | completed | cancelled
    visitDate: timestamp("visit_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("booking_agentId_idx").on(table.agentId),
    index("booking_renterId_idx").on(table.renterId),
    index("booking_code_idx").on(table.bookingCode),
  ],
);

export const bookingRelations = relations(booking, ({ one, many }) => ({
  listing: one(listing, { fields: [booking.listingId], references: [listing.id] }),
  renter: one(user, { fields: [booking.renterId], references: [user.id] }),
  agent: one(user, { fields: [booking.agentId], references: [user.id] }),
  visitVerifications: many(visitVerification),
}));


export const visitVerificationRelations = relations(visitVerification, ({ one }) => ({
  booking: one(booking, {
    fields: [visitVerification.bookingId],
    references: [booking.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  listings: many(listing),
  bookingsAsAgent: many(booking, { relationName: "agentBookings" }),
  bookingsAsRenter: many(booking, { relationName: "renterBookings" }),
}));


export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
