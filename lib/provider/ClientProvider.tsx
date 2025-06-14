"use client";

import { ReactNode } from "react";
import WalletProvider from "./WalletProvider";
import { Toaster } from "@/components/ui/sonner";
import PrivyWalletProvider from "./PrivyProvider";
function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <WalletProvider>
        <PrivyWalletProvider>
          {children}
          <Toaster />
        </PrivyWalletProvider>
      </WalletProvider>
    </>
  );
}

export default ClientProvider;
