import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

const BASE_URL = "https://www.corpernest.com.ng";

export const metadata: Metadata = {
  title: {
    default:  "CorperNest — Verified Housing in Akwa Ibom",
    template: "%s | CorperNest",
  },
  description:
    "Find verified, scam-free rental properties in Uyo and Akwa Ibom. Pay ₦5,000 to tour with a verified agent and move in with confidence. Built for NYSC corpers and young professionals.",
  metadataBase: new URL(BASE_URL),
  keywords: [
    "houses for rent in Uyo Eket",
    "NYSC accommodation Akwa Ibom",
    "verified properties Eket",
    "corper accommodation Eket",
    "rent apartment Eket Akwa Ibom",
    "no scam housing Nigeria",
    "verified housing marketplace Nigeria",
    "NYSC corper housing",
    "self contained Eket",
    "mini flat Eket",
    "CorperNest",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type:        "website",
    url:         BASE_URL,
    siteName:    "CorperNest",
    title:       "CorperNest — Verified Housing in Akwa Ibom",
    description: "Find verified, scam-free rental properties in Uyo and Akwa Ibom. Pay ₦5,000 to tour with a verified agent. Built for NYSC corpers.",
    locale:      "en_NG",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "CorperNest — Verified Housing in Akwa Ibom",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CorperNest — Verified Housing in Akwa Ibom",
    description: "Find verified, scam-free rental properties in Uyo. Pay ₦5,000 to tour with a verified agent.",
    images:      ["/og-image.png"],
  },
  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
  icons: {
    icon:  "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width:        "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              fontFamily:   "var(--font-dm-sans)",
              fontSize:     "14px",
              borderRadius: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}