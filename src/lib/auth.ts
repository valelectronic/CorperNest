import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, phoneNumber } from "better-auth/plugins";
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

  // ── Enables password/PIN-based sign-in for email, and is also required
  // for auth.api.setPassword to work (the PIN-setup step after OTP signup).
  // minPasswordLength is lowered to 4 so the real PIN can be stored
  // directly. No maxPasswordLength override — the signup flow uses a much
  // longer throwaway password before the real PIN is set, so capping the
  // max length here would block account creation itself.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },

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

    // ── Phone plugin — used for RETURNING users signing in with
    // phone + PIN (authClient.signIn.phoneNumber). NOT used for the
    // signup verification step itself — that's handled by our own
    // custom route, since this plugin's sendOTP callback has no access
    // to the user's email and so can't do the SMS-to-email fallback.
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // Only used for phone-based "forgot PIN" resets going forward.
        // Deliberately SMS-only here, no fallback — if this fails, the
        // calling code (forgot-PIN route) catches the error itself.
        await sendOTP({ to: "", phone: phoneNumber, code, type: "forget-password" });
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
      // ── New, OTP-verified phone field managed alongside the phoneNumber
      // plugin. Kept separate from the older, unverified `phone` field above
      // so nothing that currently reads `phone` directly breaks.
      phoneNumber: {
        type: "string",
        required: false,
        returned: true,
      },
      phoneNumberVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        returned: true,
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