import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { sendOTP, type OTPType } from "./otp-sender";


export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

   trustedOrigins: [
  "https://corpernest.com.ng",
  "https://www.corpernest.com.ng",
  "https://corper-nest.vercel.app",
  "https://corper-nest-l5iz8x6rs-valelectronics-projects.vercel.app",
  "http://localhost:3000",
],
  plugins: [
    emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    console.log("[Better Auth] sendVerificationOTP called for:", email, type);
    try {
      await sendOTP({
        to: email,
        code: otp,
        type: type as OTPType,
      });
      console.log("[Better Auth] sendOTP completed successfully");
    } catch (err) {
      console.error("[Better Auth] sendOTP failed:", err);
      throw err;
    }
  },
  sendVerificationOnSignUp: true,
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
      agentVerified: {
      type: "boolean",
      required: false,
      defaultValue: false,
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