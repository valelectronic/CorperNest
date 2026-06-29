import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type OTPType =
  | "email-verification"
  | "sign-in"
  | "forget-password"
  | "change-email"
  | "viewing-verification";

interface SendOTPParams {
  to: string;        // email — always required, used for email path AND as the automatic fallback
  phone?: string;     // optional — used for the SMS attempt, when available
  code: string;
  type: OTPType;
}

interface SendOTPResult {
  channel: "sms" | "email";
}

export async function sendOTP({ to, phone, code, type }: SendOTPParams): Promise<SendOTPResult> {
  console.log(`[OTP] sendOTP called — type=${type}, hasPhone=${!!phone}, OTP_PROVIDER=${process.env.OTP_PROVIDER}`);

  // ── "change-email" is the one exception — always email, no fallback logic ──
  // The whole point of this type is proving ownership of a NEW email address.
  // Sending it by SMS would prove nothing about that email, so it always
  // goes directly to `to` regardless of phone or OTP_PROVIDER.
  if (type === "change-email") {
    await sendViaEmail(to, code, type);
    return { channel: "email" };
  }

  const shouldAttemptSMS = process.env.OTP_PROVIDER === "sms" && !!phone;

  if (shouldAttemptSMS) {
    try {
      await sendViaSMS(phone!, code, type);
      return { channel: "sms" };
    } catch (err) {
      // SMS failed for any reason — wrong number, Termii downtime, low
      // balance, sender ID issue. Fall back to email automatically instead
      // of leaving the user stuck with no code at all.
      console.error(`[OTP] SMS failed for type=${type}, falling back to email:`, err);
    }
  }

  await sendViaEmail(to, code, type);
  return { channel: "email" };
}

async function sendViaEmail(to: string, code: string, type: OTPType) {
  const subjects: Record<OTPType, string> = {
    "email-verification": "Verify your CorperNest account",
    "sign-in": "Your CorperNest login code",
    "forget-password": "Reset your CorperNest password",
    "change-email": "Confirm your new email address",
    "viewing-verification": "Your viewing session OTP",
  };

  const messages: Record<OTPType, string> = {
    "email-verification": "Use this code to verify your CorperNest account.",
    "sign-in": "Use this code to log in to your CorperNest account.",
    "forget-password": "Use this code to reset your CorperNest password.",
    "change-email": "Use this code to confirm your new email address.",
    "viewing-verification": "Share this code with your agent to verify your viewing session.",
  };
console.log(`[EMAIL] Sending ${type} OTP to ${to} from noreply@contact.corpernest.com.ng`);
  await resend.emails.send({
    from: "CorperNest <noreply@contact.corpernest.com.ng>",
    to,
    subject: subjects[type],
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #16a34a;">CorperNest</h2>
        <p style="font-size: 16px; color: #374151;">${messages[type]}</p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">
            ${code}
          </span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="font-size: 14px; color: #6b7280;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}


// Termii expects international format (234XXXXXXXXXX, no leading +, no
// leading 0) — but every phone number in our system is stored in local
// Nigerian format (0XXXXXXXXXX), since that's what signup validates
// against. Converting here, right before the actual API call, means
// nothing else in the codebase needs to change or worry about this.
function toTermiiFormat(localPhone: string): string {
  const digitsOnly = localPhone.replace(/\D/g, "");
  if (digitsOnly.startsWith("0")) {
    return "234" + digitsOnly.slice(1);
  }
  return digitsOnly; // already looks international — leave as is
}

async function sendViaSMS(to: string, code: string, type: OTPType): Promise<void> {
  const formattedNumber = toTermiiFormat(to);
  console.log(`[SMS] Attempting Termii send — type=${type}, to=${formattedNumber}`);

  // ── Most types share the exact Termii-approved sample wording. ───────────
  // viewing-verification is the one exception — it's genuinely valid for
  // 2 hours (travel time to the property), not minutes, so using the same
  // "Expires in 10 minutes" text would tell renters something false. Same
  // business name and one-time-use framing kept, just an honest number.
  const messages: Record<OTPType, string> = {
    "email-verification":  `Your CorperNest verification code is ${code}. Expires in 10 minutes, one-time use only.`,
    "sign-in":              `Your CorperNest verification code is ${code}. Expires in 10 minutes, one-time use only.`,
    "forget-password":      `Your CorperNest verification code is ${code}. Expires in 10 minutes, one-time use only.`,
    "change-email":         `Your CorperNest verification code is ${code}. Expires in 10 minutes, one-time use only.`,
    "viewing-verification": `Your CorperNest viewing verification code is ${code}. Valid for 2 hours during your scheduled visit, one-time use only.`,
  };

  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: formattedNumber,
      from: process.env.TERMII_SENDER_ID,
      sms: messages[type],
      type: "plain",
      channel: "dnd",
      api_key: process.env.TERMII_API_KEY,
    }),
  });

  if (!res.ok) {
    throw new Error(`Termii request failed with HTTP ${res.status}`);
  }

  const data = await res.json();

  // Termii returns { "code": "ok", "message_id": "...", "message": "Successfully Sent", ... }
  // on success. Anything else means the send did not actually succeed, even
  // though the HTTP request itself returned 200.
  if (data.code !== "ok") {
    throw new Error(`Termii reported failure: ${JSON.stringify(data)}`);
  }

  console.log(`[SMS] Termii confirmed send — type=${type}, message_id=${data.message_id ?? "unknown"}`);
}