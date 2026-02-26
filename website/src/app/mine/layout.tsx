import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mine POH — Proof of Planet",
  description:
    "Contribute compute power to science and earn POH tokens. Mining dashboard for Proof of Planet.",
  openGraph: {
    title: "Mine POH — Proof of Planet",
    description:
      "Contribute compute power to science and earn POH tokens. Mining dashboard for Proof of Planet.",
  },
};

export default function MineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
