import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import OfflineOverlay from "@/components/offline-overlay";

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
    default:  "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
    template: "%s | CorperNest",
  },
  description:
    "CorperNest helps Nigerians relocating to new cities find verified scam-free housing and buy or sell items safely with buyer protection. Verified agents, secure payments, no fraud. Currently serving Eket, Akwa Ibom — expanding across Nigeria.",
  metadataBase: new URL("https://www.corpernest.com.ng"),
  keywords: [
    // Housing — broad
    "verified housing Nigeria",
    "no scam property Nigeria",
    "safe house rent Nigeria",
    "verified agent Nigeria",
    "house rent Nigeria relocating",
    "furnished apartment Nigeria",
    "agent verified rental Nigeria",
    // Housing — specific
    "houses for rent in Eket",
    "NYSC accommodation Eket Akwa Ibom",
    "verified properties Eket",
    "corper accommodation Eket",
    "rent apartment Eket Akwa Ibom",
    "self contained Eket",
    "mini flat Eket",
    "NYSC corper housing",
    // Marketplace — broad
    "safe marketplace Nigeria",
    "buy and sell Nigeria secure",
    "verified seller Nigeria",
    "secure payment marketplace Nigeria",
    "no scam buy sell Nigeria",
    "second hand items Nigeria",
    // Marketplace — specific
    "buy and sell Eket",
    "corper marketplace Nigeria",
    "NYSC buy sell items",
    "sell items Eket Akwa Ibom",
    // Brand
    "CorperNest",
    "CorperNest marketplace",
    "CorperNest housing",
  ],
  openGraph: {
    type:        "website",
    url:         "https://www.corpernest.com.ng",
    siteName:    "CorperNest",
    title:       "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
    description: "Find verified scam-free housing and buy or sell items safely with buyer protection. Verified agents, secure payments. Currently in Eket, Akwa Ibom — expanding across Nigeria.",
    locale:      "en_NG",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
    description: "Find verified housing and buy or sell items safely with secure checkout. No scams. Currently in Eket, Akwa Ibom.",
    images:      ["/og-image.png"],
  },
  robots: {
    index:   true,
    follow:  true,
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
    google: "googleb1ac539760025b3c",
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
        <OfflineOverlay />
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