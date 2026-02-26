import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Project POH",
  description:
    "Top miners, validators, and regions in the Proof of Planet network. See who is earning the most POH and contributing the most to science.",
  openGraph: {
    title: "Leaderboard — Project POH",
    description:
      "Top miners, validators, and regions in the Proof of Planet network. See who is earning the most POH and contributing the most to science.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
