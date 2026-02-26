import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Project POH",
  description:
    "Frequently asked questions about Project POH: mining, tokenomics, charity, governance, and technical details.",
  openGraph: {
    title: "FAQ — Project POH",
    description:
      "Frequently asked questions about Project POH: mining, tokenomics, charity, governance, and technical details.",
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
