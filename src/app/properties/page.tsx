import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PropertiesClient from "./properties-client";

export const metadata: Metadata = {
  title: "Verified Properties for Rent in Eket, Akwa Ibom",
  description:
    "Browse verified houses, self contained, mini flats and rooms for rent in Eket, Akwa Ibom. All listings reviewed before going live. Book an inspection for ₦5,000.",
  alternates: {
    canonical: "https://www.corpernest.com.ng/properties",
  },
  openGraph: {
    title:       "Verified Properties for Rent in Eket, Akwa Ibom | CorperNest",
    description: "Browse verified rental listings in Eket. Self contained, mini flats, 1-bed and 2-bed flats. No scams — all agents verified.",
    url:         "https://www.corpernest.com.ng/properties",
  },
};

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <PropertiesClient isLoggedIn={!!session} />;
}