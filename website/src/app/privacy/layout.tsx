import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Project POH",
  description:
    "Privacy Policy for Project POH: how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy — Project POH",
    description:
      "Privacy Policy for Project POH: how we collect, use, and protect your data.",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
