import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Project POH — Pursuit of Happiness Coin",
  description:
    "A charity cryptocurrency funding environmental, humanitarian, educational, and health causes — with tokenomics tied to Voyager 1's interstellar journey.",
  openGraph: {
    title: "Project POH — Pursuit of Happiness Coin",
    description:
      "Change the trajectory of humankind. Every transaction funds real-world impact.",
    type: "website",
  },
  icons: {
    icon: "/logo/poh-token-64x64.png",
    apple: "/logo/poh-token-256x256.png",
  },
  manifest: "/manifest.json",
  themeColor: "#00ff41",
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
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
