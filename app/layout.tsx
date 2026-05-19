import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { FirebaseAnalyticsProvider } from "@/components/firebase-analytics-provider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Swing.Play - Admin CMS",
  description: "Manage your turf venues with Swing.Play Admin Dashboard",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="light bg-background"
      style={{ colorScheme: "light" }}
    >
      <body
        className={`${sora.variable} ${dmSans.variable} antialiased font-sans`}
      >
        {children}
        <FirebaseAnalyticsProvider />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
