import { QueryClient } from '@tanstack/react-query'
import { injectedWithFallback } from 'components/Web3Provider/injectedWithFallback'
import { WC_PARAMS } from 'components/Web3Provider/walletConnect'
import { embeddedWallet } from 'connection/EmbeddedWalletConnector'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { Chain, createClient } from 'viem'
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

const baseConnectors = [
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
]

// Only add mock connector in Playwright environment
const connectors = isPlaywrightEnv()
  ? [
      ...baseConnectors,
      mock({
        features: {},
        accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      }),
    ]
  : baseConnectors

export const wagmiConfig = createConfig({
  chains: [getChainInfo(UniverseChainId.Mainnet), ...ALL_CHAIN_IDS.map(getChainInfo)],
  connectors,
  client({ chain }) {
    return createClient({
      chain,
      batch: { multicall: true },
      pollingInterval: 12_000,
      transport: fallback(
        orderedTransportUrls(chain).map((url) =>
          http(url, { onFetchResponse: (response) => onFetchResponse(response, chain, url) }),
        ),
      ),
    })
  },
})

const onFetchResponse = (response: Response, chain: Chain, url: string) => {
  if (response.status !== 200) {
    const message = `RPC provider returned non-200 status: ${response.status}`

    // only warn for testnet chains
    if (isTestnetChain(chain.id)) {
      logger.warn('wagmiConfig.ts', 'client', message, {
        extra: {
          chainId: chain.id,
          url,
        },
      })
    } else {
      // log errors for mainnet chains so we can fix them
      logger.error(new Error(message), {
        extra: {
          chainId: chain.id,
          url,
        },
        tags: {
          file: 'wagmiConfig.ts',
          function: 'client',
        },
      })
    }
  }
}

export const queryClient = new QueryClient()

// Automatically connect if running in Cypress environment
if ((window as any).Cypress?.eagerlyConnect) {
  connect(wagmiConfig, { connector: injected() })
}

const isEagerlyConnect = !window.location.search.includes('eagerlyConnect=false')

// Automatically connect if running in Playwright environment
if (isPlaywrightEnv() && isEagerlyConnect) {
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
