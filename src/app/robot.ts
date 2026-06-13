import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow: [
          "/admin/",
          "/api/",
          "/agent/kyc",
          "/signin",
          "/signup",
          "/verify",
          "/role",
          "/home",
          "/watchlist",
          "/bookings",
          "/profile",
        ],
      },
    ],
    sitemap: "https://www.corpernest.com.ng/sitemap.xml",
    host:    "https://www.corpernest.com.ng",
  };
}