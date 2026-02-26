import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Buy POH — Project POH",
  description:
    "A beginner-friendly guide to purchasing Pursuit of Happiness tokens on the Base network.",
  openGraph: {
    title: "How to Buy POH — Project POH",
    description:
      "A beginner-friendly guide to purchasing Pursuit of Happiness tokens on the Base network.",
  },
  alternates: {
    canonical: "/how-to-buy",
  },
};

export default function HowToBuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
