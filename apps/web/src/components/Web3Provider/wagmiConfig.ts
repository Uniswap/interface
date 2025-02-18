import { QueryClient } from '@tanstack/react-query'
import { injectedWithFallback } from 'components/Web3Provider/injectedWithFallback'
import { WC_PARAMS } from 'components/Web3Provider/walletConnect'
import { embeddedWallet } from 'connection/EmbeddedWalletConnector'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { createClient } from 'viem'
import { createConfig, fallback, http } from 'wagmi'
import { connect } from 'wagmi/actions'
import { coinbaseWallet, injected, mock, safe, walletConnect } from 'wagmi/connectors'

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

export const orderedTransportUrls = (chain: ReturnType<typeof getChainInfo>): string[] => {
  const orderedRpcUrls = [
    ...(chain.rpcUrls.interface?.http ?? []),
    ...(chain.rpcUrls.default?.http ?? []),
    ...(chain.rpcUrls.public?.http ?? []),
    ...(chain.rpcUrls.fallback?.http ?? []),
  ]

  return Array.from(new Set(orderedRpcUrls.filter(Boolean)))
}

export const wagmiConfig = createConfig({
  chains: [getChainInfo(UniverseChainId.Mainnet), ...ALL_CHAIN_IDS.map(getChainInfo)],
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    embeddedWallet(),
    coinbaseWallet({
      appName: 'Uniswap',
      // CB SDK doesn't pass the parent origin context to their passkey site
      // Flagged to CB team and can remove UNISWAP_WEB_URL once fixed
      appLogoUrl: `${UNISWAP_WEB_URL}${UNISWAP_LOGO}`,
      reloadOnDisconnect: false,
      enableMobileWalletLink: true,
    }),
    safe(),
  ],
  client({ chain }) {
    return createClient({
      chain,
      batch: { multicall: true },
      pollingInterval: 12_000,
      transport: fallback(orderedTransportUrls(chain).map((url) => http(url))),
    })
  },
})

export const queryClient = new QueryClient()

// Automatically connect if running in Cypress environment
if ((window as any).Cypress?.eagerlyConnect) {
  connect(wagmiConfig, { connector: injected() })
}

// Automatically connect if running in Playwright environment
if (isPlaywrightEnv()) {
  // setTimeout is needed to avoid disconnection
  setTimeout(() => {
    connect(wagmiConfig, {
      connector: mock({
        features: {},
        accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      }),
    })
  }, 1)
}
