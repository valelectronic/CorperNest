import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type OTPType =
  | "email-verification"
  | "sign-in"
  | "forget-password"
  | "change-email"
  | "viewing-verification";

interface SendOTPParams {
  to: string;
  code: string;
  type: OTPType;
}

export async function sendOTP({ to, code, type }: SendOTPParams) {
  if (process.env.OTP_PROVIDER === "sms") {
    await sendViaSMS(to, code);
  } else {
    await sendViaEmail(to, code, type);
  }
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

  await resend.emails.send({
    from: "CorperNest <onboarding@resend.dev>",
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
        <p style="font-size: 14px; color: #6b7280;">This code expires in 5 minutes. Do not share it with anyone.</p>
        <p style="font-size: 14px; color: #6b7280;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

async function sendViaSMS(to: string, code: string) {
  await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      from: process.env.TERMII_SENDER_ID,
      sms: `Your CorperNest OTP is ${code}. Valid for 5 minutes. Do not share.`,
      type: "plain",
      channel: "dnd",
      api_key: process.env.TERMII_API_KEY,
    }),
  });
}