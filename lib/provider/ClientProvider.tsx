"use client";

import { ReactNode } from "react";
import WalletProvider from "./WalletProvider";
import { Toaster } from "@/components/ui/sonner";
function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <WalletProvider>
        {children}
        <Toaster />
      </WalletProvider>
    </>
  );
}

export default ClientProvider;
