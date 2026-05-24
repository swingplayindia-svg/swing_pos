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
  title: {
    default: "Swing Portal",
    template: "%s · Swing Portal",
  },
  applicationName: "Swing Portal",
  description: "Swing Portal — manage turf venues, bookings, and owners.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
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
