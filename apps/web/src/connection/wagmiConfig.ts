import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2'
import {
  createObservableTransport,
  createUniRpcRoutedTransport,
  createUniRpcTransportFactory,
  getRpcObserver,
} from '@universe/chains'
import { isE2eTestEnv, isTestEnv } from '@universe/environment'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import type { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ORDERED_EVM_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { defaultResolveRpcConfig } from 'uniswap/src/features/providers/resolveRpcConfig'
import { logger } from 'utilities/src/logger/logger'
import { getNonEmptyArrayOrThrow } from 'utilities/src/primitives/array'
import type { Chain } from 'viem'
import { createClient } from 'viem'
import type { Config } from 'wagmi'
import { createConfig, fallback, http } from 'wagmi'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'
import { PLAYWRIGHT_CONNECT_ADDRESS } from '~/connection/constants'
import { embeddedWallet } from '~/connection/EmbeddedWalletConnector'
import { createRejectableMockConnector } from '~/connection/rejectableConnector'
import { WC_PARAMS } from '~/connection/walletConnect'

// Only accept Safe Apps SDK messages from the canonical Safe web app.
// Tested against bypass patterns in wagmiConfig.test.ts.
export const SAFE_ALLOWED_ORIGIN = /^https:\/\/app\.safe\.global$/

// Get the appropriate Binance connector based on the environment
const getBinanceConnector = () => {
  // Check if Binance extension is installed
  const isBinanceDetected =
    typeof window !== 'undefined' && (window.BinanceChain || (window.binancew3w && window.binancew3w.ethereum))

  // Check if TrustWallet extension is installed
  const isTrustWalletExtensionInstalled = typeof window !== 'undefined' && window.BinanceChain?.isTrustWallet

  const isBinanceExtensionInstalled = isBinanceDetected && !isTrustWalletExtensionInstalled

  // If extension is installed, use the injected connector directly
  // This avoids issues with the Binance connector's detection logic
  if (isBinanceExtensionInstalled) {
    return injected({
      target: {
        id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
        name: 'Binance Wallet',
        // @ts-expect-error - window.BinanceChain and window.binancew3w.ethereum are typed to the best of our ability
        provider: () => window.BinanceChain || window.binancew3w?.ethereum,
      },
    })
  }

  // Otherwise, use the Binance connector with QR modal for mobile connection
  const BinanceConnector = getWagmiConnectorV2()
  return BinanceConnector()
}

export const orderedTransportUrls = (chain: ReturnType<typeof getChainInfo>): string[] => {
  const orderedRpcUrls = [
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    ...(chain.rpcUrls.interface?.http ?? []),
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    ...(chain.rpcUrls.default?.http ?? []),
    ...(chain.rpcUrls.public?.http ?? []),
    ...(chain.rpcUrls.fallback?.http ?? []),
  ]

  return Array.from(new Set(orderedRpcUrls.filter(Boolean)))
}

function createWagmiConnectors(params: {
  /** If `true`, appends the wagmi `mock` connector. Used in Playwright. */
  includeMockConnector: boolean
}): any[] {
  const { includeMockConnector } = params

  const baseConnectors = [
    // Binance connector - uses injected for extension, QR code for mobile
    getBinanceConnector(),
    // There are no unit tests that expect WalletConnect to be included here,
    // so we can disable it to reduce log noise.
    ...(isTestEnv() && !isE2eTestEnv() ? [] : [walletConnect(WC_PARAMS)]),
    embeddedWallet(),
    coinbaseWallet({
      appName: 'Uniswap',
      // CB SDK doesn't pass the parent origin context to their passkey site
      // Flagged to CB team and can remove UNISWAP_WEB_URL once fixed
      appLogoUrl: `${UNISWAP_WEB_URL}${UNISWAP_LOGO}`,
      reloadOnDisconnect: false,
    }),
    safe({
      allowedDomains: [SAFE_ALLOWED_ORIGIN],
    }),
  ]

  return includeMockConnector
    ? [
        ...baseConnectors,
        createRejectableMockConnector({
          features: {},
          accounts: [PLAYWRIGHT_CONNECT_ADDRESS],
        }),
      ]
    : baseConnectors
}

// Cookie-session UniRPC transport factory (web's injected session strategy).
// The gating decision lives in the shared `defaultResolveRpcConfig` resolver;
// this only constructs the UniRPC transport once that resolver says to use it.
const buildWebUniRpcTransport = createUniRpcTransportFactory({
  session: { type: 'cookies' },
})

function createWagmiConfig(params: {
  /** The connector list to use. */
  connectors: any[]
  /** Optional custom `onFetchResponse` handler – defaults to `defaultOnFetchResponse`. */
  // oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
  onFetchResponse?: (response: Response, chain: Chain, url: string) => void
}): Config<typeof ORDERED_EVM_CHAINS> {
  const { connectors, onFetchResponse = defaultOnFetchResponse } = params

  return createConfig({
    chains: getNonEmptyArrayOrThrow(ORDERED_EVM_CHAINS),
    connectors,
    client({ chain }) {
      // wagmi builds this client once per chain and caches it for the session,
      // so the UniRPC-vs-legacy choice must NOT be snapshotted here: on app
      // start the gate behind `isUniRpc` is usually still unresolved (Statsig
      // inits async; a cold load has no cached value), and a snapshot would pin
      // the chain to the legacy Infura/QuickNode providers for the whole
      // session even after the gate turns on. createUniRpcRoutedTransport
      // re-reads the shared resolver per request, so the cached client
      // self-heals onto UniRPC the moment the gate resolves — same guarantee
      // ViemClientManager gets by re-resolving per `getViemClient` call.
      return createClient({
        chain,
        batch: { multicall: true },
        pollingInterval: 12_000,
        transport: createUniRpcRoutedTransport({
          resolveRpcConfig: () => defaultResolveRpcConfig({ chainId: chain.id, rpcType: RPCType.Public }),
          buildUniRpcTransport: (rpcConfig) =>
            createObservableTransport({
              baseTransportFactory: buildWebUniRpcTransport({
                config: { rpcUrl: rpcConfig.rpcUrl, headers: rpcConfig.headers ?? {} },
              }),
              observer: getRpcObserver(),
              meta: { chainId: chain.id, url: rpcConfig.rpcUrl },
            }),
          buildLegacyTransport: () =>
            fallback(
              orderedTransportUrls(chain).map((url) =>
                createObservableTransport({
                  baseTransportFactory: http(url, {
                    onFetchResponse: (response) => onFetchResponse(response, chain, url),
                  }),
                  observer: getRpcObserver(),
                  meta: { chainId: chain.id, url },
                }),
              ),
            ),
        }),
      })
    },
  })
}

// oxlint-disable-next-line max-params
const defaultOnFetchResponse = (response: Response, chain: Chain, url: string) => {
  if (response.status !== 200) {
    const message = `RPC provider returned non-200 status: ${response.status}`

    // only warn for testnet chains
    if (isTestnetChain(chain.id)) {
      logger.warn('connection/wagmiConfig.ts', 'client', message, {
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
          file: 'connection/wagmiConfig.ts',
          function: 'client',
        },
      })
    }
  }
}

const defaultConnectors = createWagmiConnectors({
  includeMockConnector: isE2eTestEnv(),
})

export const wagmiConfig = createWagmiConfig({ connectors: defaultConnectors })

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
