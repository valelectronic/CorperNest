import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CorperNest <contact@contact.corpernest.com.ng>";

export async function sendUserEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[sendUserEmail] failed:", err);
  }
}