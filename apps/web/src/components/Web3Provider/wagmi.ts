import { QueryClient } from "@tanstack/react-query";
import { ChainId } from "@taraswap/sdk-core";
import { CHAIN_INFO } from "constants/chains";
import { UNISWAP_LOGO } from "ui/src/assets";
import { createClient } from "viem";
import { createConfig, http } from "wagmi";
import { connect } from "wagmi/actions";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { injectedWithFallback } from "./injectedWithFallback";
import { WC_PARAMS, uniswapWalletConnect } from "./walletConnect";

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

export const wagmiConfig = createConfig({
  chains: [CHAIN_INFO[ChainId.TARAXA_TESTNET], CHAIN_INFO[ChainId.TARAXA]],
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    uniswapWalletConnect(),
    coinbaseWallet({
      appName: "Uniswap",
      appLogoUrl: UNISWAP_LOGO,
      reloadOnDisconnect: false,
    }),
    // safe(),
  ],
  client({ chain }) {
    return createClient({
      chain,
      batch: { multicall: true },
      pollingInterval: 12_000,
      transport: http(chain.rpcUrls.appOnly.http[0]),
    });
  },
});

export const queryClient = new QueryClient();

// Automatically connect if running in Cypress environment
if ((window as any).Cypress?.eagerlyConnect) {
  connect(wagmiConfig, { connector: injected() });
}
