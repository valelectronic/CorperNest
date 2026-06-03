import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "https://www.corpernest.com.ng",
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;