import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "corpernestng@gmail.com";
const FROM = "CorperNest <contact@contact.corpernest.com.ng>";

export async function sendAdminEmail(subject: string, html: string) {
  try {
    await resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html });
  } catch (err) {
    console.error("[sendAdminEmail] failed:", err);
  }
}