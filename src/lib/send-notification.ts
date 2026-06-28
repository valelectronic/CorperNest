// src/lib/send-notification.ts
//
// Generic notification sender — for messages like "we found a match for
// your request," NOT verification codes. Mirrors the same SMS-first,
// email-fallback pattern as otp-sender.ts, but for freeform text instead
// of a fixed OTP format.
//
// Only attempts SMS if the recipient's phone is genuinely verified — same
// trust principle used everywhere else (sign-in, visit verification).

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendNotificationParams {
  toEmail: string;
  toPhone?: string | null;
  phoneVerified?: boolean | null;
  subject: string;     // used as the email subject line
  message: string;      // plain text — used as both the SMS body and email body
  link?: string;         // optional deep-link, added to the email if present
}

interface SendNotificationResult {
  channel: "sms" | "email";
}

export async function sendNotification({
  toEmail,
  toPhone,
  phoneVerified,
  subject,
  message,
  link,
}: SendNotificationParams): Promise<SendNotificationResult> {

  const shouldAttemptSMS =
    process.env.OTP_PROVIDER === "sms" && !!toPhone && !!phoneVerified;

  if (shouldAttemptSMS) {
    try {
      await sendViaSMS(toPhone!, message);
      return { channel: "sms" };
    } catch (err) {
      console.error("[Notification] SMS failed, falling back to email:", err);
    }
  }

  await sendViaEmail(toEmail, subject, message, link);
  return { channel: "email" };
}

async function sendViaEmail(to: string, subject: string, message: string, link?: string) {
  await resend.emails.send({
    from: "CorperNest <noreply@contact.corpernest.com.ng>",
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #16a34a;">CorperNest</h2>
        <p style="font-size: 16px; color: #374151;">${message}</p>
        ${link ? `<a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View now →</a>` : ""}
      </div>
    `,
  });
}

async function sendViaSMS(to: string, message: string): Promise<void> {
  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      from: process.env.TERMII_SENDER_ID,
      sms: message,
      type: "plain",
      channel: "dnd",
      api_key: process.env.TERMII_API_KEY,
    }),
  });

  if (!res.ok) {
    throw new Error(`Termii request failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== "ok") {
    throw new Error(`Termii reported failure: ${JSON.stringify(data)}`);
  }
}