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

export const metadata: Metadata = {
  title: {
    default:  "CorperNest — Verified Housing in Eket",
    template: "%s | CorperNest",
  },
  description:
    "Find verified, scam-free rentals in Eket, Akwa Ibom. Pay ₦5,000 to tour with a verified agent and move in with confidence.",
  metadataBase: new URL("https://www.corpernest.com.ng"),
  keywords: [
    "houses for rent in Eket",
    "NYSC accommodation Eket Akwa Ibom",
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
    canonical: "https://www.corpernest.com.ng",
  },
  openGraph: {
    type:        "website",
    url:         "https://www.corpernest.com.ng",
    siteName:    "CorperNest",
    title:       "CorperNest — Verified Housing in Eket",
    description: "Verified rentals in Eket, Akwa Ibom. Pay ₦5,000 to tour with a verified agent. No scams.",
    locale:      "en_NG",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "CorperNest — Verified Housing in Eket, Akwa Ibom",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CorperNest — Verified Housing in Eket",
    description: "Verified rentals in Eket, Akwa Ibom. Pay ₦5,000 to tour with a verified agent. No scams.",
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
  verification: {
    google: "googleb1ac539760025b3c.html",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#2E7D32",
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