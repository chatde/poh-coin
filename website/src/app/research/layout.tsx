import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Impact — Project POH",
  description:
    "How your compute power contributes to real science — protein folding, climate modeling, seismic analysis, and drug screening.",
  openGraph: {
    title: "Research Impact — Project POH",
    description:
      "How your compute power contributes to real science — protein folding, climate modeling, seismic analysis, and drug screening.",
  },
  alternates: {
    canonical: "/research",
  },
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
