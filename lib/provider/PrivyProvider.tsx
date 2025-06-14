"use client";

import { PrivyProvider } from "@privy-io/react-auth";

function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmbuz5saf023nju0m087xfc5w"
      clientId="client-WY6MD6wp8cRNPaUuG3dzhQ6tsaJoQGgR1eH7xsFJN3oEF"
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export default PrivyWalletProvider;
