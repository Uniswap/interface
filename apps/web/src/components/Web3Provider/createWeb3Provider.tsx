import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { AppKitProvider, wagmiAdapter } from 'components/Web3Provider/reownConfig'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { SolanaSignerUpdater } from 'components/Web3Provider/signSolanaTransaction'
import React, { type PropsWithChildren, type ReactNode, useMemo } from 'react'
import { useWalletCapabilitiesStateEffect } from 'state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'
import { type Config, WagmiProvider } from 'wagmi'

export function createWeb3Provider(params: { reconnectOnMount?: boolean }) {
  const { reconnectOnMount = true } = params

  const Provider = ({ children }: { children: ReactNode }) => (
    <SolanaProvider>
      <AppKitProvider>
        {/* Use wagmiConfig (not wagmiAdapter.wagmiConfig) to include embeddedWallet connector */}
        {/* wagmiAdapter.wagmiConfig doesn't include embeddedWallet, which causes errors */}
        <WagmiProvider config={wagmiConfig as Config} reconnectOnMount={reconnectOnMount}>
          {children}
        </WagmiProvider>
      </AppKitProvider>
    </SolanaProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
}

function SolanaProvider({ children }: PropsWithChildren) {
  // WalletProvider has built-in support for SolanaStandard wallets;
  const wallets = useMemo(() => [new CoinbaseWalletAdapter()], [])

  return (
    <SolanaWalletProvider wallets={wallets} autoConnect>
      <SolanaSignerUpdater />
      {children}
    </SolanaWalletProvider>
  )
}

export function WalletCapabilitiesEffects() {
  useWalletCapabilitiesStateEffect()
  return null
}
