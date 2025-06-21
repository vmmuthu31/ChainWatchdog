import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys - RugProofAI",
  description:
    "Generate and manage your RugProofAI API keys to access our blockchain security services",
};

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
