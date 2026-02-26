import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schools Program — Project POH",
  description:
    "Empower students to contribute to real science while earning POH tokens. Schools get up to 10 devices mining at full rates.",
  openGraph: {
    title: "Schools Program — Project POH",
    description:
      "Empower students to contribute to real science while earning POH tokens. Schools get up to 10 devices mining at full rates.",
  },
  alternates: {
    canonical: "/schools",
  },
};

export default function SchoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
