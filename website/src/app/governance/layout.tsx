import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance — Project POH",
  description:
    "DAO governance for Project POH: token-weighted voting, proposals, and progressive decentralization.",
};

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
