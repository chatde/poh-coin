import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Project POH",
  description:
    "The story behind Project POH: why we built a charity cryptocurrency tied to Voyager 1's interstellar journey.",
  openGraph: {
    title: "About — Project POH",
    description:
      "The story behind Project POH: why we built a charity cryptocurrency tied to Voyager 1's interstellar journey.",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
