import { relations } from "drizzle-orm";
import {
  pgTable, text, timestamp, boolean,
  index, integer,uniqueIndex
} from "drizzle-orm/pg-core";

// ─── USER ────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id:                   text("id").primaryKey(),
  name:                 text("name").notNull(),
  email:                text("email").notNull().unique(),
  emailVerified:        boolean("email_verified").default(false).notNull(),
  image:                text("image"),
  agentVerified:        boolean("agent_verified").default(false).notNull(),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  phone:                text("phone"),
  role:                 text("role").default("user"),
  phoneNumber:          text("phone_number").unique(),
  phoneNumberVerified:  boolean("phone_number_verified").default(false).notNull(),
  verificationLevel:    text("verification_level").default("basic"),
  ninVerified:          boolean("nin_verified").default(false),
  state:                text("state"),
  callUpNumber:         text("call_up_number"),
  // Marketplace seller — bank verified via Paystack resolve-account
  marketAccountNumber:  text("market_account_number"),
  marketBankCode:       text("market_bank_code"),
  marketAccountName:    text("market_account_name"),
  marketSellerVerified: boolean("market_seller_verified").default(false),
  // Marketplace vendor tier: "basic" (default) | "vendor" (KYC approved)
  marketVendorTier:     text("market_vendor_tier").default("basic"),
  fcmToken:         text("fcm_token"),
});

// ─── SESSION ─────────────────────────────────────────────────────────────────

export const session = pgTable("session", {
  id:        text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token:     text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_userId_idx").on(t.userId)]);

// ─── ACCOUNT ─────────────────────────────────────────────────────────────────

export const account = pgTable("account", {
  id:                     text("id").primaryKey(),
  accountId:              text("account_id").notNull(),
  providerId:             text("provider_id").notNull(),
  userId:                 text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken:            text("access_token"),
  refreshToken:           text("refresh_token"),
  idToken:                text("id_token"),
  accessTokenExpiresAt:   timestamp("access_token_expires_at"),
  refreshTokenExpiresAt:  timestamp("refresh_token_expires_at"),
  scope:                  text("scope"),
  password:               text("password"),
  createdAt:              timestamp("created_at").defaultNow().notNull(),
  updatedAt:              timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
}, (t) => [index("account_userId_idx").on(t.userId)]);

// ─── VERIFICATION ─────────────────────────────────────────────────────────────

export const verification = pgTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

// ─── LISTING ─────────────────────────────────────────────────────────────────

export const listing = pgTable("listing", {
  id:               text("id").primaryKey(),
  agentId:          text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title:            text("title").notNull(),
  slug:             text("slug").unique(),
  description:      text("description").notNull(),
  address:          text("address").notNull(),
  landmark:         text("landmark"),
  agencyFeePercent: integer("agency_fee_percent"),
  lga:              text("lga").notNull(),
  state:            text("state").notNull(),
  price:            integer("price").notNull(),
  listingPurpose:   text("listing_purpose").default("rent").notNull(),
  type:             text("type").notNull(),
  status:           text("status").default("under-review").notNull(),
  landlordName:     text("landlord_name"),
  landlordPhone:    text("landlord_phone"),
  landlordOtpVerified: boolean("landlord_otp_verified").default(false),
  images:           text("images").array().default([]),
  amenities:        text("amenities").array().default([]),
  customAmenities:  text("custom_amenities").array().default([]),
  isActive:         boolean("is_active").default(true).notNull(),
  lastStatusUpdate: timestamp("last_status_update").defaultNow().notNull(),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("listing_agentId_idx").on(t.agentId),
  index("listing_status_idx").on(t.status),
  index("listing_state_idx").on(t.state),
  index("listing_purpose_idx").on(t.listingPurpose),
]);

// ─── INSPECTION PAYMENT ───────────────────────────────────────────────────────

export const inspectionPayment = pgTable("inspection_payment", {
  id:          text("id").primaryKey(),
  renterId:    text("renter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agentId:     text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingId:   text("listing_id").references(() => listing.id, { onDelete: "set null" }),
  paystackRef: text("paystack_ref"),
  amount:      integer("amount").default(500000).notNull(),
  status:      text("status").default("pending").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("inspection_payment_renterId_idx").on(t.renterId),
  index("inspection_payment_agentId_idx").on(t.agentId),
  index("inspection_payment_status_idx").on(t.status),
]);

// ─── REFERRAL ────────────────────────────────────────────────────────────────

export const referral = pgTable("referral", {
  id:                   text("id").primaryKey(),
  inspectionPaymentId:  text("inspection_payment_id").notNull().references(() => inspectionPayment.id, { onDelete: "cascade" }),
  referringAgentId:     text("referring_agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  receivingAgentId:     text("receiving_agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  status:               text("status").default("pending").notNull(),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("referral_inspectionPaymentId_idx").on(t.inspectionPaymentId),
  index("referral_referringAgentId_idx").on(t.referringAgentId),
  index("referral_receivingAgentId_idx").on(t.receivingAgentId),
]);

// ─── PAYOUT SPLIT ─────────────────────────────────────────────────────────────

export const payoutSplit = pgTable("payout_split", {
  id:                   text("id").primaryKey(),
  inspectionPaymentId:  text("inspection_payment_id").notNull().references(() => inspectionPayment.id, { onDelete: "cascade" }),
  recipientType:        text("recipient_type").notNull(),
  recipientId:          text("recipient_id").references(() => user.id, { onDelete: "set null" }),
  amount:               integer("amount").notNull(),
  percentage:           integer("percentage").notNull(),
  status:               text("status").default("pending").notNull(),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("payout_split_inspectionPaymentId_idx").on(t.inspectionPaymentId),
  index("payout_split_recipientId_idx").on(t.recipientId),
  index("payout_split_status_idx").on(t.status),
]);

// ─── BOOKING ─────────────────────────────────────────────────────────────────

export const booking = pgTable("booking", {
  id:                   text("id").primaryKey(),
  listingId:            text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  renterId:             text("renter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agentId:              text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  inspectionPaymentId:  text("inspection_payment_id").references(() => inspectionPayment.id, { onDelete: "set null" }),
  bookingCode:          text("booking_code").notNull().unique(),
  renterContact:        text("renter_contact"),
  renterContactType:    text("renter_contact_type"),
  status:               text("status").default("pending").notNull(),
  confirmationStatus:   text("confirmation_status").default("pending").notNull(),
  agreedDate:           timestamp("agreed_date"),
  agreedTime:           text("agreed_time"),
  lastAdminAlert:       timestamp("last_admin_alert"),
  visitDate:            timestamp("visit_date"),
  preferredPeriod:      text("preferred_period"),
  visitNote:            text("visit_note"),
  commissionStatus:     text("commission_status"),
  commissionPaidAt:     timestamp("commission_paid_at"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("booking_agentId_idx").on(t.agentId),
  index("booking_renterId_idx").on(t.renterId),
  index("booking_code_idx").on(t.bookingCode),
  index("booking_confirmationStatus_idx").on(t.confirmationStatus),
  index("booking_inspectionPaymentId_idx").on(t.inspectionPaymentId),
]);

// ─── BOOKING REQUEST ──────────────────────────────────────────────────────────

export const bookingRequest = pgTable("booking_request", {
  id:               text("id").primaryKey(),
  clientId:         text("client_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingId:        text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  agentId:          text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  status:           text("status").default("pending").notNull(),
  termsAcceptedAt:  timestamp("terms_accepted_at").notNull(),
  approvedAt:       timestamp("approved_at"),
  approvedBy:       text("approved_by"),
  declineReason:    text("decline_reason"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("booking_request_clientId_idx").on(t.clientId),
  index("booking_request_listingId_idx").on(t.listingId),
  index("booking_request_agentId_idx").on(t.agentId),
  index("booking_request_status_idx").on(t.status),
]);

// ─── VISIT VERIFICATION ───────────────────────────────────────────────────────

export const visitVerification = pgTable("visit_verification", {
  id:        text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  code:      text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used:      boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("visit_verification_bookingId_idx").on(t.bookingId),
  index("visit_verification_code_idx").on(t.code),
]);

// ─── WATCHLIST ────────────────────────────────────────────────────────────────

export const watchlist = pgTable("watchlist", {
  id:        text("id").primaryKey(),
  renterId:  text("renter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingId: text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("watchlist_renterId_idx").on(t.renterId),
  index("watchlist_listingId_idx").on(t.listingId),
]);

// ─── PROPERTY REQUEST ─────────────────────────────────────────────────────────

export const propertyRequest = pgTable("property_request", {
  id:             text("id").primaryKey(),
  renterId:       text("renter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lga:            text("lga").notNull(),
  state:          text("state").notNull(),
  type:           text("type").notNull(),
  listingPurpose: text("listing_purpose").default("rent").notNull(),
  landmark:       text("landmark"),
  minBudget:      integer("min_budget"),
  maxBudget:      integer("max_budget"),
  notes:          text("notes"),
  status:         text("status").default("open").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  expiresAt:      timestamp("expires_at").notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("property_request_renterId_idx").on(t.renterId),
  index("property_request_status_idx").on(t.status),
  index("property_request_lga_idx").on(t.lga),
]);

// ─── REQUEST MATCH ────────────────────────────────────────────────────────────

export const requestMatch = pgTable("request_match", {
  id:              text("id").primaryKey(),
  requestId:       text("request_id").notNull().references(() => propertyRequest.id, { onDelete: "cascade" }),
  listingId:       text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  status:          text("status").notNull().default("pending"),
  reviewedAt:      timestamp("reviewed_at"),
  reviewedBy:      text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  rejectionReason: text("rejection_reason"),
  note:            text("note"),
  matchedBy:       text("matched_by").notNull(),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("request_match_requestId_idx").on(t.requestId),
  index("request_match_listingId_idx").on(t.listingId),
]);

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────

export const notification = pgTable("notification", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type:      text("type").notNull(),
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  link:      text("link"),
  read:      boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notification_user_read_idx").on(t.userId, t.read),
  index("notification_createdAt_idx").on(t.createdAt),
]);

// ─── PUSH SUBSCRIPTION ────────────────────────────────────────────────────────

export const pushSubscription = pgTable("push_subscription", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  endpoint:  text("endpoint").notNull().unique(),
  p256dh:    text("p256dh").notNull(),
  auth:      text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("push_sub_userId_idx").on(t.userId)]);

// ─── AGENT KYC REQUEST ────────────────────────────────────────────────────────

export const agentKycRequest = pgTable("agent_kyc_request", {
  id:            text("id").primaryKey(),
  agentId:       text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fullName:      text("full_name").notNull(),
  phone:         text("phone").notNull(),
  whatsapp:      text("whatsapp"),
  state:         text("state").notNull(),
  lga:           text("lga").notNull(),
  bankName:      text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName:   text("account_name").notNull(),
  status:        text("status").default("pending").notNull(),
  adminNote:     text("admin_note"),
  reviewedAt:    timestamp("reviewed_at"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("kyc_agentId_idx").on(t.agentId),
  index("kyc_status_idx").on(t.status),
]);

// ─── REVIEW ───────────────────────────────────────────────────────────────────

export const review = pgTable("review", {
  id:         text("id").primaryKey(),
  bookingId:  text("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agentId:    text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  rating:     integer("rating").notNull(),
  comment:    text("comment"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("review_agentId_idx").on(t.agentId),
  index("review_reviewerId_idx").on(t.reviewerId),
  index("review_bookingId_idx").on(t.bookingId),
]);

// ─── RENT RECORD ──────────────────────────────────────────────────────────────

export const rentRecord = pgTable("rent_record", {
  id:             text("id").primaryKey(),
  bookingId:      text("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  renterId:       text("renter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agentId:        text("agent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingId:      text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  rentAmount:     integer("rent_amount").notNull(),
  durationMonths: integer("duration_months").notNull(),
  paymentDate:    timestamp("payment_date").notNull(),
  renewalDate:    timestamp("renewal_date").notNull(),
  receiptUrl:     text("receipt_url").notNull(),
  receiptStatus:  text("receipt_status").default("pending").notNull(),
  adminNote:      text("admin_note"),
  paystackRef:    text("paystack_ref"),
  feePaid:        boolean("fee_paid").default(false).notNull(),
  reminderSent:   boolean("reminder_sent").default(false).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("rent_record_renterId_idx").on(t.renterId),
  index("rent_record_agentId_idx").on(t.agentId),
  index("rent_record_bookingId_idx").on(t.bookingId),
  index("rent_record_renewalDate_idx").on(t.renewalDate),
  index("rent_record_receiptStatus_idx").on(t.receiptStatus),
]);

// ─── MARKETPLACE LISTING ──────────────────────────────────────────────────────
// listingType: "single" = one item | "bundle" = multiple items sold together
// bundleItems: list of items in a bundle e.g. ["Fan", "Mattress", "Pot set"]
// Bundle listings skip Google price search — no reference price for unique sets
// status flow: pending → active → reserved → sold | flagged | deleted

export const marketplaceListing = pgTable("marketplace_listing", {
  id:                  text("id").primaryKey(),
  sellerId:            text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingType:         text("listing_type").default("single").notNull(), // single | bundle
  title:               text("title").notNull(),
  category:            text("category").notNull(),
  condition:           text("condition").notNull(), // new | fairly-used | mixed (bundle only)
  description:         text("description").notNull(),
  bundleItems:         text("bundle_items").array().default([]), // items in bundle
  price:               integer("price").notNull(), // in kobo
  state:               text("state").notNull(),
  lga:                 text("lga").notNull(),
  landmark:            text("landmark").notNull(),
  images:              text("images").array().default([]), // max 5 (3 for single, 5 for bundle)
  hasReceipt:          boolean("has_receipt").default(false),
  delivery:            text("delivery").default("pickup").notNull(), // pickup | delivery | both
  // Price intelligence — stored at listing creation from seller's AI price check
  sellerPriceNote:     text("seller_price_note"),              // seller's explanation of their pricing
  refPriceMin:         integer("ref_price_min"),               // AI estimated new price min (kobo)
  refPriceMax:         integer("ref_price_max"),               // AI estimated new price max (kobo)
  refPriceSource:      text("ref_price_source"),               // e.g. "Jumia, Konga"
  refPriceContext:     text("ref_price_context"), 
  refPriceGoogleUrl:   text("ref_price_google_url"),  
  status:              text("status").default("pending").notNull(),
  agreementAcceptedAt: timestamp("agreement_accepted_at"),
  approvedAt:          timestamp("approved_at"),
  expiresAt:           timestamp("expires_at"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("market_listing_sellerId_idx").on(t.sellerId),
  index("market_listing_status_idx").on(t.status),
  index("market_listing_category_idx").on(t.category),
  index("market_listing_state_idx").on(t.state),
  index("market_listing_lga_idx").on(t.lga),
  index("market_listing_type_idx").on(t.listingType),
]);

// ─── MARKETPLACE RATING ──────────────────────────────────────────────────────
export const marketplaceRating = pgTable("marketplace_rating", {
  id:            text("id").primaryKey(),
  transactionId: text("transaction_id").notNull().references(() => marketplaceTransaction.id, { onDelete: "cascade" }),
  listingId:     text("listing_id").notNull().references(() => marketplaceListing.id,     { onDelete: "cascade" }),
  sellerId:      text("seller_id").notNull().references(() => user.id,                    { onDelete: "cascade" }),
  buyerId:       text("buyer_id").notNull().references(() => user.id,                     { onDelete: "cascade" }),
  stars:         integer("stars").notNull(),
  comment:       text("comment"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("rating_transaction_unique").on(t.transactionId),
  index("rating_seller_idx").on(t.sellerId),
]);
 
// ─── MARKETPLACE TRANSACTION ──────────────────────────────────────────────────
// status flow: pending → escrow → released | refunded | disputed

export const marketplaceTransaction = pgTable("marketplace_transaction", {
  id:           text("id").primaryKey(),
  listingId:    text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:      text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:     text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount:       integer("amount").notNull(),        // full price in kobo
  commission:   integer("commission").notNull(),    // 5% in kobo
  sellerPayout: integer("seller_payout").notNull(), // 95% in kobo
  paystackRef:  text("paystack_ref"),
  status:       text("status").default("pending").notNull(),
  sellerRating: integer("seller_rating"),           // 1–5, set by buyer on completion
  paidAt:       timestamp("paid_at"),
  confirmedAt:  timestamp("confirmed_at"),
   waybillDetails: text("waybill_details"),
  shippedAt:      timestamp("shipped_at"),         // buyer tapped Item Received
  releasedAt:   timestamp("released_at"),           // admin paid seller manually
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("market_txn_listingId_idx").on(t.listingId),
  index("market_txn_buyerId_idx").on(t.buyerId),
  index("market_txn_sellerId_idx").on(t.sellerId),
  index("market_txn_status_idx").on(t.status),
]);

// ─── MARKETPLACE REPORT ───────────────────────────────────────────────────────

export const marketplaceReport = pgTable("marketplace_report", {
  id:            text("id").primaryKey(),
  listingId:     text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id").references(() => marketplaceTransaction.id, { onDelete: "set null" }),
  reporterId:    text("reporter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  reason:        text("reason").notNull(),
  status:        text("status").default("open").notNull(), // open | resolved
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("market_report_listingId_idx").on(t.listingId),
  index("market_report_reporterId_idx").on(t.reporterId),
]);

// ─── MARKETPLACE VENDOR KYC ───────────────────────────────────────────────────
// Separate KYC for sellers who want Verified Vendor status
// Tier 1 (basic): phone OTP + bank account — can list immediately, max 5 listings
// Tier 2 (vendor): submits this KYC — gets badge, max 20 listings, auto-approve after 5 good sales

export const marketplaceVendorKyc = pgTable("marketplace_vendor_kyc", {
  id:                  text("id").primaryKey(),
  userId:              text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fullName:            text("full_name").notNull(),
  phone:               text("phone").notNull(),
  idType:              text("id_type").notNull(), // NIN | voter | passport | drivers
  idNumber:            text("id_number").notNull(),
  idPhotoUrl:          text("id_photo_url").notNull(), // Cloudinary marketplace account
  selfieUrl:           text("selfie_url").notNull(),   // face photo
  whatYouSell:         text("what_you_sell").notNull(), // brief description
  status:              text("status").default("pending").notNull(), // pending | approved | declined
  adminNote:           text("admin_note"),
  reviewedAt:          timestamp("reviewed_at"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("vendor_kyc_userId_idx").on(t.userId),
  index("vendor_kyc_status_idx").on(t.status),
]);

// ─── MARKETPLACE AVAILABILITY REQUESTS ───────────────────────────────────────
// Created when buyer taps "Buy via Escrow" — confirms item still exists
// before any payment is taken. Protects against stale listings and Paystack
// refund fees. Either seller self-confirms or admin confirms after 20 minutes.

export const marketplaceAvailabilityRequest = pgTable("marketplace_availability_request", {
  id:                 text("id").primaryKey(),
  listingId:          text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:            text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:           text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  offerId:            text("offer_id"),                         // set if buying at negotiated price
  agreedPrice:        integer("agreed_price").notNull(),        // kobo — listed or negotiated price
  // pending   → waiting for seller or admin to confirm
  // confirmed → seller or admin confirmed, buyer can pay for 1 hour
  // denied    → seller or admin said item is gone
  // expired   → nobody confirmed within 30 minutes
  status:             text("status").default("pending").notNull(),
  confirmedBy:        text("confirmed_by"),                     // userId who confirmed
  confirmationMethod: text("confirmation_method"),              // seller_self | admin_proxy
  adminNote:          text("admin_note"),                       // optional admin note on confirm/deny
  // Buyer checkout window: 1 hour from confirmation
  checkoutExpiresAt:  timestamp("checkout_expires_at"),
  // Request expires after 45 minutes if nobody responds
  expiresAt:          timestamp("expires_at").notNull(),
  confirmedAt:        timestamp("confirmed_at"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("avail_request_listingId_idx").on(t.listingId),
  index("avail_request_buyerId_idx").on(t.buyerId),
  index("avail_request_status_idx").on(t.status),
]);

// ─── MARKETPLACE OFFERS ───────────────────────────────────────────────────────
// Structured negotiation — no direct contact between buyer and seller
// Max 2 counter-offers. Accepted offer goes straight to Paystack escrow.

export const marketplaceOffer = pgTable("marketplace_offer", {
  id:              text("id").primaryKey(),
  listingId:       text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:         text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:        text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listedPrice:     integer("listed_price").notNull(),    // original listing price in kobo
  latestAmount:    integer("latest_amount").notNull(),   // current offer amount in kobo
  counterCount:    integer("counter_count").default(0).notNull(), // max 2
  // status: pending (waiting for seller) | countered (seller countered, waiting buyer)
  //         accepted | declined | expired | paid (offer went to escrow)
  status:          text("status").default("pending").notNull(),
  // Full negotiation history stored as JSON array
  history:         text("history").notNull().default("[]"), // [{amount, fromRole, createdAt}]
  expiresAt:       timestamp("expires_at").notNull(), // 2 hours from last action
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("offer_listingId_idx").on(t.listingId),
  index("offer_buyerId_idx").on(t.buyerId),
  index("offer_sellerId_idx").on(t.sellerId),
  index("offer_status_idx").on(t.status),
]);

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions:                   many(session),
  accounts:                   many(account),
  listings:                   many(listing),
  bookingsAsAgent:            many(booking, { relationName: "agentBookings" }),
  bookingsAsRenter:           many(booking, { relationName: "renterBookings" }),
  watchlist:                  many(watchlist),
  propertyRequests:           many(propertyRequest),
  inspectionPaymentsAsRenter: many(inspectionPayment, { relationName: "renterPayments" }),
  inspectionPaymentsAsAgent:  many(inspectionPayment, { relationName: "agentPayments" }),
  referralsAsReferring:       many(referral, { relationName: "referringAgent" }),
  referralsAsReceiving:       many(referral, { relationName: "receivingAgent" }),
  payoutSplits:               many(payoutSplit),
  notifications:              many(notification),
  pushSubscriptions:          many(pushSubscription),
  agentKycRequests:           many(agentKycRequest),
  reviewsGiven:               many(review, { relationName: "reviewsGiven" }),
  reviewsReceived:            many(review, { relationName: "reviewsReceived" }),
  rentRecords:                many(rentRecord),
  bookingRequestsAsClient:    many(bookingRequest),
  bookingRequestsAsAgent:     many(bookingRequest),
  marketplaceListings:        many(marketplaceListing),
  marketplacePurchases:       many(marketplaceTransaction, { relationName: "buyerTransactions" }),
  marketplaceSales:           many(marketplaceTransaction, { relationName: "sellerTransactions" }),
  vendorKyc:                  many(marketplaceVendorKyc),
  marketplaceOffers:             many(marketplaceOffer),
  ratingsReceived: many(marketplaceRating, { relationName: "sellerRatings" }),
ratingsGiven:    many(marketplaceRating, { relationName: "buyerRatings"  }),
availabilityRequests:          many(marketplaceAvailabilityRequest),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const listingRelations = relations(listing, ({ one, many }) => ({
  agent:            one(user, { fields: [listing.agentId], references: [user.id] }),
  bookings:         many(booking),
  watchlistEntries: many(watchlist),
  bookingRequests:  many(bookingRequest),
}));

export const inspectionPaymentRelations = relations(inspectionPayment, ({ one, many }) => ({
  renter:       one(user, { fields: [inspectionPayment.renterId], references: [user.id], relationName: "renterPayments" }),
  agent:        one(user, { fields: [inspectionPayment.agentId],  references: [user.id], relationName: "agentPayments"  }),
  bookings:     many(booking),
  referral:     one(referral, { fields: [inspectionPayment.id], references: [referral.inspectionPaymentId] }),
  payoutSplits: many(payoutSplit),
}));

export const referralRelations = relations(referral, ({ one }) => ({
  inspectionPayment: one(inspectionPayment, { fields: [referral.inspectionPaymentId], references: [inspectionPayment.id] }),
  referringAgent:    one(user, { fields: [referral.referringAgentId], references: [user.id], relationName: "referringAgent" }),
  receivingAgent:    one(user, { fields: [referral.receivingAgentId], references: [user.id], relationName: "receivingAgent" }),
}));

export const payoutSplitRelations = relations(payoutSplit, ({ one }) => ({
  inspectionPayment: one(inspectionPayment, { fields: [payoutSplit.inspectionPaymentId], references: [inspectionPayment.id] }),
  recipient:         one(user, { fields: [payoutSplit.recipientId], references: [user.id] }),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  listing:            one(listing, { fields: [booking.listingId], references: [listing.id] }),
  renter:             one(user, { fields: [booking.renterId], references: [user.id], relationName: "renterBookings" }),
  agent:              one(user, { fields: [booking.agentId],  references: [user.id], relationName: "agentBookings"  }),
  inspectionPayment:  one(inspectionPayment, { fields: [booking.inspectionPaymentId], references: [inspectionPayment.id] }),
  visitVerifications: many(visitVerification),
}));

export const bookingRequestRelations = relations(bookingRequest, ({ one }) => ({
  client:  one(user,    { fields: [bookingRequest.clientId],  references: [user.id]    }),
  listing: one(listing, { fields: [bookingRequest.listingId], references: [listing.id] }),
  agent:   one(user,    { fields: [bookingRequest.agentId],   references: [user.id]    }),
}));

export const visitVerificationRelations = relations(visitVerification, ({ one }) => ({
  booking: one(booking, { fields: [visitVerification.bookingId], references: [booking.id] }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  renter:  one(user,    { fields: [watchlist.renterId],  references: [user.id]    }),
  listing: one(listing, { fields: [watchlist.listingId], references: [listing.id] }),
}));

export const propertyRequestRelations = relations(propertyRequest, ({ one, many }) => ({
  renter:  one(user, { fields: [propertyRequest.renterId], references: [user.id] }),
  matches: many(requestMatch),
}));

export const requestMatchRelations = relations(requestMatch, ({ one }) => ({
  request: one(propertyRequest, { fields: [requestMatch.requestId], references: [propertyRequest.id] }),
  listing: one(listing,         { fields: [requestMatch.listingId], references: [listing.id]         }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const pushSubscriptionRelations = relations(pushSubscription, ({ one }) => ({
  user: one(user, { fields: [pushSubscription.userId], references: [user.id] }),
}));

export const agentKycRequestRelations = relations(agentKycRequest, ({ one }) => ({
  agent: one(user, { fields: [agentKycRequest.agentId], references: [user.id] }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  booking:  one(booking, { fields: [review.bookingId],  references: [booking.id]  }),
  reviewer: one(user,    { fields: [review.reviewerId], references: [user.id], relationName: "reviewsGiven"    }),
  agent:    one(user,    { fields: [review.agentId],    references: [user.id], relationName: "reviewsReceived" }),
}));

export const rentRecordRelations = relations(rentRecord, ({ one }) => ({
  booking: one(booking, { fields: [rentRecord.bookingId], references: [booking.id] }),
  renter:  one(user,    { fields: [rentRecord.renterId],  references: [user.id]    }),
  agent:   one(user,    { fields: [rentRecord.agentId],   references: [user.id]    }),
  listing: one(listing, { fields: [rentRecord.listingId], references: [listing.id] }),
}));

export const marketplaceListingRelations = relations(marketplaceListing, ({ one, many }) => ({
  seller:       one(user, { fields: [marketplaceListing.sellerId], references: [user.id] }),
  transactions: many(marketplaceTransaction),
  reports:      many(marketplaceReport),
}));

// ── marketplaceRating relations ───────────────────────────────────────────────
export const marketplaceRatingRelations = relations(marketplaceRating, ({ one }) => ({
  transaction: one(marketplaceTransaction, {
    fields:     [marketplaceRating.transactionId],
    references: [marketplaceTransaction.id],
  }),
  listing: one(marketplaceListing, {
    fields:     [marketplaceRating.listingId],
    references: [marketplaceListing.id],
  }),
  seller: one(user, {
    fields:     [marketplaceRating.sellerId],
    references: [user.id],
  }),
  buyer: one(user, {
    fields:     [marketplaceRating.buyerId],
    references: [user.id],
  }),
}));

export const marketplaceReportRelations = relations(marketplaceReport, ({ one }) => ({
  listing:     one(marketplaceListing,     { fields: [marketplaceReport.listingId],     references: [marketplaceListing.id]     }),
  transaction: one(marketplaceTransaction, { fields: [marketplaceReport.transactionId], references: [marketplaceTransaction.id] }),
  reporter:    one(user,                   { fields: [marketplaceReport.reporterId],     references: [user.id]                   }),
}));

export const marketplaceVendorKycRelations = relations(marketplaceVendorKyc, ({ one }) => ({
  user: one(user, { fields: [marketplaceVendorKyc.userId], references: [user.id] }),
}));

export const marketplaceOfferRelations = relations(marketplaceOffer, ({ one }) => ({
  listing: one(marketplaceListing, { fields: [marketplaceOffer.listingId], references: [marketplaceListing.id] }),
  buyer:   one(user, { fields: [marketplaceOffer.buyerId],  references: [user.id] }),
  seller:  one(user, { fields: [marketplaceOffer.sellerId], references: [user.id] }),
}));

export const marketplaceAvailabilityRequestRelations = relations(marketplaceAvailabilityRequest, ({ one }) => ({
  listing: one(marketplaceListing, { fields: [marketplaceAvailabilityRequest.listingId], references: [marketplaceListing.id] }),
  buyer:   one(user, { fields: [marketplaceAvailabilityRequest.buyerId],  references: [user.id] }),
  seller:  one(user, { fields: [marketplaceAvailabilityRequest.sellerId], references: [user.id] }),
}));