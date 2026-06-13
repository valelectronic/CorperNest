import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  agentVerified: boolean("agent_verified").default(false).notNull(),
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
    // Auto-generated from type + lga e.g. "Self Contained in Uyo"
    title: text("title").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    lga: text("lga").notNull(),
    state: text("state").notNull(),
    price: integer("price").notNull(),
    // rent | sale
    listingPurpose: text("listing_purpose").default("rent").notNull(),
    // self-con | mini-flat | 1-bed | 2-bed | room
    type: text("type").notNull(),
    // available | reserved | occupied | temp-unavailable | under-review | flagged
    status: text("status").default("under-review").notNull(),
    landlordName: text("landlord_name"),
    landlordPhone: text("landlord_phone"),
    landlordOtpVerified: boolean("landlord_otp_verified").default(false),
    images: text("images").array().default([]),
    // Standard amenities stored as slugs e.g. ["running-water", "prepaid-meter"]
    amenities: text("amenities").array().default([]),
    // Extra amenities agent types manually e.g. ["Boys quarters"]
    customAmenities: text("custom_amenities").array().default([]),
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
    index("listing_purpose_idx").on(table.listingPurpose),
  ],
);

// ─── INSPECTION PAYMENT ──────────────────────────────────────────────────────
// One payment per corper-agent pair
// Covers inspection of ALL listings by that agent
// Expires after CNV code is successfully verified
export const inspectionPayment = pgTable(
  "inspection_payment",
  {
    id: text("id").primaryKey(),
    renterId: text("renter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Paystack payment reference — null until Phase 5 payment is built
    paystackRef: text("paystack_ref"),
    // Fixed platform fee in kobo (500000 = ₦5,000)
    amount: integer("amount").default(500000).notNull(),
    // pending | paid | expired
    // pending: payment initiated but not confirmed
    // paid: Paystack confirmed payment
    // expired: CNV code verified, inspection session closed
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("inspection_payment_renterId_idx").on(table.renterId),
    index("inspection_payment_agentId_idx").on(table.agentId),
    index("inspection_payment_status_idx").on(table.status),
  ],
);

// ─── REFERRAL ────────────────────────────────────────────────────────────────
// Created when Agent A refers a corper to Agent B (both must be on platform)
// Referral links to the original inspection payment
// On acceptance, corper's inspection unlocks Agent B's listings too
export const referral = pgTable(
  "referral",
  {
    id: text("id").primaryKey(),
    // The original inspection payment being extended via referral
    inspectionPaymentId: text("inspection_payment_id")
      .notNull()
      .references(() => inspectionPayment.id, { onDelete: "cascade" }),
    // Agent A — the one who refers and earns 20%
    referringAgentId: text("referring_agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Agent B — the one who receives the corper and earns 60%
    receivingAgentId: text("receiving_agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // pending | accepted | declined
    // pending: Agent A sent referral, waiting for Agent B
    // accepted: Agent B accepted, corper can now see Agent B's listings
    // declined: Agent B declined, corper stays with Agent A only
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("referral_inspectionPaymentId_idx").on(table.inspectionPaymentId),
    index("referral_referringAgentId_idx").on(table.referringAgentId),
    index("referral_receivingAgentId_idx").on(table.receivingAgentId),
  ],
);

// ─── PAYOUT SPLIT ────────────────────────────────────────────────────────────
// Records how each inspection payment is split between platform and agent(s)
// Created when payment is confirmed (Phase 5)
// One inspection_payment creates 2 rows (no referral) or 3 rows (with referral)
//
// WITHOUT REFERRAL (2 rows):
//   platform     20%  ₦1,000
//   agent        80%  ₦4,000
//
// WITH REFERRAL (3 rows):
//   platform          20%  ₦1,000
//   referring-agent   20%  ₦1,000
//   receiving-agent   60%  ₦3,000
export const payoutSplit = pgTable(
  "payout_split",
  {
    id: text("id").primaryKey(),
    inspectionPaymentId: text("inspection_payment_id")
      .notNull()
      .references(() => inspectionPayment.id, { onDelete: "cascade" }),
    // platform | referring-agent | receiving-agent | sole-agent
    recipientType: text("recipient_type").notNull(),
    // null for platform, userId for agents
    recipientId: text("recipient_id")
      .references(() => user.id, { onDelete: "set null" }),
    // Actual naira amount in kobo e.g. 100000 = ₦1,000
    amount: integer("amount").notNull(),
    // Percentage e.g. 20, 60, 80
    percentage: integer("percentage").notNull(),
    // pending | paid
    // pending: payment confirmed, payout not yet sent
    // paid: manually transferred to agent's bank account
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payout_split_inspectionPaymentId_idx").on(table.inspectionPaymentId),
    index("payout_split_recipientId_idx").on(table.recipientId),
    index("payout_split_status_idx").on(table.status),
  ],
);

// ─── BOOKING ─────────────────────────────────────────────────────────────────
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
    // Links booking to the inspection payment that unlocked it
    // null until Phase 5 payment is built
    inspectionPaymentId: text("inspection_payment_id")
      .references(() => inspectionPayment.id, { onDelete: "set null" }),
    bookingCode: text("booking_code").notNull().unique(),
    // Phone or email used at payment — null until Phase 5
    renterContact: text("renter_contact"),
    renterContactType: text("renter_contact_type"),
    // pending | scheduled | verified | completed | cancelled
    // pending: booking created, corper hasn't set visit date yet
    // scheduled: corper set date+time, full details revealed to both sides
    // verified: CNV code confirmed on visit day
    // completed: visit done, booking closed
    // cancelled: either party cancelled
    status: text("status").default("pending").notNull(),
    // kept for schema compatibility — not used in MVP flow
    confirmationStatus: text("confirmation_status").default("pending").notNull(),
    // Set by corper when they confirm their preferred visit date
    agreedDate: timestamp("agreed_date"),
    // Set by corper as text e.g. "2:00 PM" — agent sees this and confirms
    agreedTime: text("agreed_time"),
    // Tracks when admin was last notified of unconfirmed booking
    // Admin uses this to manually follow up with agent
    lastAdminAlert: timestamp("last_admin_alert"),
    visitDate: timestamp("visit_date"),
    // "this-week" | "next-week" | "flexible"
    preferredPeriod: text("preferred_period"),
    // Optional note from corper to agent at booking time
    visitNote: text("visit_note"),
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
    index("booking_confirmationStatus_idx").on(table.confirmationStatus),
    index("booking_inspectionPaymentId_idx").on(table.inspectionPaymentId),
  ],
);

// ─── VISIT VERIFICATION ──────────────────────────────────────────────────────
export const visitVerification = pgTable(
  "visit_verification",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("visit_verification_bookingId_idx").on(table.bookingId),
    index("visit_verification_code_idx").on(table.code),
  ],
);

// ─── WATCHLIST ───────────────────────────────────────────────────────────────
export const watchlist = pgTable(
  "watchlist",
  {
    id: text("id").primaryKey(),
    renterId: text("renter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("watchlist_renterId_idx").on(table.renterId),
    index("watchlist_listingId_idx").on(table.listingId),
  ],
);

//  NOTIFICATION ───────────────────────────────────────────────────────────────

export const notification = pgTable(
  "notification",
  {
    id:        text("id").primaryKey(),
    userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    // booking-created | date-confirmed | both-confirmed |
    // agent-verified  | inspection-reminder
    type:      text("type").notNull(),
    title:     text("title").notNull(),
    message:   text("message").notNull(),
    // Optional deep-link — e.g. /properties/abc or /bookings/xyz
    link:      text("link"),
    read:      boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_read_idx").on(table.userId, table.read),
    index("notification_createdAt_idx").on(table.createdAt),
  ],
);


// ─── AGENT KYC REQUEST ───────────────────────────────────────────────────────
// Submitted by agent when applying for verification
// Admin reviews and updates user.agentVerified directly
// status: pending | approved | declined
export const agentKycRequest = pgTable(
  "agent_kyc_request",
  {
    id:            text("id").primaryKey(),
    agentId:       text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Contact
    fullName:      text("full_name").notNull(),
    phone:         text("phone").notNull(),
    whatsapp:      text("whatsapp"),
    // Location — where they operate
    state:         text("state").notNull(),
    lga:           text("lga").notNull(),
    // Bank details for payouts
    bankName:      text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountName:   text("account_name").notNull(),
    // Review
    // pending | approved | declined
    status:        text("status").default("pending").notNull(),
    adminNote:     text("admin_note"),
    reviewedAt:    timestamp("reviewed_at"),
    createdAt:     timestamp("created_at").defaultNow().notNull(),
    updatedAt:     timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("kyc_agentId_idx").on(table.agentId),
    index("kyc_status_idx").on(table.status),
  ],
);

export const review = pgTable(
  "review",
  {
    id:         text("id").primaryKey(),
    // The verified booking this review is for
    bookingId:  text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    // The client who is leaving the review
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The agent being reviewed
    agentId:    text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // 1–5 stars
    rating:     integer("rating").notNull(),
    // Optional short comment — max ~500 chars enforced on the API
    comment:    text("comment"),
    createdAt:  timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("review_agentId_idx").on(table.agentId),
    index("review_reviewerId_idx").on(table.reviewerId),
    index("review_bookingId_idx").on(table.bookingId),
  ],
);

export const rentRecord = pgTable(
  "rent_record",
  {
    id:           text("id").primaryKey(),
 
    // The verified booking this rent record is tied to
    bookingId:    text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
 
    // The client who uploaded the receipt
    renterId:     text("renter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
 
    // The agent for this booking
    agentId:      text("agent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
 
    // The listing this rent is for
    listingId:    text("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
 
    // Rent amount in naira as typed by the client
    rentAmount:   integer("rent_amount").notNull(),
 
    // Duration: "6" | "12" | "24" months
    durationMonths: integer("duration_months").notNull(),
 
    // Date client paid rent (from their receipt)
    paymentDate:  timestamp("payment_date").notNull(),
 
    // Calculated: paymentDate + durationMonths
    // Renewal reminder fires 30 days before this
    renewalDate:  timestamp("renewal_date").notNull(),
 
    // Cloudinary URL of the uploaded receipt image
    receiptUrl:   text("receipt_url").notNull(),
 
    // Paystack reference for the ₦1,000 documentation fee
    paystackRef:  text("paystack_ref"),
 
    // Whether the ₦1,000 fee has been confirmed paid
    feePaid:      boolean("fee_paid").default(false).notNull(),
 
    // Whether a renewal reminder has been sent
    reminderSent: boolean("reminder_sent").default(false).notNull(),
 
    createdAt:    timestamp("created_at").defaultNow().notNull(),
    updatedAt:    timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("rent_record_renterId_idx").on(table.renterId),
    index("rent_record_agentId_idx").on(table.agentId),
    index("rent_record_bookingId_idx").on(table.bookingId),
    index("rent_record_renewalDate_idx").on(table.renewalDate),
  ],
);


// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  listings: many(listing),
  bookingsAsAgent: many(booking, { relationName: "agentBookings" }),
  bookingsAsRenter: many(booking, { relationName: "renterBookings" }),
  watchlist: many(watchlist),
  inspectionPaymentsAsRenter: many(inspectionPayment, { relationName: "renterPayments" }),
  inspectionPaymentsAsAgent: many(inspectionPayment, { relationName: "agentPayments" }),
  referralsAsReferring: many(referral, { relationName: "referringAgent" }),
  referralsAsReceiving: many(referral, { relationName: "receivingAgent" }),
  payoutSplits: many(payoutSplit),
  notifications: many(notification),
  agentKycRequests: many(agentKycRequest),
 reviewsGiven:    many(review, { relationName: "reviewsGiven"    }),
reviewsReceived: many(review, { relationName: "reviewsReceived" }),
rentRecords:     many(rentRecord),
}));



export const agentKycRequestRelations = relations(agentKycRequest, ({ one }) => ({
  agent: one(user, {
    fields: [agentKycRequest.agentId],
    references: [user.id],
  }),
}));

export const rentRecordRelations = relations(rentRecord, ({ one }) => ({
  booking: one(booking,  { fields: [rentRecord.bookingId],  references: [booking.id]  }),
  renter:  one(user,     { fields: [rentRecord.renterId],   references: [user.id]     }),
  agent:   one(user,     { fields: [rentRecord.agentId],    references: [user.id]     }),
  listing: one(listing,  { fields: [rentRecord.listingId],  references: [listing.id]  }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  booking:  one(booking, { fields: [review.bookingId],  references: [booking.id]  }),
  reviewer: one(user,    { fields: [review.reviewerId], references: [user.id], relationName: "reviewsGiven"    }),
  agent:    one(user,    { fields: [review.agentId],    references: [user.id], relationName: "reviewsReceived" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const listingRelations = relations(listing, ({ one, many }) => ({
  agent: one(user, { fields: [listing.agentId], references: [user.id] }),
  bookings: many(booking),
  watchlistEntries: many(watchlist),
}));

export const inspectionPaymentRelations = relations(inspectionPayment, ({ one, many }) => ({
  renter: one(user, {
    fields: [inspectionPayment.renterId],
    references: [user.id],
    relationName: "renterPayments",
  }),
  agent: one(user, {
    fields: [inspectionPayment.agentId],
    references: [user.id],
    relationName: "agentPayments",
  }),
  bookings: many(booking),
  referral: one(referral, {
    fields: [inspectionPayment.id],
    references: [referral.inspectionPaymentId],
  }),
  payoutSplits: many(payoutSplit),
}));

export const referralRelations = relations(referral, ({ one }) => ({
  inspectionPayment: one(inspectionPayment, {
    fields: [referral.inspectionPaymentId],
    references: [inspectionPayment.id],
  }),
  referringAgent: one(user, {
    fields: [referral.referringAgentId],
    references: [user.id],
    relationName: "referringAgent",
  }),
  receivingAgent: one(user, {
    fields: [referral.receivingAgentId],
    references: [user.id],
    relationName: "receivingAgent",
  }),
}));

export const payoutSplitRelations = relations(payoutSplit, ({ one }) => ({
  inspectionPayment: one(inspectionPayment, {
    fields: [payoutSplit.inspectionPaymentId],
    references: [inspectionPayment.id],
  }),
  recipient: one(user, {
    fields: [payoutSplit.recipientId],
    references: [user.id],
  }),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  listing: one(listing, { fields: [booking.listingId], references: [listing.id] }),
  renter: one(user, {
    fields: [booking.renterId],
    references: [user.id],
    relationName: "renterBookings",
  }),
  agent: one(user, {
    fields: [booking.agentId],
    references: [user.id],
    relationName: "agentBookings",
  }),
  inspectionPayment: one(inspectionPayment, {
    fields: [booking.inspectionPaymentId],
    references: [inspectionPayment.id],
  }),
  visitVerifications: many(visitVerification),
}));

export const visitVerificationRelations = relations(visitVerification, ({ one }) => ({
  booking: one(booking, {
    fields: [visitVerification.bookingId],
    references: [booking.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  renter: one(user, { fields: [watchlist.renterId], references: [user.id] }),
  listing: one(listing, { fields: [watchlist.listingId], references: [listing.id] }),
}));