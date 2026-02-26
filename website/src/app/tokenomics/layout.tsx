import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tokenomics — Project POH",
  description:
    "POH tokenomics: the Voyager Block Model, RTG decay emission curve, block reward schedule, and supply allocation for the Pursuit of Happiness token.",
  openGraph: {
    title: "Tokenomics — Project POH",
    description:
      "POH tokenomics: the Voyager Block Model, RTG decay emission curve, block reward schedule, and supply allocation for the Pursuit of Happiness token.",
  },
};

export default function TokenomicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
