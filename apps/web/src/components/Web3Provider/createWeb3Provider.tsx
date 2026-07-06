import { type ReactNode } from 'react'
import { type Register, WagmiProvider } from 'wagmi'
import { useWalletCapabilitiesStateEffect } from '~/state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'

export function createWeb3Provider(params: { wagmiConfig: Register['config']; reconnectOnMount?: boolean }) {
  const { wagmiConfig, reconnectOnMount = true } = params

  // HookSwap is EVM-only (v2 + v3). We deliberately do NOT mount the Solana
  // wallet adapter (`@solana/wallet-adapter-react`'s WalletProvider) here.
  // Mounting it registered a Solana namespace via wallet-standard, which made
  // multichain wallets (OKX, etc.) demand Solana-capable accounts and blocked
  // connecting to the EVM chains. Only the EVM (wagmi) provider is mounted.
  const Provider = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={reconnectOnMount}>
      {children}
    </WagmiProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
}

export function WalletCapabilitiesEffects() {
  useWalletCapabilitiesStateEffect()
  return null
}
