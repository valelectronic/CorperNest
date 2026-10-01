import { relations } from "drizzle-orm";
import {
  pgTable, text, timestamp, boolean,
  index, integer, uniqueIndex, json
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
  state:                text("state"),
  callUpNumber:         text("call_up_number"),
  verificationLevel:    text("verification_level").default("basic"),
  ninVerified:          boolean("nin_verified").default(false),
  // Marketplace seller — bank verified via Paystack resolve-account
  marketAccountNumber:  text("market_account_number"),
  marketBankCode:       text("market_bank_code"),
  marketAccountName:    text("market_account_name"),
  marketSellerVerified: boolean("market_seller_verified").default(false),
  // Marketplace vendor tier: "basic" (default) | "vendor" (KYC approved)
  marketVendorTier:     text("market_vendor_tier").default("basic"),
  fcmToken:             text("fcm_token"),
  governmentIdUrl:      text("government_id_url"),
  governmentIdType:     text("government_id_type"),
  marketRecipientCode:  text("market_recipient_code"),
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

export const marketplaceListing = pgTable("marketplace_listing", {
  id:                  text("id").primaryKey(),
  sellerId:            text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingType:         text("listing_type").default("single").notNull(),
  title:               text("title").notNull(),
  category:            text("category").notNull(),
  condition:           text("condition").notNull(),
  description:         text("description").notNull(),
  bundleItems:         text("bundle_items").array().default([]),
  price:               integer("price").notNull(),
  state:               text("state").notNull(),
  lga:                 text("lga").notNull(),
  landmark:            text("landmark").notNull(),
  images:              text("images").array().default([]),
  hasReceipt:          boolean("has_receipt").default(false),
  bulkMinQty:          integer("bulk_min_qty"),
  bulkPrice:           integer("bulk_price"),
  delivery:            text("delivery").default("pickup").notNull(),
  sellerPriceNote:     text("seller_price_note"),
  refPriceMin:         integer("ref_price_min"),
  refPriceMax:         integer("ref_price_max"),
  refPriceSource:      text("ref_price_source"),
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

// ─── MARKETPLACE RATING ───────────────────────────────────────────────────────

export const marketplaceRating = pgTable("marketplace_rating", {
  id:            text("id").primaryKey(),
  transactionId: text("transaction_id").notNull().references(() => marketplaceTransaction.id, { onDelete: "cascade" }),
  listingId:     text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  sellerId:      text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  buyerId:       text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  stars:         integer("stars").notNull(),
  comment:       text("comment"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("rating_transaction_unique").on(t.transactionId),
  index("rating_seller_idx").on(t.sellerId),
]);

// ─── MARKETPLACE TRANSACTION ──────────────────────────────────────────────────

export const marketplaceTransaction = pgTable("marketplace_transaction", {
  id:             text("id").primaryKey(),
  listingId:      text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:        text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:       text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount:         integer("amount").notNull(),
  commission:     integer("commission").notNull(),
  sellerPayout:   integer("seller_payout").notNull(),
  paystackRef:    text("paystack_ref"),
  status:         text("status").default("pending").notNull(),
  paidAt:         timestamp("paid_at"),
  confirmedAt:    timestamp("confirmed_at"),
  waybillDetails: text("waybill_details"),
  shippedAt:      timestamp("shipped_at"),
  releasedAt:     timestamp("released_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
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
  status:        text("status").default("open").notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("market_report_listingId_idx").on(t.listingId),
  index("market_report_reporterId_idx").on(t.reporterId),
]);

// ─── MARKETPLACE AVAILABILITY REQUESTS ───────────────────────────────────────

export const marketplaceAvailabilityRequest = pgTable("marketplace_availability_request", {
  id:                 text("id").primaryKey(),
  listingId:          text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:            text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:           text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  offerId:            text("offer_id"),
  agreedPrice:        integer("agreed_price").notNull(),
  status:             text("status").default("pending").notNull(),
  confirmedBy:        text("confirmed_by"),
  confirmationMethod: text("confirmation_method"),
  adminNote:          text("admin_note"),
  checkoutExpiresAt:  timestamp("checkout_expires_at"),
  expiresAt:          timestamp("expires_at").notNull(),
  confirmedAt:        timestamp("confirmed_at"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("avail_request_listingId_idx").on(t.listingId),
  index("avail_request_buyerId_idx").on(t.buyerId),
  index("avail_request_status_idx").on(t.status),
]);

// ─── MARKETPLACE OFFERS ───────────────────────────────────────────────────────

export const marketplaceOffer = pgTable("marketplace_offer", {
  id:           text("id").primaryKey(),
  listingId:    text("listing_id").notNull().references(() => marketplaceListing.id, { onDelete: "cascade" }),
  buyerId:      text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sellerId:     text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listedPrice:  integer("listed_price").notNull(),
  latestAmount: integer("latest_amount").notNull(),
  counterCount: integer("counter_count").default(0).notNull(),
  status:       text("status").default("pending").notNull(),
  history:      text("history").notNull().default("[]"),
  expiresAt:    timestamp("expires_at").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("offer_listingId_idx").on(t.listingId),
  index("offer_buyerId_idx").on(t.buyerId),
  index("offer_sellerId_idx").on(t.sellerId),
  index("offer_status_idx").on(t.status),
]);

// ─── PARK-OUT AMBASSADOR ──────────────────────────────────────────────────────
// Location Ambassadors manually assigned by admin to listings
// The ONLY role that sees exact property address
// Earns 25% of facilitation fee + 50% of booking fee per completed deal
// Admin can assign any user or staff member as ambassador
// Status: pending → active | suspended

export const parkoutAmbassador = pgTable("parkout_ambassador", {
  id:            text("id").primaryKey(),              // nanoid() at insert
  userId:        text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  state:         text("state").notNull(),              // territory state
  lga:           text("lga").notNull(),                // territory LGA
  zone:          text("zone"),                         // optional sub-zone
  isActive:      boolean("is_active").default(true).notNull(),
  // Bank details for Paystack Transfer referral commission payouts
  bankCode:      text("bank_code"),
  accountNumber: text("account_number"),
  accountName:   text("account_name"),
  recipientCode: text("recipient_code"),               // Paystack recipient code
  // Lifetime stats
  totalEarned:   integer("total_earned").default(0).notNull(),  // kobo
  totalDeals:    integer("total_deals").default(0).notNull(),
  status:        text("status").default("pending").notNull(),   // pending | active | suspended
  approvedAt:    timestamp("approved_at"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("parkout_ambassador_userId_idx").on(t.userId),
  index("parkout_ambassador_lga_idx").on(t.lga),
  index("parkout_ambassador_status_idx").on(t.status),
]);

// ─── PARK-OUT LISTING ─────────────────────────────────────────────────────────
// Room listed by outgoing tenant before vacating
//
// Paystack compliance framing:
// — ₦3,000 = "Platform Booking Fee" (service revenue to CorperNest)
// — Agency fee = "Property Facilitation Fee" (collected by CorperNest,
//   referral commissions paid via Paystack Transfer)
// — Never use "escrow", "held", or "released" in user-facing text
//
// Public info: room type, rent, neighbourhood, photos, rules
// Private info: exact address, landlord details — ambassador only
// Private revealed to incoming tenant ONLY after facilitation fee paid
//
// Status flow:
// draft → pending_approval → pending_verification → active →
// booking_locked → facilitation_paid → completed | rejected | expired

// ─── PARK-OUT AMBASSADOR APPLICATION ─────────────────────────────────────────
// Tracks paid ambassador applications before admin approval.
// Flow: pending_payment → pending_review → approved | rejected
// ₦2,000 non-refundable vetting fee paid via Paystack before form unlocks.
// On approval: admin creates parkoutAmbassador record and assigns territory.

export const parkoutAmbassadorApplication = pgTable("parkout_ambassador_application", {
  id:              text("id").primaryKey(),
  userId:          text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  // ── Vetting fee payment (₦2,000) ─────────────────────────────────────────
  // Fee must be paid before application form is shown
  vetFeeRef:       text("vet_fee_ref"),                        // Paystack reference
  vetFeePaidAt:    timestamp("vet_fee_paid_at"),               // when fee was confirmed

  // ── Application form fields (unlocked after fee paid) ─────────────────────
  fullName:        text("full_name"),
  phone:           text("phone"),
  whatsappNumber:  text("whatsapp_number"),
  territoryState:  text("territory_state"),                    // e.g. "Akwa Ibom"
  territoryLga:    text("territory_lga"),                      // e.g. "Eket"
    // Identity verification — accepts any Nigerian adult
  // idType: "nysc" | "nin" | "student" | "voters_card" | "drivers_license"
  idType:          text("id_type"),
  idNumber:        text("id_number"),
  idDocumentUrl:   text("id_document_url"), // photo upload to Cloudinary                   // NYSC or student ID

  // Bank details for Paystack Transfer payouts when active
  bankCode:        text("bank_code"),
  accountNumber:   text("account_number"),
  accountName:     text("account_name"),                       // verified via Paystack

  // Admin review
  adminNote:       text("admin_note"),
  rejectionReason: text("rejection_reason"),
  reviewedAt:      timestamp("reviewed_at"),
  reviewedBy:      text("reviewed_by"),

  // Status flow:
  // pending_payment → pending_review → approved | rejected
  status:          text("status").default("pending_payment").notNull(),

  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("parkout_amb_app_userId_idx").on(t.userId),
  index("parkout_amb_app_status_idx").on(t.status),
  index("parkout_amb_app_lga_idx").on(t.territoryLga),
]);

export const parkoutListing = pgTable("parkout_listing", {
  id:             text("id").primaryKey(),             // nanoid() at insert
  outgoingUserId: text("outgoing_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  ambassadorId:   text("ambassador_id").references(() => parkoutAmbassador.id, { onDelete: "set null" }),

  // ── PUBLIC INFO (visible to everyone on /parkout/explore) ─────────────────
  title:          text("title").notNull(),
  roomType:       text("room_type").notNull(),          // self-con | mini-flat | room | 1-bed | 2-bed
  state:          text("state").notNull(),
  lga:            text("lga").notNull(),
  neighbourhood:  text("neighbourhood").notNull(),      // "near Mobil Housing" — NO street name
  annualRent:     integer("annual_rent").notNull(),     // kobo
  // facilitation_fee = 10% of annualRent — labeled "Property Facilitation Fee"
  facilitationFee: integer("facilitation_fee").notNull(), // kobo
  cautionDeposit:  integer("caution_deposit"),           // kobo — optional, shown publicly
  advanceRent:     text("advance_rent"),                 // "1 year" | "6 months"
  moveOutDate:     timestamp("move_out_date").notNull(),
  description:     text("description"),                  // max 200 chars
  landlordRules:   text("landlord_rules"),
     transportEstimates: json("transport_estimates").$type<Array<{
    name:     string;
    bikeCost: number;
    kekeCost: number;
  }>>(),              // compound rules, max 200 chars

    moveInFees: json("move_in_fees").$type<{
    cautionFee:   number;
    agreementFee: number;
    extraFees:    Array<{ name: string; amount: number }>;
  }>(),
  
  hasFurnitureForSale: boolean("has_furniture_for_sale").default(false).notNull(),
  itemsAvailable:      text("items_available"),  // free text from listing form
  images:          text("images").array().default([]).notNull(), // 3-5 Cloudinary URLs

  // ── PROOF OF OCCUPANCY (required — admin verifies before approval) ─────────
  // Accept: rent receipt, NEPA bill, water bill, any utility showing address
  occupancyProofUrl: text("occupancy_proof_url").notNull(),

  // ── LANDLORD CONTEXT (non-blocking — admin sees these flags) ──────────────
  // Whether the outgoing tenant is dealing with a landlord's agent.
  // Any agent/facilitation payment is settled outside CorperNest.
  hasLandlordAgent: boolean("has_landlord_agent").default(false).notNull(),
  // landlordAware: non-blocking — admin sees if landlord knows they're leaving
  landlordAware:    boolean("landlord_aware").default(false).notNull(),
  // Landlord confirmed they permit tenant-led handover (required checkbox)
  landlordConsentConfirmed: boolean("landlord_consent_confirmed").default(false).notNull(),

  // ── PRIVATE INFO (ambassador only — NEVER in public API responses) ─────────
  exactAddress:  text("exact_address").notNull(),
  landlordName:  text("landlord_name"),
  landlordPhone: text("landlord_phone"),

    verifiedByAmbassador: boolean("verified_by_ambassador").default(false).notNull(),
  verifiedAt:           timestamp("verified_at"),

  // ── STATUS ────────────────────────────────────────────────────────────────
  status:      text("status").default("draft").notNull(),
  // draft               → saved, not submitted
  // pending_approval    → submitted, admin reviewing proof + photos
  // pending_verification → admin assigned ambassador, ambassador calling outgoing tenant
  // active              → ambassador verified, live on /parkout/explore
  // booking_locked      → incoming tenant paid ₦3,000 booking fee (atomic lock)
  // completed           → admin confirmed key handover
  // rejected            → admin rejected listing
  // expired             → moveOutDate passed with no completion

  approvedAt:  timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("parkout_listing_outgoingUser_idx").on(t.outgoingUserId),
  index("parkout_listing_ambassador_idx").on(t.ambassadorId),
  index("parkout_listing_status_idx").on(t.status),
  index("parkout_listing_lga_idx").on(t.lga),
  index("parkout_listing_moveOut_idx").on(t.moveOutDate),
]);

// ─── PARK-OUT INSPECTION ──────────────────────────────────────────────────────
// Created when incoming tenant pays ₦3,000 Platform Booking Fee
// Atomic DB lock prevents two people booking the same slot
// Lock expires automatically after 48 hours if the next step is not completed
// Queue system: slotNumber 1 = first to pay, 2 = second, etc.
//
// Paystack compliance: ₦3,000 labeled "Platform Booking Fee" — service revenue to CorperNest
//
// Status: pending → confirmed → completed | refunded | expired

export const parkoutInspection = pgTable("parkout_inspection", {
  id:             text("id").primaryKey(),             // nanoid() at insert
  listingId:      text("listing_id").notNull().references(() => parkoutListing.id, { onDelete: "cascade" }),
  incomingUserId: text("incoming_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  slotNumber:     integer("slot_number").default(1).notNull(), // queue position
  // Platform Booking Fee — ₦3,000 in kobo
  bookingFee:     integer("booking_fee").default(300000).notNull(),
  paystackRef:    text("paystack_ref"),
  paidAt:         timestamp("paid_at"),

  // 48-hour expiry — if the inspection window expires, listing can revert to active
  // Checked lazily at read time (no cron needed — same pattern as marketplace)
  lockExpiresAt:  timestamp("lock_expires_at"),

  // Inspection outcome — recorded after physical inspection
  // No in-app date setting — ambassador contacts tenant via WhatsApp/call
  outcome:        text("outcome"),      // liked | not_suitable | changed_mind
  outcomeReason:  text("outcome_reason"),
  outcomeAt:      timestamp("outcome_at"),

  // Refund policy:
  // "liked": no refund
  // "not_suitable": full ₦3,000 refund to incoming tenant
  // "changed_mind": ₦1,500 refund to incoming tenant
  refundAmount:   integer("refund_amount"),            // kobo
  refundedAt:     timestamp("refunded_at"),

  status:    text("status").default("pending").notNull(),
  // pending   → booking fee paid, listing locked
  // confirmed → inspection happened, outcome recorded
  // refunded  → refund processed
  // expired   → 48hr window passed, listing reverted to active

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("parkout_inspection_listingId_idx").on(t.listingId),
  index("parkout_inspection_incomingUser_idx").on(t.incomingUserId),
  index("parkout_inspection_status_idx").on(t.status),
  index("parkout_inspection_lockExpires_idx").on(t.lockExpiresAt),
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
  notifications:              many(notification),
  agentKycRequests:           many(agentKycRequest),
  reviewsGiven:               many(review, { relationName: "reviewsGiven" }),
  reviewsReceived:            many(review, { relationName: "reviewsReceived" }),
  rentRecords:                many(rentRecord),
  bookingRequestsAsClient:    many(bookingRequest),
  bookingRequestsAsAgent:     many(bookingRequest),
  marketplaceListings:        many(marketplaceListing),
  marketplacePurchases:       many(marketplaceTransaction, { relationName: "buyerTransactions" }),
  marketplaceSales:           many(marketplaceTransaction, { relationName: "sellerTransactions" }),
  marketplaceOffers:          many(marketplaceOffer),
  ratingsReceived:            many(marketplaceRating, { relationName: "sellerRatings" }),
  ratingsGiven:               many(marketplaceRating, { relationName: "buyerRatings" }),
  availabilityRequests:       many(marketplaceAvailabilityRequest),
  // Park-Out & Earn
  parkoutListings:                  many(parkoutListing),
  parkoutInspections:               many(parkoutInspection),

   parkoutAmbassador:                many(parkoutAmbassador),
  parkoutAmbassadorApplications:    many(parkoutAmbassadorApplication),
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
  renter:   one(user, { fields: [inspectionPayment.renterId], references: [user.id], relationName: "renterPayments" }),
  agent:    one(user, { fields: [inspectionPayment.agentId],  references: [user.id], relationName: "agentPayments"  }),
  bookings: many(booking),
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

export const marketplaceRatingRelations = relations(marketplaceRating, ({ one }) => ({
  transaction: one(marketplaceTransaction, { fields: [marketplaceRating.transactionId], references: [marketplaceTransaction.id] }),
  listing:     one(marketplaceListing,     { fields: [marketplaceRating.listingId],     references: [marketplaceListing.id]     }),
  seller:      one(user, { fields: [marketplaceRating.sellerId], references: [user.id], relationName: "sellerRatings" }),
  buyer:       one(user, { fields: [marketplaceRating.buyerId],  references: [user.id], relationName: "buyerRatings"  }),
}));

export const marketplaceReportRelations = relations(marketplaceReport, ({ one }) => ({
  listing:     one(marketplaceListing,     { fields: [marketplaceReport.listingId],     references: [marketplaceListing.id]     }),
  transaction: one(marketplaceTransaction, { fields: [marketplaceReport.transactionId], references: [marketplaceTransaction.id] }),
  reporter:    one(user,                   { fields: [marketplaceReport.reporterId],     references: [user.id]                   }),
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

// ─── PARK-OUT RELATIONS ───────────────────────────────────────────────────────

export const parkoutAmbassadorRelations = relations(parkoutAmbassador, ({ one, many }) => ({
  user:        one(user, { fields: [parkoutAmbassador.userId], references: [user.id] }),
  listings:    many(parkoutListing),
  inspections: many(parkoutInspection),
  
}));

export const parkoutListingRelations = relations(parkoutListing, ({ one, many }) => ({
  outgoingUser: one(user, { fields: [parkoutListing.outgoingUserId], references: [user.id] }),
  ambassador:   one(parkoutAmbassador, { fields: [parkoutListing.ambassadorId], references: [parkoutAmbassador.id] }),
  inspections:  many(parkoutInspection),
  
}));

export const parkoutInspectionRelations = relations(parkoutInspection, ({ one }) => ({
  listing:      one(parkoutListing, { fields: [parkoutInspection.listingId], references: [parkoutListing.id] }),
  incomingUser: one(user, { fields: [parkoutInspection.incomingUserId], references: [user.id] }),
}));


export const parkoutAmbassadorApplicationRelations = relations(parkoutAmbassadorApplication, ({ one }) => ({
  user: one(user, { fields: [parkoutAmbassadorApplication.userId], references: [user.id] }),
}));