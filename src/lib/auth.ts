import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { sendOTP, type OTPType } from "./otp-sender";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTP({
          to: email,
          code: otp,
          type: type as OTPType,
        });
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        // Expose role in session so layout checks work on every device
        returned: true,
      },
      verificationLevel: {
        type: "string",
        required: false,
        defaultValue: "basic",
        returned: true,
      },
      ninVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        returned: true,
      },
      state: {
        type: "string",
        required: false,
        returned: true,
      },
      callUpNumber: {
        type: "string",
        required: false,
        returned: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 21, // 21 days
    updateAge: 60 * 60 * 24,      // refresh session token every 24 hours
    // Disable server-side session caching so role changes
    // reflect immediately without waiting for cache expiry
    cookieCache: {
      enabled: false,
    },
  },
});