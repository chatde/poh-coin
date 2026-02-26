import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security — Project POH",
  description:
    "Secure your POH tokens with a hardware wallet. Learn about smart contract security, verified contracts on Basescan, and best practices for cold storage.",
  openGraph: {
    title: "Security — Project POH",
    description:
      "Secure your POH tokens with a hardware wallet. Learn about smart contract security, verified contracts on Basescan, and best practices for cold storage.",
  },
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
