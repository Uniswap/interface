import { QueryClient } from '@tanstack/react-query'
import { ChainId } from '@uniswap/sdk-core'
import { CHAIN_INFO, SupportedInterfaceChainId } from 'constants/chains'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { Chain, createClient, defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { connect } from 'wagmi/actions'
import {
  arbitrum,
  arbitrumGoerli,
  base,
  bsc,
  celoAlfajores,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  sepolia,
} from 'wagmi/chains'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'
import { injectedWithFallback } from './injectedWithFallback'
import { WC_PARAMS, uniswapWalletConnect } from './walletConnect'

const CHAIN_ID_TO_VIEM_CHAIN: Record<SupportedInterfaceChainId, Chain> = {
  [ChainId.MAINNET]: mainnet,
  [ChainId.GOERLI]: goerli,
  [ChainId.SEPOLIA]: sepolia,
  [ChainId.POLYGON]: polygon,
  [ChainId.POLYGON_MUMBAI]: polygonMumbai,
  [ChainId.CELO_ALFAJORES]: celoAlfajores,
  [ChainId.ARBITRUM_ONE]: arbitrum,
  [ChainId.ARBITRUM_GOERLI]: arbitrumGoerli,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.OPTIMISM_GOERLI]: optimismGoerli,
  [ChainId.BNB]: bsc,
  [ChainId.BASE]: base,
} as const

/** Converts a Chain to use our public RPC URL instead of the default wagmi URL. */
function withPublicRpcUrls(chain: Chain & { id: SupportedInterfaceChainId }): Chain {
  const info = CHAIN_INFO[chain.id]
  return defineChain({
    ...chain,
    // Match MetaMask's expectations to avoid warnings.
    // Expectations are derived from MetaMask's "Safe" list: https://chainid.network/chains.json.
    name: info.safeLabel ?? chain.name,
    rpcUrls: { default: { http: info.rpcUrls.safe } },
  })
}

/** Converts a Chain to use our private RPC URL instead of the default wagmi URL. */
function withAppRpcUrls(chain: Chain & { id: SupportedInterfaceChainId }): Chain {
  const info = CHAIN_INFO[chain.id]
  return defineChain({ ...chain, rpcUrls: { default: { http: info.rpcUrls.appOnly } } })
}
export const wagmiConfig = createConfig({
  chains: [withPublicRpcUrls(mainnet), ...Object.values(CHAIN_ID_TO_VIEM_CHAIN).map(withPublicRpcUrls)],
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    uniswapWalletConnect(),
    coinbaseWallet({
      appName: 'Uniswap',
      appLogoUrl: UNISWAP_LOGO,
      reloadOnDisconnect: false,
    }),
    safe(),
  ],
  client({ chain }) {
    return createClient({
      chain: withAppRpcUrls(chain),
      batch: { multicall: true },
      pollingInterval: 12_000,
      transport: http(),
    })
  },
})

export const queryClient = new QueryClient()

// Automatically connect if running in Cypress environment
if ((window as any).Cypress?.eagerlyConnect) {
  connect(wagmiConfig, { connector: injected() })
}
