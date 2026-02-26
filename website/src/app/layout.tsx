import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://projectpoh.com"),
  title: "Project POH — Pursuit of Happiness Coin",
  description:
    "A charity cryptocurrency funding environmental, humanitarian, educational, and health causes — with tokenomics tied to Voyager 1's interstellar journey.",
  openGraph: {
    title: "Project POH — Pursuit of Happiness Coin",
    description:
      "Change the trajectory of humankind. Every transaction funds real-world impact.",
    type: "website",
    images: [
      {
        url: "/images/og-poh.jpg",
        width: 1200,
        height: 630,
        alt: "Project POH — Change the Trajectory of Humankind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project POH — Pursuit of Happiness Coin",
    description:
      "Change the trajectory of humankind. Every transaction funds real-world impact.",
    images: ["/images/og-poh.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/logo/poh-token-64x64.png", type: "image/png", sizes: "64x64" },
      { url: "/logo/poh-token-128x128.png", type: "image/png", sizes: "128x128" },
    ],
    apple: "/logo/poh-token-256x256.png",
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POH Mine",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Navbar />
        <main className="relative z-10 min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
