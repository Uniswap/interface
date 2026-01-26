// Reown AppKit configuration

// Import HashKey networks from Reown AppKit (matching hsk-staking-launchpad)
import { type AppKitNetwork, hashkey, hashkeyTestnet } from '@reown/appkit/networks'
// Import Reown AppKit - use ES6 import syntax for Vite compatibility (matching hsk-staking-launchpad)
import {
  createAppKit,
  useAppKitAccount as useAppKitAccountBase,
  useAppKit as useAppKitBase,
  useDisconnect as useDisconnectBase,
  useWalletInfo as useWalletInfoBase,
} from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import React from 'react'
// biome-ignore lint/style/noRestrictedImports: wagmi account hook needed for wallet integration
import { useAccount as useWagmiAccount } from 'wagmi'

if (process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID === undefined) {
  throw new Error('REACT_APP_WALLET_CONNECT_PROJECT_ID must be a defined environment variable')
}
const WALLET_CONNECT_PROJECT_ID = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID

// Use Reown AppKit's predefined HashKey networks with explicit RPC URLs
// (matching hsk-staking-launchpad - they use default hashkey network, but we override RPC for reliability)
const DEFAULT_CHAIN: AppKitNetwork = hashkey

// Override networks with explicit RPC URLs to ensure connectivity
// Using the same RPC URLs as defined in our chain info
const networks = [
  {
    ...hashkey,
    rpcUrls: {
      default: {
        http: ['https://mainnet.hsk.xyz'],
      },
      public: {
        http: ['https://mainnet.hsk.xyz'],
      },
    },
    blockExplorers: {
      default: {
        name: 'HashKey Explorer',
        url: 'https://hashkey.blockscout.com',
      },
    },
  },
  {
    ...hashkeyTestnet,
    rpcUrls: {
      default: {
        http: ['https://testnet.hsk.xyz'],
      },
      public: {
        http: ['https://testnet.hsk.xyz'],
      },
    },
    blockExplorers: {
      default: {
        name: 'HashKey Testnet Explorer',
        url: 'https://testnet-explorer.hsk.xyz',
      },
    },
  },
] as [AppKitNetwork, ...AppKitNetwork[]]

// Create Wagmi adapter (matching hsk-staking-launchpad)
// WagmiAdapter creates its own wagmi config internally with only the specified networks
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: WALLET_CONNECT_PROJECT_ID,
})

// Create AppKit modal (matching hsk-staking-launchpad exactly)
// createAppKit creates a global modal instance - no Provider needed
const modal = createAppKit({
  projectId: WALLET_CONNECT_PROJECT_ID,
  adapters: [wagmiAdapter],
  networks,
  allWallets: 'ONLY_MOBILE' as const,
  debug: false,
  enableAuthLogger: false,
  enableReconnect: false,
  enableCoinbase: false,
  // metadata: Reown AppKit will automatically use window.location for metadata
  // If needed, uncomment and customize:
  // metadata: {
  //   name: 'HSKSwap',
  //   description: 'HSKSwap Interface',
  //   url: typeof window !== 'undefined' ? window.location.origin : UNISWAP_WEB_URL,
  //   icons: [
  //     typeof window !== 'undefined'
  //       ? `${window.location.origin}/icons/hskswap-icon.svg`
  //       : `${UNISWAP_WEB_URL}icons/hskswap-icon.svg`
  //   ],
  // },
  features: {
    analytics: false,
    email: false,
    socials: false as const,
    swaps: false as const,
    send: false as const,
    receive: false as const,
    onramp: false as const,
    history: false as const,
    legalCheckbox: false as const,
  },
  themeMode: 'dark' as const,
  themeVariables: {
    '--w3m-font-family': "'Aleo', sans-serif",
    '--w3m-accent': '#2362DD',
    '--w3m-border-radius-master': '8px',
    '--w3m-z-index': 9999,
  },
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // metaMask
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // okx-default
  ],
})

// Export AppKitProvider - createAppKit doesn't need a Provider, but we keep it for compatibility
// The modal is created globally and hooks work without a Provider
export const AppKitProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  // createAppKit creates a global modal, no Provider wrapper needed
  // But we keep this component for compatibility with existing code
  return <>{children}</>
}

// Export hooks
export const useAppKit = useAppKitBase

// Sync account state from Wagmi to ensure consistency
// Reown AppKit uses WagmiAdapter internally, so we should use Wagmi's account state
export const useAppKitAccount = () => {
  // Try to get account from Reown AppKit first
  const appKitAccount = useAppKitAccountBase()
  // Also get account from Wagmi to ensure consistency
  const wagmiAccount = useWagmiAccount()

  // Prefer Wagmi account if available, otherwise fall back to AppKit account
  return {
    address: wagmiAccount.address ?? appKitAccount.address,
    isConnected: wagmiAccount.isConnected ?? appKitAccount.isConnected,
    chainId: wagmiAccount.chainId,
    connector: wagmiAccount.connector,
  }
}

// Custom hook for connection status (not directly available in AppKit)
export const useAppKitConnectionStatus = () => {
  const wagmiAccount = useWagmiAccount()
  const account = useAppKitAccount()

  return {
    isConnecting: wagmiAccount.status === 'connecting' || wagmiAccount.status === 'reconnecting',
    isConnected: account.isConnected,
  }
}

// Export additional hooks for wallet management
export const useDisconnect = useDisconnectBase
export const useWalletInfo = useWalletInfoBase
