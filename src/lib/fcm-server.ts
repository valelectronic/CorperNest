// src/lib/fcm-server.ts
// Server-side FCM push sender using Firebase Admin SDK.
// Looks up user's FCM token from Neon, sends real device push.
// Fails silently — never crashes the calling route.

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const rawKey = process.env.FIREBASE_PRIVATE_KEY!;
  const privateKey = rawKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

export async function sendPushToUser({
  userId, title, body, link,
}: {
  userId: string;
  title:  string;
  body:   string;
  link?:  string;
}): Promise<void> {
  try {
    const [row] = await db
      .select({ fcmToken: user.fcmToken })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row?.fcmToken) return; // user has no token — in-app only

    const app       = getAdminApp();
    const messaging = getMessaging(app);

    await messaging.send({
      token: row.fcmToken,
      notification: { title, body },
      data: { link: link ?? "/" },
      webpush: {
        notification: {
          title, body,
          icon: "/icon-192.png",
          data: { link: link ?? "/" },
        },
        fcmOptions: { link: link ?? "/" },
      },
    });

    } catch (err) {
      console.error("[FCM-SERVER] Push failed for user", userId, err);
  }
}