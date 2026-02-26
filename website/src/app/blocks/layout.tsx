import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Block Explorer — Project POH",
  description:
    "Explore the POH blockchain: current block height, block rewards, RTG decay schedule, and Voyager decommission projections.",
  openGraph: {
    title: "Block Explorer — Project POH",
    description:
      "Explore the POH blockchain: current block height, block rewards, RTG decay schedule, and Voyager decommission projections.",
  },
};

export default function BlocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
