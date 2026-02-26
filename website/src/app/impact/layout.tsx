import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impact Dashboard — Project POH",
  description:
    "Track the Proof of Planet network in real-time: active nodes, verified tasks, charity distributions, and on-chain treasury data.",
  openGraph: {
    title: "Impact Dashboard — Project POH",
    description:
      "Track the Proof of Planet network in real-time: active nodes, verified tasks, charity distributions, and on-chain treasury data.",
  },
};

export default function ImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
